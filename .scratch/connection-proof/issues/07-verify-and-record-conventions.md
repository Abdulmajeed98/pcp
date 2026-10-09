# 07: Verify from a fresh clone and record the conventions in the MVP spec

**Spec:** [the connection proof spec](../spec.md)

**What to build:** The joins are proven sound as a whole, the way the next person to pick them up will meet them: a fresh clone in a new directory, with no `.env` and no Docker volumes, then the install, the checks, the services and `pnpm platform:check`, with none of the three apps started by hand. Steps 1 to 3 showed that results left over from earlier runs can hide a fault, so this run is the one that counts. The conventions this step set, its commands and its settings are written into [the MVP spec](../../mvp/spec.md), so that every later ticket starts from them, and ADR-0004 is brought up to date. This ticket closes step 4, and with it the infrastructure.

The services of the owner's own checkout are stopped before the fresh clone's services are started, because both would claim the same ports. They are started again afterwards.

**Blocked by:** 06

**Status:** ready-for-human

- [x] In a fresh clone in a new directory, with no `.env` and no Docker volumes left from earlier runs, one install followed by `pnpm check --skip-nx-cache` passes, with Docker stopped and before any browser is installed.
- [x] In the same clone, `pnpm boundaries:check` passes on every line, and Git then reports a clean working tree.
- [x] In the same clone, `pnpm services:up` followed by `pnpm services:check` passes on every line, the development Admin's lines among them.
- [x] In the same clone, after the browser's one-time install, `pnpm platform:check` passes on every line with none of the three apps started by hand, and leaves none of them running.
- [x] The command's output holds a line for every check in the spec's second seam, and the API's tests hold a case for every item in the lists of its first seam.
- [x] Checked by hand: with Keycloak stopped, the status endpoint still answers and the Shopper page still renders.
- [x] Checked by hand: with the API stopped, the Shopper page shows its plain line and the dashboard says the API cannot be reached.
- [x] Checked by hand: `pnpm platform:check` with the services stopped says so and names the start command. With one app already running it uses that app and leaves it running.
- [x] Checked by hand: a second `pnpm check` with nothing changed completes from the cache.
- [ ] The owner is asked to log in once, in their own browser, as the development Admin. What they saw, or that it is still to be done, is recorded under Comments.
- [x] Nx's project graph lists exactly nine projects, each with its tags. The dependencies between them are the ones the MVP spec records, with `@pcp/e2e` depending on none.
- [x] No password is committed, Git ignores `.env` and everything Playwright writes, and Git reports a clean working tree after every command above.
- [x] The Technology section of the MVP spec gains the code conventions this step set for the API: the global guard and the two access decorators, the 401 and the 403, the caller and its resolver, the error body, the settings and how they are checked, the set-up function, how an endpoint's path is written, and how the API's HTTP surface is tested with signed tokens.
- [x] The MVP spec gains how a frontend calls the API: only through `@pcp/api-client`, how the client is made, how the dashboard supplies a token, and that the Shopper app fetches on its server at request time.
- [x] The MVP spec's table of commands gains `pnpm platform:check` and `pnpm api-client:write`, each with what it does and when it has to be run, and the browser's one-time install.
- [x] The MVP spec gains the development Admin's name and where its password is kept, the new wording of the rule for `.env`, and the settings of the three apps with their defaults.
- [x] The MVP spec's tables of projects, tags, targets and directories gain the ninth project. Its sentence about what the formatter leaves alone covers the generated files, if ticket 04 excluded them.
- [x] The MVP spec's table of development services no longer says that the realm holds no logins, and names the audience the dashboard's tokens carry.
- [x] The MVP spec's list of what is decided gains the libraries chosen in this step, and its testing strategy names Playwright as the tool for the end-to-end journeys.
- [x] The MVP spec says that step 4 is finished, with its date and a link to this spec, and that the infrastructure is complete. Its sentence about what is still to come is removed.
- [x] ADR-0004 is brought up to date: the public decorator is written `@Public()`, and the guard's verification is described as built.
- [x] A fault found here is fixed in this ticket, and the fix is recorded under Comments.
- [x] The results of the from-scratch run and the by-hand checks are recorded under Comments.
- [x] The work is committed.

