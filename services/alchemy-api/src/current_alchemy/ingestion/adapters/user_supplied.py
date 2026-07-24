"""Rights-controlled normalized JSONL and Markdown/text passage ingestion."""

import json
from hashlib import sha256
from pathlib import Path

from pydantic import Field

from current_alchemy.domain.common.exploration import RelationshipType
from current_alchemy.domain.common.models import ApiModel, EntityType, ReviewStatus
from current_alchemy.domain.common.normalization import normalize_source_text
from current_alchemy.ingestion.manifests.models import SourceManifest
from current_alchemy.ingestion.models import IngestionBatch, NodeUpsert, RelationshipUpsert


class UserPassageRecord(ApiModel):
    source_id: str
    source_locator: str
    original_text: str = Field(min_length=1)
    normalized_fields: dict[str, str | list[str]]
    language: str
    review_status: ReviewStatus
    document_id: str | None = None
    passage_id: str | None = None
    mentioned_entity_ids: list[str] = Field(default_factory=list)


def _record_to_nodes(
    record: UserPassageRecord,
    manifest: SourceManifest,
    index: int,
) -> tuple[list[NodeUpsert], list[RelationshipUpsert]]:
    if record.source_id != manifest.source_id:
        raise ValueError(f"Record {index} source ID '{record.source_id}' does not match manifest")
    document_id = record.document_id or f"document:{manifest.source_id}:{manifest.version}"
    digest = sha256(record.original_text.encode("utf-8")).hexdigest()
    passage_id = record.passage_id or f"passage:{manifest.source_id}:{digest[:24]}"
    normalized_candidate = record.normalized_fields.get("text", record.original_text)
    normalized_text = (
        normalized_candidate if isinstance(normalized_candidate, str) else record.original_text
    )
    nodes = [
        NodeUpsert(
            entity_type=EntityType.DOCUMENT,
            id=document_id,
            properties={
                "display_name": manifest.title,
                "title": manifest.title,
                "source_id": manifest.source_id,
                "language": record.language,
                "version": manifest.version,
                "checksum": manifest.sha256_checksum,
                "review_status": record.review_status.value,
            },
        ),
        NodeUpsert(
            entity_type=EntityType.PASSAGE,
            id=passage_id,
            properties={
                "display_name": f"{manifest.title}: {record.source_locator}",
                "document_id": document_id,
                "source_id": manifest.source_id,
                "source_locator": record.source_locator,
                "original_text": record.original_text,
                "normalized_text": normalize_source_text(normalized_text).casefold(),
                "language": record.language,
                "review_status": record.review_status.value,
                "checksum": digest,
                "mentioned_entity_ids": record.mentioned_entity_ids,
                "normalized_fields_json": json.dumps(
                    record.normalized_fields, ensure_ascii=False, sort_keys=True
                ),
            },
        ),
    ]
    relationships = [
        RelationshipUpsert(
            id=f"rel:{document_id}:{passage_id}",
            source_id=document_id,
            target_id=passage_id,
            relationship_type=RelationshipType.HAS_PASSAGE,
        )
    ]
    relationships.extend(
        RelationshipUpsert(
            id=f"rel:{passage_id}:mentions:{entity_id}",
            source_id=passage_id,
            target_id=entity_id,
            relationship_type=RelationshipType.MENTIONS,
        )
        for entity_id in record.mentioned_entity_ids
    )
    return nodes, relationships


class UserSuppliedSourceAdapter:
    name = "user-supplied"
    version = "1"

    def parse(
        self, manifest: SourceManifest, input_directory: Path, *, batch_size: int
    ) -> IngestionBatch:
        del batch_size
        nodes: list[NodeUpsert] = [
            NodeUpsert(
                entity_type=EntityType.SOURCE,
                id=manifest.source_id,
                properties={
                    "display_name": manifest.title,
                    "title": manifest.title,
                    "rights_status": manifest.rights_status.value,
                    "review_status": "machine_imported",
                    "citation": manifest.citation_template,
                    "active": True,
                },
            )
        ]
        relationships: list[RelationshipUpsert] = []
        record_index = 0
        for expected in manifest.expected_files:
            path = input_directory / expected.path
            suffix = path.suffix.casefold()
            if suffix == ".jsonl":
                for line_number, line in enumerate(
                    path.read_text(encoding="utf-8").splitlines(), start=1
                ):
                    if not line.strip():
                        continue
                    record = UserPassageRecord.model_validate_json(line)
                    record_nodes, record_relationships = _record_to_nodes(
                        record, manifest, line_number
                    )
                    nodes.extend(record_nodes)
                    relationships.extend(record_relationships)
                    record_index += 1
            elif suffix in {".md", ".txt"}:
                paragraphs = [
                    normalize_source_text(part)
                    for part in path.read_text(encoding="utf-8").split("\n\n")
                    if normalize_source_text(part)
                ]
                for paragraph_index, paragraph in enumerate(paragraphs, start=1):
                    record = UserPassageRecord(
                        source_id=manifest.source_id,
                        source_locator=f"{expected.path} paragraph {paragraph_index}",
                        original_text=paragraph,
                        normalized_fields={"text": paragraph.casefold()},
                        language=manifest.language[0],
                        review_status=ReviewStatus.MACHINE_IMPORTED,
                    )
                    record_nodes, record_relationships = _record_to_nodes(
                        record, manifest, paragraph_index
                    )
                    nodes.extend(record_nodes)
                    relationships.extend(record_relationships)
                    record_index += 1
            else:
                raise ValueError(f"Unsupported user-supplied file type: {expected.path}")
        return IngestionBatch(
            nodes=list({node.id: node for node in nodes}.values()),
            relationships=list(
                {relationship.id: relationship for relationship in relationships}.values()
            ),
            raw_records_preserved=record_index,
        )
