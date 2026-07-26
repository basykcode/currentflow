"""Disease Ontology OBO adapter for the first approved end-to-end release slice."""

import json
import re
from dataclasses import dataclass
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
from current_alchemy.ingestion.downloads import DownloadPlan, ReleaseDownloader
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

_REAL_ID = re.compile(r"^DOID:[0-9]{1,7}$")
_DEMO_ID = re.compile(r"^DEMO:[0-9]{4,7}$")
_QUOTED = re.compile(r'^"((?:\\.|[^"])*)"')
_SYNONYM = re.compile(r'^"((?:\\.|[^"])*)"\s+([A-Z]+)')


@dataclass(frozen=True, slots=True)
class OboTerm:
    identifier: str
    name: str
    definition: str | None
    synonyms: tuple[tuple[str, str], ...]
    xrefs: tuple[str, ...]
    alt_ids: tuple[str, ...]
    parents: tuple[str, ...]
    subsets: tuple[str, ...]
    obsolete: bool
    replaced_by: tuple[str, ...]
    consider: tuple[str, ...]
    raw_stanza: str


def _unescape(value: str) -> str:
    return (
        value.replace(r"\"", '"')
        .replace(r"\:", ":")
        .replace(r"\,", ",")
        .replace(r"\(", "(")
        .replace(r"\)", ")")
        .replace(r"\\", "\\")
    )


def _quoted_value(value: str) -> str | None:
    match = _QUOTED.match(value)
    return _unescape(match.group(1)) if match else None


def _parse_term(lines: list[str]) -> OboTerm | None:
    values: dict[str, list[str]] = {}
    for line in lines:
        if not line or line.startswith("!"):
            continue
        tag, separator, value = line.partition(": ")
        if separator:
            values.setdefault(tag, []).append(value)
    identifier = values.get("id", [""])[0]
    name = values.get("name", [""])[0]
    if not identifier or not name:
        return None
    synonyms: list[tuple[str, str]] = []
    for raw in values.get("synonym", []):
        match = _SYNONYM.match(raw)
        if match:
            synonyms.append((_unescape(match.group(1)), match.group(2).casefold()))
    definition = _quoted_value(values.get("def", [""])[0])
    parents = tuple(
        raw.split("!", maxsplit=1)[0].strip().split(maxsplit=1)[0] for raw in values.get("is_a", [])
    )
    return OboTerm(
        identifier=identifier,
        name=_unescape(name),
        definition=definition,
        synonyms=tuple(synonyms),
        xrefs=tuple(values.get("xref", [])),
        alt_ids=tuple(values.get("alt_id", [])),
        parents=parents,
        subsets=tuple(values.get("subset", [])),
        obsolete=values.get("is_obsolete", ["false"])[0].casefold() == "true",
        replaced_by=tuple(values.get("replaced_by", [])),
        consider=tuple(values.get("consider", [])),
        raw_stanza="[Term]\n" + "\n".join(lines) + "\n",
    )


def parse_obo(path: Path) -> tuple[dict[str, str], list[OboTerm]]:
    """Parse header and Term stanzas without interpreting ontology semantics."""

    header: dict[str, str] = {}
    terms: list[OboTerm] = []
    stanza_type: str | None = None
    stanza_lines: list[str] = []

    def flush() -> None:
        nonlocal stanza_lines
        if stanza_type == "Term":
            term = _parse_term(stanza_lines)
            if term is not None:
                terms.append(term)
        stanza_lines = []

    with path.open(encoding="utf-8") as stream:
        for raw_line in stream:
            line = raw_line.rstrip("\r\n")
            if line.startswith("[") and line.endswith("]"):
                flush()
                stanza_type = line[1:-1]
                continue
            if stanza_type is None:
                key, separator, value = line.partition(": ")
                if separator and key not in header:
                    header[key] = value
                continue
            stanza_lines.append(line)
    flush()
    return header, terms


def _arrow_table(rows: list[dict[str, object]], schema: pa.Schema) -> pa.Table:
    return pa.Table.from_pylist(rows, schema=schema)


