# Coding Conventions

**Analysis Date:** 2026-03-08

## Architecture Pattern

**Single-file static app.** All HTML, CSS, and JavaScript live in `index.html` (~1970 lines). No build step, no bundler, no framework. The file is structured in three sequential blocks:

1. `<style>` block (lines 8-348): All CSS
2. HTML body (lines 350-366): Header + `<div id="app"></div>` mount point
3. `<script>` block (lines 367-1960): All application JavaScript

## Naming Patterns

**Functions:**
- Use `camelCase` for all functions: `getBestAvailable()`, `pollDraft()`, `renderRoom()`
- Prefix render functions with `render`: `renderSetup()`, `renderBoard()`, `renderModal()`
- Prefix data loaders with `load`: `loadFC()`, `loadKTC()`, `loadDD()`, `loadDP()`
- Prefix getters with `get`: `getMyPicks()`, `getNextPick()`, `getOwnerName()`
- Prefix boolean checks with `is`: `isKicker()`, `isRookie()`
- Prefix parsers with `parse`: `parseKTC()`, `parseKTCPaste()`, `parseCSV()`, `parsePick()`
- Prefix detectors with `detect`: `detectRuns()`, `detectTiers()`

**Variables:**
- Use `camelCase` for local variables and state properties
- Use `UPPER_SNAKE_CASE` for constants: `SLEEPER`, `FC_API`, `KTC_PROXIES`, `LS_PREFIX`, `FUTURE_PICK_VALUES`
- Single-letter variables used freely in tight loops and lambdas: `d`, `p`, `r`, `e`, `k`, `v`, `mx`
- Underscore prefix for restored/cached state: `_savedUsername`, `_savedWeights`, `_savedKtc`

**CSS Classes:**
- Use short abbreviated BEM-like names with hyphens: `.p-row`, `.p-name`, `.p-val`, `.sb-rec`, `.hdr-live`
- Position-specific classes use uppercase: `.p-QB`, `.p-RB`, `.p-WR`, `.p-TE`, `.p-PICK`
- State modifiers as simple class additions: `.active`, `.on`, `.off`, `.live`, `.used`, `.next`
- Component prefixes: `hdr-` (header), `sb-` (sidebar), `p-` (player), `opp-` (opponent), `mc-` (monte carlo), `dc-` (draft card), `tb-` (trade back)

**HTML IDs:**
- Use `camelCase` for element IDs: `srcPills`, `liveIndicator`, `liveText`, `connectBtn`, `usernameInput`

## Code Style

**Formatting:**
- No formatter configured. No `.prettierrc`, `.eslintrc`, or `biome.json` present.
- Heavily compressed/minified style throughout JavaScript: multiple statements per line separated by semicolons.
- CSS is minified on the first line (`*{margin:0;padding:0;box-sizing:border-box}`) then becomes more readable for complex rules.
- Consistent use of `const` and `let` (no `var`).
- Arrow functions used extensively for callbacks and short functions.
- Template literals used exclusively for HTML generation (no JSX, no DOM API).

**Linting:**
- No linter configured.

**Line density pattern:** Code is deliberately compressed. A typical function packs logic densely:
```javascript
function normName(n){return(n||'').toLowerCase().replace(/[^a-z]/g,'');}
```

```javascript
const getDraft=id=>fetchJSON(`${SLEEPER}/draft/${id}`);
```

Multi-statement lines are the norm:
```javascript
S.sources.fc.status='loading';updatePills();
```

**When adding new code:** Match the compressed style. Keep functions short. Chain statements with semicolons on one line where readability allows. Use template literals for all HTML rendering.

## Global State

**Single mutable state object `S`** (line 387-403) holds all application state:
```javascript
const S={
  view:'setup', draftId:'', username:'', userId:null,
  draft:null, picks:[], users:[], league:null, playerDb:null,
  posFilter:'ALL', showRookies:false, roomTab:'board',
  pollTimer:null, lastPollCount:0, error:'', loadingMsg:'',
  modal:null,
  draftList:[],
  trade:{send:[],receive:[],sendInput:'',receiveInput:''},
  sources:{ fc:{...}, ktc:{...}, dd:{...}, dp:{...}, csv:{...} },
};
```

**Pattern for state mutation:** Mutate `S` directly, then call `render()`:
```javascript
S.posFilter=b.dataset.pos;render();
```

**Source status lifecycle:** Each data source follows: `'idle'` -> `'loading'` -> `'live'` | `'error'` | `'unavailable'` | `'parse-error'`

## Import Organization

**No imports.** This is a single-file app with no module system. All functions and variables are global. External dependencies are loaded via CDN `<link>` tags (Google Fonts only).

## Error Handling

**Patterns:**
- `try/catch` around all async operations (API calls, data parsing)
- Errors logged to `console.error()` with short prefix: `console.error('FC:',e)`, `console.error('Poll:',e)`
- User-facing errors stored in `S.error` and rendered as `<div class="err">` elements
- Render function itself is wrapped in try/catch that displays a debug panel on failure:
```javascript
try{ /* render views */ }catch(e){
  app.innerHTML=`<div style="..."><h3>Render Error</h3><pre>${e.message}\n${e.stack}</pre></div>`;
}
```
- Null/undefined guarded with `||` fallbacks: `info?.position||'?'`, `p.team||''`, `player?.name||'Unknown'`
- Optional chaining (`?.`) used extensively for potentially missing data

