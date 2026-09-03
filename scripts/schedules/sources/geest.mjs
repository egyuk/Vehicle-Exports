// Geest Line - Portsmouth to the Caribbean and Colombia, quarterly PDFs.
//
// Format: "Print To PDF", Flate streams, text as TJ arrays of hex CIDs, and a
// page transform that flips the y axis.
// Layout: one row per voyage; each destination port has TWO sub-columns
// (arrival and sailing) identified by UN/LOCODE in a header row. Rows are
// sparse - a vessel that skips an island simply has no token there - so dates
// MUST be matched by reconstructed x position, never by reading order.
//
// This only works because the fonts declare exact glyph widths (/W); estimated
// widths drift far enough across a row to land dates in the wrong island.
import { pdfRows } from '../lib/pdf.mjs';
import { fetchCached, dayMonToISO, addDays, fmtShort } from '../lib/util.mjs';

const PAGE = 'https://www.geestline.com/sailing-schedule/';

const PORTS = {
  BBBGI: 'Bridgetown, Barbados', GYGEO: 'Georgetown, Guyana', GDSTG: "St George's, Grenada",
  VCCRP: 'Kingstown, St Vincent', LCCAS: 'Castries, St Lucia', DMRSU: 'Roseau, Dominica',
  SXPHI: 'Philipsburg, Sint Maarten', AGSJO: "St John's, Antigua", KNBAS: 'Basseterre, St Kitts',
  TTPTS: 'Port of Spain, Trinidad', CWWIL: 'Willemstad, Curaçao', COTRB: 'Turbo, Colombia',
  COSMR: 'Santa Marta, Colombia', DOMAN: 'Manzanillo, Dominican Republic',
};

const CUTOFF_DAYS = 4; // UK closing runs exactly four days before sailing
const isDate = t => /^\d{2}-[A-Za-z]{3}$/.test(t);

export const name = 'Geest Line';
export const service = 'roro';
export const url = PAGE;

// Known-current quarter PDFs. The site's schedule page also links older
// quarters, so discovery alone can return nothing but archive files.
const KNOWN = [
  'https://www.geestline.com/wp-content/uploads/GeestLine2026Q3ScheduleV1.2-1-1.pdf',
  'https://www.geestline.com/wp-content/uploads/Geest-Line-Schedule-Q2-2026-v1.0.pdf',
];

/**
 * Quarterly PDFs are re-linked each quarter, so discover from the page and add
 * the known URLs. Past quarters parse fine and simply contribute no upcoming
 * sailings, so an out-of-date link is harmless.
 */
