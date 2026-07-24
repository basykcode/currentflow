"""Document, passage, search, and deterministic retrieval contracts."""

from pydantic import Field, model_validator

from current_alchemy.domain.common.models import (
    ApiModel,
    Citation,
    EntitySummary,
    ReviewStatus,
)


class DocumentRecord(ApiModel):
    id: str
    source_id: str
    title: str
    language: str
    version: str
    checksum: str
    review_status: ReviewStatus
    citation: Citation


class PassageRecord(ApiModel):
    id: str
    document_id: str
    document_title: str
    original_text: str
    normalized_text: str
    language: str
    source_locator: str
    checksum: str
    review_status: ReviewStatus
    citation: Citation
    mentioned_entity_ids: list[str] = Field(default_factory=list)
    mentioned_entities: list[EntitySummary] = Field(default_factory=list)


class TextSearchResult(ApiModel):
    passage: PassageRecord
    score: float = Field(ge=0)
    matched_terms: list[str] = Field(default_factory=list)


class RetrievalContextRequest(ApiModel):
    query: str | None = Field(default=None, min_length=1, max_length=1_000)
    passage_ids: list[str] = Field(default_factory=list, max_length=30)
    entity_ids: list[str] = Field(default_factory=list, max_length=20)
    source_ids: list[str] = Field(default_factory=list, max_length=20)
    maximum_passages: int = Field(default=10, ge=1, le=30)
    maximum_character_budget: int = Field(default=12_000, ge=500, le=50_000)

    @model_validator(mode="after")
    def require_query_or_passages(self) -> "RetrievalContextRequest":
        if self.query is None and not self.passage_ids:
            raise ValueError("query or passageIds is required")
        return self


class RetrievalFact(ApiModel):
    subject_id: str
    predicate: str
    object_id: str | None = None
    textual_value: str | None = None
    citation: Citation


class RetrievalPackage(ApiModel):
    query: str
    passages: list[PassageRecord]
    citations: list[Citation]
    matched_entities: list[EntitySummary]
    graph_neighborhood_facts: list[RetrievalFact]
    unresolved_ambiguities: list[str]
    source_statuses: dict[str, str]
    review_statuses: dict[str, str]
    used_characters: int = Field(ge=0)
    character_budget: int = Field(ge=1)


def apply_character_budget(
    passages: list[PassageRecord], maximum_characters: int
) -> tuple[list[PassageRecord], int]:
    """Select whole passages deterministically without exceeding a hard character budget."""

    selected: list[PassageRecord] = []
    used = 0
    for passage in passages:
        size = len(passage.original_text)
        if used + size > maximum_characters:
            continue
        selected.append(passage)
        used += size
    return selected, used
