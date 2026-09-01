# Handoff: Replace iMessage social preview

- Date (UTC): 2026-09-01T01:01:30Z
- Branch: `codex/chat-01a02c2ef1c9`
- Worktree: `/Users/benkind/.codex/worktrees/1ebc/Current Flow Main`
- Starting HEAD: `0427e5ca73abef11505b57cde00575c14601d120`
- State: implemented and verified; uncommitted, unpushed, unmerged, and unpublished

## Objective

Use the user-supplied Fire Horse, luminous Taiji, and Hexagram 28 artwork as the large social preview
shown when `current-flow.net` is shared in iMessage.

## Implemented

- Resized the supplied 1731×909 RGB PNG to the standard 1200×630 Open Graph canvas without changing
  its composition and stored it as
  `public/social/current-flow-share-fire-horse-taiji-28-20260831.png`.
- Updated Open Graph image, secure image, and Twitter large-card metadata to the new cache-safe URL.
- Removed the competing square Open Graph declaration so link scrapers receive one unambiguous
  preview image. The existing square asset remains available but is no longer advertised.
- Updated the image alt text to describe the supplied artwork and tightened metadata tests around the
  sole Open Graph image and exact dimensions.

## Verification

- Original-resolution visual inspection of the generated 1200×630 asset passed.
- Focused web metadata suite: 1 file, 3 tests passed.
- Full `npm run check` passed under exact Node 22.22.2 and npm 11.4.2, including strict TypeScript,
  zero-warning lint, all application/workspace/gateway/load-policy tests, commentary and transition
  validation, and production build.
- `git diff --check` passed.
- Production build retained only Vite's existing informational large Astrology chunk warning.

## Remaining work

- Commit, push, merge, and publish only with explicit authorization.
- After publication, verify the production HTML and new image URL, then send a fresh URL variation in
  iMessage if an earlier share remains cached locally.
