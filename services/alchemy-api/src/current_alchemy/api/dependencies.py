"""FastAPI dependency accessors."""

from typing import cast

from fastapi import Request

from current_alchemy.application.ports.repository import AlchemyRepository
from current_alchemy.config import Settings


def get_repository(request: Request) -> AlchemyRepository:
    repository = getattr(request.app.state, "repository", None)
    if repository is None:
        raise RuntimeError("Alchemy repository is not initialized")
    return cast(AlchemyRepository, repository)


def get_runtime_settings(request: Request) -> Settings:
    settings = getattr(request.app.state, "settings", None)
    if not isinstance(settings, Settings):
        raise RuntimeError("Alchemy settings are not initialized")
    return settings
