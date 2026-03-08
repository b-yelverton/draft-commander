# Codebase Concerns

**Analysis Date:** 2026-03-08

## Tech Debt

**Monolithic Single-File Architecture:**
- Issue: The entire application (CSS, HTML, JavaScript) lives in one file `index.html` at ~1970 lines. All state, API logic, rendering, and event binding are in a single `<script>` block (~1600 lines of JS). No modules, no build step, no separation of concerns.
- Files: `index.html`
- Impact: Every change risks side effects. No tree-shaking, no code splitting. Difficult to test individual functions in isolation. Two developers cannot work on separate features without merge conflicts.
- Fix approach: Extract JS into modules (`src/state.js`, `src/api.js`, `src/render.js`, `src/sources.js`, `src/trade.js`, `src/scarcity.js`). Add a minimal bundler (esbuild or Vite). CSS could move to a separate file. This can be done incrementally -- extract one module at a time.

**Full DOM Re-render on Every State Change:**
- Issue: The `render()` function (line ~878) rebuilds the entire `#app` innerHTML on every state change, then re-binds all events via `bindEvents()`. This is a manual virtual-DOM-less approach that destroys and recreates the entire DOM tree.
- Files: `index.html` (lines 878-891, 1825-1882)
- Impact: Input focus is lost on re-render (trade inputs, username field). Scroll position resets in the board panel. Animations restart. Performance degrades with large player lists (100+ rows rendered).
- Fix approach: Either adopt a lightweight reactive library (Preact, lit-html) or implement targeted DOM updates -- update only the changed sections rather than replacing all innerHTML. At minimum, preserve input values and scroll positions across renders.

**Dead Code -- Old Trade Evaluator:**
- Issue: The old `evaluateTrade()` function (lines 1352-1376) and `renderTradeEval()` (lines 1378-1449) are fully superseded by `evaluateTradeEnhanced()` and `renderTradeEvalEnhanced()` but remain in the codebase. The comment on line 1330 says "kept for backwards compat" but nothing references them.
- Files: `index.html` (lines 1330-1449)
- Impact: ~120 lines of dead code that adds confusion and maintenance burden.
- Fix approach: Delete `evaluateTrade()` and `renderTradeEval()` functions entirely.

**Global Mutable State Object:**
- Issue: All application state lives in a single mutable global `S` object (lines 387-403). Any function can read or mutate any property at any time. No encapsulation, no state transitions, no change tracking.
- Files: `index.html` (lines 387-403)
- Impact: Difficult to reason about state changes. Race conditions possible between polling updates and user interactions. No undo/redo capability.
- Fix approach: Wrap state in a simple store pattern with `getState()` / `setState()` that triggers selective re-renders. Add immutability for nested objects.

**Hardcoded Future Pick Values:**
- Issue: The `FUTURE_PICK_VALUES` constant (lines 1642-1651) contains hardcoded dynasty trade values for future draft picks. These values become stale as the fantasy football market shifts.
- Files: `index.html` (lines 1642-1651)
- Impact: Trade evaluations involving future picks may be inaccurate if values drift from market consensus.
- Fix approach: Pull future pick values from one of the existing data sources (FantasyCalc or KTC already include pick values). Fall back to hardcoded values only when API data is unavailable.

**Hardcoded Year in Draft Lookup:**
- Issue: The `handleConnect()` function (line 1902) hardcodes years `[2026, 2025, 2024]` for draft lookup. This requires a code change every season.
- Files: `index.html` (line 1902)
- Impact: After 2026, the app will not find drafts for the current year without a code update.
- Fix approach: Use `new Date().getFullYear()` to dynamically compute the current year and look back 2 years.

## Known Bugs

**Input Value Loss on Re-render:**
- Symptoms: When typing in the trade evaluator inputs or the setup form, any state change (including the 10-second poll) triggers a full re-render that may reset input focus and cursor position.
- Files: `index.html` (lines 878-891 render function, lines 1251-1252 trade inputs)
- Trigger: Type in a trade input, then wait for `pollDraft()` to fire (every 10 seconds). If picks changed, `render()` is called and input state is lost.
- Workaround: The trade inputs save `sendInput`/`receiveInput` to state, but cursor position and focus are still lost.

