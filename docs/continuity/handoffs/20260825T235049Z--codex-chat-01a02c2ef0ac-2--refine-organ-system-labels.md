# Refine the mobile title and Organ System labels

## Branch context

- Worktree: `/Users/benkind/.codex/worktrees/6dc6/Current Flow Main`
- Branch: `codex/chat-01a02c2ef0ac-2`
- Starting HEAD: `d15c99eb3b042932182d79edb68d6dc34f8b0717`
- Upstream: none
- Remote: `git@github-basykcode:basykcode/currentflow.git`
- Integration status: feature-branch work; not merged or pushed

## Objective

Complete Jun's August 25 mobile review: center the second title row, remove the redundant visible
animal Hour from Organ System, present Micro Hour as Chinese → Pinyin → Phase, align all timeline
labels to their major nodes, and replace the English `NEXT` gate with the reviewed Chinese character.

## Implemented behavior

- The compact `~ Flow ~` row now opts out of grid-item stretch and centers on the same axis as `The
Current` and the clock.
- Organ System no longer repeats `Monkey Hour`, `Rooster Hour`, or the corresponding animal Hour
  beneath the Organ/element name. The adjacent Hour card remains the visible home-page owner of that
  identity. The compact Organ card's accessible label also avoids the repetition while retaining its
  next-Shíchen transition.
- `MICRO_PRESENTATION` now includes the reviewed tone-marked Pinyin forms: `Chū Kè`, `Yī Kè`, `Èr
Kè`, and `Sān Kè`. Home and Calculated From render the Micro row in the requested order, for
  example `初刻 Chū Kè · Phase 0`.
- The Astrology Research task's existing recommendation identified `次` (_cì_) as the cyclic next
  gate. Compact timelines now show `初`, `正`, `次`; detailed timelines retain the upcoming Branch
  immediately before `次`.
- Timeline labels use the same 4%, 50%, and 96% coordinates as the three major SVG nodes. This
  removes inherited text-alignment drift that had placed `初` beneath the first minor Kè node.
- Glance-layout, Organ System UI, and validation documentation now reflect the visible ownership,
  Pinyin order, `次` label, and exact label geometry.

## Verification

- Focused unit verification:
  `npm run test:unit -- src/components/astrology/__tests__/ShichenFlowTimeline.spec.ts src/components/astrology/__tests__/CurrentFlowGlance.spec.ts src/components/astrology/__tests__/CelestialCurrentInstruments.spec.ts src/views/__tests__/AstrologyView.spec.ts`
  — 4 files and 24 tests passed.
- `npm run check` — passed on the final run.
  - TypeScript project build and ESLint passed.
  - Vitest: 48 test files and 393 tests passed.
  - Workspace isolation: 11 tests passed.
  - Commentary validation: 64 generated hexagrams, 379 summaries, 5 explicit unavailable records,
    and 0 needs-revision records.
  - Transition validation: 64 Forest bundles and 384 draft-only transition summaries.
  - Production Vite build passed.
- The first full check stopped on a test-only assertion that queried the outer glance wrapper for an
  Organ-card ARIA label. The assertion was corrected to query the nested card; the complete final
  run above passed.
- Live 417×801 browser verification:
  - `~ Flow ~`, `The Current`, and the heading box had an exact shared horizontal center (0 px
    measured offset).
  - The visible Organ identity was exactly `Bladder · Water`; no redundant animal Hour line or
    current-animal repetition remained in its accessible card label.
  - The current Micro row rendered `三刻 Sān Kè · Phase 3`.
  - Compact labels rendered exactly `初`, `正`, `次`, and their measured centers differed from their
    corresponding major-node centers by at most 0.014 px.
  - The detailed timeline rendered `酉 · 次`; its three labels differed from the major-node centers
    by at most 0.01 px, and its Micro detail preserved the new order.
  - The page remained dark, horizontally overflow-free, and visually intact after returning from
    the calculation disclosure.

## Deliberate scope

- Shíchen selection, Organ Clock calculation, Macro/Micro boundaries, scheduler cadence, guidance
  maturity, and next-Shíchen identity did not change.
- No push, merge, rebase, deploy, branch switch, or worktree change was performed.
- `docs/continuity/PROJECT_STATE.md` was not edited because this remains feature-worktree UI work.
