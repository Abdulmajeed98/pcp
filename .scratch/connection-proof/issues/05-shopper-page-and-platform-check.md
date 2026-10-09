# 05: The Shopper app's page shows the API's status, and `pnpm platform:check` proves it in a browser

**Spec:** [the connection proof spec](../spec.md)

**What to build:** The Shopper app's placeholder page becomes a page rendered on the server from a value it fetched from the API: the time the API started, read through `@pcp/api-client`. It is fetched when the page is requested and never when the app is built. When the API cannot be reached, the page says so in one plain line. The page is still a placeholder, and it sets the pattern every Shopper page will copy.

A new command, `pnpm platform:check`, proves it on the running platform. It belongs to a ninth project, `@pcp/e2e`, written with Playwright's test runner, which imports no other project and sees the platform only through a browser and over HTTP. The command starts the apps that are not running, uses the ones that are, and stops only what it started. It is run on demand and is not part of `pnpm check`.

This ticket builds the whole command against the simplest join of the step. Ticket 06 adds the login's lines to the same command.

**Blocked by:** 04

**Status:** resolved

- [x] Before anything is written, Next's documentation for the installed version is read for rendering at request time, for `connection()`, for how `fetch` is cached in a server component, and for settings read on the server only. Playwright's current documentation is read for its test runner and for starting servers and using ones that are already running. The documentation of Nx's Playwright plugin is read, for the pinned Nx version, for how its target is inferred and whether it is cached. The findings are recorded under Comments.
- [x] The Shopper app's page is a server component that fetches the API's status through `@pcp/api-client` and shows it. It is one unstyled line of English, is still marked as a placeholder, and does not present the working title as a brand.
- [x] The page is rendered when it is requested and never when the app is built. `pnpm check` builds the Shopper app with no API running, and the built app holds no status from build time.
- [x] `connection()` is called where the fetch is made, so that the route file stays a re-export. Step 3's bans hold as they stand, with none changed.
- [x] The API's address is one setting, read on the Shopper app's server only, with the API's development address as its default. It is not a setting Next publishes to the browser.
- [x] When the API cannot be reached, the page shows one plain line saying so, and no crash page.
- [x] The Shopper app no longer uses the placeholder export of `@pcp/api-client`. It has no login code and does not depend on `keycloak-js`.
- [x] `@pcp/e2e` is a ninth project, in `apps/` beside the three apps, written with Playwright's test runner and driven through Nx's Playwright plugin, which is pinned with the other Nx plugins.
- [x] `@pcp/e2e` carries the tags `scope:e2e` and `type:e2e` and may import no other project. `pnpm boundaries:check` gains a case in which it imports another project and is refused, and passes on every line.
- [x] `pnpm check` lints and type-checks `@pcp/e2e`. The project has no `test` target and no `build` target, so `pnpm check` never runs its tests. `pnpm check` passes with Docker stopped and with no browser installed.
- [x] `pnpm platform:check` runs the project's tests in Chromium only, with one worker. It is never answered from Nx's cache, and how that is ensured is recorded.
- [x] The command starts each of the three apps whose port is not answering, with the same development servers the owner uses. It uses an app that is already answering, and it stops only what it started.
- [x] The command does not start the services. Before any test it checks that Keycloak answers and that `.env` holds the development Admin's settings. When either is missing it says so, names `pnpm services:up` and exits non-zero.
- [x] The command prints one line for each thing it checked and exits non-zero when any fails. When the browser is not installed it says so and names the command that installs it.
- [x] A failed run leaves Playwright's report and trace in a folder Git ignores.
- [x] The command's first line: the Shopper page's HTML, fetched with no browser and so with no script run, holds the start time that the API's status endpoint answers when asked directly. The page opened in Chromium shows the same time.
- [x] A new package's install script is read before it is added to the list pnpm allows. The browser is installed with Playwright's own command, and `pnpm install` does not download it.
- [x] Shown once and then reverted: with the Shopper app given a wrong address for the API, the command fails on its line. With the services stopped, the command says they are not running and exits non-zero.
- [x] Checked by hand: with the API stopped, the Shopper page shows its plain line. With one app already running, the command uses it and leaves it running. With none running, it starts all three and leaves none behind. Interrupted part-way, it leaves no app that it started.
- [x] Nx lists exactly nine projects, and `@pcp/e2e` depends on none of the others.
- [x] The results of the fault checks and the by-hand checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 9 October 2026: completed

