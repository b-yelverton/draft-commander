---
phase: 05-glassmorphism-visual-refresh
plan: 01
status: complete
duration: ~60s
commit: feat(05-01)
files_modified: [index.html]
---

# Plan 05-01 Summary: Glass CSS Variables & @supports Block

## What was done
1. Added `--surface-rgb`, `--glass-blur:12px`, `--glass-opacity` to both theme blocks (0.72 light, 0.78 dark)
2. Added `@supports (backdrop-filter:blur(1px))` block with glass rules for `.hdr`, `.modal-overlay`, `.room-top`, `.section-hdr`
3. All glass rules include `-webkit-backdrop-filter` prefix for Safari < 18

## Key details
- .hdr and .room-top use `var(--glass-blur)` token; .section-hdr and .modal-overlay use hardcoded 8px
- .modal-overlay increased from .4 to .5 background opacity with 8px blur (up from base 2px)
- No glass on .pos-filters, .p-row, or .modal (intentional)
- Solid backgrounds remain outside @supports for graceful fallback
