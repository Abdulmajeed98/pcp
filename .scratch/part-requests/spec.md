# Spec: Part Requests

Status: ready-for-agent

This is `part-requests`, the tenth module in the build order of [the MVP spec](../mvp/spec.md)'s capability map. It comes after `sharing` and before `sheet`. It covers REQ-1 to REQ-4. It makes success criterion 10 true for a Part Request sent from the Vendor portal, and it builds the one endpoint that SHT-6 will use to turn a sheet's row into a Part Request. This spec uses the vocabulary of [CONTEXT.md](../../CONTEXT.md) and follows [ADR-0001](../../docs/adr/0001-seed-catalog-from-buildcores-opendb.md), [ADR-0003](../../docs/adr/0003-three-apps-one-api-keycloak.md), [ADR-0004](../../docs/adr/0004-architecture-per-app.md), [ADR-0005](../../docs/adr/0005-specifications-as-one-document-per-part.md), [ADR-0008](../../docs/adr/0008-language-in-the-address-and-two-message-formats.md), [ADR-0009](../../docs/adr/0009-vendors-in-the-database-logins-in-keycloak.md), [ADR-0010](../../docs/adr/0010-offer-history-kept-apart-from-the-offer.md) and [ADR-0011](../../docs/adr/0011-the-dashboards-look-is-framed-sheet.md). It builds on the conventions that every earlier module recorded in the MVP spec, above all those of `catalog`, `accounts` and `offers`: the Part form, `VendorAccessRule`, acting as a Vendor, `OfferDetails`, the Offer history and the Catalog's kind of list.

On 18 November 2026 the owner confirmed the test seams. They are three that already exist: `pnpm check`, the API from the outside over a real PostgreSQL and Keycloak, and the running platform in a browser. There is no new seam. The Shopper app does not change, so its unit seam is not used. The dashboard's new screens are tested through the browser, so the dashboard still gets no unit-test tool.

Some words need care. A **Part Request** means what CONTEXT.md says, and the first ticket adds its three states to that entry before any code uses them:
- an **open** Part Request is one the Admin has neither fulfilled nor rejected;
- a **fulfilled** Part Request is one the Admin has matched to a Part, whether the Admin created that Part from it or found it in the catalog;
- a **rejected** Part Request is one the Admin turned down with a reason.

Words to avoid: pending, approved, accepted, declined, denied and closed. **The Part Requests screen** is the Admin console's queue of open Part Requests. **The Vendor's Part Requests** is the Vendor portal's list of every Part Request that Vendor has sent.

## Problem Statement

The catalog was imported from BuildCores OpenDB, which is built around the US market. Some Parts that Vendors in Iraq sell are not in it (ADR-0001). When a Vendor searches the portal for such a Part, the search only says that nothing matches. The Vendor cannot add the Part itself, since a wrong specification would break compatibility checking for everyone (CAT-4). So it has to phone or message the Admin and spell out the Part, its code and its price.

The Admin then has to remember that conversation, create the Part, open the Vendor's portal and type the Vendor's prices in again. Nothing records that the Vendor asked, and nothing tells the Vendor whether the Part was added or why not. Until the Part exists, the Vendor's stock of it is invisible to Shoppers. A Shopper looking for that Part finds nothing, even though a shop nearby has it on the shelf.

## Solution

**A Vendor can send a Part Request from its portal.** When its catalog search finds nothing, the empty result offers to ask for the Part to be added, with a form already filled with the search's words and Category. A new Part Requests section in the portal's top bar leads to the same form at any time. The Vendor gives:
- the Part's name;
- its manufacturer part number;
- its Category;
- the Offer it would make: its Quoted Price or prices, whether it is in stock, and its warranty.

The Vendor gives no manufacturer and no specification. Those are the Admin's to give.

**The Vendor sees each of its Part Requests and its state:**
- waiting, with how long it has waited;
- added, naming the catalog's Part and leading to the Vendor's Offer for it;
- not added, with the Admin's reason as the Admin wrote it.

**The Admin console gets a Part Requests screen**, the queue of open Part Requests, oldest first. Opening one shows everything the Vendor sent and offers three ways to resolve it:
- **Match it to a Part**: a catalog search that starts with the request's part number and says when the Vendor already offers a Part it finds.
- **Create the Part**: the form for a new Part, filled with the request's name, part number and Category, which the Admin completes with the manufacturer and specifications as for any Part.
- **Reject it** with a reason.

**Fulfilling a Part Request makes the Vendor's Offer.** When the Admin matches the request to a Part, or creates the Part from it, the Vendor's Offer for that Part is made with the details from the request. The Offer counts as confirmed at the moment the Vendor sent the request, because that is when the Vendor stated its price. If the Admin fulfils the request within 14 days of its sending, the Offer goes live at once. If the Vendor already has an Offer for that Part, the newer of the two statements wins.

The API gains endpoints to send a Part Request and to list a Vendor's own, for the Vendor's Login and for the Admin. It also gains Admin-only endpoints to list the queue, read one request, fulfil one with a Part, and reject one.

## User Stories

### Sending a Part Request

