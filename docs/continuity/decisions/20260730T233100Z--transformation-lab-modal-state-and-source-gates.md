# Decision: keep Transformation Lab state local and lineage data source-gated

- **Status:** Accepted
- **Date:** 2026-07-30
- **Branch:** `codex/chat-019fb0b43b1d`

## Context

The shared Hexagram Inspector needed an advanced transformation workbench with multi-step target
navigation. The workbench also names classical systems whose mappings are incomplete, variant, or
not yet rights-reviewed in this repository. Creating a second route/modal or flattening these methods
into a generic target list would lose arrival context and blur structural calculation with textual
or lineage evidence.

## Decision

Keep Base Hexagram and Transformation Lab as typed screens inside the existing dialog. Store a
complete prior-screen snapshot before navigating to a non-self target so Back restores section,
moving lines, filters, chain context, and scroll. Close clears all transient state.

Put deterministic operations in a pure transformation domain resolved through the canonical
hexagram registry. Use a per-inspector memoization engine and one shared target card. Model
lineage-specific methods as closed, source-gated modules and keep Jiaoshi Yilin as a directed
origin-to-destination repository.

## Consequences

- Focus trapping, Escape, and opener focus restoration remain owned by one dialog.
- Target chains can be explored without converting transient study state into routes or persistence.
- Self-mappings are inspectable without creating navigation loops.
- The SPA can ship the deterministic workbench without fabricated source tables or licensed text.
- Adding a lineage module requires complete validated records, provenance, rights review, tests, and
  an explicit availability change.
