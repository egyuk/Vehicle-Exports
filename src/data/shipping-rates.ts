// The published RoRo and container rate tables, as shown on
// /car-shipping/shipping-rates. Moved out of that page on 2026-09-03 so the
// country pages can read the same figures instead of a second, hand-kept copy.
//
// ⚠ IMPORTANT — THESE ARE NOT THE SAME PRODUCT AS THE COUNTRY-PAGE RATES.
// The page these came from labels them "Approximately, call for latest rates",
// and they read as port-to-port freight: Australia is £771 here but £1,250 on
// the Australia country page, whose "what is included" list also covers UK
// customs clearance, port handling, DVLA paperwork and courier costs. The
// uplift is not a constant (Australia +£479, Kenya +£351), so a country-page
// price CANNOT be derived from these figures by formula.
//
// So: src/data/shipping-prices.ts holds curated, all-in country-page rates and
// always wins. These tables are only a labelled fallback for countries that
// have no curated rate yet — shown as "approximate" with a link to the full
// rate table, never passed off as an all-in price. See CountryCosts.astro.

export interface RoroRate {
  country: string;
  port: string;
  price: string;
}

export interface ContainerRate {
  country: string;
  port: string;
  c20: string;
  c40: string;
}

export const roroPrices: RoroRate[] = [
  { country: 'Antigua', port: 'St Johns', price: '£1,341' },
  { country: 'Australia', port: 'Adelaide', price: '£771' },
  { country: 'Australia', port: 'Brisbane', price: '£771' },
  { country: 'Australia', port: 'Fremantle', price: '£771' },
  { country: 'Australia', port: 'Melbourne', price: '£771' },
  { country: 'Australia', port: 'Sydney', price: '£771' },
  { country: 'Bahamas', port: 'Nassau', price: '£1,257' },
  { country: 'Bahrain', port: 'Bahrain', price: '£812' },
  { country: 'Barbados', port: 'Bridgetown', price: '£1,341' },
  { country: 'Canada', port: 'Halifax', price: '£912' },
  { country: 'Canada', port: 'Vancouver', price: '£2,301' },
  { country: 'China', port: 'Hong Kong', price: '£437' },
  { country: 'Colombia', port: 'Cartagena', price: '£966' },
  { country: 'Colombia', port: 'Santa Marta', price: '£1,257' },
  { country: 'Cyprus', port: 'Limassol', price: '£481' },
  { country: 'Dominica', port: 'Roseau', price: '£1,341' },
  { country: 'Dominican Republic', port: 'Santo Domingo', price: '£1,257' },
  { country: 'Egypt', port: 'Alexandria', price: '£947' },
  { country: 'Ethiopia', port: 'Djibouti', price: '£974' },
  { country: 'French Guiana', port: 'Degrad Des Cannes', price: '£1,454' },
  { country: 'Grand Caymen', port: 'George Town', price: '£3,200' },
  { country: 'Greece', port: 'Piraeus', price: '£738' },
  { country: 'Grenada', port: 'St Georges', price: '£1,341' },
  { country: 'Guadeloupe', port: 'Point A Pitre', price: '£1,274' },
  { country: 'Guyana', port: 'Georgetown', price: '£1,591' },
  { country: 'Haiti', port: 'Port Au Prince', price: '£1,257' },
  { country: 'Israel', port: 'Ashdod', price: '£890' },
  { country: 'Italy', port: 'Civitavecchia', price: '£640' },
  { country: 'Italy', port: 'Livorno', price: '£640' },
  { country: 'Italy', port: 'Palermo', price: '£738' },
  { country: 'Italy', port: 'Salerno', price: '£640' },
  { country: 'Italy', port: 'Savona', price: '£640' },
  { country: 'Jamaica', port: 'Kingston', price: '£1,049' },
  { country: 'Japan', port: 'Toyohashi', price: '£882' },
  { country: 'Japan', port: 'Yokohama', price: '£882' },
  { country: 'Kenya', port: 'Mombasa', price: '£899' },
  { country: 'Kuwait', port: 'Kuwait', price: '£812' },
  { country: 'Lebanon', port: 'Beirut', price: '£886' },
  { country: 'Madagascar', port: 'Tamatave', price: '£1,274' },
  { country: 'Malaysia', port: 'Port Kelang', price: '£903' },
  { country: 'Malta', port: 'Valletta', price: '£760' },
  { country: 'Martinique', port: 'Fort de France', price: '£1,274' },
  { country: 'Mauritius', port: 'Port Louis', price: '£1,374' },
  { country: 'Mexico', port: 'Altamira', price: '£882' },
  { country: 'Mexico', port: 'Vera Cruz', price: '£882' },
  { country: 'Morocco', port: 'Casablanca', price: '£650' },
  { country: 'Morocco', port: 'Tangier', price: '£941' },
  { country: 'Mozambique', port: 'Maputo', price: '£899' },
  { country: 'Myanmar', port: 'Yangon', price: '£2,038' },
  { country: 'Namibia', port: 'Walvis Bay', price: '£937' },
  { country: 'New Zealand', port: 'Auckland', price: '£630' },
  { country: 'New Zealand', port: 'Hamilton', price: '£1,056' },
  { country: 'New Zealand', port: 'Lyttelton', price: '£630' },
  { country: 'New Zealand', port: 'Napier', price: '£630' },
  { country: 'New Zealand', port: 'Nelson', price: '£630' },
  { country: 'New Zealand', port: 'Port Chalmers', price: '£630' },
  { country: 'New Zealand', port: 'Taupo', price: '£1,115' },
  { country: 'New Zealand', port: 'Tauranga', price: '£630' },
  { country: 'New Zealand', port: 'Wellington', price: '£1,203' },
  { country: 'Norway', port: 'Drammen', price: '£610' },
  { country: 'Oman', port: 'Sohar', price: '£812' },
  { country: 'Panama', port: 'Manzanillo', price: '£1,257' },
  { country: 'Portugal', port: 'Setubal', price: '£603' },
  { country: 'Puerto Rico', port: 'San Juan', price: '£1,049' },
  { country: 'Qatar', port: 'Hamad Port', price: '£812' },
  { country: 'Saint Kitts', port: 'Basseterre', price: '£1,341' },
  { country: 'Saint Lucia', port: 'Castries', price: '£1,341' },
  { country: 'Saudi Arabia', port: 'Dammam', price: '£812' },
  { country: 'Saudi Arabia', port: 'Jeddah', price: '£699' },
  { country: 'Singapore', port: 'Singapore', price: '£437' },
  { country: 'South Africa', port: 'Cape Town', price: '£837' },
  { country: 'South Africa', port: 'Durban', price: '£732' },
  { country: 'South Africa', port: 'Port Elizabeth', price: '£979' },
  { country: 'Spain', port: 'Tarragona', price: '£589' },
  { country: 'Spain', port: 'Valencia', price: '£557' },
  { country: 'Suriname', port: 'Paramaribo', price: '£1,591' },
  { country: 'Tanzania', port: 'Der Es Salaam', price: '£899' },
  { country: 'Thailand', port: 'Laem Chabang', price: '£740' },
  { country: 'Trinidad', port: 'Port of Spain', price: '£1,016' },
  { country: 'UAE', port: 'Abu Dhabi', price: '£812' },
  { country: 'UAE', port: 'Jebel Ali', price: '£812' },
  { country: 'USA', port: 'Baltimore', price: '£589' },
  { country: 'USA', port: 'Brunswick', price: '£752' },
  { country: 'USA', port: 'Charleston', price: '£752' },
  { country: 'USA', port: 'Freeport', price: '£885' },
  { country: 'USA', port: 'Galveston', price: '£960' },
  { country: 'USA', port: 'Jacksonville', price: '£589' },
  { country: 'USA', port: 'New York', price: '£898' },
  { country: 'USA', port: 'Port Hueneme', price: '£1,218' },
  { country: 'USA', port: 'San Diego', price: '£1,218' },
  { country: 'USA', port: 'Tacoma', price: '£1,326' },
];

