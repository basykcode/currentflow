"""Allowlisted graph-exploration request and response models."""

from enum import StrEnum

from pydantic import Field, field_validator, model_validator

from current_alchemy.domain.common.models import ApiModel, EntityType


class Direction(StrEnum):
    OUTGOING = "outgoing"
    INCOMING = "incoming"
    BOTH = "both"


class RelationshipType(StrEnum):
    DERIVED_FROM = "DERIVED_FROM"
    USES_PART = "USES_PART"
    PREPARED_FROM = "PREPARED_FROM"
    HAS_PREPARATION = "HAS_PREPARATION"
    HAS_NATURE = "HAS_NATURE"
    HAS_FLAVOR = "HAS_FLAVOR"
    ENTERS_CHANNEL = "ENTERS_CHANNEL"
    HAS_ACTION = "HAS_ACTION"
    ADDRESSES_PATTERN = "ADDRESSES_PATTERN"
    ASSOCIATED_WITH_TERM = "ASSOCIATED_WITH_TERM"
    IN_CATEGORY = "IN_CATEGORY"
    CONTAINS_COMPOUND = "CONTAINS_COMPOUND"
    CONTAINS = "CONTAINS"
    VARIANT_OF = "VARIANT_OF"
    SUBJECT = "SUBJECT"
    OBJECT = "OBJECT"
    SUPPORTED_BY = "SUPPORTED_BY"
    EXTRACTED_FROM = "EXTRACTED_FROM"
    HAS_PASSAGE = "HAS_PASSAGE"
    MENTIONS = "MENTIONS"
    IMPORTED = "IMPORTED"
    CREATED_OR_UPDATED = "CREATED_OR_UPDATED"
    INTERACTS_WITH = "INTERACTS_WITH"


_FILTER_ALLOWLIST = {
    "id",
    "language",
    "reviewStatus",
    "sourceId",
    "category",
    "rightsStatus",
}
_PROJECTION_ALLOWLIST = {
    "id",
    "displayName",
    "entityType",
    "language",
    "reviewStatus",
    "sourceIds",
}


class ExploreQueryRequest(ApiModel):
    start_entity_type: EntityType
    text_query: str | None = Field(default=None, min_length=1, max_length=300)
    exact_property_filters: dict[str, str] = Field(default_factory=dict, max_length=10)
    relationship_types: list[RelationshipType] = Field(min_length=1, max_length=20)
    direction: Direction = Direction.BOTH
    maximum_depth: int = Field(default=1, ge=1, le=2)
    result_limit: int = Field(default=25, ge=1, le=100)
    projection_fields: list[str] = Field(
        default_factory=lambda: ["id", "displayName", "entityType"],
        min_length=1,
        max_length=10,
    )

    @field_validator("exact_property_filters")
    @classmethod
    def validate_filter_keys(cls, filters: dict[str, str]) -> dict[str, str]:
        unknown = set(filters) - _FILTER_ALLOWLIST
        if unknown:
            raise ValueError(f"unknown filter fields: {', '.join(sorted(unknown))}")
        return filters

    @field_validator("projection_fields")
    @classmethod
    def validate_projection_fields(cls, fields: list[str]) -> list[str]:
        unknown = set(fields) - _PROJECTION_ALLOWLIST
        if unknown:
            raise ValueError(f"unknown projection fields: {', '.join(sorted(unknown))}")
        return fields

    @model_validator(mode="before")
    @classmethod
    def reject_raw_query_keys(cls, value: object) -> object:
        if isinstance(value, dict):
            forbidden = {"cypher", "queryText", "procedure", "write"}
            present = forbidden & {str(key) for key in value}
            if present:
                raise ValueError(f"raw database operations are forbidden: {', '.join(present)}")
        return value


class GraphNode(ApiModel):
    id: str
    entity_type: EntityType
    display_name: str
    properties: dict[str, str | int | float | bool | None | list[str]]


class GraphEdge(ApiModel):
    id: str
    source_id: str
    target_id: str
    relationship_type: RelationshipType
    properties: dict[str, str | int | float | bool | None]


class ExploreQueryResult(ApiModel):
    rows: list[dict[str, str | int | float | bool | None | list[str]]]
    nodes: list[GraphNode]
    edges: list[GraphEdge]
