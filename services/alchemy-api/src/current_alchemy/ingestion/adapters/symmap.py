"""Rights-gated SymMap placeholder."""

from pathlib import Path

from current_alchemy.ingestion.manifests.models import SourceManifest
from current_alchemy.ingestion.models import IngestionBatch


class SymMapPlaceholderAdapter:
    name = "symmap-placeholder"
    version = "1"

    def parse(
        self, manifest: SourceManifest, input_directory: Path, *, batch_size: int
    ) -> IngestionBatch:
        del manifest, input_directory, batch_size
        raise ValueError(
            "SymMap ingestion is disabled pending completed commercial-reuse rights review."
        )
