# Chū–Zhèng–Kè validation

## Automated fixture matrix

The pure phase suite covers exact positions 0, 15, 30, 45, 60, 75, 90, and 105 plus the millisecond
immediately before each boundary through `119:59.999`. It verifies Macro, semantic label, Micro,
Chinese Kè, whole-minute marker quantization, and rejection of stale position 120.

Event fixtures cover minute, Micro, Macro, and Shíchen changes; Shíchen-over-Macro and
Macro-over-Micro priority; and the rule that only Macro/Shíchen refresh guidance.

## Time-basis fixtures

- local-civil resolution with seconds and milliseconds;
- the same absolute instant in New York and Los Angeles;
- a deterministic 1999 controlled historical/simulation instant;
- New York spring-forward 2026-03-08, where Chǒu spans 60 real UTC minutes and the skipped Macro
  boundary resolves at the next Shíchen;
- New York fall-back 2026-11-01, where Chǒu spans 180 real UTC minutes and repeated 01:30 labels
  remain in the same Shíchen and phase;
- normalized coordinate, authoritative start/end, next boundary, warning, Branch, and Organ
  agreement.

The tests deliberately do not assert a fixed 120-minute UTC span across DST.

## Semantic and provider fixtures

Resolver tests prove Chū→Zhèng changes resolution identity and `HourMaturity` while preserving
Primary Current, response relation, effort, field, and temporal Hexagram identity. Guidance evidence
contains `macro-hour` and has no Micro source kind. OLTR tests demonstrate relation-compatible onset
versus continuation selection without changing response or effort.

Provider integration checks 11:59, 12:00, 12:15, and the next Shíchen in New York. Organ, Branch,
pillar, and Hour Hexagram remain unchanged at Macro; guidance regenerates at Macro; Micro reuses the
same guidance object; Shíchen recalculates the full immediate state. Validity ends at Macro or an
earlier existing semantic boundary and excludes Micro.

## UI and scheduler fixtures

Component tests assert `ORGAN SYSTEM`, Organ/element, Branch/animal, Macro/Micro labels, three major
nodes, six minor nodes, eight segments, `次`, shared Taiji use, whole-minute marker targets,
initial/reset transition policy, detailed eight-Kè structure, accessible summary, and absence of
progress/countdown language. Scheduler tests cover exact alignment, recursive sampling, and frozen
selected instants.

## Methodology status

- 96-kè structure: selected historical product model, qualified rather than universal.
- Macro maturity: Current formalization, deterministic and subordinate.
- Micro Hour: observational ordinal only.
- Historical-source metadata: current sources support the selected model; further specialized
  historiographic review is a future enhancement, not a calculation blocker.

The exact full-repository and browser verification results are recorded in the task handoff after
execution rather than predicted here.
