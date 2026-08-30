"""Deterministic retrieval package and disabled inquiry endpoints."""

from fastapi import APIRouter, Depends, Request
from pydantic import Field

from current_alchemy.api.dependencies import get_repository
from current_alchemy.api.errors import ApiProblem
from current_alchemy.api.responses import knowledge_meta
from current_alchemy.application.ports.repository import AlchemyRepository
from current_alchemy.domain.common.models import (
    ApiModel,
    DataStatus,
    EntitySummary,
    EntityType,
    Envelope,
    entity_summary,
)
from current_alchemy.domain.texts.models import (
    RetrievalContextRequest,
    RetrievalPackage,
    apply_character_budget,
)

router = APIRouter(tags=["retrieval"])


@router.post(
    "/retrieval/context",
    response_model=Envelope[RetrievalPackage],
    operation_id="build_retrieval_context",
)
async def retrieval_context(
    payload: RetrievalContextRequest,
    request: Request,
    repository: AlchemyRepository = Depends(get_repository),
) -> Envelope[RetrievalPackage]:
    if payload.passage_ids:
        exact_passages = [
            passage
            for passage_id in payload.passage_ids
            if (passage := await repository.get_passage(passage_id)) is not None
        ]
        missing_passage_ids = [
            passage_id
            for passage_id in payload.passage_ids
            if passage_id not in {passage.id for passage in exact_passages}
        ]
    else:
        text_page = await repository.search_text(
            payload.query or "", payload.source_ids, 0, payload.maximum_passages
        )
        exact_passages = [item.passage for item in text_page.items]
        missing_passage_ids = []
    selected, used = apply_character_budget(
        exact_passages[: payload.maximum_passages], payload.maximum_character_budget
    )
    matched: list[EntitySummary] = []
    unresolved: list[str] = [
        f"Unknown passage ID: {passage_id}" for passage_id in missing_passage_ids
    ]
    for entity_id in payload.entity_ids:
        entity = None
        for entity_type in (EntityType.HERB_MATERIAL, EntityType.FORMULA):
            entity = await repository.get_entity(entity_type, entity_id)
            if entity:
                break
        if entity is None:
            unresolved.append(f"Unknown entity ID: {entity_id}")
        else:
            matched.append(entity_summary(entity))
    facts = await repository.retrieval_facts(
        payload.entity_ids, payload.source_ids, payload.maximum_passages
    )
    passage_and_fact_citations = [
        *(passage.citation for passage in selected),
        *(fact.citation for fact in facts),
    ]
    citations = list(
        {
            (
                citation.source_id,
                citation.locator,
            ): citation
            for citation in passage_and_fact_citations
        }.values()
    )
    source_ids = {citation.source_id for citation in citations}
    source_page = await repository.list_sources(0, 100)
    sources = [source for source in source_page.items if source.id in source_ids]
    package = RetrievalPackage(
        query=payload.query or "Selected passages",
        passages=selected,
        citations=citations,
        matched_entities=matched,
        graph_neighborhood_facts=facts,
        unresolved_ambiguities=unresolved,
        source_statuses={source.id: source.rights_status.value for source in sources},
        review_statuses={source.id: source.review_status.value for source in sources},
        used_characters=used,
        character_budget=payload.maximum_character_budget,
    )
    return Envelope(
        data=package,
        meta=knowledge_meta(
            request,
            data_status=DataStatus.INCOMPLETE if unresolved else DataStatus.SOURCE_REPORTED,
            sources=sources,
            warnings=unresolved,
        ),
    )


class DisabledInquiryRequest(ApiModel):
    query: str = Field(min_length=1, max_length=2_000)


@router.post("/inquiry/synthesize", status_code=501)
async def disabled_synthesis(payload: DisabledInquiryRequest) -> None:
    del payload
    raise ApiProblem(
        status=501,
        code="model_not_connected",
        title="Synthesis model is not connected",
        detail="No synthesis model is configured.",
    )
