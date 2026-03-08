---
phase: 06-progressive-hydration
milestone: v1.1
status: planning
requirements: [HYDRA-01, HYDRA-02, HYDRA-03]
depends_on: [04-dark-mode-foundation]
---

# Phase 6 Context: Progressive Hydration

## Goal
Background source loading produces smooth visual transitions instead of value snapping, with scroll position preserved

## Requirements
- **HYDRA-01**: When a background source (KTC, DD, DP) finishes loading, its column values fade in smoothly rather than snapping in
- **HYDRA-02**: Board scroll position is preserved when background sources load — no scroll jump on source arrival
- **HYDRA-03**: Hydration animations respect prefers-reduced-motion — instant display with no animation when reduced motion is preferred

## Success Criteria
1. User in room view sees KTC/DD/DP column values fade in smoothly as each source finishes loading — no instant snap
2. User scrolled halfway down the board does not lose their scroll position when a background source loads
3. User with prefers-reduced-motion enabled sees values appear instantly without animation

## Current State
- Source loaders (loadKTC, loadDD, loadDP) call `scheduleRoomUpdate()` on completion
- `scheduleRoomUpdate()` → `updateRoomData()` does `bp.innerHTML = renderBoardInner(...)` which destroys all DOM nodes
- Current scroll preservation: saves/restores `bp.scrollTop` around innerHTML replacement — works but causes animation replay
- `.val-pending` class shows `--` at 40% opacity for unloaded source columns
- Player rows (.p-row) rendered via string template in `renderBoardInner()` — up to 100 rows
- No `data-player-id` attributes on rows currently
- Player identity available via `p.id` (Sleeper player ID) in getBestAvailable() results
- Existing reduced-motion media query disables all animations/transitions globally
- Existing animations: rowIn (entrance stagger), cardIn (sidebar cascade), shimmer (skeletons)

## Key Technical Decisions (from research)
- Use targeted DOM updates for source hydration instead of full innerHTML replacement
- Add `data-player-id` to .p-row elements for cell targeting
- New `hydrateSourceColumn(sourceKey)` function updates only changed cells
- CSS `valIn` keyframe animation for pending-to-loaded transition
- Continue using full innerHTML replacement for pick events and filter changes
- Stagger animation delays via CSS nth-child for visual cascade
- Extend prefers-reduced-motion to cover hydration animations
- No new dependencies (no morphdom, no GSAP)

## Files to Modify
- index.html (only file — single-file app)

## Research Reference
- .planning/research/VISUAL-POLISH.md
