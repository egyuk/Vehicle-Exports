// Fetching, caching and the shared date/geography helpers.
import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, '.cache');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

/**
 * Download a source, caching it so a re-run during the same session does not
 * hammer the carriers. Pass { maxAgeMinutes: 0 } to always refetch.
 */
export async function fetchCached(url, { maxAgeMinutes = 60, binary = true } = {}) {
  mkdirSync(CACHE, { recursive: true });
  const file = join(CACHE, url.replace(/[^a-z0-9]+/gi, '_').slice(-120));

  if (existsSync(file) && maxAgeMinutes > 0) {
    const ageMin = (Date.now() - statSync(file).mtimeMs) / 60000;
    if (ageMin < maxAgeMinutes) return binary ? readFileSync(file) : readFileSync(file, 'utf8');
  }

  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(file, buf);
  return binary ? buf : buf.toString('utf8');
}

// --- dates -----------------------------------------------------------------

export const MONTHS = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

/** "07/07/26" or "7/7/2026" -> 2026-07-07 */
export const dmyToISO = d => {
  const m = String(d).match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (!m) return null;
  const yr = m[3].length === 2 ? `20${m[3]}` : m[3];
  return `${yr}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
};

/** "12-Jul" needs a year supplied by the caller (the schedule's own year). */
export const dayMonToISO = (d, year) => {
  const m = String(d).match(/^(\d{1,2})[-\s]([A-Za-z]{3})$/);
  if (!m) return null;
  const mm = MONTHS[m[2].toLowerCase()];
  return mm ? `${year}-${mm}-${m[1].padStart(2, '0')}` : null;
};

/** "12/08" with an explicit year. */
export const dayMonNumToISO = (d, year) => {
  const m = String(d).match(/^(\d{1,2})\/(\d{1,2})$/);
  return m ? `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
};

export const addDays = (iso, n) => {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

export const fmtShort = iso =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

// --- geography -------------------------------------------------------------

/** UK load ports. Only sailings departing these end up in the table. */
export const UK_PORTS = /^(Southampton|Sheerness|Tilbury|Liverpool|Portsmouth|Immingham|Portbury|Killingholme|Teesport|Grimsby|London Gateway)$/i;

export const COUNTRY = {
  Durban: 'South Africa', 'Port Elizabeth': 'South Africa', 'Cape Town': 'South Africa',
  Mombasa: 'Kenya', 'Dar es Salaam': 'Tanzania', 'Walvis Bay': 'Namibia', Lagos: 'Nigeria',
  Tema: 'Ghana', Takoradi: 'Ghana', Abidjan: "Côte d'Ivoire", Dakar: 'Senegal', Cotonou: 'Benin',
  Lome: 'Togo', Luanda: 'Angola', 'Pointe Noire': 'Congo', 'Point Noire': 'Congo',
  Douala: 'Cameroon', Libreville: 'Gabon', Conakry: 'Guinea', Freetown: 'Sierra Leone',
  Banjul: 'Gambia', Nouakchott: 'Mauritania', Casablanca: 'Morocco', Bata: 'Equatorial Guinea',
  Malabo: 'Equatorial Guinea', Monrovia: 'Liberia', Maputo: 'Mozambique', Beira: 'Mozambique',
  Melbourne: 'Australia', Sydney: 'Australia', Brisbane: 'Australia', Fremantle: 'Australia',
  Adelaide: 'Australia', 'Port Kembla': 'Australia', Auckland: 'New Zealand',
  Wellington: 'New Zealand', Lyttelton: 'New Zealand', Nelson: 'New Zealand', Napier: 'New Zealand',
  Singapore: 'Singapore', Mumbai: 'India', Chennai: 'India', Pyeongtaek: 'South Korea',
  Masan: 'South Korea', Shanghai: 'China', Xingang: 'China', Yokohama: 'Japan', Nagoya: 'Japan',
  Kobe: 'Japan', 'Port Klang': 'Malaysia', 'Laem Chabang': 'Thailand',
  'Jebel Ali': 'UAE', Dammam: 'Saudi Arabia', Jeddah: 'Saudi Arabia',
  Baltimore: 'USA', Brunswick: 'USA', Charleston: 'USA', Galveston: 'USA', Jacksonville: 'USA',
  'New York': 'USA', Davisville: 'USA', 'Port Hueneme': 'USA', Tacoma: 'USA', Houston: 'USA',
  Halifax: 'Canada', Vancouver: 'Canada', Veracruz: 'Mexico', Altamira: 'Mexico',
  Santos: 'Brazil', Paranagua: 'Brazil', 'Rio de Janeiro': 'Brazil', Itajai: 'Brazil',
  Vitoria: 'Brazil', Suape: 'Brazil', 'Rio Grande': 'Brazil', Zarate: 'Argentina',
  'Buenos Aires': 'Argentina', Montevideo: 'Uruguay', Limassol: 'Cyprus', Valletta: 'Malta',
};

export const withCountry = port => (COUNTRY[port] ? `${port}, ${COUNTRY[port]}` : port);

/**
 * Name a carrier only where the vessel name makes it unambiguous. A wrong
 * carrier on a booking list is worse than a blank cell.
 */
export const carrierFromVessel = v =>
  /^h(oe|ö)gh/i.test(v) ? 'Höegh Autoliners' :
  /^glovis/i.test(v) ? 'Hyundai Glovis' :
  /^grande\b/i.test(v) ? 'Grimaldi' : '';

export const titleCase = s =>
  s.replace(/\b[A-Z]{2,}\b/g, w => w.charAt(0) + w.slice(1).toLowerCase()).replace(/\s+/g, ' ').trim();
