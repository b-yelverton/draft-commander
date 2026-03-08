# Codebase Structure

**Analysis Date:** 2026-03-08

## Directory Layout

```
draft-commander/
├── .git/                # Git repository
├── .planning/           # GSD planning documents
│   └── codebase/        # Codebase analysis docs (this file)
├── .vercel/             # Vercel deployment config (gitignored)
├── node_modules/        # Dependencies (gitignored)
├── tests/               # Playwright E2E tests
│   └── sources.spec.js  # Data source loading tests
├── test-results/        # Playwright test output (gitignored)
├── .gitignore           # Git ignore rules
├── index.html           # THE ENTIRE APPLICATION (~1969 lines)
├── package.json         # Dev dependencies only (Playwright, serve)
├── package-lock.json    # Lockfile
├── playwright.config.js # Test runner configuration
└── vercel.json          # Deployment config (headers, no build)
```

## Directory Purposes

**Root (`/`):**
- Purpose: Contains the entire application as a single-file static site
- Contains: `index.html` (the app), deployment configs, test setup
- Key files: `index.html`, `vercel.json`, `package.json`

**`tests/`:**
- Purpose: Playwright E2E tests for external data source loading
- Contains: One spec file testing all four automated data sources
- Key files: `tests/sources.spec.js`

**`test-results/`:**
- Purpose: Playwright test output artifacts
- Contains: Last run metadata
- Generated: Yes
- Committed: No (gitignored)

**`.vercel/`:**
- Purpose: Vercel project metadata
- Contains: `project.json` with org/project IDs
- Generated: Yes
- Committed: No (gitignored)

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents
- Contains: Architecture and structure analysis
- Generated: By GSD mapping commands
- Committed: Yes

## Key File Locations

**Entry Points:**
- `index.html`: The entire application -- HTML, CSS, and JavaScript in one file. This is the only application code file.

**Configuration:**
- `vercel.json`: Vercel deployment -- no build command, output directory is root (`.`), security headers (X-Frame-Options: DENY, X-Content-Type-Options: nosniff)
- `playwright.config.js`: Test config -- testDir `./tests`, 60s timeout, local dev server on port 3999 via `npx serve`, supports `BASE_URL` env var for testing deployed instances
- `package.json`: Dev dependencies only -- `@playwright/test` ^1.58.2, `serve` ^14.2.6

**Core Logic (all in `index.html`):**
- Lines 8-348: CSS (design system, component styles, animations)
- Lines 350-366: HTML shell (header, `#app` mount)
- Lines 367-405: Constants, persistence helpers, state initialization
- Lines 407-412: Sleeper API client functions
- Lines 414-639: Data source loaders (FC, KTC, DD, DP, CSV)
- Lines 641-751: Value engine (multi-source aggregation, divergence)
- Lines 753-847: Draft logic (BPA, recommendations, pick tracking)
- Lines 852-875: Polling and status pill updates
- Lines 878-1191: Core render functions (setup, loading, draft select, room, board, sources)
- Lines 1193-1449: Feature renders (value chart, trade evaluator)
- Lines 1451-1800: Feature modules (runs, tiers, opponents, future picks, Monte Carlo)
- Lines 1802-1822: Modal rendering
- Lines 1825-1882: Event binding
- Lines 1884-1960: Connection/bootstrap flow
- Lines 1962-1967: Vercel analytics scripts

**Testing:**
- `tests/sources.spec.js`: Tests for FantasyCalc, KTC, Dynasty Daddy, DynastyProcess data loading. Also tests CORS proxy resilience (bad proxy fallback).

## Naming Conventions

**Files:**
- `kebab-case`: `index.html`, `vercel.json`, `playwright.config.js`
- Test files: `*.spec.js` pattern

**JavaScript Functions (in `index.html`):**
- `camelCase` for all functions: `loadFC()`, `parseKTC()`, `getBestAvailable()`, `renderBoard()`
- Prefix `render` for view functions: `renderSetup()`, `renderRoom()`, `renderValueChart()`
- Prefix `load` for data source loaders: `loadFC()`, `loadKTC()`, `loadDD()`, `loadDP()`
- Prefix `get` for data accessors: `getMyPicks()`, `getNextPick()`, `getSourceValue()`
- Prefix `detect`/`profile`/`run` for analysis functions: `detectRuns()`, `detectTiers()`, `profileOpponents()`, `runTEPScarcitySim()`

