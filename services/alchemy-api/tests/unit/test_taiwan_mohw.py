import json
import shutil
from pathlib import Path

from current_alchemy.domain.common.models import EntityType
from current_alchemy.ingestion.adapters.taiwan_mohw import (
    TaiwanMohwPharmacopeiaAdapter,
)
from current_alchemy.ingestion.downloads import ReleaseDownloader
from current_alchemy.ingestion.lake import AlchemyDataPaths
from current_alchemy.ingestion.models import (
    GraphLabel,
    GraphRelationshipType,
    PipelineMode,
)
from current_alchemy.ingestion.source_registry.store import SourceRegistryStore

SERVICE_ROOT = Path(__file__).resolve().parents[2]
SNAPSHOT = SERVICE_ROOT / "data" / "releases" / "taiwan-mohw-thp4-2025-07-30.json"
NAMES_SNAPSHOT = SERVICE_ROOT / "data" / "releases" / "taiwan-mohw-multilingual-names-v1.json"
SOURCE_ID = "source:taiwan-mohw-docmap"
RELEASE_ID = "thp4-2025-07-30"


def test_committed_snapshot_is_complete_and_internally_ordered() -> None:
    snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    materials = snapshot["materiaMedica"]
    formulas = snapshot["formulas"]

    assert snapshot["counts"] == {
        "baseIngredientUses": 1672,
        "medicinalMaterialMonographs": 355,
        "standardizedFormulas": 200,
    }
    assert len({material["name"] for material in materials}) == 355
    assert [formula["sequence"] for formula in formulas] == list(range(1, 201))
    assert len({formula["sourceUrl"] for formula in formulas}) == 200
    assert sum(len(formula["ingredients"]) for formula in formulas) == 1672
    for formula in formulas:
        assert [item["position"] for item in formula["ingredients"]] == list(
            range(1, len(formula["ingredients"]) + 1)
        )
        assert all(item["name"] and item["amountText"] for item in formula["ingredients"])

    assert formulas[0]["name"] == "六味地黃丸《丸》"
    assert [item["name"] for item in formulas[0]["ingredients"]] == [
        "熟地黃",
        "山茱萸",
        "山藥",
        "澤瀉",
        "牡丹皮",
        "茯苓",
    ]
    assert formulas[122]["reportedItem"] == "122"
    assert formulas[122]["name"] == "橘核丸《丸》"
    assert len(snapshot["sourceAnomalies"]) == 1


def test_multilingual_name_snapshot_covers_every_material_and_formula() -> None:
    snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    names = json.loads(NAMES_SNAPSHOT.read_text(encoding="utf-8"))
    material_names = {item["chineseTraditional"]: item for item in names["materials"]}
    formula_names = {item["sequence"]: item for item in names["formulas"]}
    all_material_terms = {material["name"] for material in snapshot["materiaMedica"]} | {
        ingredient["name"]
        for formula in snapshot["formulas"]
        for ingredient in formula["ingredients"]
    }

    assert names["counts"]["materials"] == 448
    assert names["counts"]["officialMaterialEnglishNames"] == 355
    assert names["counts"]["formulas"] == 200
    assert names["counts"]["officialFormulaRomanizationReferences"] == 65
    assert names["counts"]["officialFormulaPinyinMatches"] == 58
    assert set(material_names) == all_material_terms
    assert set(formula_names) == set(range(1, 201))
    assert all(
        item["english"] and item["pinyin"] and item["pinyinAscii"]
        for item in [*material_names.values(), *formula_names.values()]
    )
    assert material_names["肉桂"]["english"] == "Cinnamon Bark"
    assert material_names["肉桂"]["pinyin"] == "Ròu Guì"
    assert formula_names[1]["english"] == "Six-Ingredient Rehmannia Pill"
    assert formula_names[1]["pinyin"] == "Liù Wèi Dì Huáng Wán"