export const containerPrices: ContainerRate[] = [
  { country: 'Albania', port: 'Durres', c20: '£1,013', c40: '£1,529' },
  { country: 'Antigua', port: 'St Johns', c20: '£1,673', c40: '£2,379' },
  { country: 'Angola', port: 'Luanda', c20: '£2,173', c40: '£3,279' },
  { country: 'Angola', port: 'Lobito', c20: '£2,173', c40: '£3,279' },
  { country: 'Argentina', port: 'Zarate', c20: '£1,373', c40: '£1,829' },
  { country: 'Australia', port: 'Adelaide', c20: '£1,143', c40: '£1,979' },
  { country: 'Australia', port: 'Brisbane', c20: '£1,143', c40: '£1,979' },
  { country: 'Australia', port: 'Fremantle', c20: '£1,143', c40: '£1,979' },
  { country: 'Australia', port: 'Mackay', c20: '£1,143', c40: '£1,979' },
  { country: 'Australia', port: 'Melbourne', c20: '£1,143', c40: '£1,979' },
  { country: 'Australia', port: 'Sydney', c20: '£1,143', c40: '£1,979' },
  { country: 'Bahamas', port: 'Nassau', c20: '£1,673', c40: '£2,279' },
  { country: 'Bangladesh', port: 'Chittagong', c20: '£1,723', c40: '£2,129' },
  { country: 'Bahrain', port: 'Bahrain', c20: '£1,223', c40: '£1,579' },
  { country: 'Barbados', port: 'Bridgetown', c20: '£1,723', c40: '£2,529' },
  { country: 'Belgium', port: 'Antwerp', c20: '£973', c40: '£1,379' },
  { country: 'Benin', port: 'Cotonou', c20: '£1,223', c40: '£1,729' },
  { country: 'Botswana', port: 'Gaborone', c20: '£2,273', c40: '£3,629' },
  { country: 'British Virgin Islands', port: 'Tortola', c20: '£2,223', c40: '£3,629' },
  { country: 'Brunei', port: 'Muara', c20: '£1,023', c40: '£1,229' },
  { country: 'Cameroon', port: 'Douala', c20: '£1,373', c40: '£2,029' },
  { country: 'Canada', port: 'Halifax', c20: '£1,023', c40: '£1,829' },
  { country: 'Canada', port: 'Montreal', c20: '£1,123', c40: '£1,929' },
  { country: 'Canada', port: 'Toronto', c20: '£1,323', c40: '£2,279' },
  { country: 'Canada', port: 'Vancouver', c20: '£2,273', c40: '£3,529' },
  { country: 'Chile', port: 'Iquique', c20: '£2,023', c40: '£3,329' },
  { country: 'China', port: 'Hong Kong', c20: '£873', c40: '£1,029' },
  { country: 'Colombia', port: 'Cartagena', c20: '£1,173', c40: '£1,579' },
  { country: 'Colombia', port: 'Santa Marta', c20: '£1,373', c40: '£1,979' },
  { country: 'Congo', port: 'Boma Pointe Noire', c20: '£2,023', c40: '£3,229' },
  { country: 'Cyprus', port: 'Limassol', c20: '£973', c40: '£1,529' },
  { country: 'Denmark', port: 'Esbjerg', c20: '£973', c40: '£1,279' },
  { country: 'Dominica', port: 'Roseau', c20: '£2,023', c40: '£2,929' },
  { country: 'Dominican Republic', port: 'Santo Domingo', c20: '£1,423', c40: '£1,979' },
  { country: 'Dubai', port: 'Jebel Ali', c20: '£1,023', c40: '£1,729' },
  { country: 'Egypt', port: 'Alexandria', c20: '£1,023', c40: '£1,329' },
  { country: 'Ethiopa', port: 'Djibouti', c20: '£1,473', c40: '£2,129' },
  { country: 'Equatorial Guinea', port: 'Malabo', c20: '£12,523', c40: '£1,679' },
  { country: 'Equatorial Guinea', port: 'Bata', c20: '£12,523', c40: '£1,679' },
  { country: 'French Guiana', port: 'Degard Des Cannes', c20: '£1,923', c40: '£2,929' },
  { country: 'Gabon', port: 'Libreville', c20: '£1,373', c40: '£1,729' },
  { country: 'Gambia', port: 'Banjul', c20: '£1,423', c40: '£1,929' },
  { country: 'Germany', port: 'Hamburg', c20: '£973', c40: '£1,279' },
  { country: 'Ghana', port: 'Tema', c20: '£1,223', c40: '£1,779' },
  { country: 'Ghana', port: 'Takoradi', c20: '£1,223', c40: '£1,779' },
  { country: 'Grand Caymen', port: 'George Town', c20: '£3,023', c40: '£4,529' },
  { country: 'Greece', port: 'Piraeus', c20: '£1,123', c40: '£1,429' },
  { country: 'Grenada', port: 'St Georges', c20: '£2,523', c40: '£3,779' },
  { country: 'Guadeloupe', port: 'Point A Pitre', c20: '£1,523', c40: '£1,979' },
  { country: 'Guinea', port: 'Conakry', c20: '£1,623', c40: '£2,529' },
  { country: 'Guyana', port: 'Georgetown', c20: '£2,223', c40: '£3,229' },
  { country: 'Hati', port: 'Port Au Prince', c20: '£1,523', c40: '£2,129' },
  { country: 'Hong Kong', port: 'Port of Hong Kong', c20: '£873', c40: '£1,029' },
  { country: 'India', port: 'Mumbai', c20: '£923', c40: '£1,229' },
  { country: 'Indonesia', port: 'Jakarta', c20: '£773', c40: '£1,029' },
  { country: 'Israel', port: 'Ashdod', c20: '£1,123', c40: '£1,379' },
  { country: 'Italy', port: 'Savona', c20: '£998', c40: '£1,492' },
  { country: 'Italy', port: 'Civitavecchia', c20: '£916', c40: '£1,368' },
  { country: 'Italy', port: 'Livorno', c20: '£916', c40: '£1,368' },
  { country: 'Italy', port: 'Palermo', c20: '£1,048', c40: '£1,566' },
  { country: 'Italy', port: 'Salerno', c20: '£916', c40: '£1,368' },
  { country: 'Italy', port: 'Savona', c20: '£916', c40: '£1,368' },
  { country: 'Ivory Coast', port: 'Abidjan', c20: '£1,223', c40: '£1,679' },
  { country: 'Jamaica', port: 'Kingston', c20: '£1,623', c40: '£2,329' },
  { country: 'Japan', port: 'Yokohama', c20: '£1,373', c40: '£1,919' },
  { country: 'Japan', port: 'Toyohashi', c20: '£1,373', c40: '£1,919' },
  { country: 'Kenya', port: 'Mombasa', c20: '£1,403', c40: '£1,929' },
  { country: 'Kuwait', port: 'Kuwait', c20: '£1,123', c40: '£1,479' },
  { country: 'Lebanon', port: 'Beirut', c20: '£1,223', c40: '£1,529' },
  { country: 'Lesotho', port: 'Maseru', c20: '£1,273', c40: '£1,779' },
  { country: 'Liberia', port: 'Monrovia', c20: '£1,623', c40: '£2,379' },
  { country: 'Libya', port: 'Tripoli', c20: '£1,273', c40: '£1,979' },
  { country: 'Libya', port: 'Al khums', c20: '£1,273', c40: '£1,979' },
  { country: 'Madagascar', port: 'Tamatave', c20: '£1,573', c40: '£2,229' },
  { country: 'Malaysia', port: 'Port Klang', c20: '£673', c40: '£1,129' },
  { country: 'Malta', port: 'Valletta', c20: '£1,023', c40: '£1,479' },
  { country: 'Malta', port: 'Freeport', c20: '£1,023', c40: '£1,479' },
  { country: 'Martinique', port: 'Fort de France', c20: '£1,473', c40: '£1,879' },
  { country: 'Mauritius', port: 'Port Louis', c20: '£1,773', c40: '£2,879' },
  { country: 'Mexico', port: 'Altamira', c20: '£1,273', c40: '£1,679' },
  { country: 'Mexico', port: 'Vera Cruz', c20: '£1,273', c40: '£1,679' },
  { country: 'Morocco', port: 'Casablanca', c20: '£1,323', c40: '£1,729' },
  { country: 'Morocco', port: 'Tangir', c20: '£1,323', c40: '£1,729' },
  { country: 'Mozambique', port: 'Maputo', c20: '£1,523', c40: '£2,379' },
  { country: 'Mozambique', port: 'Beira', c20: '£1,523', c40: '£2,379' },
  { country: 'Myanmar', port: 'Yangon', c20: '£1,223', c40: '£1,729' },
  { country: 'Namibia', port: 'Walvis Bay', c20: '£1,423', c40: '£2,329' },
  { country: 'New Zealand', port: 'Auckland', c20: '£988', c40: '£1,476' },
  { country: 'New Zealand', port: 'Hamilton', c20: '£1,292', c40: '£1,932' },
  { country: 'New Zealand', port: 'Lyttelton', c20: '£988', c40: '£1,476' },
  { country: 'New Zealand', port: 'Napier', c20: '£988', c40: '£1,476' },
  { country: 'New Zealand', port: 'Nelson', c20: '£988', c40: '£1,476' },
  { country: 'New Zealand', port: 'Port Chalmers', c20: '£988', c40: '£1,476' },
  { country: 'New Zealand', port: 'Taupo', c20: '£1,395', c40: '£2,087' },
  { country: 'New Zealand', port: 'Tauranga', c20: '£988', c40: '£1,476' },
  { country: 'New Zealand', port: 'Wellington', c20: '£1,245', c40: '£1,862' },
  { country: 'Nigeria', port: 'Tin Can Island', c20: '£1,273', c40: '£1,729' },
  { country: 'Nigeria', port: 'Apapa', c20: '£1,273', c40: '£1,729' },
  { country: 'Norway', port: 'Drammen', c20: '£973', c40: '£1,279' },
  { country: 'Oman', port: 'Sohar', c20: '£1,123', c40: '£1,479' },
  { country: 'Pakistan', port: 'Karachi', c20: '£923', c40: '£1,929' },
  { country: 'Panama', port: 'Manzanillo', c20: '£1,673', c40: '£2,329' },
  { country: 'Papua New Guinea', port: 'Port Moresby', c20: '£1,923', c40: '£3,229' },
  { country: 'Papua New Guinea', port: 'Lae', c20: '£1,923', c40: '£3,229' },
  { country: 'Portugal', port: 'Setubal', c20: '£873', c40: '£1,129' },
  { country: 'Puerto Rico', port: 'San Juan', c20: '£1,423', c40: '£1,829' },
  { country: 'Qatar', port: 'Hamad Port', c20: '£1,123', c40: '£1,479' },
  { country: 'Saint Kitts and Nevis', port: 'Basseterre', c20: '£2,323', c40: '£3,779' },
  { country: 'Saint Lucia', port: 'Vieux Fort', c20: '£2,323', c40: '£3,779' },
  { country: 'Saint Lucia', port: 'Castries', c20: '£2,323', c40: '£3,779' },
  { country: 'Saint Vincent and the Grenadines', port: 'Kingstown', c20: '£2,223', c40: '£3,229' },
  { country: 'Saudi Arabia', port: 'Dammam', c20: '£1,323', c40: '£1,779' },
  { country: 'Saudi Arabia', port: 'Jeddah', c20: '£1,173', c40: '£1,679' },
  { country: 'Senegal', port: 'Dakar', c20: '£1,373', c40: '£1,779' },
  { country: 'Sierra Leone', port: 'Freetown', c20: '£1,523', c40: '£2,329' },
  { country: 'Singapore', port: 'Port of Singapore', c20: '£873', c40: '£1,429' },
  { country: 'South Africa', port: 'Cape Town', c20: '£1,223', c40: '£1,779' },
  { country: 'South Africa', port: 'Durban', c20: '£1,223', c40: '£1,779' },
  { country: 'South Africa', port: 'Port Elizabeth', c20: '£1,223', c40: '£1,779' },
  { country: 'Spain', port: 'Tarragona', c20: '£823', c40: '£1,179' },
  { country: 'Spain', port: 'Valencia', c20: '£823', c40: '£1,179' },
  { country: 'Sri Lanka', port: 'Colombo', c20: '£1,423', c40: '£1,829' },
  { country: 'Suriname', port: 'Paramebo', c20: '£2,323', c40: '£3,979' },
  { country: 'Swaziland', port: 'Matsapa', c20: '£1,923', c40: '£2,879' },
  { country: 'Swaziland', port: 'Manzini', c20: '£1,923', c40: '£2,879' },
  { country: 'Sweden', port: 'Gothenburg', c20: '£973', c40: '£1,329' },
  { country: 'Tanzania', port: 'Dar Es Salaam', c20: '£1,373', c40: '£1,879' },
  { country: 'Thailand', port: 'Laem Chabang', c20: '£623', c40: '£1,179' },
  { country: 'Togo', port: 'Lome', c20: '£1,323', c40: '£1,679' },
  { country: 'Trinidad and Tobago', port: 'Port of Spain', c20: '£1,873', c40: '£2,779' },
  { country: 'Tunisia', port: 'Tunis La Goulette', c20: '£1,223', c40: '£1,979' },
  { country: 'Turkey', port: 'Izmir', c20: '£1,023', c40: '£1,729' },
  { country: 'Turkey', port: 'Mersin', c20: '£1,023', c40: '£1,729' },
  { country: 'UAE', port: 'Abu Dhabi', c20: '£1,123', c40: '£1,479' },
  { country: 'UAE', port: 'Jebel Ali', c20: '£1,123', c40: '£1,479' },
  { country: 'United States of America (USA)', port: 'Baltimore', c20: '£928', c40: '£1,386' },
  { country: 'United States of America (USA)', port: 'Brunswick', c20: '£1,117', c40: '£1,669' },
  { country: 'United States of America (USA)', port: 'Charleston', c20: '£1,117', c40: '£1,669' },
  { country: 'United States of America (USA)', port: 'Freeport', c20: '£1,165', c40: '£1,741' },
  { country: 'United States of America (USA)', port: 'Galveston', c20: '£1,370', c40: '£2,050' },
  { country: 'United States of America (USA)', port: 'Jacksonville', c20: '£928', c40: '£1,386' },
  { country: 'United States of America (USA)', port: 'New York', c20: '£1,307', c40: '£1,955' },
  { country: 'United States of America (USA)', port: 'Port Hueneme', c20: '£1,660', c40: '£2,484' },
  { country: 'United States of America (USA)', port: 'San Diego', c20: '£1,660', c40: '£2,484' },
  { country: 'United States of America (USA)', port: 'Tacoma', c20: '£1,912', c40: '£2,862' },
  { country: 'Uruguay', port: 'Montevideo', c20: '£1,323', c40: '£1,779' },
  { country: 'Zambia', port: 'Lusaka', c20: '£5,273', c40: '£6,529' },
  { country: 'Zambia', port: 'Kazungula border', c20: '£5,273', c40: '£6,529' },
  { country: 'Zimbabwe', port: 'Beitbridge', c20: '£2,723', c40: '£5,329' },
  { country: 'Zimbabwe', port: 'Plumtree', c20: '£2,723', c40: '£5,329' },
  { country: 'Zimbabwe', port: 'Harare', c20: '£2,723', c40: '£5,329' },
];

