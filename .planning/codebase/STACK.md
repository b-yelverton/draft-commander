# Technology Stack

**Analysis Date:** 2026-03-08

## Languages

**Primary:**
- JavaScript (ES2017+) - All application logic, inline in `index.html`
- CSS3 - All styling, inline in `index.html` `<style>` block (lines 8-365)

**Secondary:**
- HTML5 - Single-page structure in `index.html`

## Runtime

**Environment:**
- Browser-only (no server-side runtime required)
- Modern browser with `async/await`, `fetch`, `localStorage`, CSS custom properties support

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- None - Vanilla JavaScript with manual DOM rendering via `innerHTML` string templates
- No framework, no build step, no transpilation

**Testing:**
- Playwright `^1.58.2` - E2E browser tests (`tests/sources.spec.js`)

**Build/Dev:**
- `serve` `^14.2.6` - Static file server for local development and Playwright tests
- No bundler, no TypeScript, no preprocessors

## Key Dependencies

**Critical (devDependencies only -- zero production dependencies):**
- `@playwright/test` `^1.58.2` - E2E testing framework
- `serve` `^14.2.6` - Local static file server (used by Playwright `webServer` config)

**External CDN Resources (loaded at runtime):**
- Google Fonts (`fonts.googleapis.com`) - Instrument Serif, Sora, JetBrains Mono
- Vercel Analytics (`/_vercel/insights/script.js`) - Page analytics
- Vercel Speed Insights (`/_vercel/speed-insights/script.js`) - Performance monitoring

## Architecture Pattern

**Single-file SPA:**
- Everything lives in `index.html` (~1970 lines)
- Lines 8-365: CSS (inline `<style>`)
- Lines 367-1960: JavaScript (inline `<script>`)
- HTML body contains only a header bar and `<div id="app">` mount point
- Rendering is done via a global `render()` function that sets `innerHTML` based on `S.view` state
- State management via a global mutable object `S` (line 387)

**State Persistence:**
- `localStorage` with prefix `draftcmdr_` for username, source weights, and cached ranking data
- Functions: `saveLocal()`, `loadLocal()`, `clearLocal()` (lines 374-376)

## Configuration

**Environment:**
- No `.env` file required - all configuration is client-side
- `BASE_URL` env var used only by Playwright config (defaults to `http://localhost:3999`)

**Build:**
- `vercel.json` - Deployment config: no build command, output directory is `.`, framework is `null`
- `playwright.config.js` - Test runner config: `testDir: './tests'`, `timeout: 60000`, dev server on port 3999

**Security Headers (via `vercel.json`):**
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`

## Platform Requirements

**Development:**
- Node.js (for npm, serve, and Playwright)
- `npx serve -l 3999 -s .` to run locally
- No build step required

**Production:**
- Vercel (static site hosting)
- Zero build step - serves `index.html` directly
- All API calls are client-side (browser `fetch`)

## Key Design Decisions

- **Zero dependencies in production** - No npm packages ship to the browser
- **No build pipeline** - Edit `index.html`, deploy. No compilation, bundling, or minification
- **Single-file architecture** - CSS, JS, and HTML all in one file for simplicity
- **Manual DOM rendering** - Template literals build HTML strings, `innerHTML` swaps entire views
- **Event binding after render** - `bindEvents()` called after each `render()` to attach click handlers

---

*Stack analysis: 2026-03-08*
