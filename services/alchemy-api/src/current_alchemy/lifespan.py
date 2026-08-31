"""FastAPI lifespan management for the bounded Neo4j async driver."""

import logging
from collections.abc import AsyncIterator, Callable
from contextlib import AbstractAsyncContextManager, asynccontextmanager

from fastapi import FastAPI
from neo4j import AsyncGraphDatabase

from current_alchemy.config import Settings
from current_alchemy.infrastructure.neo4j.repository import Neo4jAlchemyRepository


def neo4j_lifespan(
    settings: Settings,
) -> Callable[[FastAPI], AbstractAsyncContextManager[None]]:
    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        driver = AsyncGraphDatabase.driver(
            settings.neo4j_uri,
            auth=(
                settings.neo4j_username,
                settings.neo4j_password.get_secret_value(),
            ),
            max_connection_pool_size=settings.neo4j_max_connection_pool_size,
            connection_acquisition_timeout=(settings.neo4j_connection_acquisition_timeout_seconds),
            connection_timeout=settings.neo4j_connection_timeout_seconds,
            max_connection_lifetime=settings.neo4j_max_connection_lifetime_seconds,
            liveness_check_timeout=settings.neo4j_liveness_check_timeout_seconds,
            max_transaction_retry_time=settings.neo4j_max_transaction_retry_time_seconds,
            keep_alive=True,
        )
        app.state.driver = driver
        app.state.repository = Neo4jAlchemyRepository(
            driver,
            settings.neo4j_database,
            query_timeout_seconds=settings.neo4j_query_timeout_seconds,
        )
        logging.getLogger("current_alchemy.lifecycle").info(
            "Neo4j driver initialized",
            extra={
                "pool_size": settings.neo4j_max_connection_pool_size,
                "connection_acquisition_timeout_ms": round(
                    settings.neo4j_connection_acquisition_timeout_seconds * 1000
                ),
                "query_timeout_ms": round(settings.neo4j_query_timeout_seconds * 1000),
            },
        )
        try:
            yield
        finally:
            await driver.close()

    return lifespan
