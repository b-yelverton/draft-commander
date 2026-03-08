# Phase 2: Mobile Layout - Research

**Researched:** 2026-03-08
**Domain:** CSS responsive layout (mobile-first breakpoints, CSS Grid stacking)
**Confidence:** HIGH

## Summary

Phase 2 restructures the room view and pre-room screens to work on phone (< 600px) and tablet (600px-1000px) viewports. The codebase is a single-file static app with all CSS inline in `index.html`. The current responsive approach is a single `@media(max-width:1000px)` rule at line 67 that collapses the room grid to one column. Phase 2 replaces this with mobile-first `min-width` breakpoints at 600px and 1000px.

The primary risk areas are: (1) the board player row which contains 8-9 fixed-width columns totaling ~330px minimum before the flex name column, (2) the room-top bar which packs pick clock, my-picks chips, tabs, and metadata into a single flex row, and (3) the draft-grid's `minmax(320px, 1fr)` which forces horizontal scroll on phones under 320px. The sidebar, setup screen, and loading screen are already largely responsive and need only minor adjustments.

**Primary recommendation:** Split into 2 plans -- (1) room grid restructuring + room-top/board mobile adaptation, (2) non-room screens + sidebar stacking polish.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None -- user elected to skip discussion.

### Claude's Discretion
- **Breakpoint strategy:** Phase 1 uses `max-width: 1000px`. Phase 2 switches to mobile-first `min-width` breakpoints (600px, 1000px) per STATE.md technical context
- **Room layout stacking:** Decide how board and sidebar stack on phone -- whether sidebar sections collapse, accordion, or just stack linearly
- **Tablet adaptation:** Decide layout approach for 600px-1000px range -- could be narrower two-column, single column with wider content, or hybrid
- **Non-room screens:** Decide how setup form, loading screen, and draft selection cards adapt to narrow viewports
- **Board table on mobile:** Decide which columns to show/hide on narrow viewports (note: MOBI-07 column hiding is v2/deferred, but basic readability is in scope)

### Deferred Ideas (OUT OF SCOPE)
- MOBI-07: Player rows hide individual source value columns on mobile (v2)
- MOBI-08: Landscape mode optimization (v2)
- MOBI-09: Progressive source hydration column fade-in (v2)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MOBI-01 | Room view uses single-column layout on phone viewports (< 600px) with sidebar content below the main panel | Room grid restructure: remove `1fr 340px`, base style becomes single-column, `min-width:1000px` restores two-column. Board panel gets `overflow-x:auto` for row scrolling. Sidebar stacks below. |
| MOBI-02 | Room view uses adapted layout on tablet viewports (600px-1000px) with appropriate content stacking | Single-column layout at 600px-999px with full-width board and sidebar stacked below. Existing `max-width:1000px` rule already does this -- just needs conversion to mobile-first equivalent. |
| MOBI-06 | Setup screen, loading screen, and draft selection screen are usable on phone viewports | Setup form already has `max-width:440px` and uses flex -- only needs padding reduction. Draft grid `minmax(320px,1fr)` needs reduction to `minmax(280px,1fr)`. Loading screen is already fully responsive. |
</phase_requirements>

## Current CSS Analysis

### Room Grid (Line 66-67)
```css
/* Line 66 */ .room{display:grid;grid-template-columns:1fr 340px;grid-template-rows:auto 1fr;gap:0;height:calc(100vh - 52px);overflow:hidden}
/* Line 67 */ @media(max-width:1000px){.room{grid-template-columns:1fr;grid-template-rows:auto auto 1fr}}
```
**Issue:** Desktop-first. The 340px fixed sidebar column causes horizontal scroll on any viewport under ~500px. The `overflow:hidden` on `.room` masks the problem by clipping content.

**Fix:** Base style becomes single-column (mobile). Add `@media(min-width:1000px)` for the two-column `1fr 340px` layout.

