// Ellerman City Liners - UK shortsea container feeder, via the WordPress
// table-builder partials behind their schedules page.
//
// The only container source in the schedule that is not ConRo. Ellerman run no
// deep-sea: this is Tilbury/Teesport/Hull/Liverpool into the Netherlands,
// Iberia, Poland and Ireland, which is exactly the range the RoRo carriers
// treat as rotation legs rather than destinations. Worth having because a car
// going to Rotterdam or Bilbao in a box has no other option in this data.
//
// The tables are wpDataTables fed from Google Sheets but rendered server-side,
// so a plain unauthenticated GET of the layout part returns current data - no
// cookies, no headers, no key. /schedules/ only embeds these same partials.
//
// Layout, per service page: alternating pairs of tables. A SCHEDULE table is
// VESSEL | VOYAGE | one ETA/ETD column PAIR per port call, whose first tbody
// row is the literal "ETA"/"ETD" label row. A NOTES table (3 columns) follows
// it and is joined back on vessel+voyage for the delay flag.
//
// Two traps, both of which silently produce wrong sailings:
//
//  1. The header does NOT list ports in sailing order. iNEX 1 reads Leixoes,
//     Setubal, Tilbury, Rotterdam but the rotation is Setubal-Leixoes-Tilbury-
//     Rotterdam, and a Tilbury departure late in the month arrives at Leixoes
//     on the NEXT loop - column order would call that a backwards leg and drop
//     it. Rotation is therefore derived from date order, never column order.
//
//  2. A port called twice in one rotation is disambiguated with a stray hyphen
//     inside or outside the parens - "BILBAO (CSP-)", "GDYNIA (OT)-" - so the
//     header has to be normalised down to bare letters before it is a port.
//
// The destination COUNTRY is the one required field the source never publishes,
// hence the port table below. It is a closed set of about a dozen ports; a new
// one falls back to util's shared COUNTRY map and is dropped with a log line if
// that does not know it either, rather than entering the table countryless.
import { fetchCached, dmyToISO, UK_PORTS, titleCase, withCountry, laneFor } from '../lib/util.mjs';

const BASE = 'https://ellermanlines.com';
const PAGE = `${BASE}/schedules/`;
const PART = slug => `${BASE}/tbuilder-layout-part/${slug}/`;

// Discovery reads these off /schedules/; the list is the floor, so a renamed
// service page cannot quietly empty the source.
const KNOWN_SLUGS = ['shortsea', 'shortsea-ipex', 'shortsea-ibex', 'shortsea-baltex-1'];

/** Ellerman's whole port range. Nothing else calls, so this is the country. */
const COUNTRIES = {
  Rotterdam: 'Netherlands', Antwerp: 'Belgium',
  Leixoes: 'Portugal', Setubal: 'Portugal', Lisbon: 'Portugal',
  Bilbao: 'Spain', Cadiz: 'Spain', Vigo: 'Spain',
  Szczecin: 'Poland', Gdynia: 'Poland', Gdansk: 'Poland',
  Klaipeda: 'Lithuania', Riga: 'Latvia', Tallinn: 'Estonia',
  Dublin: 'Ireland',
};

// Hull is a genuine UK departure (the weekly iPEX Szczecin box service) that
// the shared UK_PORTS list does not carry, because no RoRo carrier calls there.
// Widened here rather than in util.mjs so this source cannot change anyone
// else's output.
const EXTRA_UK = /^(Hull|Grangemouth)$/i;
const isUkPort = p => UK_PORTS.test(p) || EXTRA_UK.test(p);

// "Vessel sailing on proforma" / "Vessel on schedule" is the normal case and
// says nothing. Only the exceptions are worth putting in front of a customer.
const ROUTINE_NOTE = /^\s*vessel\s+(sailing\s+on\s+proforma|calling\s+on\s+schedule|on\s+schedule)\.?\s*$/i;

const strip = h => h
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#\d+;/g, ' ')
  .replace(/\s+/g, ' ').trim();

