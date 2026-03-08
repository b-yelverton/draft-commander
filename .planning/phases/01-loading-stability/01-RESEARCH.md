# Phase 1: Loading Stability - Research

**Researched:** 2026-03-08
**Domain:** DOM rendering stability, CSS layout shift prevention, skeleton loading UX
**Confidence:** HIGH

## Summary

The loading instability in Draft Commander stems from a single root cause: `renderBoard()` conditionally includes source columns (KTC, DD, DP) based on whether each source's status is `'live'`. When background loaders complete and call `render()`, the full DOM is rebuilt via `innerHTML`, causing columns to appear/disappear and widths to snap. This is compounded by the sidebar recommendations section which switches between a "Loading value sources..." message and actual recommendation cards.

The fix requires two coordinated changes: (1) always reserve column slots in the board regardless of data availability, showing placeholder dashes for pending sources, and (2) replace the sidebar's text-based loading message with shimmer skeleton placeholders that match the dimensions of the real content. A third optimization -- replacing the full `innerHTML` re-render with targeted subtree updates when only source data changes -- prevents the full-page flash.

**Primary recommendation:** Always render all source columns with stable fixed widths; use CSS shimmer skeletons in the sidebar; batch source-arrival re-renders into targeted DOM updates instead of full innerHTML replacement.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None -- user elected to skip discussion.

### Claude's Discretion
- **Skeleton appearance:** Choose appropriate shimmer/placeholder style consistent with the app's warm earth-tone design system
- **Source arrival UX:** Decide how new data appears when a source finishes loading (instant swap, fade, silent)
- **Board column strategy:** Decide whether to always render column slots, hide columns until data, or use placeholder values -- key goal is eliminating the layout shift that currently occurs
- **Render optimization:** Decide approach to prevent full-page flash (targeted DOM updates, render batching, conditional re-render)
- **Sidebar loading state:** Decide skeleton structure for recommendations and scarcity sections while sources load

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LOAD-01 | Room view does not visually break or overflow when background sources load and trigger re-render | Always-rendered columns with fixed widths prevent overflow; targeted subtree updates prevent DOM thrash |
| LOAD-02 | Board column layout remains stable as sources load -- columns always occupy their slots regardless of data availability | Board header and rows always include FC, KTC, DD, DP, and delta-rank columns; pending sources show "--" placeholder |
| LOAD-03 | Sidebar shows skeleton placeholders with shimmer animation while background sources are still loading | CSS `@keyframes shimmer` with warm-tone gradient; skeleton divs matching `.sb-rec` and scarcity row dimensions |
| LOAD-04 | Source loading does not cause full-page flash or layout shift visible to the user | Replace `render()` calls in source loaders with targeted update functions that only touch changed DOM subtrees |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JS | ES2020+ | All implementation | Single-file architecture, no build step -- project constraint |
| CSS @keyframes | Native | Shimmer animations | No dependencies, already used extensively in the app |
| requestAnimationFrame | Native | Render batching | Standard browser API for coalescing DOM updates |

### Supporting
No additional libraries needed. This is a pure CSS + vanilla JS fix within the existing single-file `index.html`.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual targeted updates | Virtual DOM (lit-html, etc.) | Adds dependency + build step; overkill for this scope |
| CSS shimmer keyframes | Loading spinner per section | Skeletons provide better perceived performance; spinners already used for full-page loading state |
| Always-render columns | CSS Grid with fixed column template | The board uses flexbox rows, not CSS Grid; switching to grid would be a larger refactor |

## Architecture Patterns

### Current Architecture (Relevant Parts)
```
index.html (~1969 lines, single file)
  <style> ... </style>           # CSS (lines 8-339)
  <div id="app"></div>           # Mount point
  <script>
    // Global state object S
    // Source loaders: loadKTC(), loadDD(), loadDP()
    // Render pipeline: render() -> renderRoom() -> renderBoard() + sidebar
    // Event rebinding: bindEvents() after every render()
    // Pill updates: updatePills() for header source status
  </script>
```

### Pattern 1: Always-Render Board Columns
**What:** Remove conditional column rendering (`${hasKtc?...:''}`) and always output all source columns with fixed widths.
**When to use:** Board header (line 1106-1113) and player rows (lines 1131-1135).
**Example:**
```javascript
// BEFORE (causes layout shift):
${hasKtc?'<span style="width:36px;text-align:right;color:var(--ktc-color)">KTC</span>':''}

// AFTER (stable layout):
<span class="p-val ktc" style="width:36px">${hasKtc && p.ktcRank ? '#'+p.ktcRank : '<span class="val-pending">--</span>'}</span>
```

