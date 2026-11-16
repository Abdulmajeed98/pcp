# 01: The API stores Shared Builds and counts Referrals

**Spec:** [the sharing spec](../spec.md)

**What to build:** Anyone, with no Login, can give the API a Build to share. The API answers a Shared Build: a frozen copy of the Build's Parts and quantities, stored once, that never changes. Sharing the same Build again answers the same Shared Build, and any change answers a new one (SHR-1, SHR-4). Anyone can read a Shared Build's Parts back, and record a Referral to a Vendor from it (SHR-6). The Admin can read every Vendor's Referral count, and a Vendor can read only its own (SHR-7). Reading a Build now also says, for each Vendor in the second price view, whether it gave a WhatsApp number.

No page shows any of this yet. Tickets 03 to 05 do. For now the integration tests prove it, written before the code.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] **The word.** **Shared Build** is added to CONTEXT.md under Shoppers and builds before any code uses it, as the spec defines it: a frozen copy of a Build's Parts and quantities, stored by the platform behind a link, which never changes. Its words to avoid are "saved build", "snapshot", "public build" and "build link".
- [x] **Tests first.** The integration tests below are written before the code for three things, and are seen to fail for the right reason:
  - the Shared Build's identity: the same Build gives the same Shared Build, and any change gives a new one;
  - the frozen copy never changing;
  - counting Referrals, and who may read a count.
- [x] **Sharing a Build.** `POST v1/shared-builds` takes `{ part: [...] }`, each value as `GET v1/build` takes `part`.
  - It reads the Build through `BuildReading` and leaves out every Part the catalog does not hold.
  - It freezes the rest as `part` values: lower-case identifiers, in the catalog's order of Categories, then the Build's order for kits and drives.
  - It stores them with the moment of sharing, by the API's clock.
  - It answers 201 with `{ id, sharedAt }` for a new Shared Build, and 200 with the stored one when the same text was shared before.
  - The stored text is unique, so two shares of one Build sent at the same moment make one Shared Build. The constraint alone decides that: no read before the insert.
- [x] **Its refusals**, each 400 `NOT_VALID` naming `part`: every refusal of `GET v1/build`, and `empty` for a Build that is empty once unknown Parts are left out.
- [x] **Reading a Shared Build.** `GET v1/shared-builds/{sharedBuildId}` answers `{ id, sharedAt, part: [...] }`. An unknown identifier, and text that is not one, are answered 404 `SHARED_BUILD_NOT_FOUND`.
- [x] **It never changes.** No endpoint changes or deletes a Shared Build. Its Parts are stored as text, with no foreign key to a Part, so a Part that leaves the catalog leaves the Shared Build readable, and `GET v1/build` leaves that Part out as it does for an old cookie. The identifier is a random UUID.
- [x] **Recording a Referral.** `POST v1/shared-builds/{sharedBuildId}/referrals` takes `{ vendorId }`, stores one Referral holding the Vendor, the Shared Build and the moment by the API's clock, and answers 201 with `{ vendor: { id, name, whatsAppNumber }, referredAt }`. Each call is one Referral. It is refused:
  - 404 `SHARED_BUILD_NOT_FOUND` for an unknown Shared Build;
  - 404 `VENDOR_NOT_FOUND` for an unknown or deactivated Vendor;
  - 400 `NOT_VALID` naming `vendorId`, with the reason `noWhatsAppNumber`, for a Vendor with no WhatsApp number.

  It does not check that the Vendor stocks a Part of the Shared Build. A refused Referral is not stored.
- [x] **The Admin's counts.** `GET v1/referral-counts`, for the Admin only, answers one page of every Vendor, active and deactivated. Each has its identifier, its name, whether it is active and its Referral count, zeros included. The page is ordered by count, most first, then name, then identifier, and is paged through `PagingRequest`.
- [x] **A Vendor's own count.** `GET v1/vendors/{vendorId}/referral-count` answers `{ count }` for the Admin and for the Vendor's own Login, through `VendorAccessRule`: another Vendor's is 403 `VENDOR_ACCESS_DENIED`, a deactivated Vendor's own Login gets 403 `VENDOR_DEACTIVATED`, and no token gets 401. No public endpoint answers any count.
- [x] **The second view's WhatsApp field.** Each Vendor in `GET v1/build`'s `vendors` answers whether it gave a WhatsApp number. Nothing else in the answer changes, and `builder`'s tests of the views pass unchanged.
- [x] **The public endpoints** are `@Public()`, carry `security: []`, and answer the same with an Admin's token, a Vendor's, a bad one or none.
- [x] **The code** follows the catalog's conventions:
  - a Command to share a Build and a Command to record a Referral;
  - Queries to read a Shared Build, to list the counts and to read one Vendor's;
  - each with its Input and Output, and its Store port in the domain.