### Board Player Row (Lines 94-113)
The `.p-row` uses flex with fixed-width children:
| Element | Width | Line |
|---------|-------|------|
| `.p-rank` | 26px | 98 |
| `.p-pos` | 28px | 99 |
| `.p-name` | flex:1 | 105 |
| `.p-team` | 28px | 106 |
| `.p-val` (x4) | 44px each (CSS) / 36px (inline) | 107, 1170-1173 |
| `.p-div` | 16px | 113 |
| Rank delta | 50px (inline) | 1158-1162 |

**Minimum row width calculation:**
- 26 + 28 + 28 + (4 x 36) + 50 + gaps(~48) = ~324px (before name column)
- With any name text at all, minimum usable width is ~400px

**Issue:** On a 375px phone viewport with 16px padding on each side, available width is ~343px. The row WILL overflow.

**Fix:** The board panel already has `overflow-y:auto` (line 84). Add `overflow-x:auto` on mobile so the board becomes horizontally scrollable as a table. This is the standard pattern for data-dense tables on mobile. Note: MOBI-07 (column hiding) is explicitly deferred to v2, so horizontal scroll is the correct v1 approach.

### Board Header Row (Lines 1143-1149)
Inline styles with fixed widths matching the player rows:
```html
<span style="width:30px">RK</span><span style="width:26px"></span><span style="flex:1">PLAYER</span><span style="width:28px">TM</span>
<span style="width:36px;text-align:right">FC</span>
<span style="width:36px;text-align:right">KTC</span>
<span style="width:36px;text-align:right">DD</span>
<span style="width:36px;text-align:right">DP</span>
<span style="width:50px;text-align:center">delta RNK</span>
```
These inline spans scroll with the board panel -- no separate fix needed if `overflow-x:auto` is on the board panel.

### Room Top Bar (Lines 68-81)
```css
.room-top{grid-column:1/-1;...display:flex;align-items:center;gap:var(--sp-lg);flex-wrap:wrap}
```
Contains: pick clock div, my-picks chips, draft-meta (tabs + metadata + refresh btn).

**Issue:** `flex-wrap:wrap` already helps, but the `.room-tabs` (line 74) contain 6 tab buttons in a flex row. On phone viewports, the tabs alone need ~380px+ (6 tabs x ~60px each). With `draft-meta` containing tabs + spans + button, this overflows.

**Fix:** On mobile, make `.room-tabs` horizontally scrollable with `overflow-x:auto` and `flex-shrink:0` on each tab. The room-top should wrap its children so tabs go to their own line. Note: MOBI-04 (scrollable tabs) is Phase 3, but we need basic non-overflow here.

### Header (Lines 26-37)
```css
.hdr{...padding:12px 24px;display:flex;align-items:center;gap:16px;...}
```
Contains logo, src-pills, tip-btn, switch-draft-btn, live-indicator.

**Issue on mobile:** Source pills (`.src-pills`) take horizontal space. The header pads 24px on each side. On narrow phones, elements may compress or overflow.

**Fix:** Reduce header padding on mobile. Note: MOBI-03 (header collapse/pill hiding) is Phase 3, so we only need to prevent overflow here, not redesign the header.

### Sidebar (Lines 122-135)
```css
.sidebar{overflow-y:auto;...display:flex;flex-direction:column;border-left:1px solid var(--border)}
```
The sidebar is already a vertical column layout. When stacked below the board on mobile, it needs:
- Remove `border-left` (no longer beside the board)
- Add `border-top` instead
- Remove fixed height constraint (currently constrained by room grid `1fr` row)

### Setup Screen (Lines 41-58)
```css
.setup{...min-height:calc(100vh - 52px);padding:var(--sp-3xl) var(--sp-xl)}
.setup-form{...width:100%;max-width:440px}
```
**Already mostly responsive.** Uses `max-width:440px` with `width:100%`. The `clamp(32px,5vw,44px)` on h1 scales well. The feature stats row (line 962) uses `flex-wrap:wrap` with `min-width:100px`.

