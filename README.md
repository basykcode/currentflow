# Current ~ Flow

Current is a situational-awareness instrument for timing: a calm precision almanac that keeps global conditions, personal context, and their interface distinct. This repository is the first clean product alpha, not a verified traditional calculation engine.

## Alpha scope

The Astrology route is a functional proof of concept powered by a plainly labeled demo provider. Alchemy, Intelligence, Other Tools, authentication, and deeper factor exploration are deliberate nonconnected previews. Settings for theme and local preferences work on the current device.

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

## Current data status

All Astrology content is polished demo fixture data. It is not the actual present temporal configuration, and the displayed hexagrams and relationships were not calculated. The adapter boundary and provenance fields are ready for verified sources; see `docs/DATA_INTEGRATION.md`.

## Deployment summary

Cloudflare Pages should build `master` with `npm run build` and publish `dist`. Full settings and apex-domain steps are in `docs/DEPLOYMENT.md`. The placeholder production URL is `https://current-flow.net`; update it in `index.html`, `public/robots.txt`, and `public/sitemap.xml` when the canonical URL is known.

If no Git remote exists after the first commit:

```bash
git remote add origin https://github.com/basykcode/current-flow.git
git push -u origin master
```

## Next integration points

Implement a verified `CurrentFlowProvider`, add the deterministic organ-clock engine, introduce a separate personal BaZi contract, and connect constrained synthesis only after authoritative inputs and provenance are available.
