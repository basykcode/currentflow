from datetime import UTC, date, datetime
from hashlib import sha256
from pathlib import Path

import httpx
import pytest

from current_alchemy.domain.common.models import EntityType, ReviewStatus
from current_alchemy.domain.knowledge.models import (
    BioactivityObservation,
    FormulaConceptRecord,
    FormulaWitnessRecord,
    IdentityResolver,
    IngredientUseRecord,
    MappingMethod,
    MappingStatus,
    PredictionRecord,
    stable_id,
)
from current_alchemy.infrastructure.memory_repository import MemoryAlchemyRepository
from current_alchemy.ingestion.downloads import ReleaseDownloader
from current_alchemy.ingestion.lake import AlchemyDataPaths
from current_alchemy.ingestion.models import GraphLabel, IngestionBatch, PipelineMode, PipelinePhase
from current_alchemy.ingestion.pipeline import ReleasePipeline
from current_alchemy.ingestion.source_registry.models import (
    AcquisitionMethod,
    AcquisitionMode,
    AiUse,
    ArtifactFormat,
    CommercialUse,
    DerivativeDatabase,
    ProductionStatus,
    Redistribution,
    ReleaseArtifact,
    ReleaseRightsSnapshot,
    RightsProjection,
    SourceDataStatus,
    SourceRegistryEntry,
    SourceReleaseManifest,
    SourceRights,
)
from current_alchemy.ingestion.source_registry.policy import RightsPolicy
from current_alchemy.ingestion.source_registry.store import SourceRegistryStore

SERVICE_ROOT = Path(__file__).resolve().parents[2]
DEMO_OBO = SERVICE_ROOT / "tests" / "fixtures" / "disease-ontology-demo.obo"
KNOWLEDGE_FIXTURE = SERVICE_ROOT / "tests" / "fixtures" / "knowledge-foundation-demo.json"


def _rights(*, derivative: DerivativeDatabase = DerivativeDatabase.ALLOWED) -> SourceRights:
    return SourceRights(
        license_name="CC0 1.0 Universal",
        license_url="https://creativecommons.org/publicdomain/zero/1.0/",
        attribution_requirements=["Cite the synthetic fixture."],
        commercial_use=CommercialUse.ALLOWED,
        redistribution=Redistribution.ALLOWED,
        derivative_database=derivative,
        ai_use=AiUse.ALLOWED,
    )


def _source(
    *,
    production_status: ProductionStatus = ProductionStatus.APPROVED,
    rights: SourceRights | None = None,
) -> SourceRegistryEntry:
    return SourceRegistryEntry(
        source_id="demo:source:disease-ontology",
        title="Synthetic Disease Ontology",
        acronym="DEMO-DO",
        responsible_organization="Current test suite",
        description="Visibly synthetic ontology fixture.",
        official_homepage="https://example.test/demo-do",
        official_download_page="https://example.test/demo-do/downloads",
        source_type="synthetic_fixture",
        languages=["en"],
        update_cadence="never",
        expected_scale="three fictional terms",
        canonical_identifiers_supplied=["DEMO"],
        known_upstream_sources=[],
        rights=rights or _rights(),
        source_data_status=SourceDataStatus.AUTHORITATIVE_RELEASE_VERIFIED,
        production_status=production_status,
        acquisition_mode=AcquisitionMode.AUTOMATIC,
        adapter_name="disease-ontology-obo",
        adapter_version="1",
        citation_template="Synthetic fixture.",
        intended_uses=["tests"],
        use_limitations=["No real medical claims."],
        safety_notes=["Synthetic only."],
        contact_information=None,
        last_license_review_date=date(2026, 1, 1),
        license_review_notes="Synthetic fixture rights.",
    )


def _release(
    content: bytes, *, derivative: DerivativeDatabase = DerivativeDatabase.ALLOWED
) -> SourceReleaseManifest:
    rights = _rights(derivative=derivative)
    return SourceReleaseManifest(
        source_id="demo:source:disease-ontology",
        release_id="demo-v1",
        source_version="demo",
        release_date=date(2026, 1, 1),
        retrieved_at=None,
        official_source_url="https://example.test/demo-do",
        official_download_url="https://example.test/demo-do/doid.obo",
        acquisition_method=AcquisitionMethod.HTTP_DOWNLOAD,
        artifacts=[
            ReleaseArtifact(
                filename="doid.obo",
                download_url="https://example.test/demo-do/doid.obo",
                expected_size=len(content),
                sha256=sha256(content).hexdigest(),
                archive_format=ArtifactFormat.OBO,
            )
        ],
        adapter_name="disease-ontology-obo",
        adapter_version="1",
        schema_version="alchemy-graph-v2",
        normalization_version="unicode-whitespace-v1",
        mapping_version="demo-doid-exact-v1",
        license_snapshot=ReleaseRightsSnapshot(
            **rights.model_dump(),
            reviewed_at=date(2026, 1, 1),
            review_notes="Synthetic fixture.",
        ),
        citation_template="Synthetic fixture.",
        original_release_notes="https://example.test/demo-do/release",
        import_eligibility=RightsProjection.PRODUCTION_APPROVED,
    )


