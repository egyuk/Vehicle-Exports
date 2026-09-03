// Gates that must pass before anything is written.
//
// Every check here exists because it caught a real fault during the initial
// build: a year-old NMT rotation with a 334-day leg, a Geest column mapping
// that duplicated some islands and missed others, and derived ETAs that
// disagreed with the carrier's own by five days.
//
// The important failure mode is not a crash - it is a source silently returning
// nothing after a layout change, quietly deleting a whole lane from the table.
import { daysBetween } from './lib/util.mjs';

// Exported because sources filter on it too: msc.mjs drops over-long routings
// at the source so they cannot fail the run here, and a second copy of the
// number in that file would silently drift out of step with this gate.
export const MAX_TRANSIT_DAYS = 120;

/**
 * How the vehicle travels. Closed set: see the `service` check below.
 *
 * 'conro' means the vessel carries both and the customer can book either way.
 * ACL's Liverpool to North America service is the one currently in the data:
 * their G4 ships are ConRo, so a car can go as RoRo or in a container on the
 * same sailing. Worth distinguishing rather than folding into 'roro', because
 * it is the only container option in the schedule today and it is a genuine
 * choice to offer a customer.
 *
 * 'unknown' is deliberate and is not a soft default. The aggregator sources
 * (NMT, Autoshippers) republish other operators' sailings without naming the
 * operator or the service, and some of those turned out to be container
 * services rather than RoRo. Saying "unknown" costs a line of UI; guessing
 * "roro" would quote a customer a transit for a service they are not buying.
 * A source must still declare its value explicitly.
 */
export const SERVICES = new Set(['roro', 'container', 'conro', 'unknown']);

/** Per-source floor: fewer rows than this means the parser has broken. */
export const MIN_ROWS = {
  'NMT Shipping': 100,
  'Grimaldi': 40,
  // Manual snapshot of a single quarter, so the floor is low by nature.
  'Grimaldi South America': 10,
  '"K" Line': 30,
  'Geest Line': 20,
  'Wallenius Wilhelmsen': 150,
  'NYK RoRo': 15,
  'Sallaum Lines': 10,
  'Höegh Autoliners': 10,
  'EUKOR': 10,
  'DFDS': 10,
  'Condor Ferries': 20,
  'Stena Line': 30,
  // Few UK calls each, so the floors are low by nature.
  'MOL ACE': 5,
  'ACL': 10,
  'Hyundai Glovis': 10,
  'UECC': 10,
  // Shortsea feeder: the Tilbury-Rotterdam backbone alone is ~12 and rolls
  // weekly, so 15 trips if that disappears without firing on the quarterly
  // trough when the Iberian and Polish tables thin out.
  'Ellerman City Liners': 15,
  'Autoshippers': 20,
  // Observed 1,220 on 2026-09-03 (4 UK load ports x 99 destinations, after the
  // source's own volume cap: every direct sailing plus the next three
  // transhipments per load port and destination). The floor is deliberately
  // about a third of that: MSC's window is eight weeks forward and thins
  // seasonally, and because the source is optional a partly-blocked run should
  // still be allowed to publish what it reached. Below 400 means a mostly
  // blocked sweep or a parser that stopped seeing transhipments, both of which
  // would quietly halve the lanes on offer.
  'MSC': 400,
};

export function validateSource(sourceName, sailings) {
  const errors = [];
  const floor = MIN_ROWS[sourceName] ?? 1;
  if (sailings.length < floor) {
    errors.push(`${sourceName}: only ${sailings.length} sailings (expected at least ${floor}) - layout probably changed`);
  }
  return errors;
}

