# 04: The picker's conditions on the Category list

**Spec:** [the builder spec](../spec.md)

**What to build:** The Category list's endpoint, which `browse` wrote for the picker to reuse, gains the picker's two conditions:

- **In stock only.** The list keeps the Visible Parts that some Vendor has in stock, and the filters' values come from those Parts alone (BLD-2).
- **Compatible with a Build.** Given a Build, every Part in the list says whether it is Compatible with it, and the Parts that are not are left out unless the switch asks to keep them (BLD-3).

The page and the total count only the Parts kept. A Category page that sends neither condition is answered exactly as before. A Shopper page will use them in ticket 09. For now the integration tests prove them.

**Blocked by:** 02

**Status:** resolved

- [x] **In stock only.** A parameter on `GET v1/visible-parts` keeps only the Visible Parts with at least one in-stock Visible Offer. The order stays BRW-1's. `GET v1/visible-parts/filters` takes the same parameter, so that the picker's choices are the values its in-stock Parts hold, still before any choice is made, so that they never shift.
- [x] **The Build.** `part` is taken as `GET v1/build` takes it, through the same request and its same refusals, each naming `part`.
- [x] **Compatible.** With a Build, each Part in the list answers whether it is Compatible with it, through the library's `isCompatible`. That puts a Part of a single Category in place of the Build's Part, and adds a kit or a drive beside the others. The Build's Parts and each candidate reach the library through ticket 02's function, never a second copy. A Compatibility Warning or an unchecked rule leaves a Part Compatible (CMP-4). Without a Build, no Part answers whether it is Compatible.
- [x] **The switch.** Parts that are not Compatible are left out, unless the switch's parameter asks to keep them. Kept, they are in their place in the order, each answering that it is not Compatible.
- [x] **Paging comes after judging.** The Store reads every Part that matches the search, the filters, the price range and the stock condition, in order, with its needed specifications. The domain judges each Part, and then the list is paged through the same paging, so that the page and the total count only the Parts kept. A page past the end still answers its total.
- [x] **The speed** is measured against the development database, as `browse` measured its list, on its largest Categories with a full Build and with the switch on and off. The development database holds thousands of made-up Parts from earlier runs. The measurements are recorded under Comments. If the list proves slow, the measurements go to the owner before anything is cached or indexed.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] `pnpm integration:check` gains these tests, written before the code, and passes:
  - In stock only leaves out a Part whose Offers are all out of stock, and a Part whose only in-stock Offer is expired or belongs to a deactivated Vendor. The filters' values with the same condition come only from Parts in stock.
  - With a Build, a Part that would cause a Compatibility Problem is left out. With the switch it is kept, answering not Compatible. A Part that causes only a Warning, and one that a rule cannot check, is kept and answers Compatible.
  - A CPU is judged in place of the Build's CPU, not beside it, so another CPU of the motherboard's socket is kept. A RAM kit that would take the Build past the motherboard's slots is left out.
  - The total and the pages count only the Parts kept, and a page past the end answers the total.
  - The Build's refusals name `part`.
  - Without the new parameters, every test `browse` wrote for the list and its filters still passes unchanged.
- [x] Each of these faults is planted once and then reverted, and each fails its own test:
  - the Parts judged after paging, so a page holds fewer than its size;
  - a Compatibility Warning counted as not Compatible;
  - a candidate added beside the Build's CPU instead of through `isCompatible`;
  - in stock only that ignores expiry.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

## Comments

### 8 November 2026: the picker's conditions, their speed and the fault checks

**In stock only.** `GET v1/visible-parts` and `GET v1/visible-parts/filters` take `inStockOnly`, declared by `SwitchAsked` in `apps/api/src/app/infrastructure/offer/endpoints/switch-asked.ts`: `true` turns it on, `false` or none leaves it off, and any other text, or the parameter given twice, is refused 400 naming it. The description types it `boolean`, so the client sends `inStockOnly?: boolean`. On, the list's statement and the filters' statement keep a Part only when `offered.inStock` holds, what `whatTheirOffersSay` already reads of its Visible Offers, so an Expired Offer and a deactivated Vendor's Offer in stock count for nothing, and the order is BRW-1's. The filters' values, manufacturers and price range are then read from the Parts in stock alone, still before any choice.

**The Build.** `ListVisiblePartsRequest` declares `part` with ticket 01's `BuildAsked`, and `ListVisiblePartsQuery` reads it with the `BuildReading` that `BuildModule` exports (`OfferModule` now imports `BuildModule`), so it is refused as `GET v1/build` refuses it, each reason naming `part`. Since ticket 03 the reading takes the chosen currency, and the list passes its own. A Build is given when `part` is given at least once: a query cannot tell an empty Build from none, and an empty Build would make every Part Compatible. Without `part` no Part answers `compatible`, the field is left out of the JSON (`compatible?: boolean` in the client), and the switch, accepted, changes nothing. `BuildAsked`'s description no longer says what a missing `part` means; each endpoint says it in its own words. `asAList` is now written once, `infrastructure/offer/endpoints/as-a-list.ts`, as the follow-up of ticket 01 asked.

