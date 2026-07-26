"""One phased source-adapter protocol plus the legacy batch compatibility port."""

from pathlib import Path
from typing import Protocol

from current_alchemy.application.ports.repository import AlchemyRepository
from current_alchemy.ingestion.downloads import DownloadPlan, ReleaseDownloader
from current_alchemy.ingestion.lake import AlchemyDataPaths
from current_alchemy.ingestion.manifests.models import SourceManifest
from current_alchemy.ingestion.models import IngestionBatch, PipelineMode
from current_alchemy.ingestion.source_registry.models import (
    SourceRegistryEntry,
    SourceReleaseManifest,
)


class SourceAdapter(Protocol):
    """Compatibility port for the original manifest-driven batch adapters."""

    name: str
    version: str

    def parse(
        self, manifest: SourceManifest, input_directory: Path, *, batch_size: int
    ) -> IngestionBatch: ...


class ReleaseAdapter(Protocol):
    """Phased, resumable adapter used by the durable data-lake pipeline."""

    name: str
    version: str
    supported_source_versions: tuple[str, ...]
    input_files: tuple[str, ...]
    output_tables: tuple[str, ...]
    graph_entities: tuple[str, ...]
    mappings_produced: tuple[str, ...]
    claims_produced: tuple[str, ...]
    observations_produced: tuple[str, ...]
    known_limitations: tuple[str, ...]

    def discover_release(self, source: SourceRegistryEntry) -> str: ...

    def resolve_manifest(
        self,
        source: SourceRegistryEntry,
        manifest: SourceReleaseManifest,
    ) -> SourceReleaseManifest: ...

    def plan_acquisition(
        self,
        source: SourceRegistryEntry,
        manifest: SourceReleaseManifest,
        downloader: ReleaseDownloader,
    ) -> DownloadPlan: ...

    async def acquire(
        self,
        source: SourceRegistryEntry,
        manifest: SourceReleaseManifest,
        downloader: ReleaseDownloader,
    ) -> SourceReleaseManifest: ...

    def verify(
        self,
        manifest: SourceReleaseManifest,
        downloader: ReleaseDownloader,
    ) -> dict[str, str | int]: ...

    def extract(
        self,
        manifest: SourceReleaseManifest,
        paths: AlchemyDataPaths,
    ) -> dict[str, int | str]: ...

    def inspect_schema(
        self,
        manifest: SourceReleaseManifest,
        paths: AlchemyDataPaths,
    ) -> dict[str, int | str | list[str]]: ...

    def stage(
        self,
        source: SourceRegistryEntry,
        manifest: SourceReleaseManifest,
        paths: AlchemyDataPaths,
        *,
        mode: PipelineMode,
        subset_limit: int,
        import_run_id: str,
    ) -> dict[str, int | str | list[str]]: ...

    def normalize(
        self,
        source: SourceRegistryEntry,
        manifest: SourceReleaseManifest,
        paths: AlchemyDataPaths,
        *,
        import_run_id: str,
    ) -> dict[str, int | str | list[str]]: ...

    def propose_mappings(
        self,
        source: SourceRegistryEntry,
        manifest: SourceReleaseManifest,
        paths: AlchemyDataPaths,
        *,
        import_run_id: str,
        production_eligible: bool,
    ) -> IngestionBatch: ...

    async def load_graph(
        self,
        repository: AlchemyRepository,
        batch: IngestionBatch,
        *,
        batch_size: int,
    ) -> dict[str, int]: ...

    def audit(
        self,
        manifest: SourceReleaseManifest,
        paths: AlchemyDataPaths,
    ) -> dict[str, int | str | list[str] | bool]: ...

    def report(
        self,
        source: SourceRegistryEntry,
        manifest: SourceReleaseManifest,
        paths: AlchemyDataPaths,
        phase_results: dict[str, dict[str, object]],
    ) -> dict[str, str | int]: ...
