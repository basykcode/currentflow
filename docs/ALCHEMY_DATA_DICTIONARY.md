# Alchemy knowledge data dictionary

All nodes and relationships use stable application IDs. Original source values are retained;
normalized display/search fields are conveniences.

## Provenance and release nodes

| Label | Required identity | Purpose |
| --- | --- | --- |
| `Source` | `id` / source ID | Dataset, ontology, publication collection, or corpus |
| `License` | stable license snapshot ID | Release-relevant rights and evidence |
| `SourceRelease` | source + release ID | Immutable version/checksum and production status |
| `SourceRecord` | source + release + record key | Preserved source-owned record and original fields |
| `ImportRun` | source + release + version digest | One deterministic ingestion execution |
| `AdapterVersion` | adapter + version | Parser/transform implementation |
| `SchemaVersion` | schema version | Normalized schema contract |
| `MappingVersion` | mapping version | Identity-resolution rule set |
| `GraphProjection` | projection name + version | Rebuild status and timestamp |

## Identity nodes

| Label | Meaning |
| --- | --- |
| `CanonicalEntity` | Shared super-label for governed canonical identity |
| `ExternalIdentifier` | Namespace and exact source value |
| `CanonicalName` | Preferred canonical display name |
| `Alias` | Source-retained synonym, abbreviation, or alternate label |
| `MappingAssertion` | Reified, versioned source-record-to-canonical mapping |

Specialized canonical labels include `MedicinalMaterial`, `BotanicalTaxon`, `MedicinalPart`,
`Preparation`, `PreparedMaterial`, `FormulaConcept`, `Compound`, `Protein`, `Gene`, `Pathway`,
`DiseaseConcept`, `Condition`, `TraditionalPattern`, `SymptomTerm`, `Action`, `ThermalNature`,
`Flavor`, `Channel`, `Tissue`, `ExposureContext`, `Geography`, and `TimeContext`.

## Evidence nodes

| Label | Key fields | Rule |
| --- | --- | --- |
| `Claim` | predicate, value/object, qualifier, status | Must be `SUPPORTED_BY` a source record |
| `FormulaWitness` | source formula name, citation/passage, variant | A source-specific formula attestation |
| `IngredientUse` | amount, unit, sequence, role, preparation text | Reified per witness; no inferred Jun/Chen/Zuo/Shi role |
| `CompoundOccurrence` | material, compound, value/unit, context | Observed occurrence, not a prediction |
| `BioactivityObservation` | compound/target, assay, value/unit | Source-measured activity |
| `ToxicityObservation` | subject, endpoint, dose/value/unit | Source-reported toxicity |
| `ExposureObservation` | subject, route/context, value/unit | Source-reported exposure |
| `Prediction` | model/method/version, score | Always separate from observations |
| `Document` / `Passage` | document identity, locator, rights | Citation-addressable text evidence |

## Core relationships

| Relationship | Meaning |
| --- | --- |
| `HAS_RELEASE`, `USES_LICENSE`, `CONTAINS_RECORD` | Source/release evidence chain |
| `IMPORTED_RELEASE`, `USED_ADAPTER`, `USED_SCHEMA`, `USED_MAPPING` | Import-run reproducibility |
| `SUPPORTED_BY`, `EXTRACTED_FROM` | Evidence link |
| `MAPPING_SUBJECT`, `MAPPING_TARGET` | Reified identity assertion |
| `HAS_NAME`, `ALIAS_OF`, `HAS_EXTERNAL_IDENTIFIER` | Governed identity vocabulary |
| `SUBJECT`, `OBJECT` | Reified claim endpoints |
| `HAS_FORMULA_WITNESS`, `HAS_INGREDIENT_USE` | Formula concept to sourced composition |
| `USES_MATERIAL`, `USES_PREPARED_MATERIAL` | Ingredient-use identity |
| `OBSERVED_IN`, `MEASURES`, `TARGETS` | Observation context |
| `IS_A` | Regenerable canonical hierarchy projection |

## Common governance fields

`display_name`, `review_status`, `production_eligible`, `source_id`, `release_id`,
`mapping_version`, and `data_status` make availability and provenance visible. Numeric measurements
require a unit when the source supplies a value. Unknown and unavailable are represented explicitly;
they are never replaced by zero, compatibility, or a fabricated claim.
