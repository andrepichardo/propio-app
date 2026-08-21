import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: false,
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
