---
phase: 01-loading-stability
plan: 02
subsystem: targeted-subtree-updates
tags: [rendering, raf-batching, scroll-preservation, performance]
dependency_graph:
  requires: [shimmer-css, stable-board-columns, sidebar-skeletons]
  provides: [scheduleRoomUpdate, updateRoomData, renderBoardInner, renderSidebarInner]
  affects: [loadKTC, parseKTC, parseKTCPaste, loadDD, loadDP, renderBoard, renderRoom]
tech_stack:
  added: []
  patterns: [requestAnimationFrame-batching, scroll-position-preservation, targeted-innerHTML]
key_files:
  created: []
  modified: [index.html]
decisions:
  - renderSidebarInner computes teams internally from S.draft to keep call sites simple
  - updatePills() called synchronously before scheduleRoomUpdate() since pills are outside #app
  - loadFC and parseCSV left on full render() path (FC is synchronous pre-room, CSV is manual action)
metrics:
  duration: 193s
  completed: "2026-03-08T05:11:53Z"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 01 Plan 02: Targeted Subtree Updates Summary

rAF-batched surgical DOM updates for board and sidebar when background sources load, with scroll position preservation.

## What Was Done

### Task 1: Extract board and sidebar inner rendering into standalone functions (43a17c8)
- Created `renderBoardInner(ba,recs)` extracting inner content of board-panel div
- Created `renderSidebarInner(recs,recent)` extracting inner content of sidebar div
- `renderBoard()` now delegates: `<div class="board-panel">${renderBoardInner(ba,recs)}</div>`
- `renderRoom()` sidebar now uses: `<div class="sidebar">${renderSidebarInner(recs,recent)}</div>`
- Pure structural extraction with zero behavior change

### Task 2: Add rAF-batched targeted update and rewire source loaders (c37e307)
- Added `_roomUpdatePending` boolean gate preventing stacked rAF callbacks
- Added `scheduleRoomUpdate()` that batches updates via `requestAnimationFrame`
- Added `updateRoomData()` that surgically replaces board-panel and sidebar innerHTML
- Scroll position captured before and restored after innerHTML replacement in both panels
- Falls back to full `render()` if user navigated away from room view
- Rewired `loadKTC`, `parseKTC`, `parseKTCPaste`, `loadDD`, `loadDP` to call `scheduleRoomUpdate()` instead of `render()`
- Left `loadFC`, `parseCSV`, and `pollDraft` on existing `render()` path (correct behavior)

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 43a17c8 | refactor(01-02): extract renderBoardInner and renderSidebarInner functions |
| 2 | c37e307 | feat(01-02): add rAF-batched targeted updates and rewire source loaders |

## Self-Check: PASSED
