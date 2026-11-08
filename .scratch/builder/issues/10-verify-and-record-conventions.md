# 10: Verify from a fresh clone and record the conventions in the MVP spec

**Spec:** [the builder spec](../spec.md)

**What to build:** The module is proven whole, the way the next person to pick it up will meet it: a fresh clone in a new directory, with no `.env` and no Docker volumes, then the install, the checks, the services and `pnpm platform:check`. The conventions this module set are written into [the MVP spec](../../mvp/spec.md), so that `sharing` and every later module start from them. This ticket closes the module.

**Blocked by:** 01, 02, 03, 04, 05, 06, 07, 08, 09

**Status:** ready-for-agent

- [ ] In a fresh clone in a new directory, with no `.env` and no Docker volumes left from earlier runs, one install followed by `pnpm check --skip-nx-cache` passes, with Docker stopped and before any browser is installed.
- [ ] In the same clone, `pnpm boundaries:check` passes on every line, and Git then reports a clean working tree.
- [ ] In the same clone, `pnpm services:up` followed by `pnpm services:check` passes on every line. The catalog's import report and the migrations' outcome are read as a person reads them.
- [ ] In the same clone, `pnpm integration:check` and `pnpm platform:check` pass. The owner's own services are stopped first, since both claim the same ports, and started again afterwards.
- [ ] In the same clone, `pnpm shopper:inspect` on the Build page with each made-up Build and on the picker gives the results tickets 07 to 09 kept. Its table is recorded under Comments as the module's reference.
- [ ] The speed of the picker's list, measured in ticket 04, is measured again on the fresh clone's database and recorded beside it.
- [ ] **The conventions are recorded** in the MVP spec under **The builder module's conventions**:
  - the Build's cookie, its reading and its limits;
  - the Build page's and the picker's addresses and the forms that change a Build;
  - `GET v1/build`, what it answers and refuses, and its one moment;
  - the picker's conditions on the Category list and paging after judging;
  - the function that hands a stored Part to the rules;
  - the Complete Build rule and its reading of a CPU's graphics and cooler;
  - the words for every outcome and the type check that guards them;
  - the stand-in's made-up Builds and `pnpm shopper:inspect`'s option;
  - the term Unstocked Part.
- [ ] The module's checks on a phone, from tickets 07 to 09, are added to **Checks on a phone wait for hosting**, each once, with where it is asked for.
- [ ] The placeholder that proves `@pcp/compatibility` resolves in the Shopper app has its comment corrected: the Shopper app has no use for the library, since the API judges every Build. The entry stays.
- [ ] CONTEXT.md is read against the code, tests and texts this module added, and any word used that it does not define, or defines otherwise, is put right.
- [ ] Checked by hand in the owner's own browser, on the development services: a Complete Build picked through the pickers in Kurdish and in English, an incompatible CPU picked with the switch and its Problem read, both price views read in IQD and in USD, and the Build still there after the browser is closed and opened again. The owner ticks this box.
- [ ] `pnpm check` passes, and the work is committed.
