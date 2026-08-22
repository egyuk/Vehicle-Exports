// Grimaldi - Tilbury to South America (southbound), via Antwerp transhipment.
//
// SOURCE IS A LOCAL SNAPSHOT, not a download. Grimaldi publish this schedule
// only as a PDF whose text cannot be decoded (its ToUnicode maps sit inside
// compressed object streams), so the spreadsheet in ../data/ was converted by
// hand from that PDF.
//
// That means this source does NOT self-update. When Grimaldi publish a new
// revision, replace ../data/grimaldi-south-america.xlsx and re-run. If they
// ever supply the sheet at a URL, switch to fetchCached and this becomes
// automatic like the others. See SITE-BACKLOG.md.
//
// Layout (one row per sailing):
//   VESSEL | VOY | Tilbury ETS | Antwerp ETA | TRANSHIP VOY | Antwerp ETS |
//   Hamburg ETS | then one ETA column per South American port.
//
// The named vessel is the feeder that lifts from Tilbury; cargo transfers to
// the transhipment voyage at Antwerp for the ocean leg, so both are recorded.
import { join } from 'node:path';
import { readXlsx, sheetGrid } from '../lib/xlsx.mjs';
import { ROOT, dayMonToISO, withCountry, titleCase } from '../lib/util.mjs';

const FILE = join(ROOT, 'data', 'grimaldi-south-america.xlsx');

// Columns before the destination ETAs begin.
const COL = { vessel: 0, voyage: 1, tilburyEts: 2, antwerpEta: 3, transhipVoy: 4 };
const FIRST_DEST_COL = 7;

export const name = 'Grimaldi South America';
export const url = 'https://www.grimaldi.co.uk/sailing-schedule/';

export async function collect({ log = () => {} } = {}) {
  const grid = sheetGrid(readXlsx(FILE));
  const cell = (r, c) => (grid[r]?.[c] ?? '').toString().trim();

  // Publication date sits in the banner row and supplies the year, since the
  // date cells are only "08-Aug".
  const banner = (grid[0] || []).join(' ');
  const published = (banner.match(/(\d{2})\/(\d{2})\/(\d{2})/) || []);
  const year = published.length ? `20${published[3]}` : String(new Date().getFullYear());

  // Destination ports come from the header row: "Vitoria\nETA" etc.
  const header = grid[1] || [];
  const destinations = [];
  for (let c = FIRST_DEST_COL; c < header.length; c++) {
    const label = (header[c] || '').toString().replace(/\s*ETA\s*/i, '').replace(/\s+/g, ' ').trim();
    if (label) destinations.push({ col: c, port: label });
  }
  if (!destinations.length) throw new Error('Grimaldi SAM: no destination columns found - sheet layout changed');

  const sailings = [];
  let rows = 0;
  for (let r = 2; r < grid.length; r++) {
    const vessel = cell(r, COL.vessel);
    const ets = dayMonToISO(cell(r, COL.tilburyEts), year);
    if (!vessel || !ets) continue; // banner and footer rows
    rows++;

    const transhipVoy = cell(r, COL.transhipVoy);
    for (const d of destinations) {
      const eta = dayMonToISO(cell(r, d.col), year);
      if (!eta || eta <= ets) continue;
      sailings.push({
        loadPort: 'Tilbury',
        destination: withCountry(d.port),
        vessel: titleCase(vessel),
        voyage: cell(r, COL.voyage),
        carrier: 'Grimaldi',
        ets,
        eta,
        lane: 'Europe to South America',
        notes: `via Antwerp transhipment${transhipVoy ? ` · ocean voyage ${transhipVoy}` : ''}`,
      });
    }
  }

  log(`  ${rows} sailings x ${destinations.length} ports -> ${sailings.length} rows (published ${published[0] || 'unknown'}, manual snapshot)`);
  return sailings;
}
