# Decision: Use dedicated Alchemy branches and CMP publication gates

- Status: accepted
- Date (UTC): 2026-07-24
- Scope: Alchemy workstream coordination and publication

## Decision

Maintain `master` as the published integration baseline. Use `feat/alchemy-backend` for backend
changes, `feat/alchemy-frontend` for frontend changes, and `feat/alchemy-integration` for
contract-alignment work in this chat. A `CMP` instruction is explicit authorization to commit the
scoped changes, merge approved work into the integration branch or `master`, and push the result.

## Rationale

The backend and frontend were developed concurrently in one dirty worktree. Their shared OpenAPI
boundary requires review before an HTTP provider can be added without inventing data. Dedicated
branches make ownership and review visible; a short explicit publication command prevents an
accidental merge or push while that boundary is under review.

## Consequences

- Do not use broad staging while the worktree contains multiple workstreams.
- Until `CMP`, work may be verified locally but must not be committed, merged, or pushed.
- Each future chat receives a dedicated branch before tracked changes are made.
