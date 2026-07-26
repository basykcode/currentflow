"""Machine-readable source registry and immutable release-manifest models."""

from datetime import date, datetime
from enum import StrEnum
from pathlib import Path

import yaml
from pydantic import AnyHttpUrl, Field, field_validator, model_validator

from current_alchemy.domain.common.models import ApiModel


class CommercialUse(StrEnum):
    ALLOWED = "allowed"
    PROHIBITED = "prohibited"
    UNCLEAR = "unclear"


class Redistribution(StrEnum):
    ALLOWED = "allowed"
    PROHIBITED = "prohibited"
    UNCLEAR = "unclear"


class DerivativeDatabase(StrEnum):
    ALLOWED = "allowed"
    SHARE_ALIKE = "share_alike"
    PROHIBITED = "prohibited"
    UNCLEAR = "unclear"


class AiUse(StrEnum):
    ALLOWED = "allowed"
    PROHIBITED = "prohibited"
    UNCLEAR = "unclear"


class ProductionStatus(StrEnum):
    APPROVED = "approved"
    APPROVED_WITH_CONDITIONS = "approved_with_conditions"
    PERMISSION_PENDING = "permission_pending"
    INTERNAL_RESEARCH_ONLY = "internal_research_only"
    BLOCKED = "blocked"


class AcquisitionMode(StrEnum):
    AUTOMATIC = "automatic"
    MANUAL = "manual"
    API_SNAPSHOT = "api_snapshot"
    PERMISSION_REQUIRED = "permission_required"
    METADATA_ONLY = "metadata_only"
    BLOCKED = "blocked"


class SourceDataStatus(StrEnum):
    AUTHORITATIVE_RELEASE_VERIFIED = "authoritative_release_verified"
    RELEASE_VERIFICATION_REQUIRED = "release_verification_required"
    MIXED_UPSTREAM_RIGHTS = "mixed_upstream_rights"
    METADATA_ONLY = "metadata_only"
    PERMISSION_PENDING = "permission_pending"
    BLOCKED = "blocked"


class RightsProjection(StrEnum):
    INTERNAL_RESEARCH = "internal_research"
    PRODUCTION_APPROVED = "production_approved"
    SHARE_ALIKE = "share_alike"
    PERMISSION_PENDING = "permission_pending"
    BLOCKED = "blocked"


class AcquisitionMethod(StrEnum):
    HTTP_DOWNLOAD = "http_download"
    API_SNAPSHOT = "api_snapshot"
    MANUAL_DOWNLOAD = "manual_download"
    USER_SUPPLIED = "user_supplied"
    SYNTHETIC_FIXTURE = "synthetic_fixture"


class ArtifactFormat(StrEnum):
    OBO = "obo"
    OWL = "owl"
    JSON = "json"
    JSONL = "jsonl"
    CSV = "csv"
    TSV = "tsv"
    ZIP = "zip"
    TAR_GZ = "tar_gz"
    NONE = "none"


class SourceRights(ApiModel):
    license_name: str = Field(min_length=1)
    license_url: AnyHttpUrl | None
    attribution_requirements: list[str]
    commercial_use: CommercialUse
    redistribution: Redistribution
    derivative_database: DerivativeDatabase
    ai_use: AiUse


class SourceRegistryEntry(ApiModel):
    source_id: str = Field(pattern=r"^(?:source|demo:source):[a-z0-9][a-z0-9:._-]*$")
    title: str = Field(min_length=1)
    acronym: str | None
    responsible_organization: str = Field(min_length=1)
    description: str = Field(min_length=1)
    official_homepage: AnyHttpUrl
    official_download_page: AnyHttpUrl | None
    source_type: str = Field(min_length=1)
    languages: list[str] = Field(min_length=1)
    update_cadence: str
    expected_scale: str
    canonical_identifiers_supplied: list[str]
    known_upstream_sources: list[str]
    rights: SourceRights
    source_data_status: SourceDataStatus
    production_status: ProductionStatus
    acquisition_mode: AcquisitionMode
    adapter_name: str
    adapter_version: str
    citation_template: str
    intended_uses: list[str]
    use_limitations: list[str]
    safety_notes: list[str]
    contact_information: str | None
    last_license_review_date: date
    license_review_notes: str
    useful_field_inventory: list[str] = Field(default_factory=list)
    desired_graph_mapping: list[str] = Field(default_factory=list)
    permission_request_checklist: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def blocked_sources_have_no_acquisition_path(self) -> "SourceRegistryEntry":
        if self.production_status is ProductionStatus.BLOCKED:
            if self.acquisition_mode is not AcquisitionMode.BLOCKED:
                raise ValueError("blocked sources must use blocked acquisition mode")
            if self.official_download_page is not None:
                raise ValueError("blocked sources must not declare a download page")
        return self


class RegistryDocument(ApiModel):
    sources: list[SourceRegistryEntry] = Field(min_length=1)

    @model_validator(mode="after")
    def source_ids_are_unique(self) -> "RegistryDocument":
        ids = [source.source_id for source in self.sources]
        if len(ids) != len(set(ids)):
            raise ValueError("source registry contains duplicate sourceId values")
        return self


class ReleaseArtifact(ApiModel):
    filename: str = Field(min_length=1, max_length=500)
    download_url: AnyHttpUrl | None
    expected_size: int | None = Field(default=None, ge=0)
    observed_size: int | None = Field(default=None, ge=0)
    sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    etag: str | None = None
    last_modified: str | None = None
    archive_format: ArtifactFormat
    expected_extracted_files: list[str] = Field(default_factory=list)

    @field_validator("filename")
    @classmethod
    def filename_cannot_escape(cls, value: str) -> str:
        path = Path(value)
        if path.is_absolute() or ".." in path.parts or len(path.parts) != 1:
            raise ValueError("release artifact filename must be a single relative filename")
        return value


class ReleaseRightsSnapshot(SourceRights):
    reviewed_at: date
    review_notes: str


class SourceReleaseManifest(ApiModel):
    manifest_version: str = "1"
    source_id: str
    release_id: str = Field(pattern=r"^[a-zA-Z0-9][a-zA-Z0-9._-]*$")
    source_version: str
    release_date: date
    retrieved_at: datetime | None
    official_source_url: AnyHttpUrl
    official_download_url: AnyHttpUrl | None
    acquisition_method: AcquisitionMethod
    artifacts: list[ReleaseArtifact] = Field(min_length=1)
    adapter_name: str
    adapter_version: str
    schema_version: str
    normalization_version: str
    mapping_version: str
    license_snapshot: ReleaseRightsSnapshot
    citation_template: str
    original_release_notes: AnyHttpUrl | None
    import_eligibility: RightsProjection
    checksum_verified: bool = False
    import_audit_passed: bool = False
    manual_acquisition_instructions: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def manual_modes_include_instructions(self) -> "SourceReleaseManifest":
        if (
            self.acquisition_method is AcquisitionMethod.MANUAL_DOWNLOAD
            and not self.manual_acquisition_instructions
        ):
            raise ValueError("manual releases require manual acquisition instructions")
        return self


def load_registry(path: Path) -> RegistryDocument:
    """Load one source-registry YAML document."""

    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    return RegistryDocument.model_validate(raw)


def load_release_manifest(path: Path) -> SourceReleaseManifest:
    """Load one immutable source-release manifest."""

    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    return SourceReleaseManifest.model_validate(raw)
