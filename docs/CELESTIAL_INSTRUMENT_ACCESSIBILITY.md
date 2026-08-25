# Celestial instrument accessibility

## Cluster semantics

Each Moon or Sun cluster is one native button. Its celestial body, ring, marker, and three values are
inside the same generous target; users never need to hit a small Taiji, tick, or Chinese character.
The global `:focus-visible` ring surrounds the cluster, and a local border reinforces that whole-target
focus state.

The internal SVG is decorative because the button already supplies one concise accessible name.
Ring characters are therefore not announced individually. The accessible names include the actual
phase/season, tone-marked Pinyin, English decode, movement, and active Solar Branch where available.
There is no continuously updating live region.

## Chinese decoding

Primary informational Chinese terms use `ChineseTermInline`: characters, Pinyin, and English remain
adjacent in visible content. Dense ring symbols may remain Chinese-only because the active state is
decoded in the adjacent Home text or Branch badge and in the button's accessible name. Active state
uses a visible backing shape and font weight in addition to color.

## Motion

`prefers-reduced-motion: reduce` disables both marker interpolation and Taiji self-rotation. The
development gallery also has a forced reduced-motion representation for deterministic review. The
ring itself never rotates. Text, marker position, and active-state emphasis remain understandable
without animation.

## Zoom, text, and responsive behavior

The three semantic values are never line-clamped or hidden. At enlarged text, content wraps and the
document scrolls naturally. Grid children use shrink-safe tracks, and the outer clusters switch to a
stacked compact presentation at mobile widths. Compact-height behavior may hide only nonessential
clock date/timezone metadata, never the title, minute clock, or six instrument values.

The component does not set page overflow, so browser zoom cannot trap or clip the document. Existing
app safe-area padding and the global minimum width continue to apply.

## Details behavior

The lightweight details shell is a labelled modal dialog. Opening moves focus into the dialog;
Escape, the Close button, or backdrop click closes it and returns focus to the triggering cluster.
Exact technical values are exposed as definition lists, with warnings and explicit unavailable
labels. An unavailable instrument retains a retry event and does not substitute guessed content.
