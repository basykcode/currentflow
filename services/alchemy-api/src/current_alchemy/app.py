"""FastAPI application factory."""

import logging
import re
from asyncio import timeout
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from hashlib import sha256
from secrets import compare_digest
from time import perf_counter
from typing import cast
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import RequestResponseEndpoint
from starlette.responses import JSONResponse, Response

from current_alchemy import __version__
from current_alchemy.api.errors import register_error_handlers
from current_alchemy.api.policy import EndpointClass, EndpointPolicy, endpoint_policy
from current_alchemy.api.routers import analysis, explore, health, knowledge, retrieval
from current_alchemy.application.ports.repository import AlchemyRepository
from current_alchemy.config import Settings, get_settings
from current_alchemy.lifespan import neo4j_lifespan
from current_alchemy.logging import configure_logging
from current_alchemy.observability import begin_request, end_request, request_metrics

_REQUEST_ID = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")
_ENTITY_TAG = re.compile(r'(?:W/)?"[\x21\x23-\x7e\x80-\xff]*"')


def _request_id(request: Request) -> str:
    incoming = request.headers.get("X-Request-ID", "")
    return incoming if _REQUEST_ID.fullmatch(incoming) else str(uuid4())


async def _body_within_limit(request: Request, maximum_bytes: int) -> bool:
    chunks: list[bytes] = []
    received = 0
    async for chunk in request.stream():
        received += len(chunk)
        if received > maximum_bytes:
            return False
        chunks.append(chunk)
    request._body = b"".join(chunks)
    return True


def _cache_control(request: Request, response: Response, policy: EndpointPolicy) -> str:
    if response.status_code >= 400 or request.method != "GET":
        return "no-store"
    if (
        request.headers.get("Authorization")
        or request.headers.get("Cookie")
        or response.headers.get("Set-Cookie")
    ):
        return "private, no-store"
    return policy.cache_control


def _if_none_match_matches(field_value: str | None, current_etag: str) -> bool:
    """Evaluate If-None-Match with the weak comparison required for GET and HEAD."""
    if field_value is None:
        return False

    position = 0
    matched = False
    while position < len(field_value):
        while position < len(field_value) and field_value[position] in " \t":
            position += 1
        if position >= len(field_value):
            return False
        if field_value[position] == "*":
            position += 1
            matched = True
        else:
            candidate = _ENTITY_TAG.match(field_value, position)
            if candidate is None:
                return False
            candidate_etag = candidate.group(0)
            position = candidate.end()
            matched = matched or candidate_etag.removeprefix("W/") == current_etag
        while position < len(field_value) and field_value[position] in " \t":
            position += 1
        if position == len(field_value):
            return matched
        if field_value[position] != ",":
            return False
        position += 1

    return False


def _endpoint_template(request: Request) -> str:
    route = request.scope.get("route")
    template = getattr(route, "path", None)
    return template if isinstance(template, str) else "unmatched"


def _apply_security_headers(response: Response) -> None:
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["X-Frame-Options"] = "DENY"


def _problem_response(
    request_id: str,
    *,
    status: int,
    code: str,
    title: str,
    detail: str,
) -> JSONResponse:
    return JSONResponse(
        status_code=status,
        media_type="application/problem+json",
        headers={
            "X-Request-ID": request_id,
            "Cache-Control": "no-store",
        },
        content={
            "type": f"https://current-flow.net/problems/{code}",
            "title": title,
            "status": status,
            "code": code,
            "detail": detail,
            "requestId": request_id,
            "errors": [],
        },
    )


