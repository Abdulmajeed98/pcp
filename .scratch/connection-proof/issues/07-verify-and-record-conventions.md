# 07: Verify from a fresh clone and record the conventions in the MVP spec

**Spec:** [the connection proof spec](../spec.md)

**What to build:** The joins are proven sound as a whole, the way the next person to pick them up will meet them: a fresh clone in a new directory, with no `.env` and no Docker volumes, then the install, the checks, the services and `pnpm platform:check`, with none of the three apps started by hand. Steps 1 to 3 showed that results left over from earlier runs can hide a fault, so this run is the one that counts. The conventions this step set, its commands and its settings are written into [the MVP spec](../../mvp/spec.md), so that every later ticket starts from them, and ADR-0004 is brought up to date. This ticket closes step 4, and with it the infrastructure.

The services of the owner's own checkout are stopped before the fresh clone's services are started, because both would claim the same ports. They are started again afterwards.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] In a fresh clone in a new directory, with no `.env` and no Docker volumes left from earlier runs, one install followed by `pnpm check --skip-nx-cache` passes, with Docker stopped and before any browser is installed.
- [ ] In the same clone, `pnpm boundaries:check` passes on every line, and Git then reports a clean working tree.
- [ ] In the same clone, `pnpm services:up` followed by `pnpm services:check` passes on every line, the development Admin's lines among them.
- [ ] In the same clone, after the browser's one-time install, `pnpm platform:check` passes on every line with none of the three apps started by hand, and leaves none of them running.
- [ ] The command's output holds a line for every check in the spec's second seam, and the API's tests hold a case for every item in the lists of its first seam.
- [ ] Checked by hand: with Keycloak stopped, the status endpoint still answers and the Shopper page still renders.
- [ ] Checked by hand: with the API stopped, the Shopper page shows its plain line and the dashboard says the API cannot be reached.
- [ ] Checked by hand: `pnpm platform:check` with the services stopped says so and names the start command. With one app already running it uses that app and leaves it running.
- [ ] Checked by hand: a second `pnpm check` with nothing changed completes from the cache.
- [ ] The owner is asked to log in once, in their own browser, as the development Admin. What they saw, or that it is still to be done, is recorded under Comments.
- [ ] Nx's project graph lists exactly nine projects, each with its tags. The dependencies between them are the ones the MVP spec records, with `@pcp/e2e` depending on none.
- [ ] No password is committed, Git ignores `.env` and everything Playwright writes, and Git reports a clean working tree after every command above.
- [ ] The Technology section of the MVP spec gains the code conventions this step set for the API: the global guard and the two access decorators, the 401 and the 403, the caller and its resolver, the error body, the settings and how they are checked, the set-up function, how an endpoint's path is written, and how the API's HTTP surface is tested with signed tokens.
- [ ] The MVP spec gains how a frontend calls the API: only through `@pcp/api-client`, how the client is made, how the dashboard supplies a token, and that the Shopper app fetches on its server at request time.
- [ ] The MVP spec's table of commands gains `pnpm platform:check` and `pnpm api-client:write`, each with what it does and when it has to be run, and the browser's one-time install.
- [ ] The MVP spec gains the development Admin's name and where its password is kept, the new wording of the rule for `.env`, and the settings of the three apps with their defaults.
- [ ] The MVP spec's tables of projects, tags, targets and directories gain the ninth project. Its sentence about what the formatter leaves alone covers the generated files, if ticket 04 excluded them.
- [ ] The MVP spec's table of development services no longer says that the realm holds no logins, and names the audience the dashboard's tokens carry.
- [ ] The MVP spec's list of what is decided gains the libraries chosen in this step, and its testing strategy names Playwright as the tool for the end-to-end journeys.
- [ ] The MVP spec says that step 4 is finished, with its date and a link to this spec, and that the infrastructure is complete. Its sentence about what is still to come is removed.
- [ ] ADR-0004 is brought up to date: the public decorator is written `@Public()`, and the guard's verification is described as built.
- [ ] A fault found here is fixed in this ticket, and the fix is recorded under Comments.
- [ ] The results of the from-scratch run and the by-hand checks are recorded under Comments.
- [ ] The work is committed.
