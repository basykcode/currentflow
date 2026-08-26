# Decision: Adopt a continuous four-second clock dissolve

- Status: accepted
- Date (UTC): 2026-08-26
- Scope: Current Flow Home clock timing, motion, and accessibility
- Supersedes: the 1.5-second duration in
  `20260825T215745Z--adopt-segmented-four-second-clock-dissolve.md`

## Context

The segmented clock already targets regular four-second wall-clock boundaries and keeps hours,
minutes, seconds, and the blue colon anchors independently stable. Jun requested a motion variation
in which seconds never pause between dissolves: each transition should occupy the entire cadence,
with minute and hour transitions using the same duration only when those values change.

## Decision

Use one four-second constant for both the seconds sampling cadence and the canonical dissolve
duration. Start the transition toward each seconds target at the preceding four-second boundary,
land it at the target boundary, and begin the next transition immediately. The cycles are contiguous
and use one scheduled boundary at a time; they do not overlap.

Keep hours and minutes independently keyed so unchanged values remain static. When either rolls over,
that segment joins the same four-second transition as seconds. Keep both blue colons outside the
transitions. A first render, delayed-timer recovery, or visibility resume may join the already-active
interval at its elapsed phase by applying a negative transition delay. The declared dissolve duration
therefore remains exactly four seconds while the target still lands on its wall-clock boundary.
Reduced-motion behavior remains unchanged.

## Alternatives rejected

- Retain the 1.5-second dissolve and a 2.5-second rest: does not provide the requested perpetual
  seconds motion.
- Start a new four-second dissolve more frequently than every four seconds: overlaps transition
  cycles and obscures the boundary cadence.
- Re-key the entire time string on every seconds target: unnecessarily moves unchanged hours,
  minutes, and the colon anchors.
- Chain transitions from their visual completion instead of wall time: timer throttling would make
  the displayed clock drift.

## Consequences

Seconds remain visually in transition except at the instantaneous handoff between adjacent targets.
Hours and minutes retain their settled presentation between their own changes. The scheduler still
resynchronizes after delayed execution instead of replaying missed boundaries, and the accessible
clock label continues to expose the authoritative target without a continuously announcing live
region.

## Verification criteria

Unit tests must demonstrate a single scheduled boundary, exact four-second handoffs, stable
hours/minutes/colons between their changes, synchronized hour rollover, delayed-timer recovery, and
static selected-instant behavior. The repository check and a live-browser timing inspection must
also pass, with no accumulation of visual digit layers across consecutive seconds cycles.
