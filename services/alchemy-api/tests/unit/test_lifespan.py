from typing import Any, cast

import pytest
from fastapi import FastAPI
from neo4j import AsyncDriver, AsyncGraphDatabase

from current_alchemy.config import Settings
from current_alchemy.lifespan import neo4j_lifespan


@pytest.mark.asyncio
async def test_lifespan_creates_one_bounded_driver_and_closes_it(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class FakeDriver:
        closed = False

        async def close(self) -> None:
            self.closed = True

    fake_driver = FakeDriver()
    calls: list[dict[str, Any]] = []

    def create_driver(*args: object, **kwargs: Any) -> AsyncDriver:
        del args
        calls.append(kwargs)
        return cast(AsyncDriver, fake_driver)

    monkeypatch.setattr(AsyncGraphDatabase, "driver", create_driver)
    settings = Settings(
        NEO4J_URI="bolt://test.invalid:7687",
        NEO4J_USERNAME="test",
        NEO4J_PASSWORD="test-only",
        PUBCHEM_USER_AGENT="CurrentAlchemy-tests/0.1",
        ALCHEMY_ENV="test",
    )
    app = FastAPI()
    async with neo4j_lifespan(settings)(app):
        assert len(calls) == 1
        assert calls[0]["max_connection_pool_size"] == 20
        assert calls[0]["connection_acquisition_timeout"] == 5
        assert calls[0]["connection_timeout"] == 10
        assert calls[0]["max_connection_lifetime"] == 1800
        assert calls[0]["liveness_check_timeout"] == 30
        assert hasattr(app.state, "repository")
    assert fake_driver.closed is True
