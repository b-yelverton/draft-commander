const { defineConfig } = require('@playwright/test');

const baseURL = process.env.BASE_URL || 'http://localhost:3999';

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  use: {
    baseURL,
  },
  webServer: baseURL.startsWith('http://localhost') ? {
    command: 'npx serve -l 3999 -s .',
    port: 3999,
    reuseExistingServer: true,
  } : undefined,
});
