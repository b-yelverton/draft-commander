# Phase 3: Mobile Component Polish - Research

**Researched:** 2026-03-08
**Domain:** Mobile touch targets, header collapse, tab scrolling (CSS-only, single-file vanilla app)
**Confidence:** HIGH

## Summary

Phase 3 adapts individual UI components for touch interaction on narrow viewports. The work falls into three distinct areas: (1) collapsing the header to hide source pills on mobile, (2) enhancing horizontal tab scrolling with scroll-snap, and (3) enlarging all interactive elements to meet the 44px minimum touch target standard.

The existing `@media(max-width:599px)` block from Phase 2 provides the foundation. All changes are CSS-only additions to that media query, with zero JavaScript changes required. The header collapse uses `display:none` on `.src-pills` and `.tip-btn` inside the mobile breakpoint. Tab scrolling adds `scroll-snap-type` to the existing `overflow-x:auto` container. Touch targets are fixed by increasing `min-height` and `padding` on undersized elements.

**Primary recommendation:** All three requirements are pure CSS changes inside `@media(max-width:599px)`. No JS modifications needed. Implement as a single plan with three focused tasks.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None -- all decisions at Claude's discretion.

### Claude's Discretion
User elected to skip discussion -- all implementation decisions are at Claude's discretion:

- **Header collapse strategy:** Decide how to hide source pills on mobile -- CSS display:none, or a toggle/expand mechanism
- **Tab scrolling UX:** Decide scrolling implementation -- CSS overflow-x:auto with scroll-snap, or manual JS scroll
- **Touch target sizing:** Decide approach to enlarge targets -- padding increase, min-height/min-width, or wrapper elements
- **Which elements need touch target fixes:** Audit all interactive elements and determine which fall below 44px

### Deferred Ideas (OUT OF SCOPE)
- MOBI-07: Player rows hide individual source value columns on mobile (v2)
- MOBI-08: Landscape mode optimization (v2)
- MOBI-09: Progressive source hydration column fade-in (v2)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MOBI-03 | Header collapses on mobile -- source pills hidden, shows logo and live indicator only | Header structure analysis (Section: Header Collapse Approach) |
| MOBI-04 | Room tabs are horizontally scrollable on narrow viewports without overflow | Tab scrolling analysis (Section: Tab Scrolling Enhancement) |
| MOBI-05 | All interactive elements meet 44px minimum touch target on mobile viewports | Touch target audit table (Section: Touch Target Audit) |
</phase_requirements>

## Current Code Analysis

### Header HTML Structure (lines 361-375)

The header is OUTSIDE `#app` -- it is static HTML, not re-rendered by `render()`:

```html
<div class="hdr">                          <!-- sticky header -->
  <div>
    <div class="hdr-logo">Draft Commander</div>
    <div class="hdr-sub">Live Draft Assistant</div>
  </div>
  <div class="hdr-right">                  <!-- flex row, margin-left:auto -->
    <div class="src-pills" id="srcPills"></div>  <!-- 5 pills, updated by updatePills() -->
    <a class="tip-btn" href="...">Tip Jar</a>
    <button class="refresh-btn" id="switchDraftBtn">Switch Draft</button>
    <div class="hdr-live" id="liveIndicator">
      <div class="dot"></div>
      <span id="liveText">Offline</span>
    </div>
  </div>
</div>
```

### Header CSS (lines 26-37)

```css
/* Desktop defaults */
.hdr{padding:12px 24px;display:flex;align-items:center;gap:16px;position:sticky;top:0;z-index:100}
.hdr-logo{font-size:22px}
.hdr-right{margin-left:auto;display:flex;align-items:center;gap:10px}
.src-pills{display:flex;gap:4px}
.src-pill{font-size:9px;padding:2px 7px;border-radius:3px}

/* Phone override (line 68, inside @media(max-width:599px)) */
.hdr{padding:10px 12px;gap:10px}
.hdr-logo{font-size:18px}
```

### Room Tabs CSS (lines 75-79)

```css
/* Desktop defaults */
.room-tabs{display:flex;gap:2px;background:var(--surface2);border-radius:var(--radius-md);padding:3px}
.room-tab{padding:6px 14px;border-radius:var(--radius-sm);font-size:11px;font-weight:600;border:none;background:none}

/* Phone override (line 68) */
.room-tabs{overflow-x:auto;-webkit-overflow-scrolling:touch}
```

### Room Tabs HTML (lines 1110-1117)

