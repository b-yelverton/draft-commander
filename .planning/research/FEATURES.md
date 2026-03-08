# Feature Landscape

**Domain:** Responsive design & loading UX for a dynasty fantasy football draft assistant
**Researched:** 2026-03-08

## Table Stakes

Features users expect. Missing = product feels broken on mobile.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Fix loading overflow / layout shift | Background source loading triggers full `render()` causing visual breakage when entering room view. Active bug. | Medium | Root cause: full `innerHTML` re-render during async source loads. Fix with targeted DOM updates for board and sidebar subtrees, plus `requestAnimationFrame` batching for rapid sequential source loads. |
| Mobile-friendly room layout (single column) | Current `1fr 340px` grid is unusable at 375px. Content overflows or compresses to unreadable. | Medium | Existing `@media(max-width:1000px)` only changes grid columns -- does not adapt tabs, player rows, sidebar sections, or touch targets. Needs mobile-first rewrite. |
| Readable player rows on mobile | Player rows use flex with many fixed-width columns (rank 26px, pos 28px, team 28px, multiple values 44px each). On small screens, player name gets ~60px. | Medium | Hide individual source value columns on mobile via CSS. Show only composite rank + position + name. Users can see full breakdown on Sources tab. |
| Touch-friendly tap targets | Buttons, tabs, and interactive elements sized for mouse precision. Room-tabs at `6px 14px` padding, pos-filters at `4px 12px`. WCAG requires minimum 44x44px. | Low | Increase padding on `.room-tab`, `.pos-filter`, `.btn-sm`, `.refresh-btn` at mobile breakpoints. CSS-only. |
| Header responsive collapse | Header shows logo + 5 source pills + tip button + switch draft + live indicator in flex row. Overflows at 375px. | Low | Hide source pills on mobile (visible on Sources tab). Show logo + live indicator only. |
| Tab navigation on mobile | Six room tabs overflow on narrow screens. | Low | Horizontal scroll with `overflow-x: auto` and `scroll-snap-type: x mandatory` on `.room-tabs`. Standard pattern for 5+ tabs. |
| Prevent scroll position loss on re-render | `innerHTML` replacement destroys scroll position. Users scroll to player #47, poll re-render jumps to top. | Medium | Save `.board-panel.scrollTop` and `.sidebar.scrollTop` before render, restore via `requestAnimationFrame` after. |
| No horizontal scroll on any viewport | `overflow-x: hidden` on body but fixed-width elements (340px sidebar, 320px minmax cards) can force horizontal scroll. | Low | Audit all fixed pixel widths. Use `min(340px, 100%)` or responsive equivalents. |

## Differentiators

Features that make the mobile experience good, not just functional.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Skeleton loading for sidebar | Structural placeholders with shimmer animation while background sources load. Users see the app is working, not broken. Reduces perceived load time. | Low | Pure CSS shimmer: `linear-gradient(90deg, surface2 25%, surface3 50%, surface2 75%)` with `background-size: 200% 100%` and `@keyframes shimmer`. Render skeleton HTML when source count < expected. |
| Progressive source hydration | Board renders immediately with FantasyCalc data, then smoothly updates as KTC/DD/DP load. No full-page flash. | Medium | Requires targeted DOM updates (updateBoard/updateSidebar) instead of full innerHTML replacement. Source columns fade in via CSS transition when data arrives. |
| Source loading progress indicator | Replace scattered source pills with a single "3/5 sources" badge in mobile header. Communicates loading progress cleanly. | Low | Simple CSS + JS update to existing `updatePills()`. Cleaner than 5 separate pill indicators on mobile. |
| Landscape mode for tablets | Fantasy drafts on tablets often happen in landscape. Restore two-column layout even on smaller devices when horizontal space is available. | Low | `@media (min-width: 740px) and (orientation: landscape)` to restore two-column grid with narrower sidebar. CSS-only. |
| Horizontal scrollable tab bar with active indicator | Tabs scroll horizontally with current tab always scrolled into view. Active tab has underline indicator. | Low | `overflow-x: auto; scrollbar-width: none; scroll-snap-type: x mandatory` on tab container. JS scrolls active tab into view with `scrollIntoView({inline:'center'})`. |

## Anti-Features