### Pattern 2: Targeted Subtree Updates
**What:** Instead of calling `render()` (which replaces all of `#app` via innerHTML), source loaders call a targeted update function that only replaces the board rows and sidebar content.
**When to use:** When a background source finishes loading while user is in room view.
**Example:**
```javascript
function updateRoomData() {
  if (S.view !== 'room') { render(); return; }

  // Update board rows only
  const boardPanel = document.querySelector('.board-panel');
  if (boardPanel) {
    const ba = getBestAvailable(S.posFilter === 'ALL' ? null : S.posFilter);
    const recs = getRecommendations();
    // Re-render board content, preserving scroll position
    const scrollTop = boardPanel.scrollTop;
    boardPanel.innerHTML = renderBoardInner(ba, recs);
    boardPanel.scrollTop = scrollTop;
  }

  // Update sidebar sections
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    const scrollTop = sidebar.scrollTop;
    sidebar.innerHTML = renderSidebarInner();
    sidebar.scrollTop = scrollTop;
  }

  // Re-bind events for updated regions
  bindBoardEvents();
  bindSidebarEvents();
  updatePills();
}
```

### Pattern 3: CSS Shimmer Skeletons
**What:** Animated placeholder elements that match the size of real content, using a warm-tone gradient sweep.
**When to use:** Sidebar recommendations and scarcity sections while sources are still loading.
**Example:**
```css
@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
}
.skeleton {
  background: linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%);
  background-size: 400px 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}
.skeleton-rec {
  height: 80px;
  margin-bottom: var(--sp-sm);
  border-radius: var(--radius-lg);
}
.skeleton-line {
  height: 12px;
  margin-bottom: var(--sp-sm);
  width: 70%;
}
.skeleton-line.short { width: 40%; }
```

### Anti-Patterns to Avoid
- **Full innerHTML replacement on source arrival:** This is the current bug. Replacing `#app` innerHTML destroys and recreates the entire DOM, causing flash and layout shift. Only replace the subtrees that changed.
- **Conditional column rendering:** Never conditionally include/exclude flex children based on data availability. This changes the row width and causes column snapping.
- **Debouncing render calls:** Multiple sources may finish near-simultaneously. Debouncing delays the UI update. Use `requestAnimationFrame` batching instead -- it coalesces within the same frame without adding artificial delay.
- **Hiding columns with `display:none`:** This removes them from flow, same problem as not rendering them. Use visibility or render with placeholder content instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shimmer animation | Custom JS-based animation | CSS `@keyframes` with `linear-gradient` | Pure CSS is smoother, no JS overhead, works with existing animation patterns |
| Render batching | Custom queue/timer system | `requestAnimationFrame` | Browser-native, automatically coalesces to paint frame |
| Scroll preservation | Manual scroll tracking across renders | Read `scrollTop` before update, restore after | Simple and reliable; no need for IntersectionObserver or scroll libraries |

**Key insight:** All fixes use browser-native APIs. No libraries needed. The complexity is in the surgical DOM update strategy, not in any individual technique.

## Common Pitfalls

### Pitfall 1: Breaking bindEvents() After Targeted Updates
**What goes wrong:** `bindEvents()` currently queries the entire DOM for event targets. If you only replace a subtree, event listeners on other parts of the page remain intact, but the replaced subtree needs re-binding.
**Why it happens:** `bindEvents()` uses `document.querySelectorAll` which re-queries globally. After a targeted update, only the new nodes need binding, but calling full `bindEvents()` on partially-updated DOM could cause double-binding on unchanged nodes.
**How to avoid:** Either (a) call full `bindEvents()` which is idempotent since it uses `.onclick=` assignment (not `addEventListener`), or (b) create focused binding functions for board and sidebar regions.
**Warning signs:** Click handlers stop working after a source loads; or buttons fire twice.

### Pitfall 2: Scroll Position Loss on Board Update
**What goes wrong:** User is scrolled halfway through the board. A source finishes loading, board innerHTML is replaced, scroll resets to top.
**Why it happens:** innerHTML replacement destroys the scroll container's content, resetting scrollTop.
**How to avoid:** Capture `boardPanel.scrollTop` before update, restore after. This is a well-known pattern.
**Warning signs:** Board jumps to top when KTC/DD/DP finish loading.

