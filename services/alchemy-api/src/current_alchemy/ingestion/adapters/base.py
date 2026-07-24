"""Source adapter protocol."""

from pathlib import Path
from typing import Protocol

from current_alchemy.ingestion.manifests.models import SourceManifest
from current_alchemy.ingestion.models import IngestionBatch


class SourceAdapter(Protocol):
    name: str
    version: str

    def parse(
        self, manifest: SourceManifest, input_directory: Path, *, batch_size: int
    ) -> IngestionBatch: ...
