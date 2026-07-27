# Handoff: publish English-first multilingual Alchemy

- Timestamp (UTC): 2026-07-27T02:17:40Z
- Branch: `master`
- Starting commit: `bf68200`
- Published implementation chain: `943bfe0`, `8b2d4a2`, `fc941d8`
- Status: complete and live

## Objective

Make the live official Taiwan MOHW herb/formula foundation usable by English speakers while
preserving the source language. Give every public herb/material and formula an English display name,
tone-marked Hanyu Pinyin, untoned search Pinyin, and Traditional Chinese; store these identities in
the graph; and render English first with Pinyin and Chinese secondary throughout the UI.

## Naming sources and authority

- The Taiwan Herbal Pharmacopeia 4th edition supplies 355 official bilingual medicinal-material
  names. Those English common names are kept as official source-derived names.
- The Taiwan Ministry of Health and Welfare's 2021 bilingual standardized-formula compendium is an
  official romanization reference for 65 of the current formulas.
- Tone-marked Pinyin is generated deterministically with `pypinyin` 0.55.0 plus curated phrase-level
  overrides for known polyphones. Unaccented Pinyin is retained as a search representation.
- The 200 formula English titles and 93 formula-only material/excipient translations are
  conservative project-derived names. They remain `machine_imported`; the application does not
  mislabel them as official translations or human-reviewed knowledge.
- Fifty-eight generated Pinyin names exactly match the official formula reference. Seven differing
  ministry spellings remain separately preserved as source romanization variants.

“Complete” means complete for the pinned live Taiwan MOHW release, not exhaustive across all
Chinese-medicine traditions.

## Implemented schema and transport

- English (`en`/Latin), tone-marked Pinyin (`zh-Latn-pinyin`/Latin), and Traditional Chinese
  (`zh-Hant`/Hant) are first-class `CanonicalName` nodes connected to each canonical entity.
- Unaccented Pinyin (`zh-Latn-pinyin-x-plain`) is included in the entity's searchable name payload
  and alias projection without pretending it is a distinct source name.
- English is the public `displayName`; the exact Chinese source term is never overwritten.
- `nameSchemaVersion=taiwan-mohw-multilingual-names-v1` marks projected public records.
- Search aliases include English, accented Pinyin, plain Pinyin, and Chinese.
- The generated source artifact is deterministic and checksum-pinned with LF bytes across Windows
  and Linux.
- Frontend transport mappers preserve language, script, name kind, source, and review state.
- Materia Medica, Formula Library, formula ingredient tables, and Formula Workbench lead with
  English while showing Pinyin and Traditional Chinese as secondary identity.

## Final release counts

- 447 public herb/material identities;
- 200 public formula identities;
- one non-public prepared-material excipient;
- 647 public multilingual entities and 648 release entities in total;
- 1,944 first-class `CanonicalName` nodes/relationships in the full release;
- 355 official English monograph names;
- 200 standardized formulas;
- 1,672 ordered ingredient uses; and
- 555 distinct source records.

The full dry run produced 6,429 nodes and 16,760 relationships with zero rejects and zero critical
failures.

## Production migration and corrections

The first `943bfe0` Render build correctly refused to import because the generated multilingual
artifact had been checksummed from Windows CRLF bytes. `8b2d4a2` made the generator emit canonical
LF JSON and pinned:

- size: `243768` bytes;
- SHA-256: `973045af6c75764a0f9eb85fab1277e59fc07b5b93ef0501ebb557c5a4bca371`.

That deployment imported the multilingual graph, but one readiness check inspected serialized JSON
substrings and incorrectly failed after the graph update. `fc941d8` replaced that brittle check with
counts of first-class `CanonicalName` relationships for English, Traditional Chinese, and toned
Pinyin, and added a real Neo4j integration assertion.

Render deployment `dep-d9jbsmnlk1mc73ftjhn0` made `fc941d8` live in 1m26s. Startup reported:

- `formulas=200`;
- `ingredientUses=1672`;
- `multilingualEntities=647`;
- `officialMonographs=355`;
- `sourceRecords=555`;
- `canonicalEntities=647`;
- `criticalFailures=0`, `issues=[]`, `warnings=[]`; and
- dependency readiness HTTP 200.

The final run did not re-import because the prior deployment had already committed the valid graph;
it verified the exact multilingual foundation and served it.

## Verification

Local:

- `npm.cmd run check` passed strict TypeScript, ESLint with zero warnings, 74 frontend tests, and the
  Vite production build.
- `uv run alchemy check` passed Ruff, formatting, MyPy, generated OpenAPI consistency, and 37 backend
  tests; one environment-gated integration test was skipped in the ordinary check.
- With `ALCHEMY_RUN_INTEGRATION=1`, the targeted Neo4j integration test passed against a disposable
  portable Neo4j 5.26.28 instance (`1 passed`). The disposable process was stopped afterward.
- The complete Taiwan MOHW dry run passed with 6,429 nodes, 16,760 relationships, and no critical
  audit failures.

Live API:

- Empty catalog totals are exactly 447 public material records and 200 formulas.
- English, unaccented Pinyin, and Traditional Chinese queries all find `Cinnamon Bark` for
  `Cinnamon Bark`, `Rou Gui`, and `肉桂`.
- The same three query forms find `Six-Ingredient Rehmannia Pill` for its English title,
  `Liu Wei Di Huang Wan`, and `六味地黃丸`.
- Formula `formula:taiwan-mohw:cp-866-5524-108` returns six exact ingredient IDs with source amounts
  `8, 4, 4, 3, 3, 3 g`.

Live browser:

- The Materia Medica result renders `Prepared Rehmannia Root` first, then `Shú Dì Huáng` and
  `熟地黃`.
- The Formula Library result renders `Six-Ingredient Rehmannia Pill` first, then
  `六味地黃丸《丸》` and `Liù Wèi Dì Huáng Wán`.
- The live formula detail renders all six connected ingredient rows. Its first row shows
  `Prepared Rehmannia Root`, `Shú Dì Huáng`, `熟地黃`, and `8 g`; subsequent rows follow the same
  English/Pinyin/Chinese hierarchy.

## Remaining limitations and next action

- Derived English formula/material names and generated Pinyin are deliberately machine-imported
  until a qualified domain review promotes them.
- Source romanization variants remain evidence, not silent replacements for the preferred generated
  form.
- Formula search currently uses token matching, so a full-name query can return related formulas as
  well as the exact target; the expected formula is present and ranked first.
- Disease Ontology and compound/target enrichment remain deliberately deferred.
- Render Free and AuraDB Free remain alpha infrastructure without a production SLA.

Exact next action: review and promote the 200 formula titles, 92 public formula-only material names,
the non-public excipient, and the generated Pinyin; then add explicit identity mappings where domain
evidence supports them.
