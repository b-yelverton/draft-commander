---
phase: 04-dark-mode-foundation
plan: 01
subsystem: ui
tags: [css, dark-mode, theming, custom-properties, fowt-prevention]

requires: []
provides:
  - "Theme-aware color system with [data-theme] selectors for light and dark"
  - "FOWT prevention via blocking head script"
  - "All rgba() values use CSS variable channel pattern"
  - "--shimmer variable for skeleton loading gradients"
affects:
  - "All UI components now respond to data-theme attribute changes"

tech-stack:
  added: []
  patterns: [data-theme-selectors, rgba-var-channel-pattern, fowt-blocking-script, color-scheme-property]

key-files:
  created: []
  modified: [index.html]

key-decisions:
  - "Used [data-theme] attribute selectors instead of class-based theming for cleaner CSS specificity"
  - "Dark palette uses warm dark grays (#141218 base) with desaturated position colors for reduced eye strain"
  - "Added CSS utility classes (.fpick-chip-recv, .trade-chip-pick) to replace JS inline rgba() styles"
  - "Merged easing tokens into single :root block alongside spacing and radii"

patterns-established:
  - "rgba(var(--xxx-rgb), alpha) pattern for all transparent color usage"
  - "[data-theme='light'] and [data-theme='dark'] for all color token definitions"
  - "Blocking script in head for theme detection before first paint"

requirements-completed: [THEME-02, THEME-03]

duration: 172s
completed: 2026-03-08
---

# Phase 4 Plan 1: Color Token Migration & FOWT Prevention Summary

**Complete light/dark theme color system with FOWT prevention, 35 rgba() values converted to theme-aware CSS variables, and dark mode palette with warm grays and desaturated position colors**

## Performance

- **Duration:** 172s
- **Started:** 2026-03-08T14:30:18Z
- **Completed:** 2026-03-08T14:33:10Z
- **Tasks:** 2 (of 3; Task 3 is human-verify checkpoint handled by orchestrator)
- **Files modified:** 1

## Accomplishments

### Task 1: FOWT Prevention Script & Color Token Migration
- Added blocking `<script>` in `<head>` before `<style>` that reads `localStorage('theme')` or `prefers-color-scheme` and sets `data-theme` attribute before CSS parses
- Added `data-theme="light"` default on `<html>` tag
- Migrated all color tokens from `:root` to `[data-theme="light"]` and `[data-theme="dark"]` selectors
- Created dark mode palette: warm dark grays (#141218 base), desaturated position colors (QB #d04848, RB #4a8ec4, WR #48a868, TE #a068c8), off-white text (#e8e4ef)
- Added `color-scheme` property on each theme block for native form control theming
- Added `--xxx-rgb` channel variables for all position/semantic colors in both themes
- Added `--shimmer` variable in both themes (#e8e0d5 light, #33303c dark)
- Merged easing tokens from separate `:root` block into unified `:root` with spacing/radii
- **Commit:** 435f33a

### Task 2: Hardcoded rgba() Conversion
- Converted all 35 CSS `rgba()` instances to `rgba(var(--xxx-rgb), alpha)` pattern
- Replaced shimmer gradient hardcoded `#e8e0d5` with `var(--shimmer)`
- Added `.fpick-chip-recv` and `.trade-chip-pick` CSS utility classes
- Replaced 3 JS inline `rgba()` styles with CSS class references
- Final count: 0 hardcoded rgba() values, 35 theme-aware rgba() values
- **Commit:** 8c21362

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- `[data-theme="light"]` selector: present with all color tokens
- `[data-theme="dark"]` selector: present with all color tokens
- `color-scheme` property: set on both theme blocks
- Blocking FOWT script: in head before style
- Hardcoded rgba() count: 0
- Theme-aware rgba() count: 35
- Shimmer variable: used in skeleton gradient
- JS inline rgba(): all replaced with CSS classes
