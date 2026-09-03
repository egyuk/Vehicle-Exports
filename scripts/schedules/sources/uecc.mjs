// UECC - short-sea RoRo around Europe, from the schedule PDF linked on
// uecc.com/sailing-schedules.
//
// The PDF is a day-by-day calendar, not a port table: one row per date, and a
// pair of (Port, Voyage) columns per vessel. A vessel's rotation is therefore
// read *down* its column, and a UK call pairs with the ports it reaches later
// in the same column.
//
// Two quirks:
// - "II" and "ll" mark a vessel still alongside or at sea; they are not ports.
// - Dates are dd-mm (the separator drifts between "-" and "/" across issues)
//   with the year only in "Date of Issue: 21-08-26", so a December-to-January
//   rotation has to roll the year forward.
//
// Most UECC calls are intra-North-Europe and get excluded; what survives is
// the Iberia/Mediterranean lane out of Portbury and Tilbury.
import { fetchCached, UK_PORTS, NORTH_EUROPE, withCountry, titleCase, laneFor } from '../lib/util.mjs';
import { pdfRows } from '../lib/pdf.mjs';

const PAGE = 'https://uecc.com/sailing-schedules/';

const CONTINUATION = /^(II|ll|l{1,2}|\/|-)+$/i;
// The additional-tonnage column carries voyage codes ("BIS26061", "NEA 26028")
// in the same position a port name occupies elsewhere.
const VOYAGE_CODE = /^[A-Z]{2,4}\s*\d{4,6}$/i;
const DAY = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i;

export const name = 'UECC';
export const service = 'roro';
export const url = PAGE;

export async function collect({ log = () => {} } = {}) {
  const html = await fetchCached(PAGE, { binary: false, maxAgeMinutes: 60 });
  const pdf = (html.match(/https:\/\/uecc\.com\/wp-content\/uploads\/[^"]*\.pdf/i) || [])[0];
  if (!pdf) throw new Error('UECC: no schedule PDF linked - page changed');

  const rows = pdfRows(await fetchCached(pdf));
  const issue = rows.map(r => r.cells.map(c => c.text).join(' ')).join(' ')
    .match(/Date of Issue:\s*(\d{2})[-\/](\d{2})[-\/](\d{2})/);
  if (!issue) throw new Error('UECC: issue date not found - layout changed');
  const startYear = 2000 + Number(issue[3]);
  log(`  issued ${issue[1]}-${issue[2]}-${issue[3]}`);

  // Header row names the vessels; its x positions define the columns.
  const head = rows.find(r => r.cells.some(c => /^MV /i.test(c.text)));
  if (!head) throw new Error('UECC: vessel header row not found - layout changed');
  const columns = head.cells
    .filter(c => /^MV /i.test(c.text))
    .map(c => ({ vessel: titleCase(c.text.replace(/^MV\s+/i, '')), x: c.x, calls: [] }));
  log(`  ${columns.length} vessel columns`);

  const nearest = x => {
    let best = null, dist = Infinity;
    for (const col of columns) {
      const d = Math.abs(col.x - x);
      if (d < dist) { dist = d; best = col; }
    }
    return dist <= 45 ? best : null;
  };

  // Dates are dd-mm, so the year has to be supplied. Anchor each date to the
  // issue date rather than carrying a running counter: the sheet spans several
  // pages and the calendar restarts on later ones, which made a running counter
  // roll twice and push August sailings into the following year (the 120-day
  // transit gate caught it). A date landing well before the issue date belongs
  // to the next year - that is the December-to-January wrap.
  const issued = new Date(`${startYear}-${issue[2]}-${issue[1]}`);
  const yearFor = (dd, mm) => {
    const same = new Date(`${startYear}-${mm}-${dd}`);
    return (issued - same) / 86400000 > 60 ? startYear + 1 : startYear;
  };

  for (const row of rows) {
    const cells = row.cells;
    const dayIdx = cells.findIndex(c => DAY.test(c.text));
    if (dayIdx === -1) continue;
    const dm = cells[dayIdx + 1]?.text.match(/^(\d{2})[-\/](\d{2})$/);
    if (!dm) continue;
    const date = `${yearFor(dm[1], dm[2])}-${dm[2]}-${dm[1]}`;

    for (const c of cells.slice(dayIdx + 2)) {
      const text = c.text.trim();
      if (!text || CONTINUATION.test(text) || /^\d{4,6}$/.test(text)) continue;
      if (VOYAGE_CODE.test(text)) continue;
      if (/^\d{2}[-\/]\d{2}$/.test(text)) continue; // the repeated Date column
      const col = nearest(c.x);
      if (col) col.calls.push({ port: titleCase(text), date });
    }
  }

  const sailings = [];
  for (const col of columns) {
    col.calls.sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 0; i < col.calls.length; i++) {
      const load = col.calls[i];
      if (!UK_PORTS.test(load.port)) continue;
      for (let j = i + 1; j < col.calls.length; j++) {
        const to = col.calls[j];
        if (to.date <= load.date) continue;
        if (UK_PORTS.test(to.port) || NORTH_EUROPE.test(to.port)) continue;
        // Their spellings drift ("Sheernees", "Porbury", "Gothenborg") and the
        // sheet mixes in terminal names ("Autoport"). Anything the country map
        // cannot place is dropped rather than guessed - a wrong destination is
        // worse than a missing one, and the Iberia/Med lane is what matters.
        const destination = withCountry(to.port);
        if (!destination.includes(',')) continue;
        sailings.push({
          loadPort: load.port,
          destination,
          vessel: col.vessel,
          voyage: '',
          carrier: 'UECC',
          ets: load.date,
          eta: to.date,
          lane: laneFor(destination),
          notes: '',
        });
      }
      break; // one UK departure per rotation, as with the other carriers
    }
  }

  if (!sailings.length) throw new Error('UECC: no sailings parsed - layout changed');
  log(`  -> ${sailings.length} UK sailings`);
  return sailings;
}
