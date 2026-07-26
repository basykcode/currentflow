"""Canonical identity, formula-witness, claim, and observation contracts."""

import re
from datetime import datetime
from enum import StrEnum
from hashlib import sha256
from typing import Annotated, Literal

from pydantic import Field, model_validator

from current_alchemy.domain.common.models import ApiModel, ReviewStatus
from current_alchemy.domain.common.normalization import normalize_name

_INCHIKEY = re.compile(r"^[A-Z]{14}-[A-Z]{10}-[A-Z]$")
_SAFE_ID = re.compile(r"[^a-z0-9._-]+")


def stable_id(namespace: str, invariant_identifier: str) -> str:
    """Create a readable stable ID from an invariant identifier, never a display name."""

    normalized_namespace = _SAFE_ID.sub("-", namespace.casefold()).strip("-")
    identifier = invariant_identifier.strip()
    if not normalized_namespace or not identifier:
        raise ValueError("stable IDs require a namespace and invariant identifier")
    compact = _SAFE_ID.sub("-", identifier.casefold()).strip("-")
    if compact and len(compact) <= 120:
        return f"{normalized_namespace}:{compact}"
    digest = sha256(identifier.encode("utf-8")).hexdigest()[:24]
    return f"{normalized_namespace}:sha256:{digest}"


class MappingRelation(StrEnum):
    EXACT = "exact"
    SAME_AS = "same_as"
    BROADER_THAN = "broader_than"
    NARROWER_THAN = "narrower_than"
    RELATED_TO = "related_to"
    POSSIBLE_MATCH = "possible_match"
    REJECTED_MATCH = "rejected_match"


class MappingMethod(StrEnum):
    EXACT_EXTERNAL_IDENTIFIER = "exact_external_identifier"
    EXACT_SCIENTIFIC_NAME = "exact_scientific_name"
    EXACT_INCHIKEY = "exact_inchikey"
    CURATED_CROSSWALK = "curated_crosswalk"
    NORMALIZED_NAME = "normalized_name"
    FUZZY_CANDIDATE = "fuzzy_candidate"
    HUMAN_REVIEW = "human_review"


class MappingStatus(StrEnum):
    PROPOSED = "proposed"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    NEEDS_REVIEW = "needs_review"


class MappingAssertionRecord(ApiModel):
    id: str
    subject_id: str
    target_id: str
    relation: MappingRelation
    method: MappingMethod
    status: MappingStatus
    mapping_version: str
    score: float | None = Field(default=None, ge=0, le=1)
    reviewer: str | None = None
    reviewed_at: datetime | None = None
    evidence: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def fuzzy_or_name_only_matches_are_never_auto_accepted(
        self,
    ) -> "MappingAssertionRecord":
        if self.method in {MappingMethod.NORMALIZED_NAME, MappingMethod.FUZZY_CANDIDATE}:
            if self.status is MappingStatus.ACCEPTED:
                raise ValueError("name-only and fuzzy mappings cannot be auto-accepted")
        return self


class IdentityResolver:
    """Deterministic exact mappings and review-only name candidates."""

    @staticmethod
    def exact_external_id(
        *,
        source_record_id: str,
        canonical_id: str,
        scheme: str,
        value: str,
        mapping_version: str,
    ) -> MappingAssertionRecord:
        evidence = f"{scheme}:{value}"
        return MappingAssertionRecord(
            id=stable_id(
                "mapping",
                f"{source_record_id}|{canonical_id}|{evidence}|{mapping_version}",
            ),
            subject_id=source_record_id,
            target_id=canonical_id,
            relation=MappingRelation.EXACT,
            method=MappingMethod.EXACT_EXTERNAL_IDENTIFIER,
            status=MappingStatus.ACCEPTED,
            mapping_version=mapping_version,
            evidence=[evidence],
        )

    @staticmethod
    def exact_inchikey(
        *,
        source_record_id: str,
        canonical_id: str,
        inchikey: str,
        mapping_version: str,
    ) -> MappingAssertionRecord:
        normalized = inchikey.strip().upper()
        if not _INCHIKEY.fullmatch(normalized):
            raise ValueError("invalid Standard InChIKey")
        return MappingAssertionRecord(
            id=stable_id(
                "mapping",
                f"{source_record_id}|{canonical_id}|{normalized}|{mapping_version}",
            ),
            subject_id=source_record_id,
            target_id=canonical_id,
            relation=MappingRelation.EXACT,
            method=MappingMethod.EXACT_INCHIKEY,
            status=MappingStatus.ACCEPTED,
            mapping_version=mapping_version,
            evidence=[normalized],
        )

    @staticmethod
    def name_candidate(
        *,
        source_record_id: str,
        canonical_id: str,
        name: str,
        mapping_version: str,
        fuzzy_score: float | None = None,
    ) -> MappingAssertionRecord:
        method = (
            MappingMethod.FUZZY_CANDIDATE
            if fuzzy_score is not None
            else MappingMethod.NORMALIZED_NAME
        )
        return MappingAssertionRecord(
            id=stable_id(
                "mapping-candidate",
                f"{source_record_id}|{canonical_id}|{normalize_name(name)}|{mapping_version}",
            ),
            subject_id=source_record_id,
            target_id=canonical_id,
            relation=MappingRelation.POSSIBLE_MATCH,
            method=method,
            status=MappingStatus.NEEDS_REVIEW,
            mapping_version=mapping_version,
            score=fuzzy_score,
            evidence=[f"normalized_name:{normalize_name(name)}"],
        )