**CSS Classes (in `index.html`):**
- Short abbreviated names: `.hdr`, `.btn`, `.sb-rec`, `.p-row`, `.p-pos`, `.p-val`
- BEM-like but informal: `.hdr-logo`, `.hdr-live`, `.src-pill`, `.pick-clock`, `.draft-card`
- Position modifiers: `.p-QB`, `.p-RB`, `.p-WR`, `.p-TE`, `.p-PICK`
- State modifiers: `.active`, `.on`, `.off`, `.loading`, `.live`, `.used`, `.next`

**CSS Variables:**
- Design tokens with `--` prefix: `--bg`, `--surface`, `--text`, `--accent`
- Position colors: `--qb`, `--rb`, `--wr`, `--te`, `--pick`
- Source colors: `--fc-color`, `--ktc-color`, `--dd-color`, `--dp-color`, `--csv-color`
- Spacing scale: `--sp-xs` through `--sp-3xl`
- Border radius: `--radius-sm`, `--radius-md`, `--radius-lg`

**State Keys:**
- `S.view`: View routing string (`'setup'`, `'loading'`, `'draftSelect'`, `'room'`)
- `S.roomTab`: Tab routing string (`'board'`, `'chart'`, `'trade'`, `'opponents'`, `'scarcity'`, `'sources'`)
- `S.sources.[key]`: Source data objects keyed by abbreviation (`fc`, `ktc`, `dd`, `dp`, `csv`)

**localStorage Keys:**
- Prefixed with `draftcmdr_`: `draftcmdr_username`, `draftcmdr_weights`, `draftcmdr_ktc_cache`, `draftcmdr_dd_cache`, `draftcmdr_dp_cache`, `draftcmdr_csv_cache`

## Where to Add New Code

**New Feature:**
- Primary code: Add JavaScript inside the `<script>` tag in `index.html`, before `render()` call at line 1960
- Feature logic: Group with existing feature modules (after line 1800)
- Render function: Add near other render functions (lines 878-1191 or 1193-1449)
- CSS: Add to `<style>` block before closing `</style>` tag (before line 348)
- Tab: Add tab button in `renderRoom()` at line 1032-1037, add tab content dispatch at lines 1045-1050

**New Data Source:**
- Add source config to `S.sources` object at line 397
- Create `load[Name]()` function following the pattern of `loadDD()` or `loadDP()`
- Add source key to `getSourceRanks()` at line 659 and the render functions
- Add pill to `updatePills()` source list at line 868
- Add to weight slider list in `renderSourcesPanel()` at line 1141

**New Tab in Room View:**
- Add `<button class="room-tab">` in `renderRoom()` at line 1032
- Add rendering branch in the ternary chain at line 1045
- Create `render[TabName]()` function
- Bind tab click already handled by generic `.room-tab` handler in `bindEvents()`

**New Test:**
- Add to `tests/sources.spec.js` or create new `tests/*.spec.js` file
- Tests use Playwright, run against a local `serve` instance or deployed URL
- Access app globals via `page.evaluate()` -- functions and state object `S` are on `window`

**Utilities:**
- Add helper functions in the script section of `index.html`, grouped logically with related code
- No separate utility files -- everything is in `index.html`

## Special Directories

**`.vercel/`:**
- Purpose: Vercel CLI project configuration
- Generated: Yes, by `vercel` CLI
- Committed: No (in `.gitignore`)

**`node_modules/`:**
- Purpose: npm dependencies (Playwright, serve)
- Generated: Yes, by `npm install`
- Committed: No (in `.gitignore`)

**`test-results/`:**
- Purpose: Playwright test artifacts and last-run metadata
- Generated: Yes, by Playwright test runner
- Committed: No (in `.gitignore`)

## Important Architectural Notes

**Single-File Constraint:** The entire application is deliberately contained in `index.html`. There is no `src/` directory, no component files, no module system. When adding features, all code goes into this single file.

**No Build Step:** The app is served directly as a static HTML file. There is no TypeScript, no JSX, no bundler. `vercel.json` specifies `"buildCommand": ""` and `"outputDirectory": "."`.

**Global Scope:** All JavaScript functions and the state object `S` are in the global scope. Tests rely on this -- they call functions like `loadFC()`, `loadKTC()` directly via `page.evaluate()`.

**innerHTML Rendering:** The entire `#app` div content is replaced on every render. This means all DOM state (scroll positions, input focus, cursor positions) is lost on re-render. Input values that need to survive renders must be read and stored in state before `render()` is called.

---

*Structure analysis: 2026-03-08*
