---
phase: 04-dark-mode-foundation
milestone: v1.1
status: planning
requirements: [THEME-01, THEME-02, THEME-03, THEME-04]
depends_on: []
---

# Phase 4 Context: Dark Mode Foundation

## Goal
App supports dark and light themes with system preference detection, manual toggle, and smooth transitions — no flash of wrong theme (FOWT).

## Requirements
- **THEME-01**: System preference detection + manual toggle with localStorage persistence
- **THEME-02**: No FOWT — correct theme from first paint via blocking head script
- **THEME-03**: All color tokens use CSS custom properties under [data-theme] selectors — no hardcoded rgba()
- **THEME-04**: Smooth theme transitions (background-color, color, border-color) with no transition on initial load

## Current State
- All color tokens already in :root as CSS custom properties (line 10-18)
- 38 hardcoded rgba() values in CSS that bypass theming
- 3 inline rgba() values in JS template literals (lines 1314, 1326, 1341)
- No dark mode support exists
- No theme toggle exists

## Key Technical Decisions (from research)
- Use [data-theme="light"] / [data-theme="dark"] on <html> for variable definitions
- Blocking <script> in <head> before <style> for FOWT prevention
- Add --xxx-rgb channel variables for rgba() replacement
- color-scheme property on each theme block for native form control theming
- .no-transitions class to suppress transition on initial load

## Hardcoded rgba() Inventory (38 instances)
Grouped by base color:
- rgba(28,23,16,...) — 7 uses (shadow/subtle backgrounds) → --shadow-rgb
- rgba(184,74,28,...) — 7 uses (accent tints) → --accent-rgb
- rgba(180,32,32,...) — 2 uses (danger) → --danger-rgb
- rgba(168,32,32,...) — 3 uses (QB) → --qb-rgb
- rgba(26,91,143,...) — 2 uses (RB) → --rb-rgb
- rgba(29,122,62,...) — 2 uses (WR) → --wr-rgb
- rgba(123,63,158,...) — 2 uses (TE) → --te-rgb
- rgba(166,117,53,...) — 4 uses (pick/accent2) → --pick-rgb
- rgba(42,126,59,...) — 3 uses (live/green) → --live-rgb
- rgba(158,142,124,...) — 2 uses (muted) → --text3-rgb
- rgba(210,153,34,...) — 2 uses (gold, in JS) → --pick-rgb
- rgba(63,185,80,...) — 1 use (green, in JS) → --live-rgb
- Total: 38 CSS + 3 JS inline

## Files to Modify
- index.html (only file — single-file app)

## Research Reference
- .planning/research/DESIGN-SYSTEM.md
