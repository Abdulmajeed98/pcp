# 05: The Shopper's unit seam, started on the currency switch's address

**Spec:** [the browse spec](../spec.md)

**What to build:** The Shopper app gets unit tests of its own functions, the fourth seam the owner added on 3 November 2026, and the first in either frontend. The runner is the owner's choice, made from the agent's research. The seam's first function is a real change in this module. The currency switch keeps the page's query as `pricing` built it, but now drops `lowest` and `highest`, because a price range typed in dinars must never be read as dollars.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] **The research.** It reads Next.js's current documentation on testing and the unit-test runners it documents. For each runner, it finds how widely used it is (its weekly downloads), how it runs in an Nx project (Nx's own plugin for it, if any), and how it fits this workspace's TypeScript, its ES modules, Node 24, and the Shopper app's next-intl and Feature-Sliced Design. Sources are cited. It is recorded under Comments.
- [x] **The owner's choice.** The runners are put to the owner, the most widely used one that fits recommended first, as the owner has chosen every library so far. The owner's word is recorded under Comments.
- [x] **Its set-up.** The runner is installed pinned to an exact version, with no exception to the workspace's release-age rule. It runs through the Shopper app's own `test` target, so `pnpm check` runs it. Where the tests live is decided and recorded under Comments.
- [x] **The first function.** It writes the address the currency switch returns to: the page the Shopper was on, with its query, without `lowest` and `highest`. Its tests are written before the code, and they prove each of these:
  - the rest of the query is kept, a repeated parameter among it;
  - `lowest` and `highest` are dropped, alone or together;
  - a page with no query returns with none;
  - the language part of the address is kept.
- [x] **Its use.** The currency switch's server answer uses the function, and it is the only place the rule is written.
- [x] `pnpm platform:check`'s `shopper-currency.spec.ts` gains a line and passes on every line: a page whose query holds `lowest`, `highest` and another parameter returns without the two and with the other, with scripts and without.
- [x] **What the seam tests.** Plain functions only, through their module's public face. Never a server component, a page, the API, or what the browser draws. This is written where the seam's tests live.
- [x] Shown once and then reverted: the function keeping `lowest`, failing its unit test.
- [x] `pnpm check` passes with Docker stopped, its new unit tests among it.
- [x] The results of the fault check are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 3 November 2026: the research on the runner

**What Next.js documents.** Next.js's testing guide names four tools: Cypress, Jest, Playwright and Vitest. It was read in the installed release's own copy (Next 16.4.3, `node_modules/next/dist/docs/01-app/02-guides/testing/`) and on the website, where the text is the same. Two of the four are unit-test runners: Jest, for unit and snapshot tests, and Vitest, for unit tests. Cypress and Playwright are for end-to-end tests (Cypress for component tests too), and Playwright is already seam 3's. Both runner guides say the runner does not support `async` Server Components and send those to end-to-end tests, which this seam's rules do anyway. Nx's own generator for a Next.js app (`@nx/next:application`, 23.2.1) offers `vitest`, `jest` or `none` as its unit-test runner, in that order, with `none` the default.

**How widely each is used.** Weekly downloads, from npm's own counts:

| Package  | Week from 4 Nov 2025 | Week from 5 May 2026 | Week from 27 Oct 2026 |
| -------- | -------------------: | -------------------: | --------------------: |
| `vitest` |           18,584,285 |           59,947,081 |           171,070,982 |
| `jest`   |           33,356,366 |           43,522,569 |            61,364,548 |

Vitest passed Jest during 2026 and is now downloaded about 2.8 times as often. The counts include installs in CI and installs pulled in by other packages, for both alike. Every package counted here fell by half or more in the week from 13 October, so that dip is in the counting, not in either runner. The Nx plugins' counts, `@nx/jest` 4.0 million and `@nx/vitest` 3.1 million last week, say little, since other Nx plugins depend on both: here `@nx/vitest` came in with `@nx/vite` alone, and `@nx/eslint` depends on `@nx/jest`.

**Vitest in this workspace.**

