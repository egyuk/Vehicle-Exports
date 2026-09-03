// MSC - deep-sea container schedules for UK departures, via the schedule tool's
// own JSON endpoints.
//
// Two calls make this work. GetAllAvailableCountriesAndPorts is a plain GET
// returning MSC's whole port dictionary (580 ports, with country name and ISO
// code); SearchSailingRoutes is a POST that answers ONE port pair at a time and
// returns roughly eight weeks of sailings forward from FromDate. There is no
// "everything from port X" call, so the crawl is load ports x discharge ports
// and the only lever on cost is how many of each you ask for. See BUDGET below.
//
// ---------------------------------------------------------------------------
// `optional = true` IS LOAD-BEARING. DO NOT REMOVE IT.
//
// msc.com sits behind Akamai Bot Manager, which fingerprints the client rather
// than just the IP: curl is refused outright (403) on identical headers, while
// plain Node - both undici and node:https - is served. Node passing was proved
// from a residential UK line. Nobody has proved it from a datacentre ASN, which
// is exactly what the weekly cloud runner uses, and Akamai routinely scores
// those differently. `optional` is what makes update.mjs log a warning and
// carry on instead of refusing to write the file. Without it, one Akamai block
// on MSC takes down the weekly refresh for all nineteen other carriers - the
// nineteen that have never been blocked. Losing MSC for a week is a gap in one
// carrier's rows; losing the run is a stale schedule sitewide.
//
// This is not theoretical. Building this module took roughly a thousand
// requests inside twenty minutes and earned a blanket 403 on every request from
// this machine; it cleared on its own after about ten. A single weekly sweep of
// 396 is well inside what MSC tolerate - three consecutive clean full runs -
// but the block is real, it arrives without warning, and it applies to the
// whole client rather than one endpoint.
//
// `optional` DOES NOT cover everything, and the rest of this file is written on
// that basis. update.mjs awaits collect() serially, so a hung socket stalls the
// other nineteen carriers no matter what this flag says - hence the timeouts
// and the wall-clock budget below. validateAll runs AFTER the merge, where the
// flag no longer applies, so a malformed date here would fail the whole run -
// hence isoDate refuses anything that is not YYYY-MM-DD. The rule this module
// holds itself to: a bad day for MSC must degrade MSC and nothing else.
// ---------------------------------------------------------------------------
//
// Four traps, all of them verified rather than guessed:
//
//  1. THE SILENT EMPTY. The POST requires `x-requested-with: XMLHttpRequest`.
//     Without it you get HTTP 200 with a body of literally `""` - not a 4xx,
//     not an error object. A health check that only asserts 200 would pass
//     while collecting nothing. Treated here as a hard failure, and told apart
//     from IsSuccess:false, which is the legitimate "we do not serve this pair".
//
//  2. NO COUNTRY IN THE ROUTE PAYLOAD. A route names the discharge port and its
//     UN/LOCODE but never the country, so the destination has to be joined back
//     against the port dictionary. A row whose country cannot be resolved is
//     dropped with a log line rather than published countryless - and there is
//     deliberately no fall back to the country we ASKED for, which would put a
//     real port under a plausible-looking wrong country.
//
//  3. AN EMPTY PAIR IS NOT A FAILURE. Southampton->Lagos genuinely returns
//     nothing while Felixstowe->Lagos returns a full list; the asymmetry is
//     real. Only a sweep that returns nothing at all means the parser broke -
//     and even then, "every request failed" is a different fault from "every
//     response parsed to nothing", so the two throw different messages.
//
//  4. THE VESSEL IS NOT ONE SHIP. 88% of these rows are transhipments, and the
//     route-level VesselName is leg 1's UK FEEDER, not the ship that arrives.
//     Liverpool->Luanda names MSC JOY at the top, but MSC JOY only runs
//     Liverpool to Le Havre; MSC SALINA III is what berths at Luanda on the
//     published eta. Publishing the feeder against the final arrival date shows
//     a customer a named ship calling somewhere it never goes, and it defeats
//     the merge in update.mjs, which keys on vessel - the same physical sailing
//     under NMT's real ocean vessel would not collide and both rows would
//     publish. So `vessel` is the DELIVERING vessel (the last leg with a named
//     ship, which is the leg that ends at the discharge port), `voyage` is that
//     leg's voyage number, and the UK feeder moves into `notes`. Where MSC has
//     not named a delivering vessel the feeder is shown, but the note then says
//     in words that it is the feeder only - never implying end-to-end carriage.
//
// BUDGET: 4 UK ports x 99 discharge ports = 396 POSTs, three at a time with a
// pause, about 90 seconds. The four load ports are MSC's UK deep-sea calls;
// their feeder ports (Tilbury, Teesport, Immingham, Portbury) transship through
// the same Antwerp/Sines hubs and would add requests without adding lanes. The
// discharge ports are the ports src/data/destinations.ts says the business
// ships to, restricted to those MSC actually calls. Every port added to either
// list multiplies: one more load port costs 99 requests, one more destination
// costs 4. Keep the product under about 400 or the weekly run stops being cheap.
//
// VOLUME: a full sweep parses 3,283 rows (measured 2026-09-03) against the
// 1,475 already in the file - one carrier outnumbering the other nineteen
// combined and dominating every destination page and every diff report.
// Almost all of that bulk is an artefact rather than choice:
// because MSC transship nearly everything through Antwerp/Le Havre/Sines, ONE
// feeder departure from Liverpool is answered back as a separate "sailing" for
// each of 99 destinations. So the module publishes every Direct sailing (the
// scarce, genuinely different product) plus at most MAX_TRANSHIPMENTS_PER_LANE
// per load port and destination, earliest departures first - which is what a
// customer actually needs: the next few ways to get a car there. That trims
// 3,283 to 1,220 across 322 load-port/destination lanes, and after the merge
// MSC is 1,114 of 2,653 rows (42%) rather than 68% - a strong minority, which
// is the intent: it brings 11 destinations nothing else in the file serves
// without burying the RoRo carriers. The before and after counts are logged
// every run so the trim stays visible in the weekly log rather than turning up
// as a surprise in the diff.
import {
  fetchCached, ROOT, UK_PORTS, titleCase, withCountry, laneFor, daysBetween, todayISO,
} from '../lib/util.mjs';
// The source-side transit filter and the validator's gate are the same rule, so
// they are the same constant: a local copy would drift and start emitting rows
// that fail the run after the merge, where `optional` no longer protects us.
import { MAX_TRANSIT_DAYS } from '../validate.mjs';
import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const API = 'https://www.msc.com/api/feature/tools';
const PORTS_URL = `${API}/GetAllAvailableCountriesAndPorts`;
const SEARCH_URL = `${API}/SearchSailingRoutes`;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

