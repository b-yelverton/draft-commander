# Testing Patterns

**Analysis Date:** 2026-03-08

## Test Framework

**Runner:**
- Playwright Test `^1.58.2`
- Config: `playwright.config.js`

**Assertion Library:**
- Playwright's built-in `expect` (from `@playwright/test`)

**Run Commands:**
```bash
npx playwright test              # Run all tests
npx playwright test --headed     # Run with browser visible
npx playwright test --reporter=list  # Verbose output
```

## Test File Organization

**Location:**
- Separate `tests/` directory at project root

**Naming:**
- `*.spec.js` pattern (CommonJS, not ESM)

**Structure:**
```
tests/
  sources.spec.js     # Data source loading and parsing tests
```

**Current coverage:** Only one test file exists, focused on data source integration testing.

## Test Infrastructure

**Web Server:**
- Playwright auto-starts a local server via `npx serve -l 3999 -s .` when `BASE_URL` starts with `http://localhost`
- Config supports external `BASE_URL` env var for testing against deployed instances
- Port: 3999
- Server reuse enabled: `reuseExistingServer: true`

**Timeout:**
- Global test timeout: 60,000ms (60 seconds) - generous due to external API calls

**Config pattern:**
```javascript
// playwright.config.js
const baseURL = process.env.BASE_URL || 'http://localhost:3999';
module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  use: { baseURL },
  webServer: baseURL.startsWith('http://localhost') ? {
    command: 'npx serve -l 3999 -s .',
    port: 3999,
    reuseExistingServer: true,
  } : undefined,
});
```

## Test Structure

**Suite Organization:**
```javascript
const { test, expect } = require('@playwright/test');

test.describe('Data Sources', () => {
  test.beforeEach(async ({ page }) => {
    // Console error collection for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
    });
    await page.goto('/');
    // Wait for app globals to be available
    await page.waitForFunction(() => typeof S !== 'undefined');
  });

  test('FantasyCalc loads and parses players', async ({ page }) => {
    const result = await page.evaluate(async () => {
      await loadFC(1, 12, 1);
      return {
        status: S.sources.fc.status,
        count: Object.keys(S.sources.fc.data || {}).length,
        max: S.sources.fc.max,
        sample: Object.values(S.sources.fc.data || {})[0] || null,
      };
    });
    console.log('FC result:', JSON.stringify(result, null, 2));
    expect(result.status).toBe('live');
    expect(result.count).toBeGreaterThan(20);
    expect(result.sample).toBeTruthy();
    expect(result.sample.name).toBeTruthy();
    expect(result.sample.value).toBeGreaterThan(0);
  });
});
```

**Patterns:**
- `beforeEach` navigates to `/` and waits for the global state object `S` to exist
- Console error collection attached in `beforeEach` for debugging test failures
- Tests call global functions directly via `page.evaluate()` since all app code is in global scope
- Results extracted from global state `S` and returned from `page.evaluate()` for assertion
- Debug logging with `console.log()` of full JSON results before assertions

## Mocking

**Framework:** Playwright's built-in `page.route()` for network interception.

**Patterns:**
```javascript
// Intercept specific proxy to simulate rate-limiting/error
await page.route('**/api.codetabs.com/**', route => {
  route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: '<html><body><h1>Rate Limited</h1>...</body></html>',
  });
});
```

**What is mocked:**
- CORS proxy responses (to test proxy fallback resilience)
- Only specific proxies are mocked; the test verifies the app falls back to working proxies

**What is NOT mocked:**
- Actual external API calls (FantasyCalc, KTC, Dynasty Daddy, DynastyProcess)
- These are real integration tests hitting live APIs
- The Sleeper API is not tested at all currently

## Test Categories

**Integration Tests (all current tests):**
- 7 tests in `tests/sources.spec.js`
- All hit real external APIs (FantasyCalc, KTC via proxy, Dynasty Daddy via proxy, DynastyProcess via GitHub)
- Tests verify end-to-end data loading and parsing

**Test inventory:**

| Test | What it verifies |
|------|-----------------|
| `FantasyCalc loads and parses players` | FC API returns data, status becomes 'live', players have name + value |
| `KTC loads and parses players via CORS proxy` | KTC scraping works through proxy chain, players parsed correctly |
| `Dynasty Daddy loads and parses players via CORS proxy` | DD API returns data through proxies |
| `DynastyProcess loads and parses players from CSV` | DP CSV from GitHub parsed, no stray quotes in fields |
| `KTC skips bad proxy returning rate-limit page` | Proxy fallback: app recovers when first proxy returns HTML error |
| `DD skips bad proxy returning HTML error page` | Proxy fallback: app recovers when first proxy returns HTML error |
| `DP parsed fields have no stray quotes` | CSV parsing correctness: no quote artifacts in name/position/team |

**Test tagging:**
- `@local` tag used for proxy resilience tests that only run locally:
```javascript
test('KTC skips bad proxy returning rate-limit page', { tag: '@local' }, async ({ page }) => {
  test.skip(!!process.env.BASE_URL, 'Proxy resilience tests only run locally');
  // ...
});
```

## Assertion Patterns

**Common assertions:**
```javascript
expect(result.status).toBe('live');           // Exact match
expect(result.count).toBeGreaterThan(20);     // Numeric threshold
expect(result.sample).toBeTruthy();           // Existence check
expect(result.sample.name).toBeTruthy();      // Field existence
expect(result.sample.value).toBeGreaterThan(0); // Positive value
expect(typeof result.sample.name).toBe('string'); // Type check
expect(result.sample.name).not.toContain('"');    // Negative content check
expect(result.badNames).toBe(0);              // Zero-count check
```

## Fixtures and Factories

**Test Data:**
- No fixtures or factories. Tests rely entirely on live API data.
- No test data files in the repository.

**Location:**
- Not applicable. No fixture directory exists.

## Coverage

**Requirements:** None enforced. No coverage tooling configured.

**Gaps:**
- No unit tests (all tests are integration/E2E)
- No tests for: rendering, event handling, trade evaluation, scarcity simulation, opponent profiling, draft polling, state management, localStorage persistence
- Tests depend on external API availability (flaky by nature)

## Test Types

**Unit Tests:**
- Not present. No unit test framework configured.
- Pure functions like `normName()`, `parsePick()`, `getFuturePickValue()`, `detectTiers()`, `evaluateTradeEnhanced()` have no unit tests despite being good candidates.

**Integration Tests:**
- All 7 current tests are integration tests
- Test the full data loading pipeline: network request -> parsing -> state update
- Depend on real external services being available

**E2E Tests:**
- No true E2E tests that simulate user workflows (entering username, connecting to draft, navigating tabs)
- Current tests bypass UI interaction and call global functions directly via `page.evaluate()`

## Adding New Tests

**New test file:** Create `tests/{feature}.spec.js` following the existing pattern:

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
    });
    await page.goto('/');
    await page.waitForFunction(() => typeof S !== 'undefined');
  });

  test('description of behavior', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Call global functions, read global state S
      return { /* extracted data */ };
    });
    expect(result.field).toBe(expectedValue);
  });
});
```

**Key consideration:** Since all app code is in the global scope of `index.html`, any function or variable can be accessed via `page.evaluate()`. This is both the testing strategy and its limitation -- there is no way to test individual modules in isolation without the full page context.

---

*Testing analysis: 2026-03-08*
