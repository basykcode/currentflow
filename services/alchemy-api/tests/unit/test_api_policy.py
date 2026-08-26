import json
import logging
import sys
from time import perf_counter
from typing import cast

import pytest
from neo4j import AsyncResult
from starlette.requests import Request
from starlette.responses import Response

from current_alchemy.api.policy import EndpointClass, RatePolicyClass, endpoint_policy
from current_alchemy.app import _cache_control
from current_alchemy.infrastructure.neo4j.repository import _TimedResult
from current_alchemy.logging import JsonFormatter
from current_alchemy.observability import begin_request, end_request, request_metrics


def _request(path: str, headers: list[tuple[bytes, bytes]] | None = None) -> Request:
    return Request(
        {
            "type": "http",
            "method": "GET",
            "scheme": "https",
            "path": path,
            "raw_path": path.encode(),
            "query_string": b"",
            "headers": headers or [],
            "client": ("127.0.0.1", 1),
            "server": ("test", 443),
        }
    )


def test_endpoint_registry_is_deny_by_default_and_separates_private_routes() -> None:
    assert endpoint_policy("GET", "/api/v1/herbs").rate_class is RatePolicyClass.SEARCH
    assert (
        endpoint_policy("GET", "/api/v1/herbs/material:1").endpoint_class
        is EndpointClass.PUBLIC_CACHEABLE
    )
    assert endpoint_policy("GET", "/api/v1/health/live").endpoint_class is EndpointClass.HEALTH
    assert (
        endpoint_policy("GET", "/api/v1/users/me").endpoint_class is EndpointClass.PRIVATE_NO_STORE
    )
    assert (
        endpoint_policy("POST", "/api/v1/imports/run").endpoint_class
        is EndpointClass.ADMINISTRATIVE
    )
    assert (
        endpoint_policy("GET", "/api/v1/new-unclassified-route").endpoint_class
        is EndpointClass.PUBLIC_UNCACHEABLE
    )


def test_set_cookie_and_authorization_override_public_cache_policy() -> None:
    policy = endpoint_policy("GET", "/api/v1/meta")
    cookie_response = Response(status_code=200, headers={"Set-Cookie": "private=1"})
    assert _cache_control(_request("/api/v1/meta"), cookie_response, policy) == (
        "private, no-store"
    )

    authorized = _request("/api/v1/meta", [(b"authorization", b"Bearer test")])
    assert _cache_control(authorized, Response(status_code=200), policy) == "private, no-store"
    assert _cache_control(_request("/api/v1/meta"), Response(status_code=500), policy) == "no-store"


def test_json_formatter_includes_runtime_fields_without_exception_detail() -> None:
    formatter = JsonFormatter(environment="test", build_sha="abc123", instance_id="instance-1")
    try:
        raise RuntimeError("secret provider detail")
    except RuntimeError:
        record = logging.LogRecord(
            "current_alchemy.request",
            logging.ERROR,
            __file__,
            1,
            "request failed",
            (),
            sys.exc_info(),
        )
    record.path = "/api/v1/users/private-id"
    payload = json.loads(formatter.format(record))
    assert payload["service"] == "current-alchemy-api"
    assert payload["environment"] == "test"
    assert payload["buildSha"] == "abc123"
    assert payload["exceptionType"] == "RuntimeError"
    assert "path" not in payload
    assert "secret provider detail" not in json.dumps(payload)


@pytest.mark.asyncio
async def test_timed_query_records_operation_count_and_request_totals(
    caplog: pytest.LogCaptureFixture,
) -> None:
    class FakeResult:
        async def single(self, *, strict: bool = False) -> dict[str, int]:
            del strict
            return {"count": 1}

    tokens = begin_request("request-test")
    caplog.set_level(logging.INFO, logger="current_alchemy.neo4j.query")
    try:
        result = _TimedResult(
            cast(AsyncResult, FakeResult()),
            "sources.active_count",
            perf_counter(),
        )
        assert await result.single() == {"count": 1}
        metrics = request_metrics()
        assert metrics.query_count == 1
        assert metrics.neo4j_duration_ms >= 0
        record = caplog.records[-1]
        assert record.operation == "sources.active_count"
        assert record.record_count == 1
        assert record.request_id == "request-test"
    finally:
        end_request(tokens)
