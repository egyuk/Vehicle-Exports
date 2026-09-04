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

/**
 * A block of guide prose. `title` renders as an h3; leave it off for the lead
 * paragraphs that sit directly under the section heading. `bullets` render
 * between `text` and `after`, which is the shape the VAT guide needs over and
 * over: a sentence, the conditions, then what follows from them.
 */
export interface ServiceGuideBlock {
  title?: string;
  text?: string[];
  bullets?: string[];
  after?: string[];
  /** Small italic caveat under the block. */
  note?: string;
}

export interface ServiceGuideSection {
  heading: string;
  blocks: ServiceGuideBlock[];
  /** Numbered example cards, e.g. the tests for whether a car counts as new. */
  examples?: string[];
}

/**
 * Long-form reference material for a service, rendered under "What You Get".
 * Only tax-free-car-exports has one: the VAT rules are the thing buyers
 * actually need explained, and they were on a page of their own until
 * 2026-09-04.
 */
export interface ServiceGuide {
  heading: string;
  lead?: string;
  introBullets?: string[];
  sections: ServiceGuideSection[];
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
  /** Optional long-form reference section under the service copy. */
  guide?: ServiceGuide;
}

export const services: Service[] = [
  {
    slug: 'car-sourcing',
    name: 'UK Car Sourcing & Supply',
    navName: 'Car Sourcing',
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
    links: [],
    // Moved here 2026-09-04 from /how-to-reclaim-vat-on-vehicles-exported-from-eu-uk,
    // whole and unedited apart from UK spelling. It belongs on the service it
    // explains rather than on a page of its own: someone reading about tax-free
    // supply is exactly the person who needs the rules.
    guide: {
      heading: 'VAT, Tax-Free Supply and Reclaiming on Exported Cars',
      lead:
        'How the 20% saving works, which cars qualify for it, and what happens to VAT when a car crosses a border. This is general guidance rather than tax advice — the detail is set by the tax authority in each country — but knowing which case you fall into is usually enough to see whether a saving is available.',
      introBullets: [
        'When you buy a new car from a dealer in your own EU country you pay VAT on it. If you use this car for your private purposes, this VAT will not be refunded (unless you sell it when it is still new to a customer in another EU country – see below for what qualifies as a New vehicle).',
        'When you buy an old car from a car dealer, VAT may be or may be not be separately mentioned on the invoice. This depends on how the dealer opts to calculate VAT on this car. For explanation on VAT payment on used cars, see below. These are referred to as VAT-Qualifying cars.',
        'When you buy a car from another individual in your own EU country, you do not pay VAT.',
      ],
      sections: [
        {
          heading: 'What Is VAT, and Can I Export a Car from the UK Free of VAT?',
          blocks: [
            {
              text: [
                'Buying directly from us, international clients can save 20% on the purchase price of a brand new or used VAT-qualifying vehicle when it is exported from the UK to their destination country.',
                'VAT — Value Added Tax — is a general consumption tax assessed on the value added to goods and services, and it applies to more or less everything bought and sold for use or consumption in the UK. HMRC collects it at a standard rate of 20%. Exports are normally outside that, which is where the saving comes from.',
              ],
              note: 'Once you have paid VAT to a dealer it is gone and cannot be reclaimed, so talk to us before you buy rather than after.',
            },
            {
              title: 'VAT on New Cars',
              text: [
                'A brand new vehicle bought in the UK carries the full 20% VAT, added to the invoice. We can supply a brand new vehicle from any UK dealer VAT-free, and that expense simply comes off the purchase.',
              ],
            },
            {
              title: 'VAT on Used Cars',
              text: [
                'Most used cars carry no VAT of their own, because it was already paid on the first sale or when the car was imported into the UK. The exception is the one below, and it is the one worth looking for.',
              ],
            },
            {
              title: 'What Is a VAT-Qualifying Car?',
              text: [
                'A VAT-qualifying car is a used car on which the VAT was originally reclaimed by the buyer — typically ex-lease, ex-fleet or an ex-demonstrator. Because the VAT is still sitting in the price, it can be taken out again when the car is exported. A used car that is not VAT-qualifying cannot give you that saving, however good the deal looks.',
              ],
            },
            {
              title: 'Reclaiming VAT',
              text: [
                'An individual or business registered for VAT in the UK, buying purely for business use or for export, can usually reclaim the VAT on the purchase price. We confirm which route applies to you while we are quoting, before you commit to a vehicle.',
              ],
            },
          ],
        },
        {
          heading: 'Tax-Free Supply from Any UK Dealer',
          blocks: [
            {
              text: [
                'We supply brand new cars, and used VAT-qualifying cars, without the 20% VAT, and export them directly to clients overseas. The vehicle can come from any UK franchised dealer — we are not limited to our own stock.',
                'The saving is only available if the car is bought correctly in the first place, which is why the order of events matters: talk to us, then buy.',
              ],
            },
          ],
        },
        {
          heading: "When Is a Car 'New'?",
          blocks: [
            {
              text: [
                'A car is new for VAT purposes if it has been in use for no more than 6 months, or it has been driven for no more than 6,000 kilometres when you buy it.',
              ],
            },
          ],
          examples: [
            'A car that is two years old but has travelled only 4,000 kilometres is new for VAT purposes.',
            'A four-month old car has been driven for 15,000 kilometres. It is new for VAT purposes.',
            'A ten-month old car that has been driven for 6,500 kilometres is not new.',
          ],
        },
        {
          heading: 'VAT When Buying a Car Abroad',
          blocks: [
            {
              text: [
                'If you are a private person and you have bought a car abroad with the intention of bringing it back and using it in your home EU country, you may have to pay VAT when you do bring the car back.',
              ],
            },
            {
              title: 'VAT Is Due When You Bring in a New Car',
              text: ['If you bring back to your country on a permanent basis a new car that:'],
              bullets: [
                'You have bought in an EU country other than your own',
                'With the intention of taking it back to your own EU country',
              ],
              after: [
                'You pay VAT on the value of the car in your own EU country at your own country\'s rate, BUT you should not have been charged VAT when you bought the car (if charged, it must be refunded).',
              ],
            },
            {
              title: 'What Is the Amount on Which VAT Is Payable?',
              text: [
                'VAT will be due on the total of the price you paid for the car plus any accessories and of associated costs, such as delivery charges.',
              ],
            },
            {
              title: 'What If I Paid VAT When I Bought the Car?',
              text: [
                'If you bought the car from a dealer or other business and you made it clear that your intention was to have the car taken back to your own country and kept there permanently, and satisfied any other necessary conditions, you should not have had to pay VAT (the sale should have been exempt). Some sellers may require paying VAT upon purchase and refund that amount when they get satisfactory evidence that the car was transported to and registered in another EU country. If despite this, you were incorrectly charged VAT, you must take this up with your supplier or the tax authorities of that country. You must still pay your home EU country’s VAT regardless.',
              ],
            },
            {
              title: 'How Do I Notify the Tax Authorities and When Do I Pay the VAT?',
              text: [
                'Your country sets the rules for notifying and paying the VAT on new cars brought in from other EU countries. You should consult your country\'s tax authorities.',
              ],
            },
            {
              title: 'What If I Bought the Car While Living in the Other EU Country and Am Now Returning to Live in My Home EU Country?',
              text: [
                'If you bought the car for your personal use while you were living abroad, you will have paid VAT in that country at the time of purchase. When you bring the car back with you on your return to your home EU country, you will have to pay VAT on this car at the rate applicable in that EU country. You will however be entitled to the refund of VAT paid for the car upon purchase in the first EU country. The refunded VAT amount will be proportionate to the period that it was used in that EU country. Consult relevant tax authorities for the exact details.',
              ],
            },
          ],
        },
        {
          heading: 'Bringing in an Old Car from Another EU Country',
          blocks: [
            {
              title: "What Is an 'Old' Car?",
              text: [
                'An ‘old’ car is any car that had first been put into use more than six months previously, and had travelled more than 6,000 kilometres when you bought it.',
              ],
              note: 'This means that the car can still be considered new even if you bought it second hand.',
            },
            {
              title: 'What Happens When I Bring an Old Car Back from Another EU Country?',
              text: [
                'When you bring your old car back to your EU country, you will not have to pay VAT on it. You will, however, have to re-register the car in your home country and could be obliged to pay any associated registration or road taxes. Consult your own country\'s tax authorities to find out the rules in detail.',
              ],
            },
            {
              title: 'I Am Coming to Live in the EU',
              text: ['If:'],
              bullets: [
                'You are transferring your residence from a country outside the EU to a country inside the EU, and',
                'The car is being imported as a personal possession',
              ],
              after: [
                'you should normally not have to pay duty or VAT. Consult your new country\'s VAT authorities to find out the rules in detail. You will, however, have to re-register the car in your new country and pay any associated registration or road taxes.',
              ],
            },
            {
              title: 'Selling a Used Car',
              text: [
                'If you sell your car as a private person, you do not have to calculate VAT on this sale. However, if your car is considered new car and you sell it to a customer in another EU country, the customer will be obliged to pay VAT on this car in his own EU country. In such a case you will be entitled to a refund of VAT you have paid when purchasing this car. The amount of refundable VAT will normally be calculated by your tax authorities and will be proportional to the time that you used the car in your EU country. Consult your own country\'s tax authorities to find out the rules in detail.',
              ],
            },
          ],
        },
        {
          heading: 'Bringing in a Car from Outside the EU',
          blocks: [
            {
              title: 'Will I Have to Pay VAT?',
              text: [
                'When you bring a car into an EU country from outside the EU, the tax treatment depends on whether:',
              ],
              bullets: [
                'You normally live in the EU and bought the car abroad, or',
                'You are coming to live in the EU and the car is being imported as one of your personal possessions',
              ],
              note: 'For this purpose, it does not matter if the car is a new car or not.',
            },
            {
              title: 'I Normally Live in the EU',
              text: [
                'If you are already living in an EU country, and you wish to import a car you bought outside the EU, it is treated just like any other imported goods. You will have to pay customs duty and import VAT, unless any reliefs apply. Consult your country\'s customs and VAT authorities for how to make the customs declaration and pay the tax or whether you qualify for any relief. You will also have to register the car and pay any associated registration or road taxes.',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'buy-on-your-behalf',
    name: 'Buy a Car on Your Behalf',
    navName: 'Buy on Your Behalf',
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
    name: 'New / Used Car Export',
    navName: 'New/Used Car Export',
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
