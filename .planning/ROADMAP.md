# Roadmap: Draft Commander

## Completed Milestones

- [x] **v1.0 — Responsive Design & Loading UX** (2026-03-08) — 3 phases, 6 plans, 10 requirements | [Archive](milestones/v1.0-ROADMAP.md)

## Current Milestone: v1.1 — Design System & Visual Polish

**Created:** 2026-03-08
**Total Requirements:** 12
**Phases:** 4

## Phases

- [ ] **Phase 4: Dark Mode Foundation** - Theme toggle, color token migration, FOWT prevention (2 plans)
- [ ] **Phase 5: Glassmorphism & Visual Refresh** - Backdrop-filter effects, gradient backgrounds, glass surfaces
- [ ] **Phase 6: Progressive Hydration** - Targeted column updates, fade-in animations, scroll preservation
- [ ] **Phase 7: Design Quality Pass** - Impeccable-guided color audit, contrast verification, visual consistency

## Phase Details

### Phase 4: Dark Mode Foundation
**Goal**: App supports dark and light themes with system preference detection, manual toggle, and smooth transitions — no FOWT
**Depends on**: Nothing (foundational for all visual work)
**Requirements**: THEME-01, THEME-02, THEME-03, THEME-04
**Success Criteria** (what must be TRUE):
  1. User with OS set to dark mode loads the app and sees dark theme from first paint — no white flash
  2. User clicks theme toggle in header and the app smoothly transitions between light and dark modes
  3. User's theme choice persists across page reloads via localStorage
  4. All UI elements respond to theme change — no hardcoded colors remain that ignore the active theme
**Plans:** 2 plans
Plans:
- [ ] 04-01-PLAN.md -- Color token migration to [data-theme] selectors, dark palette, rgba() conversion, FOWT prevention
- [ ] 04-02-PLAN.md -- Theme toggle button, smooth transitions, system preference listener

### Phase 5: Glassmorphism & Visual Refresh
**Goal**: Key UI surfaces use modern glass/blur aesthetics that enhance depth and visual hierarchy
**Depends on**: Phase 4 (theme tokens must be in place for glass effects to work in both modes)
**Requirements**: GLASS-01, GLASS-02, GLASS-03
**Success Criteria** (what must be TRUE):
  1. Sticky header shows blurred content scrolling beneath it in both light and dark modes
  2. Modal overlay uses increased blur for depth separation
  3. On a phone viewport, glass effects are reduced or removed to maintain smooth scrolling
  4. In a browser without backdrop-filter support, the app displays solid backgrounds with no visual breakage

### Phase 6: Progressive Hydration
**Goal**: Background source loading produces smooth visual transitions instead of value snapping, with scroll position preserved
**Depends on**: Phase 4 (animation colors must use theme-aware variables)
**Requirements**: HYDRA-01, HYDRA-02, HYDRA-03
**Success Criteria** (what must be TRUE):
  1. User in room view sees KTC/DD/DP column values fade in smoothly as each source finishes loading — no instant snap
  2. User scrolled halfway down the board does not lose their scroll position when a background source loads
  3. User with prefers-reduced-motion enabled sees values appear instantly without animation

### Phase 7: Design Quality Pass
**Goal**: Both themes have cohesive, accessible color palettes with clear visual hierarchy — verified by Impeccable audit
**Depends on**: Phases 4, 5, 6 (all visual work must be in place before quality audit)
**Requirements**: DESIGN-01, DESIGN-02
**Success Criteria** (what must be TRUE):
  1. Position-coded colors (QB/RB/WR/TE) are distinguishable and appropriately saturated in both themes
  2. All text meets WCAG AA contrast ratios against its background in both themes
  3. Visual hierarchy reads clearly — surfaces, cards, and interactive elements have consistent elevation

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 4. Dark Mode Foundation | 0/2 | Pending | -- |
| 5. Glassmorphism & Visual Refresh | 0/? | Pending | -- |
| 6. Progressive Hydration | 0/? | Pending | -- |
| 7. Design Quality Pass | 0/? | Pending | -- |

---
*Roadmap created: 2026-03-08*
*Last updated: 2026-03-08*