class FormulaConceptRecord(ApiModel):
    id: str
    preferred_name: str
    review_status: ReviewStatus


class FormulaWitnessRecord(ApiModel):
    id: str
    concept_id: str
    source_record_id: str
    source_locator: str
    variant_of_witness_id: str | None = None
    review_status: ReviewStatus


class IngredientUseRecord(ApiModel):
    id: str
    witness_id: str
    source_record_id: str
    original_ingredient_text: str
    material_id: str | None
    prepared_material_id: str | None = None
    preparation_method_id: str | None = None
    amount: str | None = None
    amount_min: str | None = None
    amount_max: str | None = None
    unit_id: str | None = None
    original_unit_text: str | None = None
    preparation_text: str | None = None
    sequence: int = Field(ge=1)
    sourced_role: str | None = None
    substitution_status: str | None = None
    omission_addition_status: str | None = None
    notes: str | None = None
    source_locator: str
    review_status: ReviewStatus


class LiteralValueType(StrEnum):
    TEXT = "text"
    NUMBER = "number"
    BOOLEAN = "boolean"
    DATE = "date"
    QUANTITY = "quantity"
    CONTROLLED_VOCABULARY = "controlled_vocabulary"


class KnowledgeClaim(ApiModel):
    id: str
    subject_id: str
    predicate_id: str
    source_record_id: str
    object_id: str | None = None
    literal_value: str | None = None
    literal_value_type: LiteralValueType | None = None
    original_text: str | None = None
    normalized_text: str | None = None
    language: str = "und"
    source_locator: str
    review_status: ReviewStatus
    assertion_status: str
    evidence_type_id: str
    assertion_method_id: str
    import_run_id: str
    confidence: float | None = Field(default=None, ge=0, le=1)

    @model_validator(mode="after")
    def has_exactly_one_object_form(self) -> "KnowledgeClaim":
        if (self.object_id is None) == (self.literal_value is None):
            raise ValueError("claim requires exactly one object or literal value")
        if self.literal_value is not None and self.literal_value_type is None:
            raise ValueError("literal claims require literalValueType")
        return self


class QuantitativeObservation(ApiModel):
    id: str
    source_record_id: str
    relation_operator: str | None = None
    value: str | None = None
    value_min: str | None = None
    value_max: str | None = None
    unit: str | None = None
    method: str | None = None
    publication_id: str | None = None
    review_status: ReviewStatus


class CompoundOccurrence(QuantitativeObservation):
    observation_type: Literal["compound_occurrence"] = "compound_occurrence"
    compound_id: str
    material_or_taxon_id: str
    matrix: str | None = None
    specimen: str | None = None
    medicinal_part_id: str | None = None
    preparation_id: str | None = None
    geographic_origin: str | None = None
    detection_status: str


class BioactivityObservation(QuantitativeObservation):
    observation_type: Literal["bioactivity"] = "bioactivity"
    activity_type: str
    assay_id: str | None = None
    target_id: str | None = None
    organism_id: str | None = None
    cell_line: str | None = None


class ToxicityObservation(QuantitativeObservation):
    observation_type: Literal["toxicity"] = "toxicity"
    endpoint: str
    route: str | None = None
    duration: str | None = None
    organism_id: str | None = None
    tissue: str | None = None
    study_type: str | None = None


class ExposureObservation(QuantitativeObservation):
    observation_type: Literal["exposure"] = "exposure"
    route: str | None = None
    population: str | None = None
    duration: str | None = None


Observation = Annotated[
    CompoundOccurrence | BioactivityObservation | ToxicityObservation | ExposureObservation,
    Field(discriminator="observation_type"),
]


class PredictionRecord(ApiModel):
    """Computational output that is deliberately not an Observation subtype."""

    id: str
    subject_id: str
    model_name: str
    model_version: str
    score: float
    threshold: float | None = None
    training_data_reference: str
    generated_at: datetime
    source_system: str