**Compatible, the switch and paging.** `compatibleWith(build)`, in `apps/api/src/app/domain/build/compatible.ts`, hands the Build to the rules once through ticket 02's `buildForTheRules` and each Part through `partForTheRules`, and asks the library's `isCompatible` with the Part's Category key from its Specification list, so no rule and no placing of a Part is written in the API. With a Build, the Query asks the Store's new `listEveryVisiblePart`, which reads every Part the search, the filters, the price range and in stock only keep, in BRW-1's order, in one statement at one Platform Rate, each Part's row with its whole specifications document, from which `partForTheRules` takes the needed specifications. The domain judges each (`VisiblePart.judged`), keeps the Compatible ones, or all of them when `keepNotCompatible` is on, in their place, and only then pages them through `core`'s `PageableAttributes` and `PageAttributes`, so a page past the end answers the total. Without a Build the list is paged in its statement, as before. The statement is written once, `theListOf`, for both reads, and `listVisibleParts` now takes its page apart from its params.

**The Shopper app.** `value-words.tsx`'s type check that every filter is named reads the filters as the list's parameters less its own, so the three new ones are added to its list of parameters that are not filters. Nothing else in the Shopper app or the stand-in changes: ticket 05 answers the picker's conditions in the stand-in, and ticket 09 sends them.

**The tests**, 10 in a file of their own, `apps/api/src/test/infrastructure/offer/endpoints/visible-parts.controller.picker.integration-spec.ts`, so that `browse`'s two files for the list and its filters stay exactly as they were and still pass. Each was written before its code, one slice at a time, and the reason each failed was read:

| Test | First run |
|---|---|
| In stock only leaves out a Part all out of stock, one in stock only in an Expired Offer and one in stock only at a deactivated Vendor | Red: 400, `inStockOnly` not declared (the same Parts listed without it passed) |
| The filters' values in stock only, and every Visible Part's without it | Red: 400, `inStockOnly` not declared on the filters |
| The Build refused for each of the seven reasons, naming `part`, with in stock only and without | Red: refused by the whitelist, naming `part` with no `reason` |
| A Problem left out; a Warning and an unchecked rule kept, each Compatible | Red: all four GPUs listed, none answering |
| The switch keeps the GPU with a Problem in its place, answering not Compatible | Red: 400, `keepNotCompatible` not declared |
| Nothing answered without a Build, with the switch and without | Red: 400 with the switch, for the same reason |
| A CPU judged in place of the Build's CPU of another socket than its board | Passed: the slice before already judged through `isCompatible`; fault 3 proves the test |
| A RAM kit judged beside the Build's kit, one of four modules left out on a board of four slots, and one more of the Build's own kit counted | Passed, as above |
| The total and the pages count only the Parts kept, in stock only, and pages 2 and 5 answer the total | Passed: judging needs every Part, so the slice before already paged after it; fault 1 proves the test |
| With the switch, the pages count every Part in stock | Passed, as above |

**The fault checks**, each planted by one exact edit on `50213e8` by a script that refused a dirty tree, ran the test file and reverted by the inverse edit; `git status` was clean after each:

| Fault | Edit | Failed |
|---|---|---|
| The Parts judged after paging | In `ListVisiblePartsQuery`, `onePageOf(every.right, …)` first, then its Parts judged and filtered, with the page's attributes | 1 of 10, the pages: the first page held CPU 1 alone, the total 7 and the pages 4, not 4 and 2 |
| A Compatibility Warning counted as not Compatible | In the library's `isCompatible`, `outcome.outcome === 'problem'` to `(outcome.outcome === 'problem' \|\| outcome.outcome === 'warning')` | 2 of 10: the GPU with a Warning left out, and answering false with the switch |
| A candidate added beside the Build's CPU instead of through `isCompatible` | `compatibleWith` judging `judgeBuild({ [key]: candidate, ...build })`, the Build's own Part of the Category kept beside the candidate, and finding the Part not Compatible when a Problem names it | 2 of 10: the other AM4 CPU kept as Compatible, and the kit of four kept on the board of four slots |
| In stock only that ignores expiry | `inStockOnly`'s condition to `exists` an in-stock Offer of an active Vendor, with no Confirmation's date | 2 of 10: the CPU in stock only in an Expired Offer listed, and its AM4 socket, 8 cores and manufacturer among the filters' values |

