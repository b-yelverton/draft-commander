---
phase: 05-glassmorphism-visual-refresh
milestone: v1.1
status: planning
requirements: [GLASS-01, GLASS-02, GLASS-03]
depends_on: [04-dark-mode-foundation]
---

# Phase 5 Context: Glassmorphism & Visual Refresh

## Goal
Key UI surfaces use modern glass/blur aesthetics that enhance depth and visual hierarchy

## Requirements
- **GLASS-01**: Sticky/overlapping elements (header, modal overlay, pick clock bar) use backdrop-filter blur with semi-transparent backgrounds
- **GLASS-02**: Glass effects degrade gracefully via @supports — unsupported browsers get solid backgrounds
- **GLASS-03**: Mobile performance is maintained — blur radius reduced or removed on phone viewport for elements with scroll interaction

## Success Criteria
1. Sticky header shows blurred content scrolling beneath it in both light and dark modes
2. Modal overlay uses increased blur for depth separation
3. On a phone viewport, glass effects are reduced or removed to maintain smooth scrolling
4. In a browser without backdrop-filter support, the app displays solid backgrounds with no visual breakage

## Current State
- Phase 4 (dark mode) complete — all color tokens in [data-theme="light"]/[data-theme="dark"]
- RGB channel variables exist: --shadow-rgb, --accent-rgb, --qb-rgb, etc.
- Missing: --surface-rgb (needed for glass backgrounds)
- .modal-overlay already has backdrop-filter:blur(2px) but no @supports guard or -webkit- prefix
- .hdr is sticky (top:0, z-index:100) with opaque background:var(--surface)
- .section-hdr is sticky (top:0, z-index:5) with opaque background:var(--surface)
- .pos-filters is sticky (top:32px, z-index:4) — sits below .section-hdr
- .room-top is grid-area, not sticky — blur visibility depends on content overlap

## Key Technical Decisions (from research)
- Add --surface-rgb, --glass-blur, --glass-opacity variables to both theme blocks
- Use @supports (backdrop-filter: blur(1px)) for progressive enhancement
- Always include -webkit-backdrop-filter prefix for Safari < 18
- Dark mode needs higher glass opacity (0.78 vs 0.72) for text contrast
- Apply glass to .hdr, .modal-overlay, .room-top, .section-hdr
- Do NOT apply glass to .pos-filters (double-blur with .section-hdr) or .p-row (100+ elements)
- Mobile: reduce --glass-blur to 8px, remove glass from .section-hdr entirely
- Keep .modal solid (no glass) — double blur with .modal-overlay looks over-processed

## Files to Modify
- index.html (only file — single-file app)

## Research Reference
- .planning/phases/05-glassmorphism-visual-refresh/05-RESEARCH.md
- .planning/research/DESIGN-SYSTEM.md (sections 4, 6)
