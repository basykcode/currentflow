# Yijing transformation data contracts

The deterministic engine needs no runtime data beyond the canonical hexagram registry. Classical
lineage modules stay `source-needed` until complete, rights-reviewed records are deliberately
ingested. The browser performs no fetch to discover these sources.

## Canonical identity dependency

`src/domain/astrology/hexagrams.ts` remains the only registry for King Wen number, line tuple, name,
and trigram identity. A source adapter stores foreign identifiers separately and resolves them to a
canonical hexagram number during validation. It must not introduce a parallel 64-entry identity
table into the Lab.

## Complete-table validation

A 64-record hexagram-indexed table must reject:

- missing hexagram numbers;
- duplicate records;
- numbers outside 1 through 64;
- invalid foreign references;
- missing source IDs or locators;
- unmarked variants or conflicting lineage assignments.

`validateCompleteHexagramSourceTable` currently enforces coverage, uniqueness, and range. A module
adapter must add its schema-specific validation before it can report `available`. Failed or partial
data remains unavailable; the UI must not fill gaps.

## Supported adapter shapes

### Zagua contrast

```ts
type ZaguaContrastRecord = {
  sourceHexagramNumber: number
  targetHexagramNumber: number
  contrastSummary: string
  sourceId: string
}
```

The summary must be a reviewed, quotation-free project record. Without it, the Lab reports
`source-needed` and does not infer contrast from reversal, complement, or King Wen pairing.

### Eight Palaces

```ts
type EightPalaceRecord = {
  hexagramNumber: number
  palaceRootHexagramNumber: number
  stage:
    | 'palace-root'
    | 'first-generation'
    | 'second-generation'
    | 'third-generation'
    | 'fourth-generation'
    | 'fifth-generation'
    | 'wandering-soul'
    | 'returning-soul'
  hostLine: 1 | 2 | 3 | 4 | 5 | 6
  respondingLine: 1 | 2 | 3 | 4 | 5 | 6
  sourceId: string
}
```

Availability requires 64 unique records, eight complete palaces, valid root membership and stages,
valid host/response positions, and an identified lineage/source. Na Jia needs a separate
line-assignment table and is not derivable from this record alone.

### Jiaoshi Yilin

```ts
type YilinTransition = {
  fromHexagram: number
  toHexagram: number
  summary: string
  originalChinese?: string
  sourceId: string
  sourceLocator: string
  displayPolicy: 'summary-only' | 'original-and-summary'
  evidenceStatus: 'reviewed' | 'provisional'
}
```

The repository key is the ordered pair `(fromHexagram, toHexagram)`. A complete edition may contain
up to 4,096 transitions; completeness and edition-specific omissions must be declared rather than
silently assumed. Rights determine whether original Chinese may be displayed. No Yilin repository is
currently connected, so destination filters report source unavailable.

### Reading conventions

The direct-moving-lines convention is structural: it shows the selected positions. A Zhu Xi/Song
text-priority convention requires a sourced 0–6 moving-line rule table. Such a convention can choose
which connected text records to display; it cannot alter the changed-line target.

## Variant preservation

Gua Bian, hidden/enveloping bodies, precelestial orders, message-hexagram correspondences, and
Cantong Qi mappings may have multiple received or modern editions. Store method/lineage, edition,
source ID, locator, rights, review status, and explicit variant ID. Present variants side by side or
require the user to select one. Never silently merge them into a synthetic “traditional” table.

The exact missing inputs and resumption checklist are tracked in
[`YIJING_TRANSFORMATION_SOURCE_INPUT_REQUIRED.md`](YIJING_TRANSFORMATION_SOURCE_INPUT_REQUIRED.md).
