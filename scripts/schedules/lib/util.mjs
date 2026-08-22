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
export const UK_PORTS = /^(Southampton|Marchwood|Sheerness|Tilbury|Liverpool|Portsmouth|Immingham|Portbury|Killingholme|Teesport|Grimsby|London Gateway|Bristol)$/i;

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
  'Xingang (Tianjin)': 'China', Xingang: 'China', 'Huangpu (Xinsha)': 'China', Xinsha: 'China',
  'Hong Kong': 'Hong Kong', Keelung: 'Taiwan', Toyohashi: 'Japan', Jakarta: 'Indonesia',
  'Port Kelang': 'Malaysia', Norfolk: 'USA', Benicia: 'USA', 'San Diego': 'USA',
  Manta: 'Ecuador', Callao: 'Peru', Cartagena: 'Colombia', 'Santa Marta': 'Colombia',
  Taichung: 'Taiwan', Kaohsiung: 'Taiwan',
  Papeete: 'French Polynesia', Reunion: 'Réunion', Santander: 'Spain',
  Wallhamn: 'Sweden', 'Manzanillo (Panama)': 'Panama',
  // NYK port spellings
  'Long Beach': 'USA', Hitachi: 'Japan', Tomakomai: 'Japan', 'Toyohashi Jinno': 'Japan',
  'Nagoya Kinjyo': 'Japan', 'Yokohama Daikoku': 'Japan', 'Shanghai Haitong Waigaoq.': 'China',
  'Cartagena Puerto Bahia': 'Colombia', 'Manzanillo/Pan': 'Panama', Balboa: 'Panama',
  'San Antonio': 'Chile', Iquique: 'Chile', 'Puerto Cabello': 'Venezuela',
  'Puerto Limon': 'Costa Rica', 'Puerto Caldera': 'Costa Rica', 'Puerto Cortes': 'Honduras',
  'Puerto Quetzal': 'Guatemala', 'Santo To.de Cas': 'Guatemala', Corinto: 'Nicaragua',
  'Santo Domingo': 'Dominican Republic', 'Lazaro Cardenas': 'Mexico', Mundra: 'India',
  Derince: 'Turkey', Iskenderun: 'Turkey', Yarimca: 'Turkey', Aqaba: 'Jordan',
  'East London': 'South Africa', Livorno: 'Italy', Piraeus: 'Greece', Malaga: 'Spain',
  Barcelona: 'Spain', Freeport: 'Bahamas', Newark: 'USA',
};

/** Canal and strait transits: waypoints, never destinations. */
export const WAYPOINTS = /^(Panama Canal|Magellan Strait|Suez Canal)$/i;

// North European rotation legs, not export destinations: a UK departure calling
// these is repositioning around the range, not delivering. Iberia and the Med
// stay in - Santander and Valletta are real destinations on these services.
// Spellings cover WW's variants (Zeebruges, Goteborg, suffixed Turku/Hanko).
export const NORTH_EUROPE = /^(Antwerp|Zeebrugge|Hamburg|Bremerhaven|Amsterdam|Flushing|Rotterdam|Le Havre|Cuxhaven|Esbjerg|Gothenburg|Goteborg|Wallhamn|Drammen|Oslo|Fredericia|Malmo|Gdynia|Uddevalla|Turku[^,]*|Hanko[^,]*|Zeebruges)$/i;

/**
 * Sources spell some ports differently, which fragments the destination filter.
 * There are three real Manzanillos (Panama, Mexico, Dominican Republic), so the
 * qualifier has to survive as the country rather than be dropped.
 */
const DESTINATION_ALIAS = {
  'Manzanillo/Pan': 'Manzanillo, Panama',
  'Manzanillo (Panama)': 'Manzanillo, Panama',
  'Manzanillo (Mexico)': 'Manzanillo, Mexico',
};

export const withCountry = port =>
  DESTINATION_ALIAS[port] || (COUNTRY[port] ? `${port}, ${COUNTRY[port]}` : port);