async function findSchedulePdfs() {
  let discovered = [];
  try {
    const html = await fetchCached(PAGE, { binary: false, maxAgeMinutes: 30 });
    discovered = [...new Set([...html.matchAll(/href="([^"]+\.pdf)"/gi)].map(m => m[1]))]
      .filter(l => /schedule/i.test(l));
  } catch { /* discovery is best-effort; the known URLs carry the load */ }
  return [...new Set([...KNOWN, ...discovered])];
}

function parseSchedule(buf, { log }) {
  const rows = pdfRows(buf, { cellGap: 300 });

  const year = (rows.map(r => r.cells.map(c => c.text).join(' '))
    .map(t => (t.match(/Published:\s*\d{1,2}\s+\w+\s+(\d{4})/) || [])[1])
    .find(Boolean)) || String(new Date().getFullYear());

  // Sub-columns come from the UN/LOCODE header row: first appearance of a code
  // is its arrival column, second is its sailing column.
  const codeRow = rows.find(r => r.cells.some(c => c.text === 'GBPME'));
  if (!codeRow) throw new Error('Geest: UN/LOCODE header row not found - layout changed');

  const seenCount = {};
  const subCols = [];
  for (const c of codeRow.cells) {
    if (!PORTS[c.text]) continue;
    seenCount[c.text] = (seenCount[c.text] || 0) + 1;
    subCols.push({ code: c.text, kind: seenCount[c.text] === 1 ? 'arrival' : 'sailing', x: c.x });
  }
  if (!subCols.length) throw new Error('Geest: no destination columns found - layout changed');

  const voyageRows = rows.filter(r => /^GL\d{5}$/.test(r.cells[0]?.text || ''));

  // Cluster every date/asterisk x into slots, then bind each slot to its column.
  const xs = [];
  voyageRows.forEach(r => r.cells.forEach(c => {
    if (c.x > subCols[0].x - 12 && /^(\d{2}-[A-Za-z]{3}|\*)$/.test(c.text)) xs.push(c.x);
  }));
  xs.sort((a, b) => a - b);
  const slots = [];
  for (const x of xs) {
    const s = slots.find(s => Math.abs(s.x - x) < 4);
    if (s) { s.sum += x; s.n++; s.x = s.sum / s.n; } else slots.push({ x, sum: x, n: 1 });
  }
  for (const s of slots) {
    const ranked = subCols.map(c => ({ ...c, d: Math.abs(c.x - s.x) })).sort((a, b) => a.d - b.d);
    s.col = ranked[0];
  }

  const voyages = [];
  for (const r of voyageRows) {
    const text = r.cells.map(c => c.text).join(' ').replace(/\s+/g, ' ').trim();
    const m = text.match(/^(GL\d+)\s+(.+?)\s+\d\s+/);
    if (!m) continue;

    // The six leading columns (Flushing x3, UK x3) are present on every voyage;
    // the sixth is the Portsmouth sailing.
    const lead = r.cells
      .filter(c => c.x < subCols[0].x - 12 && isDate(c.text))
      .sort((a, b) => a.x - b.x);
    const ets = dayMonToISO(lead[5]?.text, year);
    if (!ets) continue;

    const calls = {};
    for (const c of r.cells) {
      if (!isDate(c.text)) continue;
      const slot = slots.find(s => Math.abs(s.x - c.x) < 4);
      if (!slot || slot.col.kind !== 'arrival') continue;
      calls[slot.col.code] = dayMonToISO(c.text, year);
    }
    voyages.push({ voyage: m[1], vessel: m[2], ets, calls });
  }

  log(`  ${voyages.length} voyages, ${subCols.length} sub-columns (year ${year})`);
  return voyages;
}

/**
 * The service is weekly, so each port's arrivals across consecutive voyages must
 * step by whole weeks. A single mis-assigned column shatters this - it is the
 * check that proves the column mapping, so a failure must abort rather than warn.
 */
export function checkWeeklyCadence(voyages) {
  const problems = [];
  const byDate = voyages.filter(v => v.ets).sort((a, b) => a.ets.localeCompare(b.ets));
  for (const code of Object.keys(PORTS)) {
    const seq = byDate.map(v => v.calls[code]).filter(Boolean);
    if (seq.length < 3) continue;
    const gaps = seq.slice(1).map((d, i) => Math.round((new Date(d) - new Date(seq[i])) / 86400000));
    // 0 is legitimate (a slower rotation overtaking), 7/14/21 are the cadence.
    const bad = gaps.filter(g => g !== 0 && (g < 5 || g > 23));
    if (bad.length) problems.push(`${code} irregular gaps [${gaps.join(',')}]`);
  }
  return problems;
}

export async function collect({ log = () => {} } = {}) {
  const pdfs = await findSchedulePdfs();
  const today = new Date().toISOString().slice(0, 10);
  const sailings = [];
  let allVoyages = [];

  for (const pdfUrl of pdfs) {
    let voyages;
    try {
      voyages = parseSchedule(await fetchCached(pdfUrl), { log });
    } catch (e) {
      log(`  skipped ${pdfUrl.split('/').pop()}: ${e.message}`);
      continue;
    }
    allVoyages = allVoyages.concat(voyages);

    for (const v of voyages) {
      if (v.ets < today) continue; // past quarters add nothing
      for (const [code, eta] of Object.entries(v.calls)) {
        if (!eta || eta <= v.ets) continue;
        sailings.push({
          loadPort: 'Portsmouth',
          destination: PORTS[code],
          vessel: v.vessel,
          voyage: v.voyage,
          carrier: 'Geest Line',
          ets: v.ets,
          eta,
          lane: 'Europe to Caribbean',
          notes: `UK cut-off ${fmtShort(addDays(v.ets, -CUTOFF_DAYS))}`,
        });
      }
    }
  }

  const cadence = checkWeeklyCadence(allVoyages);
  if (cadence.length) {
    throw new Error(
      `Geest: weekly cadence check failed, column mapping is unreliable:\n    ${cadence.join('\n    ')}`
    );
  }

  log(`  ${sailings.length} upcoming sailings (cadence check passed)`);
  return sailings;
}
