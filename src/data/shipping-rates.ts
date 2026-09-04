// The published RoRo and container rate tables, as shown on
// /car-shipping/shipping-rates. Moved out of that page on 2026-09-03 so the
// country pages can read the same figures instead of a second, hand-kept copy.
//
// These are the figures BOTH the rates page and every country page show, so a
// change here moves the whole site at once. They are always presented as
// "approximate, call for the latest rates", never as a fixed quote.
//
// ⚠ REPRICED 2026-09-03: every rate below was raised by 35% on George's
// instruction, the old card having gone out of date. 393 figures, rounded to
// the nearest pound. The previous card is in git history if a figure ever needs
// checking against what was published before.
//
// A blanket percentage is a stopgap, not a rate card. Freight does not move
// uniformly by lane — the old card had Hong Kong at £437 and the Caribbean at
// £1,341 — so the uplift preserves whatever relative shape the original had,
// including any lane that was already wrong. Worth replacing with real quoted
// rates lane by lane when there is time.
//
// src/data/shipping-prices.ts still wins where a country has a curated all-in
// rate; these are the fallback for everything else. See CountryCosts.astro.

import { hubPorts } from './destinations';

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
  { country: 'Antigua', port: 'St Johns', price: '£1,810' },
  { country: 'Australia', port: 'Adelaide', price: '£1,041' },
  { country: 'Australia', port: 'Brisbane', price: '£1,041' },
  { country: 'Australia', port: 'Fremantle', price: '£1,041' },
  { country: 'Australia', port: 'Melbourne', price: '£1,041' },
  { country: 'Australia', port: 'Sydney', price: '£1,041' },
  { country: 'Bahamas', port: 'Nassau', price: '£1,697' },
  { country: 'Bahrain', port: 'Bahrain', price: '£1,096' },
  { country: 'Barbados', port: 'Bridgetown', price: '£1,810' },
  { country: 'Canada', port: 'Halifax', price: '£1,231' },
  { country: 'Canada', port: 'Vancouver', price: '£3,106' },
  { country: 'China', port: 'Hong Kong', price: '£590' },
  { country: 'Colombia', port: 'Cartagena', price: '£1,304' },
  { country: 'Colombia', port: 'Santa Marta', price: '£1,697' },
  { country: 'Cyprus', port: 'Limassol', price: '£649' },
  { country: 'Dominica', port: 'Roseau', price: '£1,810' },
  { country: 'Dominican Republic', port: 'Santo Domingo', price: '£1,697' },
  { country: 'Egypt', port: 'Alexandria', price: '£1,278' },
  { country: 'Ethiopia', port: 'Djibouti', price: '£1,315' },
  { country: 'French Guiana', port: 'Degrad Des Cannes', price: '£1,963' },
  { country: 'Grand Caymen', port: 'George Town', price: '£5,270' },
  { country: 'Greece', port: 'Piraeus', price: '£996' },
  { country: 'Grenada', port: 'St Georges', price: '£1,810' },
  { country: 'Guadeloupe', port: 'Point A Pitre', price: '£1,720' },
  { country: 'Guyana', port: 'Georgetown', price: '£2,148' },
  { country: 'Haiti', port: 'Port Au Prince', price: '£1,697' },
  { country: 'Israel', port: 'Ashdod', price: '£1,202' },
  { country: 'Italy', port: 'Civitavecchia', price: '£864' },
  { country: 'Italy', port: 'Livorno', price: '£864' },
  { country: 'Italy', port: 'Palermo', price: '£996' },
  { country: 'Italy', port: 'Salerno', price: '£864' },
  { country: 'Italy', port: 'Savona', price: '£864' },
  { country: 'Jamaica', port: 'Kingston', price: '£1,416' },
  { country: 'Japan', port: 'Toyohashi', price: '£1,191' },
  { country: 'Japan', port: 'Yokohama', price: '£1,191' },
  { country: 'Kenya', port: 'Mombasa', price: '£1,214' },
  { country: 'Kuwait', port: 'Kuwait', price: '£1,096' },
  { country: 'Lebanon', port: 'Beirut', price: '£1,196' },
  { country: 'Madagascar', port: 'Tamatave', price: '£1,720' },
  { country: 'Malaysia', port: 'Port Kelang', price: '£1,219' },
  { country: 'Malta', port: 'Valletta', price: '£1,026' },
  { country: 'Martinique', port: 'Fort de France', price: '£1,720' },
  { country: 'Mauritius', port: 'Port Louis', price: '£1,855' },
  { country: 'Mexico', port: 'Altamira', price: '£1,191' },
  { country: 'Mexico', port: 'Vera Cruz', price: '£1,191' },
  { country: 'Morocco', port: 'Casablanca', price: '£878' },
  { country: 'Morocco', port: 'Tangier', price: '£1,270' },
  { country: 'Mozambique', port: 'Maputo', price: '£1,214' },
  { country: 'Myanmar', port: 'Yangon', price: '£2,751' },
  { country: 'Namibia', port: 'Walvis Bay', price: '£1,265' },
  { country: 'New Zealand', port: 'Auckland', price: '£851' },
  { country: 'New Zealand', port: 'Hamilton', price: '£1,426' },
  { country: 'New Zealand', port: 'Lyttelton', price: '£851' },
  { country: 'New Zealand', port: 'Napier', price: '£851' },
  { country: 'New Zealand', port: 'Nelson', price: '£851' },
  { country: 'New Zealand', port: 'Port Chalmers', price: '£851' },
  { country: 'New Zealand', port: 'Taupo', price: '£1,505' },
  { country: 'New Zealand', port: 'Tauranga', price: '£851' },
  { country: 'New Zealand', port: 'Wellington', price: '£1,624' },
  { country: 'Norway', port: 'Drammen', price: '£824' },
  { country: 'Oman', port: 'Sohar', price: '£1,096' },
  { country: 'Panama', port: 'Manzanillo', price: '£1,697' },
  { country: 'Portugal', port: 'Setubal', price: '£814' },
  { country: 'Puerto Rico', port: 'San Juan', price: '£1,416' },
  { country: 'Qatar', port: 'Hamad Port', price: '£1,096' },
  { country: 'Saint Kitts', port: 'Basseterre', price: '£1,810' },
  { country: 'Saint Lucia', port: 'Castries', price: '£1,810' },
  { country: 'Saudi Arabia', port: 'Dammam', price: '£1,096' },
  { country: 'Saudi Arabia', port: 'Jeddah', price: '£944' },
  { country: 'Singapore', port: 'Singapore', price: '£590' },
  { country: 'South Africa', port: 'Cape Town', price: '£1,130' },
  { country: 'South Africa', port: 'Durban', price: '£988' },
  { country: 'South Africa', port: 'Port Elizabeth', price: '£1,322' },
  { country: 'Spain', port: 'Tarragona', price: '£795' },
  { country: 'Spain', port: 'Valencia', price: '£752' },
  { country: 'Suriname', port: 'Paramaribo', price: '£2,148' },
  { country: 'Tanzania', port: 'Dar Es Salaam', price: '£1,214' },
  { country: 'Thailand', port: 'Laem Chabang', price: '£999' },
  { country: 'Trinidad', port: 'Port of Spain', price: '£1,372' },
  { country: 'UAE', port: 'Abu Dhabi', price: '£1,096' },
  { country: 'UAE', port: 'Jebel Ali', price: '£1,096' },
  { country: 'USA', port: 'Baltimore', price: '£795' },
  { country: 'USA', port: 'Brunswick', price: '£1,015' },
  { country: 'USA', port: 'Charleston', price: '£1,015' },
  { country: 'USA', port: 'Freeport', price: '£1,195' },
  { country: 'USA', port: 'Galveston', price: '£1,296' },
  { country: 'USA', port: 'Jacksonville', price: '£795' },
  { country: 'USA', port: 'New York', price: '£1,212' },
  { country: 'USA', port: 'Port Hueneme', price: '£1,644' },
  { country: 'USA', port: 'San Diego', price: '£1,644' },
  { country: 'USA', port: 'Tacoma', price: '£1,790' },
];