1. As a Vendor whose catalog search finds nothing, I want to ask from that same screen for the Part to be added, so that I do not have to start again elsewhere (REQ-1).
2. As a Vendor asking from an empty search, I want the form filled with my search's words and the Category I searched in, so that I type as little as possible.
3. As a Vendor, I want a Part Requests section in my portal's top bar, so that I can send a request and see my requests at any time (REQ-4).
4. As a Vendor, I want to give the Part's name, its manufacturer part number and its Category, so that the Admin can find out exactly which Part I mean (REQ-1).
5. As a Vendor, I want to give my Quoted Price in USD, in IQD or in both, whether it is in stock, and its warranty, as I would for an Offer, so that my Offer goes live without my typing it again (REQ-1, REQ-3).
6. As a Vendor, I want my prices checked by the same rules as an Offer's, so that a request never holds a price that an Offer could not.
7. As a Vendor typing on a Kurdish or an Arabic keyboard, I want my digits, in prices and in the part number, read as Western digits, as the Offer form reads them.
8. As a Vendor, I want a detail that does not fit to be named beside its field in my language, so that I can correct it.
9. As a Vendor, I want to be asked for no manufacturer and no specification, so that sending a request is quick and the catalog's facts stay the Admin's (CAT-4).
10. As a Vendor, I want to return to my Part Requests after sending, with a note naming the request, so that I know it was sent.
11. As the Admin acting as a Vendor in its shop, I want to send a Part Request for that Vendor, so that I can set the Vendor up on the spot (ACC-6).
12. As a Vendor, I want no other Vendor to see or send my Part Requests, so that what I stock stays between me and the platform.

### Following my Part Requests

13. As a Vendor, I want my Part Requests listed newest first, each with its Category, name, part number, prices, stock, warranty and when I sent it, so that I can see what I asked for (REQ-4).
14. As a Vendor, I want an open request to say that it is waiting and for how many days, so that I know it has not been forgotten.
15. As a Vendor, I want a fulfilled request to name the Part as the catalog holds it and lead to my Offer for it, so that I can check my price and change it.
16. As a Vendor whose Offer from a fulfilled request I have since removed, I want the request still to say it was added, without a link that leads nowhere.
17. As a Vendor, I want a rejected request to show the Admin's reason as the Admin wrote it, so that I understand why it was not added.
18. As a Vendor whose request was rejected, I want to be able to send a corrected one, so that a mistake does not end the matter.
19. As a Vendor with many requests, I want the list paged, as my Offers are.
20. As a Vendor reading Kurdish or Arabic, I want the list right to left, every number in Western digits, and what I and the Admin wrote shown as written (LANG-2, LANG-4, LANG-5).

### The Admin's queue

21. As the Admin, I want a queue of open Part Requests, oldest first, so that I deal with them in the order they came (REQ-2).
22. As the Admin, I want each row to name the Vendor as it wrote its name, mark a Deactivated Vendor, and give the request's Category, name, part number and days waiting, so that I can choose where to start.
23. As the Admin, I want the Part Requests screen in the sidebar and the menu sheet beside the other sections, so that I can reach it from anywhere in the console.
24. As the Admin with no open request, I want the queue to say there is nothing to do, as Missing specifications does.
25. As the Admin, I want to open one request and see everything the Vendor sent, its prices among them, so that I can resolve it without asking the Vendor again.
26. As the Admin opening a request sent more than 14 days ago, I want to be told that its Offer will be listed as expired until the Vendor confirms it, so that I can remind the Vendor.
27. As the Admin, I want each row to lead to the Vendor's page, so that I can contact the Vendor when I need to.
28. As the Admin, I want resolved requests to leave the queue, so that it holds only work still to do.

### Matching a request to a Part

29. As the Admin, I want to search the whole catalog from a request, starting with its part number, so that I find the Part the Vendor missed (REQ-2).
30. As the Admin, I want the search to show whether the Vendor already offers each Part it finds, so that I know what fulfilling will do.
31. As the Admin, I want to match the request to a Part of any Category, so that a Vendor's wrong Category does not stop me.
32. As the Admin, I want matching to make the Vendor's Offer for that Part with the details from the request, so that its Offer goes live without my typing it (REQ-3).
33. As the Admin matching a Part the Vendor already offers, I want the Offer kept as it is when the Vendor confirmed it after sending the request, and replaced by the request's details when it did not, so that the Vendor's newer statement wins, and I want to be told which happened.

### Creating the Part from a request

34. As the Admin, I want to create the Part from the request, with the form for a new Part filled with its name, part number and Category, so that I start from what the Vendor gave (REQ-2).
35. As the Admin, I want to change the Category before creating, so that a Vendor's wrong Category does not create a wrong Part.
36. As the Admin, I want to give the manufacturer and the specifications as for any new Part, so that the new Part is checked by the Compatibility Rules like every other (CAT-5).
37. As the Admin, I want creating the Part to fulfil the request as well, so that the Part and the Vendor's Offer exist after one action of mine.
38. As the Admin whose Part was created but whose request could not then be fulfilled, I want to be told, and to fulfil it with that Part, so that I never create the Part twice.
39. As the Admin, I want to be led to the new Part's page after creating it, so that I can add its photo now that it has its first Offer (CAT-6).
40. As the Admin, I want a Part created without a needed specification to appear on Missing specifications once its Offer exists, so that I fill it in later (CAT-8).

