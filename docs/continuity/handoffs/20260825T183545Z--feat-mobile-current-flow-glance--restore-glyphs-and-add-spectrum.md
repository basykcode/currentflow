# Handoff: Restore temporal glyphs and add canonical spectrum

- Date (UTC): 2026-08-25
- Branch: `feat/mobile-current-flow-glance`
- Worktree: `/Users/benkind/Documents/ChatGPT/Current Flow Mobile Glance`
- Commit at start/end: `c0c0c716bf2f592b42358b37323913a65435c1dd` (changes remain uncommitted)
- Integration status: feature worktree only; not committed, pushed, or merged

## Objective

Correct the first zodiac-art presentation after visual review: restore the canonical hexagram
diagrams to their established sizes, place clearly visible animal art in a separate row beneath each
diagram, remove redundant Yin/Yang words from compact stem-branch labels, add tone-marked pinyin,
and show the matching Gene Key Shadow, Gift, and Siddhi vocabulary with its three frequency marks.

## Reconstructed starting state

The worktree already contained the uncommitted mobile-glance, Guidance Output, Temporal Semantic
Resolver, corrected `六十甲子配卦` mapping, and 60 zodiac-asset changes. Those changes were preserved.
The current chat's workspace lease remained valid on `feat/mobile-current-flow-glance`, slot 0, with
Vite assigned to `http://127.0.0.1:5173/`.

The failed visual used an absolutely positioned zodiac watermark and wrapped the percentage-width
`HexagramGlyph` in a shrink-to-fit container. That container had no independent width, so the
canonical diagram collapsed while the animal art remained microscopic.

## Implemented

- Removed the shrink-to-fit glyph wrapper. `HexagramGlyph` is again the direct child of its original
  sizing row.
- Changed `ZodiacIllustration` from an absolute watermark to a normal-flow image in a dedicated row
  immediately after the glyph. Artwork now uses approximately 74% opacity with restrained blue-theme
  treatment.
- Increased glance animal targets to 108 px on Year/Month, 128 px on Day, and 120 px on Hour at the
  supplied 898 × 616 review size. The canonical glyphs measure 80 × 74 px, 128 × 118 px, and
  99 × 91 px respectively at that viewport.
- Kept polarity in the typed `GanZhiZodiac` identity while changing `describeGanZhi` output from, for
  example, `Yang Fire Horse` to `Fire Horse`.
- Strengthened `TemporalHexagram.hexagram` to canonical `HexagramReference`. The demo provider now
  resolves through the canonical registry instead of carrying partial hand-authored hexagrams.
- Added `characters ~ tone-marked pinyin` to each temporal card.
- Added canonical Gene Key Shadow, Gift, and Siddhi terms below the language line. New local SVG
  frequency icons use down triangle, up triangle, and six-point Siddhi geometry based on the official
  Gene Keys profile guide; hidden text labels preserve accessibility.
- Added regression coverage for glyph/art row order, all four asset paths, simplified Ganzhi labels,
  pinyin, all spectrum terms, and all three icon identities.
- Added accepted decision
  `20260825T183341Z--separate-temporal-art-and-show-canonical-spectrum.md`, which supersedes only the
  visual-layering portion of the prior zodiac-art decision. Updated current architecture, glance,
  and asset documentation. `PROJECT_STATE.md` remains untouched under feature-branch protocol.

## Verification

- Focused domain and glance suite: 2 files, 18 tests passed.
- In-app visual pass at the supplied 898 × 616 screenshot size: glyphs visible at their configured
  dimensions; animal art in distinct rows; all four simplified labels, pinyin lines, and spectrum
  lines visible. The responsive override was reset afterward.
- Accessibility DOM pass: all four glyphs retain line-by-line accessible descriptions; all spectra
  expose Shadow, Gift, and Siddhi labels and values; decorative animal images remain ignored by
  assistive technology.
- Exact repository gate: `npm run check` passed with type-check, full lint, 199 unit tests, workspace
  tests, commentary validation, transition validation, and production build.
- Preview remains live at `http://127.0.0.1:5173/` and its in-app browser tab is marked as the
  deliverable.

## Source note

The geometric frequency marks were checked against the official Gene Keys profile guide:
<https://teachings.genekeys.com/how-to-read-your-profile/>. The repository implements its own small
SVG geometry and does not copy the official banner images. Vocabulary continues to come from the
existing canonical curated registry and its per-key source links.

## Exact next useful action

Review the live preview. If the now-visible animal size, 74% opacity, and compact spectrum line feel
right, include this handoff, the correction decision, docs, tests, components, and the branch's
existing uncommitted work in the next authorized commit or integration task.