**Minor fix:** Reduce `padding:var(--sp-3xl) var(--sp-xl)` on very narrow viewports. The tip-cta (line 251) has `max-width:440px` which is fine.

### Draft Selection Screen (Lines 220-244)
```css
.draft-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:10px;width:100%;max-width:1000px}
```
**Issue:** `minmax(320px, 1fr)` means on a 375px viewport with padding, the grid forces a 320px minimum column which can overflow if total available width < 320px.

**Fix:** Change to `minmax(min(320px, 100%), 1fr)` or reduce to `minmax(280px, 1fr)`.

### Loading Screen (Line 60-63)
```css
.loading{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:calc(100vh - 52px);gap:var(--sp-lg)}
```
**Already fully responsive.** Centered spinner + text. No fixed widths. No changes needed.

### Trade Evaluator (Lines 1290-1320)
```html
<div style="display:flex;gap:14px;margin-bottom:14px">
  <div class="trade-side">...</div>
  <div style="...">swap icon</div>
  <div class="trade-side">...</div>
</div>
```
**Issue:** Two `flex:1` trade sides in a flex row. On mobile, each gets ~45% of viewport width which is cramped but technically works since content is flexible. However, the future pick chips row (line 1287) has many chips that wrap.

**Fix:** Stack trade sides vertically on mobile with `flex-direction:column` on the container. This is CSS-only -- the inline `display:flex` becomes a problem because it's an inline style. Need to either add a class or use a more specific selector.

### Chart Panel Content Areas
- `.chart-stats` (line 150): `grid-template-columns:repeat(3,1fr)` -- works on mobile but cells get narrow
- `.pick-detail` (line 154): `grid-template-columns:1fr 1fr 1fr 1fr` -- 4 columns get very narrow on mobile
- These are secondary concerns -- usable if tight, and MOBI-07-style polish is v2

### Modal (Lines 161-166)
```css
.modal{...width:90%;max-width:520px;...}
```
**Already responsive.** Uses percentage width with max-width cap.

## Architecture Patterns

### Mobile-First Breakpoint Strategy

**Base styles (all viewports):** Single-column layout, stacked content, full-width elements.

**`@media (min-width: 600px)`:** Tablet -- wider padding, possibly wider form elements, draft grid gets multi-column.

**`@media (min-width: 1000px)`:** Desktop -- room gets two-column grid (`1fr 340px`), sidebar beside board.

### Conversion Pattern
The existing `max-width:1000px` rule at line 67 gets deleted. Instead:

```css
/* Base (mobile): single column */
.room { display: grid; grid-template-columns: 1fr; grid-template-rows: auto auto 1fr; ... }

/* Desktop: two-column with sidebar */
@media (min-width: 1000px) {
  .room { grid-template-columns: 1fr 340px; grid-template-rows: auto 1fr; }
}
```

### Room Grid Stacking on Mobile
On phones (< 600px) and tablets (600px-999px), the room uses:
- Row 1: `.room-top` (pick info + tabs)
- Row 2: Board panel (main content area, full-width, `overflow-x:auto` for wide rows)
- Row 3: Sidebar (stacked below, linear sections -- no accordion needed since sidebar sections are already compact)

The grid-template-rows `auto auto 1fr` makes the sidebar take remaining space. But on mobile, `overflow:hidden` on `.room` prevents scrolling the whole page. The fix: on mobile, remove `overflow:hidden` and `height:calc(100vh - 52px)` from `.room`, making it a normal flowing document. The board panel and sidebar become scrollable page sections rather than independently scrolling panes.

### Inline Style Problem
Several layout-critical styles are inline in JS template literals (lines 1143-1149, 1158-1162, 1170-1173, 1281-1290). These cannot be overridden by media queries without `!important`.