```html
<div class="room-tabs">
  <button class="room-tab" data-rtab="board">Board</button>
  <button class="room-tab" data-rtab="chart">Chart</button>
  <button class="room-tab" data-rtab="trade">Trade</button>
  <button class="room-tab" data-rtab="opponents">Opponents</button>
  <button class="room-tab" data-rtab="scarcity">Scarcity</button>
  <button class="room-tab" data-rtab="sources">Sources</button>
</div>
```

### Position Filter CSS (lines 89-92)

```css
.pos-filters{display:flex;gap:2px;padding:var(--sp-sm) var(--sp-lg);position:sticky;top:32px;z-index:4}
.pos-filter{padding:var(--sp-xs) var(--sp-md);border-radius:var(--radius-sm);font-size:11px;border:none;background:none}
```

### Other Interactive Elements CSS

```css
/* .btn (line 50) -- Connect button, modal buttons */
.btn{padding:var(--sp-md) var(--sp-2xl);font-size:13px}  /* 12px+12px padding = ~37px height */
.btn-sm{padding:var(--sp-sm) var(--sp-md);font-size:11px} /* 8px+8px = ~27px height */

/* .refresh-btn (line 80) */
.refresh-btn{padding:6px var(--sp-md);font-size:10px}  /* 6px+6px+~14px text = ~26px */

/* .tip-btn (line 249) */
.tip-btn{padding:5px 10px;font-size:10px}  /* 5px+5px+~14px = ~24px */

/* .p-row (line 95) -- player rows */
.p-row{padding:var(--sp-sm) var(--sp-lg);font-size:12px}  /* 8px+8px+~17px = ~33px */

/* .sb-rec (line 128) -- sidebar cards */
.sb-rec{padding:var(--sp-md);margin-bottom:var(--sp-sm)}  /* 12px+content = ~60px+ (OK) */

/* .trade-chip (line 176) */
.trade-chip{padding:4px 8px;font-size:11px}  /* 4px+4px+~15px = ~23px */

/* .trade-input input (line 173) */
.trade-input input{padding:8px 10px;font-size:12px}  /* 8px+8px+~17px = ~33px */

/* .setup-row input/select (line 46) */
.setup-row input,.setup-row select{padding:var(--sp-md) var(--sp-lg);font-size:14px} /* 12px+12px+~20px = ~44px (OK) */

/* .weight-row input[type=range] (line 143) */
.weight-row input[type=range]{height:4px}  /* Track only 4px, but browser adds chrome ~20px */

/* .log-row (line 133) */
.log-row{padding:5px 0;font-size:11px}  /* 5px+5px+~15px = ~25px, but not interactive */

/* .fpick-chip (line 218) */
.fpick-chip{padding:4px 8px;font-size:10px}  /* 4px+4px+~14px = ~22px */
```

### Current @media(max-width:599px) Block (line 68)

This is a SINGLE LINE containing all phone rules. Current content:

```css
@media(max-width:599px){
  .hdr{padding:10px 12px;gap:10px}
  .hdr-logo{font-size:18px}
  .room-top{padding:var(--sp-sm) var(--sp-md);gap:var(--sp-sm);flex-direction:column;align-items:stretch}
  .room-top .draft-meta{margin-left:0;flex-wrap:wrap;justify-content:flex-start}
  .room-tabs{overflow-x:auto;-webkit-overflow-scrolling:touch}
  .trade-sides{flex-direction:column;gap:var(--sp-md)}
  .trade-sides>div:nth-child(2){align-self:center}
  .setup{padding:var(--sp-xl) var(--sp-md)}
  .draft-select{padding:var(--sp-xl) var(--sp-md)}
  .tip-cta{flex-direction:column;text-align:center}
  .tip-cta .tip-btn{align-self:center}
}
```

## Touch Target Audit

WCAG 2.2 Success Criterion 2.5.8 specifies 24x24px minimum. Apple HIG and Material Design both recommend 44px minimum for touch targets. The requirement (MOBI-05) specifies 44px.

Estimated heights are calculated as: vertical padding + font-size * line-height (~1.4 for most elements).

