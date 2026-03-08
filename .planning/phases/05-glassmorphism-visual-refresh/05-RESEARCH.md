# Phase 5: Glassmorphism & Visual Refresh - Research

**Researched:** 2026-03-08
**Domain:** CSS backdrop-filter glassmorphism, theme-aware glass effects, mobile performance
**Confidence:** HIGH

## Summary

Phase 5 adds glassmorphism (backdrop-filter blur + semi-transparent backgrounds) to four key UI surfaces in Draft Commander: the sticky header (`.hdr`), modal overlay (`.modal-overlay`), pick clock bar (`.room-top`), and sticky section headers (`.section-hdr`). The app already has one `backdrop-filter` usage (`.modal-overlay` at `blur(2px)`) and has all the theming infrastructure in place from Phase 4 (`[data-theme="light"]`/`[data-theme="dark"]` with CSS custom properties including `--shadow-rgb` channel variables).

The primary implementation gap is that the target elements currently use opaque `background:var(--surface)` -- for `backdrop-filter` to be visible, these must become semi-transparent. This requires adding `--surface-rgb` channel variables to both theme blocks (light: `255,253,249` from `#fffdf9`, dark: `30,28,34` from `#1e1c22`) so glass backgrounds can use `rgba(var(--surface-rgb), 0.7)`. The `@supports (backdrop-filter: blur(1px))` guard ensures unsupported browsers keep the original solid background.

Mobile performance is a real concern but manageable: limit blur to 2-3 elements visible simultaneously, reduce blur radius on phone viewports (`max-width:599px`), and remove blur entirely from `.section-hdr` on mobile since multiple sticky section headers in a scrollable panel create cumulative GPU load. The app already has a `@media(max-width:599px)` breakpoint in use.

**Primary recommendation:** Add `--surface-rgb` variables to both theme blocks, then use `@supports` to progressively enhance `.hdr`, `.modal-overlay`, `.room-top`, and `.section-hdr` with `backdrop-filter: blur()` and semi-transparent backgrounds. Reduce or remove blur on mobile.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GLASS-01 | Sticky/overlapping elements use backdrop-filter blur with semi-transparent backgrounds | Standard Stack (--surface-rgb variables), Architecture Patterns (glass surface pattern), Code Examples (per-element CSS) |
| GLASS-02 | Glass effects degrade gracefully via @supports -- unsupported browsers get solid backgrounds | Architecture Patterns (@supports guard pattern), Code Examples (fallback strategy) |
| GLASS-03 | Mobile performance maintained -- blur radius reduced or removed on phone viewport | Common Pitfalls (mobile performance), Code Examples (mobile media query overrides) |
</phase_requirements>

## Standard Stack

### Core
| Property | Version/Value | Purpose | Why Standard |
|----------|--------------|---------|--------------|
| `backdrop-filter` | CSS Level 2 | Blur content behind semi-transparent elements | 95.75% global browser support, production-ready |
| `-webkit-backdrop-filter` | Prefixed | Safari < 18 support | Still ~8% of Safari users need prefix |
| `@supports` | CSS3 | Progressive enhancement guard | Only way to safely detect backdrop-filter support |
| CSS Custom Properties | Already in use | Theme-aware glass colors | Already established in Phase 4 |

### New CSS Variables Required
| Variable | Light Value | Dark Value | Purpose |
|----------|------------|------------|---------|
| `--surface-rgb` | `255,253,249` | `30,28,34` | RGB channels of `--surface` for `rgba()` glass backgrounds |
| `--glass-blur` | `12px` | `12px` | Centralized blur radius token for easy mobile override |
| `--glass-opacity` | `0.72` | `0.78` | Background opacity -- dark mode needs slightly higher to maintain contrast |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `backdrop-filter: blur()` | Background image with pre-blurred content | No real-time blur, requires image generation, not dynamic |
| `@supports` guard | Always apply blur, ignore old browsers | Visual breakage in unsupported browsers (transparent bg with no blur = unreadable) |
| CSS variable for blur radius | Hardcoded values per element | Cannot override globally for mobile, harder to maintain |

