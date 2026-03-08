# Visual Polish Research: Progressive Hydration Animations & Scroll Preservation

**Domain:** Data-heavy dashboard UI polish (vanilla JS, single-file static app)
**Researched:** 2026-03-08
**Overall confidence:** HIGH (techniques are well-established CSS/DOM patterns)

---

## Executive Summary

Draft Commander already has solid animation foundations: `rowIn` staggered entrance, `cardIn` sidebar cascade, skeleton shimmer loaders, and `val-pending` styling for unloaded source columns. The gap is specifically in the **transition from pending to loaded** -- values currently snap in when a source completes loading because `innerHTML` replacement destroys and recreates all DOM nodes, re-triggering entrance animations rather than smoothly transitioning individual cells.

Two distinct problems need solving:
1. **Hydration animation** -- when a source (KTC, DD, DP) finishes loading, the `--` pending values should fade/transition to real values
2. **Scroll preservation** -- the current `scrollTop` save/restore pattern on lines 931/934 is correct in approach but has a race condition with `innerHTML` replacement and animation replay

The good news: both problems are solvable with minimal code changes and zero new dependencies. The key insight is that the current `innerHTML`-based subtree replacement is the root cause of both issues. The solution is either (a) targeted DOM updates for source columns only, or (b) adopting a lightweight DOM diffing approach.

---

## Finding 1: CSS Hydration Animation Techniques

**Confidence: HIGH**

### Recommended Approach: CSS Transition on Class Toggle

The simplest and most performant technique for "pending to loaded" transitions:

