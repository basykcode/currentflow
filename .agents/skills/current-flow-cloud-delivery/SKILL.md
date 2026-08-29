---
name: current-flow-cloud-delivery
description: Coordinate Current Flow Codex Cloud implementation, parallel workstream pull requests, controlled integration, and production release. Use for Cloud task dispatch, branch convergence, shipping, or rollback; do not use for local-only evidence synthesis.
---

# Current Flow Cloud Delivery

Read `AGENTS.md`, `docs/CODEX_CLOUD.md`, the canonical project state, and the newest relevant
handoff before acting. Determine the authorized role from the user's request; implementation,
integration, merge, push, and deployment are separate permissions.

## Cloud worker

- Confirm the **Current Flow Cloud** environment pins Node 24.19.0 and Python 3.13.14, then runs the
  tracked setup and maintenance scripts. Reset its cache whenever a runtime or package-manager pin
  changes.
- Run `npm run codex:doctor` before tracked changes. Stop if the checkout is not marked
  `CURRENT_FLOW_CODEX_EXECUTION=cloud` or the evidence boundary fails.
- Start ordinary work from the explicitly selected GitHub `master` revision. Keep one scoped task on
  one short-lived `codex/*` branch with one unique handoff.
- Treat Astrology, Alchemy, Intelligence, Finance, Other Tools, and Miscellaneous as routing labels,
  not persistent mutable branches. Independent tasks may run in parallel; a dependent task must name
  its prerequisite branch or wait for its merge.
- Do not edit `docs/continuity/PROJECT_STATE.md`, merge, push, open a pull request, or deploy unless
  the current request authorizes that action.
- Run focused verification while iterating and `npm run check` before declaring the branch ready.

## Integration and release

- Inspect every exact source head, its handoff, tests, and relationship to current `master`. Reconcile
  already-integrated ancestry and semantic conflicts instead of replaying changes blindly.
- Integrate in a dedicated branch, preserve unrelated work, and serialize merges. Update
  `PROJECT_STATE.md` and create an integration-specific handoff only when integration is explicitly
  authorized.
- Require the protected pull-request checks named in `docs/CODEX_CLOUD.md`. If another pull request
  merges first, update the integration branch from `master` and rerun the affected checks.
- Merge to `master` only with explicit authorization. Treat the resulting Render and Cloudflare
  deployments as one release, then verify the documented public health and product smoke paths.
- Never bypass a failing check, expose a provider secret to a Cloud task, or run production load as
  a substitute for a bounded smoke check. Preserve the prior verified release until rollback is no
  longer needed.

## Protected evidence

Raw commentary, internal Yijing packets, local transition evidence, Alchemy raw data, and real
environment files never enter Codex Cloud or GitHub. A task that needs those inputs must remain in a
rights-approved local worktree. The private Cloudflare KV Prompt Lab is a distinct deployed boundary
and does not make its source corpus eligible for Codex Cloud.
