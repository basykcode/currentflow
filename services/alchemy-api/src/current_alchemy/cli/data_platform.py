"""CLI commands for the source registry, data lake, phased ingestion, and graph audits."""

import asyncio
import json
from collections.abc import Awaitable, Callable
from dataclasses import asdict
from pathlib import Path
from typing import TypeVar, cast

import typer
from neo4j import AsyncGraphDatabase
from pydantic import ValidationError

from current_alchemy.application.ports.repository import AlchemyRepository
from current_alchemy.config import Settings, get_settings
from current_alchemy.infrastructure.memory_repository import MemoryAlchemyRepository
from current_alchemy.infrastructure.neo4j.repository import Neo4jAlchemyRepository
from current_alchemy.ingestion.downloads import ReleaseDownloader
from current_alchemy.ingestion.lake import AlchemyDataPaths
from current_alchemy.ingestion.models import PipelineMode, PipelinePhase
from current_alchemy.ingestion.pipeline import (
    ReleasePipeline,
    get_release_adapter,
)
from current_alchemy.ingestion.source_registry.models import RightsProjection
from current_alchemy.ingestion.source_registry.policy import RightsPolicy
from current_alchemy.ingestion.source_registry.store import SourceRegistryStore

sources_app = typer.Typer(help="Rights-aware source registry")
downloads_app = typer.Typer(help="Immutable release acquisition")
graph_app = typer.Typer(help="Graph audits, provenance, counts, and projections")
reports_app = typer.Typer(help="Machine- and human-readable import reports")
foundation_app = typer.Typer(help="Required live herb/formula foundation")

_FOUNDATION_SOURCE_ID = "source:taiwan-mohw-docmap"
_FOUNDATION_RELEASE_ID = "thp4-2025-07-30"
_FOUNDATION_EXPECTED = {
    "releases": 1,
    "sourceRecords": 555,
    "officialMonographs": 355,
    "formulas": 200,
    "formulaWitnesses": 200,
    "ingredientUses": 1672,
}

T = TypeVar("T")


def _service_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _repository_root() -> Path:
    return _service_root().parents[1]


def _settings() -> Settings:
    try:
        return get_settings()
    except ValidationError as exc:
        typer.echo("Invalid or incomplete Alchemy configuration:", err=True)
        typer.echo(str(exc), err=True)
        raise typer.Exit(2) from exc


def _data_root(settings: Settings) -> Path:
    configured = settings.alchemy_data_root
    return configured if configured.is_absolute() else _repository_root() / configured


def _store() -> SourceRegistryStore:
    return SourceRegistryStore(_service_root() / "data")


def _downloader(settings: Settings) -> ReleaseDownloader:
    return ReleaseDownloader(
        data_paths=AlchemyDataPaths(_data_root(settings)),
        user_agent=settings.alchemy_download_user_agent,
        max_automatic_bytes=settings.alchemy_max_autodownload_bytes,
        timeout_seconds=settings.external_request_timeout_seconds,
    )


async def _with_repository[T](
    operation: Callable[[AlchemyRepository], Awaitable[T]],
) -> T:
    settings = _settings()
    driver = AsyncGraphDatabase.driver(
        settings.neo4j_uri,
        auth=(
            settings.neo4j_username,
            settings.neo4j_password.get_secret_value(),
        ),
    )
    try:
        await driver.verify_connectivity()
        repository = Neo4jAlchemyRepository(driver, settings.neo4j_database)
        return await operation(repository)
    finally:
        await driver.close()


@sources_app.command("list")
def sources_list() -> None:
    values = [
        {
            "sourceId": source.source_id,
            "title": source.title,
            "productionStatus": source.production_status.value,
            "acquisitionMode": source.acquisition_mode.value,
            "license": source.rights.license_name,
        }
        for source in _store().sources().values()
    ]
    typer.echo(json.dumps(values, indent=2, sort_keys=True))


@sources_app.command("show")
def sources_show(source_id: str) -> None:
    source = _store().source(source_id)
    typer.echo(source.model_dump_json(by_alias=True, indent=2))


@sources_app.command("validate")
def sources_validate() -> None:
    result = _store().validate()
    for release in _store().releases().values():
        get_release_adapter(release.adapter_name, release.adapter_version)
    typer.echo(json.dumps(result, indent=2, sort_keys=True))


