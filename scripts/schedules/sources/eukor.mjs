// EUKOR Car Carriers - Europe to Far East backhaul, via the schedule tool's
// own endpoint.
//
// eukor.com embeds the schedule as an iframe on m.eclipsocean.com, an old
// jQuery-era Java app. The search is one POST to otsdPortScheduleSearch.do
// with comma-joined port code lists, and nothing stops the lists being long:
// every UK port against every foreign port in a single request returns the
// whole UK schedule at once. No session or cookie is needed.
//
// The port codes come from the search page itself, which embeds all ~330 of
// them as repeated `var code/var des` script pairs (the select is built at
// runtime). Result rows are 9 <td> cells; a row with an empty vessel cell is a
// continuation carrying another discharge port for the sailing above it.
//
// Their tool returns sailings that departed weeks ago while still en route -
// kept, since the page's "Hide departed" filter handles them.
import { fetchCached, NORTH_EUROPE, COUNTRY, titleCase, laneFor } from '../lib/util.mjs';

const PAGE = 'https://m.eclipsocean.com/ek/otsd/homepage/01_ShippingService/otsdPortSchedule.do';
const SEARCH = 'https://m.eclipsocean.com/ek/otsd/homepage/01_ShippingService/otsdPortScheduleSearch.do';

// Rotation legs, not export destinations (same list as the Höegh source).
const EXCLUDED_COUNTRIES = new Set([
  'United Kingdom', 'Belgium', 'Netherlands', 'Germany', 'France',
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland',
]);

// EUKOR spellings -> the labels the rest of the data already uses, so the
// destination filter shows one entry per port.
const PORT_ALIAS = {
  'Tianjin Xingang': 'Xingang (Tianjin)',
  Huangpu: 'Huangpu (Xinsha)',
  'Le Port Reunion': 'Port Reunion',
  Gunsan: 'Kunsan',
  'Port Klang (Pelabuhan Klang)': 'Port Kelang',
  'Jakarta, Java': 'Jakarta',
  'Keelung (Chilung)': 'Keelung',
};
const COUNTRY_ALIAS = { Korea: 'South Korea', Reunion: 'Réunion' };

const clean = s => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * "Tianjin Xingang Pt, China" (or "PYEONGTAEK, KOREA") -> [port, country].
 * The port is everything up to the last comma - "Jakarta, Java, Indonesia"
 * keeps its region until the alias collapses it. One entry ("Port Klang
 * (Pelabuhan Klang),") ends with a comma and no country at all, so an empty
 * country falls back to the shared port->country map.
 */
function splitPort(text) {
  const parts = text.split(',').map(p => titleCase(p.trim()));
  let port = parts.slice(0, -1).join(', ').replace(/\s+Pt$/i, '');
  port = PORT_ALIAS[port] || port;
  const raw = parts[parts.length - 1];
  const country = COUNTRY_ALIAS[raw] || raw || COUNTRY[port] || '';
  return [port, country];
}

export const name = 'EUKOR';
export const service = 'roro';
export const url = 'https://www.eukor.com/schedule-search';

export async function collect({ log = () => {} } = {}) {
  const page = await fetchCached(PAGE, { binary: false });
  const codes = [...new Set([...page.matchAll(/var code = "([A-Z0-9]{5})";/g)].map(m => m[1]))];
  const dep = codes.filter(c => c.startsWith('GB'));
  const arr = codes.filter(c => !c.startsWith('GB'));
  if (!dep.length || arr.length < 100) {
    throw new Error(`EUKOR: port directory looks wrong (${dep.length} UK, ${arr.length} foreign) - page changed`);
  }
  log(`  ${dep.length} UK ports, ${arr.length} foreign ports in the directory`);

  const res = await fetch(SEARCH, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: PAGE,
    },
    body: new URLSearchParams({
      dep_port: dep.join(','),
      arr_port: arr.join(','),
      nDate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
    }),
  });
  if (!res.ok) throw new Error(`EUKOR: search returned ${res.status}`);
  const html = await res.text();

  const sailings = [];
  let current = null;
  for (const tr of html.match(/<tr[\s\S]*?<\/tr>/gi) || []) {
    const cells = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => clean(m[1]));
    if (cells.length !== 9) continue;

    if (cells[0]) {
      const m = cells[0].match(/^(.*?)\s+V-([A-Z0-9]+)$/);
      const [loadPort] = splitPort(cells[1]);
      current = m && cells[2]
        ? { vessel: titleCase(m[1]), voyage: m[2], loadPort, ets: cells[2] }
        : null;
    }
    if (!current) continue;

    const [port, country] = splitPort(cells[5]);
    const eta = cells[6];
    if (!port || !/^\d{4}-\d{2}-\d{2}$/.test(eta) || eta <= current.ets) continue;
    if (EXCLUDED_COUNTRIES.has(country) || NORTH_EUROPE.test(port)) continue;

    const destination = country ? `${port}, ${country}` : port;
    sailings.push({
      loadPort: current.loadPort,
      destination,
      vessel: current.vessel,
      voyage: current.voyage,
      carrier: 'EUKOR',
      ets: current.ets,
      eta,
      lane: laneFor(destination),
      notes: '',
    });
  }

  if (!sailings.length) throw new Error('EUKOR: no sailings parsed - layout changed');
  log(`  -> ${sailings.length} UK sailings`);
  return sailings;
}
