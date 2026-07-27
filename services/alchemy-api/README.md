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
uv run alchemy sources validate
uv run alchemy sources audit-rights
uv run alchemy foundation status
uv run alchemy foundation ensure
uv run alchemy ingest source:taiwan-mohw-docmap --release thp4-2025-07-30 \
  --through graph --dry-run --mode full
uv run alchemy downloads plan source:disease-ontology --release v2026-06-30
uv run alchemy downloads fetch source:disease-ontology --release v2026-06-30
uv run alchemy downloads verify source:disease-ontology --release v2026-06-30
uv run alchemy ingest source:disease-ontology --release v2026-06-30 \
  --through graph --dry-run --mode subset --subset-limit 250
uv run alchemy graph audit
uv run alchemy graph counts
uv run alchemy graph provenance disease:doid:0001816
uv run alchemy graph rebuild-projections
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

## Release-aware knowledge foundation

The source registry, immutable release manifests, local/object-store lake interface, DuckDB/Parquet
staging, mapping assertions, evidence graph, rights policy, and graph audits are implemented for
offline administration. The live foundation pins Taiwan MOHW release `thp4-2025-07-30` with 355
official medicinal-material monographs, 200 standardized formulas, and 1,672 ordered base
ingredient uses. Disease Ontology `v2026-06-30` remains an architecture proof and later enrichment,
not a material/formula dependency. Downloaded official PDFs and generated lake data remain ignored
by Git; the checksum-pinned lossless foundation and multilingual-name snapshots are committed for
reproducibility. Public material/formula display is English-first with tone-marked Hanyu Pinyin and
exact Traditional Chinese secondary names. Official pharmacopeia English names remain distinct from
provenance-labeled derived formula and formula-only material translations.

See the root documentation:

- `docs/ALCHEMY_GRAPH_ARCHITECTURE.md`
- `docs/ALCHEMY_SOURCE_REGISTER.md`
- `docs/ALCHEMY_DATA_PIPELINE.md`
- `docs/ALCHEMY_IDENTITY_RESOLUTION.md`
- `docs/ALCHEMY_RIGHTS_AND_LICENSING.md`
- `docs/ALCHEMY_IMPORT_RUNBOOK.md`
- `docs/MANUAL_DATA_ACQUISITION.md`
