import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  globalSetup: './setup.mjs',
  outputDir: './test-results',
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({
    name: browserName,
    use: { browserName },
  })),
});
