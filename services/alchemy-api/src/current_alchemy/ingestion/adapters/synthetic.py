"""Strict synthetic fixture adapter."""

import json
from pathlib import Path

from current_alchemy.domain.common.models import ReviewStatus
from current_alchemy.ingestion.manifests.models import SourceManifest
from current_alchemy.ingestion.models import IngestionBatch


class SyntheticFixtureAdapter:
    name = "synthetic-fixture"
    version = "1"

    def parse(
        self, manifest: SourceManifest, input_directory: Path, *, batch_size: int
    ) -> IngestionBatch:
        del batch_size
        expected = manifest.expected_files[0]
        payload = json.loads((input_directory / expected.path).read_text(encoding="utf-8"))
        batch = IngestionBatch.model_validate(payload)
        for node in batch.nodes:
            if not node.id.startswith("demo:"):
                raise ValueError("Every synthetic node ID must begin with 'demo:'")
            status = node.properties.get("review_status")
            if status != ReviewStatus.SYNTHETIC_FIXTURE.value:
                raise ValueError("Every synthetic node must be marked synthetic_fixture")
        for relationship in batch.relationships:
            if not relationship.id.startswith("demo:"):
                raise ValueError("Every synthetic relationship ID must begin with 'demo:'")
        return batch
