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
- `src/pages/countries-we-ship-to.astro` (hub page, ~line 24 onward)

Missing: Bangladesh, Barbados, Botswana, Canada, Cayman Islands, Cyprus, Ghana,
Great Britain, Hong Kong, Indonesia, Malaysia, Namibia, New Zealand, Singapore,
South Africa, Sri Lanka, Tanzania, Thailand, Trinidad & Tobago, Uganda.

Only these country routes actually build: `africa`, `australia`,
`car-export-to-asia`, `caribbean`, `europe`, `hong-kong-shipping`, `kenya`,
`middle-east`. Note the six region pages are **not** in the nav at all.

Two ways out: build the pages, or trim the nav to what exists.

Building is now cheaper than it was — `src/pages/countries-we-ship-to/australia.astro`
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

## 4. 98 MB unreferenced video ships in every deploy

`public/assets/images/section/video.mp4` is 98.45 MB and is referenced nowhere
in the source or built HTML. The next largest asset is 1.14 MB. Deleting it
would cut deploy size by roughly 95%.

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

## 7. Duplicate `<h1>` on every vehicle detail page

`src/pages/carsforexport/[make]/[model]/[vehicleSlug].astro` renders the vehicle
title twice — line ~122 (mobile title block) and line ~191 (desktop price card).
Both ship in the DOM. Make one an `h1` and the other a `div`/`p`. Affects 16 pages.

## 8. Smaller SEO and performance items

- 36 titles over 60 characters, 11 descriptions over 160 — will truncate in results.
- 3 duplicate descriptions: four pages fall back to the Layout default
  (`/about`, `/contact`, `/countries-we-ship-to`, +1); `europe` and
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

- **`noindex`?** `/export-sailing-schedule` now holds real commercial data
  (493 sailings). If it is an internal working list rather than public
  marketing, it should not be indexed. `src/layouts/Layout.astro` has no
  `noindex` prop yet.
- **Not in the main nav** — reachable only from the footer's bottom row.
- **Duplicate section**: `src/pages/import-uk-cars/kenya.astro` also carries a
  `<SailingSchedule>`, added before the country page was identified as the
  intended home. Harmless but probably wants removing.
- **Coverage gaps**: no Middle East lane from any source; South America is thin
  (14 rows). Grimaldi's Europe–South America PDF cannot be decoded — its
  ToUnicode CMaps sit inside compressed object streams. Asking Grimaldi for an
  Excel version is the realistic fix.
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