// Country -> trade lane, for sources whose data does not name one.
const LANE_BY_COUNTRY = {
  'South Africa': 'Europe to Africa', Kenya: 'Europe to Africa', Tanzania: 'Europe to Africa',
  Namibia: 'Europe to Africa', Nigeria: 'Europe to Africa', Ghana: 'Europe to Africa',
  "Côte d'Ivoire": 'Europe to Africa', Senegal: 'Europe to Africa', Benin: 'Europe to Africa',
  Togo: 'Europe to Africa', Angola: 'Europe to Africa', Congo: 'Europe to Africa',
  Cameroon: 'Europe to Africa', Gabon: 'Europe to Africa', Guinea: 'Europe to Africa',
  'Sierra Leone': 'Europe to Africa', Gambia: 'Europe to Africa', Mauritania: 'Europe to Africa',
  Morocco: 'Europe to Africa', 'Equatorial Guinea': 'Europe to Africa', Liberia: 'Europe to Africa',
  Mozambique: 'Europe to Africa', Réunion: 'Europe to Africa', Mauritius: 'Europe to Africa',
  Madagascar: 'Europe to Africa', Mayotte: 'Europe to Africa',
  Australia: 'Europe to Oceania', 'New Zealand': 'Europe to Oceania', 'French Polynesia': 'Europe to Oceania',
  'New Caledonia': 'Europe to Oceania', Fiji: 'Europe to Oceania',
  Singapore: 'Europe to Far East', India: 'Europe to Far East', 'South Korea': 'Europe to Far East',
  China: 'Europe to Far East', Japan: 'Europe to Far East', Malaysia: 'Europe to Far East',
  Thailand: 'Europe to Far East', 'Hong Kong': 'Europe to Far East', Taiwan: 'Europe to Far East',
  Indonesia: 'Europe to Far East',
  UAE: 'Europe to Middle East', 'Saudi Arabia': 'Europe to Middle East', Jordan: 'Europe to Middle East',
  Turkey: 'Europe to Middle East', Oman: 'Europe to Middle East',
  USA: 'Europe to North America', Canada: 'Europe to North America', Mexico: 'Europe to North America',
  Brazil: 'Europe to South America', Argentina: 'Europe to South America', Uruguay: 'Europe to South America',
  Peru: 'Europe to South America', Ecuador: 'Europe to South America', Colombia: 'Europe to South America',
  Chile: 'Europe to South America', Panama: 'Europe to South America',
  Venezuela: 'Europe to South America', 'Costa Rica': 'Europe to Caribbean', Honduras: 'Europe to Caribbean',
  Guatemala: 'Europe to Caribbean', Nicaragua: 'Europe to Caribbean', 'Dominican Republic': 'Europe to Caribbean',
  Bahamas: 'Europe to Caribbean', Barbados: 'Europe to Caribbean', Guyana: 'Europe to Caribbean',
  Grenada: 'Europe to Caribbean', 'St Vincent': 'Europe to Caribbean', 'St Lucia': 'Europe to Caribbean',
  Dominica: 'Europe to Caribbean', 'Sint Maarten': 'Europe to Caribbean', Antigua: 'Europe to Caribbean',
  'St Kitts': 'Europe to Caribbean', Trinidad: 'Europe to Caribbean', 'Curaçao': 'Europe to Caribbean',
  Jamaica: 'Europe to Caribbean', Guadeloupe: 'Europe to Caribbean', Martinique: 'Europe to Caribbean',
  'French Guiana': 'Europe to Caribbean', Suriname: 'Europe to Caribbean', Aruba: 'Europe to Caribbean',
  'Puerto Rico': 'Europe to Caribbean',
  Egypt: 'Europe to Mediterranean', Portugal: 'Europe to Mediterranean',
  Cyprus: 'Europe to Mediterranean', Malta: 'Europe to Mediterranean', Greece: 'Europe to Mediterranean',
  Italy: 'Europe to Mediterranean', Spain: 'Europe to Mediterranean',
};

/** Lane for a "City, Country" destination; 'Europe export' when unknown. */
export const laneFor = destination => {
  const parts = String(destination).split(',');
  const country = parts.length > 1 ? parts[parts.length - 1].trim() : parts[0].trim();
  return LANE_BY_COUNTRY[country] || 'Europe export';
};

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
