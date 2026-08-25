# Align Celestial Current movement text

## Branch context

- Worktree: `/Users/benkind/.codex/worktrees/6dc6/Current Flow Main`
- Branch: `codex/chat-01a02c2ef0ac-2`
- Starting HEAD: `20a60a0d812918438b6fcee5219f0e8dc65a1377`
- Upstream: none
- Remote: `git@github-basykcode:basykcode/currentflow.git`
- Integration status: feature-branch work; not merged or pushed

## Objective

Keep every reviewed Lunar/Solar Yin-Yang movement state on one visual line, including `Yang
Descending` at the narrowest supported phone width, and make wrapped Solar copy share a deliberate
right axis that mirrors the Lunar copy's left axis.

## Implemented behavior

- `CelestialInstrumentText` now accepts an explicit left/right alignment contract rather than
  relying only on inherited button alignment.
- Lunar copy uses the left contract. Solar copy uses the right contract, including `flex-end`
  alignment for every wrapped `ChineseTermInline` subline.
- The movement row is an intrinsic, no-wrap line anchored to the appropriate text axis. On phone
  widths its type scales against the actual copy-column width with container-query units, allowing
  the longest reviewed state, `Yang Descending`, to remain intact.
- Phone ring sizes use stable pixel bounds so text-only enlargement does not cause decorative rings
  to consume the copy column. A dedicated 320–359 CSS pixel rule reduces ring and center-track
  pressure at the application's supported 320 CSS pixel minimum.
- Component tests assert the explicit Lunar-left and Solar-right contracts. Celestial layout and
  accessibility documentation now record the axis and movement-line policy.

## Verification

- Focused tests:
  `npm run test:unit -- src/components/astrology/__tests__/CelestialCurrentInstruments.spec.ts src/components/astrology/__tests__/CurrentFlowGlance.spec.ts`
  — 2 files and 19 tests passed.
- `npm run check` — passed.
  - TypeScript build and ESLint passed.
  - Vitest: 48 files and 393 tests passed.
  - Workspace isolation: 11 tests passed.
  - Commentary and transition validation passed.
  - Production Vite build passed.
- Live browser checks:
  - 417×801 user preview: `Yang Full` and `Yang Descending` each rendered as one line; every wrapped
    Solar Term subline ended on the same right axis.
  - 320×800 minimum: no horizontal overflow; both movement rows remained single-line and had no
    collision with their ring or the center clock; Solar wrapped copy retained `flex-end` alignment.
  - 375×667: the longest movement label fit its intrinsic row with no horizontal overflow.
  - 375×667 at 150% root text size: both movement rows remained single-line with no ring or center
    collision and no page overflow; Solar copy retained its right axis.
  - 1366×768: desktop movement type remained 11.2 px, unwrapped, right-aligned, and overflow-free.
  - A fresh isolated page load produced only Vite connection debug messages and no warnings or
    errors.

## Deliberate scope

- No domain labels, calculations, provider behavior, source data, or provenance changed.
- No push, merge, rebase, deploy, branch switch, or worktree change was performed.
- `docs/continuity/PROJECT_STATE.md` was not edited because this remains feature-worktree UI work.
