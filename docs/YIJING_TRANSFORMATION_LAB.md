# Yijing Transformation Lab

The Transformation Lab is the advanced structural workbench inside the existing Hexagram Inspector
dialog. It is not a second modal, route, reading engine, or source corpus. The compact Base Hexagram
screen remains the default; **Advanced Transformation Lab** replaces the dialog body while
preserving the same close behavior and focus boundary.

## Product boundary

- Calculations are deterministic, local, and resolved through the canonical 64-hexagram registry.
- Interpretive material is never inferred from a structural target. A calculated result without
  connected evidence is labeled `structural-only`.
- Traditional, lineage-specific, variant, and Current-derived operations remain visibly distinct.
- The Lab does not calculate temporal hexagrams, choose moving lines, make predictions, or call a
  network service.
- Commentary evidence remains in its separate local-only pipeline and is not imported by the SPA.

## Navigation model

`hexagramInspector.ts` owns a typed stack of complete modal screens. A screen records the current
hexagram, whether Base or Lab is visible, the active Lab section, moving lines, filters, scroll
position, and arrival context. Selecting any non-self target pushes the current screen, appends a
chain step, and opens that target's Base Hexagram screen. Back pops the previous screen exactly.

Self-mappings expand their evidence in place and never add a history step. Closing the dialog clears
history, chain, visited targets, filters, moving lines, and arrival context. The Back controls inside
Base and Lab therefore have different jobs:

- Base target Back returns to the precise prior screen.
- Lab Back returns to the source Base Hexagram screen.

The transformation chain is explicit navigation history, not a reading prescription. Its Reset
control removes the chain without changing the currently inspected figure.

## Sections

1. **Explore** — intrinsic transformations, the eight-operation structural symmetry family, and
   King Wen pair/neighbor relations.
2. **Change Lab** — a bottom-numbered moving-line selector, immediate relating result, six
   single-line results, all 63 non-self destinations, filters, and lazily paged minimal paths.
3. **Interior** — the traditional nuclear hexagram, a five-result Mutual Field construction, bounded
   Deep Nuclear iteration, and source/result nuclear comparison.
4. **Classical Systems** — explicit source requirements for Eight Palaces, wandering/returning soul,
   host/response, Na Jia, Gua Bian, and hidden/enveloping-body methods.
5. **Time & Maps** — explicit source requirements for the Twelve Message Hexagrams, Shao Yong
   precelestial layouts, and the Cantong Qi overlay.
6. **Structure** — line positions, trigrams, centrality, Three Powers, conventional correctness, and
   correspondence pairs.

Every target in these sections, including path intermediates, uses
`TransformationHexagramCard.vue`. It carries the operation label, target identity, changed lines,
canonicality, provenance/availability, interpretation status, and visited state.

The Base screen keeps the four intrinsic relationships together, then gives the single-line selector
its own linked relating-hexagram preview. A separate lazy component beneath that preview can display
the draft Forest summary for the exact ordered source-to-target route. The summary never changes the
structural result.

## Component and domain boundaries

Pure calculations live in `src/domain/yijing/transformations`. A per-inspector engine memoizes
intrinsic, symmetry, interior, and 63-destination computations without global mutable state. Focused
section components under `src/components/hexagrams/transformations` format those results but do not
recalculate them.

The canonical line convention, exact algorithms, and test vectors are documented in
[`YIJING_TRANSFORMATIONS.md`](YIJING_TRANSFORMATIONS.md). Source schemas and ingestion gates are in
[`YIJING_TRANSFORMATION_DATA.md`](YIJING_TRANSFORMATION_DATA.md), while display semantics are in
[`YIJING_TRANSFORMATION_PROVENANCE.md`](YIJING_TRANSFORMATION_PROVENANCE.md).

## Accessibility and responsive behavior

The Lab stays inside the Inspector's focus-trapped dialog and preserves Escape-to-close and opener
focus restoration. Its section tabs implement Left/Right/Home/End keyboard movement. Controls use
native buttons, checkboxes, radios, selects, and labels; target cards have descriptive accessible
names. At narrow widths, the source rail becomes part of the vertical flow and controls wrap without
horizontal page overflow. Motion uses the application's reduced-motion rules.

## Deliberate future work

Source-gated modules become available only after complete, rights-reviewed tables pass the validators
described in `YIJING_TRANSFORMATION_DATA.md`. The Base selector's 384 draft Forest summaries cover
only the six one-line routes per source and do not activate the Lab's complete Jiaoshi Yilin module
or availability filter. Yilin remains an ordered origin-to-destination relation, not endpoint
commentary. Reading conventions may reorder source-backed text display but may not alter the
deterministic relating hexagram.
