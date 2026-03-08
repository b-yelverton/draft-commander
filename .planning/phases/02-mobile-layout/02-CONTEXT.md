# Phase 2: Mobile Layout - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Restructure room view and non-room screens for phone and tablet viewports. The room view currently uses a CSS Grid `1fr 340px` layout with a fixed 340px sidebar. On phones (< 600px), this must become a single scrollable column with board on top and sidebar stacked below. On tablets (600px-1000px), an adapted layout that uses available width without reverting to the desktop two-column grid. All pre-room screens (setup, loading, draft selection) must be usable on phone viewports without horizontal scroll or content clipping.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
User elected to skip discussion — all implementation decisions are at Claude's discretion:

- **Breakpoint strategy:** Phase 1 uses `max-width: 1000px`. Phase 2 switches to mobile-first `min-width` breakpoints (600px, 1000px) per STATE.md technical context
- **Room layout stacking:** Decide how board and sidebar stack on phone — whether sidebar sections collapse, accordion, or just stack linearly
- **Tablet adaptation:** Decide layout approach for 600px-1000px range — could be narrower two-column, single column with wider content, or hybrid
- **Non-room screens:** Decide how setup form, loading screen, and draft selection cards adapt to narrow viewports
- **Board table on mobile:** Decide which columns to show/hide on narrow viewports (note: MOBI-07 column hiding is v2/deferred, but basic readability is in scope)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The key constraints:
1. Must work within single-file `index.html` architecture with no build step
2. Must not break the Phase 1 targeted subtree update pattern (`scheduleRoomUpdate()`, `renderBoardInner()`, `renderSidebarInner()`)
3. Mobile-first `min-width` breakpoints per project convention decision

</specifics>

<code_context>
## Existing Code Insights

### Current Responsive State
- Single `@media(max-width:1000px)` breakpoint exists (CSS section)
- Room grid: `.room-grid { display: grid; grid-template-columns: 1fr 340px; }`
- Sidebar: fixed 340px width
- Board panel: `overflow-x: auto` for horizontal scroll
- Header: contains source pills, logo, live indicator — all in a row

### Key CSS Areas
- CSS custom properties (design tokens) at top of `<style>`
- Room grid layout styles
- Board table styles with fixed column widths
- Setup screen form styles
- Loading screen styles
- Draft selection card grid

### Render Functions (from Phase 1)
- `renderBoardInner()` — board panel content (targeted updates)
- `renderSidebarInner()` — sidebar content (targeted updates)
- `renderSetup()` — setup form view
- `renderLoading()` — loading spinner view
- `renderDraftSelect()` — draft card selection view
- `renderRoom()` — full room view (contains board + sidebar grid)

### Integration Points
- Phase 1's `scheduleRoomUpdate()` with rAF batching — CSS-only changes won't conflict
- `bindEvents()` — must continue to work after layout changes
- `updatePills()` — header pills update independently

</code_context>

<deferred>
## Deferred Ideas

- MOBI-07: Player rows hide individual source value columns on mobile (v2)
- MOBI-08: Landscape mode optimization (v2)
- MOBI-09: Progressive source hydration column fade-in (v2)

</deferred>

---

*Phase: 02-mobile-layout*
*Context gathered: 2026-03-08*