def _write_stage_table(
    connection: duckdb.DuckDBPyConnection,
    name: str,
    table: pa.Table,
    parquet_path: Path,
) -> None:
    connection.register(f"input_{name}", table)
    connection.execute(f"CREATE OR REPLACE TABLE {name} AS SELECT * FROM input_{name}")
    parquet_path.parent.mkdir(parents=True, exist_ok=True)
    pq.write_table(table, parquet_path, compression="zstd")


def _read_rows(path: Path) -> list[dict[str, object]]:
    return cast(list[dict[str, object]], pq.read_table(path).to_pylist())


def _record_id(source_id: str, release_id: str, external_id: str) -> str:
    compact_source = source_id.removeprefix("source:").replace(":", "-")
    return f"source-record:{compact_source}:{release_id}:{external_id}"


def _canonical_id(source: SourceRegistryEntry, external_id: str) -> str:
    value = external_id.split(":", maxsplit=1)[1]
    if source.source_id.startswith("demo:"):
        return f"demo:condition:disease-ontology:{value}"
    return f"disease:doid:{value}"


def _write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        f"{json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True)}\n",
        encoding="utf-8",
    )


class DiseaseOntologyAdapter:
    """Preserve DO source records and map exact DOIDs to canonical disease concepts."""

    name = "disease-ontology-obo"
    version = "1"
    supported_source_versions: tuple[str, ...] = ("2026-06-30", "demo")
    input_files: tuple[str, ...] = ("doid.obo",)
    output_tables: tuple[str, ...] = ("terms", "aliases", "xrefs", "parents")
    graph_entities: tuple[str, ...] = (
        "SourceRecord",
        "DiseaseConcept",
        "ExternalIdentifier",
        "CanonicalName",
        "Alias",
        "MappingAssertion",
        "Claim",
    )
    mappings_produced: tuple[str, ...] = ("exact_external_identifier",)
    claims_produced: tuple[str, ...] = ("definition", "is_a")
    observations_produced: tuple[str, ...] = ()
    known_limitations: tuple[str, ...] = (
        "OBO logical definitions are not available; use the OWL adapter for that future path.",
        "Subset mode does not materialize parent concepts outside the selected subset.",
    )

    def discover_release(self, source: SourceRegistryEntry) -> str:
        del source
        return "2026-06-30"

    def resolve_manifest(
        self,
        source: SourceRegistryEntry,
        manifest: SourceReleaseManifest,
    ) -> SourceReleaseManifest:
        if source.source_id != manifest.source_id:
            raise ValueError("source and release manifest IDs do not match")
        if manifest.adapter_name != self.name or manifest.adapter_version != self.version:
            raise ValueError("Disease Ontology adapter version mismatch")
        return manifest

    def plan_acquisition(
        self,
        source: SourceRegistryEntry,
        manifest: SourceReleaseManifest,
        downloader: ReleaseDownloader,
    ) -> DownloadPlan:
        return downloader.plan(source, manifest)

    async def acquire(
        self,
        source: SourceRegistryEntry,
        manifest: SourceReleaseManifest,
        downloader: ReleaseDownloader,
    ) -> SourceReleaseManifest:
        return await downloader.fetch(source, manifest)

    def verify(
        self,
        manifest: SourceReleaseManifest,
        downloader: ReleaseDownloader,
    ) -> dict[str, str | int]:
        return downloader.verify(manifest)

    def _artifact_path(self, manifest: SourceReleaseManifest, paths: AlchemyDataPaths) -> Path:
        artifact = manifest.artifacts[0]
        return paths.raw_original(manifest.source_id, manifest.release_id) / artifact.filename

    def extract(
        self,
        manifest: SourceReleaseManifest,
        paths: AlchemyDataPaths,
    ) -> dict[str, int | str]:
        artifact = self._artifact_path(manifest, paths)
        if not artifact.exists():
            raise FileNotFoundError(artifact)
        return {
            "mode": "no_archive",
            "files": 1,
            "bytes": artifact.stat().st_size,
        }

    def inspect_schema(
        self,
        manifest: SourceReleaseManifest,
        paths: AlchemyDataPaths,
    ) -> dict[str, int | str | list[str]]:
        header, terms = parse_obo(self._artifact_path(manifest, paths))
        report: dict[str, int | str | list[str]] = {
            "formatVersion": header.get("format-version", "unknown"),
            "dataVersion": header.get("data-version", "unknown"),
            "ontology": header.get("ontology", "unknown"),
            "termCount": len(terms),
            "fields": [
                "id",
                "name",
                "def",
                "synonym",
                "xref",
                "alt_id",
                "is_a",
                "subset",
                "is_obsolete",
                "replaced_by",
                "consider",
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
        del source
        _, parsed = parse_obo(self._artifact_path(manifest, paths))
        parsed.sort(key=lambda item: item.identifier)
        selected = parsed if mode is PipelineMode.FULL else parsed[:subset_limit]
        term_rows: list[dict[str, object]] = []
        alias_rows: list[dict[str, object]] = []
        xref_rows: list[dict[str, object]] = []
        parent_rows: list[dict[str, object]] = []
        for term in selected:
            source_record_id = _record_id(manifest.source_id, manifest.release_id, term.identifier)
            term_rows.append(
                {
                    "source_record_id": source_record_id,
                    "external_id": term.identifier,
                    "name": term.name,
                    "definition": term.definition,
                    "obsolete": term.obsolete,
                    "replaced_by": list(term.replaced_by),
                    "consider": list(term.consider),
                    "subsets": list(term.subsets),
                    "raw_stanza": term.raw_stanza,
                    "source_id": manifest.source_id,
                    "release_id": manifest.release_id,
                    "import_run_id": import_run_id,
                }
            )
            for alias, scope in term.synonyms:
                alias_rows.append(
                    {
                        "source_record_id": source_record_id,
                        "alias": alias,
                        "scope": scope,
                    }
                )
            for xref in (*term.xrefs, *term.alt_ids, term.identifier):
                scheme, separator, value = xref.partition(":")
                if separator:
                    xref_rows.append(
                        {
                            "source_record_id": source_record_id,
                            "scheme": scheme,
                            "value": value,
                            "original": xref,
                        }
                    )
            for parent in term.parents:
                parent_rows.append(
                    {
                        "source_record_id": source_record_id,
                        "child_external_id": term.identifier,
                        "parent_external_id": parent,
                    }
                )

        term_schema = pa.schema(
            [
                ("source_record_id", pa.string()),
                ("external_id", pa.string()),
                ("name", pa.string()),
                ("definition", pa.string()),
                ("obsolete", pa.bool_()),
                ("replaced_by", pa.list_(pa.string())),
                ("consider", pa.list_(pa.string())),
                ("subsets", pa.list_(pa.string())),
                ("raw_stanza", pa.string()),
                ("source_id", pa.string()),
                ("release_id", pa.string()),
                ("import_run_id", pa.string()),
            ]
        )
        alias_schema = pa.schema(
            [
                ("source_record_id", pa.string()),
                ("alias", pa.string()),
                ("scope", pa.string()),
            ]
        )
        xref_schema = pa.schema(
            [
                ("source_record_id", pa.string()),
                ("scheme", pa.string()),
                ("value", pa.string()),
                ("original", pa.string()),
            ]
        )
        parent_schema = pa.schema(
            [
                ("source_record_id", pa.string()),
                ("child_external_id", pa.string()),
                ("parent_external_id", pa.string()),
            ]
        )
        database = paths.staging_database(manifest.source_id, manifest.release_id)
        database.parent.mkdir(parents=True, exist_ok=True)
        parquet = paths.staging_parquet(manifest.source_id, manifest.release_id)
        with duckdb.connect(str(database)) as connection:
            _write_stage_table(
                connection,
                "terms",
                _arrow_table(term_rows, term_schema),
                parquet / "terms.parquet",
            )
            _write_stage_table(
                connection,
                "aliases",
                _arrow_table(alias_rows, alias_schema),
                parquet / "aliases.parquet",
            )
            _write_stage_table(
                connection,
                "xrefs",
                _arrow_table(xref_rows, xref_schema),
                parquet / "xrefs.parquet",
            )
            _write_stage_table(
                connection,
                "parents",
                _arrow_table(parent_rows, parent_schema),
                parquet / "parents.parquet",
            )

        duplicate_count = len(term_rows) - len({str(row["external_id"]) for row in term_rows})
        null_definitions = sum(row["definition"] is None for row in term_rows)
        report: dict[str, int | str | list[str]] = {
            "mode": mode.value,
            "availableTerms": len(parsed),
            "stagedTerms": len(term_rows),
            "stagedAliases": len(alias_rows),
            "stagedXrefs": len(xref_rows),
            "stagedParents": len(parent_rows),
            "duplicateExternalIds": duplicate_count,
            "nullDefinitions": null_definitions,
        }
        report_root = paths.release_root("reports", manifest.source_id, manifest.release_id)
        _write_json(report_root / "row-counts-stage.json", report)
        _write_json(
            report_root / "null-rates.json",
            {"definitions": (null_definitions / len(term_rows) if term_rows else 0)},
        )
        _write_json(
            report_root / "duplicate-keys.json",
            {"externalIdDuplicates": duplicate_count},
        )
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
        normalized = paths.normalized_parquet(manifest.source_id, manifest.release_id)
        normalized.mkdir(parents=True, exist_ok=True)
        accepted: list[dict[str, object]] = []
        rejects: list[dict[str, str]] = []
        identifier_pattern = _DEMO_ID if source.source_id.startswith("demo:") else _REAL_ID
        for row in _read_rows(staged / "terms.parquet"):
            identifier = str(row["external_id"])
            name = normalize_source_text(str(row["name"]))
            if not identifier_pattern.fullmatch(identifier):
                rejects.append(
                    {
                        "sourceRecordId": str(row["source_record_id"]),
                        "reason": f"invalid ontology identifier: {identifier}",
                    }
                )
                continue
            if not name:
                rejects.append(
                    {
                        "sourceRecordId": str(row["source_record_id"]),
                        "reason": "empty normalized preferred name",
                    }
                )
                continue
            accepted.append(
                {
                    **row,
                    "name": name,
                    "normalized_name": normalize_name(name),
                    "normalized_definition": (
                        normalize_source_text(str(row["definition"]))
                        if row["definition"] is not None
                        else None
                    ),
                }
            )

        term_schema = pa.schema(
            [
                ("source_record_id", pa.string()),
                ("external_id", pa.string()),
                ("name", pa.string()),
                ("definition", pa.string()),
                ("obsolete", pa.bool_()),
                ("replaced_by", pa.list_(pa.string())),
                ("consider", pa.list_(pa.string())),
                ("subsets", pa.list_(pa.string())),
                ("raw_stanza", pa.string()),
                ("source_id", pa.string()),
                ("release_id", pa.string()),
                ("import_run_id", pa.string()),
                ("normalized_name", pa.string()),
                ("normalized_definition", pa.string()),
            ]
        )
        pq.write_table(
            _arrow_table(accepted, term_schema),
            normalized / "terms.parquet",
            compression="zstd",
        )
        for name in ("aliases", "xrefs", "parents"):
            table = pq.read_table(staged / f"{name}.parquet")
            pq.write_table(table, normalized / f"{name}.parquet", compression="zstd")

        report: dict[str, int | str | list[str]] = {
            "normalizedTerms": len(accepted),
            "rejectedTerms": len(rejects),
        }
        report_root = paths.release_root("reports", manifest.source_id, manifest.release_id)
        _write_json(report_root / "rejected-records.json", rejects)
        _write_json(report_root / "row-counts-normalized.json", report)
        return report

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
        terms = _read_rows(normalized / "terms.parquet")
        aliases = _read_rows(normalized / "aliases.parquet")
        xrefs = _read_rows(normalized / "xrefs.parquet")
        parents = _read_rows(normalized / "parents.parquet")
        aliases_by_record: dict[str, list[dict[str, object]]] = {}
        for alias in aliases:
            aliases_by_record.setdefault(str(alias["source_record_id"]), []).append(alias)
        xrefs_by_record: dict[str, list[dict[str, object]]] = {}
        for xref in xrefs:
            xrefs_by_record.setdefault(str(xref["source_record_id"]), []).append(xref)

        nodes: list[NodeUpsert] = []
        relationships: list[RelationshipUpsert] = []
        rights = manifest.license_snapshot
        license_basis = str(rights.license_url or rights.license_name)
        license_id = stable_id("license", license_basis)
        adapter_id = f"adapter-version:{self.name}:{self.version}"
        schema_id = f"schema-version:{manifest.schema_version}"
        mapping_version_id = f"mapping-version:{manifest.mapping_version}"
        release_node_id = f"source-release:{source.source_id}:{manifest.release_id}"

        nodes.extend(
            [
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
                    id=release_node_id,
                    properties={
                        "display_name": f"{source.title} {manifest.source_version}",
                        "source_id": source.source_id,
                        "release_id": manifest.release_id,
                        "source_version": manifest.source_version,
                        "release_date": manifest.release_date.isoformat(),
                        "checksum_verified": True,
                        "import_audit_passed": True,
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
                    id=mapping_version_id,
                    properties={
                        "display_name": manifest.mapping_version,
                        "version": manifest.mapping_version,
                        "review_status": "machine_imported",
                    },
                ),
            ]
        )
        relationships.extend(
            [
                RelationshipUpsert(
                    id=f"rel:{source.source_id}:release:{manifest.release_id}",
                    source_id=source.source_id,
                    target_id=release_node_id,
                    relationship_type=GraphRelationshipType.HAS_RELEASE,
                ),
                RelationshipUpsert(
                    id=f"rel:{release_node_id}:license",
                    source_id=release_node_id,
                    target_id=license_id,
                    relationship_type=GraphRelationshipType.USES_LICENSE,
                ),
                RelationshipUpsert(
                    id=f"rel:{import_run_id}:release",
                    source_id=import_run_id,
                    target_id=release_node_id,
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
                    target_id=mapping_version_id,
                    relationship_type=GraphRelationshipType.USED_MAPPING,
                ),
            ]
        )

        canonical_by_external: dict[str, str] = {}
        record_by_external: dict[str, str] = {}
        unresolved: list[dict[str, str]] = []
        for term in terms:
            external_id = str(term["external_id"])
            source_record_id = str(term["source_record_id"])
            canonical_id = _canonical_id(source, external_id)
            canonical_by_external[external_id] = canonical_id
            record_by_external[external_id] = source_record_id
            record_aliases = aliases_by_record.get(source_record_id, [])
            alias_search = " ".join(
                [
                    str(term["name"]),
                    *(str(alias["alias"]) for alias in record_aliases),
                ]
            )
            mapping = IdentityResolver.exact_external_id(
                source_record_id=source_record_id,
                canonical_id=canonical_id,
                scheme="DOID" if external_id.startswith("DOID:") else "DEMO",
                value=external_id,
                mapping_version=manifest.mapping_version,
            )
            mapping_id = mapping.id
            preferred_name_id = stable_id("canonical-name", f"{canonical_id}|{term['name']}|en")
            nodes.extend(
                [
                    NodeUpsert(
                        entity_type=GraphLabel.SOURCE_RECORD,
                        id=source_record_id,
                        properties={
                            "display_name": str(term["name"]),
                            "source_id": source.source_id,
                            "release_id": manifest.release_id,
                            "external_id": external_id,
                            "original_name": str(term["name"]),
                            "original_definition": (
                                str(term["definition"]) if term["definition"] is not None else None
                            ),
                            "raw_stanza": str(term["raw_stanza"]),
                            "review_status": "machine_imported",
                            "row_production_eligible": True,
                            "production_eligible": production_eligible,
                        },
                    ),
                    NodeUpsert(
                        entity_type=GraphLabel.DISEASE_CONCEPT,
                        additional_labels=[
                            GraphLabel.CANONICAL_ENTITY,
                            GraphLabel.CONDITION,
                        ],
                        id=canonical_id,
                        properties={
                            "canonical_id": canonical_id,
                            "display_name": str(term["name"]),
                            "normalized_name": str(term["normalized_name"]),
                            "aliases_search": normalize_name(alias_search),
                            "definition": (
                                str(term["normalized_definition"])
                                if term["normalized_definition"] is not None
                                else None
                            ),
                            "obsolete": bool(term["obsolete"]),
                            "review_status": "machine_imported",
                            "review_statuses": ["machine_imported"],
                            "source_ids": [source.source_id],
                            "data_status": "source_reported",
                            "projection_version": "accepted-claims-v1",
                            "production_eligible": production_eligible,
                        },
                    ),
                    NodeUpsert(
                        entity_type=GraphLabel.CANONICAL_NAME,
                        id=preferred_name_id,
                        properties={
                            "display_name": str(term["name"]),
                            "text": str(term["name"]),
                            "normalized": str(term["normalized_name"]),
                            "language": "en",
                            "script": "Latn",
                            "kind": "preferred",
                            "source_record_id": source_record_id,
                            "review_status": "machine_imported",
                        },
                    ),
                    NodeUpsert(
                        entity_type=GraphLabel.MAPPING_ASSERTION,
                        id=mapping_id,
                        properties={
                            "display_name": f"{external_id} exact mapping",
                            "relation": mapping.relation.value,
                            "method": mapping.method.value,
                            "status": mapping.status.value,
                            "mapping_version": mapping.mapping_version,
                            "evidence": mapping.evidence,
                            "review_status": "machine_imported",
                        },
                    ),
                ]
            )
            relationships.extend(
                [
                    RelationshipUpsert(
                        id=f"rel:{release_node_id}:record:{external_id}",
                        source_id=release_node_id,
                        target_id=source_record_id,
                        relationship_type=GraphRelationshipType.CONTAINS_RECORD,
                    ),
                    RelationshipUpsert(
                        id=f"rel:{canonical_id}:record:{manifest.release_id}",
                        source_id=canonical_id,
                        target_id=source_record_id,
                        relationship_type=RelationshipType.SUPPORTED_BY,
                    ),
                    RelationshipUpsert(
                        id=f"rel:{mapping_id}:subject",
                        source_id=mapping_id,
                        target_id=source_record_id,
                        relationship_type=GraphRelationshipType.MAPPING_SUBJECT,
                    ),
                    RelationshipUpsert(
                        id=f"rel:{mapping_id}:target",
                        source_id=mapping_id,
                        target_id=canonical_id,
                        relationship_type=GraphRelationshipType.MAPPING_TARGET,
                    ),
                    RelationshipUpsert(
                        id=f"rel:{canonical_id}:preferred-name",
                        source_id=canonical_id,
                        target_id=preferred_name_id,
                        relationship_type=GraphRelationshipType.HAS_NAME,
                    ),
                ]
            )

            for xref in xrefs_by_record.get(source_record_id, []):
                original = str(xref["original"])
                external_node_id = stable_id("external-identifier", original)
                nodes.append(
                    NodeUpsert(
                        entity_type=GraphLabel.EXTERNAL_IDENTIFIER,
                        id=external_node_id,
                        properties={
                            "display_name": original,
                            "scheme": str(xref["scheme"]),
                            "value": str(xref["value"]),
                            "original": original,
                            "review_status": "machine_imported",
                        },
                    )
                )
                relationships.append(
                    RelationshipUpsert(
                        id=stable_id(
                            "relationship",
                            f"{source_record_id}|HAS_EXTERNAL_IDENTIFIER|{external_node_id}",
                        ),
                        source_id=source_record_id,
                        target_id=external_node_id,
                        relationship_type=GraphRelationshipType.HAS_EXTERNAL_IDENTIFIER,
                    )
                )

            for alias in record_aliases:
                alias_text = str(alias["alias"])
                alias_id = stable_id(
                    "alias",
                    f"{source_record_id}|{alias_text}|{alias['scope']}",
                )
                nodes.append(
                    NodeUpsert(
                        entity_type=GraphLabel.ALIAS,
                        id=alias_id,
                        properties={
                            "display_name": alias_text,
                            "text": alias_text,
                            "normalized": normalize_name(alias_text),
                            "language": "en",
                            "script": "Latn",
                            "scope": str(alias["scope"]),
                            "source_record_id": source_record_id,
                            "review_status": "machine_imported",
                        },
                    )
                )
                relationships.extend(
                    [
                        RelationshipUpsert(
                            id=f"rel:{alias_id}:canonical",
                            source_id=alias_id,
                            target_id=canonical_id,
                            relationship_type=GraphRelationshipType.ALIAS_OF,
                        ),
                        RelationshipUpsert(
                            id=f"rel:{alias_id}:record",
                            source_id=alias_id,
                            target_id=source_record_id,
                            relationship_type=RelationshipType.SUPPORTED_BY,
                        ),
                    ]
                )

            if term["definition"] is not None:
                claim_id = stable_id(
                    "claim",
                    f"{source_record_id}|definition|{term['definition']}",
                )
                nodes.append(
                    NodeUpsert(
                        entity_type=EntityType.CLAIM,
                        id=claim_id,
                        properties={
                            "display_name": f"{external_id} definition claim",
                            "predicate": "definition",
                            "literal_value": str(term["definition"]),
                            "literal_value_type": "text",
                            "original_text": str(term["definition"]),
                            "normalized_text": str(term["normalized_definition"]),
                            "language": "en",
                            "source_locator": external_id,
                            "review_status": "machine_imported",
                            "assertion_status": "source_reported",
                            "evidence_type": "ontology_release",
                            "assertion_method": "machine_import",
                            "import_run_id": import_run_id,
                        },
                    )
                )
                relationships.extend(
                    [
                        RelationshipUpsert(
                            id=f"rel:{claim_id}:subject",
                            source_id=claim_id,
                            target_id=canonical_id,
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

        for parent in parents:
            child_external = str(parent["child_external_id"])
            parent_external = str(parent["parent_external_id"])
            child_id = canonical_by_external.get(child_external)
            parent_id = canonical_by_external.get(parent_external)
            mapped_record_id = record_by_external.get(child_external)
            if child_id is None or parent_id is None or mapped_record_id is None:
                unresolved.append(
                    {
                        "child": child_external,
                        "parent": parent_external,
                        "reason": "parent is outside the selected subset",
                    }
                )
                continue
            claim_id = stable_id("claim", f"{mapped_record_id}|is_a|{parent_external}")
            nodes.append(
                NodeUpsert(
                    entity_type=EntityType.CLAIM,
                    id=claim_id,
                    properties={
                        "display_name": f"{child_external} is_a {parent_external}",
                        "predicate": "is_a",
                        "language": "en",
                        "source_locator": child_external,
                        "review_status": "machine_imported",
                        "assertion_status": "source_reported",
                        "evidence_type": "ontology_release",
                        "assertion_method": "machine_import",
                        "import_run_id": import_run_id,
                    },
                )
            )
            relationships.extend(
                [
                    RelationshipUpsert(
                        id=f"rel:{claim_id}:subject",
                        source_id=claim_id,
                        target_id=child_id,
                        relationship_type=RelationshipType.SUBJECT,
                    ),
                    RelationshipUpsert(
                        id=f"rel:{claim_id}:object",
                        source_id=claim_id,
                        target_id=parent_id,
                        relationship_type=RelationshipType.OBJECT,
                    ),
                    RelationshipUpsert(
                        id=f"rel:{claim_id}:record",
                        source_id=claim_id,
                        target_id=mapped_record_id,
                        relationship_type=RelationshipType.SUPPORTED_BY,
                    ),
                    RelationshipUpsert(
                        id=stable_id(
                            "projection-relationship",
                            f"{child_id}|IS_A|{parent_id}|accepted-claims-v1",
                        ),
                        source_id=child_id,
                        target_id=parent_id,
                        relationship_type=GraphRelationshipType.IS_A,
                        properties={
                            "projection_version": "accepted-claims-v1",
                            "regenerable": True,
                            "source_record_id": mapped_record_id,
                            "production_eligible": production_eligible,
                        },
                    ),
                ]
            )

        deduplicated_nodes = {node.id: node for node in nodes}
        deduplicated_relationships = {
            relationship.id: relationship for relationship in relationships
        }
        batch = IngestionBatch(
            nodes=list(deduplicated_nodes.values()),
            relationships=list(deduplicated_relationships.values()),
            raw_records_preserved=len(terms),
            unresolved_fields=[
                f"{len(unresolved)} hierarchy mappings refer to parents outside the selected subset"
            ]
            if unresolved
            else [],
        )
        export_root = paths.release_root("graph-export", manifest.source_id, manifest.release_id)
        export_root.mkdir(parents=True, exist_ok=True)
        (export_root / "batch.json").write_text(
            f"{batch.model_dump_json(by_alias=True, indent=2)}\n",
            encoding="utf-8",
        )
        node_export = pa.Table.from_pylist(
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
        )
        relationship_export = pa.Table.from_pylist(
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
        )
        pq.write_table(node_export, export_root / "nodes.parquet", compression="zstd")
        pq.write_table(
            relationship_export,
            export_root / "relationships.parquet",
            compression="zstd",
        )
        report_root = paths.release_root("reports", manifest.source_id, manifest.release_id)
        _write_json(report_root / "unresolved-mappings.json", unresolved)
        _write_json(
            report_root / "rights-provenance.json",
            {
                "sourceId": source.source_id,
                "releaseId": manifest.release_id,
                "license": rights.license_name,
                "licenseUrl": str(rights.license_url or ""),
                "productionEligible": production_eligible,
                "recordsWithReleaseProvenance": len(terms),
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
        stage = json.loads((report_root / "row-counts-stage.json").read_text(encoding="utf-8"))
        normalized = json.loads(
            (report_root / "row-counts-normalized.json").read_text(encoding="utf-8")
        )
        duplicates = int(stage["duplicateExternalIds"])
        staged_count = int(stage["stagedTerms"])
        normalized_count = int(normalized["normalizedTerms"])
        rejected_count = int(normalized["rejectedTerms"])
        critical: list[str] = []
        if duplicates:
            critical.append(f"{duplicates} duplicate ontology IDs")
        if staged_count != normalized_count + rejected_count:
            critical.append("stage and normalized row counts do not reconcile")
        result: dict[str, int | str | list[str] | bool] = {
            "passed": not critical,
            "criticalFailures": len(critical),
            "criticalIssues": critical,
            "stagedTerms": staged_count,
            "normalizedTerms": normalized_count,
            "rejectedTerms": rejected_count,
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
                f"# Import report: {source.title} {manifest.source_version}",
                "",
                f"- Source ID: `{source.source_id}`",
                f"- Release ID: `{manifest.release_id}`",
                f"- Graph nodes: {graph.get('nodes', 0)}",
                f"- Graph relationships: {graph.get('relationships', 0)}",
                f"- Critical audit failures: {audit.get('criticalFailures', 0)}",
                f"- License: {manifest.license_snapshot.license_name}",
                "- Provenance: canonical record → MappingAssertion → SourceRecord "
                "→ SourceRelease → Source/License → ImportRun",
                "",
            ]
        )
        (report_root / "import-summary.md").write_text(markdown, encoding="utf-8")
        return {
            "jsonReport": str(report_root / "import-summary.json"),
            "markdownReport": str(report_root / "import-summary.md"),
            "reportFiles": len(list(report_root.glob("*"))),
        }