// Spellings in the tables above are as published and do not always match
// src/data/destinations.ts (e.g. "Grand Caymen", "Ethiopa", "Hati", "Dubai"
// as a country, "China" for Hong Kong). This maps the country-page name onto
// the rate-table name where they differ, so lookups do not silently miss.
const rateTableAliases: Record<string, string> = {
  'Cayman Islands': 'Grand Caymen',
  Ethiopia: 'Ethiopa',
  Haiti: 'Hati',
  'Trinidad and Tobago': 'Trinidad',
  'Hong Kong': 'Hong Kong',
  UAE: 'UAE',
};

const parsePrice = (p: string): number => Number(p.replace(/[^0-9.]/g, '')) || Infinity;

/**
 * Cheapest published RoRo and container rates for a country, or undefined
 * where the tables do not cover it. Approximate port-to-port figures — see the
 * warning at the top of this file before showing them as an all-in price.
 */
export function approximateRatesFor(country: string):
  | { roro?: string; c20?: string; c40?: string; ports: string[] }
  | undefined {
  const name = rateTableAliases[country] ?? country;
  const roro = roroPrices.filter(r => r.country === name);
  const cont = containerPrices.filter(r => r.country === name);
  if (!roro.length && !cont.length) return undefined;
  const cheapest = <T extends { price?: string; c20?: string }>(rows: T[], key: 'price' | 'c20') =>
    rows.slice().sort((a, b) => parsePrice(a[key] as string) - parsePrice(b[key] as string))[0];
  const bestRoro = roro.length ? cheapest(roro, 'price') : undefined;
  const bestCont = cont.length ? cheapest(cont, 'c20') : undefined;
  return {
    roro: bestRoro?.price,
    c20: bestCont?.c20,
    c40: bestCont?.c40,
    ports: [...new Set([...roro.map(r => r.port), ...cont.map(r => r.port)])],
  };
}
