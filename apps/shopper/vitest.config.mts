import { defineConfig } from 'vitest/config';

// The Shopper app's unit tests, run by Vitest, the runner the owner chose on
// 3 November 2026. Nx's Vitest plugin finds this file and gives the project
// its `test` target, which runs them once, so `pnpm check` runs them. What
// they test, and how, is in `test/README.md`.
//
// Next builds the app with its own compiler and never reads this file. Vitest
// runs on Vite, which turns TypeScript into JavaScript without checking it;
// the project's `typecheck` target checks the tests with the rest.
export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/shopper',
  resolve: {
    // Resolves the `@/` alias declared in tsconfig.json, which covers the
    // tests' folder too.
    tsconfigPaths: true,
  },
  test: {
    include: ['test/**/*.spec.ts'],
    // The tests call plain functions, which need no browser.
    environment: 'node',
  },
});
