# 01: The API takes and resolves Part Requests

**Spec:** [the part-requests spec](../spec.md)

**What to build:** Through the API, a Vendor's own Login sends a Part Request for a Part it cannot find in the catalog. The Admin can send one too, acting for any Vendor. The request gives the Part's name, its manufacturer part number, its Category and the Offer the Vendor would make (REQ-1). The Vendor reads its own Part Requests in every state (REQ-4). The Admin reads the queue of open ones, oldest first, and reads any one request. The Admin then fulfils a request with a Part, or rejects it with a reason (REQ-2).

Fulfilling makes the Vendor's Offer with the request's details (REQ-3). The Offer counts as confirmed at the moment the request was sent. If the Vendor already has an Offer for that Part, the newer of the two statements wins. A request is resolved only once, however many calls arrive at the same moment.

No screen shows any of this yet. Tickets 03 and 04 do. For now the integration tests prove it, written before the code.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] **The term, before any code.** CONTEXT.md's **Part Request** names its three states: open (neither fulfilled nor rejected), fulfilled (matched to a Part, found or created) and rejected (turned down with a reason). Its words to avoid gain pending, approved, accepted, declined, denied and closed. `words.md` gains the Kurdish and Arabic words for the three states, as drafts under LANG-7.
- [x] **The day rule, shared.** `sharing` wrote a rule for the day in Iraq's time and the calendar days since it. In a commit of its own, that rule moves to where both Shared Builds and Part Requests can read it. `sharing`'s tests pass unchanged.
- [x] **The Offer's writing, inside another transaction.** In a commit of its own, the Offer module's writing of an Offer and its history row learns to run inside a transaction it is handed. This covers both creating an Offer and replacing its details. Fulfilling can then use the Offer module's own writing in one transaction, with no second copy of it. `offers`' tests pass unchanged.
- [x] **The table.** `part_request`, from a migration made with `pnpm db:generate`. It holds:
  - the Vendor and the Category;
  - the name as written, and the cleaned part number;
  - the USD price in cents and the IQD price in whole dinars, with a check that at least one is there;
  - in stock and the warranty;
  - the moment it was sent;
  - the state.

  Database checks tie each state to what it must hold: a fulfilled request has its Part and the moment it was resolved, a rejected one has its reason and that moment, and an open one has neither. One index serves the queue (state, then the moment sent) and one serves a Vendor's list (Vendor, then the moment sent). Nothing deletes a row.
- [x] **Sending.** `POST v1/vendors/{vendorId}/part-requests`, through `SendPartRequestCommand` and `VendorAccessRule`, answers 201 with the Part Request. The checks run in the form's order, the first that fails named as `NOT_VALID` with its `field` and reason:
  - `category`: `missing` or `notInTheSet`;
  - `name`: kept as written, more than spaces, at most 300 code points (`missing`, `tooLong`);
  - `partNumber`: invisible marks stripped and the space around it trimmed, as the catalog cleans a part number, then 1 to 100 code points (`missing`, `tooLong`);
  - the Offer's details: `OfferDetails.check`, unchanged.

  The moment sent is the API's clock.
- [x] **What a Part Request answers.** Its identifier, Category, name, part number, both Quoted Prices as an Offer answers them, in stock, warranty, `sentAt`, `sentOn`, `daysSinceSent`, `state` and `offerWouldBeExpired`. The last uses the expiry rule written once, so no frontend holds the 14 days.
  - A fulfilled request adds its Part, as `PartSummaryResponse`, and `offerId`: the Vendor's Offer for that Part now, or null.
  - A rejected request adds `reason`.
  - Every resolved request adds `resolvedAt`.
- [x] **Reading.** Each list reads its page and total in one snapshot through `PagingRequest`.
  - `GET v1/vendors/{vendorId}/part-requests`, through `VendorAccessRule`, answers the Vendor's requests in every state, newest first, then by identifier.
  - `GET v1/part-requests` (Admin) answers open requests of every Vendor, active and deactivated, oldest first, then by identifier, each with its Vendor `{ id, name, active }`.
  - `GET v1/part-requests/{partRequestId}` (Admin) answers one request in any state, with its Vendor.