const CONCURRENCY = 3;
// A pause between requests on each worker. Three in flight with no gap between
// them was enough to start collecting 403s from Akamai during development, and
// then to earn a block that took a quarter of an hour to clear. A weekly job is
// not in a hurry: three at a time with a quarter-second gap is about 90 seconds
// for the whole sweep.
const PAUSE_MS = 250;
// A single 403 is usually Akamai twitching rather than a decision, so one retry
// after a longer pause gets most of them back. The same backoff applies to 5xx
// and to network errors: those are the moments MSC are least happy, and
// retrying instantly is how a wobble becomes a block.
const RETRY_PAUSE_MS = 2500;
// Sustained refusals are a decision. Back off rather than dig in: a run that
// keeps hammering after that is how a soft block becomes a hard one.
const MAX_FORBIDDEN = 5;
// The same ceiling for hard failures. Without it an error storm - a DNS blip, a
// TLS reset, a 502 from a proxy - turns a 90-second sweep into a burst of 396
// requests, and it happens precisely when the origin is already struggling.
const MAX_FAILED = 20;
// No fetch() call in Node has a default timeout worth relying on: undici only
// gives up after 300s of silence, so one tarpitted socket would hold a worker
// for five minutes and a sweep of tarpits for hours - all of it in front of the
// other nineteen carriers, because update.mjs collects serially.
const REQUEST_TIMEOUT_MS = 20_000;
// And a whole-sweep ceiling, because slow is as damaging as hung. A clean run
// is about 90 seconds; six minutes means something is wrong and MSC is not
// worth the wait.
const BUDGET_MS = 6 * 60_000;
// See VOLUME at the top of the file.
const MAX_TRANSHIPMENTS_PER_LANE = 3;

const sleep = ms => new Promise(r => setTimeout(r, ms));

// MSC's UN/LOCODE -> the load-port spelling the rest of the schedule uses.
// "LONDON GATEWAY PORT" has to lose its suffix to match UK_PORTS.
const LOAD_PORTS = {
  GBFXT: 'Felixstowe',
  GBLGP: 'London Gateway',
  GBSOU: 'Southampton',
  GBLIV: 'Liverpool',
};

// Felixstowe is the UK's largest container port and MSC's main UK call, but it
// is absent from the shared UK_PORTS list because no RoRo carrier goes there.
// Widened here, the way ellerman.mjs widens it for Hull, so this source cannot
// change any other source's output.
const EXTRA_UK = /^(Felixstowe)$/i;
const isUkPort = p => UK_PORTS.test(p) || EXTRA_UK.test(p);

