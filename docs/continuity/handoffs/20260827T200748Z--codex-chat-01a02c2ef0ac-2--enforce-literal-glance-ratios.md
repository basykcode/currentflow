# Handoff: Enforce literal glance ratios

- Date (UTC): 2026-08-27T20:07:48Z
- Branch: `codex/chat-01a02c2ef0ac-2`
- Worktree: `/Users/benkind/.codex/worktrees/6dc6/Current Flow Main`
- Starting HEAD: `ca93cf500af1b59560c3121dd22f76b6dee623cb`
- Status: unmerged feature work; corrected percentage contract implemented and verified

## Objective

Implement Jun's principal-grid percentages literally at every width:

- Year 25% | Hour over Day 50% | Month 25%;
- Organ System 50% | Intention over Execution 50%.

## Correction and cause

The preceding revision went wrong in two specific ways:

1. It used `minmax(18rem, 1.36fr)` for the center temporal column instead of a literal `2fr`, so the
   first row was not a guaranteed 25/50/25 relationship.
2. It added a breakpoint below 680 CSS pixels that changed both rows to single-column stacks. That
   unsupported responsive interpretation produced the screenshots in which every card appeared
   one after another.

No missing user input caused the problem. The percentages and screenshots were sufficient; the
implementation introduced assumptions beyond them.

## Implemented

- Replaced the temporal tracks with `minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr)`.
- Kept the active row at two `minmax(0, 1fr)` tracks.
- Removed the narrow-screen stacking breakpoint entirely.
- Preserved the vertical Hour/Day and Intention/Execution stacks, equal outer heights, complete
  text, touch targets, and natural vertical scrolling.
- Added stable `data-column-ratio="1-2-1"` and `data-column-ratio="1-1"` contracts and focused test
  assertions.
- Updated current layout and architecture documentation.
- Added accepted decision
  `20260827T200544Z--preserve-literal-glance-ratios-at-every-width.md`.

## Verification

- `npm run workspace:doctor` — passed; worktree lease and slot 3 remain valid.
- Final `npm run check` — passed:
  - strict TypeScript and zero-warning ESLint;
  - 48 Vitest files / 395 application tests;
  - 11 workspace-isolation tests;
  - commentary validation with 379 summaries and 5 explicit unavailable records;
  - transition validation with 384 summaries;
  - production build with 469 modules transformed.
- `git diff --check` — passed.
- Fresh narrow in-app browser verification at 412 × 790 CSS pixels:
  - Year and Month were each 95.20 px wide;
  - the Hour/Day center stack was 190.41 px wide;
  - Organ and Guidance were each 193.20 px wide;
  - Year, center, and Month were each 333.02 px high;
  - Organ and Guidance were each 842.19 px high;
  - Intention and Execution were each 409.12 px high;
  - horizontal document overflow was zero and the fresh console had no errors.

## Remaining limitations and next action

- Narrow cards necessarily wrap more text and make the second row tall. This follows the literal
  percentage contract and preserves complete content without horizontal overflow.
- Product review in the deliverable narrow preview is the next useful action. No commit, push,
  merge, rebase, deployment, or branch switch was performed.
