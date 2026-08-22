// Wallenius Wilhelmsen - voyage rotations via the site's own JSON middleware.
//
// The schedule page's "By Ports" search is broken server-side (their own
// frontend gets a 500 from it), but the voyage endpoints work and carry the
// same data: GET the voyage list, then GET each voyage's full port rotation
// with ISO dates. A sailing is "UK port departure -> every later port", the
// same model as NMT.
//
// ~320 voyage fetches per run; kept sequential with a small delay out of
// politeness. Each voyage is tiny JSON, so the run is bandwidth-light.
import { fetchCached, UK_PORTS, NORTH_EUROPE, withCountry, titleCase, laneFor } from '../lib/util.mjs';

const BASE = 'https://www.walleniuswilhelmsen.com/actions/maps-api-middleware-module';


const sleep = ms => new Promise(r => setTimeout(r, ms));

// WW port names embed state codes ("BRUNSWICK, GA", "MANZANILLO, PA" - which is
// Panama, not Pennsylvania). Strip those and use the API's own country field,
// normalised to the site's country names, so lanes and the per-country pages match.
const COUNTRY_NAME = {
  US: 'USA', CA: 'Canada', MX: 'Mexico', AU: 'Australia', NZ: 'New Zealand',
  JP: 'Japan', KR: 'South Korea', CN: 'China', SG: 'Singapore', HK: 'Hong Kong',
  TW: 'Taiwan', TH: 'Thailand', MY: 'Malaysia', ID: 'Indonesia', IN: 'India',
  AE: 'UAE', SA: 'Saudi Arabia', TR: 'Turkey', JO: 'Jordan', ZA: 'South Africa',
  PA: 'Panama', BR: 'Brazil', AR: 'Argentina', UY: 'Uruguay', CL: 'Chile',
  PE: 'Peru', EC: 'Ecuador', CO: 'Colombia', CY: 'Cyprus', MT: 'Malta',
  GR: 'Greece', IT: 'Italy', ES: 'Spain', PT: 'Portugal', EG: 'Egypt',
};

export const name = 'Wallenius Wilhelmsen';
export const url = 'https://www.walleniuswilhelmsen.com/schedules';

export async function collect({ log = () => {} } = {}) {
  const listRaw = await fetchCached(`${BASE}/get-schedule-by-voyage`, { binary: false });
  const voyages = JSON.parse(listRaw).map(v => v.voyageNumber).filter(Boolean);
  log(`  ${voyages.length} voyages listed`);

  const sailings = [];
  let ukRotations = 0, fetched = 0, failed = 0;

  for (const voy of voyages) {
    let detail;
    try {
      const raw = await fetchCached(`${BASE}/get-schedule-by-voyage?voyageId=${encodeURIComponent(voy)}`, { binary: false });
      detail = JSON.parse(raw);
      fetched++;
    } catch {
      failed++;
      continue;
    }
    await sleep(60);

    const info = Array.isArray(detail) ? detail[0] : detail;
    const ports = info?.voyageSchedule || [];
    if (!ports.length) continue;

    for (let i = 0; i < ports.length; i++) {
      const from = ports[i];
      const fromName = titleCase(from.portName || '');
      if (!UK_PORTS.test(fromName)) continue;
      const ets = from.departureDate || from.arrivalDate;
      if (!ets) continue;
      ukRotations++;

      for (let j = i + 1; j < ports.length; j++) {
        const to = ports[j];
        if (!to.arrivalDate || to.arrivalDate <= ets) continue;
        // Compare on the bare city so state suffixes don't defeat the exclusions,
        // and skip anything still in Europe by country code.
        const city = titleCase((to.portName || '').split(',')[0].replace(/\s*\(.*\)\s*$/, '').trim());
        const code = to.contactAddress?.countryCode || '';
        if (UK_PORTS.test(city) || NORTH_EUROPE.test(city) || code === 'GB') continue;
        if (['BE', 'NL', 'DE', 'FR', 'SE', 'NO', 'DK', 'FI', 'PL', 'EE', 'LV', 'LT'].includes(code)) continue;
        const country = COUNTRY_NAME[code] || (to.contactAddress?.country ? titleCase(to.contactAddress.country) : '');
        const destination = country ? `${city}, ${country}` : withCountry(city);
        sailings.push({
          loadPort: fromName,
          destination,
          vessel: titleCase(info.vesselName || ''),
          voyage: info.voyageNumber || voy,
          carrier: 'Wallenius Wilhelmsen',
          ets,
          eta: to.arrivalDate,
          lane: laneFor(destination),
          notes: '',
        });
      }
      break; // one UK departure per rotation is the sailing we sell
    }
  }

  if (fetched === 0) throw new Error('WW: no voyage details could be fetched - endpoint changed?');
  log(`  ${fetched} rotations fetched (${failed} failed), ${ukRotations} with a UK call -> ${sailings.length} sailings`);
  return sailings;
}
