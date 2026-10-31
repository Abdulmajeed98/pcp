# 16: Verify from a fresh clone and record the redesign

**Spec:** [the redesign spec](../spec.md)

**What to build:** The redesign is proven sound as a whole, the way the next person to pick it up will meet it: a fresh clone in a new directory, with no `.env` and no Docker volumes, followed by the install, the checks, the services, `pnpm platform:check` and the inspector on every screen. What it settled is written into the MVP spec, so that `pricing` and every later module build to the new look. This ticket closes `redesign`.

The services of the owner's own checkout are stopped before the fresh clone's are started, because both would claim the same ports, and started again afterwards.

**Blocked by:** 08, 09, 10, 11, 12, 13 (tickets 14 and 15, the Shopper app, were moved out of this spec by the owner on 1 November 2026)

**Status:** ready-for-agent

- [ ] In a fresh clone in a new directory, with no `.env` and no Docker volumes left from earlier runs, these all pass, with none of the three apps started by hand: one install; `pnpm check --skip-nx-cache`, with Docker stopped and before any browser is installed; `pnpm boundaries:check`; `pnpm integration:check`; `pnpm services:up` and `pnpm services:check`; the browser's one-time install and `pnpm platform:check`.
- [ ] In that clone, with the dashboard's chosen direction restored as ticket 05 recorded, ticket 01's command passes `inspect.mjs --app` on every dashboard screen at 1440, 768 and 360 pixels, the portal's in Kurdish and in English. The results are recorded under Comments as a table.
- [ ] The Shopper app's current shell, not redesigned, passes `pnpm check` and `pnpm platform:check` as it is.
- [ ] Git reports a clean working tree after every command above. No password and no secret is committed.
- [ ] The owner is asked to check, once, in the owner's own browser, that the Admin console and the Vendor portal match the new DESIGN.md and move as its Motion section says, in Kurdish and in English. What they saw, or that it is still to be done, is recorded under Comments.
- [ ] Checks on a phone are recorded under Comments as open, waiting for hosting, and added to the MVP spec's list under "Checks on a phone wait for hosting": the Offers screen, the catalog search and the Offer form used with a thumb, and the motion felt on a real phone.
- [ ] **Recorded in the MVP spec:** the redesign's place in the Order of work, with links to this spec and its ADRs; the inspector's command and when a ticket runs it; and that each screen ticket from now on passes the inspector at three widths. `docs/agents/design-skills.md` gains the inspector's command and where the chosen directions are kept.
- [ ] The MVP spec's Order of work records that the Shopper app's design is planned fresh, unique to it, as the first work of the `browse` module, following the principles this redesign used, and that this redesign was the dashboard's alone.
- [ ] The spec's Status becomes `resolved`, and each ticket's too, but for 14 and 15, which stay `wontfix`.
- [ ] The work is committed, leaving `pnpm check` passing.