export const containerPrices: ContainerRate[] = [
  { country: 'Albania', port: 'Durres', c20: '£1,368', c40: '£2,064' },
  { country: 'Antigua', port: 'St Johns', c20: '£2,259', c40: '£3,212' },
  { country: 'Angola', port: 'Luanda', c20: '£2,934', c40: '£4,427' },
  { country: 'Angola', port: 'Lobito', c20: '£2,934', c40: '£4,427' },
  { country: 'Argentina', port: 'Zarate', c20: '£1,854', c40: '£2,469' },
  { country: 'Australia', port: 'Adelaide', c20: '£1,543', c40: '£2,672' },
  { country: 'Australia', port: 'Brisbane', c20: '£1,543', c40: '£2,672' },
  { country: 'Australia', port: 'Fremantle', c20: '£1,543', c40: '£2,672' },
  { country: 'Australia', port: 'Mackay', c20: '£1,543', c40: '£2,672' },
  { country: 'Australia', port: 'Melbourne', c20: '£1,543', c40: '£2,672' },
  { country: 'Australia', port: 'Sydney', c20: '£1,543', c40: '£2,672' },
  { country: 'Bahamas', port: 'Nassau', c20: '£2,259', c40: '£3,077' },
  { country: 'Bangladesh', port: 'Chittagong', c20: '£2,326', c40: '£2,874' },
  { country: 'Bahrain', port: 'Bahrain', c20: '£1,651', c40: '£2,132' },
  { country: 'Barbados', port: 'Bridgetown', c20: '£2,326', c40: '£3,414' },
  { country: 'Belgium', port: 'Antwerp', c20: '£1,314', c40: '£1,862' },
  { country: 'Benin', port: 'Cotonou', c20: '£1,651', c40: '£2,334' },
  { country: 'Botswana', port: 'Gaborone', c20: '£3,069', c40: '£4,899' },
  { country: 'British Virgin Islands', port: 'Tortola', c20: '£3,001', c40: '£4,899' },
  { country: 'Brunei', port: 'Muara', c20: '£1,381', c40: '£1,659' },
  { country: 'Cameroon', port: 'Douala', c20: '£1,854', c40: '£2,739' },
  { country: 'Canada', port: 'Halifax', c20: '£1,381', c40: '£2,469' },
  { country: 'Canada', port: 'Montreal', c20: '£1,516', c40: '£2,604' },
  { country: 'Canada', port: 'Toronto', c20: '£1,786', c40: '£3,077' },
  { country: 'Canada', port: 'Vancouver', c20: '£3,069', c40: '£4,764' },
  { country: 'Chile', port: 'Iquique', c20: '£2,731', c40: '£4,494' },
  { country: 'China', port: 'Hong Kong', c20: '£1,179', c40: '£1,389' },
  { country: 'Colombia', port: 'Cartagena', c20: '£1,584', c40: '£2,132' },
  { country: 'Colombia', port: 'Santa Marta', c20: '£1,854', c40: '£2,672' },
  { country: 'Congo', port: 'Boma Pointe Noire', c20: '£2,731', c40: '£4,359' },
  { country: 'Cyprus', port: 'Limassol', c20: '£1,314', c40: '£2,064' },
  { country: 'Denmark', port: 'Esbjerg', c20: '£1,314', c40: '£1,727' },
  { country: 'Dominica', port: 'Roseau', c20: '£2,731', c40: '£3,954' },
  { country: 'Dominican Republic', port: 'Santo Domingo', c20: '£1,921', c40: '£2,672' },
  { country: 'Dubai', port: 'Jebel Ali', c20: '£1,381', c40: '£2,334' },
  { country: 'Egypt', port: 'Alexandria', c20: '£1,381', c40: '£1,794' },
  { country: 'Ethiopa', port: 'Djibouti', c20: '£1,989', c40: '£2,874' },
  // Corrected 2026-09-03 (George): was £12,523, a digit too long. A 20ft at ten
  // times the 40ft made no sense, and £1,252 sits where the neighbours do —
  // Benin £1,223, Nigeria £1,273, Togo £1,323 against the same £1,679 40ft.
  { country: 'Equatorial Guinea', port: 'Malabo', c20: '£1,690', c40: '£2,267' },
  { country: 'Equatorial Guinea', port: 'Bata', c20: '£1,690', c40: '£2,267' },
  { country: 'French Guiana', port: 'Degard Des Cannes', c20: '£2,596', c40: '£3,954' },
  { country: 'Gabon', port: 'Libreville', c20: '£1,854', c40: '£2,334' },
  { country: 'Gambia', port: 'Banjul', c20: '£1,921', c40: '£2,604' },
  { country: 'Germany', port: 'Hamburg', c20: '£1,314', c40: '£1,727' },
  { country: 'Ghana', port: 'Tema', c20: '£1,651', c40: '£2,402' },
  { country: 'Ghana', port: 'Takoradi', c20: '£1,651', c40: '£2,402' },
  { country: 'Grand Caymen', port: 'George Town', c20: '£4,979', c40: '£7,459' },
  { country: 'Greece', port: 'Piraeus', c20: '£1,516', c40: '£1,929' },
  { country: 'Grenada', port: 'St Georges', c20: '£3,406', c40: '£5,102' },
  { country: 'Guadeloupe', port: 'Point A Pitre', c20: '£2,056', c40: '£2,672' },
  { country: 'Guinea', port: 'Conakry', c20: '£2,191', c40: '£3,414' },
  { country: 'Guyana', port: 'Georgetown', c20: '£3,001', c40: '£4,359' },
  { country: 'Hati', port: 'Port Au Prince', c20: '£2,056', c40: '£2,874' },
  { country: 'Hong Kong', port: 'Port of Hong Kong', c20: '£1,179', c40: '£1,389' },
  { country: 'India', port: 'Mumbai', c20: '£1,246', c40: '£1,659' },
  { country: 'Indonesia', port: 'Jakarta', c20: '£1,044', c40: '£1,389' },
  { country: 'Israel', port: 'Ashdod', c20: '£1,516', c40: '£1,862' },
  { country: 'Italy', port: 'Savona', c20: '£1,347', c40: '£2,014' },
  { country: 'Italy', port: 'Civitavecchia', c20: '£1,237', c40: '£1,847' },
  { country: 'Italy', port: 'Livorno', c20: '£1,237', c40: '£1,847' },
  { country: 'Italy', port: 'Palermo', c20: '£1,415', c40: '£2,114' },
  { country: 'Italy', port: 'Salerno', c20: '£1,237', c40: '£1,847' },
  { country: 'Italy', port: 'Savona', c20: '£1,237', c40: '£1,847' },
  { country: 'Ivory Coast', port: 'Abidjan', c20: '£1,651', c40: '£2,267' },
  { country: 'Jamaica', port: 'Kingston', c20: '£2,191', c40: '£3,144' },
  { country: 'Japan', port: 'Yokohama', c20: '£1,854', c40: '£2,591' },
  { country: 'Japan', port: 'Toyohashi', c20: '£1,854', c40: '£2,591' },
  { country: 'Kenya', port: 'Mombasa', c20: '£1,894', c40: '£2,604' },
  { country: 'Kuwait', port: 'Kuwait', c20: '£1,516', c40: '£1,997' },
  { country: 'Lebanon', port: 'Beirut', c20: '£1,651', c40: '£2,064' },
  { country: 'Lesotho', port: 'Maseru', c20: '£1,719', c40: '£2,402' },
  { country: 'Liberia', port: 'Monrovia', c20: '£2,191', c40: '£3,212' },
  { country: 'Libya', port: 'Tripoli', c20: '£1,719', c40: '£2,672' },
  { country: 'Libya', port: 'Al khums', c20: '£1,719', c40: '£2,672' },
  { country: 'Madagascar', port: 'Tamatave', c20: '£2,124', c40: '£3,009' },
  { country: 'Malaysia', port: 'Port Klang', c20: '£909', c40: '£1,524' },
  { country: 'Malta', port: 'Valletta', c20: '£1,381', c40: '£1,997' },
  { country: 'Malta', port: 'Freeport', c20: '£1,381', c40: '£1,997' },
  { country: 'Martinique', port: 'Fort de France', c20: '£1,989', c40: '£2,537' },
  { country: 'Mauritius', port: 'Port Louis', c20: '£2,394', c40: '£3,887' },
  { country: 'Mexico', port: 'Altamira', c20: '£1,719', c40: '£2,267' },
  { country: 'Mexico', port: 'Vera Cruz', c20: '£1,719', c40: '£2,267' },
  { country: 'Morocco', port: 'Casablanca', c20: '£1,786', c40: '£2,334' },
  { country: 'Morocco', port: 'Tangir', c20: '£1,786', c40: '£2,334' },
  { country: 'Mozambique', port: 'Maputo', c20: '£2,056', c40: '£3,212' },
  { country: 'Mozambique', port: 'Beira', c20: '£2,056', c40: '£3,212' },
  { country: 'Myanmar', port: 'Yangon', c20: '£1,651', c40: '£2,334' },
  { country: 'Namibia', port: 'Walvis Bay', c20: '£1,921', c40: '£3,144' },
  { country: 'New Zealand', port: 'Auckland', c20: '£1,334', c40: '£1,993' },
  { country: 'New Zealand', port: 'Hamilton', c20: '£1,744', c40: '£2,608' },
  { country: 'New Zealand', port: 'Lyttelton', c20: '£1,334', c40: '£1,993' },
  { country: 'New Zealand', port: 'Napier', c20: '£1,334', c40: '£1,993' },
  { country: 'New Zealand', port: 'Nelson', c20: '£1,334', c40: '£1,993' },
  { country: 'New Zealand', port: 'Port Chalmers', c20: '£1,334', c40: '£1,993' },
  { country: 'New Zealand', port: 'Taupo', c20: '£1,883', c40: '£2,817' },
  { country: 'New Zealand', port: 'Tauranga', c20: '£1,334', c40: '£1,993' },
  { country: 'New Zealand', port: 'Wellington', c20: '£1,681', c40: '£2,514' },
  { country: 'Nigeria', port: 'Tin Can Island', c20: '£1,719', c40: '£2,334' },
  { country: 'Nigeria', port: 'Apapa', c20: '£1,719', c40: '£2,334' },
  { country: 'Norway', port: 'Drammen', c20: '£1,314', c40: '£1,727' },
  { country: 'Oman', port: 'Sohar', c20: '£1,516', c40: '£1,997' },
  { country: 'Pakistan', port: 'Karachi', c20: '£1,246', c40: '£2,604' },
  { country: 'Panama', port: 'Manzanillo', c20: '£2,259', c40: '£3,144' },
  { country: 'Papua New Guinea', port: 'Port Moresby', c20: '£2,596', c40: '£4,359' },
  { country: 'Papua New Guinea', port: 'Lae', c20: '£2,596', c40: '£4,359' },
  { country: 'Portugal', port: 'Setubal', c20: '£1,179', c40: '£1,524' },
  { country: 'Puerto Rico', port: 'San Juan', c20: '£1,921', c40: '£2,469' },
  { country: 'Qatar', port: 'Hamad Port', c20: '£1,516', c40: '£1,997' },
  { country: 'Saint Kitts and Nevis', port: 'Basseterre', c20: '£3,136', c40: '£5,102' },
  { country: 'Saint Lucia', port: 'Vieux Fort', c20: '£3,136', c40: '£5,102' },
  { country: 'Saint Lucia', port: 'Castries', c20: '£3,136', c40: '£5,102' },
  { country: 'Saint Vincent and the Grenadines', port: 'Kingstown', c20: '£3,001', c40: '£4,359' },
  { country: 'Saudi Arabia', port: 'Dammam', c20: '£1,786', c40: '£2,402' },
  { country: 'Saudi Arabia', port: 'Jeddah', c20: '£1,584', c40: '£2,267' },
  { country: 'Senegal', port: 'Dakar', c20: '£1,854', c40: '£2,402' },
  { country: 'Sierra Leone', port: 'Freetown', c20: '£2,056', c40: '£3,144' },
  { country: 'Singapore', port: 'Port of Singapore', c20: '£1,179', c40: '£1,929' },
  { country: 'South Africa', port: 'Cape Town', c20: '£1,651', c40: '£2,402' },
  { country: 'South Africa', port: 'Durban', c20: '£1,651', c40: '£2,402' },
  { country: 'South Africa', port: 'Port Elizabeth', c20: '£1,651', c40: '£2,402' },
  { country: 'Spain', port: 'Tarragona', c20: '£1,111', c40: '£1,592' },
  { country: 'Spain', port: 'Valencia', c20: '£1,111', c40: '£1,592' },
  { country: 'Sri Lanka', port: 'Colombo', c20: '£1,921', c40: '£2,469' },
  { country: 'Suriname', port: 'Paramebo', c20: '£3,136', c40: '£5,372' },
  { country: 'Swaziland', port: 'Matsapa', c20: '£2,596', c40: '£3,887' },
  { country: 'Swaziland', port: 'Manzini', c20: '£2,596', c40: '£3,887' },
  { country: 'Sweden', port: 'Gothenburg', c20: '£1,314', c40: '£1,794' },
  { country: 'Tanzania', port: 'Dar Es Salaam', c20: '£1,854', c40: '£2,537' },
  { country: 'Thailand', port: 'Laem Chabang', c20: '£841', c40: '£1,592' },
  { country: 'Togo', port: 'Lome', c20: '£1,786', c40: '£2,267' },
  { country: 'Trinidad and Tobago', port: 'Port of Spain', c20: '£2,529', c40: '£3,752' },
  { country: 'Tunisia', port: 'Tunis La Goulette', c20: '£1,651', c40: '£2,672' },
  { country: 'Turkey', port: 'Izmir', c20: '£1,381', c40: '£2,334' },
  { country: 'Turkey', port: 'Mersin', c20: '£1,381', c40: '£2,334' },
  { country: 'UAE', port: 'Abu Dhabi', c20: '£1,516', c40: '£1,997' },
  { country: 'UAE', port: 'Jebel Ali', c20: '£1,516', c40: '£1,997' },
  { country: 'United States of America (USA)', port: 'Baltimore', c20: '£1,253', c40: '£1,871' },
  { country: 'United States of America (USA)', port: 'Brunswick', c20: '£1,508', c40: '£2,253' },
  { country: 'United States of America (USA)', port: 'Charleston', c20: '£1,508', c40: '£2,253' },
  { country: 'United States of America (USA)', port: 'Freeport', c20: '£1,573', c40: '£2,350' },
  { country: 'United States of America (USA)', port: 'Galveston', c20: '£1,850', c40: '£2,768' },
  { country: 'United States of America (USA)', port: 'Jacksonville', c20: '£1,253', c40: '£1,871' },
  { country: 'United States of America (USA)', port: 'New York', c20: '£1,764', c40: '£2,639' },
  { country: 'United States of America (USA)', port: 'Port Hueneme', c20: '£2,241', c40: '£3,353' },
  { country: 'United States of America (USA)', port: 'San Diego', c20: '£2,241', c40: '£3,353' },
  { country: 'United States of America (USA)', port: 'Tacoma', c20: '£2,581', c40: '£3,864' },
  { country: 'Uruguay', port: 'Montevideo', c20: '£1,786', c40: '£2,402' },
  { country: 'Zambia', port: 'Lusaka', c20: '£4,119', c40: '£5,814' },
  { country: 'Zambia', port: 'Kazungula border', c20: '£4,119', c40: '£5,814' },
  { country: 'Zimbabwe', port: 'Beitbridge', c20: '£3,676', c40: '£7,194' },
  { country: 'Zimbabwe', port: 'Plumtree', c20: '£3,676', c40: '£7,194' },
  { country: 'Zimbabwe', port: 'Harare', c20: '£3,676', c40: '£7,194' },
];

