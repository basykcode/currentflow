"""Repository-controlled source and release registry access."""

from pathlib import Path

from current_alchemy.ingestion.source_registry.models import (
    SourceRegistryEntry,
    SourceReleaseManifest,
    load_registry,
    load_release_manifest,
)


class SourceRegistryStore:
    def __init__(self, data_directory: Path) -> None:
        self._data_directory = data_directory

    def sources(self) -> dict[str, SourceRegistryEntry]:
        entries: dict[str, SourceRegistryEntry] = {}
        registry_root = self._data_directory / "source-registry"
        for path in sorted(registry_root.glob("*.yaml")):
            for source in load_registry(path).sources:
                if source.source_id in entries:
                    raise ValueError(f"duplicate source registry ID: {source.source_id}")
                entries[source.source_id] = source
        return entries

    def source(self, source_id: str) -> SourceRegistryEntry:
        try:
            return self.sources()[source_id]
        except KeyError as exc:
            raise ValueError(f"unknown source: {source_id}") from exc

    def releases(self) -> dict[tuple[str, str], SourceReleaseManifest]:
        releases: dict[tuple[str, str], SourceReleaseManifest] = {}
        release_root = self._data_directory / "manifests" / "releases"
        for path in sorted(release_root.glob("*.yaml")):
            release = load_release_manifest(path)
            key = (release.source_id, release.release_id)
            if key in releases:
                raise ValueError(
                    f"duplicate release manifest: {release.source_id}/{release.release_id}"
                )
            releases[key] = release
        return releases

    def release(self, source_id: str, release_id: str) -> SourceReleaseManifest:
        try:
            return self.releases()[(source_id, release_id)]
        except KeyError as exc:
            raise ValueError(f"unknown release: {source_id}/{release_id}") from exc

    def validate(self) -> dict[str, int]:
        sources = self.sources()
        releases = self.releases()
        missing_sources = sorted(source_id for source_id, _ in releases if source_id not in sources)
        if missing_sources:
            raise ValueError(
                "release manifests reference missing sources: " + ", ".join(missing_sources)
            )
        return {"sources": len(sources), "releases": len(releases)}