### Rejecting a request

41. As the Admin, I want to reject a request with a reason, so that the Vendor knows why its Part was not added (REQ-2).
42. As the Admin, I want the reason required, so that no Vendor is turned down without one.
43. As the Admin, I want to confirm once before rejecting, so that a slip of the thumb does not reject a request.

### The Offer a fulfilment makes

44. As a Vendor, I want my Offer from a fulfilled request to count as confirmed when I sent the request, so that Shoppers are told truly how old my price is (OFF-7).
45. As a Shopper, I want a Part added this way to appear with its Vendor's Offer like any other Visible Part, so that I can find it and compare it (CAT-7).
46. As the owner, I want every Offer that a fulfilment makes or changes recorded in the Offer history, as every Offer is, so that no price change goes unrecorded (OFF-10).
47. As the Admin fulfilling a request of a Deactivated Vendor, I want its Offer made all the same, hidden from Shoppers until the Vendor is reactivated (ACC-7).
48. As a Vendor, I want my Offer from a fulfilled request to appear on my Offers screen, in my counts and in my expiry banner, like any Offer I added myself.

### Getting it right once

49. As the Admin, I want a request resolved only once, even if I tap twice or resolve it from two tabs, so that a Vendor never gets two answers.
50. As the Admin opening a resolved request from an old link, I want to see how it was resolved, with no way to resolve it again.
51. As the owner, I want no path through Part Requests that lets a Vendor create or edit a Part (CAT-4, the Boundaries).

### Phones and languages

52. As a Vendor on a phone 360 pixels wide, I want the Part Request form, my Part Requests and the empty search's new action usable with a thumb in each language (LANG-8, success criterion 13).
53. As the Admin on my phone in a Vendor's shop, I want the queue, a request and its three ways usable at 360 pixels, as every Admin screen is.

### The owner

54. As the owner, I want the new pieces designed in the dashboard's chosen look, with the options rendered and chosen by eye, so that the dashboard stays one object.
55. As the owner, I want the Kurdish and Arabic texts of this module drafted and kept for my review before launch (LANG-7).
56. As the owner, I want this module's phone checks recorded as waiting for hosting, so that they do not hold the module back.
57. As the person who builds `sheet`, I want sending a Part Request to be one endpoint that any screen can fill, so that a sheet's row becomes a Part Request through it (SHT-6).

## Implementation Decisions

### What this module is and is not

- It covers REQ-1 to REQ-4. It makes success criterion 10 true for a Part Request sent from the portal. `sheet` makes criterion 9's row that can be turned into a Part Request, through this module's endpoint.
- It changes no Compatibility Rule, no price rule, no expiry rule and nothing a Shopper reads. A fulfilment makes an Offer, and every Shopper page shows it by the existing rules.
- It sends no message. The Vendor learns of a resolution in its portal, and the Admin may contact the Vendor from its page as before.
- It adds no new way to create a Part. Creating a Part from a request uses the catalog's own endpoint, so a Vendor still never creates or edits one (CAT-4).

### The design comes first

- The new Vendor portal pieces are:
  - the Part Requests section in the top bar, the third beside Offers and Details;
  - the Vendor's Part Requests list, with its three states;
  - the Part Request form;
  - the empty catalog search's action that opens the form.
- The new Admin console pieces are:
  - the Part Requests screen, the seventh section;
  - the screen for one request, with its three ways;
  - the request's catalog search for matching;
  - the form for a new Part opened from a request;
  - the rejection's dialog.
- No new direction is dealt, since the dashboard stays Framed sheet (ADR-0011). Impeccable adds to the dashboard's DESIGN.md whatever it lacks before anything is built.
- Each skill leads its own area, as [the design skills guide](../../docs/agents/design-skills.md) records:
  - Taste leads the composition, the request's screen and its three ways above all.
  - Impeccable leads the copy, right to left and accessibility. The copy covers the three states, the warning about an expired Offer, a kept or replaced Offer, and the halfway case of a created Part.
  - Emil Kowalski's skills lead the motion and the feel on a phone, a row leaving the queue among them.
  - `break-ui` runs on both lists and the request's screen, with the worst cases below.
- The options for each piece are rendered in the built-in browser with the made-up shop's data, the portal's in Kurdish and English, at a phone's width and a desk's, one option to an anchor and two columns at most. The owner chooses by eye.
- The queue is the Catalog's kind of list, like Expiring Offers and Referrals. Whether the open count shows in the sidebar, and how the three ways stand on the request's screen, are for the design ticket to propose and the owner to choose.
- The hard rules hold. A piece that pulls against one is put to the owner. An ADR on the look is written only if a choice replaces part of ADR-0011.
- The API's endpoints can be built while the design is chosen. No screen is built before its design is recorded.

### A Part Request

