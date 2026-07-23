# Decision: Ship the alpha as a static client-side Vue SPA

- Status: accepted
- Date (UTC): 2026-07-23
- Scope: Application architecture and deployment

## Context

The first alpha needs a responsive multi-route product shell, a functional Astrology proof of concept,
and deliberate placeholders without paid services, secrets, backend infrastructure, or production
identity.

## Constraints and requirements

- Vue 3, Vite, strict TypeScript, Vue Router, Pinia, Vitest, and npm are the required stack.
- The alpha must make no hidden network calls and store no secrets.
- Only device-local preferences need persistence.
- Deployment must be compatible with static Cloudflare Pages Git builds from `master`.

## Options considered

1. **Static client-side Vue SPA with local preference storage** — accepted because it satisfies the
   alpha scope and deployment constraints with no service dependency.
2. **Server-rendered framework or custom backend** — rejected for the alpha because it adds runtime
   infrastructure without a requested server capability.
3. **Third-party auth, database, AI, or component SDKs** — rejected because those integrations are not
   active and their data/privacy boundaries are not yet defined.

## Decision

Use a static Vue 3/Vite SPA with lazy client-side routes, framework-independent domain contracts,
focused components, and Pinia only for shared preference/identity scaffolds. Persist theme, timezone,
and optional location label in browser storage. Build `dist` for Cloudflare Pages.

## Rationale and supporting evidence

The current application implements all requested routes without runtime services. `package.json`
contains only Vue, Router, and Pinia runtime dependencies. Architecture and deployment documents
describe a client-only runtime and static `dist` output.

## Consequences and tradeoffs

- Local development and static deployment are simple and contain no secrets.
- Route views can be split and evolved independently.
- Preferences do not synchronize across devices.
- Auth, personal data, durable records, server-side security boundaries, and AI require later
  architecture decisions.

## Implementation or migration implications

- Keep static-hosting compatibility until a separately accepted capability requires a backend.
- Add external SDKs only with an explicit decision and documented privacy/security boundaries.
- Update Cloudflare settings and metadata when the canonical domain is confirmed.

## Verification criteria

- `npm run check` passes and produces `dist`.
- Runtime source contains no unintended network requests or service credentials.
- Theme and local preferences work without a backend.
- Vite base remains `/` and no top-level `404.html` is introduced.

## Supersedes

None.

## Superseded by

None.

## Related files, issues, handoffs, and commits

- [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md)
- [`../../DEPLOYMENT.md`](../../DEPLOYMENT.md)
- [`../../../package.json`](../../../package.json)
- [`../../../src/app/router.ts`](../../../src/app/router.ts)
- [`../../../src/stores/preferences.ts`](../../../src/stores/preferences.ts)
- Commit `29183c3beaacac928f9731a35e20004c6f17a835`
