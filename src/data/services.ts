// Single source of truth for the six export services. Used by:
//  - src/pages/services/[slug].astro  (one landing page per service)
//  - src/pages/services/index.astro   (hub page)
//  - src/components/Header.astro      ("Car Export Services" dropdown cards)
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
  /** Punchy short name for the mobile nav panel; falls back to `name`. */
  navName?: string;
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
    navName: 'Vehicle Sourcing',
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
    navName: 'Tax-Free Exports',
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
    slug: 'car-purchase-brokerage',
    name: 'Car Purchase Brokerage Service',
    navName: 'Purchase Brokerage',
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
    navName: 'Collection & Delivery',
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
    navName: 'Customs Clearance',
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
  {
    slug: 'new-used-car-exports',
    name: 'New & Used Car Exports',
    shortDesc: 'Inspected new and used cars sourced in the UK and exported worldwide.',
    metaDescription:
      'New and used car exports from the UK: vehicles sourced from dealers and auctions, inspected, and shipped worldwide by RoRo or container.',
    image: '/images/11291ecc0d784d8e81e7ea2ef334ba69.jpg',
    intro:
      'We export new and used cars from the UK every week — sourced from our dealer, auction and trade network or supplied by you, inspected before shipment, and shipped worldwide by RoRo or container.',
    points: [
      'New and used stock sourced from UK dealers, auctions and private sellers',
      'Every vehicle goes through a multi-point inspection before it ships',
      'VAT-qualifying used cars and brand-new tax-free vehicles save 20% UK VAT on export',
      'RoRo or container shipping to suit the vehicle and destination',
    ],
    steps: [
      { title: 'Choose the car', text: 'Browse our export-ready stock or tell us the spec to source.' },
      { title: 'Inspect and buy', text: 'The vehicle is history-checked, inspected and purchased.' },
      { title: 'Export worldwide', text: 'It ships by RoRo or container and is released at your destination port.' },
    ],
    links: [
      { name: 'Browse new cars', href: '/shipping-cars?condition=New' },
      { name: 'Browse used cars', href: '/shipping-cars?condition=Used' },
      { name: 'Tax-free car exports', href: '/services/tax-free-car-exports' },
    ],
  },
];
