"""Health and service metadata endpoints."""

from fastapi import APIRouter, Depends, Request
from pydantic import Field

from current_alchemy import __version__
from current_alchemy.api.dependencies import get_repository
from current_alchemy.api.errors import ApiProblem, ProblemError
from current_alchemy.application.ports.repository import AlchemyRepository
from current_alchemy.constants import (
    API_VERSION,
    FORMULA_ANALYSIS_VERSION,
    GRAPH_SCHEMA_VERSION,
    SAFETY_SUMMARY,
    SERVICE_NAME,
)
from current_alchemy.domain.common.models import ApiModel

router = APIRouter(tags=["service"])


class LiveResponse(ApiModel):
    status: str = "live"
    service: str = SERVICE_NAME


class DependencyStatus(ApiModel):
    name: str
    status: str


class ReadyResponse(ApiModel):
    status: str
    dependencies: list[DependencyStatus]


class FeatureFlags(ApiModel):
    enabled: list[str] = Field(default_factory=list)
    disabled: list[str] = Field(default_factory=list)


class MetaResponse(ApiModel):
    service_name: str
    api_version: str
    application_version: str
    graph_schema_version: str
    formula_analysis_algorithm_version: str
    active_data_source_count: int
    safety_boundary_summary: str
    feature_flags: FeatureFlags


@router.get("/health/live", response_model=LiveResponse)
async def live() -> LiveResponse:
    return LiveResponse()


@router.get(
    "/health/ready",
    response_model=ReadyResponse,
    responses={503: {"description": "Neo4j dependency is unavailable"}},
)
async def ready(
    repository: AlchemyRepository = Depends(get_repository),
) -> ReadyResponse:
    if not await repository.readiness():
        raise ApiProblem(
            status=503,
            code="dependency_unavailable",
            title="Service is not ready",
            detail="The graph database is unavailable.",
            errors=[
                ProblemError(
                    location=["dependency", "neo4j"],
                    message="connectivity check failed",
                    error_type="dependency_unavailable",
                )
            ],
        )
    return ReadyResponse(
        status="ready",
        dependencies=[DependencyStatus(name="neo4j", status="ready")],
    )


@router.get("/meta", response_model=MetaResponse)
async def meta(
    request: Request,
    repository: AlchemyRepository = Depends(get_repository),
) -> MetaResponse:
    del request
    return MetaResponse(
        service_name=SERVICE_NAME,
        api_version=API_VERSION,
        application_version=__version__,
        graph_schema_version=GRAPH_SCHEMA_VERSION,
        formula_analysis_algorithm_version=FORMULA_ANALYSIS_VERSION,
        active_data_source_count=await repository.active_source_count(),
        safety_boundary_summary=SAFETY_SUMMARY,
        feature_flags=FeatureFlags(
            enabled=[
                "graph-retrieval",
                "formula-analysis",
                "formula-comparison",
                "text-search",
                "constrained-exploration",
            ],
            disabled=[
                "diagnosis",
                "prescribing",
                "medical-advice",
                "external-ai",
                "embeddings",
                "user-health-data",
            ],
        ),
    )
