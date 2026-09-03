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
import { hubPorts } from './destinations';

export interface ScheduleFacts {
  /** Upcoming sailings found for this country (or its hub ports). */
  count: number;
  /** e.g. "4-8 weeks", or null when nothing upcoming is scheduled. */
  transit: string | null;
  /** Discharge ports actually served, deduplicated (see dedupePorts). */
  ports: string[];
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

const rowsFor = (country: string) =>
  (schedules.sailings as any[]).filter(
    s => countryOf(s.destination).toLowerCase() === country.toLowerCase() && s.ets >= todayISO(),
  );

const summarise = (rows: any[]): Omit<ScheduleFacts, 'via'> => {
  const days = rows
    .map(r => (new Date(r.eta).getTime() - new Date(r.ets).getTime()) / 86400000)
    .filter(n => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
  const lo = days.length ? Math.max(1, Math.floor(days[0] / 7)) : 0;
  const hi = days.length ? Math.max(lo + 1, Math.ceil(days[days.length - 1] / 7)) : 0;
  return {
    count: rows.length,
    transit: days.length ? `${lo}-${hi} weeks` : null,
    ports: dedupePorts(rows.map(r => r.destination.split(',')[0].trim())),
    loadPorts: [...new Set(rows.map(r => r.loadPort).filter(Boolean))],
    // Blank carrier strings are common in the aggregator sources and rendered
    // an empty "Shipping Lines" fact before they were filtered here.
    carriers: [...new Set(rows.map(r => (r.carrier || '').trim()).filter(Boolean))],
  };
};

/**
 * Live schedule facts for a country. A landlocked country resolves through the
 * hub ports in destinations.ts — Uganda reads Mombasa and Dar es Salaam — and
 * carries `via` so the page can say the transit covers the sea leg only.
 */
export function scheduleFactsFor(country: string): ScheduleFacts {
  const direct = rowsFor(country);
  if (direct.length) return summarise(direct);

  const hubs = hubPorts[country];
  if (hubs?.length) {
    const legs = hubs.map(h => {
      const i = h.indexOf(',');
      return { country: h.slice(0, i).trim(), port: h.slice(i + 1).trim() };
    });
    const rows = legs.flatMap(l => rowsFor(l.country));
    if (rows.length) {
      return { ...summarise(rows), ports: legs.map(l => l.port), via: legs };
    }
  }
  return { count: 0, transit: null, ports: [], loadPorts: [], carriers: [] };
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
