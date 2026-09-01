// Single source of truth for the six export services. Used by:
//  - src/pages/services/[slug].astro  (one landing page per service)
//  - src/pages/services/index.astro   (hub page)
//  - src/components/Header.astro      ("Our Export Services" dropdown cards)
//  - src/components/WhyChooseUs.astro (homepage card links)
// Every figure here must already appear elsewhere on the site — prices from
// the country pages, ports and the £1/mile rate from the homepage cards.

export interface ServiceStep {
  title: string;
  text: string;
}

export interface Service {
  slug: string;
  name: string;
  /** One-liner for nav cards. */
  shortDesc: string;
  /** Meta description, ≤160 chars. */
  metaDescription: string;
  image: string;
  intro: string;
  points: string[];
  steps: ServiceStep[];
  /** Extra in-context links shown as "Useful links". */
  links: { name: string; href: string }[];
}

export const services: Service[] = [
  {
    slug: 'vehicle-sourcing',
    name: 'UK Vehicle Supply & Sourcing',
    shortDesc: 'Any new or used vehicle from our UK dealer, auction and trade network.',
    metaDescription:
      'We source any new or used vehicle from UK dealers, auctions and private sellers, inspect it and export it to your country.',
    image: '/assets/images/services/sourcing.jpeg',
    intro:
      'We source any new or used vehicle from any manufacturer in the UK — through our network of franchised dealers, car auctions, classified listings and private sellers — then inspect, purchase and export it to your country.',
    points: [
      'Access to UK main dealers, auction houses and trade-only stock that overseas buyers cannot reach directly',
      'Any make and model, from workhorse pickups to prestige and performance cars',
      'Every vehicle goes through a rigorous multi-point inspection before it ships',
      'Price negotiation handled by people who buy UK vehicles every week',
    ],
    steps: [
      { title: 'Tell us the spec', text: 'Make, model, year, mileage, budget — or simply the problem the vehicle needs to solve.' },
      { title: 'We source and negotiate', text: 'We shortlist matching vehicles from our network, verify their history and negotiate the price.' },
      { title: 'Inspect, buy and export', text: 'The vehicle is inspected, purchased on your behalf and moved into our export process.' },
    ],
    links: [
      { name: 'Browse our export-ready stock', href: '/shipping-cars' },
      { name: 'How to check UK vehicle history', href: '/car-export-news/how-to-check-uk-vehicle-history-before-buying' },
    ],
  },
  {
    slug: 'tax-free-car-exports',
    name: 'UK Tax / VAT Free Car Exports',
    shortDesc: 'VAT-qualifying and brand-new tax-free vehicles for export buyers.',
    metaDescription:
      'Buy VAT-qualifying or brand-new tax-free UK vehicles and save the 20% UK VAT when the car is exported. We handle eligibility and the paperwork.',
    image: '/assets/images/services/vat-exports.jpeg',
    intro:
      'We specialise in vehicles that are eligible for VAT refunds and tax deduction when exported. Buying a used “VAT Qualifying” car or a brand-new tax-free vehicle can take 20% UK VAT off the price — often the single biggest saving on an exported car.',
    points: [
      'Large range of used VAT-Qualifying (VATQ) vehicles and brand-new tax-free supply',
      'HMRC Personal Export Scheme (PES) handled for eligible buyers relocating abroad',
      'Tax-free purchases for diplomats and eligible military personnel posted overseas',
      'Eligibility confirmed during your quote, before you commit to a vehicle',
    ],
    steps: [
      { title: 'Confirm eligibility', text: 'We check that the vehicle qualifies and that your export route meets the VAT-relief conditions.' },
      { title: 'Buy the right car', text: 'We supply or source a VATQ or tax-free vehicle rather than one where the saving is impossible.' },
      { title: 'Export and save', text: 'The vehicle is exported within HMRC’s time limits and the VAT is deducted or reclaimed.' },
    ],
    links: [
      { name: 'Guide: reclaiming VAT on exported vehicles', href: '/how-to-reclaim-vat-on-vehicles-exported-from-eu-uk' },
    ],
  },
  {
    slug: 'vehicle-shipping',
    name: 'UK Vehicle Shipping & Exports',
    shortDesc: 'RoRo and container shipping to any country from the UK.',
    metaDescription:
      'RoRo and container car shipping from the UK to any country. RoRo from £1,250, 20ft containers from £1,950, with collection from any UK address.',
    image: '/assets/images/services/shipping.jpeg',
    intro:
      'We ship vehicles to any country from the UK by RoRo or container and guarantee competitive rates. Our all-inclusive service collects your vehicle from any UK address, handles the export paperwork and delivers it to your destination port.',
    points: [
      'RoRo shipping from £1,250 (vehicles up to 1.6m height) and £1,395 for larger vehicles',
      'Private 20ft containers from £1,950 and 40ft containers from £3,575',
      'UK-side costs included: customs clearance, port handling and export documentation',
      'Live sailing schedules for hundreds of departures worldwide',
    ],
    steps: [
      { title: 'Get a quote', text: 'Tell us the vehicle and destination and we confirm the rate and the next available sailing.' },
      { title: 'Collection and documents', text: 'We collect the vehicle, complete the export declaration and prepare the Bill of Lading.' },
      { title: 'Sail and collect', text: 'The vehicle sails on the booked departure and is released to you at the destination port.' },
    ],
    links: [
      { name: 'UK car sailing schedule', href: '/uk-car-sailing-schedule' },
      { name: 'Destinations we ship to', href: '/car-shipping' },
      { name: 'Shipping rates', href: '/car-shipping/shipping-rates' },
    ],
  },
  {
    slug: 'car-purchase-brokerage',
    name: 'Car Purchase Brokerage Service',
    shortDesc: 'We buy any car on your behalf from any UK dealership or seller.',
    metaDescription:
      'Found a car in the UK? We verify it, negotiate and buy it on your behalf, then export it — protecting you from fraudulent sellers.',
    image: '/assets/images/services/brokerage.jpeg',
    intro:
      'Sourced your own vehicle in the UK? We can purchase it on your behalf from any UK dealership or private seller. Overseas buyers paying unknown sellers directly are a favourite target for fraud — our brokerage service removes that risk.',
    points: [
      'History and provenance checks before any money changes hands',
      'Negotiation by buyers who know the UK market',
      'Secure payment through our UK business, never an unknown seller',
      'The vehicle moves straight into our inspection and export process',
    ],
    steps: [
      { title: 'Send us the listing', text: 'A link or the seller’s details is all we need to start.' },
      { title: 'We verify and negotiate', text: 'History checks, condition questions and price negotiation are handled for you.' },
      { title: 'We buy and export', text: 'We complete the purchase, collect the vehicle and ship it to your country.' },
    ],
    links: [
      { name: 'How to check UK vehicle history', href: '/car-export-news/how-to-check-uk-vehicle-history-before-buying' },
    ],
  },
  {
    slug: 'vehicle-collection-delivery',
    name: 'UK Vehicle Collection & Delivery',
    shortDesc: 'Collection from any UK address and delivery to the departure port.',
    metaDescription:
      'We collect vehicles from any UK address and deliver them to the departure port — Southampton, Tilbury, Sheerness, Felixstowe, Immingham — at £1 per mile.',
    image: '/assets/images/services/collection-delivery.jpeg',
    intro:
      'We collect any vehicle from any UK address and deliver it to the port of departure — Southampton, Tilbury, Sheerness, Felixstowe, Immingham and others — at a rate of £1 per mile, driven on DVLA plates or moved on a carrier.',
    points: [
      'Nationwide collection from dealerships, auctions, businesses and private addresses',
      'Simple £1 per mile rate, agreed up front',
      'Driven on DVLA plates or transported on a carrier — whichever suits the vehicle',
      'Timed to meet the booked sailing, so the vehicle is not stored at port longer than needed',
    ],
    steps: [
      { title: 'Book the collection', text: 'Tell us where the vehicle is and which sailing it needs to meet.' },
      { title: 'We collect', text: 'The vehicle is driven on DVLA plates or loaded onto a carrier at the agreed time.' },
      { title: 'Delivered to port', text: 'It arrives at the departure port checked in and ready for its sailing.' },
    ],
    links: [
      { name: 'Our export process', href: '/process' },
    ],
  },
  {
    slug: 'customs-clearance',
    name: 'UK Vehicle Customs Clearance',
    shortDesc: 'Export declarations, Bill of Lading and all port documentation.',
    metaDescription:
      'UK export customs clearance for vehicles: declarations filed on the UK customs system, Bill of Lading, export certificates and DVLA documentation.',
    image: '/assets/images/services/customs-clearance.jpeg',
    intro:
      'We have access to the UK government’s customs system and make export declarations directly, preparing every document needed at the UK port of exit — including the Bill of Lading, export certificate and DVLA export documentation.',
    points: [
      'Export declarations filed directly on the UK customs system',
      'Bill of Lading, export certificate and DVLA paperwork prepared for you',
      'Documents couriered to you by UPS/DHL after sailing',
      'Clearance handled at every major UK departure port',
    ],
    steps: [
      { title: 'Documents prepared', text: 'We gather the vehicle and buyer details and prepare the export paperwork.' },
      { title: 'Declaration filed', text: 'The export declaration is lodged on the UK customs system before the sailing.' },
      { title: 'Cleared and shipped', text: 'The vehicle clears the port, sails, and the Bill of Lading is issued and couriered to you.' },
    ],
    links: [
      { name: 'Our export process', href: '/process' },
      { name: 'Export FAQs', href: '/faq' },
    ],
  },
];
