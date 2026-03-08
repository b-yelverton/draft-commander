# Technology Stack

**Project:** Draft Commander -- Responsive Design & Loading UX
**Researched:** 2026-03-08

## Recommended Stack

This is a CSS-only and vanilla JS milestone. No new dependencies. The entire stack recommendation is about which CSS techniques and JS patterns to use within the existing single-file architecture.

### CSS Responsive Techniques

| Technology | Browser Support | Purpose | Why |
|------------|----------------|---------|-----|
| CSS Grid + `auto-fit`/`minmax()` | 97%+ | Fluid grid layouts that reflow without breakpoints | Already using Grid for `.room`; extend with `auto-fit` for sidebar cards, opponent grid, chart stats. Eliminates hardcoded column counts. |
| `clamp()` for fluid sizing | 96%+ | Fluid font sizes, padding, gaps without breakpoints | Already used on `.setup h1`. Extend to all type sizes and spacing. Reduces breakpoint count. Use `clamp(min, preferred, max)` with rem+vw combo for accessibility (pure vw breaks zoom). |
| Container Queries (`@container`) | 95%+ (Chrome 105+, Firefox 110+, Safari 16+) | Component-level responsive behavior | Use for sidebar sections and board panel -- these components need to respond to their container width, not viewport width, especially when the 2-column room layout collapses. |
| Mobile-first `min-width` breakpoints | Universal | Progressive enhancement from phone upward | Current app uses one `max-width:1000px` breakpoint (desktop-first). Flip to mobile-first: base styles for phone, `min-width:600px` for tablet, `min-width:1000px` for desktop. |
| CSS Custom Properties (already in use) | 97%+ | Breakpoint-responsive spacing/sizing tokens | Already using `--sp-*` tokens. Redefine them at breakpoints so components scale automatically. |

### CSS Loading & Layout Stability Techniques

| Technology | Browser Support | Purpose | Why |
|------------|----------------|---------|-----|
| `overflow: auto` with `min-height` | Universal | Prevent content from overflowing containers during async load | The core fix for the loading overflow bug. The `.room` uses `overflow:hidden` but async source loads trigger `render()` which rebuilds DOM -- content can exceed container before layout stabilizes. |
| `scrollbar-gutter: stable` | 92%+ (Chrome 94+, Firefox 97+, Safari 17.4+) | Prevent layout shift when scrollbar appears/disappears | Reserve scrollbar space on `.board-panel` and `.sidebar` so content doesn't jump when scrollable content loads. |
| CSS `contain: layout` on render containers | 95%+ | Isolate layout recalculations to affected subtree | When async sources load and trigger `render()`, layout containment prevents the entire page from reflowing. Apply to `.board-panel`, `.sidebar`. |
| Skeleton/placeholder CSS patterns | Universal (pure CSS) | Visual stability during async source loading | Show placeholder shapes for sidebar recommendations and board rows while background sources load. Pure CSS shimmer animation with `background: linear-gradient()` + `background-size` + `@keyframes`. |
| `content-visibility: auto` | Baseline as of Sep 2025 (Chrome 85+, Firefox 125+, Safari 18+) | Skip rendering off-screen board rows | The board can have 200+ player rows. `content-visibility: auto` with `contain-intrinsic-size` lets the browser skip rendering off-screen rows. |

### JS Patterns (No New Dependencies)

| Pattern | Purpose | Why |
|---------|---------|-----|
| Targeted DOM updates instead of full `innerHTML` | Prevent scroll reset and input loss on async source load | Current `render()` replaces entire `#app` innerHTML. For background source updates, use targeted updates: only re-render the board table and sidebar recommendations, not the entire view. This is the root cause of the loading overflow. |
| `requestAnimationFrame` batching | Debounce rapid re-renders when multiple sources load | If KTC and DD both resolve within milliseconds, batch into single render. |
| `matchMedia` API for JS breakpoint logic | Conditional behavior at breakpoints (e.g., collapse sidebar to tabs on mobile) | Already available in all modern browsers. Use `window.matchMedia('(min-width:1000px)')` with `.addEventListener('change', ...)` instead of resize listeners. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Responsive approach | Mobile-first CSS with 2-3 breakpoints | Container queries only | Container queries are for component-level responsiveness. Still need breakpoints for major layout shifts (single-column vs two-column room grid). Use both. |
| Loading UX | CSS skeleton placeholders | JS loading spinner per section | Skeletons provide better perceived performance -- user sees structure immediately. Spinners feel like waiting. Already have a global spinner; section-level skeletons are the upgrade. |
| Layout shift prevention | `scrollbar-gutter: stable` | `overflow-y: scroll` (always show scrollbar) | `scrollbar-gutter` is cleaner -- reserves space without showing a visible scrollbar. Fallback: `overflow-y: scroll` works everywhere. |
| Off-screen rendering | `content-visibility: auto` | Virtual scrolling (JS) | Virtual scrolling requires significant JS complexity (scroll position management, dynamic row heights). `content-visibility` gives 80% of the benefit with zero JS and one CSS property. |
| Re-render strategy | Targeted DOM patching | Full `innerHTML` replacement | Full innerHTML is the cause of the overflow bug. When background sources load, the entire DOM rebuilds, causing momentary overflow. Targeted updates fix this at the source. |
| Typography scaling | `clamp()` with rem+vw | Multiple `@media` font-size rules | `clamp()` is one line vs 3+ breakpoint rules. It also produces smooth scaling instead of jumps. Already used in `.setup h1` -- extend everywhere. |

