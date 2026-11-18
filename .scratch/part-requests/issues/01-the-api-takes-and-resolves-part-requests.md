# 01: The API takes and resolves Part Requests

**Spec:** [the part-requests spec](../spec.md)

**What to build:** Through the API, a Vendor's own Login sends a Part Request for a Part it cannot find in the catalog. The Admin can send one too, acting for any Vendor. The request gives the Part's name, its manufacturer part number, its Category and the Offer the Vendor would make (REQ-1). The Vendor reads its own Part Requests in every state (REQ-4). The Admin reads the queue of open ones, oldest first, and reads any one request. The Admin then fulfils a request with a Part, or rejects it with a reason (REQ-2).

Fulfilling makes the Vendor's Offer with the request's details (REQ-3). The Offer counts as confirmed at the moment the request was sent. If the Vendor already has an Offer for that Part, the newer of the two statements wins. A request is resolved only once, however many calls arrive at the same moment.

No screen shows any of this yet. Tickets 03 and 04 do. For now the integration tests prove it, written before the code.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] **The term, before any code.** CONTEXT.md's **Part Request** names its three states: open (neither fulfilled nor rejected), fulfilled (matched to a Part, found or created) and rejected (turned down with a reason). Its words to avoid gain pending, approved, accepted, declined, denied and closed. `words.md` gains the Kurdish and Arabic words for the three states, as drafts under LANG-7.
- [ ] **The day rule, shared.** `sharing` wrote a rule for the day in Iraq's time and the calendar days since it. In a commit of its own, that rule moves to where both Shared Builds and Part Requests can read it. `sharing`'s tests pass unchanged.
- [ ] **The Offer's writing, inside another transaction.** In a commit of its own, the Offer module's writing of an Offer and its history row learns to run inside a transaction it is handed. This covers both creating an Offer and replacing its details. Fulfilling can then use the Offer module's own writing in one transaction, with no second copy of it. `offers`' tests pass unchanged.
- [ ] **The table.** `part_request`, from a migration made with `pnpm db:generate`. It holds:
  - the Vendor and the Category;
  - the name as written, and the cleaned part number;
  - the USD price in cents and the IQD price in whole dinars, with a check that at least one is there;
  - in stock and the warranty;
  - the moment it was sent;
  - the state.

  Database checks tie each state to what it must hold: a fulfilled request has its Part and the moment it was resolved, a rejected one has its reason and that moment, and an open one has neither. One index serves the queue (state, then the moment sent) and one serves a Vendor's list (Vendor, then the moment sent). Nothing deletes a row.
- [ ] **Sending.** `POST v1/vendors/{vendorId}/part-requests`, through `SendPartRequestCommand` and `VendorAccessRule`, answers 201 with the Part Request. The checks run in the form's order, the first that fails named as `NOT_VALID` with its `field` and reason:
  - `category`: `missing` or `notInTheSet`;
  - `name`: kept as written, more than spaces, at most 300 code points (`missing`, `tooLong`);
  - `partNumber`: invisible marks stripped and the space around it trimmed, as the catalog cleans a part number, then 1 to 100 code points (`missing`, `tooLong`);
  - the Offer's details: `OfferDetails.check`, unchanged.

  The moment sent is the API's clock.
- [ ] **What a Part Request answers.** Its identifier, Category, name, part number, both Quoted Prices as an Offer answers them, in stock, warranty, `sentAt`, `sentOn`, `daysSinceSent`, `state` and `offerWouldBeExpired`. The last uses the expiry rule written once, so no frontend holds the 14 days.
  - A fulfilled request adds its Part, as `PartSummaryResponse`, and `offerId`: the Vendor's Offer for that Part now, or null.
  - A rejected request adds `reason`.
  - Every resolved request adds `resolvedAt`.
- [ ] **Reading.** Each list reads its page and total in one snapshot through `PagingRequest`.
  - `GET v1/vendors/{vendorId}/part-requests`, through `VendorAccessRule`, answers the Vendor's requests in every state, newest first, then by identifier.
  - `GET v1/part-requests` (Admin) answers open requests of every Vendor, active and deactivated, oldest first, then by identifier, each with its Vendor `{ id, name, active }`.
  - `GET v1/part-requests/{partRequestId}` (Admin) answers one request in any state, with its Vendor.