- **What it holds.** The Vendor, the Category, the name, the manufacturer part number, the Offer's details (the USD price, the IQD price, in stock and the warranty), the moment it was sent by the API's clock, and its state. Once fulfilled, it also holds the Part and the moment it was resolved. Once rejected, it holds the reason and the moment. It holds no manufacturer and no specification.
- **The checks**, in the form's order, each refusal naming its `field` with a reason as `NOT_VALID`:
  - `category`: one of the eight, else `missing` or `notInTheSet`;
  - `name`: kept as written, more than spaces, at most 300 Unicode code points, else `missing` or `tooLong`;
  - `partNumber`: cleaned as the catalog cleans a part number, with invisible marks stripped and the space around it trimmed, then at least one character and at most 100 code points, else `missing` or `tooLong`;
  - the Offer's details: checked by `OfferDetails.check`, written once, with its fields and reasons (`usdPrice`, `iqdPrice`, `inStock`, `warrantyMonths`).
- **The part number is required.** It is how the Admin finds the Part, and how `sheet` matches a row (SHT-2), so a Part created from a request carries it.
- **It is never changed by the Vendor and never deleted.** A Vendor that made a mistake sends another request. The Admin rejects the mistaken one or fulfils it, and the Vendor edits the Offer afterwards. A rejected request is never reopened.
- **When it was sent.** It answers `sentAt`, the moment, and `sentOn` with `daysSinceSent`, the day in Iraq's time and the calendar days since it, by the rule `sharing` wrote once for a Shared Build's day. So no frontend counts days.
- **Storage.** One new table, `part_request`, with a forward-only migration generated by drizzle-kit. Prices are stored as an Offer's are: USD in cents and IQD in whole dinars, with at least one of the two. Database checks tie each state to what it must hold: a fulfilled request has a Part, a rejected one has a reason, and every resolved one has its moment. It has one index for the queue (state, then the moment sent) and one for a Vendor's list (Vendor, then the moment sent). No ADR is expected: undoing any of these decisions loses no data. The last ticket judges again with what the tickets found.

### Fulfilling a Part Request

- **One action for both ways.** Fulfilling takes a request and a Part, whether the Admin found the Part in the catalog or has just created it. "Create the Part" is the catalog's own create, `POST v1/parts`, followed by fulfilling with the new Part. This is the order that is safe if the second step fails, as `accounts` orders its Commands. A Part created whose fulfilment then fails leaves the request open and the Part in the catalog. The screen says so and offers to fulfil it with that Part, so the Part is never created twice.
- **What it does to the Offer.** In one transaction it locks the request's row, checks that the request is still open, writes the Offer, and marks the request fulfilled with the Part and the moment. So two fulfilments at once, or a fulfilment and a rejection at once, resolve the request once, and the other is refused.
  - **The Vendor has no Offer for the Part:** the Offer is made with the request's prices, stock and warranty. Its Confirmation is the moment the request was sent, and it was made now, by the API's clock. Its Offer history row is `created`, at now, by the Caller's Login: the Admin's.
  - **The Vendor's Offer was last confirmed before the request was sent:** the request's details replace the Offer's prices, stock and warranty, as an edit does, and its Confirmation becomes the moment the request was sent. The history gains a `changed` row only when a price or the stock changed, as for every edit.
  - **The Vendor's Offer was confirmed at or after the moment the request was sent:** the Offer is kept as it is, since the Vendor's own later statement wins, and the request is still fulfilled.
  - The answer says which of the three happened: `created`, `replaced` or `kept`.
- **The Confirmation is the Vendor's statement.** CONTEXT.md defines a Confirmation as the Vendor saying that a price is correct "as of that moment", and the Vendor said so when it sent the request. A request fulfilled more than 14 days after it was sent therefore makes an Expired Offer. That Offer is listed in the portal as expired, appears on Expiring Offers and its banner, and goes live when the Vendor confirms it. The request's answer says when this would happen, `offerWouldBeExpired`, by the expiry rule written once, so that the Admin's screen can warn the Admin and no frontend holds the 14 days.
- **Whatever the Vendor's state.** A request of a Deactivated Vendor can be fulfilled or rejected. Its Offer is made, and it is hidden from Shoppers by the visibility rule until the Vendor is reactivated.
- **Any Part, any Category.** The Part need not be of the request's Category. The request keeps the Category the Vendor gave, and the Part keeps its own.

### Rejecting a Part Request

- The reason is required, kept as written, more than spaces and at most 300 code points (`missing`, `tooLong`), shown to the Vendor `AsWritten`. The Admin console is in English, but the Admin may write the reason in any language.
- Like fulfilling, rejecting locks the row and checks that the request is still open.

### The API

| Endpoint | Who may call it | What it does |
|---|---|---|
| `POST v1/vendors/{vendorId}/part-requests` | Admin, the Vendor's own Login | Takes `{ category, name, partNumber, usdPrice, iqdPrice, inStock, warrantyMonths }`, the Offer's details as an Offer takes them. Answers 201 with the Part Request |
| `GET v1/vendors/{vendorId}/part-requests` | Admin, the Vendor's own Login | One page of the Vendor's Part Requests in every state, newest first, then by identifier |
| `GET v1/part-requests` | Admin | One page of open Part Requests of every Vendor, oldest first, then by identifier, each with its Vendor `{ id, name, active }` |
| `GET v1/part-requests/{partRequestId}` | Admin | One Part Request in any state, with its Vendor |
| `POST v1/part-requests/{partRequestId}/fulfil` | Admin | Takes `{ partId }`, fulfils the request and makes or keeps the Offer, answering 200 with the Part Request and `offer: 'created' \| 'replaced' \| 'kept'` |
| `POST v1/part-requests/{partRequestId}/reject` | Admin | Takes `{ reason }`, rejects the request, answering 200 with the Part Request |

