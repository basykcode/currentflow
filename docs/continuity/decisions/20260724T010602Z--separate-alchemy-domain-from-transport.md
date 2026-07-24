# Decision: Separate the Alchemy frontend domain from transport

- Status: accepted
- Date (UTC): 2026-07-24
- Scope: Alchemy frontend architecture, runtime data modes, and local draft storage

## Context

The Alchemy interface needed to become usable while its backend and OpenAPI contract were being
developed concurrently. The frontend must make synthetic data unmistakable, expose provenance and
missing knowledge, remain useful without a service, and avoid coupling Vue components to an
in-flight transport schema.

## Constraints and requirements

- Components must consume precise frontend domain models rather than raw OpenAPI responses.
- Demo mode must be deterministic, visibly synthetic, cancellable, and free of network calls.
- API mode must never silently substitute demo data when the service or generated client is absent.
- Substantive analysis and comparison must come from the active provider, not from presentation code.
- Formula drafts are device-local and must not enter URLs or remote storage.
- The normal demo build must not depend on the backend contract.

## Options considered

1. **Bind components directly to OpenAPI types** — reduces initial mapping work but couples the UI to
   transport churn and makes demo and future adapters difficult to substitute. Rejected.
2. **Fall back to fixtures when API mode fails** — keeps screens populated but disguises the active
   data source and risks presenting synthetic claims as connected knowledge. Rejected.
3. **Use an injected frontend provider with explicit demo and unavailable implementations** — keeps
   the domain stable, makes data mode visible, and leaves a deliberate transport-mapping seam.
   Accepted.

## Decision

Define an immutable, frontend-owned Alchemy domain and an injected `AlchemyProvider` interface.
Route-local composables own ordinary searches and details; a focused Pinia store owns only the
cross-route formula workbench. Bind demo mode to a deterministic `DemoAlchemyProvider`. Until
generated OpenAPI types and a reviewed mapping layer are integrated, bind API mode to
`ContractUnavailableAlchemyProvider`, which returns a visible, retryable unavailable state and never
falls back to fixtures.

Persist up to four drafts under the versioned key `current.alchemy.workbench.v1`. Validate persisted
data before hydration, recover from corruption without crashing, and keep source formula records
immutable when copied into drafts.

## Rationale and supporting evidence

The provider boundary allows the complete research workflow to be designed and tested without
inventing backend response bodies. It also makes provider status and capability differences
first-class UI state. Separating draft state from retrieved knowledge prevents device-local user
composition from being mistaken for source data.

## Consequences and tradeoffs

- A transport-to-domain mapping layer is required after backend integration.
- API mode intentionally remains unavailable until generated types and endpoint mappings are
  reviewed.
- Demo analysis is useful for interaction testing but remains synthetic and provider-returned.
- Drafts are limited to the current browser/device and have no synchronization or account recovery.
- Provider capabilities, status, and errors must remain visible throughout future integrations.

## Implementation or migration implications

- Generate transport types into `src/features/alchemy/api/generated/schema.ts`.
- Implement `HttpAlchemyProvider` and pure mapping functions under the Alchemy feature boundary.
- Add mapping and problem-response tests before enabling API mode.
- Bump the local-storage schema version and add a migration before changing persisted draft shape.

## Verification criteria

- Demo mode makes no network calls and marks all knowledge as synthetic.
- API mode reports `Alchemy API client not generated` without affecting non-Alchemy routes.
- Search cancellation, direct routes, workbench persistence, analysis, comparison, and retrieval
  context pass unit/component and browser verification.
- `npm run check` passes.

## Supersedes

None.

## Superseded by

None.

## Related files, issues, handoffs, and commits

- [`../../ALCHEMY_FRONTEND.md`](../../ALCHEMY_FRONTEND.md)
- [`../../ALCHEMY_FRONTEND_INTEGRATION.md`](../../ALCHEMY_FRONTEND_INTEGRATION.md)
- [`../../ALCHEMY_UI_DATA_MODEL.md`](../../ALCHEMY_UI_DATA_MODEL.md)
- [`../../../src/features/alchemy/domain/provider.ts`](../../../src/features/alchemy/domain/provider.ts)
- [`../../../src/features/alchemy/providers/providerInjection.ts`](../../../src/features/alchemy/providers/providerInjection.ts)
