// Facts derived from the live sailing schedule at BUILD time, so a country
// page cannot drift from the schedule table printed further down that same page.
//
// The generated country pages used to bake these in when the page file was
// written. That was fine until the weekly refresh ran: 49 of 81 pages then
// claimed a transit range their own schedule table contradicted, because the
// carriers had moved dates and two new carriers had appeared. Same failure the
// prices had before they moved into src/data/shipping-prices.ts, and the same
// fix: one source, read at build time, never copied.
//
// Everything here is computed from src/data/sailing-schedules.json, which the
// weekly run rewrites, so these follow along on the next build with no edit.

import schedules from './sailing-schedules.json';
import { hubPorts, scheduleNames } from './destinations';

export interface ScheduleFacts {
  /** Upcoming sailings found for this country (or its hub ports). */
  count: number;
  /** e.g. "4-8 weeks", or null when nothing upcoming is scheduled. */
  transit: string | null;
  /** Discharge ports actually served, deduplicated (see dedupePorts). */
  ports: string[];
  /**
   * The same ports, busiest first. `ports` comes out of the deduper in length
   * order, which is an artefact of how it drops wrapping names rather than
   * anything meaningful — fine as a set, arbitrary as a headline. Where a page
   * names only its first few ports, use this so the ones most sailings actually
   * call at come first.
   */
  portsByTraffic: string[];
  /** UK ports these sailings depart from. */
  loadPorts: string[];
  /** Carriers on the route. Blank carrier values are dropped, not shown. */
  carriers: string[];
  /** Set for a landlocked country served through a neighbour's port. */
  via?: { country: string; port: string }[];
}

const todayISO = () => new Date().toISOString().slice(0, 10);

/** Matches on the country after the last comma: "Mombasa, Kenya" -> "Kenya". */
const countryOf = (destination: string) => {
  const parts = destination.split(',').map(p => p.trim());
  return parts.length > 1 ? parts[parts.length - 1] : destination;
};

/**
 * The same physical port appears under several names in carrier data: China
 * gives "Xingang", "Xingang (Tianjin)" and "Tianjin-Xingang". Keep the shortest
 * form and drop anything that merely wraps it.
 */
const dedupePorts = (ports: string[]): string[] => {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const out: string[] = [];
  for (const p of [...new Set(ports)].sort((a, b) => a.length - b.length)) {
    const n = norm(p);
    if (!out.some(k => { const kn = norm(k); return n.includes(kn) || kn.includes(n); })) out.push(p);
  }
  return out;
};

/** The menu name plus whatever the carriers file the country under. */
const wantedNames = (country: string) =>
  new Set([country, scheduleNames[country] ?? country].map(n => n.toLowerCase()));

const rowsFor = (country: string) => {
  const wanted = wantedNames(country);
  return (schedules.sailings as any[]).filter(
    s => wanted.has(countryOf(s.destination).toLowerCase()) && s.ets >= todayISO(),
  );
};

/** Sea-leg days, ascending. Zero and negative spans are carrier data errors. */
const daysOf = (rows: any[]): number[] =>
  rows
    .map(r => (new Date(r.eta).getTime() - new Date(r.ets).getTime()) / 86400000)
    .filter(n => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

/**
 * "5-10 weeks" from a sorted day list. Shared by the whole-route figure and the
 * per-service ones so a page cannot quote two bands built to different rules.
 */
const weekBand = (days: number[]): string | null => {
  if (!days.length) return null;
  const lo = Math.max(1, Math.floor(days[0] / 7));
  return `${lo}-${Math.max(lo + 1, Math.ceil(days[days.length - 1] / 7))} weeks`;
};

const summarise = (rows: any[]): Omit<ScheduleFacts, 'via'> => {
  const ports = dedupePorts(rows.map(r => r.destination.split(',')[0].trim()));
  const traffic = new Map<string, number>();
  for (const r of rows) {
    const raw = r.destination.split(',')[0].trim();
    // Count against the deduped name this row's port collapsed into, so the
    // three spellings of Xingang do not split its total three ways.
    const key = ports.find(p => {
      const n = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, '');
      return n(raw).includes(n(p)) || n(p).includes(n(raw));
    });
    if (key) traffic.set(key, (traffic.get(key) ?? 0) + 1);
  }
  return {
    count: rows.length,
    transit: weekBand(daysOf(rows)),
    ports,
    portsByTraffic: [...ports].sort((a, b) => (traffic.get(b) ?? 0) - (traffic.get(a) ?? 0)),
    loadPorts: [...new Set(rows.map(r => r.loadPort).filter(Boolean))],
    // Blank carrier strings are common in the aggregator sources and rendered
    // an empty "Shipping Lines" fact before they were filtered here.
    carriers: [...new Set(rows.map(r => (r.carrier || '').trim()).filter(Boolean))],
  };
};

