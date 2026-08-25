# Handoff: Build the first-viewport Current Flow instrument panel

- UTC timestamp: 2026-08-22T21:48:48Z
- Branch/worktree: `feat/mobile-current-flow-glance` at
  `/Users/benkind/Documents/ChatGPT/Current Flow Mobile Glance`
- Starting commit: `b5426ca3e46a4af56237fc350b14cdb7bd9c02c6`
- Task/objective: Redesign the Astrology/Home top so the complete essential Current Flow reading fits
  in the first default mobile viewport while preserving calculations, inspector interactions,
  provenance, accessibility, and desktop behavior.
- Status: complete, committed on the feature branch, unmerged and unpushed

## Starting context

`master` already contained the Lake Yin palette, exact temporal bounds, the four-second Yin clock,
twelve organ SVGs, and the shared Hexagram Inspector. The route directly rendered an oversized
header, `FiveElementComposition`, and a distant OLTR inside `SynthesisPanel`. Mobile reordered Day
above Year/Month and placed technical bounds/source reports inside every card, so the complete
reading could not fit in the first phone viewport.

The original component tree was:

```text
App → AppHeader + AstrologyView
AstrologyView → route header/YinClock + FiveElementComposition + SynthesisPanel
FiveElementComposition → HexagramCard × 4 + OrganCard
App → one shared HexagramInspector
```

## Work completed

- Added `CurrentFlowGlance` as a focused presentation-only first-viewport composition.
- Replaced the duplicate oversized route title with a centered configurable section heading.
- Compacted `YinClock` to primary hours/minutes, subordinate seconds, and one date/timezone line,
  while preserving its four-second sampling and dissolve behavior.
- Added typed `glance-compact`, `glance-featured`, and `glance-regular` densities to the existing
  `HexagramCard`; Day receives the featured density and largest glyph.
- Reworked `FiveElementComposition` to the locked Year / Day / Month 1:2:1 row and Organ / Hour 1:1
  row at every viewport.
- Added the `glance` density to `OrganCard`, reusing the existing local SVG illustration.
- Added `CurrentFlowOltr` as the slim final element of the first viewport, with no clamp or ellipsis.
- Added `CalculationProvenanceDetails` immediately below the glance. It retains all pillar labels,
  Ganzhi, exact bounds, calculation status, source/library/mapping labels, organ source, provider
  version, factors, conventions, and limits. Organ Hour opens and focuses this disclosure.
- Kept the existing `CurrentFlowSnapshot`, provider, temporal calculations, organ calculation,
  synthesis fields, glyph component, inspector store, and single app-level modal unchanged.
- Added safe-area-aware header/glance variables, `100dvh`, compact-height styling, intrinsic row
  growth for large text, and a development-only 150% text-scale fixture.
- Added component tests for canonical data routing, DOM order, density, hidden technical metadata,
  inspector/organ activation, configurable section label, long title/timezone/OLTR content, OLTR
  lengths, provenance preservation, and compact clock behavior.
- Added the layout document, architecture note, accepted responsive-UX decision, and concise AGENTS
  rules. `PROJECT_STATE.md` was not edited from the feature branch.

## Components reused

- `CurrentFlowSnapshot` / `CurrentFlowProvider`
- `HexagramCard`, `HexagramGlyph`, `OrganCard`, and `OrganIllustration`
- `FiveElementComposition`, `YinClock`, and `SynthesisPanel`
- `useHexagramInspectorStore` and the app-level `HexagramInspector`
- `AppHeader`, shared tokens, theme, focus, and reduced-motion rules

## Components created

- `CurrentFlowGlance.vue`
- `CurrentFlowOltr.vue`
- `CalculationProvenanceDetails.vue`
- `CurrentFlowGlance.spec.ts`

## Decisions made

- Kept compact rendering as density variants of existing cards rather than creating a second
  temporal-card data or interaction path.
- Used an adjacent native `details` disclosure for complete provenance because the shared inspector
  opens a canonical hexagram, not a temporal-scope calculation record.
- Used `min-height` plus min-content grid growth instead of fixed/clipped viewport geometry, allowing
  large text and unusually long OLTRs to create normal document scrolling.
