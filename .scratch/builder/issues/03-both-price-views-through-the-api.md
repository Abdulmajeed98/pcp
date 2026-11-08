# 03: Both price views through the API

**Spec:** [the builder spec](../spec.md)

**What to build:** Reading a Build now answers both price views in the chosen currency.

- **The first** gives each Part its Lowest Price and the Vendor it comes from, and the Build's total across Vendors (BLD-7, PRC-5).
- **The second** lists each Vendor that has any of the Build's Parts in stock, with its own total, the Parts it has and the Parts it lacks, fewest lacked first (BLD-8).

An Unstocked Part is answered as such and left out of every total (BLD-9). Everything is read at one Platform Rate, through the rules `browse` wrote once. The Shopper app will add, convert and compare nothing. A Shopper page will show the views in ticket 08. For now the integration tests prove them, written before the code, as the MVP spec's testing strategy asks of both price views.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] **Each Part's Lowest Price**, with the identifier and name of the Vendor whose Offer it comes from, or none when it is an Unstocked Part. It is read through the visible-Offer rule, the Shown Price, the Lowest Price and OFF-11's order of a Part's Offers as `browse` wrote them, never a second copy. So of equal prices it is the Offer the Part page lists first.
- [ ] **The first view's total**: each Part's Lowest Price times its quantity, added up as answered, after rounding (PRC-5). It is marked converted when any of them is a Converted Price. It leaves out Unstocked Parts, and is none when no Part has a Lowest Price.
- [ ] **No Shown Price yet.** A Part whose first in-stock Offer has no Shown Price has no Lowest Price. This happens only before the first Platform Rate, with an Offer quoted only in the other currency. Such a Part is left out of the total, and the answer says that a price could not be shown.
- [ ] **The second view**: each active Vendor with an in-stock Visible Offer for at least one of the Build's Parts. Each has its identifier and name, the Parts it has in stock with each Shown Price, its total (each Shown Price times its quantity, marked converted when any is converted), and the Parts it lacks.
  - The Parts it lacks are the Build's Parts that other Vendors stock and it does not. An Unstocked Part is in no Vendor's list.
  - The Vendors are ordered by how many Parts they lack, fewest first, then by their total, lowest first, then by name, then by identifier.
  - The totals and this order are new, and are written once in the API's domain.
- [ ] **One statement, one moment.** Every Shown Price in the answer, both views and the visibility of every Offer are read at one Platform Rate, taken once in the statement that reads them, as every public read that answers a price does.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] `pnpm integration:check` gains these tests, written before the code, and passes:
  - A Part's Lowest Price ignores out-of-stock Offers, Expired Offers and a deactivated Vendor's Offers, and names its Vendor. With two equal prices it is the Offer the Part page lists first.
  - The total is each Lowest Price times its quantity, added up. It is marked converted when any is converted, and answered in each currency.
  - A Part made unstocked by putting its Offer out of stock, by letting it expire past 14 days, and by deactivating its only Vendor is answered as an Unstocked Part and left out of the total. Confirming the Offer again, or reactivating the Vendor, brings it back.
  - With no Platform Rate, a Part offered only in the other currency is left out of the total, and the answer says so.
  - Only active Vendors with an in-stock Visible Offer for a Build's Part are listed in the second view.
  - Each Vendor's total is its Shown Prices times their quantities, marked converted when any is. It lists the Parts it has and the Parts it lacks, and never an Unstocked Part.
  - The order is fewest Parts lacked first, then the lowest total, then the name, then the identifier, proved on Vendors that tie on each key in turn. It can differ between the two currencies.
  - A Platform Rate changed while a Build is read never mixes two rates in one answer, proved with `changeWhileReading`, as `browse` proved its figures.
- [ ] Each of these faults is planted once and then reverted, and each fails its own test:
  - an out-of-stock Offer counted in a Vendor's total;
  - a quantity left out of the first view's total;
  - an Unstocked Part listed as lacking under every Vendor;
  - the Vendors ordered by total before what they lack;
  - the Platform Rate read in a second query.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.
