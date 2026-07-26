# Alchemy API

## Contract and conventions

The stable contract is [`../contracts/alchemy-openapi.json`](../contracts/alchemy-openapi.json).
The base URL is `http://localhost:8000/api/v1`. Frontends should configure the origin separately
from the `/api/v1` prefix and must not reproduce backend fixtures as a second contract.

Knowledge responses use:

```json
{
  "data": {},
  "meta": {
    "requestId": "4a3f...",
    "dataStatus": "incomplete",
    "sources": [],
    "warnings": ["Educational and research information only; not medical advice."],
    "generatedAt": "2026-07-24T00:00:00Z",
    "schemaVersion": "alchemy-graph-v2",
    "algorithmVersion": null
  }
}
```

All responses return `X-Request-ID`. Callers may supply a safe request ID. Errors use
`type`, `title`, `status`, stable `code`, `detail`, `requestId`, and typed `errors`.

## Endpoints

| Area           | Endpoints                                                             |
| -------------- | --------------------------------------------------------------------- |
| Service        | `GET /health/live`, `GET /health/ready`, `GET /meta`                  |
| Discovery      | `GET /search/suggest`                                                 |
| Herbs          | `GET /herbs`, `GET /herbs/{herb_id}`                                  |
| Formulas       | `GET /formulas`, `GET /formulas/{formula_id}`                         |
| Sources/text   | `GET /sources`, `GET /documents`, detail routes, `GET /text/search`   |
| Graph          | `GET /graph/entities/{entity_id}/neighborhood`, `POST /explore/query` |
| Workbench      | `POST /formulas/analyze`, `POST /formulas/compare`                    |
| Retrieval      | `POST /retrieval/context`                                             |
| Future inquiry | `POST /inquiry/synthesize` always returns `501 model_not_connected`   |

Search filters, offsets, and limits are documented in OpenAPI. Ordering is deterministic and limits
are capped at 100. Entity identity ambiguity is returned rather than silently resolved.

## Formula example

```json
{
  "composition": {
    "name": "Research draft",
    "ingredients": [
      {
        "herbMaterialId": "demo:herb:azure-root",
        "amount": "500",
        "unit": "mg",
        "role": "source supplied role"
      },
      {
        "herbMaterialId": "demo:herb:amber-seed",
        "amount": "1",
        "unit": "g"
      }
    ]
  }
}
```

The response preserves the original input and returns normalized lines, exact duplicates, base
material/preparation distinctions, exact metric totals, unresolved units, classifications, sourced
actions/patterns, explicit roles, documented or unknown pair signals, claim conflicts, missing data,
source coverage, review breakdown, `alchemy-formula-analysis-v0`, and the active data version.

Comparison accepts two to four compositions and adds pairwise overlap, Jaccard similarity, shared
and unique ingredients, preparation differences, repeats, combined distributions, shared/distinct
actions and patterns, cross-formula signals, conflicts, warnings, and completeness. There is no
compatibility or safety score.

## Constrained exploration example

```json
{
  "startEntityType": "HerbMaterial",
  "textQuery": "azure",
  "exactPropertyFilters": {
    "reviewStatus": "synthetic_fixture"
  },
  "relationshipTypes": ["HAS_ACTION", "SUPPORTED_BY"],
  "direction": "both",
  "maximumDepth": 2,
  "resultLimit": 25,
  "projectionFields": ["id", "displayName", "entityType"]
}
```

Labels, relationships, properties, projections, depth, and limit are allowlisted. Raw Cypher,
procedures, writes, unknown schema elements, and depth greater than two are rejected.

## Frontend handoff

| Surface                    | Backend contract                                                           |
| -------------------------- | -------------------------------------------------------------------------- |
| Materia Medica Terminal    | suggest, herb search/detail, source detail, graph neighborhood             |
| Formula Workbench          | formula search/detail and one-composition analysis                         |
| Formula Comparison         | two-to-four composition comparison                                         |
| Text Search                | document list/detail, text search, passage detail, retrieval context       |
| Guided Inquiry placeholder | show disabled state from `501 model_not_connected`; do not simulate advice |

Seed the fictional UI data with `npm run alchemy:seed`. The alpha has no auth, user workspace,
conversation, health-history, vector search, diagnosis, recommendation, or production traditional
dataset. Every `demo:` value must remain visibly identified as synthetic in the UI.