**Composite Rank Missing DD/DP Weights:**
- Symptoms: The `getPlayerAnalysis()` function (lines 708-714) only includes FC, KTC, and CSV in the weighted composite rank calculation, but omits DD and DP weights despite those sources being loaded and displayed.
- Files: `index.html` (lines 708-714)
- Trigger: Enable all 5 sources. DD and DP data appears in the board columns but does not influence composite ranking or BPA sort order.
- Workaround: None. Users see DD/DP data but it has no effect on recommendations.

**Monte Carlo Sim Blocks Main Thread:**
- Symptoms: The `runTEPScarcitySim()` function (line 1712) runs 1,500 iterations of a Monte Carlo simulation synchronously on the main thread. This freezes the UI while computing.
- Files: `index.html` (lines 1712-1764, called at line 1767)
- Trigger: Click the "Scarcity" tab during an active draft with many available players.
- Workaround: None. The sim runs every time the scarcity tab is rendered.

## Security Considerations

**XSS via innerHTML with User-Controlled Data:**
- Risk: Player names, team names, owner names, and league names from the Sleeper API are interpolated directly into HTML strings via template literals and set via `innerHTML`. A malicious player name or league name containing `<script>` or event handlers could execute arbitrary JavaScript.
- Files: `index.html` (lines 878-891 render, lines 1126-1136 player rows, lines 1079 draft log, lines 988-1005 draft cards)
- Current mitigation: None. No HTML escaping is applied anywhere.
- Recommendations: Add an `escapeHtml()` utility function and apply it to all user-controlled strings before interpolation. At minimum: player names, owner names, league names, team names.

**CORS Proxy Dependency for Sensitive Data:**
- Risk: KTC and Dynasty Daddy data is fetched through third-party CORS proxies (`api.codetabs.com`, `corsproxy.io`, `api.allorigins.win`). These proxies see all request/response data and could inject malicious content or become unavailable.
- Files: `index.html` (line 370 `KTC_PROXIES`)
- Current mitigation: KTC parsing validates the presence of `playersArray` in the HTML. DD parsing checks for JSON format.
- Recommendations: Add a first-party proxy endpoint on Vercel (serverless function) to eliminate third-party proxy dependency. Validate and sanitize all proxy responses before parsing.

**localStorage Data Integrity:**
- Risk: Cached source data in localStorage (`ktc_cache`, `dd_cache`, `dp_cache`, `csv_cache`) is parsed with `JSON.parse()` without validation. Corrupted or tampered localStorage data could cause runtime errors or unexpected behavior.
- Files: `index.html` (lines 373-384)
- Current mitigation: `try/catch` blocks around localStorage operations.
- Recommendations: Add schema validation for cached data. Add cache expiration (currently caches never expire).

## Performance Bottlenecks

**Full Player Database Download:**
- Problem: `getPlayers()` (line 412) fetches the entire Sleeper NFL player database on every draft connection. This is a multi-megabyte JSON payload containing thousands of players.
- Files: `index.html` (line 412, called at line 1946)
- Cause: The Sleeper API does not support filtered player queries. The full database is needed for player ID resolution.
- Improvement path: Cache the player database in localStorage with a daily expiration. The player DB changes infrequently during a season.

**Redundant getBestAvailable Calls:**
- Problem: `getBestAvailable()` iterates over all FC data entries, checks drafted status, and computes player analysis for each. It is called multiple times per render: once for the board, once per position for recommendations, once per position for scarcity sidebar, and again for the scarcity sim.
- Files: `index.html` (lines 805-820, called at lines 1017, 823-827, 1084, 1467, 1713)
- Cause: No memoization. Each call recomputes everything from scratch.
- Improvement path: Memoize `getBestAvailable()` results and invalidate only when `S.picks` changes. A simple cache keyed on `S.picks.length + S.posFilter + S.showRookies` would eliminate most redundant work.

