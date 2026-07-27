"""Taiwan MOHW pharmacopeia and standardized-formula release adapter."""

from __future__ import annotations

import json
import re
import shutil
from collections import defaultdict
from hashlib import sha256
from pathlib import Path
from typing import cast

import duckdb
import pyarrow as pa
import pyarrow.parquet as pq

from current_alchemy.application.ports.repository import AlchemyRepository
from current_alchemy.domain.common.exploration import RelationshipType
from current_alchemy.domain.common.models import EntityType
from current_alchemy.domain.common.normalization import normalize_name, normalize_source_text
from current_alchemy.domain.knowledge.models import IdentityResolver, stable_id
from current_alchemy.ingestion.downloads import DownloadPlan, ReleaseDownloader, file_sha256
from current_alchemy.ingestion.lake import AlchemyDataPaths
from current_alchemy.ingestion.models import (
    GraphLabel,
    GraphRelationshipType,
    IngestionBatch,
    NodeUpsert,
    PipelineMode,
    RelationshipUpsert,
)
from current_alchemy.ingestion.source_registry.models import (
    SourceRegistryEntry,
    SourceReleaseManifest,
)

_SNAPSHOT_FILENAME = "taiwan-mohw-thp4-2025-07-30.json"
_MULTILINGUAL_SEED_FILENAME = "taiwan-mohw-multilingual-seed-v1.json"
_MULTILINGUAL_NAMES_FILENAME = "taiwan-mohw-multilingual-names-v1.json"
_PHARMACOPEIA_FILENAME = "taiwan-herbal-pharmacopeia-4.pdf"
_CORRECTIONS_FILENAME = "thp4-corrections-2025-07-30.pdf"
_FORMULA_COMPENDIUM_FILENAME = "mohw-common-formulas-bilingual-2021.pdf"
_NAME_SCHEMA_VERSION = "taiwan-mohw-multilingual-names-v1"
_EXPECTED_MATERIALS = 355
_EXPECTED_ALL_MATERIAL_TERMS = 448
_EXPECTED_PUBLIC_MATERIALS = 447
_EXPECTED_FORMULAS = 200
_EXPECTED_INGREDIENT_USES = 1672
_EXCIPIENT_TERMS = frozenset({"油質基劑"})
_DOSAGE_FORM_ENGLISH = {"丸": "Pill", "丹": "Elixir", "散": "Powder"}
_FORMULA_PAGE_ID = re.compile(r"(cp-866-\d+-108)\.html$")


def _write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        f"{json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True)}\n",
        encoding="utf-8",
    )


def _write_table(
    connection: duckdb.DuckDBPyConnection,
    name: str,
    rows: list[dict[str, object]],
    schema: pa.Schema,
    parquet_path: Path,
) -> None:
    table = pa.Table.from_pylist(rows, schema=schema)
    connection.register(f"input_{name}", table)
    connection.execute(f"CREATE OR REPLACE TABLE {name} AS SELECT * FROM input_{name}")
    parquet_path.parent.mkdir(parents=True, exist_ok=True)
    pq.write_table(table, parquet_path, compression="zstd")


def _read_rows(path: Path) -> list[dict[str, object]]:
    return cast(list[dict[str, object]], pq.read_table(path).to_pylist())


def _dict_list(value: object, field: str) -> list[dict[str, object]]:
    if not isinstance(value, list) or not all(isinstance(item, dict) for item in value):
        raise ValueError(f"snapshot field {field!r} must be a list of objects")
    return cast(list[dict[str, object]], value)


def _snapshot(path: Path) -> dict[str, object]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("snapshot root must be an object")
    result = cast(dict[str, object], value)
    if result.get("schemaVersion") != "taiwan-mohw-foundation-snapshot-v1":
        raise ValueError("unsupported Taiwan MOHW snapshot schema")
    return result


def _names_snapshot(path: Path) -> dict[str, object]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("multilingual names snapshot root must be an object")
    result = cast(dict[str, object], value)
    if result.get("schemaVersion") != _NAME_SCHEMA_VERSION:
        raise ValueError("unsupported Taiwan MOHW multilingual names snapshot schema")
    return result


def _formula_page_id(url: str) -> str:
    match = _FORMULA_PAGE_ID.search(url)
    if match is None:
        raise ValueError(f"formula URL has no stable ministry page identifier: {url}")
    return match.group(1)


def _record_id(
    source_id: str,
    release_id: str,
    record_type: str,
    external_id: str,
) -> str:
    invariant = f"{source_id}|{release_id}|{record_type}|{external_id}"
    if external_id.isascii():
        return stable_id("source-record-taiwan-mohw", invariant)
    digest = sha256(invariant.encode("utf-8")).hexdigest()[:24]
    return f"source-record-taiwan-mohw:sha256:{digest}"


def _material_id(name: str) -> str:
    return stable_id("material-taiwan-mohw-thp4", normalize_name(name))


def _formula_id(source_url: str) -> str:
    return f"formula:taiwan-mohw:{_formula_page_id(source_url)}"


def _names_json(
    *,
    chinese_traditional: str,
    english: str,
    pinyin_toned: str,
    pinyin_ascii: str,
    source_id: str,
) -> str:
    return json.dumps(
        [
            {
                "text": english,
                "normalized": normalize_name(english),
                "language": "en",
                "script": "Latn",
                "kind": "preferred",
                "sourceId": source_id,
                "reviewStatus": "machine_imported",
            },
            {
                "text": pinyin_toned,
                "normalized": normalize_name(pinyin_toned),
                "language": "zh-Latn-pinyin",
                "script": "Latn",
                "kind": "hanyu_pinyin_tone_marks",
                "sourceId": source_id,
                "reviewStatus": "machine_imported",
            },
            {
                "text": pinyin_ascii,
                "normalized": normalize_name(pinyin_ascii),
                "language": "zh-Latn-pinyin-x-plain",
                "script": "Latn",
                "kind": "search_romanization",
                "sourceId": source_id,
                "reviewStatus": "machine_imported",
            },
            {
                "text": chinese_traditional,
                "normalized": normalize_name(chinese_traditional),
                "language": "zh-Hant",
                "script": "Hant",
                "kind": "source_preferred",
                "sourceId": source_id,
                "reviewStatus": "machine_imported",
            },
        ],
        ensure_ascii=False,
        sort_keys=True,
    )


def _append_multilingual_names(
    nodes: list[NodeUpsert],
    relationships: list[RelationshipUpsert],
    *,
    entity_id: str,
    source_id: str,
    source_record_id: str | None,
    chinese_traditional: str,
    english: str,
    english_provenance: str,
    pinyin_toned: str,
    pinyin_ascii: str,
    pinyin_provenance: str,
) -> None:
    names = (
        (
            "en",
            english,
            normalize_name(english),
            "Latn",
            "preferred",
            english_provenance,
        ),
        (
            "zh-Latn-pinyin",
            pinyin_toned,
            normalize_name(pinyin_toned),
            "Latn",
            "hanyu_pinyin_tone_marks",
            pinyin_provenance,
        ),
        (
            "zh-Hant",
            chinese_traditional,
            normalize_name(chinese_traditional),
            "Hant",
            "source_preferred",
            "taiwan_mohw_exact_source_title",
        ),
    )
    for language, text, normalized, script, kind, provenance in names:
        name_id = stable_id("canonical-name", f"{entity_id}|{text}|{language}")
        nodes.append(
            NodeUpsert(
                entity_type=GraphLabel.CANONICAL_NAME,
                id=name_id,
                properties={
                    "display_name": text,
                    "text": text,
                    "normalized": normalized,
                    "language": language,
                    "script": script,
                    "kind": kind,
                    "source_id": source_id,
                    "source_record_id": source_record_id,
                    "derivation_method": provenance,
                    "name_schema_version": _NAME_SCHEMA_VERSION,
                    "review_status": "machine_imported",
                },
            )
        )
        relationship_id = (
            f"rel:{entity_id}:preferred-name"
            if language == "zh-Hant"
            else f"rel:{entity_id}:name:{language}"
        )
        relationships.append(
            RelationshipUpsert(
                id=relationship_id,
                source_id=entity_id,
                target_id=name_id,
                relationship_type=GraphRelationshipType.HAS_NAME,
            )
        )
        if source_record_id is not None:
            relationships.append(
                RelationshipUpsert(
                    id=f"rel:{name_id}:record:{source_record_id}",
                    source_id=name_id,
                    target_id=source_record_id,
                    relationship_type=RelationshipType.SUPPORTED_BY,
                )
            )


