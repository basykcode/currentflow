---
name: yijing-transformation-lab
description: Extend or review Current Flow's Yijing transformation domain engine, Transformation Lab, shared result cards, modal navigation, lineage modules, source tables, provenance, and tests. Use for deterministic hexagram transformations, line-change destinations and paths, structural anatomy, or source-gated classical-system UI work.
---

# Yijing Transformation Lab

## Reconstruct the boundary

1. Follow `AGENTS.md` and the continuity protocol.
2. Inspect `src/domain/astrology/hexagrams.ts`; treat it as the only 64-hexagram identity and
   signature registry.
3. Inspect `src/components/hexagrams/HexagramInspector.vue`,
   `src/stores/hexagramInspector.ts`, and the latest relevant tests and handoff.
4. Read `docs/YIJING_TRANSFORMATION_LAB.md`, `docs/YIJING_TRANSFORMATIONS.md`,
   `docs/YIJING_TRANSFORMATION_PROVENANCE.md`, and `docs/YIJING_TRANSFORMATION_DATA.md`.
5. Keep temporal Year, Month, Day, Hour, Four-Scale Resonance, and commentary calculations outside
   this work.

## Preserve the line convention

- Store and calculate six lines bottom-to-top.
- Treat index `0` as line 1 at the bottom and index `5` as line 6 at the top.
- Use fixed tuples and `LineNumber` values instead of orientation-ambiguous binary strings.
- Reverse lines only in presentation components such as `HexagramGlyph`.
- Verify Hexagram 5 exact vectors before accepting a transformation change.

## Implement calculations

1. Add pure TypeScript functions under `src/domain/yijing/transformations`.
2. Resolve every calculated signature through the canonical registry.
3. Keep transformation definitions, results, calculations, and Vue view models separate.
4. Use a per-inspector transformation engine for memoization; do not add a mutable singleton.
5. Enumerate 63 line-change destinations once per source and calculate path permutations only on
   demand.
6. Detect cycles in iterative transforms and bound every iteration.

## Classify provenance

- Give every operation a stable ID, family, class, requirement, tradition, canonicality, source IDs,
  implementation status, and interpretation availability.
- Distinguish classical structure, textual sequence, lineage-specific tables, Daoist alchemical
  overlays, variants, and Current formalizations.
- Label a calculated target without commentary as structural-only.
- Never describe a Current composition as ancient or every Yijing operation as Daoist.

## Gate source data

- Validate complete source tables for missing, duplicate, and out-of-range records.
- Preserve source variants instead of selecting one silently.
- Render `source-needed` when Zagua, Eight-Palace, Gua Bian, Message Hexagram, Shao Yong, Cantong Qi,
  reading-convention, or Yilin evidence is absent.
- Treat Jiaoshi Yilin as an origin-to-destination transition; never attach it as static endpoint
  commentary.
- Never generate or reconstruct missing traditional mappings from memory.

## Integrate interaction

- Keep one dialog and one typed internal modal-navigation stack.
- Preserve Lab section, moving lines, filters, chain, visited state, and scroll position when opening
  a target and navigating back.
- Use `TransformationHexagramCard.vue` for every target result, including path intermediates.
- Prevent self-mapping history loops while keeping self-result evidence inspectable.
- Preserve the dialog focus trap, Escape behavior, focus restoration, keyboard tabs and controls,
  reduced motion, touch sizing, and narrow-screen containment.

## Verify

1. Test registry uniqueness and round trips.
2. Test core involutions, exact Hexagram 5 vectors, symmetry convergence, Mutual Field, Deep Nuclear,
   all destination counts, masks, Hamming distance, and paginated paths.
3. Test source-table failures and source-needed modules.
4. Test same-dialog Lab navigation, exact Back restoration, arrival context, chain behavior, close
   reset, and keyboard interaction.
5. Run `npm run codex:doctor`, focused tests, `npm run check`, and browser QA at desktop and
   approximately 360px width. When a Cloud task has no interactive browser, require component and
   viewport-focused automated tests and record the browser pass as a separate local or preview QA
   step rather than claiming it ran.
6. Confirm no unexpected network request, predictive language, fabricated target, or raw protected
   source text appears.