/**
 * Discharge ports, as MSC UN/LOCODEs. Seeded from src/data/destinations.ts -
 * the countries and ports the business actually sells - intersected with MSC's
 * port dictionary, with a substitute where MSC calls somewhere else in the same
 * country (Busan for the Korean ports, Guayaquil for Manta, Marsaxlokk for
 * Valletta, Nhava Sheva for Mumbai). Countries destinations.ts lists that MSC
 * does not serve at all are absent by necessity: Antigua, Aruba, Cayman
 * Islands, Curaçao, Guadeloupe, Martinique, St Kitts, French Guiana and
 * Equatorial Guinea are not in MSC's port list.
 */
const DESTINATIONS = [
  // West Africa
  'AOLAD', 'BJCOO', 'CMDLA', 'CGPNR', 'CIABJ', 'GMBJL', 'GHTEM', 'GNCKY',
  'MRNKC', 'MACAS', 'NGTIN', 'SNDKR', 'SLFNA', 'TGLFW',
  // East & Southern Africa
  'KEMBA', 'MGTMM', 'MUPLU', 'MZBEW', 'MZMPM', 'NAWVB', 'REPDG',
  'ZADUR', 'ZACPT', 'ZAPLZ', 'ZAELS', 'TZDAR',
  // Asia
  'BDCGP', 'CNSHA', 'CNTXG', 'HKHKG', 'INNSA', 'INENR', 'INPAV', 'IDJKT',
  'JPYOK', 'JPUKB', 'MYPKG', 'SGSIN', 'KRPUS', 'LKCMB', 'TWKEL', 'THLCH',
  // Caribbean
  'BSNAS', 'BBBGI', 'DMRSU', 'DOHAI', 'GDSTG', 'JMKIN', 'PRSJU', 'SXPHI',
  'LCCAS', 'VCKTN', 'TTPOS',
  // Europe and the Mediterranean
  'CYLMS', 'GRPIR', 'IEDUB', 'ITLIV', 'MTMAR', 'ESVGO',
  // Middle East
  'JOAQJ', 'OMSOH', 'SAJED', 'TRDRC', 'TRYAR',
  // North America
  'CAHAL', 'CAVAN', 'MXATM', 'MXVER', 'MXLZC', 'MXZLO',
  'USNYC', 'USBAL', 'USCHS', 'USJAX', 'USLGB',
  // Oceania
  'AUBNE', 'AUFRE', 'AUMEL', 'AUSYD', 'PFPPT', 'NCNOU',
  'NZAKL', 'NZLYT', 'NZNSN', 'NZWLG',
  // South and Central America
  'ARZAE', 'BRPNG', 'BRRIO', 'BRSSZ', 'BRVIX', 'CLSAI', 'COCTG', 'COTRB',
  'ECGYE', 'GYGEO', 'PAMIT', 'PECLL', 'SRPBM', 'UYMVD',
];

// MSC's country names are the long ISO forms ("TANZANIA, UNITED REPUBLIC OF",
// "TURKIYE"). The site's country pages, the destination filter and laneFor()
// all key on its own spellings, so the join goes through the ISO code.
const COUNTRY_BY_ISO = {
  AO: 'Angola', BJ: 'Benin', CM: 'Cameroon', CG: 'Congo', CI: "Côte d'Ivoire",
  GM: 'Gambia', GH: 'Ghana', GN: 'Guinea', MR: 'Mauritania', MA: 'Morocco',
  NG: 'Nigeria', SN: 'Senegal', SL: 'Sierra Leone', TG: 'Togo',
  KE: 'Kenya', MG: 'Madagascar', MU: 'Mauritius', MZ: 'Mozambique',
  NA: 'Namibia', RE: 'Réunion', ZA: 'South Africa', TZ: 'Tanzania',
  BD: 'Bangladesh', CN: 'China', HK: 'Hong Kong', IN: 'India', ID: 'Indonesia',
  JP: 'Japan', MY: 'Malaysia', SG: 'Singapore', KR: 'South Korea',
  LK: 'Sri Lanka', TW: 'Taiwan', TH: 'Thailand',
  BS: 'Bahamas', BB: 'Barbados', DM: 'Dominica', DO: 'Dominican Republic',
  GD: 'Grenada', JM: 'Jamaica', PR: 'Puerto Rico', SX: 'Sint Maarten',
  LC: 'St Lucia', VC: 'St Vincent', TT: 'Trinidad',
  CY: 'Cyprus', GR: 'Greece', IE: 'Ireland', IT: 'Italy', MT: 'Malta', ES: 'Spain',
  JO: 'Jordan', OM: 'Oman', SA: 'Saudi Arabia', TR: 'Turkey',
  CA: 'Canada', MX: 'Mexico', US: 'USA',
  AU: 'Australia', PF: 'French Polynesia', NC: 'New Caledonia', NZ: 'New Zealand',
  AR: 'Argentina', BR: 'Brazil', CL: 'Chile', CO: 'Colombia', EC: 'Ecuador',
  GY: 'Guyana', PA: 'Panama', PE: 'Peru', SR: 'Suriname', UY: 'Uruguay',
};

