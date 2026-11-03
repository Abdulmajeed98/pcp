# The Shopper app's unit tests

This folder holds the Shopper app's unit tests, the fourth test seam of the `browse` module, which the owner added on 3 November 2026. They run with Vitest, the runner the owner chose the same day, through the project's `test` target, so `pnpm check` runs them. Run them alone with `pnpm exec nx test @pcp/shopper`.

## What they test

Plain functions of the Shopper app only, each called with its inputs and judged by its output: an address written back, a query read, a price or a number of days worded in a language.

A test imports a function through its module's public face: the index file of its slice, of its segment of the Shared layer, or of the App layer, through the `@/` alias, as the rest of the app imports it. Never a helper behind an index file, which is free to change. Lint refuses an import past an index file, and a relative path into `src`.

They never test a server component, a page, the API or what the browser draws. The API is tested from the outside by `pnpm integration:check`, and the pages, the frame and everything the browser draws by `pnpm platform:check`.

## Where they live

Here, beside `src` and outside its layers, mirroring `src`: the tests of `src/shared/currency` are in `shared/currency/`. Each file is named `<what it tests>.spec.ts`.