- [x] **Fulfilling.** `POST v1/part-requests/{partRequestId}/fulfil` (Admin) takes `{ partId }`. In one transaction it locks the request's row, checks that the request is still open, writes the Offer, and marks the request fulfilled with the Part and the moment. It answers 200 with the Part Request and `offer`, which is one of these:
  - `created` when the Vendor has no Offer for the Part. The Offer gets the request's prices, stock and warranty. Its Confirmation is the moment sent, and it was made now. One `created` history row is written, by the Caller's Login.
  - `replaced` when the Vendor's Offer was confirmed strictly before the moment sent. The Offer's prices, stock and warranty are replaced, as an edit replaces them, and its Confirmation becomes the moment sent. A `changed` history row is written only when a price or the stock changed.
  - `kept` when the Vendor's Offer was confirmed at or after the moment sent. The Offer is left as it is, with no history row.

  A Deactivated Vendor's request is fulfilled too. A Part of any Category may fulfil it.
- [x] **Rejecting.** `POST v1/part-requests/{partRequestId}/reject` (Admin) takes `{ reason }`: kept as written, more than spaces, at most 300 code points (`NOT_VALID` naming `reason`, `missing` or `tooLong`). Like fulfilling, it locks the row and checks that the request is still open. It answers 200 with the Part Request.
- [x] **Refusals, in this order.**
  - A Vendor endpoint follows `VendorAccessRule`: 403 `VENDOR_ACCESS_DENIED` for another Vendor, 403 `VENDOR_DEACTIVATED` for a Deactivated Vendor's own Login, 404 `VENDOR_NOT_FOUND` for an unknown Vendor named by the Admin, and 401 for no token.
  - An Admin endpoint answers a Vendor's token 403 `ACCESS_DENIED`.
  - An unknown request is 404 `PART_REQUEST_NOT_FOUND`, and so is text that is not an identifier, without asking the database.
  - A resolved request is 400 `PART_REQUEST_RESOLVED`.
  - A fulfilment naming an unknown Part is 404 `PART_NOT_FOUND`, and the request stays open.
- [x] **The code** follows the catalog's conventions:
  - the port `PartRequestStore`;
  - `SendPartRequestCommand`, `FulfilPartRequestCommand`, `RejectPartRequestCommand`, `ListVendorsPartRequestsQuery`, `ListOpenPartRequestsQuery` and `ReadPartRequestQuery`, each with its Input and Output;
  - the client's functions `sendPartRequest`, `listVendorsPartRequests`, `listOpenPartRequests`, `readPartRequest`, `fulfilPartRequest` and `rejectPartRequest`.

  `OfferStore.readByPart` gets its first caller and its tests. `pnpm api-client:write` is run, and the description and the client are committed.
- [x] **The integration tests, written first,** cover every line of the spec's seam 2:
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
- [x] **Faults seen to fail once,** then reverted:
  - a response field added without `pnpm api-client:write`, at the API's own test of its description;
  - a column added without a migration, at the migration check;
  - the row lock taken out of fulfilling, at the test of calls sent at once.
- [x] **Gates.** `pnpm integration:check` and `pnpm check --skip-nx-cache` pass on each commit.

## Comments

### 18 November 2026: built

On branch `part-requests/01-the-api-takes-and-resolves-part-requests`, from `part-requests/integration` at `0aa85cc`, in five commits, each gated on `pnpm check` and, where it touches the API, `pnpm integration:check`.

