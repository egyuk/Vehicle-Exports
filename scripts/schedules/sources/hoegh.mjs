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
// - Do NOT scope pairing to one voyage_ID. The voyage number is an
//   administrative boundary, not a physical one: Höegh Manila's Southampton
//   call sits on voyage 189 while the Caribbean discharges three weeks later
//   are voyage 190, and Höegh's own search sells Southampton -> Kingston
//   across it (labelled with the discharge call's voyage). Pair each UK call
//   with every later call of the vessel in date order; the UK/North-Europe
//   exclusions are what keep the inbound trade's discharge tail out, and the
//   validator's 120-day transit cap bounds the horizon.
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

// A UK car connecting onto the Eastern Caribbean feeder has to be discharged
// and reloaded at the hub; the feeder loops roughly monthly, so 45 days of
// dwell is enough to catch the next loop without pairing across two of them.
const MAX_HUB_DWELL_DAYS = 45;

// The feeder loads at two hubs ("ex Kingston and ex Pointe-à-Pitre"), both
// directly reachable from the UK. Kingston reaches the whole loop; Pointe-à-
// Pitre reaches a subset but adds French Guiana (Degrad des Cannes), which
// falls between two Kingston calls and so misses the Kingston dwell window.
const HUBS = [
  { match: /kingston/i, country: 'Jamaica', label: 'Kingston, Jamaica' },
  { match: /pointe.*pitre/i, country: 'Guadeloupe', label: 'Pointe-à-Pitre, Guadeloupe' },
];

const daysBetween = (a, b) => (Date.parse(b) - Date.parse(a)) / 864e5;

export async function collect({ log = () => {} } = {}) {
  const directory = JSON.parse(await fetchCached(VESSELS, { binary: false }));
  const vessels = directory.mappedObject || [];
  if (!vessels.length) throw new Error('Höegh: vessel directory empty - endpoint changed?');
  log(`  ${vessels.length} vessels listed`);

  const from = new Date().toISOString().slice(0, 10);
  const until = new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10);

  const rotations = [];
  let fetched = 0, failed = 0;

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

    // Whole rotation in date order - see the voyage-boundary note up top.
    // A ballast repositioning carries no cargo, in either direction.
    const ports = calls
      .filter(c => !/ballast/i.test(c.trade_NAME || ''))
      .sort((a, b) => (a.arrival_DATE || a.departure_DATE).localeCompare(b.arrival_DATE || b.departure_DATE));

    rotations.push({ vessel: vesselCase(v.VESSEL_NAME), ports });
  }

  if (!fetched) throw new Error('Höegh: no vessel rotations could be fetched - endpoint changed?');

  const sailings = [];
  let ukCalls = 0;

  for (const { vessel, ports } of rotations) {
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
          vessel,
          // The discharge call's voyage, matching what Höegh's own search shows.
          voyage: String(to.voyage_NO || ''),
          carrier: 'Höegh Autoliners',
          ets,
          eta: to.arrival_DATE,
          lane: laneFor(destination),
          notes: '',
        });
      }
    }
  }

  // Through-routes over the Caribbean feeder hubs. Höegh's Eastern Caribbean
  // feeder (Guyana, Suriname, Barbados, the Windwards/Leewards, the ABC
  // islands, French Guiana) never calls the UK; cargo reaches it on a deep-sea
  // Europe-Caribbean vessel and changes ship at a hub. Pair each UK -> hub
  // sailing with the feeder's next loop from that hub so those final
  // destinations are searchable, and say so in notes - a through-route
  // masquerading as a direct sailing would be worse than no row.
  //
  // A through-route earns its row only where the UK has no direct option:
  // ports Höegh already serves direct stay out, as does anywhere outside the
  // Caribbean/South America trades - UK cargo for the USA never sails via a
  // hub, however neatly the dates line up.
  const directPorts = new Set(sailings.map(s => s.destination));
  const FEEDER_LANES = new Set(['Europe to Caribbean', 'Europe to South America']);

  // destination-per-UK-sailing -> earliest onward arrival, deduped across both
  // hubs so a port reachable via either is listed once, by its fastest route.
  const throughRoutes = new Map();

  for (const hub of HUBS) {
    // Feeder legs leaving this hub, one loop only (until the vessel is back).
    const feederLegs = [];
    for (const { vessel, ports } of rotations) {
      for (let i = 0; i < ports.length; i++) {
        const k = ports[i];
        if (!hub.match.test(k.port_NAME || '') || !k.departure_DATE) continue;
        for (let j = i + 1; j < ports.length && !hub.match.test(ports[j].port_NAME || ''); j++) {
          const to = ports[j];
          if (!to.arrival_DATE || to.arrival_DATE < k.departure_DATE) continue;
          const port = cleanPort(to.port_NAME || '');
          if (EXCLUDED_COUNTRIES.has(to.country_NAME) || NORTH_EUROPE.test(port)) continue;
          feederLegs.push({
            hubDep: k.departure_DATE,
            destination: `${port}, ${COUNTRY_NAME[to.country_NAME] || to.country_NAME}`,
            voyage: String(to.voyage_NO || ''),
            eta: to.arrival_DATE,
            feeder: vessel,
          });
        }
      }
    }

    // UK -> hub arrivals. One UK departure can reach several later hub calls of
    // the same vessel (the voyage-boundary note above); connect the earliest.
    const hubArrivals = new Map();
    for (const s of sailings) {
      // Match the hub's own port name, spelling-agnostic (the direct
      // destination writes "Pointe à Pitre" while the label hyphenates it),
      // and pin the country so "Kingston" never catches "Kingstown".
      const [port, country] = s.destination.split(',').map(x => x.trim());
      if (!hub.match.test(port) || country !== hub.country) continue;
      const key = `${s.loadPort}|${s.vessel}|${s.ets}`;
      const seen = hubArrivals.get(key);
      if (!seen || s.eta < seen.eta) hubArrivals.set(key, s);
    }

    for (const leg of hubArrivals.values()) {
      for (const f of feederLegs) {
        if (f.hubDep <= leg.eta) continue;
        if (daysBetween(leg.eta, f.hubDep) > MAX_HUB_DWELL_DAYS) continue;
        if (directPorts.has(f.destination)) continue;
        if (!FEEDER_LANES.has(laneFor(f.destination))) continue;
        const key = `${leg.loadPort}|${leg.vessel}|${leg.ets}|${f.destination}`;
        const seen = throughRoutes.get(key);
        if (!seen || f.eta < seen.eta) {
          throughRoutes.set(key, {
            loadPort: leg.loadPort,
            destination: f.destination,
            vessel: leg.vessel,
            voyage: f.voyage,
            carrier: 'Höegh Autoliners',
            ets: leg.ets,
            eta: f.eta,
            lane: laneFor(f.destination),
            notes: `Via ${hub.label} — transhipment to ${f.feeder}`,
          });
        }
      }
    }
  }

  for (const row of throughRoutes.values()) sailings.push(row);

  log(`  ${fetched} rotations fetched (${failed} failed), ${ukCalls} UK load calls -> ${sailings.length} sailings (${throughRoutes.size} via hub)`);
  return sailings;
}
