"""Rights-gated, checksum-pinned HTTP acquisition for immutable releases."""

import asyncio
import json
import os
from dataclasses import dataclass
from datetime import UTC, datetime
from hashlib import sha256
from pathlib import Path

import httpx

from current_alchemy.ingestion.lake import AlchemyDataPaths
from current_alchemy.ingestion.source_registry.models import (
    AcquisitionMethod,
    AcquisitionMode,
    ReleaseArtifact,
    SourceRegistryEntry,
    SourceReleaseManifest,
)


class AcquisitionError(RuntimeError):
    """An acquisition is unsafe, unavailable, or fails integrity checks."""


@dataclass(frozen=True, slots=True)
class DownloadPlan:
    source_id: str
    release_id: str
    acquisition_method: str
    files: tuple[str, ...]
    expected_bytes: int
    automatic: bool
    reasons: tuple[str, ...]


def file_sha256(path: Path) -> str:
    digest = sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


class ReleaseDownloader:
    """Download official release artifacts without scraping or accepting terms."""

    def __init__(
        self,
        *,
        data_paths: AlchemyDataPaths,
        user_agent: str,
        max_automatic_bytes: int,
        timeout_seconds: float,
        retry_count: int = 3,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._paths = data_paths
        self._user_agent = user_agent
        self._max_automatic_bytes = max_automatic_bytes
        self._timeout_seconds = timeout_seconds
        self._retry_count = retry_count
        self._transport = transport

    def local_artifact_path(self, release: SourceReleaseManifest, filename: str) -> Path:
        """Return the immutable local path for one declared release artifact."""

        if filename not in {artifact.filename for artifact in release.artifacts}:
            raise AcquisitionError(f"{filename} is not declared by {release.release_id}")
        return self._paths.raw_original(release.source_id, release.release_id) / filename

    def plan(
        self,
        source: SourceRegistryEntry,
        release: SourceReleaseManifest,
        *,
        additional_local_artifacts: frozenset[str] = frozenset(),
    ) -> DownloadPlan:
        reasons: list[str] = []
        expected = sum(artifact.expected_size or 0 for artifact in release.artifacts)
        automatic = True
        if source.acquisition_mode is not AcquisitionMode.AUTOMATIC:
            automatic = False
            reasons.append(f"source acquisition mode is {source.acquisition_mode.value}")
        if release.acquisition_method is not AcquisitionMethod.HTTP_DOWNLOAD:
            automatic = False
            reasons.append(f"release acquisition method is {release.acquisition_method.value}")
        original = self._paths.raw_original(release.source_id, release.release_id)
        missing_urls = [
            artifact.filename
            for artifact in release.artifacts
            if artifact.download_url is None
            and artifact.filename not in additional_local_artifacts
            and not (original / artifact.filename).exists()
        ]
        if missing_urls:
            automatic = False
            reasons.append(
                "artifacts have neither a machine download URL nor a verified local copy: "
                + ", ".join(missing_urls)
            )
        if expected > self._max_automatic_bytes:
            automatic = False
            reasons.append(
                f"expected size {expected} exceeds automatic limit {self._max_automatic_bytes}"
            )
        return DownloadPlan(
            source_id=source.source_id,
            release_id=release.release_id,
            acquisition_method=release.acquisition_method.value,
            files=tuple(artifact.filename for artifact in release.artifacts),
            expected_bytes=expected,
            automatic=automatic,
            reasons=tuple(reasons),
        )

    async def fetch(
        self, source: SourceRegistryEntry, release: SourceReleaseManifest
    ) -> SourceReleaseManifest:
        plan = self.plan(source, release)
        if not plan.automatic:
            raise AcquisitionError("; ".join(plan.reasons))

        raw_root = self._paths.release_root("raw", source.source_id, release.release_id)
        original = raw_root / "original"
        original.mkdir(parents=True, exist_ok=True)
        resolved_path = raw_root / "manifest.resolved.json"
        if resolved_path.exists():
            existing = SourceReleaseManifest.model_validate_json(
                resolved_path.read_text(encoding="utf-8")
            )
            self.verify(existing)
            return existing
        resolved_artifacts: list[ReleaseArtifact] = []
        for artifact in release.artifacts:
            resolved_artifacts.append(await self._fetch_artifact(artifact, original))

        resolved = release.model_copy(
            update={
                "retrieved_at": datetime.now(UTC),
                "artifacts": resolved_artifacts,
                "checksum_verified": True,
            }
        )
        raw_root.mkdir(parents=True, exist_ok=True)
        rendered = resolved.model_dump_json(by_alias=True, indent=2)
        temporary = resolved_path.with_suffix(".json.part")
        temporary.write_text(f"{rendered}\n", encoding="utf-8")
        os.replace(temporary, resolved_path)
        checksums = "".join(
            f"{artifact.sha256}  original/{artifact.filename}\n" for artifact in resolved_artifacts
        )
        checksum_path = raw_root / "checksums.sha256"
        if checksum_path.exists() and checksum_path.read_text(encoding="utf-8") != checksums:
            raise AcquisitionError("checksum inventory would change an immutable release")
        if not checksum_path.exists():
            checksum_path.write_text(checksums, encoding="utf-8")
        return resolved

    async def _fetch_artifact(self, artifact: ReleaseArtifact, original: Path) -> ReleaseArtifact:
        target = original / artifact.filename
        if target.exists():
            self._verify_artifact(artifact, target)
            return artifact.model_copy(update={"observed_size": target.stat().st_size})
        if artifact.download_url is None:
            raise AcquisitionError(f"{artifact.filename} has no download URL")

        partial = target.with_name(f"{target.name}.part")
        headers = {"User-Agent": self._user_agent}
        start = partial.stat().st_size if partial.exists() else 0
        if start:
            headers["Range"] = f"bytes={start}-"

        for attempt in range(self._retry_count):
            try:
                async with httpx.AsyncClient(
                    follow_redirects=True,
                    timeout=httpx.Timeout(self._timeout_seconds),
                    headers=headers,
                    transport=self._transport,
                ) as client:
                    async with client.stream("GET", str(artifact.download_url)) as response:
                        response.raise_for_status()
                        content_type = response.headers.get("content-type", "").lower()
                        if "text/html" in content_type:
                            raise AcquisitionError(
                                f"{artifact.filename} unexpectedly returned HTML"
                            )
                        content_length = int(response.headers.get("content-length", "0") or 0)
                        total = content_length + (start if response.status_code == 206 else 0)
                        if total and total > self._max_automatic_bytes:
                            raise AcquisitionError(
                                f"{artifact.filename} exceeds the automatic download limit"
                            )
                        append = response.status_code == 206 and start > 0
                        if not append:
                            start = 0
                        mode = "ab" if append else "wb"
                        with partial.open(mode) as stream:
                            async for chunk in response.aiter_bytes(1024 * 1024):
                                stream.write(chunk)
                                if stream.tell() > self._max_automatic_bytes:
                                    raise AcquisitionError(
                                        f"{artifact.filename} exceeds the automatic download limit"
                                    )
                            stream.flush()
                            os.fsync(stream.fileno())
                        self._verify_artifact(artifact, partial)
                        os.replace(partial, target)
                        return artifact.model_copy(
                            update={
                                "observed_size": target.stat().st_size,
                                "etag": response.headers.get("etag"),
                                "last_modified": response.headers.get("last-modified"),
                            }
                        )
            except (httpx.HTTPError, OSError) as exc:
                if attempt + 1 == self._retry_count:
                    raise AcquisitionError(
                        f"failed to download {artifact.filename}: {exc}"
                    ) from exc
                await asyncio.sleep(0.25 * (2**attempt))
        raise AcquisitionError(f"failed to download {artifact.filename}")

    @staticmethod
    def _verify_artifact(artifact: ReleaseArtifact, path: Path) -> None:
        observed_size = path.stat().st_size
        if artifact.expected_size is not None and observed_size != artifact.expected_size:
            raise AcquisitionError(
                f"size mismatch for {artifact.filename}: expected "
                f"{artifact.expected_size}, got {observed_size}"
            )
        actual = file_sha256(path)
        if actual != artifact.sha256:
            raise AcquisitionError(
                f"checksum mismatch for {artifact.filename}: "
                f"expected {artifact.sha256}, got {actual}"
            )

    def verify(self, release: SourceReleaseManifest) -> dict[str, str | int]:
        original = self._paths.raw_original(release.source_id, release.release_id)
        total = 0
        for artifact in release.artifacts:
            path = original / artifact.filename
            if not path.exists():
                raise AcquisitionError(f"required artifact is missing: {artifact.filename}")
            self._verify_artifact(artifact, path)
            total += path.stat().st_size
        return {
            "sourceId": release.source_id,
            "releaseId": release.release_id,
            "verifiedFiles": len(release.artifacts),
            "verifiedBytes": total,
        }

    def write_manual_instructions(
        self,
        source: SourceRegistryEntry,
        release: SourceReleaseManifest,
        destination: Path,
    ) -> None:
        plan = self.plan(source, release)
        payload = {
            "sourceId": source.source_id,
            "releaseId": release.release_id,
            "officialPage": str(source.official_download_page or source.official_homepage),
            "files": [
                {
                    "filename": item.filename,
                    "expectedSize": item.expected_size,
                    "sha256": item.sha256,
                    "destination": str(
                        self._paths.raw_original(source.source_id, release.release_id)
                        / item.filename
                    ),
                }
                for item in release.artifacts
            ],
            "automatic": plan.automatic,
            "reasons": list(plan.reasons),
            "instructions": release.manual_acquisition_instructions,
        }
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(
            f"{json.dumps(payload, indent=2, sort_keys=True)}\n",
            encoding="utf-8",
        )
