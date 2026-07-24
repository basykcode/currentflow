# Current Alchemy API

Current Alchemy API is a separate FastAPI and Neo4j service for sourced materia-medica research,
document retrieval, constrained graph exploration, and deterministic formula comparison.

It is an educational and research instrument, not medical advice. Its data can be incomplete, and
the absence of a documented interaction never establishes safety. The service does not diagnose,
prescribe, recommend doses, retain health data, or call an external inference service.

## Direct local setup

Install Python 3.12 and [uv](https://docs.astral.sh/uv/), then copy `.env.example` to `.env` and
replace the local Neo4j password and PubChem contact placeholder.

```bash
uv sync --frozen
uv run alchemy db verify
uv run alchemy db migrate
uv run alchemy data seed-demo
uv run uvicorn current_alchemy.app:create_app --factory --host 0.0.0.0 --port 8000
```

The API documentation is at `http://localhost:8000/api/v1/docs`. The root Compose stack provides
Neo4j Browser at `http://localhost:7474`.

## Administration

```bash
uv run alchemy db verify
uv run alchemy db migrate
uv run alchemy db reset-demo --confirm-reset-demo
uv run alchemy data validate-manifest data/manifests/synthetic-fixture.yaml --input-dir data/fixtures
uv run alchemy data ingest data/manifests/synthetic-fixture.yaml --input-dir data/fixtures --dry-run
uv run alchemy data audit
uv run alchemy data seed-demo
uv run alchemy data pubchem-enrich aspirin
uv run alchemy openapi export
uv run alchemy check
```

`reset-demo` refuses production mode and requires its explicit confirmation flag. PubChem enrichment
is an offline command whose responses are cached under the ignored `.cache/` directory; it is never
called by an end-user API route.

To run the USDA subset adapter, download only the archive declared in
`data/manifests/usda-duke-2023.yaml`, place it in an ignored local input directory as
`Duke-Source-CSV.zip`, and run:

```bash
uv run alchemy data ingest data/manifests/usda-duke-2023.yaml \
  --input-dir data/raw/usda-duke --dry-run --batch-size 1000
```

Remove `--dry-run` only after reviewing the field-mapping report in
`docs/ALCHEMY_DATA_GOVERNANCE.md` at the repository root.
