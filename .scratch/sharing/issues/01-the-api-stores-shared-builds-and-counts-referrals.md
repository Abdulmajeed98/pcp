# 01: The API stores Shared Builds and counts Referrals

**Spec:** [the sharing spec](../spec.md)

**What to build:** Anyone, with no Login, can give the API a Build to share. The API answers a Shared Build: a frozen copy of the Build's Parts and quantities, stored once, that never changes. Sharing the same Build again answers the same Shared Build, and any change answers a new one (SHR-1, SHR-4). Anyone can read a Shared Build's Parts back, and record a Referral to a Vendor from it (SHR-6). The Admin can read every Vendor's Referral count, and a Vendor can read only its own (SHR-7). Reading a Build now also says, for each Vendor in the second price view, whether it gave a WhatsApp number.

No page shows any of this yet. Tickets 03 to 05 do. For now the integration tests prove it, written before the code.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] **The word.** **Shared Build** is added to CONTEXT.md under Shoppers and builds before any code uses it, as the spec defines it: a frozen copy of a Build's Parts and quantities, stored by the platform behind a link, which never changes. Its words to avoid are "saved build", "snapshot", "public build" and "build link".
- [ ] **Tests first.** The integration tests below are written before the code for three things, and are seen to fail for the right reason:
  - the Shared Build's identity: the same Build gives the same Shared Build, and any change gives a new one;
  - the frozen copy never changing;
  - counting Referrals, and who may read a count.
- [ ] **Sharing a Build.** `POST v1/shared-builds` takes `{ part: [...] }`, each value as `GET v1/build` takes `part`.
  - It reads the Build through `BuildReading` and leaves out every Part the catalog does not hold.
  - It freezes the rest as `part` values: lower-case identifiers, in the catalog's order of Categories, then the Build's order for kits and drives.
  - It stores them with the moment of sharing, by the API's clock.
  - It answers 201 with `{ id, sharedAt }` for a new Shared Build, and 200 with the stored one when the same text was shared before.
  - The stored text is unique, so two shares of one Build sent at the same moment make one Shared Build. The constraint alone decides that: no read before the insert.
- [ ] **Its refusals**, each 400 `NOT_VALID` naming `part`: every refusal of `GET v1/build`, and `empty` for a Build that is empty once unknown Parts are left out.
- [ ] **Reading a Shared Build.** `GET v1/shared-builds/{sharedBuildId}` answers `{ id, sharedAt, part: [...] }`. An unknown identifier, and text that is not one, are answered 404 `SHARED_BUILD_NOT_FOUND`.
- [ ] **It never changes.** No endpoint changes or deletes a Shared Build. Its Parts are stored as text, with no foreign key to a Part, so a Part that leaves the catalog leaves the Shared Build readable, and `GET v1/build` leaves that Part out as it does for an old cookie. The identifier is a random UUID.
- [ ] **Recording a Referral.** `POST v1/shared-builds/{sharedBuildId}/referrals` takes `{ vendorId }`, stores one Referral holding the Vendor, the Shared Build and the moment by the API's clock, and answers 201 with `{ vendor: { id, name, whatsAppNumber }, referredAt }`. Each call is one Referral. It is refused:
  - 404 `SHARED_BUILD_NOT_FOUND` for an unknown Shared Build;
  - 404 `VENDOR_NOT_FOUND` for an unknown or deactivated Vendor;
  - 400 `NOT_VALID` naming `vendorId`, with the reason `noWhatsAppNumber`, for a Vendor with no WhatsApp number.

  It does not check that the Vendor stocks a Part of the Shared Build. A refused Referral is not stored.
- [ ] **The Admin's counts.** `GET v1/referral-counts`, for the Admin only, answers one page of every Vendor, active and deactivated. Each has its identifier, its name, whether it is active and its Referral count, zeros included. The page is ordered by count, most first, then name, then identifier, and is paged through `PagingRequest`.
- [ ] **A Vendor's own count.** `GET v1/vendors/{vendorId}/referral-count` answers `{ count }` for the Admin and for the Vendor's own Login, through `VendorAccessRule`: another Vendor's is 403 `VENDOR_ACCESS_DENIED`, a deactivated Vendor's own Login gets 403 `VENDOR_DEACTIVATED`, and no token gets 401. No public endpoint answers any count.
- [ ] **The second view's WhatsApp field.** Each Vendor in `GET v1/build`'s `vendors` answers whether it gave a WhatsApp number. Nothing else in the answer changes, and `builder`'s tests of the views pass unchanged.
- [ ] **The public endpoints** are `@Public()`, carry `security: []`, and answer the same with an Admin's token, a Vendor's, a bad one or none.
- [ ] **The code** follows the catalog's conventions:
  - a Command to share a Build and a Command to record a Referral;
  - Queries to read a Shared Build, to list the counts and to read one Vendor's;
  - each with its Input and Output, and its Store port in the domain.
- [ ] **The storage.** One table for Shared Builds and one for Referrals, beside their Stores, with forward-only migrations made by `pnpm db:generate` under names that say what they do. Neither holds anything about the Shopper.
- [ ] **The integration tests** at seam 2 cover each line the spec lists under Sharing a Build, Reading a Shared Build, Recording a Referral, Reading the counts, the second view's WhatsApp field and Tokens. They prove the counts' order on Vendors that tie on each key in turn, and the frozen copy against a changed price, an Offer put out of stock, a deactivated Vendor and an edited Part.
- [ ] **The description.** `pnpm api-client:write` writes the five endpoints and the new field into the committed description and the client. Each of two faults is seen to fail `pnpm check` once and then reverted: a response field added without `pnpm api-client:write`, and a column added to a schema without a migration.
- [ ] **ADR-0014** records the decisions that are costly to undo:
  - Shared Builds stored as frozen `part` values, unique by their text, identified by a random UUID, never changed or deleted, behind `/{language}/builds/{id}`;
  - Referrals stored one row a tap, holding nothing about the Shopper.
- [ ] `pnpm integration:check` and `pnpm check` pass, and the work is committed.
