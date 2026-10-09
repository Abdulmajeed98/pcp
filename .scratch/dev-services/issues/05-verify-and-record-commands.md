# 05: Verify from a fresh clone and record the commands in the MVP spec

**Spec:** [the development services spec](../spec.md)

**What to build:** The services are proven sound as a whole, the way the next person to pick them up will meet them: a fresh clone in a new directory, with no local environment file and no Docker volumes, then one start and one check. Step 1 showed that results left over from earlier runs can hide a fault, so this run is the one that counts. The commands' behaviour across both services is checked by hand once, and the service commands, the addresses and the reset rule are written into [the MVP spec](../../mvp/spec.md), so that every later ticket starts from them. This ticket closes step 2 of the infrastructure.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] In a fresh clone in a new directory, with no local environment file and no Docker volumes left from earlier runs, one install followed by `pnpm services:up` and `pnpm services:check` passes on every line.
- [ ] The scripted check's output holds a line for every assertion in the spec's Testing Decisions: PostgreSQL's port, the two databases and their two users, the discovery document, the two roles, the login request that reaches the login screen and the three that are refused, the three languages and the Kurdish default, the direction of each screen, and the missing sign-up and "forgot password".
- [ ] Checked by hand, once, with both services: data survives `pnpm services:down` followed by `pnpm services:up`. After `pnpm services:reset` the data is gone and the realm is loaded again from the file.
- [ ] Checked by hand: starting the services while they are running is harmless, and starting them with Docker stopped gives a clear message.
- [ ] Checked by hand: with the services stopped, `pnpm services:check` says plainly that they are not running, names the start command and exits non-zero.
- [ ] Checked by hand: neither port 5432 nor port 8080 answers on the machine's network address, only on the loopback address.
- [ ] `pnpm check --skip-nx-cache` passes with Docker stopped.
- [ ] No password is in the repository: the example file lists the settings without values, Git ignores the local environment file, and the realm file holds no logins and no secrets.
- [ ] Nothing in the three apps or the five libraries has changed in this step.
- [ ] The Technology section of the MVP spec gains the four service commands, the addresses of PostgreSQL and Keycloak, and the reset rule: a change to the realm file, the theme's language list or the database set-up script takes effect only after `pnpm services:reset`. Its sentence about what is still to come is amended to name steps 3 and 4 only.
- [ ] A fault found here is fixed in this ticket, and the fix is recorded under Comments.
- [ ] The results of the from-scratch run and the by-hand checks are recorded under Comments.
- [ ] The work is committed.
