// Per-country rate overrides for src/components/CountryCosts.astro.
//
// THE PUBLISHED RATE TABLE IS THE DEFAULT. Prices normally come from
// src/data/shipping-rates.ts (~103 countries), which is the same data the
// /car-shipping/shipping-rates page shows, and is rendered as "approximate,
// call for the latest rates". This file is only for the exceptions:
//
//   * a CURATED all-in rate that has been signed off commercially, which
//     takes priority and drops the "approximate" caveat; or
//   * a `note`, for a route the two rate cards do not suit; or
//   * transit copy (`roroTransit` / `containerTransit`) for a country whose
//     prices come from the table but whose sailing times we know.
//
// History worth keeping (2026-09-03): Australia and Kenya used to carry
// identical hardcoded prices here — £1,250 / £1,395 / £1,950 / £3,575 on both,
// despite Mombasa and Melbourne being nothing like the same lane. George
// confirmed those were placeholders, not real rates, and that the published
// table should drive every country. They were removed. Their transit lines are
// kept below because those were never in doubt.
//
// So: do NOT reintroduce a price here unless it is a genuine, signed-off,
// all-in figure for that specific country. An invented or copied one is worse
// than the table.

import { approximateRatesFor } from './shipping-rates';

export interface ShippingRates {
  /** Curated all-in RoRo rate, vehicle up to 1.6m height. Overrides the table. */
  roroSmall?: string;
  /** Curated all-in RoRo rate, vehicle above 1.68m height. */
  roroLarge?: string;
  /** Curated all-in 20ft private container rate. */
  container20?: string;
  /** Curated all-in 40ft container rate. */
  container40?: string;
  /** Transit line under the RoRo card. Used with curated OR table prices. */
  roroTransit?: string;
  /** Transit line under the container card. Used with curated OR table prices. */
  containerTransit?: string;
  /**
   * RoRo runs on this route but the published table has no RoRo row for it, so
   * the costs section shows a RoRo card reading "Call for price" rather than
   * implying the route is container-only. Set this instead of inventing a rate.
   */
  roroOnRequest?: boolean;
  /**
   * Shown instead of rate cards where they do not fit the route — a short-sea
   * ferry crossing priced as a range, for example. Suppresses the table.
   */
  note?: string;
  /** When these figures were last confirmed. Keep it honest; it drives review. */
  checked?: string;
}

export const shippingRates: Record<string, ShippingRates> = {
  // Prices come from the published table (RoRo £771, 20ft £1,143, 40ft £1,979).
  // Only the transit copy is ours.
  Australia: {
    roroTransit: 'Ideal for most vehicles — simple, fast, and cost-effective. Most sailings 6-8 weeks.',
    containerTransit:
      'Extra security, or for multiple vehicles and personal items. Transit varies by routing — see the sailing schedule.',
    checked: 'Transit times from the sailing schedule, 2026-09-03. Prices from the published rate table.',
  },
  // Prices come from the published table (RoRo £899, 20ft £1,403, 40ft £1,929).
  Kenya: {
    roroTransit: 'The most common and cost-effective option for a single vehicle. Typically 4-6 weeks.',
    containerTransit: 'Extra security, or for multiple vehicles and personal items. Typically 5-7 weeks.',
    checked: 'Transit times from the sailing schedule, 2026-09-03. Prices from the published rate table.',
  },
  // George 2026-09-03: Equatorial Guinea DOES have a RoRo service (Grimaldi
  // call at Malabo and Bata), but the published table only carries container
  // rates for it, so the RoRo card asks the customer to call rather than
  // showing a made-up figure or pretending the route is container-only.
  'Equatorial Guinea': {
    roroOnRequest: true,
    checked: 'RoRo confirmed by George 2026-09-03; container rates from the published table',
  },
  // Not in the published rate table at all — the short Irish Sea crossing has
  // always been quoted as a range rather than by vehicle height.
  Ireland: {
    // Repriced 2026-09-03 with the rest of the card: was £250-£700, +35% and
    // rounded to the nearest £5 because a range reads better in prose than
    // £338-£945 would.
    note: 'Crossings are typically £340-£945 depending on vehicle size and the route used. Because the Irish Sea crossing is short and sails frequently, we quote it per booking rather than from a fixed rate card.',
    checked: 'Repriced 2026-09-03 (+35% on the pre-2026-09-03 published range)',
  },
};

/**
 * The cheapest headline rate for a country — a curated all-in rate if one
 * exists, otherwise the published table's approximate RoRo (or 20ft container
 * where a country ships only in containers). Undefined where nothing is known,
 * which correctly hides the hero price chip and the Service schema offer.
 */
export const fromPriceFor = (country: string): string | undefined => {
  const curated = shippingRates[country];
  if (curated?.roroSmall) return curated.roroSmall;
  if (curated?.note) return undefined; // priced per booking — no single "from"
  const approx = approximateRatesFor(country);
  return approx?.roro ?? approx?.c20;
};

/** True when a country's headline price is an approximate table figure. */
export const isApproximatePrice = (country: string): boolean => {
  const curated = shippingRates[country];
  if (curated?.roroSmall || curated?.note) return false;
  return Boolean(approximateRatesFor(country));
};
