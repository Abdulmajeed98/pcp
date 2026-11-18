# 04: The Admin works the Part Requests queue

**Spec:** [the part-requests spec](../spec.md)

**What to build:** The Admin opens Part Requests, the Admin console's seventh section, and sees the queue of open Part Requests, oldest first (REQ-2). Opening one shows everything the Vendor sent. If the request was sent more than 14 days ago, the screen warns that its Offer will be listed as expired. The request offers three ways to resolve it:

- **Match it to a Part.** A catalog search starts with the request's part number and says when the Vendor already offers a Part it finds. Choosing a Part fulfils the request with it.
- **Create the Part.** The form for a new Part comes filled with the request's name, part number and Category. Saving creates the Part, fulfils the request with it, and leads to the new Part's page for its photo (CAT-6).
- **Reject it** with a reason, after one confirmation.

A fulfilment makes the Vendor's Offer go live (REQ-3), which a Shopper sees on the Part's page. This makes success criterion 10 true for a Part Request sent from the portal.

**Blocked by:** 01, 02

**Status:** resolved

- [x] **The section.** The sidebar and the menu sheet gain Part Requests, with the icon ticket 02 recorded. `admin-platform-rate.spec.ts`, which lists the sections exactly, gains it.
- [x] **The queue,** at `/part-requests`, is the Catalog's kind of list, drawn by `PagedList` with its page in the address, 20 a page. Each row:
  - names the Vendor `AsWritten`, with `DeactivatedMark` for a Deactivated Vendor and `VendorLink` to its page;
  - gives the request's Category, its name and part number `AsWritten`, and its days waiting;
  - leads to the request.

  With none, `NothingToDo` says so. A refusal and an API that cannot be reached say that the Part Requests could not be listed, with `WhyNotAnswered`. The queue shows the count of open requests as ticket 02 recorded.
- [x] **One request,** at `/part-requests/{partRequestId}`, shows everything the Vendor sent:
  - its prices on the Rate Board's plates;
  - the warning when `offerWouldBeExpired` says so;
  - its three ways, as ticket 02 recorded.

  A resolved request shows how it was resolved and offers nothing, whether it was opened from an old link or reached after a `PART_REQUEST_RESOLVED` refusal.
- [x] **Match it to a Part** searches through `GET v1/parts`. Its first search is the request's part number, and it passes the request's Vendor as `vendorId`, so that each Part found says whether that Vendor already offers it. Choosing a Part asks once, saying what fulfilling will do, then fulfils.
- [x] **Create the Part,** at `/part-requests/{partRequestId}/new-part`, is the `part-form` feature filled with the request's name, part number and Category, the Category changeable.
  - Saving creates the Part through `POST v1/parts`, then fulfils the request with it.
  - It leads to the new Part's page with a note saying what happened to the Offer: `created`, `replaced` or `kept`.
  - If the fulfilment is refused or not answered, the screen says that the Part was created and the request is still open. It offers to fulfil the request with that Part, so the Part is never created twice.
- [x] **Reject** is shadcn/ui's alert dialog with the reason's field. It says a refusal and stays open until the rejection is done.
- [x] **After a resolution** the Admin returns to the queue, with a note naming the request and how it was resolved. The resolved row leaves as rows leave a list (`useLeavingRows`). The Create the Part path leads to the new Part's page instead.
- [x] **The query keys.** A fulfilment or a rejection asks `['part-requests']` again. Whichever of tickets 03 and 04 lands first adds the key. A fulfilment also asks again:
  - the Vendor's Offers, through `askAgainAfterAChangeToTheOffers`;
  - every query about Parts, so that Missing specifications and the search's `offerId` follow.