- **Every Part Request answers** its identifier, Category, name, part number, both Quoted Prices as an Offer answers them, in stock, warranty, `sentAt`, `sentOn`, `daysSinceSent`, `state` (`open`, `fulfilled` or `rejected`) and `offerWouldBeExpired`. A fulfilled one adds the Part, as the catalog's `PartSummaryResponse`, and `offerId`, the Vendor's Offer for that Part now or null. A rejected one adds `reason`. Every resolved one adds `resolvedAt`.
- **Who may do what.** The two Vendor endpoints go through `VendorAccessRule`: another Vendor's address is 403 `VENDOR_ACCESS_DENIED`, a Deactivated Vendor's own Login 403 `VENDOR_DEACTIVATED`, and no token 401. The Admin may act for any Vendor, so an unknown Vendor is 404 `VENDOR_NOT_FOUND` for the Admin. The four Admin endpoints carry `@PreAuthorize([Role.ADMIN])`, so a Vendor's token is answered 403 `ACCESS_DENIED`.
- **Refusals**, in this order of checks:
  - an unknown request, or text that is not an identifier, is 404 `PART_REQUEST_NOT_FOUND`, the second without asking the database;
  - a request already fulfilled or rejected is 400 `PART_REQUEST_RESOLVED`, so that a screen can show how it was resolved;
  - for a fulfilment, an unknown Part is 404 `PART_NOT_FOUND`, as an Offer's create refuses it;
  - a reason that does not fit is 400 `NOT_VALID` naming `reason`.
- **The use cases** follow the catalog's conventions over one port, `PartRequestStore`: `SendPartRequestCommand`, `FulfilPartRequestCommand`, `RejectPartRequestCommand`, `ListVendorsPartRequestsQuery`, `ListOpenPartRequestsQuery` and `ReadPartRequestQuery`. Each list reads its page and its total in one snapshot, through `core`'s `PagingRequest`. The Offer is written through the Offer module's own writing of an Offer and its history, not a second copy of it, in the fulfilment's transaction. `OfferStore.readByPart`, kept since `offers` for this module and `sheet`, finally gets its caller and its tests.
- The client's functions are named after the controllers' methods and are unique: `sendPartRequest`, `listVendorsPartRequests`, `listOpenPartRequests`, `readPartRequest`, `fulfilPartRequest` and `rejectPartRequest`.

### The Vendor portal

| Address, relative to the portal's frame | What it is |
|---|---|
| `part-requests` | The Vendor's Part Requests, the top bar's second section, between Offers and Details |
| `part-requests/new` | The Part Request form |

- **The form** is React Hook Form's, with the Category chosen from the API's eight and the Offer form's own price, stock and warranty fields, taken from the `offer-form` feature or moved down a layer where Feature-Sliced Design asks it, not copied. Digits go through `westernDigitsIn`, in the part number too, as in the Offer form. A refusal is said beside its field. Sending returns to `part-requests` with a note naming the request, carried in the address's state, as adding an Offer returns to the search.
- **From the empty search.** The catalog search's empty result gains an action that opens the form with the search's words as the name and the search's Category, carried in the address, so that the form survives a reload. The Vendor corrects either before sending.
- **The list** is paged, 20 a page, its page in the address, newest first. Each request shows:
  - its Category's name;
  - its name and part number `AsWritten`;
  - its prices on plates as the portal shows an Offer's, with its stock and warranty;
  - when it was sent;
  - its state: waiting with its days; added with the catalog's name of the Part `AlwaysEnglish` and a link to `offers/<offerId>` while that Offer exists; or not added with the reason `AsWritten`.

  With none, it says no request has been sent and offers the form.
- **Under either frame.** Every link is relative to the route, so the Admin acting as the Vendor sees and sends the same, under the band.
- **The query keys.** Every query about Part Requests is under one key, `['part-requests']`, in the dashboard's shared query keys, so that a send, a fulfilment or a rejection asks both lists and the request's screen again. A fulfilment also asks the Vendor's Offers again through `askAgainAfterAChangeToTheOffers`, and every query about Parts again, so that Missing specifications and the search's `offerId` follow.
- **Words.** Every new text of the portal is in the `i18n` library's dashboard set in all three languages, with `words.md`'s term Part Request and the words for its three states. The Kurdish and Arabic drafts wait for LANG-7. No message formats a number: days and counts reach it as text written by `formatNumber`.

### The Admin console

| Address | What it is |
|---|---|
| `/part-requests` | The Part Requests screen, the queue, the seventh section |
| `/part-requests/{partRequestId}` | One request, with Match it to a Part, Create the Part and Reject |
| `/part-requests/{partRequestId}/new-part` | The form for a new Part, filled from the request |