## Breakpoint Strategy

Use exactly 3 breakpoints, mobile-first:

```css
/* Base: phone (< 600px) -- single column, stacked everything */

/* Tablet (>= 600px) -- wider cards, some side-by-side */
@media (min-width: 600px) { ... }

/* Desktop (>= 1000px) -- two-column room layout with sidebar */
@media (min-width: 1000px) { ... }

/* Wide (>= 1400px) -- more breathing room, wider sidebar */
@media (min-width: 1400px) { ... }
```

**Rationale:** The existing `max-width:1000px` breakpoint maps to the desktop threshold. Adding 600px covers the tablet gap. 1400px is optional for wide monitors. Mobile-first means the base CSS works on phones without any media query.

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| Tailwind CSS / any CSS framework | Requires build step. Violates single-file constraint. |
| CSS-in-JS (styled-components, etc.) | Requires build step and framework. |
| PostCSS / Sass / Less | Requires build step. Write vanilla CSS. |
| `@layer` for cascade management | The app has ~350 lines of CSS in one file. Layers add complexity without benefit at this scale. |
| CSS Subgrid | Browser support is good (93%+) but adds complexity for minimal gain here. The layouts are not nested grids. |
| `dvh`/`svh` dynamic viewport units | Tempting for mobile but inconsistent behavior across browsers. `100vh` with `-webkit-fill-available` fallback is more reliable. `dvh` support is ~90% but behavior varies. |
| Resize Observer for responsive logic | `matchMedia` is simpler and more performant for breakpoint-based JS logic. ResizeObserver is for element-level observation -- overkill when we have container queries for CSS and matchMedia for JS. |
| Framework-based skeleton libraries | Zero-dependency constraint. Pure CSS skeletons are trivial to implement. |

## Specific CSS Values

### Fluid Typography Scale

```css
/* Apply to existing type sizes */
.hdr-logo     { font-size: clamp(18px, 1rem + 0.5vw, 22px); }
.setup h1     { font-size: clamp(28px, 1.5rem + 2vw, 44px); } /* existing, refine */
.sb-rec .player { font-size: clamp(12px, 0.75rem + 0.25vw, 14px); }
body          { font-size: clamp(13px, 0.8rem + 0.1vw, 15px); }
```

### Fluid Spacing

```css
/* Redefine spacing tokens at breakpoints */
:root {
  --sp-lg: clamp(12px, 0.75rem + 0.25vw, 16px);
  --sp-xl: clamp(14px, 0.875rem + 0.5vw, 20px);
  --sp-2xl: clamp(16px, 1rem + 0.5vw, 24px);
}
```

### Skeleton Loading

```css
/* Shimmer animation for placeholders */
@keyframes shimmer {
  to { background-position: -200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
```

## Confidence Assessment

| Recommendation | Confidence | Basis |
|----------------|------------|-------|
| Mobile-first breakpoints at 600/1000/1400px | HIGH | Standard responsive practice, MDN docs, universal support |
| `clamp()` for fluid typography | HIGH | MDN docs, 96%+ support, already used in codebase |
| Container queries for sidebar/board | HIGH | 95%+ support as of 2025, MDN docs, CanIUse verified |
| `scrollbar-gutter: stable` | MEDIUM | 92%+ support, graceful degradation (no visual shift is a nice-to-have) |
| `content-visibility: auto` for board rows | MEDIUM | Baseline Sep 2025 per web.dev, but Safari 18+ required -- older iPhones may not have it. Use `@supports` guard. |
| CSS skeleton placeholders | HIGH | Pure CSS, zero-dependency, well-documented pattern |
| Targeted DOM updates for async loads | HIGH | Direct fix for the described overflow bug. Standard vanilla JS pattern. |
| `contain: layout` on panels | MEDIUM | 95%+ support, but effect depends on how render() rebuilds DOM. Worth applying but not a silver bullet. |

## Sources

- [CSS Container Queries - CanIUse](https://caniuse.com/css-container-queries) - Browser support data
- [CSS Container Queries - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries) - Specification reference
- [content-visibility Baseline - web.dev](https://web.dev/blog/css-content-visibility-baseline) - Baseline status Sep 2025
- [content-visibility - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility) - Property documentation
- [Modern Fluid Typography - Smashing Magazine](https://www.smashingmagazine.com/2022/01/modern-fluid-typography-css-clamp/) - clamp() best practices
- [Responsive and fluid typography - web.dev](https://web.dev/articles/baseline-in-action-fluid-type) - Baseline CSS fluid type
- [clamp() - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/clamp) - Function reference
- [Preventing Layout Shift with Modern CSS](https://blog.openreplay.com/preventing-layout-shift-modern-css/) - CLS prevention techniques
- [Content Jumping - CSS-Tricks](https://css-tricks.com/content-jumping-avoid/) - Layout shift patterns
- [Skeleton Loader with CSS - freeCodeCamp](https://www.freecodecamp.org/news/how-to-build-skeleton-screens-using-css-for-better-user-experience/) - Pure CSS skeleton implementation

---

*Stack research: 2026-03-08*
