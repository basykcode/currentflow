"""FastAPI lifespan management for the Neo4j async driver."""

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
        )
        try:
            await driver.verify_connectivity()
        except Exception:
            await driver.close()
            raise
        app.state.driver = driver
        app.state.repository = Neo4jAlchemyRepository(driver, settings.neo4j_database)
        try:
            yield
        finally:
            await driver.close()

    return lifespan