// Only where titleCase() alone would not produce the spelling the rest of the
// data already uses, or where MSC's name is the terminal rather than the city.
//
// The last four are the important ones and they are a deliberate merge, not a
// transliteration. MSC's port and the site's existing entry are the same call
// under two names, and publishing both spellings splits one destination into
// two on the filter and on the country pages - "Port Klang" beside the existing
// "Port Kelang" is the same berth listed twice. Nhava Sheva and Marsaxlokk were
// chosen as substitutes FOR Mumbai and Valletta, so they are published as those
// destinations rather than as rivals to them. Everything else that titleCase
// produces goes through util's withCountry() below, so a new port picks up the
// shared spelling automatically instead of inventing one here.
const PORT_NAME = {
  NGTIN: 'Lagos',            // "TINCAN/LAGOS"
  REPDG: 'Port Reunion',     // "POINTE DES GALETS"
  BDCGP: 'Chittagong',       // "CHATTOGRAM"
  ITLIV: 'Livorno',          // "LEGHORN"
  CNTXG: 'Xingang (Tianjin)',
  IDJKT: 'Jakarta',          // "JAKARTA, JAVA"
  JOAQJ: 'Aqaba',            // "AL 'AQABAH"
  GDSTG: "St George's",      // "SAINT GEORGE'S"
  VCKTN: 'Kingstown',        // "KINGSTOWN, ST VINCENT"
  TTPOS: 'Port of Spain',    // "PORT-OF-SPAIN"
  TZDAR: 'Dar es Salaam',    // titleCase would give "Dar Es Salaam"
  BRRIO: 'Rio de Janeiro',   // titleCase would give "Rio De Janeiro"
  INPAV: 'Pipavav',          // "PIPAVAV (VICTOR) PORT"
  MYPKG: 'Port Kelang',      // "PORT KLANG (PELABUHAN KLANG)" - the data's spelling
  INNSA: 'Mumbai',           // Nhava Sheva IS the site's Mumbai call
  MTMAR: 'Valletta',         // Marsaxlokk is Malta's box terminal for Valletta
  DOHAI: 'Santo Domingo',    // Rio Haina is Santo Domingo's port
};

export const name = 'MSC';
// Lift-on/lift-off container, not RoRo: the car travels in a box and the
// loading requirements and transit are different from a vehicle carrier's.
export const service = 'container';
// See the block at the top of this file. Removing this flag lets an Akamai
// block on one carrier fail the whole weekly refresh.
export const optional = true;
export const url = 'https://www.msc.com/en/search-a-schedule';

// --- transport -------------------------------------------------------------

const CACHE = join(ROOT, '.cache');

/**
 * fetchCached only speaks GET, and this endpoint is POST-only in production
 * (a GET with the params as a query string returns a 500 page). Same idea and
 * the same cache directory, keyed on the request body so a re-run during
 * development replays instead of hammering them.
 *
 * Returns { text, cached } so the run log can tell replays from real traffic.
 */
