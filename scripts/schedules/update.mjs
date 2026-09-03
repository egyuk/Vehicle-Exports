// Weekly schedule refresh: fetch every carrier source, merge, validate, write.
//
//   node scripts/schedules/update.mjs            refresh and write the data file
//   node scripts/schedules/update.mjs --dry-run  report what would change only
//   node scripts/schedules/update.mjs --fresh    ignore the download cache
//
// Merge precedence matters: a carrier's own schedule always beats a forwarder's
// derived ETA for the same sailing, so sources are merged in confidence order
// and later duplicates are discarded.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, todayISO, daysBetween } from './lib/util.mjs';
import { validateSource, validateAll, diffReport, formatDiff } from './validate.mjs';

import * as nmt from './sources/nmt.mjs';
import * as kline from './sources/kline.mjs';
import * as grimaldi from './sources/grimaldi.mjs';
import * as grimaldiSam from './sources/grimaldi-sam.mjs';
import * as geest from './sources/geest.mjs';
import * as autoshippers from './sources/autoshippers.mjs';
import * as ww from './sources/ww.mjs';
import * as nyk from './sources/nyk.mjs';
import * as sallaum from './sources/sallaum.mjs';
import * as hoegh from './sources/hoegh.mjs';
import * as eukor from './sources/eukor.mjs';
import * as dfds from './sources/dfds.mjs';
import * as condor from './sources/condor.mjs';
import * as stena from './sources/stena.mjs';
import * as mol from './sources/mol.mjs';
import * as acl from './sources/acl.mjs';
import * as glovis from './sources/glovis.mjs';
import * as uecc from './sources/uecc.mjs';
import * as msc from './sources/msc.mjs';
import * as ellerman from './sources/ellerman.mjs';

// Most trustworthy first - order decides which duplicate survives.
// Ellerman last but one: a niche shortsea feeder, and the only pure-container
// source, so anything a deep-sea carrier also describes should win over it.
//
// MSC sits between the RoRo carriers and Ellerman. It is the carrier's own
// data, but almost every row is a transhipment ETA rather than a single ship's
// schedule, so a RoRo carrier's direct sailing should win a duplicate; and
// being after nmt lets the merge back-fill carrier:'MSC' onto NMT's
// unattributed MSC-vessel rows instead of publishing both.
const SOURCES = [nmt, kline, ww, nyk, grimaldi, grimaldiSam, sallaum, hoegh, eukor, mol, acl, glovis, uecc, dfds, condor, stena, msc, ellerman, geest, autoshippers];

const DATA = join(ROOT, '..', '..', 'src', 'data', 'sailing-schedules.json');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fresh = args.includes('--fresh');

const log = (...a) => console.log(...a);

// Autoshippers spells one K Line vessel "Donnington"; the carrier says "Donington".
const canonicalVessel = v => v.replace(/\bDonnington\b/gi, 'Donington');
// Load port is part of the identity of a sailing, not incidental to it: the
// same ocean vessel legitimately serves one destination from several UK ports.
// It was missing here while `nearKey` below already carried it, so the two keys
// disagreed about what "the same sailing" means. That went unnoticed until MSC
// arrived: because MSC publishes the DELIVERING ocean vessel rather than the UK
// feeder, several UK departures share one vessel, destination and date, and 106
// real sailings were being dropped as exact duplicates of each other.
const dedupeKey = s =>
  `${canonicalVessel(s.vessel).toLowerCase().replace(/[^a-z0-9]/g, '')}` +
  `|${s.loadPort.toLowerCase()}` +
  `|${s.destination.split(',')[0].trim().toLowerCase()}|${s.ets}`;


