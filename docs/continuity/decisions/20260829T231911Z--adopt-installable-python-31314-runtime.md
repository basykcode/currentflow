# Decision: Adopt an installable Python 3.13.14 production runtime

- Status: superseded by [Align development and production with the native Codex toolchain](20260829T233942Z--align-dev-and-production-with-codex-native-toolchain.md)
- Date (UTC): 2026-08-29
- Scope: Alchemy API runtime, dependency lock, CI, container, Render release, and Codex Cloud

## Context

The production foundation pinned Python 3.12.14 everywhere. That version is a source-only security
release. The pinned uv 0.11.32 cannot discover or install a managed Python 3.12.14 build on either
Linux or Apple Silicon, so a nominally synchronized repository still required a separately compiled
interpreter. This caused backend setup failures and made disposable Codex Cloud workers waste time
before useful work began.

Current Flow needs one exact runtime that the canonical manager can obtain on supported developer
and Cloud platforms, while preserving exact CI, container, lockfile, and API metadata agreement.

## Options considered

1. **Keep 3.12.14 and compile it in every worker** — rejected because it adds slow source and OpenSSL
   builds, platform-specific dependencies, and a second bootstrap path.
2. **Keep 3.12.14 but rely on each platform to provision it externally** — rejected because local,
   Cloud, CI, and production would no longer share a repository-verifiable installation contract.
3. **Move to managed Python 3.13.14** — accepted. uv 0.11.32 publishes managed 3.13.14 builds for
   Linux and Apple Silicon, and the locked backend dependency set installs and passes its full check.
4. **Move directly to Python 3.14** — deferred because that is a wider compatibility change than is
   necessary to remove the setup failure.

## Decision

Use exact Python 3.13.14 for the Alchemy API and its tooling. Keep it synchronized in
`config/toolchain.json`, `.python-version`, `pyproject.toml`, `uv.lock`, Ruff and mypy targets,
GitHub Actions, the Docker base image, API metadata tests, Codex Cloud package settings, and user
documentation. Continue using exact uv 0.11.32 and `uv sync --locked`; never hand-edit the uv lock.

## Consequences and rollout

- Disposable Cloud and local workers can install the exact interpreter through the pinned uv rather
  than compile Python and OpenSSL.
- The next merge to `master` changes the Render container runtime from Python 3.12 to 3.13. It must
  pass the Alchemy quality, Neo4j integration, and container checks before merge.
- Production smoke verification must confirm live, ready, metadata, and representative Alchemy
  reads. The prior verified Render deployment remains the rollback target until that pass completes.
- Future Python changes update the manifest, all enforcing declarations, lockfile, Cloud package
  setting, and cache together in one reviewed change.

## Verification criteria

- `uv 0.11.32 python install 3.13.14` succeeds on Apple Silicon and the Cloud/Linux pilot.
- `uv sync --locked --all-groups --python 3.13.14` reports no lock drift.
- The complete backend check passes under exact Python 3.13.14.
- GitHub's Alchemy quality, Neo4j integration, and container jobs pass on the integration pull
  request.
- After an authorized release, `/api/v1/meta` reports Python 3.13.14 and the normal production smoke
  suite passes.

## Related records and files

- [Adopt GitHub-backed Codex Cloud workers](20260829T230215Z--adopt-github-backed-codex-cloud-workers.md)
- [`../../TOOLCHAIN.md`](../../TOOLCHAIN.md)
- [`../../../config/toolchain.json`](../../../config/toolchain.json)
- [`../../../services/alchemy-api/pyproject.toml`](../../../services/alchemy-api/pyproject.toml)
- [`../../../services/alchemy-api/uv.lock`](../../../services/alchemy-api/uv.lock)
