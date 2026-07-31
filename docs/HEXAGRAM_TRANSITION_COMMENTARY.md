# Forest of Changes transition commentary

## Outcome

Each of the 384 deterministic single-line changes in the hexagram inspector has a compact,
source-grounded description based on the corresponding source-to-result entry in the
_Jiaoshi Yilin_ (焦氏易林), translated by Christopher Gait as _The Forest of Changes: A Han Dynasty
Extrapolation of the I Ching_.

These descriptions interpret the Forest entry attached to a transition. They are not the canonical
Zhouyi line text, a forecast, a personal reading, or a claim that the historical verse determines an
outcome.

## Source and evidence boundary

The user-supplied EPUB is treated as `user-supplied-internal`. Possession does not establish
redistribution rights, so source verses and notes remain under the Git-ignored
`content/yijing/internal/transitions/` boundary. The tracked layer contains only:

- source identity, edition metadata, checksum, and conservative rights policy;
- source, resolved-source, and changing-line locators;
- passage hashes and footnote IDs without footnote text;
- original draft themes and summaries;
- public review, provenance, and availability metadata.

The preparer verified all 4,096 source-to-result positions, indexed 2,322 notes, resolved 20
cross-references, and selected the 384 results produced by changing exactly one canonical
bottom-to-top line. Four selected routes redirect to another Forest entry:

- 27 → 23 resolves through 11 → 60;
- 29 → 8 resolves through 26 → 11;
- 31 → 28 resolves through 32 → 15;
- 57 → 59 resolves through 57 → 63.

The edition and broader scholarship both caution that traditional attribution to Jiao Yanshou is
disputed. The UI therefore names the work and translator but does not present the attribution as
settled authorship. For external orientation, see the
[Chinese Text Project bibliography entry](https://ctext.org/datawiki.pl?if=en&remap=gb&res=650547)
and Zhu Liang's SOAS thesis,
[_Occult Verse: Poetry, Divination and Classical Exegesis in Han China_](https://soas-repository.worktribe.com/output/375680/occult-verse-poetry-divination-and-classical-exegesis-in-han-china-202-bce-220-ce-a-study-of-the-han-divination-manual-jiaoshi-yilin).

## Preparation

Run the preparer only with the supplied edition:

```powershell
npm.cmd run transitions:prepare -- --source "C:\path\to\forest.epub"
```

`scripts/transitions/prepare_forest.py` verifies the package title, walks the EPUB spine, normalizes
dash variants, resolves footnotes and cross-references, and recomputes all one-line targets from
`src/domain/astrology/trigrams.ts` and `src/domain/astrology/hexagrams.ts`. It writes protected
evidence locally and tracked audit metadata under `data/hexagram-transitions/`.
The command discovers the project or bundled Python runtime; `CURRENT_FLOW_PYTHON` can select an
explicit Python 3 executable with `lxml` installed.

## Editorial and public build

The eight tracked batches under `content/yijing/drafts/transitions/` contain 48 transitions each.
Every record retains the source-passage hash produced at preparation time.

```powershell
npm.cmd run transitions:scaffold-drafts
npm.cmd run transitions:build-public
npm.cmd run transitions:validate
```

The public build requires:

- a two-to-seven-word theme;
- an 18-to-58-word original summary;
- exact identity and passage-hash agreement with the provenance index;
- no second-person, prescriptive, diagnostic, destiny, certainty, or spiritual-authority language;
- no exact eight-word overlap with the source passage when local evidence is present;
- `single-source-direct` evidence mode, `draft-only` publication, and no quotation.

It writes 64 lazy bundles under `content/yijing/generated/transitions/` and the technical review
report under `content/yijing/reports/transition-review.*`. Automated `qa-passed` is not human
editorial approval.

## Runtime and interaction

`src/features/hexagram-transitions/repository.ts` validates and caches one six-line bundle at a time.
Missing or malformed content returns a typed unavailable state and makes no network request.

`HexagramTransitionInsight.vue` appears directly below the selected line-change result. It displays
the route, theme, summary, visible draft status, source/method disclosure, and any cross-reference
redirection. It never imports or displays the protected verse or footnotes.

## Current review status

- Transition drafts: 384
- Automated QA passed: 384
- Needs revision: 0
- Human approved: 0
- Publication eligibility: draft-only

Human review should compare each paraphrase with its protected local evidence before any record is
promoted.
