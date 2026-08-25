# Celestial Current validation

- Date (UTC): 2026-08-25
- Provider: `astronomy-engine` 2.1.19 (MIT)
- Assigned production status: `computed`

## Self-consistency coverage

Automated tests verify:

- Moon elongation stays in `[0, 360)`, illumination in `[0, 1]`, and solar longitude in `[0, 360)`;
- `SearchMoonPhase` results reproduce 0°, 90°, 180°, and 270° targets within `1e-6` degrees;
- previous New Moon is at or before the requested instant, while next New Moon and next quarter are
  strictly later;
- lunar age, duration, and progress are derived from ordered searched events;
- the eight phase sectors and exact New/Full turning states behave at every boundary;
- current/previous/next Solar Term events are ordered and resolve to the reviewed 15-degree table;
- every one of the 12 Jie month-sector crossings activates the new astronomical Branch at the exact
  searched crossing;
- the `Asia/Shanghai` Chinese lunar date is deterministic across host timezones, preserves leap
  months and 29/30-day month lengths, and maps days 1–30 to all six Cantong qi nodes;
- Moon, Sun, and calendar failures remain independent, returning partial status without guessed
  replacement data;
- selected and live modes use one instant, selected mode bypasses caches, and live mode recommends
  the next meaningful boundary;
- production Home renders both real instruments, details disclose event times/provider metadata,
  no degree or percentage leaks onto Home, and runtime astronomy fetches remain zero.

## Independent fixtures

No repository-owned, independently maintained JPL/USNO/Horizons golden fixture corpus is currently
accepted. The tests exercise the pinned package's exact search results and cross-check traditional
month classification against the existing independent calendrical library, but this is not enough
to label physical astronomy `verified`. Production status therefore remains `computed`.

## Tolerances

- cardinal lunar and Solar Term angular events: `1e-6` degrees;
- event ordering: exact JavaScript millisecond comparison, with a one-second forward-search epsilon
  where a strictly future event is required;
- general range checks: exact half-open normalized intervals;
- traditional date and Cantong qi classifications: exact integer/calendar equality, no tolerance.

## Known discrepancies

`astronomy-engine` and `lunar-javascript` use compatible Jie/15-degree conventions but their
ephemerides can timestamp some exact transitions a few minutes apart. Tests found this at a subset
of the 12 reviewed Jie crossings. At those instants Current Flow keeps both authorities explicit:
the Solar ring/term follows the physical crossing from `astronomy-engine`; the Four Pillars and
traditional Month Pillar remain unchanged under `lunar-javascript`; and a warning records the
temporary Branch difference. Away from the narrow transition window they agree.

This discrepancy is not silently rounded or used to infer a replacement value. Independent
boundary fixtures remain the next validation improvement.

## Verification commands

- Full repository verification: `npm run check`
- Production client build: `npm run build`
- Local isolated preview: `npm run workspace:dev`
