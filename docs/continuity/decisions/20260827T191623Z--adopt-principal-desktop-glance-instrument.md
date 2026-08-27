# Decision: Adopt a principal desktop glance instrument

- Status: accepted
- Date (UTC): 2026-08-27
- Scope: Astrology home information architecture, responsive presentation, and Guidance projection

## Context

The integrated Astrology home placed Year, Day, and Month in a large first row, Organ and Hour in a
second row, and OLTR after that five-card composition. At common desktop sizes the useful immediate
Current and validated Guidance extended well below the first viewport. The requested product
direction is a calm, no-scroll desktop glance instrument in which a brief look communicates the
active Hour, Day, Organ System, Intention, and Execution without losing verified broader context.

## Constraints and requirements

- Preserve the authoritative snapshot, shared inspector, Organ details, Guidance validation,
  provenance, and explicit unavailable states.
- Keep Hour and Day immediately visible while retaining Day's featured role in the broader
  Year / Day / Month temporal hierarchy.
- Do not manufacture three intentions or executions when the validated bundle contains fewer.
- Preserve Year and Month identity and inspector access without keeping them in the principal grid.
- Fit the header, OLTR, and principal instrument at common desktop/laptop sizes while allowing
  natural scrolling for mobile, large text, and unusually long content.

## Options considered

1. **Compress the existing five-card composition** — rejected because the desktop hierarchy would
   still lead with background Year/Month state and leave Guidance structurally separate.
2. **Remove Year and Month from Home** — rejected because verified broader temporal context and its
   shared inspector access remain useful depth.
3. **Create one principal grid with compact secondary temporal depth** — accepted because it makes
   the immediate Current legible without changing any domain or interaction authority.

## Decision

Compose the first desktop viewport as celestial header, full-width OLTR band, and a three-column
principal instrument: Organ System at left; Hour above Day in the center; Intention above Execution
at right. Hour receives the current-priority surface and glyph density. Year and Month move to a
collapsed `Broader Current` disclosure immediately after the grid and continue to use the shared
temporal cards and inspector.

The compact Guidance projection consumes only ranked, validated `GuidanceBundle` entries. It shows
all supplied intentions up to the domain maximum and the first three supplied executions, with
their existing categories, observable endpoints, and top selection rationales. Fewer entries remain
fewer; unavailable semantics produce explicit Intention and Execution unavailable panels.

## Consequences and tradeoffs

- The immediate Current and actionable output share one stable desktop instrument.
- The production fixture currently yields one controlled intention and two valid executions; the
  glance visibly preserves those counts instead of filling empty slots.
- Tablet and mobile use natural responsive stacking, so the complete instrument may extend below
  the first viewport rather than shrinking text or clipping controls.
- The former `FiveElementComposition` presentation component is retired; snapshot and domain
  contracts are unchanged.
- Year and Month require one disclosure action for their full cards, but their compact identities
  remain visible in the disclosure summary.

## Verification criteria

- Header, OLTR, and principal grid fit at standard text size at 1280 × 720, 1366 × 768, and
  1440 × 900 without horizontal overflow.
- Tablet and mobile retain readable, non-overlapping Hour, Day, Organ, Guidance, and secondary
  temporal content with natural scrolling.
- Hour, Day, Year, Month, and Organ retain their existing keyboard/click interaction boundaries.
- Available and unavailable Guidance projections render only domain-supplied content.
- Strict TypeScript, lint, focused tests, full application tests, workspace tests, content
  validation, and production build pass.

## Supersedes

This supersedes only the first-glance five-card visual composition and its locked Year/Day/Month →
Organ/Hour → OLTR presentation order documented in earlier glance work. It does not supersede the
canonical temporal hierarchy, deterministic calculation authority, Guidance semantic gate, or
accessibility requirements.

## Related files, decisions, and handoffs

- [`../../CURRENT_FLOW_GLANCE_LAYOUT.md`](../../CURRENT_FLOW_GLANCE_LAYOUT.md)
- [`../../GUIDANCE_OUTPUT_ARCHITECTURE.md`](../../GUIDANCE_OUTPUT_ARCHITECTURE.md)
- [Gate guidance output on versioned semantic input](20260822T222049Z--gate-guidance-output-on-versioned-semantic-input.md)
- [`../../../src/components/astrology/PrincipalGlanceGrid.vue`](../../../src/components/astrology/PrincipalGlanceGrid.vue)
