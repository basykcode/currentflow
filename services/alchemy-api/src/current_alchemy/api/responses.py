"""Knowledge response envelope helpers."""

from fastapi import Request

from current_alchemy.constants import GRAPH_SCHEMA_VERSION, SAFETY_SUMMARY
from current_alchemy.domain.common.models import DataStatus, KnowledgeMeta, SourceSummary


def knowledge_meta(
    request: Request,
    *,
    data_status: DataStatus,
    sources: list[SourceSummary] | None = None,
    warnings: list[str] | None = None,
    algorithm_version: str | None = None,
) -> KnowledgeMeta:
    standard_warnings = [
        SAFETY_SUMMARY,
        "Data may be incomplete.",
        "Absence of a known interaction does not establish safety.",
    ]
    return KnowledgeMeta(
        request_id=str(request.state.request_id),
        data_status=data_status,
        sources=sources or [],
        warnings=list(dict.fromkeys([*standard_warnings, *(warnings or [])])),
        schema_version=GRAPH_SCHEMA_VERSION,
        algorithm_version=algorithm_version,
    )