export function validateAll(sailings, { year = new Date().getFullYear() } = {}) {
  const errors = [];
  const warnings = [];

  // Drop carrier-side stale rows FIRST. NMT publish the odd year-old rotation
  // with nonsense legs (a 334-day hop); those must not fail the run, they are
  // simply not ours to publish.
  const kept = [];
  for (const s of sailings) {
    if (s.ets && s.ets < `${year}-01-01`) {
      warnings.push(`stale pre-${year} row dropped: ${s.ets} ${s.vessel} -> ${s.destination}`);
      continue;
    }
    kept.push(s);
  }

  for (const s of kept) {
    const where = `${s.ets} ${s.vessel} -> ${s.destination}`;

    for (const field of ['loadPort', 'destination', 'vessel', 'ets', 'lane', 'service']) {
      if (!s[field]) errors.push(`missing ${field}: ${where}`);
    }
    // A container sailing quoted as a RoRo transit sells the wrong service, so
    // the value is closed rather than free text.
    if (s.service && !SERVICES.has(s.service)) {
      errors.push(`unknown service "${s.service}" (expected ${[...SERVICES].join(' or ')}): ${where}`);
    }
    if (s.ets && !/^\d{4}-\d{2}-\d{2}$/.test(s.ets)) errors.push(`bad ets format: ${where}`);
    if (s.eta && !/^\d{4}-\d{2}-\d{2}$/.test(s.eta)) errors.push(`bad eta format: ${where}`);

    // Same-day arrival is valid, not an error: the Channel Islands crossings
    // are 3-10 hours and land on the departure date. Only an arrival strictly
    // *before* departure is impossible. (This rule assumed every sailing was
    // deep-sea and rejected the whole Guernsey and Jersey service.)
    if (s.eta && s.ets && s.eta < s.ets) errors.push(`arrival before departure: ${where} (eta ${s.eta})`);
    if (s.eta && s.ets && daysBetween(s.ets, s.eta) > MAX_TRANSIT_DAYS) {
      errors.push(`transit over ${MAX_TRANSIT_DAYS} days: ${where} (eta ${s.eta})`);
    }
  }

  return { errors, warnings, kept };
}

/** Compare against the previous run so a human can see exactly what moved. */
export function diffReport(oldSailings, newSailings) {
  const key = s => `${s.vessel.toLowerCase()}|${s.destination.split(',')[0].toLowerCase()}|${s.voyage || ''}`;
  const oldMap = new Map(oldSailings.map(s => [key(s), s]));
  const newMap = new Map(newSailings.map(s => [key(s), s]));

  const added = [...newMap].filter(([k]) => !oldMap.has(k)).map(([, s]) => s);
  const removed = [...oldMap].filter(([k]) => !newMap.has(k)).map(([, s]) => s);
  const moved = [];
  for (const [k, s] of newMap) {
    const prev = oldMap.get(k);
    if (!prev) continue;
    if (prev.ets !== s.ets || prev.eta !== s.eta) {
      moved.push({ sailing: s, fromEts: prev.ets, toEts: s.ets, fromEta: prev.eta, toEta: s.eta });
    }
  }
  return { added, removed, moved };
}

export function formatDiff({ added, removed, moved }, { limit = 12 } = {}) {
  const lines = [];
  const list = (label, rows, fmt) => {
    if (!rows.length) return;
    lines.push(`${label} (${rows.length}):`);
    rows.slice(0, limit).forEach(r => lines.push(`  ${fmt(r)}`));
    if (rows.length > limit) lines.push(`  ...and ${rows.length - limit} more`);
  };
  list('Added', added, s => `${s.ets} ${s.loadPort} -> ${s.destination} (${s.vessel})`);
  list('Removed', removed, s => `${s.ets} ${s.loadPort} -> ${s.destination} (${s.vessel})`);
  list('Dates moved', moved, m =>
    `${m.sailing.vessel} -> ${m.sailing.destination}: ` +
    `${m.fromEts !== m.toEts ? `departure ${m.fromEts} -> ${m.toEts}` : ''}` +
    `${m.fromEts !== m.toEts && m.fromEta !== m.toEta ? ', ' : ''}` +
    `${m.fromEta !== m.toEta ? `arrival ${m.fromEta} -> ${m.toEta}` : ''}`);
  return lines.length ? lines.join('\n') : 'No changes since the last run.';
}
