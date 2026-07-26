# Manual data acquisition

Manual acquisition is an explicit governance gate, not an invitation to automate around access
controls. It applies only when an approved, mission-critical release cannot be fetched through a
documented official machine endpoint.

## Gate conditions

Stop automation when a manifest or source entry is `manual_download`, when authentication or
interactive terms are required, when the server blocks compliant retrieval, or when the official
artifact cannot be verified automatically. The adapter remains disabled until the artifact is
placed and verified.

Generate the release-specific instruction file:

```powershell
uv run alchemy downloads manual-instructions <source-id> --release <release-id>
```

The instruction file must identify the official page, expected filename, release/version, expected
size and SHA-256 when published, destination directory, license evidence, and verification command.

## Operator procedure

1. Open only the official source page recorded in the manifest.
2. Read and comply with the displayed terms; do not share credentials.
3. Download the exact named release artifact.
4. Place it in the release's `raw/<source>/<release>/original` directory.
5. Run `alchemy downloads verify`.
6. If the observed hash was not published in advance, record it in a reviewed immutable release
   manifest before ingestion.
7. Run a dry-run subset and review every generated report.

Never scrape a login page, defeat robots/access controls, reuse browser cookies in code, copy a
commercial database, or accept click-through terms on another person's behalf.

## Current status

No manual-acquisition gate was reached for the implemented Disease Ontology slice. Its pinned
artifact is available from an official public release URL and passed automatic size and SHA-256
verification. Permission-pending and blocked sources remain disabled rather than triggering manual
instructions.
