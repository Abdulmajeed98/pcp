# 14: Verify from a fresh clone and record the conventions in the MVP spec

**Spec:** [the browse spec](../spec.md)

**What to build:** The module is proven sound as a whole, the way the next person to pick it up will meet it. That means a fresh clone in a new directory, with no `.env` and no Docker volumes, followed by the install, the checks, the services and `pnpm platform:check`, with none of the three apps started by hand. Results left over from earlier runs can hide a fault, so this run is the one that counts.

The conventions this module set are written into [the MVP spec](../../mvp/spec.md), so that `compatibility`, `builder` and every later module start from them. This ticket closes `browse`.

The services of the owner's own checkout are stopped before the fresh clone's services are started, because both would claim the same ports. They are started again afterwards.

**Blocked by:** 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13

**Status:** ready-for-agent

- [ ] In a fresh clone in a new directory, with no `.env` and no Docker volumes left from earlier runs, these all pass, with none of the three apps started by hand:
  - one install;
  - `pnpm check --skip-nx-cache`, with Docker stopped and before any browser is installed, the Shopper's unit tests among it;
  - `pnpm boundaries:check`;
  - `pnpm integration:check`;
  - `pnpm services:up`, and then `pnpm services:check`;
  - the browser's one-time install, and then `pnpm platform:check`.
- [ ] Git reports a clean working tree after every command above. No password and no secret is committed.
- [ ] `pnpm shopper:inspect` is run from the fresh clone on the home page, a Category page, a Part page and a Vendor page, at 1440, 768 and 360 pixels in both schemes. Its tables match tickets 09 to 13's.
- [ ] The owner is asked to check these once, in the owner's own browser. What they saw, or that it is still to be done, is recorded under Comments:
  - From the home page to a Category, a filter, a Part and its Vendor, in Kurdish and in English, the pages match DESIGN.md, and Impeccable's design hook raises nothing left unanswered.
  - A Vendor made in the Admin console adds an Offer quoted only in USD. The Shopper sees the Part with that USD price, and in IQD sees a price marked "≈", converted at the Platform Rate and rounded to 250 (success criterion 3).
  - Deactivating that Vendor removes its page and the Part at once, and reactivating it brings both back.
  - The Kurdish and the Arabic texts this module added read naturally (LANG-7's review stays open until launch).
- [ ] These checks are recorded under Comments as open, waiting for hosting, with their boxes left open. Each is added to the MVP spec's list under "Checks on a phone wait for hosting":
  - [ ] The four pages used with a thumb in Kurdish and in English: the filters, the price fields with the phone's number pad, Arabic-Indic digits among them, and the search with the phone's search key.
  - [ ] The phone, WhatsApp, Instagram and Google Maps links opening the dialler, the WhatsApp app, Instagram and Google Maps.
  - [ ] A Part page's link pasted into the WhatsApp app showing its preview with the Part's photo, in each language (success criterion 12). It needs a public address that WhatsApp can reach.
  - [ ] The motion felt on a real phone, in both schemes, with reduced motion on and off, with no movement felt as a snap.
- [ ] **Recorded in the MVP spec.** The Technology section gains `browse`'s place in the order of work and a part of its own, **The browse module's conventions**. It covers:
  - Visible Offer, Visible Part and Lowest Price;
  - the public endpoints, with their orders, filters, refusals and the rule for a Visible Part, written once;
  - the filters' statement in the domain;
  - the Shopper's addresses and their query;
  - the photo's pass-through;
  - the Shopper app's public address;
  - the Shown Price component;
  - previews;
  - the stand-in API and `pnpm shopper:inspect`;
  - the Shopper's unit seam, its runner and what it tests.

  Elsewhere in the MVP spec:
  - The commands table gains `pnpm shopper:inspect`.
  - The settings table gains the public address.
  - The testing strategy's last paragraph names the Shopper app's unit-test runner.
  - The accessibility tests' list gains the Shopper's pages.
  - The note that the Shopper's design waits for `browse` is updated.
- [ ] Whether an ADR is needed for any of the module's decisions beyond ticket 08's is decided with the owner, and the answer is recorded under Comments. One candidate is a stand-in API for inspection in place of seeded data.
- [ ] The spec's Status becomes `resolved`, and each ticket's too.
- [ ] The work is committed, leaving `pnpm check` passing.