**Recommendation:** Leave inline styles as-is for this phase. The board's `overflow-x:auto` makes inline widths scroll horizontally rather than overflow. The trade evaluator's inline `display:flex` on the sides container is the one inline style that needs addressing -- add a `.trade-sides` class to the container div and use that for the media query override.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Data table mobile | Custom column-hiding logic | `overflow-x: auto` on board panel | Column hiding is v2 (MOBI-07). Horizontal scroll is the standard pattern for dense data tables. |
| Mobile detection | JS `window.innerWidth` checks | CSS media queries only | CSS-only is more reliable, no JS state to sync, works with resize/rotation |
| Sidebar collapse/accordion | JS toggle with accordion expand | Linear stacking (just stack it) | Sidebar sections are already compact. Accordion adds interaction complexity for minimal benefit at v1. |

## Common Pitfalls

### Pitfall 1: overflow:hidden masking mobile overflow
**What goes wrong:** The `.room` has `overflow:hidden` which clips overflowing content silently. On desktop this prevents unwanted scrollbars, but on mobile it hides content.
**Why it happens:** Desktop-first CSS assumes fixed viewport height with internal scroll panes.
**How to avoid:** On mobile, remove `overflow:hidden` from `.room` and let the page scroll naturally. Only restore it at the desktop breakpoint where internal scroll panes are used.
**Warning signs:** Content appears cut off at bottom of viewport on phone.

### Pitfall 2: Fixed height room on mobile
**What goes wrong:** `height:calc(100vh - 52px)` on `.room` creates a fixed viewport-height container. On mobile, this means the board and sidebar must scroll within their own tiny panes.
**Why it happens:** Desktop layout uses the full viewport with independently scrolling panels (board scrolls, sidebar scrolls).
**How to avoid:** On mobile, use `min-height` instead of `height`, or remove the height constraint entirely so the room flows as a document.
**Warning signs:** Tiny scrollable areas on phone, user can't find sidebar content.

### Pitfall 3: Inline styles defeating media queries
**What goes wrong:** Inline `style="width:36px"` on board column spans cannot be overridden by CSS class-based media queries without `!important`.
**Why it happens:** CSS specificity -- inline styles win over class selectors.
**How to avoid:** For Phase 2, don't fight inline styles. Use `overflow-x:auto` on the board container so inline-width elements scroll. For the trade evaluator container, add a CSS class.
**Warning signs:** Media query changes have no visible effect on elements with inline styles.

### Pitfall 4: Room-top wrapping chaos
**What goes wrong:** `.room-top` uses `flex-wrap:wrap` with many children (pick-clock div, my-picks, draft-meta). On narrow viewports, wrapping creates an unpredictable tall bar.
**Why it happens:** Three groups of content compete for horizontal space.
**How to avoid:** On mobile, explicitly stack room-top children vertically with `flex-direction:column` and reduce padding. Tabs should get their own row.
**Warning signs:** Pick info and tabs overlapping, excessively tall room-top bar.

### Pitfall 5: 100vh bug on mobile Safari
**What goes wrong:** `100vh` on iOS Safari includes the URL bar area, making `calc(100vh - 52px)` taller than the visible viewport.
**Why it happens:** Safari's dynamic viewport sizing.
**How to avoid:** Use `100dvh` (dynamic viewport height) where supported, with `100vh` fallback. Or better: on mobile, don't constrain height at all -- let the document flow.
**Warning signs:** Bottom content hidden behind Safari's navigation bar.

## Recommended Plan Decomposition

### Plan 02-01: Room Grid Mobile-First Restructure
**Scope:** Core layout restructuring
- Convert room grid from desktop-first to mobile-first breakpoints
- Mobile base: single-column, natural document flow (no `overflow:hidden`, no fixed height)
- Tablet (600px+): same single-column but with wider padding
- Desktop (1000px+): restore `1fr 340px` grid with fixed height and scroll panes
- Room-top: stack vertically on mobile, tabs wrap to own line
- Board panel: add `overflow-x:auto` for mobile horizontal scroll of player rows
- Sidebar: stack below board on mobile, swap `border-left` to `border-top`
- Header: reduce padding on mobile to prevent overflow
- Add `.trade-sides` class to trade evaluator flex container for mobile stacking

