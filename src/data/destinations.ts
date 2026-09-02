// Master list of individual destination countries, grouped by continent, with
// the ports we ship to in each. Used by:
//  - src/pages/car-shipping/index.astro  (Countries We Ship To, Export Destinations)
//  - src/components/Header.astro         ("Countries" mega menu)
//
// Countries and ports are a fixed list, NOT derived from the sailing schedule at
// build time: src/data/sailing-schedules.json is rebuilt every week from what
// the carriers currently publish, so anything derived from it appears and
// vanishes week to week. This list was seeded from the schedule on 2026-09-02
// (every destination country, every port seen, spellings tidied) plus the old
// site's list (Gambia, Mozambique, Zimbabwe, plus ports) and a few hub-served
// markets (Botswana, Uganda, Bangladesh, Sri Lanka, Cayman Islands). To find
// ports the schedule has since gained, run from the repo root:
//
//   node -e "const s=require('./src/data/sailing-schedules.json').sailings;const m={};for(const r of s){const i=r.destination.lastIndexOf(',');(m[r.destination.slice(i+1).trim()]??=new Set()).add(r.destination.slice(0,i).trim())}console.log(m)"
//
// and add what is missing below by hand.

export interface CountryLink {
  name: string;
  href: string;
  /** Ports we deliver to in this country, alphabetical (or the hub we route through). */
  ports: string[];
}

// Countries with a page of their own link there. Everything else links to the
// sailing schedule filtered to that country, so no nav link 404s while the
// remaining country pages are still to be written (see SITE-BACKLOG.md §1).
const countryPages: Record<string, string> = {
  Australia: '/car-shipping/australia',
  'Hong Kong': '/car-shipping/hong-kong-shipping',
  Ireland: '/car-shipping/ireland',
  Kenya: '/car-shipping/kenya',
  Malta: '/car-shipping/europe/malta',
  USA: '/usa-import-america-car-shipping',
};

// Where the schedule data names a country differently from the menu.
const scheduleNames: Record<string, string> = {
  'Trinidad and Tobago': 'Trinidad',
};

// Landlocked destinations and the ports vehicles are landed at for them, as
// "Country, Port" (the schedule page's destination filter values) so the
// schedule page can point its empty state at those sailings. Usual port first.
export const hubPorts: Record<string, string[]> = {
  Botswana: ['Namibia, Walvis Bay', 'South Africa, Durban'],
  Uganda: ['Kenya, Mombasa'],
  Zimbabwe: ['South Africa, Durban', 'Mozambique, Beira'],
};
const via = (name: string) => 'via ' + hubPorts[name].map(h => h.split(', ')[1]).join(' or ');

