"""Typed adapter output before storage."""

from pydantic import Field

from current_alchemy.domain.common.exploration import RelationshipType
from current_alchemy.domain.common.models import ApiModel, EntityType

PropertyValue = str | int | float | bool | None | list[str]


class NodeUpsert(ApiModel):
    entity_type: EntityType
    id: str = Field(min_length=1, max_length=220)
    properties: dict[str, PropertyValue]


class RelationshipUpsert(ApiModel):
    id: str = Field(min_length=1, max_length=300)
    source_id: str
    target_id: str
    relationship_type: RelationshipType
    properties: dict[str, PropertyValue] = Field(default_factory=dict)


class IngestionBatch(ApiModel):
    nodes: list[NodeUpsert] = Field(default_factory=list)
    relationships: list[RelationshipUpsert] = Field(default_factory=list)
    raw_records_preserved: int = Field(default=0, ge=0)
    unresolved_fields: list[str] = Field(default_factory=list)