**Sequential API Calls During Draft Discovery:**
- Problem: When looking up a user's drafts (lines 1901-1923), the code fetches league details and pick counts sequentially for each draft in a loop with `await`. For users with many leagues/drafts, this creates a waterfall of serial API calls.
- Files: `index.html` (lines 1901-1923)
- Cause: Sequential `await` inside `for` loops.
- Improvement path: Use `Promise.all()` to parallelize league info fetches. Batch or limit concurrent requests to avoid rate limiting.

**Monte Carlo Simulation on Main Thread:**
- Problem: `runTEPScarcitySim(1500)` (line 1767) runs 1,500 iterations synchronously, computing random drafts for each iteration. With 4 positions and multiple future picks, this involves thousands of random number generations and array operations.
- Files: `index.html` (lines 1712-1764)
- Cause: No Web Worker, no requestIdleCallback, no chunking.
- Improvement path: Move simulation to a Web Worker, or use requestIdleCallback to chunk iterations. Cache results and only re-run when picks change.

## Fragile Areas

**KTC Scraping / Paste Parsing:**
- Files: `index.html` (lines 431-547)
- Why fragile: KTC data loading relies on three mechanisms, all brittle: (1) CORS proxy scraping that parses embedded `var playersArray = [...]` from HTML (line 452), (2) paste parsing that uses positional line scanning with regex to extract rank/name/team/value from copy-pasted text (lines 484-539), (3) third-party CORS proxies that frequently rate-limit or go offline.
- Safe modification: Any changes to KTC parsing should be tested with real KTC page content. The paste parser is particularly fragile -- it relies on specific line ordering (rank on its own line, then name+team, then position+age, then tier, then trend, then value).
- Test coverage: `tests/sources.spec.js` tests that KTC loads via proxy, and tests proxy fallback. No unit tests for the paste parser.

**Name Normalization Matching:**
- Files: `index.html` (line 642 `normName()`)
- Why fragile: Cross-source player matching relies entirely on `normName()` which strips all non-alpha characters and lowercases. This works for most names but fails for players with identical normalized names (e.g., "Mike Williams" on different teams), suffix handling (Jr., III), and name variants across sources.
- Safe modification: Changes to normName affect all 5 data source lookups. Test with edge cases: "Amon-Ra St. Brown", "De'Von Achane", "Travis Etienne Jr.", "Marvin Harrison Jr."
- Test coverage: No unit tests for name normalization or cross-source matching.

**Event Binding After Render:**
- Files: `index.html` (lines 1825-1882 `bindEvents()`)
- Why fragile: All event listeners are attached imperatively after each render by querying DOM elements by ID or class. If a render function changes an element's ID or structure, the corresponding event binding silently breaks with no error. There is no verification that elements exist before binding.
- Safe modification: When adding new interactive elements, you must add both the HTML in the render function AND the event binding in `bindEvents()`. Missing either side produces a silent failure.
- Test coverage: No tests for user interactions or event handling.

## Scaling Limits

**localStorage Capacity:**
- Current capacity: ~5MB per origin across all browsers.
- Limit: With 5 data sources cached (KTC, DD, DP, CSV, plus weights and username), each containing hundreds of player objects, localStorage usage could approach 2-3MB. Adding more cached data or larger CSV uploads could hit the limit.
- Scaling path: Use IndexedDB for large data caches. Add cache size monitoring and eviction policies.

**Single-File Deployment:**
- Current capacity: Works for the current ~1970-line file size.
- Limit: As features are added, the single HTML file becomes increasingly unwieldy. Browser parsing time increases, and developer experience degrades.
- Scaling path: Introduce a build step with code splitting. Even a simple esbuild config would enable multi-file development while outputting a single deployable artifact.

## Dependencies at Risk

