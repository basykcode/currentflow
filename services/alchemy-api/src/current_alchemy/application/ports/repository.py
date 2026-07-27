"""Application-facing persistence port."""

from dataclasses import dataclass
from typing import Protocol

from current_alchemy.domain.analysis.models import HerbAnalysisProfile, IngredientPairSignal
from current_alchemy.domain.common.exploration import ExploreQueryRequest, ExploreQueryResult
from current_alchemy.domain.common.models import (
    EntityDetail,
    EntitySummary,
    EntityType,
    SourceSummary,
)
from current_alchemy.domain.texts.models import (
    DocumentRecord,
    PassageRecord,
    RetrievalFact,
    TextSearchResult,
)
from current_alchemy.ingestion.models import IngestionBatch


@dataclass(frozen=True, slots=True)
class PageResult:
    items: list[EntitySummary]
    total: int


@dataclass(frozen=True, slots=True)
class SourcePageResult:
    items: list[SourceSummary]
    total: int


@dataclass(frozen=True, slots=True)
class DocumentPageResult:
    items: list[DocumentRecord]
    total: int


@dataclass(frozen=True, slots=True)
class TextPageResult:
    items: list[TextSearchResult]
    total: int


class AlchemyRepository(Protocol):
    async def readiness(self) -> bool: ...

    async def active_source_count(self) -> int: ...

    async def list_entities(
        self,
        entity_type: EntityType,
        query: str | None,
        filters: dict[str, str],
        offset: int,
        limit: int,
    ) -> PageResult: ...

    async def get_entity(self, entity_type: EntityType, entity_id: str) -> EntityDetail | None: ...

    async def list_sources(self, offset: int, limit: int) -> SourcePageResult: ...

    async def get_source(self, source_id: str) -> EntityDetail | None: ...

    async def list_documents(self, offset: int, limit: int) -> DocumentPageResult: ...

    async def get_document(self, document_id: str) -> DocumentRecord | None: ...

    async def get_passage(self, passage_id: str) -> PassageRecord | None: ...

    async def search_text(
        self,
        query: str,
        source_ids: list[str],
        offset: int,
        limit: int,
    ) -> TextPageResult: ...

    async def neighborhood(
        self, entity_id: str, depth: int, limit: int
    ) -> ExploreQueryResult | None: ...

    async def explore(self, request: ExploreQueryRequest) -> ExploreQueryResult: ...

    async def herb_profiles(self, herb_ids: set[str]) -> dict[str, HerbAnalysisProfile]: ...

    async def pair_signals(self, herb_ids: set[str]) -> list[IngredientPairSignal]: ...

    async def conflicts(self, herb_ids: set[str]) -> list[str]: ...

    async def retrieval_facts(
        self, entity_ids: list[str], source_ids: list[str], limit: int
    ) -> list[RetrievalFact]: ...

    async def seed_demo(self) -> dict[str, int]: ...

    async def reset_demo(self) -> dict[str, int]: ...

    async def audit(self) -> dict[str, object]: ...

    async def graph_counts(self) -> dict[str, object]: ...

    async def foundation_status(self, source_id: str, release_id: str) -> dict[str, int]: ...

    async def provenance(self, entity_id: str) -> dict[str, object]: ...

    async def rebuild_projections(self) -> dict[str, object]: ...

    async def ingest_batch(self, batch: IngestionBatch, batch_size: int) -> dict[str, int]: ...
