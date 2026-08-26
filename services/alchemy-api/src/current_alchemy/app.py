"""FastAPI application factory."""

import logging
import re
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
from current_alchemy.api.routers import analysis, explore, health, knowledge, retrieval
from current_alchemy.application.ports.repository import AlchemyRepository
from current_alchemy.config import Settings, get_settings
from current_alchemy.lifespan import neo4j_lifespan
from current_alchemy.logging import configure_logging

_REQUEST_ID = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")
_PUBLIC_CACHE_SECONDS = 60
_PUBLIC_STALE_SECONDS = 300


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


def _cache_control(request: Request, response: Response) -> str:
    if response.status_code >= 400 or request.method != "GET":
        return "no-store"
    if request.headers.get("Authorization") or request.headers.get("Cookie"):
        return "private, no-store"
    if request.url.path in {"/api/v1/health/live", "/api/v1/health/ready"}:
        return "no-store"
    if request.url.path.startswith("/api/v1/"):
        return (
            f"public, max-age=0, s-maxage={_PUBLIC_CACHE_SECONDS}, "
            f"stale-while-revalidate={_PUBLIC_STALE_SECONDS}"
        )
    return "no-store"


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
    configure_logging(runtime_settings.alchemy_log_level)

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
        origin_token = runtime_settings.alchemy_origin_token
        if (
            runtime_settings.alchemy_env == "production"
            and origin_token is not None
            and request.url.path not in {"/api/v1/health/live", "/api/v1/health/ready"}
            and not compare_digest(
                request.headers.get("X-Current-Flow-Origin-Token", ""),
                origin_token.get_secret_value(),
            )
        ):
            return _problem_response(
                request_id,
                status=403,
                code="origin_access_denied",
                title="Origin access denied",
                detail=(
                    "This production origin accepts application traffic only through the gateway."
                ),
            )
        content_length = request.headers.get("Content-Length")
        if content_length is not None:
            try:
                declared_size = int(content_length)
            except ValueError:
                declared_size = runtime_settings.alchemy_max_request_body_bytes + 1
            if declared_size > runtime_settings.alchemy_max_request_body_bytes:
                return _problem_response(
                    request_id,
                    status=413,
                    code="request_too_large",
                    title="Request body is too large",
                    detail="The request body exceeds the configured service limit.",
                )
        if request.method not in {"GET", "HEAD", "OPTIONS"} and not await _body_within_limit(
            request,
            runtime_settings.alchemy_max_request_body_bytes,
        ):
            return _problem_response(
                request_id,
                status=413,
                code="request_too_large",
                title="Request body is too large",
                detail="The request body exceeds the configured service limit.",
            )
        try:
            response = await call_next(request)
        except Exception:
            duration_ms = round((perf_counter() - started) * 1000, 3)
            logging.getLogger("current_alchemy.request").exception(
                "request failed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": 500,
                    "duration_ms": duration_ms,
                    "outcome": "error",
                },
            )
            raise
        response.headers["X-Request-ID"] = request_id
        response.headers["Cache-Control"] = _cache_control(request, response)
        vary = response.headers.get("Vary")
        if vary is None:
            response.headers["Vary"] = "Origin"
        elif "origin" not in {item.strip().lower() for item in vary.split(",")}:
            response.headers["Vary"] = f"{vary}, Origin"
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
            etag = f'"{sha256(body).hexdigest()}"'
            headers = dict(response.headers)
            headers["ETag"] = etag
            if request.headers.get("If-None-Match") == etag:
                headers.pop("content-length", None)
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
        logging.getLogger("current_alchemy.request").info(
            "request completed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "outcome": "success" if response.status_code < 400 else "error",
            },
        )
        return response

    prefix = "/api/v1"
    app.include_router(health.router, prefix=prefix)
    app.include_router(knowledge.router, prefix=prefix)
    app.include_router(analysis.router, prefix=prefix)
    app.include_router(explore.router, prefix=prefix)
    app.include_router(retrieval.router, prefix=prefix)
    register_error_handlers(app)
    return app
