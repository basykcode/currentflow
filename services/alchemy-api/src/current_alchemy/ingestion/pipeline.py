"""Resumable source-release orchestration from acquisition through graph audit."""

import json
from datetime import UTC, datetime
from hashlib import sha256
from pathlib import Path
from typing import cast

from current_alchemy.application.ports.repository import AlchemyRepository
from current_alchemy.ingestion.adapters.base import ReleaseAdapter
from current_alchemy.ingestion.adapters.disease_ontology import (
    DiseaseOntologyAdapter,
)
from current_alchemy.ingestion.downloads import ReleaseDownloader
from current_alchemy.ingestion.lake import AlchemyDataPaths
from current_alchemy.ingestion.models import (
    IngestionBatch,
    PipelineCheckpoint,
    PipelineMode,
    PipelinePhase,
)
from current_alchemy.ingestion.source_registry.models import (
    RightsProjection,
    SourceRegistryEntry,
    SourceReleaseManifest,
)
from current_alchemy.ingestion.source_registry.policy import RightsPolicy

_ORDER = (
    PipelinePhase.ACQUIRE,
    PipelinePhase.VERIFY,
    PipelinePhase.EXTRACT,
    PipelinePhase.INSPECT_SCHEMA,
    PipelinePhase.STAGE,
    PipelinePhase.NORMALIZE,
    PipelinePhase.MAPPINGS,
    PipelinePhase.GRAPH,
    PipelinePhase.AUDIT,
    PipelinePhase.REPORT,
)


def release_adapters() -> dict[str, ReleaseAdapter]:
    values: list[ReleaseAdapter] = [DiseaseOntologyAdapter()]
    return {adapter.name: adapter for adapter in values}


def get_release_adapter(name: str, version: str) -> ReleaseAdapter:
    adapter = release_adapters().get(name)
    if adapter is None:
        raise ValueError(f"no phased release adapter is registered for: {name}")
    if adapter.version != version:
        raise ValueError(
            f"release adapter version mismatch for {name}: "
            f"expected {adapter.version}, got {version}"
        )
    return adapter


def _import_run_id(manifest: SourceReleaseManifest) -> str:
    basis = "|".join(
        (
            manifest.source_id,
            manifest.release_id,
            manifest.adapter_version,
            manifest.schema_version,
            manifest.normalization_version,
            manifest.mapping_version,
        )
    )
    return (
        f"import:{manifest.source_id}:{manifest.release_id}:"
        f"{sha256(basis.encode('utf-8')).hexdigest()[:16]}"
    )


def _load_checkpoint(
    path: Path, source_id: str, release_id: str, import_run_id: str
) -> PipelineCheckpoint:
    if not path.exists():
        return PipelineCheckpoint(
            source_id=source_id,
            release_id=release_id,
            import_run_id=import_run_id,
        )
    checkpoint = PipelineCheckpoint.model_validate_json(path.read_text(encoding="utf-8"))
    if (
        checkpoint.source_id != source_id
        or checkpoint.release_id != release_id
        or checkpoint.import_run_id != import_run_id
    ):
        raise ValueError("checkpoint does not match the requested import")
    return checkpoint


def _save_checkpoint(path: Path, checkpoint: PipelineCheckpoint) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    updated = checkpoint.model_copy(update={"updated_at": datetime.now(UTC)})
    temporary = path.with_suffix(".json.part")
    temporary.write_text(
        f"{updated.model_dump_json(by_alias=True, indent=2)}\n",
        encoding="utf-8",
    )
    temporary.replace(path)