| Element | Class | Current Padding | Est. Height | Meets 44px? | Fix Needed |
|---------|-------|----------------|-------------|-------------|------------|
| Room tab | `.room-tab` | 6px 14px | ~27px | NO | YES |
| Position filter | `.pos-filter` | 4px 12px | ~23px | NO | YES |
| Refresh button | `.refresh-btn` | 6px 12px | ~26px | NO | YES |
| Tip jar link | `.tip-btn` | 5px 10px | ~24px | NO | YES (but hidden on mobile) |
| Connect button | `.btn` | 12px 24px | ~37px | NO | YES |
| Switch Draft button | `.refresh-btn` | 6px 12px | ~26px | NO | YES |
| Player row | `.p-row` | 8px 16px | ~33px | NO | YES |
| Trade chip | `.trade-chip` | 4px 8px | ~23px | NO | YES |
| Trade input | `.trade-input input` | 8px 10px | ~33px | NO | YES |
| Future pick chip | `.fpick-chip` | 4px 8px | ~22px | NO | YES |
| Range slider | `input[type=range]` | height:4px | ~20px (with chrome) | NO | YES |
| Setup input/select | `.setup-row input` | 12px 16px | ~44px | YES | NO |
| Sidebar cards | `.sb-rec` | 12px padding + content | ~60px+ | YES | NO |
| Opponent cards | `.opp-card` | 12px padding + content | ~60px+ | YES | NO |
| Modal buttons | `.btn` in `.modal-btns` | 12px 24px | ~37px | NO | YES |
| Log rows | `.log-row` | 5px 0 | ~25px | N/A (display only) | NO |
| Source pills | `.src-pill` | 2px 7px | ~16px | N/A (hidden on mobile) | NO |

**Key insight:** 12 element types need touch target fixes. However, several can be grouped:
- `.tip-btn` and `.src-pills` are hidden on mobile (MOBI-03), so they do NOT need touch fixes
- `.btn` covers Connect, modal buttons, and any general-purpose buttons
- `.refresh-btn` covers both the refresh icon and Switch Draft button
- Trade-specific elements (`.trade-chip`, `.fpick-chip`, `.trade-input input`) are one group

## Architecture Patterns

### Header Collapse Approach (MOBI-03)

**Recommendation:** Pure CSS `display:none` on `.src-pills` and `.tip-btn` within `@media(max-width:599px)`.

Rationale:
- Source pills are informational only -- tapping them does nothing, they just show status
- `updatePills()` runs regardless but the DOM update is invisible -- no JS change needed
- The tip button is not critical on mobile (users in a live draft do not pause to tip)
- This leaves: logo + live indicator + Switch Draft button -- clean mobile header
- A toggle/expand mechanism adds JS complexity for marginal value

```css
@media(max-width:599px){
  .src-pills{display:none}
  .tip-btn{display:none}
  /* Optional: tighten header-right gap since fewer items */
  .hdr-right{gap:8px}
}
```

**Result:** Header shows: `[Draft Commander] ... [Switch Draft] [dot Live]`

### Tab Scrolling Enhancement (MOBI-04)

**Recommendation:** Add `scroll-snap-type` and `flex-shrink:0` to the existing overflow container.

Phase 2 already added `overflow-x:auto` and `-webkit-overflow-scrolling:touch`. The remaining issues:
1. Tabs can shrink/compress instead of scrolling (need `flex-shrink:0` on `.room-tab`)
2. No snap points -- scrolling stops at arbitrary positions (need `scroll-snap-type` on container, `scroll-snap-align` on tabs)
3. No visual cue that content is scrollable (scrollbar is hidden by default on mobile)

```css
@media(max-width:599px){
  .room-tabs{
    overflow-x:auto;
    -webkit-overflow-scrolling:touch;
    scroll-snap-type:x mandatory;
    scrollbar-width:none;         /* Firefox */
    -ms-overflow-style:none;      /* IE/Edge */
  }
  .room-tabs::-webkit-scrollbar{display:none}  /* Chrome/Safari */
  .room-tab{
    flex-shrink:0;
    scroll-snap-align:start;
  }
}
```

**Browser support:** `scroll-snap-type` is supported in all modern mobile browsers (Chrome 69+, Safari 11+, Firefox 68+). HIGH confidence.

**Note:** A gradient fade-edge is a common polish pattern (a transparent-to-background gradient on the right edge to hint at scrollability), but adds complexity. Recommend skipping for Phase 3 -- the scroll-snap behavior itself provides sufficient UX. Can be added later if desired.

### Touch Target Sizing (MOBI-05)

**Recommendation:** Use `min-height:44px` combined with padding increases inside `@media(max-width:599px)`.

Strategy:
- Set `min-height:44px` on all interactive elements that need fixing
- Increase padding where the content area would look awkwardly small inside a 44px container
- Use `touch-action:manipulation` to prevent 300ms tap delay

