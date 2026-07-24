# Current ~ Flow

Current is a situational-awareness instrument for timing: a calm precision almanac that keeps
global conditions, personal context, and their interface distinct. The current alpha includes a
deterministic global temporal calculation layer while keeping personal and interpretive systems
unconnected.

## Alpha scope

The Astrology route calculates timezone-aware GanZhi pillars, their 60 Jia Zi hexagrams, the
traditional two-hour organ period, and line-derived structural relationships. Alchemy, Intelligence,
Other Tools, authentication, personal BaZi, and interpretive synthesis are deliberate nonconnected
previews. Settings for theme, timezone, and local preferences work on the current device.

## Local setup

Use Node 22.18.0 and npm.

```bash
nvm use
npm install
npm run dev
```

The development server prints the local URL. No service credentials or environment variables are required.

## Scripts

- `npm run dev` — start Vite development mode
- `npm run build` — type-check and create `dist`
- `npm run preview` — preview the production bundle
- `npm run type-check` — run strict Vue/TypeScript checks
- `npm run lint` — run ESLint
- `npm run format` — format source and documentation
- `npm run test:unit` — run Vitest unit tests
- `npm run check` — type-check, lint, unit test, and production build

## Repository structure

```text
src/app             routing
src/assets/styles   tokens and global CSS
src/components      focused UI by feature
src/domain          framework-independent contracts
src/providers       swappable data adapters
src/stores          shared preferences and identity state
src/views           route-level composition
docs                product, architecture, integration, and deployment notes
public              local metadata assets
```

## Project continuity

Durable project memory lives in [`docs/continuity/PROJECT_STATE.md`](docs/continuity/PROJECT_STATE.md).
Read the [continuity guide](docs/continuity/README.md) before substantial work; decisions and
session handoffs preserve rationale and operational history without relying on chat transcripts.

## Current data status

Astrology's global temporal facts are calculated locally. `lunar-javascript` supplies the four
GanZhi pillars, a versioned 60 Jia Zi to 64 Da Gua table supplies their hexagrams, and a cited
two-hour table supplies the organ period. Interpretive forecasts and activity recommendations remain
explicitly unavailable. See [`docs/CALCULATION_SOURCES.md`](docs/CALCULATION_SOURCES.md) and
[`docs/DATA_INTEGRATION.md`](docs/DATA_INTEGRATION.md).

## Deployment summary

Cloudflare Pages should build `master` with `npm run build` and publish `dist`. Full settings and apex-domain steps are in `docs/DEPLOYMENT.md`. The placeholder production URL is `https://current-flow.net`; update it in `index.html`, `public/robots.txt`, and `public/sitemap.xml` when the canonical URL is known.

If no Git remote exists after the first commit:

```bash
git remote add origin https://github.com/basykcode/currentflow.git
git push -u origin master
```

## Next integration points

Add cross-library solar-term boundary fixtures, introduce a separate personal BaZi contract, and
connect constrained synthesis only after authoritative inputs and provenance are available.
