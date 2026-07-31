# Yijing transformation provenance

The Transformation Lab separates four questions that are often collapsed: what operation ran, what
target it produced, how that operation is historically classified, and whether an interpretation is
available.

## Definition contract

Each `TransformationDefinition` has a stable ID, names and aliases, family, transformation class,
input requirement, result kind, implementation status, explanation, and provenance:

- `tradition` is a plain-language scope such as Classical structural, Textual relation, Jing Fang
  lineage, Daoist alchemical, or Current formalization.
- `sourceIds` contain repository-stable identifiers, not unreviewed web links or prose citations.
- `canonicality` is one of `widely-attested`, `historically-attested`, `lineage-specific`, `variant`,
  `current-formalization`, or `source-required`.

Definitions classify operations. They do not claim that every operation belongs to a single Yijing
lineage or that every line-derived construction is ancient.

## Result contract

Each `TransformationResult` identifies the source, optional target, changed lines, intermediate
targets, operation labels, provenance, data status, and interpretation status.

| Field                         | Meaning                                                    |
| ----------------------------- | ---------------------------------------------------------- |
| `status: available`           | A non-self deterministic or source-derived target exists.  |
| `status: self-mapping`        | The operation is valid but returns the source figure.      |
| `status: source-needed`       | A named source table or corpus is absent.                  |
| `status: not-applicable`      | Required user context, such as moving lines, is absent.    |
| `status: unavailable`         | The result is deliberately disabled or cannot be supplied. |
| `dataStatus: computed`        | A documented deterministic operation produced the value.   |
| `dataStatus: source-derived`  | A connected, reviewed table supplied the relation.         |
| `dataStatus: current-derived` | Current combined or iterated documented operations.        |
| `dataStatus: unavailable`     | No displayable result exists.                              |

Interpretation is independent:

- `structural-only` means the target is valid but no interpretive content is connected.
- `source-needed` means interpretation must not be generated from the target.
- `available` requires an identifiable reviewed content record.

## UI rules

The shared result card displays operation, target identity, changed lines, canonicality, tradition,
source/availability status, and interpretation status. A self mapping remains inspectable but does
not push navigation history. Source-needed modules state the exact missing input and render no
placeholder target.

Jiaoshi Yilin is a directed `(fromHexagram, toHexagram)` transition record. It must never be shown as
static endpoint commentary, reconstructed from memory, or treated as available because a target
hexagram exists.

The Base single-line selector joins its calculated result to a 384-route Forest subset only after
both ordered endpoints are known. Those original paraphrases remain visibly draft-only and do not
claim the complete 64 × 64 Yilin module is available.

No raw or normalized commentary evidence is bundled into the SPA. Any later commentary connection
must use the public generated commentary contract, preserve its own content/provenance identifiers,
and remain independent of structural calculation.
