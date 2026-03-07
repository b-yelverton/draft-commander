const { test, expect } = require('@playwright/test');

// These tests load the page, trigger source loading directly (bypassing draft connection),
// and verify each source reaches 'live' status with player data.

test.describe('Data Sources', () => {

  test.beforeEach(async ({ page }) => {
    // Collect console errors for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
    });
    await page.goto('/');
    // Wait for the page to have the S global
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

  test('KTC loads and parses players via CORS proxy', async ({ page }) => {
    const result = await page.evaluate(async () => {
      await loadKTC();
      return {
        status: S.sources.ktc.status,
        count: Object.keys(S.sources.ktc.data || {}).length,
        max: S.sources.ktc.max,
        sample: Object.values(S.sources.ktc.data || {})[0] || null,
      };
    });
    console.log('KTC result:', JSON.stringify(result, null, 2));
    expect(result.status).toBe('live');
    expect(result.count).toBeGreaterThan(20);
    expect(result.sample).toBeTruthy();
    expect(result.sample.name).toBeTruthy();
    expect(result.sample.value).toBeGreaterThan(0);
  });

  test('Dynasty Daddy loads and parses players via CORS proxy', async ({ page }) => {
    const result = await page.evaluate(async () => {
      await loadDD();
      return {
        status: S.sources.dd.status,
        count: Object.keys(S.sources.dd.data || {}).length,
        max: S.sources.dd.max,
        sample: Object.values(S.sources.dd.data || {})[0] || null,
      };
    });
    console.log('DD result:', JSON.stringify(result, null, 2));
    expect(result.status).toBe('live');
    expect(result.count).toBeGreaterThan(20);
    expect(result.sample).toBeTruthy();
    expect(result.sample.name).toBeTruthy();
    expect(result.sample.value).toBeGreaterThan(0);
  });

  test('DynastyProcess loads and parses players from CSV', async ({ page }) => {
    const result = await page.evaluate(async () => {
      await loadDP();
      return {
        status: S.sources.dp.status,
        count: Object.keys(S.sources.dp.data || {}).length,
        max: S.sources.dp.max,
        sample: Object.values(S.sources.dp.data || {})[0] || null,
      };
    });
    console.log('DP result:', JSON.stringify(result, null, 2));
    expect(result.status).toBe('live');
    expect(result.count).toBeGreaterThan(20);
    expect(result.sample).toBeTruthy();
    expect(result.sample.name).toBeTruthy();
    expect(typeof result.sample.name).toBe('string');
    // Verify no stray quotes in parsed names
    expect(result.sample.name).not.toContain('"');
    expect(result.sample.value).toBeGreaterThan(0);
  });

  test('KTC skips bad proxy returning rate-limit page', { tag: '@local' }, async ({ page }) => {
    test.skip(!!process.env.BASE_URL, 'Proxy resilience tests only run locally');
    // Intercept the first proxy (codetabs) to return a fake rate-limit HTML page
    await page.route('**/api.codetabs.com/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body><h1>Rate Limited</h1><p>Too many requests. Please try again later.</p>' + 'x'.repeat(2000) + '</body></html>',
      });
    });
    const result = await page.evaluate(async () => {
      await loadKTC();
      return {
        status: S.sources.ktc.status,
        count: Object.keys(S.sources.ktc.data || {}).length,
      };
    });
    console.log('KTC bad-proxy result:', JSON.stringify(result, null, 2));
    // Should still succeed via fallback proxies
    expect(result.status).toBe('live');
    expect(result.count).toBeGreaterThan(20);
  });

  test('DD skips bad proxy returning HTML error page', { tag: '@local' }, async ({ page }) => {
    test.skip(!!process.env.BASE_URL, 'Proxy resilience tests only run locally');
    // Intercept the first proxy (codetabs) to return a fake HTML error page
    await page.route('**/api.codetabs.com/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body><h1>Service Unavailable</h1></body></html>',
      });
    });
    const result = await page.evaluate(async () => {
      await loadDD();
      return {
        status: S.sources.dd.status,
        count: Object.keys(S.sources.dd.data || {}).length,
      };
    });
    console.log('DD bad-proxy result:', JSON.stringify(result, null, 2));
    // Should still succeed via fallback proxies
    expect(result.status).toBe('live');
    expect(result.count).toBeGreaterThan(20);
  });

  test('DP parsed fields have no stray quotes', async ({ page }) => {
    const result = await page.evaluate(async () => {
      await loadDP();
      const entries = Object.values(S.sources.dp.data || {});
      const badNames = entries.filter(e => e.name.includes('"'));
      const badPositions = entries.filter(e => e.position.includes('"'));
      const badTeams = entries.filter(e => e.team.includes('"'));
      return {
        count: entries.length,
        badNames: badNames.length,
        badPositions: badPositions.length,
        badTeams: badTeams.length,
        sampleName: entries[0]?.name,
        samplePos: entries[0]?.position,
        sampleTeam: entries[0]?.team,
      };
    });
    console.log('DP quote check:', JSON.stringify(result, null, 2));
    expect(result.badNames).toBe(0);
    expect(result.badPositions).toBe(0);
    expect(result.badTeams).toBe(0);
  });
});
