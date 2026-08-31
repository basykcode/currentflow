"""Constrained graph exploration endpoint."""

from fastapi import APIRouter, Depends, Request

from current_alchemy.api.dependencies import get_repository
from current_alchemy.api.responses import knowledge_meta
from current_alchemy.application.ports.repository import AlchemyRepository
from current_alchemy.domain.common.exploration import ExploreQueryRequest, ExploreQueryResult
from current_alchemy.domain.common.models import DataStatus, Envelope

router = APIRouter(tags=["exploration"])


@router.post(
    "/explore/query",
    response_model=Envelope[ExploreQueryResult],
    operation_id="explore_query",
)
async def explore(
    payload: ExploreQueryRequest,
    request: Request,
    repository: AlchemyRepository = Depends(get_repository),
) -> Envelope[ExploreQueryResult]:
    result = await repository.explore(payload)
    return Envelope(
        data=result,
        meta=knowledge_meta(request, data_status=DataStatus.INCOMPLETE),
    )
