# Domain Pitfalls

**Domain:** Responsive design retrofit and async loading UX for a single-file vanilla JS draft assistant
**Researched:** 2026-03-08

## Critical Pitfalls

Mistakes that cause rewrites, visual breakage, or user-facing regressions.

### Pitfall 1: CSS Grid Blowout from `1fr` Minimum Content Size

**What goes wrong:** The room layout uses `grid-template-columns: 1fr 340px`. On viewports narrower than ~700px, the 340px sidebar forces horizontal overflow. Even after stacking the grid, `1fr` retains `min-width: auto` by default -- child content wider than the column blows out the grid.
**Why it happens:** CSS Grid spec sets implicit minimum size of grid items to `auto`, resolving to `min-content`. Player rows with 5-6 value columns + rank + position + name + team can exceed a narrow viewport's width. The `.p-name` has `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` but this only works if the parent constrains width -- which `1fr` with `min-width: auto` does not guarantee.
**Consequences:** Horizontal scrollbar on mobile. Content overflows viewport edge. Unusable during a live draft.
**Prevention:**
- Change `1fr` to `minmax(0, 1fr)` in all grid definitions
- Add `min-width: 0` to direct grid children (`.board-panel`, `.sidebar`)
- Audit nested grids: `.chart-stats` (`repeat(3, 1fr)`), `.pick-detail` (`1fr 1fr 1fr 1fr`) need same treatment or responsive column reduction
**Detection:** DevTools at 375px. If `document.documentElement.scrollWidth > document.documentElement.clientWidth`, blowout exists.
**Confidence:** HIGH -- verified against current CSS (line 66) and known CSS Grid behavior per MDN.

---

### Pitfall 2: Full DOM Re-render Causing Layout Shift During Source Loading

**What goes wrong:** When KTC, DD, or DP finish loading, they call `render()` which replaces entire `#app` innerHTML. This destroys and recreates board, sidebar, all player rows, every scroll container. User sees: content flash, scroll reset, board reordering as composite rankings recalculate, animation restart.
**Why it happens:** No diffing. `render()` does `app.innerHTML = renderRoom()` unconditionally. Background sources call `updatePills(); render()` on completion. During a live draft, 3-4 full re-renders fire within the first 30 seconds.
**Consequences:** The visual "overflow/breakage" described in PROJECT.md. Users lose scroll position in 200+ player board. Board content visibly jumps. During time-pressured live draft, this is disorienting.
**Prevention:**
- Introduce `scheduleUpdate()` with `requestAnimationFrame` batching
- Targeted DOM updates: replace only `#boardContent` and `#sidebarContent` innerHTML
- Save/restore `scrollTop` before/after updates
- Reserve full `render()` for view transitions only
**Detection:** Enter draft room, scroll halfway down board, wait 10-30 seconds. If board jumps to top, pitfall is active.
**Confidence:** HIGH -- verified (render calls at lines 474, 546, 581, 611; full innerHTML replacement at line 884).

---

### Pitfall 3: Hiding Desktop Content on Mobile Instead of Reorganizing

**What goes wrong:** The natural instinct is to `display: none` the sidebar on mobile, hiding recommendations, scarcity alerts, run detection, and trade-back opportunities. This removes the core value proposition on the platform where users most need quick-glance information.
**Why it happens:** 340px sidebar does not fit alongside board at 375px. Hiding is easy. Restructuring is harder.
**Consequences:** Mobile users get a read-only player board -- something Sleeper already provides natively. The competitive edge vanishes.
**Prevention:**
- Stack sidebar below board on mobile (full-width)
- All sidebar sections remain accessible by scrolling down
- Never hide a feature section without providing alternative access
- Test: at each breakpoint, verify every desktop feature is also reachable on mobile
**Detection:** Create a checklist of sidebar sections. Confirm mobile access for each.
**Confidence:** HIGH -- well-documented anti-pattern in responsive retrofit literature.

---

### Pitfall 4: Mobile-First Refactor Breaking Desktop Layout

**What goes wrong:** When flipping from `max-width:1000px` to `min-width` mobile-first, missing a single property causes desktop regression. Desktop styles that were "default" now need explicit `min-width` rules.
**Why it happens:** Every CSS property implicitly desktop-default must be explicitly placed inside `@media (min-width: 1000px)`. Easy to miss properties like `height: calc(100vh - 52px)`, `overflow: hidden`, `border-right: 1px solid`, `grid-template-rows`.
**Consequences:** Desktop layout breaks -- sidebar disappears, grid collapses, fonts wrong size.
**Prevention:** Audit every existing CSS rule. List all desktop-specific properties. Move them into `@media (min-width: 1000px)`. Test desktop immediately after refactoring base styles.
**Detection:** Side-by-side testing at 375px, 768px, and 1440px after each CSS change.
**Confidence:** HIGH -- standard risk in any mobile-first refactor.

