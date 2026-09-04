// Watches the US shipping prices on /car-shipping/usa-america against the
// source they are derived from, and says when they have drifted apart.
//
// WHERE THE FIGURES COME FROM
// The ten port rates on that page are Autoshippers' published UK-to-USA prices,
// undercut by exactly £1 on both the saloon and the SUV column. That was worked
// out from the data rather than documented anywhere: on 2026-09-04 every one of
// our twelve distinct figures had an exact +£1 twin on their page.
//
// ALERT ONLY - THIS SCRIPT NEVER WRITES.
// A competitor changing their prices should not silently change ours. It prints
// what moved and exits non-zero; a human decides whether to follow.
//
//   node scripts/prices/check-usa.mjs          # or: npm run prices:check
//
// The page is already downloaded every week by the sailing-schedule run
// (sources/autoshippers.mjs reads the same URL for its RoRo sailings), so this
// normally costs nothing: fetchCached serves the copy that run left behind.
// Pass --fresh to force a new download.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fetchCached, ROOT } from '../schedules/lib/util.mjs';

const SOURCE = 'https://www.autoshippers.co.uk/AutoShipping-USA.htm';
const PAGE = join(ROOT, '..', '..', 'src', 'pages', 'car-shipping', 'usa-america.astro');
/** What we take off their price, on both columns. */
const UNDERCUT = 1;

const money = n => '£' + n.toLocaleString('en-GB');
const toNumber = s => Number(String(s).replace(/[^0-9.]/g, ''));

/** The ten rows as the page currently publishes them. */
function ourRates() {
  const src = readFileSync(PAGE, 'utf8');
  const block = /const shippingCosts = \[([\s\S]*?)\];/.exec(src);
  if (!block) throw new Error('could not find shippingCosts in ' + PAGE);
  return [...block[1].matchAll(/destination: '([^']+)', saloon: '([^']+)', suv: '([^']+)'/g)]
    .map(m => ({ port: m[1], saloon: toNumber(m[2]), suv: toNumber(m[3]) }));
}

/** Autoshippers' own table. Their markup is a plain thead/tbody table. */
function theirRates(html) {
  // Narrow to the costs table first: the page carries other tables, and other
  // pound figures in its prose.
  const table = /<table[^>]*UK to USA Car Shipping Prices[\s\S]*?<\/table>/i.exec(html)
    ?? /<table[^>]*cost-table[\s\S]*?<\/table>/i.exec(html);
  if (!table) throw new Error('could not find the price table on ' + SOURCE);

  const rows = [];
  for (const row of table[0].matchAll(/<tr>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(c => c[1]);
    if (cells.length < 3) continue;
    // "Jacksonville<br>(327 miles to Miami)" - keep the port, drop the aside.
    const port = cells[0].split(/<br\s*\/?>/i)[0].replace(/<[^>]*>/g, '').trim();
    const saloon = toNumber(cells[1]);
    const suv = toNumber(cells[2]);
    if (port && saloon && suv) rows.push({ port, saloon, suv });
  }
  if (!rows.length) throw new Error('price table found but no rows parsed');
  return rows;
}

const fresh = process.argv.includes('--fresh');
const html = await fetchCached(SOURCE, { binary: false, maxAgeMinutes: fresh ? 0 : 60 * 24 * 7 });

const ours = ourRates();
const theirs = theirRates(html);
const byPort = new Map(theirs.map(r => [r.port.toLowerCase(), r]));

console.log(`USA price check - ${ours.length} rows on our page, ${theirs.length} on theirs`);
console.log(`Rule: our price = Autoshippers minus ${money(UNDERCUT)}, on both columns.\n`);

const drift = [];
const missing = [];
for (const row of ours) {
  const t = byPort.get(row.port.toLowerCase());
  if (!t) { missing.push(row.port); continue; }
  const want = { saloon: t.saloon - UNDERCUT, suv: t.suv - UNDERCUT };
  if (want.saloon !== row.saloon || want.suv !== row.suv) {
    drift.push({ port: row.port, ours: row, theirs: t, want });
  }
}
const added = theirs.filter(t => !ours.some(o => o.port.toLowerCase() === t.port.toLowerCase()));

if (drift.length) {
  console.log(`${drift.length} row(s) no longer match:\n`);
  console.log('  port           ours              theirs            should be');
  for (const d of drift) {
    const f = (s, u) => (money(s) + ' / ' + money(u)).padEnd(18);
    console.log('  ' + d.port.padEnd(14) + f(d.ours.saloon, d.ours.suv) + f(d.theirs.saloon, d.theirs.suv) + f(d.want.saloon, d.want.suv));
  }
  console.log('');
}
if (missing.length) console.log(`On our page but not on theirs: ${missing.join(', ')}\n`);
if (added.length) console.log(`On their page but not on ours: ${added.map(a => `${a.port} (${money(a.saloon)} / ${money(a.suv)})`).join(', ')}\n`);

if (!drift.length && !missing.length && !added.length) {
  console.log('All rows match. Nothing to do.');
  process.exit(0);
}
console.log(`Nothing has been changed. Edit shippingCosts in ${PAGE.replace(/\\/g, '/')} if you want to follow these.`);
process.exit(1);
