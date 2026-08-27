# Decision: Compact first glance with progressive detail

- Status: accepted
- Date (UTC): 2026-08-27
- Scope: Astrology home first-glance density

## Context

The literal 25/50/25 and 50/50 mobile composition preserved the requested relationships, but the
second row inherited detailed Guidance copy and equal inner row heights. That made Intention and
Execution more than four times taller than their first-glance information required and stretched
Organ System to match. The celestial center and OLTR also consumed avoidable vertical space.

## Decision

- Keep the literal percentage rows and equal outer Organ/Guidance heights.
- Let compact Intention take its natural height and let Execution fill the remaining right-column
  height to the shared lower edge.
- Show each supplied ranked intention as one row: character above Pinyin at left, English title at
  right. Omit the selected definition from first glance.
- Show Execution category and bounded action visually. Preserve its endpoint and top rationale in
  the accessible group label and hover title.
- Keep Primary Current provenance out of the glance row; it remains available in the deeper
  provenance presentation.
- Use compact-height celestial, temporal, Organ, and OLTR tokens for narrow mobile and short-laptop
  viewports without fixed card heights, clipping, or disabled scrolling.

## Consequences

- The complete principal instrument fits the reviewed 412 × 790 in-app viewport and a 1280 × 720
  laptop viewport at default text size.
- Increased text size and very short 375 × 667 screens continue to scroll naturally. Fitting the
  complete composition into 375 × 667 would require removing required information or reducing type
  below the accepted readable/touch-target treatment.
- The current calculated snapshot supplies one compatible intention and two executions. The glance
  supports up to three of each but never invents filler output.

## Supersedes

[Preserve literal glance ratios at every width](20260827T200544Z--preserve-literal-glance-ratios-at-every-width.md)
only where it required equal Intention/Execution inner rows and accepted an excessively tall default
glance. Its literal outer ratios and natural-scroll safety remain accepted.

## Verification criteria

- Hour and Day animal labels sit directly below their scope labels.
- Hexagram numbers are more prominent without displacing titles.
- OLTR is complete with reduced side padding; shorter variants use two body lines, while longer
  dynamic variants may use three rather than reducing text below the readable compact size.
- Intention and Execution headers are centered; Primary Current is absent from first glance.
- Execution reaches the shared lower border with Organ System.
- No tested viewport has horizontal document overflow.
- Focused and full repository checks pass.