## Comments

### 9 October 2026: completed, except the owner's own login

**One thing is still to be done, and only the owner can do it.** Log in to the dashboard once in your own browser: with the services up, run `pnpm exec nx serve @pcp/api` and `pnpm exec nx serve @pcp/dashboard`, open `http://localhost:3002`, and log in as `development-admin` with the password in `.env`, under `DEVELOPMENT_ADMIN_PASSWORD`. The page should say that the API says the caller is `development-admin`, with the role `admin`. Its box above is left unticked until then.

**The from-scratch run.** A clone of the repository was made in a new folder with another name, so that Docker gave it volumes of its own, and the owner's services were stopped first.

| Step | Result |
|---|---|
| `pnpm install` | Passed, in 12 seconds |
| `pnpm check --skip-nx-cache` | Passed for all nine projects, 23 tasks, with Docker made unreachable for the command and Playwright pointed at a folder that holds no browser |
| `pnpm boundaries:check` | Passed on all 108 lines, and Git reported a clean working tree |
| `pnpm services:up` | Created `.env` and the development Admin, in 23 seconds |
| `pnpm services:check` | Passed on all 33 lines |
| `pnpm exec playwright install chromium` | Nothing to download: the browser was in this machine's cache since ticket 05 |
| `pnpm platform:check` | Passed on all seven lines in 9 seconds, with no app started by hand, and left no app and no Nx process running |

Two things about that table. Docker itself was never stopped: the owner's services were stopped, and the check was pointed at a closed port in place of Docker. And the browser was already on this machine, so "before any browser is installed" was met by pointing Playwright at an empty folder for the check.

**Every check has its line or its case.** The seven lines of `pnpm platform:check` cover the spec's second seam, and add one: that the browser's storage holds no token. The API's tests hold a case for every item of the first seam's lists. The committed client is compared by a step of `pnpm check` and not by one of the API's tests.

**The by-hand checks, in the clone.**

- With Keycloak stopped, the status endpoint answered and the Shopper page held the start time the API gave. A call of the caller endpoint with a made-up token was answered 503.
- With the API stopped, the Shopper page answered 200 with "The API cannot be reached.", and the logged-in dashboard showed the same sentence when asked again.
- With the services stopped, `pnpm platform:check` said "Keycloak cannot be reached, so the services are not running. Start the services with "pnpm services:up"." and exited with code 1, starting no app.
- With the Shopper app already running, all seven lines passed, the same Shopper app was still running afterwards, and the other two were stopped.
- A second `pnpm check` with nothing changed read all 23 tasks from the cache.

**The project graph.** Nine projects, each with its two tags. The API depends on `@pcp/core` and `@pcp/compatibility`, the Shopper app on its four libraries, the dashboard on its three, and no library and not `@pcp/e2e` on anything.

**Nothing secret is committed.** Git ignores `.env` and the end-to-end tests' output, and reported a clean working tree after every command. The clone's services were reset and the clone deleted, and the owner's services were started again and pass their 33 lines.

**What was written into the MVP spec.** The libraries chosen, in its list of what is decided. That step 4 is finished and the infrastructure complete. The two new commands and the browser's install, with when to run each. The new wording of the rule for `.env`. The development Admin. The audience the dashboard's tokens carry. A table of the three apps' nine settings. The ninth project, in the layout and in the table of what may import what. `core`'s layer ban and its second entry. The API's conventions in code, how a frontend calls the API, and how the end-to-end tests are written. Four things about the toolchain that cost time in this step. That the end-to-end journeys are written with Playwright.

**ADR-0004** now writes the public decorator as `@Public()` and says that it followed the workplace's document until this step. It says that the guard is built and checks the audience as well, and that the API's description and the client are committed.