def test_committed_source_registry_and_release_manifests_validate() -> None:
    store = SourceRegistryStore(SERVICE_ROOT / "data")
    assert store.validate() == {"sources": 36, "releases": 1}
    source = store.source("source:disease-ontology")
    release = store.release("source:disease-ontology", "v2026-06-30")
    assert source.rights.license_name == "CC0 1.0 Universal"
    assert release.artifacts[0].sha256 == (
        "079fbbfc6d39f5d6c87b7ad1d2db2e058916584aefdcde0a42156860edae2bbc"
    )


def test_rights_policy_is_partitioned_and_inherits_row_rights() -> None:
    content = DEMO_OBO.read_bytes()
    source = _source()
    release = _release(content).model_copy(
        update={"checksum_verified": True, "import_audit_passed": True}
    )
    policy = RightsPolicy()
    assert policy.evaluate(source, release, RightsProjection.PRODUCTION_APPROVED).eligible

    share_alike = _rights(derivative=DerivativeDatabase.SHARE_ALIKE)
    assert not policy.evaluate(
        source,
        release,
        RightsProjection.PRODUCTION_APPROVED,
        row_rights=share_alike,
    ).eligible
    assert policy.evaluate(
        source,
        release,
        RightsProjection.SHARE_ALIKE,
        row_rights=share_alike,
    ).eligible

    pending = _source(production_status=ProductionStatus.PERMISSION_PENDING)
    assert not policy.evaluate(pending, release, RightsProjection.PRODUCTION_APPROVED).eligible
    assert policy.evaluate(pending, release, RightsProjection.PERMISSION_PENDING).eligible


def test_exact_identity_is_stable_but_names_only_create_review_candidates() -> None:
    assert stable_id("compound", "CHEBI:15365") == "compound:chebi-15365"
    exact = IdentityResolver.exact_inchikey(
        source_record_id="demo:record:1",
        canonical_id="demo:compound:1",
        inchikey="BSYNRYMUTXBXSQ-UHFFFAOYSA-N",
        mapping_version="1",
    )
    assert exact.status is MappingStatus.ACCEPTED
    assert exact.method is MappingMethod.EXACT_INCHIKEY

    first = IdentityResolver.name_candidate(
        source_record_id="demo:record:1",
        canonical_id="demo:material:1",
        name="Shared common name",
        mapping_version="1",
    )
    second = IdentityResolver.name_candidate(
        source_record_id="demo:record:2",
        canonical_id="demo:material:2",
        name="Shared common name",
        mapping_version="1",
        fuzzy_score=0.99,
    )
    assert first.status is MappingStatus.NEEDS_REVIEW
    assert second.status is MappingStatus.NEEDS_REVIEW
    assert first.target_id != second.target_id


def test_formula_witness_and_ingredient_use_remain_reified() -> None:
    concept = FormulaConceptRecord(
        id="demo:formula-concept:lantern",
        preferred_name="Synthetic Lantern Formula",
        review_status=ReviewStatus.SYNTHETIC_FIXTURE,
    )
    witness = FormulaWitnessRecord(
        id="demo:formula-witness:lantern:page-1",
        concept_id=concept.id,
        source_record_id="demo:source-record:formula:1",
        source_locator="fixture page 1",
        review_status=ReviewStatus.SYNTHETIC_FIXTURE,
    )
    ingredient = IngredientUseRecord(
        id="demo:ingredient-use:lantern:1",
        witness_id=witness.id,
        source_record_id="demo:source-record:formula-line:1",
        original_ingredient_text="Fictional Azure Root",
        material_id="demo:material:azure-root",
        amount="9",
        unit_id="demo:unit:fictional-li",
        original_unit_text="fictional li",
        sequence=1,
        source_locator="fixture page 1 line 1",
        review_status=ReviewStatus.SYNTHETIC_FIXTURE,
    )
    assert witness.concept_id == concept.id
    assert ingredient.witness_id == witness.id
    assert ingredient.amount == "9"
    assert ingredient.original_unit_text == "fictional li"


