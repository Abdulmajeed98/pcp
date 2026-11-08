# 04: The picker's conditions on the Category list

**Spec:** [the builder spec](../spec.md)

**What to build:** The Category list's endpoint, which `browse` wrote for the picker to reuse, gains the picker's two conditions:

- **In stock only.** The list keeps the Visible Parts that some Vendor has in stock, and the filters' values come from those Parts alone (BLD-2).
- **Compatible with a Build.** Given a Build, every Part in the list says whether it is Compatible with it, and the Parts that are not are left out unless the switch asks to keep them (BLD-3).

The page and the total count only the Parts kept. A Category page that sends neither condition is answered exactly as before. A Shopper page will use them in ticket 09. For now the integration tests prove them.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] **In stock only.** A parameter on `GET v1/visible-parts` keeps only the Visible Parts with at least one in-stock Visible Offer. The order stays BRW-1's. `GET v1/visible-parts/filters` takes the same parameter, so that the picker's choices are the values its in-stock Parts hold, still before any choice is made, so that they never shift.
- [ ] **The Build.** `part` is taken as `GET v1/build` takes it, through the same request and its same refusals, each naming `part`.
- [ ] **Compatible.** With a Build, each Part in the list answers whether it is Compatible with it, through the library's `isCompatible`. That puts a Part of a single Category in place of the Build's Part, and adds a kit or a drive beside the others. The Build's Parts and each candidate reach the library through ticket 02's function, never a second copy. A Compatibility Warning or an unchecked rule leaves a Part Compatible (CMP-4). Without a Build, no Part answers whether it is Compatible.
- [ ] **The switch.** Parts that are not Compatible are left out, unless the switch's parameter asks to keep them. Kept, they are in their place in the order, each answering that it is not Compatible.
- [ ] **Paging comes after judging.** The Store reads every Part that matches the search, the filters, the price range and the stock condition, in order, with its needed specifications. The domain judges each Part, and then the list is paged through the same paging, so that the page and the total count only the Parts kept. A page past the end still answers its total.
- [ ] **The speed** is measured against the development database, as `browse` measured its list, on its largest Categories with a full Build and with the switch on and off. The development database holds thousands of made-up Parts from earlier runs. The measurements are recorded under Comments. If the list proves slow, the measurements go to the owner before anything is cached or indexed.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] `pnpm integration:check` gains these tests, written before the code, and passes:
  - In stock only leaves out a Part whose Offers are all out of stock, and a Part whose only in-stock Offer is expired or belongs to a deactivated Vendor. The filters' values with the same condition come only from Parts in stock.
  - With a Build, a Part that would cause a Compatibility Problem is left out. With the switch it is kept, answering not Compatible. A Part that causes only a Warning, and one that a rule cannot check, is kept and answers Compatible.
  - A CPU is judged in place of the Build's CPU, not beside it, so another CPU of the motherboard's socket is kept. A RAM kit that would take the Build past the motherboard's slots is left out.
  - The total and the pages count only the Parts kept, and a page past the end answers the total.
  - The Build's refusals name `part`.
  - Without the new parameters, every test `browse` wrote for the list and its filters still passes unchanged.
- [ ] Each of these faults is planted once and then reverted, and each fails its own test:
  - the Parts judged after paging, so a page holds fewer than its size;
  - a Compatibility Warning counted as not Compatible;
  - a candidate added beside the Build's CPU instead of through `isCompatible`;
  - in stock only that ignores expiry.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.
