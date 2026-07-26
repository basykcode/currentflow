"""Alchemy administration CLI."""

import asyncio
import json
import subprocess
import sys
from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import TypeVar

import typer
from neo4j import AsyncGraphDatabase
from pydantic import ValidationError

from current_alchemy.app import create_app
from current_alchemy.application.ports.repository import AlchemyRepository
from current_alchemy.application.services.ingestion import IngestionService
from current_alchemy.cli.data_platform import (
    downloads_app,
    graph_app,
    ingest_release,
    reports_app,
    sources_app,
)
from current_alchemy.config import Settings, get_settings
from current_alchemy.infrastructure.external.pubchem import PubChemClient
from current_alchemy.infrastructure.memory_repository import MemoryAlchemyRepository
from current_alchemy.infrastructure.neo4j.migrations import applied_migrations, migrate
from current_alchemy.infrastructure.neo4j.repository import Neo4jAlchemyRepository
from current_alchemy.ingestion.manifests.models import load_manifest
from current_alchemy.ingestion.manifests.validation import (
    enforce_rights,
    verify_expected_files,
)
from current_alchemy.ingestion.registry import get_adapter

app = typer.Typer(help="Current Alchemy administration")
db_app = typer.Typer(help="Neo4j lifecycle commands")
data_app = typer.Typer(help="Source validation and ingestion")
openapi_app = typer.Typer(help="OpenAPI contract commands")
app.add_typer(db_app, name="db")
app.add_typer(data_app, name="data")
app.add_typer(openapi_app, name="openapi")
app.add_typer(sources_app, name="sources")
app.add_typer(downloads_app, name="downloads")
app.add_typer(graph_app, name="graph")
app.add_typer(reports_app, name="reports")
app.command("ingest")(ingest_release)

T = TypeVar("T")


def _service_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _repository_root() -> Path:
    return _service_root().parents[1]


def _runtime_settings() -> Settings:
    try:
        return get_settings()
    except ValidationError as exc:
        typer.echo("Invalid or incomplete Alchemy configuration:", err=True)
        typer.echo(str(exc), err=True)
        raise typer.Exit(2) from exc


async def _with_repository(
    operation: Callable[[AlchemyRepository], Awaitable[T]],
) -> T:
    settings = _runtime_settings()
    driver = AsyncGraphDatabase.driver(
        settings.neo4j_uri,
        auth=(settings.neo4j_username, settings.neo4j_password.get_secret_value()),
    )
    try:
        await driver.verify_connectivity()
        repository = Neo4jAlchemyRepository(driver, settings.neo4j_database)
        return await operation(repository)
    finally:
        await driver.close()


@db_app.command("verify")
def db_verify() -> None:
    async def verify(repository: AlchemyRepository) -> bool:
        return await repository.readiness()

    ready = asyncio.run(_with_repository(verify))
    if not ready:
        typer.echo("Neo4j connectivity check failed.", err=True)
        raise typer.Exit(1)
    typer.echo("Neo4j connectivity verified.")


@db_app.command("migrate")
def db_migrate() -> None:
    async def run() -> tuple[list[str], dict[str, str]]:
        settings = _runtime_settings()
        driver = AsyncGraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_username, settings.neo4j_password.get_secret_value()),
        )
        try:
            await driver.verify_connectivity()
            added = await migrate(driver, settings.neo4j_database)
            applied = await applied_migrations(driver, settings.neo4j_database)
            return added, applied
        finally:
            await driver.close()

    added, applied = asyncio.run(run())
    typer.echo(
        json.dumps(
            {"appliedNow": added, "appliedMigrations": applied},
            indent=2,
            sort_keys=True,
        )
    )


@db_app.command("reset-demo")
def db_reset_demo(
    confirm_reset_demo: bool = typer.Option(
        False,
        "--confirm-reset-demo",
        help="Required destructive confirmation.",
    ),
) -> None:
    settings = _runtime_settings()
    if settings.alchemy_env == "production":
        typer.echo("Demo reset is forbidden in production.", err=True)
        raise typer.Exit(2)
    if not confirm_reset_demo:
        typer.echo("Pass --confirm-reset-demo to delete demo records.", err=True)
        raise typer.Exit(2)

    async def reset(repository: AlchemyRepository) -> dict[str, int]:
        return await repository.reset_demo()

    typer.echo(json.dumps(asyncio.run(_with_repository(reset)), sort_keys=True))


@data_app.command("validate-manifest")
def validate_manifest(
    manifest_path: Path,
    input_directory: Path | None = typer.Option(None, "--input-dir"),
    allow_review_required: bool = typer.Option(False, "--allow-review-required"),
) -> None:
    settings = _runtime_settings()
    manifest = load_manifest(manifest_path)
    enforce_rights(
        manifest,
        environment=settings.alchemy_env,
        allow_review_required=allow_review_required,
    )
    get_adapter(manifest.adapter_name, manifest.adapter_version)
    verify_expected_files(manifest, input_directory or manifest_path.parent)
    typer.echo(f"Manifest valid: {manifest.source_id}")


