"""Validated, environment-driven service configuration."""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import AliasChoices, Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings loaded only from local environment or an explicit object."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    alchemy_env: Literal["development", "test", "production"] = Field(
        default="development", validation_alias="ALCHEMY_ENV"
    )
    alchemy_api_host: str = Field(default="0.0.0.0", validation_alias="ALCHEMY_API_HOST")
    alchemy_api_port: int = Field(default=8000, ge=1, le=65535, validation_alias="ALCHEMY_API_PORT")
    alchemy_log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO", validation_alias="ALCHEMY_LOG_LEVEL"
    )
    alchemy_git_sha: str = Field(default="unavailable", validation_alias="RENDER_GIT_COMMIT")
    alchemy_instance_id: str = Field(default="local", validation_alias="RENDER_INSTANCE_ID")
    web_concurrency: int = Field(default=1, ge=1, le=16, validation_alias="WEB_CONCURRENCY")
    alchemy_allowed_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173"],
        validation_alias="ALCHEMY_ALLOWED_ORIGINS",
    )
    neo4j_uri: str = Field(min_length=1, validation_alias="NEO4J_URI")
    neo4j_username: str = Field(min_length=1, validation_alias="NEO4J_USERNAME")
    neo4j_password: SecretStr = Field(validation_alias="NEO4J_PASSWORD")
    neo4j_database: str = Field(default="neo4j", min_length=1, validation_alias="NEO4J_DATABASE")
    alchemy_origin_token: SecretStr | None = Field(
        default=None,
        validation_alias=AliasChoices("CURRENT_EDGE_ORIGIN_TOKEN", "ALCHEMY_ORIGIN_TOKEN"),
    )
    alchemy_secondary_origin_token: SecretStr | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "CURRENT_EDGE_ORIGIN_TOKEN_SECONDARY",
            "ALCHEMY_ORIGIN_TOKEN_SECONDARY",
        ),
    )
    alchemy_require_edge_origin_token: bool = Field(
        default=False,
        validation_alias="ALCHEMY_REQUIRE_EDGE_ORIGIN_TOKEN",
    )
    pubchem_user_agent: str = Field(min_length=8, validation_alias="PUBCHEM_USER_AGENT")
    external_request_timeout_seconds: float = Field(
        default=20.0,
        gt=0,
        le=120,
        validation_alias="EXTERNAL_REQUEST_TIMEOUT_SECONDS",
    )
    external_request_min_interval_ms: int = Field(
        default=250,
        ge=200,
        validation_alias="EXTERNAL_REQUEST_MIN_INTERVAL_MS",
    )
    alchemy_max_request_body_bytes: int = Field(
        default=1_048_576,
        ge=1_024,
        le=10 * 1024 * 1024,
        validation_alias="ALCHEMY_MAX_REQUEST_BODY_BYTES",
    )
    alchemy_request_timeout_seconds: float = Field(
        default=30.0,
        gt=0,
        le=120,
        validation_alias="ALCHEMY_REQUEST_TIMEOUT_SECONDS",
    )
    neo4j_max_connection_pool_size: int = Field(
        default=20,
        ge=1,
        le=200,
        validation_alias="NEO4J_MAX_CONNECTION_POOL_SIZE",
    )
    neo4j_connection_acquisition_timeout_seconds: float = Field(
        default=5.0,
        gt=0,
        le=120,
        validation_alias="NEO4J_CONNECTION_ACQUISITION_TIMEOUT_SECONDS",
    )
    neo4j_connection_timeout_seconds: float = Field(
        default=10.0,
        gt=0,
        le=60,
        validation_alias="NEO4J_CONNECTION_TIMEOUT_SECONDS",
    )
    neo4j_max_connection_lifetime_seconds: float = Field(
        default=1800.0,
        gt=0,
        le=86_400,
        validation_alias="NEO4J_MAX_CONNECTION_LIFETIME_SECONDS",
    )
    neo4j_liveness_check_timeout_seconds: float = Field(
        default=30.0,
        ge=0,
        le=3600,
        validation_alias="NEO4J_LIVENESS_CHECK_TIMEOUT_SECONDS",
    )
    neo4j_max_transaction_retry_time_seconds: float = Field(
        default=15.0,
        ge=0,
        le=120,
        validation_alias="NEO4J_MAX_TRANSACTION_RETRY_TIME_SECONDS",
    )
    neo4j_query_timeout_seconds: float = Field(
        default=15.0,
        gt=0,
        le=120,
        validation_alias="NEO4J_QUERY_TIMEOUT_SECONDS",
    )
    alchemy_data_root: Path = Field(
        default=Path("var/alchemy-data"),
        validation_alias="ALCHEMY_DATA_ROOT",
    )
    alchemy_max_autodownload_bytes: int = Field(
        default=2 * 1024 * 1024 * 1024,
        ge=1,
        validation_alias="ALCHEMY_MAX_AUTODOWNLOAD_BYTES",
    )
    alchemy_download_user_agent: str = Field(
        default="CurrentAlchemy-DataEngineering/0.2 (https://current-flow.net)",
        min_length=12,
        validation_alias="ALCHEMY_DOWNLOAD_USER_AGENT",
    )
    max_page_size: int = 100
    max_explore_results: int = 100

    @field_validator("alchemy_allowed_origins")
    @classmethod
    def validate_origins(cls, origins: list[str]) -> list[str]:
        normalized = [origin.rstrip("/") for origin in origins]
        if any(not origin.startswith(("http://", "https://")) for origin in normalized):
            raise ValueError("CORS origins must use http:// or https://")
        return normalized

    @model_validator(mode="after")
    def forbid_production_wildcard(self) -> "Settings":
        if self.alchemy_env == "production" and "*" in self.alchemy_allowed_origins:
            raise ValueError("Wildcard CORS is forbidden in production")
        if not self.neo4j_password.get_secret_value():
            raise ValueError("NEO4J_PASSWORD must not be empty")
        origin_token = (
            self.alchemy_origin_token.get_secret_value()
            if self.alchemy_origin_token is not None
            else ""
        )
        if self.alchemy_require_edge_origin_token and not origin_token:
            raise ValueError(
                "CURRENT_EDGE_ORIGIN_TOKEN or ALCHEMY_ORIGIN_TOKEN is required when edge "
                "origin enforcement is enabled"
            )
        if (
            self.alchemy_secondary_origin_token is not None
            and not self.alchemy_secondary_origin_token.get_secret_value()
        ):
            raise ValueError("The secondary edge origin token must not be empty")
        return self


@lru_cache
def get_settings() -> Settings:
    """Load and memoize process settings."""

    return Settings()
