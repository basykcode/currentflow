# Handoff: Balance temporal and guidance rows

- Date (UTC): 2026-08-27T19:48:11Z
- Branch: `codex/chat-01a02c2ef0ac-2`
- Worktree: `/Users/benkind/.codex/worktrees/6dc6/Current Flow Main`
- Starting HEAD: `ca93cf500af1b59560c3121dd22f76b6dee623cb`
- Status: unmerged feature work; Jun's corrected layout is implemented and verified

## Objective

Correct the principal-glance composition so Year and Month remain in the primary instrument,
horizontally sandwich the stacked Hour/Day cards, and sit above a balanced 50/50 Organ and
Intention/Execution row.

## Implemented correction

- Reworked `PrincipalGlanceGrid` into two rows:
  - Year | Hour over Day | Month;
  - Organ System at 50% | Intention over Execution at 50%.
- Year and Month use equal-width outer tracks and stretch to the combined height of the center
  Hour/Day stack.
- Organ and the complete Guidance stack use equal widths and equal outer heights.
- Intention and Execution remain vertically stacked at equal heights across desktop and tablet
  layouts; the earlier tablet side-by-side Guidance rule was removed.
- Year and Month retain their original stacked zodiac-then-glyph composition and shared inspector
  interaction. Hour and Day retain the compact horizontal identity/glyph composition.
- Removed the superseded `TemporalContextDetails` disclosure. No temporal, Guidance, provenance,
  Organ, or inspector domain contract changed.
- Preserved single-column natural scrolling at narrow mobile widths with no horizontal overflow.
- Updated the focused rendering tests and current architecture/layout documentation.
- Added accepted decision
  `20260827T194311Z--balance-temporal-sandwich-and-guidance-pair.md`, which supersedes only the
  secondary Year/Month and three-column portions of the previous layout decision.

## Verification

- `npm run workspace:doctor` — passed; branch/session lease and isolated runtime slot 3 remain valid.
- Focused glance, Guidance, and route suites — passed: 3 files / 16 tests.
- Final `npm run check` — passed:
  - strict TypeScript and zero-warning ESLint;
  - 48 Vitest files / 395 application tests;
  - 11 workspace-isolation tests;
  - commentary validation with 379 summaries and 5 explicit unavailable records;
  - transition validation with 384 summaries;
  - production build with 469 modules transformed.
- `git diff --check` — passed.
- Fresh in-app browser verification:
  - at 1280 × 900, Year and Month were each 346 × 425 CSS px and the center stack was 470 × 425;
  - Organ and Guidance were each 586 × 336 CSS px;
  - Intention and Execution were each 586 × 154 CSS px;
  - the document had zero horizontal overflow and the fresh console had no errors;
  - 1024px tablet preserved vertically stacked, equal-height Intention and Execution plus equal
    50/50 Organ/Guidance columns;
  - 375, 390, and 430px mobile checks preserved natural stacking with zero horizontal overflow.

## Remaining limitations and next action

- The complete two-row instrument intentionally extends below short desktop viewports. This follows
  the corrected geometry and preserves readable content rather than shrinking or clipping cards.
- The current live Guidance bundle still supplies one intention and two executions; the interface
  does not invent filler entries.
- Product review is the next useful action. No commit, push, merge, rebase, deployment, or branch
  switch was performed.
