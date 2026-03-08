# Research Summary

**Project:** Draft Commander -- Responsive Design & Loading UX
**Synthesized:** 2026-03-08

## Executive Summary

Draft Commander is a single-file vanilla JS draft assistant (~1970 lines) that needs two things: responsive design for phone/tablet use, and a fix for the visual overflow bug caused by full DOM re-renders when background data sources load. The research confirms that both problems are solvable with CSS additions and a targeted JS rendering change -- no architectural overhaul, no new dependencies, no build step required. The total estimated change is ~120-150 lines of CSS and ~50-80 lines of JS.

The recommended approach is a mobile-first CSS refactor using 3 breakpoints (600px, 1000px, 1400px), replacing the current single desktop-first `max-width:1000px` rule. For the loading bug, the fix is introducing targeted DOM updates (`scheduleUpdate()` with `requestAnimationFrame` batching) so background source loads only replace board and sidebar subtrees instead of the entire `#app` innerHTML. This eliminates scroll position loss, animation replay, and the visual overflow that occurs during live drafts.

The primary risk is the mobile-first CSS refactor breaking the existing desktop layout. Every property that currently works as an implicit desktop default must be explicitly moved into a `min-width:1000px` media query. This is tedious but straightforward with careful auditing. The loading fix carries moderate risk around event re-binding after subtree replacement, but the `scheduleUpdate()` pattern is well-documented and the implementation is contained to ~50 lines of JS.

## Key Findings

### From STACK.md

- **CSS Grid `auto-fit`/`minmax()`** (97%+ support) -- fluid grid layouts that reflow without hardcoded column counts
- **`clamp()` for fluid sizing** (96%+ support) -- already used in codebase on `.setup h1`, extend everywhere to eliminate per-breakpoint font rules
- **Container Queries** (95%+ support) -- for sidebar sections that must respond to container width, not viewport width
- **Mobile-first `min-width` breakpoints** -- flip from current `max-width:1000px` to 3 progressive breakpoints
- **CSS skeleton placeholders** -- pure CSS shimmer animation, zero dependencies, replaces broken loading state
- **`content-visibility: auto`** -- skip rendering off-screen board rows, 80% of virtual scrolling benefit with zero JS
- **`scrollbar-gutter: stable`** (92%+ support) -- prevent layout shift when scrollbar appears during content load
- **No new dependencies.** No CSS frameworks, no build tools, no preprocessors. Vanilla CSS and JS only.

### From FEATURES.md

**Table Stakes (must ship):**
1. Fix loading overflow -- active bug, highest priority
2. Mobile-friendly room layout (single-column grid)
3. Readable player rows (hide source columns on mobile, show composite only)
4. Touch-friendly tap targets (44px minimum per WCAG)
5. Header responsive collapse (hide pills on mobile)
6. Tab navigation (horizontal scroll for 6 room tabs)
7. Scroll position preservation across re-renders
8. No horizontal scroll on any viewport

**Differentiators (should ship):**
- Skeleton loading for sidebar sections
- Progressive source hydration (board renders immediately, updates smoothly)
- Source loading progress indicator ("3/5 sources" badge)
- Landscape tablet mode

**Anti-features (do not build):**
- Hamburger menu, separate mobile render paths, CSS framework, pull-to-refresh, dark mode toggle, virtual scrolling, native app wrapper, complex gesture system

### From ARCHITECTURE.md

- **No architectural overhaul.** CSS-layer responsive additions plus one targeted rendering change in JS.
- **Core change:** Source loads call `scheduleUpdate()` instead of `render()`. Full `render()` reserved for view transitions.
- **Column visibility via CSS only** -- always render all columns in HTML, use media queries to show/hide. Prevents layout shift from column count changes.
- **Container queries for sidebar** -- sidebar is 340px on desktop but full-width on mobile; media queries cannot distinguish these contexts.
- **Room grid on mobile** -- `height: auto; overflow-y: auto` replaces `height: calc(100vh - 52px); overflow: hidden`.
- **Size estimate:** ~120-200 net lines added to ~1970-line file.

### From PITFALLS.md

**Top 5 pitfalls (ranked by impact):**

