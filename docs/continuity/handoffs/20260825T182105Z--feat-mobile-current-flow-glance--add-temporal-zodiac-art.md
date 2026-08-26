# Handoff: Add temporal zodiac art and equalize glance rows

- Date (UTC): 2026-08-25
- Branch: `feat/mobile-current-flow-glance`
- Worktree: `/Users/benkind/Documents/ChatGPT/Current Flow Mobile Glance`
- Commit at start/end: `c0c0c716bf2f592b42358b37323913a65435c1dd` (changes remain uncommitted)
- Integration status: feature worktree only; not committed, pushed, or merged

## Objective

Display the supplied animal-element image corresponding to every Temporal Hexagram's stem-branch
combination, keep it visually subordinate to the canonical glyph, and reduce the wasted height in
the Year / Day / Month row by making both glance rows the same compact height.

## Reconstructed starting state

The worktree already contained uncommitted mobile-glance, Guidance Output, Temporal Semantic
Resolver, and corrected `六十甲子配卦` mapping work. Those changes were preserved. The current chat's
workspace lease was valid on `feat/mobile-current-flow-glance`, slot 0, with Vite assigned to
`http://127.0.0.1:5173/`.

The supplied package contained exactly 60 transparent 1254 × 1254 PNG files: five elements for each
of twelve zodiac animals. Its total size was approximately 146 MB. Its 未 directory is named
`sheep`, while the existing product vocabulary describes 未 as Goat.

## Implemented

- Refactored `ganZhi.ts` to expose the pure, typed `resolveGanZhiZodiac` identity helper while
  preserving the exact existing `describeGanZhi` output.
- Added `ZodiacIllustration.vue`, the presentation-only filename adapter. It maps the Goat domain key
  to the supplied `sheep` directory and selects all other animal and element paths directly.
- Added 60 transparent 384 × 384 AVIF derivatives under `public/media/zodiac`. The originals remain
  unchanged outside the repository. The published set is approximately 4.3 MB.
- Layered the decorative art beneath each canonical SVG hexagram glyph with restrained opacity and
  saturation. It is noninteractive and hidden from assistive technology because the visible Ganzhi
  text already names its polarity, element, and animal.
- Added raw Ganzhi to the explicit demo fixtures so demo Temporal Hexagrams exercise the same image
  boundary without making calculation claims.
- Changed the glance to two equal-height tracks. Mobile no longer stretches the instrument panel to
  fill the remaining viewport; desktop uses matching 14-rem minimum row heights.
- Added coverage proving the 60 canonical Jiazi resolve to 60 distinct animal-element pairs and
  that a real four-pillar fixture renders the exact expected asset paths.
- Added asset documentation and accepted decision
  `20260825T181930Z--layer-zodiac-art-beneath-temporal-hexagrams.md`; updated the glance and
  architecture documentation. `PROJECT_STATE.md` remains untouched under feature-branch protocol.

## Verification

- Workspace isolation via `node scripts/codex/workspace.mjs doctor`: passed on the current branch,
  session, and slot.
- Asset audit: 60 AVIF files; all 384 × 384 with alpha; zero invalid files.
- Live asset request: `horse_fire.avif` returned HTTP 200 with `Content-Type: image/avif` from the
  isolated Vite server.
- Focused Vitest run for the hexagram domain and glance UI: 2 files, 18 tests passed.
- Exact repository gate: `npm run check` passed with type-check, full lint, full unit suite,
  workspace tests, commentary validation, transition validation, and production build.
- Prettier check across every task text file: passed.
- `git diff --check`: passed.

The first full gate attempt used the ChatGPT app's signed Node binary and macOS rejected Rollup's
native module because their signing team identities differed. Reordering `PATH` so the cache runtime
Node executes the app-bundled npm CLI resolved the runtime mismatch; the exact full gate then passed
without reinstalling packages or changing package policy.

Automated in-app-browser reload remained blocked by its loopback URL policy. The existing preview
stayed live through Vite HMR, the server emitted no compile error, and both page and AVIF requests
were verified directly. A human visual pass in the already-open preview is still useful for opacity
preference.

## Exact next useful action

Review the four live animal layers and equal row heights at `http://127.0.0.1:5173/`. If the opacity
feels right, include this handoff, the decision, docs, assets, and code with the branch's existing
uncommitted feature work in the next authorized commit/integration task.
