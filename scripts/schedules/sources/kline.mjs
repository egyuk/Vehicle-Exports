// "K" Line - Europe to North America and Mexico Gulf.
//
// Format: Excel-generated, Flate streams, ordinary text.
// Layout: vessels are COLUMNS; each port is a block of an "Arrival Date" row
// directly above the port label and a "Sailing Date" row directly below it.
// A sailing is "Southampton sailing date -> each discharge port's arrival".
import { pdfRows } from '../lib/pdf.mjs';
import { fetchCached, dayMonToISO, withCountry } from '../lib/util.mjs';

const PDF = 'https://www.klineglobalroro.com/schedules/1-1_europe_to_north_america_and_mexico_gulf_schedule.pdf';

const EU_PORTS = ['SOUTHAMPTON', 'BREMERHAVEN', 'ZEEBRUGGE'];
const LOAD_PORT = 'SOUTHAMPTON';
const KNOWN = /\b(SOUTHAMPTON|BREMERHAVEN|ZEEBRUGGE|BALTIMORE|BRUNSWICK|CHARLESTON|DAVISVILLE|GALVESTON|VERACRUZ|ALTAMIRA)\b/;

const isDate = t => /^\d{1,2}-[A-Z][a-z]{2}$/.test(t);

export const name = '"K" Line';
export const url = 'https://www.klineglobalroro.com/schedules/';

export async function collect({ year = new Date().getFullYear(), log = () => {} } = {}) {
  const rows = pdfRows(await fetchCached(PDF));

  const voyRow = rows.find(r => r.cells.some(c => /VOYAGE NUMBER/i.test(c.text)));
  if (!voyRow) throw new Error('K Line: voyage number row not found - layout changed');

  const columns = voyRow.cells
    .filter(c => /^\d+\s*A$/i.test(c.text))
    .map(c => ({ x: c.x, voyage: c.text.replace(/\s+/g, ' ').trim(), parts: [] }))
    .sort((a, b) => a.x - b.x);

  const nearestCol = x => {
    let best = null, dist = Infinity;
    for (const c of columns) {
      const d = Math.abs(c.x - x);
      if (d < dist) { dist = d; best = c; }
    }
    return dist <= 30 ? best : null;
  };

  // Vessel names sit just above the voyage row, split over several lines.
  for (const r of rows.filter(r => r.y < voyRow.y && r.y > voyRow.y - 45)) {
    for (const c of r.cells) {
      if (/LNG powered|VESSEL NAME|Service/i.test(c.text) || /^(TAL|NAS)$/i.test(c.text)) continue;
      nearestCol(c.x)?.parts.push({ y: r.y, text: c.text });
    }
  }
  for (const col of columns) {
    col.vessel = col.parts.sort((a, b) => a.y - b.y).map(p => p.text).join(' ').replace(/\s+/g, ' ').trim();
  }

  const svcRow = rows.find(r => r.cells.some(c => /^Service$/i.test(c.text)));
  for (const c of svcRow?.cells || []) {
    if (/^(TAL|NAS)$/i.test(c.text)) {
      const col = nearestCol(c.x);
      if (col) col.service = c.text.toUpperCase();
    }
  }

  const dataRows = rows.filter(r => r.cells.filter(c => isDate(c.text)).length >= 3);
  const readDates = row => {
    const out = new Map();
    for (const c of row?.cells || []) {
      if (!isDate(c.text)) continue;
      const col = nearestCol(c.x);
      if (col) out.set(col.x, dayMonToISO(c.text, year));
    }
    return out;
  };

  const blocks = [];
  for (const r of rows) {
    const label = r.cells.filter(c => c.x < 275).map(c => c.text).join(' ').toUpperCase();
    const m = label.match(KNOWN);
    if (!m) continue;
    // Arrival row sits directly above the label, sailing row directly below.
    const above = dataRows.filter(d => d.y < r.y).sort((a, b) => b.y - a.y)[0];
    const below = dataRows.filter(d => d.y > r.y).sort((a, b) => a.y - b.y)[0];
    blocks.push({ port: m[1], arrival: readDates(above), sailing: readDates(below) });
  }

  const load = blocks.find(b => b.port === LOAD_PORT);
  if (!load) throw new Error('K Line: Southampton block not found - layout changed');
  const discharge = blocks.filter(b => !EU_PORTS.includes(b.port));

  const sailings = [];
  for (const col of columns) {
    const ets = load.sailing.get(col.x);
    if (!ets || !col.vessel) continue;
    for (const d of discharge) {
      const eta = d.arrival.get(col.x);
      if (!eta || eta <= ets) continue;
      const port = d.port.charAt(0) + d.port.slice(1).toLowerCase();
      sailings.push({
        loadPort: 'Southampton',
        destination: withCountry(port) === port
          ? `${port}, ${['VERACRUZ', 'ALTAMIRA'].includes(d.port) ? 'Mexico' : 'USA'}`
          : withCountry(port),
        vessel: col.vessel.replace(/\b\w+/g, w => w.charAt(0) + w.slice(1).toLowerCase()),
        voyage: col.voyage,
        carrier: '"K" Line',
        ets,
        eta,
        lane: 'Europe to North America',
        notes: col.service ? `${col.service} service` : '',
      });
    }
  }

  log(`  ${columns.length} vessel columns, ${discharge.length} discharge ports -> ${sailings.length} sailings`);
  return sailings;
}