```css
@media(max-width:599px){
  /* Universal touch target baseline */
  .room-tab,.pos-filter,.refresh-btn,.btn,.btn-sm{min-height:44px;display:inline-flex;align-items:center;justify-content:center}

  /* Room tabs: increase padding to fill 44px */
  .room-tab{padding:10px 14px}

  /* Position filters: increase padding */
  .pos-filter{padding:10px var(--sp-md)}

  /* Player rows */
  .p-row{min-height:44px}

  /* Trade elements */
  .trade-chip,.fpick-chip{min-height:44px;display:inline-flex;align-items:center}
  .trade-input input{min-height:44px}

  /* Range sliders -- increase touch area */
  .weight-row input[type=range]{height:44px}

  /* Buttons */
  .btn{min-height:44px}

  /* Prevent double-tap zoom on all interactive elements */
  button,a,.p-row,.trade-chip,.fpick-chip{touch-action:manipulation}
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab horizontal scroll | Custom JS scroll buttons | CSS `scroll-snap-type` + `overflow-x:auto` | Native momentum scrolling, no JS, battery-efficient |
| Touch target expansion | JS-based hit area expansion | CSS `min-height:44px` + padding | Pure CSS, no event delegation complexity |
| Header collapse | JS media query listener to show/hide elements | CSS `display:none` in media query | No JS, instant on resize, no FOUC |
| Tap delay removal | FastClick library or custom touch handler | CSS `touch-action:manipulation` | FastClick is deprecated; `touch-action` is the standard approach |

## Common Pitfalls

### Pitfall 1: Breaking the @media(max-width:599px) Single-Line Format
**What goes wrong:** The existing media query is a single compressed line (line 68). If new rules are appended incorrectly, CSS parsing breaks.
**Why it happens:** The line is ~600 characters of compressed CSS.
**How to avoid:** When adding rules, expand the block to multi-line OR carefully append rules before the closing `}`. Expanding to multi-line is strongly recommended for maintainability.
**Warning signs:** Styles stop applying on mobile; browser dev tools show parse error.

### Pitfall 2: scroll-snap-type Overriding overflow-x
**What goes wrong:** Setting `scroll-snap-type` without ensuring all children have `flex-shrink:0` causes tabs to compress instead of scroll.
**Why it happens:** Flexbox default is `flex-shrink:1` -- items shrink before overflow triggers.
**How to avoid:** Always pair scroll-snap with `flex-shrink:0` on scroll children.
**Warning signs:** Tabs appear squeezed on narrow screens instead of scrolling.

### Pitfall 3: min-height Without Flex Alignment
**What goes wrong:** Setting `min-height:44px` on inline elements does nothing. On block elements without vertical centering, text sits at the top of a tall box.
**Why it happens:** `min-height` requires `display:flex` or `display:inline-flex` with `align-items:center` to vertically center content.
**How to avoid:** Always pair `min-height:44px` with `display:inline-flex;align-items:center`.
**Warning signs:** Buttons are 44px tall but text hugs the top edge.

### Pitfall 4: Hiding Elements That JS Updates
**What goes wrong:** Hiding `.src-pills` with `display:none` -- concern that `updatePills()` will error.
**Why it happens:** Developer thinks DOM manipulation fails on hidden elements.
**How to avoid:** `display:none` does NOT remove elements from DOM. `getElementById('srcPills')` still works. `innerHTML` updates still happen. The element is simply not rendered. No JS changes needed.
**Warning signs:** None -- this is a non-issue. Documented to prevent unnecessary JS defensive coding.

### Pitfall 5: Range Slider Touch Targets
**What goes wrong:** Setting `height:44px` on `input[type=range]` makes the track 44px tall but the thumb may still be small.
**Why it happens:** Range slider styling is complex and vendor-prefixed.
**How to avoid:** Setting `height:44px` on the `<input>` element itself (not the track) expands the clickable area. The visual track can remain thin via `-webkit-slider-runnable-track` and `-moz-range-track` styling. The native thumb is already adequately sized on mobile browsers.
**Warning signs:** Track appears visually thick; use explicit track height styling.

## Code Examples

### Complete Mobile CSS Additions

These rules should be added to the existing `@media(max-width:599px)` block:

```css
/* MOBI-03: Header collapse */
.src-pills{display:none}
.tip-btn{display:none}
.hdr-right{gap:8px}
.hdr-sub{display:none}

/* MOBI-04: Tab scrolling enhancement */
.room-tabs{scroll-snap-type:x mandatory;scrollbar-width:none;-ms-overflow-style:none}
.room-tabs::-webkit-scrollbar{display:none}
.room-tab{flex-shrink:0;scroll-snap-align:start}

