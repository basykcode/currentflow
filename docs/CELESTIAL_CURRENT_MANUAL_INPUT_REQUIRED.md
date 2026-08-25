# Celestial Current source decision

Decision:
Use local `astronomy-engine` adapter.

Resolution commit:
`a23078d2e7310c7122668424bf76fe42c2619d0d`

Status:
Resolved

The record below is retained as the historical pre-decision gate. See
`docs/CELESTIAL_EPHEMERIS_PROVIDER.md` and `docs/CELESTIAL_CURRENT_VALIDATION.md` for the accepted
boundary and current validation status.

## Historical gate

MANUAL PRODUCT OR TECHNICAL DECISION REQUIRED

Blocker: The repository has no Global Conditions Engine and no authoritative continuous Moon or Sun astronomical source.
Affected instrument: Both Lunar Current and Solar Current production Home instruments.
Repository paths inspected: `src/domain/astrology`, `src/domain/time`, `src/providers`, `src/components/astrology`, `package.json`, installed `lunar-javascript` declarations, and all local Git refs/history.
Current authoritative data: `LunarScriptCurrentFlowProvider` supplies Four Pillars, Jie month boundaries, Organ/Shíchen/Chū–Zhèng–Kè state, hexagrams, and guidance. It does not supply lunar elongation/illumination/lunation progress or continuous solar longitude.
Conflicting data or UI requirement: The requested rings require continuous astronomical positions, while the current source has only calendrical GanZhi and solar-term boundary data. Home must consume Global Conditions and must not add or imitate astronomy in Vue.
Why independent inference would be unsafe: Deriving phase from lunar date, season from browser month, or longitude from a categorical term would fabricate precision and violate the single-source/provenance boundary. Adding a second astronomy library without review would silently choose methodology, accuracy, time-scale, and licensing policy.
Work already completed: Typed Global Conditions seam; fail-closed Lunar and Solar presenters; all reviewed labels; season, Branch, marker, and shortest-path geometry; Moon/Sun/ring/header/details components; explicit unavailable states; fixture gallery; reduced-motion behavior; focused tests; architecture, accessibility, and methodology documentation.
Decision required: Name the authoritative production owner for lunar elongation, illumination, lunation progress, waxing/waning, continuous solar longitude, Solar Term identity, Branch month, Cantong qi node, annual Yin/Yang movement, event boundaries, status, warnings, and methodology IDs.
Recommended choice: Extend the canonical provider boundary with one reviewed Global Conditions adapter that computes or receives the full snapshot once, then pass its typed fields through the completed presenters. Select its ephemeris/library or service, accuracy target, event-boundary convention, and license in an accepted decision record before implementation.
Alternative: Keep Celestial Current unavailable in production and ship only the existing Home until an upstream Global Conditions service is available.
Consequence of each: The recommended choice unlocks accurate instruments, scheduler integration, selected-time behavior, and production details but requires a reviewed astronomical dependency or service. The alternative preserves current correctness and dependency boundaries but does not deliver the visible Moon/Sun Home feature.
Validation command: `npm run check`
Resume command: Run `npm run workspace:doctor`, implement the approved Global Conditions adapter, wire `CelestialCurrentHeader` into `CurrentFlowGlance`, then run `npm run check` and the documented viewport matrix.
