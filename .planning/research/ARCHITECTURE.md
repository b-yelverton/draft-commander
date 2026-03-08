# Architecture Patterns

**Domain:** Responsive design & loading state management for single-file vanilla JS app
**Researched:** 2026-03-08

## Recommended Architecture

No architectural overhaul. The changes are CSS-layer responsive techniques and a targeted rendering improvement in the JS layer. Everything stays in `index.html`.

### Component Map

```
+---------------------------------------------------------------+
|  HEADER (.hdr) - sticky, always visible                       |
|  [Logo] [Source Pills*] [Tip*] [Switch Draft] [Live Indicator]|
|  * hidden on mobile                                           |
+---------------------------------------------------------------+
|  ROOM-TOP (.room-top) - spans full width                      |
|  [Pick Clock] [My Picks] [Tabs (scrollable on mobile)] [Meta]|
+---------------------------------------------------------------+
|                    |                                           |
|  MAIN PANEL        |  SIDEBAR (.sidebar)                      |
|  (.board-panel     |  [Recommendations]                       |
|   or .chart-panel) |  [Recent Picks]                          |
|                    |  [Scarcity]                               |
|  Tab-dependent     |  Desktop: 340px right column              |
|  content           |  Mobile: full-width below board           |
|                    |                                           |
+---------------------------------------------------------------+
```

### Component Boundaries

| Component | Responsibility | Responsive Behavior | Loading Behavior |
|-----------|---------------|---------------------|------------------|
| `.hdr` | Sticky header with branding and status | Collapse pills on mobile. Flex-wrap. | No change -- pills update via `updatePills()`. |
| `.room` | Grid container for draft room | `1fr 340px` on desktop, single column on mobile | Overflow fix: contain layout during async loads. |
| `.board-panel` | Scrollable player board | Full-width on mobile. Hide source columns. | `content-visibility: auto` on rows. `scrollbar-gutter: stable`. Targeted updates only. |
| `.sidebar` | Recommendations, recent picks, scarcity | Full-width below board on mobile. | Skeleton placeholders while sources load. Targeted DOM updates. |
| `.room-top` | Tab bar + pick info | Flex-wrap. Tabs scroll horizontally on mobile. | No change. |
| `.modal` | KTC paste fallback, player detail | Already responsive (90% width, max-width 520px). | No change. |

### Data Flow Change: Targeted Rendering

**Current flow (causes overflow):**
```
Source loads --> S.sources.ktc = data --> render() --> innerHTML replaces ALL of #app --> scroll lost, layout overflow
```

**Recommended flow:**
```
Source loads --> S.sources.ktc = data --> scheduleUpdate() --> rAF batches --> updateBoard() + updateSidebar() --> only affected subtrees replaced
```

**Implementation:**

1. Add `id` attributes to board container and sidebar in render output: `<div id="boardContent">...</div>`, `<div id="sidebarContent">...</div>`
2. Create `updateBoard()` that regenerates board HTML and replaces `#boardContent` innerHTML
3. Create `updateSidebar()` that regenerates sidebar HTML and replaces `#sidebarContent` innerHTML
4. Create `scheduleUpdate()` using `requestAnimationFrame` to batch rapid updates:

```javascript
let updatePending = false;
function scheduleUpdate() {
  if (updatePending) return;
  updatePending = true;
  requestAnimationFrame(() => {
    updatePending = false;
    const bc = document.getElementById('boardContent');
    const sc = document.getElementById('sidebarContent');
    if (bc) { const st = bc.parentElement.scrollTop; bc.innerHTML = renderBoardContent(); bc.parentElement.scrollTop = st; }
    if (sc) { const st = sc.parentElement.scrollTop; sc.innerHTML = renderSidebarContent(); sc.parentElement.scrollTop = st; }
    bindEvents();
    updatePills();
  });
}
```

5. Source loaders call `scheduleUpdate()` instead of `render()`. Full `render()` reserved for view transitions only.

## Patterns to Follow

### Pattern 1: Mobile-First CSS with Progressive Enhancement

**What:** Base styles target phone (no media query). Add complexity at wider breakpoints.
**When:** All layout and sizing rules.
**Why:** Ensures the app works on the smallest screen. Larger screens get enhancements.

```css
/* Base: phone */
.room { display: grid; grid-template-columns: 1fr; height: auto; min-height: calc(100vh - 52px); overflow-y: auto; }

/* Desktop */
@media (min-width: 1000px) {
  .room { grid-template-columns: 1fr 340px; height: calc(100vh - 52px); overflow: hidden; }
}
```

### Pattern 2: Column Visibility via CSS, Not JS Branching

**What:** Always render all source columns in `renderBoard()`. Use CSS to control visibility by viewport width.
**When:** Board panel rendering.
**Why:** DOM structure stays stable regardless of when sources load. No layout shift from column count changes.

```css
/* Mobile: composite only */
.p-val.fc, .p-val.ktc, .p-val.dd, .p-val.dp { display: none; }

/* Tablet: add FC + KTC */
@media (min-width: 600px) {
  .p-val.fc, .p-val.ktc { display: inline-block; }
}

/* Desktop: all columns */
@media (min-width: 1000px) {
  .p-val.fc, .p-val.ktc, .p-val.dd, .p-val.dp { display: inline-block; }
}
```

**Tradeoff:** Slightly more DOM (hidden spans for sources not yet loaded). Negligible for 100 rows x 4 spans = 400 elements.

### Pattern 3: Stable Board Row Layout

**What:** Prevent any content from exceeding panel boundary regardless of column count.
**When:** Board panel and player rows.