- **The term.** CONTEXT.md's **Part Request** names its three states, open, fulfilled and rejected, and its words to avoid gain pending, approved, accepted, declined, denied and closed (`534f6f2`). `words.md` gains a section, **The states of a Part Request**, with what the portal says of each, Waiting, Added and Not added, in Kurdish (چاوەڕوانە, زیادکرا, زیاد نەکرا) and Arabic (قيد الانتظار, أُضيفت, لم تُضَف), as drafts under LANG-7 (`aae150d`).
- **The day rule** moved from `domain/shared-build/the-platforms-day.ts` to `domain/the-platforms-day.ts`, beside `uuid.ts`, where `SharedBuild` and `PartRequest` both read it (`eb62e42`). The inspector's stand-in names its new place in its comment. `sharing`'s tests passed unchanged.
- **The Offer's writing** moved into `infrastructure/offer/offer-writing.ts`, which runs in the transaction it is handed (`c957bc9`): `holdTheOffer` reads an Offer `FOR UPDATE`, `writeANewOffer` adds one with its `created` row, and `replaceTheDetailsOf` replaces the prices, stock and warranty as an edit does, adding a `changed` row only when a price or the stock changed. Each takes the Confirmation's time apart from the moment it writes; a Vendor's own add or edit gives the same for both. `Transaction` (`infrastructure/database/transaction.ts`) names the type the client hands. `offers`' tests passed unchanged, 659 tests in 26 files.
- **The rest** is one commit, the table, the six endpoints, the client and the tests (`c550108`):
  - `part_request`, migration `0015_create-part-request`, from `pnpm db:generate`: the Vendor, the Category (the catalog's `part_category`), the name, the part number, `usd_price_cents` and `iqd_price` with `part_request_has_a_price`, `in_stock`, `warranty_months`, `sent_at`, `state` (`part_request_state`), and `part_id`, `reason` and `resolved_at`. Three checks tie the states: `part_request_open_is_unresolved`, `part_request_fulfilled_has_its_part` and `part_request_rejected_has_its_reason`. `part_request_state_sent_index` serves the queue and `part_request_vendor_sent_index` a Vendor's list. Nothing deletes a row, and nothing cascades.
  - The domain, in `domain/part-request/`: the entity `PartRequest` with `SendingVendor` and its resolution, `PartRequestDetails.check` (the Category, the name, the part number, then `OfferDetails.check` unchanged), `checkedRejectionReason`, the rule `offerFulfilmentOf` (no Offer `created`, confirmed strictly before the sending `replaced`, else `kept`), the port `PartRequestStore`, and the six use cases with their Inputs and Outputs. `part-numbers.ts` gains `cleanPartNumber`, which `cleanPartNumbers` now uses, so a request's part number is cleaned as the catalog's are. `OfferDetails.asKept` reads back details checked before they were kept.
  - `DatabasePartRequestStore.fulfil` holds the request's row `FOR UPDATE`, refuses it as resolved unless it is open, holds the Vendor's Offer for the Part, decides by `offerFulfilmentOf`, writes through `offer-writing.ts`, and marks the request fulfilled, all in one transaction; `reject` holds the row the same way. The Commands read the request first, so that the refusals come in the spec's order (the request, whether it is open, then the Part or the reason), and the Store asks again under the lock.
  - **`OfferStore.readByPart` gets its first caller**: one request's answer, read, fulfilled or rejected, finds `offerId` through it (`withTheVendorsOffer`). The two lists read `offerId` in their own snapshot, by a join. Its tests are the integration tests of `offerId`: the requesting Vendor's Offer and not another Vendor's for the same Part, and null in the read and the list once the Vendor removes it.
  - The answers: `PartRequestResponse` for the Vendor's endpoints, and `PartRequestWithVendorResponse` with `vendor: { id, name, active }` for the Admin's; `FulfilledPartRequestResponse` adds `offer`. `part`, `offerId`, `reason` and `resolvedAt` are left out when the state does not hold them, as the ticket says each "adds" them, and as `VisiblePartResponse` leaves out `compatible`. `PART_REQUEST_RESOLVED` is a `NotValidError` of its own code, so 400.
  - `pnpm api-client:write` wrote the description and the client: `sendPartRequest`, `listVendorsPartRequests`, `listOpenPartRequests`, `readPartRequest`, `fulfilPartRequest` and `rejectPartRequest`.

**What the spec does not settle, and what the code does.** No choice in this ticket is the owner's, so none was taken under the standing instruction. One case the spec leaves open: the Vendor adds its own Offer for the Part between a fulfilment's reading of the Vendor's Offers and its writing. The unique pair then refuses the fulfilment's Offer, the whole transaction rolls back, and the fulfilment is answered as an Offer's create answers it, 400 `NOT_VALID` naming `partId` with `taken`; the request stays open, and fulfilling it again finds the Vendor's Offer and keeps it. No test causes it: the Vendor's add and the Admin's fulfilment would have to meet between two statements.

### 18 November 2026: the integration tests, written first

`part-request.controller.integration-spec.ts` (39 tests) and `part-request.controller.resolving.integration-spec.ts` (26 tests), in `apps/api/src/test/infrastructure/part-request/endpoints/`. Both were run red before any code: every test failed on the missing endpoints, a 404 from Nest's own `NOT_FOUND` where a 201, a 200 or a refusal of the module's own was expected.

- Sending: every detail, the moment by the moved clock, a price in one currency, the cleaned part number and the name as written, 300 and 100 code points taken, each refusal of the Category, the name, the part number and the Offer's details with its reason, the first in the form's order, a manufacturer or a specification refused as undeclared, and `VendorAccessRule`'s four refusals, with nothing stored.
- The Vendor's list: its own in every state, newest first and then by identifier on two requests sent at one moment, no other Vendor's, the paging, and its refusals. The queue: open requests of an active and a deactivated Vendor, oldest first and then by identifier, each with its Vendor, a fulfilled and a rejected request left out, the paging, and 403 `ACCESS_DENIED` for a Vendor.
- `sentOn` and `daysSinceSent` at Iraq's midnight, read alike in the read, the queue and the list; `offerWouldBeExpired` false at 14 days to the millisecond and true one millisecond later.
- One request in each state, 404 `PART_REQUEST_NOT_FOUND` for an unknown identifier and for texts that are not one, and 403 for a Vendor even for its own.
- Fulfilling: `created`, with the Offer's prices, stock, warranty, Confirmation at the sending and making at now, and one `created` history row at now by the Admin's Login, read with `offerHistoryRows()`; the Offer visible through `GET v1/parts/{partId}/offers` 5 days after the sending with its days counted from it, expired and hidden one millisecond past 14 days, and visible again after confirming all; a request older than 14 days making an Expired Offer at once; `replaced`, with a `changed` row at now, and with none when only the warranty differs; `kept` for an Offer confirmed at the very moment of the sending and an hour after, with no row; a Deactivated Vendor's Offer hidden until reactivation; a CPU fulfilling a GPU's request; `offerId` turning null; the refusals, each in its order, the request staying open.
- Rejecting: the reason as written, the answer, the queue and the list, 300 code points taken, `missing` and `tooLong`, and the refusals in their order.
- Once only: `sentWhileThePartRequestIsHeld` (`test-utils/database/test-database.ts`, the sixth named exception) holds the request's row `FOR UPDATE` until both calls wait. Two fulfilments: one 200, one 400 `PART_REQUEST_RESOLVED`, one Offer, one history row. A fulfilment and a rejection: one 200, the other refused so, and the request and the Offers as the one answered 200 says. Holding the row rather than the table lets each call's first read go on, as it would beside a real resolution, so the calls wait where a resolution holds the row.

Nothing is mocked but the API's clock. Each test Vendor's Login identifier is read when the Vendor is made, with the clock running, so that a token of its own can be made after the clock is moved.

### 18 November 2026: the fault checks

Each fault was planted on the committed tree (`c550108`) by one exact edit, run, and taken out by the inverse edit, `git status` clean after each, by a script in the ticket's scratch folder.

- **A response field added without `pnpm api-client:write`**: `planted`, an `@ApiProperty` boolean on `PartRequestResponse`. `openapi.spec.ts`'s "is what is committed, so that the client is never generated from a stale one" failed, showing `planted` in `PartRequestResponse` and in the two answers that extend it; the other five tests of the description passed.
- **A column added without a migration**: `planted: text('planted')` in `part-request.schema.ts`. `tools/check-migrations.mjs`, the step of `pnpm check`, failed: "The API's schema holds a change that no committed migration makes", with `ALTER TABLE "part_request" ADD COLUMN "planted" text;`.
- **The row lock taken out of fulfilling**: `.for('update')` removed from `holdThePartRequest`, the hold a fulfilment takes (a rejection shares it, so it lost the lock too). Both tests of calls sent at once failed: of two fulfilments the second was refused by the Offer's unique pair, `NOT_VALID` naming `partId` with `taken`, instead of `PART_REQUEST_RESOLVED`; and of a fulfilment and a rejection the second overwrote the first and broke a state's check, answered 500 instead of 400. The 24 other tests of the file were skipped by `-t 'once only'`.

### 18 November 2026: the gates

- Each commit was gated on `pnpm check` before it was made, and each that touches the API (`eb62e42`, `c957bc9`, `c550108`) on `pnpm integration:check` too: 659 tests in 26 files after each refactor, unchanged from `sharing`'s, and 724 in 28 files with this ticket's. Once a run stopped after 25 files with no summary and no failure, the stop the working practices know; it passed when run again.
- Each of the five commits then passed `pnpm check --skip-nx-cache` in a fresh clone, installed offline, with Docker and the browsers out of reach.
- This record's commit is gated on `pnpm check --skip-nx-cache`, with every `*.tsbuildinfo` outside `node_modules` deleted first, and on `pnpm integration:check`.
- The ticket runs no end-to-end test, so `pnpm platform:check` is not its gate. Migration `0015_create-part-request` is not yet in the development database: tickets 02 to 04 need `pnpm db:migrate` once this branch is merged.