**The speed**, measured on 8 November 2026 against the development database, as `browse` measured its list: the API built from this branch, served by `nx serve` on port 3103, asked over HTTP with `curl`, three times each after one answer to warm it, on the two largest Categories, CPUs (3,227 Visible Parts, 3,027 in stock, nearly all made-up Parts of the end-to-end runs) and GPUs (103 and 10). The full Build was one Visible Part in stock of each of the eight Categories, made-up Parts that hold up to 26 specifications, with a kit of quantity 2 and a drive. Measured on the merge with ticket 03, `bfd5b15`, within a few milliseconds of the same run before it:

| Asked | CPUs | GPUs |
|---|---|---|
| As a Category page, no condition | 23 to 30 ms | 8 ms |
| In stock only | 23 ms | 8 to 10 ms |
| In stock only, the full Build, switch off (2,622 CPUs kept, no GPU) | 149 to 154 ms | 10 to 12 ms |
| In stock only, the full Build, switch on | 142 to 155 ms | 10 to 12 ms |
| The same, switch off, page 3 of 20 | 140 to 157 ms | 11 ms |
| The same, switch on, with a search | 162 to 172 ms | 34 ms |
| Every Visible Part, the full Build, switch off and on, and in dollars on the last page | 144 to 165 ms | 13 to 18 ms |
| The filters, in stock only | 17 to 18 ms | 7 to 8 ms |

The list with a Build grows with the Parts it judges, about 40 µs a Part with its row and specifications read, its rules judged and its answer kept; every answer is well within a second, as `browse` held its own to, so nothing was cached or indexed and no migration was written.

**The pieces.** Each commit was gated on `pnpm check` and `pnpm integration:check`; the merge and this record on `pnpm check --skip-nx-cache` after deleting every `*.tsbuildinfo`:

- `3d642cb` feat: list the Visible Parts in stock only for the picker (592 tests)
- `50213e8` feat: judge each Part against a Build in the picker's list (600 tests)
- `bfd5b15` the merge of `builder/integration` at `2ef634c`, ticket 03 (618 tests): the store's conflict kept this ticket's statement and took ticket 03's `whatTheirOffersSay` from its new file, the list passes its currency to `BuildReading.read`, and the description and the client were written again with `pnpm api-client:write`.

**With Docker stopped.** Each of the three commits passed `pnpm check --skip-nx-cache` in a fresh clone in the scratchpad, after `pnpm install --frozen-lockfile --offline`, with `DOCKER_HOST` pointed at a socket that does not exist and `PLAYWRIGHT_BROWSERS_PATH` at an empty folder: 32 tasks succeeded each time. The owner's services stayed up, so Docker itself was not stopped.

### 13 November 2026: the speed again, on the fresh clone's database

Ticket 10 measured the picker's list again as this ticket measured it, on the module's fresh clone at `builder/integration` `fe9a9f9` (tickets 01 to 09 and the code review's fixes), after its `pnpm platform:check` and its catalog's import: the clone's API, served by `nx serve` on port 3001 under the e2e lock, asked over HTTP with `curl`, three times each after one answer to warm it, on the CPUs and the GPUs, 20 Parts to a page. Its database is not the development database: it holds the 25,974 imported Parts and what one end-to-end run made, so its CPUs are 905, of which 89 are Visible Parts and 84 in stock, all made-up Parts of that run, and its GPUs 3,857, of which 4 are Visible and 2 in stock. The full Build was one Visible Part in stock of each of the eight Categories, the one holding the most specifications (up to 26), with the kit's quantity 2 and a drive.

| Asked | CPUs | GPUs |
|---|---|---|
| As a Category page, no condition (89 CPUs, 4 GPUs) | 6 to 9 ms | 3 ms |
| In stock only (84, 2) | 5 ms | 2 to 3 ms |
| In stock only, the full Build, switch off (69 CPUs kept, 15 not Compatible; no GPU kept) | 9 to 11 ms | 3 ms |
| In stock only, the full Build, switch on | 10 to 11 ms | 3 to 4 ms |
| The same, switch off, page 3 | 9 to 11 ms | 3 ms |
| The same, switch on, with a search | 8 to 9 ms | 3 to 4 ms |
| Every Visible Part, the full Build, switch off and on, and in dollars on the last page | 8 to 10 ms | 3 ms |
| The filters, in stock only | 4 ms | 2 ms |

Every answer was 200, and `compatibleCount` and `notCompatibleCount` came with each list asked with the Build. On a few dozen Parts the list with a Build costs a few milliseconds more than without one; the figures above, on the development database's thousands, remain the measure of how it grows, about 40 µs a Part. Nothing is cached or indexed.
