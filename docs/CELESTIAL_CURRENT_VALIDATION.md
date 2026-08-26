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

## Bundle and deployment results

Against starting commit `9e116ce251e5`, the lazy Astrology JavaScript chunk changed from
437.34 kB / 138.21 kB gzip to 531.57 kB / 175.56 kB gzip: **+94.23 kB minified and +37.35 kB
gzip**. The route remains lazy; the main shared JavaScript changed only from 288.19 kB / 90.67 kB
gzip to 288.83 kB / 91.00 kB gzip. Production CSS changed from 29.79 kB / 6.00 kB gzip to
41.06 kB / 7.75 kB gzip as the previously staged instruments became part of production Home.

`npm run check` transformed 467 modules and completed the exact Cloudflare Pages production command
`npm run build`. The repository has no Wrangler, Worker, or Pages Functions bundle. A separate
browser-platform ESM probe of `src/domain/astronomy/index.ts` produced a 108,859-byte bundle and
resolved no Node-only API, confirming the shared domain is compatible with the web-runtime boundary
without creating a duplicate server bundle.

## Browser and accessibility results

The real production Home was inspected in the in-app browser at its available 417×801 phone and
1280×720 desktop surfaces. Both had two real instruments, matched temporal/celestial instants, no
horizontal overflow, and no Moon/clock or Sun/clock overlap. Lunar and Solar dialogs exposed only
their own event rows and both disclosed `astronomy-engine` 2.1.19. Dark and light themes were
inspected; the console contained no application warning or error.

At 150% root text, the same production Home passed on 417×801 and 1280×720 with no horizontal
overflow or instrument/clock overlap; natural vertical scrolling was available. Reduced-motion
behavior is enforced by both the system media query and the explicit component mode and is covered
by automated tests.

The real production route also passed an exact same-origin iframe viewport matrix at 375×667,
390×844, 393×852, 430×932, 768×1024, 1366×768, and 1728×1000. Every viewport reported its exact
requested inner dimensions, two instruments, a visible clock and OLTR, no horizontal overflow, no
Moon/clock or Sun/clock overlap, no header/card overlap, and both Taiji markers inside their rings.

## Verification commands

- Full repository verification: `npm run check`
- Production client build: `npm run build`
- Local isolated preview: `npm run workspace:dev`
