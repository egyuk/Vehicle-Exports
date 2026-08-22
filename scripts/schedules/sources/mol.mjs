// MOL ACE (Mitsui O.S.K. Lines) - voyage rotations via the schedule search's
// own ajax endpoints on molace.com.
//
// Three-step flow, all plain POSTs with no session:
//   1. LocationLOV resolves each UK port name to MOL's port codes. One name
//      can own several codes (GBSOU plus GBSOUPT, the PCC berth) and some are
//      tombstones - skip any whose PortName says "DO NOT USE".
//   2. GetAjaxSearchResult with an LPCode and ETAFromDt (dd-MMM-yyyy) lists
//      future UK load calls, each naming a vessel and voyage.
//   3. The same endpoint with VoyName returns that voyage's full rotation,
//      every call flagged (L) or (D) - so load/discharge pairing is stated by
//      the carrier, not inferred from geography.
//
// The search keeps years of history (2019 calls sit next to next month's), so
// the date filter and a client-side re-check both matter.
import { NORTH_EUROPE, UK_PORTS, MONTHS, withCountry, titleCase, laneFor } from '../lib/util.mjs';

const BASE = 'https://www.molace.com';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'X-Requested-With': 'XMLHttpRequest',
  Referer: `${BASE}/VslVoy/VslVoySchedule/Index`,
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Port names whose LOV lookup is worth trying: the site's UK load ports.
const UK_NAMES = [
  'Southampton', 'Bristol', 'Sheerness', 'Tilbury', 'Liverpool', 'Immingham',
  'Teesport', 'Grimsby', 'Killingholme', 'Newcastle', 'Portsmouth', 'Portbury',
];

/** "20-Aug-2026 11:00 AM" -> 2026-08-20 */
const molDateToISO = d => {
  const m = String(d).match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
  if (!m) return null;
  const mm = MONTHS[m[2].toLowerCase()];
  return mm ? `${m[3]}-${mm}-${m[1].padStart(2, '0')}` : null;
};

const todayMol = () => {
  const d = new Date();
  const mon = Object.entries(MONTHS).find(([, v]) => v === String(d.getMonth() + 1).padStart(2, '0'))[0];
  return `${String(d.getDate()).padStart(2, '0')}-${mon[0].toUpperCase()}${mon.slice(1)}-${d.getFullYear()}`;
};

async function post(path, params) {
  const res = await fetch(BASE + path, { method: 'POST', headers: HEADERS, body: new URLSearchParams(params) });
  if (!res.ok) throw new Error(`MOL: ${path} returned ${res.status}`);
  return res.text();
}

const EMPTY_SEARCH = {
  VslName: '', VslCode: '', VoyName: '', VoyNo: '', LPName: '', LPCode: '',
  DPName: '', DPCode: '', ETAFromDt: '', ETAToDt: '',
  OrderAscDesc: 'asc', OrderBy: '', PageIndex: '1', PageSize: '200', cacheID: '',
};

/** Search result rows: [vessel, voyage, line, port, arrival, departure]. */
async function searchRows(params) {
  const html = await post('/vslvoy/VslVoySchedule/GetAjaxSearchResult', { ...EMPTY_SEARCH, ...params });
  return (html.match(/<tr[\s\S]*?<\/tr>/gi) || [])
    .map(tr => [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()))
    .filter(c => c.length === 6);
}

/** "WALVIS BAY - PORT/FACILITY (D)" -> { city: "Walvis Bay", flag: "D" } */
function parsePort(text) {
  const flag = (text.match(/\((L\/D|L|D)\)\s*$/) || [])[1] || '';
  const city = titleCase(text.replace(/\((L\/D|L|D)\)\s*$/, '').split(' - ')[0].trim())
    .replace(/\bEs\b/g, 'es'); // Dar es Salaam
  return { city, flag };
}

export const name = 'MOL ACE';
export const url = 'https://www.molace.com/VslVoy/VslVoySchedule/Index';

export async function collect({ log = () => {} } = {}) {
  // 1. UK port codes from the LOV.
  const codes = new Map();
  for (const nm of UK_NAMES) {
    let list;
    try {
      list = JSON.parse(await post('/vslvoy/VslVoySchedule/LocationLOV', { VslCode: '', VoyNo: '', LoadOrDischargeFlg: 'L', SearchText: nm }) || '[]');
    } catch { continue; }
    for (const p of list || []) {
      if (p.PortCode?.startsWith('GB') && !/DO NOT USE/i.test(p.PortName)) codes.set(p.PortCode, p.PortName);
    }
    await sleep(100);
  }
  if (!codes.size) throw new Error('MOL: LocationLOV returned no UK ports - endpoint changed?');
  log(`  ${codes.size} UK port codes`);

  // 2. Future UK load calls -> voyages.
  const voyages = new Map();
  for (const [code, pname] of codes) {
    for (const row of await searchRows({ LPName: pname, LPCode: code, ETAFromDt: todayMol() })) {
      if (!voyages.has(row[1])) voyages.set(row[1], row[0]);
    }
    await sleep(100);
  }
  log(`  ${voyages.size} upcoming voyages with a UK call`);

  // 3. Each voyage's rotation, paired (L) -> later (D).
  const sailings = [];
  const today = new Date().toISOString().slice(0, 10);
  for (const [voyage, vessel] of voyages) {
    const rotation = await searchRows({ VslName: vessel, VoyName: voyage });
    await sleep(100);

    for (let i = 0; i < rotation.length; i++) {
      const { city: fromCity, flag: fromFlag } = parsePort(rotation[i][3]);
      if (!fromFlag.includes('L') || !UK_PORTS.test(fromCity)) continue;
      const ets = molDateToISO(rotation[i][5]) || molDateToISO(rotation[i][4]);
      if (!ets || ets < today) continue;

      for (let j = i + 1; j < rotation.length; j++) {
        const { city, flag } = parsePort(rotation[j][3]);
        const eta = molDateToISO(rotation[j][4]);
        if (!flag.includes('D') || !eta || eta <= ets) continue;
        if (UK_PORTS.test(city) || NORTH_EUROPE.test(city)) continue;
        const destination = withCountry(city);
        sailings.push({
          loadPort: fromCity,
          destination,
          vessel: titleCase(vessel),
          voyage: voyage.replace(vessel, '').trim(),
          carrier: 'MOL ACE',
          ets,
          eta,
          lane: laneFor(destination),
          notes: '',
        });
      }
    }
  }

  if (!sailings.length) throw new Error('MOL: no sailings parsed - layout changed');
  log(`  -> ${sailings.length} UK sailings`);
  return sailings;
}
