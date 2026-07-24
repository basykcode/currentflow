# Alchemy safety boundary

Current Alchemy is an educational and research instrument. It can retrieve licensed or public-domain
passages, expose source-specific claims and relationships, preserve disagreement, and calculate
deterministic properties of user-supplied formula compositions.

It must not:

- diagnose a condition or infer one from symptoms;
- prescribe or state that an herb/formula is appropriate for a person;
- recommend, optimize, or convert a dose beyond exact `mg`/`kg` to grams;
- declare an ingredient or composition safe, unsafe, compatible, or incompatible without returning
  the exact sourced claim and its uncertainty;
- treat a missing interaction record as evidence of compatibility;
- collect symptom narratives, medical history, or other health data in this alpha;
- turn model output into medical or historical truth;
- scrape an unlicensed source or call an external inference service.

Every knowledge envelope warns that information is not medical advice, may be incomplete, and that
absence of a known interaction does not establish safety. Claims carry sources and review status.
Disputed claims coexist; convenience properties do not erase them.

Interaction records preserve directionality, context, source claims, review/evidence status,
uncertainty, and preparation or dose dependence when a source explicitly supplies those fields.
When no record exists, analysis emits `relationshipStatus: "unknown"`.

Formula analysis is stateless and accepts no person or symptom profile. Invalid lines are rejected or
preserved and reported; they are never silently discarded. Traditional units are left unresolved
until a separately sourced conversion table is approved.

Logs include method/path-level service events and request IDs but no secrets or complete request
bodies. Environment files, downloaded source archives, PubChem caches, and health information are
not committed.
