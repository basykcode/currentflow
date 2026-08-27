# Decision: Share Prompt Lab history and select the inference provider

- Status: accepted
- Date (UTC): 2026-08-27
- Scope: Prompt Lab identity, global persistence, model selection, and private evidence processing

## Context

The first Prompt Lab release kept a 200-entry archive in one browser and generated only through
Workers AI. The owner now requires the complete experiment archive and collaborator names to appear
from every browser, with attribution and a per-experiment choice between Llama and current OpenAI
models.

## Decision

Store every successful experiment as an independent JSON record under `state/v1/history/` in a
private Workers KV binding. Store added collaborator names under `state/v1/users/`; always include
the built-in identities Ben Kind and Anthony Love. The browser persists only the selected user and
model IDs. It loads the complete global archive after authentication and exposes an explicit refresh.

Keep the current Cloudflare Llama model as the default. Add GPT-5.6 Sol, Terra, and Luna through the
OpenAI Responses API, using an encrypted `OPENAI_API_KEY`, structured output, and `store: false`.
Persist the selected model ID, provider, resolved runtime model, and user snapshot with each record.
Apply the same editorial contract and source-overlap guard to every provider.

The initial deployment may bind `PROMPT_LAB_STATE` to the existing private Gene Keys namespace under
a disjoint key prefix. This avoids a new public or paid service while preserving a future seam for a
dedicated namespace or transactional store.

## Consequences

- History and names synchronize across browsers after refresh or reload; Workers KV propagation is
  eventually consistent rather than realtime.
- Shared-password access still is not per-user authentication. User names provide attribution, not
  an authorization boundary or verified identity.
- Prompts and generated prose are now retained server-side. Raw source chapters remain excluded from
  all history records.
- OpenAI becomes an additional private evidence processor only for explicitly selected OpenAI runs.
- Independent history keys avoid a last-write-wins shared index, but the full archive response may
  eventually need pagination if the experiment corpus becomes large.

## Supersedes

This decision supersedes the device-local-history and Workers-AI-only portions of
`20260826T222903Z--protect-gene-keys-prompt-lab-at-the-edge.md`. Its password, session, CORS, source
storage, no-quotation, and draft-only boundaries remain in force.
