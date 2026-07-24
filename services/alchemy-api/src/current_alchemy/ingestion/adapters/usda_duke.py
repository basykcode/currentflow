"""Conservative functioning subset adapter for the USDA Duke archive."""

import csv
import io
import json
import re
import zipfile
from collections.abc import Iterable
from hashlib import sha256
from pathlib import Path

from current_alchemy.domain.common.exploration import RelationshipType
from current_alchemy.domain.common.models import EntityType
from current_alchemy.domain.common.normalization import normalize_name, normalize_source_text
from current_alchemy.ingestion.manifests.models import SourceManifest
from current_alchemy.ingestion.models import IngestionBatch, NodeUpsert, RelationshipUpsert

_SLUG = re.compile(r"[^a-z0-9]+")


def _slug(value: str) -> str:
    normalized = normalize_name(value)
    slug = _SLUG.sub("-", normalized).strip("-")
    return slug[:120] or sha256(value.encode("utf-8")).hexdigest()[:20]


def _rows(archive: zipfile.ZipFile, name: str) -> Iterable[dict[str, str]]:
    with archive.open(name) as raw:
        text = io.TextIOWrapper(raw, encoding="utf-8-sig", errors="replace", newline="")
        yield from csv.DictReader(text)


class UsdaDukeAdapter:
    """Map taxa, compounds, activities, quantities, and citations without TCM crosswalks."""

    name = "usda-duke"
    version = "1"

    def parse(
        self, manifest: SourceManifest, input_directory: Path, *, batch_size: int
    ) -> IngestionBatch:
        del batch_size
        archive_path = input_directory / manifest.expected_files[0].path
        nodes: list[NodeUpsert] = [
            NodeUpsert(
                entity_type=EntityType.SOURCE,
                id=manifest.source_id,
                properties={
                    "title": manifest.title,
                    "display_name": manifest.title,
                    "rights_status": manifest.rights_status.value,
                    "review_status": "machine_imported",
                    "citation": manifest.citation_template,
                    "active": True,
                },
            )
        ]
        relationships: list[RelationshipUpsert] = []
        unresolved: list[str] = []
        with zipfile.ZipFile(archive_path) as archive:
            names = set(archive.namelist())
            required = {"FNFTAX.csv", "CHEMICALS.csv", "AGGREGAC.csv", "FARMACY_NEW.csv"}
            missing = required - names
            if missing:
                raise ValueError(f"USDA archive is missing tables: {', '.join(sorted(missing))}")

            for row in _rows(archive, "FNFTAX.csv"):
                record_id = normalize_source_text(row.get("FNFNUM", ""))
                taxon = normalize_source_text(row.get("TAXON", ""))
                if not record_id or not taxon:
                    unresolved.append(
                        f"FNFTAX row missing FNFNUM or TAXON: {record_id or 'unknown'}"
                    )
                    continue
                nodes.append(
                    NodeUpsert(
                        entity_type=EntityType.BOTANICAL_TAXON,
                        id=f"taxon:usda-duke:{_slug(record_id)}",
                        properties={
                            "display_name": taxon,
                            "scientific_name": taxon,
                            "family": normalize_source_text(row.get("FAMILY", "")),
                            "source_ids": [manifest.source_id],
                            "review_status": "machine_imported",
                            "review_statuses": ["machine_imported"],
                            "data_status": "source_reported",
                            "source_record_id": record_id,
                            "raw_json": json.dumps(row, ensure_ascii=False, sort_keys=True),
                        },
                    )
                )

            for row in _rows(archive, "CHEMICALS.csv"):
                chemical_id = normalize_source_text(row.get("CHEMID", ""))
                name = normalize_source_text(row.get("CHEM", ""))
                if not chemical_id or not name:
                    unresolved.append(
                        f"CHEMICALS row missing CHEMID or CHEM: {chemical_id or 'unknown'}"
                    )
                    continue
                nodes.append(
                    NodeUpsert(
                        entity_type=EntityType.COMPOUND,
                        id=f"compound:usda-duke:{_slug(chemical_id)}",
                        properties={
                            "display_name": name,
                            "source_name": name,
                            "cas_number": normalize_source_text(row.get("CASNUM", "")),
                            "source_ids": [manifest.source_id],
                            "review_status": "machine_imported",
                            "review_statuses": ["machine_imported"],
                            "data_status": "source_reported",
                            "source_record_id": chemical_id,
                            "raw_json": json.dumps(row, ensure_ascii=False, sort_keys=True),
                        },
                    )
                )

            for index, row in enumerate(_rows(archive, "AGGREGAC.csv")):
                chemical = normalize_source_text(row.get("CHEM", ""))
                activity = normalize_source_text(row.get("ACTIVITY", ""))
                if not chemical or not activity:
                    continue
                action_id = f"action:usda-duke:{_slug(activity)}"
                nodes.append(
                    NodeUpsert(
                        entity_type=EntityType.ACTION,
                        id=action_id,
                        properties={
                            "display_name": activity,
                            "source_ids": [manifest.source_id],
                            "review_status": "machine_imported",
                            "review_statuses": ["machine_imported"],
                            "data_status": "source_reported",
                        },
                    )
                )
                # AGGREGAC identifies compounds by source name, not CHEMID. Preserve an explicit
                # unresolved compound-name node instead of guessing a CHEMID crosswalk.
                compound_name_id = f"compound:usda-duke:name:{_slug(chemical)}"
                nodes.append(
                    NodeUpsert(
                        entity_type=EntityType.COMPOUND,
                        id=compound_name_id,
                        properties={
                            "display_name": chemical,
                            "source_ids": [manifest.source_id],
                            "review_status": "machine_imported",
                            "review_statuses": ["machine_imported"],
                            "data_status": "incomplete",
                            "crosswalk_status": "unresolved_source_name",
                        },
                    )
                )
                claim_id = (
                    "claim:usda-duke:"
                    + sha256(f"AGGREGAC|{index}|{chemical}|{activity}".encode()).hexdigest()[:24]
                )
                nodes.append(
                    NodeUpsert(
                        entity_type=EntityType.CLAIM,
                        id=claim_id,
                        properties={
                            "display_name": f"{chemical} source-reported activity {activity}",
                            "predicate": "HAS_SOURCE_ACTIVITY",
                            "language": "en",
                            "source_locator": f"AGGREGAC.csv row {index + 2}",
                            "evidence_type": "dataset_record",
                            "review_status": "machine_imported",
                            "import_run_id": f"import:{manifest.source_id}:{manifest.version}",
                            "textual_value": activity,
                            "raw_json": json.dumps(row, ensure_ascii=False, sort_keys=True),
                        },
                    )
                )
                relationships.extend(
                    [
                        RelationshipUpsert(
                            id=f"rel:{claim_id}:subject",
                            source_id=claim_id,
                            target_id=compound_name_id,
                            relationship_type=RelationshipType.SUBJECT,
                        ),
                        RelationshipUpsert(
                            id=f"rel:{claim_id}:object",
                            source_id=claim_id,
                            target_id=action_id,
                            relationship_type=RelationshipType.OBJECT,
                        ),
                        RelationshipUpsert(
                            id=f"rel:{claim_id}:source",
                            source_id=claim_id,
                            target_id=manifest.source_id,
                            relationship_type=RelationshipType.SUPPORTED_BY,
                        ),
                    ]
                )

            # Quantitative FARMACY rows are retained as raw Claim records. The preliminary data
            # dictionary does not justify a plant-to-TCM-material crosswalk.
            for index, row in enumerate(_rows(archive, "FARMACY_NEW.csv")):
                fnfnum = normalize_source_text(row.get("FNFNUM", ""))
                chemical = normalize_source_text(row.get("CHEM", ""))
                if not fnfnum or not chemical:
                    continue
                claim_id = (
                    "claim:usda-duke:quantity:"
                    + sha256(f"{index}|{fnfnum}|{chemical}".encode()).hexdigest()[:24]
                )
                nodes.append(
                    NodeUpsert(
                        entity_type=EntityType.CLAIM,
                        id=claim_id,
                        properties={
                            "display_name": f"USDA Duke quantitative record {index + 2}",
                            "predicate": "HAS_QUANTITATIVE_RECORD",
                            "language": "en",
                            "source_locator": f"FARMACY_NEW.csv row {index + 2}",
                            "evidence_type": "dataset_record",
                            "review_status": "machine_imported",
                            "import_run_id": f"import:{manifest.source_id}:{manifest.version}",
                            "raw_json": json.dumps(row, ensure_ascii=False, sort_keys=True),
                        },
                    )
                )
                relationships.append(
                    RelationshipUpsert(
                        id=f"rel:{claim_id}:source",
                        source_id=claim_id,
                        target_id=manifest.source_id,
                        relationship_type=RelationshipType.SUPPORTED_BY,
                    )
                )
        deduplicated_nodes = {node.id: node for node in nodes}
        deduplicated_relationships = {
            relationship.id: relationship for relationship in relationships
        }
        return IngestionBatch(
            nodes=list(deduplicated_nodes.values()),
            relationships=list(deduplicated_relationships.values()),
            raw_records_preserved=sum(
                1 for node in deduplicated_nodes.values() if "raw_json" in node.properties
            ),
            unresolved_fields=sorted(set(unresolved)),
        )