- [x] **The storage.** One table for Shared Builds and one for Referrals, beside their Stores, with forward-only migrations made by `pnpm db:generate` under names that say what they do. Neither holds anything about the Shopper.
- [x] **The integration tests** at seam 2 cover each line the spec lists under Sharing a Build, Reading a Shared Build, Recording a Referral, Reading the counts, the second view's WhatsApp field and Tokens. They prove the counts' order on Vendors that tie on each key in turn, and the frozen copy against a changed price, an Offer put out of stock, a deactivated Vendor and an edited Part.
- [x] **The description.** `pnpm api-client:write` writes the five endpoints and the new field into the committed description and the client. Each of two faults is seen to fail `pnpm check` once and then reverted: a response field added without `pnpm api-client:write`, and a column added to a schema without a migration.
- [x] **ADR-0014** records the decisions that are costly to undo:
  - Shared Builds stored as frozen `part` values, unique by their text, identified by a random UUID, never changed or deleted, behind `/{language}/builds/{id}`;
  - Referrals stored one row a tap, holding nothing about the Shopper.
- [x] `pnpm integration:check` and `pnpm check` pass, and the work is committed.

## Comments

### 17 November 2026: Shared Builds, Referrals and their counts through the API, and the fault checks

**The word.** CONTEXT.md gained **Shared Build** under Shoppers and builds, after **Build**, in its own first commit (`a7765e4`), before any code used it, with the spec's definition and its words to avoid.