## Architecture Patterns

### Pattern 1: Glass Surface with @supports Guard
**What:** Progressive enhancement -- solid background by default, glass effect when supported
**When to use:** Every element receiving glassmorphism

```css
/* Base: solid background (works everywhere) */
.hdr {
  background: var(--surface);
}

/* Enhanced: glass effect when supported */
@supports (backdrop-filter: blur(1px)) {
  .hdr {
    background: rgba(var(--surface-rgb), var(--glass-opacity));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    backdrop-filter: blur(var(--glass-blur));
  }
}
```

**Key insight:** The solid background MUST remain as the base style outside `@supports`. The `@supports` block overrides it. This ensures unsupported browsers always get a readable surface.

### Pattern 2: Theme-Aware Glass Tuning
**What:** Different glass opacity/tint for light vs dark mode
**When to use:** Glass backgrounds that need to look good in both themes

```css
[data-theme="light"] {
  --surface-rgb: 255, 253, 249;
  --glass-opacity: 0.72;
  /* Light mode: more transparent, content behind is visible */
}
[data-theme="dark"] {
  --surface-rgb: 30, 28, 34;
  --glass-opacity: 0.78;
  /* Dark mode: slightly more opaque to maintain text contrast on dark bg */
}
```

**Rationale:** Dark backgrounds with low opacity create very low contrast for text. Increasing opacity in dark mode preserves readability while still showing the blur effect through the surface.

### Pattern 3: Mobile Performance Override
**What:** Reduce or remove blur on phone viewports
**When to use:** Inside existing `@media(max-width:599px)` breakpoint

```css
@media (max-width: 599px) {
  :root {
    --glass-blur: 8px;  /* Reduced from 12px */
  }
  /* Remove blur from section headers entirely on mobile */
  .section-hdr {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    background: var(--surface);  /* Back to solid */
  }
}
```

### Pattern 4: Interaction with clockPulse Animation
**What:** The `.room-top.on-clock` state uses `box-shadow` animation. Glass background must not conflict.
**When to use:** When adding glass to `.room-top`

The existing `clockPulse` animation uses `box-shadow` and `border-bottom-color`. These properties work independently of `backdrop-filter` and `background`, so no conflict. However, `box-shadow` on a semi-transparent element may look different -- the glow will show through the surface. Test that the orange pulse glow still reads well against the translucent background.

### Recommended Implementation Order
```
1. Add --surface-rgb variables to both [data-theme] blocks
2. Add --glass-blur and --glass-opacity variables
3. Add @supports block with glass effects for .hdr
4. Add glass effects for .modal-overlay (increase existing blur)
5. Add glass effects for .room-top
6. Add glass effects for .section-hdr and .pos-filters
7. Add mobile overrides in @media(max-width:599px)
8. Test in both themes
9. Test with @supports removed to verify fallback
```

### Anti-Patterns to Avoid
- **Applying backdrop-filter to every element:** Blur is GPU-intensive. Limit to 3-4 elements visible at once. Never apply to `.p-row` (100+ rows) or `.sidebar` (large continuous area).
- **Using `will-change: backdrop-filter` permanently:** Pre-allocating GPU layers for static elements wastes memory. Only use for animated elements, and remove after animation.
- **Forgetting `-webkit-backdrop-filter`:** Safari < 18 needs the prefix. Always include both.
- **Using `transition: all` on glass elements:** The existing theme transition system explicitly lists `background-color, color, border-color`. Adding `backdrop-filter` to the transition list is unnecessary -- the blur amount does not change between themes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Browser support detection | JS feature detection | `@supports (backdrop-filter: blur(1px))` | CSS-native, no JS needed, handles prefixed variant |
| Semi-transparent theme colors | Separate `--surface-glass` variable per theme | `rgba(var(--surface-rgb), var(--glass-opacity))` | Single pattern, already established with `--shadow-rgb` |
| Mobile blur reduction | JS-based viewport detection | CSS `@media(max-width:599px)` override of `--glass-blur` | No JS needed, matches existing breakpoint |

