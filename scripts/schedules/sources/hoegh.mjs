// Höegh Autoliners - per-vessel port-call rotations via the schedule page's
// own JSON endpoints.
//
// The site's port-pair search posts a Next.js server action that returns
// nothing outside a real browser session (the README's old dead end). But the
// page's client bundle shows the search never needed it for data: the form
// loads a vessel directory from m.hoegh.com, then GETs /api/vessel per vessel
// for its port calls. Both are plain JSON and answer without a browser.
//
// Two traps:
// - /api/vessel's params are misleadingly named: departureDate is the *until*
//   bound and arrivalDate the *from*. The form's defaults prove it - an empty
//   search sends departureDate=now+1y, arrivalDate=today. The obvious reading
//   (departure from, arrival until) returns [] for every vessel.
// - A vessel's calls interleave two voyages date-wise: the old voyage's
//   discharge tail and the next voyage's loading head overlap by weeks. Pairing
//   "UK call -> every later call" must be scoped to one voyage_ID; pairing the
//   date-sorted list attaches the inbound trade's UK discharge to the outbound
//   trade's destinations.
import { fetchCached, NORTH_EUROPE, laneFor } from '../lib/util.mjs';

const VESSELS = 'https://m.hoegh.com/vesselintegration/rest/vessel/';
const CALLS = 'https://www.hoeghautoliners.com/api/vessel';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Rotation legs, not export destinations (same reasoning as the WW source).
const EXCLUDED_COUNTRIES = new Set([
  'United Kingdom', 'Belgium', 'Netherlands', 'Germany', 'France',
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland',
]);

// API country names -> the site's names, so lanes and filters group correctly.
const COUNTRY_NAME = {
  'United States of America': 'USA',
  'Tanzania, United Republic of': 'Tanzania',
  'Korea, Republic of': 'South Korea',
  'Saint Vincent and the Grenadines': 'St Vincent',
  'Saint Lucia': 'St Lucia',
  'Saint Kitts and Nevis': 'St Kitts',
  'Antigua and Barbuda': 'Antigua',
  'Trinidad and Tobago': 'Trinidad',
  Curacao: 'Curaçao',
};

// Not the shared titleCase: Ö is a non-word character to \b, which splits
// "HÖEGH" into fragments and yields "HÖEgh".
const vesselCase = s => s.toLowerCase().replace(/(^|[\s-])\S/g, c => c.toUpperCase());

const cleanPort = p => p.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

export const name = 'Höegh Autoliners';
export const url = 'https://www.hoeghautoliners.com/sailing-schedule';

export async function collect({ log = () => {} } = {}) {
  const directory = JSON.parse(await fetchCached(VESSELS, { binary: false }));
  const vessels = directory.mappedObject || [];
  if (!vessels.length) throw new Error('Höegh: vessel directory empty - endpoint changed?');
  log(`  ${vessels.length} vessels listed`);

  const from = new Date().toISOString().slice(0, 10);
  const until = new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10);

  const sailings = [];
  let fetched = 0, failed = 0, ukCalls = 0;

  for (const v of vessels) {
    let calls;
    try {
      // Param names per the trap above: departureDate=until, arrivalDate=from.
      const raw = await fetchCached(
        `${CALLS}?vesselCode=${encodeURIComponent(v.VESSEL_CODE)}&departureDate=${until}&arrivalDate=${from}`,
        { binary: false },
      );
      calls = JSON.parse(raw);
      fetched++;
    } catch {
      failed++;
      continue;
    }
    await sleep(100);

    const voyages = new Map();
    for (const c of calls) {
      if (!voyages.has(c.voyage_ID)) voyages.set(c.voyage_ID, []);
      voyages.get(c.voyage_ID).push(c);
    }

    for (const ports of voyages.values()) {
      // A ballast repositioning carries no cargo, whatever ports it touches.
      if (/ballast/i.test(ports[0].trade_NAME || '')) continue;
      ports.sort((a, b) => (a.arrival_DATE || a.departure_DATE).localeCompare(b.arrival_DATE || b.departure_DATE));

      for (let i = 0; i < ports.length; i++) {
        const load = ports[i];
        if (load.country_NAME !== 'United Kingdom') continue;
        const ets = load.departure_DATE || load.arrival_DATE;
        if (!ets) continue;
        ukCalls++;

        for (let j = i + 1; j < ports.length; j++) {
          const to = ports[j];
          if (!to.arrival_DATE || to.arrival_DATE <= ets) continue;
          const port = cleanPort(to.port_NAME || '');
          if (EXCLUDED_COUNTRIES.has(to.country_NAME) || NORTH_EUROPE.test(port)) continue;
          const destination = `${port}, ${COUNTRY_NAME[to.country_NAME] || to.country_NAME}`;
          sailings.push({
            loadPort: cleanPort(load.port_NAME),
            destination,
            vessel: vesselCase(v.VESSEL_NAME),
            voyage: String(load.voyage_NO || ''),
            carrier: 'Höegh Autoliners',
            ets,
            eta: to.arrival_DATE,
            lane: laneFor(destination),
            notes: '',
          });
        }
      }
    }
  }

  if (!fetched) throw new Error('Höegh: no vessel rotations could be fetched - endpoint changed?');
  log(`  ${fetched} rotations fetched (${failed} failed), ${ukCalls} UK load calls -> ${sailings.length} sailings`);
  return sailings;
}
