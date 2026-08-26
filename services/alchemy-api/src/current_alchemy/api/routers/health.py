"""Health and service metadata endpoints."""

from importlib.metadata import version
from platform import python_version

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


class Neo4jRuntimeConfiguration(ApiModel):
    maximum_connection_pool_size: int
    connection_acquisition_timeout_seconds: float
    connection_timeout_seconds: float
    maximum_connection_lifetime_seconds: float
    liveness_check_timeout_seconds: float
    maximum_transaction_retry_time_seconds: float
    query_timeout_seconds: float


class MetaResponse(ApiModel):
    service_name: str
    api_version: str
    application_version: str
    git_sha: str
    python_version: str
    neo4j_driver_version: str = Field(serialization_alias="neo4jDriverVersion")
    graph_schema_version: str
    projection_versions: list[str]
    formula_analysis_algorithm_version: str
    active_data_source_count: int
    process_worker_count: int
    neo4j_configuration: Neo4jRuntimeConfiguration = Field(serialization_alias="neo4jConfiguration")
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
    settings = request.app.state.settings
    return MetaResponse(
        service_name=SERVICE_NAME,
        api_version=API_VERSION,
        application_version=__version__,
        git_sha=settings.alchemy_git_sha,
        python_version=python_version(),
        neo4j_driver_version=version("neo4j"),
        graph_schema_version=GRAPH_SCHEMA_VERSION,
        projection_versions=["production-approved-v1", "accepted-claims-v1"],
        formula_analysis_algorithm_version=FORMULA_ANALYSIS_VERSION,
        active_data_source_count=await repository.active_source_count(),
        process_worker_count=settings.web_concurrency,
        neo4j_configuration=Neo4jRuntimeConfiguration(
            maximum_connection_pool_size=settings.neo4j_max_connection_pool_size,
            connection_acquisition_timeout_seconds=(
                settings.neo4j_connection_acquisition_timeout_seconds
            ),
            connection_timeout_seconds=settings.neo4j_connection_timeout_seconds,
            maximum_connection_lifetime_seconds=(settings.neo4j_max_connection_lifetime_seconds),
            liveness_check_timeout_seconds=settings.neo4j_liveness_check_timeout_seconds,
            maximum_transaction_retry_time_seconds=(
                settings.neo4j_max_transaction_retry_time_seconds
            ),
            query_timeout_seconds=settings.neo4j_query_timeout_seconds,
        ),
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
