# Phase 1: Loading Stability - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix visual overflow and layout shift caused by background source loading. When the user enters the room view, FantasyCalc is loaded but KTC, DD, and DP load in the background. As each source completes and triggers `render()`, the board and sidebar should update without any visible overflow, flash, or layout jump. Add skeleton loading placeholders for pending data.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
User elected to skip discussion — all implementation decisions are at Claude's discretion:

- **Skeleton appearance:** Choose appropriate shimmer/placeholder style consistent with the app's warm earth-tone design system
- **Source arrival UX:** Decide how new data appears when a source finishes loading (instant swap, fade, silent)
- **Board column strategy:** Decide whether to always render column slots, hide columns until data, or use placeholder values — key goal is eliminating the layout shift that currently occurs
- **Render optimization:** Decide approach to prevent full-page flash (targeted DOM updates, render batching, conditional re-render)
- **Sidebar loading state:** Decide skeleton structure for recommendations and scarcity sections while sources load

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The key constraint is that the fix must work within the single-file `index.html` architecture with no build step.

</specifics>

<code_context>
## Existing Code Insights

### Root Cause
- `renderBoard()` conditionally renders source columns via JS (`${hasKtc?...}`), so when background sources finish loading and trigger `render()`, new DOM elements widen the row beyond the panel boundary
- Background source loaders (`loadKTC()`, `loadDD()`, `loadDP()`) each call `render()` independently when they complete (lines 474, 546, 581)
- The room grid is `1fr 340px` with `overflow: hidden` — content that doesn't fit is clipped

### Reusable Assets
- `updatePills()` (line 866): Already does targeted DOM updates for source status pills without full re-render — pattern exists for selective updates
- CSS custom properties and design tokens: `--surface2`, `--border`, `--text3` available for skeleton styling
- Existing animations: `@keyframes blink`, `@keyframes sp` (spinner) — shimmer animation fits the pattern

### Established Patterns
- Global state object `S` with direct mutation + `render()` call
- `innerHTML` replacement for full view updates
- Source status lifecycle: `idle` → `loading` → `live|error|unavailable|parse-error`
- `bindEvents()` called after every render to reattach event handlers

### Integration Points
- `render()` function (line 878): Entry point for all view updates
- `renderBoard()`: Board panel generation with conditional source columns
- `renderRoom()` sidebar section: Recommendations, recent picks, scarcity
- Source loader callbacks: `loadKTC()`, `loadDD()`, `loadDP()` — where they call `render()`

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-loading-stability*
*Context gathered: 2026-03-08*
