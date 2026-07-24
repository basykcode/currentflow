import os

import pytest
from neo4j import AsyncGraphDatabase

from current_alchemy.domain.common.models import EntityType
from current_alchemy.infrastructure.neo4j.migrations import applied_migrations, migrate
from current_alchemy.infrastructure.neo4j.repository import Neo4jAlchemyRepository

pytestmark = pytest.mark.integration


@pytest.mark.asyncio
async def test_migrations_seed_search_traversal_claims_and_idempotency() -> None:
    if os.environ.get("ALCHEMY_RUN_INTEGRATION") != "1":
        pytest.skip("Set ALCHEMY_RUN_INTEGRATION=1 for disposable Neo4j integration tests")
    uri = os.environ["NEO4J_URI"]
    username = os.environ["NEO4J_USERNAME"]
    password = os.environ["NEO4J_PASSWORD"]
    database = os.environ.get("NEO4J_DATABASE", "neo4j")
    driver = AsyncGraphDatabase.driver(uri, auth=(username, password))
    try:
        first = await migrate(driver, database)
        second = await migrate(driver, database)
        expected_migrations = {"001_constraints", "002_indexes"}
        assert set(first).issubset(expected_migrations)
        assert second == []
        assert set(await applied_migrations(driver, database)) == expected_migrations

        repository = Neo4jAlchemyRepository(driver, database)
        await repository.reset_demo()
        first_seed = await repository.seed_demo()
        second_seed = await repository.seed_demo()
        assert first_seed == second_seed

        herbs = await repository.list_entities(EntityType.HERB_MATERIAL, "azure", {}, 0, 20)
        assert herbs.total == 2
        detail = await repository.get_entity(EntityType.HERB_MATERIAL, "demo:herb:azure-root")
        assert detail is not None
        assert len(detail.claims) == 3
        assert {claim.source.id for claim in detail.claims} == {"demo:source:fixture-v1"}

        graph = await repository.neighborhood("demo:formula:two-lanterns", 2, 50)
        assert graph is not None
        assert {node.id for node in graph.nodes} >= {
            "demo:formula:two-lanterns",
            "demo:herb:azure-root",
        }
        assert all(not node.id.isdigit() for node in graph.nodes)

        pair = await repository.pair_signals({"demo:herb:azure-root", "demo:herb:amber-seed"})
        assert pair[0].relationship_status == "documented"
        assert pair[0].claims[0].source.review_status.value == "synthetic_fixture"

        audit = await repository.audit()
        assert audit["sources"] == 1
    finally:
        await driver.close()