## Common Pitfalls

### Pitfall 1: Opaque Background Hides Blur Effect
**What goes wrong:** `backdrop-filter: blur(12px)` is applied but the element still has `background: var(--surface)` (fully opaque), so the blur is invisible.
**Why it happens:** `backdrop-filter` blurs content BEHIND the element, but an opaque background covers the blur completely.
**How to avoid:** The background MUST be semi-transparent: `rgba(var(--surface-rgb), 0.7)`. This is the entire point of the `--surface-rgb` variable.
**Warning signs:** Element looks identical with and without `backdrop-filter` applied.

### Pitfall 2: Stacking Context Issues with Nested Sticky Elements
**What goes wrong:** `.section-hdr` (sticky, z-index:5) sits inside `.board-panel` which scrolls. If `.board-panel` gets a `backdrop-filter`, it creates a new stacking context that can trap child z-indexes.
**Why it happens:** `backdrop-filter` creates a new stacking context (per CSS spec), just like `transform` or `opacity < 1`.
**How to avoid:** Only apply `backdrop-filter` to the sticky elements themselves (`.hdr`, `.section-hdr`), NOT to their scroll containers (`.board-panel`, `.sidebar`). The current architecture is safe because the target elements are the sticky ones, not their parents.
**Warning signs:** Sticky headers appear behind scrolling content despite having positive z-index.

### Pitfall 3: Double Blur on Modal
**What goes wrong:** `.modal-overlay` already has `backdrop-filter: blur(2px)`. If `.modal` (the content box) also gets blur, it blurs the already-blurred overlay, creating an over-processed look.
**Why it happens:** Nested elements each blur their own backdrop independently.
**How to avoid:** Only increase blur on `.modal-overlay` (the full-screen backdrop). Do NOT add `backdrop-filter` to `.modal` itself -- it should keep its solid `background: var(--surface)` for maximum text readability.
**Warning signs:** Modal content looks hazy or text appears blurred.

### Pitfall 4: Theme Toggle Transition Flicker on Glass Elements
**What goes wrong:** When toggling themes, the `background-color` transition on glass elements creates a brief moment where the semi-transparent background transitions through an intermediate state, causing a visible flicker.
**Why it happens:** The existing transition system (line 338-339) animates `background-color` over 0.25s. With `rgba()` backgrounds, the transition interpolates through intermediate opacity values.
**How to avoid:** This is actually fine -- CSS color transitions handle `rgba()` smoothly by interpolating each channel independently. The existing transition system will work correctly. No special handling needed.

### Pitfall 5: Mobile Safari backdrop-filter with overflow:auto
**What goes wrong:** Firefox has a known bug where `backdrop-filter` combined with `border-radius`, `overflow: auto`, and `position: sticky` can cause rendering artifacts.
**Why it happens:** Browser compositing edge cases with multiple GPU layers.
**How to avoid:** The target sticky elements (`.hdr`, `.section-hdr`) do not use `overflow: auto` or `border-radius`, so this bug is not applicable. The `.board-panel` has `overflow-x: hidden` but it is NOT receiving `backdrop-filter`.

### Pitfall 6: pos-filters Also Sticky
**What goes wrong:** `.pos-filters` at line 161 is `position:sticky;top:32px;z-index:4` and stacks below `.section-hdr`. If both get glass effects, content scrolling between them may look odd with double-blur overlap.
**Why it happens:** Two adjacent sticky elements with glass backgrounds create a layered translucent zone.
**How to avoid:** Apply glass to `.section-hdr` only. Keep `.pos-filters` with solid background, or give it a slightly higher opacity (0.9) so the overlap zone is mostly opaque. Test visually.

## Code Examples

### Complete Glass Variables Addition
```css
/* Add to BOTH theme blocks */
[data-theme="light"] {
  /* ... existing variables ... */
  --surface-rgb: 255, 253, 249;
  --glass-blur: 12px;
  --glass-opacity: 0.72;
}
[data-theme="dark"] {
  /* ... existing variables ... */
  --surface-rgb: 30, 28, 34;
  --glass-blur: 12px;
  --glass-opacity: 0.78;
}
```