- **The queue** is the Catalog's kind of list, drawn by `PagedList` with its page in the address, 20 a page. Each row:
  - names the Vendor `AsWritten`, with `DeactivatedMark` for a Deactivated Vendor and `VendorLink` to its page;
  - gives the request's Category, its name and part number `AsWritten`, and its days waiting;
  - leads to the request.

  With none, `NothingToDo` says so. A refusal and an API that cannot be reached say that the Part Requests could not be listed, with `WhyNotAnswered`. The screen is in English, as all of the Admin console is.
- **One request** shows everything the Vendor sent, its prices on the Rate Board's plates, the warning when `offerWouldBeExpired` says so, and its three ways. A resolved request, opened from an old link or after a refusal of `PART_REQUEST_RESOLVED`, shows how it was resolved and offers nothing.
- **Match it to a Part** searches the catalog through `GET v1/parts`, with the request's part number as its first search and its Vendor as `vendorId`, so that each Part found says whether that Vendor offers it already. Choosing a Part asks once, saying what fulfilling will do, then fulfils.
- **Create the Part** is the `part-form` feature filled with the request's name, part number and Category, the Category changeable. Saving creates the Part, then fulfils the request with it, and leads to the new Part's page to add its photo, with a note saying what happened to the Offer. If the fulfilment is refused or not answered, the screen says that the Part was created and the request is still open, and offers to fulfil it with that Part.
- **Reject** is shadcn/ui's alert dialog with the reason's field. It says a refusal and stays open until the rejection is done.
- After a resolution the Admin returns to the queue, the resolved row leaving it as rows leave a list (`useLeavingRows`), with a note naming the request and how it was resolved.
- The sidebar and the menu sheet gain Part Requests, with an icon of lucide's that the design ticket chooses. `admin-platform-rate.spec.ts`, which lists the sections exactly, gains it.

### The inspector

- The dashboard's made-up shop answers the three reads, the queue, one request and a Vendor's list, a page at a time in the API's order, typed against `api-client`, and refuses every write as before. Its made-up Part Requests are in every state:
  - open ones, one sent 40 days ago with its Offer would-be-expired;
  - a fulfilled one whose Offer exists, and one whose Offer was removed;
  - a rejected one with a long reason.

  They include requests of the shop's Vendor, for its portal, and of other Vendors, a Deactivated one among them, for the queue.
- `pnpm dashboard:inspect --part-requests worstCase|one|none` answers the lists at their worst, with one request or with none, for `break-ui`, as `--referrals` does. The worst cases are:
  - the longest name and part number the API takes, and a name with no space;
  - names in Kurdish and Arabic script;
  - a name that starts with a digit;
  - prices at their limits, in both currencies;
  - a 300-character reason in Kurdish;
  - a request waiting hundreds of days;
  - a queue of thousands.
- No test of the platform relies on the made-up shop.

### Recording

- The first ticket adds the three states to CONTEXT.md's **Part Request**, and their words to `words.md`.
- The last ticket:
  - verifies the module from a fresh clone;
  - records **The part-requests module's conventions** in the MVP spec, and amends **The offers module's conventions**: an Offer made by a fulfilment is confirmed at its request's sending, so its Confirmation can be earlier than the moment it was made;
  - adds the module's phone checks to **Checks on a phone wait for hosting**;
  - adds the made-up Part Requests and `--part-requests` to the design skills guide and to the Commands table.

## Testing Decisions

A good test sees the platform from the outside, as a Vendor, the Admin, a Shopper or `sheet` would: through the API's HTTP surface or through a browser. It never reads a query's SQL, a table's columns or a helper behind a module's public face. The one exception that `offers` set stays the only one here: the Offer history is read from the database with `offerHistoryRows()`, since no endpoint answers it. A test that would still pass if a fulfilment made two Offers proves nothing about what a Shopper sees.

The owner confirmed the three seams on 18 November 2026. Tests are written before the code where a mistake would mislead a Vendor, a Shopper or the Admin:
- the Offer a fulfilment makes, keeps or replaces, and its Confirmation;
- a request resolved once only;
- who may send, read and resolve a Part Request.

### Seam 1: the repository root, through `pnpm check`

- **The description.** The committed OpenAPI document and the generated client match the API, with the six new endpoints.
- **The migration.** The new table's migration matches its schema.
- **The language files.** Every new Vendor portal text is in all three languages.
- **The made-up shop.** The inspector's made-up Part Requests type-check against `api-client`.
- **The import bans.** The new slices, and any piece moved down a layer, keep Feature-Sliced Design's rules.

Each new line is seen to fail once, through a deliberate fault that is then reverted:
- a field added to a response without `pnpm api-client:write`;
- a column added to the schema without a migration;
- the Arabic text of a state removed.

### Seam 2: the API from the outside, over a real PostgreSQL and a real Keycloak

`pnpm integration:check`. Vendors, Parts and Offers are made through the API. Nothing is mocked but the API's clock, which `moveTheClockTo` moves.

**Sending a Part Request**

