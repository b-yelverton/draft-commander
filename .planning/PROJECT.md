# Draft Commander

## What This Is

A dynasty fantasy football live draft assistant deployed as a single-file static app on Vercel. Users connect to their Sleeper draft and get composite BPA rankings from multiple value sources (FantasyCalc, KeepTradeCut, Dynasty Daddy, DynastyProcess, custom CSV), positional scarcity alerts, run detection, trade-back opportunities, opponent profiling, and Monte Carlo scarcity simulations — all updating live every 10 seconds.

## Core Value

Give dynasty managers a real-time competitive edge during live drafts by aggregating multiple value sources into actionable BPA recommendations and mid-draft trade evaluation.

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

### Active

- [ ] App is responsive and usable on phone, tablet, and desktop
- [ ] Source loading state doesn't cause visual overflow/breakage when entering room view

### Out of Scope

- Multi-file refactoring or build tooling — current single-file architecture is intentional and working
- Server-side proxy for CORS — adds infrastructure complexity beyond current scope
- Unit test extraction — requires module system changes outside this milestone

## Context

- Single-file static app: `index.html` (~1970 lines) with inline CSS and JS
- No framework — vanilla JS with global state object `S` and full DOM re-render via `innerHTML`
- Existing responsive: one `@media(max-width:1000px)` breakpoint that stacks the room grid to single column
- Room view uses CSS Grid: `1fr 340px` with 340px sidebar for recommendations + recent picks + scarcity
- Source loading is async: FantasyCalc awaited before room entry, KTC/DD/DP fire-and-forget in background
- When background sources load, they call `render()` which rebuilds the entire DOM — this is when the visual overflow occurs
- Header contains source status pills that update independently via `updatePills()`

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
| Full DOM re-render on state change | Simple mental model for single-file app | ⚠️ Revisit (causes input loss, scroll reset) |

---
*Last updated: 2026-03-08 after initialization*
