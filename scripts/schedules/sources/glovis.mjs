// Hyundai Glovis - deep-sea services ex Europe, published by Stena Glovis
// (the joint venture that runs Glovis' European network) as weekly per-lane
// PDFs.
//
// URLs carry the ISO week: .../Sailing-Schedule-Stena-Glovis-C35_2026_fareast.pdf.
// The schedule page is scraped for the current set rather than guessing the
// week, so a renumbering or a new lane is picked up automatically.
//
// Layout is a vessel-column grid: a "Vessel Name" header row, then one row per
// port with a date under each vessel that calls there. Rows are sparse - most
// ports are blank for most vessels - so dates are bound to vessels by x
// position, never by reading order (the lesson from Geest). Each table repeats
// the row label at both ends, and "suspended" appears where a service is off.
import { fetchCached, UK_PORTS, NORTH_EUROPE, withCountry, titleCase, laneFor } from '../lib/util.mjs';
import { pdfRows } from '../lib/pdf.mjs';

const INDEX = 'https://stenaglovis.com/customer-service/schedule/';

// Lanes worth fetching. The combined "all schedules" PDF repeats these, and
// the ferry/shortsea and Turkey shuttle files are intra-European.
const WANTED = /_(fareast|transatlantic|africa|middleeast|globalservices)\.pdf$/i;

const ISO = /^(\d{2})\.(\d{2})\.(\d{4})$/;
const dotDateToISO = d => {
  const m = String(d).match(ISO);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};

/**
 * Row labels name the berth as well as the port ("Southampton - Eastern Docks",
 * "Jebel Ali*"). Reduce to the city so UK_PORTS matches and destinations agree
 * with the rest of the data; Marchwood is its own entry in UK_PORTS, so it is
 * the one suffix worth keeping.
 */
const cleanPort = label => {
  const s = titleCase(label.replace(/\*+$/, '').trim());
  if (/^Southampton\s*-\s*Marchwood/i.test(s)) return 'Marchwood';
  return s.split(/\s+-\s+/)[0].trim();
};

export const name = 'Hyundai Glovis';
export const url = INDEX;

export async function collect({ log = () => {} } = {}) {
  const html = await fetchCached(INDEX, { binary: false, maxAgeMinutes: 60 });
  const pdfs = [...new Set([...html.matchAll(/href="(https:\/\/stenaglovis\.com\/app\/uploads\/[^"]*\.pdf)"/gi)].map(m => m[1]))]
    .filter(u => WANTED.test(u));
  if (!pdfs.length) throw new Error('Glovis: no lane PDFs linked - schedule page changed');
  log(`  ${pdfs.length} lane PDFs`);

  const sailings = [];
  for (const pdf of pdfs) {
    const lane = (pdf.match(/_([a-z]+)\.pdf$/i) || [])[1];
    let rows;
    try {
      rows = pdfRows(await fetchCached(pdf));
    } catch (e) {
      log(`  ${lane}: unreadable (${e.message.slice(0, 40)})`);
      continue;
    }

    // Split into tables, each starting at a "Vessel Name" header row.
    const heads = rows.map((r, i) => ({ r, i })).filter(({ r }) => /^Vessel Name/i.test(r.cells[0]?.text || ''));
    let count = 0;

    for (let h = 0; h < heads.length; h++) {
      const head = heads[h].r;
      const end = h + 1 < heads.length ? heads[h + 1].i : rows.length;

      // Vessel columns: header cells after the label, minus the trailing repeat.
      const vessels = head.cells.slice(1)
        .filter(c => !/^Vessel Name$/i.test(c.text))
        .map(c => ({ name: titleCase(c.text), x: c.x }));
      if (vessels.length < 2) continue;

      // Bind a cell to the nearest vessel column; tables are wide, so a
      // generous tolerance is safe and a miss is better than a wrong column.
      const columnOf = x => {
        let best = null, dist = Infinity;
        for (const v of vessels) {
          const d = Math.abs(v.x - x);
          if (d < dist) { dist = d; best = v; }
        }
        return dist <= 40 ? best : null;
      };

      const voyages = new Map(vessels.map(v => [v.name, '']));
      const calls = new Map(vessels.map(v => [v.name, []]));

      for (let i = heads[h].i + 1; i < end; i++) {
        const label = cleanPort(rows[i].cells[0]?.text || '');
        if (!label || /^(Ramp capacity|Max\. deck height|Flag|LNG Powered)$/i.test(label)) continue;
        if (/^Voyage$/i.test(label)) {
          for (const c of rows[i].cells.slice(1)) {
            const col = columnOf(c.x);
            if (col && !/^Voyage$/i.test(c.text)) voyages.set(col.name, c.text);
          }
          continue;
        }
        for (const c of rows[i].cells.slice(1)) {
          const iso = dotDateToISO(c.text);
          if (!iso) continue; // skips "suspended" and the repeated row label
          const col = columnOf(c.x);
          if (col) calls.get(col.name).push({ port: label, date: iso });
        }
      }

      for (const [vessel, stops] of calls) {
        stops.sort((a, b) => a.date.localeCompare(b.date));
        const load = stops.find(s => UK_PORTS.test(s.port));
        if (!load) continue;
        for (const to of stops) {
          if (to.date <= load.date) continue;
          if (UK_PORTS.test(to.port) || NORTH_EUROPE.test(to.port)) continue;
          const destination = withCountry(to.port);
          sailings.push({
            loadPort: load.port,
            destination,
            vessel,
            voyage: voyages.get(vessel) || '',
            carrier: 'Hyundai Glovis',
            ets: load.date,
            eta: to.date,
            lane: laneFor(destination),
            notes: '',
          });
          count++;
        }
      }
    }
    log(`  ${lane}: ${count} UK sailings`);
  }

  if (!sailings.length) throw new Error('Glovis: no sailings parsed - layout changed');
  return sailings;
}
