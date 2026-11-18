# 02: Design the dashboard's Part Request pieces

**Spec:** [the part-requests spec](../spec.md)

**What to build:** Part Requests bring pieces to both halves of the dashboard that [the dashboard's DESIGN.md](../../../apps/dashboard/DESIGN.md) does not describe yet. They are designed inside Framed sheet (ADR-0011), with no new direction dealt.

- **In the Vendor portal:**
  - the Part Requests section in the top bar;
  - the Part Request form;
  - the Vendor's list with its three states;
  - the empty catalog search's action that opens the form.
- **In the Admin console:**
  - the Part Requests section;
  - the queue;
  - one request, with Match it to a Part, Create the Part and Reject;
  - the match search;
  - the new-Part form opened from a request;
  - the rejection's dialog.

The inspector's made-up shop first learns to answer Part Requests, so that every option is shown with realistic, obviously fictional data. The owner then sees the options rendered and chooses by eye, and Impeccable records the choices. No screen is built here: tickets 03 and 04 build them to this ticket's record.

**Blocked by:** 01

**Status:** resolved

- [x] **The made-up Part Requests.** The dashboard's made-up shop answers the queue, one request and a Vendor's list. It answers a page at a time in the API's order, typed against `api-client`, and refuses every write as before. Its requests come in every state:
  - open ones, one of them sent 40 days ago, whose Offer would be expired;
  - a fulfilled one whose Offer exists, and one whose Offer was removed;
  - a rejected one with a long reason.

  They belong to the shop's Vendor, for its portal, and to other Vendors, a Deactivated one among them, for the queue.
- [x] **The worst cases.** `pnpm dashboard:inspect --part-requests worstCase|one|none` answers the lists at their worst, with one request, or with none, as `--referrals` does. At their worst they hold:
  - the longest name and part number the API takes, and a name with no space;
  - names in Kurdish and Arabic script, and a name that starts with a digit;
  - prices at their limits in both currencies;
  - a 300-character reason in Kurdish;
  - a request waiting hundreds of days;
  - a queue of thousands.
- [x] **The screens as they are.** The catalog search's empty result, the portal's top bar and the Admin console's sections are captured and critiqued before anything is proposed, by Taste's audit with Impeccable's `critique`.
- [x] **What DESIGN.md lacks.** Impeccable adds to the dashboard's DESIGN.md whatever these pieces need and it does not yet say, before options are drawn.
- [x] **The options, rendered.** Each piece is shown in two or three options in the built-in browser, from a page served from the scratchpad, never `file://`. One option goes to an anchor, at most two columns, with the made-up data. The portal's pieces are shown in Kurdish and English, all of them at a phone's width and a desk's. Each skill leads its own area, as the design skills guide records:
  - Taste leads the composition, above all how the three ways stand on one request's screen;
  - Impeccable leads the copy, right to left and accessibility. The copy covers the three states, the warning that an Offer would be expired, a `created`, `replaced` or `kept` Offer, and the case of a Part created whose request stays open;
  - Emil Kowalski's skills lead the motion and the feel on a phone, a row leaving the queue among them;
  - `break-ui` runs on both lists and one request's screen with the worst cases above.
- [x] **The open choices are put to the owner:**
  - whether the count of open requests shows in the sidebar;
  - how the three ways stand on one request's screen;
  - lucide's icon for the section;
  - where the empty search's action stands.

  Any piece that pulls against a hard rule is put to the owner too.
- [x] **The record.** The owner's choices go under Comments, and Impeccable writes them, with their motion, into the dashboard's DESIGN.md. An ADR is written only if a choice replaces part of ADR-0011.
- [x] **Gates.** `pnpm check --skip-nx-cache` passes. The made-up shop is typed against the client, and its tests pass.

## Comments

### 18 November 2026: the made-up Part Requests

On branch `part-requests/02-design-the-dashboards-part-request-pieces`, from `part-requests/integration` at `7409b58`.

**The day rule moved first** (`64f0c43`, a move only): the inspector's day in Iraq's time and its calendar days, which the Shopper's stand-in states for a Shared Build's `sharedOn` and `daysSinceShared`, moved unchanged from `made-up-shared-builds.ts` into `apps/inspector/src/the-platforms-day.ts`, as ticket 01 moved the API's out of `shared-build`.

**The made-up shop answers Part Requests** (`f577c13`). `apps/inspector/src/made-up-part-requests.ts` holds them, and `answerFromTheMadeUpShop` answers:
- `GET v1/part-requests`, the queue: the open requests of every made-up Vendor, oldest first, then by identifier, each with its Vendor `{ id, name, active }`;
- `GET v1/part-requests/{id}`, one request in any state with its Vendor, and 404 `PART_REQUEST_NOT_FOUND` for an identifier it holds none of or text that is not one, as the API answers;
- `GET v1/vendors/{shop}/part-requests`, the shop's Vendor's own list, newest first, then by identifier, with no Vendor named.

Each list comes a page at a time through the shop's `paged`, and another Vendor's list is left to the API. Every write is still refused, sending, fulfilling and rejecting among them. `sentOn` and `daysSinceSent` follow the platform's day and `offerWouldBeExpired` the expiry rule (more than 14 days), both stated at the moment of the answer, as an Offer's expiry is. Everything is typed by `@pcp/api-client`, whose entry now exports `OpenPartRequestsPageResponse`, `PartRequestResponse`, `PartRequestWithVendorResponse`, `SendingVendorResponse`, `VendorsPartRequestsPageResponse`, `ListOpenPartRequestsData`, `ListVendorsPartRequestsData` and `ReadPartRequestData`.

The made-up requests, `madeUp`:
- **The shop's Vendor, Made-up PC Parts**, in every state:
  - open, sent 2 hours, 3 days and 40 days ago, the last one's Offer would be expired;
  - fulfilled with the Asus TUF Radeon RX 7800 XT, whose Offer the shop holds (`offerId` …108);
  - fulfilled with the AMD Ryzen 7 9800X3D, whose Offer was removed (`offerId` null);
  - rejected with a reason of 248 characters.
- **Six other made-up Vendors**, open, for the queue. Among them is Imaginary Gaming Corner, deactivated as the Referral counts have it, whose request was sent 22 days ago.

The queue holds 9 requests. Brands a request names are pretend ones ("Pretend Frostline 240 ARGB Liquid Cooler"), since a request names a Part the catalog lacks. A fulfilled request's Part is a real Part of the catalog, read by its Category and exact name when the command starts. The command now reads the two Parts the requests were fulfilled with beside those the shop offers (`partsTheShopReads`).

**`pnpm dashboard:inspect --part-requests worstCase|one|none`**, as `--referrals` does:
- **`worstCase`** keeps the made-up requests and adds the shop's own worst:
  - the longest name and part number the API takes, 300 and 100 code points, at the highest prices, 100,000.00 dollars and 150,000,000 dinars, waiting 412 days;
  - a name and a part number with no space, at 0.01 dollars;
  - a name in Kurdish at 1 dinar, and one in Arabic;
  - a name that starts with a digit;
  - a rejection whose reason is 300 code points in Kurdish;
  - a fulfilment with the catalog's longest name, 276 characters.

  It also adds two requests of the Referral counts' worst Vendors, the 100-character name and a deactivated one with no space. Then it fills the queue to 2,486 with requests sent over the last 29 days, so that the worst cases fill its first page.
- **`one`** answers one open request of the shop's in both lists.
- **`none`** answers none.

The tests, at the inspector's unit seam, `pnpm check`: `made-up-part-requests.spec.ts` (21) and a line in `catalog-parts.spec.ts`. The first, the queue, was run red first, for the right reason: the call was left to the API (`undefined` where 200 was expected). Its answer was then written with the data whole, so the later tests passed when first run. Each of them was then seen red against a fault planted on the committed tree (`f577c13`) and taken out by the inverse edit, with `git status` clean after each, by a script in the ticket's scratch folder:

| Fault | Tests that failed |
|---|---|
| The Vendor's list oldest first | its order and states, the days and expiry of its open ones, its fulfilled ones (3) |
| The Vendor's list naming the Vendor | "are its own … with no Vendor named" |
| The expiry at 14 days rather than past them | "turn the Offer … expired one millisecond past 14 days" |
| The day in UTC rather than Iraq's time | "count a request's day … in Iraq's time" |
| An unknown request answered as any unknown path (`NOT_FOUND`) | both not-found tests |
| The held Offer left out of a fulfilled request | "name the Part a fulfilled one was matched to …" |
| A queue of 20, not thousands | "fill the queue to thousands …" |

The inspector's 182 tests pass. No test of the platform relies on the made-up shop.

**Left for ticket 04.** The match search reaches the made-up shop only for its own Vendor's requests (`catalogSearchOfTheShop`). For another made-up Vendor's request, the API answers `GET v1/parts?vendorId=…` with that Vendor unknown. So the match search is inspected from the shop's own requests, the 990 PRO's among them.

### 18 November 2026: the screens as they are

Before anything was proposed, the API (3001) and the dashboard (3002) were started under the e2e lock, and `pnpm dashboard:inspect` ran on the made-up shop, `--app`, at 1440, 768 and 390 pixels:

| Run | FAIL | WARN |
|---|---|---|
| The portal's catalog search, empty, English, light | 0 | 2: `hero-void` 47% of the first screen, `panel-void` 377 px |
| The same, Kurdish, dark | 0 | 2: `hero-void` 40%, `panel-void` 353 px |
| The portal's Offers (its frame and sections), Kurdish, light | 0 | 0 |
| The same, English, dark | 0 | 0 |
| The console's Expiring Offers (its sections), light | 0 | 2: `hero-void` 67%, `panel-void` 587 px |
| The console's Referrals, dark | 0 | 0 |

The WARNs are short screens leaving the sheet empty below them. The empty search's is the finding that matters here: the result ends the Vendor's way, with nothing to do.

**Taste's audit** (its app-screen questions, on those pictures): the screens are authored, not a kit, and the plates, the stone frame and real right to left carry them. The empty search's one question, "what now?", has no answer on it. The console's sidebar has no place for what waits. A short list leaves its sheet empty, which the empty search's action now fills.

**Impeccable's critique**, two assessments run apart as its `critique` asks (A, the design review: agent `a94863c90e3f84889`; B, the detector: agent `a4c84b53daed6262c`).
- **B, the detector:** no finding on the catalog search, the two frames, Expiring Offers or the Referrals, with and without the project's config. A control planted in the scratch folder showed that it reads TSX. Overlays could not be injected, since the dashboard is behind Keycloak's login.
- **A, the design review:** 28/40, the screens authored for the product. The priority issues:
  - **P1:** the empty search is a dead end, against DESIGN.md's own empty state, and a request sent from a search narrowed to a Category asks for Parts filed under another;
  - **P1:** the sidebar has no place for a count, and a phone shows none;
  - **P2:** which section is lit on the catalog search and on a form opened from it;
  - **P2:** a desk queue whose rows lead away from it, as Expiring Offers' do;
  - **P2:** the Vendor learns a resolution only in a section it must open;
  - **minor:** the empty result is not announced.

The options answer the first two P1s and the queue's P2: d3, d2, and d7 with d9. The others are follow-ups. Questions skipped: the owner's standing instruction of 18 November 2026 takes the recommendation for each.

### 18 November 2026: what DESIGN.md lacked

Before any option was drawn, Impeccable added what the pieces need and the file did not yet say (`115cfd0`):
- the portal's sections in the sidebar and the menu sheet, Part Requests between Offers and Details, and the console's seventh;
- a Part Request's states as words and marks in each half;
- its prices on one plate, never a leading one;
- what the Admin wrote shown as written;
- the panel that warns of an Offer that would be expired, in Action Red since the dashboard has no warning colour;
- the note after a send or a resolution;
- the halfway case's panel;
- one field in the alert dialog.

### 18 November 2026: the options, rendered

**The page** is in the scratchpad's `part-requests-02/`, for the owner's `.taste-skill/part-requests-02/`. It was served on port 4120 (`python3 -m http.server`, never `file://`) and shown in the built-in browser.

`index.html` lays out the screens as they are (`#before`), then ten choices, `#d1` to `#d10`, one option to an anchor (`#d1a`, `#d1b`, …). The option taken is marked on each, with why, and the others say why not. Then come the words (`#words`), the motion (`#motion-section`), the feel on a phone (`#phone`), the worst cases (`#worst`) and the record (`#record`). A bar switches both schemes, reduced motion and four times slower. Play buttons run a row leaving the queue with its note, and a Vendor's new request arriving with its note.

**How each window is made.** Every window is the dashboard's own frame, captured with its markup from the running dashboard on the made-up shop (`captured/`, the capture script in the ticket's scratch folder) and drawn with the dashboard's built stylesheet and fonts (`base/`). Each piece is put into it by `pieces.js` with the theme's own classes, from `data.js` (the made-up shop's answers, `madeUp` and `worstCase`). The few rules the pieces add are in `pieces.css`, each a proposal: the sidebar's count, and two container queries.
- The portal's pieces are in Kurdish and English, at 390 and 1440.
- The console's are at 390 and 1440, at 1024 for the queue, and at 1024 and 1280 for the request's screen, whose desk layout changes between them.

**How each skill led its area:**
- **Taste** (`design-taste-frontend`, `references/app-screens.md`): the composition, with no deal, inside Framed sheet. For the request's screen it gave the queue-driving-a-detail pattern, the evidence beside the answer, and the most frequent job one click away.
- **Impeccable:** the critique, the copy (`clarify`), right to left and accessibility.
- **Emil Kowalski's `emil-design-eng`:** the motion, asked with the frequencies.
- **Emil's `mobile-native`:** the feel on a phone.
- **Emil's `break-ui`:** both lists and the request's screen with `worstCase`.

The design skills' own files were not changed.

**Measured** in headless Chrome by a scratch script:
- **What was drawn:** all 74 windows, in both schemes, and each phone window again at 320 pixels, 181 drawings.
- **What it checked:** no script error, nothing scrolling sideways, and no text under 14 pixels (15 in Kurdish).
- **What it found:** one real fault. The Vendor's name, a link of its own in each queue row and in the request's details, was a 20-pixel text link on a phone, under the 44 a touchscreen needs. It became an underlined link as high as a control, raised above the row's own link, and the record says so. After that, every control on a phone is 44 pixels or more.
- **The motion,** read back in the built-in browser:
  - the resolved row runs its fade and close (9 animations), is taken out once closed, and the note arrives;
  - the Vendor's new row arrives with its note (12 animations).

**The worst cases**, by `break-ui` on the options taken:
- **What holds:**
  - a name and a part number with no space break anywhere;
  - the plate at both limits puts its dinars on a second line on a phone and never grows wider than its line;
  - 0.01 dollars and 1 dinar are drawn as written;
  - a reason of 300 Kurdish characters is aligned right in both portals, and an English one left in the Kurdish portal, each by its own language;
  - Kurdish, Arabic and digit-first names start on their own side;
  - "Waiting 412 days", "2,486 Part Requests waiting" and the sidebar's "2,486" fit;
  - the longest Vendor names wrap with their mark beside them.
- **Defended:** the 300-character name as the request's title runs nine lines on a phone. It is kept whole, as a Part's name is never cut, since the name is all the Admin has to find the Part.

### 18 November 2026: the choices

The owner was asleep. Each choice was rendered as the ticket asks and then taken, with no stop:

1. **d1, the section's icon.** Taken on the owner's standing instruction of 18 November 2026: lucide's `PackagePlus` for Part Requests in both halves (a Part to be added, beside the portal's package for Offers and the console's searching package for the Catalog, and distinct at 16 pixels; the other options were `ClipboardPlus`, the twin of Missing specifications' clipboard, and `MessageSquarePlus`, which promises a message the module never sends).
2. **d2, the sidebar's count.** Taken on the owner's standing instruction of 18 November 2026: the count of open requests after the console's section's name, in Note Grey at weight 400, tabular, none at zero, read "9 open", in the menu sheet on a phone (the platform sends no message, so it is the Admin's one notice that a Vendor waits; the other option was no count, as the other sections have none).
3. **d3, the empty search's action.** Taken on the owner's standing instruction of 18 November 2026: the action in the empty result, "Ask for it to be added", after "Search every Category" when a Category narrowed the search, with a sentence that the form starts with the Vendor's words, the result announced (it answers the critique's dead end where the Vendor's eye is, and widening first keeps a Part filed under another Category from being asked for; the other options were the request alone in the empty result, and a standing line under the screen's title on every search).
4. **d4, the form.** Taken on the owner's standing instruction of 18 November 2026: one column at most 40rem, the Part's three fields then the Offer form's own, "Send the request" last, and from 64rem "What happens next" on Raised Stone beside it (the Offer form's composition, which the owner chose as "Part beside form"; the other option was the Part and the Offer as two groups side by side).
5. **d5, the Vendor's list.** Taken on the owner's standing instruction of 18 November 2026: the Offers screen's list, a table from 64rem with Part, Price, Sent and State, and two-line rows on a phone, the state last with its links (the Vendor reads it as it reads its Offers every day; the other option led each row with its state).
6. **d6, the queue.** Taken on the owner's standing instruction of 18 November 2026: the Part first, then the Vendor as an underlined link of its own, then the days waiting, and a red line when its Offer would be expired (the Admin decides by the Part; the other option put the Vendor first, as Expiring Offers does, which repeats Vendors out of order in an oldest-first list).
7. **d7, how the three ways stand.** Taken on the owner's standing instruction of 18 November 2026: the request opens beside the queue from 64rem, seven twelfths and five. Its details and warning come first, then Match it to a Part already searched by the part number, then Create the Part, then Reject, and on a phone the request is the screen in the same order. This is Taste's queue-driving-a-detail, as Missing specifications works, with the answer the Admin needs first, whether the catalog holds the Part, already on the screen. The other options were a screen of its own with the search beside the request, and three equal buttons, each opening its way.
8. **d8, the match search.** Taken on the owner's standing instruction of 18 November 2026: an outlined Match at each found row's end, a row of its own not a link, and one question that says what fulfilling will do with the Vendor's Offer, its action the primary button (matching makes or replaces an Offer, so it is a named control a scrolling thumb cannot set off; the other option let the whole row ask).
9. **d9, the new Part's form.** Taken on the owner's standing instruction of 18 November 2026: the form in the pane beside the queue. The request sits on Raised Stone at its head, the Category first and changeable, and the halfway case is the refusal panel above the dimmed form with "Fulfil it with this Part" (it follows d7 and keeps the Admin in the queue). The other option was a screen of its own with the request beside the form.
10. **d10, the rejection's dialog.** Taken on the owner's standing instruction of 18 November 2026: the reason's field in the alert dialog, the focus in it, Reject its one red button (the spec's own, the dialog being the one confirmation; the other option wrote the reason on the request's screen and had the dialog quote it).

