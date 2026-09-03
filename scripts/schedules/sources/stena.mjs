// Stena Line - Holyhead to Dublin and Fishguard to Rosslare, via the
// passenger site's timetable JSON.
//
// The freight site's timetable search sits behind their extranet (the public
// POST 404s), but these are ro-pax routes: the same departures carry freight
// and passengers, and the passenger route pages publish them as plain AEM
// JSON - /routes/<slug>/_jcr_content.timetable.<CODE>.<date>.json - one day
// per request, no session. Route codes come from watching the page, not the
// markup: HHDB and FIRO (not the FGRL you would guess).
//
// The horizon is deliberately shorter than the Channel Islands sources': at
// four departures a day, 120 days of Holyhead-Dublin would be ~480 rows and
// drown the weekly deep-sea lanes this table exists for. Six weeks covers any
// realistic booking window at ~2 requests a day of tiny JSON.
import { laneFor } from '../lib/util.mjs';

const ROUTES = [
  { slug: 'holyhead-dublin', code: 'HHDB', loadPort: 'Holyhead', destination: 'Dublin, Ireland' },
  { slug: 'fishguard-rosslare', code: 'FIRO', loadPort: 'Fishguard', destination: 'Rosslare, Ireland' },
];

const HORIZON_DAYS = 42;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36';

const sleep = ms => new Promise(r => setTimeout(r, ms));

export const name = 'Stena Line';
export const service = 'roro';
export const url = 'https://www.stenaline.co.uk/routes/holyhead-dublin/timetable';

export async function collect({ log = () => {} } = {}) {
  const sailings = [];

  for (const route of ROUTES) {
    let kept = 0, failed = 0;
    for (let i = 0; i < HORIZON_DAYS; i++) {
      const date = new Date(Date.now() + i * 864e5).toISOString().slice(0, 10);
      let list;
      try {
        const res = await fetch(
          `https://www.stenaline.co.uk/routes/${route.slug}/_jcr_content.timetable.${route.code}.${date}.json`,
          { headers: { 'User-Agent': UA } },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        list = await res.json();
      } catch {
        failed++;
        continue;
      }
      await sleep(80);

      for (const s of Array.isArray(list) ? list : []) {
        const ets = (s.localDepartureTime || '').slice(0, 10);
        const eta = (s.localArrivalTime || '').slice(0, 10);
        if (!ets || !eta || eta < ets || !s.ferryName) continue;
        sailings.push({
          loadPort: route.loadPort,
          destination: route.destination,
          vessel: s.ferryName,
          voyage: '',
          carrier: 'Stena Line',
          ets,
          eta,
          lane: laneFor(route.destination),
          notes: '',
        });
        kept++;
      }
    }
    log(`  ${route.loadPort} -> ${route.destination}: ${kept} sailings${failed ? ` (${failed} days failed)` : ''}`);
  }

  if (!sailings.length) throw new Error('Stena: no sailings parsed - endpoint changed');
  return sailings;
}
