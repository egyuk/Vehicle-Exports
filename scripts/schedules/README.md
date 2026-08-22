# Sailing schedule pipeline

Refreshes `src/data/sailing-schedules.json`, which drives `/uk-car-sailing-schedule`.

```bash
npm run schedules:update            # fetch, merge, validate, write
npm run schedules:update -- --dry-run   # report what would change, write nothing
npm run schedules:update -- --fresh     # ignore the download cache
```

No dependencies — plain Node, no npm packages and no headless browser. Downloads
are cached for an hour in `scripts/schedules/.cache/` (gitignored).

## Why this is more than "read the PDF"

Five sources, and between them four different PDF generators. A generic text
dump fails on all of them, each for a different reason. `lib/pdf.mjs` handles the
union; the source modules only interpret rows.

| Source | Format | The trap |
|---|---|---|
| NMT | jsPDF, **uncompressed** streams | Text is hex CIDs; needs per-font ToUnicode or you get nothing but the word "Terminates" |
| "K" Line | Excel → PDF, Flate | Vessels are columns; ports are arrival/sailing row pairs around a label |
| Grimaldi | Excel → PDF, Flate | Two blocks in one sheet; only the first calls Tilbury |
| Geest | Print to PDF, Flate | TJ arrays of hex CIDs, flipped y axis, **two sub-columns per port** |
| Autoshippers | HTML | Tables use `rowspan`; the grid must be expanded before reading |
| Wallenius Wilhelmsen | JSON API | Site search is broken server-side; the voyage endpoints work (~320 GETs). Port names embed US state codes ("MANZANILLO, PA" is Panama) - use the API country field |
| Sallaum Lines | HTML tables | Empty cells are **unclosed** `<td>`, so position-based parsing left-packs rows and misattributes dates. Bind via each cell's `headers` attribute instead |
| NYK RoRo | WordPress ajax | vessel -> vesselNums -> vesselSearch -> showDetails chain; rotation HTML has one year header, so the year is carried forward across month wraps |
| Höegh Autoliners | JSON API | `/api/vessel`'s params are swapped: `departureDate` is the *until* bound, `arrivalDate` the *from*. And a vessel's calls interleave two voyages date-wise, so pairing must be scoped to one `voyage_ID` |
| EUKOR | jQuery-era `.do` POST | One POST takes every UK port against every foreign port at once (~330 codes from the page's own `var code/var des` script pairs). Rows with an empty vessel cell continue the sailing above; one port (`Port Klang (Pelabuhan Klang),`) has no country at all |

Two lessons worth keeping:

1. **Never read a sparse table by reading order.** Geest rows omit ports
   entirely, so token order lies. Dates are matched by reconstructed x position.
2. **Use the font's real `/W` glyph widths.** Estimated widths accumulate error
   across a wide row and land dates under the wrong island. `/W` is usually an
   *indirect* object (`/W 9 0 R`), which is easy to miss.

A third, learned the hard way: apply a page `cm` transform **only** if it is at
the very start of the content stream. Content streams also place images with
`cm`, and matching one of those scales every coordinate by a few hundred.

## Data quality rules

- Sources merge in confidence order (NMT → K Line → Grimaldi → Geest →
  Autoshippers); the first to describe a sailing wins. A carrier's own arrival
  date always beats a forwarder's derived one — they disagreed by five days on
  a real Baltimore sailing.
- Carrier is named only where the vessel name makes it unambiguous. A wrong
  carrier is worse than a blank cell.
- Autoshippers ETAs are departure + published transit, and say so in `notes`.
- Only sailings departing a **UK** port are kept. Continental departures exist
  in most of these schedules and are deliberately excluded.

## Validation gates

The run **refuses to write** if any fire. Each exists because it caught a real
fault:

- **Per-source row floor** — the dangerous failure is not a crash, it is a
  source silently returning zero after a layout change and deleting a lane.
- **Weekly cadence (Geest)** — a weekly service must step in whole weeks per
  port. This is what proves the column mapping; a single misassigned column
  shatters it.
- **Arrival after departure**, **transit ≤ 120 days**, required fields present.
- **Stale rows dropped with a warning** — NMT publish the occasional year-old
  rotation with a nonsense leg (one had 334 days).

## When a carrier changes their layout

The source module throws with a message naming what it could not find
(`"K Line: Southampton block not found - layout changed"`). Re-run with
`--dry-run`, then inspect the rows:

```bash
node -e "import('./scripts/schedules/lib/pdf.mjs').then(async({pdfRows})=>{const{fetchCached}=await import('./scripts/schedules/lib/util.mjs');const rows=pdfRows(await fetchCached('<pdf-url>'));rows.slice(0,25).forEach(r=>console.log(r.cells.map(c=>c.text+'@'+Math.round(c.x)).join(' | ')));})"
```

Known dead ends, so nobody re-treads them: NMT's HTML schedule renders
client-side and returns nothing; its per-lane API endpoints are not public (only
`/api/schedules/services`, the lane directory). Grimaldi's Europe–South America
PDF has its ToUnicode maps inside compressed object streams and cannot currently
be decoded. Höegh's port-pair *search* posts a server action that returns nothing
outside a real browser session - but that search was never the data path: the
page's client bundle loads a vessel directory from m.hoegh.com and then GETs
`/api/vessel` per vessel, both plain JSON (see `sources/hoegh.mjs`).

## Gaps

- Middle East coverage is thin: NMT's lanes plus whatever Höegh voyage
  happens to load in the UK before Oman/India (most run from Antwerp only).
- Grimaldi publish only West Africa for UK departures; their South America
  schedule is undecodable (above).
- Geest Q2/Q4 archives parse fine but contribute nothing once past.
