# 06: Verify from a fresh clone and record the conventions in the MVP spec

**Spec:** [the sharing spec](../spec.md)

**What to build:** The module is proven whole, the way the next person to pick it up will meet it: a fresh clone in a new directory, with no `.env` and no Docker volumes, then the install, the checks, the services and `pnpm platform:check`. The conventions this module set are written into [the MVP spec](../../mvp/spec.md), so that `part-requests`, `sheet` and the hosting work start from them.

**Blocked by:** 01, 02, 03, 04, 05

**Status:** ready-for-agent

- [ ] **A fresh clone.** In a fresh clone in a new directory, with no `.env` and no Docker volumes left from earlier runs, one install followed by `pnpm check --skip-nx-cache` passes. This is run with Docker stopped and before any browser is installed.
- [ ] **The rest of the checks, in the same clone:**
  - `pnpm boundaries:check` passes on every line, and Git then reports a clean working tree;
  - `pnpm services:up` followed by `pnpm services:check` passes on every line, the migrations' outcome read as a person reads it;
  - `pnpm integration:check` and `pnpm platform:check` pass, with the owner's own services stopped first, since both claim the same ports, and started again afterwards.
- [ ] **The inspectors' reference.** In the same clone, `pnpm shopper:inspect` on the Shared Build page with each made-up Shared Build, and `pnpm dashboard:inspect` on the Referrals screen and the portal's count, give the results tickets 03 to 05 kept. Their tables are recorded under Comments as the module's reference.
- [ ] **ADR-0008 is amended.** Its consequence that left the matter to `sharing` now says that a Shared Build's link keeps the rule: it opens in its sender's language, and opening it is remembered as any Shopper address is.
- [ ] **The conventions are recorded** in the MVP spec under **The sharing module's conventions**:
  - the term Shared Build;
  - its frozen `part` values, its identity by its text, and its addresses, with ADR-0014;
  - the five endpoints, what they answer and refuse, and the second view's WhatsApp field;
  - the Shopper's addresses and forms for sharing, copying and sending, and the WhatsApp message;
  - the Shared Build page and what it shares with the Build page;
  - the Referrals screen and the portal's count;
  - the stand-in's made-up Shared Builds and the inspector's made-up counts.

  The module's paragraph joins the others that say when each module was finished.
- [ ] **The phone checks.** The module's checks on a phone, from tickets 03 to 05, are added to **Checks on a phone wait for hosting**, each once, with where it is asked for.
- [ ] **The inflated-counts risk.** The rate limit on the public POST endpoints, which the spec leaves to hosting, is named in the module's conventions as the hosting work's. Earlier modules name the cookies' `Secure` mark and caching the same way.
- [ ] **CONTEXT.md is read** against the code, tests and texts this module added. Any word used that it does not define, or defines otherwise, is put right.
- [ ] **Checked by hand** in the owner's own browser, on the development services. The owner ticks this box.
  - A Build shared in Kurdish and in English, its link opened in a private window, copied and changed there.
  - The Shared Build seen unchanged after the copy is changed.
  - "send on WhatsApp" opening WhatsApp Web with the message written.
  - The count seen to rise on the Referrals screen and in that Vendor's portal.
- [ ] `pnpm check` passes, and the work is committed.