async function main() {
  const previous = JSON.parse(readFileSync(DATA, 'utf8'));
  const year = new Date().getFullYear();

  log(`Schedule refresh - ${todayISO()}\n`);

  const collected = [];
  const failures = [];
  // Optional sources warn instead of blocking. The hard-fail rule exists so a
  // broken parser cannot silently delete an established lane, and that is still
  // right for the eighteen carriers whose data the site depends on. But a
  // source sitting behind bot management (MSC and ZIM are both behind Akamai)
  // may pass from a desk machine and be scored differently from a datacentre
  // ASN, and it must not be able to take the whole weekly refresh down with it
  // on a bad day. Mark such a source `export const optional = true`.
  const degraded = [];

  for (const source of SOURCES) {
    log(`${source.name}:`);
    try {
      // `fresh` was parsed and then never passed on, so --fresh only bypassed
      // the caches util.mjs owns. A source with its own cache (msc.mjs POSTs)
      // needs to be told.
      const sailings = await source.collect({ log, year, fresh });
      const errs = validateSource(source.name, sailings);
      if (errs.length) {
        errs.forEach(e => log(`  ${source.optional ? 'SKIP' : 'FAIL'} ${e}`));
        (source.optional ? degraded : failures).push(...errs);
        continue;
      }
      // Tag the origin so the near-duplicate pass can tell "two sources
      // describing one sailing" from "one source listing a daily service".
      //
      // `service` says how the vehicle travels: 'roro' (driven aboard a vehicle
      // carrier or ro-pax ferry) or 'container'. Every source declares it, and
      // a row may override per sailing where a carrier runs both. It is stamped
      // here rather than repeated in eighteen modules, but it is NOT defaulted:
      // a source that forgets it fails the run, because quoting a container
      // transit as a RoRo one misleads a customer about the service they buy.
      if (!source.service) throw new Error(`${source.name}: no service type declared (expected 'roro' or 'container')`);
      collected.push(...sailings.map(s => ({ service: source.service, ...s, _source: source.name })));
    } catch (e) {
      log(`  ${source.optional ? 'SKIP' : 'FAIL'} ${e.message}`);
      (source.optional ? degraded : failures).push(`${source.name}: ${e.message}`);
    }
    log('');
  }

  // Loud, but not fatal. Worth seeing in the run log: an optional source that
  // is down every week is not really optional, it is broken and should be
  // fixed or dropped.
  if (degraded.length) {
    log('Optional sources unavailable this run (continuing without them):');
    degraded.forEach(d => log(`  - ${d}`));
    log('');
  }

  // A source dropping out entirely would silently delete a lane - refuse to write.
  if (failures.length) {
    log('Refusing to write: one or more sources failed.\n');
    failures.forEach(f => log(`  - ${f}`));
    process.exitCode = 1;
    return;
  }

  const seen = new Set();
  // The exact key misses the commonest duplicate: two sources describing one
  // sailing with dates a few days apart (Torrens 1 day off between NMT and WW,
  // Arc Defender 5, Morning Chant 3). Same vessel, load port and destination
  // within a week is one physical sailing - a genuine repeat call by the same
  // vessel is a full rotation (4+ weeks) later. The more trusted source's row
  // is already in when the copy shows, so confidence order decides the dates.
  const NEAR_DAYS = 6;
  const near = new Map();
  const nearKey = s =>
    `${canonicalVessel(s.vessel).toLowerCase().replace(/[^a-z0-9]/g, '')}` +
    `|${s.loadPort.toLowerCase()}|${s.destination.split(',')[0].trim().toLowerCase()}`;
  const merged = [];
  for (const s of collected) {
    const k = dedupeKey(s);
    const nk = nearKey(s);
    // Only ever collapse across sources. Within one source the dates are
    // authoritative: the Channel Islands ferries run the same vessel on the
    // same route most days, and treating those as one sailing threw away 138
    // real departures. A single source does not list a sailing twice.
    const twin = (near.get(nk) || []).find(e =>
      e.source !== s._source && Math.abs(daysBetween(e.ets, s.ets)) <= NEAR_DAYS);
    if (seen.has(k) || twin) {
      // The losing copy can still know something the winner doesn't. NMT lists
      // several carriers' sailings without naming the operator, so a carrier's
      // own duplicate of the same sailing fills that blank instead of being
      // discarded whole - it is the same ship on the same voyage.
      if (twin && !twin.row.carrier && s.carrier) twin.row.carrier = s.carrier;
      continue;
    }
    seen.add(k);
    const { _source, ...clean } = s;
    const row = { ...clean, vessel: canonicalVessel(s.vessel) };
    near.set(nk, [...(near.get(nk) || []), { ets: s.ets, source: _source, row }]);
    merged.push(row);
  }

  // Runs AFTER the merge, not inside it: the loop above back-fills a blank
  // carrier from a later duplicate, so a row's attribution is not final until
  // every source has been through.
  //
  // Same principle as the carrier rule. A row nobody could attribute to an
  // operator cannot be vouched for as RoRo either. The aggregators are RoRo
  // forwarders, so their source-level 'roro' holds for the rows a carrier
  // confirms, but the unattributed leftovers are exactly the ones that turned
  // out to include container services (Jordan's Aqaba sailings). Downgrade
  // rather than guess: quoting a container transit as RoRo sells the wrong
  // service.
  let downgraded = 0;
  for (const row of merged) {
    if (!row.carrier && row.service === 'roro') { row.service = 'unknown'; downgraded++; }
  }
  if (downgraded) log(`${downgraded} unattributed sailings marked service "unknown"\n`);

  const { errors, warnings, kept } = validateAll(merged, { year });
  warnings.forEach(w => log(`WARN ${w}`));
  if (errors.length) {
    log('\nValidation failed:\n');
    errors.slice(0, 20).forEach(e => log(`  - ${e}`));
    if (errors.length > 20) log(`  ...and ${errors.length - 20} more`);
    process.exitCode = 1;
    return;
  }

  kept.sort((a, b) =>
    a.ets.localeCompare(b.ets) ||
    a.destination.localeCompare(b.destination) ||
    a.vessel.localeCompare(b.vessel));

  const upcoming = kept.filter(s => s.ets >= todayISO()).length;
  log(`\nMerged: ${kept.length} sailings (${upcoming} upcoming), ` +
      `${new Set(kept.map(s => s.destination)).size} destinations, ` +
      `${collected.length - merged.length} duplicates dropped\n`);

  const diff = diffReport(previous.sailings || [], kept);
  log(formatDiff(diff));

  if (dryRun) {
    log('\n--dry-run: nothing written.');
    return;
  }

  // `lanes` was a carrier lane directory for the old manual weekly check. That
  // workflow is gone, so it is dropped rather than carried forward by the spread.
  const { lanes, ...carried } = previous;

  const next = {
    ...carried,
    updated: todayISO(),
    source: {
      name: 'Carrier schedules',
      // Deliberately does not name the carriers. They sell the same service to
      // the same customers, so a list of them is a shopping list - naming them
      // is the giveaway, whether or not it is linked. The per-source detail
      // that used to live here (derived Autoshippers ETAs, transhipment) is a
      // note about our own data quality and belongs in the repo, not on a page
      // a customer reads. What stays is the line that protects a quote when a
      // carrier moves a date.
      note: 'Sailings are compiled from published carrier schedules. All dates are carrier estimates and must be reconfirmed before a booking is committed.',
    },
    sailings: kept,
  };
  writeFileSync(DATA, JSON.stringify(next, null, 2));
  log(`\nWrote ${DATA}`);
}

main().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
