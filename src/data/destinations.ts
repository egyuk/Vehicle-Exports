// Master list of individual destination countries, grouped by continent.
// Used by:
//  - src/pages/car-shipping/index.astro  (Export Destinations directory)
//  - src/components/Header.astro         ("Countries" mega menu)
// This is the full list (including lower-volume destinations like Bangladesh).

export interface CountryLink {
  name: string;
  href: string;
}

export const continentCountries: Record<string, CountryLink[]> = {
  Africa: [
    { name: 'Botswana', href: '/car-shipping/botswana' },
    { name: 'Ghana', href: '/car-shipping/ghana' },
    { name: 'Kenya', href: '/car-shipping/kenya' },
    { name: 'Namibia', href: '/car-shipping/namibia' },
    { name: 'South Africa', href: '/car-shipping/south-africa' },
    { name: 'Tanzania', href: '/car-shipping/tanzania' },
    { name: 'Uganda', href: '/car-shipping/uganda' },
  ],
  Asia: [
    { name: 'Bangladesh', href: '/car-shipping/bangladesh' },
    { name: 'Hong Kong', href: '/car-shipping/hong-kong' },
    { name: 'Indonesia', href: '/car-shipping/indonesia' },
    { name: 'Malaysia', href: '/car-shipping/malaysia' },
    { name: 'Singapore', href: '/car-shipping/singapore' },
    { name: 'Sri Lanka', href: '/car-shipping/sri-lanka' },
    { name: 'Thailand', href: '/car-shipping/thailand' },
  ],
  Caribbean: [
    { name: 'Barbados', href: '/car-shipping/barbados' },
    { name: 'Cayman Islands', href: '/car-shipping/cayman-islands' },
    { name: 'Trinidad and Tobago', href: '/car-shipping/trinidad-and-tobago' },
  ],
  Europe: [
    { name: 'Cyprus', href: '/car-shipping/cyprus' },
    { name: 'Great Britain', href: '/car-shipping/great-britain' },
    { name: 'Ireland', href: '/car-shipping/ireland' },
  ],
  'Middle East': [],
  'North America': [
    { name: 'Canada', href: '/car-shipping/canada' },
    { name: 'USA', href: '/usa-import-america-car-shipping' },
  ],
  Oceania: [
    { name: 'Australia', href: '/car-shipping/australia' },
    { name: 'New Zealand', href: '/car-shipping/new-zealand' },
  ],
};
