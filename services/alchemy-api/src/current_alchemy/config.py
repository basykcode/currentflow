"""Validated, environment-driven service configuration."""

from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr, field_validator, model_validator
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
    alchemy_allowed_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173"],
        validation_alias="ALCHEMY_ALLOWED_ORIGINS",
    )
    neo4j_uri: str = Field(min_length=1, validation_alias="NEO4J_URI")
    neo4j_username: str = Field(min_length=1, validation_alias="NEO4J_USERNAME")
    neo4j_password: SecretStr = Field(validation_alias="NEO4J_PASSWORD")
    neo4j_database: str = Field(default="neo4j", min_length=1, validation_alias="NEO4J_DATABASE")
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
        return self


@lru_cache
def get_settings() -> Settings:
    """Load and memoize process settings."""

    return Settings()
