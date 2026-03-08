# Requirements: Draft Commander

**Defined:** 2026-03-08
**Core Value:** Give dynasty managers a real-time competitive edge during live drafts by aggregating multiple value sources into actionable BPA recommendations

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Loading & Render Stability

- [ ] **LOAD-01**: Room view does not visually break or overflow when background sources (KTC, DD, DP) load and trigger re-render
- [ ] **LOAD-02**: Board column layout remains stable as sources load — columns always occupy their slots regardless of data availability
- [ ] **LOAD-03**: Sidebar shows skeleton placeholders with shimmer animation while background sources are still loading
- [ ] **LOAD-04**: Source loading does not cause full-page flash or layout shift visible to the user

### Mobile Layout

- [ ] **MOBI-01**: Room view uses single-column layout on phone viewports (< 600px) with sidebar content below the main panel
- [ ] **MOBI-02**: Room view uses adapted layout on tablet viewports (600px–1000px) with appropriate content stacking
- [ ] **MOBI-03**: Header collapses on mobile — source pills hidden, shows logo and live indicator only
- [ ] **MOBI-04**: Room tabs are horizontally scrollable on narrow viewports without overflow
- [ ] **MOBI-05**: All interactive elements (buttons, tabs, filters) meet 44px minimum touch target on mobile viewports
- [ ] **MOBI-06**: Setup screen, loading screen, and draft selection screen are usable on phone viewports

## v2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Render Quality

- **REND-01**: Scroll position preserved across re-renders (board panel, sidebar, chart panels)
- **REND-02**: No horizontal scroll on any viewport — all fixed pixel widths audited and replaced with responsive equivalents

### Mobile Enhancement

- **MOBI-07**: Player rows hide individual source value columns on mobile, showing composite rank + position + name only
- **MOBI-08**: Landscape mode optimization restores two-column layout on tablets in landscape orientation
- **MOBI-09**: Progressive source hydration — columns fade in smoothly when data arrives

## Out of Scope

| Feature | Reason |
|---------|--------|
| Hamburger menu | Hides navigation behind extra tap — too slow during live draft |
| Separate mobile render paths | Doubles code in single-file architecture, leads to divergence |
| CSS framework (Tailwind/Bootstrap) | Requires build step, adds dependency |
| Pull-to-refresh | App already polls every 10 seconds |
| Dark mode toggle | Scope creep — separate milestone |
| Virtual scrolling | Over-engineering for 200-300 rows |
| Native app wrapper | Massive complexity for a seasonal tool |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| LOAD-01 | — | Pending |
| LOAD-02 | — | Pending |
| LOAD-03 | — | Pending |
| LOAD-04 | — | Pending |
| MOBI-01 | — | Pending |
| MOBI-02 | — | Pending |
| MOBI-03 | — | Pending |
| MOBI-04 | — | Pending |
| MOBI-05 | — | Pending |
| MOBI-06 | — | Pending |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 0
- Unmapped: 10 ⚠️

---
*Requirements defined: 2026-03-08*
*Last updated: 2026-03-08 after initial definition*