- [ ] **Fulfilling.** `POST v1/part-requests/{partRequestId}/fulfil` (Admin) takes `{ partId }`. In one transaction it locks the request's row, checks that the request is still open, writes the Offer, and marks the request fulfilled with the Part and the moment. It answers 200 with the Part Request and `offer`, which is one of these:
  - `created` when the Vendor has no Offer for the Part. The Offer gets the request's prices, stock and warranty. Its Confirmation is the moment sent, and it was made now. One `created` history row is written, by the Caller's Login.
  - `replaced` when the Vendor's Offer was confirmed strictly before the moment sent. The Offer's prices, stock and warranty are replaced, as an edit replaces them, and its Confirmation becomes the moment sent. A `changed` history row is written only when a price or the stock changed.
  - `kept` when the Vendor's Offer was confirmed at or after the moment sent. The Offer is left as it is, with no history row.

  A Deactivated Vendor's request is fulfilled too. A Part of any Category may fulfil it.
- [ ] **Rejecting.** `POST v1/part-requests/{partRequestId}/reject` (Admin) takes `{ reason }`: kept as written, more than spaces, at most 300 code points (`NOT_VALID` naming `reason`, `missing` or `tooLong`). Like fulfilling, it locks the row and checks that the request is still open. It answers 200 with the Part Request.
- [ ] **Refusals, in this order.**
  - A Vendor endpoint follows `VendorAccessRule`: 403 `VENDOR_ACCESS_DENIED` for another Vendor, 403 `VENDOR_DEACTIVATED` for a Deactivated Vendor's own Login, 404 `VENDOR_NOT_FOUND` for an unknown Vendor named by the Admin, and 401 for no token.
  - An Admin endpoint answers a Vendor's token 403 `ACCESS_DENIED`.
  - An unknown request is 404 `PART_REQUEST_NOT_FOUND`, and so is text that is not an identifier, without asking the database.
  - A resolved request is 400 `PART_REQUEST_RESOLVED`.
  - A fulfilment naming an unknown Part is 404 `PART_NOT_FOUND`, and the request stays open.
- [ ] **The code** follows the catalog's conventions:
  - the port `PartRequestStore`;
  - `SendPartRequestCommand`, `FulfilPartRequestCommand`, `RejectPartRequestCommand`, `ListVendorsPartRequestsQuery`, `ListOpenPartRequestsQuery` and `ReadPartRequestQuery`, each with its Input and Output;
  - the client's functions `sendPartRequest`, `listVendorsPartRequests`, `listOpenPartRequests`, `readPartRequest`, `fulfilPartRequest` and `rejectPartRequest`.

  `OfferStore.readByPart` gets its first caller and its tests. `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] **The integration tests, written first,** cover every line of the spec's seam 2:
  - sending, with each refusal and the cleaned part number;
  - both lists' order on ties, their paging, and the queue leaving out resolved requests;
  - `sentOn` and `daysSinceSent` at Iraq's midnight;
  - `offerWouldBeExpired` one millisecond past 14 days;
  - fulfilling as `created`, `replaced` and `kept`, with the Offer history read by `offerHistoryRows()`;
  - the Offer visible through `GET v1/parts/{partId}/offers` within 14 days of sending, and listed as expired after them until confirming all;
  - a Deactivated Vendor's Offer, hidden until reactivation;
  - a Part of another Category;
  - `offerId` turning null once the Vendor removes the Offer;
  - rejecting;
  - two fulfilments, and a fulfilment and a rejection, sent at once while the row is held: one resolution, one Offer, and the other call refused `PART_REQUEST_RESOLVED`.

  Nothing is mocked but the API's clock.
- [ ] **Faults seen to fail once,** then reverted:
  - a response field added without `pnpm api-client:write`, at the API's own test of its description;
  - a column added without a migration, at the migration check;
  - the row lock taken out of fulfilling, at the test of calls sent at once.
- [ ] **Gates.** `pnpm integration:check` and `pnpm check --skip-nx-cache` pass on each commit.

## Comments
