import { defineConfig } from '@playwright/test';
import chromium from '@sparticuz/chromium';

export default defineConfig({
  testDir: './tests/browser',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    launchOptions: process.env.PABLOOOO_CHROMIUM
      ? {
          executablePath: process.env.PABLOOOO_CHROMIUM,
          args: chromium.args.filter((argument) => argument !== '--single-process'),
        }
      : {},
  },
  webServer: {
    command: 'node scripts/serve-preview.mjs',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
});
