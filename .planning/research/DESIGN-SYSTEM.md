# Design System Research: Dark Mode & Glassmorphism

**Domain:** Dark mode theming, glassmorphism aesthetics, CSS custom properties for single-file vanilla JS apps
**Researched:** 2026-03-08
**Overall confidence:** HIGH

---

## Executive Summary

Draft Commander is well-positioned for dark mode. The app already uses CSS custom properties for all color tokens (`--bg`, `--surface`, `--text`, `--accent`, etc.), meaning the core architecture is already theme-ready. The implementation requires: (1) duplicating color definitions under a `[data-theme="dark"]` selector, (2) adding a blocking script in `<head>` to prevent flash-of-wrong-theme (FOWT), (3) adding a toggle button with localStorage persistence, and (4) introducing glassmorphism effects via `backdrop-filter` on key surfaces.

The hardest part is not the dark mode toggle mechanism -- that is well-documented and straightforward. The hard part is **designing good dark mode colors for a data-heavy fantasy sports dashboard** with position-coded colors (QB red, RB blue, WR green, TE purple) that need to remain distinguishable on dark backgrounds without looking neon. The app has ~25 hardcoded `rgba()` values scattered across the CSS that bypass the custom property system and will need to be converted to theme-aware variables.

Browser support for `backdrop-filter` is 95.75% globally (Chrome 76+, Edge 17+, Firefox 103+, Safari 9+). It is production-ready with the caveat that Safari < 18 needs the `-webkit-` prefix. Performance is fine when used sparingly (header, modals, sidebar headers) but degrades with many simultaneous blur elements on mobile.

---

## 1. Dark Mode with CSS Custom Properties

### Architecture: `[data-theme]` Attribute Pattern

**Recommendation: Use `[data-theme="dark"]` on `<html>`, not `@media (prefers-color-scheme)`** for variable definitions. The media query approach cannot be overridden by a user toggle. The data attribute approach supports both system detection AND manual toggle.

**Confidence:** HIGH (industry standard pattern, verified across multiple authoritative sources)

#### Selector Structure

```css
/* Shared non-color tokens stay in :root */
:root {
  --sp-xs: 4px; --sp-sm: 8px; /* spacing */
  --radius-sm: 4px; --radius-md: 6px; /* radii */
}

/* Light theme (default) */
[data-theme="light"] {
  --bg: #f6f1ea;
  --surface: #fffdf9;
  --surface2: #eee8df;
  /* ... all color tokens ... */
}

/* Dark theme */
[data-theme="dark"] {
  --bg: #141218;
  --surface: #1e1c22;
  --surface2: #282630;
  /* ... all color tokens ... */
}
```

**Why not `:root` for light theme?** Using `[data-theme="light"]` and `[data-theme="dark"]` at equal specificity prevents selector weight issues. If light colors are in `:root`, `[data-theme="dark"]` overrides them cleanly, but it is cleaner to keep them parallel. However, the current app has colors in `:root` -- the simplest migration path is:

1. Keep non-color tokens (spacing, radii) in `:root`
2. Move color tokens from `:root` to `[data-theme="light"]`
3. Add `[data-theme="dark"]` with dark palette
4. Default `<html data-theme="light">` in the HTML

#### The `color-scheme` Property

Add `color-scheme` to tell the browser which scheme is active. This affects native form controls, scrollbars, and default colors:

```css
[data-theme="light"] { color-scheme: light; }
[data-theme="dark"] { color-scheme: dark; }
```

**Confidence:** HIGH (MDN-documented, widely supported)

#### New CSS `light-dark()` Function

The CSS `light-dark()` function (Chrome 123+, Firefox 120+, Safari 17.5+) allows inline theme-aware values without separate selectors. However, it depends on `color-scheme` being set and does not support the manual toggle pattern cleanly. **Skip it for this project** -- the data-attribute approach is more explicit and compatible with the existing architecture.

**Confidence:** HIGH

