import { defineConfig } from '@playwright/test';

/* Testy běží proti sestavenému widgetu přes http://localhost (ES modul se přes
   file:// nenačte) v nainstalovaném Edge, prohlížeč se nestahuje. */
const PORT = 4174;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  timeout: 60_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: 'http://localhost:' + PORT,
    browserName: 'chromium',
    channel: 'msedge',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npx vite preview --port ' + PORT + ' --strictPort',
    url: 'http://localhost:' + PORT + '/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