- [x] **The end-to-end tests,** in the 360-pixel window, with made-up Vendors, Parts and part numbers made through the API. Each test finds its own request on the queue from the last page back, since earlier runs leave theirs:
  - **creating:** the Admin opens the request, creates the Part from the filled form and lands on its page. The request has left the queue, and the Shopper's Part page lists the Vendor's Offer at the request's price (success criterion 10);
  - **matching:** the search shows a Part the Vendor already offers. Matching another Part makes the Vendor's Offer for it;
  - **rejecting:** a reason is given after the dialog's confirmation, and the Vendor's list shows it as written;
  - **a resolved request's address** shows how it was resolved and offers nothing;
  - **the halfway case:** with `page.route` answering the fulfilment once as unreachable, the screen says that the Part was created. Fulfilling with that Part then succeeds, and the catalog holds one such Part;
  - **the sections:** the sidebar and the menu sheet list Part Requests.
- [x] **Accessibility.** `expectAccessible` passes in the light and the dark scheme on:
  - the queue with rows and with none;
  - one request with its warning;
  - the match search;
  - the new-Part form opened from a request;
  - the rejection's dialog with a refusal shown.
- [x] **Motion.** The row leaving the queue, and what else ticket 02's record makes move, is filmed with `film` and judged by `snapsOf`, with reduced motion and without it.
- [x] **The inspector.** `pnpm dashboard:inspect` runs on the queue and on one request at 1440, 768 and 390 pixels, and at 1024 and 1280 where a desk layout changes between them. It runs in both schemes, with the made-up Part Requests and with `--part-requests`. Every FAIL is fixed, and every WARN is fixed or defended in Comments, a design defence put to the owner. The results go in Comments as a table.
- [ ] **Phone checks**, recorded open until hosting: the queue, one request and its three ways used with a thumb at 360 pixels in a Vendor's shop, the match search with the phone's keyboard, and the motion felt with reduced motion on and off.
- [x] **Gates.** `pnpm check --skip-nx-cache` and `pnpm platform:check` pass.

## Comments

### 18 November 2026: the Admin console's Part Requests

On branch `part-requests/04-the-admin-works-the-part-requests-queue`, from `part-requests/integration` at `fb4265b`, built to ticket 02's record: its Comments, the dashboard's DESIGN.md and its renderings (`#d1a` to `#d10a`).

**Where it lives.** One page slice, `pages/part-requests`, holds the three screens, as `pages/new-part` holds two:
- `PartRequestsPage`, the queue at `/part-requests`, laid out as Missing specifications is: the whole sheet until a request is opened, then seven twelfths beside the request's five;
- `PartRequestPage`, one request at `/part-requests/{partRequestId}`;
- `NewPartFromARequestPage`, the new Part's form at `/part-requests/{partRequestId}/new-part`.

Its `api` segment reads the queue, one request and the match search, and fulfils and rejects; its `model` holds the note's state and the days written. Beside it:
- `shared/api`'s `partRequestsKey`, `['part-requests']`, the key ticket 03 adds too, written as it writes it;
- the frame's seventh section, with `PackagePlusIcon` and the count;
- the `part-form` feature's three new props, `start`, `chooseCategory` and `closed`;
- `entities/part`'s `PartCreatedFromARequest`, the address's state the Part's page reads for its note, as `AddedOffer` is in `entities/offer`;
- `entities/offer`'s `OfferPlate` gains `narrow`, for a plate in a column narrow at every width (the inspector, below).

Nothing was added to the Vendor portal, the API or the client.

**Ticket 02's two notes.**
- The queue row's Vendor is `VendorOfTheRequest`, a link of its own to the Vendor's page, underlined, as high as a control, `relative z-10` above the row's link. It is not `VendorLink`, whose link covers the row. The request's Vendor row uses it too.
- The match search names the request's Vendor (`vendorId`), so the made-up shop answers it only for its own Vendor's requests. The inspector ran it on the shop's own 990 PRO request (`…600001`).

**The query keys.** Every query of the queue, its count and one request is under `['part-requests']`.
- A fulfilment asks again `['part-requests']`, the Vendor's Offers through `askAgainAfterAChangeToTheOffers`, and every query about Parts (`askAgainAfterAFulfilment`).
- A rejection, and a refusal that says the request was resolved meanwhile, ask `['part-requests']` again.
- Each first returns to the queue, so the pane closes at once and the queue is answered again without the request.
- The match search is under the Parts' key (`[...partsKey, 'matching', vendorId, …]`), so the mark of an Offer follows a fulfilment.