def create_app(
    *,
    settings: Settings | None = None,
    repository: AlchemyRepository | None = None,
) -> FastAPI:
    runtime_settings = settings or get_settings()
    configure_logging(
        runtime_settings.alchemy_log_level,
        environment=runtime_settings.alchemy_env,
        build_sha=runtime_settings.alchemy_git_sha,
        instance_id=runtime_settings.alchemy_instance_id,
    )

    if repository is None:
        lifespan = neo4j_lifespan(runtime_settings)
    else:

        @asynccontextmanager
        async def injected_lifespan(app: FastAPI) -> AsyncIterator[None]:
            app.state.repository = repository
            yield

        lifespan = injected_lifespan

    app = FastAPI(
        title="Current Alchemy API",
        summary="Sourced graph research and deterministic formula analysis",
        description=(
            "Educational and research information only; not medical advice. "
            "Data may be incomplete, "
            "and absence of a known interaction does not establish safety."
        ),
        version=__version__,
        openapi_url="/api/v1/openapi.json",
        docs_url="/api/v1/docs",
        redoc_url="/api/v1/redoc",
        lifespan=lifespan,
    )
    app.state.settings = runtime_settings
    if repository is not None:
        app.state.repository = repository
    app.add_middleware(
        CORSMiddleware,
        allow_origins=runtime_settings.alchemy_allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Accept", "Content-Type", "X-Request-ID"],
        expose_headers=["X-Request-ID"],
    )

    @app.middleware("http")
    async def production_policy_middleware(
        request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        started = perf_counter()
        request_id = _request_id(request)
        request.state.request_id = request_id
        context_tokens = begin_request(request_id)
        policy = endpoint_policy(request.method, request.url.path)
        try:
            origin_token = runtime_settings.alchemy_origin_token
            secondary_origin_token = runtime_settings.alchemy_secondary_origin_token
            incoming_origin_token = request.headers.get("X-Current-Flow-Origin-Token", "")
            if (
                runtime_settings.alchemy_env == "production"
                and runtime_settings.alchemy_require_edge_origin_token
                and origin_token is not None
                and policy.endpoint_class is not EndpointClass.HEALTH
                and not any(
                    compare_digest(incoming_origin_token, candidate.get_secret_value())
                    for candidate in (origin_token, secondary_origin_token)
                    if candidate is not None
                )
            ):
                response: Response = _problem_response(
                    request_id,
                    status=403,
                    code="origin_access_denied",
                    title="Origin access denied",
                    detail=(
                        "This production origin accepts application traffic only "
                        "through the gateway."
                    ),
                )
            else:
                content_length = request.headers.get("Content-Length")
                if content_length is not None:
                    try:
                        declared_size = int(content_length)
                    except ValueError:
                        declared_size = runtime_settings.alchemy_max_request_body_bytes + 1
                else:
                    declared_size = 0
                if declared_size > runtime_settings.alchemy_max_request_body_bytes:
                    response = _problem_response(
                        request_id,
                        status=413,
                        code="request_too_large",
                        title="Request body is too large",
                        detail="The request body exceeds the configured service limit.",
                    )
                elif request.method not in {"GET", "HEAD", "OPTIONS"} and not (
                    await _body_within_limit(
                        request,
                        runtime_settings.alchemy_max_request_body_bytes,
                    )
                ):
                    response = _problem_response(
                        request_id,
                        status=413,
                        code="request_too_large",
                        title="Request body is too large",
                        detail="The request body exceeds the configured service limit.",
                    )
                else:
                    try:
                        async with timeout(runtime_settings.alchemy_request_timeout_seconds):
                            response = await call_next(request)
                    except TimeoutError:
                        response = _problem_response(
                            request_id,
                            status=504,
                            code="request_timeout",
                            title="Request timed out",
                            detail="The request exceeded the configured service deadline.",
                        )
        except Exception:
            duration_ms = round((perf_counter() - started) * 1000, 3)
            metrics = request_metrics()
            logging.getLogger("current_alchemy.request").exception(
                "request failed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "endpoint_template": _endpoint_template(request),
                    "status_code": 500,
                    "duration_ms": duration_ms,
                    "outcome": "error",
                    "query_count": metrics.query_count,
                    "neo4j_duration_ms": metrics.neo4j_duration_ms,
                    "rate_class": policy.rate_class.value,
                },
            )
            end_request(context_tokens)
            raise
        try:
            response.headers["X-Request-ID"] = request_id
            response.headers["Cache-Control"] = _cache_control(request, response, policy)
            _apply_security_headers(response)
            response_size = int(response.headers.get("Content-Length", "0") or 0)
            body_iterator = getattr(response, "body_iterator", None)
            if response.headers["Cache-Control"].startswith("public") and body_iterator is not None:
                chunks = [
                    chunk
                    async for chunk in cast(
                        AsyncIterator[str | bytes | memoryview],
                        body_iterator,
                    )
                ]
                body = b"".join(
                    chunk.encode() if isinstance(chunk, str) else bytes(chunk) for chunk in chunks
                )
                response_size = len(body)
                etag = f'"{sha256(body).hexdigest()}"'
                headers = dict(response.headers)
                headers["ETag"] = etag
                if request.method in {"GET", "HEAD"} and _if_none_match_matches(
                    request.headers.get("If-None-Match"), etag
                ):
                    headers.pop("content-length", None)
                    response_size = 0
                    response = Response(status_code=304, headers=headers)
                else:
                    response = Response(
                        content=body,
                        status_code=response.status_code,
                        headers=headers,
                        media_type=response.media_type,
                        background=response.background,
                    )
            duration_ms = round((perf_counter() - started) * 1000, 3)
            metrics = request_metrics()
            logging.getLogger("current_alchemy.request").info(
                "request completed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "endpoint_template": _endpoint_template(request),
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                    "response_size": response_size,
                    "cache_policy": response.headers["Cache-Control"],
                    "query_count": metrics.query_count,
                    "neo4j_duration_ms": metrics.neo4j_duration_ms,
                    "rate_class": policy.rate_class.value,
                    "outcome": "success" if response.status_code < 400 else "error",
                },
            )
            return response
        finally:
            end_request(context_tokens)

    prefix = "/api/v1"
    app.include_router(health.router, prefix=prefix)
    app.include_router(knowledge.router, prefix=prefix)
    app.include_router(analysis.router, prefix=prefix)
    app.include_router(explore.router, prefix=prefix)
    app.include_router(retrieval.router, prefix=prefix)
    register_error_handlers(app)
    return app