```css
/* Base state for all source value cells */
.p-val {
  transition: opacity 0.3s var(--ease-out-quart), color 0.3s var(--ease-out-quart);
}

/* Pending state (already exists as .val-pending) */
.val-pending {
  color: var(--text3);
  opacity: 0.4;
}

/* Hydrated state -- add via class toggle when source loads */
.val-hydrated {
  animation: valIn 0.4s var(--ease-out-quart) both;
}

@keyframes valIn {
  from { opacity: 0; transform: translateY(2px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Why NOT `@starting-style`

The new CSS `@starting-style` rule (Baseline 2024) enables animating from `display: none`. It is elegant but not applicable here because:
- Our elements are never `display: none` -- they exist with `--` placeholder text
- We need to animate a **value change within an existing element**, not an element appearance
- Browser support is good but unnecessary complexity for this use case

### Why NOT JavaScript-driven animations (Web Animations API, GSAP)

- The app is a single-file static page with no dependencies -- adding GSAP would be antithetical
- Web Animations API is more powerful but CSS transitions handle opacity/transform perfectly
- CSS transitions are compositor-thread optimized; JS animations are main-thread

### Recommended Implementation Pattern

Instead of re-rendering entire board innerHTML when a source loads, do a **targeted column update**:

```javascript
function hydrateSourceColumn(sourceKey) {
  const selector = `.p-val.${sourceKey}`;
  document.querySelectorAll(selector).forEach(cell => {
    const playerId = cell.closest('.p-row')?.dataset?.playerId;
    if (!playerId) return;
    const newValue = getSourceValue(sourceKey, playerId);
    if (newValue) {
      cell.textContent = `#${newValue}`;
      cell.classList.remove('val-pending');
      cell.classList.add('val-hydrated');
    }
  });
}
```

This preserves the DOM (no innerHTML replacement), triggers CSS animations on just the changed cells, and leaves scroll position untouched.

---

## Finding 2: Scroll Preservation Strategies

**Confidence: HIGH**

### Current Implementation (lines 931-934)

```javascript
if(bp){const st=bp.scrollTop;bp.innerHTML=renderBoardInner(ba,recs);bp.scrollTop=st;}
if(sb){const st=sb.scrollTop;sb.innerHTML=renderSidebarInner(recs,recent);sb.scrollTop=st;}
```

This pattern is **correct in principle** but has two issues:

1. **Animation replay**: innerHTML replacement destroys all nodes and recreates them, re-triggering `rowIn` animation on every update. This causes a visual flash even though scroll position is restored.
2. **Timing fragility**: Setting `scrollTop` synchronously after innerHTML works in most browsers, but the browser may not have laid out the new content yet. A `requestAnimationFrame` wrapper is safer but the current code already runs inside one.

### Strategy A: Targeted DOM Updates (Recommended)

Avoid the problem entirely by not replacing innerHTML for source hydration:

- **Source loads**: Call `hydrateSourceColumn()` to update only the changed cells
- **Pick events / filter changes**: Continue using full innerHTML replacement (these legitimately change the row set)
- **Scroll preservation**: Only needed for pick events, where current pattern is fine

This is the highest-impact, lowest-risk approach because it eliminates unnecessary full re-renders for the most common update path (background source loading).

### Strategy B: DOM Diffing Library (morphdom)

If more sophisticated partial updates are needed later:

- **morphdom** (2.7KB gzipped) compares real DOM trees and patches minimally
- API: `morphdom(existingNode, newHTML)` -- drop-in replacement for innerHTML
- Preserves existing DOM nodes that haven't changed, so CSS transitions work naturally
- Preserves scroll position because unchanged parent containers are not destroyed

However, morphdom is a dependency and the app currently has zero. Reserve this for if/when the targeted update approach proves insufficient.

### Strategy C: content-visibility: auto (Performance Bonus)

For the 100-row player board, `content-visibility: auto` can skip rendering off-screen rows:

```css
.p-row {
  content-visibility: auto;
  contain-intrinsic-size: auto 36px; /* match row height */
}
```

This is Baseline as of September 2025 (all major browsers). It provides:
- 3-7x rendering performance improvement on initial paint
- Reduced layout cost during re-renders
- Natural scroll position preservation for off-screen content

**Caveat:** Can cause scrollbar jumpiness if `contain-intrinsic-size` doesn't match actual row height. Test carefully.

---

## Finding 3: Performance with Many Simultaneous Animations

**Confidence: HIGH**

### The Problem

Draft Commander renders up to 100 player rows. If all 100 rows have 3-4 cells animating simultaneously when a source loads, that is 300-400 concurrent CSS animations.

### What the Browser Can Handle

- **opacity and transform ONLY**: These run on the compositor thread, not the main thread. The browser can handle hundreds of simultaneous opacity transitions without jank.
- **color transitions**: Run on the main thread (triggers paint). Still fine for 100 elements but not 1000+.
- **DO NOT animate**: `width`, `height`, `top`, `left`, `margin`, `padding` -- these trigger layout recalculation per frame.

### Recommended Performance Strategy

1. **Stagger the hydration animation** by column index (KTC loads -> 100 cells animate, but stagger with CSS nth-child delays):

```css
.val-hydrated {
  animation: valIn 0.3s var(--ease-out-quart) both;
}
.p-row:nth-child(n+5) .val-hydrated { animation-delay: 20ms; }
.p-row:nth-child(n+15) .val-hydrated { animation-delay: 40ms; }
.p-row:nth-child(n+30) .val-hydrated { animation-delay: 60ms; }
.p-row:nth-child(n+50) .val-hydrated { animation-delay: 0ms; opacity: 1; } /* skip for far-off rows */
```

2. **Use `content-visibility: auto`** so off-screen rows skip animation entirely -- the browser won't composite animations for rows not in the viewport.

3. **Respect `prefers-reduced-motion`** (already exists in codebase at line 369). Extend to cover hydration animations:

```css
@media (prefers-reduced-motion: reduce) {
  .val-hydrated { animation: none; opacity: 1; }
}
```

4. **Avoid `will-change`**: Pre-declaring `will-change: opacity` on all 400 cells would allocate GPU layers for each, consuming more memory than the animation saves. Only useful for persistent animations (like the clock pulse), not one-shot transitions.

---

## Finding 4: Pending-to-Loaded Visual Strategy

**Confidence: MEDIUM (design judgment, not technical)**

### Per-Cell vs Per-Row vs Per-Column

| Strategy | Visual Effect | Complexity | Recommendation |
|----------|--------------|------------|----------------|
| **Per-cell** | Individual `--` values fade to numbers | Low | **Use this** |
| **Per-row** | Entire row fades when any source loads | Low | Confusing -- row already visible from FC data |
| **Per-column** | Column header pulses, all values in column animate | Medium | Over-engineered |
| **Per-source-group** | All data from one source animates together | Medium | Good alternative to per-cell |

### Recommendation: Per-Cell with Column Awareness

Use per-cell animation but trigger all cells in a column simultaneously when that source loads. This is effectively "per-column" behavior with per-cell CSS:

1. Source KTC finishes loading
2. `hydrateSourceColumn('ktc')` updates all KTC cells
3. Each cell gets `val-hydrated` class
4. CSS stagger delays create a subtle top-to-bottom cascade within the column
5. Visible rows animate; off-screen rows are skipped by `content-visibility: auto`

### Visual Design for the Transition

The current `val-pending` style (line 377: `color: var(--text3); opacity: 0.4`) showing `--` is a good "not loaded yet" state. The transition should:

- **Keep the `--` placeholder** (prevents layout shift when values arrive)
- **Fade out `--`, fade in value** via opacity transition
- **Brief color shift** from `var(--text3)` to the source-specific color (e.g., `var(--ktc-color)` for KTC values)
- **No layout changes** -- values should occupy the same space before and after

---

## Finding 5: Intersection with Dark Mode / Glassmorphism

**Confidence: MEDIUM (no dark mode work exists yet)**

### Current State

No dark mode or glassmorphism CSS exists in the codebase (confirmed via grep). The app uses CSS custom properties extensively (`var(--bg)`, `var(--surface)`, etc.), which is the correct foundation for themeable animations.

### Implications for Visual Polish Work

1. **Animation colors must use CSS variables**: Hardcoded colors in animations would break when dark mode overrides `--text`, `--surface`, etc. The current animations correctly use variables.

2. **Glassmorphism and animations**: If glassmorphism (backdrop-filter blur, translucent surfaces) is added later, `content-visibility: auto` can conflict with `backdrop-filter` because content-visibility creates a new stacking context. Test this interaction if/when glassmorphism ships.

3. **Skeleton shimmer colors**: The current shimmer animation (line 374) uses hardcoded `#e8e0d5` in the gradient. This needs to become a CSS variable for dark mode compatibility. Fix this during visual polish:

