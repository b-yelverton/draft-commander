# Roadmap: Draft Commander -- Responsive Design & Loading UX

**Created:** 2026-03-08
**Granularity:** Standard
**Total v1 Requirements:** 10
**Phases:** 3

## Phases

- [x] **Phase 1: Loading Stability** - Fix visual overflow and layout shift caused by background source loading
- [ ] **Phase 2: Mobile Layout** - Restructure room view and non-room screens for phone and tablet viewports
- [ ] **Phase 3: Mobile Component Polish** - Adapt header, tabs, and interactive elements for mobile usability

## Phase Details

### Phase 1: Loading Stability
**Goal**: Room view remains visually stable as background data sources load -- no overflow, no flash, no layout shift
**Depends on**: Nothing (first phase, active bug fix)
**Requirements**: LOAD-01, LOAD-02, LOAD-03, LOAD-04
**Success Criteria** (what must be TRUE):
  1. User enters room view with only FantasyCalc loaded, and when KTC/DD/DP finish loading in the background, the board and sidebar update without any visible overflow, flash, or layout jump
  2. Board columns (rank, name, position, value) occupy their full grid slots immediately on room entry, even before all sources have loaded -- no column width snapping when data arrives
  3. Sidebar sections display shimmer skeleton placeholders while their data is pending, then smoothly replace with real content when available
  4. User watching the room view during a live draft sees source pills update in the header but experiences zero layout disruption in the board or sidebar areas
**Plans:** 2 plans
Plans:
- [x] 01-01-PLAN.md -- Stabilize board columns and add skeleton loading placeholders
- [x] 01-02-PLAN.md -- Targeted subtree updates with rAF batching for source loaders

### Phase 2: Mobile Layout
**Goal**: Room view and all pre-room screens are usable on phone and tablet viewports without horizontal scrolling or content clipping
**Depends on**: Phase 1 (stable rendering required before layout restructuring)
**Requirements**: MOBI-01, MOBI-02, MOBI-06
**Success Criteria** (what must be TRUE):
  1. User on a phone (< 600px) sees the room view as a single scrollable column with the board panel on top and sidebar content stacked below -- no content is hidden or clipped
  2. User on a tablet (600px-1000px) sees an adapted room layout with appropriate content stacking that uses available width without reverting to the desktop two-column grid
  3. User on a phone can navigate through the setup screen, loading screen, and draft selection screen without any element overflowing the viewport or requiring horizontal scroll
**Plans**: TBD

### Phase 3: Mobile Component Polish
**Goal**: Individual UI components (header, tabs, buttons, filters) are adapted for touch interaction and narrow viewports
**Depends on**: Phase 2 (mobile layout foundation must be in place)
**Requirements**: MOBI-03, MOBI-04, MOBI-05
**Success Criteria** (what must be TRUE):
  1. User on a phone sees a simplified header showing the logo and live indicator only -- source status pills are hidden to save vertical space
  2. User on a narrow viewport can horizontally swipe through all room tabs without any tab being cut off or overflowing the screen edge
  3. User can tap any button, tab, or filter control on a phone without accidentally hitting adjacent elements -- all interactive targets are at least 44px in both dimensions
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Loading Stability | 2/2 | Complete | 2026-03-08 |
| 2. Mobile Layout | 0/? | Not started | - |
| 3. Mobile Component Polish | 0/? | Not started | - |

---
*Roadmap created: 2026-03-08*
*Last updated: 2026-03-08*