1. **Full DOM re-render causing layout shift** (CRITICAL) -- the root cause of the loading overflow bug. Fix: `scheduleUpdate()` with rAF batching and targeted subtree updates.
2. **CSS Grid blowout from `1fr` min-content** (CRITICAL) -- `1fr` defaults to `min-width: auto`, causing horizontal overflow. Fix: use `minmax(0, 1fr)` and `min-width: 0` on grid children.
3. **Mobile-first refactor breaking desktop** (CRITICAL) -- missing a property in `min-width` rule causes desktop regression. Fix: audit every CSS property, test desktop after each change.
4. **Hiding content on mobile instead of reorganizing** (CRITICAL) -- sidebar sections contain the core value proposition. Fix: stack below board, never hide entire sections.
5. **`overflow: hidden` clipping stacked content on mobile** (MODERATE) -- room container clips sidebar when stacked vertically. Fix: switch to `overflow-y: auto` or `height: auto` at mobile breakpoint.

**Additional risks:** Mobile Safari 100vh bug (use `dvh` fallback), animation replay on re-render (use targeted updates), touch targets below 44px, trade evaluator input focus loss during re-render.

## Implications for Roadmap

### Suggested Phase Structure

**Phase 1: Loading Fix and Render Architecture** (do first -- everything depends on this)
- Introduce `scheduleUpdate()` with `requestAnimationFrame` batching
- Add `id` attributes to board and sidebar containers for targeted updates
- Source loads call `scheduleUpdate()` instead of `render()`
- Save/restore scroll positions across updates
- Suppress animation replay on data-driven updates
- **Features:** Fix loading overflow, scroll position preservation, progressive source hydration
- **Pitfalls to avoid:** Event re-binding after subtree replacement, double-update from simultaneous source loads, trade evaluator input focus loss
- **Rationale:** This is the active bug. It also establishes the targeted update pattern that skeleton loading and other features depend on. Every subsequent phase benefits from stable rendering.

**Phase 2: Mobile-First CSS Foundation** (do second -- layout foundation for all responsive work)
- Flip from `max-width:1000px` to `min-width` mobile-first breakpoints (600px, 1000px, 1400px)
- Fix CSS Grid blowout: `minmax(0, 1fr)` and `min-width: 0` on grid children
- Room grid: single-column on mobile with `height: auto; overflow-y: auto`
- Sidebar stacks below board on mobile (full-width, never hidden)
- Fluid spacing tokens via `clamp()` on `--sp-*` custom properties
- Mobile Safari viewport fix (`dvh` with `vh` fallback)
- **Features:** Mobile room layout, no horizontal scroll, fluid spacing
- **Pitfalls to avoid:** Desktop regression from missed properties, `overflow:hidden` clipping stacked content, grid blowout
- **Rationale:** This is the structural foundation. All component-level responsive work (header, tabs, board rows) depends on the grid and breakpoint system being correct.

**Phase 3: Component-Level Responsive Design** (do third -- adapts individual components)
- Header: hide source pills on mobile, show logo + live indicator + "3/5 sources" badge
- Tabs: horizontal scroll with `scroll-snap-type` on `.room-tabs`
- Board rows: hide individual source columns on mobile via CSS, show composite rank + name + position
- Touch targets: 44px minimum on `.room-tab`, `.pos-filter`, `.btn-sm`, `.refresh-btn`
- Fluid typography: extend `clamp()` to all type sizes
- Container queries for sidebar sections
- Landscape tablet mode
- **Features:** Header collapse, tab navigation, readable player rows, touch targets, landscape mode
- **Pitfalls to avoid:** Hiding content instead of reorganizing, player row value column overflow, font loading layout shift
- **Rationale:** These are independent component-level changes that can be done in any order once the grid and breakpoint foundation is in place.

**Phase 4: Loading UX Polish** (do last -- polish layer on top of working responsive + render system)
- Skeleton loading placeholders for sidebar sections
- Source loading progress badge in mobile header
- `content-visibility: auto` on board rows with `@supports` guard
- `scrollbar-gutter: stable` on scroll containers
- `contain: layout` on render containers
- **Features:** Skeleton loading, source progress indicator, rendering performance
- **Pitfalls to avoid:** Wrong `contain-intrinsic-size` for content-visibility, scrollbar-gutter browser support gaps
- **Rationale:** These are polish and performance optimizations that build on top of the working responsive layout and stable rendering system. They improve perceived performance but the app is fully functional without them.

