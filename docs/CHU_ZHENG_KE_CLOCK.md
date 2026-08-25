# Chū–Zhèng–Kè clock

## Selected historical model and product vocabulary

Current Flow selects the 96-kè form of the Chinese clock as one documented historical model, not as
the only convention used across Chinese history. Each two-hour Shíchen contains eight 15-basis-minute
Kè. Current presents that structure at three levels:

| Level        | Historical identity                                 | Current product label                     | Semantic role                                     |
| ------------ | --------------------------------------------------- | ----------------------------------------- | ------------------------------------------------- |
| Organ System | one of twelve Earthly Branch Shíchen                | active Organ, element, Branch, and animal | immediate temporal identity                       |
| Macro Hour   | `初` Chū / `正` Zhèng                               | Entering / Established                    | subordinate maturity of the existing Hour current |
| Micro Hour   | `初刻` / `一刻` / `二刻` / `三刻` within each Macro | Phase 0 / 1 / 2 / 3                       | observational passage only in v1                  |

Methodology ID: `temporal-hour-phase:chu-zheng-ke-96-v1`, version `1.0.0`.
Macro maturity methodology: `current-hour-maturity:chu-zheng-v1`, version `1.0.0`.

No energetic, medical, alchemical, cultivation, intention, or execution meaning is assigned to a
Micro Hour. The former eight-step cultivation envelope is superseded.

## Time-basis architecture

The live provider receives an explicit UTC instant and projects it through `getZonedCivilTime` into
the selected IANA timezone. That one `local-civil` coordinate selects the Organ System, Earthly
Branch, hour pillar, Hour Hexagram, and normalized Shíchen position. The UI never reconstructs
phase from browser hour/minute fields.

`resolveLocalCivilShichenPhase()` supplies:

- a normalized `elapsedBasisMinutes` in `[0, 120)` and `totalBasisMinutes: 120`;
- authoritative current and next Shíchen identities;
- observed Shíchen start/end UTC instants;
- next minute, Micro, Macro, and Shíchen boundaries in UTC;
- warnings when an offset transition makes the real UTC span nonstandard.

The pure `calculateHourPhase()` module consumes this coordinate. Future validated
`local-mean-solar` or `apparent-solar` resolvers can implement the same contract without changing
classification or presentation. Neither mode is enabled today.

## Exact algorithm

Given exact basis position `elapsed`:

- `0 <= elapsed < 60` is Chū / Entering; `60 <= elapsed < 120` is Zhèng / Established;
- `macroElapsed = elapsed % 60`;
- `micro = floor(macroElapsed / 15)`;
- Phase 0–3 maps to `初刻`, `一刻`, `二刻`, `三刻`;
- the marker target is `floor(elapsed) / 120`, used only as internal rendering data.

The function rejects `elapsed === 120`. At the exact next boundary the authoritative resolver must
first select the next Shíchen and return zero. Classification uses seconds and milliseconds;
marker movement deliberately targets only whole basis minutes.

## Boundaries and DST

Local-civil gaps and repeats follow the repository's existing `Intl.DateTimeFormat` IANA projection
policy. Boundaries are discovered by projecting successive actual UTC minute instants through that
same engine, not by adding fixed UTC durations.

- A spring gap may skip a Macro or Micro wall label; the next observed transition wins.
- A fall repeat may repeat basis positions within the same Shíchen; both occurrences remain distinct
  UTC instants with the same projected civil label.
- The coordinate always stays in `[0, 120)` and its Organ/Branch identity remains aligned.
- A warning records a Shíchen whose actual UTC span differs from 120 minutes.

## Event model

`classifyTemporalClockEvent()` compares two authoritative states and emits one event:

1. `shichen-change` when identity or start changes;
2. `macro-hour-change` when Chū/Zhèng changes;
3. `micro-hour-change` when Phase 0–3 changes;
4. otherwise `minute-passage`.

This priority also handles missed updates after tab suspension. Minute and Micro events update
presentation. Macro regenerates guidance maturity. Shíchen fully recalculates the immediate Organ,
Branch, pillar, Hour Hexagram, phase, and guidance.

## Guidance integration

Macro maturity is subordinate to the primary Day work, Hour Hexagram, response relation, effort,
safety rules, and supported verb policy. Chū favors proportionate onset/orientation within the
already-selected response. Zhèng favors continuation/stability without increasing effort. Macro is
included in semantic resolution identity and evidence kind `macro-hour`.

The guidance validity window includes the next Macro boundary when it precedes the Shíchen end. In
Zhèng, the next Macro boundary is the Shíchen boundary. Micro boundaries are absent from semantic
identity, evidence, and validity.

## Known limitations

- Only local civil time is enabled.
- IANA timezone behavior inherits the host `Intl` database.
- Historical citation metadata for the selected 96-kè convention remains qualified; the approved
  research basis is sufficient for this product method but does not claim a universal convention.
- A fall repeat can move the visual marker to a repeated civil position; the warning and exact UTC
  bounds keep that behavior inspectable.