## Moderate Pitfalls

### Pitfall 5: Viewport Height on Mobile Safari (100vh Bug)

**What goes wrong:** `height: calc(100vh - 52px)` on `.room` includes address bar height on mobile Safari. Content extends behind browser chrome.
**Why it happens:** Mobile Safari's `100vh` = maximum viewport height (address bar hidden), not visible viewport.
**Consequences:** Bottom of board or sidebar cut off behind browser bottom bar. Cannot scroll to last players.
**Prevention:** Use `height: calc(100dvh - 52px)` with fallback `height: calc(100vh - 52px)`. Better: on mobile, avoid fixed heights -- use `min-height` and let content flow naturally. `dvh` has ~90% support; use `@supports` or put `vh` first as fallback.
**Detection:** Test on actual iPhone Safari (not Chrome DevTools responsive mode).
**Confidence:** MEDIUM -- well-known issue, but `dvh` support is still not universal.

---

### Pitfall 6: Touch Target Sizes Below 44px

**What goes wrong:** Interactive elements designed for mouse are too small for fingers. Position filters at `4px 12px` = ~24px targets. Tab buttons at `6px 14px` = ~28px. Source weight sliders have 4px track.
**Prevention:** Apply minimum 44x44px touch targets on mobile via padding. Increase slider thumb with `::-webkit-slider-thumb`. Use `min-height: 44px` with centered content.
**Detection:** Chrome DevTools "Show tap regions" or measure computed heights at mobile viewport.
**Confidence:** MEDIUM -- WCAG 2.5.5 guideline.

---

### Pitfall 7: Player Row Value Columns Overflowing on Mobile

**What goes wrong:** Each `.p-row` has: rank (26px) + pos (28px) + name (flex:1) + team (28px) + up to 5 values (44px each = 220px) + divergence (16px) = 318px fixed minimum. At 375px minus padding, name gets ~57px.
**Prevention:** Hide individual source columns on mobile via CSS (Pattern 2 in ARCHITECTURE.md). Show only composite + position + name. Always render columns in HTML, control visibility with CSS.
**Detection:** Render board with all 5 sources at 375px. If names truncate to 2-3 characters, needs restructuring.
**Confidence:** HIGH -- computed from known CSS widths.

---

### Pitfall 8: Animations Replaying on Every Re-render

**What goes wrong:** CSS entrance animations (`.p-row` stagger, `.sb-rec` cascade, `panelIn`) re-trigger on every `render()` because innerHTML replacement creates new DOM nodes. During live draft with 10-second polling, content repeatedly fades/slides in.
**Prevention:**
- Use targeted updates (`scheduleUpdate()`) instead of full render for data updates -- existing DOM nodes are not destroyed
- For full renders, add `.no-animate` class to `#app` during data-driven renders, removing entrance animations
- Animation classes only applied on initial view entry
**Detection:** Enter draft room, wait for background sources. Count animation replays. If sidebar cards slide in more than once without tab change, issue is active.
**Confidence:** HIGH -- verified in CSS (lines 269-288) and render pattern (line 884).

---

### Pitfall 9: Scroll Position Loss During Poll Updates

**What goes wrong:** Poll fires every 10 seconds. When new picks detected, calls `render()`. User scrolled to player #47 -- scroll resets to top. Happens every time opponent picks during active draft.
**Prevention:** Save scroll positions before render, restore via rAF after. Apply to `.board-panel` and `.sidebar`. Use instant scroll (not smooth) for restoration.
**Detection:** Enter active draft, scroll board down, wait for pick. If board jumps to top, confirmed.
**Confidence:** HIGH -- verified (poll triggers render at line 862).

---

### Pitfall 10: `overflow: hidden` on Room Container Clipping Stacked Content

**What goes wrong:** Room has `height: calc(100vh - 52px); overflow: hidden`. On mobile, stacked layout (board + sidebar) exceeds viewport height. Bottom content permanently clipped with no scroll.
**Prevention:** On mobile, change to `overflow-y: auto` or `height: auto` with `min-height`. Keep `overflow: hidden` on desktop where two-column grid handles internal panel scrolling.
**Detection:** At <= 1000px, check if bottom sidebar content is cut off. If cannot scroll to sidebar, overflow is clipping.
**Confidence:** HIGH -- verified (line 66 `overflow:hidden` + line 67 single-column stack).

---

### Pitfall 11: `content-visibility: auto` with Wrong Intrinsic Size

