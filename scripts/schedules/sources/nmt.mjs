// NMT Shipping - five Europe-origin lane PDFs, refreshed daily by the carrier.
//
// Format: jsPDF, uncompressed streams, text as hex CIDs needing ToUnicode.
// Layout: one block per vessel (name + voyage, then a Port/Arrival/Departure
// rotation table). A sailing is "UK port departure -> every later port".
//
// Best-quality source: dates carry explicit years and ETAs are the carrier's own.
import { pdfRows, rowText } from '../lib/pdf.mjs';
import { fetchCached, dmyToISO, UK_PORTS, withCountry, carrierFromVessel, titleCase } from '../lib/util.mjs';

const LANES = {
  'europe-to-africa': 'Europe to Africa',
  'europe-to-far-east': 'Europe to Far East',
  'europe-to-oceania': 'Europe to Oceania',
  'europe-to-north-america': 'Europe to North America',
  'europe-to-south-america': 'Europe to South America',
};

const isDate = t => /^\d{2}\/\d{2}\/\d{2}$/.test(t);

export const name = 'NMT Shipping';
export const url = 'https://nmtshipping.com/schedules';

export async function collect({ log = () => {} } = {}) {
  const sailings = [];

  for (const [slug, lane] of Object.entries(LANES)) {
    const buf = await fetchCached(`https://nmtshipping.com/schedules/${slug}/pdf`);
    const rows = pdfRows(buf);

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
    log(`  ${slug}: ${blocks.length} rotations -> ${count} UK sailings`);
  }

  return sailings;
}
