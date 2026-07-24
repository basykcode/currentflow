# Future Alchemy AI integration

## Deterministic truth layer

Neo4j entities, source-specific claims, passages, citations, review statuses, and deterministic
formula analysis remain authoritative. A future model may summarize selected evidence but may not
invent an herb identity, traditional property, interaction, contraindication, historical claim,
diagnosis, recommendation, or dose.

The application defines disabled `EmbeddingProvider`, `RetrievalProvider`, `SynthesisProvider`, and
`InquiryProvider` ports. No model library or external inference SDK is installed. The only inquiry
placeholder returns `501 model_not_connected`.

## Retrieval package

`POST /api/v1/retrieval/context` deterministically selects full-text passages under count and
character budgets, applies optional entity/source filters, and returns citations, matched entities,
graph facts, ambiguities, rights status, and review status. Whole passages retain stable locators;
truncation does not silently remove citation context.

## Future self-hosted embeddings

A separately accepted change may:

1. choose and pin a locally hosted embedding model and record its license, dimensions, normalization,
   model checksum, and version;
2. add vector properties to `Passage` with embedding model/version and source checksum;
3. create a native Neo4j vector index through a versioned migration;
4. run embedding only as an offline administration job;
5. retrieve candidates by full text and vector similarity, then expand allowlisted graph
   neighborhoods and apply source/review filters;
6. preserve the raw score components rather than manufacture clinical confidence.

Re-embedding must be idempotent and traceable to the passage checksum. A vector is an index artifact,
not evidence.

## Future local synthesis

A self-hosted synthesis model can receive only the retrieval package and explicit user-controlled
research context. Output must cite package claims, name conflicts and missing data, keep deterministic
facts unchanged, and repeat the educational boundary. It must refuse diagnosis, treatment selection,
personalized dosing, and safety declarations.

No OpenAI, Anthropic, Google, hosted DeepSeek, or other external inference request is permitted.
Connecting any inference provider requires a new decision covering model hosting, privacy, retention,
prompt-injection controls, provenance, evaluation, and failure behavior.
