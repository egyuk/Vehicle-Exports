// Dependency-free PDF text extraction with real positions.
//
// The four carriers between them ship four different PDF flavours, and a naive
// text dump fails on all of them for different reasons. This module handles the
// union of those cases so each source module only has to interpret rows:
//
//   * streams compressed (Flate) or stored raw          - jsPDF writes raw
//   * text as literal strings OR hex-encoded CIDs       - Identity-H subset fonts
//   * glyph codes needing per-font ToUnicode CMaps      - else you get gibberish
//   * exact advances from the font's /W array           - else x drifts across a row
//   * a page /cm transform that flips the y axis        - else rows come out upside down
//
// Everything is positional: cells are located by reconstructed x/y, never by
// reading order, because reading order silently misaligns sparse tables.
import { inflateSync } from 'node:zlib';

/** Parse a PDF into its indirect objects plus a stream reader. */
export function loadPdf(buffer) {
  const raw = buffer.toString('latin1');
  const objects = new Map();
  for (const m of raw.matchAll(/(\d+)\s+0\s+obj([\s\S]*?)endobj/g)) objects.set(m[1], m[2]);

  const streamOf = body => {
    if (!body) return null;
    const s = body.indexOf('stream');
    if (s === -1) return null;
    const e = body.indexOf('endstream', s);
    let p = s + 6;
    while (body[p] === '\r' || body[p] === '\n') p++;
    const slice = Buffer.from(body.slice(p, e), 'latin1');
    // Flate where present, raw otherwise - jsPDF leaves streams uncompressed.
    try { return inflateSync(slice).toString('latin1'); } catch { return slice.toString('latin1'); }
  };

  return { raw, objects, streamOf };
}

/** Build fontName -> { unicode: Map<cid,char>, widths: Map<cid,width> }. */
export function readFonts({ raw, objects, streamOf }) {
  const fonts = new Map();

  for (const res of raw.matchAll(/\/Font\s*<<([\s\S]*?)>>/g)) {
    for (const f of res[1].matchAll(/\/([A-Za-z0-9_.+-]+)\s+(\d+)\s+0\s+R/g)) {
      const [, name, num] = f;
      if (fonts.has(name)) continue;
      const body = objects.get(num);
      if (!body) continue;

      // ToUnicode may sit on the Type0 font or on its descendant.
      let tu = (body.match(/\/ToUnicode\s+(\d+)\s+0\s+R/) || [])[1];
      if (!tu) {
        const desc = (body.match(/\/DescendantFonts\s*\[\s*(\d+)\s+0\s+R/) || [])[1];
        if (desc) tu = (objects.get(desc) || '').match(/\/ToUnicode\s+(\d+)\s+0\s+R/)?.[1];
      }

      const unicode = new Map();
      if (tu) {
        const cmap = streamOf(objects.get(tu)) || '';
        for (const b of cmap.match(/beginbfchar([\s\S]*?)endbfchar/g) || [])
          for (const m of b.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g))
            unicode.set(
              parseInt(m[1], 16),
              (m[2].match(/.{4}/g) || []).map(h => String.fromCharCode(parseInt(h, 16))).join('')
            );
        for (const b of cmap.match(/beginbfrange([\s\S]*?)endbfrange/g) || [])
          for (const m of b.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
            const lo = parseInt(m[1], 16), hi = parseInt(m[2], 16), st = parseInt(m[3], 16);
            for (let c = lo; c <= hi && c - lo < 4096; c++) unicode.set(c, String.fromCharCode(st + (c - lo)));
          }
      }

      // /W is usually an indirect ref; inline arrays appear too. Triples are
      // "firstCid lastCid width" in this corpus, so ranges collapse to singles.
      const widths = new Map();
      const wRef = (body.match(/\/W\s+(\d+)\s+0\s+R/) || [])[1];
      const wInline = (body.match(/\/W\s*\[([\s\S]{0,20000}?)\]/) || [])[1];
      const wBody = wRef ? (objects.get(wRef) || '') : (wInline || '');
      const nums = (wBody.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
      for (let i = 0; i + 2 < nums.length + 1; i += 3) widths.set(nums[i], nums[i + 2]);

      if (unicode.size || widths.size) fonts.set(name, { unicode, widths });
    }
  }
  return fonts;
}

/** Page content streams, resolving both "/Contents 5 0 R" and "/Contents [ 5 0 R ]". */
function contentStreams({ objects, streamOf }) {
  const out = [];
  for (const [, body] of objects) {
    if (!/\/Type\s*\/Page\b/.test(body)) continue;
    const arr = body.match(/\/Contents\s*\[([^\]]*)\]/);
    if (arr) {
      for (const m of arr[1].matchAll(/(\d+)\s+0\s+R/g)) out.push(streamOf(objects.get(m[1])));
    } else {
      const one = body.match(/\/Contents\s+(\d+)\s+0\s+R/);
      if (one) out.push(streamOf(objects.get(one[1])));
    }
  }
  // Some producers (jsPDF) don't mark /Type /Page usefully; fall back to any
  // stream carrying show-text operators that isn't itself a CMap or a font.
  if (!out.filter(Boolean).length) {
    for (const [, body] of objects) {
      const c = streamOf(body);
      if (c && /\b(Tj|TJ)\b/.test(c) && !/beginbfchar/.test(c) && !/glyf|head|hhea/.test(c.slice(0, 200))) out.push(c);
    }
  }
  return out.filter(Boolean);
}

