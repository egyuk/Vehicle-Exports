// Keeps the US shipping prices on /car-shipping/usa-america in step with the
// source they are derived from.
//
// WHERE THE FIGURES COME FROM
// The ten port rates on that page are Autoshippers' published UK-to-USA prices,
// undercut by exactly £1 on both the saloon and the SUV column. That was worked
// out from the data rather than documented anywhere: on 2026-09-04 every one of
// our twelve distinct figures had an exact +£1 twin on their page.
//
//   node scripts/prices/check-usa.mjs           # report only, writes nothing
//   node scripts/prices/check-usa.mjs --apply   # rewrite the page to match
//   node scripts/prices/check-usa.mjs --fresh   # bypass the download cache
//
// WHY --apply STILL REFUSES SOME CHANGES
// Following a competitor automatically means their pricing decision becomes
// ours with nobody looking, and it means a bad scrape becomes a published
// price. So a move larger than MAX_MOVE, or any change to which ports exist,
// stops the write and reports instead. Small market drift applies itself; a
// step change or a layout break waits for a human. Do not raise the threshold
// to make a run go green - that is the run doing its job.
//
// The page is already downloaded every week by the sailing-schedule run
// (sources/autoshippers.mjs reads the same URL for its RoRo sailings), so this
// normally costs nothing: fetchCached serves the copy that run left behind.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fetchCached, ROOT } from '../schedules/lib/util.mjs';

const SOURCE = 'https://www.autoshippers.co.uk/AutoShipping-USA.htm';
const PAGE = join(ROOT, '..', '..', 'src', 'pages', 'car-shipping', 'usa-america.astro');
/** What we take off their price, on both columns. */
const UNDERCUT = 1;
/** Largest single-figure move that may be applied without a human. */
const MAX_MOVE = 0.2;

const money = n => '£' + n.toLocaleString('en-GB');
const toNumber = s => Number(String(s).replace(/[^0-9.]/g, ''));

function ourRates(src) {
  const block = /const shippingCosts = \[([\s\S]*?)\];/.exec(src);
  if (!block) throw new Error('could not find shippingCosts in ' + PAGE);
  return [...block[1].matchAll(/destination: '([^']+)', saloon: '([^']+)', suv: '([^']+)'/g)]
    .map(m => ({ port: m[1], saloon: toNumber(m[2]), suv: toNumber(m[3]) }));
}

/** Autoshippers' own table. Their markup is a plain thead/tbody table. */
function theirRates(html) {
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

const apply = process.argv.includes('--apply');
const fresh = process.argv.includes('--fresh');
const html = await fetchCached(SOURCE, { binary: false, maxAgeMinutes: fresh ? 0 : 60 * 24 * 7 });

const src = readFileSync(PAGE, 'utf8');
const ours = ourRates(src);
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
  if (want.saloon !== row.saloon || want.suv !== row.suv) drift.push({ ...row, want, theirs: t });
}
const added = theirs.filter(t => !ours.some(o => o.port.toLowerCase() === t.port.toLowerCase()));

if (!drift.length && !missing.length && !added.length) {
  console.log('All rows match. Nothing to do.');
  process.exit(0);
}

if (drift.length) {
  console.log(`${drift.length} row(s) moved:\n`);
  console.log('  port           ours              theirs            new');
  for (const d of drift) {
    const f = (s, u) => (money(s) + ' / ' + money(u)).padEnd(18);
    console.log('  ' + d.port.padEnd(14) + f(d.saloon, d.suv) + f(d.theirs.saloon, d.theirs.suv) + f(d.want.saloon, d.want.suv));
  }
  console.log('');
}
if (missing.length) console.log(`On our page but not on theirs: ${missing.join(', ')}`);
if (added.length) console.log(`On their page but not on ours: ${added.map(a => `${a.port} (${money(a.saloon)} / ${money(a.suv)})`).join(', ')}`);

// Anything that changes WHICH ports we publish is a content decision, not a
// price one, so it never applies itself.
const blockers = [];
if (missing.length) blockers.push(`${missing.length} of our ports are no longer on their page`);
if (added.length) blockers.push(`${added.length} new port(s) on their page`);
for (const d of drift) {
  for (const col of ['saloon', 'suv']) {
    const move = Math.abs(d.want[col] - d[col]) / d[col];
    if (move > MAX_MOVE) {
      blockers.push(`${d.port} ${col} moves ${(move * 100).toFixed(0)}% (${money(d[col])} -> ${money(d.want[col])})`);
    }
  }
}

if (!apply) {
  console.log('\nReport only - nothing written. Re-run with --apply to follow these.');
  process.exit(1);
}

if (blockers.length) {
  console.log('\nNOT APPLIED. Needs a human:');
  for (const b of blockers) console.log('  - ' + b);
  process.exit(2);
}

let out = src;
for (const d of drift) {
  const before = new RegExp(`(\\{ destination: '${d.port.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}', saloon: ')[^']+(', suv: ')[^']+(' \\})`);
  if (!before.test(out)) { console.log(`\nNOT APPLIED: could not locate the ${d.port} row to rewrite.`); process.exit(2); }
  out = out.replace(before, `$1${money(d.want.saloon)}$2${money(d.want.suv)}$3`);
}
writeFileSync(PAGE, out);
console.log(`\nApplied ${drift.length} row(s) to ${PAGE.replace(/\\/g, '/')}.`);
process.exit(0);
