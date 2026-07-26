# Handoff: Build hexagram inspection and library

- UTC timestamp: 2026-07-26T19:48:48Z
- Branch/worktree: `master` / `C:\Users\Futures Staff\Documents\Current Flow`
- Starting commit: `fb668fbd43782512ca202bb57e05b92beb8af143`
- Task/objective: Add one shared hexagram inspection modal and a complete, orderable 64-figure
  library under Other Tools.
- Status: complete, uncommitted

## Starting context

Local `master` matched `origin/master` at `fb668fb`. The pre-existing untracked
`docs/continuity/handoffs/20260724T220539Z--master--resume-cross-device-workspace.md` was recorded and
left untouched. The SPA already stored hexagram lines bottom-to-top, contained a complete numbered
King Wen line catalog, rendered four temporal hexagram cards, and computed nuclear, reverse, and
complementary relationships for the day figure. Hexagram cards were passive, no library route
existed, and Other Tools only exposed Special Messages.

## Work completed

- Extended the 64-entry catalog with received Traditional Chinese names, tone-marked pinyin, a
  Wilhelm/Baynes-style English display convention, upper/lower trigram identity, reference status,
  and a source-linked 64-entry official Gene Keys Shadow/Gift/Siddhi mapping.
- Added pure nuclear, reverse, complement, trigram-exchange, and user-selected single-line
  transformation functions. The six line controls count bottom-to-top and resolve every result
  through the verified catalog.
- Added a single app-level, keyboard-contained, responsive inspector dialog opened through
  transient non-persisted Pinia selection.
- Made existing temporal and related hexagram cards keyboard- and pointer-usable inspector entry
  points.
- Added hover and pinned trigram separation with upper/lower English, Chinese, and pinyin labels.
- Added two rows of Daoism, Confucianism, Buddhism, Psychology, Human Design, and Gene Keys
  commentary controls. All remain visibly unavailable pending reviewed texts and OLTR work.
- Added an unavailable Absolute Shadow placeholder rather than fabricating an advanced rule.
- Added `/tools/hexagrams`, a responsive 64-card grid with King Wen, bottom-up Fu Xi binary, and
  Early Heaven trigram-matrix orderings; linked it from both desktop and mobile Other Tools menus and
  added it to the sitemap.
- Added focused domain and component tests, architecture/data/calculation documentation, and an
  accepted decision record.

## Files or components changed

- `src/domain/astrology`: catalog identity, trigrams, Gene Keys vocabulary, transformations, types,
  relationships, and tests
- `src/components/hexagrams`: inspector, transformation preview, library cards, and tests
- `src/components/astrology`: clickable cards and split-capable glyph
- `src/stores/hexagramInspector.ts`
- `src/views/HexagramLibraryView.vue` and route test
- `src/app/router.ts`, `src/App.vue`, and `src/components/layout/OtherToolsMenu.vue`
- `README.md`, `docs/ARCHITECTURE.md`, `docs/DATA_INTEGRATION.md`,
  `docs/CALCULATION_SOURCES.md`, continuity decision/state, and `public/sitemap.xml`

## Decisions made

- [Establish a provenance-first hexagram reference workspace](../decisions/20260726T194513Z--establish-provenance-first-hexagram-reference-workspace.md)

## Important rationale

One local catalog and pure transformation boundary preserve the existing deterministic authority and
make every result exhaustively testable. A single app-level inspector prevents route/card
duplication and keeps modal accessibility consistent. Static, direct-source Gene Keys terms avoid a
runtime dependency. Missing commentary and undefined advanced rules remain visible as unavailable
instead of being inferred.

## Verification commands and results

- `npm.cmd run type-check` — passed strict Vue/TypeScript checking.
- `npm.cmd run lint` — passed ESLint with zero warnings.
- `npm.cmd run test:unit -- --reporter=dot` — passed after replacing unsupported jsdom `scrollTo`
  use with standards-compatible `scrollTop`.
- `npm.cmd run check` — passed strict checking, zero-warning lint, all 74 Vitest tests across 17
  files, and the Vite production build.
- Local `/tools/hexagrams` development URL — returned HTTP 200 and was opened once in the in-app
  preview. Per the site workflow and absent a user browser-testing request, no screenshot or
  interactive visual QA was performed.

## Failed or rejected approaches worth remembering

- jsdom does not implement `HTMLElement.scrollTo`; using `scrollTop = 0` provides the same modal
  reset without test-only shims.
- Fu Xi binary diagrams can be traversed in different visual directions. The implemented option
  states its convention explicitly: all-yin through all-yang with the bottom line as the least
  significant bit.

## Known risks and assumptions

- English hexagram titles vary by translation. The interface documents its display convention and
  does not treat alternatives as wrong.
- Official Gene Keys vocabulary is static source data and requires review if the publisher changes
  those terms.
- Absolute Shadow and all six commentary bodies are intentionally incomplete.
- The modal and library have unit-tested behavior and responsive CSS but did not receive interactive
  browser QA because it was not requested.

## Unresolved issues

- The user-supplied commentary corpus still needs review, source grouping, OLTR development, and
  detailed summaries for all six lenses.
- Absolute Shadow needs an accepted deterministic definition before implementation.
- No commit, push, merge, branch switch, or production publication was performed because the current
  task did not authorize those repository actions.

## Uncommitted or unmerged state

All feature, test, documentation, sitemap, decision, and this handoff changes remain uncommitted on
local `master`. The older pre-existing untracked cross-device handoff remains untouched and unrelated.

## Exact next recommended action

Review the local modal and library interaction, then explicitly authorize a scoped commit and push
when ready to publish it through the existing Cloudflare Pages pipeline.

## Relevant files, commits, issues, or external references

- [`../../CALCULATION_SOURCES.md`](../../CALCULATION_SOURCES.md)
- [`../PROJECT_STATE.md`](../PROJECT_STATE.md)
- [Chinese Text Project · Book of Changes](https://ctext.org/book-of-changes)
- [Gene Keys Living Library · Gene Key 1](https://genekeys.com/gene-key-1/)
- Starting commit: `fb668fbd43782512ca202bb57e05b92beb8af143`
