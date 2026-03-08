# Requirements: Draft Commander v1.1

**Defined:** 2026-03-08
**Milestone:** Design System & Visual Polish
**Core Value:** Give dynasty managers a real-time competitive edge during live drafts by aggregating multiple value sources into actionable BPA recommendations

## v1.1 Requirements

### Dark Mode & Theming

- [x] **THEME-01**: App supports dark mode and light mode with system preference detection (prefers-color-scheme) and manual toggle that persists in localStorage
- [x] **THEME-02**: No flash of wrong theme (FOWT) on page load — correct theme renders from first paint via blocking head script
- [x] **THEME-03**: All color tokens use CSS custom properties under `[data-theme]` selectors — no hardcoded rgba() values that bypass theming
- [x] **THEME-04**: Theme transition is smooth (background-color, color, border-color animate) with no transition on initial page load

### Glassmorphism & Visual Refresh

- [ ] **GLASS-01**: Sticky/overlapping elements (header, modal overlay, pick clock bar) use backdrop-filter blur with semi-transparent backgrounds
- [ ] **GLASS-02**: Glass effects degrade gracefully via @supports — unsupported browsers get solid backgrounds
- [ ] **GLASS-03**: Mobile performance is maintained — blur radius reduced or removed on phone viewport for elements with scroll interaction

### Progressive Hydration

- [ ] **HYDRA-01**: When a background source (KTC, DD, DP) finishes loading, its column values fade in smoothly rather than snapping in
- [ ] **HYDRA-02**: Board scroll position is preserved when background sources load — no scroll jump on source arrival
- [ ] **HYDRA-03**: Hydration animations respect prefers-reduced-motion — instant display with no animation when reduced motion is preferred

### Design Quality (Impeccable)

- [ ] **DESIGN-01**: Color palette is cohesive across both themes — position colors desaturated appropriately for dark mode, sufficient contrast ratios (WCAG AA)
- [ ] **DESIGN-02**: Visual hierarchy is clear — elevation through surface lightness in dark mode, consistent spacing and typography

## Deferred

- **MOBI-07**: Player rows hide individual source value columns on mobile
- **MOBI-08**: Landscape mode optimization
- **REND-02**: No horizontal scroll on any viewport (audit all fixed widths)
- **content-visibility**: Performance optimization for player rows (research flagged potential interaction with backdrop-filter)

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| THEME-01 | Phase 4 | Complete (04-02) |
| THEME-02 | Phase 4 | Complete (04-01) |
| THEME-03 | Phase 4 | Complete (04-01) |
| THEME-04 | Phase 4 | Complete (04-02) |
| GLASS-01 | Phase 5 | Pending |
| GLASS-02 | Phase 5 | Pending |
| GLASS-03 | Phase 5 | Pending |
| HYDRA-01 | Phase 6 | Pending |
| HYDRA-02 | Phase 6 | Pending |
| HYDRA-03 | Phase 6 | Pending |
| DESIGN-01 | Phase 7 | Pending |
| DESIGN-02 | Phase 7 | Pending |

**Coverage:**
- v1.1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0

---
*Requirements defined: 2026-03-08*