/** "LEIXOES (YILPORT)." / "GDYNIA (OT)-" / "BILBAO (CSP-)" -> "Leixoes". */
const portFromHeader = h =>
  titleCase(strip(h).replace(/\s*\([^)]*\)\s*/g, ' ').replace(/[^A-Z ]/gi, ' ').replace(/\s+/g, ' ').trim());

/** The service name, e.g. "Shortsea Schedule (iNEX 1)" -> "iNEX 1". */
const SERVICE_HEADING = /Shortsea Schedule\s*\(([^)<]{1,24})\)/i;

/**
 * Every <table> on the page, tagged with the service heading that precedes it.
 * A page carries several services and the heading is the only thing that names
 * them, so it is carried forward until the next one appears.
 */
function tablesWithHeadings(html) {
  const out = [];
  const chunks = html.split(/<table/i);
  let heading = (chunks[0].match(SERVICE_HEADING) || [])[1]?.trim() || '';

  for (let i = 1; i < chunks.length; i++) {
    const body = chunks[i].split(/<\/table>/i)[0];
    const after = chunks[i].split(/<\/table>/i)[1] || '';

    const thead = (body.match(/<thead[\s\S]*?<\/thead>/i) || [''])[0];
    const tbody = (body.match(/<tbody[\s\S]*?<\/tbody>/i) || [''])[0];
    out.push({
      heading,
      header: [...thead.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map(m => strip(m[1])),
      rows: [...tbody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
        .map(r => [...r[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(c => strip(c[1]))),
    });
    // The next service's heading sits in the markup after this table closes.
    const next = (strip(after).match(SERVICE_HEADING) || [])[1];
    if (next) heading = next.trim();
  }
  return out;
}

/**
 * Header -> the port call each ETA/ETD column pair belongs to. Returns null for
 * a notes table (3 columns, no pairs), which is how the two shapes are told
 * apart - the markup gives them the same classes.
 */
function portColumns(header, labelRow) {
  if (header.length < 4 || (header.length - 2) % 2) return null;
  const cols = [];
  for (let i = 2; i < header.length; i += 2) {
    const port = portFromHeader(header[i]);
    if (!port || port !== portFromHeader(header[i + 1])) return null;
    // Trust the label row where it is filled in; some pairs (iBEX 2's
    // Liverpool) ship it blank, and those are ETA-then-ETD positionally.
    const flipped = /^ETD$/i.test(labelRow?.[i] || '') && /^ETA$/i.test(labelRow?.[i + 1] || '');
    cols.push({ port, eta: flipped ? i + 1 : i, etd: flipped ? i : i + 1 });
  }
  return cols;
}

function destinationFor(port) {
  const country = COUNTRIES[port];
  if (country) return `${port}, ${country}`;
  const viaUtil = withCountry(port);
  return viaUtil.includes(',') ? viaUtil : null;
}

export const name = 'Ellerman City Liners';
// Lift-on/lift-off container feeder. A car travels in a box, not driven
// aboard - a customer quoted a RoRo transit for this would be buying the
// wrong service, and the loading requirements differ entirely.
export const service = 'container';
export const url = PAGE;

async function findSlugs({ log }) {
  let discovered = [];
  try {
    const html = await fetchCached(PAGE, { binary: false, maxAgeMinutes: 60 });
    discovered = [...new Set([...html.matchAll(/tbuilder-layout-part\/([a-z0-9-]+)/gi)].map(m => m[1]))];
  } catch (e) {
    log(`  service discovery failed (${e.message.slice(0, 40)}), using the known list`);
  }
  const slugs = [...new Set([...KNOWN_SLUGS, ...discovered])];
  const extra = discovered.filter(s => !KNOWN_SLUGS.includes(s));
  if (extra.length) log(`  new service page(s) discovered: ${extra.join(', ')}`);
  return slugs;
}

export async function collect({ log = () => {} } = {}) {
  const slugs = await findSlugs({ log });

  const sailings = [];
  const unknownPorts = new Set();
  // Ellerman number the northbound and southbound halves of one loop as two
  // voyages, so the Tilbury-Rotterdam leg is printed on both rows (v044 and
  // v045 both show Tilbury 22/09 -> Rotterdam 23/09). One ship leaving one
  // port on one day is one sailing, whatever the voyage number says.
  const seen = new Set();

  for (const slug of slugs) {
    let tables;
    try {
      tables = tablesWithHeadings(await fetchCached(PART(slug), { binary: false, maxAgeMinutes: 60 }));
    } catch (e) {
      log(`  ${slug}: fetch failed (${e.message.slice(0, 40)})`);
      continue;
    }

    let kept = 0;
    for (let t = 0; t < tables.length; t++) {
      const { heading, header, rows } = tables[t];
      const cols = portColumns(header, rows[0]);
      if (!cols) continue; // notes table, or a shape we do not recognise
      const svc = heading || slug;

      // The following table is this service's notes, joined on vessel+voyage.
      const notesTable = tables[t + 1];
      const notes = new Map();
      if (notesTable && /notes/i.test(notesTable.header[2] || '')) {
        for (const [v, voy, note] of notesTable.rows) {
          if (note && !ROUTINE_NOTE.test(note)) notes.set(`${v}|${voy}`.toLowerCase(), note.replace(/\.$/, ''));
        }
      }

      // Row 0 is the literal ETA/ETD label row, not a sailing.
      for (const row of rows.slice(1)) {
        const vessel = row[0], voyage = row[1];
        if (!vessel || !voyage) continue;

        const stops = [];
        for (const c of cols) {
          const eta = dmyToISO(row[c.eta]);
          const etd = dmyToISO(row[c.etd]);
          if (!eta && !etd) continue; // "n/a" - the vessel omits this call
          stops.push({ port: c.port, eta, etd, at: eta || etd });
        }
        if (stops.length < 2) continue;
        // Rotation by DATE, not by column - see the header note at the top.
        stops.sort((a, b) => a.at.localeCompare(b.at));

        // Keep the first arrival at each destination after a given UK sailing:
        // a rotation that calls Bilbao twice would otherwise publish the
        // return leg as a second, slower transit of the same lane.
        const best = new Map();
        for (let i = 0; i < stops.length; i++) {
          const from = stops[i];
          if (!from.etd || !isUkPort(from.port)) continue;
          for (let j = i + 1; j < stops.length; j++) {
            const to = stops[j];
            if (!to.eta || to.eta < from.etd) continue;
            if (isUkPort(to.port)) continue; // coastal Teesport-Tilbury leg, not an export
            const destination = destinationFor(to.port);
            if (!destination) { unknownPorts.add(to.port); continue; }
            const key = `${from.port}|${destination}`;
            const prev = best.get(key);
            if (!prev || to.eta < prev.eta) best.set(key, { from, to, destination });
          }
        }

        for (const { from, to, destination } of best.values()) {
          const key = `${vessel}|${from.port}|${destination}|${from.etd}`.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          sailings.push({
            loadPort: from.port,
            destination,
            // Already published in mixed case ("CS Arctic", "CT Pachuca"), so
            // titleCase would damage the name rather than fix it.
            vessel: vessel.replace(/\s+/g, ' ').trim(),
            voyage: String(voyage).trim(),
            carrier: 'Ellerman City Liners',
            ets: from.etd,
            eta: to.eta,
            lane: laneFor(destination),
            notes: notes.get(`${vessel}|${voyage}`.toLowerCase()) || '',
          });
          kept++;
        }
      }
      log(`  ${svc} (${cols.map(c => c.port).join(' - ')}): ${kept} UK departures`);
      kept = 0;
    }
  }

  if (unknownPorts.size) log(`  no country known for: ${[...unknownPorts].join(', ')} - dropped`);
  if (!sailings.length) throw new Error('Ellerman City Liners: no sailings parsed - layout changed');
  return sailings;
}