- A Vendor's own Login sends one, answered 201 with every detail, `open`, and the moment by the API's clock. The Admin sends one for any Vendor, a Deactivated one among them.
- Each detail that does not fit is refused naming its field and reason, the first in the form's order. The Offer's details are refused as an Offer's are.
- A part number loses its invisible marks and its surrounding space. A name is kept as written.
- Another Vendor's address is 403 `VENDOR_ACCESS_DENIED`, a Deactivated Vendor's own Login 403 `VENDOR_DEACTIVATED`, no token 401, and an unknown Vendor 404 for the Admin.

**Reading the lists**

- A Vendor's list holds its own requests in every state, newest first and then by identifier, proved on requests sent at the same moment, and pages through the catalog's paging. It holds no other Vendor's.
- The queue holds open requests of every Vendor, active and deactivated, oldest first and then by identifier. A fulfilled or rejected request leaves it. A Vendor's token is 403 `ACCESS_DENIED`.
- `sentOn` and `daysSinceSent` are the day in Iraq and the calendar days since it, proved at Iraq's midnight by the moved clock.
- `offerWouldBeExpired` turns true one millisecond past 14 days after the sending, by the expiry rule.
- One request reads in every state. An unknown one, and text that is not an identifier, are 404 `PART_REQUEST_NOT_FOUND`.

**Fulfilling**

- **No Offer before.** The Vendor's Offer is made with the request's prices, stock and warranty. Its Confirmation is the moment sent and its making is now. One history row is `created`, by the Admin's Login. The answer says `created`, and the request answers `fulfilled`, the Part, the moment and `offerId`.
- **It goes live.** Within 14 days of the sending, `GET v1/parts/{partId}/offers` answers the Offer as a Visible Offer, with its days since Confirmation counted from the sending. Past them, the Offer is listed as expired in the Vendor's Offers and is not visible, until confirming all makes it visible.
- **An older Offer.** A Vendor's Offer confirmed before the sending is replaced, with the Confirmation moved to the sending and a `changed` history row only when a price or the stock changed. The answer says `replaced`.
- **A newer Offer.** An Offer confirmed at or after the sending is kept unchanged, with no history row. The answer says `kept`.
- **A Deactivated Vendor's request** is fulfilled, and its Offer is not visible until the Vendor is reactivated.
- **Any Category.** A Part of another Category than the request's fulfils it.
- **Refusals.** An unknown Part is 404 `PART_NOT_FOUND`, and the request stays open. A resolved request is 400 `PART_REQUEST_RESOLVED`.
- **Once only.** Two fulfilments sent at once fulfil once and make one Offer, and the other is refused `PART_REQUEST_RESOLVED`. The same holds for a fulfilment and a rejection sent at once.
- **The later list.** A fulfilled request's `offerId` is null in the Vendor's list once the Vendor removes that Offer.

**Rejecting**

- A reason is kept as written, and the request answers `rejected`, the reason and the moment. A missing or too-long reason is refused naming `reason`. A resolved request is refused.

Prior art:
- `offers`' `offer.controller.integration-spec.ts` for an Offer's details, its refusals, its history with `offerHistoryRows()` and the clock moved with `moveTheClockTo`;
- `accounts`' tests of `VendorAccessRule` for who may act;
- `sharing`'s `shared-build.controller.integration-spec.ts` for requests sent at once while a table is held, and for the day in Iraq;
- `referral.controller.integration-spec.ts` for an Admin list's order on ties and its paging.

### Seam 3: the running platform, from the outside

`pnpm platform:check`, in Chromium. Each test makes its own made-up Vendors and Parts through the API, and its own made-up part numbers, unique to the run. It compares what a screen shows with what the API answers, and never quotes a translation. The development database keeps earlier runs' requests, so a test finds its own on the queue from its last page back, as Expiring Offers' and Missing specifications' tests do: the queue is oldest first, so a new request comes last.

**The Vendor portal, in a window 360 pixels wide, in Kurdish, Arabic and English**

- **Sending from the empty search.** A Vendor searches for a made-up part number that nothing matches, opens the form from the empty result with the words and the Category filled, completes it and sends it. It lands on its Part Requests with the request waiting.
- **Sending from the section.** The same, from the top bar's section.
- **A refusal.** A request with no price is refused beside the price.
- **The three states.** After the Admin fulfils one request, rejects another and leaves a third, the Vendor's list shows "added" leading to its Offer, the reason as written, and "waiting".
- **The Offer.** The fulfilled request's Offer is on the Vendor's Offers screen with the request's prices.
- **Acting as the Vendor.** The Admin sends a request for the Vendor under the band, and the Vendor's own portal lists it.
- **Language and layout.** Kurdish and Arabic are right to left, every number is in Western digits, what was written is shown as written, and `expectNoSidewaysScroll` passes.

**The Admin console**

- **Creating the Part.** The Admin finds the Vendor's request on the queue, opens it, creates the Part with the form filled from the request, and lands on the new Part's page. The request has left the queue. The Shopper's Part page for that Part lists the Vendor's Offer at the request's price (success criterion 10, for a request sent from the portal).
- **Matching.** For another request, the Admin searches from the request, sees that the Vendor already offers one Part found, matches another Part, and the Vendor's Offer for it appears.
- **Rejecting.** For a third request, the Admin rejects with a reason after the dialog's confirmation, and the reason reaches the Vendor's list.
- **A resolved request.** Opening a resolved request's address shows how it was resolved and offers nothing.
- **The halfway case.** With `page.route` answering the fulfilment once as unreachable, creating the Part says the Part was created and the request is still open. Fulfilling it with that Part then succeeds, and the catalog holds one such Part.
- **The sections.** The sidebar and the menu sheet list Part Requests.