**Requirements covered:** MOBI-01, MOBI-02

### Plan 02-02: Non-Room Screen Mobile Adaptation
**Scope:** Pre-room screens
- Draft selection grid: change `minmax(320px,1fr)` to handle narrow viewports
- Setup screen: minor padding adjustments for very narrow viewports
- Loading screen: verify (likely no changes needed)
- Verify tip-cta doesn't overflow on narrow viewports

**Requirements covered:** MOBI-06

**Rationale for 2 plans:** Plan 1 is the structural change (room grid, the bulk of the work). Plan 2 is lighter cleanup of non-room screens. This keeps each plan focused and independently verifiable.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual browser testing (no automated test framework detected) |
| Config file | none |
| Quick run command | Open `index.html` in browser, use DevTools responsive mode |
| Full suite command | Test at 375px, 600px, 768px, 1000px, 1440px viewports |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MOBI-01 | Room single-column < 600px, sidebar below board | manual-only | DevTools responsive @ 375px | N/A |
| MOBI-02 | Room adapted layout 600px-1000px | manual-only | DevTools responsive @ 768px | N/A |
| MOBI-06 | Setup/loading/draft-select usable on phone | manual-only | DevTools responsive @ 375px | N/A |

**Justification for manual-only:** CSS layout changes in a single HTML file with no build step or test framework. Visual verification is the correct approach. No unit test infrastructure exists in the project.

### Sampling Rate
- **Per task commit:** Resize browser to 375px and 1000px, verify no horizontal scroll or content clipping
- **Per wave merge:** Full viewport sweep (375px, 600px, 768px, 1000px, 1440px)
- **Phase gate:** All viewports verified, no horizontal scroll at any breakpoint

### Wave 0 Gaps
None -- no automated test infrastructure to set up. CSS changes are verified visually.

## Key Fixed-Width Values That Will Cause Mobile Overflow

| Element | Value | Line | Risk |
|---------|-------|------|------|
| `.room` grid-template-columns | `1fr 340px` | 66 | HIGH -- 340px sidebar forces minimum ~500px width |
| `.room` height + overflow:hidden | `calc(100vh - 52px)` | 66 | HIGH -- prevents page scroll on mobile |
| `.draft-grid` minmax | `minmax(320px,1fr)` | 225 | MEDIUM -- overflows below 320px + padding |
| `.p-val` width | `44px` (CSS), `36px` (inline) | 107, 1170-1173 | LOW -- contained by `overflow-x:auto` |
| Rank delta span | `50px` (inline) | 1158 | LOW -- contained by `overflow-x:auto` |
| `.hdr` padding | `12px 24px` | 26 | LOW -- 24px padding wastes space on mobile |
| Trade sides container | inline `display:flex` | 1290 | MEDIUM -- needs class to override for stacking |
| `.pick-detail` | `1fr 1fr 1fr 1fr` | 154 | LOW -- cells get tight but don't overflow |

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of `/home/brett/projects/draft-commander/index.html` (all CSS lines 8-356, all render functions lines 928-1180)
- CONTEXT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md from `.planning/`

### Secondary (MEDIUM confidence)
- CSS Grid responsive patterns (established web standards, well-documented in MDN)
- Mobile-first breakpoint strategy (industry standard practice)
- `100dvh` for mobile Safari (widely documented iOS Safari behavior)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - vanilla CSS with standard media queries, no libraries involved
- Architecture: HIGH - direct codebase analysis, all CSS and HTML structure read
- Pitfalls: HIGH - based on specific line-by-line analysis of actual overflow risks

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable -- CSS standards don't change)