- _Version._ The newest is 5.1.0, of 2 November 2026. But `@nx/vitest` 23.2.1, this workspace's Nx, accepts Vitest `^3.0.0 || ^4.0.0` only; Vitest 5 arrived in `@nx/vitest` 23.3.0, and Nx's website, written for the newest Nx, lists it. So the newest that fits is 4.1.12, released on 15 October 2026, well past pnpm's minimum release age of one day. `@nx/vitest` 23.2.1 itself installs `~4.1.0`. Vitest 5 waits for an Nx upgrade.
- _Nx._ `@nx/vitest` 23.2.1 is in the lockfile already, through `@nx/vite`. Listed at the root at exactly that version and added to `nx.json`'s plugins, it infers a `test` target from `apps/shopper/vitest.config.mts`. Its `testMode` would be `run`, so that `pnpm check` runs the tests once; the default is `watch`. The dashboard's `vite.config.mts` has no `test` section, so it gets no target.
- _Node 24 and Vite._ Vitest 4.1.12 asks for Node `^20 || ^22 || >=24`, and Vite `^6 || ^7 || ^8`. The dashboard's Vite 8.3.2 is in that range, so no second Vite is installed.
- _TypeScript._ Vite turns TypeScript into JavaScript without checking its types, as SWC does for Jest, and the Shopper's `typecheck` target checks them. Vite 8 reads the `@/` alias from `tsconfig.json` itself with `resolve.tsconfigPaths`, as the dashboard does, so the guide's `vite-tsconfig-paths` is not needed. The guide's jsdom, React plugin and Testing Library are for drawing components, which this seam never does, so none of them is installed either.
- _ES modules and next-intl._ Vitest runs ES modules as they are, and TypeScript and JSX out of the box. next-intl is published as ES modules only. Its testing page asks Vitest for one setting, `server.deps.inline: ['next-intl']`, and only where `createNavigation` is used, because next-intl imports `next/navigation` without a file extension. This was not tried: Vitest is not installed, and installing it is the choice.
- _Lint._ The workspace's rules for test files are Oxlint's `jest/*` rules. Oxlint's page for `jest/expect-expect` gives Vitest a default of its own, so the rules read Vitest tests too. To be confirmed at set-up with a planted `it.only`.
- _Cost._ A second runner. The API, `core` and the inspector stay on Jest.

**Jest in this workspace.**

- _Version._ The workspace has Jest 30.3.0 (`~30.3.0` at the root), `@swc/jest`, the shared `jest.preset.js` and `@nx/jest` 23.2.1, which `nx.json` registers. A `jest.config.cts` in `apps/shopper` would get a `test` target with nothing new installed. Pinning it exactly means writing `30.3.0` for `jest` at the root, which the API, `core` and the inspector share, or moving all four to 30.5.2, of 18 September 2026.
- _Nx and Node 24._ `@nx/jest` 23.2.1 accepts Jest `^29 || ^30`. Jest 30 asks for Node `>=24` among others.
- _TypeScript._ SWC strips the types, as it does for the API, and the `@/` alias takes a `moduleNameMapper` line, as Next.js's guide says.
- _ES modules and next-intl._ Jest loads CommonJS. Its own page, for Jest 30.5, still calls its support for ES modules experimental, and it needs Node's `--experimental-vm-modules`. next-intl's testing page says Jest has to be told to transform next-intl. A trial in this worktree, with the shared preset and SWC, deleted after it ran, showed the reach of that: a test that imported `@/shared/currency` passed, and one that imported `@/shared/i18n` failed with "Cannot use import statement outside a module". It failed before next-intl, at `@formatjs/intl-localematcher`, which `@pcp/i18n` itself imports. With next-intl, `use-intl`, `icu-minify` and the `@formatjs` packages added to the preset's list of packages to transform, both passed. Each function of this seam that words something in a language reaches `@pcp/i18n`, so the list grows by about five names, and again whenever one of them gains a dependency published as ES modules only. Jest 30.4.0 added `require()` of ES modules on Node 24.9 and later, which might make the list unneeded; that was not tried, and Node 24 gives Jest the `vm.SourceTextModule` it runs ES modules with only behind `--experimental-vm-modules` (`typeof vm.SourceTextModule` is `undefined` without the flag).
- _Next.js's own way._ The guide configures Jest through `next/jest`, which loads `next.config.js` and transforms with Next's compiler. It would stand beside the shared preset instead of extending it. It too leaves `node_modules` untransformed, except the packages `next.config.js` names in `transpilePackages`, so the same packages would be named there instead.
- _Cost._ Nothing new to install, and one runner across the workspace.