**What the spec left to settle.** Two places the spec's words pulled against the code were settled here:
- **The portal's section.** The spec puts it "in the top bar", but since ADR-0011 the sections are in the sidebar and the menu sheet, so it stands there. The spec says both "the third beside Offers and Details" and "the second, between Offers and Details", which agree: it is the third section, in the second place.
- **The console's.** The spec's "the seventh section" puts it last.

**The hard rules hold.** No piece pulls against one, so none was put to the owner as a conflict. Every colour is one the file has measured, every control is 44 pixels on a touchscreen once the Vendor's link was fixed, no text is under 14 pixels or Arabic script under 15, nothing scrolls sideways at 320, and every side is logical.

**The words** are drafted in English, with the Kurdish drafts for LANG-7, on the page's `#words`, for ticket 03's language files (with the Arabic). The console's are English. They use `words.md`'s terms and none of the words to avoid.

**The motion**, led by Emil's `emil-design-eng`, adds no curve, duration or library. The resolved row leaves the queue as Motion 8 says, and the note arrives as Motion 6 says. A Vendor's new request arrives as a row does. The two dialogs move as Motion 3. The request's pane, the search's results and the sidebar's count change at once. Each has its reduced-motion form, and none snaps.

### 18 November 2026: the record

Impeccable wrote the choices, with their motion, into `apps/dashboard/DESIGN.md`, in the file's own terms and with the owner's anchors:

