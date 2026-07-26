"""Immutable local data-lake paths and an object-storage-compatible port."""

import os
from hashlib import sha256
from pathlib import Path
from typing import BinaryIO, Protocol
from urllib.parse import quote


class ImmutableArtifactError(RuntimeError):
    """An immutable object already exists with different content."""


class ObjectStore(Protocol):
    def exists(self, key: str) -> bool: ...

    def path_for(self, key: str) -> Path: ...

    def open_read(self, key: str) -> BinaryIO: ...

    def put_file_immutable(self, key: str, source: Path) -> Path: ...


class LocalObjectStore:
    """Filesystem object store with path confinement and immutable final objects."""

    def __init__(self, root: Path) -> None:
        self.root = root.resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def path_for(self, key: str) -> Path:
        relative = Path(key)
        if relative.is_absolute() or ".." in relative.parts:
            raise ValueError("object keys must be relative and may not escape the store")
        target = (self.root / relative).resolve()
        try:
            target.relative_to(self.root)
        except ValueError as exc:
            raise ValueError("object key escapes the store") from exc
        return target

    def exists(self, key: str) -> bool:
        return self.path_for(key).is_file()

    def open_read(self, key: str) -> BinaryIO:
        return self.path_for(key).open("rb")

    @staticmethod
    def _hash(path: Path) -> str:
        digest = sha256()
        with path.open("rb") as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                digest.update(chunk)
        return digest.hexdigest()

    def put_file_immutable(self, key: str, source: Path) -> Path:
        target = self.path_for(key)
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists():
            if self._hash(target) == self._hash(source):
                return target
            raise ImmutableArtifactError(f"immutable artifact already exists: {key}")
        temporary = target.with_name(f".{target.name}.object-part")
        with source.open("rb") as input_stream, temporary.open("xb") as output_stream:
            for chunk in iter(lambda: input_stream.read(1024 * 1024), b""):
                output_stream.write(chunk)
            output_stream.flush()
            os.fsync(output_stream.fileno())
        os.replace(temporary, target)
        return target


class AlchemyDataPaths:
    """Validated paths for one configurable Alchemy data root."""

    def __init__(self, root: Path) -> None:
        self.root = root.resolve()

    def ensure(self) -> None:
        for directory in (
            "raw",
            "extracted",
            "staging",
            "normalized",
            "graph-export",
            "cache",
            "reports",
            "logs",
        ):
            (self.root / directory).mkdir(parents=True, exist_ok=True)

    def release_root(self, area: str, source_id: str, release_id: str) -> Path:
        if area not in {
            "raw",
            "extracted",
            "staging",
            "normalized",
            "graph-export",
            "reports",
            "logs",
        }:
            raise ValueError(f"unsupported data-lake area: {area}")
        for value in (source_id, release_id):
            if (
                not value
                or Path(value).is_absolute()
                or ".." in Path(value).parts
                or "/" in value
                or "\\" in value
            ):
                raise ValueError("source and release IDs must be safe relative path segments")
        source_segment = quote(source_id, safe="-._")
        release_segment = quote(release_id, safe="-._")
        path = (self.root / area / source_segment / release_segment).resolve()
        try:
            path.relative_to(self.root)
        except ValueError as exc:
            raise ValueError("release path escapes data root") from exc
        return path

    def raw_original(self, source_id: str, release_id: str) -> Path:
        return self.release_root("raw", source_id, release_id) / "original"

    def staging_database(self, source_id: str, release_id: str) -> Path:
        return self.release_root("staging", source_id, release_id) / "source.duckdb"

    def staging_parquet(self, source_id: str, release_id: str) -> Path:
        return self.release_root("staging", source_id, release_id) / "parquet"

    def normalized_parquet(self, source_id: str, release_id: str) -> Path:
        return self.release_root("normalized", source_id, release_id) / "parquet"

    def checkpoint(self, source_id: str, release_id: str) -> Path:
        return self.release_root("logs", source_id, release_id) / "checkpoint.json"
