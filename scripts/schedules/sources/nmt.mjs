// NMT Shipping - five Europe-origin lane PDFs, refreshed daily by the carrier.
//
// Format: jsPDF, uncompressed streams, text as hex CIDs needing ToUnicode.
// Layout: one block per vessel (name + voyage, then a Port/Arrival/Departure
// rotation table). A sailing is "UK port departure -> every later port".
//
// Best-quality source: dates carry explicit years and ETAs are the carrier's own.
import { pdfRows, rowText } from '../lib/pdf.mjs';
import { fetchCached, dmyToISO, UK_PORTS, withCountry, carrierFromVessel, titleCase } from '../lib/util.mjs';

const SERVICES_API = 'https://nmtshipping.com/api/schedules/services';

// Fallback if the services API is unavailable: every Europe-origin lane NMT
// published as of 2026-08. The list is normally derived at run time so a lane
// NMT adds later is picked up without a code change.
const FALLBACK_LANES = [
  'europe-short-sea-atlantic-sea', 'europe-short-sea-baltic-sea', 'europe-short-sea-black-sea',
  'europe-short-sea-mediterranean-sea', 'europe-short-sea-north-sea',
  'europe-to-africa', 'europe-to-africa-grimaldi-msc', 'europe-to-africa-hoegh-wwl',
  'europe-to-africa-sallaum-niledutch', 'europe-to-caribbean', 'europe-to-far-east',
  'europe-to-mediterranean', 'europe-to-middle-and-far-east', 'europe-to-middle-east',
  'europe-to-middle-east-hoegh-bahri', 'europe-to-north-america', 'europe-to-north-america-nmt',
  'europe-to-oceania', 'europe-to-south-america',
];

const slugify = n => n.replace(/\s+/g, ' ').trim().toLowerCase()
  .replace(/[(),]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Carrier variants ("Europe to Africa (Hoegh-WWL)") are the same trade lane as
// far as the site is concerned, so the parenthetical is dropped to stop the
// lane filter fragmenting.
const laneLabel = n => n.replace(/\s*\([^)]*\)+/g, '').replace(/\s+/g, ' ').trim();

/** Europe-origin lanes, from the API where possible. */
async function listLanes(log) {
  try {
    const services = JSON.parse(await fetchCached(SERVICES_API, { binary: false }));
    const eu = services
      .map(s => String(s.name || ''))
      .filter(n => /^Europe/i.test(n))
      .map(n => ({ slug: slugify(n), lane: laneLabel(n) }));
    if (eu.length) return eu;
    log('  services API returned no Europe lanes, using fallback list');
  } catch {
    log('  services API unavailable, using fallback lane list');
  }
  return FALLBACK_LANES.map(slug => ({
    slug,
    lane: laneLabel(slug.replace(/-/g, ' ').replace(/\beurope\b/i, 'Europe')
      .replace(/\bto\b/, 'to').replace(/\b([a-z])/g, (_, c) => c.toUpperCase())
      .replace(/\bTo\b/, 'to')),
  }));
}

const isDate = t => /^\d{2}\/\d{2}\/\d{2}$/.test(t);

// Rotation legs, not export destinations. A vessel calling Southampton then
// Sheerness or Antwerp is still loading in Europe; listing those as
// "destinations" put UK-to-UK rows in the table.
const NORTH_EUROPE = /^(Antwerp|Zeebrugge|Hamburg|Bremerhaven|Amsterdam|Flushing|Rotterdam|Le Havre|Cuxhaven|Esbjerg)$/i;

// A canal transit is a waypoint, not somewhere cargo discharges.
const WAYPOINT = /^Panama Canal$/i;

export const name = 'NMT Shipping';
export const service = 'roro';
export const url = 'https://nmtshipping.com/schedules';

export async function collect({ log = () => {} } = {}) {
  const sailings = [];
  const lanes = await listLanes(log);
  log(`  ${lanes.length} Europe-origin lanes`);
  let laneFailures = 0;

  for (const { slug, lane } of lanes) {
    let rows;
    try {
      rows = pdfRows(await fetchCached(`https://nmtshipping.com/schedules/${slug}/pdf`));
    } catch (e) {
      // One lane 404ing (renamed, withdrawn) must not lose the other eighteen.
      log(`  ${slug}: skipped (${e.message.slice(0, 60)})`);
      laneFailures++;
      continue;
    }

    const blocks = [];
    let current = null;
    for (const r of rows) {
      const texts = r.cells.map(c => c.text.trim()).filter(Boolean);
      const joined = texts.join(' ');
      if (/^Max weight|^Port$|^Arrival$|^Last updated|Schedule$|^Duration/.test(joined)) continue;

      // Vessel header: a lone all-caps cell of "NAME VOYAGE".
      if (texts.length === 1 && /^[A-Z][A-Z0-9 .'-]+\s+[A-Z0-9]+$/.test(texts[0]) && !isDate(texts[0])) {
        const parts = texts[0].trim().split(/\s+/);
        const voyage = parts.pop();
        current = { vessel: parts.join(' '), voyage, ports: [] };
        blocks.push(current);
        continue;
      }

      const portCell = r.cells.find(c => c.x < 120 && !isDate(c.text));
      const dates = r.cells.filter(c => isDate(c.text)).sort((a, b) => a.x - b.x);
      if (current && portCell && dates.length) {
        current.ports.push({
          port: portCell.text.trim(),
          arrival: dmyToISO(dates.find(d => d.x < 300)?.text),
          departure: dmyToISO(dates.find(d => d.x >= 300)?.text),
        });
      }
    }

    let count = 0;
    for (const b of blocks) {
      for (let i = 0; i < b.ports.length; i++) {
        const from = b.ports[i];
        if (!UK_PORTS.test(from.port)) continue;
        const ets = from.departure || from.arrival;
        if (!ets) continue;
        for (let j = i + 1; j < b.ports.length; j++) {
          const to = b.ports[j];
          if (!to.arrival || to.arrival <= ets) continue;
          if (UK_PORTS.test(to.port) || NORTH_EUROPE.test(to.port) || WAYPOINT.test(to.port)) continue;
          sailings.push({
            loadPort: from.port,
            destination: withCountry(to.port),
            vessel: titleCase(b.vessel),
            voyage: b.voyage,
            carrier: carrierFromVessel(b.vessel),
            ets,
            eta: to.arrival,
            lane,
            notes: from.departure ? '' : 'departure not published, arrival date used',
          });
          count++;
        }
      }
    }
    if (blocks.length || count) log(`  ${slug}: ${blocks.length} rotations -> ${count} UK sailings`);
  }

  if (laneFailures === lanes.length) throw new Error('NMT: every lane failed to fetch');
  return sailings;
}
