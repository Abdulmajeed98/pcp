# 01: Add and read an Offer

**Spec:** [the offers spec](../spec.md)

**What to build:** Through the API, a Vendor's own Login, or the Admin acting for it, adds an Offer for any Part in the catalog and reads it back. The Offer holds a Quoted Price in USD, in IQD or in both, whether the Part is in stock, an optional warranty in months, and the time of its Confirmation (OFF-2). A Vendor has at most one Offer for a Part (OFF-1). Adding an Offer is a Confirmation, whose time the API's clock gives (OFF-5). It is the first row of the Offer history, with the Caller who made it (OFF-10). No screen shows it yet. The integration tests are the proof.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] **The tables.** `offer`, with the Vendor and the Part as a unique pair, the USD price as whole cents and the IQD price as whole dinars, each nullable, with a check that at least one is present, in stock, the warranty, the time of the last Confirmation and the time of creation. `offer_history`, keyed by Vendor and Part, which neither references the Offer nor is removed with it. Both are made by a migration generated with `pnpm db:generate`, and the migration is committed.
- [ ] **The checks.** `OfferDetails.check`, in the domain, is written once. USD is positive, with at most two decimal places, and at most 100,000.00. IQD is a positive whole number, at most 150,000,000. The warranty is optional, a whole number of months from 1 to 120. In stock is required. Each refusal is `NOT_VALID` with its `field` and one of the reasons `missing` (no price at all, on `usdPrice`), `notANumber`, `notPositive`, `tooManyDecimals`, `tooLarge` and `notWholeMonths`. The first detail that does not fit is named, in the order USD, IQD, in stock, warranty.
- [ ] **The API as the source of time.** The time of a Confirmation and of a history row comes from the API's clock, never from the database's `now()`.
- [ ] **The endpoints.** `POST v1/vendors/{vendorId}/offers` answers 201 with the Offer. `GET v1/vendors/{vendorId}/offers/{offerId}` answers one Offer with its Part's name, manufacturer, Category and photo. The USD price is answered as a decimal string, "349.99", and the IQD price as a whole number. Both endpoints use `VendorAccessRule`, which `VendorModule` now exports. An Offer that is another Vendor's, or does not exist, is answered 404 with `OFFER_NOT_FOUND`. A Part that does not exist is answered 404 with `PART_NOT_FOUND`. A second Offer for the same Part is answered `NOT_VALID`, `field: 'partId'`, `reason: 'taken'`, also when two requests arrive at once.
- [ ] **The use cases.** `CreateOfferCommand` and `ReadOfferQuery`, with their own Input and Output classes, the `Offer` entity and the `OfferStore` port with its database implementation. A Store method finds a Vendor's Offer by Part, for `sheet` and `part-requests` to use later.
- [ ] **The history.** Creating an Offer writes one row in the same transaction, holding the time, the Vendor, the Part, both prices and in stock as created, and the Caller's Login identifier.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] `pnpm integration:check` passes with these tests:
  - A Vendor adds an Offer quoted only in USD, one only in IQD and one in both, and reads each back as entered, "349.99" kept with its cents.
  - No price, a price of zero, a negative price, three decimal places in USD, a fraction of a dinar, each price over its limit, and a warranty of 0, of 121 or of 1.5 months are each refused, naming the field and the reason.
  - A second Offer for the same Part is refused as taken. Two requests at once leave one Offer.
  - An Offer for a Part that does not exist is answered 404.
  - The Admin adds an Offer for any Vendor, a deactivated one among them.
  - A Vendor's token at another Vendor's Offers is answered 403 with `VENDOR_ACCESS_DENIED`, whether that Vendor exists or not. Reading another Vendor's Offer through one's own address is answered 404 with `OFFER_NOT_FOUND`.
  - A deactivated Vendor's own token, not run out, is answered 403 with `VENDOR_DEACTIVATED`.
  - A call without a token is answered 401.
  - Creating an Offer writes one history row, with the time of the moved clock and the Caller's Login identifier. The Admin acting is recorded as the Admin.
- [ ] Shown once and then reverted, each failing its own test: the unique pair removed; the database's clock used for the Confirmation's time; the ownership check left out of reading an Offer by its identifier.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.