**No fault was found** in this ticket.

### 9 October 2026: the code review

Two reviewers read everything since the commit that added this step's spec, each without the other's findings: one against the repository's documented standards, one against the spec and these tickets. Both read the code and ran nothing. Every finding was checked against the code before it was acted on.

This ticket's status is `ready-for-human` and not `resolved`, as the spec review pointed out: one box is open, and only the owner can tick it.

**Changed because of the review.**

| Finding | What was done |
|---|---|
| A token that states no expiry was accepted. `jose` checks the expiry only of a token that states one. | The guard now requires the claim. A new test showed the token answered 200 before the change. |
| A token that names no key, while the realm publishes two, was answered 503. | It is answered 401. A new test showed the 503 first. |
| The dashboard started a login whenever a token could not be renewed, also when Keycloak was only unreachable, and could send a call with a token that had run out. | Read in the adapter's source: when Keycloak refuses, the adapter drops its tokens and starts the login itself. The dashboard now leaves that case to it and makes no call. When Keycloak cannot be asked, the call is not made and the page says so. Both were tried by hand, with tokens made to last 40 seconds for the run: after the session was ended at Keycloak the browser arrived at the login screen, and with Keycloak stopped the page stayed and said so. No call reached the API in either. |
| A failed run could print the password, because Playwright writes what `fill` types into a step's log. | The tests set the password in the page and no longer type it. |
| `pnpm platform:check` left it to Playwright to say that the browser is missing, and Playwright names the command that installs every browser. | The command checks first and names `pnpm exec playwright install chromium`. |
| The MVP spec's new blocks misdescribed the code in four places. | Corrected: a call with no token is answered 401 also at an endpoint with no access rule; the keys are kept for ten minutes at a time; the clock is mocked in the tests that let time pass; only the dashboard reads a missing response. |
| ADR-0004 still kept `*.spec.ts` for unit tests with mocked Stores, and did not say that an endpoint may have no use case. | Both are now in the ADR. |
| `Caller` and "login" were in the code and in the API's answers and not in CONTEXT.md. | The glossary gains **Login** and **Caller**, worded as this step's spec defines them. The owner may want to word them differently. |
| The tests that move the clock depended on their order. Found while the first two rows were fixed. | The clock now only moves forward, for every test that follows. |
| Smaller things: the login lookup written twice in the service scripts; the stand-in's set-up written twice in the API's tests; a test that named the list of endpoints; a branch only its own test reached; a catch that could not fire; a file named like a class that holds one function; the origin decorator in the settings file; the caller's behaviour tested in the wrong folder; a failure text that named Keycloak. | Each was changed as the reviewer suggested. |

**Not changed, and why.**

- **Role names are compared without regard to case,** so a realm role named `Admin` would count as the platform's `admin`. The spec asks for this, to follow the workplace. Keycloak's role names do distinguish case, and only someone who can already create roles in the realm could use the difference. It is the owner's call whether to compare exactly.
- **A failed fetch of the realm's discovery document is not remembered.** While Keycloak cannot be reached, each request with a token tries again, and may wait up to five seconds if Keycloak neither answers nor refuses. Remembering a failure for a short while would be new behaviour that the spec does not ask for.
- **The two tests of a token with no algorithm and of a symmetric signature** would pass without the guard's list of allowed algorithms, because `jose` refuses both on its own. The list states the intent and costs nothing. No test can tell it apart from `jose`'s own refusal.
- **`access.spec.ts` and `access-without-keycloak.spec.ts` mirror no file of the API.** They test `core`'s guard through the API's HTTP surface, which is where the spec put those tests, and they sit beside the tests of the set-up function.
- **Reuse of an app started outside Nx** was tried for the API only.

**After the changes.** `pnpm check --skip-nx-cache` passed for all nine projects with Docker made unreachable. `pnpm boundaries:check` passed on all 108 lines, `pnpm services:check` on all 33 and `pnpm platform:check` on all seven. The API has 47 tests and `core` has 37.
