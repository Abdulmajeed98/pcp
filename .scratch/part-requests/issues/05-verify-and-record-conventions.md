# 05: Verify from a fresh clone and record the conventions in the MVP spec

**Spec:** [the part-requests spec](../spec.md)

**What to build:** The module is proven whole, the way the next person to pick it up will meet it. That means a fresh clone in a new directory, with no `.env` and no Docker volumes, then the install, the checks, the services and `pnpm platform:check`. The conventions this module set are written into [the MVP spec](../../mvp/spec.md), so that `sheet` and the hosting work start from them.

**Blocked by:** 01, 02, 03, 04

**Status:** ready-for-agent

- [ ] **A fresh clone.** In a fresh clone in a new directory, with no `.env` and no Docker volumes left from earlier runs, one install followed by `pnpm check --skip-nx-cache` passes. This is run with Docker stopped and before any browser is installed.
- [ ] **The rest of the checks, in the same clone:**
  - `pnpm services:up` and `pnpm catalog:import`;
  - `pnpm integration:check`;
  - `pnpm boundaries:check`, since the dashboard gains slices;
  - `pnpm platform:check`, after `pnpm exec playwright install chromium`.

  Each passes, and the counts of tests and lines go under Comments.
- [ ] **The inspector, as the reference.** Taste's inspector runs from the fresh clone on every new screen, in both schemes, at 1440, 1280, 1024, 768 and 390 pixels:
  - the Vendor's Part Requests and the form, in Kurdish and English;
  - the queue and one request.

  It runs with the made-up Part Requests and with `--part-requests worstCase|one|none`. The table goes under Comments as the reference for these screens, with every WARN the tickets defended.
- [ ] **The MVP spec, Order of work.** A paragraph records `part-requests` as the tenth module:
  - its spec, tickets and code review's fixes;
  - REQ-1 to REQ-4, and success criterion 10 for a Part Request sent from the portal;
  - the owner's decisions with their dates;
  - that no decision has an ADR, or the ADR a ticket found was needed;
  - its checks by hand and on a phone;
  - `sheet` next.
- [ ] **The MVP spec, The part-requests module's conventions.** A section of its own records:
  - the three states and their terms;
  - the table and its checks;
  - the endpoints with the client's functions;
  - the refusals and their order;
  - fulfilling's one transaction, with `created`, `replaced` and `kept`;
  - the Confirmation at the moment sent, and `offerWouldBeExpired`;
  - the shared day rule;
  - the portal's and the console's addresses, screens and query keys;
  - the made-up Part Requests;
  - the tests at the three seams.
- [ ] **The MVP spec, elsewhere:**
  - **The offers module's conventions** say that an Offer made by a fulfilment is confirmed at its request's sending, so its Confirmation can come before the moment it was made, and that `OfferStore.readByPart` now has its caller;
  - the Commands table gains `--part-requests`;
  - the Admin console's list of screens gains the Part Requests;
  - the testing strategy's counts follow the fresh clone.
- [ ] **Checks on a phone wait for hosting** gains `part-requests`' list, each check once, with the ticket that asks for it.
- [ ] **The design skills guide** gains the made-up Part Requests and `--part-requests`, and names this ticket's run as the reference for the new screens.
- [ ] **A check by hand** in the owner's own browser is listed with its steps: a request sent from the empty search in Kurdish, created as a Part by the Admin, and its Offer seen on the Shopper's Part page. It is done when the owner chooses.
- [ ] **Closing.** The spec and tickets 01 to 05 are marked `resolved`.

## Comments