### Pitfall 3: Flash of Unstyled Skeleton
**What goes wrong:** Skeleton appears for a frame before the shimmer animation starts, showing a flat gray block.
**Why it happens:** CSS animation needs the `@keyframes` rule to be parsed. If the skeleton HTML is injected before the style is ready, there's a single-frame flash.
**How to avoid:** The shimmer styles should be in the main `<style>` block (already present at page load), not dynamically injected. Since this is a single-file app with all CSS in the `<style>` tag, this is naturally avoided.
**Warning signs:** Gray rectangles flash before shimmer starts.

### Pitfall 4: Column Width Mismatch Between Header and Rows
**What goes wrong:** Board header shows all columns but row widths don't match, causing misalignment.
**Why it happens:** Header uses inline `style="width:36px"` but row values may have different content widths or missing elements.
**How to avoid:** Ensure both header spans and row value spans use identical width declarations. Use the existing `.p-val` class (already `width:44px`) consistently, or normalize all source value columns to the same inline width.
**Warning signs:** Column headers don't align with row values.

### Pitfall 5: Race Condition in Concurrent Source Updates
**What goes wrong:** Two sources finish within the same frame. Each calls `updateRoomData()`. Second call overwrites first call's DOM changes.
**Why it happens:** Each source loader independently triggers a re-render.
**How to avoid:** Use a single `requestAnimationFrame` gate:
```javascript
let updateScheduled = false;
function scheduleRoomUpdate() {
  if (updateScheduled) return;
  updateScheduled = true;
  requestAnimationFrame(() => {
    updateScheduled = false;
    updateRoomData();
  });
}
```
**Warning signs:** Source data appears then disappears briefly, or only the last-loaded source shows values.

## Code Examples

### Board Header (Always Render All Columns)
```javascript
// Source: Current renderBoard() at line 1106, modified
`<div style="display:flex;padding:4px 14px;border-bottom:1px solid var(--border);font-size:9px;color:var(--text3);font-family:'JetBrains Mono',monospace">
  <span style="width:30px">RK</span>
  <span style="width:26px"></span>
  <span style="flex:1">PLAYER</span>
  <span style="width:28px">TM</span>
  <span style="width:36px;text-align:right;color:var(--fc-color)">FC</span>
  <span style="width:36px;text-align:right;color:var(--ktc-color)">KTC</span>
  <span style="width:36px;text-align:right;color:var(--dd-color)">DD</span>
  <span style="width:36px;text-align:right;color:var(--dp-color)">DP</span>
  <span style="width:50px;text-align:center">&Delta; RNK</span>
</div>`
```

### Board Row (Stable Columns with Pending State)
```javascript
// Source: Current renderBoard() row at line 1126, modified
`<div class="p-row ${isRec?'recommended':''} ${dvgCls}">
  <span class="p-rank">${p.compositeRank}</span>
  <span class="p-pos p-${p.position}">${p.position}</span>
  <span class="p-name">${p.name}</span>
  <span class="p-team">${p.team||''}</span>
  <span class="p-val fc" style="width:36px">#${p.fcRank}</span>
  <span class="p-val ktc" style="width:36px">${hasKtc?(p.ktcRank?'#'+p.ktcRank:'--'):'<span class="val-pending">--</span>'}</span>
  <span class="p-val dd" style="width:36px">${hasDd?(p.ddRank?'#'+p.ddRank:'--'):'<span class="val-pending">--</span>'}</span>
  <span class="p-val dp" style="width:36px">${hasDp?(p.dpRank?'#'+Math.round(p.dpRank):'--'):'<span class="val-pending">--</span>'}</span>
  <span style="width:50px;text-align:center;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text3)">${rankDeltaHtml||'--'}</span>
</div>`
```

### Shimmer Skeleton CSS
```css
/* Shimmer skeleton for loading states */
@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
}
.skeleton {
  background: linear-gradient(90deg, var(--surface2) 25%, #e8e0d5 50%, var(--surface2) 75%);
  background-size: 400px 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}
.skeleton-card {
  height: 80px;
  margin-bottom: var(--sp-sm);
  border-radius: var(--radius-lg);
}
.skeleton-row {
  height: 28px;
  margin-bottom: var(--sp-xs);
  border-radius: var(--radius-sm);
}
.val-pending {
  color: var(--text3);
  opacity: 0.4;
}
```