### Research Flags

| Phase | Research Needed? | Rationale |
|-------|-----------------|-----------|
| Phase 1: Loading Fix | No | Pattern is well-documented. Implementation is ~50 lines of JS. ARCHITECTURE.md provides exact code. |
| Phase 2: Mobile-First CSS | No | Standard responsive refactor. Requires careful auditing, not research. |
| Phase 3: Component Responsive | No | All patterns are standard CSS. Container queries, scroll-snap, clamp() are well-documented. |
| Phase 4: Loading UX Polish | Maybe | `content-visibility` behavior on Safari 18 may need validation on actual devices. Skeleton loading patterns are standard. |

All phases use well-documented patterns. No phase requires `/gsd:research-phase`. The main risk is execution quality (missing a CSS property during refactor), not knowledge gaps.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommended CSS features verified via CanIUse/MDN with 90%+ support. No new dependencies. |
| Features | HIGH | Feature list derived from direct codebase analysis. Dependencies mapped from actual CSS/JS structure. |
| Architecture | HIGH | Targeted DOM update pattern is standard vanilla JS. Code references verified against actual line numbers. |
| Pitfalls | HIGH | Critical pitfalls verified against codebase (line numbers cited). Grid blowout, full re-render, overflow:hidden all confirmed in current CSS/JS. |

**Overall Confidence: HIGH**

### Gaps to Address

- **Mobile Safari testing:** The `dvh` viewport unit and `content-visibility` behavior should be validated on actual iOS Safari, not just Chrome DevTools responsive mode. No amount of research substitutes for device testing.
- **Exact scroll restoration timing:** The `requestAnimationFrame` approach for scroll restoration after `innerHTML` replacement may need a double-rAF or `setTimeout(0)` if the browser has not finished layout by the first frame. Test empirically.
- **Event re-binding scope:** After targeted subtree replacement, event listeners on replaced DOM elements are lost. The existing `bindEvents()` function re-binds everything globally -- this may need scoping to avoid performance issues if called frequently (every 10-second poll).
- **Sidebar mobile UX decision:** Should the sidebar appear below the board on mobile (always visible, scrollable) or be tab-selectable? Research recommends stacking below board, but this is a design decision that may warrant user input during Phase 3.

## Sources

### From STACK.md
- [CSS Container Queries - CanIUse](https://caniuse.com/css-container-queries)
- [CSS Container Queries - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries)
- [content-visibility Baseline - web.dev](https://web.dev/blog/css-content-visibility-baseline)
- [Modern Fluid Typography - Smashing Magazine](https://www.smashingmagazine.com/2022/01/modern-fluid-typography-css-clamp/)
- [clamp() - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/clamp)
- [Skeleton Loader with CSS - freeCodeCamp](https://www.freecodecamp.org/news/how-to-build-skeleton-screens-using-css-for-better-user-experience/)

### From FEATURES.md
- [MDN: Responsive Web Design](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design)
- [Preventing Layout Shift - OpenReplay](https://blog.openreplay.com/preventing-layout-shift-modern-css/)

### From ARCHITECTURE.md
- [CSS Grid minmax() - Ahmad Shadeed](https://ishadeed.com/article/css-grid-minmax/)
- [content-visibility - web.dev](https://web.dev/articles/content-visibility)

### From PITFALLS.md
- [Preventing a Grid Blowout - CSS-Tricks](https://css-tricks.com/preventing-a-grid-blowout/)
- [Min Content Size in CSS Grid - Ahmad Shadeed](https://ishadeed.com/article/min-content-size-css-grid/)
- [Defensive CSS - Grid Min Content Size](https://defensivecss.dev/tip/grid-min-content-size/)
- [Overflow Issues in CSS - Smashing Magazine](https://www.smashingmagazine.com/2021/04/css-overflow-issues/)

---

*Research synthesis: 2026-03-08*