// Spellings in the tables above are as published and do not always match
// src/data/destinations.ts (e.g. "Grand Caymen", "Ethiopa", "Hati", "Dubai"
// as a country, "China" for Hong Kong). This maps the country-page name onto
// the rate-table name where they differ, so lookups do not silently miss.
// The tables use their own spellings, and in several cases carry the SAME
// destination under two names (Ethiopa/Ethiopia, Hati/Haiti, Trinidad/Trinidad
// and Tobago, Saint Kitts/Saint Kitts and Nevis, USA/United States of America).
// So a menu country maps to a LIST of candidate table names and we take the
// cheapest match across all of them, rather than picking one and silently
// missing rates filed under the other.
const rateTableAliases: Record<string, string[]> = {
  'Cayman Islands': ['Grand Caymen'],
  "Côte d'Ivoire": ['Ivory Coast'],
  Ethiopia: ['Ethiopa'],
  Haiti: ['Hati'],
  'St Kitts': ['Saint Kitts', 'Saint Kitts and Nevis'],
  'St Lucia': ['Saint Lucia'],
  'St Vincent': ['Saint Vincent and the Grenadines'],
  'Trinidad and Tobago': ['Trinidad'],
  USA: ['United States of America (USA)'],
  UAE: ['Dubai'],
  // Renamed in 2018; the rate card, like the old site, still says Swaziland.
  Eswatini: ['Swaziland'],
};