### Sidebar Skeleton Placeholder
```javascript
// Recommendations section when sources still loading
function renderRecommendationsSkeleton() {
  const anySourceLoading = ['ktc','dd','dp'].some(k =>
    S.sources[k].status === 'loading' || S.sources[k].status === 'idle'
  );
  if (!anySourceLoading) return '';
  return `
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card" style="opacity:0.7"></div>
    <div class="skeleton skeleton-card" style="opacity:0.4;height:60px"></div>
  `;
}
```

### Render Batching with requestAnimationFrame
```javascript
let _roomUpdatePending = false;

function scheduleRoomUpdate() {
  if (_roomUpdatePending) return;
  _roomUpdatePending = true;
  requestAnimationFrame(() => {
    _roomUpdatePending = false;
    if (S.view === 'room') {
      updateRoomData();
    } else {
      render();
    }
  });
}

// In source loaders, replace:
//   updatePills(); render();
// With:
//   updatePills(); scheduleRoomUpdate();
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Full innerHTML on every state change | Targeted subtree replacement | Standard practice | Eliminates flash, preserves scroll, reduces layout recalc |
| Loading spinners | Content-shaped skeleton screens | ~2018 onwards | Better perceived performance, less layout shift |
| Conditional column show/hide | Always-reserved column slots | CSS best practice | Zero cumulative layout shift (CLS) |

**Deprecated/outdated:**
- Using `display:none` to hide loading content then showing it: causes layout shift, now flagged by Core Web Vitals CLS metric

## Open Questions

1. **Scroll position preservation scope**
   - What we know: Board panel and sidebar both scroll independently. Targeted updates need scroll preservation.
   - What's unclear: Whether `bindEvents()` causes any scroll-resetting side effects.
   - Recommendation: Test scroll preservation after implementing targeted updates. The `scrollTop` capture/restore pattern should handle it.

2. **Delta rank column without KTC**
   - What we know: Currently, the delta rank column only shows when KTC is loaded (it compares FC rank vs KTC rank).
   - What's unclear: Whether to show the delta column header always (with "--") or only when KTC loads.
   - Recommendation: Always show it for layout stability. Display "--" when KTC is pending. This is consistent with the always-render strategy.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual browser testing (no automated test framework detected) |
| Config file | none -- single-file app with no test infrastructure |
| Quick run command | Open `index.html` in browser, connect to a draft |
| Full suite command | N/A -- manual verification |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LOAD-01 | No overflow/break when sources load | manual-only | Visual inspection: enter room, wait for KTC/DD/DP to load | N/A |
| LOAD-02 | Board columns stable during load | manual-only | Visual inspection: board columns present on room entry, no width snap | N/A |
| LOAD-03 | Sidebar shimmer skeletons while loading | manual-only | Visual inspection: sidebar shows animated placeholders before sources complete | N/A |
| LOAD-04 | No full-page flash or layout shift | manual-only | Visual inspection: room view stays stable as each source completes | N/A |

**Justification for manual-only:** This is a single-file static HTML app with no build step, no test framework, and no Node.js project structure. The requirements are inherently visual (overflow, flash, layout shift). Automated CLS measurement would require Puppeteer/Playwright infrastructure that does not exist and would be disproportionate to set up for 4 visual requirements.

### Sampling Rate
- **Per task commit:** Open in browser, trigger source loading, visually verify no layout shift
- **Per wave merge:** Full walkthrough: connect to draft, observe room entry, watch all 3 background sources complete
- **Phase gate:** All 4 LOAD requirements verified by visual inspection before marking complete

### Wave 0 Gaps
None -- no test infrastructure to set up. Verification is manual browser testing, which requires no scaffolding.

## Sources

### Primary (HIGH confidence)
- Direct source code analysis of `index.html` (1969 lines) -- render pipeline, source loaders, CSS layout, existing animations
- CONTEXT.md code_context section -- root cause analysis from discuss phase

### Secondary (MEDIUM confidence)
- CSS Layout Shift prevention patterns -- well-established web platform best practices (CLS is a Core Web Vital)
- Skeleton loading screen patterns -- standard UX pattern since Material Design popularized it (~2018)

### Tertiary (LOW confidence)
- None -- all findings are based on direct code analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- vanilla JS/CSS, no library decisions needed
- Architecture: HIGH -- root cause is clear from code analysis, fix patterns are well-established
- Pitfalls: HIGH -- identified from direct analysis of render pipeline and event binding patterns

**Research date:** 2026-03-08
**Valid until:** Indefinite -- patterns are stable browser platform features
