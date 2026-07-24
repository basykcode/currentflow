"""Rights-aware ingestion orchestration."""

from pathlib import Path

from current_alchemy.application.ports.repository import AlchemyRepository
from current_alchemy.ingestion.manifests.models import SourceManifest, load_manifest
from current_alchemy.ingestion.manifests.validation import enforce_rights, verify_expected_files
from current_alchemy.ingestion.registry import get_adapter


class IngestionService:
    def __init__(self, repository: AlchemyRepository) -> None:
        self._repository = repository

    def validate(
        self,
        manifest_path: Path,
        input_directory: Path,
        *,
        environment: str,
        allow_review_required: bool,
    ) -> SourceManifest:
        manifest = load_manifest(manifest_path)
        enforce_rights(
            manifest,
            environment=environment,
            allow_review_required=allow_review_required,
        )
        get_adapter(manifest.adapter_name, manifest.adapter_version)
        verify_expected_files(manifest, input_directory)
        return manifest

    async def ingest(
        self,
        manifest_path: Path,
        input_directory: Path,
        *,
        environment: str,
        allow_review_required: bool,
        dry_run: bool,
        batch_size: int,
    ) -> dict[str, int | list[str] | bool]:
        manifest = self.validate(
            manifest_path,
            input_directory,
            environment=environment,
            allow_review_required=allow_review_required,
        )
        adapter = get_adapter(manifest.adapter_name, manifest.adapter_version)
        batch = adapter.parse(manifest, input_directory, batch_size=batch_size)
        counts: dict[str, int] = {
            "nodes": len({node.id for node in batch.nodes}),
            "relationships": len({relationship.id for relationship in batch.relationships}),
        }
        if not dry_run:
            counts = await self._repository.ingest_batch(batch, batch_size)
        return {
            **counts,
            "rawRecordsPreserved": batch.raw_records_preserved,
            "unresolvedFields": batch.unresolved_fields,
            "dryRun": dry_run,
        }