**What was read first.**

- Next's documentation, which is for 16.4.0. The installed Next is 16.1.7. "`fetch` requests are not cached by default". `connection()` makes rendering wait for a request, and after it "this env variable is evaluated at runtime". "By default, environment variables are only available on the server", and only a name that starts with `NEXT_PUBLIC_` reaches the browser. Next loads `.env` files from the app's own folder, so it does not read the services' `.env` at the repository root.
- Playwright's documentation of its test runner's servers, read when the spec was written: several can be listed, and one that already answers can be used.
- Nx's Playwright plugin, 23.2.1, from its installed source, because its page on Nx's site came back empty.

**What Nx's plugin does, which the spec did not expect.**

- Its target is cached by default. The project switches the cache off for it, and the command also passes `--skip-nx-cache`.
- It reads the servers listed in Playwright's configuration. For a command written as `nx serve <project>`, with `reuseExistingServer` on, it makes that project's `serve` target a dependency of the tests. Nx then starts the three apps itself, waits until every address answers, and stops what it started. Playwright uses the servers that Nx started.
- It also infers targets for continuous integration, `e2e-ci` and its parts. Nothing uses them.
- The spec says the command "starts each of the three apps whose port is not answering". It is Nx that does so, and what was asked for holds: see the by-hand checks.

**What was built.**

- The Shopper page reads the status in its own slice's `api` segment, where `connection()` is called. The configured client and the API's address sit in the Shared layer. No import ban was changed.
- The address is the setting `API_URL`.
- The build's own table of routes marks the page as dynamic, "server-rendered on demand", and no file for it is written at build time.
- `@pcp/e2e` carries two constraints in the root lint configuration, one for each of its tags, and neither allows it any project.
- `pnpm platform:check` is a small script. It checks that `.env` holds the development Admin's settings and that the realm answers, and only then hands over to Nx.
- Playwright's `list` reporter prints one line for each test. A failed run leaves a report and a trace under the project's `test-output` folder, which Git already ignores.
- The pinned Oxlint has no rules for Playwright, as ticket 02 found, so the project is linted with the shared rules only.

**The browser.** `pnpm install` downloads none. `pnpm exec playwright install chromium` downloaded Chromium, its headless shell and FFmpeg into the owner's cache folder, 572 MB in all. Without it the command fails its line with Playwright's own message: "Looks like Playwright was just installed or updated. Please run the following command to download new browsers: pnpm exec playwright install".

**The line.** `✓ the Shopper app's page comes from the API: it shows the time the API says it started`. Before the page was changed, the same line failed on the page's HTML.

**The fault checks.** Each was reverted.

| Fault | Result |
|---|---|
| The Shopper app is given a wrong address for the API | The line fails. The page it received says "The API cannot be reached." |
| The services are stopped | "Keycloak cannot be reached, so the services are not running. Start the services with "pnpm services:up"." The exit code is 1, and no app was started. |

**The by-hand checks.**

- With the API stopped, the Shopper page answers 200 and shows "The API cannot be reached." The API's address does not appear in what the browser is sent.
- With no app running, the command started all three and left none behind, and no Nx process either.
- With the API started beforehand through `pnpm exec nx serve @pcp/api`, Nx said it was "Waiting for @pcp/api:serve:development in another nx process", the line passed, and the same API was still running afterwards, with the other two stopped.
- With the built API started outside Nx on the same port, the line passed and the same API was still running afterwards. This was tried for the API only.
- Interrupted while all three apps were up, the command ended within two seconds and left no app and no Nx process.

**The checks.** `pnpm check --skip-nx-cache` passed for all nine projects with Docker made unreachable and with Playwright pointed at a folder that holds no browser. `pnpm boundaries:check` passed on all 108 lines, the new project's case among them. Nx lists nine projects, and `@pcp/e2e` depends on none of the others.
