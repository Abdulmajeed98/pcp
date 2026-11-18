# 05: Verify from a fresh clone and record the conventions in the MVP spec

**Spec:** [the sheet spec](../spec.md)

**What to build:** The module is proven whole, the way the next person to pick it up will meet it: a fresh clone in a new directory, with no `.env` and no Docker volumes, then the install, the checks, the services and `pnpm platform:check`. The conventions this module set are written into [the MVP spec](../../mvp/spec.md). With `sheet`, every module of the capability map is built, so the hosting work starts from them.

**Blocked by:** 01, 02, 03, 04

**Status:** ready-for-agent

- [ ] **A fresh clone.** The clone is in a new directory, with no `.env` and no Docker volumes left from earlier runs. One install followed by `pnpm check --skip-nx-cache` passes, run with Docker stopped and before any browser is installed. A fresh-clone agent is told up front that Nx hides a task's report from agents.
- [ ] **The rest of the checks, in the same clone:**
  - `pnpm services:up` and `pnpm catalog:import`;
  - `pnpm integration:check`;
  - `pnpm boundaries:check`, since the API imports `@pcp/i18n` and the dashboard gains a slice;
  - `pnpm platform:check`, after `pnpm exec playwright install chromium`.

  Each passes, and the counts of tests and lines go under Comments.
- [ ] **The inspector, as the reference.** Taste's inspector runs from the fresh clone on the Offer sheet screen and its result:
  - in both schemes;
  - at 1440, 1280, 1024, 768 and 390 pixels;
  - in Kurdish and English;
  - with the made-up result and with `--offer-sheet-result worstCase|clean`.

  The table goes under Comments as the reference for this screen, with every WARN the tickets defended.
- [ ] **The MVP spec, Order of work.** A paragraph records `sheet` as the eleventh and last module:
  - its spec, its tickets and its code review's fixes;
  - SHT-1 to SHT-7, OFF-5's sheet clause, and success criteria 9 and 10;
  - the owner's decisions with their dates, the seams ("Those three (Recommended)") and the tickets ("Merge to five") among them, and the library ticket 01 chose;
  - whether any decision needed an ADR;
  - its checks by hand and on a phone;
  - the hosting work next.
- [ ] **The MVP spec, The sheet module's conventions.** A section of its own records:
  - the term Offer sheet and its words;
  - the API's import of `@pcp/i18n` and why;
  - the library and its port;
  - the layout written once, and the part number a row is given;
  - the endpoints with the client's functions;
  - the whole file's refusals and a row's reasons;
  - matching, with the fold, the tie-break and the same Part twice;
  - applying in one transaction;
  - the result;
  - the portal's screen and its query keys;
  - the made-up result;
  - the tests at the three seams.
- [ ] **The MVP spec, elsewhere:**
  - **The offers module's conventions** say that an upload's applied row is a Confirmation at the upload's moment, and that an upload writes through the Offer module's writing;
  - **Import rules** let the API import `@pcp/i18n`;
  - the Commands table gains `--offer-sheet-result`;
  - the testing strategy's counts follow the fresh clone.
- [ ] **Checks on a phone wait for hosting** gains `sheet`'s list, each check once, with the ticket that asks for it.
- [ ] **The design skills guide** gains the made-up result and `--offer-sheet-result`, and names this ticket's run as the reference for the new screen.
- [ ] **An ADR, or why none.** Judge again, with what the tickets found, whether any decision is costly to undo, and write one only if so.
- [ ] **A check by hand** in the owner's own browser is listed with its steps: an Offer sheet downloaded in Kurdish, changed in a spreadsheet program, uploaded, and a skipped row turned into a Part Request. It is done when the owner chooses.
- [ ] **Closing.** The spec and tickets 01 to 05 are marked `resolved`.

## Comments
