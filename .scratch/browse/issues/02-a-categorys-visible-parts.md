# 02: A Category's Visible Parts through the API

**Spec:** [the browse spec](../spec.md)

**What to build:** Anyone, with no Login, can ask the API for one page of a Category's Visible Parts in the chosen currency. Each Part comes with its Lowest Price, the lowest Shown Price among its in-stock Visible Offers, marked when that price was converted. It also comes with how many Vendors offer it and whether any of them has it in stock. The Parts are in BRW-1's order: by Lowest Price, lowest first, with Parts that every Vendor has out of stock last. The list can be searched by name, manufacturer and part number, with the catalog's own word rule. The rule for which Parts are visible is written here once, for every later endpoint. No Shopper page reads the list yet; the integration tests prove it.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] **The words.** Visible Offer, Visible Part and Lowest Price are added to CONTEXT.md before any code uses them, as the spec defines them, each with the words to avoid. A Visible Offer goes under Vendors and offers, a Visible Part under Catalog, and the Lowest Price under Prices.
- [ ] **The rule for a Visible Part.** A Part with at least one Visible Offer. It is written once as SQL at the Store's module level and reads `visibleOffer(now)`, so that ticket 04 and `builder` reuse it. It is not written a second time.
- [ ] **The endpoint.** `GET v1/visible-parts` with `category`, `currency`, `search`, `page` and `size`. It is marked `@Public()` and described with `security: []`, and it answers the same with a good token, a bad one or none. `category` and `currency` are required. A missing or unknown value is refused with 400, `NOT_VALID`, naming the field.
- [ ] **The answer.** The catalog's page shape, through `PagingRequest`. Each Part has its identifier, Category, name, manufacturer, part numbers and photo's path. It also has `lowestPrice`, shaped as `shownPrice` is (`{ currency, amount, converted }`) or null, the number of Vendors with a Visible Offer for it, and whether any Visible Offer is in stock.
- [ ] **The Lowest Price.** It is the lowest Shown Price among the Part's in-stock Visible Offers, compared as answered, after rounding. It uses `pricing`'s SQL expression for a Shown Price, and the Platform Rate is read once, in the same query as the rest. It is null when no Visible Offer is in stock, and when no in-stock Offer has a Shown Price because there is no Platform Rate.
- [ ] **The order.** Parts with a Lowest Price come first, lowest first. Then in-stock Parts with none, which happens only with no Platform Rate. Then Parts whose Visible Offers are all out of stock. Ties go to the name, then the identifier.
- [ ] **The search.** It uses the catalog's word rule, not a copy of it: every word, in any order and any case, in the name, the manufacturer or a part number. An empty search finds every Visible Part.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] `pnpm integration:check` gains these tests, written before the code, and passes:
  - A Part with no Offer is not listed. Neither is one whose only Offer is an Expired Offer, nor one whose only Vendor is deactivated. Confirming the Offer again, or reactivating the Vendor, lists it.
  - Only the asked Category's Visible Parts are listed.
  - The Lowest Price ignores out-of-stock Offers and Offers that are not Visible Offers. It is marked converted exactly when the Offer it comes from was converted, in each currency.
  - The order is as stated above. The same Parts can be in another order in the other currency.
  - The number of Vendors counts Visible Offers, in stock or not, and nothing else.
  - The search finds by name, by manufacturer and by part number, with words in any order and any case.
  - Paging answers the page's size and the total, as the catalog's paging does.
  - An Admin's or a Vendor's token changes nothing in the answer.
  - A missing or unknown `category`, and a missing or wrong `currency`, are refused, each naming its field.
- [ ] Each of these is shown once and then reverted, and each fails its own test: an out-of-stock Offer counted in the Lowest Price; an Expired Offer making a Part visible; the Platform Rate read in a second query; the order by Quoted Price in place of the Shown Price.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.