- Retained 64 CSS pixels for the mobile header because it already met the 44-by-44 target requirement
  and fell within the requested compact range.

## Verification commands and results

- `npm run workspace:doctor` — passed; isolated branch, lease, and runtime slot 0.
- `npm run check` under Node.js 22.18.0 — passed after the final implementation:
  - strict Vue/TypeScript type checking;
  - zero-warning ESLint;
  - 28 test files / 131 tests;
  - 9 workspace isolation tests;
  - commentary validation: 64 generated, 379 summaries, 5 explicit unavailable, 0 revisions;
  - transition validation: 64 bundles / 384 summaries;
  - 366-module production Vite build.
- `git diff --check` — passed.
- No dependency was added.
- No file under `src/domain` or `src/providers` was modified.

## Browser and responsive verification

At default text size, each required mobile viewport had no horizontal overflow, no clipped card
content, an OLTR fully inside the initial viewport, a Day/Year width ratio of approximately 2, and
equal Organ/Hour widths:

| Viewport  | OLTR visible | Horizontal overflow | Card clipping | Temporal ratio | Bottom split |
| --------- | ------------ | ------------------- | ------------- | -------------- | ------------ |
| 375 × 667 | yes          | none                | none          | exactly 2:1:1  | equal        |
| 390 × 844 | yes          | none                | none          | 2:1:1          | equal        |
| 393 × 852 | yes          | none                | none          | 2:1:1          | equal        |
| 430 × 932 | yes          | none                | none          | 2:1:1          | equal        |

- Tablet 768 × 1024: no overflow or clipping; same hierarchy and ratios; OLTR visible.
- Desktop 1280 × 800: no overflow or clipping; Day remains central/featured; OLTR follows below the
  viewport as permitted for desktop.
- Dark and light themes: visually inspected; both retained Lake Yin contrast and hierarchy.
- Long content: `Preponderance of the Great`, `America/Argentina/Buenos_Aires`, and a representative
  long OLTR remained complete and contained.
- Large text: development `?text-scale=large` fixture produced a 24px root (150%) at 375 × 667; the
  document scrolled naturally with no horizontal overflow, card clipping, or row overlap.
- Interaction: mouse Day activation and keyboard Year activation opened the existing exact
  hexagram; closing restored a visible 3px focus ring to the source card.
- Organ Hour keyboard activation opened the provenance disclosure and focused its summary.
- Header: mobile navigation still opened; its menu target measured 44.8 × 44.8 CSS pixels.
- Clock: a four-second update left clock width, horizontal position, and grid top unchanged.
- Browser console: no warnings or errors.

## Failed or rejected approaches worth remembering

- The in-app browser did not expose a reliable browser-zoom shortcut. A development-only root
  text-scale fixture was added instead so the required large-text behavior could be truthfully
  inspected without a production setting or new dependency.
- Fixed zero-minimum fractional rows alone would have risked clipping enlarged titles. Rows now use
  intrinsic minimums and long titles permit emergency wrapping.

## Known risks and assumptions

- The first-viewport contract is for default browser text size. At larger text, scrolling is
  intentional and verified.
- Very long future OLTRs may extend past the first viewport; they remain complete and readable.
- The native date/time presentation follows the browser locale; the required information and
  one-line structure remain stable.

## Unresolved issues

None for the requested implementation. GitHub publication and integration were not authorized in
this task.

## Uncommitted or unmerged state

The implementation and continuity files are committed together on
`feat/mobile-current-flow-glance`. The branch remains unmerged into `master` and unpushed.

## Exact next recommended action

Review the feature worktree with `npm run workspace:dev`. If accepted, explicitly authorize pushing
the feature branch and integrating it into `master`, followed by the deployment check.

## Relevant files, commits, issues, or external references

- [Current Flow glance layout](../../CURRENT_FLOW_GLANCE_LAYOUT.md)
- [Responsive product decision](../decisions/20260822T214607Z--make-mobile-current-flow-a-first-viewport-instrument-panel.md)
- [Architecture](../../ARCHITECTURE.md)
- Starting commit `b5426ca3e46a4af56237fc350b14cdb7bd9c02c6`
