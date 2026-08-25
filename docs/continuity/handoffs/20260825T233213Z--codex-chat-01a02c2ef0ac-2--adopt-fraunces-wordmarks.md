# Adopt Fraunces for Current Flow display typography

## Branch context

- Worktree: `/Users/benkind/.codex/worktrees/6dc6/Current Flow Main`
- Branch: `codex/chat-01a02c2ef0ac-2`
- Starting HEAD: `5f3f76d1202a4336c013418b6b24a79b5253f800`
- Upstream: none
- Remote: `git@github-basykcode:basykcode/currentflow.git`
- Integration status: feature-branch work; not merged or pushed

## Objective

Adopt Fraunces as Current Flow's application-wide display serif, use weight 600 with `SOFT 100` and
`WONK 1` for both product titles, and give the production page title the compact two-line treatment
`The Current` above `~ Flow ~` with blue tildes.

## Implemented behavior

- The application pins `@fontsource-variable/fraunces` 5.3.0 and imports its full normal variable
  family from the entry point. Vite serves the resulting WOFF2 assets locally; there is no runtime
  font request to an external service.
- `Fraunces Variable` now leads the existing `--font-serif` token. The former platform and CJK serif
  stack remains as the glyph-coverage fallback, so every existing display-serif consumer adopts the
  new family without a parallel typography system.
- The shared display settings are maximum Softness (`SOFT 100`), full Wonky substitutions (`WONK
1`), and automatic optical sizing. Existing component weights remain intact except for the two
  requested titles.
- The application-bar `Current ~ Flow` wordmark and the production `The Current ~ Flow ~` heading
  use weight 600. At compact and mobile widths, the page heading has exactly two rows: `The Current`
  and `~ Flow ~`; wide layouts retain a single row.
- Page-title tildes use the same blue design token as the title-bar tilde and are hidden from
  assistive technology. The heading's accessible name remains `The Current Flow`; custom section
  labels continue to render without decorative tildes.
- Typography provenance, delivery, axes, license, and responsive title rules are recorded in
  `docs/TYPOGRAPHY.md`. The accepted display-serif decision has its own continuity record, and the
  complete SIL Open Font License 1.1 is deployed at `/licenses/fraunces-OFL-1.1.txt`.

## Verification

- Focused unit tests:
  `npm run test:unit -- src/components/astrology/__tests__/CelestialCurrentInstruments.spec.ts src/components/astrology/__tests__/CurrentFlowGlance.spec.ts src/views/__tests__/AstrologyView.spec.ts src/components/common/__tests__/BrandMark.spec.ts`
  — 4 files and 21 tests passed.
- `npm run check` — passed.
  - TypeScript project build and ESLint passed.
  - Vitest: 48 test files and 393 tests passed.
  - Workspace isolation: 11 tests passed.
  - Commentary validation: 64 generated hexagrams, 379 summaries, 5 explicit unavailable records,
    and 0 needs-revision records.
  - Transition validation: 64 Forest bundles and 384 draft-only transition summaries.
  - Production Vite build passed and emitted local Fraunces Vietnamese, Latin Extended, and Latin
    WOFF2 assets; the deployed license copy was present.
- Live browser verification:
  - Computed title and wordmark styles resolved to `Fraunces Variable`, weight 600, `SOFT 100`, and
    `WONK 1`; the font-loading API confirmed that the 600 face was ready.
  - At 320×800, 375×667, and the user's 417×801 preview, `The Current` and `~ Flow ~` occupied their
    exact separate rows with two blue tildes, no horizontal overflow, and no Moon/clock or Sun/clock
    overlap.
  - At 375×667 with 150% root text, the title retained its two rows without overflow or celestial
    overlap.
  - At 1366×768, the title remained on one row without overflow.
  - Dark and light themes both retained the correct family, axes, accessible name, tilde color, and
    overflow-free layout. The user's preview was restored to dark afterward.
  - An existing display-serif consumer outside the titles also resolved to Fraunces with the shared
    axes while preserving its component-specific weight.
  - A fresh direct preview load produced only Vite connection debug entries and no warnings or
    errors.

## Deliberate scope

- No astronomy, calendrical, Yijing, provider, provenance, or data behavior changed.
- No push, merge, rebase, deploy, branch switch, or worktree change was performed.
- `docs/continuity/PROJECT_STATE.md` was not edited because this remains feature-worktree UI work.
