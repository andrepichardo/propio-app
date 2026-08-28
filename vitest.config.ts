import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: false,
    // `shared/config/env.ts` validates the whole server env at IMPORT time, so
    // any module that reaches it — the email templates pull `clientEnv` — fails
    // to load without these. Deliberately fake: nothing under test opens a
    // connection or signs anything, and pointing them at the real `.env` would
    // aim unit tests at the dev database.
    env: {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/propio_test',
      AUTH_SECRET: 'unit-tests-do-not-sign-anything',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // `server-only` throws on import outside a React Server Component, which
      // would make every server module untestable. Vitest already runs in a
      // node environment, so the guard has nothing to protect here — stub it
      // rather than dropping the import from the modules it documents.
      'server-only': path.resolve(__dirname, 'src/test/server-only-stub.ts'),
    },
  },
});
