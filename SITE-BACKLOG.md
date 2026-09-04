# Site backlog

Open issues from a full-site audit, in priority order. The original counts came
from the built `dist/` output on 2026-08-22 (148 pages). Anything re-measured
since carries its own date; the site is now 227 pages.

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
3. Rebuild and confirm `dist/robots.txt` reads `Allow: /` with the sitemap line.

Re-run the audit any time against a fresh `npx astro build` — the checks are
broken links, missing/duplicate SEO fields, `h1` counts, image alt/sizing,
placeholder links and asset weight.

### carexporters.co.uk — an open question, not a checklist item

Recorded 2026-09-04, deliberately **not** added to the checklist above, because
the equivalent item for the other domain was removed on request and this is
George's call rather than a technical one.

carexporters.co.uk is ours — NMT addresses its weekly schedule alerts to
sales@carexporters.co.uk. It had been filed under competitors in
`research/competitor-links.txt`, which is now corrected. That file holds its
full 75-page URL inventory, and two things follow from it.

**A redirect map already exists in all but name.** Of the 47 country URLs on
the old site, 36 have a page on the new one:

- 30 map exactly: `/shipping/car-shipping-to-<country>.html` ->
  `/car-shipping/<country>`
- 6 need an alias: `antigua-and-barbuda` -> `antigua`, `hong-kong` ->
  `hong-kong-shipping`, `saint-kitts-and-nevis` -> `st-kitts`, `saint-lucia` ->
  `st-lucia`, `saint-vincent-and-the-grenadines` -> `st-vincent`, `malta` ->
  `europe/malta`

**The 11 destinations the old site covered and this one did not — BUILT
2026-09-04.** Bermuda, Brunei, Eswatini, Fiji, Macau, Malawi, Maldives,
Pakistan, Seychelles, St Helena and Zambia now have pages, so the redirect map
covers 47 of 47 country URLs.

None of the eleven takes a direct UK sailing, so each resolves through a
`hubPorts` entry and every derived fact — transit band, UK load ports, carriers,
indicative rate — comes from the hub at build time rather than being written in:

| Page | Reached through | Transit | From |
| --- | --- | --- | --- |
| Bermuda | Baltimore / New York | 1-8 wks | £795 |
| Brunei | Singapore | 3-10 wks | £1,381 |
| Eswatini | Durban | 2-6 wks | £2,596 |
| Fiji | Auckland | 2-12 wks | £851 |
| Macau | Hong Kong | 5-9 wks | £1,179 |
| Malawi | Beira / Dar es Salaam | 2-11 wks | £1,214 |
| Maldives | Colombo | 3-9 wks | £1,921 |
| Pakistan | Colombo | 3-9 wks | £1,246 |
| Seychelles | Port Louis / Mombasa | 2-11 wks | £1,214 |
| St Helena | Cape Town | 2-6 wks | £1,130 |
| Zambia | Dar es Salaam / Durban | 2-11 wks | £7,119 |

**Kept out of the Countries mega menu on purpose.** The menu renders on every
page of the site and its country list is already the largest single block of
internal links here; eleven more entries would have added roughly 5,000 internal
links across the site for eleven long-tail destinations. They are in
`moreDestinations` instead, which renders once on `/car-shipping` under "More
Destinations". The menu stayed at 85 countries and no page outside
`/car-shipping` gained a link. Promote one into `continentNames` if it starts
earning real enquiries.

Two bugs surfaced while building these, both fixed in the same change:

- `approximateRatesFor()` priced off the cheapest port in the hub **country**
  rather than the hub **port**. St Helena said "via Cape Town" while quoting
  Durban's £988. It now prefers the named hub port, which also corrected
  Botswana, Uganda and Zimbabwe.
- The rate table had Tanzania's RoRo port as **"Der Es Salaam"** while the
  container row two hundred lines later said "Dar". Only the container spelling
  matched anything, so the RoRo rate was unreachable.

⚠ **Zambia's £7,119 for a 20ft looks wrong.** It is the highest 20ft rate in
the whole table — Zimbabwe, a comparable inland run from Durban, is £3,676. Its
40ft is only 24% above its 20ft, where every other landlocked entry sits 50-96%
above (Botswana +60%, Zimbabwe +96%, Eswatini +50%). That pattern makes the 20ft
the outlier, not the 40ft; following it would put the 20ft nearer £5,500. Same
class of thing as the Equatorial Guinea £12,523, which was a typo. **Not**
changed — a price is George's to correct, and it is live on the new page.

