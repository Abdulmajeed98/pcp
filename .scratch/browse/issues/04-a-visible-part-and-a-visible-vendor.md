# 04: A Visible Part, and a visible Vendor with its Offers, through the API

**Spec:** [the browse spec](../spec.md)

**What to build:** Anyone, with no Login, can ask the API for three things:

- a Visible Part, with its specifications labelled in English;
- an active Vendor's name, city and Contact details;
- one page of an active Vendor's Visible Offers, grouped by Category, each with its Part and its Shown Price in the chosen currency.

A Part that is not visible, and a deactivated or unknown Vendor, answer 404, so the Shopper app can show its not-found page. With `GET v1/parts/{partId}/offers`, which `pricing` left, these are everything a Part page and a Vendor page read.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] **A Visible Part.** `GET v1/visible-parts/{partId}`, marked `@Public()` and described with `security: []`. It answers the Part's identifier, Category, name, manufacturer, part numbers, photo's path and specifications. It reads ticket 02's rule for a Visible Part, not a copy of it. A Part that is not visible, or unknown, is answered 404 with `NOT_FOUND`. A malformed identifier is answered as the Part read for the Admin answers one.
- [ ] **Its specifications.** Answered in the order of the Category's specification list, each with its English label, its value and its unit. A specification the Part does not hold is left out. So is a stored 0 that the list says means "not known". Yes-or-no values are booleans. A Part is visible by the same rule as everywhere: an Admin's or a Vendor's token gives no more.
- [ ] **A visible Vendor.** `GET v1/visible-vendors/{vendorId}`, public in the same way. It answers the Vendor's identifier, name, city, address, map location, phone number, WhatsApp number, Instagram name and opening hours, with null for each detail the Vendor has not given. It never answers the Login phone number, whether the Vendor is active, or when it was made or changed. A deactivated or unknown Vendor is answered 404 with `NOT_FOUND`.
- [ ] **A visible Vendor's Offers.** `GET v1/visible-vendors/{vendorId}/offers` with `currency`, which is required and refused as `GET v1/parts/{partId}/offers` refuses it, and `page` and `size` through `PagingRequest`. Each Visible Offer has its Part's identifier, Category, name, manufacturer and photo's path, and its Quoted Prices, Shown Price, in-stock status, warranty and days since Confirmation, as a Part's Visible Offers answer them. A deactivated or unknown Vendor is answered 404.
- [ ] **Their order.** Grouped by Category in the catalog's fixed order of the eight. Within each Category, OFF-11's order: in stock first, then the lowest Shown Price, then the most recent Confirmation, then the Part's name, then the Offer's identifier. Paging runs across the groups.
- [ ] **One snapshot.** The visible-Offer rule is read through `visibleOffer(now)` and the Shown Price through `pricing`'s SQL expression. The Platform Rate is read in the same query as the Offers.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] `pnpm integration:check` gains these tests, written before the code, and passes:
  - A Part whose only Offer is an Expired Offer, one whose only Vendor is deactivated, and an unknown Part answer 404. Confirming the Offer again or reactivating the Vendor brings the Part back.
  - A Visible Part's specifications are in the list's order, with labels and units, leaving out what it does not hold and a 0 that means "not known".
  - A visible Vendor answers its contact details, with null where one is not given. Its answer holds no Login phone number. A deactivated and an unknown Vendor answer 404, with their Offers as well.
  - A visible Vendor's Offers leave out its Expired Offers. They are grouped in the catalog's order of Categories, and in OFF-11's order within each, in each currency.
  - An Admin's or a Vendor's token changes nothing in any answer.
- [ ] Each of these is shown once and then reverted, and each fails its own test: a deactivated Vendor's page answered; a "not known" 0 answered as a specification; the Offers ordered by price across Categories instead of within them.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.