**Third-Party CORS Proxies:**
- Risk: `api.codetabs.com`, `corsproxy.io`, and `api.allorigins.win` are free services with no SLA. They frequently rate-limit, return error pages, or go offline entirely. The app's KTC and DD source loading depends on at least one of these working.
- Impact: KTC and Dynasty Daddy data becomes unavailable, degrading the multi-source composite rankings to FC-only.
- Migration plan: Deploy a first-party serverless proxy function on Vercel (`/api/proxy.js`) to fetch KTC and DD data server-side, eliminating CORS proxy dependency entirely.

**Sleeper API Stability:**
- Risk: The app depends entirely on the Sleeper API (`api.sleeper.app/v1`) for draft data, league info, user lookup, and the full NFL player database. Sleeper provides no versioned API guarantees.
- Impact: Any Sleeper API change or deprecation breaks the entire app.
- Migration plan: No alternative. Monitor Sleeper API changelog. Add error handling that gracefully degrades with informative user messages.

**DynastyProcess GitHub CSV:**
- Risk: The DP source loads from a GitHub raw URL (`raw.githubusercontent.com/dynastyprocess/data/master/files/values.csv`). The DynastyProcess project could rename files, restructure the repo, or stop updating.
- Impact: DP source becomes unavailable. Lower impact since it is one of 5 sources.
- Migration plan: Cache last-known-good DP data locally. Monitor for staleness by checking data timestamps.

## Missing Critical Features

**No HTML Escaping:**
- Problem: No `escapeHtml()` function exists anywhere in the codebase despite extensive use of `innerHTML` with external API data.
- Blocks: Secure deployment. Any user or API-provided string is a potential XSS vector.

**No Cache Expiration:**
- Problem: LocalStorage caches for KTC, DD, DP, and CSV data have timestamps (`ts: Date.now()`) saved alongside data but no code ever checks or enforces expiration.
- Blocks: Users may see stale cached data weeks or months old without realizing it.

**No Error Recovery UI:**
- Problem: When data source loading fails, the UI shows a status pill ("--" or "x") but provides no retry button or explanation beyond the pill. Users must know to go to the Sources tab for troubleshooting info.
- Blocks: Non-technical users have no path to resolve data loading failures.

## Test Coverage Gaps

**No Unit Tests:**
- What's not tested: Core business logic functions -- `normName()`, `getPlayerAnalysis()`, `getBestAvailable()`, `evaluateTradeEnhanced()`, `getFuturePickValue()`, `parsePick()`, `detectRuns()`, `detectTiers()`, `profileOpponents()`, `runTEPScarcitySim()`, `parseCSV()`, `parseKTCPaste()`.
- Files: All logic in `index.html` (lines 367-1960)
- Risk: Any refactoring of ranking calculations, trade evaluation, or player matching could silently break core features.
- Priority: High. The monolithic structure makes unit testing impossible without extracting functions into importable modules first.

**No UI/Interaction Tests:**
- What's not tested: Setup form submission, draft card selection, tab switching, position filtering, trade input flow, weight slider adjustment, KTC paste modal, CSV upload.
- Files: `index.html` (lines 1825-1882 `bindEvents()`)
- Risk: Event binding regressions (adding HTML without corresponding event handlers, or vice versa) go undetected.
- Priority: Medium. Playwright is already set up; adding interaction tests is straightforward.

**No Rendering Tests:**
- What's not tested: Board rendering with various player counts, chart SVG generation, trade evaluator output, opponent profile display, scarcity simulation display. Edge cases like empty drafts, single-team leagues, or drafts with no FC data.
- Files: All `render*()` functions in `index.html`
- Risk: UI regressions from render function changes. Particularly risky given the string-template approach where typos in HTML produce silent failures.
- Priority: Medium.

**Existing Tests Are Integration-Only:**
- What's tested: `tests/sources.spec.js` contains 7 Playwright tests that verify each data source loads successfully via real network calls. Tests also verify proxy fallback behavior and CSV parse quality.
- Files: `tests/sources.spec.js`
- Risk: Tests depend on external APIs being available and returning expected data. Tests are slow (network-dependent) and flaky. No mock/stub patterns exist.
- Priority: Low (existing tests are valuable but need supplementation with mocked/isolated tests).

---

*Concerns audit: 2026-03-08*
