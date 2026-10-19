# 09: Verify from a fresh clone and record the conventions in the MVP spec

**Spec:** [the offers spec](../spec.md)

**What to build:** The module is proven sound as a whole, the way the next person to pick it up will meet it: a fresh clone in a new directory, with no `.env` and no Docker volumes, followed by the install, the checks, the services and `pnpm platform:check`, with none of the three apps started by hand. Results left over from earlier runs can hide a fault, so this run is the one that counts.

The conventions this module set are written into [the MVP spec](../../mvp/spec.md), so that `pricing` and every later module start from them. This ticket closes `offers`.

The services of the owner's own checkout are stopped before the fresh clone's services are started, because both would claim the same ports. They are started again afterwards.

**Blocked by:** 03, 04, 05, 06, 07, 08

**Status:** ready-for-agent

- [ ] In a fresh clone in a new directory, with no `.env` and no Docker volumes left from earlier runs, these all pass, with none of the three apps started by hand:
  - one install;
  - `pnpm check --skip-nx-cache`, with Docker stopped and before any browser is installed;
  - `pnpm boundaries:check`;
  - `pnpm integration:check`;
  - `pnpm services:up`, and then `pnpm services:check`;
  - the browser's one-time install, and then `pnpm platform:check`.
- [ ] Git reports a clean working tree after every command above. No password and no secret is committed.
- [ ] The owner is asked to check these once, in the owner's own browser. What they saw, or that it is still to be done, is recorded under Comments:
  - A Vendor, made in the Admin console and logged in, adds a few real Parts' Offers from the catalog search, changes one, removes one and confirms all, in Kurdish and in English.
  - The Admin, acting as a Vendor, adds an Offer under the band.
  - The Offers screen, the search, the form, Expiring Offers and Missing specifications match DESIGN.md, and Impeccable's design hook raises nothing left unanswered.
  - The Kurdish and the Arabic counting sentences read naturally for 0, 1, 2, 3, 11 and 100 days.
  - A WhatsApp link in Expiring Offers opens WhatsApp's website with the Vendor's number.
- [ ] These checks on a phone are recorded under Comments as open, waiting for hosting, with their boxes left open, and are added to the MVP spec's list under "Checks on a phone wait for hosting":
  - [ ] The Offers screen, the catalog search and the Offer form used with a thumb, in Kurdish and in English.
  - [ ] A price typed on a Kurdish and on an Arabic keyboard is saved as its value.
  - [ ] The confirm-all button reached in the banner with a thumb.
  - [ ] Expiring Offers' WhatsApp link opens the WhatsApp app on the Admin's phone.
- [ ] **Recorded in the MVP spec.** The Technology section gains `offers`' place in the order of work and a part of its own, **The offers module's conventions**: the API as the source of time and how a test moves it; the rule for a visible Offer, written once; how prices are stored and answered; the 14-day and 3-day constants and the days since Confirmation; the Offer history and what it records; the endpoints; the portal's screens and their addresses; and the two Admin lists. The Admin console's list of screens and the accessibility tests' list are brought up to date. CAT-8 says its list exists.
- [ ] Whether an ADR is needed for storing USD in cents, or for keeping the history apart from the Offer, is decided with the owner, and the answer is recorded under Comments.
- [ ] The spec's Status becomes `resolved`, and each ticket's too.
- [ ] The work is committed, leaving `pnpm check` passing.
