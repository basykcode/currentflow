# Refine the Celestial Current header layout

## Branch context

- Worktree: `/Users/benkind/.codex/worktrees/6dc6/Current Flow Main`
- Branch: `codex/chat-01a02c2ef0ac-2`
- Starting HEAD: `dae69f119e7bf03e342e3902ad432743989c13d4`
- Upstream: none
- Remote: `git@github-basykcode:basykcode/currentflow.git`
- Integration status: feature-branch work; not merged or pushed

## Objective

Refine the production Celestial Current header from the August 25 mobile review: keep the Moon and
Sun annotations inside the two diagrams, reduce the header's mobile height, deactivate the
standalone Solar Branch badge pending research, show the current Cantong qi and Solar Term bounds,
and replace the visible IANA timezone with a formal GMT-offset label.

## Implemented behavior

- The Moon ring now stays at the outer left with its four text rows on the inward/right side. The Sun
  ring stays at the outer right with its four rows on the inward/left side. The relationship remains
  horizontal at compact and mobile widths, with smaller phone rings and a shorter header.
- Each cluster now includes a compact period row above its Chinese state row:
  - Lunar bounds are the exact current five-day Cantong qi interval on the reviewed
    `Asia/Shanghai` traditional-calendar basis. The final Kūn interval clips after day 29 in a short
    lunar month.
  - Solar bounds are the exact searched current Solar Term instant through the exact next Solar
    Term instant.
- Compact bounds are localized into the selected display timezone. Exact start and exclusive-end
  timestamps, including the GMT offset at each boundary, remain in the row title and cluster
  accessible name. Absolute UTC values also remain on typed view models and data attributes.
- The standalone `申 Shēn` badge is no longer rendered or announced on Home. Its source data,
  ring-active state, presenter cross-checks, and technical-details disclosure remain intact pending
  further product/source research.
- The clock now displays a derived long GMT offset such as `GMT−07:00`; the configured IANA timezone
  remains in the metadata title. This is instant-aware, so daylight-saving changes and non-hour
  offsets are not hardcoded. For Los Angeles on August 25, 2026, the correct label is `GMT−07:00`.
- Domain contracts, fixtures, presenters, provider tests, component tests, accessibility guidance,
  provider documentation, and calculation-source documentation were updated with the new bounds
  and Home contract.

## Verification

- `npm run check` — passed.
  - TypeScript project build passed.
  - ESLint passed with zero warnings.
  - Vitest: 48 test files passed; 393 tests passed.
  - Workspace isolation tests: 11 passed.
  - Commentary validation: 64 generated hexagrams, 379 summaries, 5 explicit unavailable records,
    0 needs-revision records.
  - Transition validation: 64 Forest bundles and 384 draft-only transition summaries.
  - Production Vite build passed.
- Live browser matrix at normal text size: `375×667`, `390×844`, `393×852`, `430×932`, `768×1024`,
  `1366×768`, and `1728×1000`.
  - All exact viewports had no horizontal overflow or header-cluster overlap.
  - Moon and Sun text remained inward-facing; two period rows rendered; the standalone Branch badge
    was absent; the clock displayed `GMT−07:00`.
- Enlarged-text checks at `375×667` and `1366×768` used a 24 px root font (150% of the normal 16 px).
  Both retained inward-facing order with no horizontal overflow or center-cluster overlap and used
  natural vertical scrolling.
- Light and dark themes were reviewed on the live production route. The user's preview was restored
  to dark theme afterward.
- A fresh isolated browser load produced only Vite connection debug messages and no warnings or
  errors.

## Deliberate scope and next action

- No push, merge, rebase, deploy, branch switch, or worktree change was performed.
- `docs/continuity/PROJECT_STATE.md` was not edited because this is a feature worktree.
- The active Solar Branch remains available in the ring and details, but a standalone Home decode is
  intentionally deferred. The next product decision is whether research supports a symmetrical
  Lunar/Solar decode or whether the ring/details treatment should remain the final Home contract.
