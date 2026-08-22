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

// Most trustworthy first - order decides which duplicate survives.
const SOURCES = [nmt, kline, ww, nyk, grimaldi, grimaldiSam, sallaum, hoegh, eukor, geest, autoshippers];

const DATA = join(ROOT, '..', '..', 'src', 'data', 'sailing-schedules.json');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fresh = args.includes('--fresh');

const log = (...a) => console.log(...a);

// Autoshippers spells one K Line vessel "Donnington"; the carrier says "Donington".
const canonicalVessel = v => v.replace(/\bDonnington\b/gi, 'Donington');
const dedupeKey = s =>
  `${canonicalVessel(s.vessel).toLowerCase().replace(/[^a-z0-9]/g, '')}` +
  `|${s.destination.split(',')[0].trim().toLowerCase()}|${s.ets}`;


async function main() {
  const previous = JSON.parse(readFileSync(DATA, 'utf8'));
  const year = new Date().getFullYear();

  log(`Schedule refresh - ${todayISO()}\n`);

  const collected = [];
  const failures = [];

  for (const source of SOURCES) {
    log(`${source.name}:`);
    try {
      const sailings = await source.collect({ log, year });
      const errs = validateSource(source.name, sailings);
      if (errs.length) {
        errs.forEach(e => log(`  FAIL ${e}`));
        failures.push(...errs);
        continue;
      }
      collected.push(...sailings);
    } catch (e) {
      log(`  FAIL ${e.message}`);
      failures.push(`${source.name}: ${e.message}`);
    }
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
    if (seen.has(k)) continue;
    const nk = nearKey(s);
    if ((near.get(nk) || []).some(e => Math.abs(daysBetween(e, s.ets)) <= NEAR_DAYS)) continue;
    seen.add(k);
    near.set(nk, [...(near.get(nk) || []), s.ets]);
    merged.push({ ...s, vessel: canonicalVessel(s.vessel) });
  }

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
      // Named but not linked: these carriers sell the same service to the same
      // customers, so linking out from our schedule loses the enquiry.
      note: 'Compiled from published carrier schedules — NMT Shipping, Wallenius Wilhelmsen, "K" Line, NYK RoRo, Grimaldi, Sallaum Lines, Höegh Autoliners, EUKOR and Geest Line — plus a residue from Autoshippers where the arrival is derived from a published transit time rather than confirmed by the carrier. Some sailings tranship en route, and where a carrier publishes only an arrival at the load port the departure will be later than the date shown. All dates are carrier estimates and must be reconfirmed before a booking is committed.',
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
