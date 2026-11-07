# 08: Verify from a fresh clone and record the conventions in the MVP spec

**Spec:** [the compatibility spec](../spec.md)

**What to build:** The module is proven sound as a whole, the way the next person to pick it up will meet it: a fresh clone in a new directory, with no `.env` and no Docker volumes, followed by the install, the checks, the services, the catalog's import from GitHub and `pnpm platform:check`, with none of the three apps started by hand. Results left over from earlier runs can hide a fault, so this run is the one that counts.

The conventions this module set are written into [the MVP spec](../../mvp/spec.md), so that `builder` and every later module start from them. This ticket closes `compatibility`.

The services of the owner's own checkout are stopped before the fresh clone's services are started, because both would claim the same ports. They are started again afterwards.

**Blocked by:** 05, 06, 07

**Status:** ready-for-agent

- [ ] In a fresh clone in a new directory, with no `.env` and no Docker volumes left from earlier runs, these all pass, with none of the three apps started by hand:
  - one install;
  - `pnpm check --skip-nx-cache`, with Docker stopped and before any browser is installed, the library's tests among it;
  - `pnpm boundaries:check`;
  - `pnpm integration:check`;
  - `pnpm services:up`, and then `pnpm services:check`;
  - `pnpm catalog:import`, from GitHub, whose report gives the 695 GPUs' four power sockets as left out with their reason;
  - the browser's one-time install, and then `pnpm platform:check`, under the e2e lock.
- [ ] Git reports a clean working tree after every command above. No password and no secret is committed.
- [ ] No check by hand and no check on a phone is added, since no screen changes. Whether the owner wants to look at anything, such as Missing specifications showing a cooler's "Liquid cooled", is asked, and the answer is recorded under Comments.
- [ ] **Recorded in the MVP spec.** The Technology section gains `compatibility`'s place in the order of work and a part of its own, **The compatibility module's conventions**: the library's public face; the Build it reads, and the contract that whoever hands it a Part leaves out what the catalog counts as missing; when a rule is unchecked; each rule's reading of OpenDB's values; the needed specifications and the fixed sets read from the library; the import's reading of GPU power sockets; and the library's test seam. CMP-3 and the testing strategy say that rules 11, 15 and 20 can produce a Compatibility Warning. The description of the `compatibility` library, the catalog's conventions on specification lists and on the import, `browse`'s note that `compatibility` can start now, and the commands and directory layout, where the library's `test` target adds to them, are brought up to date, and so is any figure of the import the MVP spec cites.
- [ ] Whether an ADR is needed for any of the module's decisions, which the spec proposes none of, is decided with the owner, and the answer is recorded under Comments.
- [ ] The spec's Status becomes `resolved`, and each ticket's too.
- [ ] The work is committed, leaving `pnpm check` passing.