const DEFAULT_GAP = 300; // TJ adjustment magnitude that means "new cell", not "kerning"

/**
 * Extract positioned text. Returns [{ page, x, y, text }] where y is already
 * normalised so that lower y is higher up the page.
 */
export function extractItems(pdf, { cellGap = DEFAULT_GAP } = {}) {
  const fonts = readFonts(pdf);
  const items = [];
  let page = 0;

  for (const content of contentStreams(pdf)) {
    page++;

    // A leading cm can scale and flip the page; apply it so pages compare alike.
    // Must be anchored to the very start of the stream: content streams also
    // contain cm operators placing images, and matching one of those scales
    // every coordinate by a few hundred and destroys the layout.
    const cm = content.match(/^\s*([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+cm/);
    const A = cm ? parseFloat(cm[1]) : 1;
    const D = cm ? parseFloat(cm[4]) : 1;
    const F = cm ? parseFloat(cm[6]) : 0;
    const flipped = D < 0;

    for (const blk of content.matchAll(/BT([\s\S]*?)ET/g)) {
      const b = blk[1];
      let font = null, size = 10, penX = 0, penY = 0;

      const re = new RegExp(
        [
          /\/([A-Za-z0-9_.+-]+)\s+([\d.]+)\s+Tf/.source,                    // 1,2 font
          /([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+Tm/.source, // 3-8 matrix
          /(-?[\d.]+)\s+(-?[\d.]+)\s+(?:Td|TD)/.source,                      // 9,10 offset
          /\[([\s\S]*?)\]\s*TJ/.source,                                      // 11 array
          /<([0-9A-Fa-f\s]+)>\s*Tj/.source,                                  // 12 hex
          /\(((?:[^()\\]|\\.)*)\)\s*Tj/.source,                              // 13 literal
        ].join('|'),
        'g'
      );

      let m;
      while ((m = re.exec(b))) {
        if (m[1] !== undefined) { font = m[1]; size = parseFloat(m[2]); continue; }
        if (m[3] !== undefined) { penX = parseFloat(m[7]); penY = parseFloat(m[8]); continue; }
        if (m[9] !== undefined) { penX += parseFloat(m[9]); penY += parseFloat(m[10]); continue; }

        const f = fonts.get(font);
        const emit = (text, x) => {
          if (text.trim()) items.push({
            page,
            x: Math.round(A * x * 10) / 10,
            y: Math.round((F + D * penY) * 10) / 10,
            text: text.trim(),
          });
        };
        const glyphs = hex => {
          const clean = hex.replace(/\s+/g, '');
          let s = '';
          for (let i = 0; i + 4 <= clean.length; i += 4) {
            const cid = parseInt(clean.slice(i, i + 4), 16);
            s += f?.unicode.get(cid) ?? '';
            // Exact advance where the font declares one; DW=1000 otherwise.
            penX += ((f?.widths.get(cid) ?? 1000) / 1000) * size;
          }
          return s;
        };

        if (m[11] !== undefined) {
          let cur = '', start = penX;
          for (const p of m[11].matchAll(/<([0-9A-Fa-f\s]+)>|\(((?:[^()\\]|\\.)*)\)|(-?[\d.]+)/g)) {
            if (p[1] !== undefined) { if (!cur) start = penX; cur += glyphs(p[1]); }
            else if (p[2] !== undefined) {
              if (!cur) start = penX;
              const lit = decodeLiteral(p[2]);
              cur += lit;
              penX += lit.length * 0.5 * size;
            } else {
              const adj = parseFloat(p[3]);
              penX += (-adj / 1000) * size;
              if (Math.abs(adj) > cellGap) { emit(cur, start); cur = ''; }
            }
          }
          emit(cur, start);
        } else if (m[12] !== undefined) {
          const start = penX;
          emit(glyphs(m[12]), start);
        } else if (m[13] !== undefined) {
          const start = penX;
          const lit = decodeLiteral(m[13]);
          penX += lit.length * 0.5 * size;
          emit(lit, start);
        }
      }
    }

    // Normalise so smaller y is always nearer the top of the page.
    if (!flipped) for (const it of items) if (it.page === page) it.y = -it.y;
  }

  return items;
}

function decodeLiteral(t) {
  return t
    .replace(/\\\(/g, '(').replace(/\\\)/g, ')')
    .replace(/\\(\d{3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))
    .replace(/\\\\/g, '\\');
}

/** Group positioned items into rows, ordered top-to-bottom, left-to-right. */
export function groupRows(items, { tolerance = 3 } = {}) {
  const rows = [];
  for (const it of items) {
    let row = rows.find(r => r.page === it.page && Math.abs(r.y - it.y) < tolerance);
    if (!row) { row = { page: it.page, y: it.y, cells: [] }; rows.push(row); }
    row.cells.push(it);
  }
  rows.sort((a, b) => a.page - b.page || a.y - b.y);
  rows.forEach(r => r.cells.sort((a, b) => a.x - b.x));
  return rows;
}

/** Convenience: buffer -> rows. */
export function pdfRows(buffer, opts = {}) {
  const pdf = loadPdf(buffer);
  return groupRows(extractItems(pdf, opts), opts);
}

export const rowText = row => row.cells.map(c => c.text).join(' ').replace(/\s+/g, ' ').trim();
