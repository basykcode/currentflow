# Production dashboard checklist

This checklist contains no secret values. The 2026-08-26 cutover handoff records that the current
Render, Aura, Cloudflare, and GitHub state was separately authorized and verified; this repository
follow-up does not repeat purchases or DNS mutations.

## Verify before every release

- [ ] AuraDB Professional is running in AWS US East with the intended 2 GB / 1 CPU / 4 GB plan.
- [ ] A secret-safe `RETURN 1` succeeds before any credential cutover.
- [ ] Render service is `current-flow-alchemy-api`, Standard, Virginia, one instance, `master`.
- [ ] Render pre-deploy and health path match `render.yaml`.
- [ ] Cloudflare Workers Paid uses Standard usage and billing alerts are configured.
- [ ] GitHub default remains `master`; the active ruleset and four exact checks remain present.
- [ ] Gateway build root is `workers/api-gateway`, production branch is `master`, and
      non-production deployments follow the reviewed setting.
- [ ] Worker is proven on workers.dev before route or token changes.
- [ ] The API CNAME target is recorded before changing proxy state; apex and `www` are untouched.
- [ ] Canonical edge token is stored only as a Worker/Render secret and promoted Worker-first.
- [ ] Live, ready, meta, herb, formula, cache, bypass, CORS, 404, and direct-origin checks pass.
- [ ] Rollback Worker version, Render deploy, DNS proxy state, and prior database secret set are
      recorded without secret values.

## Dashboard-only rate and cost controls

- Configure Cloudflare Rate Limiting/WAF from the route classes in `EDGE_GATEWAY.md`; do not emulate
  a distributed limiter in process memory.
- Set Cloudflare and Render billing alerts appropriate to the approved budget.
- Review Render CPU/memory and Aura CPU/page-cache/storage before and during an authorized load run.
- Do not delete the former AuraDB until a separate retention and restore decision authorizes it.