### Sources
- [The best light/dark mode theme toggle in JavaScript](https://whitep4nth3r.com/blog/best-light-dark-mode-theme-toggle-javascript/)
- [Dark Mode in CSS | CSS-Tricks](https://css-tricks.com/dark-modes-with-css/)
- [MDN: light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/light-dark)

---

## 2. Preventing Flash of Wrong Theme (FOWT)

**This is the single most important implementation detail.** Without it, dark mode users see a white flash on every page load.

### The Pattern

Place a **synchronous, blocking `<script>`** in `<head>` BEFORE the `<style>` block:

```html
<head>
  <script>
    (function() {
      var theme = localStorage.getItem('theme');
      if (!theme) {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', theme);
    })();
  </script>
  <style>
    /* ... all CSS ... */
  </style>
</head>
```

**Why this works:** The script executes synchronously before CSS is parsed. By the time the browser applies styles, `data-theme` is already set on `<html>`, so the correct theme's variables are used from the first paint. No flicker.

**Why before `<style>`:** If placed after, the browser may have already started rendering with wrong theme colors.

**Confidence:** HIGH (verified pattern, used by major apps)

### Preference Cascade

Priority order:
1. `localStorage.getItem('theme')` -- user's explicit choice
2. `window.matchMedia('(prefers-color-scheme: dark)')` -- system preference
3. `'light'` -- fallback default

### System Preference Change Listener

Listen for OS-level theme changes so the app responds if the user changes system settings mid-session (only when no localStorage override exists):

```javascript
window.matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      document.documentElement.setAttribute(
        'data-theme', e.matches ? 'dark' : 'light'
      );
    }
  });
```

### Sources
- [Dark Mode - The prefers-color-scheme Website Tutorial](https://www.ditdot.hr/en/dark-mode-website-tutorial)
- [whitep4nth3r dark mode toggle](https://whitep4nth3r.com/blog/best-light-dark-mode-theme-toggle-javascript/)

---

## 3. Smooth Theme Transitions

### CSS Transition Approach

Add a transition on `background-color` and `color` to the body and key elements:

```css
body,
.hdr, .sidebar, .board-panel, .modal,
.room-top, .sb-section, .p-row {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
```

**Caveat:** Do NOT apply `transition: all` globally -- it will cause layout jank on unrelated properties. Be explicit about which properties to transition.

**Caveat:** Disable this transition during initial page load to prevent the transition from firing on first paint. One approach:

```html
<html data-theme="light" class="no-transitions">
```

```css
.no-transitions * { transition: none !important; }
```

```javascript
// After DOMContentLoaded, remove the class
requestAnimationFrame(() => {
  document.documentElement.classList.remove('no-transitions');
});
```

### View Transitions API (Optional Enhancement)

The View Transitions API can create a circular reveal or crossfade effect on theme toggle. It is supported in Chrome 111+ and Safari 18+. It is a nice-to-have but not critical. Skip for initial implementation.

**Confidence:** MEDIUM (View Transitions API support is still partial)

---

## 4. Glassmorphism Techniques

### Core CSS Properties

```css
.glass-surface {
  background: rgba(255, 255, 255, 0.08);   /* dark mode */
  /* background: rgba(255, 255, 255, 0.6); /* light mode */
  -webkit-backdrop-filter: blur(12px);      /* Safari < 18 */
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}
```

### Key Requirements

1. **The element MUST have a semi-transparent background** for `backdrop-filter` to show through
2. **There must be content behind the element** to blur (the page background, other content scrolling beneath a sticky header)
3. **Always include `-webkit-backdrop-filter`** for Safari < 18 (still ~8% of Safari users)
4. **Use `blur()` values between 8px-20px** -- less looks broken, more tanks performance

### Where to Apply Glassmorphism in Draft Commander

| Element | Effect | Rationale |
|---------|--------|-----------|
| `.hdr` (sticky header) | `backdrop-filter: blur(12px)` + semi-transparent bg | Content scrolls beneath; classic glassmorphism use case |
| `.modal` | Already has `backdrop-filter: blur(2px)` on overlay; increase to `blur(8px)` | Modal overlay is perfect for blur |
| `.room-top` (pick clock bar) | `backdrop-filter: blur(10px)` + semi-transparent bg | Sticky element with content beneath |
| `.section-hdr` (sticky section headers) | `backdrop-filter: blur(8px)` | Sticky headers in scrollable panels |
| `.room-tab.active` | Subtle glass effect | Tab indicator |

### Where NOT to Apply

- **Every `.p-row`** -- hundreds of rows with blur = performance disaster
- **`.sidebar` full panel** -- large continuous area, no content behind it
- **Anything not overlapping other content** -- blur without content behind it is invisible

### Browser Support

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 76+ | Full support |
| Edge | 17+ (Chromium 79+) | Full support |
| Firefox | 103+ | Full support |
| Safari | 9+ | Needs `-webkit-` prefix until v18 |
| Safari iOS | 9+ | Needs `-webkit-` prefix until v18 |
| Samsung Internet | 12+ | Full support |
| IE | None | Not supported (irrelevant) |
| Opera Mini | None | Not supported (irrelevant) |

**Global support: 95.75%** -- production-ready.

### Fallback Strategy

```css
.glass-surface {
  /* Fallback: solid background for old browsers */
  background: var(--surface);
  /* Glass effect for supporting browsers */
  @supports (backdrop-filter: blur(1px)) {
    background: rgba(var(--surface-rgb), 0.7);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
  }
}
```

Use `@supports` to progressively enhance. The app degrades to solid backgrounds in unsupported browsers -- functionally identical, just less pretty.

### Confidence & Sources
- **Confidence:** HIGH for browser support data (MDN, Can I Use verified)
- [MDN: backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)
- [Can I Use: backdrop-filter](https://caniuse.com/css-backdrop-filter)
- [Glass UI Generator](https://ui.glass/generator)

---

## 5. Dark Mode Color Palette for Data-Heavy Dashboard

### Foundation Principles

1. **Never use pure black (#000000)** -- causes OLED smearing, extreme contrast fatigue. Use dark grays: `#141218` to `#1e1c22`
2. **Desaturate position colors by ~15-20%** in dark mode -- bright colors on dark backgrounds appear more saturated and create a "neon" effect that is distracting in data tables
3. **Use elevation through lightness** -- darker = further back, lighter = closer. This is the inverse of light mode where shadows create elevation
4. **Limit accent color count** -- dark mode amplifies color, so fewer is better

### Recommended Dark Palette

```css
[data-theme="dark"] {
  /* Backgrounds: warm dark grays (keep the warm tint from the light theme) */
  --bg: #141218;
  --surface: #1e1c22;
  --surface2: #282630;
  --surface3: #33303c;

  /* Borders: subtle, low contrast */
  --border: #3a3742;
  --border2: #4a4654;

  /* Text: off-white, never pure white */
  --text: #e8e4ef;
  --text2: #9e97ab;
  --text3: #6b6578;

  /* Accent: slightly desaturated and lightened for dark bg */
  --accent: #e07040;
  --accent2: #d4a040;

  /* Position colors: desaturated ~15% from light mode */
  --qb: #d04848;
  --rb: #4a8ec4;
  --wr: #48a868;
  --te: #a068c8;
  --pick: #d4a040;

  /* Status colors */
  --live: #50b868;
  --danger: #d04848;

  /* Source colors: matched to position desaturation */
  --fc-color: #e07040;
  --ktc-color: #a068c8;
  --csv-color: #4a8ec4;
  --dd-color: #d06888;
  --dp-color: #50b868;
}
```

### The rgba() Hardcoding Problem

The current CSS has ~25 hardcoded `rgba()` values like:
- `rgba(28,23,16,.05)` -- warm dark shadow (header, cards)
- `rgba(184,74,28,.08)` -- accent tint (focus rings, recommended rows)
- `rgba(168,32,32,.1)` -- QB position badge background
- etc.

These will NOT respond to theme changes because they are hardcoded RGB values, not custom properties.

**Solution:** Convert these to CSS custom properties with RGB channel values:

```css
[data-theme="light"] {
  --shadow-rgb: 28, 23, 16;
  --accent-rgb: 184, 74, 28;
  --qb-rgb: 168, 32, 32;
  --rb-rgb: 26, 91, 143;
  --wr-rgb: 29, 122, 62;
  --te-rgb: 123, 63, 158;
  --pick-rgb: 166, 117, 53;
  --live-rgb: 42, 126, 59;
  --danger-rgb: 180, 32, 32;
}

[data-theme="dark"] {
  --shadow-rgb: 0, 0, 0;
  --accent-rgb: 224, 112, 64;
  --qb-rgb: 208, 72, 72;
  --rb-rgb: 74, 142, 196;
  --wr-rgb: 72, 168, 104;
  --te-rgb: 160, 104, 200;
  --pick-rgb: 212, 160, 64;
  --live-rgb: 80, 184, 104;
  --danger-rgb: 208, 72, 72;
}
```

Then replace all hardcoded `rgba()` calls:
```css
/* Before */
.p-QB { background: rgba(168,32,32,.1); }

/* After */
.p-QB { background: rgba(var(--qb-rgb), 0.1); }
```

This is the biggest mechanical change in the implementation -- roughly 25 find-and-replace operations.

### Confidence & Sources
- **Confidence:** HIGH for color theory, MEDIUM for specific hex values (will need visual tuning)
- [Dark Mode Design Principles for Data-Heavy Dashboards](https://www.qodequay.com/dark-mode-dashboards)
- [Dark Mode Color Palettes | Colorhero](https://colorhero.io/blog/dark-mode-color-palettes-2025)
- [Cloudflare Dashboard Dark Mode](https://blog.cloudflare.com/dark-mode/)

---

## 6. Mobile Backdrop-Filter Pitfalls

### Known Issues

| Issue | Severity | Mitigation |
|-------|----------|------------|
| **iOS WebView crashes** with many simultaneous `backdrop-filter` elements | HIGH | Limit to 2-3 blur elements visible at once |
| **Performance degradation** with large blur areas on mobile | MEDIUM | Keep blur elements small (headers, not full panels) |
| **Safari < 18 needs `-webkit-` prefix** | LOW | Always include both prefixed and unprefixed |
| **`backdrop-filter` invisible on opaque backgrounds** | LOW | Ensure semi-transparent background on blurred elements |
| **Scroll jank** when sticky elements with blur scroll over complex content | MEDIUM | Use `will-change: backdrop-filter` or reduce blur radius on mobile |

### Mobile-Specific Strategy

```css
@media (max-width: 599px) {
  .hdr {
    /* Reduce blur radius on mobile for performance */
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
  }

  /* Remove blur from section headers on mobile -- too many in scroll */
  .section-hdr {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    background: var(--surface);  /* solid fallback */
  }
}
```

### Confidence & Sources
- **Confidence:** MEDIUM (Flutter/native issues dominate search results; web-specific mobile issues are less documented but the performance concerns are real)
- [Capacitor iOS backdrop-filter crash](https://github.com/ionic-team/capacitor/issues/7450)
- [MDN: backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)

---

## 7. Implementation Checklist

### Phase 1: Foundation (Dark Mode Toggle)
1. Add blocking `<script>` in `<head>` for FOWT prevention
2. Move color tokens from `:root` to `[data-theme="light"]`
3. Create `[data-theme="dark"]` color definitions
4. Convert ~25 hardcoded `rgba()` to `rgba(var(--xxx-rgb), alpha)` pattern
5. Add `color-scheme: light/dark` to each theme block
6. Add theme toggle button to header
7. Add smooth transitions (with initial-load suppression)

### Phase 2: Glassmorphism Polish
1. Add `backdrop-filter` + semi-transparent bg to `.hdr`
2. Increase `.modal-overlay` blur from 2px to 8px
3. Add glass effect to `.room-top` (pick clock bar)
4. Add `@supports` fallbacks
5. Reduce blur on mobile via media query
6. Add subtle gradient backgrounds (mesh gradients or radial gradients on `body`)

### Phase 3: Fine-Tuning
1. Test all position-color badges in dark mode for readability
2. Verify chart/visualization colors in dark mode
3. Check skeleton loading animation colors
4. Test on iOS Safari, Android Chrome, Firefox
5. Verify WCAG AA contrast ratios for text in both themes

---

## 8. Complete Toggle Implementation

For reference, here is the complete toggle pattern for a single-file app:

### HTML (in header)
```html
<button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle dark mode">
  <!-- Sun/moon icon -->
</button>
```

### JavaScript
```javascript
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  // Update toggle button icon/label
}
```

### The Blocking Head Script
```html
<script>
(function(){
  var t = localStorage.getItem('theme');
  if (!t) t = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
})();
</script>
```

This is intentionally minimal and synchronous -- no DOM queries, no feature detection, just attribute setting.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| data-theme toggle pattern | HIGH | Industry standard, verified with multiple authoritative sources |
| FOWT prevention | HIGH | Well-documented blocking script pattern |
| backdrop-filter support | HIGH | MDN + Can I Use verified: 95.75% global |
| Dark palette hex values | MEDIUM | Color theory is sound; specific values need visual tuning |
| rgba() conversion scope | HIGH | Grep found all 25 instances in the codebase |
| Mobile backdrop-filter perf | MEDIUM | Real concerns, but web-specific data is thinner than native |
| Glassmorphism aesthetics | MEDIUM | Design trend, subjective -- will need iteration |

---

## Gaps to Address

- **Exact dark mode hex values** need visual testing -- the proposed palette is a starting point based on color theory (warm dark grays to match the current warm light theme) but will need iteration
- **Chart/visualization colors** in dark mode were not deeply researched -- if the app uses canvas or SVG charts, those colors may need separate handling
- **Print styles** -- if anyone prints the dashboard, dark mode should not affect print
- **Reduced motion** -- `prefers-reduced-motion` should disable theme transitions for accessibility
- **Third-party embeds** -- the tip jar link (Buy Me a Coffee) has its own styling that will not respond to theme changes
