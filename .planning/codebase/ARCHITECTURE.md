# Architecture

**Analysis Date:** 2026-03-08

## Pattern Overview

**Overall:** Single-file monolithic SPA (no build step, no framework)

**Key Characteristics:**
- Entire application lives in one `index.html` file (~1969 lines) with inline CSS and JavaScript
- No framework -- vanilla JS with manual DOM rendering via string template literals
- Global mutable state object (`S`) drives all UI rendering
- Immediate-mode rendering: every state change calls `render()` which replaces `innerHTML` entirely, then `bindEvents()` re-attaches all event handlers
- No build pipeline, no bundler, no transpilation -- served as a static file
- Deployed to Vercel as a static site with zero build configuration

## Layers

**Presentation (CSS):**
- Purpose: All visual styling for the application
- Location: `index.html` lines 8-348 (inside `<style>` tag)
- Contains: CSS custom properties (design tokens), component styles, animations, responsive breakpoints
- Depends on: Nothing
- Used by: HTML structure and render functions

**HTML Shell:**
- Purpose: Minimal DOM skeleton -- header bar and mount point
- Location: `index.html` lines 350-366
- Contains: Header with logo, source pills, tip jar link, live indicator, and `<div id="app">` mount point
- Depends on: CSS layer
- Used by: Render functions inject content into `#app`

**State Management:**
- Purpose: Single global state object that drives all rendering decisions
- Location: `index.html` lines 387-403 (the `S` object)
- Contains: View state, draft data, user info, source data, UI toggles, trade evaluator state
- Depends on: Persistence layer for initial hydration
- Used by: Every render function and data function reads/writes `S`

**Persistence:**
- Purpose: Cache external data and user preferences in localStorage
- Location: `index.html` lines 373-384 (helper functions and initial loads)
- Contains: `saveLocal()`, `loadLocal()`, `clearLocal()` with `draftcmdr_` key prefix
- Depends on: Browser localStorage API
- Used by: State initialization, source data caching (KTC, DD, DP, CSV), weight preferences, username

**API / Data Sources:**
- Purpose: Fetch player valuations from multiple external services
- Location: `index.html` lines 368-638
- Contains: Sleeper API client, FantasyCalc loader, KTC scraper/parser, Dynasty Daddy loader, DynastyProcess CSV parser, custom CSV upload
- Depends on: External APIs, CORS proxies for KTC/DD
- Used by: State (populates `S.sources.*`), value engine

**Value Engine:**
- Purpose: Composite ranking and player analysis across multiple sources
- Location: `index.html` lines 644-751
- Contains: `getSourceValue()`, `normalizeValue()`, `getSourceRanks()`, `getPlayerAnalysis()` -- weighted rank aggregation, divergence detection
- Depends on: Source data in `S.sources`
- Used by: Board rendering, recommendations, trade evaluator, scarcity sim

**Draft Logic:**
- Purpose: Core draft mechanics -- pick tracking, BPA computation, recommendations
- Location: `index.html` lines 753-847
- Contains: `resolvePlayer()`, `getDraftedIds()`, `getMyPicks()`, `getBestAvailable()`, `getRecommendations()` -- player resolution, snake/linear pick calculation, value steal detection
- Depends on: Value engine, Sleeper player DB, source data
- Used by: All room-view render functions

**Feature Modules:**
- Purpose: Distinct analytical features built on top of draft logic
- Location: `index.html` lines 1451-1800
- Contains:
  - Positional run detection (`detectRuns()` -- lines 1452-1473)
  - Trade-back calculator with tier detection (`detectTiers()`, `getTradeBackOpportunities()` -- lines 1476-1555)
  - Opponent build profiling (`profileOpponents()` -- lines 1561-1604)
  - Future rookie pick valuation (`FUTURE_PICK_VALUES`, `getFuturePickValue()` -- lines 1638-1706)
  - Monte Carlo scarcity simulation (`runTEPScarcitySim()` -- lines 1712-1800)
- Depends on: Draft logic, value engine
- Used by: Render functions

**Rendering:**
- Purpose: Generate HTML strings for each view and tab
- Location: `index.html` lines 878-1822
- Contains: `render()` dispatcher, `renderSetup()`, `renderLoading()`, `renderDraftSelect()`, `renderRoom()`, `renderBoard()`, `renderValueChart()`, `renderTradeEvalEnhanced()`, `renderOpponentProfiles()`, `renderScarcitySim()`, `renderSourcesPanel()`, `renderModal()`
- Depends on: State (`S`), draft logic, value engine, feature modules
- Used by: Called after every state mutation

**Event Handling:**
- Purpose: Bind DOM events after each render cycle
- Location: `index.html` lines 1825-1882 (`bindEvents()`)
- Contains: Click handlers for buttons, input listeners, slider changes, modal interactions, keyboard shortcuts
- Depends on: DOM elements created by render functions
- Used by: Called by `render()` after innerHTML replacement

**Polling:**
- Purpose: Live draft updates via periodic API polling
- Location: `index.html` lines 852-875
- Contains: `startPolling()`, `stopPolling()`, `pollDraft()` -- 10-second interval, `updatePills()` for source status indicators
- Depends on: Sleeper API
- Used by: Activated when entering room view via `connectToDraft()`

