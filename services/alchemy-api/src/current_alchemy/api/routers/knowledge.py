"""Sourced knowledge search, detail, text, and graph routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request

from current_alchemy.api.dependencies import get_repository
from current_alchemy.api.errors import ApiProblem
from current_alchemy.api.responses import knowledge_meta
from current_alchemy.application.ports.repository import AlchemyRepository
from current_alchemy.domain.common.exploration import ExploreQueryResult
from current_alchemy.domain.common.models import (
    DataStatus,
    EntityDetail,
    EntitySummary,
    EntityType,
    Envelope,
    PageMeta,
    PaginatedData,
    ReviewStatus,
    SourceSummary,
)
from current_alchemy.domain.texts.models import DocumentRecord, PassageRecord, TextSearchResult

router = APIRouter(tags=["knowledge"])
Offset = Annotated[int, Query(ge=0)]
Limit = Annotated[int, Query(ge=1, le=100)]
OptionalFilter = Annotated[str | None, Query(min_length=1, max_length=160)]


def _page_meta(offset: int, limit: int, total: int) -> PageMeta:
    return PageMeta(offset=offset, limit=limit, total=total, has_more=offset + limit < total)


def _data_status(items: list[EntitySummary]) -> DataStatus:
    statuses = {item.data_status for item in items}
    if DataStatus.CONFLICTED in statuses:
        return DataStatus.CONFLICTED
    if DataStatus.INCOMPLETE in statuses:
        return DataStatus.INCOMPLETE
    if statuses == {DataStatus.DEMO} or not statuses:
        return DataStatus.DEMO
    return DataStatus.SOURCE_REPORTED


async def _sources_for(repository: AlchemyRepository, source_ids: set[str]) -> list[SourceSummary]:
    page = await repository.list_sources(0, 100)
    return [source for source in page.items if source.id in source_ids]


@router.get(
    "/search/suggest",
    response_model=Envelope[list[EntitySummary]],
)
async def suggest(
    request: Request,
    q: Annotated[str, Query(min_length=1, max_length=200)],
    limit: Annotated[int, Query(ge=1, le=20)] = 10,
    repository: AlchemyRepository = Depends(get_repository),
) -> Envelope[list[EntitySummary]]:
    herbs = await repository.list_entities(EntityType.HERB_MATERIAL, q, {}, 0, limit)
    formulas = await repository.list_entities(EntityType.FORMULA, q, {}, 0, limit)
    items = sorted(
        [*herbs.items, *formulas.items],
        key=lambda item: (item.display_name.casefold(), item.id),
    )[:limit]
    sources = await _sources_for(
        repository, {source for item in items for source in item.source_ids}
    )
    return Envelope(
        data=items,
        meta=knowledge_meta(request, data_status=_data_status(items), sources=sources),
    )


@router.get("/herbs", response_model=Envelope[PaginatedData[EntitySummary]])
async def list_herbs(
    request: Request,
    query: OptionalFilter = None,
    name_language: OptionalFilter = None,
    thermal_nature: OptionalFilter = None,
    flavor: OptionalFilter = None,
    channel: OptionalFilter = None,
    category: OptionalFilter = None,
    action: OptionalFilter = None,
    botanical_taxon: OptionalFilter = None,
    review_status: ReviewStatus | None = None,
    source: OptionalFilter = None,
    offset: Offset = 0,
    limit: Limit = 25,
    repository: AlchemyRepository = Depends(get_repository),
) -> Envelope[PaginatedData[EntitySummary]]:
    filters = {
        key: value
        for key, value in {
            "nameLanguage": name_language,
            "thermalNatures": thermal_nature,
            "flavors": flavor,
            "channels": channel,
            "categories": category,
            "actions": action,
            "botanicalTaxon": botanical_taxon,
            "reviewStatus": review_status.value if review_status else None,
            "source": source,
        }.items()
        if value is not None
    }
    page = await repository.list_entities(EntityType.HERB_MATERIAL, query, filters, offset, limit)
    sources = await _sources_for(
        repository, {source_id for item in page.items for source_id in item.source_ids}
    )
    return Envelope(
        data=PaginatedData(
            items=page.items,
            pagination=_page_meta(offset, limit, page.total),
        ),
        meta=knowledge_meta(request, data_status=_data_status(page.items), sources=sources),
    )


@router.get("/herbs/{herb_id}", response_model=Envelope[EntityDetail])
async def get_herb(
    herb_id: str,
    request: Request,
    repository: AlchemyRepository = Depends(get_repository),
) -> Envelope[EntityDetail]:
    entity = await repository.get_entity(EntityType.HERB_MATERIAL, herb_id)
    if entity is None:
        raise ApiProblem(
            status=404,
            code="herb_not_found",
            title="Herb material not found",
            detail=f"No herb material exists with ID '{herb_id}'.",
        )
    sources = await _sources_for(repository, set(entity.source_ids))
    return Envelope(
        data=entity,
        meta=knowledge_meta(
            request,
            data_status=entity.data_status,
            sources=sources,
            warnings=entity.unresolved_conflicts,
        ),
    )


@router.get("/formulas", response_model=Envelope[PaginatedData[EntitySummary]])
async def list_formulas(
    request: Request,
    query: OptionalFilter = None,
    category: OptionalFilter = None,
    ingredient: OptionalFilter = None,
    action: OptionalFilter = None,
    pattern: OptionalFilter = None,
    source: OptionalFilter = None,
    review_status: ReviewStatus | None = None,
    offset: Offset = 0,
    limit: Limit = 25,
    repository: AlchemyRepository = Depends(get_repository),
) -> Envelope[PaginatedData[EntitySummary]]:
    filters = {
        key: value
        for key, value in {
            "category": category,
            "ingredientIds": ingredient,
            "action": action,
            "pattern": pattern,
            "source": source,
            "reviewStatus": review_status.value if review_status else None,
        }.items()
        if value is not None
    }
    page = await repository.list_entities(EntityType.FORMULA, query, filters, offset, limit)
    sources = await _sources_for(
        repository, {source_id for item in page.items for source_id in item.source_ids}
    )
    return Envelope(
        data=PaginatedData(items=page.items, pagination=_page_meta(offset, limit, page.total)),
        meta=knowledge_meta(request, data_status=_data_status(page.items), sources=sources),
    )


@router.get("/formulas/{formula_id}", response_model=Envelope[EntityDetail])
async def get_formula(
    formula_id: str,
    request: Request,
    repository: AlchemyRepository = Depends(get_repository),
) -> Envelope[EntityDetail]:
    entity = await repository.get_entity(EntityType.FORMULA, formula_id)
    if entity is None:
        raise ApiProblem(
            status=404,
            code="formula_not_found",
            title="Formula not found",
            detail=f"No formula exists with ID '{formula_id}'.",
        )
    return Envelope(
        data=entity,
        meta=knowledge_meta(
            request,
            data_status=entity.data_status,
            sources=await _sources_for(repository, set(entity.source_ids)),
        ),
    )


@router.get("/sources", response_model=Envelope[PaginatedData[SourceSummary]])
async def list_sources(
    request: Request,
    offset: Offset = 0,
    limit: Limit = 25,
    repository: AlchemyRepository = Depends(get_repository),
) -> Envelope[PaginatedData[SourceSummary]]:
    page = await repository.list_sources(offset, limit)
    data_status = (
        DataStatus.DEMO
        if page.items and all(item.id.startswith("demo:") for item in page.items)
        else DataStatus.SOURCE_REPORTED
    )
    return Envelope(
        data=PaginatedData(items=page.items, pagination=_page_meta(offset, limit, page.total)),
        meta=knowledge_meta(request, data_status=data_status, sources=page.items),
    )


@router.get("/sources/{source_id}", response_model=Envelope[EntityDetail])
async def get_source(
    source_id: str,
    request: Request,
    repository: AlchemyRepository = Depends(get_repository),
) -> Envelope[EntityDetail]:
    source = await repository.get_source(source_id)
    if source is None:
        raise ApiProblem(
            status=404,
            code="source_not_found",
            title="Source not found",
            detail=f"No source exists with ID '{source_id}'.",
        )
    return Envelope(
        data=source,
        meta=knowledge_meta(
            request,
            data_status=source.data_status,
            sources=await _sources_for(repository, {source_id}),
        ),
    )


@router.get("/documents", response_model=Envelope[PaginatedData[DocumentRecord]])
async def list_documents(
    request: Request,
    offset: Offset = 0,
    limit: Limit = 25,
    repository: AlchemyRepository = Depends(get_repository),
) -> Envelope[PaginatedData[DocumentRecord]]:
    page = await repository.list_documents(offset, limit)
    source_ids = {item.source_id for item in page.items}
    return Envelope(
        data=PaginatedData(items=page.items, pagination=_page_meta(offset, limit, page.total)),
        meta=knowledge_meta(
            request,
            data_status=DataStatus.DEMO
            if any(item.id.startswith("demo:") for item in page.items)
            else DataStatus.SOURCE_REPORTED,
            sources=await _sources_for(repository, source_ids),
        ),
    )


@router.get("/documents/{document_id}", response_model=Envelope[DocumentRecord])
async def get_document(
    document_id: str,
    request: Request,
    repository: AlchemyRepository = Depends(get_repository),
) -> Envelope[DocumentRecord]:
    document = await repository.get_document(document_id)
    if document is None:
        raise ApiProblem(
            status=404,
            code="document_not_found",
            title="Document not found",
            detail=f"No document exists with ID '{document_id}'.",
        )
    return Envelope(
        data=document,
        meta=knowledge_meta(
            request,
            data_status=(
                DataStatus.DEMO
                if document.review_status is ReviewStatus.SYNTHETIC_FIXTURE
                else DataStatus.SOURCE_REPORTED
            ),
            sources=await _sources_for(repository, {document.source_id}),
        ),
    )


@router.get("/passages/{passage_id}", response_model=Envelope[PassageRecord])
async def get_passage(
    passage_id: str,
    request: Request,
    repository: AlchemyRepository = Depends(get_repository),
) -> Envelope[PassageRecord]:
    passage = await repository.get_passage(passage_id)
    if passage is None:
        raise ApiProblem(
            status=404,
            code="passage_not_found",
            title="Passage not found",
            detail=f"No passage exists with ID '{passage_id}'.",
        )
    return Envelope(
        data=passage,
        meta=knowledge_meta(
            request,
            data_status=(
                DataStatus.DEMO
                if passage.review_status is ReviewStatus.SYNTHETIC_FIXTURE
                else DataStatus.SOURCE_REPORTED
            ),
            sources=await _sources_for(repository, {passage.citation.source_id}),
        ),
    )


@router.get("/text/search", response_model=Envelope[PaginatedData[TextSearchResult]])
async def text_search(
    request: Request,
    q: Annotated[str, Query(max_length=1_000)] = "",
    source_id: Annotated[list[str] | None, Query(max_length=20)] = None,
    offset: Offset = 0,
    limit: Limit = 25,
    repository: AlchemyRepository = Depends(get_repository),
) -> Envelope[PaginatedData[TextSearchResult]]:
    page = await repository.search_text(q, source_id or [], offset, limit)
    sources = await _sources_for(
        repository,
        {item.passage.citation.source_id for item in page.items},
    )
    return Envelope(
        data=PaginatedData(items=page.items, pagination=_page_meta(offset, limit, page.total)),
        meta=knowledge_meta(
            request,
            data_status=(
                DataStatus.DEMO
                if any(
                    item.passage.review_status is ReviewStatus.SYNTHETIC_FIXTURE
                    for item in page.items
                )
                else DataStatus.SOURCE_REPORTED
            ),
            sources=sources,
        ),
    )


@router.get(
    "/graph/entities/{entity_id}/neighborhood",
    response_model=Envelope[ExploreQueryResult],
)
async def graph_neighborhood(
    entity_id: str,
    request: Request,
    depth: Annotated[int, Query(ge=1, le=2)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
    repository: AlchemyRepository = Depends(get_repository),
) -> Envelope[ExploreQueryResult]:
    graph = await repository.neighborhood(entity_id, depth, limit)
    if graph is None:
        raise ApiProblem(
            status=404,
            code="entity_not_found",
            title="Entity not found",
            detail=f"No graph entity exists with ID '{entity_id}'.",
        )
    return Envelope(
        data=graph,
        meta=knowledge_meta(request, data_status=DataStatus.INCOMPLETE),
    )
