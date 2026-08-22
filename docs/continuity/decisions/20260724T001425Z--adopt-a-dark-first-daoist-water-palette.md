# Decision: Adopt a dark-first Daoist water palette

- Status: accepted
- Date (UTC): 2026-07-24
- Scope: visual system, accessibility, and device-local preference migration

## Context

The product visual identity was a warm mineral-paper palette with a green-black dark mode. The user
directed Current to express the water element in dark mode: navy backgrounds, very pale blue text,
and a Daoist sense of flow.

## Constraints and requirements

- Preserve the calm precision-almanac character and existing typography, layout, and component
  hierarchy.
- Keep normal text at WCAG AA contrast or better.
- Avoid decorative imitation of historical Chinese art or generic “new age” effects.
- Preserve explicit Light and System choices after the dark-first migration.
- Do not discard the stored timezone or optional location label.

## Options considered

1. **Change only the existing dark tokens** — smallest diff, but existing installs on the old System
   default could continue opening in the light mineral scheme and miss the requested identity.
2. **Remove Light and System modes** — guarantees dark presentation but needlessly removes working
   user controls.
3. **Make water-dark the root/default and retain water-light/System alternatives** — satisfies the
   new identity while preserving user choice. Selected.

## Decision

Use deep navy as the root and Dark palette, pale moon-blue for primary text, muted blue-green for
interactive accents, and cinnabar only for small seal-like details. Reinterpret Light as a mist-blue
palette. Make Dark the default and initialize preferences at the application root so every route
receives the theme before feature stores mount.

Version the preference key to `current:preferences:v2`. On the first v2 load, legacy installs start
in Dark once while retaining their timezone and location values. Subsequent explicit theme choices
are preserved under v2.

## Rationale and supporting evidence

Central color tokens already govern nearly every surface, so a token-level change provides coherent
coverage with minimal component churn. A dark root also prevents a light flash before Vue mounts.
Measured contrast is at least 5.80:1 for muted dark-theme text and 4.81:1 for the faint light-theme
text token; primary text is substantially higher.

## Consequences and tradeoffs

- Existing users see the requested water-dark identity once after migration even if their legacy
  value was System or Light.
- Timezone and location preferences survive the migration.
- Users can still explicitly choose Light or System after migration.
- The semantic token names `jade` and `paper` remain for compatibility although their visual values
  now describe water and mist.

## Implementation or migration implications

- Update shared tokens, global atmospheric background, component shadows, and Settings swatches.
- Initialize `usePreferencesStore` in `App.vue`.
- Reset removes both the legacy and v2 preference keys.

## Verification criteria

- A fresh or migrated install opens in the dark water palette.
- Direct navigation to any route receives the theme.
- Light and System controls continue to work.
- `npm run check` passes.
- Shared text/accent token pairs meet WCAG AA contrast.

## Supersedes

The warm-paper visual palette, but not the broader visual-character principles.

## Superseded by

The monochromatic Lake Yin palette decision dated 2026-08-22.

## Related files, issues, handoffs, and commits

- [`../../PRODUCT_PRINCIPLES.md`](../../PRODUCT_PRINCIPLES.md)
- [`../../../src/assets/styles/tokens.css`](../../../src/assets/styles/tokens.css)
- [`../../../src/stores/preferences.ts`](../../../src/stores/preferences.ts)
