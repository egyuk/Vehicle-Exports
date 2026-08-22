// Minimal xlsx reader: an xlsx is a zip of XML, and Node can inflate raw deflate.
import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';

export function readXlsx(path) {
  const buf = readFileSync(path);

  // --- locate End of Central Directory ---
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 65558; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd === -1) throw new Error('not a zip file');
  const entryCount = buf.readUInt16LE(eocd + 10);
  let ptr = buf.readUInt32LE(eocd + 16);

  const files = {};
  for (let n = 0; n < entryCount; n++) {
    if (buf.readUInt32LE(ptr) !== 0x02014b50) break;
    const method = buf.readUInt16LE(ptr + 10);
    const compSize = buf.readUInt32LE(ptr + 20);
    const nameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const localOff = buf.readUInt32LE(ptr + 42);
    const name = buf.slice(ptr + 46, ptr + 46 + nameLen).toString('utf8');

    // local header: skip its own name/extra fields to reach the data
    const lNameLen = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const raw = buf.slice(dataStart, dataStart + compSize);
    try {
      files[name] = (method === 0 ? raw : inflateRawSync(raw)).toString('utf8');
    } catch { /* skip unreadable entry */ }

    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const decode = s => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d));

/** Returns a sheet as a 2-D array of strings, indexed [row][col]. */
export function sheetGrid(files, sheetName) {
  const shared = [];
  const ss = files['xl/sharedStrings.xml'];
  if (ss) {
    for (const si of ss.match(/<si>[\s\S]*?<\/si>/g) || []) {
      shared.push(decode((si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [])
        .map(t => t.replace(/<[^>]+>/g, '')).join('')));
    }
  }

  const sheet = files[sheetName] || files['xl/worksheets/sheet1.xml'];
  if (!sheet) throw new Error('no worksheet found');

  const colNum = ref => {
    const letters = ref.match(/^[A-Z]+/)[0];
    let n = 0;
    for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
    return n - 1;
  };

  const grid = [];
  for (const row of sheet.match(/<row[\s\S]*?<\/row>/g) || []) {
    const rIdx = parseInt((row.match(/r="(\d+)"/) || [])[1] || '0', 10) - 1;
    grid[rIdx] ||= [];
    for (const c of row.match(/<c[^>]*(?:\/>|>[\s\S]*?<\/c>)/g) || []) {
      const ref = (c.match(/r="([A-Z]+\d+)"/) || [])[1];
      if (!ref) continue;
      const type = (c.match(/t="([^"]+)"/) || [])[1];
      const vRaw = (c.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
      const inline = (c.match(/<is>[\s\S]*?<\/is>/) || [])[0];
      let val = '';
      if (type === 's' && vRaw !== undefined) val = shared[+vRaw] ?? '';
      else if (inline) val = decode(inline.replace(/<[^>]+>/g, ''));
      else if (vRaw !== undefined) val = decode(vRaw);
      grid[rIdx][colNum(ref)] = val;
    }
  }
  return grid;
}

// Debug harness: `node lib/xlsx.mjs <file.xlsx>` dumps the sheets. The entry
// check matters - without it, importing this module from update.mjs while
// passing any flag (--dry-run) made this block read the flag as a filename.
if (process.argv[1]?.endsWith('xlsx.mjs') && process.argv[2]) {
  const files = readXlsx(process.argv[2]);
  console.log('entries:', Object.keys(files).filter(f => /xml$/.test(f)).join(', ').slice(0, 300));
  const sheets = Object.keys(files).filter(f => /^xl\/worksheets\/sheet\d+\.xml$/.test(f));
  console.log('worksheets:', sheets.length, sheets.join(', '));
  for (const s of sheets) {
    const grid = sheetGrid(files, s);
    console.log(`\n===== ${s} : ${grid.length} rows =====`);
    grid.slice(0, Number(process.argv[3] || 30)).forEach((r, i) => {
      const cells = (r || []).map(c => (c ?? '').toString().trim()).filter(Boolean);
      if (cells.length) console.log(`[${i}] ` + cells.join(' | ').slice(0, 200));
    });
  }
}