def test_adapter_builds_public_projection_and_evidence_graph(tmp_path: Path) -> None:
    store = SourceRegistryStore(SERVICE_ROOT / "data")
    source = store.source(SOURCE_ID)
    manifest = store.release(SOURCE_ID, RELEASE_ID)
    paths = AlchemyDataPaths(tmp_path / "lake")
    paths.ensure()
    raw = paths.raw_original(SOURCE_ID, RELEASE_ID)
    raw.mkdir(parents=True)
    shutil.copyfile(SNAPSHOT, raw / SNAPSHOT.name)
    shutil.copyfile(NAMES_SNAPSHOT, raw / NAMES_SNAPSHOT.name)
    adapter = TaiwanMohwPharmacopeiaAdapter()

    staged = adapter.stage(
        source,
        manifest,
        paths,
        mode=PipelineMode.FULL,
        subset_limit=10,
        import_run_id="import:test:taiwan-mohw",
    )
    normalized = adapter.normalize(
        source,
        manifest,
        paths,
        import_run_id="import:test:taiwan-mohw",
    )
    audit = adapter.audit(manifest, paths)
    batch = adapter.propose_mappings(
        source,
        manifest,
        paths,
        import_run_id="import:test:taiwan-mohw",
        production_eligible=True,
    )

    assert staged["stagedMaterials"] == 355
    assert staged["stagedFormulas"] == 200
    assert staged["stagedIngredientUses"] == 1672
    assert normalized["officialMonographs"] == 355
    assert normalized["additionalFormulaTerms"] == 93
    assert normalized["preparedMaterialTerms"] == 1
    assert audit["passed"] is True

    public_materials = [
        node for node in batch.nodes if node.entity_type is EntityType.HERB_MATERIAL
    ]
    formulas = [node for node in batch.nodes if node.entity_type is EntityType.FORMULA]
    witnesses = [node for node in batch.nodes if node.entity_type is GraphLabel.FORMULA_WITNESS]
    ingredient_uses = [
        node for node in batch.nodes if node.entity_type is GraphLabel.INGREDIENT_USE
    ]
    source_records = [node for node in batch.nodes if node.entity_type is GraphLabel.SOURCE_RECORD]
    canonical_names = [
        node for node in batch.nodes if node.entity_type is GraphLabel.CANONICAL_NAME
    ]
    assert len(public_materials) == 447
    assert len(formulas) == 200
    assert len(witnesses) == 200
    assert len(ingredient_uses) == 1672
    assert len(source_records) == 555
    assert len(canonical_names) == 1_944
    assert len({node.id for node in batch.nodes}) == len(batch.nodes)
    assert len({relationship.id for relationship in batch.relationships}) == len(
        batch.relationships
    )

    first_formula = next(
        node for node in formulas if node.id == "formula:taiwan-mohw:cp-866-5524-108"
    )
    assert first_formula.properties["display_name"] == "Six-Ingredient Rehmannia Pill"
    assert first_formula.properties["name_schema_version"] == ("taiwan-mohw-multilingual-names-v1")
    assert first_formula.properties["ingredient_ids"] == [
        next(
            node.id
            for node in public_materials
            if any(item["text"] == name for item in json.loads(str(node.properties["names_json"])))
        )
        for name in ("熟地黃", "山茱萸", "山藥", "澤瀉", "牡丹皮", "茯苓")
    ]
    assert first_formula.properties["ingredient_amount_texts"] == ["8", "4", "4", "3", "3", "3"]
    assert first_formula.properties["ingredient_units"] == ["g"] * 6

    ingredient_targets = {
        relationship.target_id
        for relationship in batch.relationships
        if relationship.relationship_type
        in {
            GraphRelationshipType.USES_MATERIAL,
            GraphRelationshipType.USES_PREPARED_MATERIAL,
        }
    }
    assert len(ingredient_targets) == 255
    assert (
        sum(
            relationship.relationship_type
            in {
                GraphRelationshipType.USES_MATERIAL,
                GraphRelationshipType.USES_PREPARED_MATERIAL,
            }
            for relationship in batch.relationships
        )
        == 1672
    )

    supported_entities = {
        relationship.source_id
        for relationship in batch.relationships
        if relationship.relationship_type.value == "SUPPORTED_BY"
    }
    canonical_entities = {
        node.id for node in batch.nodes if GraphLabel.CANONICAL_ENTITY in node.additional_labels
    }
    assert canonical_entities <= supported_entities
    assert {witness.id for witness in witnesses} <= supported_entities


def test_acquisition_plan_accepts_pinned_bundled_snapshot(tmp_path: Path) -> None:
    store = SourceRegistryStore(SERVICE_ROOT / "data")
    source = store.source(SOURCE_ID)
    manifest = store.release(SOURCE_ID, RELEASE_ID)
    downloader = ReleaseDownloader(
        data_paths=AlchemyDataPaths(tmp_path / "lake"),
        user_agent="CurrentAlchemy-Test/0.1 (https://current-flow.net)",
        max_automatic_bytes=20_000_000,
        timeout_seconds=10,
    )

    plan = TaiwanMohwPharmacopeiaAdapter().plan_acquisition(source, manifest, downloader)

    assert plan.automatic is True
    assert plan.expected_bytes == 17_590_331
