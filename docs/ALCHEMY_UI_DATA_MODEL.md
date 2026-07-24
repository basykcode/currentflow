# Alchemy UI data model

Alchemy uses a frontend domain model that describes what the interface must communicate. It is not
an OpenAPI mirror and does not expose Neo4j records or query concepts.

The source of truth is `src/features/alchemy/domain/types.ts`.

## Status meanings

`AlchemyDataStatus` applies to records, claims, relationship signals, analysis results, and retrieval
packages:

| Status            | UI meaning                                                                     |
| ----------------- | ------------------------------------------------------------------------------ |
| `demo`            | Obviously synthetic fixture data used to exercise the interface                |
| `verified`        | Verified under the connected provider's declared review process                |
| `source_reported` | A source reports the value; the interface does not elevate it to verified fact |
| `conflicted`      | More than one unresolved source-supported alternative exists                   |
| `incomplete`      | The record or result lacks relevant known fields or relationship coverage      |
| `unavailable`     | The provider cannot supply the datum                                           |

`ReviewStatus` describes record or citation review:

| Status              | UI meaning                                                     |
| ------------------- | -------------------------------------------------------------- |
| `synthetic_fixture` | Invented test material with no historical or medical authority |
| `machine_imported`  | Imported but not yet human reviewed                            |
| `human_reviewed`    | Reviewed under the provider's declared process                 |
| `disputed`          | Review found a substantive unresolved dispute                  |
| `superseded`        | Retained for provenance but replaced by a later record         |

Neither status vocabulary makes a clinical appropriateness or compatibility claim.

## Citations and source claims

`Citation` carries a stable source ID, title, optional locator, supplied URL, language, quotation, and
review status. Citation links are rendered only when the provider supplies a valid HTTP or HTTPS URL.

`SourceClaim<T>` keeps:

- stable claim identity and predicate;
- the provider-supplied value and optional normalized value;
- data status;
- one or more citations when available;
- an optional conflict-group ID so alternatives stay together and visible.

Claim-dependent fields use readonly arrays. Missing arrays render an explicit unavailable state; the
UI does not invent a neutral or empty interpretation.

## Material records

`HerbSummary` supports multilingual names, pinyin, Latin drug identity, biological names, aliases,
categories, status, review state, source count, and identity ambiguity.

`HerbDetail` adds source claims for biological source, medicinal part, preparation, nature, flavor,
channel, action, pattern, caution, and compound, plus related formula IDs and completeness counts.
The historical product name “herb” is retained in route and API interface naming even though the
domain can represent nonbotanical materials.

## Formula source records and local drafts

`FormulaDetail` is immutable received knowledge. Ingredient lines carry their own status and
citations. Variants, preparation notes, actions, patterns, cautions, conflicts, citations, and
completeness remain part of the source record.

`FormulaDraft` is user-controlled, device-local state:

- local ID and editable name;
- optional source formula ID;
- ordered ingredient lines;
- local notes and last-updated timestamp.

Each `FormulaIngredientLine` preserves the resolved material ID and display name, original amount
text, unit, optional preparation ID/label, optional traditional source role, and optional note.
Loading from the library deep-copies these values and never mutates the source record.

The storage envelope is versioned separately from the domain under
`current.alchemy.workbench.v1`.

## Analysis representation

`FormulaAnalysisResult` is provider output. It includes:

- algorithm and optional data version;
- normalized ingredients with explicit normalization status;
- duplicates and preparation variants;
- nature, flavor, channel, and category distributions;
- documented actions and patterns as source claims;
- pair relationships classified as documented relationship, no record found, data incomplete, or
  unsupported input;
- source conflicts, missing data, warnings, optional source coverage, and review-state counts.

There is deliberately no compatibility score and no safe/unsafe boolean.

`FormulaComparisonResult` covers two to four formulas with pairwise overlap, optional
provider-supplied Jaccard similarity, shared/unique/repeated ingredients, preparation differences,
combined distributions, shared/distinct actions and patterns, interaction signals, conflicts,
missing data, warnings, and version metadata. Similarity is ingredient identity overlap only.

## Text, graph, and retrieval representation

`TextPassageResult` preserves document, chapter/section, locator, language, text, matched terms,
linked entities, review status, data status, and citation.

`EntityNeighborhood` is a set of sourced directional relationships plus missing relationship groups.
The accessible list is authoritative; no raw Cypher or database identifiers beyond provider entity
IDs are shown.

`RetrievalContextResult` is a bounded package of selected passages, citations, linked entities,
source-backed graph facts, unresolved ambiguity, character count/budget, and source/review summary.
It intentionally has no model answer field.

## Transport-to-domain mapping principle

When API integration is added, generated OpenAPI types remain confined to
`src/features/alchemy/api`. Explicit mappers construct the domain types above. Components never
branch on raw response property names or problem documents.

Transport mapping must preserve uncertainty and absence. It must not:

- turn null or missing into a positive claim;
- collapse conflict alternatives;
- manufacture citation URLs;
- infer formula roles, preparations, units, contraindications, or relationships;
- treat “no record found” as documented compatibility.

## Known limitations

- Current knowledge is synthetic and intended only for interface evaluation.
- The HTTP provider and generated schema are integrated; connected mode still depends on a running
  configured API and private Neo4j service.
- Draft persistence is device-local, unencrypted browser storage and is not suitable for health
  history.
- Demo analysis is deterministic fixture behavior, not medical analysis.
- The Guided Inquiry route has no model connection and does not create answers.
