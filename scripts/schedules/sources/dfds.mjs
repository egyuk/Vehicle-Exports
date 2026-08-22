// DFDS - Portsmouth and Poole to Jersey, via the freight site's timetable API.
//
// The route pages render a "Dynamic schedule" from
// /api/timetable?dateFrom=&dateTo=&portOfLoading=&portOfDischarge=, keyed on
// UN/LOCODEs. It is public JSON, no session or key.
//
// DFDS' wider network is Dover/Immingham/Felixstowe into North Europe, which
// the destination rules exclude as rotation legs. What is worth having is the
// Channel Islands freight service, which no deep-sea carrier covers: DFDS run
// Jersey, and Condor run Guernsey (see condor.mjs).
//
// Note their field naming: `vehicleName` is the *vessel*, and `vehicleId` is
// its IMO number. Some ro-pax departures leave it null, so those rows are
// dropped - the validator requires a vessel and a blank one helps nobody.
import { titleCase, laneFor } from '../lib/util.mjs';

const API = 'https://www.dfds.com/api/timetable';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36';

// UK load port -> discharge port. Only pairs that actually return sailings;
// DFDS' other UK routes all terminate in excluded North European countries.
const ROUTES = [
  { pol: 'GBPME', polName: 'Portsmouth', pod: 'JESTH', podName: 'St Helier, Jersey' },
  { pol: 'GBPOO', polName: 'Poole', pod: 'JESTH', podName: 'St Helier, Jersey' },
];

const HORIZON_DAYS = 120;

export const name = 'DFDS';
export const url = 'https://www.dfds.com/en-gb/freight-ferries-and-logistics/routes-and-schedules';

export async function collect({ log = () => {} } = {}) {
  const dateFrom = new Date().toISOString();
  const dateTo = new Date(Date.now() + HORIZON_DAYS * 864e5).toISOString();

  const sailings = [];
  for (const route of ROUTES) {
    const qs = new URLSearchParams({ dateFrom, dateTo, portOfLoading: route.pol, portOfDischarge: route.pod });
    let list;
    try {
      const res = await fetch(`${API}?${qs}`, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      list = await res.json();
    } catch (e) {
      log(`  ${route.polName} -> ${route.podName}: fetch failed (${e.message.slice(0, 40)})`);
      continue;
    }
    if (!Array.isArray(list)) throw new Error('DFDS: timetable did not return a list - API changed?');

    let kept = 0, unnamed = 0;
    for (const s of list) {
      const ets = (s.scheduledDeparture || '').slice(0, 10);
      const eta = (s.scheduledArrival || '').slice(0, 10);
      if (!ets || !eta || eta < ets) continue;
      if (!s.vehicleName) { unnamed++; continue; }
      sailings.push({
        loadPort: route.polName,
        destination: route.podName,
        vessel: titleCase(s.vehicleName),
        voyage: String(s.transportId || ''),
        carrier: 'DFDS',
        ets,
        eta,
        lane: laneFor(route.podName),
        notes: '',
      });
      kept++;
    }
    log(`  ${route.polName} -> ${route.podName}: ${kept} sailings${unnamed ? ` (${unnamed} without a named vessel, dropped)` : ''}`);
  }

  if (!sailings.length) throw new Error('DFDS: no sailings parsed - API changed');
  return sailings;
}
