# Private user-data platform

No relational database or private user persistence is provisioned by this foundation. The selected
future boundary is:

```text
Provider: Render Postgres
Plan: Basic-1gb
Storage: 10 GB
Region: Virginia
PostgreSQL major: 17
Application connection: internal Render URL
External access: disabled after administrative setup
```

## Ownership

| Store         | Data                                                                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Postgres      | users, auth identities, birth profiles, saved formulas, practitioner notes, subscriptions, Intelligence threads, explicit memories, usage accounting |
| Neo4j         | shared sourced knowledge, claims, herbs, formulas, Canon relationships and accepted projections                                                      |
| Cloudflare R2 | raw source releases, Canon TEI/XML, exports, immutable compiled artifacts                                                                            |

Private state must never be added to Neo4j or cached by the public gateway. Repository interfaces
for future private features belong in the application layer and must include tenant/user ownership,
authorization, idempotency, deletion, export, retention, and audit contracts before a schema is
created. Authentication is explicitly outside this branch.

R2 will implement the existing ingestion `ObjectStore` port. LocalObjectStore remains the local/CI
adapter. Bucket provisioning, data migration, lifecycle rules, and credentials require a separate
reviewed task; no database downloads or secrets belong in Git.
