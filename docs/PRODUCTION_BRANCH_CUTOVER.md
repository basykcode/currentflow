# Production branch cutover

## Current verified state

GitHub's default production branch is `master`. Ruleset `Protect master production` targets exactly
`master`, requires an up-to-date pull request, one approval, resolved conversations, and the four
Actions checks `frontend-quality`, `alchemy-quality`, `alchemy-neo4j-integration`, and
`alchemy-container`. Deletion and force pushes are blocked; repository-admin and explicit owner
emergency bypasses are retained. `main` remains intact and is not a production branch.

## Reconciliation procedure

For a new repository or future repair:

1. Compare `main...master` and identify commits unique to either side.
2. Reconcile any unique `main` work through a reviewed branch; do not rewrite or delete it.
3. Make `master` the default in GitHub repository settings.
4. Create an exact `master` ruleset with pull request, review, conversation, up-to-date, deletion,
   force-push, and required-check controls.
5. Verify workflows run on every protected pull request; path-filtered required workflows can remain
   permanently expected and block merging.
6. Verify Render, Cloudflare frontend, and gateway Git integrations all name `master`.
7. Retire or archive `main` only in a separate authorized task after the comparison is empty and
   dependent integrations have been observed.

Solo-maintainer emergency bypass is an auditable exception, not the normal merge path. Use it only
after all required checks pass and never weaken or disable the persistent ruleset merely to merge.
