import os
from pathlib import Path

import pytest
from neo4j import AsyncGraphDatabase

from current_alchemy.domain.common.exploration import RelationshipType
from current_alchemy.domain.common.models import EntityType
from current_alchemy.infrastructure.neo4j.migrations import applied_migrations, migrate
from current_alchemy.infrastructure.neo4j.repository import Neo4jAlchemyRepository
from current_alchemy.ingestion.models import (
    GraphLabel,
    GraphRelationshipType,
    IngestionBatch,
    NodeUpsert,
    RelationshipUpsert,
)

pytestmark = pytest.mark.integration
SERVICE_ROOT = Path(__file__).resolve().parents[2]


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
        expected_migrations = {
            "001_constraints",
            "002_indexes",
            "003_knowledge_graph_constraints",
            "004_knowledge_graph_indexes",
            "005_projection_metadata",
        }
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

        source_id = "demo:source:integration-do"
        release_id = "demo:source-release:integration-do:v1"
        record_id = "demo:source-record:integration-do:DEMO:0001"
        entity_id = "demo:condition:integration-do:0001"
        mapping_id = "demo:mapping:integration-do:0001"
        import_run_id = "demo:import:integration-do:v1"
        batch = IngestionBatch(
            nodes=[
                NodeUpsert(
                    entity_type=EntityType.SOURCE,
                    id=source_id,
                    properties={
                        "display_name": "Synthetic integration source",
                        "title": "Synthetic integration source",
                        "rights_status": "approved",
                        "review_status": "synthetic_fixture",
                        "citation": "Synthetic fixture.",
                        "active": True,
                    },
                ),
                NodeUpsert(
                    entity_type=GraphLabel.LICENSE,
                    id="demo:license:cc0",
                    properties={
                        "display_name": "Synthetic CC0",
                        "name": "Synthetic CC0",
                        "url": "https://creativecommons.org/publicdomain/zero/1.0/",
                        "commercial_use": "allowed",
                        "redistribution": "allowed",
                        "derivative_database": "allowed",
                        "review_status": "synthetic_fixture",
                    },
                ),
                NodeUpsert(
                    entity_type=GraphLabel.SOURCE_RELEASE,
                    id=release_id,
                    properties={
                        "display_name": "Synthetic integration release",
                        "source_id": source_id,
                        "release_id": "v1",
                        "checksum_verified": True,
                        "import_audit_passed": True,
                        "review_status": "synthetic_fixture",
                    },
                ),
                NodeUpsert(
                    entity_type=GraphLabel.SOURCE_RECORD,
                    id=record_id,
                    properties={
                        "display_name": "Synthetic condition record",
                        "source_id": source_id,
                        "release_id": "v1",
                        "row_production_eligible": True,
                        "production_eligible": True,
                        "review_status": "synthetic_fixture",
                    },
                ),
                NodeUpsert(
                    entity_type=GraphLabel.DISEASE_CONCEPT,
                    additional_labels=[
                        GraphLabel.CANONICAL_ENTITY,
                        GraphLabel.CONDITION,
                    ],
                    id=entity_id,
                    properties={
                        "display_name": "Synthetic integration condition",
                        "production_eligible": True,
                        "review_status": "synthetic_fixture",
                    },
                ),
                NodeUpsert(
                    entity_type=GraphLabel.MAPPING_ASSERTION,
                    id=mapping_id,
                    properties={
                        "display_name": "Synthetic exact mapping",
                        "status": "accepted",
                        "method": "exact_external_identifier",
                        "review_status": "synthetic_fixture",
                    },
                ),
                NodeUpsert(
                    entity_type=EntityType.IMPORT_RUN,
                    id=import_run_id,
                    properties={
                        "display_name": import_run_id,
                        "source_id": source_id,
                        "release_id": "v1",
                        "adapter_version": "1",
                        "review_status": "synthetic_fixture",
                    },
                ),
            ],
            relationships=[
                RelationshipUpsert(
                    id="demo:rel:integration-source-release",
                    source_id=source_id,
                    target_id=release_id,
                    relationship_type=GraphRelationshipType.HAS_RELEASE,
                ),
                RelationshipUpsert(
                    id="demo:rel:integration-release-license",
                    source_id=release_id,
                    target_id="demo:license:cc0",
                    relationship_type=GraphRelationshipType.USES_LICENSE,
                ),
                RelationshipUpsert(
                    id="demo:rel:integration-release-record",
                    source_id=release_id,
                    target_id=record_id,
                    relationship_type=GraphRelationshipType.CONTAINS_RECORD,
                ),
                RelationshipUpsert(
                    id="demo:rel:integration-entity-record",
                    source_id=entity_id,
                    target_id=record_id,
                    relationship_type=RelationshipType.SUPPORTED_BY,
                ),
                RelationshipUpsert(
                    id="demo:rel:integration-mapping-subject",
                    source_id=mapping_id,
                    target_id=record_id,
                    relationship_type=GraphRelationshipType.MAPPING_SUBJECT,
                ),
                RelationshipUpsert(
                    id="demo:rel:integration-mapping-target",
                    source_id=mapping_id,
                    target_id=entity_id,
                    relationship_type=GraphRelationshipType.MAPPING_TARGET,
                ),
                RelationshipUpsert(
                    id="demo:rel:integration-run-release",
                    source_id=import_run_id,
                    target_id=release_id,
                    relationship_type=GraphRelationshipType.IMPORTED_RELEASE,
                ),
            ],
        )
        first_import = await repository.ingest_batch(batch, 2)
        second_import = await repository.ingest_batch(batch, 2)
        assert first_import == second_import

        knowledge_fixture = IngestionBatch.model_validate_json(
            (SERVICE_ROOT / "tests" / "fixtures" / "knowledge-foundation-demo.json").read_text(
                encoding="utf-8"
            )
        )
        first_fixture_import = await repository.ingest_batch(knowledge_fixture, 5)
        second_fixture_import = await repository.ingest_batch(knowledge_fixture, 5)
        assert first_fixture_import == second_fixture_import

        provenance = await repository.provenance(entity_id)
        assert provenance["paths"][0]["sourceRecordId"] == record_id
        projection = await repository.rebuild_projections()
        assert projection["canonicalEntities"] >= 1
        assert projection["audit"]["criticalFailures"] == 0
        counts = await repository.graph_counts()
        assert counts["labels"]["SourceRecord"] >= 1
        assert counts["labels"]["FormulaWitness"] == 1
        assert counts["labels"]["Prediction"] == 1
    finally:
        await driver.close()
