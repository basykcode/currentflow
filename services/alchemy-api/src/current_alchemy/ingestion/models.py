"""Typed adapter output before storage and pipeline control models."""

from datetime import UTC, datetime
from enum import StrEnum

from pydantic import Field

from current_alchemy.domain.common.exploration import RelationshipType
from current_alchemy.domain.common.models import ApiModel, EntityType

PropertyValue = str | int | float | bool | None | list[str]


class GraphLabel(StrEnum):
    CANONICAL_ENTITY = "CanonicalEntity"
    EXTERNAL_IDENTIFIER = "ExternalIdentifier"
    CANONICAL_NAME = "CanonicalName"
    ALIAS = "Alias"
    MAPPING_ASSERTION = "MappingAssertion"
    MEDICINAL_MATERIAL = "MedicinalMaterial"
    BOTANICAL_MATERIAL = "BotanicalMaterial"
    FUNGAL_MATERIAL = "FungalMaterial"
    MINERAL_MATERIAL = "MineralMaterial"
    ANIMAL_MATERIAL = "AnimalMaterial"
    TAXON = "Taxon"
    PREPARED_MATERIAL = "PreparedMaterial"
    PREPARATION_METHOD = "PreparationMethod"
    FORMULA_CONCEPT = "FormulaConcept"
    FORMULA_WITNESS = "FormulaWitness"
    INGREDIENT_USE = "IngredientUse"
    UNIT = "Unit"
    CHEMICAL_CLASS = "ChemicalClass"
    GENE = "Gene"
    PROTEIN = "Protein"
    PROTEIN_COMPLEX = "ProteinComplex"
    PATHWAY = "Pathway"
    REACTION = "Reaction"
    CONDITION = "Condition"
    DISEASE_CONCEPT = "DiseaseConcept"
    TRADITIONAL_TERM = "TraditionalTerm"
    PUBLICATION = "Publication"
    SOURCE_RELEASE = "SourceRelease"
    SOURCE_RECORD = "SourceRecord"
    LICENSE = "License"
    ADAPTER_VERSION = "AdapterVersion"
    SCHEMA_VERSION = "SchemaVersion"
    MAPPING_VERSION = "MappingVersion"
    PREDICATE_TERM = "PredicateTerm"
    EVIDENCE_TYPE = "EvidenceType"
    ASSERTION_METHOD = "AssertionMethod"
    COMPOUND_OCCURRENCE = "CompoundOccurrence"
    BIOACTIVITY_OBSERVATION = "BioactivityObservation"
    TOXICITY_OBSERVATION = "ToxicityObservation"
    EXPOSURE_OBSERVATION = "ExposureObservation"
    CLINICAL_EVIDENCE_RECORD = "ClinicalEvidenceRecord"
    PREDICTION = "Prediction"
    TEXT_WORK = "TextWork"
    EDITION = "Edition"
    TEXT_WITNESS = "TextWitness"
    GRAPH_PROJECTION = "GraphProjection"


class GraphRelationshipType(StrEnum):
    HAS_RELEASE = "HAS_RELEASE"
    USES_LICENSE = "USES_LICENSE"
    IMPORTED_RELEASE = "IMPORTED_RELEASE"
    USED_ADAPTER = "USED_ADAPTER"
    USED_SCHEMA = "USED_SCHEMA"
    USED_MAPPING = "USED_MAPPING"
    CONTAINS_RECORD = "CONTAINS_RECORD"
    HAS_EXTERNAL_IDENTIFIER = "HAS_EXTERNAL_IDENTIFIER"
    MAPPING_SUBJECT = "MAPPING_SUBJECT"
    MAPPING_TARGET = "MAPPING_TARGET"
    HAS_NAME = "HAS_NAME"
    ALIAS_OF = "ALIAS_OF"
    HAS_PREPARED_FORM = "HAS_PREPARED_FORM"
    USES_PROCESS = "USES_PROCESS"
    HAS_WITNESS = "HAS_WITNESS"
    HAS_INGREDIENT_USE = "HAS_INGREDIENT_USE"
    USES_MATERIAL = "USES_MATERIAL"
    USES_PREPARED_MATERIAL = "USES_PREPARED_MATERIAL"
    USES_PREPARATION = "USES_PREPARATION"
    HAS_UNIT = "HAS_UNIT"
    RELATED_TO = "RELATED_TO"
    IS_A = "IS_A"
    PREDICATE = "PREDICATE"


class PipelineMode(StrEnum):
    SUBSET = "subset"
    FULL = "full"


class PipelinePhase(StrEnum):
    ACQUIRE = "acquire"
    VERIFY = "verify"
    EXTRACT = "extract"
    INSPECT_SCHEMA = "inspect_schema"
    STAGE = "stage"
    NORMALIZE = "normalize"
    MAPPINGS = "mappings"
    GRAPH = "graph"
    AUDIT = "audit"
    REPORT = "report"


class PipelineCheckpoint(ApiModel):
    source_id: str
    release_id: str
    import_run_id: str
    completed_phases: list[PipelinePhase] = Field(default_factory=list)
    phase_results: dict[str, dict[str, object]] = Field(default_factory=dict)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class NodeUpsert(ApiModel):
    entity_type: EntityType | GraphLabel
    additional_labels: list[GraphLabel] = Field(default_factory=list)
    id: str = Field(min_length=1, max_length=220)
    properties: dict[str, PropertyValue]


class RelationshipUpsert(ApiModel):
    id: str = Field(min_length=1, max_length=300)
    source_id: str
    target_id: str
    relationship_type: RelationshipType | GraphRelationshipType
    properties: dict[str, PropertyValue] = Field(default_factory=dict)


class IngestionBatch(ApiModel):
    nodes: list[NodeUpsert] = Field(default_factory=list)
    relationships: list[RelationshipUpsert] = Field(default_factory=list)
    raw_records_preserved: int = Field(default=0, ge=0)
    unresolved_fields: list[str] = Field(default_factory=list)
