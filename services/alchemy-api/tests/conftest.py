"""Shared isolated test fixtures."""

from collections.abc import Iterator

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from current_alchemy.app import create_app
from current_alchemy.config import Settings
from current_alchemy.infrastructure.memory_repository import MemoryAlchemyRepository


@pytest.fixture
def test_settings() -> Settings:
    return Settings(
        NEO4J_URI="bolt://test.invalid:7687",
        NEO4J_USERNAME="test",
        NEO4J_PASSWORD="test-only",
        PUBCHEM_USER_AGENT="CurrentAlchemy-tests/0.1",
        ALCHEMY_ENV="test",
    )


@pytest.fixture
def repository() -> MemoryAlchemyRepository:
    return MemoryAlchemyRepository()


@pytest.fixture
def api_app(test_settings: Settings, repository: MemoryAlchemyRepository) -> FastAPI:
    return create_app(settings=test_settings, repository=repository)


@pytest.fixture
async def client(api_app: FastAPI) -> Iterator[AsyncClient]:
    async with AsyncClient(
        transport=ASGITransport(app=api_app),
        base_url="http://test",
    ) as test_client:
        yield test_client