/** A country's own sailings, or the hub-port ones it is served through. */
const resolveRows = (country: string): { rows: any[]; legs?: { country: string; port: string }[] } => {
  const direct = rowsFor(country);
  if (direct.length) return { rows: direct };

  const hubs = hubPorts[country];
  if (hubs?.length) {
    const legs = hubs.map(h => {
      const i = h.indexOf(',');
      return { country: h.slice(0, i).trim(), port: h.slice(i + 1).trim() };
    });
    const rows = legs.flatMap(l => rowsFor(l.country));
    if (rows.length) return { rows, legs };
  }
  return { rows: [] };
};

/**
 * Live schedule facts for a country. A landlocked country resolves through the
 * hub ports in destinations.ts — Uganda reads Mombasa and Dar es Salaam — and
 * carries `via` so the page can say the transit covers the sea leg only.
 */
export function scheduleFactsFor(country: string): ScheduleFacts {
  const { rows, legs } = resolveRows(country);
  if (!rows.length) {
    return { count: 0, transit: null, ports: [], portsByTraffic: [], loadPorts: [], carriers: [] };
  }
  const base = summarise(rows);
  if (!legs) return base;
  // A hub-served country shows its hub ports, not every port its hub countries
  // reach - so ports/portsByTraffic are replaced rather than taken from
  // summarise(), which counted Cape Town and Port Elizabeth alongside Durban.
  // portsByTraffic still has to earn its name here, so order the legs by how
  // many of these sailings actually call at each.
  const legTraffic = (port: string) =>
    rows.filter(r => r.destination.split(',')[0].trim() === port).length;
  return {
    ...base,
    ports: legs.map(l => l.port),
    portsByTraffic: [...legs]
      .sort((a, b) => legTraffic(b.port) - legTraffic(a.port))
      .map(l => l.port),
    via: legs,
  };
}

export interface ServiceFacts {
  count: number;
  /** Full span, min to max: "5-10 weeks". Null when nothing of this service sails. */
  transit: string | null;
  /**
   * The middle half of the sailings, so one unusual routing cannot set the
   * headline. Australia's RoRo runs 5-10 weeks end to end but 6-8 covers the
   * bulk of it, and 6-8 is the number a customer plans around.
   */
  typical: string | null;
  loadPorts: string[];
  carriers: string[];
  /**
   * Share of this service's sailings the carrier flagged as transhipped, 0 to 1.
   * It is why container runs slower than RoRo on the long hauls, and deriving it
   * keeps that explanation from becoming another hand-typed claim that goes
   * stale. Only the container sources annotate feeder legs, so a 0 here means
   * "not stated" as much as "direct" — treat it as evidence for a claim, never
   * against one.
   */
  transhipShare: number;
}

/**
 * Transit and ports split by service. On a long haul the two diverge enough
 * that one combined band describes neither: to Australia, RoRo runs 5-10 weeks
 * out of Southampton, Newcastle and Bristol while a container takes 4-11 out of
 * four different ports. Rows whose service the carrier never stated fall into
 * neither bucket, so these counts need not add up to scheduleFactsFor().count.
 */
export function factsByServiceFor(country: string): { roro: ServiceFacts; container: ServiceFacts } {
  const { rows } = resolveRows(country);
  const one = (service: string): ServiceFacts => {
    const mine = rows.filter(r => r.service === service);
    const days = daysOf(mine);
    // Interquartile slice. Guarded because a 1-3 row route would otherwise
    // slice to nothing and report a typical band of null against a real transit.
    const mid = days.length >= 4
      ? days.slice(Math.floor(days.length * 0.25), Math.ceil(days.length * 0.75))
      : days;
    return {
      count: mine.length,
      transit: weekBand(days),
      typical: weekBand(mid),
      loadPorts: [...new Set(mine.map(r => r.loadPort).filter(Boolean))],
      carriers: [...new Set(mine.map(r => (r.carrier || '').trim()).filter(Boolean))],
      transhipShare: mine.length
        ? mine.filter(r => /transhipment/i.test(r.notes || '')).length / mine.length
        : 0,
    };
  };
  return { roro: one('roro'), container: one('container') };
}

/** "Southampton and Newcastle", "Southampton and 2 other UK ports". */
export const fromPortsLabel = (loadPorts: string[]): string =>
  loadPorts.length === 0 ? 'Port to port'
  : loadPorts.length === 1 ? `From ${loadPorts[0]}`
  : loadPorts.length === 2 ? `From ${loadPorts[0]} and ${loadPorts[1]}`
  : `From ${loadPorts[0]} and ${loadPorts.length - 1} other UK ports`;

/** Oxford-comma-free list: "a, b and c". */
export const listOf = (a: string[]): string =>
  a.length > 1 ? `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}` : a[0] ?? '';
