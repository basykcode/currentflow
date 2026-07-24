# Alchemy frontend

Alchemy is a source-aware research area inside the Current Vue SPA. The current frontend is complete
enough to evaluate in deterministic demo mode without a knowledge graph or API. It does not diagnose,
recommend, prescribe, or send data to an AI service.

## Feature architecture

Alchemy lives under `src/features/alchemy` and keeps the following boundaries:

- `domain/`: frontend knowledge, formula, comparison, retrieval, provider, error, and validation
  types. These are independent of Vue and future OpenAPI transport types.
- `fixtures/`: obviously synthetic records with `demo:` identifiers and
  `synthetic_fixture` review states.
- `providers/`: the injected `AlchemyProvider`, deterministic `DemoAlchemyProvider`, typed
  `HttpAlchemyProvider`, and explicit unavailable provider for missing or invalid API configuration.
- `api/`: the checked-in generated OpenAPI schema and pure transport-to-domain mappers.
- `composables/`: cancellable async-resource state and the shell-provided capability/status context.
- `stores/`: the versioned, device-local formula workbench. Search and detail results do not enter
  Pinia.
- `components/`: claim, citation, status, relationship, editor, analysis, and comparison
  presentation.
- `views/`: route-level search, selection, and action composition.
- `alchemy.routes.ts`: lazy child routes beneath the existing `/alchemy` application route.
- `alchemy.css`: responsive feature styling scoped beneath `.alchemy-shell`.

The active provider is installed once in `src/main.ts` and injected. Vue components do not import a
provider singleton.

## Routes

- `/alchemy` redirects to `/alchemy/materia-medica`.
- `/alchemy/materia-medica` is the three-panel material research terminal.
- `/alchemy/materia-medica/:herbId` directly loads a material record.
- `/alchemy/formulas` searches source-formula records.
- `/alchemy/formulas/:formulaId` directly loads a formula record.
- `/alchemy/workbench` manages one to four local formula drafts.
- `/alchemy/texts` searches passages and prepares retrieval context.
- `/alchemy/inquiry` previews the future source-bounded inquiry workflow with no connected model.

Search text and basic filters use route query parameters. Draft contents never enter the URL.

## Major components

- `AlchemyShell` owns the title, internal navigation, provider status, persistent research boundary,
  and child outlet.
- `DataStatusBadge` and `ReviewStatusBadge` keep availability and review meaning in visible text.
- `ClaimGroup`, `CitationList`, and `CompletenessSummary` expose claim-level provenance, conflicts,
  source counts, and missing fields.
- `EntityNeighborhoodList` is the authoritative accessible relationship representation; no graph
  visualization dependency is used.
- `IngredientEditor` preserves each local row, unresolved identity, original amount text,
  preparation, optional source role, and note.
- `AnalysisResultPanel` and `ComparisonResultPanel` render only provider-returned substantive
  results. They use tables and CSS bars, never a single compatibility score.

## Demo mode

Demo mode is the default:

```powershell
Copy-Item .env.example .env.local
npm run dev
```

`DemoAlchemyProvider` performs no runtime network calls. Its modest fixed latency exercises local
loading and cancellation. The fixtures cover multilingual identity, aliases, preparations,
categories, actions, patterns, compounds, citations, conflicts, incomplete records, four formulas,
ingredient overlap, preparation variants, documented synthetic co-occurrence, missing interaction
records, passage search, retrieval packaging, and relationship neighborhoods.

All fixture IDs begin with `demo:`. All citations use `synthetic_fixture`. The UI repeatedly labels
the active source `Synthetic demo data`; fixture relationships never claim traditional or medical
authority.

## API mode

Set `VITE_ALCHEMY_DATA_MODE=api` with `VITE_ALCHEMY_API_BASE_URL` to activate
`HttpAlchemyProvider`. It maps every `AlchemyProvider` operation through the backend-owned OpenAPI
contract, including formula analysis/comparison, graph neighborhoods, text search, and exact
selected-passage retrieval. Caller cancellation and the configured timeout are combined per
request; backend problem details and request IDs become typed UI errors.

If the URL is missing or invalid, the explicit unavailable provider disables API capabilities.
Reachability or backend errors stay visible and never trigger a synthetic fallback.

The exact contract integration sequence is in
[`ALCHEMY_FRONTEND_INTEGRATION.md`](ALCHEMY_FRONTEND_INTEGRATION.md).

## Workbench state

The workbench stores up to four formula drafts under:

```text
current.alchemy.workbench.v1
```

The stored envelope includes a schema version, drafts, and the active draft ID. Reads validate every
required draft and ingredient field. A corrupt, incompatible, or oversized value becomes an empty
workspace instead of crashing the application. Analysis and comparison results are session state;
draft contents persist only on the device and are never sent to a server by the store.

The editor:

- never merges duplicate rows;
- distinguishes exact duplicates from preparation variants;
- accepts an unspecified amount and preserves original amount text;
- rejects nonnumeric, zero, and negative amounts;
- flags unsupported units and unresolved material identities;
- never converts traditional units or infers preparation or traditional roles.

## Accessibility and mobile behavior

Alchemy uses semantic headings, labeled controls, native buttons/links/details, visible focus,
text-bearing status badges, `aria-live` result/action messaging, contained table scrolling, and
minimum practical touch targets. The application-level reduced-motion rule applies to the feature.

At mobile widths, research controls and result lists become single-column. A selected material or
formula uses its direct detail route as the focused view with a return link. Formula rows reflow into
labeled fields, provenance remains visible, and no page-level horizontal scrolling is required.

## Safety boundaries

The shell always displays:

> Research and educational information only. Not diagnosis or medical treatment.

The frontend does not collect symptoms or health history. It does not compute medical analysis in
components, claim compatibility from missing data, show safe/unsafe judgments, create an AI answer,
or call an external model. Only the active provider may return substantive formula analysis.

## Development commands

```powershell
npm install
npm run dev
npm run format
npm run type-check
npm run lint
npm run test:unit
npm run build
npm run check
```

The generated schema is checked in, so ordinary builds require no running backend. Demo mode makes no
runtime API requests.