// Hong Kong and Singapore are city states, so the port is the country and is
// left out. The landlocked countries show the hub port they are reached via
// (Zimbabwe's entry keeps the old site's delivery points).
const countryPorts: Record<string, string[]> = {
  Angola: ['Luanda'],
  Antigua: ["St John's"],
  Argentina: ['Zárate'],
  Aruba: ['Oranjestad'],
  Australia: ['Brisbane', 'Fremantle', 'Melbourne', 'Port Kembla (Sydney)'],
  Bahamas: ['Nassau'],
  Bangladesh: ['Chittagong'],
  Barbados: ['Bridgetown'],
  Benin: ['Cotonou'],
  Botswana: [via('Botswana')],
  Brazil: ['Paranaguá', 'Rio de Janeiro', 'Santos', 'Vitória'],
  Cameroon: ['Douala'],
  Canada: ['Halifax', 'Vancouver'],
  'Cayman Islands': ['George Town'],
  Chile: ['San Antonio'],
  China: ['Shanghai', 'Xingang (Tianjin)', 'Xinsha (Guangzhou)', 'Yantai'],
  Colombia: ['Cartagena', 'Santa Marta', 'Turbo'],
  Congo: ['Pointe-Noire'],
  "Côte d'Ivoire": ['Abidjan'],
  Curaçao: ['Willemstad'],
  Cyprus: ['Limassol'],
  Dominica: ['Roseau'],
  'Dominican Republic': ['Manzanillo', 'Santo Domingo'],
  Ecuador: ['Manta'],
  'Equatorial Guinea': ['Bata', 'Malabo'],
  'French Guiana': ['Dégrad des Cannes'],
  'French Polynesia': ['Papeete'],
  Gambia: ['Banjul'],
  Ghana: ['Takoradi', 'Tema'],
  Greece: ['Piraeus'],
  Grenada: ["St George's"],
  Guadeloupe: ['Pointe-à-Pitre'],
  Guernsey: ['St Peter Port'],
  Guinea: ['Conakry'],
  Guyana: ['Georgetown'],
  'Hong Kong': [],
  India: ['Ennore', 'Mumbai', 'Pipavav'],
  Indonesia: ['Jakarta (Tanjung Priok)'],
  Ireland: ['Dublin', 'Rosslare'],
  Italy: ['Livorno'],
  Jamaica: ['Kingston'],
  Japan: ['Hitachi', 'Kobe', 'Nagoya', 'Tomakomai', 'Toyohashi', 'Yokohama'],
  Jersey: ['St Helier'],
  Jordan: ['Aqaba'],
  Kenya: ['Mombasa'],
  Madagascar: ['Tamatave'],
  Malaysia: ['Port Klang'],
  Malta: ['Valletta'],
  Martinique: ['Fort-de-France'],
  Mauritania: ['Nouakchott'],
  Mauritius: ['Port Louis'],
  Mexico: ['Altamira', 'Lázaro Cárdenas', 'Manzanillo', 'Veracruz'],
  Morocco: ['Casablanca', 'Tangier'],
  Mozambique: ['Beira', 'Maputo'],
  Namibia: ['Walvis Bay'],
  'New Caledonia': ['Nouméa'],
  'New Zealand': ['Auckland', 'Lyttelton', 'Nelson', 'Wellington'],
  Nigeria: ['Lagos (Apapa, Tin Can Island)'],
  Oman: ['Muscat (Port Sultan Qaboos)'],
  Panama: ['Manzanillo'],
  Peru: ['Callao', 'Pisco'],
  'Puerto Rico': ['San Juan'],
  Réunion: ['Port Réunion'],
  'Saudi Arabia': ['Jeddah'],
  Senegal: ['Dakar'],
  'Sierra Leone': ['Freetown'],
  Singapore: [],
  'Sint Maarten': ['Philipsburg'],
  'South Africa': ['Cape Town', 'Durban', 'East London', 'Port Elizabeth'],
  'South Korea': ['Kunsan', 'Masan', 'Pyeongtaek'],
  Spain: ['Pasajes', 'Sagunto', 'Santander', 'Vigo'],
  'Sri Lanka': ['Colombo'],
  'St Kitts': ['Basseterre'],
  'St Lucia': ['Castries'],
  'St Vincent': ['Kingstown'],
  Suriname: ['Paramaribo'],
  Sweden: ['Wallhamn'],
  Taiwan: ['Keelung', 'Taichung'],
  Tanzania: ['Dar es Salaam'],
  Thailand: ['Laem Chabang'],
  Togo: ['Lomé'],
  'Trinidad and Tobago': ['Port of Spain'],
  Turkey: ['Derince', 'Yarimca'],
  Uganda: [via('Uganda')],
  Uruguay: ['Montevideo'],
  USA: [
    'Baltimore', 'Benicia', 'Brunswick', 'Charleston', 'Davisville', 'Galveston', 'Jacksonville',
    'Long Beach', 'New York', 'Norfolk', 'Port Hueneme', 'San Diego', 'Tacoma',
  ],
  Zimbabwe: [`${via('Zimbabwe')} (Beitbridge, Plumtree, Harare)`],
};

// Africa is split the way the carriers' services are: the Atlantic seaboard
// from Morocco round to Angola, and the Indian Ocean side plus the south.
// (One "Africa" group of 26 made the desktop menu panel too tall.)
const continentNames: Record<string, string[]> = {
  'West Africa': [
    'Angola', 'Benin', 'Cameroon', 'Congo', "Côte d'Ivoire", 'Equatorial Guinea', 'Gambia',
    'Ghana', 'Guinea', 'Mauritania', 'Morocco', 'Nigeria', 'Senegal', 'Sierra Leone', 'Togo',
  ],
  'East & Southern Africa': [
    'Botswana', 'Kenya', 'Madagascar', 'Mauritius', 'Mozambique', 'Namibia', 'Réunion',
    'South Africa', 'Tanzania', 'Uganda', 'Zimbabwe',
  ],
  Asia: [
    'Bangladesh', 'China', 'Hong Kong', 'India', 'Indonesia', 'Japan', 'Malaysia', 'Singapore',
    'South Korea', 'Sri Lanka', 'Taiwan', 'Thailand',
  ],
  Caribbean: [
    'Antigua', 'Aruba', 'Bahamas', 'Barbados', 'Cayman Islands', 'Curaçao', 'Dominica',
    'Dominican Republic', 'Grenada', 'Guadeloupe', 'Jamaica', 'Martinique', 'Puerto Rico',
    'Sint Maarten', 'St Kitts', 'St Lucia', 'St Vincent', 'Trinidad and Tobago',
  ],
  Europe: ['Cyprus', 'Greece', 'Guernsey', 'Ireland', 'Italy', 'Jersey', 'Malta', 'Spain', 'Sweden'],
  'Middle East': ['Jordan', 'Oman', 'Saudi Arabia', 'Turkey'],
  'North America': ['Canada', 'Mexico', 'USA'],
  Oceania: ['Australia', 'French Polynesia', 'New Caledonia', 'New Zealand'],
  'South & Central America': [
    'Argentina', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'French Guiana', 'Guyana', 'Panama',
    'Peru', 'Suriname', 'Uruguay',
  ],
};

const hrefFor = (name: string) =>
  countryPages[name] ?? `/uk-car-sailing-schedule?country=${encodeURIComponent(scheduleNames[name] ?? name)}`;

export const continentCountries: Record<string, CountryLink[]> = Object.fromEntries(
  Object.entries(continentNames).map(([continent, names]) => [
    continent,
    names.map(name => ({ name, href: hrefFor(name), ports: countryPorts[name] ?? [] })),
  ]),
);
