---
phase: 03-mobile-component-polish
plan: 02
subsystem: ui
tags: [css-specificity, mobile-header, gap-closure]

requires:
  - phase: 03-01
    provides: "Header collapse and mobile component polish"
provides:
  - "Tip button hidden on mobile via increased CSS specificity"
  - "Switch Draft button visible across all views when drafts exist"
affects: []

tech-stack:
  added: []
  patterns: [css-specificity-override]

key-files:
  created: []
  modified: [index.html]

key-decisions:
  - "Used .hdr-right .tip-btn specificity increase instead of reordering CSS source"
  - "Show Switch Draft button whenever S.draftList.length > 0, with view-adaptive onclick behavior"

patterns-established: []

requirements-completed: [MOBI-03]

duration: manual
completed: 2026-03-08
---

# Phase 3 Plan 2: Mobile Header Gap Closure Summary

**Fix tip button CSS specificity defeat and Switch Draft button visibility across views**

## Performance

- **Type:** Gap closure (UAT fix)
- **Tasks:** 2 (1 auto + 1 human checkpoint)
- **Files modified:** 1

## Accomplishments
- Tip button now hidden on mobile (< 600px) via `.hdr-right .tip-btn{display:none}` — specificity 0,2,0 beats base rule's 0,1,0
- Switch Draft button visible whenever user has connected drafts (S.draftList.length > 0), not just in room view
- Mobile header consistent across room and draftSelect screens
- Desktop layout unaffected — tip button and all elements visible at 1000px+

## Fixes Applied

1. **CSS specificity fix** — Changed `.tip-btn{display:none}` to `.hdr-right .tip-btn{display:none}` in @media(max-width:599px) block
2. **JS visibility logic** — Switch Draft button shown when `S.draftList.length > 0` with view-adaptive onclick: room+multiple→draftSelect, room+single→setup, other→setup+clear

## Files Modified
- `index.html` — Line 72 CSS specificity increase, lines 1903-1912 switchDraftBtn logic refactor

## UAT Verification
- User approved via Vercel preview deployment
- Both gaps from 03-UAT.md confirmed closed

## Deviations from Plan
None — plan executed exactly as written.

---
*Phase: 03-mobile-component-polish*
*Completed: 2026-03-08*

## Self-Check: PASSED
