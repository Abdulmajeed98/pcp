# 04: The Admin works the Part Requests queue

**Spec:** [the part-requests spec](../spec.md)

**What to build:** The Admin opens Part Requests, the Admin console's seventh section, and sees the queue of open Part Requests, oldest first (REQ-2). Opening one shows everything the Vendor sent. If the request was sent more than 14 days ago, the screen warns that its Offer will be listed as expired. The request offers three ways to resolve it:

- **Match it to a Part.** A catalog search starts with the request's part number and says when the Vendor already offers a Part it finds. Choosing a Part fulfils the request with it.
- **Create the Part.** The form for a new Part comes filled with the request's name, part number and Category. Saving creates the Part, fulfils the request with it, and leads to the new Part's page for its photo (CAT-6).
- **Reject it** with a reason, after one confirmation.

A fulfilment makes the Vendor's Offer go live (REQ-3), which a Shopper sees on the Part's page. This makes success criterion 10 true for a Part Request sent from the portal.

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [ ] **The section.** The sidebar and the menu sheet gain Part Requests, with the icon ticket 02 recorded. `admin-platform-rate.spec.ts`, which lists the sections exactly, gains it.
- [ ] **The queue,** at `/part-requests`, is the Catalog's kind of list, drawn by `PagedList` with its page in the address, 20 a page. Each row:
  - names the Vendor `AsWritten`, with `DeactivatedMark` for a Deactivated Vendor and `VendorLink` to its page;
  - gives the request's Category, its name and part number `AsWritten`, and its days waiting;
  - leads to the request.

  With none, `NothingToDo` says so. A refusal and an API that cannot be reached say that the Part Requests could not be listed, with `WhyNotAnswered`. The queue shows the count of open requests as ticket 02 recorded.
- [ ] **One request,** at `/part-requests/{partRequestId}`, shows everything the Vendor sent:
  - its prices on the Rate Board's plates;
  - the warning when `offerWouldBeExpired` says so;
  - its three ways, as ticket 02 recorded.

  A resolved request shows how it was resolved and offers nothing, whether it was opened from an old link or reached after a `PART_REQUEST_RESOLVED` refusal.
- [ ] **Match it to a Part** searches through `GET v1/parts`. Its first search is the request's part number, and it passes the request's Vendor as `vendorId`, so that each Part found says whether that Vendor already offers it. Choosing a Part asks once, saying what fulfilling will do, then fulfils.
- [ ] **Create the Part,** at `/part-requests/{partRequestId}/new-part`, is the `part-form` feature filled with the request's name, part number and Category, the Category changeable.
  - Saving creates the Part through `POST v1/parts`, then fulfils the request with it.
  - It leads to the new Part's page with a note saying what happened to the Offer: `created`, `replaced` or `kept`.
  - If the fulfilment is refused or not answered, the screen says that the Part was created and the request is still open. It offers to fulfil the request with that Part, so the Part is never created twice.
- [ ] **Reject** is shadcn/ui's alert dialog with the reason's field. It says a refusal and stays open until the rejection is done.
- [ ] **After a resolution** the Admin returns to the queue, with a note naming the request and how it was resolved. The resolved row leaves as rows leave a list (`useLeavingRows`). The Create the Part path leads to the new Part's page instead.
- [ ] **The query keys.** A fulfilment or a rejection asks `['part-requests']` again. Whichever of tickets 03 and 04 lands first adds the key. A fulfilment also asks again:
  - the Vendor's Offers, through `askAgainAfterAChangeToTheOffers`;
  - every query about Parts, so that Missing specifications and the search's `offerId` follow.
- [ ] **The end-to-end tests,** in the 360-pixel window, with made-up Vendors, Parts and part numbers made through the API. Each test finds its own request on the queue from the last page back, since earlier runs leave theirs:
  - **creating:** the Admin opens the request, creates the Part from the filled form and lands on its page. The request has left the queue, and the Shopper's Part page lists the Vendor's Offer at the request's price (success criterion 10);
  - **matching:** the search shows a Part the Vendor already offers. Matching another Part makes the Vendor's Offer for it;
  - **rejecting:** a reason is given after the dialog's confirmation, and the Vendor's list shows it as written;
  - **a resolved request's address** shows how it was resolved and offers nothing;
  - **the halfway case:** with `page.route` answering the fulfilment once as unreachable, the screen says that the Part was created. Fulfilling with that Part then succeeds, and the catalog holds one such Part;
  - **the sections:** the sidebar and the menu sheet list Part Requests.
- [ ] **Accessibility.** `expectAccessible` passes in the light and the dark scheme on:
  - the queue with rows and with none;
  - one request with its warning;
  - the match search;
  - the new-Part form opened from a request;
  - the rejection's dialog with a refusal shown.
- [ ] **Motion.** The row leaving the queue, and what else ticket 02's record makes move, is filmed with `film` and judged by `snapsOf`, with reduced motion and without it.
- [ ] **The inspector.** `pnpm dashboard:inspect` runs on the queue and on one request at 1440, 768 and 390 pixels, and at 1024 and 1280 where a desk layout changes between them. It runs in both schemes, with the made-up Part Requests and with `--part-requests`. Every FAIL is fixed, and every WARN is fixed or defended in Comments, a design defence put to the owner. The results go in Comments as a table.
- [ ] **Phone checks**, recorded open until hosting: the queue, one request and its three ways used with a thumb at 360 pixels in a Vendor's shop, the match search with the phone's keyboard, and the motion felt with reduced motion on and off.
- [ ] **Gates.** `pnpm check --skip-nx-cache` and `pnpm platform:check` pass.

## Comments