| Piece | In DESIGN.md |
|---|---|
| The queue and its pane, the portal's list and form | Layout |
| The Part Request form, the new Part's form from a request | Components › Fields |
| A request in the Vendor's list, in the queue, one request, a Part the match search found | Components › Rows and tables |
| The empty search's action, the empty lists, the notes, the halfway case | Components › States |
| Matching and Rejecting a Part Request | Components › Dialogs |
| The mark and the count | Components › Navigation and the frame |
| Motion 12, and what stays still | Motion, with the reduced-motion table |
| The rest | Do's and Don'ts |

No choice replaces part of ADR-0011, so no ADR is written.

**Phone checks, open, waiting for hosting** (the owner's rule of 16 October 2026; the spec's Open checks list them):
- the form with a thumb in Kurdish and English, with a price and a part number typed on a Kurdish and an Arabic keyboard;
- the empty search's action with a thumb;
- the Vendor's list with a long Kurdish reason;
- the queue, a request and its three ways at 360 pixels;
- the motion on a real phone, with reduced motion on and off.

### 18 November 2026: the gates

- Each commit was gated on `pnpm check` before it was made: `64f0c43` (the move), `f577c13` (the made-up Part Requests, the inspector's 182 tests among it), `115cfd0` and `d68cbc5` (DESIGN.md and this record).
- `part-requests/integration` was still at `7409b58` when merged in, so the merge brought nothing.
- This record's commit is gated on `pnpm check --skip-nx-cache`, with every `*.tsbuildinfo` outside `node_modules` deleted first.
- `pnpm integration:check` was not run, since the ticket changes no API code. `pnpm platform:check` was not run either, since the ticket runs no end-to-end test and builds no screen.
- The e2e lock was held once, for the inspection and the capture, and released.
