"""Source manifest schema and rights/checksum enforcement."""

from datetime import datetime
from pathlib import Path

import yaml
from pydantic import AnyHttpUrl, Field, field_validator

from current_alchemy.domain.common.models import ApiModel, RightsStatus


class ExpectedFile(ApiModel):
    path: str = Field(min_length=1, max_length=500)
    sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    required: bool = True

    @field_validator("path")
    @classmethod
    def prevent_path_escape(cls, value: str) -> str:
        path = Path(value)
        if path.is_absolute() or ".." in path.parts:
            raise ValueError("expected file paths must be relative and may not escape")
        return value


class SourceManifest(ApiModel):
    source_id: str = Field(min_length=1, max_length=200)
    title: str
    authors_or_organization: list[str] = Field(min_length=1)
    publisher: str
    publication_or_release_year: int = Field(ge=1000, le=3000)
    source_url: AnyHttpUrl
    download_url: AnyHttpUrl | None = None
    source_type: str
    language: list[str] = Field(min_length=1)
    version: str
    license_name: str
    license_url: AnyHttpUrl | None = None
    rights_status: RightsStatus
    attribution_requirement: str
    intended_use_notes: str
    use_limitations: list[str]
    retrieved_at: datetime
    sha256_checksum: str = Field(pattern=r"^[a-f0-9]{64}$")
    adapter_name: str
    adapter_version: str
    expected_files: list[ExpectedFile]
    ingestion_scope: list[str] = Field(min_length=1)
    citation_template: str


def load_manifest(path: Path) -> SourceManifest:
    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    return SourceManifest.model_validate(raw)