**Sharing a Build.** `POST v1/shared-builds` is `SharedBuildController.shareBuild` in `apps/api/src/app/infrastructure/shared-build/`, the client's `shareBuild`. `ShareBuildRequest` takes `part` as a list of texts in the body, required: its description is the one `BuildAsked` gives `GET v1/build`'s `part`, now written once as `whatEachPartValueIs` in `build-asked.ts`, with `empty` added. `ShareBuildCommand` reads the Build with `BuildReading.readForTheRules`, which refuses as `GET v1/build` refuses and leaves out every Part the catalog does not hold without reading any Offer, writes the rest as `part` values (`partValuesOf`, the Build's order, each identifier as the catalog writes it, a quantity in Western digits, so `<id>:01` is `<id>:1`), refuses an empty one as `empty` naming `part`, and stores it with now by the API's clock. It answers 201 for a Shared Build stored now and 200 for one an earlier share stored, through `@Res({ passthrough: true })`, which sets the status alone; the description names both answers.

**The identity.** The table `shared_build` (`shared-build.schema.ts`, migration `0013_create-shared-build`) holds the values as one text, joined by commas, under the unique rule `shared_build_part_values_unique`, with `shared_at` and a random UUID from `gen_random_uuid()`. `DatabaseSharedBuildStore.share` inserts with `ON CONFLICT (part_values) DO NOTHING`, with no read before, and only when nothing was inserted reads the stored row: a share that meets the rule waits for the share it met, so two at once make one Shared Build. The text refers to no Part, so a Part that leaves the catalog leaves the Shared Build readable.

**Reading a Shared Build.** `GET v1/shared-builds/{sharedBuildId}` is `readSharedBuild`, answering `{ id, sharedAt, part }`. `ReadSharedBuildQuery` answers `SHARED_BUILD_NOT_FOUND` for an identifier that names none, and the Store answers none for a text that is not an identifier without asking the database (`couldBeIdentifier`), as a Part's read does. No endpoint changes or deletes a Shared Build.

**Recording a Referral.** `POST v1/shared-builds/{sharedBuildId}/referrals` is `ReferralController.recordReferral` in `infrastructure/referral/`. `RecordReferralCommand` reads the Shared Build first (`SHARED_BUILD_NOT_FOUND`, whatever the Vendor), then the Vendor through `VendorStore` and `existingVendor` (`VENDOR_NOT_FOUND`, also for a deactivated Vendor, which Shoppers never see), then its WhatsApp number (400 `NOT_VALID`, `field: 'vendorId'`, `reason: 'noWhatsAppNumber'`, `referral-errors.ts`), and stores one row with now by the API's clock. It answers 201 with `{ vendor: { id, name, whatsAppNumber: { international, national } }, referredAt }`. It asks nothing about the Vendor's stock. `VendorModule` now exports `VendorStore` beside `VendorAccessRule`, and `SharedBuildModule` exports `SharedBuildStore`, for the Command. The table `referral` (`referral.schema.ts`, migration `0014_create-referral`) holds the Vendor and the Shared Build by reference, neither of which is ever deleted, and `referred_at`, with `referral_vendor_index` on the Vendor for its count. Neither table holds anything about the Shopper.

**The counts.** `GET v1/referral-counts` (`listReferralCounts`), `@PreAuthorize([Role.ADMIN])`, pages through `PagingRequest`: every Vendor left-joined to its Referrals, `count(referral.id)` so that a Vendor with none counts 0, ordered by the count descending, then `vendor.name` and `vendor.id` ascending, as the Vendors list orders names, the page and the total of Vendors read in one repeatable-read, read-only snapshot. Each row is `{ id, name, active, count }`. `GET v1/vendors/{vendorId}/referral-count` (`readVendorsReferralCount`), for the Admin and the `vendor` role, answers `{ count }` through `VendorAccessRule`.

**The description.** `pnpm api-client:write` wrote the five endpoints, and later the second view's `hasWhatsAppNumber`, into `apps/api/openapi.json` and the client: `shareBuild` (201 and 200), `readSharedBuild` and `recordReferral` with `security: []`, and `listReferralCounts` and `readVendorsReferralCount` with the bearer token, as read back from the committed description.

**The use cases** follow the catalog's conventions, each with its Input and Output in its file: `ShareBuildCommand`, `RecordReferralCommand`, `ReadSharedBuildQuery`, `ListReferralCountsQuery` and `ReadVendorsReferralCountQuery`, with the ports `SharedBuildStore` (`domain/shared-build/`) and `ReferralStore` (`domain/referral/`), and their tables beside `DatabaseSharedBuildStore` and `DatabaseReferralStore`.

**The tests**, at seam 2, were written before the code they test and run one slice at a time, with the reason each failed read:

`apps/api/src/test/infrastructure/shared-build/endpoints/shared-build.controller.integration-spec.ts`, 17 tests:

| Test | First run |
|---|---|
| Shared and answered 201 with an identifier, a random UUID, and the moment by the API's clock | Red: 404, no endpoint |
| Read back: its frozen values in the catalog's order of Categories and the Build's order of kits and drives, lower-case, quantities as numbers, and the moment | Red: 404, no endpoint |
| The same Build again, its single Parts in another order and in capitals, answered 200 with the first Shared Build as it was shared | Red: 201 with a new identifier and a new moment |
| A quantity changed, a Part replaced, a Part added and the kits in another order each answered 201 with a new identifier, the first unchanged | Passed: every share was a new one until the identity was built |
| Eight shares of one Build at once: one 201 and seven 200, one identifier | Passed on its first run; it caught no fault until it was sent past a held table (below) |
| A Part the catalog does not hold left out, with its quantity or without, the Build without it the same Shared Build | Passed: `BuildReading` already leaves it out |
| A Build of unknown Parts alone, and an empty one, refused as `empty` naming `part` | Red: 201, an empty Shared Build stored |
| Each of `GET v1/build`'s seven refusals, naming `part` | Passed: `BuildReading` already refuses them |
| No `part`, a `part` that is not a list of texts, and an undeclared field, refused naming the field | Passed: the request's own check |
| An unknown identifier and texts that are not identifiers answered 404 `SHARED_BUILD_NOT_FOUND` | Passed: the read already answered it |
| The frozen copy unchanged after a price changes, an Offer goes out of stock, a Vendor is deactivated and a Part is edited, each its own test, while `GET v1/build` with the values answers the change, and the same Build shared again still answers it | Passed: the values were stored as text from the first slice; fault C below shows the tests catch a copy that follows the catalog |
| A Part, then every Part, taken out of the catalog: the values unchanged, `GET v1/build` leaving each out | Passed, as the row above |
| Both endpoints the same with an Admin's, a Vendor's, a Shopper's, a run-out and a bad token, and none; a new share and both refusals too | Passed: `@Public()` was there from the first slice |

`apps/api/src/test/infrastructure/referral/endpoints/referral.controller.integration-spec.ts`, 17 tests, every one written before any of the referral code and seen red together, each on 404 from a route that did not exist (the error bodies' `NOT_FOUND`), then green at once:

- recording: the answer with the Vendor's number in both forms and the moment by the moved clock; each call one Referral, two for one Vendor and one Shared Build two, each raising the count by one; a Vendor with no Offer at all recorded; an unknown Shared Build and a text that is not one, with a known or unknown Vendor, `SHARED_BUILD_NOT_FOUND`; an unknown Vendor and texts that are not identifiers `VENDOR_NOT_FOUND`; a deactivated Vendor with a WhatsApp number `VENDOR_NOT_FOUND`; no WhatsApp number 400 naming `vendorId`, `noWhatsAppNumber`; no `vendorId`, null, a number, a list and an undeclared field refused naming the field; nothing counted for any refusal; the same answer with every token and none, each call counted;
- the Admin's list: every Vendor, active and deactivated, zeros included, with its four fields and the page's fields; the order on six Vendors, one with the most whatever its name, two tying on the count that their names decide, one with none whatever its name, and two tying on the count and the name that their identifiers decide; paging by 2 through 5 Vendors with no Vendor twice, 10 a page unless asked, a page past the end empty with the total, a size over 100 refused; a Vendor's own Login 403 `ACCESS_DENIED`, no token and a bad one 401;
- a Vendor's own count: read by its own Login and by the Admin, unchanged by Referrals to another Vendor; another Vendor's, an unknown one's and a text's 403 `VENDOR_ACCESS_DENIED` for a Vendor's Login; a deactivated Vendor's own Login 403 `VENDOR_DEACTIVATED` while the Admin still reads its count; no token and a bad one 401; an unknown Vendor and a text 404 `VENDOR_NOT_FOUND` for the Admin.

**Requests at once.** The first race test sent eight shares with `Promise.all` and passed, and so did fault A below: each request reached the table after the one before had finished, so a read before the insert never met another. `sentWhileTheTableIsHeld` (`test-utils/database/test-database.ts`) now holds `shared_build` locked in a transaction while the requests are sent, waits until eight wait for it in `pg_locks`, and lets it go, so all eight reach it at once. A Part leaving the catalog is arranged by `takeThePartOutOfTheCatalog`, a delete in the database, since nothing in the platform deletes a Part. Both are named exceptions to arranging data through the endpoints, the fourth and the fifth, with comments saying why.

**The fault checks**, each planted on a commit by a script that refused a dirty tree, made its edits, ran the test file or `pnpm check`, and reverted by the inverse edits; `git status` was clean after each:

| Fault | Edit, on the commit named | Failed |
|---|---|---|
| A. A read before the insert | `DatabaseSharedBuildStore.share` reads the text first and inserts with no `ON CONFLICT`, on `35d0b30` | The eight shares at once: those that met the unique rule were refused, so they answered more than one identifier. The same fault passed before the requests were sent past a held table |
| B. The values frozen as the request gave them | `ShareBuildCommand` stores `input.getPartValues()` in place of `partValuesOf(build.right)`, on `35d0b30` | The same Build in another order and in capitals (201, a new Shared Build), a Part the catalog does not hold (kept), and the values read back (not in the catalog's order) |
| C. A Shared Build read back as the catalog holds its Parts today | `ReadSharedBuildQuery` reads the values through `BuildReading` and keeps only the Parts it answers, four edits in one file, on `35d0b30` | When a Part leaves the catalog: the board missing from the values |
| D. A Vendor with no Referral counted once | `count()` in place of `count(referral.id)` in `DatabaseReferralStore.listCounts`, on `61ec5fa` | The Admin's list holding every Vendor, its order and its paging: a Vendor with none counted 1 |
| E. Every Vendor's Referrals counted as one Vendor's | `countFor` compares `referral.vendorId` with itself, on `61ec5fa` | A Vendor's count unchanged by Referrals to another Vendor |
| F. A Vendor's count read past `VendorAccessRule` | `ReadVendorsReferralCountQuery` drops the rule's refusal and counts for the identifier in the address, two edits, on `61ec5fa` | Another Vendor's count and a deactivated Vendor's own (200, not 403), and an unknown Vendor for the Admin (200, not 404). The script could not find the deleted line to put it back, so it was put back by its inverse edit by hand |
| G. A Referral recorded for a deactivated Vendor | `RecordReferralCommand` no longer refuses an inactive Vendor, on `61ec5fa` | A deactivated Vendor refused (201, not 404) |
| A response field added without `pnpm api-client:write` (the ticket's) | `SharedBuildResponse` gains `planted`, on `61ec5fa` | `pnpm check`, at `@pcp/api:test`: "the API's description of itself › is what is committed", showing the planted field. `write-api-client.mjs --check` itself passed: it compares the client with the committed description, and the API's own test compares the description with the API |
| A column added to a schema without a migration (the ticket's) | `shared_build` gains `planted: text('planted')`, on `61ec5fa` | `pnpm check`, at `check-migrations.mjs`: "The API's schema holds a change that no committed migration makes", naming `ALTER TABLE "shared_build" ADD COLUMN "planted" text;` |

**The pieces.** Each commit was gated on `pnpm integration:check` and on `pnpm check --skip-nx-cache` after deleting every `*.tsbuildinfo`:

- `a7765e4` docs: name the Shared Build in CONTEXT.md (`pnpm check` only, since it changes no API: 32 tasks);
- `35d0b30` feat: share a Build and read the Shared Build back (24 suites and 637 tests; `pnpm check` 32 tasks). It was first committed as `5bd2237` and amended with the race test sent past a held table, gated again with the same counts;
- `61ec5fa` feat: record Referrals and count them for the Admin and each Vendor (25 suites, 654 tests; 32 tasks);
- `0131fc1` docs: record Shared Builds and Referrals as ADR-0014 (`pnpm check`);
- `a70eb8d` feat: answer whether each Vendor of a Build gave a WhatsApp number (26 suites, 656 tests; 32 tasks). Its message was amended once, to rewrap a body line commitlint read as a footer; its tree is the one gated;
- the commit that closes this record.

**Decisions where the ticket leaves room**, each following the nearest written rule:

- `part` is required in the body of a share, a list of texts: a request with none is refused by the request's own check, naming `part` with no reason, where `GET v1/build` reads no `part` as an empty Build. `{ part: [] }` is refused as `empty`.
- The stored text is the values joined by commas, which no value holds.
- A Referral is judged in the address's order: the Shared Build, then the Vendor, then its WhatsApp number. A `vendorId` that is not a text is refused by the request's check; one that is not an identifier is `VENDOR_NOT_FOUND`.
- The Admin's list orders names as the Vendors list does, by the database's collation, and its total is the number of Vendors.

**ADR-0014**, `docs/adr/0014-shared-builds-as-frozen-part-values-and-referrals-as-rows.md`, records Shared Builds stored as frozen `part` values, unique by their text, behind a random UUID, never changed or deleted, behind `/{language}/builds/{id}`, and Referrals one row a tap holding nothing about the Shopper, with the options weighed and what must keep working.

**The second view's WhatsApp field, as the owner chose.** The ticket asked each Vendor of `GET v1/build`'s `vendors` to answer whether it gave a WhatsApp number while `builder`'s tests of the views pass unchanged. Two of them, in `build.controller.prices.integration-spec.ts` ("gives each Vendor its total…" and "with no Platform Rate…"), compare each Vendor whole with `toEqual`, so a field answered for every Vendor fails them, and the Shopper's stand-in (`apps/inspector/src/stand-in-api.ts`) builds `BuildVendorResponse` typed by the client, so a required field fails `pnpm check` until the stand-in answers it. This was put to the owner, who answered "Always yes or no (Recommended)": a required boolean answered for every Vendor.

- Each Vendor of the second view answers `hasWhatsAppNumber` (`BuildVendorResponse`). `DatabaseBuildStore.readParts` reads `vendor.whatsapp_number IS NOT NULL` beside each in-stock Visible Offer's Vendor in its one statement, as a `StockingVendor` (`domain/build/in-stock-offers.ts`), an `OfferVendor` that also says whether it gave a number; `BuildVendor` and `PriceViews` carry it. The number itself is never in the answer; a recorded Referral answers it. A Lowest Price's Vendor stays `{ id, name }`.
- The two exact answers in `builder`'s test gained `hasWhatsAppNumber: false` on each expected Vendor, five lines, and nothing else.
- The stand-in answers it from its made-up Vendors' own `whatsAppNumber`, and its own test of the second view gained it the same way, three lines: `true` for Made-up PC Parts, and `false` for Pretend Tech, which already gave none. Ticket 02 makes more of them lack one.
- Its tests are in a file of their own, `build.controller.whatsapp.integration-spec.ts`, so that `builder`'s files change by the field alone: the field answered `true` and `false` for two Vendors of one Part, the number never in the answer and the Lowest Price's Vendor unchanged; and the field following the Vendor's contact details, `false` once its number is cleared and `true` once one is added. Both were red first on the field's absence (`undefined`), then green; `builder`'s two tests then failed on the new field alone, as expected, until each expected Vendor gained it.
- The two faults of the description were not planted again for the new field: the ones shown on `61ec5fa` cover the mechanism, a field the committed description lacks failing the API's own test and a column with no migration failing `check-migrations.mjs`, whatever the field.
