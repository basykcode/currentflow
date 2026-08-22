# Decision: Adopt a monochromatic Lake Yin palette

- Status: accepted
- Date (UTC): 2026-08-22
- Scope: shared visual system and accessibility

## Context

Current's dark-first water palette still divided emphasis between blue-green interaction colors and
warm cinnabar status accents. The user directed the complete application toward a quieter Dui/Lake
Yin character and explicitly removed orange and teal from the interface.

## Constraints and requirements

- Preserve dark, light, and system theme choices.
- Keep text and controls legible at WCAG AA contrast or better.
- Preserve semantic status and provenance information without relying on hue alone.
- Apply the direction coherently across shared and Alchemy-specific surfaces.
- Avoid ornamental imitation or a generic wellness aesthetic.

## Decision

Use one blue family for backgrounds, text, borders, interaction, status, and feature accents. Dark
mode uses deep lake navy, moon-blue text, clear-water blue interaction, and a softer periwinkle-blue
secondary accent. Light mode uses mist blue with darker lake-blue text and controls. The existing
`jade` and `cinnabar` custom-property names remain compatibility aliases, but both now resolve to
blue values. Alchemy's feature accent moves from teal to clear lake blue.

## Rationale

A token-level change keeps the interface coherent and preserves existing component semantics. Blue
values with materially different lightness still communicate hierarchy without reintroducing the
orange/teal split. Status labels retain text and shape, so their meaning does not depend on color.

## Consequences and tradeoffs

- Warm seal accents no longer appear in ordinary application UI.
- Error and unavailable states remain distinguishable by copy, icon shape, and border treatment,
  but no longer receive a warm warning hue.
- Legacy semantic token names are less literal, avoiding a broad and risky component rename.

## Verification criteria

- Shared dark and light tokens contain no orange or teal accents.
- Alchemy uses the same lake-blue family.
- The Astrology header, status treatments, focus rings, and organ icons remain legible.
- Responsive visual inspection and `npm run check` pass.

## Supersedes

The accent-color portion of
[`20260724T001425Z--adopt-a-dark-first-daoist-water-palette.md`](20260724T001425Z--adopt-a-dark-first-daoist-water-palette.md).

## Superseded by

None.

## Related files

- [`../../PRODUCT_PRINCIPLES.md`](../../PRODUCT_PRINCIPLES.md)
- [`../../../src/assets/styles/tokens.css`](../../../src/assets/styles/tokens.css)
- [`../../../src/features/alchemy/alchemy.css`](../../../src/features/alchemy/alchemy.css)
