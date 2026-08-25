# Data integration

The stable seam is `CurrentFlowProvider.getSnapshot(at: Date, context?)`. The active adapter is
selected in `src/providers/currentFlow.ts`; replacing that binding remains enough to change the data
implementation.

## Active connections

- **Temporal engine:** `LunarScriptCurrentFlowProvider` uses `lunar-javascript` for timezone-projected
  GanZhi pillars, then the versioned `六十甲子配卦` King Wen lookup for hexagrams. Each temporal item
  and snapshot stores `liu-shi-jiazi-peigua-king-wen-v1`; external Fu Xi binary or XKDG Luo Pan
  positions cross an explicit normalization boundary.
- **Organ-clock engine:** a pure domain table and shared Shíchen index select the documented two-hour
  period from the snapshot's IANA local-civil coordinate. The same resolver supplies a normalized
  120-basis-minute coordinate and exact observed boundaries to the pure Chū–Zhèng–Kè phase engine.
  Macro maturity enters guidance; observational Micro does not. DST gaps/repeats use the existing
  IANA projection policy rather than fixed UTC arithmetic.
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
- **Temporal semantic resolver:** the first local implementation converts eligible year, month, day,
  and hour hexagram identities into versioned Current operational vectors. Its initial registry has
  13 product-specification-reviewed profiles; a missing operative day remains unavailable, while
  missing lesser scales remain explicit partial coverage. See
  [`TEMPORAL_SEMANTIC_RESOLVER_ARCHITECTURE.md`](TEMPORAL_SEMANTIC_RESOLVER_ARCHITECTURE.md).
- **AI phrasing:** may later receive only an already selected and validated guidance bundle. It may
  improve phrasing but may not calculate semantic state, invent hexagrams or calendar facts,
  select relation/intention/execution, alter evidence, or bypass validators.
- **Hexagram commentaries:** six Daoist, Buddhist, Confucian, Psychological, Human Design, and Gene
  Keys views lazy-load static derived drafts. Each record exposes evidence and review status.
  Missing eligible evidence remains `unavailable`; automated drafts are not forecasts or personal
  readings.
- **Source-gated Yijing modules:** Zagua, Eight Palaces, Na Jia, Gua Bian, message hexagrams, Shao
  Yong maps, Cantong Qi overlays, Jiaoshi Yilin transitions, and text-reading conventions remain
  unavailable until complete reviewed source adapters are connected. Required inputs are listed in
  [`YIJING_TRANSFORMATION_SOURCE_INPUT_REQUIRED.md`](YIJING_TRANSFORMATION_SOURCE_INPUT_REQUIRED.md).
- **Advanced transformations:** Absolute Shadow is named as a future inspection tool but returns no
  result until its deterministic rule and source boundary are accepted.

## Hexagram commentary staging

`data/hexagram-commentary` is a preparation boundary, not an active frontend data source. Its
manifest identifies lens, source sequence, title, contributors, extraction method, SHA-256, King
Wen coverage, rights status, and known issues. `chunk-index.jsonl` supplies one provenance and
eligibility record per local passage.

The full passages live under the Git-ignored `chunked/` directory. They are user-provided or
inherited commercial texts whose redistribution rights have not been cleared, so they must never be
copied into `src`, `public`, a build artifact, or Git history. Derived essences and summaries retain
source IDs and chunk hashes and remain drafts until human review.

The current local preparation contains eleven 64-chunk source directories: seven imported
byte-for-byte from pinned legacy repository commit `ed95936` and four newly extracted sources
(`daoist_2_wang_bi`, `psychological_2_balkin`, `psychological_3_dening`, and
`gene_keys_2_rudd`). The Wang Bi source is Richard John Lynn's _Classic of Changes_ translation,
split at the EPUB's explicit `HEXAGRAM 1` through `HEXAGRAM 64` markers. Six malformed legacy
records are quarantined by the current index.

The public boundary is `content/yijing/generated/hexagrams`: 64 bundles contain 379 supported draft
records and five explicit unavailable records. `src/features/hexagram-commentary/repository.ts`
lazy-loads and caches only these derived records. Full pipeline and rights details are in
[`HEXAGRAM_COMMENTARY_PIPELINE.md`](HEXAGRAM_COMMENTARY_PIPELINE.md) and
[`HEXAGRAM_COMMENTARY_RIGHTS.md`](HEXAGRAM_COMMENTARY_RIGHTS.md).

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
version, temporal mapping version, factor labels, and notes. The UI displays local status near each datum and exposes
snapshot-level provenance below the guidance output. Calculated facts are labeled `computed`.
Live guidance is available only when the Current semantic registry has an eligible operative day
profile; otherwise the bundle remains explicitly `unavailable`. Current operational evidence and
canonical identity provenance remain separate.

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
