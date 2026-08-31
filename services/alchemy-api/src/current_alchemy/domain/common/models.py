"""Shared typed domain and transport-safe knowledge models."""

from datetime import datetime
from enum import StrEnum
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
        extra="forbid",
    )


class ReviewStatus(StrEnum):
    SYNTHETIC_FIXTURE = "synthetic_fixture"
    MACHINE_IMPORTED = "machine_imported"
    HUMAN_REVIEWED = "human_reviewed"
    DISPUTED = "disputed"
    SUPERSEDED = "superseded"


class RightsStatus(StrEnum):
    APPROVED = "approved"
    REVIEW_REQUIRED = "review_required"
    BLOCKED = "blocked"


class DataStatus(StrEnum):
    VERIFIED = "verified"
    SOURCE_REPORTED = "source_reported"
    CONFLICTED = "conflicted"
    DEMO = "demo"
    INCOMPLETE = "incomplete"


class EntityType(StrEnum):
    HERB_MATERIAL = "HerbMaterial"
    BOTANICAL_TAXON = "BotanicalTaxon"
    MEDICINAL_PART = "MedicinalPart"
    PREPARATION = "Preparation"
    FORMULA = "Formula"
    FORMULA_VARIANT = "FormulaVariant"
    COMPOUND = "Compound"
    ACTION = "Action"
    PATTERN = "Pattern"
    SYMPTOM_TERM = "SymptomTerm"
    CHANNEL = "Channel"
    FLAVOR = "Flavor"
    THERMAL_NATURE = "ThermalNature"
    CATEGORY = "Category"
    SOURCE = "Source"
    CLAIM = "Claim"
    DOCUMENT = "Document"
    PASSAGE = "Passage"
    IMPORT_RUN = "ImportRun"


class SourceSummary(ApiModel):
    id: str
    title: str
    rights_status: RightsStatus
    review_status: ReviewStatus
    citation: str


class Citation(ApiModel):
    source_id: str
    source_title: str
    locator: str | None = None
    citation_text: str
    review_status: ReviewStatus


class ClaimRecord(ApiModel):
    id: str
    predicate: str
    subject_id: str
    object_id: str | None = None
    textual_value: str | None = None
    original_quotation: str | None = None
    normalized_interpretation: str | None = None
    language: str
    source_locator: str | None = None
    evidence_type: str
    review_status: ReviewStatus
    confidence: float | None = Field(default=None, ge=0, le=1)
    source: SourceSummary
    import_run_id: str
    created_at: datetime


class NameRecord(ApiModel):
    text: str
    normalized: str
    language: str
    script: str
    kind: str
    source_id: str
    review_status: ReviewStatus


class EntitySummary(ApiModel):
    id: str
    entity_type: EntityType
    display_name: str
    names: list[NameRecord] = Field(default_factory=list)
    review_statuses: list[ReviewStatus] = Field(default_factory=list)
    source_ids: list[str] = Field(default_factory=list)
    data_status: DataStatus
    ambiguity: list[str] = Field(default_factory=list)
    properties: dict[str, str | int | float | bool | None | list[str]] = Field(default_factory=dict)


class EntityDetail(EntitySummary):
    properties: dict[str, str | int | float | bool | None | list[str]] = Field(default_factory=dict)
    claims: list[ClaimRecord] = Field(default_factory=list)
    unresolved_conflicts: list[str] = Field(default_factory=list)
    completeness: float = Field(ge=0, le=1)


def entity_summary(detail: EntityDetail) -> EntitySummary:
    return EntitySummary(
        id=detail.id,
        entity_type=detail.entity_type,
        display_name=detail.display_name,
        names=detail.names,
        review_statuses=detail.review_statuses,
        source_ids=detail.source_ids,
        data_status=detail.data_status,
        ambiguity=detail.ambiguity,
        properties=detail.properties,
    )


class PageMeta(ApiModel):
    offset: int = Field(ge=0)
    limit: int = Field(ge=1)
    total: int = Field(ge=0)
    has_more: bool


class KnowledgeMeta(ApiModel):
    request_id: str | None = None
    data_status: DataStatus
    sources: list[SourceSummary] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    generated_at: datetime | None = None
    schema_version: str
    algorithm_version: str | None = None


DataT = TypeVar("DataT")


class Envelope(ApiModel, Generic[DataT]):
    data: DataT
    meta: KnowledgeMeta


class PaginatedData(ApiModel, Generic[DataT]):
    items: list[DataT]
    pagination: PageMeta