**Feature-Sliced Design** is the same for both. A test imports a slice or segment through its `@/` public face. The bans are written for the folders of the layers, the routing folder and the proxy file, so a test folder outside `src` gets bans only if a block is added for it. Where the tests live is decided at set-up.

**My recommendation is Vitest 4.1.12.** It is the more widely used of the two by a wide margin, Next.js documents it, Nx's generator for a Next.js app lists it first, and Nx's plugin for it is in the lockfile at this workspace's version. It reads next-intl's and `@pcp/i18n`'s ES modules as they are published, where Jest needs a list of packages to transform that grows with them. Its cost is a second runner beside the API's Jest. Jest is the better choice if one runner across the workspace weighs more than that.

**Sources.**

- Next.js: [Testing](https://nextjs.org/docs/app/guides/testing), [Vitest](https://nextjs.org/docs/app/guides/testing/vitest) and [Jest](https://nextjs.org/docs/app/guides/testing/jest), read on 3 November 2026, and the same pages in `node_modules/next/dist/docs/` for 16.4.3.
- Downloads: npm's counts, `https://api.npmjs.org/downloads/range/2025-11-03:2026-11-02/<package>` for `vitest`, `jest`, `@nx/vitest`, `@nx/jest` and `@nx/vite`, summed by week.
- Versions and their dates: `pnpm view <package> time --json`; ranges: `pnpm view <package>@<version> peerDependencies engines`.
- Nx: [Nx with Vitest](https://nx.dev/docs/technologies/test-tools/vitest/introduction) and [Nx with Jest](https://nx.dev/docs/technologies/test-tools/jest/introduction); the installed `@nx/next` generator's `schema.json` and `lib/add-vitest.js`, and `@nx/vitest` 23.2.1's `dist/src/utils/versions.js`.
- Vitest: [Features](https://vitest.dev/guide/features) and [Comparisons](https://vitest.dev/guide/comparisons).
- Jest: [ECMAScript Modules](https://jestjs.io/docs/ecmascript-modules) and its [changelog](https://github.com/jestjs/jest/blob/main/CHANGELOG.md), 30.4.0.
- next-intl: [Testing](https://next-intl.dev/docs/environments/testing).
- Vite: [`resolve.tsconfigPaths`](https://vite.dev/config/shared-options).
- pnpm: [`minimumReleaseAge`](https://pnpm.io/settings/dependency-resolution), 1440 minutes by default.
- Oxlint: [`jest/expect-expect`](https://oxc.rs/docs/guide/usage/linter/rules/jest/expect-expect.html).

Waiting for the owner's choice.

### 3 November 2026: the owner's choice

Asked "Which runner should the Shopper app use?", with Vitest 4.1.12 recommended first and Jest 30 second, the owner chose **Vitest 4.1.12**, as recommended. Vitest 5 waits for an upgrade of Nx to 23.3 or later.

### 4 November 2026: the set-up, the first function and the checks

**The set-up.** `vitest` 4.1.12 and `@nx/vitest` 23.2.1 are devDependencies at the root, each pinned to that exact version. pnpm installed them under its default minimum release age, and `pnpm-workspace.yaml` is unchanged: there is no exception. The Vite that Vitest runs on is the dashboard's 8.3.2, and no second copy was installed. `nx.json` registers `@nx/vitest` with `testMode: run`, and it gives `@pcp/shopper` a `test` target from `apps/shopper/vitest.config.mts`, which runs `vitest run` once, so `pnpm check` runs it with every project's `test`. The configuration runs the tests in Node, with no browser, finds `test/**/*.spec.ts`, and resolves the `@/` alias through Vite 8's `resolve.tsconfigPaths`. `tsconfig.json` now includes `test/`, so the project's `typecheck` checks the tests' types with the rest. No jsdom, React plugin, Testing Library or `vite-tsconfig-paths` was installed: the seam draws nothing.

**Where the tests live.** In `apps/shopper/test/`, beside `src` and outside its layers, mirroring `src`: the tests of `src/shared/currency` are in `test/shared/currency/`. `test/README.md` says what the seam tests and what it never tests, as the ticket asks. The tests import `describe`, `it` and `expect` from `vitest`, and nothing is global.

**The import bans cover the tests.** `tools/feature-sliced-bans.mjs` has a block for the folder: a test may import any layer, but only through its index file, and never by a relative path into `src`. `pnpm boundaries:check` proves it with eight new cases, five refused (past a Shared segment's index, past the App layer's index, past a page's index, a folder that is not a layer, a relative path into `src`) and three allowed; all 122 cases pass.

**The test-file lint rules read Vitest tests.** The Shopper's lint configuration now extends `.oxlintrc.test-files.json` with Oxlint's `jest` plugin, as the API, `core` and the inspector do. A throwaway test file, deleted after, was reported three times: `jest(no-focused-tests)` for an `it.only`, `jest(expect-expect)` for a test with no assertion, and `jest(consistent-test-it)` for a `test` in place of `it`.

**The first function** is `addressAfterChoosingCurrency(language, page)`, in the Shared layer's `currency` segment and exported from its index. It takes the language of the switch's own address and what the form sent as the page, and answers the address to return to. It keeps the query as the page wrote it, each parameter in its place, and drops the parameters named `lowest` and `highest`, reading each name decoded as the page does; a query left empty is dropped. It also holds the rule the route had held, that a page starting with neither `/` nor `?` returns to the first page, so the whole address is written in one place. Its tests were written one at a time, each run red before its code:

1. The language of the address is kept, in each of the three: red, the function did not exist.
2. `lowest` is dropped: red, the address kept it.
3. `highest` alone, and both together: red, the address kept `highest`.
4. The rest of the query is kept as it is, a repeated `manufacturer` among it: green on its first run, as written so far. It guards against a rewrite that keeps one value for each name.
5. A page with no query returns with none, and one whose query held only a price range returns with none: the second was red, the address ended in `?`.
6. Another site, a path with no slash first, nothing, and no page at all each return to the first page: red, the first three were joined onto the language, and the last threw.

There are 13 tests in one file.

**Its use.** The currency switch's server answer, `chooseCurrency` in `src/_app/routes/choose-currency.ts`, sends the Shopper to `addressAfterChoosingCurrency(locale, form.get('page'))`. `lowest` and `highest` appear nowhere else in the Shopper app.

**The end-to-end lines.** `shopper-currency.spec.ts` has two new lines, one with scripts and one without: the first page with `?lowest=150000&search=ryzen&highest=900000` returns, after a choice, to `?search=ryzen`. `choose` in `currencies.ts` takes the address it should return to, which is the page's own unless given. With the route planted to return to the page as it was sent, a run of the file failed exactly those two lines, each with "the choice returns to http://localhost:3000/en?search=ryzen" and the range still in the address it received; the other 13 passed. Reverted, the whole of `pnpm platform:check` passed on `13fe553`, 290 tests, the two new lines among them, in 10.6 minutes.

**The fault**, planted on the committed tree by one exact edit and reverted by its inverse: the function's price range named `highest` alone, so it kept `lowest`. `nx test @pcp/shopper` failed 4 of the 13 tests, each with `lowest=150000` still in the address it received: the rest of the query kept, a repeated parameter among it; `lowest` dropped; both ends dropped together; and a query of nothing but a price range returning with none. The other 9 passed, `highest` dropped alone among them. Reverted, all 13 passed, and the tree was clean.

**`pnpm check` with Docker stopped.** Each commit, checked out in turn, passed `pnpm check --skip-nx-cache` with `DOCKER_HOST` pointing at a socket that does not exist and `PLAYWRIGHT_BROWSERS_PATH` at an empty folder, `@pcp/shopper:test` among its tasks.

**After merging `browse/integration`** at `e74ead9`, which brought ticket 02's endpoint and no change to a file of this ticket's, `pnpm check` passed, `pnpm integration:check` passed its 430 tests, and `pnpm platform:check` passed its 290.

**Outside this ticket**, for the follow-ups: Vitest 5 (5.1.0 of 2 November 2026) waits for Nx 23.3 or later, whose `@nx/vitest` accepts it.
