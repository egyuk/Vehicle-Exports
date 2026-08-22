// ACL (Atlantic Container Line, Grimaldi group) - weekly ConRo Liverpool to
// North America, via the MyACL portal's schedule search.
//
// The search page is public: GET it for the ASP.NET anti-forgery token, the
// session cookie and an embedded DevExpress port directory (PortPk ids with
// per-port ApplicablePairingPortPks), then POST the form. One POST per UK load
// port covers every discharge port at once.
//
// Dates in the raw HTML are US M/D/YYYY without leading zeros - the dd/mm/yyyy
// seen in a browser is client-side locale formatting, so don't parse day-first.
import { NORTH_EUROPE, withCountry, titleCase, laneFor } from '../lib/util.mjs';

const BASE = 'https://my.aclcargo.com';
const PAGE = `${BASE}/myacl/Vessel/ScheduleSearchWithOptions?`;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36';

const EXCLUDED_COUNTRIES = /United Kingdom|Belgium|Netherlands|Germany|France|Sweden|Norway|Denmark|Finland|Poland/;

/** "8/25/2026" (US, no leading zeros) -> 2026-08-25 */
const mdyToISO = d => {
  const m = String(d).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : null;
};

export const name = 'ACL';
export const url = 'https://www.aclcargo.com/schedules/';

export async function collect({ log = () => {} } = {}) {
  const pre = await fetch(PAGE, { headers: { 'User-Agent': UA } });
  if (!pre.ok) throw new Error(`ACL: search page returned ${pre.status}`);
  const cookie = (pre.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ');
  const page = await pre.text();
  const token = (page.match(/__RequestVerificationToken[^>]*value="([^"]+)"/) || [])[1];
  const ports = JSON.parse((page.match(/"data":(\[\{"PortPk[\s\S]*?\])\}\)/) || [])[1] || '[]');
  if (!token || !ports.length) throw new Error('ACL: token or port directory missing - page changed');

  const byPk = new Map(ports.map(p => [p.PortPk, p]));
  const ukPorts = ports.filter(p => /United Kingdom/.test(p.DisplayNameWithCountry) && p.IsRoroEligible);
  log(`  ${ports.length} ports listed, ${ukPorts.length} UK RoRo (${ukPorts.map(p => p.DisplayName).join(', ')})`);

  const sailings = [];
  for (const pol of ukPorts) {
    const pods = (pol.ApplicablePairingPortPks || [])
      .map(pk => byPk.get(pk))
      .filter(p => p?.IsRoroEligible && !EXCLUDED_COUNTRIES.test(p.DisplayNameWithCountry));
    if (!pods.length) continue;

    const body = new URLSearchParams();
    body.set('__RequestVerificationToken', token);
    body.set('RenderType', 'Minimal');
    body.set('VesselType', 'Roro');
    body.set('DurationInWeeks', '8');
    body.set('SelectedLoadingPorts', String(pol.PortPk));
    for (const p of pods) body.append('SelectedDischargePorts', String(p.PortPk));
    body.set('DepartureTime', new Date().toISOString().slice(0, 10));
    body.set('ArrivalTime', '');

    const res = await fetch(`${BASE}/myacl/Vessel/ScheduleSearch`, {
      method: 'POST',
      headers: { 'User-Agent': UA, cookie, 'Content-Type': 'application/x-www-form-urlencoded', Referer: PAGE, Origin: BASE },
      body,
    });
    if (!res.ok) throw new Error(`ACL: search returned ${res.status}`);
    const text = (await res.text())
      .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

    // Each schedule renders as "ATE7426 on ATLANTIC SEA ATE7426 on ATLANTIC SEA
    // ... Liverpool, Tuesday 8/25/2026 Direct New York, Friday 9/4/2026 10 days"
    // - the doubled header (panel link + modal title) anchors the vessel name.
    const day = '(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day';
    const re = new RegExp(
      `([A-Z]{2,4}\\d{3,5}) on ([A-Z][A-Z ]+) \\1 on \\2 .*? ${pol.DisplayName}, ${day} ` +
      `(\\d{1,2}/\\d{1,2}/\\d{4}) (\\S+) ([A-Za-z ]+?), ${day} (\\d{1,2}/\\d{1,2}/\\d{4}) \\d+ days`, 'g');
    let m, count = 0;
    const seen = new Set();
    while ((m = re.exec(text))) {
      const [, voyage, vessel, dep, via, to, arr] = m;
      const ets = mdyToISO(dep), eta = mdyToISO(arr);
      const city = titleCase(to.trim());
      if (!ets || !eta || eta <= ets || NORTH_EUROPE.test(city)) continue;
      const key = `${voyage}|${city}|${ets}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const destination = withCountry(city);
      sailings.push({
        loadPort: pol.DisplayName,
        destination,
        vessel: titleCase(vessel.trim()),
        voyage,
        carrier: 'ACL',
        ets,
        eta,
        lane: laneFor(destination),
        notes: /^Direct$/i.test(via) ? '' : 'Transhipment en route',
      });
      count++;
    }
    log(`  ${pol.DisplayName}: ${count} sailings`);
  }

  if (!sailings.length) throw new Error('ACL: no sailings parsed - layout changed');
  return sailings;
}