**Resilience patterns:**
- CORS proxy fallback chain: tries multiple proxies sequentially for KTC and DD data
- HTML response detection: checks if proxy returned HTML error page instead of data before parsing
- localStorage wrapped in try/catch for all reads/writes (lines 374-376)

## Logging

**Framework:** `console` only.

**Patterns:**
- `console.error('PREFIX:', e)` for caught errors with 2-3 char source prefix
- `console.log()` used sparingly for debug output in data parsers: `console.log('KTC paste parsed ${count} players')`
- No structured logging, no log levels beyond error/log

## Comments

**When to Comment:**
- Section headers use `// ── Section Name ──` with em-dash box-drawing characters
- Feature sections use heavy box-drawing: `// ══════════════` with `FEATURE N: TITLE` labels
- Inline comments explain non-obvious logic: `// positive = KTC ranks higher (better)`
- No JSDoc/TSDoc usage anywhere

**Comment style examples:**
```javascript
// ── Persistence ──
// ── State ──
// ── Sleeper API ──
// ── FantasyCalc ──
// ── Name Normalization ──
// ── Multi-Source Value Engine ──
// ══════════════════════════════════════════════════
// FEATURE 1: TRADE-BACK CALCULATOR + TIER TRIGGERS
// ══════════════════════════════════════════════════
```

## Function Design

**Size:** Functions are short (5-30 lines typically). Largest functions are render functions that build HTML strings.

**Parameters:** Positional parameters only. No options objects. Functions often rely on global state `S` rather than taking explicit parameters.

**Return Values:**
- Render functions return HTML strings
- Data functions return objects or arrays
- Loader functions return void (mutate `S` directly and call `render()`)
- Analysis functions return plain objects with many properties (see `getPlayerAnalysis()` returning ~20 fields)

## Module Design

**No modules.** All code is in a single `<script>` block. Functions are organized in logical sections via comments:
1. Constants and persistence helpers
2. State initialization
3. API wrapper functions (Sleeper, FantasyCalc, KTC, DD, DP, CSV)
4. Name normalization and value engine
5. Player resolution and draft logic
6. Polling
7. Rendering (setup, loading, draft select, room, board, chart, trade, opponents, scarcity, sources, modal)
8. Event binding
9. Connection/initialization logic

**Adding new functionality:** Add new functions in the appropriate section. Follow the existing pattern of section-header comments. If adding a major feature, use the `// ══════` box-drawing header style with a `FEATURE N:` label.

## HTML Rendering Pattern

**String-based rendering.** All UI is generated via template literal strings returned from `render*()` functions. The top-level `render()` function sets `app.innerHTML` and then calls `bindEvents()` to attach event handlers:

```javascript
function render(){
  const app=document.getElementById('app');
  if(S.view==='setup')app.innerHTML=renderSetup();
  else if(S.view==='room')app.innerHTML=renderRoom();
  if(S.modal)app.innerHTML+=renderModal();
  bindEvents();updatePills();
}
```

**Event binding pattern:** `bindEvents()` (lines 1825-1882) queries the DOM after render and attaches handlers imperatively:
```javascript
const cb=document.getElementById('connectBtn');
if(cb){cb.onclick=handleConnect;}
```

**Conditional rendering in templates:** Use ternary operators inline:
```javascript
${S.error?`<div class="err">${S.error}</div>`:''}
```

## Data Flow Pattern

1. User action triggers state mutation on `S`
2. `render()` is called, regenerating HTML string for current view
3. `innerHTML` is set, destroying and recreating all DOM nodes
4. `bindEvents()` re-attaches all event listeners
5. For async data: loader mutates `S.sources[key]`, calls `updatePills()` and `render()`

## CSS Design System

**Custom properties** defined on `:root` (lines 10-21):
- Color tokens: `--bg`, `--surface`, `--text`, `--accent`, `--qb`, `--rb`, `--wr`, `--te`, `--pick`
- Spacing tokens: `--sp-xs` through `--sp-3xl` (4px to 32px)
- Border radius tokens: `--radius-sm`, `--radius-md`, `--radius-lg`
- Easing tokens: `--ease-out-quart`, `--ease-out-expo`

**Typography:** Three font families via Google Fonts:
- `'Instrument Serif'` (italic) - headings, branding, large numbers
- `'Sora'` - body text, UI elements
- `'JetBrains Mono'` - data values, stats, code-like content (applied via `.mono` class)

**Accessibility:** `prefers-reduced-motion` media query disables all animations (line 341-343). `:focus-visible` outlines provided globally (line 346).

## Persistence

**localStorage** with `draftcmdr_` prefix. Three helper functions:
- `saveLocal(key, val)` - JSON.stringify and store
- `loadLocal(key, fallback)` - JSON.parse or return fallback
- `clearLocal(key)` - remove item

Persisted data: username, source weights, KTC/DD/DP/CSV caches (data + max + timestamp).

---

*Convention analysis: 2026-03-08*
