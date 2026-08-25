# Decision: Adopt Fraunces as the Current Flow display serif

- Status: accepted
- Date (UTC): 2026-08-25
- Scope: application display typography, wordmarks, font delivery, and responsive title behavior

## Context

Current Flow previously used a system-serif stack for its display voice. That produced materially
different letterforms across platforms and could not express Jun's selected Softness and Wonky
settings. Jun also requested a consistent Current Flow title treatment: the application wordmark
and the production page title should share Fraunces at weight 600, with the mobile page title reading
`The Current` above `~ Flow ~`.

## Decision

Pin `@fontsource-variable/fraunces` at version 5.3.0 and import its full variable-axis CSS from the
application entry point. Make `Fraunces Variable` the first family in the existing `--font-serif`
token, while preserving the platform and CJK serif fallbacks for uncovered glyphs.

Use `SOFT 100`, `WONK 1`, and automatic optical sizing as the application-wide display-serif axis
policy. Existing components retain their own weights; the application wordmark and production page
title use weight 600. The page-title tildes use the same blue token as the title-bar tilde, remain
decorative to assistive technology, and move with `Flow` onto the second row at compact and mobile
widths.

Bundle all font files locally through Vite and publish a copy of the SIL Open Font License 1.1 with
the application. Do not add a runtime request to Google Fonts, Fontsource CDN, or another external
font service.

## Alternatives rejected

- Use a remote font stylesheet: creates a hidden runtime network dependency and a new privacy and
  availability boundary.
- Apply Fraunces only to the two titles: leaves the rest of the established display-serif system
  platform-dependent and does not satisfy the app-wide replacement.
- Use a static font cut: cannot preserve the requested Softness and Wonky axes.
- Remove the existing fallback chain: would reduce coverage for CJK and unsupported glyphs.

## Consequences

The production bundle gains locally served WOFF2 assets and the application-wide serif metrics
change wherever `--font-serif` was already in use. Sans-serif body copy, celestial calculations,
provenance, and domain behavior are unaffected. The dependency version and deployed license are
recorded in `docs/TYPOGRAPHY.md`.

## Verification criteria

The full repository check and production build must pass. Live browser inspection must confirm the
family, weight, Softness, and Wonky settings; the exact two-row mobile title at 320, 375, and 417
pixel widths; the single-row desktop title; no horizontal overflow or celestial-column overlap;
local font loading; and correct rendering in both supported themes.
