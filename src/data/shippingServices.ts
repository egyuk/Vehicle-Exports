// Single source of truth for the shipping-service landing pages. Used by:
//  - src/pages/shipping/[slug].astro  (one landing page per service)
//  - src/pages/shipping/index.astro   (hub page)
//  - src/components/Header.astro               ("Vehicle Shipping" dropdown)
//  - src/pages/car-shipping/index.astro        (Shipping Services pill links)
// Every figure here must already appear elsewhere on the site — RoRo and
// container rates and the £1/mile collection rate come from the vehicle
// shipping service page and the homepage cards. Services without published
// rates deliberately quote no prices.

export interface ShippingServiceStep {
  title: string;
  text: string;
}

export interface ShippingService {
  slug: string;
  name: string;
  /** One-liner for nav cards and hub tiles. */
  shortDesc: string;
  /** Meta description, ≤160 chars. */
  metaDescription: string;
  intro: string;
  points: string[];
  steps: ShippingServiceStep[];
  /** Extra in-context links shown as "Useful links". */
  links: { name: string; href: string }[];
}

export const shippingServices: ShippingService[] = [
  {
    slug: 'caravan-van-shipping',
    name: 'Caravan & Van Shipping',
    shortDesc: 'Caravans, campervans and vans shipped worldwide from the UK.',
    metaDescription:
      'Ship caravans, campervans and vans from the UK to any country. RoRo and container options with collection from any UK address.',
    intro:
      'We ship caravans, campervans and vans of every size from the UK to destinations worldwide. Towed caravans and driveable vans travel by RoRo, while smaller units can share a container — we recommend the right method for your unit and destination.',
    points: [
      'Touring caravans, static units, campervans and panel vans all handled',
      'RoRo for driveable and towable units; container options where preferred',
      'Collection from any UK address, timed to meet the booked sailing',
      'Export paperwork and UK customs clearance included',
    ],
    steps: [
      { title: 'Tell us the unit', text: 'Dimensions, weight and whether it drives or tows — that sets the method and the rate.' },
      { title: 'Collection and documents', text: 'We collect from any UK address and prepare the export declaration and Bill of Lading.' },
      { title: 'Sail and collect', text: 'The unit sails on the booked departure and is released to you at the destination port.' },
    ],
    links: [
      { name: 'UK car sailing schedule', href: '/uk-car-sailing-schedule' },
      { name: 'Shipping rates', href: '/car-shipping/shipping-rates' },
    ],
  },
  {
    slug: 'classic-vehicle-shipping',
    name: 'Classic Vehicle Shipping',
    shortDesc: 'Careful handling and container shipping for classic and collector cars.',
    metaDescription:
      'Classic and collector car shipping from the UK with careful handling. Sole-use containers, secure lashing and full export documentation.',
    intro:
      'Classic and collector vehicles deserve more care than a standard shipment. We recommend sole-use container shipping for valuable classics — the vehicle is loaded, lashed and sealed in its own container — with RoRo available where budget matters more than isolation.',
    points: [
      'Sole-use 20ft and 40ft containers with professional loading and lashing',
      'RoRo available as the budget option for less delicate vehicles',
      'Condition photographed and documented before loading',
      'Export paperwork, customs clearance and DVLA documentation handled',
    ],
    steps: [
      { title: 'Value and method', text: 'Tell us the vehicle and its value — we advise container or RoRo and confirm the rate.' },
      { title: 'Careful collection', text: 'Collected on a carrier from any UK address and photographed before loading.' },
      { title: 'Ship and release', text: 'The vehicle sails secured in its container and is released to you at the destination port.' },
    ],
    links: [
      { name: 'Container shipping', href: '/shipping/container-shipping' },
      { name: 'Our export process', href: '/process' },
    ],
  },
  {
    slug: 'coach-bus-shipping',
    name: 'Coach & Bus Shipping',
    shortDesc: 'High and heavy RoRo shipping for coaches, buses and minibuses.',
    metaDescription:
      'Ship coaches, buses and minibuses from the UK worldwide. High-and-heavy RoRo shipping with export customs clearance included.',
    intro:
      'Coaches, buses and minibuses ship from the UK as high-and-heavy RoRo cargo — driven aboard specialist vehicle carriers with deck heights to suit. We handle the booking, the port paperwork and the export customs clearance.',
    points: [
      'Coaches, single and double deckers, minibuses and welfare vehicles',
      'Driven aboard RoRo carriers with high-and-heavy deck space',
      'Weight and dimensions confirmed up front so the rate is right first time',
      'UK-side costs included: customs clearance, port handling and export documentation',
    ],
    steps: [
      { title: 'Confirm the vehicle', text: 'Dimensions, weight and destination — we confirm the rate and next suitable sailing.' },
      { title: 'Deliver or we collect', text: 'Drive it to port or have us collect; we complete the export declaration.' },
      { title: 'Sail and collect', text: 'The vehicle sails on the booked departure and is released at the destination port.' },
    ],
    links: [
      { name: 'UK car sailing schedule', href: '/uk-car-sailing-schedule' },
      { name: 'Get a quote', href: '/contact' },
    ],
  },
  {
    slug: 'container-shipping',
    name: 'Container Shipping',
    shortDesc: 'Private 20ft containers from £1,950 and 40ft from £3,575.',
    metaDescription:
      'Private container car shipping from the UK: 20ft containers from £1,950, 40ft from £3,575. Loading, lashing and export clearance included.',
    intro:
      'Container shipping gives your vehicle its own sealed, sole-use container from the UK to the destination port. Private 20ft containers start from £1,950 and 40ft containers from £3,575 — a 40ft takes two cars, which halves the per-vehicle cost.',
    points: [
      'Private 20ft containers from £1,950 and 40ft containers from £3,575',
      'Professional loading and lashing at the container terminal',
      'A 40ft container ships two vehicles — split the cost with a second car',
      'UK-side costs included: customs clearance, port handling and export documentation',
    ],
    steps: [
      { title: 'Get a quote', text: 'Tell us the vehicle and destination and we confirm the container size and rate.' },
      { title: 'Load and lash', text: 'The vehicle is loaded, lashed and sealed in its own container at the terminal.' },
      { title: 'Sail and release', text: 'The container sails on the booked vessel and the vehicle is released at destination.' },
    ],
    links: [
      { name: 'Shipping rates', href: '/car-shipping/shipping-rates' },
      { name: 'RoRo shipping', href: '/shipping/roro-shipping' },
    ],
  },
  {
    slug: 'motorhome-shipping',
    name: 'Motorhome Shipping',
    shortDesc: 'Motorhomes and campervans shipped by RoRo with height-based rates.',
    metaDescription:
      'Motorhome and campervan shipping from the UK worldwide. Driven-aboard RoRo with height-based rates and full export documentation.',
    intro:
      'Motorhomes and larger campervans ship from the UK by RoRo — driven aboard and secured on deck. Rates are based on the vehicle’s dimensions, so we confirm length, width and height up front and quote accordingly.',
    points: [
      'Coachbuilt, A-class and van-conversion motorhomes all handled',
      'Driven aboard RoRo carriers and secured for the voyage',
      'Rates confirmed from exact dimensions before you book',
      'Collection from any UK address, timed to the booked sailing',
    ],
    steps: [
      { title: 'Measure and quote', text: 'Length, width, height and destination — we confirm the rate and sailing.' },
      { title: 'Collection and documents', text: 'We collect the motorhome and complete the export paperwork.' },
      { title: 'Sail and collect', text: 'It sails on the booked departure and is released at the destination port.' },
    ],
    links: [
      { name: 'UK car sailing schedule', href: '/uk-car-sailing-schedule' },
      { name: 'Caravan & van shipping', href: '/shipping/caravan-van-shipping' },
    ],
  },
  {
    slug: 'plant-machinery-equipment',
    name: 'Plant Machinery & Equipment',
    shortDesc: 'Excavators, loaders and machinery shipped as high-and-heavy cargo.',
    metaDescription:
      'Ship plant machinery and equipment from the UK: excavators, loaders and agricultural machinery as high-and-heavy RoRo or containerised cargo.',
    intro:
      'We export plant machinery and equipment from the UK — excavators, loaders, dumpers and agricultural machinery. Self-propelled machines travel as high-and-heavy RoRo cargo; smaller equipment can be containerised.',
    points: [
      'Excavators, loaders, dumpers, telehandlers and agricultural machinery',
      'Self-propelled machines ship RoRo; smaller items containerised',
      'Weight and dimensions confirmed up front for an accurate rate',
      'Export declarations and port documentation handled for you',
    ],
    steps: [
      { title: 'Spec the machine', text: 'Make, model, weight and dimensions — we confirm the method and the rate.' },
      { title: 'Deliver or we collect', text: 'Machines are delivered to port or collected on a suitable carrier.' },
      { title: 'Ship and release', text: 'The machinery sails on the booked vessel and is released at destination.' },
    ],
    links: [
      { name: 'Tractor shipping', href: '/shipping/tractor-shipping' },
      { name: 'Get a quote', href: '/contact' },
    ],
  },
  {
    slug: 'roro-shipping',
    name: 'RoRo Shipping',
    shortDesc: 'Roll-on roll-off shipping from £1,250 with frequent worldwide sailings.',
    metaDescription:
      'RoRo car shipping from the UK from £1,250 (vehicles up to 1.6m high) and £1,395 for larger vehicles. Frequent sailings worldwide.',
    intro:
      'Roll-on roll-off is the simplest and cheapest way to ship a running vehicle: it is driven aboard the vessel, secured on deck and driven off at the destination port. RoRo starts from £1,250 for vehicles up to 1.6m high and £1,395 for larger vehicles.',
    points: [
      'From £1,250 (vehicles up to 1.6m height) and £1,395 for larger vehicles',
      'Frequent sailings from UK ports to destinations worldwide',
      'Live sailing schedules for hundreds of departures',
      'UK-side costs included: customs clearance, port handling and export documentation',
    ],
    steps: [
      { title: 'Get a quote', text: 'Tell us the vehicle and destination and we confirm the rate and next sailing.' },
      { title: 'Deliver or we collect', text: 'Drive it to port or have us collect it from any UK address.' },
      { title: 'Sail and drive off', text: 'The vehicle is driven aboard, sails, and is driven off at the destination port.' },
    ],
    links: [
      { name: 'UK car sailing schedule', href: '/uk-car-sailing-schedule' },
      { name: 'Shipping rates', href: '/car-shipping/shipping-rates' },
    ],
  },
  {
    slug: 'shipping-household-goods',
    name: 'Shipping Household Goods',
    shortDesc: 'Personal effects and household goods shipped alongside your vehicle.',
    metaDescription:
      'Ship household goods and personal effects from the UK — containerised on their own or loaded alongside your vehicle in a private container.',
    intro:
      'Relocating abroad? Household goods and personal effects can ship in their own container, or be loaded alongside your vehicle in a private container — often the most economical way to move a car and belongings together.',
    points: [
      'Goods loaded alongside your vehicle in a sole-use container',
      'Standalone container options for larger household moves',
      'Packing lists and export declarations prepared with you',
      'One shipment, one set of paperwork, one destination port collection',
    ],
    steps: [
      { title: 'List the goods', text: 'A packing list and the destination let us confirm the container size and rate.' },
      { title: 'Load and seal', text: 'Vehicle and goods are loaded, secured and sealed in the container.' },
      { title: 'Sail and clear', text: 'The container sails and is cleared and released at the destination port.' },
    ],
    links: [
      { name: 'Container shipping', href: '/shipping/container-shipping' },
      { name: 'Export FAQs', href: '/faq' },
    ],
  },
  {
    slug: 'tractor-shipping',
    name: 'Tractor Shipping',
    shortDesc: 'Agricultural tractors driven aboard RoRo carriers worldwide.',
    metaDescription:
      'Tractor shipping from the UK worldwide: agricultural tractors driven aboard RoRo vessels as high-and-heavy cargo, with export clearance included.',
    intro:
      'UK tractors are in demand worldwide, and shipping them is straightforward: running tractors are driven aboard RoRo vessels as high-and-heavy cargo. We confirm dimensions and weight, book the sailing and handle the export paperwork.',
    points: [
      'All agricultural tractors handled, with or without implements',
      'Driven aboard RoRo carriers as high-and-heavy cargo',
      'Rates confirmed from dimensions and weight before you book',
      'Export declarations and port documentation included',
    ],
    steps: [
      { title: 'Spec the tractor', text: 'Make, model, dimensions and destination — we confirm the rate and sailing.' },
      { title: 'Deliver or we collect', text: 'Deliver to port or have it collected on a suitable carrier.' },
      { title: 'Sail and collect', text: 'The tractor sails on the booked departure and is released at destination.' },
    ],
    links: [
      { name: 'Plant machinery & equipment', href: '/shipping/plant-machinery-equipment' },
      { name: 'Get a quote', href: '/contact' },
    ],
  },
];
