# Decision: Keep Forest transition evidence local and line-specific

- Status: accepted
- Date (UTC): 2026-07-30
- Scope: hexagram line-change commentary, provenance, rights, and runtime presentation

## Context

The hexagram inspector computes six deterministic one-line results for every King Wen figure. The
user supplied Christopher Gait's _Forest of Changes_, whose 64×64 matrix provides an individual
verse for every source-to-result pair, and requested a concise description for each selectable line
change.

The supplied translation is protected research material. Its historical attributions, duplicated
verses, corrupt passages, and explicit cross-references also make it unsuitable for flattening into
an unqualified universal transition rule.

## Decision

Treat the supplied Forest as local research evidence. Extract and hash all matrix positions, derive
the 384 one-line routes from the canonical hexagram registry, and keep verses and notes outside Git
and the SPA. Track only locators, hashes, conservative rights metadata, original draft paraphrases,
and technical review results.

Display one source-specific draft insight beneath the currently selected line change. Identify it as
a Forest summary, not as canonical line text or prediction, and disclose any source redirection.

## Rationale

- A source-to-result matrix provides exact evidence for each deterministic route without inventing
  a generic line meaning.
- Hash and locator joins make every public sentence auditable while preserving the protected text
  boundary.
- Explicit cross-reference handling prevents redirected verses from being misrepresented as unique
  entries.
- A focused lazy repository keeps source processing out of the frontend and preserves typed
  unavailability.
- Draft-only labeling distinguishes automated technical QA from human editorial approval.

## Consequences

- Local evidence is required to rebuild with quotation-overlap checking but not to run or validate
  the already generated public bundles.
- Repeated source passages may intentionally yield repeated summaries on different routes.
- Four selected transitions disclose a resolved locator distinct from their displayed route.
- The current corpus remains unavailable for publication approval until a human editor reviews it.
- No Forest summary may be used as a deterministic calculation, personal prescription, or
  substitute for the Zhouyi line statements.

## Supersedes

None.

## Superseded by

None.

## Related files

- [`../../HEXAGRAM_TRANSITION_COMMENTARY.md`](../../HEXAGRAM_TRANSITION_COMMENTARY.md)
- [`../../../scripts/transitions/prepare_forest.py`](../../../scripts/transitions/prepare_forest.py)
- [`../../../scripts/transitions/public.mjs`](../../../scripts/transitions/public.mjs)
- [`../../../src/features/hexagram-transitions/repository.ts`](../../../src/features/hexagram-transitions/repository.ts)
