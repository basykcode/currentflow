# Alchemy frontend integration

This document describes how to connect the Vue Alchemy feature to the backend-owned OpenAPI
contract without guessing transport fields.

## Ownership and current state

The backend owns:

- `contracts/alchemy-openapi.json`;
- API route and problem-response schemas;
- server validation rules, capabilities, algorithm versions, and data versions.

The frontend owns:

- `src/features/alchemy/domain`;
- `AlchemyProvider`;
- transport-to-domain mapping;
- provider injection and user-visible connection state;
- component behavior and device-local drafts.

The initial frontend and backend were developed concurrently. Their boundary is now integrated:
the backend contract includes source-backed summary properties, document titles, mentioned
entities, unfiltered text listing, and exact passage-ID retrieval; the frontend includes generated
types, pure mappers, and `HttpAlchemyProvider`. API mode never falls back to demo data.

## Expected paths and command

The checked-in contract path is:

```text
contracts/alchemy-openapi.json
```

The generated TypeScript path is:

```text
src/features/alchemy/api/generated/schema.ts
```

When the backend contract changes:

```powershell
npm run alchemy:openapi
npm run alchemy:types
```

The `alchemy:types` script invokes:

```text
openapi-typescript contracts/alchemy-openapi.json -o src/features/alchemy/api/generated/schema.ts
```

Generation is deliberately not part of `npm run build`; demo builds must remain independent of a
missing backend contract.

## Provider and mapping layer

`src/features/alchemy/providers/httpAlchemyProvider.ts` uses the generated `paths` type and an
`openapi-fetch` client. Components continue to consume only frontend domain models.

The explicit mapper under `src/features/alchemy/api/mappers.ts`:

1. receive the exact generated response type for one operation;
2. validate nullable, optional, and union behavior that affects the UI;
3. translate transport enums and field names into the frontend domain;
4. preserve identifiers, source status, review status, citations, conflicts, and missing-data
   semantics;
5. reject unsupported or contradictory transport values with a normalized `AlchemyUiError`;
6. never create a citation, claim, contraindication, amount, status, or relationship that the
   transport did not supply.

Do not export raw transport objects from the provider. Do not redefine response bodies by hand.

## Runtime configuration

```dotenv
VITE_ALCHEMY_DATA_MODE=demo
VITE_ALCHEMY_DATA_MODE=api
VITE_ALCHEMY_API_BASE_URL=http://localhost:8000
VITE_ALCHEMY_REQUEST_TIMEOUT_MS=10000
```

The local backend default is `http://localhost:8000`. Do not display that URL, credentials, request
headers, or internal host details in the user interface.

In API mode:

- create one abort controller per active request;
- combine the caller signal with the configured timeout;
- abort superseded search requests;
- map backend problem documents into `AlchemyUiError`;
- expose connected, degraded, disconnected, or not-configured status;
- never catch an API error and issue a demo request.

## Completed integration checklist

1. Reviewed operation IDs, response envelopes, pagination, nullability, status fields, and errors.
2. Installed `openapi-fetch` and `openapi-typescript`; generated and checked in `schema.ts`.
3. Added typed mappers for every provider result and request.
4. Implemented every `AlchemyProvider` method in `HttpAlchemyProvider`.
5. Added source-backed summary properties and exact selected-passage retrieval to the backend
   contract rather than inferring missing fields in the browser.
6. Added success, problem, request-ID, timeout, and no-fallback provider tests.
7. Kept demo mode explicit and network-free.

## Endpoint verification matrix

Use the exact generated operation ID and path for each row. Path names are intentionally not guessed
here.

| Frontend provider method | Verify against the generated operation                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| `getStatus`              | Connected/degraded/disconnected state and public version fields                                     |
| `getCapabilities`        | Filter availability, supported units, maximum comparison formulas, optional features                |
| `searchHerbs`            | Name/alias/Chinese/pinyin/Latin search, every supported filter, pagination, partial result          |
| `getHerb`                | Direct ID load, claims, citations, conflicts, completeness, related formula IDs, not found          |
| `searchFormulas`         | Search, category/ingredient/action/pattern/source/review filters, pagination                        |
| `getFormula`             | Variants, ingredients, preparations, source roles, claims, conflicts, citations                     |
| `analyzeFormula`         | Validation problems, normalized rows, distributions, interactions, conflicts, coverage and versions |
| `compareFormulas`        | Two/three/four inputs, overlap, unique/repeated rows, differences, interactions and warnings        |
| `searchTexts`            | Language/source/document/review filters, matched terms, linked entities, citation locators          |
| `getEntityNeighborhood`  | Direction, relationship type, statuses, citation counts, missing relationship groups                |
| `buildRetrievalContext`  | Selected passages, citations, entities, graph facts, ambiguity, character budget and review summary |

For every operation, test:

- successful and empty responses;
- caller cancellation and configured timeout;
- authentication/authorization response if the contract defines one;
- validation and field errors;
- not-found and unavailable responses;
- partial or degraded data;
- request ID preservation without internal error leakage.

## Contract evolution rules

When a generated field conflicts with the frontend domain:

1. stop the mapper at that boundary;
2. record the exact operation, generated type, and domain requirement;
3. resolve ownership with the backend rather than adding an alias that hides the mismatch;
4. update the contract or intentionally revise the frontend domain;
5. regenerate and update tests.

If a required frontend field is absent, represent that knowledge as unavailable only when the
contract provides enough information to do so. Otherwise fail the mapping visibly. Never infer a
transport field from fixture shape, route naming, database concepts, or prose documentation.
