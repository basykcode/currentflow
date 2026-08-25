# Handoff: Orient glyphs and add ke cultivation

- Date (UTC): 2026-08-25
- Branch: `feat/mobile-current-flow-glance`
- Worktree: `/Users/benkind/Documents/ChatGPT/Current Flow Mobile Glance`
- Commit at start/end: `c0c0c716bf2f592b42358b37323913a65435c1dd` (changes remain uncommitted)
- Integration status: feature worktree only; not committed, pushed, or merged

## Objective

Apply the second visual review: place each animal above its hexagram, make all four glyphs share
color and proportional geometry, keep Shadow on the bottom when a Gene Key spectrum wraps, center
the Organ Hour artwork, and use the available space for the current 15-minute Chu / Zheng / Ke
interval plus cultivation-oriented English guidance.

## Reconstructed starting state

The worktree already contained the uncommitted mobile-glance, Guidance Output, Temporal Semantic
Resolver, corrected `六十甲子配卦` mapping, 60 zodiac assets, restored glyphs, pinyin, and Gene Key
spectrum changes. Those changes were preserved. The current chat's workspace lease passed
`workspace:doctor` on `feat/mobile-current-flow-glance`, slot 0, with Vite assigned to
`http://127.0.0.1:5173/`.

The starting DOM placed the separate glyph before the animal even though the stem-branch label was
above the hexagram identity. The featured Day card also used a different color, and the glyph's
minimum pixel line thickness made smaller figures proportionally heavier. Organ Hour used two
columns, which offset the illustration and left a large inactive area.

## Implemented

- Swapped each temporal visual stack to stem-branch label, animal, hexagram, and then hexagram
  identity.
- Standardized all glance glyphs on the same moonlit ink color and percentage geometry. Compact is
  the single base width; Day is exactly `1.6 ×` and Hour exactly `1.25 ×`. Removed the minimum pixel
  line thickness so bar weight and spacing scale proportionally.
- Kept Shadow / Gift / Siddhi semantic and single-line order, but changed the flex cross-axis to
  `wrap-reverse`; Shadow is therefore the lowest line on narrow Year and Month cards.
- Extended the pure Organ Clock domain with typed `ChuZhengKeMoment` calculation. It resolves the
  selected timezone's civil minute to one of eight 15-minute Shixian intervals, including Chinese,
  tone-marked pinyin, exact bounds, and English timing meaning.
- Added the explicitly versioned `Current Flow cultivation phase model v1`: Arriving, Gathering,
  Deepening, Cresting, Fullness, Circulating, Integrating, and Releasing. Its status and source are
  separate from the historical clock calculation so it cannot be mistaken for received tradition.
- Rebuilt the glance Organ Hour as one centered column. The organ illustration and live quarter
  occupy the middle; organ name, Chinese name, and two-hour bounds remain the lower anchor.
- Added quarter identity and both provenance boundaries to `Calculated From`, provider factors, and
  provider convention notes.
- Added 10 new domain cases covering all eight Heart-period intervals, midnight wrap, and invalid
  minutes, plus provider and UI regression assertions.
- Added accepted decision
  `20260825T184547Z--orient-temporal-hierarchy-and-formalize-ke-cultivation.md`; updated current
  architecture, layout, source, asset, and integration documentation. `PROJECT_STATE.md` remains
  untouched under feature-branch protocol.

## Research boundary

The National Astronomical Observatory of Japan calendar office documents the two-hour branch
period, `初` beginning, `正` midpoint, and Shixian 96-ke choice. A historical overview republished by
China Daily documents that this convention produces eight 15-minute ke per branch period. No
accepted source was found for assigning a cultivation meaning to each ke, so the eight-step energy
envelope is explicitly Current's product formalization rather than traditional source data.

## Verification

- Focused domain, provider, glyph, and glance suite: 4 files, 55 tests passed.
- Exact repository gate: `npm run check` passed with type-check, full lint, 209 unit tests, workspace
  tests, commentary validation, transition validation, and production build.
- In-app visual pass at the supplied 898 × 616 review size: animal precedes glyph; glyph widths are
  80 px Year/Month, 128 px Day, and 100 px Hour; every glyph uses `rgb(232, 242, 255)`; line heights
  scale to 2.4 px, 3.9 px, and 3.0 px respectively with the same 14% internal gap.
- Responsive visual pass: Shadow is the lowest wrapped term on Year and Month; the Organ illustration
  and Chu / Zheng / Ke block are centered; live current content advanced to `初三刻`, Cresting, at
  11:45–12:00 without a page reload.
- Browser console: no errors. The responsive viewport override was reset and the preview remains
  live at `http://127.0.0.1:5173/`.

## Exact next useful action

Review the live preview. If the new hierarchy and cultivation cadence feel right, include this
handoff, the accepted decision, docs, domain calculation, tests, and the branch's existing
uncommitted work in the next authorized commit or integration task.
