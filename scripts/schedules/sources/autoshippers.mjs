// Autoshippers destination pages - HTML, not PDF.
//
// Lowest-confidence source and deliberately last in the merge order: it is a
// freight forwarder's summary of carrier schedules, and it publishes a sailing
// date plus a transit time rather than a carrier-confirmed arrival, so ETAs
// here are DERIVED (departure + transit) and flagged as such in notes.
//
// Kept because it covers destinations no carrier source reaches: Cyprus, Malta,
// Canada and several New Zealand ports.
//
// Layout quirk: the tables use rowspan for destination/port/transit, so the grid
// has to be expanded before rows can be read.
import { fetchCached, dmyToISO, addDays, carrierFromVessel } from '../lib/util.mjs';

const BASE = 'https://www.autoshippers.co.uk/';

const PAGES = [
  ['Australia', 'car_shipping_uk_australia.htm', 'Europe to Oceania'],
  ['New Zealand', 'International_Car_Shipping_New_Zealand.html', 'Europe to Oceania'],
  ['USA', 'AutoShipping_USA.htm', 'Europe to North America'],
  ['Canada', 'car_shipping_uk_canada.htm', 'Europe to North America'],
  ['South Africa', 'car_shipping_uk_south_africa.htm', 'Europe to Africa'],
  ['Cyprus', 'car_shipping_uk_cyprus.htm', 'Europe to Mediterranean'],
  ['Malta', 'car_shipping_uk_malta.htm', 'Europe to Mediterranean'],
];

const strip = s => s
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#\d+;/g, '')
  .replace(/\s+/g, ' ').trim();

/** Expand a table into a grid, filling rowspan cells downward. */
function parseTable(html) {
  const trs = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  const grid = [];
  const carry = [];

  for (const tr of trs) {
    const cells = tr.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) || [];
    const row = [];
    let col = 0;
    const placeCarried = () => {
      while (true) {
        const c = carry.find(c => c.col === col && c.remaining > 0);
        if (!c) break;
        row[col] = c.text; c.remaining--; col++;
      }
    };
    placeCarried();
    for (const cell of cells) {
      const span = parseInt((cell.match(/rowspan\s*=\s*"?(\d+)/i) || [])[1] || '1', 10);
      row[col] = strip(cell);
      if (span > 1) carry.push({ col, text: row[col], remaining: span - 1 });
      col++;
      placeCarried();
    }
    grid.push(row.map(c => c || ''));
  }
  return grid;
}

export const name = 'Autoshippers';
export const service = 'roro';
export const url = BASE;

export async function collect({ log = () => {} } = {}) {
  const sailings = [];

  for (const [label, file, lane] of PAGES) {
    let html;
    try {
      html = await fetchCached(BASE + file, { binary: false });
    } catch (e) {
      log(`  ${label}: fetch failed (${e.message})`);
      continue;
    }

    let found = 0;
    for (const table of html.match(/<table[\s\S]*?<\/table>/gi) || []) {
      const grid = parseTable(table);
      if (!grid.length) continue;
      const header = grid[0].map(h => h.toLowerCase());
      const idx = {
        dest: header.findIndex(h => /destination|discharge/.test(h)),
        vessel: header.findIndex(h => /vessel|ship/.test(h)),
        date: header.findIndex(h => /sailing date|departure|ets|date/.test(h)),
        from: header.findIndex(h => /^from|load|origin/.test(h)),
        transit: header.findIndex(h => /transit/.test(h)),
      };
      if (idx.vessel === -1 || idx.date === -1) continue; // a pricing table, not a schedule

      for (const row of grid.slice(1)) {
        const vessel = row[idx.vessel] || '';
        const ets = dmyToISO(row[idx.date] || '');
        if (!vessel || !ets) continue;
        const transit = parseInt(((idx.transit > -1 ? row[idx.transit] : '').match(/(\d+)/) || [])[1] || '', 10);
        const dest = idx.dest > -1 ? row[idx.dest] : label;
        sailings.push({
          loadPort: (idx.from > -1 && row[idx.from]) || 'Southampton',
          destination: dest ? `${dest}${/,/.test(dest) ? '' : `, ${label}`}` : label,
          vessel,
          voyage: '',
          carrier: carrierFromVessel(vessel),
          ets,
          eta: Number.isFinite(transit) ? addDays(ets, transit) : null,
          lane,
          notes: Number.isFinite(transit) ? 'ETA derived from published transit time' : '',
        });
        found++;
      }
    }
    log(`  ${label}: ${found} sailings`);
  }

  return sailings;
}
