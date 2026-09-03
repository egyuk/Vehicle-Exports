# Site backlog

Open issues from a full-site audit, in priority order. Counts come from auditing
the built `dist/` output on 2026-08-22 (148 pages).

## Deployment — read this first

The site deploys to **https://vehicle-exports.vercel.app** while it is being
built, and moves to **vehicleexports.co.uk** when finished.

Because that staging URL is a Vercel *production* deployment, Vercel does not
apply its automatic noindex, so the staging copy could be crawled and then
compete with the real site at launch. `src/pages/robots.txt.ts` therefore
generates robots.txt per environment and **blocks all crawling by default**.

Canonical tags already point at vehicleexports.co.uk, which is deliberate — it
attributes the content to the final domain while staging elsewhere.

### Launch checklist

1. Set **`SITE_LIVE=true`** in the Vercel environment. Without it the live site
   ships `Disallow: /` and will not be indexed at all.
2. Point vehicleexports.co.uk at this deployment (it currently serves the old
   WordPress site).
3. Redirect (301) carexporters.com to vehicleexports.co.uk — it currently serves
   an older build of this same codebase and would otherwise compete with it.
4. Rebuild and confirm `dist/robots.txt` reads `Allow: /` with the sitemap line.

Re-run the audit any time against a fresh `npx astro build` — the checks are
broken links, missing/duplicate SEO fields, `h1` counts, image alt/sizing,
placeholder links and asset weight.

---

## 1. Twenty country pages are linked site-wide but do not exist

**~5,300 broken links** — the single biggest issue, because the links sit in the
main navigation and therefore appear on every page.

Listed in both:
- `src/components/Header.astro` (nav dropdown, ~line 89 onward)
- `src/pages/car-shipping/index.astro` (the destinations hub was merged into
  `/car-shipping` in Sep 2026; the continent list starts ~line 70)

Missing: Bangladesh, Barbados, Botswana, Canada, Cayman Islands, Cyprus, Ghana,
Great Britain, Hong Kong, Indonesia, Malaysia, Namibia, New Zealand, Singapore,
South Africa, Sri Lanka, Tanzania, Thailand, Trinidad & Tobago, Uganda.

Only these country routes actually build: `africa`, `australia`,
`car-export-to-asia`, `caribbean`, `europe`, `hong-kong-shipping`, `kenya`,
`middle-east`. Note the six region pages are **not** in the nav at all.

Two ways out: build the pages, or trim the nav to what exists.

**Nav side-stepped 2026-09-02:** `src/data/destinations.ts` now links only the
countries that have a page to that page; every other country (now every
destination on the sailing schedule, ~85 in all) links to
`/uk-car-sailing-schedule?country=X`, which pre-filters the schedule. So the
nav and the `/car-shipping` hub no longer 404, but the missing country pages
are still missing — building them (and pointing `countryPages` at them) is
still the real fix.

Building is now cheaper than it was — `src/pages/car-shipping/australia.astro`
is the template and already includes the sailing schedule section, which pulls
its own data from `countryName`. The schedule data covers many of these
countries already (Canada, Ghana, Tanzania, Singapore, South Africa,
New Zealand, Cyprus…), so a new page starts with real content.

**Template finished 2026-09-03.** The Australia page no longer carries any
`[TODO]` placeholders: it now has real, sourced sections for import approval
and eligibility (RVSA/ROVER, the personal-effects, 25-year and SEVS routes),
duty/GST/luxury car tax, biosecurity and asbestos, state-by-state registration
and arrival. Facts came from primary government sources (infrastructure.gov.au,
abf.gov.au, ato.gov.au, agriculture.gov.au, dfat.gov.au) and were checked by
independent verifier agents.

Maintenance notes for whoever copies it:
- The **LCT thresholds and the fuel-efficient definition are financial-year
  figures** (2026-27: A$80,809 / A$91,661; fuel-efficient = 3.5 L/100km since
  1 July 2025). They are re-indexed every 1 July — recheck each July.
- Small application and inspection fees were deliberately left off the page.
  They move often and do not affect the buying decision.