**Bootstrap / Flow Control:**
- Purpose: Entry points and navigation between views
- Location: `index.html` lines 1884-1960
- Contains: `handleConnect()` (username/draft ID lookup, draft list fetch), `connectToDraft()` (full initialization sequence)
- Depends on: All layers
- Used by: User interaction from setup view

## Data Flow

**Initial Connection Flow:**

1. User enters Sleeper username or draft ID on setup screen
2. `handleConnect()` looks up user via Sleeper API, fetches drafts for 2024-2026 seasons
3. If multiple drafts found, shows draft selection view; if one or one live, auto-connects
4. `connectToDraft()` loads draft metadata, league info, picks, Sleeper player DB
5. FantasyCalc loaded synchronously (awaited), KTC/DD/DP loaded in background (fire-and-forget)
6. View switches to `room`, polling starts at 10-second intervals

**Live Draft Polling Flow:**

1. `pollDraft()` fetches current draft state and picks from Sleeper API every 10 seconds
2. If pick count changed, `render()` is called to update the entire UI
3. Header live indicator updates independently of full renders

**Render Cycle:**

1. Any state change triggers `render()`
2. `render()` reads `S.view` to pick which view function to call
3. View function generates HTML string from current state
4. `innerHTML` of `#app` is replaced entirely
5. `bindEvents()` re-attaches all event listeners to new DOM elements
6. `updatePills()` refreshes source status indicators in header

**Multi-Source Value Aggregation:**

1. Each source (FC, KTC, DD, DP, CSV) stores player data keyed by normalized name or Sleeper ID
2. `getPlayerAnalysis()` gathers ranks from all live sources for a player
3. Composite rank computed as weighted average (user-adjustable weights, persisted to localStorage)
4. `getBestAvailable()` sorts all undrafted players by composite rank
5. Divergence detection flags players ranked differently across sources

**State Management:**
- Single global `S` object holds all application state
- No immutability -- state is mutated directly (`S.view = 'room'`)
- Every mutation must be followed by `render()` to update UI
- localStorage used for persistence of: username, source weights, cached source data (KTC, DD, DP, CSV)

## Key Abstractions

**Player Resolution:**
- Purpose: Unify player identity across multiple data sources
- Examples: `resolvePlayer()` at line 763, `normName()` at line 642
- Pattern: FantasyCalc uses Sleeper IDs as primary keys; other sources use normalized names (`normName()` strips everything except lowercase letters). Kickers in draft picks are mapped to "2026 Pick X.XX" format as rookie pick proxies.

**Source System:**
- Purpose: Pluggable data source architecture
- Examples: `S.sources.fc`, `S.sources.ktc`, `S.sources.dd`, `S.sources.dp`, `S.sources.csv`
- Pattern: Each source has `{data, status, max, weight, label, color}`. Status lifecycle: `idle` -> `loading` -> `live|error|unavailable|parse-error`. Data keyed by normalized name (or Sleeper ID for FC). Each source has independent load function and parser.

**CORS Proxy Chain:**
- Purpose: Bypass browser CORS restrictions for KTC and Dynasty Daddy
- Examples: `KTC_PROXIES` array at line 370
- Pattern: Three proxy services tried in sequence (codetabs, corsproxy.io, allorigins). If proxy returns HTML error page instead of expected data, it's skipped. Fallback: manual paste modal for KTC.

**View System:**
- Purpose: Navigate between application screens
- Examples: `S.view` values: `'setup'`, `'loading'`, `'draftSelect'`, `'room'`
- Pattern: Simple string-based view routing. Room view has sub-tabs via `S.roomTab`: `'board'`, `'chart'`, `'trade'`, `'opponents'`, `'scarcity'`, `'sources'`.

## Entry Points

**Page Load:**
- Location: `index.html` line 1960 (`render()`)
- Triggers: Browser loads the HTML file
- Responsibilities: Renders the setup view, restores cached data from localStorage

**handleConnect():**
- Location: `index.html` line 1884
- Triggers: User clicks "Connect to Draft" button or presses Enter in setup form
- Responsibilities: User lookup, draft discovery, navigation to draft select or room

**connectToDraft():**
- Location: `index.html` line 1934
- Triggers: Direct draft ID entry, draft card click, or auto-connect for single/live drafts
- Responsibilities: Full initialization -- loads draft, league, picks, player DB, all value sources, starts polling

## Error Handling

**Strategy:** Try-catch with graceful degradation and inline error display

**Patterns:**
- API failures caught in each loader function; source status set to `'error'` or `'unavailable'`; app continues without that source
- `render()` wrapped in try-catch (line 880); on error, displays error message with stack trace directly in the app
- CORS proxy failures silently skipped; next proxy tried automatically
- Missing data handled with fallback values (`||0`, `||999`, `||'?'`, `||'Unknown'`)
- User-facing errors shown via `S.error` displayed as `.err` div on setup screen

## Cross-Cutting Concerns

**Logging:** `console.error()` for API failures and parse errors; `console.log()` for debug output (e.g., KTC parse count)

**Validation:** Minimal -- input parsing uses regex with fallback (`parsePick()`, `getFuturePickValue()`). No form validation library.

**Authentication:** None -- the app is fully client-side. Sleeper API is public/unauthenticated. User identified by username lookup only.

**Analytics:** Vercel Analytics and Speed Insights loaded via external scripts at bottom of `index.html` (lines 1962-1967)

---

*Architecture analysis: 2026-03-08*
