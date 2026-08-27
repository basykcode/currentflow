# Refresh Social Preview And Favicons

## Status

- Workstream: permanent Miscellaneous lane
- Branch: `codex/chat-01a02c2ef1c9`
- Worktree: `/Users/benkind/.codex/worktrees/1ebc/Current Flow Main`
- Starting protected-master commit: `7b3f02cc118bce11b96ca1cdaed416f3843a9be8`
- Integration status: complete and committed on the feature branch; not yet published to protected `master`.

## Delivered

- Replaced the stale social metadata URL with a cache-safe `1200×630` PNG on the Lake Yin dark-blue field.
- Composed the landscape card from the existing rights-cleared project artwork: Fire Horse on the left, the approved transparent Current Flow mark in the center, and the canonical Hexagram 28 display pattern on the right.
- Refined the approved final composition against measured rendered-pixel bounds: the left edge, Horse-to-Taiji, Taiji-to-Hexagram, and right edge clearances are each exactly 113 pixels; all three visible subjects share the same bottom boundary at pixel 443.
- Rendered Hexagram 28 in a `246×246` square footprint and expanded the Taiji field to six slightly stronger concentric rings that continue outward behind the two side symbols.
- Added a `600×600` compact social image containing only the Current Flow mark on the same blue field. The landscape card also keeps the mark centered so square center-crops remain brand-safe.
- Added complete Open Graph and Twitter image metadata, explicit dimensions, MIME types, descriptions, alt text, canonical URL, site name, locale, and dark theme color.
- Replaced the linked legacy SVG tab icon with transparent PNG derivatives of the approved Current Flow mark at 16, 32, and 48 pixels.
- Added a branded Apple touch icon, 192- and 512-pixel installable-app icons, and `site.webmanifest` for consistent saved-site and mobile presentation.
- Added focused tests for metadata URLs, PNG signatures and dimensions, favicon selection, manifest color, and maskable icon declarations.

## Source and geometry record

- Current Flow mark: `src/assets/brand/current-flow-logo.png`, preserving the approved circular alpha clip used by the app header.
- Fire Horse: `public/media/zodiac/horse/horse_fire.avif`.
- Hexagram 28: canonical `Dà Guò` definition in `src/domain/astrology/hexagrams.ts`, lower Xùn and upper Duì; displayed top-to-bottom as yin, four yang lines, yin.
- Brand field: dark Lake Yin token `#07162d`, with existing moon-blue family accents.
- No generative image model was used; the assets are a deterministic composition of existing project identity artwork and canonical domain geometry.

## Verification

- `npm run workspace:doctor` passed before tracked changes; branch, lease, and slot-5 isolation were valid.
- Focused metadata tests passed: 3 of 3.
- Isolated in-app-browser QA at `http://127.0.0.1:5178/` confirmed both Open Graph images, the Twitter image, all three favicon sizes, `#07162d` theme color, and the manifest link; browser warnings/errors: none.
- Visual inspection passed for the original-resolution landscape and square images; all required subjects remain clear and the compact image contains only the centered logo.
- The user visually approved the final equal-boundary, shared-baseline, expanded-ring composition before publication.
- Full `npm run check` passed through a local npm-to-pnpm launcher shim because the bundled runtime exposes `pnpm` but no native `npm` binary:
  - toolchain declarations, strict TypeScript, and ESLint passed;
  - Vitest: 52 files and 406 tests passed;
  - workspace tests: 11 passed;
  - gateway tests: 6 passed;
  - commentary validation: 64 generated hexagrams, 379 summaries, 5 explicit unavailable records;
  - transition validation: 64 bundles and 384 summaries;
  - production build: 481 modules transformed and all new public assets copied into `dist`.
- `git diff --check` passed.

## Publication note

The user-facing change requires a protected pull request and merge before Cloudflare can publish it. Social clients may retain an older preview for links already cached, but the new image URL avoids the existing `/og.png` cache for fresh scrapes.
