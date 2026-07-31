# Data integration

The stable seam is `CurrentFlowProvider.getSnapshot(at: Date, context?)`. The active adapter is
selected in `src/providers/currentFlow.ts`; replacing that binding remains enough to change the data
implementation.

## Active connections

- **Temporal engine:** `LunarScriptCurrentFlowProvider` uses `lunar-javascript` for timezone-projected
  GanZhi pillars, then the versioned 60 Jia Zi to 64 Da Gua lookup for hexagrams.
- **Organ-clock engine:** a pure domain table selects the documented two-hour period from civil time
  in the snapshot timezone.
- **Structural relationships:** pure line transformations calculate intrinsic, symmetry, interior,
  moving-line destination/path, and anatomy results with explicit provenance.
- **Hexagram reference library:** a local 64-entry catalog supplies received Chinese names,
  tone-marked pinyin, English display titles, upper/lower trigrams, and three deterministic
  orderings. The shared inspector and Transformation Lab resolve every derived target through this
  same registry; they do not ship a second identity table.
- **Gene Keys vocabulary:** a static, source-linked mapping reproduces only the official
  Shadow/Gift/Siddhi keywords for the corresponding numbered Key. It is labeled `curated` and does
  not fetch or infer Gene Keys material at runtime.
- **Local context:** the Settings timezone is active; invalid values fall back to the device timezone
  and appear in provenance. The optional location label is display-only and no geolocation is used.

Full sources and boundary conventions are in
[`CALCULATION_SOURCES.md`](CALCULATION_SOURCES.md).

## Planned connections

- **Personal BaZi:** enters through a separate personal-context contract. Global temporal facts and personal facts remain separate before synthesis.
- **AI synthesis:** receives only verified facts, curated passages, user-controlled context, and provenance. It may phrase OLTR, intention, execution, and explanations, but may not invent hexagrams, calendar facts, organ periods, or transformations.
- **Hexagram commentaries:** six visible Daoism, Confucianism, Buddhism, Psychology, Human Design,
  and Gene Keys views remain `unavailable` until the pre-chunked texts are reviewed and connected.
- **Source-gated Yijing modules:** Zagua, Eight Palaces, Na Jia, Gua Bian, message hexagrams, Shao
  Yong maps, Cantong Qi overlays, Jiaoshi Yilin transitions, and text-reading conventions remain
  unavailable until complete reviewed source adapters are connected. Required inputs are listed in
  [`YIJING_TRANSFORMATION_SOURCE_INPUT_REQUIRED.md`](YIJING_TRANSFORMATION_SOURCE_INPUT_REQUIRED.md).
- **Advanced transformations:** Absolute Shadow is named as a future inspection tool but returns no
  result until its deterministic rule and source boundary are accepted.

## Forest transition staging

The user-supplied _Forest of Changes_ EPUB is parsed only by
`scripts/transitions/prepare_forest.py`. Protected verses and notes remain beneath the ignored
`content/yijing/internal/transitions` boundary. The tracked transition index carries the exact
source/result locator, resolved cross-reference chain, changing line, and source-passage hash for
all 384 deterministic one-line routes.

Original summaries are stored in eight draft batches and built into 64 lazy public bundles. The
public records retain source identity, route, evidence mode, rights, and review status but never
verse or footnote text. Runtime access is local and network-free through
`src/features/hexagram-transitions/repository.ts`. See
[`HEXAGRAM_TRANSITION_COMMENTARY.md`](HEXAGRAM_TRANSITION_COMMENTARY.md).

## Deterministic authority

Calendar conversion, stems and branches, hexagram construction, transformation relationships, organ-clock selection, and all source identifiers must remain deterministic or explicitly unavailable. When a required input or verified algorithm is absent, the adapter returns `unavailable`; it does not guess.

## Provenance

Every display datum carries a `DataStatus` and a source label. Snapshots add provider ID, model
version, factor labels, and notes. The UI displays local status near each datum and exposes
snapshot-level provenance below the synthesis. Calculated facts are labeled `computed`; interpretive
synthesis remains `unavailable`.

## Alchemy integration

Alchemy sources enter through rights- and checksum-validated manifests and closed adapters. The
backend keeps BotanicalTaxon, HerbMaterial, Preparation, Formula, Compound, Source, Claim, Document,
and Passage identities separate. Source claims coexist when disputed; search conveniences never
replace provenance.

The initial real-data boundaries are a conservative USDA Duke subset and offline PubChem compound
enrichment. The distributable seed is synthetic; SymMap is review-required and disabled. Details are
in [`ALCHEMY_DATA_GOVERNANCE.md`](ALCHEMY_DATA_GOVERNANCE.md).

The frontend integrates through its own `AlchemyProvider` domain interface. Demo mode is an explicit
deterministic fixture provider with no runtime network calls. API mode uses checked-in generated
types, `openapi-fetch`, and pure transport mappers. The backend supplies source-backed summary
properties, document titles, mentioned entities, and exact selected-passage retrieval so the
frontend does not infer missing knowledge. API failures never fall back to demo data. The verified
endpoint matrix is in [`ALCHEMY_FRONTEND_INTEGRATION.md`](ALCHEMY_FRONTEND_INTEGRATION.md).
