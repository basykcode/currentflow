# Alchemy rights and licensing

This is an engineering policy, not legal advice. Rights are evaluated for a specific release and
distribution context. Absence of verified rights means denial.

## Rights model

The source registry and immutable release snapshot record:

- license name, URL, and evidence URL;
- commercial use;
- redistribution;
- derivative-database rights;
- AI/ML use when stated;
- attribution requirements;
- share-alike or copyleft effect;
- internal-use and production status;
- notes, review date, and reviewer role.

Rows can be more restrictive than their source. Effective rights are the intersection of source,
release, and row rights; a row can never inherit a permission the source does not have.

## Deny-by-default policy

A record is eligible for a production-approved projection only when:

1. the source and release status are approved;
2. commercial use and redistribution are explicitly allowed for this projection;
3. derivative-database rights are compatible;
4. required attribution and a license URL are present;
5. checksums passed;
6. the import audit passed;
7. the row has no stricter restriction;
8. no unresolved reject, schema drift, or permission gate applies.

Conditional/share-alike data belongs in a separately named projection with its obligations.
Permission-pending and blocked data cannot be downloaded or imported by the platform.

## Provenance enforcement

Every production datum must trace to `SourceRecord → SourceRelease → Source/License/ImportRun`.
Claims, observations, measurements, formula witnesses, and mappings retain evidence edges.
Critical audits detect missing provenance, failed checksums, incompatible rights, count drift, and
non-idempotent release imports. Projection rebuilding stops on a critical failure.

## Disease Ontology release

Release `v2026-06-30` uses a release-specific CC0 1.0 Universal snapshot with official evidence,
verified URL, expected byte size, and SHA-256. Attribution is retained as good scholarly practice
even though it is not a CC0 condition. A later release requires a new immutable snapshot and
checksum verification; the current approval does not automatically cover it.

## Operational review

```powershell
uv run alchemy sources audit-rights
uv run alchemy graph audit
uv run alchemy graph rebuild-projections
```

Changing rights, licensing interpretation, or projection boundaries requires a new decision record,
release snapshot, relevant tests, and projection rebuild.
