// Condor Ferries - Poole and Portsmouth to Guernsey, via the timetable
// widget's own JSON endpoint.
//
// /Umbraco/Api/Timetable/GetSailings?route=&date=&dayCount= is public JSON and
// answers headless. Prefer it over the site's PDF timetables: those publish a
// thin sample (eight UK-Guernsey sailings spread across a year) where the API
// returns the real near-daily service, and a schedule that understates
// frequency is worse than none - a customer would read it as "no space".
//
// There is no direct UK-Jersey service: POJE/PMJE/UKJE all return nothing, and
// Condor route Jersey traffic through Guernsey. Only the direct UK legs are
// published here rather than stitching a UK-Guernsey arrival to a
// Guernsey-Jersey departure, which would invent a through-journey Condor does
// not sell. DFDS carry Jersey direct from Portsmouth (see dfds.mjs).
import { titleCase, laneFor } from '../lib/util.mjs';

const API = 'https://www.condorferries.co.uk/Umbraco/Api/Timetable/GetSailings';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36';

// Route codes are origin+destination pairs from the timetable dropdown.
const ROUTES = [
  { code: 'POGU', loadPort: 'Poole' },
  { code: 'PMGU', loadPort: 'Portsmouth' },
];

const PORT_NAME = { GU: 'St Peter Port, Guernsey' };
// The site's own vesselNameFromID filter is stale (it still maps the retired
// Rapide and Liberation), so the current fleet is mapped here from their
// fleet page. An unknown code keeps its raw form rather than being guessed.
const VESSEL_NAME = { VOY: 'Condor Voyager', ISL: 'Condor Islander' };

const HORIZON_DAYS = 120;

export const name = 'Condor Ferries';
export const url = 'https://www.condorferries.co.uk/ferry-routes-ports/plan-your-journey/timetables';

export async function collect({ log = () => {} } = {}) {
  const date = new Date().toISOString().slice(0, 10);
  const sailings = [];

  for (const route of ROUTES) {
    let list;
    try {
      const res = await fetch(`${API}?route=${route.code}&date=${date}&dayCount=${HORIZON_DAYS}`, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      list = await res.json();
    } catch (e) {
      log(`  ${route.code}: fetch failed (${e.message.slice(0, 40)})`);
      continue;
    }
    if (!Array.isArray(list)) throw new Error('Condor: GetSailings did not return a list - API changed?');

    let kept = 0;
    for (const s of list) {
      const ets = (s.originDepartureTime || '').slice(0, 10);
      const eta = (s.destinationArrivalTime || '').slice(0, 10);
      if (!ets || !eta || eta < ets) continue;
      const destination = PORT_NAME[s.destinationPortID];
      if (!destination) continue;
      sailings.push({
        loadPort: route.loadPort,
        destination,
        vessel: VESSEL_NAME[s.originVesselID] || titleCase(String(s.originVesselID || '')),
        voyage: '',
        carrier: 'Condor Ferries',
        ets,
        eta,
        lane: laneFor(destination),
        // changePortID is set when the journey tranships (their St Malo
        // service goes via Guernsey); say so rather than implying it is direct.
        notes: s.changePortID ? `Transhipment at ${s.changePortID}` : '',
      });
      kept++;
    }
    log(`  ${route.code} (${route.loadPort} -> Guernsey): ${kept} sailings`);
  }

  if (!sailings.length) throw new Error('Condor: no sailings parsed - API changed');
  return sailings;
}
