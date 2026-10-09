# 05: The Shopper app's page shows the API's status, and `pnpm platform:check` proves it in a browser

**Spec:** [the connection proof spec](../spec.md)

**What to build:** The Shopper app's placeholder page becomes a page rendered on the server from a value it fetched from the API: the time the API started, read through `@pcp/api-client`. It is fetched when the page is requested and never when the app is built. When the API cannot be reached, the page says so in one plain line. The page is still a placeholder, and it sets the pattern every Shopper page will copy.

A new command, `pnpm platform:check`, proves it on the running platform. It belongs to a ninth project, `@pcp/e2e`, written with Playwright's test runner, which imports no other project and sees the platform only through a browser and over HTTP. The command starts the apps that are not running, uses the ones that are, and stops only what it started. It is run on demand and is not part of `pnpm check`.

This ticket builds the whole command against the simplest join of the step. Ticket 06 adds the login's lines to the same command.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Before anything is written, Next's documentation for the installed version is read for rendering at request time, for `connection()`, for how `fetch` is cached in a server component, and for settings read on the server only. Playwright's current documentation is read for its test runner and for starting servers and using ones that are already running. The documentation of Nx's Playwright plugin is read, for the pinned Nx version, for how its target is inferred and whether it is cached. The findings are recorded under Comments.
- [ ] The Shopper app's page is a server component that fetches the API's status through `@pcp/api-client` and shows it. It is one unstyled line of English, is still marked as a placeholder, and does not present the working title as a brand.
- [ ] The page is rendered when it is requested and never when the app is built. `pnpm check` builds the Shopper app with no API running, and the built app holds no status from build time.
- [ ] `connection()` is called where the fetch is made, so that the route file stays a re-export. Step 3's bans hold as they stand, with none changed.
- [ ] The API's address is one setting, read on the Shopper app's server only, with the API's development address as its default. It is not a setting Next publishes to the browser.
- [ ] When the API cannot be reached, the page shows one plain line saying so, and no crash page.
- [ ] The Shopper app no longer uses the placeholder export of `@pcp/api-client`. It has no login code and does not depend on `keycloak-js`.
- [ ] `@pcp/e2e` is a ninth project, in `apps/` beside the three apps, written with Playwright's test runner and driven through Nx's Playwright plugin, which is pinned with the other Nx plugins.
- [ ] `@pcp/e2e` carries the tags `scope:e2e` and `type:e2e` and may import no other project. `pnpm boundaries:check` gains a case in which it imports another project and is refused, and passes on every line.
- [ ] `pnpm check` lints and type-checks `@pcp/e2e`. The project has no `test` target and no `build` target, so `pnpm check` never runs its tests. `pnpm check` passes with Docker stopped and with no browser installed.
- [ ] `pnpm platform:check` runs the project's tests in Chromium only, with one worker. It is never answered from Nx's cache, and how that is ensured is recorded.
- [ ] The command starts each of the three apps whose port is not answering, with the same development servers the owner uses. It uses an app that is already answering, and it stops only what it started.
- [ ] The command does not start the services. Before any test it checks that Keycloak answers and that `.env` holds the development Admin's settings. When either is missing it says so, names `pnpm services:up` and exits non-zero.
- [ ] The command prints one line for each thing it checked and exits non-zero when any fails. When the browser is not installed it says so and names the command that installs it.
- [ ] A failed run leaves Playwright's report and trace in a folder Git ignores.
- [ ] The command's first line: the Shopper page's HTML, fetched with no browser and so with no script run, holds the start time that the API's status endpoint answers when asked directly. The page opened in Chromium shows the same time.
- [ ] A new package's install script is read before it is added to the list pnpm allows. The browser is installed with Playwright's own command, and `pnpm install` does not download it.
- [ ] Shown once and then reverted: with the Shopper app given a wrong address for the API, the command fails on its line. With the services stopped, the command says they are not running and exits non-zero.
- [ ] Checked by hand: with the API stopped, the Shopper page shows its plain line. With one app already running, the command uses it and leaves it running. With none running, it starts all three and leaves none behind. Interrupted part-way, it leaves no app that it started.
- [ ] Nx lists exactly nine projects, and `@pcp/e2e` depends on none of the others.
- [ ] The results of the fault checks and the by-hand checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