@sources_app.command("audit-rights")
def sources_audit_rights() -> None:
    store = _store()
    policy = RightsPolicy()
    releases = store.releases()
    rows: list[dict[str, object]] = []
    for source in store.sources().values():
        matching = [
            release
            for (release_source, _), release in releases.items()
            if release_source == source.source_id
        ]
        if not matching:
            rows.append(
                {
                    "sourceId": source.source_id,
                    "releaseId": None,
                    "productionEligible": False,
                    "reasons": ["no verified release manifest"],
                }
            )
            continue
        for release in matching:
            decision = policy.evaluate(source, release, RightsProjection.PRODUCTION_APPROVED)
            rows.append(
                {
                    "sourceId": source.source_id,
                    "releaseId": release.release_id,
                    "productionEligible": decision.eligible,
                    "reasons": list(decision.reasons),
                }
            )
    typer.echo(json.dumps(rows, indent=2, sort_keys=True))


@downloads_app.command("plan")
def downloads_plan(source_id: str, release: str = typer.Option(..., "--release")) -> None:
    settings = _settings()
    store = _store()
    source = store.source(source_id)
    manifest = store.release(source_id, release)
    adapter = get_release_adapter(manifest.adapter_name, manifest.adapter_version)
    plan = adapter.plan_acquisition(source, manifest, _downloader(settings))
    typer.echo(json.dumps(asdict(plan), indent=2, sort_keys=True))


@downloads_app.command("fetch")
def downloads_fetch(source_id: str, release: str = typer.Option(..., "--release")) -> None:
    settings = _settings()
    store = _store()
    source = store.source(source_id)
    manifest = store.release(source_id, release)
    adapter = get_release_adapter(manifest.adapter_name, manifest.adapter_version)
    resolved = asyncio.run(adapter.acquire(source, manifest, _downloader(settings)))
    typer.echo(resolved.model_dump_json(by_alias=True, indent=2))


@downloads_app.command("verify")
def downloads_verify(source_id: str, release: str = typer.Option(..., "--release")) -> None:
    settings = _settings()
    manifest = _store().release(source_id, release)
    adapter = get_release_adapter(manifest.adapter_name, manifest.adapter_version)
    result = adapter.verify(manifest, _downloader(settings))
    typer.echo(json.dumps(result, indent=2, sort_keys=True))


@downloads_app.command("manual-instructions")
def downloads_manual_instructions(
    source_id: str,
    release: str = typer.Option(..., "--release"),
) -> None:
    settings = _settings()
    store = _store()
    source = store.source(source_id)
    manifest = store.release(source_id, release)
    destination = _data_root(settings) / "reports" / source_id / release / "manual-acquisition.json"
    _downloader(settings).write_manual_instructions(source, manifest, destination)
    typer.echo(str(destination))


def ingest_release(
    source_id: str,
    release: str = typer.Option(..., "--release"),
    through: PipelinePhase = typer.Option(PipelinePhase.GRAPH, "--through"),
    resume: bool = typer.Option(False, "--resume"),
    dry_run: bool = typer.Option(False, "--dry-run"),
    batch_size: int = typer.Option(1_000, "--batch-size", min=1, max=20_000),
    mode: PipelineMode = typer.Option(PipelineMode.SUBSET, "--mode"),
    subset_limit: int = typer.Option(250, "--subset-limit", min=1, max=100_000),
    projection: RightsProjection = typer.Option(
        RightsProjection.PRODUCTION_APPROVED, "--projection"
    ),
) -> None:
    settings = _settings()
    store = _store()
    source = store.source(source_id)
    manifest = store.release(source_id, release)
    paths = AlchemyDataPaths(_data_root(settings))
    downloader = _downloader(settings)

    async def run(repository: AlchemyRepository) -> dict[str, object]:
        pipeline = ReleasePipeline(
            repository=repository,
            paths=paths,
            downloader=downloader,
        )
        return await pipeline.run(
            source,
            manifest,
            through=through,
            mode=mode,
            subset_limit=subset_limit,
            projection=projection,
            batch_size=batch_size,
            dry_run=dry_run,
            resume=resume,
        )

    if dry_run or _phase_before_graph(through):
        result = asyncio.run(run(MemoryAlchemyRepository()))
    else:
        result = asyncio.run(_with_repository(run))
    typer.echo(json.dumps(result, indent=2, sort_keys=True))


def _phase_before_graph(phase: PipelinePhase) -> bool:
    order = list(PipelinePhase)
    return order.index(phase) < order.index(PipelinePhase.GRAPH)


def _foundation_complete(status: dict[str, int]) -> bool:
    return all(status.get(field) == expected for field, expected in _FOUNDATION_EXPECTED.items())


@foundation_app.command("status")
def foundation_status() -> None:
    async def run(repository: AlchemyRepository) -> dict[str, object]:
        counts = await repository.foundation_status(_FOUNDATION_SOURCE_ID, _FOUNDATION_RELEASE_ID)
        return {"complete": _foundation_complete(counts), **counts}

    typer.echo(json.dumps(asyncio.run(_with_repository(run)), indent=2, sort_keys=True))


