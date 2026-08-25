# Current Flow typography

## Display family

Current Flow self-hosts **Fraunces Variable** through
`@fontsource-variable/fraunces` **5.3.0**. The package is imported from the application entry point,
so Vite emits local WOFF2 assets and the browser makes no runtime font request to Google Fonts,
Fontsource CDN, or any other remote service.

The shared `--font-serif` token selects Fraunces first and preserves the existing system and CJK
serif fallback chain. Every component that previously used the display-serif token therefore
receives Fraunces without establishing parallel typography rules.

The app-wide Fraunces axis policy is:

- `SOFT 100` — maximum Softness;
- `WONK 1` — the full Wonky substitution set;
- optical sizing enabled automatically;
- component-specific weights remain authoritative.

The application wordmark and production `The Current ~ Flow ~` heading both use weight **600**. The
Home heading keeps `The Current` on its first line and `~ Flow ~` on its second line at compact and
mobile widths. The two tildes use the same `--cinnabar` blue as the title-bar tilde and are decorative
for assistive technology; the heading's accessible name remains `The Current Flow`.

## Provenance and license

- Typeface: [Fraunces](https://github.com/undercasetype/Fraunces)
- Designers/project authors: The Fraunces Project Authors
- Package: [Fontsource Fraunces Variable](https://fontsource.org/fonts/fraunces/install)
- Axes: `opsz`, `wght`, `SOFT`, and `WONK`
- License: SIL Open Font License 1.1
- Deployed license copy: `/licenses/fraunces-OFL-1.1.txt`

The font may be bundled and redistributed under the OFL terms. Current Flow does not modify the font
or use the project authors' names for endorsement.
