from hashlib import sha256
from pathlib import Path

import pytest
import yaml

from current_alchemy.domain.common.models import RightsStatus
from current_alchemy.ingestion.manifests.models import SourceManifest, load_manifest
from current_alchemy.ingestion.manifests.validation import (
    SourcePolicyError,
    enforce_rights,
    verify_expected_files,
)
from current_alchemy.ingestion.registry import get_adapter

SERVICE_ROOT = Path(__file__).resolve().parents[2]


def test_committed_source_manifests_are_structurally_valid() -> None:
    manifests = [
        load_manifest(path) for path in sorted((SERVICE_ROOT / "data" / "manifests").glob("*.yaml"))
    ]
    assert {manifest.rights_status for manifest in manifests} == {
        RightsStatus.APPROVED,
        RightsStatus.REVIEW_REQUIRED,
    }
    assert all(get_adapter(item.adapter_name, item.adapter_version) for item in manifests)


def test_synthetic_manifest_checksum_matches_fixture() -> None:
    manifest = load_manifest(SERVICE_ROOT / "data" / "manifests" / "synthetic-fixture.yaml")
    verify_expected_files(manifest, SERVICE_ROOT / "data" / "fixtures")


def test_checksum_mismatch_is_rejected(tmp_path: Path) -> None:
    source = tmp_path / "source.txt"
    source.write_text("different", encoding="utf-8")
    manifest = SourceManifest.model_validate(
        {
            "sourceId": "source:test",
            "title": "Test",
            "authorsOrOrganization": ["Test"],
            "publisher": "Test",
            "publicationOrReleaseYear": 2026,
            "sourceUrl": "https://example.test/source",
            "downloadUrl": None,
            "sourceType": "test",
            "language": ["en"],
            "version": "1",
            "licenseName": "Test",
            "licenseUrl": None,
            "rightsStatus": "approved",
            "attributionRequirement": "None",
            "intendedUseNotes": "Test",
            "useLimitations": [],
            "retrievedAt": "2026-01-01T00:00:00Z",
            "sha256Checksum": sha256(b"expected").hexdigest(),
            "adapterName": "user-supplied",
            "adapterVersion": "1",
            "expectedFiles": [
                {
                    "path": "source.txt",
                    "sha256": sha256(b"expected").hexdigest(),
                    "required": True,
                }
            ],
            "ingestionScope": ["test"],
            "citationTemplate": "Test",
        }
    )
    with pytest.raises(SourcePolicyError, match="Checksum mismatch"):
        verify_expected_files(manifest, tmp_path)


def test_rights_status_enforcement_blocks_unapproved_workflows() -> None:
    template = yaml.safe_load(
        (SERVICE_ROOT / "data" / "manifests" / "symmap-rights-review.yaml").read_text(
            encoding="utf-8"
        )
    )
    review_manifest = SourceManifest.model_validate(template)
    with pytest.raises(SourcePolicyError, match="review_required"):
        enforce_rights(
            review_manifest,
            environment="development",
            allow_review_required=False,
        )
    enforce_rights(
        review_manifest,
        environment="development",
        allow_review_required=True,
    )
    template["rightsStatus"] = "blocked"
    blocked = SourceManifest.model_validate(template)
    with pytest.raises(SourcePolicyError, match="blocked"):
        enforce_rights(
            blocked,
            environment="development",
            allow_review_required=True,
        )


def test_unknown_adapter_is_rejected() -> None:
    with pytest.raises(ValueError, match="Unknown source adapter"):
        get_adapter("unregistered", "1")
