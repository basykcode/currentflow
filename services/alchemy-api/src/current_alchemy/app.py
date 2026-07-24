"""FastAPI application factory."""

import logging
import re
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import RequestResponseEndpoint
from starlette.responses import Response

from current_alchemy import __version__
from current_alchemy.api.errors import register_error_handlers
from current_alchemy.api.routers import analysis, explore, health, knowledge, retrieval
from current_alchemy.application.ports.repository import AlchemyRepository
from current_alchemy.config import Settings, get_settings
from current_alchemy.lifespan import neo4j_lifespan
from current_alchemy.logging import configure_logging

_REQUEST_ID = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")


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
    async def request_id_middleware(
        request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        incoming = request.headers.get("X-Request-ID", "")
        request_id = incoming if _REQUEST_ID.fullmatch(incoming) else str(uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        logging.getLogger("current_alchemy.request").info(
            "%s %s %s",
            request.method,
            request.url.path,
            response.status_code,
            extra={"request_id": request_id},
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