**What goes wrong:** If `contain-intrinsic-size` is set too small, browser thinks content is off-screen and skips rendering, leaving blank gaps in the board.
**Prevention:** Set `contain-intrinsic-size: 0 40px` per row (estimated row height). Wrap with `@supports (content-visibility: auto)` to guard older browsers. Apply only to the board list container, not individual critical UI elements.
**Detection:** Scroll rapidly through board. If blank gaps appear before content renders, intrinsic size needs adjustment.
**Confidence:** MEDIUM -- `content-visibility` is Baseline as of Sep 2025 but Safari 18+ required.

## Minor Pitfalls

### Pitfall 12: Font Loading Flash on Mobile Networks

**What goes wrong:** Three Google Fonts loaded via CDN. On slow mobile, FOUT as system fonts swap to web fonts. Instrument Serif (wider italic) and JetBrains Mono (wider than system mono) cause layout shift on swap.
**Prevention:** Already using `display=swap` (correct). Ensure layout containers don't have fixed widths dependent on font metrics. Consider `font-display: optional` for JetBrains Mono (non-critical) to prevent swap entirely.
**Detection:** Throttle to "Slow 3G" in DevTools, hard refresh. Watch for layout jumps.
**Confidence:** LOW -- impact depends on actual network conditions.

---

### Pitfall 13: Trade Evaluator Input Focus Loss During Re-render

**What goes wrong:** Trade inputs destroyed and recreated when background source triggers `render()`. Cursor position and focus lost. On mobile, keyboard dismissal/reappearance is jarring.
**Prevention:** When `scheduleUpdate()` is triggered by source loading, skip re-rendering trade evaluator if user is on trade tab with active input. Check `document.activeElement` before updating.
**Detection:** Open trade tab, start typing player name, wait for background source to load. If keyboard dismisses, pitfall active.
**Confidence:** HIGH -- verified in code as known issue.

---

### Pitfall 14: CSS Specificity Conflicts During Refactor

**What goes wrong:** New mobile-first base styles conflict with existing styles. Cascading specificity causes unexpected overrides.
**Prevention:** Keep selectors flat (they already are). Test each component in isolation. Never use `!important` -- if needed, it signals a specificity problem to fix.
**Detection:** Visual regression at any viewport width after adding new CSS rules.
**Confidence:** MEDIUM -- standard refactoring risk.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Loading overflow fix | Targeted update breaks event binding | After subtree innerHTML replacement, re-bind events on replaced subtree only via scoped `bindEvents()` |
| Loading overflow fix | Multiple sources resolve simultaneously, double-update | `requestAnimationFrame` batching via `scheduleUpdate()` |
| Mobile-first CSS refactor | Desktop regression from missing property in `min-width` rule | Audit every CSS property. Test desktop after each change. |
| Header responsive | Losing access to source status on mobile | Ensure Sources tab is reachable. Add "3/5 sources" badge to header. |
| Room grid responsive | `overflow:hidden` clips stacked content on mobile | Switch to `overflow-y:auto` or `height:auto` at mobile breakpoints |
| Board columns responsive | Column visibility changes cause layout shift | Always render all columns in HTML. CSS controls visibility. |
| Sidebar on mobile | Content feels cramped below board | Full-width sidebar sections with adequate spacing. Consider collapsible sections. |
| Animations on re-render | Entrance animations replay every 10 seconds | Use targeted updates. Apply animation classes only on view entry. |
| Scroll preservation | Restored scroll position incorrect after content reorder | Save scrollTop, restore after rAF. Use instant scroll, not smooth. |
| Viewport height | Mobile Safari address bar breaks fixed height | Use `dvh` with `vh` fallback, or `height:auto` on mobile. |

## Sources

- [Preventing a Grid Blowout - CSS-Tricks](https://css-tricks.com/preventing-a-grid-blowout/)
- [The Minimum Content Size in CSS Grid - Ahmad Shadeed](https://ishadeed.com/article/min-content-size-css-grid/)
- [Defensive CSS - Grid Min Content Size](https://defensivecss.dev/tip/grid-min-content-size/)
- [Overflow Issues in CSS - Smashing Magazine](https://www.smashingmagazine.com/2021/04/css-overflow-issues/)
- [Preventing Layout Shift with Modern CSS - OpenReplay](https://blog.openreplay.com/preventing-layout-shift-modern-css/)
- [How to Optimize for CLS with Async Content - Medium](https://medium.com/ynap-tech/how-to-optimize-for-cls-when-having-to-load-more-content-3f60f0cf561c)
- [MDN: minmax()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/minmax)
- [MDN: content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility)
- [content-visibility Baseline - web.dev](https://web.dev/blog/css-content-visibility-baseline)

---

*Pitfalls audit: 2026-03-08*
