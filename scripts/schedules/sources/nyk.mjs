// NYK RoRo - vessel rotations via the WordPress theme's ajax endpoint.
//
// The schedules page is WordPress; its port-pair search rarely returns direct
// sailings, but the vessel search exposes everything. Flow per vessel:
//   1. vessel names scraped from the page's <select id="seVesselName">
//   2. action=vesselNums    -> voyage numbers for the vessel
//   3. action=vesselSearch  -> voyageId
//   4. action=showDetails   -> HTML rotation table (port / arrive / depart)
//
// Dates in the rotation HTML have no year on each row - a single year header
// (e.g. "2026") precedes the ports, so the year is carried forward and bumped
// whenever the month sequence wraps (Dec -> Jan).
import { fetchCached, MONTHS, UK_PORTS, WAYPOINTS, withCountry, titleCase, laneFor } from '../lib/util.mjs';

const PAGE = 'https://www.nykroro.com/customer/schedules/';
const AJAX = 'https://www.nykroro.com/wp-content/themes/merisis-roro-theme/page-templates/partials/sections/forms/schedules/schedules-ajax.php';

const NORTH_EUROPE = /^(Antwerp|Zeebrugge[^,]*|Hamburg|Bremerhaven|Amsterdam|Flushing|Rotterdam|Le Havre|Cuxhaven|Esbjerg|Emden|Vigo|Santander|Zeebrugge Bastenaken)$/i;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function ajax(data) {
  const body = new URLSearchParams({ ...data }).toString();
  const res = await fetch(AJAX, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': PAGE,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
    },
    body,
  });
  if (!res.ok) throw new Error(`NYK ajax ${res.status}`);
  return res.json();
}

/** Parse the showDetails HTML: year header, then numbered port rows. */
function parseRotation(html) {
  // Tag-stripping leaves runs of pipes and splits day from month
  // ("|||31| Jul"), so collapse the noise before matching.
  const text = html
    .replace(/&nbsp;?/g, ' ')
    .replace(/<[^>]+>/g, '|')
    .replace(/\s+/g, ' ')
    .replace(/\s*\|\s*/g, '|')
    .replace(/\|+/g, '|');

  let year = parseInt((text.match(/\b(20\d\d)\b/) || [])[1] || String(new Date().getFullYear()), 10);

  // Collapsed rows: "|1|DURBAN|Arriving|31|Jul|Departing|4|Aug|"
  const re = /\|\d+\|([A-Z][A-Z .()'\/-]*?)\|Arriving\|(\d{1,2})\|([A-Za-z]{3})(?:\|Departing\|(\d{1,2})\|([A-Za-z]{3}))?/g;

  const ports = [];
  let lastMonth = 0;
  let m;
  while ((m = re.exec(text))) {
    const toISO = (day, mon) => {
      if (!day || !mon) return null;
      const mm = MONTHS[mon.toLowerCase()];
      if (!mm) return null;
      if (+mm < lastMonth) year++; // rotation crossed a year boundary
      lastMonth = +mm;
      return `${year}-${mm}-${String(day).padStart(2, '0')}`;
    };
    const arrival = toISO(m[2], m[3]);
    const departure = toISO(m[4], m[5]);
    ports.push({ port: titleCase(m[1].trim()), arrival, departure });
  }
  return ports;
}

export const name = 'NYK RoRo';
export const service = 'roro';
export const url = PAGE;

export async function collect({ log = () => {} } = {}) {
  const page = await fetchCached(PAGE, { binary: false });
  const sel = (page.match(/<select id="seVesselName"[\s\S]*?<\/select>/) || [''])[0];
  const vessels = [...sel.matchAll(/<option>([^<]+)<\/option>/g)].map(x => x[1].trim());
  if (!vessels.length) throw new Error('NYK: vessel list not found on schedules page - layout changed');
  log(`  ${vessels.length} vessels listed`);

  const sailings = [];
  let rotations = 0, failures = 0;

  for (const vessel of vessels) {
    try {
      const nums = await ajax({ action: 'vesselNums', vesselName: vessel });
      for (const voyage of nums.options || []) {
        await sleep(120);
        const found = await ajax({ action: 'vesselSearch', vesselName: vessel, voyageNumber: voyage });
        const voyageId = found?.single?.voyageId;
        if (!voyageId) continue;

        await sleep(120);
        const details = await ajax({
          action: 'showDetails',
          'voyageIds[]': voyageId,
          loadingCode: found.single.loadingCode,
          deliveryCode: found.single.deliveryCode,
          mode: 'VESSEL',
        });
        const ports = parseRotation(details.data || '');
        if (!ports.length) continue;
        rotations++;

        for (let i = 0; i < ports.length; i++) {
          const from = ports[i];
          if (!UK_PORTS.test(from.port)) continue;
          const ets = from.departure || from.arrival;
          if (!ets) continue;
          for (let j = i + 1; j < ports.length; j++) {
            const to = ports[j];
            if (!to.arrival || to.arrival <= ets) continue;
            if (UK_PORTS.test(to.port) || NORTH_EUROPE.test(to.port) || WAYPOINTS.test(to.port)) continue;
            sailings.push({
              loadPort: from.port,
              destination: withCountry(to.port),
              vessel: titleCase(vessel),
              voyage,
              carrier: 'NYK RoRo',
              ets,
              eta: to.arrival,
              lane: laneFor(withCountry(to.port)),
              notes: '',
            });
          }
          break;
        }
      }
    } catch {
      failures++;
    }
    await sleep(120);
  }

  if (rotations === 0) throw new Error('NYK: no rotations parsed - ajax endpoint or markup changed');
  log(`  ${rotations} rotations parsed (${failures} vessel failures) -> ${sailings.length} UK sailings`);
  return sailings;
}
