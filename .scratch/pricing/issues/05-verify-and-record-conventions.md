# 05: Verify from a fresh clone and record the conventions in the MVP spec

**Spec:** [the pricing spec](../spec.md)

**What to build:** The module is proven sound as a whole, the way the next person to pick it up will meet it: a fresh clone in a new directory, with no `.env` and no Docker volumes, followed by the install, the checks, the services and `pnpm platform:check`, with none of the three apps started by hand. Results left over from earlier runs can hide a fault, so this run is the one that counts.

The conventions this module set are written into [the MVP spec](../../mvp/spec.md), so that `browse`, `builder` and every later module start from them. This ticket closes `pricing`.

The services of the owner's own checkout are stopped before the fresh clone's services are started, because both would claim the same ports. They are started again afterwards.

**Blocked by:** 02, 03, 04

**Status:** ready-for-agent

- [ ] In a fresh clone in a new directory, with no `.env` and no Docker volumes left from earlier runs, these all pass, with none of the three apps started by hand:
  - one install;
  - `pnpm check --skip-nx-cache`, with Docker stopped and before any browser is installed;
  - `pnpm boundaries:check`;
  - `pnpm integration:check`;
  - `pnpm services:up`, and then `pnpm services:check`;
  - the browser's one-time install, and then `pnpm platform:check`.
- [ ] Git reports a clean working tree after every command above. No password and no secret is committed.
- [ ] Taste's inspector is run on `/platform-rate` from the fresh clone, at 1440, 768 and 360 pixels in both schemes, and its table matches ticket 02's.
- [ ] The owner is asked to check these once, in the owner's own browser. What they saw, or that it is still to be done, is recorded under Comments:
  - The Admin sets the Platform Rate to the day's Erbil market rate, and the plate shows it with today's date.
  - The Platform Rate screen matches DESIGN.md, and Impeccable's design hook raises nothing left unanswered.
  - Over the API, a Part with a USD-only Offer, asked in IQD, answers its price converted at that rate, rounded to 250, and marked as converted.
  - The Shopper's currency switch, in Kurdish and in English, keeps its choice after the browser is closed and opened again.
  - The Kurdish and the Arabic names for dinars and dollars read naturally.
- [ ] These checks on a phone are recorded under Comments as open, waiting for hosting, with their boxes left open, and are added to the MVP spec's list under "Checks on a phone wait for hosting":
  - [ ] The Platform Rate screen used with a thumb, a rate typed on the phone's number pad, Arabic-Indic digits among them.
  - [ ] The Shopper's currency switch used with a thumb, in Kurdish and in English, and its choice kept after the phone's browser is closed.
  - [ ] The plate's change felt on a real phone, with reduced motion on and off, with no movement felt as a snap.
- [ ] **Recorded in the MVP spec.** The Technology section gains `pricing`'s place in the order of work and a part of its own, **The pricing module's conventions**: the Platform Rate's table, its limits and that every setting is kept; the conversion rule, written once, and its SQL expression; the Shown Price and `shownPrice`; the order by price; the required `currency`; the currency switch's cookie and the one function that reads it. PRC-3 gains the one-step floor the owner decided on 2 November 2026. PRC-5 says `builder` builds totals. The Admin console's list of screens and the accessibility tests' list are brought up to date. OFF-11's note that the order waits for `pricing` is updated.
- [ ] Whether an ADR is needed for any of the module's decisions, such as computing Converted Prices in the database or keeping every rate ever set, is decided with the owner, and the answer is recorded under Comments.
- [ ] The spec's Status becomes `resolved`, and each ticket's too.
- [ ] The work is committed, leaving `pnpm check` passing.