### 18 November 2026: the end-to-end tests and the faults

**The tests.** `admin-part-requests.spec.ts`, with its screen helpers in `admin-part-requests.ts` and its HTTP helpers in `part-requests.ts`, shared with ticket 03 since the merge (`61be34d`), runs in the 360-pixel window unless a group says a desk's, 1280. Each test logs in as the development Admin and makes its own Vendor through the API. It sends its own request through the API, a PSU named "Made-up requested Part" with a word unique to the run, part number `REQ-<word>`, at 79 $ and 125,000 IQD, in stock, 36 months.

The queue's lines find their request from its last page back. They ask `GET v1/part-requests` 100 to an answer, from its last page, and open the dashboard's page of 20 that holds the request. The queue is oldest first, so a new request comes last, as Missing specifications' lines find their Part.

| Group | What it proves |
|---|---|
| The section | The menu sheet lists the seven sections, Part Requests last with "N open". It leads to the queue. From 64rem the sidebar lists the same with `PackagePlus` and marks it as the current section. |
| The queue | The row names the Part, PSU, the part number, the Vendor and "Waiting since today", and the count line is in words. The Vendor's link is its own, 44 pixels high, and the row leads to the request, the queue's page kept in the address. Nothing scrolls sideways. |
| | A Deactivated Vendor's row carries the mark. |
| | With none (`page.route`), `NothingToDo` says "No Part Request is waiting". |
| | A 403 and an API that cannot be reached each say "The Part Requests could not be listed." and why. |
| | From 64rem it is a table, Part, Vendor and Waiting, the last end aligned, and the Vendor's link opens its page. |
| One request | It shows the Vendor, "Today", "PSU, as the Vendor gave it", the part number, one plate (79 $, 125,000 IQD), "In stock" and "36 months", with no warning. Its three ways come in order, the search holding the part number. |
| | Answered 40 days after it was sent (`page.route` on the read), it warns "Its Offer will be listed as expired". |
| | A rejected request's address says "Rejected on …" with the reason as written, a fulfilled one "Fulfilled on …" with a link to the Part's page, and neither offers a way. |
| Rejecting | The dialog takes the focus to the reason. A missing reason is said beside the field and the dialog stays open. Given in Kurdish and English on two lines, the Admin returns to the queue with "Request rejected" and the request has left it. The Vendor's list holds it rejected, its reason as written. |
| | A request rejected meanwhile, as from another tab: Reject is refused `PART_REQUEST_RESOLVED`, the dialog closes, and the screen shows the earlier reason, offering nothing. |
| Matching | The first search, by the part number, finds a PSU the Vendor offers, marked so, and a GPU it does not. Matching the GPU asks once ("has no Offer for this Part") and returns to the queue with the note. The request has left the queue, and the Vendor's Offer for the GPU holds the request's prices, stock and warranty. |
| | Matching the Part the Vendor offers, confirmed after the request was sent, says "already offers this Part", and the note says the Offer was kept. Its price stays 99 $. |
| Creating | Create the Part opens the form at `/new-part`, with PSU, the name and the part number filled and the manufacturer empty. Choosing CPU draws "Series" and keeps the name, manufacturer and part number; PSU again takes it away. Creating leads to the new Part's page, with "Part created and request fulfilled" and Add a photo. The request has left the queue. The Shopper's English page of the Part lists the Vendor's Offer at 125,000 IQD (success criterion 10). |
| The halfway case | With the fulfilment aborted once (`page.route`), the panel says the Part was created and the request is still open, "not answered: the API could not be reached". The form has no button, and "Fulfil it with this Part" has the focus. Pressing it leads to the Part's page with the note. The catalog holds one Part with the request's word, and the request has left the queue. |
| Motion | On a phone and at a desk, in each motion setting, the queue's answers are the test's own (`page.route`): four requests, the made-up one second, and after the rejection the same page without it and the next page's first. The rejection is real. The film (`filmTheList`, four times slower) is judged from the queue's first frame on a phone, and from the table's first frame at a desk, where the queue's next answer comes 600 ms after the pane closes. `jumpsIn` finds no row appearing, taken out while seen, or fading in one frame. `snapsOf` finds no snap in the row below's top, the leaving row's height or the arriving row's height. The leaving was seen. |
| Accessibility | `expectAccessible` in light and dark: the queue with rows (phone and desk) and with none, one request, one request with its warning, the match search with its results, the new-Part form opened from a request, and the rejection's dialog with its refusal beside the reason. |