/* MOBI-05: Touch targets (44px minimum) */
.room-tab{min-height:44px;padding:10px 14px;display:inline-flex;align-items:center}
.pos-filter{min-height:44px;padding:10px var(--sp-md);display:inline-flex;align-items:center}
.refresh-btn{min-height:44px;min-width:44px;display:inline-flex;align-items:center;justify-content:center}
.btn{min-height:44px}
.p-row{min-height:44px}
.trade-chip,.fpick-chip{min-height:44px;display:inline-flex;align-items:center}
.trade-input input{min-height:44px}
.weight-row input[type=range]{height:44px}
button,a,.p-row,.trade-chip,.fpick-chip{touch-action:manipulation}
```

### Merging Into Existing Block

The existing `@media(max-width:599px)` is a single compressed line at line 68. The implementation should:

1. Expand line 68 to multi-line format
2. Append new rules at the end of the block
3. Deduplicate any `.room-tabs` rules (Phase 2 already has `overflow-x:auto;-webkit-overflow-scrolling:touch`)

The merged `.room-tabs` rule should be:
```css
.room-tabs{overflow-x:auto;-webkit-overflow-scrolling:touch;scroll-snap-type:x mandatory;scrollbar-width:none;-ms-overflow-style:none}
```

## Suggested Plan Decomposition

Given that all three requirements are CSS-only changes to a single media query block, a single plan with 3 tasks is appropriate:

### Task 1: Header Mobile Collapse (MOBI-03)
- Hide `.src-pills`, `.tip-btn`, `.hdr-sub` with `display:none`
- Tighten `.hdr-right` gap
- Verify: header shows only logo + live indicator + Switch Draft button at 375px width

### Task 2: Tab Scroll Enhancement (MOBI-04)
- Add `scroll-snap-type`, `scrollbar-width:none`, `::-webkit-scrollbar{display:none}` to `.room-tabs`
- Add `flex-shrink:0` and `scroll-snap-align:start` to `.room-tab`
- Merge with existing Phase 2 `.room-tabs` overflow rules
- Verify: tabs scroll horizontally at 375px, snap to tab edges

### Task 3: Touch Target Enlargement (MOBI-05)
- Add `min-height:44px` rules for all undersized interactive elements
- Add `touch-action:manipulation` to prevent tap delay
- Verify: every interactive element is >= 44px tall at 375px width

All three tasks modify the same `@media(max-width:599px)` block. They should be done sequentially to avoid merge conflicts within the single block.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual browser testing (no test framework -- single-file static app) |
| Config file | none |
| Quick run command | Open `index.html` in Chrome DevTools responsive mode at 375px |
| Full suite command | Manual: test at 375px, 414px, 599px, 600px widths |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MOBI-03 | Header shows only logo + live indicator on mobile | manual-only | DevTools responsive mode 375px -- verify `.src-pills` not visible | N/A |
| MOBI-04 | Room tabs scroll horizontally with snap | manual-only | DevTools responsive mode 375px -- swipe tabs, verify snap behavior | N/A |
| MOBI-05 | All interactive elements >= 44px touch target | manual-only | DevTools computed styles -- check `height` or `min-height` on each element | N/A |

**Manual-only justification:** This is a CSS-only visual/interaction change in a single-file static HTML app. There is no test runner, no build step, and no DOM testing framework. The appropriate validation is visual inspection in Chrome DevTools responsive mode.

### Sampling Rate
- **Per task commit:** Open `index.html`, toggle DevTools to 375px, verify the specific requirement
- **Per wave merge:** Test at 375px, 414px, 599px (below breakpoint) and 600px (above breakpoint -- verify no regression)
- **Phase gate:** Full manual sweep of all interactive elements at 375px

### Wave 0 Gaps
None -- no test infrastructure needed for CSS-only manual validation.

## Sources

### Primary (HIGH confidence)
- Source code analysis: `index.html` lines 8-358 (CSS), 361-376 (header HTML), 1091-1133 (room rendering)
- CSS property values measured directly from source for touch target audit

### Secondary (MEDIUM confidence)
- WCAG 2.2 SC 2.5.8 target size requirements (24px minimum, 44px recommended)
- Apple HIG touch target guidelines (44pt minimum)
- CSS `scroll-snap-type` browser support (caniuse.com -- 96%+ global support)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Pure CSS, no libraries needed
- Architecture: HIGH - Direct source code analysis of all affected elements
- Pitfalls: HIGH - Well-known CSS patterns, verified against source structure

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable CSS patterns, no external dependencies)
