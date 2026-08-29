# Decision: Protect the Gene Keys Prompt Lab at the Cloudflare edge

- Status: accepted
- Date (UTC): 2026-08-26
- Scope: private evidence, shared-password access, AI generation, and experiment retention

## Context

The owner requested a hosted language-synthesis workbench that can combine either, both, or neither
of two supplied Gene Keys books for one selected Gene Key. The tool needs a prompt editor, generated
OLTR/commentary output, restorable experiment history, and shared-password protection on the Current
Flow production site.

The existing static application cannot keep a plaintext password or commercial source chapters
private. The accepted commentary boundary also prohibits raw passages from entering Git or the
public SPA bundle. The earlier special-message design explicitly says stronger confidentiality must
move behind server-side authorization.

## Decision

Add narrow `/api/gene-keys-lab/*` routes to the existing Cloudflare API gateway Worker while leaving
the frontend Worker and the Render-bound `/api/v1/*` proxy behavior intact. Store the two 64-chapter
sets in a private Workers KV namespace and expose neither the namespace nor its values to the
browser. Store the shared password and an independent HMAC signing secret as encrypted Worker
secrets. Successful login creates a 12-hour HttpOnly, Secure, SameSite=Strict cookie on the API
hostname; credentialed CORS and POST origin checks permit only declared Current Flow frontend
origins.

For each explicit Generate action, the server loads only the selected key and sources and submits
them with the experimenter's prompt to a Workers AI binding. Require structured OLTR/commentary
output, label it `draft-only`, detect exact eight-word source overlap, and retry once when needed.
Do not log or return raw evidence.

Store successful experiment settings, prompts, and outputs in a versioned, 200-entry browser
localStorage archive with JSON export. Do not add a remote history database or store source text in
the archive.

## Options considered

1. Bundle source text and a password check into the SPA — rejected because both would be recoverable
   from the public bundle and would redistribute the supplied books.
2. Encrypt the source chapters into the SPA — rejected because the shared password would permit
   offline extraction and the full encrypted corpus would still be publicly downloadable.
3. Extend the Render Alchemy service — rejected for this focused tool because it would couple an
   unrelated Python/Neo4j service and its cold-start lifecycle to a small edge generation boundary.
4. Existing API gateway Worker, private KV, Workers AI, and device-local history — accepted as the
   smallest deployable boundary that keeps evidence and credentials server-side without creating a
   second production ingress.

## Consequences and tradeoffs

- The original static-only architecture is superseded only for the Prompt Lab API paths. Existing
  Astrology, Hexagram Library, special messages, and default demo behavior remain unchanged.
- Cloudflare becomes a private evidence processor during generation; its bindings, access policies,
  and product terms are operational dependencies.
- A shared password is not identity-aware access. It supports the requested internal workbench but
  does not provide per-user revocation, audit attribution, or synchronized history.
- Device-local history is free and private to one browser, but clearing browser data removes it.
  JSON export is the portability mechanism.
- The source upload is an explicit, separately authenticated operational command. It does not adopt
  the newer _Gene Keys_ chunks into the tracked commentary provenance graph.

## Verification criteria

- The browser bundle contains no password, source passage, Cloudflare credential, or namespace ID.
- Incorrect passwords fail; valid signed sessions authorize generation; expired or altered sessions
  fail.
- All 64 canonical chapter titles are available from the existing Gene Keys registry.
- Source selection supports zero, one, or two chapters, and the browser request contains only IDs.
- Successful generations save and restore all settings, prompt text, output, and draft metadata.
- Exact eight-word source overlap does not reach the browser.
- Strict type checking, lint, unit tests, workspace isolation tests, commentary/transition validators,
  and the production build pass.

## Supersedes

The static-only runtime choice in
[`20260723T233411Z--ship-alpha-as-static-client-side-vue-spa.md`](20260723T233411Z--ship-alpha-as-static-client-side-vue-spa.md)
is superseded only for `/api/gene-keys-lab/*`. The client-side special-message decision remains in
force for that separate feature.

## Related files

- [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md)
- [`../../DEPLOYMENT.md`](../../DEPLOYMENT.md)
- [`../../HEXAGRAM_COMMENTARY_RIGHTS.md`](../../HEXAGRAM_COMMENTARY_RIGHTS.md)
- [`../../../workers/api-gateway`](../../../workers/api-gateway)
- [`../../../server/gene-keys-prompt-lab`](../../../server/gene-keys-prompt-lab)
- [`../../../src/features/gene-keys-prompt-lab`](../../../src/features/gene-keys-prompt-lab)