class ReleasePipeline:
    def __init__(
        self,
        *,
        repository: AlchemyRepository,
        paths: AlchemyDataPaths,
        downloader: ReleaseDownloader,
        policy: RightsPolicy | None = None,
    ) -> None:
        self._repository = repository
        self._paths = paths
        self._downloader = downloader
        self._policy = policy or RightsPolicy()

    async def run(
        self,
        source: SourceRegistryEntry,
        manifest: SourceReleaseManifest,
        *,
        through: PipelinePhase,
        mode: PipelineMode,
        subset_limit: int,
        projection: RightsProjection,
        batch_size: int,
        dry_run: bool,
        resume: bool,
    ) -> dict[str, object]:
        self._paths.ensure()
        adapter = get_release_adapter(manifest.adapter_name, manifest.adapter_version)
        manifest = adapter.resolve_manifest(source, manifest)
        import_run_id = _import_run_id(manifest)
        checkpoint_path = self._paths.checkpoint(source.source_id, manifest.release_id)
        checkpoint = _load_checkpoint(
            checkpoint_path, source.source_id, manifest.release_id, import_run_id
        )
        phase_results = dict(checkpoint.phase_results)
        completed = list(checkpoint.completed_phases) if resume else []

        through_index = _ORDER.index(through)
        selected = list(_ORDER[: through_index + 1])
        if through is PipelinePhase.GRAPH:
            selected.extend((PipelinePhase.AUDIT, PipelinePhase.REPORT))
        batch: IngestionBatch | None = None
        active_manifest = manifest

        for phase in selected:
            if resume and phase in completed:
                continue
            if phase is PipelinePhase.ACQUIRE:
                active_manifest = await adapter.acquire(source, active_manifest, self._downloader)
                result: dict[str, object] = {
                    "files": len(active_manifest.artifacts),
                    "retrievedAt": (
                        active_manifest.retrieved_at.isoformat()
                        if active_manifest.retrieved_at
                        else None
                    ),
                }
            elif phase is PipelinePhase.VERIFY:
                result = cast(
                    dict[str, object],
                    adapter.verify(active_manifest, self._downloader),
                )
                active_manifest = active_manifest.model_copy(update={"checksum_verified": True})
            elif phase is PipelinePhase.EXTRACT:
                result = cast(
                    dict[str, object],
                    adapter.extract(active_manifest, self._paths),
                )
            elif phase is PipelinePhase.INSPECT_SCHEMA:
                result = cast(
                    dict[str, object],
                    adapter.inspect_schema(active_manifest, self._paths),
                )
            elif phase is PipelinePhase.STAGE:
                result = cast(
                    dict[str, object],
                    adapter.stage(
                        source,
                        active_manifest,
                        self._paths,
                        mode=mode,
                        subset_limit=subset_limit,
                        import_run_id=import_run_id,
                    ),
                )
            elif phase is PipelinePhase.NORMALIZE:
                result = cast(
                    dict[str, object],
                    adapter.normalize(
                        source,
                        active_manifest,
                        self._paths,
                        import_run_id=import_run_id,
                    ),
                )
            elif phase is PipelinePhase.MAPPINGS:
                integrity = adapter.audit(active_manifest, self._paths)
                if not bool(integrity["passed"]):
                    raise ValueError("critical pipeline audit failed before mapping")
                policy_manifest = active_manifest.model_copy(
                    update={
                        "checksum_verified": True,
                        "import_audit_passed": True,
                    }
                )
                decision = self._policy.evaluate(source, policy_manifest, projection)
                if (
                    projection
                    in {
                        RightsProjection.PRODUCTION_APPROVED,
                        RightsProjection.SHARE_ALIKE,
                    }
                    and not decision.eligible
                ):
                    raise ValueError("; ".join(decision.reasons))
                production_eligible = self._policy.evaluate(
                    source,
                    policy_manifest,
                    RightsProjection.PRODUCTION_APPROVED,
                ).eligible
                batch = adapter.propose_mappings(
                    source,
                    policy_manifest,
                    self._paths,
                    import_run_id=import_run_id,
                    production_eligible=production_eligible,
                )
                result = {
                    "nodes": len({node.id for node in batch.nodes}),
                    "relationships": len({relationship.id for relationship in batch.relationships}),
                    "unresolvedFields": batch.unresolved_fields,
                    "projection": projection.value,
                    "productionEligible": production_eligible,
                }
            elif phase is PipelinePhase.GRAPH:
                if batch is None:
                    export = self._paths.release_root(
                        "graph-export", source.source_id, active_manifest.release_id
                    )
                    batch = IngestionBatch.model_validate_json(
                        (export / "batch.json").read_text(encoding="utf-8")
                    )
                if dry_run:
                    result = {
                        "nodes": len({node.id for node in batch.nodes}),
                        "relationships": len(
                            {relationship.id for relationship in batch.relationships}
                        ),
                        "dryRun": True,
                    }
                else:
                    result = cast(
                        dict[str, object],
                        await adapter.load_graph(self._repository, batch, batch_size=batch_size),
                    )
                    result["dryRun"] = False
                report_path = (
                    self._paths.release_root(
                        "reports", source.source_id, active_manifest.release_id
                    )
                    / "graph-load-summary.json"
                )
                report_path.write_text(
                    f"{json.dumps(result, indent=2, sort_keys=True)}\n",
                    encoding="utf-8",
                )
            elif phase is PipelinePhase.AUDIT:
                pipeline_audit = adapter.audit(active_manifest, self._paths)
                graph_audit = {"skipped": "dry-run"} if dry_run else await self._repository.audit()
                result = {
                    **pipeline_audit,
                    "graphAudit": graph_audit,
                }
                critical_graph = int(
                    cast(
                        int | str,
                        cast(dict[str, object], graph_audit).get("criticalFailures", 0),
                    )
                )
                if not bool(pipeline_audit["passed"]) or critical_graph:
                    raise ValueError("critical graph or pipeline audit failed")
            elif phase is PipelinePhase.REPORT:
                result = cast(
                    dict[str, object],
                    adapter.report(source, active_manifest, self._paths, phase_results),
                )
            else:
                raise AssertionError(f"unhandled pipeline phase: {phase}")

            phase_results[phase.value] = result
            if phase not in completed:
                completed.append(phase)
            checkpoint = PipelineCheckpoint(
                source_id=source.source_id,
                release_id=active_manifest.release_id,
                import_run_id=import_run_id,
                completed_phases=completed,
                phase_results=phase_results,
            )
            _save_checkpoint(checkpoint_path, checkpoint)

        return {
            "sourceId": source.source_id,
            "releaseId": active_manifest.release_id,
            "importRunId": import_run_id,
            "through": through.value,
            "mode": mode.value,
            "projection": projection.value,
            "dryRun": dry_run,
            "phases": phase_results,
        }