- **Do not "simplify" the stink bug (BMSB) paragraph.** The obvious summary —
  "the UK isn't a target risk country, so no treatment is needed" — is wrong,
  and a first draft of this page said exactly that before review caught it.
  The measures catch goods *manufactured in* a target risk country as well as
  goods shipped from one, and vehicles are high-risk goods, so a German,
  Italian, French, Spanish, Japanese or US built car still needs mandatory
  treatment when it sails from the UK. That is a large share of what this
  company exports, so the distinction is commercial, not pedantic.
- **LCT is not a flat 33% of the excess.** The rate applies to the excess with
  the GST element stripped out (× 10/11), so the real cost is ≈30% of the
  amount over the threshold. An earlier draft overstated the tax by ~10%.
- A-UKFTA origin evidence is "a declaration of origin **or** other supporting
  documentation", not a declaration only. Note also that the tariff schedule
  shows no UK rate against used cars — the free rate comes from the
  agreement's residual rule, so a broker may quote 5% by default.

### Shared components + template — DONE 2026-09-03

Country pages no longer duplicate their boilerplate. About 105 lines that were
copy-pasted between Australia and Kenya now live in five components, and the
three existing pages were rewired onto them:

| File | Renders |
| --- | --- |
| `src/components/CountryCosts.astro` | Costs h2, intro, rate cards, included/excluded lists. Has a `<slot/>` for a page footnote (Kenya's duty-calculator link). |
| `src/components/CountryBookingTerms.astro` | Booking documents + payment terms. No props. |
| `src/components/CountryServices.astro` | "Our Other Services", four cards. `inspection` overrides the fourth. |
| `src/components/CountrySourcing.astro` | "Car Sourcing", lead paragraph + three route cards. `intro` overrides the lead. |
| `src/components/CountryTaxFree.astro` | "Tax-Free Vehicle Supply & VAT Reclaims", all four UK schemes. |

Line counts after: australia 531→357, kenya 368→197, ireland 383→152.

**Rates now live in `src/data/shipping-prices.ts`**, keyed by country, and feed
the costs table, the hero chip, the Service schema and the page title and
description (so a price can no longer drift between the table and the `<title>`).
A country with **no** entry renders an enquiry prompt instead of a price table,
the same way `<SailingSchedule>` handles a country with no sailings — so a page
is safe to publish before pricing is signed off. Never invent a figure.

**To add a country:** copy `src/pages/car-shipping/_country-template.astro`.
The leading underscore means Astro does not route it, so it is not built, not
in the sitemap and needs no noindex (verified: page count stays 148). The file
carries its own instructions, including a one-liner that reads real ports,
carriers and transit ranges out of `sailing-schedules.json` — use it, because
twenty UK-side pages that differ only by country name are duplicate content.

### Scope rule: country pages stop at the UK quayside — SET 2026-09-03

George's call. We are a UK exporter; what happens after the car lands is the
client's responsibility. So `/car-shipping/<country>` covers sourcing, UK
tax-free/VAT-qualifying supply, UK customs and documentation, and getting the
car onto the ship. Destination duty, local taxes, inspection and registration
belong under `/import-uk-cars/`, which already exists for exactly this
("customs value, import duty, VAT and registration") but is currently a 67-line
hub plus the Kenya duty calculator.

- **Australia, Kenya and Ireland are all grandfathered** — the three existing
  country pages keep their destination sections. They are not the pattern to
  copy; the rule applies to NEW pages built from the template.
- **Ireland was briefly cut back and then restored** (same day, on George's
  call). Its five destination sections — import duty and Returning Goods
  Relief, Irish VAT, VRT, NCTS, arrival — are back on the page, in their
  original order and wording, and the temporary
  `_ireland-destination-draft.astro` holding pen was deleted so there is only
  one copy. Its facts bar keeps the Irish VAT and import-duty entries too.
- Ireland also gained what it never had: the shared layout, FAQs and FAQPage
  structured data. It previously hand-rolled its own hero and sidebar.
- **The Irish figures were then fact-checked (2026-09-03) and mostly rewritten.**
  Two independent checkers per claim against EU TARIC, revenue.ie and ncts.ie.
  **Seven of eight claims were wrong**; only the 23% VAT rate survived. This is
  the single best argument for not copying old marketing copy forward:

  | Claim as published | Verdict |
  | --- | --- |
  | Standard duty is 10% | Misleading — it is 0% **or** 10%, decided by where the car was **built**. UK-built cars clear at 0% under the EU-UK trade agreement, with a statement on origin. |
  | Returned Goods Relief needs EU manufacture | **Wrong.** Revenue: "the origin of the car does not impact on claiming Returned Goods Relief." It needs prior export *from* the EU, unaltered, back within 3 years **of that export** — so it rarely helps on ordinary UK stock now the pre-Brexit window has closed. |
  | UK origin needs "at least 65% UK-origin components", typically prestige/4x4/performance | **Invented.** No content figure of that kind and no vehicle-class test. (EV rules of origin use a 45% threshold to 31 Dec 2026, then 55%.) |
  | Irish VAT 23% on customs value | **Confirmed.** |
  | VRT is based on OMSP, CO2 and NOx | Incomplete — it is a CO2 charge (a % of Revenue's valuation, 7%–41% by band) **plus** a separate NOx levy. Vehicles 30+ years old pay a flat rate instead; vans use a lower scale. |
  | EVs get up to €5,000 VRT relief | Overstated — capped by the VRT actually due (so usually a few thousand), tapers above a €40,000 valuation, gone above €50,000, hybrids excluded, and legislated only to **31 December 2026**. |
  | Book the NCTS inspection within 30 days | **Wrong, and it would have cost customers money.** Two deadlines: **book within 7 days**, **register within 30**. Extra VRT is charged for missing the 30. |
  | NCTS inspects, calculates VRT, issues the number | Incomplete — for a GB car the **customs declaration must be done first**, and its reference is needed at the appointment. |

  The page now carries the corrected version, and a comment above those sections
  lists what changed so nobody restores the old wording. Deliberately **no CO2
  band percentages, NOx tiers or euro minimums on the page** — they move at
  Budget time and would rot; the page gives ranges and rules and points at a
  quote instead.
- The one destination mention left on a UK-side page is deliberate: an FAQ
  telling the customer that duty, VAT and VRT are theirs and are not in our
  price. Better than silence.

### Open items from this work

- **Country-page prices — RESOLVED 2026-09-03.** George confirmed the
  £1,250 / £1,395 / £1,950 / £3,575 set was a **placeholder**, not a real rate,
  and that the published table should drive every country. Those figures were
  removed from `shipping-prices.ts`; Australia and Kenya now read the table
  (Australia £771 RoRo / £1,143 / £1,979, Kenya £899 / £1,403 / £1,929) and
  keep only their transit copy. Ireland is not in the table and keeps its
  £250-£700 range. Titles, meta descriptions, hero chips, FAQs and the costs
  table on each page all read the one source now, so they cannot drift.

- ⚠ **The same placeholders are still live in `src/data/shippingServices.ts`.**
  That file feeds `/shipping/<service>`, `/shipping`, `/car-shipping` **and the
  Header mega menu, so the figures appear on every page of the site**. It still
  says RoRo "from £1,250" (and £1,395), containers "from £1,950" and 40ft
  "from £3,575" — the exact numbers just confirmed to be placeholders. The
  table's real minima are very different:

  | Service | Currently advertised | Cheapest in the rate table |
  | --- | --- | --- |
  | RoRo | from £1,250 | **£437** (Hong Kong) |
  | 20ft container | from £1,950 | **£623** (Laem Chabang, Thailand) |
  | 40ft container | from £3,575 | **£1,029** (Hong Kong) |

  Deliberately **not** changed without asking: these are headline marketing
  prices across the whole site, and dropping "from £1,250" to "from £437" is a
  commercial decision, not a code one. Either wire them to the table minima the
  way the country pages now are, or replace them with real signed-off figures —
  but leaving known-placeholder prices in the nav is the worst of the three.

- **Data quality in the rate table:** Equatorial Guinea (Malabo and Bata) is
  listed at **£12,523** for a 20ft container against **£1,679** for a 40ft.
  Every other 20ft rate sits between £623 and £3,023, so this looks like a typo
  for ~£1,252. It does not affect the minima or any current page, but it would
  look absurd on an Equatorial Guinea page and should be corrected at source.

### Rate tables are now shared data — DONE 2026-09-03

The RoRo and container tables (91 + 151 rows, ~103 countries) moved out of
`src/pages/car-shipping/shipping-rates.astro` into `src/data/shipping-rates.ts`.
The rates page imports them and renders unchanged (244 rows, verified).

`CountryCosts` now picks from four shapes, in priority order:

1. **Curated all-in rate** from `shipping-prices.ts` — wins whenever present.
2. **A prose note** — the Irish Sea range.
3. **Approximate published rates** from the rate table, labelled "Approximate —
   call for the latest rates", with a link to the full table. When this is
   showing, the inclusions heading changes to "What a full export quote covers"
   so an approximate freight figure is never passed off as an all-in price.
4. **"Call for price"** with the phone number.

This means a new country page usually gets real indicative prices with no work,
because the table covers far more countries than we have curated rates for.
`approximateRatesFor()` handles the table's own spellings (`Grand Caymen`,
`Ethiopa`, `Hati`) via an alias map so lookups do not silently miss.
- **Ireland transit claims are unsupported by the schedule.** The page keeps
  "3-7 days" in its facts bar and "Typically 7-14 days" on its container card,
  but all 126 Ireland sailings in the data are same-day crossings (Holyhead→
  Dublin, Fishguard→Rosslare, Stena Line only). The FAQ now reconciles this by
  calling the crossing same-day and framing 3-7 days as end-to-end; the two
  card/facts figures still want a decision.
- **Ireland "Cork" removed.** The page claimed delivery to Dublin, Rosslare and
  Cork; neither `destinations.ts` nor the schedule has Cork. Now Dublin and
  Rosslare throughout. If we do deliver to Cork, the data files need it, not
  just the prose.

## 2. Canonical domain — FIXED 2026-08-22

Was declaring `carexporters.com` in `astro.config.mjs`, with `robots.txt` naming
a third domain (`autodeal-lyart.vercel.app`). Now `vehicleexports.co.uk`
throughout: config `site`, all canonical tags, sitemap `<loc>`s, `og:url`, and
the hardcoded fallback in `src/layouts/Layout.astro` (that fallback only applies
if `Astro.site` is unset, but it named the old preview URL).

## 3. Blog redirect — FIXED 2026-08-22

`astro.config.mjs` was redirecting the long China blog URL to
`…/china-car-exports-jump-73-percent`, but the post's `slug:` frontmatter is
`china-car-exports`, so the old URL 404'd. Redirect target corrected. The
Morocco post's redirect was already right.

## 4. 98 MB unreferenced video — FIXED 2026-08-22

Removed from the repo AND from git history (git filter-branch + force push, all
commit SHAs changed). Deploys went 136 MB -> 37 MB, .git 151 MB -> 51 MB. A
backup copy lives at C:/Users/georg/Desktop/vehicleexports-backup/video.mp4 —
the only remaining copy, since history no longer holds it.

## 5. 533 placeholder `#` links across 132 pages

- `src/components/Footer.astro` — Privacy Notice, Terms and Conditions, Cookie
  Policy in the bottom row (3 × every page = the bulk of the count)
- `src/components/CTASection.astro` — two app-store buttons
- `src/components/CompareCars.astro` — one

The footer legal links matter most: the site currently has **no working legal
pages linked anywhere**.

## 6. Newsletter forms do nothing

- `src/components/Footer.astro` (footer signup)
- `src/pages/car-export-news.astro` (blog sidebar)

Both are `<form onsubmit="event.preventDefault()">` with no `action`, no
handler, and no `name` on the input. Submitting discards the address silently
and shows no feedback. Needs a real endpoint (hosted form service or the ESP's
own embed — this is a static build, so an API route would need an adapter).

## 7. Duplicate `<h1>` on every vehicle detail page — FIXED 2026-08-28

Was: `src/pages/shipping-cars/[make]/[model]/[vehicleSlug].astro` rendered the
vehicle title twice (mobile title block + desktop price card), and the McLaren
MC20's markdown body opened with its own `#` heading, giving that page three.
The desktop price-card title is now a `p` (identical classes, so it renders the
same); the mobile block keeps the sole `h1`. The MC20 heading was removed —
no other vehicle markdown contains one. Audit after: 0 pages with multiple h1s.

## 8. Smaller SEO and performance items

- 36 titles over 60 characters, 11 descriptions over 160 — will truncate in results.
- 3 duplicate descriptions: four pages fall back to the Layout default
  (`/about`, `/contact`, `/car-shipping/destinations` — since merged into
  `/car-shipping`, +1); `europe` and
  `hong-kong-shipping` share one; the two Hilux listings share one.
- ~307 images with no `width`/`height` (layout shift), ~136 with no `loading`.
- Homepage HTML is ~280 KB, roughly double the next heaviest page.
- `src/components/Footer.astro` lists "UK Cars for Export or Shipping" twice in
  `vehicleExportingLinks` (lines 13 and 19).
- Nav dropdown panels overflow the viewport edge (~580 px wide, extending past
  the right edge). Currently clipped by `html { overflow-x: hidden }`, so menu
  items near the right edge may be cut off rather than visible.

**Not** issues, so nobody re-reports them: the 18 pages with no `h1`/description
are redirect stubs plus the Decap CMS `/admin` page, and the `£TBC` prices on
`/container-sales` are intentional placeholders.

---

## Sailing schedule — open decisions

The pipeline itself is documented in `scripts/schedules/README.md`.

- **`noindex`?** `/uk-car-sailing-schedule` now holds real commercial data
  (493 sailings). If it is an internal working list rather than public
  marketing, it should not be indexed. `src/layouts/Layout.astro` has no
  `noindex` prop yet.
- **Not in the main nav** — reachable only from the footer's bottom row.
- **Duplicate section**: `src/pages/import-uk-cars/kenya.astro` also carries a
  `<SailingSchedule>`, added before the country page was identified as the
  intended home. Harmless but probably wants removing.
- **Coverage gaps**: Middle East is now covered (Aqaba, Jeddah) after adding the
  missing NMT Europe-origin lanes. South America is now well covered (Grimaldi snapshot + WW + NYK). Grimaldi's Europe–South America PDF cannot be decoded — its
  ToUnicode CMaps sit inside compressed object streams.
  **George is asking Grimaldi for an Excel/CSV version (2026-08-22).** Their
  West Africa schedule is already Excel-generated and parses perfectly, so the
  same source almost certainly exists for South America. When it arrives, add a
  parser beside `scripts/schedules/sources/grimaldi.mjs` — no PDF decoding
  needed. Deliberately not solved with extra tooling (Python/pdfplumber), since
  the pipeline must stay dependency-free for the weekly cloud run.
- **Höegh Autoliners — SOLVED 2026-08 (was "no source").** The port-pair search
  really is a dead server action, but it was never the data path: the page's
  client bundle loads a vessel directory from m.hoegh.com and GETs `/api/vessel`
  per vessel, both plain JSON. See `scripts/schedules/sources/hoegh.mjs`, which
  also builds through-routes over both Caribbean feeder hubs — Kingston and
  Pointe-à-Pitre (added 2026-08-26; Guyana, Suriname, Barbados, French Guiana
  etc., flagged in `notes`). Wallenius Wilhelmsen was cross-checked for the same
  pattern and has no comparable hub — its apparent matches are cross-trade
  coincidences, and its South America / Central America services never call the
  UK, so there is nothing to transship.
- **NMT lanes without PDFs**: 5 of their 19 Europe-origin lanes (the short-sea
  Atlantic/Baltic/Black Sea ones, Africa Hoegh-WWL, Africa Sallaum-Niledutch,
  Middle East Hoegh-Bahri) have a page but no PDF export, so they return 404 and
  are skipped. Not a bug our end.
- **Geest quarterly URLs**: `scripts/schedules/sources/geest.mjs` holds a `KNOWN`
  array of current-quarter PDF URLs because the site's schedule page also links
  old archives. Add the Q4 URL when it is published.
- **Cron DST**: the weekly routine runs `0 6 * * 1` UTC = 07:00 BST in summer,
  06:00 GMT in winter. Shift it in October if the earlier hour is unwanted.
- **Unverified**: whether the cloud environment's `gh` can push and open PRs on
  this repo. The first run's log will show it.

---

## Recently fixed (for context)

- Scroll-driven forced reflow — four separate scroll listeners each measuring
  then writing; now batched through `src/scripts/scroll-effects.ts`.
- `overflow-x-hidden` on `<body>` made body a scroll container and silently
  broke every `position: sticky` element site-wide. Removed from
  `src/layouts/Layout.astro` and `src/styles/global.css`; `html` still carries
  it, and that is the value which reaches the viewport.
- Junk schedule rows: UK→UK and UK→continental rotation legs (Southampton →
  Sheerness, Liverpool → Antwerp) and "Panama Canal" as a destination, plus 33
  destinations missing their country. Fixed in the NMT parser and the country
  map.