### Sticky Header Glass (GLASS-01)
```css
/* Existing (keep as base): */
.hdr {
  background: var(--surface);
  border-bottom: 2px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 4px rgba(var(--shadow-rgb), .05);
}

/* Add @supports block: */
@supports (backdrop-filter: blur(1px)) {
  .hdr {
    background: rgba(var(--surface-rgb), var(--glass-opacity));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    backdrop-filter: blur(var(--glass-blur));
    border-bottom-color: rgba(var(--border-rgb, var(--shadow-rgb)), .15);
  }
}
```

Note: The header `border-bottom` could also become semi-transparent for a cleaner glass look. Using `--shadow-rgb` as a fallback for border color works in both themes.

### Modal Overlay Enhanced Blur (GLASS-01)
```css
/* Current: backdrop-filter:blur(2px) -- increase for depth */
@supports (backdrop-filter: blur(1px)) {
  .modal-overlay {
    background: rgba(var(--shadow-rgb), .5);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
  }
}
```

The modal overlay already has `backdrop-filter: blur(2px)` without an `@supports` guard. Wrap the enhanced version in `@supports` and increase to `blur(8px)` for better depth separation. Increase the background opacity from `.4` to `.5` to compensate for the stronger blur.

### Room-Top (Pick Clock Bar) Glass (GLASS-01)
```css
/* .room-top is grid-area, not sticky, but sits at top with content below */
@supports (backdrop-filter: blur(1px)) {
  .room-top {
    background: rgba(var(--surface-rgb), var(--glass-opacity));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    backdrop-filter: blur(var(--glass-blur));
  }
}
```

Note: `.room-top` is not `position:sticky` -- it is a grid area that stays at top. For `backdrop-filter` to show visible blur, content must scroll behind it. On desktop, the `.board-panel` scrolls below but `.room-top` is above it in the grid, not overlapping. This means **the blur may not be visible** unless the grid layout allows content to pass behind `.room-top`. Verify this during implementation -- if no content scrolls behind it, apply a subtle translucent background for aesthetic consistency but skip the blur.

### Section Header Glass (GLASS-01)
```css
@supports (backdrop-filter: blur(1px)) {
  .section-hdr {
    background: rgba(var(--surface-rgb), var(--glass-opacity));
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
  }
}
```

Section headers ARE sticky (`position:sticky;top:0`) inside `.board-panel` which has `overflow` scrolling, so player rows scroll beneath them. This is a legitimate and visible glass use case.

### Mobile Performance Override (GLASS-03)
```css
@media (max-width: 599px) {
  :root {
    --glass-blur: 8px;
  }
  /* Remove glass from section headers -- too many visible at once in scroll */
  @supports (backdrop-filter: blur(1px)) {
    .section-hdr {
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
      background: var(--surface);
    }
    .pos-filters {
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
      background: var(--surface);
    }
  }
}
```

