"""Manifest validation, source policy, and local artifact integrity."""

from hashlib import sha256
from pathlib import Path

from current_alchemy.domain.common.models import RightsStatus
from current_alchemy.ingestion.manifests.models import SourceManifest


class SourcePolicyError(ValueError):
    """Source rights or integrity does not permit ingestion."""


def enforce_rights(
    manifest: SourceManifest,
    *,
    environment: str,
    allow_review_required: bool,
) -> None:
    if manifest.rights_status is RightsStatus.BLOCKED:
        raise SourcePolicyError(f"Source '{manifest.source_id}' is blocked")
    if manifest.rights_status is RightsStatus.REVIEW_REQUIRED and not (
        environment == "development" and allow_review_required
    ):
        raise SourcePolicyError(
            "review_required sources need --allow-review-required in development"
        )


def file_sha256(path: Path) -> str:
    digest = sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def verify_expected_files(manifest: SourceManifest, input_directory: Path) -> None:
    if not manifest.expected_files:
        empty_digest = sha256(b"").hexdigest()
        if manifest.sha256_checksum != empty_digest:
            raise SourcePolicyError(
                "A manifest with no expected files must use the empty-payload SHA-256"
            )
        return
    for expected in manifest.expected_files:
        path = (input_directory / expected.path).resolve()
        try:
            path.relative_to(input_directory.resolve())
        except ValueError as exc:
            raise SourcePolicyError(
                f"Expected file escapes input directory: {expected.path}"
            ) from exc
        if not path.exists():
            if expected.required:
                raise SourcePolicyError(f"Required source file is missing: {expected.path}")
            continue
        actual = file_sha256(path)
        if actual != expected.sha256:
            raise SourcePolicyError(
                f"Checksum mismatch for {expected.path}: expected {expected.sha256}, got {actual}"
            )
    if len(manifest.expected_files) == 1:
        expected = manifest.expected_files[0]
        if manifest.sha256_checksum != expected.sha256:
            raise SourcePolicyError(
                "Manifest payload checksum does not match its single expected file"
            )