def test_prediction_is_not_a_measured_observation() -> None:
    observation = BioactivityObservation(
        id="demo:observation:1",
        source_record_id="demo:source-record:assay:1",
        value="12.5",
        unit="demo-unit",
        activity_type="synthetic assay response",
        review_status=ReviewStatus.SYNTHETIC_FIXTURE,
    )
    prediction = PredictionRecord(
        id="demo:prediction:1",
        subject_id="demo:compound:1",
        model_name="Synthetic model",
        model_version="1",
        score=0.75,
        training_data_reference="demo:training-data:1",
        generated_at=datetime(2026, 1, 1, tzinfo=UTC),
        source_system="test suite",
    )
    assert observation.observation_type == "bioactivity"
    assert not isinstance(prediction, BioactivityObservation)


@pytest.mark.asyncio
async def test_comprehensive_fixture_covers_reified_and_rights_partition_paths() -> None:
    batch = IngestionBatch.model_validate_json(KNOWLEDGE_FIXTURE.read_text(encoding="utf-8"))
    assert all(node.id.startswith("demo:") for node in batch.nodes)
    assert all(relationship.id.startswith("demo:") for relationship in batch.relationships)

    labels = {node.entity_type for node in batch.nodes}
    assert labels >= {
        GraphLabel.FORMULA_CONCEPT,
        GraphLabel.FORMULA_WITNESS,
        GraphLabel.INGREDIENT_USE,
        GraphLabel.PREPARED_MATERIAL,
        GraphLabel.COMPOUND_OCCURRENCE,
        GraphLabel.BIOACTIVITY_OBSERVATION,
        GraphLabel.TOXICITY_OBSERVATION,
        GraphLabel.EXPOSURE_OBSERVATION,
        GraphLabel.PREDICTION,
        GraphLabel.MAPPING_ASSERTION,
        EntityType.COMPOUND,
    }
    nodes = {node.id: node for node in batch.nodes}
    assert nodes["demo:ingredient-use:lantern:1"].properties["unit"] == "fictional-li"
    assert nodes["demo:observation:toxicity:1"].properties["route"] == "fictional route"
    assert nodes["demo:mapping:ambiguous-common-name"].properties["status"] == "needs_review"
    assert nodes["demo:mapping:rejected-common-name"].properties["status"] == "rejected"
    assert nodes["demo:record:mixed-rights:1"].properties["production_eligible"] is False
    assert nodes["demo:prediction:compound-target:1"].entity_type is GraphLabel.PREDICTION

    repository = MemoryAlchemyRepository()
    first = await repository.ingest_batch(batch, batch_size=5)
    second = await repository.ingest_batch(batch, batch_size=5)
    assert (
        first
        == second
        == {
            "nodes": len(batch.nodes),
            "relationships": len(batch.relationships),
        }
    )


@pytest.mark.asyncio
async def test_fixture_pipeline_is_resumable_idempotent_and_dry_run_has_no_graph_writes(
    tmp_path: Path,
) -> None:
    content = DEMO_OBO.read_bytes()

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url == httpx.URL("https://example.test/demo-do/doid.obo")
        return httpx.Response(
            200,
            content=content,
            headers={
                "content-type": "text/plain",
                "content-length": str(len(content)),
                "etag": '"demo-v1"',
            },
        )

    paths = AlchemyDataPaths(tmp_path / "alchemy-data")
    downloader = ReleaseDownloader(
        data_paths=paths,
        user_agent="CurrentAlchemy-tests/0.2",
        max_automatic_bytes=10_000_000,
        timeout_seconds=2,
        transport=httpx.MockTransport(handler),
    )
    repository = MemoryAlchemyRepository()
    pipeline = ReleasePipeline(
        repository=repository,
        paths=paths,
        downloader=downloader,
    )
    first = await pipeline.run(
        _source(),
        _release(content),
        through=PipelinePhase.GRAPH,
        mode=PipelineMode.FULL,
        subset_limit=100,
        projection=RightsProjection.PRODUCTION_APPROVED,
        batch_size=2,
        dry_run=True,
        resume=False,
    )
    second = await pipeline.run(
        _source(),
        _release(content),
        through=PipelinePhase.GRAPH,
        mode=PipelineMode.FULL,
        subset_limit=100,
        projection=RightsProjection.PRODUCTION_APPROVED,
        batch_size=2,
        dry_run=True,
        resume=True,
    )
    assert first["importRunId"] == second["importRunId"]
    graph = first["phases"]["graph"]
    assert graph["dryRun"] is True
    assert graph["nodes"] > 3
    assert (tmp_path / "alchemy-data" / "staging").exists()
    assert (
        paths.release_root("graph-export", "demo:source:disease-ontology", "demo-v1")
        / "nodes.parquet"
    ).exists()