@foundation_app.command("ensure")
def foundation_ensure(
    retire_demo: bool = typer.Option(False, "--retire-demo"),
) -> None:
    settings = _settings()
    store = _store()
    source = store.source(_FOUNDATION_SOURCE_ID)
    manifest = store.release(_FOUNDATION_SOURCE_ID, _FOUNDATION_RELEASE_ID)
    paths = AlchemyDataPaths(_data_root(settings))
    downloader = _downloader(settings)

    async def run(repository: AlchemyRepository) -> dict[str, object]:
        before = await repository.foundation_status(_FOUNDATION_SOURCE_ID, _FOUNDATION_RELEASE_ID)
        imported = False
        pipeline_result: dict[str, object] | None = None
        if not _foundation_complete(before):
            imported = True
            pipeline = ReleasePipeline(
                repository=repository,
                paths=paths,
                downloader=downloader,
            )
            pipeline_result = await pipeline.run(
                source,
                manifest,
                through=PipelinePhase.GRAPH,
                mode=PipelineMode.FULL,
                subset_limit=_FOUNDATION_EXPECTED["formulas"],
                projection=RightsProjection.PRODUCTION_APPROVED,
                batch_size=1_000,
                dry_run=False,
                resume=False,
            )
        after = await repository.foundation_status(_FOUNDATION_SOURCE_ID, _FOUNDATION_RELEASE_ID)
        if not _foundation_complete(after):
            raise RuntimeError(
                "foundation import did not reach required counts: "
                + json.dumps(after, sort_keys=True)
            )
        projection = await repository.rebuild_projections()
        retired = await repository.reset_demo() if retire_demo else {"deleted": 0}
        audit = await repository.audit()
        if int(cast(int | str, audit.get("criticalFailures", 0))):
            raise RuntimeError("critical graph audit failed after foundation import")
        return {
            "complete": True,
            "imported": imported,
            "before": before,
            "after": after,
            "retiredDemoNodes": retired["deleted"],
            "projection": projection,
            "audit": audit,
            "pipeline": pipeline_result,
        }

    typer.echo(json.dumps(asyncio.run(_with_repository(run)), indent=2, sort_keys=True))


@graph_app.command("audit")
def graph_audit() -> None:
    async def run(repository: AlchemyRepository) -> dict[str, object]:
        return await repository.audit()

    typer.echo(json.dumps(asyncio.run(_with_repository(run)), indent=2, sort_keys=True))


@graph_app.command("counts")
def graph_counts() -> None:
    async def run(repository: AlchemyRepository) -> dict[str, object]:
        return await repository.graph_counts()

    typer.echo(json.dumps(asyncio.run(_with_repository(run)), indent=2, sort_keys=True))


@graph_app.command("provenance")
def graph_provenance(entity_id: str) -> None:
    async def run(repository: AlchemyRepository) -> dict[str, object]:
        return await repository.provenance(entity_id)

    typer.echo(json.dumps(asyncio.run(_with_repository(run)), indent=2, sort_keys=True))


@graph_app.command("rebuild-projections")
def graph_rebuild_projections() -> None:
    async def run(repository: AlchemyRepository) -> dict[str, object]:
        return await repository.rebuild_projections()

    typer.echo(json.dumps(asyncio.run(_with_repository(run)), indent=2, sort_keys=True))


@reports_app.command("build")
def reports_build(source_id: str, release: str = typer.Option(..., "--release")) -> None:
    settings = _settings()
    report_root = _data_root(settings) / "reports" / source_id / release
    checkpoint_path = _data_root(settings) / "logs" / source_id / release / "checkpoint.json"
    if not checkpoint_path.exists():
        typer.echo("No pipeline checkpoint exists for this release.", err=True)
        raise typer.Exit(2)
    checkpoint = json.loads(checkpoint_path.read_text(encoding="utf-8"))
    source = _store().source(source_id)
    manifest = _store().release(source_id, release)
    adapter = get_release_adapter(manifest.adapter_name, manifest.adapter_version)
    result = adapter.report(
        source,
        manifest,
        AlchemyDataPaths(_data_root(settings)),
        checkpoint.get("phaseResults", {}),
    )
    typer.echo(json.dumps(result, indent=2, sort_keys=True))
    if not report_root.exists():
        raise typer.Exit(1)


@reports_app.command("open")
def reports_open(source_id: str, release: str = typer.Option(..., "--release")) -> None:
    report = _data_root(_settings()) / "reports" / source_id / release / "import-summary.md"
    if not report.exists():
        typer.echo("Build the report before opening it.", err=True)
        raise typer.Exit(2)
    typer.launch(str(report))