⚠ **Eswatini is at `/car-shipping/eswatini`,** the current name. The old URL is
`car-shipping-to-swaziland.html`, so the redirect map needs that alias, and the
rate card still files it under Swaziland (handled by a `rateTableAliases` entry).

Left live and unredirected at launch, the old site competes with the new one for
the same terms: same business, same destinations, same services.

---

## 1. Country pages — BUILT 2026-09-03

**All 86 menu countries now have a page.** The 81 that were missing were
generated from `_country-template.astro` and `countryPages` in
`src/data/destinations.ts` now points every menu entry at its own page instead
of the pre-filtered sailing schedule. Site went 148 -> 229 pages.

Each page is built from data the site already held, so they are not
near-duplicates: 64 have live sailings (real ports, UK load ports, carriers and
a transit range), 62 show a price from the published rate table, and every one
has its own market paragraph. Audited across all 81: one `h1` each, zero broken
anchors, zero duplicate titles or descriptions, all titles under 60 characters
and descriptions under 160.

Landlocked countries resolve through `hubPorts`: Uganda now prices and shows
sailings off **both** Mombasa and Dar es Salaam (George's call), Botswana off
Walvis Bay and Durban, Zimbabwe off Durban and Beira. Their pages say plainly
that the rate covers the sea leg and the overland leg is arranged separately.

⚠ **The one thing that still needs a decision — right-hand drive.** While
profiling the markets, the research found that **31 of the 81 countries
restrict or ban right-hand-drive imports outright**, meaning a UK car cannot be
registered there at all:

> Angola, Cameroon, Côte d'Ivoire, Equatorial Guinea, Gambia, Ghana, Guinea,
> Mauritania, Morocco, Nigeria, Sierra Leone, Madagascar, China, South Korea,
> Taiwan, Dominican Republic, Puerto Rico, Jordan, Oman, Saudi Arabia, Turkey,
> Mexico, New Caledonia, Argentina, Brazil, Chile, Colombia, Ecuador, Panama,
> Peru, Uruguay

Driving side as a general fact is deliberately NOT shown anywhere (George's
call: export buyers already know which side their market drives on). But these
31 are import BANS, not preferences, so on George's instruction each of those
pages now carries a **left-hand-drive sourcing callout** in its `#about`
section, marked `data-lhd-note`:

- It states in the first sentence that the country registers left-hand-drive
  only and a UK-registered car cannot go on the road there. No hedging: a
  customer must not ship a car that cannot be registered.
- It then turns that into a sourcing lead, because we buy as well as ship, and
  ends with a link to /contact. A Nigeria or Brazil enquiry becomes a
  left-hand-drive sourcing job instead of a wasted freight bill.
- All 31 are individually written, not templated, and cite that country's own
  verified detail (Ghana the 1 October 2026 Tema enforcement, Oman the Royal
  Oman Police decision, Turkey the Highway Traffic Regulation article). A
  reviewer pass caught and fixed a Morocco/Angola near-duplicate and two
  passages that hedged a legal prohibition into "we cannot promise".

If the copy is ever regenerated, keep those two properties: no hedging on the
ban, and no boilerplate across the 31.

### Original issue, for context

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

### Schedule data: unattributed rows — RE-MEASURED 2026-09-04

Found while generating the country pages (2026-09-03). Two of the three
original findings no longer hold; the counts below are from the 2026-09-04
build.

- **Blank carriers: 79 of 2,759 before the back-fill below, 23 of 2,732
  after** (refreshed 2026-09-04). They come from the aggregator sources
  (`nmt.mjs`, `autoshippers.mjs`) and clustered on Europe→North America and
  Europe→Far East. The generator filters blank carriers and falls back to a
  "Shipping Options: RoRo & container" fact, so nothing renders empty.
- **No country now depends entirely on unattributed sailings.** Jordan and
  Sweden, the two named originally, both have named carriers again.
- ✔ **"No container line in the data at all" is fixed** (`35d9e46`). MSC is
  now the single largest source in the file, and every row carries a
  `service`. The 18 carriers are no longer all vehicle carriers and ferry
  lines.
- **Not a bug, for the record:** `/uk-car-sailing-schedule/data.json` emits
  destinations as `Country, Port`, the reverse of `sailing-schedules.json`.
  That is deliberate and documented at `data.json.ts:11` — `flipDest()` builds
  the option values for the page's destination `<select>`. Audit that endpoint
  as if the last comma-segment were the country and you will invent problems
  that are not there. The country pages read the source file, in `Port,
  Country` order, which is what `scheduleCountry` matches.
- **Blank carriers back-filled from the file itself — DONE 2026-09-04.** The
  near-duplicate back-fill in the merge only fires when two sources describe
  the same sailing, so it could not see the commonest case: a ship attributed
  on one leg and blank on the next. `Morning Champion` voyage `EP622` is
  `EUKOR` into Huangpu and blank into Wallhamn — different destinations, so
  the rows never collide. `update.mjs` now runs a second pass before the
  service downgrade, in confidence order. Verified against a live `--dry-run`:

  | Rule | Rows |
  | --- | --- |
  | Exact `vessel` + `voyage` already carrying a carrier | 22 |
  | `vessel` that only ever appears under one carrier | 34 |
  | Left blank, and downgraded to `unknown` as before | 28 (23 survive validation) |

  A key is only usable if every attributed row under it agrees on the carrier,
  so a vessel that changed operator mid-file resolves to nothing rather than to
  a guess. The pass sets `service` wherever it sets `carrier`, because the
  blank rows arrive from the RoRo aggregators still carrying their source's
  `roro` and attributing them would leave that unchecked claim standing —
  ACL is ConRo and MSC is container. Where the vessel runs as both (ACL's
  Atlantic class is `roro` and `conro`) the carrier is filled and the service
  set to `unknown`: 13 rows.

### Service type — DONE 2026-09-03

Every row now carries `service`: `roro`, `container`, `conro` or `unknown`.
Sources declare it and the pipeline throws if one omits it; unattributed rows
are downgraded to `unknown` after the merge. Anything not plain RoRo is badged
on the country pages and the full schedule. See `scripts/schedules/README.md`.

Current split of the 2,732 rows (refreshed 2026-09-04): **1,415 roro,
1,252 container, 29 conro, 36 unknown**. The 36 unknown are the 23 rows still
lacking a carrier plus the 13 ACL rows whose vessel runs as both RoRo and ConRo.

**ACL is now `conro`**, which is the first real container coverage in the data.
Their Liverpool to North America service runs G4 ConRo ships that carry
containers and rolling cargo on the same sailing, so a customer can book either
way on one departure. It shows on the USA and Canada pages as a "RoRo or
container" badge, styled as a benefit rather than a warning, because it is a
genuine choice to offer. This came free: the source was already wired in and
only needed to declare what it actually is.

### CMA CGM as a container source — INVESTIGATED, NOT VIABLE 2026-09-03

> **Superseded 2026-09-04:** container coverage was solved without CMA CGM.
> Alternative 3 below paid off — MSC and Ellerman City Liners were added in
> `35d9e46` and now supply 1,248 container sailings between them. Everything
> below stands as the record of why CMA CGM itself is not worth retrying.

George asked for this to be built. It cannot be, within this pipeline's
constraints, and a module written anyway would **throw on its first unattended
run and block the weekly write**. So it was deliberately not written.

Three researchers reached the same answer by different routes, and the verdict
agent then re-ran the probes itself from plain Node rather than trusting them:

| Request | Result |
| --- | --- |
| `GET /ebusiness/schedules` | **403**, DataDome interstitial |
| `POST /ebusiness/schedules/routing-finder` (exact captured payload, full Chrome headers) | **403** |
| `GET .../routing-finder/export?...&fileType=CSV` | **403** |

The decisive test: a **freshly solved DataDome cookie lifted from a live browser
and replayed from Node within seconds, with a complete Chrome header set, still
403s.** That puts the check on the TLS/JA3 and HTTP/2 handshake, below anything
Node's fetch can change. It is not a "try harder with headers" problem. Beating
it needs curl-impersonate, cycletls or a headless browser, all excluded here.
DataDome's own botname on the block is "suspicious signatures from badly
reputed IPs", and a cloud runner is exactly that IP class, so the weekly run
would be scored *harder* than a desk machine.

Two things would sink it even if the block vanished: there is no JSON schedule
API (the routing finder is a server-rendered ASP.NET form POST returning ~1.2 MB
of HTML), and CMA CGM's official Point-to-Point Schedules API needs portal
registration, an issued key and a signed contract, so it fails the
unauthenticated constraint.

No parser sketch was written on purpose: nobody ever retrieved a schedule
payload outside a browser, so any "spec" would be fiction, and a plausible
looking one is worse than none because someone might ship it.

**Ranked alternatives, if container coverage is still wanted:**

1. **Ask CMA CGM for API portal access.** An exporter shipping this volume will
   have an account manager. Their P2P Schedules API returns exactly the fields
   this contract needs. Costs a key in the runner's environment; the pipeline
   stays a plain fetch. Only reliable route to CMA CGM data.
2. **Widen the existing ACL source.** `sources/acl.mjs` is already wired in and
   ACL is ConRo, carrying containers as well as RoRo on the North Atlantic.
   Cheapest real container coverage, no new auth.
3. **Maersk.** `https://api.maersk.com/schedules/point-to-point` answers plain
   Node with a clean JSON 401 and has a documented free developer tier, so it is
   the most promising cheap credentialed option. MSC, ZIM and Ellerman return 200 HTML
   to plain fetch with no bot challenge; Ellerman is UK-focused and worth a look
   for UK-departure lanes. **All are research leads, not findings** — nobody
   verified any of them returns parseable sailing rows.
4. **EDIFACT IFTSAI feed.** Right shape and more stable than any internal API,
   but SFTP/AS2 push under an EDI agreement. Only worth it if EDI already runs.
5. **Aggregators: don't.** GoComet gates behind signup, SeaRates 403s behind
   Cloudflare, Fluent Cargo is a marketing page.

**Worth keeping whichever carrier is chosen:** UK to Aqaba is a **transhipment
routing via the Mediterranean**, not a direct call. A scraper keyed on a single
direct vessel would legitimately return zero rows for Jordan, which is probably
why the lane is thin today.

**Do not use** `cma-cgm.com/api/PortsWithInlands/GetAllPlaces`. It does answer
plain Node, but their robots.txt disallows `/api/*`, and the pipeline has no
need for UN/LOCODEs anyway.

### Open items from this work

- **Country-page prices — RESOLVED 2026-09-03.** George confirmed the
  £1,250 / £1,395 / £1,950 / £3,575 set was a **placeholder**, not a real rate,
  and that the published table should drive every country. Those figures were
  removed from `shipping-prices.ts`; Australia and Kenya now read the table
  (Australia £771 RoRo / £1,143 / £1,979, Kenya £899 / £1,403 / £1,929) and
  keep only their transit copy. Ireland is not in the table and keeps its
  £250-£700 range. Titles, meta descriptions, hero chips, FAQs and the costs
  table on each page all read the one source now, so they cannot drift.

- **The same placeholders in `src/data/shippingServices.ts` — FIXED 2026-09-04
  (`dac1969`).** That file feeds `/shipping/<service>`, `/shipping`,
  `/car-shipping` and the Header mega menu, so its figures appeared on every
  page of the site. The hardcoded £1,250 / £1,395 / £1,950 / £3,575 are gone:
  the three "from" prices are computed from the rate table's minima, so a
  repricing moves them and they cannot drift from the rate card again.

  `f3320e2` then raised every published rate by 35%, so the minima quoted in
  the original version of this entry (£437 / £623 / £1,029) are themselves out
  of date. As of 2026-09-04:

  | Service | From | Cheapest lane |
  | --- | --- | --- |
  | RoRo | £590 | Hong Kong |
  | 20ft container | £841 | Laem Chabang, Thailand |
  | 40ft container | £1,389 | Hong Kong |

- **Data quality in the rate table — FIXED 2026-09-04.** Equatorial Guinea
  (Malabo and Bata) was listed at £12,523 for a 20ft container against £1,679
  for a 40ft, about ten times every other 20ft rate. Both ports now read
  £1,690 / £2,267.

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
- **Ireland transit claims — FIXED 2026-09-04 (`a525eba`).** The page had
  "3-7 days" in its facts bar and "Typically 7-14 days" on its container card,
  neither supported by the data. Both are now derived at build time from the
  133 Ireland sailings: RoRo is stated as the same-day crossing it is, and
  container as same-day on the direct Dublin feeder or 6-16 days on a liner
  calling Ireland mid-loop, out of Felixstowe and Liverpool rather than the
  ferry ports.
- **Ireland "Cork" removed.** The page claimed delivery to Dublin, Rosslare and
  Cork; neither `destinations.ts` nor the schedule has Cork. Now Dublin and
  Rosslare throughout. If we do deliver to Cork, the data files need it, not
  just the prose.

## 2. Canonical domain — FIXED 2026-08-22

Was declaring the wrong domain in `astro.config.mjs`, with `robots.txt` naming
yet another one (`autodeal-lyart.vercel.app`). Now `vehicleexports.co.uk`
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

## 5. 235 placeholder `#` links across 230 pages

**Down from 913 on 2026-09-04**, when the three footer legal links were given
real pages (see below). Those were 3 x every page, so they were most of the
count. What is left:

- `src/components/Footer.astro` — the TikTok icon (1 x every page = almost all
  of what remains; the account either exists and should be linked, or does not
  and the icon should go)
- `src/components/CTASection.astro` — two app-store buttons
- `src/components/CompareCars.astro` — one

### Legal pages — DONE 2026-09-04

The site had no working legal pages linked anywhere. It now has three, wired
into the footer bottom row and sharing `src/components/LegalPage.astro`:
`/privacy-notice`, `/terms-and-conditions`, `/cookie-policy`.

They are drafted against the source material rather than assembled from a
generator, and they describe **what this business and this site actually do**:

- Company details are from the Companies House record for 10399100, not from
  the marketing copy. ⚠ Note the registered office is **Penstraze Business
  Park**, while `Footer.astro` says "Penstraze Business Centre". One of them is
  wrong and the footer is the more likely candidate.
- The privacy notice follows the UK GDPR Article 13 checklist, and its
  international-transfer section is written around the real case: shipping a
  car to Kenya means sending the consignee's details to a country with no UK
  adequacy decision.
- The terms restate the site's own commitments rather than boilerplate — the
  included/excluded lists mirror `CountryCosts.astro`, and the "we stop at the
  UK quayside" scope rule from § 1 is section 5.
- The cookie policy was written from an audit of the built output, not assumed.

**Two things to settle before launch:**

1. ⚠ **The Google Maps embed on `/contact` sets cookies as the page loads,
   with no consent.** Under PECR reg. 6 a map is not "strictly necessary", so
   it needs prior consent. Either add a consent banner or make the map
   click-to-load; click-to-load is simpler and removes the problem rather than
   managing it. It is the only cookie-setting element on the whole site — there
   is no analytics, no advertising and no first-party cookie — so fixing it
   would let the cookie policy say "none" without qualification.
2. **These are drafts, not advice.** They are accurate to what the site does
   and follow ICO guidance, but no solicitor has seen them. The VAT, customs
   and liability wording in the terms in particular should be checked by
   someone who knows the business's insurance and carrier contracts.

Also add the ICO data protection register entry number to the privacy notice
once confirmed — there is a TODO on it in `LegalPage.astro`.

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

- **Title and description lengths — FIXED 2026-09-04.** Was 36 titles over 60
  characters and 11 descriptions over 160 at the August audit; the country-page
  work had already brought that down to 16 and 9. Both are now **zero**, across all 227 pages.
  Static page titles were shortened, the blog suffix went from
  `- UK Vehicle Exporters Export News` (35 characters) to `| UK Vehicle
  Exporters` (23), and the `blog` and `vehicles` collections gained optional
  `seoTitle` / `seoDescription` so a post keeps its editorial headline and
  standfirst on the page while the meta tags stay inside the limits. Model
  pages drop " for Export" only when the full title would overrun, so the model
  name always survives. Re-run the audit against `dist/` to confirm.
- **Duplicate descriptions — FIXED 2026-09-04.** `/about`, `/contact` and the
  homepage were all falling back to the Layout default; each now has its own,
  and nothing uses the default. `hong-kong-shipping` was copy-pasted from
  `europe` and was advertising "European destinations" — it now describes Hong
  Kong. `car-export-to-asia` was separately carrying 259 characters of unrelated
  car-sourcing blurb as its description, and has been rewritten.
  The third pair was a duplicate *page*, not a duplicate description:
  `2021-toyota-hilux-2.md` was the same truck as `2021-toyota-hilux.md` — same
  year, price, mileage, colour and body copy, a CMS re-save with a worse title
  ("Toyota Hilux 2") and no `slug`. George confirmed one truck, so it was
  deleted. Nothing linked to it; it was also the only vehicle whose `model` was
  plain "Hilux", so the empty `/shipping-cars/toyota/hilux/` model page went
  with it. Site is 227 pages.
- 292 of 2,188 images have no `width`/`height` (layout shift), 132 no
  `loading`. Alt text is fully covered — 0 missing. Re-counted 2026-09-04.
- Homepage HTML is 316 KB, well clear of the next heaviest
  (`/car-shipping/shipping-rates`, 194 KB).
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
  (2,732 sailings as of 2026-09-04). If it is an internal working list rather
  than public
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
