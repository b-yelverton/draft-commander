# Draft Commander

## What This Is

A dynasty fantasy football live draft assistant deployed as a single-file static app on Vercel. Users connect to their Sleeper draft and get composite BPA rankings from multiple value sources (FantasyCalc, KeepTradeCut, Dynasty Daddy, DynastyProcess, custom CSV), positional scarcity alerts, run detection, trade-back opportunities, opponent profiling, and Monte Carlo scarcity simulations — all updating live every 10 seconds.

## Core Value

Give dynasty managers a real-time competitive edge during live drafts by aggregating multiple value sources into actionable BPA recommendations and mid-draft trade evaluation.

## Current State

**Shipped:** v1.0 — Responsive Design & Loading UX (2026-03-08)

v1.0 delivered loading stability (targeted subtree updates, skeleton loading, rAF batching), mobile-first responsive layout (phone/tablet/desktop breakpoints), and mobile component polish (header collapse, tab scroll-snap, 44px touch targets). 10 requirements, 3 phases, 6 plans.

### Capabilities
- Responsive across phone (< 600px), tablet (600-1000px), and desktop (1000px+)
- Stable rendering during background source loading with skeleton placeholders
- Mobile header collapses to logo + live indicator, tabs scroll-snap horizontally
- All interactive elements meet 44px touch targets on mobile
- Setup, loading, and draft selection screens adapted for phone viewports

## Requirements

### Validated

- ✓ User can connect to a Sleeper draft by username or draft ID — existing
- ✓ App fetches and displays composite BPA rankings from FantasyCalc, KTC, Dynasty Daddy, DynastyProcess, and custom CSV — existing
- ✓ User can filter board by position (ALL, QB, RB, WR, TE) and rookies toggle — existing
- ✓ App shows recommendations with BPA, positional scarcity, and value steals — existing
- ✓ App detects positional runs and alerts user — existing
- ✓ App detects trade-back opportunities via tier analysis — existing
- ✓ User can evaluate trades with enhanced multi-source trade evaluator — existing
- ✓ App profiles opponent builds showing roster composition and needs — existing
- ✓ Monte Carlo scarcity simulation shows probability of landing starters at each position — existing
- ✓ User can adjust source weights via sliders on Sources tab — existing
- ✓ App polls live draft state every 10 seconds with live indicator — existing
- ✓ Value chart tracks pick values against ADP in real time — existing
- ✓ KTC paste fallback when CORS proxy fails — existing
- ✓ Source data cached in localStorage across sessions — existing
- ✓ Deployed on Vercel as zero-build static site — existing
- ✓ App is responsive and usable on phone, tablet, and desktop — v1.0
- ✓ Source loading state doesn't cause visual overflow/breakage when entering room view — v1.0

### Out of Scope

- Multi-file refactoring or build tooling — current single-file architecture is intentional and working
- Server-side proxy for CORS — adds infrastructure complexity beyond current scope
- Unit test extraction — requires module system changes outside this milestone

## Context

- Single-file static app: `index.html` (~2050 lines) with inline CSS and JS
- No framework — vanilla JS with global state object `S`
- Source loaders use targeted subtree updates via scheduleRoomUpdate() with rAF batching
- renderBoardInner() and renderSidebarInner() enable surgical DOM updates without full re-render
- Mobile-first CSS: base styles for phone, @media(min-width:1000px) for desktop
- Phone breakpoint @media(max-width:599px) for header, room-top, trade-sides
- Header updates pills independently via updatePills()

## Constraints

- **Architecture**: Must remain a single `index.html` file — no build step, no modules
- **Deployment**: Vercel static site, zero build configuration
- **Dependencies**: Zero production dependencies — all client-side vanilla JS
- **Browser**: Modern browsers with async/await, CSS Grid, custom properties

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Single-file architecture | Zero build complexity, instant deployment | ✓ Good |
| Vanilla JS, no framework | No dependencies, full control | ✓ Good |
| Targeted subtree updates | Replaced full DOM re-render for source loading paths | ✓ Good (v1.0) |
| Mobile-first CSS approach | Base styles target mobile, min-width restores desktop | ✓ Good (v1.0) |

## Next Milestone: v1.1 — Design System & Visual Polish

- Dark mode with system preference detection + manual toggle
- Modern glass/blur aesthetic (glassmorphism on sticky elements)
- Progressive source hydration (fade-in animations, scroll preservation)
- Design quality pass with Impeccable audit
- 12 requirements across 4 phases (4-7)

---
*Last updated: 2026-03-08 after v1.0 completion*