@data_app.command("ingest")
def ingest(
    manifest_path: Path,
    input_directory: Path | None = typer.Option(None, "--input-dir"),
    dry_run: bool = typer.Option(False, "--dry-run"),
    batch_size: int = typer.Option(1_000, "--batch-size", min=1, max=10_000),
    allow_review_required: bool = typer.Option(False, "--allow-review-required"),
) -> None:
    settings = _runtime_settings()

    async def run(repository: AlchemyRepository) -> dict[str, int | list[str] | bool]:
        service = IngestionService(repository)
        return await service.ingest(
            manifest_path,
            input_directory or manifest_path.parent,
            environment=settings.alchemy_env,
            allow_review_required=allow_review_required,
            dry_run=dry_run,
            batch_size=batch_size,
        )

    if dry_run:
        result = asyncio.run(run(MemoryAlchemyRepository()))
    else:
        result = asyncio.run(_with_repository(run))
    typer.echo(json.dumps(result, indent=2, sort_keys=True))


@data_app.command("audit")
def audit() -> None:
    async def run(repository: AlchemyRepository) -> dict[str, object]:
        return await repository.audit()

    typer.echo(json.dumps(asyncio.run(_with_repository(run)), indent=2, sort_keys=True))


@data_app.command("seed-demo")
def seed_demo() -> None:
    async def seed(repository: AlchemyRepository) -> dict[str, int]:
        return await repository.seed_demo()

    typer.echo(json.dumps(asyncio.run(_with_repository(seed)), sort_keys=True))


@data_app.command("clear-demo")
def clear_demo(
    confirm: bool = typer.Option(False, "--confirm"),
) -> None:
    settings = _runtime_settings()
    if settings.alchemy_env == "production":
        typer.echo("Demo deletion is forbidden in production.", err=True)
        raise typer.Exit(2)
    if not confirm:
        typer.echo("Pass --confirm to delete demo records.", err=True)
        raise typer.Exit(2)

    async def clear(repository: AlchemyRepository) -> dict[str, int]:
        return await repository.reset_demo()

    typer.echo(json.dumps(asyncio.run(_with_repository(clear)), sort_keys=True))


@data_app.command("pubchem-enrich")
def pubchem_enrich(
    compound_name: str,
    cache_directory: Path = typer.Option(_service_root() / ".cache" / "pubchem", "--cache-dir"),
) -> None:
    settings = _runtime_settings()

    async def run() -> str:
        client = PubChemClient(
            user_agent=settings.pubchem_user_agent,
            timeout_seconds=settings.external_request_timeout_seconds,
            minimum_interval_ms=settings.external_request_min_interval_ms,
            cache_directory=cache_directory,
        )
        result = await client.fetch_by_name(compound_name)
        return result.model_dump_json(indent=2, by_alias=True)

    typer.echo(asyncio.run(run()))


def _contract_json() -> str:
    settings = Settings(
        NEO4J_URI="bolt://contract.invalid:7687",
        NEO4J_USERNAME="contract",
        NEO4J_PASSWORD="contract-only",
        PUBCHEM_USER_AGENT="CurrentAlchemy-contract/0.1",
        ALCHEMY_ENV="test",
    )
    api = create_app(settings=settings, repository=MemoryAlchemyRepository())
    return json.dumps(api.openapi(), ensure_ascii=False, indent=2, sort_keys=True) + "\n"


@openapi_app.command("export")
def export_openapi(
    check: bool = typer.Option(False, "--check"),
) -> None:
    destination = _repository_root() / "contracts" / "alchemy-openapi.json"
    rendered = _contract_json()
    if check:
        if not destination.exists() or destination.read_text(encoding="utf-8") != rendered:
            typer.echo(
                f"OpenAPI contract is stale. Run: uv run alchemy openapi export ({destination})",
                err=True,
            )
            raise typer.Exit(1)
        typer.echo(f"OpenAPI contract is current: {destination}")
        return
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(rendered, encoding="utf-8")
    typer.echo(f"Exported OpenAPI contract: {destination}")


@app.command("check")
def check() -> None:
    commands = [
        [sys.executable, "-m", "ruff", "format", "--check", "."],
        [sys.executable, "-m", "ruff", "check", "."],
        [sys.executable, "-m", "mypy", "src"],
        [sys.executable, "-m", "pytest"],
        [
            sys.executable,
            "-m",
            "current_alchemy.cli.main",
            "openapi",
            "export",
            "--check",
        ],
    ]
    for command in commands:
        typer.echo(f"+ {' '.join(command)}")
        completed = subprocess.run(command, cwd=_service_root(), check=False)
        if completed.returncode:
            raise typer.Exit(completed.returncode)


if __name__ == "__main__":
    app()
