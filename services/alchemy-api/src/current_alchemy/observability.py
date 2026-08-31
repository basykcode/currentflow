"""Request-scoped metrics shared by HTTP and Neo4j instrumentation."""

from contextvars import ContextVar, Token
from dataclasses import dataclass


@dataclass(slots=True)
class RequestMetrics:
    """Mutable counters owned by one request context."""

    query_count: int = 0
    neo4j_duration_ms: float = 0.0


_request_id: ContextVar[str | None] = ContextVar("current_alchemy_request_id", default=None)
_request_metrics: ContextVar[RequestMetrics | None] = ContextVar(
    "current_alchemy_request_metrics", default=None
)


def begin_request(request_id: str) -> tuple[Token[str | None], Token[RequestMetrics | None]]:
    """Install fresh request correlation state and return reset tokens."""

    return _request_id.set(request_id), _request_metrics.set(RequestMetrics())


def end_request(tokens: tuple[Token[str | None], Token[RequestMetrics | None]]) -> None:
    """Restore the prior context after a response is finalized."""

    request_id_token, metrics_token = tokens
    _request_metrics.reset(metrics_token)
    _request_id.reset(request_id_token)


def current_request_id() -> str | None:
    """Return the active request ID, if this query belongs to an HTTP request."""

    return _request_id.get()


def record_query(duration_ms: float) -> None:
    """Add one bounded query dispatch to the current request totals."""

    metrics = _request_metrics.get()
    if metrics is not None:
        metrics.query_count += 1
        metrics.neo4j_duration_ms += duration_ms


def request_metrics() -> RequestMetrics:
    """Return a snapshot suitable for the final request log."""

    metrics = _request_metrics.get()
    if metrics is None:
        return RequestMetrics()
    return RequestMetrics(
        query_count=metrics.query_count,
        neo4j_duration_ms=round(metrics.neo4j_duration_ms, 3),
    )