`admin-platform-rate.spec.ts`'s list of sections gains `/^Part Requests( [\d,]+ open)?$/`, as the count follows the development database.

The first runs:
- **Red.** The section, queue, request and rejecting lines, and the sections list of `admin-platform-rate.spec.ts`, were run before the code, 14 failing for the right reason: no seventh link, and no heading at `/part-requests` or at a request.
- **Then.** The match, create and halfway lines were written after their code in the same sitting, so their red was shown through the faults below.
- **Corrected.** Two lines were corrected while going green, each a fault of the test:
  - the request's address keeps the queue's `?page=N`;
  - the reduced-motion films first used `jumpsIn`'s fixed 16-pixel step, which the out curve's first frame of a 100-pixel space exceeds. They now judge movement with `snapsOf`, as the offers' films do.

**The faults**, each planted on the committed tree by one exact edit, run against the lines that should catch it under the e2e lock, and reverted by the inverse edit, `git status` clean after each (a script in the ticket's scratch folder):

| Fault | Lines that failed, and why |
|---|---|
| A rejection that does not ask `['part-requests']` again (`useReject`'s `askAgainAboutThePartRequests` taken out) | Both desk motion lines: the queue, still drawn beside the closed pane, kept the rejected request second ("Made-up Third request" expected). |
| The match search without the request's Vendor (`vendorId` taken out of `useMatchSearch`) | Both matching lines: the Part the Vendor offers was not marked, and the question said "has no Offer" where "already offers this Part" was expected. |
| The halfway case's form keeping its button (`closed={false}`) | The halfway line: "Create the Part" was still there. |
| Creating the Part without fulfilling the request (`await fulfilWith(made)` taken out) | The creating line: the screen stayed on the form's address (`…/new-part?page=3`) where the new Part's page was expected. |

They stand in for the red runs of the match, create and halfway lines, written after their code.

### 18 November 2026: the choices taken while building

Ticket 02's record left these open, or its words pulled against the spec or the code. The owner was asleep, so each was taken with no stop, and the design ones are written into the dashboard's DESIGN.md:

1. **The queue beside an open request.** Taken on the owner's standing instruction of 18 November 2026: beside a request the queue's rows are its two-line rows, and it is a table again once the pane closes, at once. d7a's rendering drew it so, and the table's three columns do not fit seven twelfths of the sheet, about 420 pixels at 1024. The other option was the table kept beside the pane, as Missing specifications keeps its own, which squeezes its Part column. In DESIGN.md's Layout.
2. **The way back beside the queue.** Taken on the owner's standing instruction of 18 November 2026: the request's screen and the new Part's form keep their back link on a desk too, where it closes the pane, as a Part's page beside the Catalog does. Without it, the pane could be closed only from the sidebar or another row. The other option was d7a's rendering, with no back link on a desk. In DESIGN.md's Layout.
3. **How a resolved request says its day.** Taken on the owner's standing instruction of 18 November 2026: "Fulfilled on 12 November 2026, with <the Part>" and "Rejected on 12 November 2026, with this reason:", in the Admin's own time zone. The spec says no frontend counts days, and the API counts none since a resolution. The other option was the drafted "Fulfilled 6 days ago, on …", which would count days in the browser. In DESIGN.md's One Part Request. A `daysSinceResolved` from the API would bring the words back (a follow-up).
4. **The halfway case's place and focus.** Taken on the owner's standing instruction of 18 November 2026: the panel opens its space above the dimmed form, as d9a drew it. Once open it is scrolled into sight and its "Fulfil it with this Part" takes the focus, since the form's button that had it is gone. DESIGN.md said both "above the form" and "the form above it"; the rendering settles it. The other option was the panel above the form's button, where the eye is after pressing it, which would split one panel from the dimmed form above it. In DESIGN.md's States.
5. **The note on a desk's queue.** Taken on the owner's standing instruction of 18 November 2026: beside a desk's pane, where the queue stays drawn, the note's space opens in step with the resolved row's closing, then it fades in, as a row arrives (Motion 8). On a phone the queue is drawn anew and the note arrives with it (Motion 6). Motion 12 said "as Motion 6 says", which beside the pane would push the list down in one frame, against the No Snap Rule. The other option was Motion 6 there too. In DESIGN.md's Motion 12.
6. **Match's name to a screen reader.** Taken on the owner's standing instruction of 18 November 2026: each row's outlined button reads "Match", and is named "Match to <the Part>". Then a screen reader's list of buttons tells them apart. The other option was "Match" alone, the same on every row.
7. **A missing reason.** Taken on the owner's standing instruction of 18 November 2026: the dialog says a reason left empty beside its field before asking the API, as the Part form checks a name, and the API's own `missing` and `tooLong` are said in the same place. The other option was asking the API for every check, a call that can only be refused.
8. **The note on the new Part's page.** Taken on the owner's standing instruction of 18 November 2026: it stands under the back link, above the Part's picture and name, at the head of the page. The other option was below the Part's actions, beside Add a photo, which puts it under the Lacks line of a Part missing specifications.

**Not a design choice: the Vendor's list.** The rejecting line reads the reason as written from the Vendor's list as the API answers it, `GET v1/vendors/{vendorId}/part-requests`. The portal's list is ticket 03's screen, built in its own worktree, and not on this branch. Ticket 03's own line shows the reason in the portal; ticket 05 can join the two.

### 18 November 2026: the inspector

`pnpm dashboard:inspect` ran under the e2e lock, with the API (3001) and the dashboard (3002) started from this worktree, on the made-up shop. Every run covered 1440, 1280, 1024, 768 and 390 pixels, since the request's pane beside the queue is a desk layout that changes between 1024 and 1280. The request screens ran on the shop's own requests, as ticket 02's note asks: `…600006` (sent 40 days ago, its Offer would be expired) and `…600001` (the 990 PRO, whose match search finds the catalog's Part), and, with `--part-requests worstCase`, `…610001` (the longest name and part number, the highest prices, 412 days). The new Part's form was inspected too, though the ticket does not ask it.

| Screen | Made-up data | Scheme | First run | After `b3eb974` |
|---|---|---|---|---|
| The queue | made-up | light | 0 FAIL, 0 WARN | |
| The queue | made-up | dark | 0, 0 | |
| The queue | `worstCase` (2,486) | light | 0, 0 | |
| The queue | `worstCase` | dark | 0, 0 | |
| The queue | `one` | light | 0 FAIL, 2 WARN: `hero-void` 60% at 1440 (+1280, 1024), `panel-void` 565 px | |
| The queue | `none` | dark | 0 FAIL, 2 WARN: `hero-void` 60%, `panel-void` 562 px | |
| One request, with its warning | made-up | light | 1 FAIL: `edge-text` "IQD" 15 px from the edge at 1024 | 0, 0 |
| One request, with its warning | made-up | dark | 1 FAIL (the same), 1 WARN: `contrast` 4.2:1 on "Its Offer will be listed as expired" at 1440 (+1280, 1024) | 0, 0 |
| One request, the match search | made-up | light | 1 FAIL: `edge-text` "IQD" at 1024 | 0, 0 |
| One request, the match search | made-up | dark | 1 FAIL (the same) | 0, 0 |
| One request at its worst | `worstCase` | light | 4 FAIL: `overflow` 4 px at 1280 and 68 px at 1024 (the plate), `edge-text` at 1024, `headline-lines` at 390 | 1 FAIL: `headline-lines` at 390 |
| One request at its worst | `worstCase` | dark | 4 FAIL (the same), 1 WARN: `contrast` 4.2:1 | 1 FAIL: `headline-lines` at 390 |
| The new Part's form | made-up | light | | 0, 0 |
| The new Part's form | made-up | dark | | 0, 0 |

**Fixed** in `b3eb974`:
- **The plate.** It kept both prices on one line from 64rem, so beside the queue it ran past the pane, and with the highest prices past the window. It now takes the details' whole row under "Its Offer", and in a narrow column its dinars take the second line on a desk too (`OfferPlate`'s new `narrow`, used by the request and the new Part's form).
- **The contrast WARN.** It was the queue row of the request open beside the pane: Action Red on Active Stone measures 4.2:1 in the dark scheme. On that row the line's words are now in Ink, after its red mark. Missing specifications' open row draws its Lacks line the same way, a follow-up.

**Defended:**
- **`hero-void` and `panel-void`** on the queue with one request or none. A queue whose aim is to be empty leaves the sheet empty below its last row or its `NothingToDo`, and nothing belongs in the space. These are the same WARNs ticket 02 measured on Expiring Offers and the empty search.
- **`headline-lines`**, the one FAIL left: the worst case's 300-character name, the longest the API takes, runs ten lines as the request's title at 390. Taken on the owner's standing instruction of 18 November 2026: the name is kept whole, as ticket 02 recorded it and DESIGN.md says (One Part Request), since the name is all the Admin has to find the Part, and a request's name of a normal length takes one or two lines. The other option was a clamped title with a way to show the rest, which hides what tells two requests apart. Put to the owner.

The screenshots, each read, are in the worktree's ignored `.taste-skill/part-requests-04/`.

**Phone checks, open, waiting for hosting** (the owner's rule of 16 October 2026; the spec's Open checks list them, and ticket 05 adds them to the MVP spec's **Checks on a phone wait for hosting**):
- the queue, one request and its three ways used with a thumb at 360 pixels in a Vendor's shop, the Vendor's own link on a row among them;
- the match search typed on the phone's keyboard, its search key searching;
- the rejection's dialog with the phone's keyboard open, the reason typed in Kurdish and in English;
- the motion felt on a real phone, a row leaving the queue and the note arriving, with reduced motion on and off.

### 18 November 2026: the merge and the gates

- **Each commit** was gated on `pnpm check` before it was made: `160f0d7` (the screens and their tests), `825eadb` (a missing reason cleared once typed, and the shared key written as ticket 03 writes it), `61be34d` (the HTTP helpers through `part-requests.ts`) and `b3eb974` (the inspector's fixes).
- **The merge.** `part-requests/integration` at `abb0102`, with ticket 03, was merged in as `327e8e0`. It merged with no conflict: the shared key had been written as ticket 03 wrote it, last among the keys with its words, so the two branches hold one `partRequestsKey`. After it, the Admin's tests send, fulfil, reject and read a Vendor's list through ticket 03's helpers, and the queue's place joined them (`61be34d`).
- **On the merged tree, at `b3eb974`:**
  - `pnpm check --skip-nx-cache` passed, with every `*.tsbuildinfo` outside `node_modules` deleted first: 32 tasks;
  - `pnpm platform:check` passed under the e2e lock: 497 passed in 25.0 minutes, this ticket's 21 lines among them, and `admin-platform-rate.spec.ts`'s sections.
- **Not run.** `pnpm integration:check`, since the ticket changes no API code.
- **The lock.** It was held for each end-to-end run, each fault and each inspection, and released after.
- **This record's commit** is gated on `pnpm check --skip-nx-cache` again, with every `*.tsbuildinfo` deleted first.
