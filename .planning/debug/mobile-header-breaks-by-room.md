---
status: diagnosed
trigger: "mobile header breaks depending on which room/screen the user is viewing"
created: 2026-03-08T00:00:00Z
updated: 2026-03-08T00:00:00Z
---

## Current Focus

hypothesis: The header is static HTML but certain elements are only hidden on mobile when .room context exists; the Switch Draft button visibility logic and src-pills population create layout differences per screen
test: Compare header element visibility across setup/draftSelect/room views at <600px
expecting: Some elements remain visible or occupy space when they should be hidden
next_action: return diagnosis

## Symptoms

expected: Mobile header (<600px) shows only logo + Switch Draft button + live indicator
actual: Header layout breaks depending on which screen/room is active
errors: none reported
reproduction: View app on phone or <600px viewport, navigate between setup/loading/draftSelect/room screens
started: unclear

## Eliminated

(none)

## Evidence

- timestamp: 2026-03-08
  checked: Header HTML structure (lines 386-400)
  found: Header is a SINGLE static HTML block outside #app, not re-rendered per view. Contains: logo div, hdr-sub "Live Draft Assistant", src-pills, tip-btn (Buy me a coffee), switchDraftBtn, liveIndicator
  implication: Header structure is consistent across all views

- timestamp: 2026-03-08
  checked: Mobile CSS rules (lines 68-93, @media max-width:599px)
  found: Mobile hides .src-pills (display:none), .tip-btn (display:none), .hdr-sub (display:none). Does NOT hide switchDraftBtn.
  implication: On mobile, header should show: logo + switchDraftBtn + liveIndicator

- timestamp: 2026-03-08
  checked: switchDraftBtn visibility logic (lines 1904-1908)
  found: Button shown (display:'') only when S.view==='room'. On setup/loading/draftSelect views, it's hidden (display:none). When view==='room' with multiple drafts, shows "Switch Draft". When view==='room' with single draft, also shows but navigates to setup.
  implication: On non-room screens, the Switch Draft button disappears, leaving only logo + liveIndicator in hdr-right

- timestamp: 2026-03-08
  checked: updatePills() function (lines 901-910)
  found: Called on every render() (line 952). Always populates srcPills innerHTML with 5 source pills regardless of view. But CSS hides .src-pills on mobile.
  implication: src-pills not the issue on mobile since display:none covers the container

- timestamp: 2026-03-08
  checked: hdr-right layout behavior
  found: .hdr-right uses margin-left:auto + display:flex + gap:10px (8px on mobile). When switchDraftBtn is display:none and src-pills is display:none and tip-btn is display:none, hdr-right contains ONLY liveIndicator. This is fine layout-wise but means no "Switch Draft" on setup/draftSelect screens.
  implication: The "break" is likely that on the room screen the Switch Draft button appears and adds width, while on other screens it's absent, creating inconsistent header layouts

## Resolution

root_cause: The header has no actual CSS breakage per screen -- the layout shift is caused by the Switch Draft button toggling visibility via inline style (display:none vs display:'') based on S.view. On the room screen, the button appears in hdr-right alongside the live indicator, adding width to the header. On setup/loading/draftSelect screens, it's hidden, so hdr-right only contains the live indicator. Combined with margin-left:auto on hdr-right, this creates a noticeable layout jump when navigating between views. Additionally, if the user expectation is "logo + Switch Draft + live indicator" on ALL screens at mobile, the current logic explicitly hides Switch Draft on non-room views.

fix: (see below)
verification: pending
files_changed: []
