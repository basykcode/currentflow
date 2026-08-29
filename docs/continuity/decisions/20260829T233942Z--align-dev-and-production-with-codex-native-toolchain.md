# Decision: Align development and production with the native Codex toolchain

- Status: accepted
- Date (UTC): 2026-08-29
- Scope: development runtimes, package managers, CI, builds, and production containers

## Context

The repository had exact Node 24.19.0, npm 11.17.0, Python 3.13.14, and uv 0.11.32 pins. A live
Codex Cloud environment test showed that its supported Node 22 and Python 3.13 selectors instead
provide exact Node 22.22.2, npm 11.4.2, Python 3.13.13, and uv 0.7.22. Automatic setup therefore
failed before installing dependencies and repeatedly consumed task time diagnosing a configuration
disagreement rather than product code.

No Current Flow feature requires Node 24. Vite 7.3.6 supports the selected Node 22 line, and Python
3.13.13 supports the Alchemy API dependencies. Installing second language runtimes during Cloud
setup would conceal the mismatch and create separate development and production environments.

## Decision

Use the exact native Codex Cloud toolchain everywhere it applies:

- Node 22.22.2;
- npm 11.4.2;
- Python 3.13.13; and
- uv 0.7.22.

Codex Cloud selects Node 22 and Python 3.13 in its environment controls. Its setup script verifies
all four exact versions before installing dependencies and does not replace them. The repository
uses the same versions in `.nvmrc`, `.node-version`, `.python-version`, package metadata, lockfiles,
GitHub Actions, and the Render Docker image. Cloudflare must read the root Node version file and use
the exact npm version when this integration candidate is activated. Node-specific type and
TypeScript configuration use the Node 22 families.

Project dependencies that Codex does not provide as environment runtimes—such as Vue, FastAPI,
Neo4j, Wrangler, and application libraries—remain exact, lockfile-controlled project choices. They
are not downgraded merely because they are absent from the universal image.

If Codex changes a native patch version, update development, CI, production, documentation, and
lockfiles together in one reviewed change. Do not work around the change by silently installing a
different Node, npm, Python, or uv inside task startup.

## Consequences

- Clean Cloud setup uses the tools already prepared by Codex and no longer reports 22-versus-24 or
  3.13.13-versus-3.13.14 engine failures.
- Local development and CI must select the exact repository versions rather than whichever global
  runtime happens to be first on `PATH`.
- Render's Python base and Cloudflare's Node build contract match development.
- A future managed-image patch change is an intentional toolchain update, not an automatic hidden
  divergence.

## Verification criteria

- A clean Codex Cloud setup reports the four exact versions and completes `npm ci` plus
  `uv sync --locked` without installing a language runtime or package manager.
- `npm run toolchain:check`, the complete frontend gate, and the complete backend gate pass under
  the exact native versions.
- GitHub's frontend, backend, Neo4j, and container checks pass with the synchronized declarations.
- After an authorized release, `/api/v1/meta` reports Python 3.13.13.

## Supersedes

- [Adopt an installable Python 3.13.14 production runtime](20260829T231911Z--adopt-installable-python-31314-runtime.md)
- The Node 24.19.0 and npm 11.17.0 portion of the production-foundation toolchain decision.

## Related records and files

- [Adopt GitHub-backed Codex Cloud workers](20260829T230215Z--adopt-github-backed-codex-cloud-workers.md)
- [`../../TOOLCHAIN.md`](../../TOOLCHAIN.md)
- [`../../CODEX_CLOUD.md`](../../CODEX_CLOUD.md)
- [`../../../config/toolchain.json`](../../../config/toolchain.json)
- [`../../../scripts/codex/cloud-bootstrap.sh`](../../../scripts/codex/cloud-bootstrap.sh)