### Graceful Fallback Test (GLASS-02)
To test the fallback path, temporarily disable `@supports`:
```css
/* Test: replace @supports block with this to simulate unsupported browser */
/* @supports (backdrop-filter: blur(1px)) { ... } */
/* All elements should show solid var(--surface) backgrounds */
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `-webkit-backdrop-filter` only | Unprefixed `backdrop-filter` standard | Firefox 103 (2022) | Unprefixed now works in all major browsers; prefix still needed for Safari < 18 |
| Polyfill scripts for backdrop-filter | `@supports` progressive enhancement | 2023+ (95%+ support) | No polyfills needed; degrade gracefully |
| Fixed blur values per element | CSS variable tokens (`--glass-blur`) | Best practice | Enables global mobile override with single variable change |

**Deprecated/outdated:**
- **backdrop-filter polyfills** (e.g., `backdrop-filter-polyfill`): No longer needed at 95.75% support. Use `@supports` fallback instead.
- **`-moz-backdrop-filter`**: Never existed. Firefox uses the unprefixed property since v103.

## Open Questions

1. **Does content actually scroll behind `.room-top`?**
   - What we know: `.room-top` is `grid-column:1/-1` at the top of the grid. `.board-panel` is below it.
   - What's unclear: Whether the grid layout creates overlap where `.board-panel` content passes behind `.room-top`, or if they are strictly stacked with no overlap.
   - Recommendation: Test during implementation. If no content scrolls behind, still use semi-transparent background for visual consistency but the blur effect will be invisible. Consider making `.room-top` sticky within the board-panel as an alternative.

2. **Gradient/background refresh scope**
   - What we know: The roadmap mentions "gradient backgrounds" as part of this phase.
   - What's unclear: Whether this means subtle body gradients, panel mesh gradients, or something else.
   - Recommendation: Keep this minimal -- a subtle radial gradient on `body` in dark mode to add depth is sufficient. Do not add gradients to individual panels. This is lower priority than the glassmorphism implementation.

3. **clockPulse animation interaction with glass .room-top**
   - What we know: `.room-top.on-clock` animates `box-shadow` with accent color glow.
   - What's unclear: Whether the orange glow reads well against a semi-transparent background.
   - Recommendation: Test visually. May need to increase glow intensity or opacity when on-clock.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (already in node_modules) |
| Config file | None detected -- see Wave 0 |
| Quick run command | `npx playwright test --grep "glass"` |
| Full suite command | `npx playwright test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GLASS-01 | Sticky header has backdrop-filter blur visible in both themes | visual/smoke | Manual: scroll content under header, verify blur in devtools | N/A - manual |
| GLASS-01 | Modal overlay blur increased to 8px | smoke | `npx playwright test --grep "modal-blur"` | Wave 0 |
| GLASS-02 | @supports fallback shows solid backgrounds | smoke | `npx playwright test --grep "glass-fallback"` | Wave 0 |
| GLASS-03 | Mobile viewport has reduced/removed blur on section headers | responsive | `npx playwright test --grep "mobile-glass"` | Wave 0 |

### Sampling Rate
- **Per task commit:** Visual inspection in browser (both themes, desktop + mobile viewport)
- **Per wave merge:** Full visual check of all glass surfaces
- **Phase gate:** All 4 success criteria verified manually

### Wave 0 Gaps
- [ ] `tests/glass.spec.js` -- Playwright tests for GLASS-01/02/03
- [ ] Test config: `playwright.config.js` -- may already exist from previous phases, needs verification
- [ ] CSS property assertion helpers for checking computed `backdrop-filter` values

## Sources

### Primary (HIGH confidence)
- [MDN: backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter) - property syntax, browser support, @supports usage
- [MDN: Stacking context](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context) - backdrop-filter creates stacking context
- [Can I Use: backdrop-filter](https://caniuse.com/css-backdrop-filter) - 95.75% global support confirmed
- Existing project research: `.planning/research/DESIGN-SYSTEM.md` sections 4 and 6

### Secondary (MEDIUM confidence)
- [CSS-Tricks: backdrop-filter](https://css-tricks.com/almanac/properties/b/backdrop-filter/) - usage patterns, performance notes
- [Firefox bug 1803813](https://bugzilla.mozilla.org/show_bug.cgi?id=1803813) - backdrop-filter + border-radius + overflow + sticky rendering issue

### Tertiary (LOW confidence)
- [Medium: Why backdrop-filter Fails with Positioned Child Elements](https://medium.com/@aqib-2/why-backdrop-filter-fails-with-positioned-child-elements-0b82b504f440) - stacking context edge cases
- Mobile performance claims based on general GPU compositing principles, not specific benchmarks

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - backdrop-filter is well-documented, 95.75% support, straightforward CSS
- Architecture: HIGH - @supports pattern is industry standard, variable-based approach matches existing codebase
- Pitfalls: HIGH - stacking context and mobile performance issues well-documented
- Glass opacity values: MEDIUM - specific opacity values (0.72/0.78) need visual tuning per theme
- room-top blur visibility: LOW - depends on grid layout overlap behavior, needs implementation testing

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable CSS properties, unlikely to change)
