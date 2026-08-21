// Grimaldi - Tilbury to West Africa.
//
// Format: Excel-generated, Flate streams, ordinary text.
// Layout: vessels are COLUMNS; rows are load ports then destination arrivals.
// The sheet holds TWO blocks and only the first calls Tilbury - the second is
// a continental service (Antwerp/Hamburg/Le Havre/Leixoes) and is skipped.
//
// Only source that publishes the RoRo cut-off, which is captured into notes.
//
// NOTE: Grimaldi overwrite these files in place, so the URL's folder year means
// nothing - always trust the "Published:" date inside the PDF.
import { pdfRows } from '../lib/pdf.mjs';
import { fetchCached, dayMonNumToISO, withCountry } from '../lib/util.mjs';

const PAGE = 'https://www.grimaldi.co.uk/sailing-schedule/';

const VESSELS = {
  'Grt.Cotonou': 'Grande Cotonou', 'Grt.Lagos': 'Grande Lagos',
  'Gr.B.Aires': 'Grande Buenos Aires', 'Gr.Gabon': 'Grande Gabon',
  'Gr.S.Leone': 'Grande Sierra Leone', 'Gr.Luanda': 'Grande Luanda',
  'Gr.Africa': 'Grande Africa', 'Gr.Benin': 'Grande Benin',
  'Gr.Argentina': 'Grande Argentina', 'Gr.Atlantico': 'Grande Atlantico',
  'Gr.Europa': 'Grande Europa', 'Gr.Ghana': 'Grande Ghana',
};

const LOADERS = /^(Amsterdam|Hamburg|Tilbury|Antwerp|LeHavre|Le Havre|Leixoes)$/i;
const isDate = t => /^\d{1,2}\/\d{1,2}$/.test(t);

export const name = 'Grimaldi';
export const url = PAGE;

/** The schedule PDF is linked from the agency page; find it rather than hardcode. */
async function findSchedulePdf() {
  const html = await fetchCached(PAGE, { binary: false });
  const links = [...html.matchAll(/href="([^"]+\.pdf)"/gi)].map(m => m[1]);
  const waf = links.find(l => /WAFEXP|WAF/i.test(l));
  if (!waf) throw new Error('Grimaldi: West Africa schedule link not found on the page');
  return waf;
}

export async function collect({ log = () => {} } = {}) {
  const pdfUrl = await findSchedulePdf();
  const rows = pdfRows(await fetchCached(pdfUrl));

  const published = rows.map(r => r.cells.map(c => c.text).join(' '))
    .map(t => (t.match(/Published date:\s*(\d{2}\/\d{2}\/\d{4})/) || [])[1]).find(Boolean);
  const year = published ? published.slice(-4) : String(new Date().getFullYear());
  log(`  published ${published || 'unknown'} (year ${year})`);

  // Block 1 runs from the first vessel header to the second.
  const headerIdx = rows
    .map((r, i) => ({ i, hit: r.cells.some(c => /^Gr[t]?\.[A-Z]/.test(c.text)) }))
    .filter(x => x.hit).map(x => x.i);
  if (headerIdx.length < 1) throw new Error('Grimaldi: no vessel header row found - layout changed');
  const block = rows.slice(headerIdx[0], headerIdx[1] ?? rows.length);

  const columns = block[1]?.cells
    .filter(c => /^G[A-Z]{2}\d{4}$/.test(c.text))
    .map(c => ({ x: c.x, voyage: c.text }))
    .sort((a, b) => a.x - b.x) || [];
  if (!columns.length) throw new Error('Grimaldi: no voyage codes found - layout changed');

  const near = (x, tol = 16) => columns.reduce((best, c) => {
    const d = Math.abs(c.x - x);
    return d < tol && (!best || d < Math.abs(best.x - x)) ? c : best;
  }, null);

  for (const c of block[0].cells) {
    const col = near(c.x, 20);
    if (col && VESSELS[c.text]) col.vessel = VESSELS[c.text];
  }

  const closingRow = rows.find(r => r.cells.some(c => /RORO Closing/i.test(c.text)));
  const closings = new Map();
  for (const c of closingRow?.cells || []) {
    if (isDate(c.text)) near(c.x)?.x !== undefined && closings.set(near(c.x).x, c.text);
  }

  const labelOf = r => r.cells.filter(c => c.x < 140).map(c => c.text).join(' ').trim();
  const datesOf = r => {
    const out = new Map();
    for (const c of r.cells) {
      if (!isDate(c.text)) continue;
      const col = near(c.x);
      if (col) out.set(col.x, dayMonNumToISO(c.text, year));
    }
    return out;
  };

  const tilbury = datesOf(block.find(r => /^Tilbury/i.test(labelOf(r))) || { cells: [] });
  if (!tilbury.size) throw new Error('Grimaldi: no Tilbury sailings found - layout changed');

  const destRows = block.filter(r => {
    const l = labelOf(r);
    return l && !LOADERS.test(l) && !/^\*|RORO|closing|Published|GRIMALDI|SCHEDULE/i.test(l) && datesOf(r).size > 0;
  });

  const sailings = [];
  for (const col of columns) {
    const ets = tilbury.get(col.x);
    if (!ets || !col.vessel) continue;
    for (const r of destRows) {
      const raw = labelOf(r);
      const eta = datesOf(r).get(col.x);
      if (!eta || eta <= ets) continue;
      const port = raw.replace(/\*/g, '').replace(/\(roro only\)/i, '').trim();
      sailings.push({
        loadPort: 'Tilbury',
        destination: withCountry(port),
        vessel: col.vessel,
        voyage: col.voyage,
        carrier: 'Grimaldi',
        ets,
        eta,
        lane: 'Europe to Africa',
        notes: [
          closings.get(col.x) ? `RoRo closing ${closings.get(col.x)}` : '',
          raw.includes('*') ? 'via Antwerp' : '',
          /roro only/i.test(raw) ? 'RoRo only' : '',
        ].filter(Boolean).join(' · '),
      });
    }
  }

  log(`  ${columns.length} vessels, ${destRows.length} destinations -> ${sailings.length} sailings`);
  return sailings;
}