**Accessibility, motion and the inspector**

- `expectAccessible` passes in the light and the dark scheme on:
  - the Vendor's Part Requests in each state and with none;
  - the form with a refusal shown;
  - the empty search with its new action;
  - the queue with rows and with none;
  - one request with its warning;
  - the match search;
  - the new-Part form opened from a request;
  - the rejection's dialog with a refusal shown.
- The motion the design adds, a row leaving the queue among it, is filmed with `film` and judged by `snapsOf`, with reduced motion and without it.
- Taste's inspector, at 1440, 768 and 390 pixels, in both schemes, and at 1024 and 1280 for desk layouts that change between them: `pnpm dashboard:inspect` on the queue, on one request, and on the portal's list and form in Kurdish and English, with the made-up Part Requests and with `--part-requests`.
- Every FAIL is fixed, and every WARN is fixed or defended in the ticket's Comments.

Prior art:
- `vendor-offers.spec.ts` and the `offers.ts` helpers for the catalog search, the Offer form and its refusals;
- `admin-missing-specifications.spec.ts` and `admin-expiring-offers.spec.ts` for an Admin list found among earlier runs' rows;
- `admin-referrals.spec.ts` and `vendor-referral-count.spec.ts` for a screen in each half;
- `dashboard-languages.spec.ts` with `readInEveryLanguageOfTheVendorPortal` for the portal's three languages;
- `shopper-part-languages.spec.ts` for reading a Part page;
- `aMadeUpVendorThatHasLoggedIn` and `createAMadeUpPart`.

## Out of Scope

- **Changing a Part Request.** Editing, withdrawing, reopening or deleting one, by the Vendor or by the Admin, and undoing a fulfilment or a rejection.
- **More in a request.** A photo, a link, a note, the manufacturer or any specification sent by the Vendor.
- **Messages.** Any message the platform sends about a request, to the Vendor or the Admin (the MVP's scope).
- **More for the Admin.** A list of resolved requests across Vendors (each Vendor's are seen through its portal), counts or statistics of requests, merging several Vendors' requests for one Part, and finding duplicates for the Admin.
- **Refusing a request for a Part the catalog holds.** The API does not search the catalog when a request is sent. The Admin matches such a request to the Part.
- **Anything a Shopper sees beyond the Offer.** No Shopper page changes.
- **The sheet.** Turning a sheet's row into a Part Request (SHT-6) is `sheet`'s, through this module's endpoint.

## Further Notes

- **Decisions this spec takes that the owner may want to revisit.** Each follows the MVP spec's words where they leave room:
  - **An Offer made by a fulfilment is confirmed when the request was sent**, not when it was fulfilled, so a request older than 14 days makes an Expired Offer that the Vendor must confirm.
  - **The newer statement wins** when the Vendor already has an Offer for the matched Part: an Offer confirmed after the request was sent is kept, an older one is replaced.
  - **Create the Part is two calls**, the catalog's create and then the fulfilment, rather than one endpoint that does both, with the halfway case handled on the screen.
  - **The part number is required** in a request.
  - **The search's words fill the name**, not the part number.
  - **The queue lists only open requests.** Resolved ones are seen in each Vendor's portal.
  - **The Admin may change the Category** of the Part created from a request, and may match a Part of another Category.
  - **A Deactivated Vendor's request** can be fulfilled, and its Offer waits for the Vendor's reactivation.
  - **The reason for a rejection** is free text, shown to the Vendor as written.
  - **A Vendor cannot withdraw or edit** a request.
- **Costly to undo.** Little. The new table holds what Vendors ask, and nothing links to it from outside the platform. Undoing a rule of this module is a change of code that loses no data, which is why no ADR is expected.
- **Success criteria.** This module makes criterion 10 true for a Part Request sent from the portal. `sheet` completes criteria 9 and 10 together, turning an uploaded row into a request. This module adds the Vendor's Part Requests and the Part Request form to criterion 13.
- **Open checks.** This module's checks on a phone wait for hosting, as every module's do:
  - the Part Request form used with a thumb in Kurdish and in English, a price and a part number typed on a Kurdish and on an Arabic keyboard among it, and the empty search's action reached with a thumb;
  - the Vendor's Part Requests read on a phone, a long reason in Kurdish among them;
  - the queue, one request and its three ways used with a thumb at 360 pixels in a Vendor's shop, the match search with the phone's keyboard;
  - the motion felt on a real phone, with reduced motion on and off.
- **LANG-7.** The Kurdish and Arabic texts this module adds, its three states among them, join the review that stays open until launch.
- **Next steps.** `sheet` follows. It reads its rows' part numbers against the catalog, including those of Parts created from Part Requests, and turns a row that matches no Part into a Part Request through `POST v1/vendors/{vendorId}/part-requests`.
