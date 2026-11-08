# 05: The stand-in API answers Builds, with made-up Builds

**Spec:** [the builder spec](../spec.md)

**What to build:** The stand-in API that `pnpm shopper:inspect` starts answers what the Build page and the picker will read: `GET v1/build` and the picker's conditions on the Category list, from the made-up shop. The made-up shop gains made-up Builds, with the worst cases `break-ui` needs. Ticket 06 renders the design's options with them, and tickets 07 to 09 inspect the pages with them, all without touching the development database. No test of the platform relies on the stand-in.

**Blocked by:** 01, 02, 03, 04

**Status:** ready-for-agent

- [ ] **What it answers.** `GET v1/build` and `GET v1/visible-parts` and its filters with the picker's parameters, `GET` alone, from the made-up shop, typed by `@pcp/api-client`'s own types. A change to the API's description that the stand-in does not follow fails `pnpm check`. Writes are still refused with 405 and every other path with 404.
- [ ] **It copies no rule of the library.** It judges every Build and every candidate with `@pcp/compatibility` itself, `judgeBuild`, `isCompatible` and `estimatedPowerDrawOf`. Its one reading of the catalog, when the command starts, also reads its Parts' needed specifications and leaves out each one the API answers as missing for the Part, so that it holds no copy of the catalog's rule for what is missing. It also reads each CPU's Integrated graphics and "Cooler included".
- [ ] **What no fixed data can carry.** It adds its fixed prices plainly into both views' totals. It states the second view's order and the Complete Build rule as it already states OFF-11's order, each with a comment naming the API's as the one that counts.
- [ ] **The made-up Builds**, written once beside the made-up shop, each of its real Parts:
  - an empty Build;
  - a Complete Build with no Problem, quoted partly in USD so that its total is converted;
  - the worst case: a Compatibility Problem, a Compatibility Warning and an unchecked rule together, 8 different RAM kits and 8 different drives, the catalog's two longest Part names, an Unstocked Part, and the Part 20 Vendors offer.
- [ ] Each made-up Build's answer is read once through the stand-in in each currency, and what it shows is recorded under Comments: its outcomes, its totals and its Vendors' order.
- [ ] A field of the stand-in's answer is misspelt once and then reverted, and `pnpm check` fails on it.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