async function postCached(body, { maxAgeMinutes = 60 } = {}) {
  mkdirSync(CACHE, { recursive: true });
  const key = `msc_${Object.entries(body).map(([k, v]) => `${k}-${v}`).join('_')}`.replace(/[^a-z0-9_-]+/gi, '_');
  const file = join(CACHE, key.slice(-120));

  if (existsSync(file) && maxAgeMinutes > 0) {
    if ((Date.now() - statSync(file).mtimeMs) / 60000 < maxAgeMinutes) {
      return { text: readFileSync(file, 'utf8'), cached: true };
    }
  }

  const res = await fetch(SEARCH_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/plain, */*',
      'accept-language': 'en-GB,en;q=0.9',
      // Trap 1. Drop this and the endpoint answers 200 with a body of `""`.
      'x-requested-with': 'XMLHttpRequest',
      'User-Agent': UA,
    },
    body: JSON.stringify(body),
    // Without this a stalled socket holds the worker for undici's 300s, and
    // 396 of those would be most of a working day in front of the rest of the
    // weekly run. See REQUEST_TIMEOUT_MS.
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
  const text = await res.text();
  // Never cache the silent empty: it is a bug in the request, and a cached copy
  // would keep failing the run for an hour after the request was fixed.
  if (text.trim() && text.trim() !== '""') writeFileSync(file, text);
  return { text, cached: false };
}

/**
 * Yesterday's cache entries are unreachable, not stale: FromDate is part of the
 * key, so every run writes a fresh set of ~400 files (14 MB) that will never be
 * read again. Unpruned that is roughly 20,000 files and 700 MB a year in a
 * directory nobody looks at. util's fetchCached is keyed on URL and so
 * self-limits; this one has to sweep up after itself.
 */
function pruneCache(fromDate, log) {
  if (!existsSync(CACHE)) return;
  let removed = 0;
  for (const f of readdirSync(CACHE)) {
    if (!f.startsWith('msc_') || f.includes(`FromDate-${fromDate}`)) continue;
    try { rmSync(join(CACHE, f)); removed++; } catch { /* a locked file is not worth failing over */ }
  }
  if (removed) log(`  pruned ${removed} unreachable cache entries from earlier FromDates`);
}

/**
 * Run `worker` over `items` a few at a time, in order-independent fashion.
 *
 * A throw stops every worker rather than one: the alternative is collect()
 * rejecting while two workers carry on hammering MSC for another 130 pairs,
 * long after update.mjs has moved on to the next carrier.
 */
async function pool(items, limit, worker) {
  let next = 0;
  let err = null;
  const run = async () => {
    while (next < items.length && !err) {
      try {
        await worker(items[next++]);
      } catch (e) {
        err ??= e;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  if (err) throw err;
}

// --- parsing ---------------------------------------------------------------

// Anything that is not exactly YYYY-MM-DD is refused rather than passed on.
// A blind slice(0, 10) is silently catastrophic in both directions: "04/09/2026
// 17:00" would sort below "2026-01-01" and validateAll would quietly discard
// every MSC row as a stale pre-2026 WARNING while still writing the file, and
// "2026-9-4T17:00" would slice to "2026-9-4T1" and fail validateAll as an
// ERROR - after the merge, where `optional` no longer applies, taking the whole
// weekly run down. Refusing here means a date-format drift can only ever empty
// MSC, which degrades one optional source and nothing else.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isoDate = d => {
  const s = typeof d === 'string' ? d.slice(0, 10) : '';
  return ISO_DATE.test(s) ? s : '';
};

// titleCase() is what every other source uses and is right for "MSC MONTEREY V"
// -> "Msc Monterey V" everywhere except the operator prefix: the existing data
// spells these "MSC Abidjan", and a slot charter on someone else's ship keeps
// their prefix too. A closed list rather than "first word is short and
// capitalised", which would mangle a genuine word ("SEA TRADER").
const VESSEL_PREFIX = /^(MSC|APL|GSL|HMM|ONE|SCI|WEC|YM|OOCL|COSCO|CMA CGM)\b/;
// MSC run a lot of "III" ships (SALINA III, NEDERLAND III, RINI III) and
// titleCase turns a roman numeral into "Iii". Harmless in the other sources
// because none of their vessels carry one; here it would be on the face of
// hundreds of rows, so the numeral is put back.
const ROMAN_SUFFIX = /\b(I{2,3}|IV|VI{0,3}|IX|XI{0,2})$/i;
const vesselName = raw => {
  const cased = titleCase(String(raw || ''));
  const prefix = (cased.toUpperCase().match(VESSEL_PREFIX) || [])[0];
  const kept = prefix ? prefix + cased.slice(prefix.length) : cased;
  return kept.replace(ROMAN_SUFFIX, n => n.toUpperCase());
};

// "TBN" is To Be Nominated - the slot exists but the ship does not yet. The
// validator only asks for a non-empty vessel, and a placeholder would satisfy
// it while telling a customer nothing, so those rows are dropped (same rule as
// dfds.mjs and its unnamed ro-pax departures).
const TBN = /^TBN$/i;
const named = v => v && !TBN.test(v);

/**
 * Who actually carries the box, and who hands it over.
 *
 * Legs read "arrive at this port, leave it again on this ship": leg 1 leaves
 * the UK, each later leg is a hub call, and the final leg is a terminator with
 * only the arrival at the discharge port - no vessel, no departure. So the ship
 * that berths at the destination is the last leg that names one, and leg 1 is
 * the UK feeder. On a Direct sailing they are the same leg, which is why this
 * needs no special case for it.
 *
 * See trap 4. `voyage` comes from the same leg as the vessel, because a
 * delivering ship quoted with the feeder's voyage number is the same class of
 * mismatch this exists to fix.
 */
function carriage(route) {
  const legs = Array.isArray(route.RouteScheduleLegDetails) ? route.RouteScheduleLegDetails : [];
  const withVessel = legs.filter(l => l && named(vesselName(l.Vessel?.VesselName)));
  const first = withVessel[0];
  const last = withVessel[withVessel.length - 1];

  const feeder = vesselName(first?.Vessel?.VesselName || route.VesselName);
  const feederVoyage = String(first?.DepartureVoyageNo || route.DepartureVoyageNo || '').trim();
  // Only a leg AFTER the UK one can be the delivering ship on a transhipment;
  // if MSC name no onward vessel we must not pretend leg 1 is it.
  const onward = withVessel.length > 1 ? last : null;

  return {
    feeder,
    feederVoyage,
    delivering: onward ? vesselName(onward.Vessel.VesselName) : '',
    deliveringVoyage: onward ? String(onward.DepartureVoyageNo || '').trim() : '',
    // The hubs a customer should know the box passes through: every leg after
    // the UK one that actually departs somewhere (the terminator does not).
    hubs: [...new Set(legs.slice(1)
      .filter(l => l?.DeparturePortName && l.EstimatedDepartureTime)
      .map(l => titleCase(l.DeparturePortName)))],
  };
}

export async function collect({ log = () => {}, fresh = false } = {}) {
  const fromDate = todayISO();
  pruneCache(fromDate, log);

  // Trap 2: fetched every run, because the country join depends on it.
  const dict = JSON.parse(await fetchCached(PORTS_URL, {
    binary: false,
    maxAgeMinutes: fresh ? 0 : 720,
    timeoutMs: REQUEST_TIMEOUT_MS,
  }));
  const ports = dict.Ports || [];
  if (!ports.length) throw new Error('MSC: port dictionary is empty - endpoint changed?');
  const byCode = new Map(ports.map(p => [p.LocationCode, p]));
  const byId = new Map(ports.map(p => [p.PortId, p]));

  const loads = Object.keys(LOAD_PORTS).map(code => {
    const p = byCode.get(code);
    if (!p) throw new Error(`MSC: load port ${code} has vanished from the port dictionary`);
    return { code, id: p.PortId };
  });
  const dests = DESTINATIONS.map(code => {
    const p = byCode.get(code);
    if (!p) { log(`  ${code} is no longer in MSC's port list - skipped`); return null; }
    return { code, id: p.PortId, country: COUNTRY_BY_ISO[p.CountryIsoCode] || '', name: PORT_NAME[code] || titleCase(p.LocationName) };
  }).filter(Boolean);

  const pairs = [];
  for (const from of loads) for (const to of dests) pairs.push({ from, to });
  log(`  ${loads.length} UK ports x ${dests.length} destinations = ${pairs.length} pairs`);

  const sailings = [];
  // Earliest arrival wins where MSC lists one ship leaving one port on one day
  // for one destination on two services.
  const best = new Map();
  const unresolved = new Set();
  const clashes = new Set();
  const deadline = Date.now() + BUDGET_MS;
  let fetched = 0, cached = 0, served = 0, empty = 0, failed = 0, forbidden = 0, retried = 0;
  let tooLong = 0, unnamed = 0, badDates = 0, mismatched = 0, feederShown = 0;
  let blocked = false, overBudget = false;
  // A malformed response means the endpoint has changed and every remaining
  // request would be wasted, so it stops the sweep rather than throwing out of
  // one worker and leaving the other two hammering MSC after collect() returned.
  let fatal = null;

  await pool(pairs, CONCURRENCY, async ({ from, to }) => {
    if (blocked || fatal || overBudget) return;
    if (Date.now() > deadline) { overBudget = true; return; }

    // Structural containment, not per-shape: whatever the endpoint returns
    // next year, an unanticipated shape must stop the sweep with a message
    // naming the pair, never escape as a raw TypeError while two other workers
    // keep going.
    try {
      const payload = { FromDate: fromDate, fromPortId: from.id, toPortId: to.id };
      const age = { maxAgeMinutes: fresh ? 0 : 60 };
      let text, hitNetwork = false;
      const count = r => { r.cached ? cached++ : (fetched++, hitNetwork = true); return r.text; };
      try {
        try {
          text = count(await postCached(payload, age));
        } catch (e) {
          hitNetwork = true;
          // One retry, after a real pause, for the things that are usually
          // transient: Akamai twitching, a 5xx, a dropped connection.
          if (e.status && e.status !== 403 && e.status < 500) throw e;
          retried++;
          await sleep(RETRY_PAUSE_MS);
          text = count(await postCached(payload, age));
        }
      } catch (e) {
        if (e.status === 403) {
          forbidden++;
          if (forbidden >= MAX_FORBIDDEN) blocked = true;
        } else {
          failed++;
          if (failed >= MAX_FAILED) blocked = true;
        }
        return;
      } finally {
        // The pause belongs in a finally, not after the successful request: a
        // failure is exactly when MSC least wants another request straight
        // away, and pacing only the happy path is what turns a 5xx wobble into
        // a 400-request burst at the moment the origin is already unhappy.
        // A replay off the disk cache is not traffic, so it is not paced.
        if (hitNetwork) await sleep(PAUSE_MS);
      }

      // Trap 1: `""` is a 200 with no data, and it means the request shape is
      // wrong rather than the pair being unserved. Fail loudly.
      const body = text.trim();
      if (!body || body === '""') {
        fatal = new Error('MSC: 200 with an empty body - the x-requested-with header is missing or no longer sufficient');
        return;
      }
      let json;
      try {
        json = JSON.parse(body);
      } catch {
        fatal = new Error(`MSC: ${from.code}->${to.code} returned non-JSON (${body.slice(0, 60)}) - endpoint changed?`);
        return;
      }
      if (typeof json !== 'object' || json === null) {
        fatal = new Error(`MSC: ${from.code}->${to.code} answered ${JSON.stringify(json)}, not a result object - endpoint changed?`);
        return;
      }
      // Trap 3: a legitimate "we do not serve this pair".
      if (!json.IsSuccess) { empty++; return; }
      if (!Array.isArray(json.Data)) {
        fatal = new Error(`MSC: ${from.code}->${to.code} returned Data as ${typeof json.Data}, not an array - endpoint changed?`);
        return;
      }
      served++;

      for (const group of json.Data) {
        // The crawl is point to point, so a group for a port we did not ask
        // about means the endpoint is answering something else - do not quietly
        // publish it under this pair.
        if (group.PortOfDischargeUnCode && group.PortOfDischargeUnCode !== to.code) { mismatched++; continue; }
        if (!Array.isArray(group.Routes)) {
          fatal = new Error(`MSC: ${from.code}->${to.code} returned Routes as ${typeof group.Routes}, not an array - endpoint changed?`);
          return;
        }

        // The route payload has no country, so resolve it from the dictionary -
        // by the id MSC returned, not by the one we asked for. No fallback to
        // the requested country: that would file whatever port came back under
        // a country nobody checked (trap 2).
        const dischargePort = byId.get(group.PortOfDischargeId) || byCode.get(group.PortOfDischargeUnCode);
        const country = dischargePort ? COUNTRY_BY_ISO[dischargePort.CountryIsoCode] : '';
        if (!country) { unresolved.add(group.PortOfDischargeUnCode || String(group.PortOfDischargeId)); continue; }
        const portName = group.PortOfDischargeUnCode === to.code
          ? to.name
          : PORT_NAME[group.PortOfDischargeUnCode] || titleCase(group.PortOfDischarge || dischargePort?.LocationName || '');
        if (!portName) { unresolved.add(String(group.PortOfDischargeId)); continue; }
        // Through the shared alias layer, like every other source: it is what
        // keeps one physical port from appearing twice on the destination
        // filter under two carriers' spellings, and it is what turns util's
        // aliases (bare "Reunion" -> "Port Reunion, Réunion") into the same
        // string the RoRo carriers publish. Our ISO join stays the authority on
        // the country, so util's answer is only taken when the two agree; a
        // disagreement is logged rather than silently resolved either way.
        const viaUtil = withCountry(portName);
        let destination = `${portName}, ${country}`;
        if (viaUtil.includes(',')) {
          if (viaUtil.endsWith(`, ${country}`)) destination = viaUtil;
          else clashes.add(`${portName} (MSC says ${country}, util says ${viaUtil.split(',').pop().trim()})`);
        }

        const loadName = LOAD_PORTS[group.PortOfLoadUnCode] || titleCase(group.PortOfLoad || '');
        if (!isUkPort(loadName)) continue;
        const direct = group.RoutingType === 'Direct';

        for (const route of group.Routes) {
          const ets = isoDate(route.EstimatedDepartureDate);
          const eta = isoDate(route.EstimatedArrivalDate);
          if ((route.EstimatedDepartureDate && !ets) || (route.EstimatedArrivalDate && !eta)) badDates++;

          // Trap 4. Publish the ship that actually berths at the discharge port
          // on the eta beside it; the UK feeder goes in the note.
          const { feeder, feederVoyage, delivering, deliveringVoyage, hubs } = carriage(route);
          const via = hubs.length ? `transhipment via ${hubs.join(', ')}` : 'transhipment';
          let vessel = delivering;
          let voyage = deliveringVoyage;
          let notes = '';
          if (direct) {
            // One ship, one leg: the feeder IS the delivering vessel.
            vessel = delivering || feeder;
            voyage = deliveringVoyage || feederVoyage;
          } else if (delivering) {
            notes = `Feeder ${feeder} from ${loadName}, ${via}`;
          } else {
            // MSC have not named the onward ship. Show the feeder rather than
            // nothing, but say in words that it only runs the first leg - never
            // let a vessel imply a call it does not make.
            vessel = feeder;
            voyage = feederVoyage;
            notes = `Feeder ${feeder} from ${loadName}, ${via} - MSC has not named the delivering vessel, so the vessel shown carries the UK leg only`;
          }

          if (!named(vessel)) { unnamed++; continue; }
          if (!ets || !eta || eta < ets) continue;
          if (daysBetween(ets, eta) > MAX_TRANSIT_DAYS) { tooLong++; continue; }
          // Counted here rather than above so the log describes rows that were
          // published, not ones dropped a line later for having no ship at all.
          if (!direct && !delivering) feederShown++;

          const key = `${vessel}|${loadName}|${destination}|${ets}`.toLowerCase();
          const prev = best.get(key);
          if (prev && prev.eta <= eta) continue;
          const row = prev ? prev.row : {};
          Object.assign(row, {
            loadPort: loadName,
            destination,
            vessel,
            voyage,
            carrier: 'MSC',
            ets,
            eta,
            lane: laneFor(destination),
            notes,
            _direct: direct,
          });
          if (prev) prev.eta = eta;
          else { best.set(key, { eta, row }); sailings.push(row); }
        }
      }
    } catch (e) {
      fatal ??= new Error(`MSC: ${from.code}->${to.code} failed to parse: ${e.message}`);
    }
  });

  if (fatal) throw fatal;
  if (blocked && forbidden >= MAX_FORBIDDEN) log(`  stopped early: ${forbidden} requests refused (403) - Akamai is scoring this client`);
  if (blocked && failed >= MAX_FAILED) log(`  stopped early: ${failed} requests failed - MSC is not answering properly, backing off`);
  if (overBudget) log(`  stopped early: exceeded the ${BUDGET_MS / 60000}-minute budget for this source`);
  if (unresolved.size) log(`  no country resolved for: ${[...unresolved].join(', ')} - dropped`);
  if (mismatched) log(`  ${mismatched} groups answered for a port that was not asked for - dropped`);
  if (clashes.size) log(`  country disagrees with lib/util.mjs for: ${[...clashes].join(', ')} - MSC's ISO code used`);
  if (badDates) log(`  ${badDates} rows with an unparseable date dropped - has MSC's date format changed?`);
  if (tooLong) log(`  ${tooLong} routes over ${MAX_TRANSIT_DAYS} days transit dropped`);
  if (unnamed) log(`  ${unnamed} routes on a TBN (not yet nominated) vessel dropped`);
  if (feederShown) log(`  ${feederShown} transhipments have no delivering vessel named - feeder shown, and said so in the notes`);
  log(`  ${fetched} fetched${cached ? `, ${cached} from cache` : ''}, ${served} pairs served, ${empty} not served` +
      `${retried ? `, ${retried} retried` : ''}` +
      `${failed ? `, ${failed} failed` : ''}${forbidden ? `, ${forbidden} refused` : ''} -> ${sailings.length} sailings parsed`);

  // A lane that laneFor() does not know is published under the catch-all
  // 'Europe export', which passes validation and then looks like a junk
  // category on the site. Name them so the next gap is visible in the run log
  // rather than only on the page.
  const unlaned = [...new Set(sailings.filter(s => s.lane === 'Europe export').map(s => s.destination))];
  if (unlaned.length) log(`  no trade lane mapped for: ${unlaned.join(', ')} - add them to LANE_BY_COUNTRY in lib/util.mjs`);

  if (!sailings.length) {
    // Say what actually happened. "The API changed" sends someone to read a
    // parser that is fine when the truth is that nothing ever answered.
    throw new Error(
      blocked && forbidden >= MAX_FORBIDDEN ? 'MSC: blocked by bot management before anything parsed'
      : failed >= MAX_FAILED || (failed && !served) ? `MSC: every request failed (${failed} errors) - MSC unreachable, not a parser fault`
      : overBudget ? 'MSC: ran out of time before anything parsed'
      : 'MSC: no sailings parsed - API changed');
  }

  // See VOLUME at the top. Every direct sailing, plus the next few
  // transhipments per load port and destination - the rest are the same feeder
  // departure restated for another destination.
  const lanes = new Map();
  for (const row of sailings) {
    const k = `${row.loadPort}|${row.destination}`.toLowerCase();
    if (!lanes.has(k)) lanes.set(k, []);
    lanes.get(k).push(row);
  }
  const published = [];
  let directCount = 0;
  for (const rows of lanes.values()) {
    const direct = rows.filter(r => r._direct);
    const trans = rows.filter(r => !r._direct)
      .sort((a, b) => a.ets.localeCompare(b.ets) || a.eta.localeCompare(b.eta));
    directCount += direct.length;
    published.push(...direct, ...trans.slice(0, MAX_TRANSHIPMENTS_PER_LANE));
  }
  log(`  ${sailings.length} parsed -> ${published.length} published ` +
      `(${directCount} direct, plus up to ${MAX_TRANSHIPMENTS_PER_LANE} transhipments per load port and destination; ` +
      `${sailings.length - published.length} later transhipments dropped)`);

  return published.map(({ _direct, ...row }) => row);
}
