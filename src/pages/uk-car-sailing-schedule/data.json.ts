import schedules from '../../data/sailing-schedules.json';

// The full sailing list for the schedule page's client script. It lives here,
// out of the page HTML, so the page ships only the next few departures and
// stays light; the script fetches this after first paint and takes over
// filtering, sorting and pagination.
//
// Destinations arrive pre-flipped to "Country, Port" because that is what the
// page's destination <select> uses as option values.

const flipDest = (d: string) => {
  const i = d.lastIndexOf(',');
  return i === -1 ? d : `${d.slice(i + 1).trim()}, ${d.slice(0, i).trim()}`;
};

export function GET() {
  const sailings = (schedules.sailings as any[])
    .map(s => ({
      ets: s.ets,
      eta: s.eta || '',
      port: s.loadPort,
      dest: flipDest(s.destination),
      vessel: s.vessel,
      carrier: s.carrier || '',
      voyage: s.voyage || '',
      lane: s.lane || '',
      notes: s.notes || '',
      ...(s.example ? { example: true } : {}),
    }))
    .sort((a, b) => String(a.ets).localeCompare(String(b.ets)));

  return new Response(JSON.stringify({ updated: schedules.updated, sailings }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