def _deduplicate(batch: IngestionBatch) -> IngestionBatch:
    nodes = {node.id: node for node in batch.nodes}
    relationships = {relationship.id: relationship for relationship in batch.relationships}
    return batch.model_copy(
        update={
            "nodes": list(nodes.values()),
            "relationships": list(relationships.values()),
        }
    )


class TaiwanMohwPharmacopeiaAdapter:
    """Map exact government source records to the public and evidence graph layers."""

    name = "taiwan-mohw-pharmacopeia"
    version = "2"
    supported_source_versions: tuple[str, ...] = (
        "THP4 amended 2025-07-30; standardized-formula snapshot 2026-07-26",
    )
    input_files: tuple[str, ...] = (
        _PHARMACOPEIA_FILENAME,
        _CORRECTIONS_FILENAME,
        _FORMULA_COMPENDIUM_FILENAME,
        _SNAPSHOT_FILENAME,
        _MULTILINGUAL_NAMES_FILENAME,
    )
    output_tables: tuple[str, ...] = ("materials", "formulas", "ingredient_uses")
    graph_entities: tuple[str, ...] = (
        "MedicinalMaterial",
        "FormulaConcept",
        "FormulaWitness",
        "IngredientUse",
        "PreparedMaterial",
        "SourceRecord",
        "MappingAssertion",
        "Claim",
    )
    mappings_produced: tuple[str, ...] = ("exact_source_identifier",)
    claims_produced: tuple[str, ...] = (
        "PREPARATION_NOTE",
        "HAS_ACTION",
        "ADDRESSES_PATTERN",
        "CAUTION",
    )
    observations_produced: tuple[str, ...] = ()
    known_limitations: tuple[str, ...] = (
        "Complete means complete within the pinned official release, not globally exhaustive.",
        "Parenthetical ingredient terms remain exact source terms without inferred equivalence.",
        "Traditional-preparation additions after the base quantity context remain witness text.",
        "Derived English formula titles remain machine-imported until domain review.",
    )

    def discover_release(self, source: SourceRegistryEntry) -> str:
        del source
        return "thp4-2025-07-30"

    def resolve_manifest(
        self,
        source: SourceRegistryEntry,
        manifest: SourceReleaseManifest,
    ) -> SourceReleaseManifest:
        if source.source_id != manifest.source_id:
            raise ValueError("source and release manifest IDs do not match")
        if manifest.adapter_name != self.name or manifest.adapter_version != self.version:
            raise ValueError("Taiwan MOHW adapter version mismatch")
        if manifest.source_version not in self.supported_source_versions:
            raise ValueError(f"unsupported Taiwan MOHW source version: {manifest.source_version}")
        return manifest

    def _bundled_snapshot(self) -> Path:
        return Path(__file__).resolve().parents[4] / "data" / "releases" / _SNAPSHOT_FILENAME

    def _bundled_names_snapshot(self) -> Path:
        return (
            Path(__file__).resolve().parents[4] / "data" / "releases" / _MULTILINGUAL_NAMES_FILENAME
        )

    def _bundled_names_seed(self) -> Path:
        return (
            Path(__file__).resolve().parents[4] / "data" / "releases" / _MULTILINGUAL_SEED_FILENAME
        )

    def _artifact_path(
        self,
        manifest: SourceReleaseManifest,
        paths: AlchemyDataPaths,
        filename: str,
    ) -> Path:
        return paths.raw_original(manifest.source_id, manifest.release_id) / filename

    def plan_acquisition(
        self,
        source: SourceRegistryEntry,
        manifest: SourceReleaseManifest,
        downloader: ReleaseDownloader,
    ) -> DownloadPlan:
        local_artifacts = {
            _SNAPSHOT_FILENAME: self._bundled_snapshot(),
            _MULTILINGUAL_SEED_FILENAME: self._bundled_names_seed(),
            _MULTILINGUAL_NAMES_FILENAME: self._bundled_names_snapshot(),
        }
        for filename, bundled in local_artifacts.items():
            artifact = next(
                artifact for artifact in manifest.artifacts if artifact.filename == filename
            )
            if not bundled.exists() or file_sha256(bundled) != artifact.sha256:
                raise ValueError(
                    f"bundled Taiwan MOHW artifact {filename} is missing or fails its checksum"
                )
        return downloader.plan(
            source,
            manifest,
            additional_local_artifacts=frozenset(local_artifacts),
        )

    async def acquire(
        self,
        source: SourceRegistryEntry,
        manifest: SourceReleaseManifest,
        downloader: ReleaseDownloader,
    ) -> SourceReleaseManifest:
        local_artifacts = {
            _SNAPSHOT_FILENAME: self._bundled_snapshot(),
            _MULTILINGUAL_SEED_FILENAME: self._bundled_names_seed(),
            _MULTILINGUAL_NAMES_FILENAME: self._bundled_names_snapshot(),
        }
        for filename, bundled in local_artifacts.items():
            artifact = next(
                artifact for artifact in manifest.artifacts if artifact.filename == filename
            )
            if not bundled.exists() or file_sha256(bundled) != artifact.sha256:
                raise ValueError(
                    f"bundled Taiwan MOHW artifact {filename} is missing or fails its checksum"
                )
            target = downloader.local_artifact_path(manifest, filename)
            target.parent.mkdir(parents=True, exist_ok=True)
            if not target.exists():
                shutil.copyfile(bundled, target)
        return await downloader.fetch(source, manifest)

    def verify(
        self,
        manifest: SourceReleaseManifest,
        downloader: ReleaseDownloader,
    ) -> dict[str, str | int]:
        return downloader.verify(manifest)

    def extract(
        self,
        manifest: SourceReleaseManifest,
        paths: AlchemyDataPaths,
    ) -> dict[str, int | str]:
        total = 0
        for filename in self.input_files:
            path = self._artifact_path(manifest, paths, filename)
            if not path.exists():
                raise FileNotFoundError(path)
            total += path.stat().st_size
        return {"mode": "no_archive", "files": len(self.input_files), "bytes": total}

    def inspect_schema(
        self,
        manifest: SourceReleaseManifest,
        paths: AlchemyDataPaths,
    ) -> dict[str, int | str | list[str]]:
        value = _snapshot(self._artifact_path(manifest, paths, _SNAPSHOT_FILENAME))
        names_value = _names_snapshot(
            self._artifact_path(manifest, paths, _MULTILINGUAL_NAMES_FILENAME)
        )
        materials = _dict_list(value.get("materiaMedica"), "materiaMedica")
        formulas = _dict_list(value.get("formulas"), "formulas")
        material_names = _dict_list(names_value.get("materials"), "names.materials")
        formula_names = _dict_list(names_value.get("formulas"), "names.formulas")
        ingredient_count = sum(
            len(_dict_list(formula.get("ingredients"), "formulas[].ingredients"))
            for formula in formulas
        )
        if len(material_names) != _EXPECTED_ALL_MATERIAL_TERMS:
            raise ValueError("multilingual material-name snapshot is incomplete")
        if len(formula_names) != _EXPECTED_FORMULAS:
            raise ValueError("multilingual formula-name snapshot is incomplete")
        report: dict[str, int | str | list[str]] = {
            "schemaVersion": str(value["schemaVersion"]),
            "nameSchemaVersion": str(names_value["schemaVersion"]),
            "materialCount": len(materials),
            "multilingualMaterialTermCount": len(material_names),
            "formulaCount": len(formulas),
            "multilingualFormulaCount": len(formula_names),
            "ingredientUseCount": ingredient_count,
            "fields": [
                "materiaMedica.name",
                "materiaMedica.monographPage",
                "names.materials.english",
                "names.materials.pinyin",
                "formulas.name",
                "names.formulas.english",
                "names.formulas.pinyin",
                "formulas.sourceText",
                "formulas.efficacy",
                "formulas.indications",
                "formulas.prescription",
                "formulas.cautions",
                "formulas.ingredients",
            ],
        }
        _write_json(
            paths.release_root("reports", manifest.source_id, manifest.release_id)
            / "source-schema.json",
            report,
        )
        return report

    def stage(
        self,
        source: SourceRegistryEntry,
        manifest: SourceReleaseManifest,
        paths: AlchemyDataPaths,
        *,
        mode: PipelineMode,
        subset_limit: int,
        import_run_id: str,
    ) -> dict[str, int | str | list[str]]:
        value = _snapshot(self._artifact_path(manifest, paths, _SNAPSHOT_FILENAME))
        names_value = _names_snapshot(
            self._artifact_path(manifest, paths, _MULTILINGUAL_NAMES_FILENAME)
        )
        available_materials = _dict_list(value.get("materiaMedica"), "materiaMedica")
        available_formulas = _dict_list(value.get("formulas"), "formulas")
        material_names = {
            str(item["chineseTraditional"]): item
            for item in _dict_list(names_value.get("materials"), "names.materials")
        }
        formula_names = {
            int(cast(int, item["sequence"])): item
            for item in _dict_list(names_value.get("formulas"), "names.formulas")
        }
        if len(material_names) != _EXPECTED_ALL_MATERIAL_TERMS:
            raise ValueError("multilingual material-name snapshot has duplicate or missing terms")
        if len(formula_names) != _EXPECTED_FORMULAS:
            raise ValueError("multilingual formula-name snapshot has duplicate or missing formulas")
        selected_materials = (
            available_materials if mode is PipelineMode.FULL else available_materials[:subset_limit]
        )
        selected_formulas = (
            available_formulas if mode is PipelineMode.FULL else available_formulas[:subset_limit]
        )

        material_rows: list[dict[str, object]] = []
        for material in selected_materials:
            name = str(material["name"])
            multilingual = material_names.get(name)
            if multilingual is None:
                raise ValueError(f"multilingual names are missing medicinal material: {name}")
            material_rows.append(
                {
                    "source_record_id": _record_id(
                        source.source_id, manifest.release_id, "material", name
                    ),
                    "name": name,
                    "monograph_page": int(cast(int, material["monographPage"])),
                    "toc_order": int(cast(int, material["tocOrder"])),
                    "toc_pdf_page": int(cast(int, material["tocPdfPage"])),
                    "source_locator": f"THP4 monograph p. {material['monographPage']}",
                    "english_name": str(multilingual["english"]),
                    "english_name_provenance": str(multilingual["englishProvenance"]),
                    "pinyin": str(multilingual["pinyin"]),
                    "pinyin_ascii": str(multilingual["pinyinAscii"]),
                    "pinyin_provenance": str(multilingual["pinyinProvenance"]),
                    "raw_record_json": json.dumps(material, ensure_ascii=False, sort_keys=True),
                    "import_run_id": import_run_id,
                }
            )

        formula_rows: list[dict[str, object]] = []
        ingredient_rows: list[dict[str, object]] = []
        for formula in selected_formulas:
            sequence = int(cast(int, formula["sequence"]))
            multilingual = formula_names.get(sequence)
            if multilingual is None:
                raise ValueError(f"multilingual names are missing formula sequence {sequence}")
            source_url = str(formula["sourceUrl"])
            page_id = _formula_page_id(source_url)
            formula_record_id = _record_id(
                source.source_id, manifest.release_id, "formula", page_id
            )
            formula_rows.append(
                {
                    "source_record_id": formula_record_id,
                    "sequence": sequence,
                    "reported_item": str(formula["reportedItem"]),
                    "name": str(formula["name"]),
                    "english_name": str(multilingual["english"]),
                    "english_name_provenance": str(multilingual["englishProvenance"]),
                    "pinyin": str(multilingual["pinyin"]),
                    "pinyin_ascii": str(multilingual["pinyinAscii"]),
                    "pinyin_provenance": str(multilingual["pinyinProvenance"]),
                    "dosage_form": (
                        str(formula["dosageForm"]) if formula.get("dosageForm") else None
                    ),
                    "source_text": str(formula["sourceText"]),
                    "efficacy": str(formula["efficacy"]),
                    "indications": str(formula["indications"]),
                    "prescription": str(formula["prescription"]),
                    "cautions": str(formula["cautions"]),
                    "quantity_context": str(formula["quantityContext"]),
                    "source_url": source_url,
                    "page_id": page_id,
                    "raw_record_json": json.dumps(formula, ensure_ascii=False, sort_keys=True),
                    "import_run_id": import_run_id,
                }
            )
            for ingredient in _dict_list(formula.get("ingredients"), "formulas[].ingredients"):
                ingredient_name = str(ingredient["name"])
                material_multilingual = material_names.get(ingredient_name)
                if material_multilingual is None:
                    raise ValueError(
                        f"multilingual names are missing formula ingredient: {ingredient_name}"
                    )
                ingredient_rows.append(
                    {
                        "formula_source_record_id": formula_record_id,
                        "formula_sequence": sequence,
                        "position": int(cast(int, ingredient["position"])),
                        "name": ingredient_name,
                        "english_name": str(material_multilingual["english"]),
                        "english_name_provenance": str(material_multilingual["englishProvenance"]),
                        "pinyin": str(material_multilingual["pinyin"]),
                        "pinyin_ascii": str(material_multilingual["pinyinAscii"]),
                        "pinyin_provenance": str(material_multilingual["pinyinProvenance"]),
                        "amount_text": str(ingredient["amountText"]),
                        "unit": str(ingredient["unit"]),
                        "quantity_context": str(ingredient["quantityContext"]),
                        "role": str(ingredient["role"]),
                        "source_url": source_url,
                    }
                )

        material_schema = pa.schema(
            [
                ("source_record_id", pa.string()),
                ("name", pa.string()),
                ("monograph_page", pa.int64()),
                ("toc_order", pa.int64()),
                ("toc_pdf_page", pa.int64()),
                ("source_locator", pa.string()),
                ("english_name", pa.string()),
                ("english_name_provenance", pa.string()),
                ("pinyin", pa.string()),
                ("pinyin_ascii", pa.string()),
                ("pinyin_provenance", pa.string()),
                ("raw_record_json", pa.string()),
                ("import_run_id", pa.string()),
            ]
        )
        formula_schema = pa.schema(
            [
                ("source_record_id", pa.string()),
                ("sequence", pa.int64()),
                ("reported_item", pa.string()),
                ("name", pa.string()),
                ("english_name", pa.string()),
                ("english_name_provenance", pa.string()),
                ("pinyin", pa.string()),
                ("pinyin_ascii", pa.string()),
                ("pinyin_provenance", pa.string()),
                ("dosage_form", pa.string()),
                ("source_text", pa.string()),
                ("efficacy", pa.string()),
                ("indications", pa.string()),
                ("prescription", pa.string()),
                ("cautions", pa.string()),
                ("quantity_context", pa.string()),
                ("source_url", pa.string()),
                ("page_id", pa.string()),
                ("raw_record_json", pa.string()),
                ("import_run_id", pa.string()),
            ]
        )
        ingredient_schema = pa.schema(
            [
                ("formula_source_record_id", pa.string()),
                ("formula_sequence", pa.int64()),
                ("position", pa.int64()),
                ("name", pa.string()),
                ("english_name", pa.string()),
                ("english_name_provenance", pa.string()),
                ("pinyin", pa.string()),
                ("pinyin_ascii", pa.string()),
                ("pinyin_provenance", pa.string()),
                ("amount_text", pa.string()),
                ("unit", pa.string()),
                ("quantity_context", pa.string()),
                ("role", pa.string()),
                ("source_url", pa.string()),
            ]
        )
        database = paths.staging_database(manifest.source_id, manifest.release_id)
        database.parent.mkdir(parents=True, exist_ok=True)
        parquet = paths.staging_parquet(manifest.source_id, manifest.release_id)
        with duckdb.connect(str(database)) as connection:
            _write_table(
                connection,
                "materials",
                material_rows,
                material_schema,
                parquet / "materials.parquet",
            )
            _write_table(
                connection,
                "formulas",
                formula_rows,
                formula_schema,
                parquet / "formulas.parquet",
            )
            _write_table(
                connection,
                "ingredient_uses",
                ingredient_rows,
                ingredient_schema,
                parquet / "ingredient_uses.parquet",
            )

        report: dict[str, int | str | list[str]] = {
            "mode": mode.value,
            "availableMaterials": len(available_materials),
            "availableFormulas": len(available_formulas),
            "availableIngredientUses": sum(
                len(_dict_list(formula.get("ingredients"), "formulas[].ingredients"))
                for formula in available_formulas
            ),
            "stagedMaterials": len(material_rows),
            "stagedFormulas": len(formula_rows),
            "stagedIngredientUses": len(ingredient_rows),
            "duplicateMaterialNames": len(material_rows)
            - len({str(row["name"]) for row in material_rows}),
            "duplicateFormulaUrls": len(formula_rows)
            - len({str(row["source_url"]) for row in formula_rows}),
        }
        report_root = paths.release_root("reports", manifest.source_id, manifest.release_id)
        _write_json(report_root / "row-counts-stage.json", report)
        _write_json(report_root / "source-anomalies.json", value.get("sourceAnomalies", []))
        return report

    def normalize(
        self,
        source: SourceRegistryEntry,
        manifest: SourceReleaseManifest,
        paths: AlchemyDataPaths,
        *,
        import_run_id: str,
    ) -> dict[str, int | str | list[str]]:
        del import_run_id
        staged = paths.staging_parquet(manifest.source_id, manifest.release_id)
        material_records = _read_rows(staged / "materials.parquet")
        formulas = _read_rows(staged / "formulas.parquet")
        ingredient_uses = _read_rows(staged / "ingredient_uses.parquet")
        normalized_root = paths.normalized_parquet(manifest.source_id, manifest.release_id)
        normalized_root.mkdir(parents=True, exist_ok=True)
        rejects: list[dict[str, str]] = []

        material_by_id: dict[str, dict[str, object]] = {}
        for row in material_records:
            name = normalize_source_text(str(row["name"]))
            if not name:
                rejects.append(
                    {
                        "sourceRecordId": str(row["source_record_id"]),
                        "reason": "empty normalized medicinal-material name",
                    }
                )
                continue
            identifier = _material_id(name)
            material_by_id[identifier] = {
                "material_id": identifier,
                "name": name,
                "normalized_name": normalize_name(name),
                "material_scope": "official_monograph",
                "entity_kind": "medicinal_material",
                "english_name": str(row["english_name"]),
                "english_name_provenance": str(row["english_name_provenance"]),
                "pinyin": str(row["pinyin"]),
                "pinyin_ascii": str(row["pinyin_ascii"]),
                "pinyin_provenance": str(row["pinyin_provenance"]),
                "monograph_source_record_id": str(row["source_record_id"]),
                "monograph_page": int(cast(int, row["monograph_page"])),
                "source_locator": str(row["source_locator"]),
            }

        normalized_ingredients: list[dict[str, object]] = []
        for row in ingredient_uses:
            name = normalize_source_text(str(row["name"]))
            if not name:
                rejects.append(
                    {
                        "sourceRecordId": str(row["formula_source_record_id"]),
                        "reason": "empty normalized ingredient name",
                    }
                )
                continue
            identifier = _material_id(name)
            is_excipient = name in _EXCIPIENT_TERMS
            material_by_id.setdefault(
                identifier,
                {
                    "material_id": identifier,
                    "name": name,
                    "normalized_name": normalize_name(name),
                    "material_scope": "official_formula_ingredient_term",
                    "entity_kind": ("prepared_material" if is_excipient else "medicinal_material"),
                    "english_name": str(row["english_name"]),
                    "english_name_provenance": str(row["english_name_provenance"]),
                    "pinyin": str(row["pinyin"]),
                    "pinyin_ascii": str(row["pinyin_ascii"]),
                    "pinyin_provenance": str(row["pinyin_provenance"]),
                    "monograph_source_record_id": None,
                    "monograph_page": None,
                    "source_locator": str(row["source_url"]),
                },
            )
            normalized_ingredients.append(
                {
                    **row,
                    "name": name,
                    "normalized_name": normalize_name(name),
                    "material_id": identifier,
                    "entity_kind": ("prepared_material" if is_excipient else "medicinal_material"),
                }
            )

        normalized_formulas: list[dict[str, object]] = []
        for row in formulas:
            name = normalize_source_text(str(row["name"]))
            if not name:
                rejects.append(
                    {
                        "sourceRecordId": str(row["source_record_id"]),
                        "reason": "empty normalized formula name",
                    }
                )
                continue
            normalized_formulas.append(
                {
                    **row,
                    "name": name,
                    "normalized_name": normalize_name(name),
                    "formula_id": _formula_id(str(row["source_url"])),
                }
            )

        material_schema = pa.schema(
            [
                ("material_id", pa.string()),
                ("name", pa.string()),
                ("normalized_name", pa.string()),
                ("material_scope", pa.string()),
                ("entity_kind", pa.string()),
                ("english_name", pa.string()),
                ("english_name_provenance", pa.string()),
                ("pinyin", pa.string()),
                ("pinyin_ascii", pa.string()),
                ("pinyin_provenance", pa.string()),
                ("monograph_source_record_id", pa.string()),
                ("monograph_page", pa.int64()),
                ("source_locator", pa.string()),
            ]
        )
        formula_schema = pa.schema(
            [
                ("source_record_id", pa.string()),
                ("sequence", pa.int64()),
                ("reported_item", pa.string()),
                ("name", pa.string()),
                ("normalized_name", pa.string()),
                ("formula_id", pa.string()),
                ("english_name", pa.string()),
                ("english_name_provenance", pa.string()),
                ("pinyin", pa.string()),
                ("pinyin_ascii", pa.string()),
                ("pinyin_provenance", pa.string()),
                ("dosage_form", pa.string()),
                ("source_text", pa.string()),
                ("efficacy", pa.string()),
                ("indications", pa.string()),
                ("prescription", pa.string()),
                ("cautions", pa.string()),
                ("quantity_context", pa.string()),
                ("source_url", pa.string()),
                ("page_id", pa.string()),
                ("raw_record_json", pa.string()),
                ("import_run_id", pa.string()),
            ]
        )
        ingredient_schema = pa.schema(
            [
                ("formula_source_record_id", pa.string()),
                ("formula_sequence", pa.int64()),
                ("position", pa.int64()),
                ("name", pa.string()),
                ("normalized_name", pa.string()),
                ("material_id", pa.string()),
                ("entity_kind", pa.string()),
                ("english_name", pa.string()),
                ("english_name_provenance", pa.string()),
                ("pinyin", pa.string()),
                ("pinyin_ascii", pa.string()),
                ("pinyin_provenance", pa.string()),
                ("amount_text", pa.string()),
                ("unit", pa.string()),
                ("quantity_context", pa.string()),
                ("role", pa.string()),
                ("source_url", pa.string()),
            ]
        )
        database = (
            paths.release_root("normalized", manifest.source_id, manifest.release_id)
            / "source.duckdb"
        )
        database.parent.mkdir(parents=True, exist_ok=True)
        with duckdb.connect(str(database)) as connection:
            _write_table(
                connection,
                "materials",
                list(material_by_id.values()),
                material_schema,
                normalized_root / "materials.parquet",
            )
            _write_table(
                connection,
                "formulas",
                normalized_formulas,
                formula_schema,
                normalized_root / "formulas.parquet",
            )
            _write_table(
                connection,
                "ingredient_uses",
                normalized_ingredients,
                ingredient_schema,
                normalized_root / "ingredient_uses.parquet",
            )

        report: dict[str, int | str | list[str]] = {
            "normalizedMaterials": len(material_by_id),
            "officialMonographs": sum(
                row["material_scope"] == "official_monograph" for row in material_by_id.values()
            ),
            "additionalFormulaTerms": sum(
                row["material_scope"] == "official_formula_ingredient_term"
                for row in material_by_id.values()
            ),
            "preparedMaterialTerms": sum(
                row["entity_kind"] == "prepared_material" for row in material_by_id.values()
            ),
            "normalizedFormulas": len(normalized_formulas),
            "normalizedIngredientUses": len(normalized_ingredients),
            "rejectedRecords": len(rejects),
        }
        report_root = paths.release_root("reports", manifest.source_id, manifest.release_id)
        _write_json(report_root / "rejected-records.json", rejects)
        _write_json(report_root / "row-counts-normalized.json", report)
        return report

    def _common_graph(
        self,
        source: SourceRegistryEntry,
        manifest: SourceReleaseManifest,
        import_run_id: str,
        production_eligible: bool,
        source_record_count: int,
    ) -> tuple[list[NodeUpsert], list[RelationshipUpsert], str]:
        rights = manifest.license_snapshot
        license_id = stable_id("license", str(rights.license_url or rights.license_name))
        release_id = f"source-release:{source.source_id}:{manifest.release_id}"
        adapter_id = f"adapter-version:{self.name}:{self.version}"
        schema_id = f"schema-version:{manifest.schema_version}"
        mapping_id = f"mapping-version:{manifest.mapping_version}"
        nodes = [
            NodeUpsert(
                entity_type=EntityType.SOURCE,
                id=source.source_id,
                properties={
                    "display_name": source.title,
                    "title": source.title,
                    "rights_status": "approved",
                    "production_status": source.production_status.value,
                    "review_status": "machine_imported",
                    "citation": source.citation_template,
                    "active": True,
                    "production_eligible": production_eligible,
                },
            ),
            NodeUpsert(
                entity_type=GraphLabel.LICENSE,
                id=license_id,
                properties={
                    "display_name": rights.license_name,
                    "name": rights.license_name,
                    "url": str(rights.license_url or ""),
                    "commercial_use": rights.commercial_use.value,
                    "redistribution": rights.redistribution.value,
                    "derivative_database": rights.derivative_database.value,
                    "ai_use": rights.ai_use.value,
                    "review_status": "machine_imported",
                },
            ),
            NodeUpsert(
                entity_type=GraphLabel.SOURCE_RELEASE,
                id=release_id,
                properties={
                    "display_name": f"{source.title} {manifest.source_version}",
                    "source_id": source.source_id,
                    "release_id": manifest.release_id,
                    "source_version": manifest.source_version,
                    "release_date": manifest.release_date.isoformat(),
                    "checksum_verified": True,
                    "import_audit_passed": True,
                    "schema_drift": False,
                    "stage_count": source_record_count,
                    "normalized_count": source_record_count,
                    "rejected_count": 0,
                    "unresolved_rejects": 0,
                    "production_eligible": production_eligible,
                    "review_status": "machine_imported",
                },
            ),
            NodeUpsert(
                entity_type=EntityType.IMPORT_RUN,
                id=import_run_id,
                properties={
                    "display_name": import_run_id,
                    "source_id": source.source_id,
                    "release_id": manifest.release_id,
                    "started_at": (
                        manifest.retrieved_at.isoformat()
                        if manifest.retrieved_at is not None
                        else f"{manifest.release_date.isoformat()}T00:00:00+00:00"
                    ),
                    "adapter_version": manifest.adapter_version,
                    "status": "passed",
                    "review_status": "machine_imported",
                },
            ),
            NodeUpsert(
                entity_type=GraphLabel.ADAPTER_VERSION,
                id=adapter_id,
                properties={
                    "display_name": f"{self.name} {self.version}",
                    "name": self.name,
                    "version": self.version,
                    "review_status": "machine_imported",
                },
            ),
            NodeUpsert(
                entity_type=GraphLabel.SCHEMA_VERSION,
                id=schema_id,
                properties={
                    "display_name": manifest.schema_version,
                    "version": manifest.schema_version,
                    "review_status": "machine_imported",
                },
            ),
            NodeUpsert(
                entity_type=GraphLabel.MAPPING_VERSION,
                id=mapping_id,
                properties={
                    "display_name": manifest.mapping_version,
                    "version": manifest.mapping_version,
                    "review_status": "machine_imported",
                },
            ),
        ]
        relationships = [
            RelationshipUpsert(
                id=f"rel:{source.source_id}:release:{manifest.release_id}",
                source_id=source.source_id,
                target_id=release_id,
                relationship_type=GraphRelationshipType.HAS_RELEASE,
            ),
            RelationshipUpsert(
                id=f"rel:{release_id}:license",
                source_id=release_id,
                target_id=license_id,
                relationship_type=GraphRelationshipType.USES_LICENSE,
            ),
            RelationshipUpsert(
                id=f"rel:{import_run_id}:release",
                source_id=import_run_id,
                target_id=release_id,
                relationship_type=GraphRelationshipType.IMPORTED_RELEASE,
            ),
            RelationshipUpsert(
                id=f"rel:{import_run_id}:adapter",
                source_id=import_run_id,
                target_id=adapter_id,
                relationship_type=GraphRelationshipType.USED_ADAPTER,
            ),
            RelationshipUpsert(
                id=f"rel:{import_run_id}:schema",
                source_id=import_run_id,
                target_id=schema_id,
                relationship_type=GraphRelationshipType.USED_SCHEMA,
            ),
            RelationshipUpsert(
                id=f"rel:{import_run_id}:mapping",
                source_id=import_run_id,
                target_id=mapping_id,
                relationship_type=GraphRelationshipType.USED_MAPPING,
            ),
        ]
        return nodes, relationships, release_id

    @staticmethod
    def _append_exact_mapping(
        nodes: list[NodeUpsert],
        relationships: list[RelationshipUpsert],
        *,
        source_record_id: str,
        canonical_id: str,
        scheme: str,
        value: str,
        mapping_version: str,
    ) -> None:
        mapping = IdentityResolver.exact_external_id(
            source_record_id=source_record_id,
            canonical_id=canonical_id,
            scheme=scheme,
            value=value,
            mapping_version=mapping_version,
        )
        external_id = stable_id("external-identifier", f"{scheme}|{value}")
        nodes.extend(
            [
                NodeUpsert(
                    entity_type=GraphLabel.MAPPING_ASSERTION,
                    id=mapping.id,
                    properties={
                        "display_name": f"{scheme}:{value} exact mapping",
                        "relation": mapping.relation.value,
                        "method": mapping.method.value,
                        "status": mapping.status.value,
                        "mapping_version": mapping.mapping_version,
                        "evidence": mapping.evidence,
                        "review_status": "machine_imported",
                    },
                ),
                NodeUpsert(
                    entity_type=GraphLabel.EXTERNAL_IDENTIFIER,
                    id=external_id,
                    properties={
                        "display_name": f"{scheme}:{value}",
                        "scheme": scheme,
                        "value": value,
                        "original": value,
                        "review_status": "machine_imported",
                    },
                ),
            ]
        )
        relationships.extend(
            [
                RelationshipUpsert(
                    id=f"rel:{mapping.id}:subject",
                    source_id=mapping.id,
                    target_id=source_record_id,
                    relationship_type=GraphRelationshipType.MAPPING_SUBJECT,
                ),
                RelationshipUpsert(
                    id=f"rel:{mapping.id}:target",
                    source_id=mapping.id,
                    target_id=canonical_id,
                    relationship_type=GraphRelationshipType.MAPPING_TARGET,
                ),
                RelationshipUpsert(
                    id=stable_id(
                        "relationship",
                        f"{source_record_id}|HAS_EXTERNAL_IDENTIFIER|{external_id}",
                    ),
                    source_id=source_record_id,
                    target_id=external_id,
                    relationship_type=GraphRelationshipType.HAS_EXTERNAL_IDENTIFIER,
                ),
            ]
        )

    @staticmethod
    def _append_claim(
        nodes: list[NodeUpsert],
        relationships: list[RelationshipUpsert],
        *,
        formula_id: str,
        source_record_id: str,
        predicate: str,
        value: str,
        source_locator: str,
        import_run_id: str,
        created_at: str,
    ) -> None:
        if not value:
            return
        claim_id = stable_id(
            "claim",
            f"{source_record_id}|{predicate}|{value}",
        )
        nodes.append(
            NodeUpsert(
                entity_type=EntityType.CLAIM,
                id=claim_id,
                properties={
                    "display_name": f"{predicate} claim",
                    "predicate": predicate,
                    "textual_value": value,
                    "original_quotation": value,
                    "normalized_interpretation": normalize_source_text(value),
                    "language": "zh-Hant",
                    "source_locator": source_locator,
                    "review_status": "machine_imported",
                    "assertion_status": "source_reported",
                    "evidence_type": "official_government_release",
                    "assertion_method": "machine_import",
                    "import_run_id": import_run_id,
                    "created_at": created_at,
                },
            )
        )
        relationships.extend(
            [
                RelationshipUpsert(
                    id=f"rel:{claim_id}:subject",
                    source_id=claim_id,
                    target_id=formula_id,
                    relationship_type=RelationshipType.SUBJECT,
                ),
                RelationshipUpsert(
                    id=f"rel:{claim_id}:record",
                    source_id=claim_id,
                    target_id=source_record_id,
                    relationship_type=RelationshipType.SUPPORTED_BY,
                ),
            ]
        )

    def propose_mappings(
        self,
        source: SourceRegistryEntry,
        manifest: SourceReleaseManifest,
        paths: AlchemyDataPaths,
        *,
        import_run_id: str,
        production_eligible: bool,
    ) -> IngestionBatch:
        normalized = paths.normalized_parquet(manifest.source_id, manifest.release_id)
        materials = _read_rows(normalized / "materials.parquet")
        formulas = _read_rows(normalized / "formulas.parquet")
        ingredient_uses = _read_rows(normalized / "ingredient_uses.parquet")
        uses_by_formula: dict[str, list[dict[str, object]]] = defaultdict(list)
        for ingredient in ingredient_uses:
            uses_by_formula[str(ingredient["formula_source_record_id"])].append(ingredient)
        for values in uses_by_formula.values():
            values.sort(key=lambda row: int(cast(int, row["position"])))

        source_record_count = sum(
            row["monograph_source_record_id"] is not None for row in materials
        ) + len(formulas)
        nodes, relationships, release_node_id = self._common_graph(
            source,
            manifest,
            import_run_id,
            production_eligible,
            source_record_count,
        )
        material_by_id = {str(row["material_id"]): row for row in materials}
        formula_record_ids = {str(row["source_record_id"]) for row in formulas}
        staged_materials = {
            str(row["source_record_id"]): row
            for row in _read_rows(
                paths.staging_parquet(manifest.source_id, manifest.release_id) / "materials.parquet"
            )
        }

        for material in materials:
            material_id = str(material["material_id"])
            name = str(material["name"])
            english_name = str(material["english_name"])
            english_name_provenance = str(material["english_name_provenance"])
            pinyin_toned = str(material["pinyin"])
            pinyin_ascii = str(material["pinyin_ascii"])
            pinyin_provenance = str(material["pinyin_provenance"])
            aliases_search = normalize_name(
                " ".join((english_name, pinyin_toned, pinyin_ascii, name))
            )
            source_record_id = (
                str(material["monograph_source_record_id"])
                if material["monograph_source_record_id"] is not None
                else None
            )
            if material["entity_kind"] == "prepared_material":
                nodes.append(
                    NodeUpsert(
                        entity_type=GraphLabel.PREPARED_MATERIAL,
                        id=material_id,
                        properties={
                            "display_name": english_name,
                            "normalized_name": normalize_name(english_name),
                            "source_normalized_name": str(material["normalized_name"]),
                            "aliases_search": aliases_search,
                            "names_json": _names_json(
                                chinese_traditional=name,
                                english=english_name,
                                pinyin_toned=pinyin_toned,
                                pinyin_ascii=pinyin_ascii,
                                source_id=source.source_id,
                            ),
                            "material_scope": str(material["material_scope"]),
                            "name_schema_version": _NAME_SCHEMA_VERSION,
                            "source_ids": [source.source_id],
                            "data_status": "source_reported",
                            "review_status": "machine_imported",
                            "review_statuses": ["machine_imported"],
                            "production_eligible": production_eligible,
                        },
                    )
                )
                _append_multilingual_names(
                    nodes,
                    relationships,
                    entity_id=material_id,
                    source_id=source.source_id,
                    source_record_id=None,
                    chinese_traditional=name,
                    english=english_name,
                    english_provenance=english_name_provenance,
                    pinyin_toned=pinyin_toned,
                    pinyin_ascii=pinyin_ascii,
                    pinyin_provenance=pinyin_provenance,
                )
                continue
            nodes.append(
                NodeUpsert(
                    entity_type=EntityType.HERB_MATERIAL,
                    additional_labels=[
                        GraphLabel.MEDICINAL_MATERIAL,
                        GraphLabel.CANONICAL_ENTITY,
                    ],
                    id=material_id,
                    properties={
                        "canonical_id": material_id,
                        "display_name": english_name,
                        "normalized_name": normalize_name(english_name),
                        "source_normalized_name": str(material["normalized_name"]),
                        "aliases_search": aliases_search,
                        "names_json": _names_json(
                            chinese_traditional=name,
                            english=english_name,
                            pinyin_toned=pinyin_toned,
                            pinyin_ascii=pinyin_ascii,
                            source_id=source.source_id,
                        ),
                        "material_scope": str(material["material_scope"]),
                        "monograph_page": (
                            int(cast(int, material["monograph_page"]))
                            if material["monograph_page"] is not None
                            else None
                        ),
                        "name_schema_version": _NAME_SCHEMA_VERSION,
                        "review_status": "machine_imported",
                        "review_statuses": ["machine_imported"],
                        "source_ids": [source.source_id],
                        "data_status": "source_reported",
                        "availability_status": "available",
                        "ambiguity": (
                            ["exact source term; broader identity mapping not asserted"]
                            if material["material_scope"] == "official_formula_ingredient_term"
                            else []
                        ),
                        "unresolved_conflicts": [],
                        "completeness": (
                            0.2 if material["material_scope"] == "official_monograph" else 0.1
                        ),
                        "projection_version": "accepted-claims-v1",
                        "production_eligible": production_eligible,
                    },
                )
            )
            _append_multilingual_names(
                nodes,
                relationships,
                entity_id=material_id,
                source_id=source.source_id,
                source_record_id=source_record_id,
                chinese_traditional=name,
                english=english_name,
                english_provenance=english_name_provenance,
                pinyin_toned=pinyin_toned,
                pinyin_ascii=pinyin_ascii,
                pinyin_provenance=pinyin_provenance,
            )
            if source_record_id is None:
                continue
            source_locator = str(material["source_locator"])
            raw_material_record = staged_materials.get(source_record_id)
            if raw_material_record is None:
                raise ValueError(f"missing staged material record: {source_record_id}")
            nodes.append(
                NodeUpsert(
                    entity_type=GraphLabel.SOURCE_RECORD,
                    id=source_record_id,
                    properties={
                        "display_name": name,
                        "source_id": source.source_id,
                        "release_id": manifest.release_id,
                        "external_id": f"THP4:{name}",
                        "record_type": "medicinal_material_monograph",
                        "original_name": name,
                        "source_locator": source_locator,
                        "raw_record_json": str(raw_material_record["raw_record_json"]),
                        "review_status": "machine_imported",
                        "row_production_eligible": True,
                        "production_eligible": production_eligible,
                    },
                )
            )
            relationships.extend(
                [
                    RelationshipUpsert(
                        id=f"rel:{release_node_id}:record:{source_record_id}",
                        source_id=release_node_id,
                        target_id=source_record_id,
                        relationship_type=GraphRelationshipType.CONTAINS_RECORD,
                    ),
                    RelationshipUpsert(
                        id=f"rel:{material_id}:record:{source_record_id}",
                        source_id=material_id,
                        target_id=source_record_id,
                        relationship_type=RelationshipType.SUPPORTED_BY,
                    ),
                ]
            )
            self._append_exact_mapping(
                nodes,
                relationships,
                source_record_id=source_record_id,
                canonical_id=material_id,
                scheme="TW-MOHW-THP4-MONOGRAPH",
                value=name,
                mapping_version=manifest.mapping_version,
            )

        created_at = (
            manifest.retrieved_at.isoformat()
            if manifest.retrieved_at is not None
            else f"{manifest.release_date.isoformat()}T00:00:00+00:00"
        )
        for formula in formulas:
            formula_id = str(formula["formula_id"])
            formula_record_id = str(formula["source_record_id"])
            source_url = str(formula["source_url"])
            name = str(formula["name"])
            english_name = str(formula["english_name"])
            english_name_provenance = str(formula["english_name_provenance"])
            pinyin_toned = str(formula["pinyin"])
            pinyin_ascii = str(formula["pinyin_ascii"])
            pinyin_provenance = str(formula["pinyin_provenance"])
            aliases_search = normalize_name(
                " ".join((english_name, pinyin_toned, pinyin_ascii, name))
            )
            formula_uses = uses_by_formula.get(formula_record_id, [])
            public_uses = [
                row for row in formula_uses if row["entity_kind"] == "medicinal_material"
            ]
            witness_id = stable_id(
                "formula-witness",
                f"{formula_record_id}|{manifest.release_id}",
            )
            dosage_form_source = (
                str(formula["dosage_form"]) if formula["dosage_form"] is not None else None
            )
            dosage_form_english = (
                _DOSAGE_FORM_ENGLISH.get(dosage_form_source, dosage_form_source)
                if dosage_form_source is not None
                else None
            )
            categories = [dosage_form_english] if dosage_form_english is not None else []
            nodes.extend(
                [
                    NodeUpsert(
                        entity_type=GraphLabel.SOURCE_RECORD,
                        id=formula_record_id,
                        properties={
                            "display_name": name,
                            "source_id": source.source_id,
                            "release_id": manifest.release_id,
                            "external_id": str(formula["page_id"]),
                            "record_type": "standardized_formula",
                            "original_name": name,
                            "reported_item": str(formula["reported_item"]),
                            "source_locator": source_url,
                            "raw_record_json": str(formula["raw_record_json"]),
                            "review_status": "machine_imported",
                            "row_production_eligible": True,
                            "production_eligible": production_eligible,
                        },
                    ),
                    NodeUpsert(
                        entity_type=EntityType.FORMULA,
                        additional_labels=[
                            GraphLabel.FORMULA_CONCEPT,
                            GraphLabel.CANONICAL_ENTITY,
                        ],
                        id=formula_id,
                        properties={
                            "canonical_id": formula_id,
                            "display_name": english_name,
                            "normalized_name": normalize_name(english_name),
                            "source_normalized_name": str(formula["normalized_name"]),
                            "aliases_search": aliases_search,
                            "names_json": _names_json(
                                chinese_traditional=name,
                                english=english_name,
                                pinyin_toned=pinyin_toned,
                                pinyin_ascii=pinyin_ascii,
                                source_id=source.source_id,
                            ),
                            "categories": categories,
                            "dosage_form": dosage_form_english,
                            "dosage_form_source": dosage_form_source,
                            "ingredient_ids": [str(row["material_id"]) for row in public_uses],
                            "ingredient_amount_texts": [
                                str(row["amount_text"]) for row in public_uses
                            ],
                            "ingredient_units": [str(row["unit"]) for row in public_uses],
                            "ingredient_source_terms": [str(row["name"]) for row in public_uses],
                            "unresolved_ingredient_texts": [
                                str(row["name"])
                                for row in formula_uses
                                if row["entity_kind"] == "prepared_material"
                            ],
                            "source_text": str(formula["source_text"]),
                            "prescription_text": str(formula["prescription"]),
                            "quantity_context": str(formula["quantity_context"]),
                            "source_url": source_url,
                            "name_schema_version": _NAME_SCHEMA_VERSION,
                            "review_status": "machine_imported",
                            "review_statuses": ["machine_imported"],
                            "source_ids": [source.source_id],
                            "data_status": "source_reported",
                            "availability_status": "available",
                            "ambiguity": [],
                            "unresolved_conflicts": [],
                            "completeness": 1.0,
                            "projection_version": "accepted-claims-v1",
                            "production_eligible": production_eligible,
                        },
                    ),
                    NodeUpsert(
                        entity_type=GraphLabel.FORMULA_WITNESS,
                        id=witness_id,
                        properties={
                            "display_name": f"{name} — official standardized formula",
                            "formula_id": formula_id,
                            "source_record_id": formula_record_id,
                            "source_locator": source_url,
                            "reported_item": str(formula["reported_item"]),
                            "sequence": int(cast(int, formula["sequence"])),
                            "original_name": name,
                            "source_text": str(formula["source_text"]),
                            "efficacy": str(formula["efficacy"]),
                            "indications": str(formula["indications"]),
                            "prescription": str(formula["prescription"]),
                            "cautions": str(formula["cautions"]),
                            "quantity_context": str(formula["quantity_context"]),
                            "review_status": "machine_imported",
                            "production_eligible": production_eligible,
                        },
                    ),
                ]
            )
            _append_multilingual_names(
                nodes,
                relationships,
                entity_id=formula_id,
                source_id=source.source_id,
                source_record_id=formula_record_id,
                chinese_traditional=name,
                english=english_name,
                english_provenance=english_name_provenance,
                pinyin_toned=pinyin_toned,
                pinyin_ascii=pinyin_ascii,
                pinyin_provenance=pinyin_provenance,
            )
            relationships.extend(
                [
                    RelationshipUpsert(
                        id=f"rel:{release_node_id}:record:{formula_record_id}",
                        source_id=release_node_id,
                        target_id=formula_record_id,
                        relationship_type=GraphRelationshipType.CONTAINS_RECORD,
                    ),
                    RelationshipUpsert(
                        id=f"rel:{formula_id}:record:{formula_record_id}",
                        source_id=formula_id,
                        target_id=formula_record_id,
                        relationship_type=RelationshipType.SUPPORTED_BY,
                    ),
                    RelationshipUpsert(
                        id=f"rel:{formula_id}:witness:{witness_id}",
                        source_id=formula_id,
                        target_id=witness_id,
                        relationship_type=GraphRelationshipType.HAS_WITNESS,
                    ),
                    RelationshipUpsert(
                        id=f"rel:{witness_id}:record",
                        source_id=witness_id,
                        target_id=formula_record_id,
                        relationship_type=RelationshipType.SUPPORTED_BY,
                    ),
                ]
            )
            self._append_exact_mapping(
                nodes,
                relationships,
                source_record_id=formula_record_id,
                canonical_id=formula_id,
                scheme="TW-MOHW-FORMULA-PAGE",
                value=str(formula["page_id"]),
                mapping_version=manifest.mapping_version,
            )

            for predicate, value in (
                ("PREPARATION_NOTE", str(formula["prescription"])),
                ("HAS_ACTION", str(formula["efficacy"])),
                ("ADDRESSES_PATTERN", str(formula["indications"])),
                ("CAUTION", str(formula["cautions"])),
            ):
                self._append_claim(
                    nodes,
                    relationships,
                    formula_id=formula_id,
                    source_record_id=formula_record_id,
                    predicate=predicate,
                    value=value,
                    source_locator=source_url,
                    import_run_id=import_run_id,
                    created_at=created_at,
                )

            for ingredient in formula_uses:
                position = int(cast(int, ingredient["position"]))
                material_id = str(ingredient["material_id"])
                ingredient_id = stable_id(
                    "ingredient-use",
                    f"{witness_id}|{position}|{ingredient['name']}",
                )
                nodes.append(
                    NodeUpsert(
                        entity_type=GraphLabel.INGREDIENT_USE,
                        id=ingredient_id,
                        properties={
                            "display_name": f"{name} ingredient {position}: {ingredient['name']}",
                            "witness_id": witness_id,
                            "source_record_id": formula_record_id,
                            "original_ingredient_text": str(ingredient["name"]),
                            "amount": str(ingredient["amount_text"]),
                            "original_unit_text": str(ingredient["unit"]),
                            "quantity_context": str(ingredient["quantity_context"]),
                            "sequence": position,
                            "sourced_role": str(ingredient["role"]),
                            "source_locator": source_url,
                            "review_status": "machine_imported",
                            "production_eligible": production_eligible,
                        },
                    )
                )
                material_relationship = (
                    GraphRelationshipType.USES_PREPARED_MATERIAL
                    if ingredient["entity_kind"] == "prepared_material"
                    else GraphRelationshipType.USES_MATERIAL
                )
                relationships.extend(
                    [
                        RelationshipUpsert(
                            id=f"rel:{witness_id}:ingredient:{position}",
                            source_id=witness_id,
                            target_id=ingredient_id,
                            relationship_type=GraphRelationshipType.HAS_INGREDIENT_USE,
                            properties={"sequence": position},
                        ),
                        RelationshipUpsert(
                            id=f"rel:{ingredient_id}:material",
                            source_id=ingredient_id,
                            target_id=material_id,
                            relationship_type=material_relationship,
                        ),
                        RelationshipUpsert(
                            id=f"rel:{ingredient_id}:record",
                            source_id=ingredient_id,
                            target_id=formula_record_id,
                            relationship_type=RelationshipType.SUPPORTED_BY,
                        ),
                    ]
                )
                if ingredient["entity_kind"] == "medicinal_material":
                    relationships.append(
                        RelationshipUpsert(
                            id=f"rel:{formula_id}:contains:{position}",
                            source_id=formula_id,
                            target_id=material_id,
                            relationship_type=RelationshipType.CONTAINS,
                            properties={
                                "sequence": position,
                                "amount_text": str(ingredient["amount_text"]),
                                "unit": str(ingredient["unit"]),
                                "source_record_id": formula_record_id,
                                "witness_id": witness_id,
                                "projection_version": "accepted-claims-v1",
                                "regenerable": True,
                            },
                        )
                    )
                material = material_by_id[material_id]
                if (
                    material["entity_kind"] == "medicinal_material"
                    and material["monograph_source_record_id"] is None
                    and formula_record_id in formula_record_ids
                ):
                    relationships.append(
                        RelationshipUpsert(
                            id=f"rel:{material_id}:formula-record:{formula_record_id}",
                            source_id=material_id,
                            target_id=formula_record_id,
                            relationship_type=RelationshipType.SUPPORTED_BY,
                        )
                    )
                if str(ingredient["unit"]) == "g":
                    nodes.append(
                        NodeUpsert(
                            entity_type=GraphLabel.UNIT,
                            id="unit:g",
                            properties={
                                "display_name": "gram",
                                "symbol": "g",
                                "review_status": "machine_imported",
                            },
                        )
                    )
                    relationships.append(
                        RelationshipUpsert(
                            id=f"rel:{ingredient_id}:unit:g",
                            source_id=ingredient_id,
                            target_id="unit:g",
                            relationship_type=GraphRelationshipType.HAS_UNIT,
                        )
                    )

        batch = _deduplicate(
            IngestionBatch(
                nodes=nodes,
                relationships=relationships,
                raw_records_preserved=source_record_count,
                unresolved_fields=[
                    "Traditional-preparation additions remain in FormulaWitness.prescription "
                    "and are not projected as base IngredientUse nodes."
                ],
            )
        )
        export_root = paths.release_root("graph-export", manifest.source_id, manifest.release_id)
        export_root.mkdir(parents=True, exist_ok=True)
        (export_root / "batch.json").write_text(
            f"{batch.model_dump_json(by_alias=True, indent=2)}\n",
            encoding="utf-8",
        )
        pq.write_table(
            pa.Table.from_pylist(
                [
                    {
                        "id": node.id,
                        "primary_label": node.entity_type.value,
                        "additional_labels": [label.value for label in node.additional_labels],
                        "properties_json": json.dumps(
                            node.properties, ensure_ascii=False, sort_keys=True
                        ),
                    }
                    for node in batch.nodes
                ]
            ),
            export_root / "nodes.parquet",
            compression="zstd",
        )
        pq.write_table(
            pa.Table.from_pylist(
                [
                    {
                        "id": relationship.id,
                        "source_id": relationship.source_id,
                        "target_id": relationship.target_id,
                        "relationship_type": relationship.relationship_type.value,
                        "properties_json": json.dumps(
                            relationship.properties,
                            ensure_ascii=False,
                            sort_keys=True,
                        ),
                    }
                    for relationship in batch.relationships
                ]
            ),
            export_root / "relationships.parquet",
            compression="zstd",
        )
        report_root = paths.release_root("reports", manifest.source_id, manifest.release_id)
        _write_json(
            report_root / "rights-provenance.json",
            {
                "sourceId": source.source_id,
                "releaseId": manifest.release_id,
                "license": manifest.license_snapshot.license_name,
                "licenseUrl": str(manifest.license_snapshot.license_url or ""),
                "productionEligible": production_eligible,
                "sourceRecordsWithReleaseProvenance": source_record_count,
            },
        )
        return batch

    async def load_graph(
        self,
        repository: AlchemyRepository,
        batch: IngestionBatch,
        *,
        batch_size: int,
    ) -> dict[str, int]:
        return await repository.ingest_batch(batch, batch_size)

    def audit(
        self,
        manifest: SourceReleaseManifest,
        paths: AlchemyDataPaths,
    ) -> dict[str, int | str | list[str] | bool]:
        report_root = paths.release_root("reports", manifest.source_id, manifest.release_id)
        staged_root = paths.staging_parquet(manifest.source_id, manifest.release_id)
        stage = json.loads((report_root / "row-counts-stage.json").read_text(encoding="utf-8"))
        normalized = json.loads(
            (report_root / "row-counts-normalized.json").read_text(encoding="utf-8")
        )
        source_record_ids = {
            str(row["source_record_id"])
            for row in [
                *_read_rows(staged_root / "materials.parquet"),
                *_read_rows(staged_root / "formulas.parquet"),
            ]
        }
        expected_source_records = int(stage["stagedMaterials"]) + int(stage["stagedFormulas"])
        critical: list[str] = []
        if int(stage["duplicateMaterialNames"]):
            critical.append("duplicate official medicinal-material names")
        if int(stage["duplicateFormulaUrls"]):
            critical.append("duplicate official formula URLs")
        if int(normalized["rejectedRecords"]):
            critical.append("source records were rejected during normalization")
        if int(stage["stagedIngredientUses"]) != int(normalized["normalizedIngredientUses"]):
            critical.append("staged and normalized ingredient-use counts do not reconcile")
        if len(source_record_ids) != expected_source_records:
            critical.append(
                "source-record IDs are not unique: "
                f"expected {expected_source_records}, got {len(source_record_ids)}"
            )
        if stage["mode"] == PipelineMode.FULL.value:
            expected = {
                "stagedMaterials": _EXPECTED_MATERIALS,
                "stagedFormulas": _EXPECTED_FORMULAS,
                "stagedIngredientUses": _EXPECTED_INGREDIENT_USES,
            }
            for field, count in expected.items():
                if int(stage[field]) != count:
                    critical.append(f"{field} expected {count}, got {stage[field]}")
        result: dict[str, int | str | list[str] | bool] = {
            "passed": not critical,
            "criticalFailures": len(critical),
            "criticalIssues": critical,
            "stagedMaterials": int(stage["stagedMaterials"]),
            "stagedFormulas": int(stage["stagedFormulas"]),
            "stagedIngredientUses": int(stage["stagedIngredientUses"]),
            "normalizedMaterials": int(normalized["normalizedMaterials"]),
            "preparedMaterialTerms": int(normalized["preparedMaterialTerms"]),
            "uniqueSourceRecords": len(source_record_ids),
            "rejectedRecords": int(normalized["rejectedRecords"]),
        }
        _write_json(report_root / "pipeline-audit.json", result)
        return result

    def report(
        self,
        source: SourceRegistryEntry,
        manifest: SourceReleaseManifest,
        paths: AlchemyDataPaths,
        phase_results: dict[str, dict[str, object]],
    ) -> dict[str, str | int]:
        report_root = paths.release_root("reports", manifest.source_id, manifest.release_id)
        graph = phase_results.get("graph", {})
        audit = phase_results.get("audit", {})
        summary = {
            "sourceId": source.source_id,
            "releaseId": manifest.release_id,
            "phaseResults": phase_results,
        }
        _write_json(report_root / "import-summary.json", summary)
        markdown = "\n".join(
            [
                f"# Import report: {source.title}",
                "",
                f"- Source ID: `{source.source_id}`",
                f"- Release ID: `{manifest.release_id}`",
                f"- Official monographs: {audit.get('stagedMaterials', 0)}",
                f"- Standardized formulas: {audit.get('stagedFormulas', 0)}",
                f"- Ordered base ingredient uses: {audit.get('stagedIngredientUses', 0)}",
                f"- Graph nodes: {graph.get('nodes', 0)}",
                f"- Graph relationships: {graph.get('relationships', 0)}",
                f"- Critical audit failures: {audit.get('criticalFailures', 0)}",
                f"- License: {manifest.license_snapshot.license_name}",
                "",
            ]
        )
        (report_root / "import-summary.md").write_text(markdown, encoding="utf-8")
        return {
            "jsonReport": str(report_root / "import-summary.json"),
            "markdownReport": str(report_root / "import-summary.md"),
            "reportFiles": len(list(report_root.glob("*"))),
        }
