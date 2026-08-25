# Handoff: Activate the local Celestial Current ephemeris

- Date (UTC): 2026-08-25T22:35:46Z
- Branch: `codex/chat-01a02c2ef0ac-2`
- Worktree: `/Users/benkind/.codex/worktrees/6dc6/Current Flow Main`
- Starting HEAD: `9e116ce251e5f37ae1b5bb5b4622687d4db0f566`
- Implementation commit: `a23078d2e7310c7122668424bf76fe42c2619d0d`
- Status: unmerged feature work; implementation and verification complete

## Objective

Resolve the staged Celestial Current source gate with real local astronomy, preserve the existing
traditional Chinese calendar authority, activate the Lunar/Solar instruments on production Home,
synchronize live and selected instants, and leave a tested Cloudflare Pages-compatible result with
no runtime astronomy network request.

## Implemented

- Pinned `astronomy-engine` 2.1.19 (MIT) in npm and pnpm lockfiles.
- Added a pure typed `AstronomyEngineCelestialProvider` for Moon elongation, illumination, phase,
  searched New Moon/quarter events, Sun true ecliptic-of-date longitude, and exact Solar Term
  searches.
- Added strict absolute-instant normalization, typed errors, bounded searches, deterministic phase
  boundaries, methodology metadata, and small capped event caches.
- Kept `lunar-javascript` 1.7.7 as the sole traditional calendar authority and added explicit
  `Asia/Shanghai` lunar date, leap-month/month-length, exact Month Pillar Branch, and Cantong qi
  mapping.
- Added `LocalDeterministicCelestialCurrentProvider` with independent Moon/Sun/calendar failures,
  partial status, sanitized warnings, production presentation caches, and exact next-wake guidance.
- Activated `CelestialCurrentHeader` and real Lunar/Solar details in production
  `CurrentFlowGlance`; the temporal snapshot, celestial snapshot, and clock enforce one instant.
- Preserved the segmented four-second live clock and froze it in selected-time mode. Selected mode
  bypasses presentation caches and marker interpolation.
- Kept Year/Day/Month, Organ/Hour, OLTR, provenance, responsive hierarchy, and the fixture-only
  development gallery intact.
- Added exact term-to-annual-movement metadata as a Current semantic formalization and preserved the
  existing physical/calendar Branch authorities when their exact boundary timestamps differ.

## Verification

- `npm run check` — passed:
  - strict TypeScript and zero-warning lint passed;
  - 48 unit-test files / 392 tests passed;
  - 11 workspace isolation tests passed;
  - commentary and transition validators passed;
  - production Vite/Cloudflare Pages build passed with 467 modules transformed.
- Focused provider and integration coverage includes range/boundary/error cases, exact searched
  lunar events, all phase sectors, previous/current/next Solar Terms, all 12 Jie Branch crossings,
  `Asia/Shanghai` leap/month-length behavior, all six Cantong qi nodes, partial failures, caches,
  selected-time synchronization, production Home, and zero `fetch` calls.
- Browser-platform ESM probe passed with no Node-only import; output was 108,859 bytes. This static
  Pages repository has no Worker/Pages Functions astronomy bundle and therefore no duplicate copy.
- Lazy Astrology chunk: 437.34 kB / 138.21 kB gzip baseline to 531.57 kB / 175.56 kB gzip current
  (+94.23 kB / +37.35 kB gzip). Main shared JS increased only +0.64 kB / +0.33 kB gzip.
- Real production Home passed at 417×801 and 1280×720 in dark/light review: no horizontal overflow,
  no instrument/clock overlap, one shared instant, correct real data/details, and no application
  console warnings or errors.
- Production 150% text passed at both available browser surfaces with natural vertical scrolling
  and no horizontal clipping/overlap. Reduced-motion media behavior and explicit mode passed
  automated coverage.
- The real production route passed an exact 375×667, 390×844, 393×852, 430×932, 768×1024,
  1366×768, and 1728×1000 iframe viewport matrix. All seven had two instruments, clock and OLTR,
  no horizontal overflow, no instrument/clock or header/card overlap, and markers contained within
  their rings.

## Validation status and discrepancy

Celestial Current is correctly production-visible with `computed` status. No independently
maintained golden ephemeris corpus is accepted yet, so it is not labeled `verified`.

At a subset of exact Jie crossings, `astronomy-engine` and `lunar-javascript` timestamp the same
conventional boundary a few minutes apart. The Solar ring follows the searched physical crossing;
Four Pillars and the traditional Month Pillar retain their existing calendar authority; and a
warning exposes the narrow disagreement. No rounding, hidden override, or replacement inference is
performed.

## Durable records

- Accepted decision: `docs/continuity/decisions/20260825T222827Z--adopt-local-astronomy-engine-celestial-provider.md`
- Provider contract: `docs/CELESTIAL_EPHEMERIS_PROVIDER.md`
- Validation report: `docs/CELESTIAL_CURRENT_VALIDATION.md`
- Historical gate: `docs/CELESTIAL_CURRENT_MANUAL_INPUT_REQUIRED.md` (resolved by `a23078d`)

`PROJECT_STATE.md` was not edited because this is unmerged feature work, not an authorized
integration task.

## Next useful action

Review and integrate this branch through the normal Current Flow merge/release process when
authorized. A future validation task may add independently maintained ephemeris golden fixtures and
promote status from `computed` only after that review.
