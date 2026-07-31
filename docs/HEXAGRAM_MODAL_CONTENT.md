# Hexagram modal commentary content

## Runtime boundary

`src/features/hexagram-commentary/repository.ts` lazy-loads one public JSON file by King Wen number,
validates it at runtime, and caches the result for the modal session. Missing or malformed content
returns a typed unavailable result. There are no network calls.

`src/components/hexagrams/HexagramCommentaryPanel.vue` owns the commentary interaction so the shared
inspector remains focused on structure and transformations.

## Interaction

- Six tabs follow the canonical registry order: Daoist, Buddhist, Confucian, Psychological, Human
  Design, and Gene Keys.
- Arrow Left/Right/Up/Down, Home, and End move and focus the active tab.
- The last selected school is remembered in device-local storage.
- Each available panel shows its school classification, evidence mode, source count, a labeled
  OLTR (“One Line To Remember”) essence, and detailed synthesis.
- Source disclosure explains the method and lists title, contributors, contribution role, evidence
  mode, and locator count.
- Human Design and Gene Keys are explicitly labeled modern systems.
- Insufficient evidence shows a calm unavailable explanation and no inferred prose.
- Development builds may disclose source IDs and chunk IDs. Production builds do not.

## Accessibility and responsive behavior

The tablist uses the ARIA tabs pattern with a roving tab index and unique per-hexagram IDs. Loading
and content changes use a polite live region. At narrow widths, the two-row three-button layout
remains readable, the modal becomes a single scrollable column, and body and dialog widths remain
bounded to the viewport.

The modal's existing structural data remains independently sourced: canonical Chinese identity and
pinyin, trigrams, fixed transformations, line changes, and the Gene Keys spectrum do not depend on
commentary availability.