Features to explicitly NOT build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Hamburger menu | The app has 4 views and 6 tabs. Hamburger hides navigation behind extra tap. During live draft, every second matters. | Horizontal scrollable tab bar. All tabs visible and tappable. |
| Separate mobile views/render paths | Maintaining two render functions per view doubles code in single-file architecture. Leads to divergence. | Responsive CSS adapts same HTML. One render function per view. |
| CSS framework (Tailwind/Bootstrap) | Requires build step. Adds dependency. The app has ~350 lines of CSS. | Continue with vanilla CSS. 2-3 breakpoints is trivial. |
| Pull-to-refresh | App already polls every 10 seconds. Adds complex touch handling that conflicts with native scroll. | Keep existing refresh button + auto-polling. |
| Dark mode toggle | Scope creep. This milestone is responsive + loading fix. | Future milestone if desired. |
| Virtual scrolling for board | Over-engineering for 200-300 rows. | Use `content-visibility: auto` with `contain-intrinsic-size` for rendering performance. Zero JS, one CSS property. |
| Native app wrapper (Capacitor) | Massive complexity for a tool used a few times per year. | Make responsive web app excellent. Add `apple-mobile-web-app-capable` meta tag for home screen install. |
| Complex gesture system | Multi-touch, pinch-zoom, long-press -- fragile in vanilla JS, hard to test. | Tap to select, scroll to browse. Standard browser zoom. |

## Feature Dependencies

```
Fix loading overflow --> Skeleton loading (skeleton replaces broken loading state)
Fix loading overflow --> Progressive source hydration (hydration needs targeted updates)
Fix loading overflow --> Prevent scroll loss (both involve render cycle changes)
Mobile-first breakpoints --> Mobile room layout (layout depends on breakpoint foundation)
Mobile room layout --> Sidebar reflow (sidebar depends on grid layout)
Mobile room layout --> Tab navigation (tabs need correct layout context)
Mobile room layout --> Header collapse (header must fit before room content)
Mobile room layout --> Touch targets (layout must be right before sizing targets)
Readable player rows --> Mobile room layout (rows live inside room grid)
```

## MVP Recommendation

Prioritize -- minimum to make the app usable on mobile and fix the loading bug:

1. **Fix loading overflow** -- Active bug. Targeted DOM updates + rAF batching. Highest impact.
2. **Mobile-first breakpoint refactor** -- Flip from `max-width:1000px` to `min-width` mobile-first. Add 600px tablet breakpoint. Foundation for everything else.
3. **Mobile room layout** -- Single-column grid, sidebar below board. Board full-width.
4. **Header responsive collapse** -- Pills hidden on mobile. Logo + live indicator only.
5. **Readable player rows** -- Hide individual source columns on mobile. Composite rank + name + position only.
6. **Tab navigation** -- Horizontal scrollable tabs for 6 room tabs.
7. **Touch targets** -- 44px minimum on interactive elements.
8. **Scroll position preservation** -- Save/restore scrollTop across re-renders.

Defer:
- **Skeleton loading**: Valuable but not blocking. Spinner works, just not polished.
- **Progressive source hydration**: Medium complexity, stretch goal if targeted updates are in place.
- **Landscape optimization**: Small user segment, layer on later.

## Complexity Budget

Given single-file constraint (~1970 lines), this work is primarily CSS additions with minimal JS changes:

- **CSS-only** (Low): Header collapse, tab scroll, touch targets, column hiding, landscape mode -- media query additions
- **CSS + minor JS** (Medium): Room layout (may need JS for sidebar toggle), scroll preservation (save/restore scrollTop), skeleton loading (CSS skeletons, JS to swap states)
- **JS architectural** (High): Targeted DOM updates (updateBoard/updateSidebar), render batching

Estimate: ~120-150 lines of CSS, ~50-80 lines of JS changes. Well within budget.

## Sources

- [MDN: Responsive Web Design](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design) - Core responsive patterns
- [Skeleton Screens with CSS - freeCodeCamp](https://www.freecodecamp.org/news/how-to-build-skeleton-screens-using-css-for-better-user-experience/) - Pure CSS skeleton implementation
- [Preventing Layout Shift with Modern CSS](https://blog.openreplay.com/preventing-layout-shift-modern-css/) - CLS prevention
- [Content Jumping - CSS-Tricks](https://css-tricks.com/content-jumping-avoid/) - Async content patterns
- [CanIUse: Container Queries](https://caniuse.com/css-container-queries) - 95%+ browser support

---

*Feature landscape analysis: 2026-03-08*
