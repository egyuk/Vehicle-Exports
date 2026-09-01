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

Building is now cheaper than it was — `src/pages/car-shipping/australia.astro`
is the template and already includes the sailing schedule section, which pulls
its own data from `countryName`. The schedule data covers many of these
countries already (Canada, Ghana, Tanzania, Singapore, South Africa,
New Zealand, Cyprus…), so a new page starts with real content.

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
