// Sallaum Lines - Europe to West/South Africa and Europe to USA.
//
// Server-rendered HTML tables (WordPress), vessels as columns, dates carrying
// explicit years. Refreshed by the carrier most days.
//
// CRITICAL: bind dates to vessels via each cell's `headers` attribute, never by
// column position. Their empty cells are unclosed <td> elements, so a
// position-based parse silently left-packs each row - Southampton's five dates
// would attach to the first five vessels instead of the five that actually call
// there, misattributing four of the five.
//
// Sallaum publish ETA at every port, including loading ports, so the UK date is
// an arrival-to-load rather than a sailing date; notes say so.
import { fetchCached, UK_PORTS, withCountry, titleCase, laneFor, MONTHS } from '../lib/util.mjs';

const INDEX = 'https://sallaumlines.com/schedules/';

// Only Europe-origin routes; their other two run the opposite way.
const FALLBACK_ROUTES = [
  'https://sallaumlines.com/schedules/europe-to-west-and-south-africa/',
  'https://sallaumlines.com/schedules/europe-to-usa/',
];

const clean = s => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/** "31 July 2026" -> 2026-07-31 */
const longDateToISO = (day, month, year) => {
  const mm = MONTHS[String(month).slice(0, 3).toLowerCase()];
  return mm ? `${year}-${mm}-${String(day).padStart(2, '0')}` : null;
};

function parseSchedule(html) {
  const table = (html.match(/<table[\s\S]*?<\/table>/i) || [''])[0];
  if (!table) return null;

  const vessels = new Map();
  for (const m of table.matchAll(/<t[hd][^>]*id="([A-Z0-9]+)-vessel"[^>]*>([\s\S]*?)(?=<t[hd]|<\/tr)/gi)) {
    vessels.set(m[1], titleCase(clean(m[2])));
  }
  if (!vessels.size) return null;

  // Rows and cells may be unclosed, so read each up to the next opening tag.
  const rows = table.match(/<tr[\s\S]*?(?=<tr|<\/table)/gi) || [];
  let section = '';
  const ports = [];

  for (const tr of rows) {
    const sec = clean(tr).match(/Ports of (Loading|Discharge)/i);
    if (sec) { section = sec[1].toLowerCase(); continue; }

    const nameMatch = tr.match(/class="port-name"[^>]*>([\s\S]*?)(?=<\/t[hd]>|<t[hd])/i);
    if (!nameMatch) continue;
    const port = titleCase(clean(nameMatch[1]));
    if (!port || /ports of/i.test(port)) continue;

    const dates = new Map();
    for (const cell of tr.matchAll(/<td[^>]*headers="([^"]*)"[^>]*>([\s\S]*?)(?=<t[hd]|<\/tr|$)/gi)) {
      const code = (cell[1].match(/([A-Z0-9]+)-date/) || [])[1];
      if (!code) continue;
      const day = (cell[2].match(/class="number-style"[^>]*>\s*(\d{1,2})/) || [])[1];
      const month = (cell[2].match(/class="month"[^>]*>\s*([A-Za-z]+)/) || [])[1];
      const year = (cell[2].match(/class="year"[^>]*>\s*(\d{4})/) || [])[1];
      const iso = day && month && year ? longDateToISO(day, month, year) : null;
      if (iso) dates.set(code, iso);
    }
    ports.push({ section, port, dates });
  }

  return { vessels, ports };
}

/** Europe-origin route pages, discovered from the index where possible. */
async function findRoutes(log) {
  try {
    const html = await fetchCached(INDEX, { binary: false, maxAgeMinutes: 60 });
    const links = [...new Set([...html.matchAll(/href="(https:\/\/sallaumlines\.com\/schedules\/[a-z0-9-]+\/)"/gi)].map(m => m[1]))]
      .filter(u => /\/europe-to-/.test(u));
    if (links.length) return links;
    log('  index listed no Europe routes, using fallback list');
  } catch {
    log('  index unavailable, using fallback route list');
  }
  return FALLBACK_ROUTES;
}

export const name = 'Sallaum Lines';
export const service = 'roro';
export const url = INDEX;

export async function collect({ log = () => {} } = {}) {
  const routes = await findRoutes(log);
  const sailings = [];

  for (const route of routes) {
    let parsed;
    try {
      parsed = parseSchedule(await fetchCached(route, { binary: false }));
    } catch (e) {
      log(`  ${route.split('/').filter(Boolean).pop()}: fetch failed (${e.message.slice(0, 50)})`);
      continue;
    }
    if (!parsed) {
      log(`  ${route.split('/').filter(Boolean).pop()}: no schedule table found - layout changed`);
      continue;
    }

    const { vessels, ports } = parsed;
    const loading = ports.filter(p => p.section === 'loading' && UK_PORTS.test(p.port));
    const discharge = ports.filter(p => p.section === 'discharge');

    let count = 0;
    for (const [code, vessel] of vessels) {
      for (const from of loading) {
        const ets = from.dates.get(code);
        if (!ets) continue;
        for (const to of discharge) {
          const eta = to.dates.get(code);
          if (!eta || eta <= ets) continue;
          const destination = withCountry(to.port);
          sailings.push({
            loadPort: from.port,
            destination,
            vessel,
            voyage: code,
            carrier: 'Sallaum Lines',
            ets,
            eta,
            lane: laneFor(destination),
            notes: 'ETA at load port; departure not published',
          });
          count++;
        }
      }
    }
    log(`  ${route.split('/').filter(Boolean).pop()}: ${vessels.size} vessels -> ${count} UK sailings`);
  }

  if (!sailings.length) throw new Error('Sallaum: no sailings parsed - layout changed');
  return sailings;
}
