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
import { ROOT, fetchCached, todayISO } from './lib/util.mjs';
import { validateSource, validateAll, diffReport, formatDiff } from './validate.mjs';

import * as nmt from './sources/nmt.mjs';
import * as kline from './sources/kline.mjs';
import * as grimaldi from './sources/grimaldi.mjs';
import * as geest from './sources/geest.mjs';
import * as autoshippers from './sources/autoshippers.mjs';

// Most trustworthy first - order decides which duplicate survives.
const SOURCES = [nmt, kline, grimaldi, geest, autoshippers];

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

/** Refresh the 89-lane carrier directory used by the page's reference section. */
async function fetchLanes() {
  const json = await fetchCached('https://nmtshipping.com/api/schedules/services', {
    binary: false,
    maxAgeMinutes: fresh ? 0 : 60,
  });
  const services = JSON.parse(json);
  const slugify = n => n.replace(/\s+/g, ' ').trim().toLowerCase()
    .replace(/[(),]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return services.map(s => {
    const name = s.name.replace(/\s+/g, ' ').trim();
    const slug = slugify(s.name);
    return {
      id: s.id,
      name,
      departure: /^Europe\b/i.test(name),
      source: `https://nmtshipping.com/schedules/${slug}`,
      pdf: `https://nmtshipping.com/schedules/${slug}/pdf`,
    };
  });
}

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
  const merged = [];
  for (const s of collected) {
    const k = dedupeKey(s);
    if (seen.has(k)) continue;
    seen.add(k);
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

  const next = {
    ...previous,
    updated: todayISO(),
    sailings: kept,
    lanes: await fetchLanes().catch(() => previous.lanes),
  };
  writeFileSync(DATA, JSON.stringify(next, null, 2));
  log(`\nWrote ${DATA}`);
}

main().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
