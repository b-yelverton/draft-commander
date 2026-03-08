# Phase 3: Mobile Component Polish - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Adapt individual UI components for touch interaction and narrow viewports. The header needs to collapse on mobile (hide source pills, show logo + live indicator only). Room tabs need horizontal scrolling without overflow. All interactive elements (buttons, tabs, filters) must meet 44px minimum touch target size on mobile.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
User elected to skip discussion — all implementation decisions are at Claude's discretion:

- **Header collapse strategy:** Decide how to hide source pills on mobile — CSS display:none, or a toggle/expand mechanism
- **Tab scrolling UX:** Decide scrolling implementation — CSS overflow-x:auto with scroll-snap, or manual JS scroll
- **Touch target sizing:** Decide approach to enlarge targets — padding increase, min-height/min-width, or wrapper elements
- **Which elements need touch target fixes:** Audit all interactive elements and determine which fall below 44px

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Key constraints:
1. Must work within single-file `index.html` architecture with no build step
2. Must not break Phase 2 mobile layout (mobile-first breakpoints, room grid stacking)
3. Phase 2 already added `@media(max-width:599px)` block — new rules should merge into it
4. Phase 2 already added `.room-tabs{overflow-x:auto;-webkit-overflow-scrolling:touch}` for basic tab scrolling

</specifics>

<code_context>
## Existing Code Insights

### Phase 2 Foundation
- `@media(max-width:599px)` block exists with header padding, room-top stacking, trade-sides, setup/draft-select padding, tip-cta
- `.room-tabs{overflow-x:auto;-webkit-overflow-scrolling:touch}` already in the phone breakpoint
- Header: `.hdr{padding:10px 12px;gap:10px}` on phones, `.hdr-logo{font-size:18px}`

### Header Structure (outside #app)
- `.hdr` contains: logo div, `.hdr-right` (src-pills, tip-btn, switch-draft-btn, live-indicator)
- `.src-pills` has 5 pills (FC, KTC, DD, DP, CSV)
- `updatePills()` directly updates `#srcPills` innerHTML — independent of render()

### Interactive Elements to Audit
- Room tabs: `.room-tab` buttons (6 tabs)
- Position filters: `.pos-filter` buttons (ALL, QB, RB, WR, TE + rookie toggle)
- Sidebar recommendation cards: `.sb-rec`
- Board player rows: `.p-row`
- Refresh button: `.refresh-btn`
- Connect button: `.btn`
- Setup form inputs

</code_context>

<deferred>
## Deferred Ideas

- MOBI-07: Player rows hide individual source value columns on mobile (v2)
- MOBI-08: Landscape mode optimization (v2)
- MOBI-09: Progressive source hydration column fade-in (v2)

</deferred>

---

*Phase: 03-mobile-component-polish*
*Context gathered: 2026-03-08*