/** Every table name a menu country might be filed under, itself included. */
const candidateNames = (country: string): string[] => [country, ...(rateTableAliases[country] ?? [])];

const parsePrice = (p: string): number => Number(p.replace(/[^0-9.]/g, '')) || Infinity;

/**
 * Cheapest published RoRo and container rates for a country, or undefined
 * where the tables do not cover it. Approximate port-to-port figures — see the
 * warning at the top of this file before showing them as an all-in price.
 *
 * Landlocked countries have no rates of their own, so they resolve through the
 * hub ports in destinations.ts: Uganda prices off Mombasa and Dar es Salaam,
 * Botswana off Walvis Bay and Durban, Zimbabwe off Durban and Beira. The
 * cheapest hub wins and `via` names the hubs, so the page can say the rate is
 * for the sea leg rather than to the door.
 */
export function approximateRatesFor(country: string):
  | { roro?: string; c20?: string; c40?: string; ports: string[]; via?: string[] }
  | undefined {
  const pick = (names: string[]) => ({
    roro: roroPrices.filter(r => names.includes(r.country)),
    cont: containerPrices.filter(r => names.includes(r.country)),
  });
  const cheapestRoro = (rows: RoroRate[]) =>
    rows.slice().sort((a, b) => parsePrice(a.price) - parsePrice(b.price))[0];
  const cheapestCont = (rows: ContainerRate[]) =>
    rows.slice().sort((a, b) => parsePrice(a.c20) - parsePrice(b.c20))[0];

  let { roro, cont } = pick(candidateNames(country));
  let via: string[] | undefined;
  let ports = [...new Set([...roro.map(r => r.port), ...cont.map(r => r.port)])];

  // Landlocked: no rates of its own, so price off the neighbouring hub ports.
  if (!roro.length && !cont.length && hubPorts[country]) {
    const hubs = hubPorts[country].map(h => {
      const i = h.indexOf(',');
      return { country: h.slice(0, i).trim(), port: h.slice(i + 1).trim() };
    });
    const names = hubs.flatMap(h => candidateNames(h.country));
    ({ roro, cont } = pick(names));
    if (!roro.length && !cont.length) return undefined;
    via = hubs.map(h => `${h.port} (${h.country})`);
    ports = hubs.map(h => h.port);

    // Prefer the hub PORT, not just the hub country. St Helena routes through
    // Cape Town, and the page says so; taking the country's cheapest instead
    // priced it off Durban, which is £142 less and not on the route. Match
    // loosely because the table writes some ports as 'Port of Singapore'.
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const wanted = ports.map(norm);
    const atHub = <T extends { port: string }>(rows: T[]) =>
      rows.filter(r => wanted.some(w => norm(r.port).includes(w) || w.includes(norm(r.port))));
    if (atHub(roro).length) roro = atHub(roro);
    if (atHub(cont).length) cont = atHub(cont);
  }

  if (!roro.length && !cont.length) return undefined;
  const bestRoro = cheapestRoro(roro);
  const bestCont = cheapestCont(cont);
  return { roro: bestRoro?.price, c20: bestCont?.c20, c40: bestCont?.c40, ports, via };
}