```css
.board-panel { overflow-x: hidden; min-width: 0; scrollbar-gutter: stable; }
.p-row { min-width: 0; }
.p-name { min-width: 0; flex: 1; /* already has overflow:hidden + text-overflow:ellipsis */ }
```

### Pattern 4: Container Queries for Sidebar Components

**What:** Use `@container` for sidebar sections that need to adapt to their container width.
**When:** Sidebar at different widths (340px on desktop, full-width on mobile).

```css
.sidebar { container-type: inline-size; }

@container (min-width: 500px) {
  .sb-rec { /* wider layout: recommendation text alongside position badge */ }
  .opp-card { /* two-column opponent stats */ }
}
```

**Why container queries here:** The sidebar is 340px on desktop but full-width on mobile. Media queries can't distinguish "sidebar at 340px in desktop layout" from "sidebar at 375px on phone." Container queries respond to the actual available width.

### Pattern 5: Skeleton Placeholder in Render Functions

**What:** Render skeleton HTML when source data is not yet available.
**When:** Sidebar recommendations, board value columns during initial load.

```javascript
function renderSidebarContent() {
  if (!S.sources.fc.data) {
    return '<div class="sb-section">' +
      '<div class="sb-title">RECOMMENDATIONS</div>' +
      '<div class="sb-rec skeleton" style="height:80px"></div>'.repeat(3) +
      '</div>';
  }
  // ... normal render
}
```

```css
@keyframes shimmer { to { background-position: -200% 0; } }
.skeleton {
  background: linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
```

### Pattern 6: Scroll Position Preservation

**What:** Save and restore scrollTop across re-renders.
**When:** Every `render()` call while in room view.

```javascript
function render() {
  const boardScroll = document.querySelector('.board-panel')?.scrollTop || 0;
  const sidebarScroll = document.querySelector('.sidebar')?.scrollTop || 0;
  // ... existing render logic ...
  requestAnimationFrame(() => {
    const bp = document.querySelector('.board-panel');
    const sb = document.querySelector('.sidebar');
    if (bp) bp.scrollTop = boardScroll;
    if (sb) sb.scrollTop = sidebarScroll;
  });
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: JavaScript-Driven Responsive Logic
**What:** Using `window.innerWidth` checks in render functions to conditionally include/exclude HTML.
**Why bad:** CSS media queries handle this with zero JS overhead. Adding resize-triggered renders causes unnecessary full DOM rebuilds.
**Instead:** All responsive behavior in CSS. Use `matchMedia` API only when JS behavior must change (not layout).

### Anti-Pattern 2: Full innerHTML Replacement on Data Updates
**What:** Calling `render()` when a background source loads.
**Why bad:** Causes scroll reset, input loss, animation replay, and the overflow bug.
**Instead:** Targeted DOM updates for in-view changes. Full `render()` for view transitions only.

### Anti-Pattern 3: Fixed Pixel Widths Without Fluid Alternatives
**What:** `width: 340px`, `min-width: 320px` everywhere.
**Why bad:** Horizontal overflow on narrow screens.
**Instead:** `min(340px, 100%)`, `clamp()`, percentages, `fr` units.

### Anti-Pattern 4: Hiding Content on Mobile with `display: none`
**What:** Making sidebar sections disappear instead of adapting them.
**Why bad:** Mobile users lose the core value proposition -- recommendations, scarcity, run detection.
**Instead:** Reflow content below board. Collapse into stacked layout. All features accessible.

### Anti-Pattern 5: Desktop-First with max-width Overrides
**What:** Current approach -- desktop styles as base, one `max-width:1000px` override.
**Why bad:** Every mobile style is an override. Base CSS assumes desktop width.
**Instead:** Mobile-first with `min-width` breakpoints.

## Integration with Existing Architecture

### What Changes

| Current | After |
|---------|-------|
| 1 media query (line 67) | 3 mobile-first breakpoints (600, 1000, 1400px) |
| `renderBoard()` conditionally renders columns | `renderBoard()` always renders all columns |
| Source loads call `render()` | Source loads call `scheduleUpdate()` |
| Board can overflow horizontally | Board constrained with overflow-x: hidden + min-width: 0 |
| Header is single-row only | Header wraps on mobile, pills hidden |
| Room is always fixed-height viewport | Room is natural-scroll on mobile, fixed-height on desktop |

### What Does NOT Change

- Single-file architecture (all CSS in `<style>`, all JS in `<script>`)
- Global state object `S` and its structure
- `render()` / `bindEvents()` / `updatePills()` flow for view transitions
- Source loading pattern (FC awaited, others fire-and-forget)
- View routing (`S.view`, `S.roomTab`)
- No new files, no build step, no CSS preprocessor

### Size Estimate

- CSS additions: ~120-150 lines (breakpoints, responsive rules, skeleton, content-visibility)
- JS changes: ~50-80 lines (scheduleUpdate, scroll preservation, skeleton conditionals)
- JS removals: ~20-30 lines (conditional column rendering in renderBoard)
- Net: ~120-200 lines added to a ~1970-line file

## Sources

- Direct codebase analysis of `index.html` (lines 1-1969)
- [CSS Grid minmax() - Ahmad Shadeed](https://ishadeed.com/article/css-grid-minmax/) - Preventing grid blowout
- [CSS Container Queries - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries) - Container query usage
- [content-visibility - web.dev](https://web.dev/articles/content-visibility) - Rendering optimization
- [Preventing Layout Shift - OpenReplay](https://blog.openreplay.com/preventing-layout-shift-modern-css/) - CLS patterns

---

*Architecture analysis: 2026-03-08*