```css
/* Current (breaks in dark mode) */
.skeleton { background: linear-gradient(90deg, var(--surface2) 25%, #e8e0d5 50%, var(--surface2) 75%); }

/* Fixed */
:root { --shimmer: #e8e0d5; }
/* Dark mode would override: --shimmer: #3a3530; */
.skeleton { background: linear-gradient(90deg, var(--surface2) 25%, var(--shimmer) 50%, var(--surface2) 75%); }
```

4. **Animation easing tokens are already centralized** (line 290-292: `--ease-out-quart`, `--ease-out-expo`), which is good -- dark mode can inherit these without changes.

---

## Implementation Roadmap Recommendation

### Phase 1: Targeted Column Hydration (solves both problems)

**Priority: HIGH | Effort: Small | Risk: Low**

1. Add `data-player-id` attributes to `.p-row` elements in `renderBoardInner()`
2. Create `hydrateSourceColumn(sourceKey)` function
3. Call it from source load callbacks instead of `scheduleRoomUpdate()` when only source data changed
4. Add `.val-hydrated` CSS animation
5. Continue using full `scheduleRoomUpdate()` for pick events and filter changes

This single change fixes:
- Values snap in (replaced with fade-in animation)
- Scroll position lost on source load (no more innerHTML replacement for this path)
- Animation replay on every source load (DOM is preserved)

### Phase 2: Performance Optimization

**Priority: MEDIUM | Effort: Small | Risk: Low**

1. Add `content-visibility: auto` to `.p-row`
2. Add stagger delays to `.val-hydrated` animation
3. Extend `prefers-reduced-motion` to cover new animations

### Phase 3: Sidebar Hydration

**Priority: MEDIUM | Effort: Small | Risk: Low**

1. Apply same targeted update pattern to sidebar recommendations section
2. Skeleton-to-content transition for recommendations (already has skeleton HTML)
3. Scarcity section hydration animation

### Defer: DOM Diffing (morphdom)

Only pursue if targeted updates become unwieldy. The app's render model (innerHTML with string templates) works well for full re-renders; the targeted update approach covers the partial update case without adding dependencies.

---

## Key Technical Decisions

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Animation engine | CSS transitions + @keyframes | Zero dependencies, compositor-optimized, already used in codebase |
| DOM update strategy | Targeted cell updates for source hydration | Preserves scroll, enables transitions, minimal change to architecture |
| Stagger approach | CSS nth-child delays, cap at ~30 rows | Performance-safe, visual cascade effect |
| Off-screen optimization | `content-visibility: auto` | Baseline 2025, 3-7x render perf, skips off-screen animations |
| Full re-render trigger | Keep innerHTML for pick events and tab switches | These legitimately change the DOM structure |
| Dependency additions | None | Maintain zero-dependency architecture |

---

## Sources

- [MDN: CSS Transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Transitions/Using)
- [MDN: CSS Animation Performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)
- [web.dev: High-Performance CSS Animations](https://web.dev/animations-guide/)
- [web.dev: content-visibility](https://web.dev/articles/content-visibility)
- [web.dev: content-visibility Baseline](https://web.dev/blog/css-content-visibility-baseline)
- [morphdom GitHub](https://github.com/patrick-steele-idem/morphdom)
- [Josh Collinsworth: Better CSS Transitions](https://joshcollinsworth.com/blog/great-transitions)
- [cekrem: content-visibility Performance](https://cekrem.github.io/posts/content-visibility-auto-performance/)
