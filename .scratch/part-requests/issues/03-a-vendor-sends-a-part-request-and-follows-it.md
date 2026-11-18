# 03: A Vendor sends a Part Request and follows it

**Spec:** [the part-requests spec](../spec.md)

**What to build:** A Vendor whose catalog search finds nothing taps the empty result's action and lands on the Part Request form. The form is filled with the search's words as the name and the search's Category. The Vendor completes it with the part number and the Offer it would make, and sends it (REQ-1). A new Part Requests section in the portal's top bar leads to the same form at any time, and to the Vendor's Part Requests (REQ-4). Each request there shows its state:
- waiting, with its days;
- added, naming the catalog's Part and leading to the Vendor's Offer for it;
- not added, with the Admin's reason as written.

This works in Kurdish, Arabic and English, at 360 pixels, and for the Admin acting as the Vendor.

**Blocked by:** 01, 02

**Status:** resolved

- [x] **The price fields, shared.** In a commit of its own, the Offer form's price, in-stock and warranty fields move down a layer, where Feature-Sliced Design asks it, so that both forms draw the same fields. The Offer form's own tests pass unchanged.
- [x] **The section.** The top bar gains Part Requests between Offers and Details, marked current as the other two are. Its addresses are `part-requests` and `part-requests/new`, relative to the route, so the portal's own frame and the acting frame serve the same screens.
- [x] **The form.** React Hook Form's, with:
  - the Category chosen from the API's eight;
  - the name and the part number;
  - the shared price, in-stock and warranty fields.

  Digits go through `westernDigitsIn`, in the part number too. Each refusal is said beside its field in the portal's language. Sending returns to `part-requests` with a note naming the request, carried in the address's state.
- [x] **From the empty search.** The catalog search's empty result gains the action, placed as ticket 02 recorded. It opens the form with the search's words as the name and the search's Category, carried in the address so that a reload keeps them.
- [x] **The list.** Paged, 20 a page, with its page in the address, newest first. Each request shows:
  - its Category's name;
  - its name and part number `AsWritten`;
  - its prices on plates as an Offer's are shown, with its stock and warranty;
  - when it was sent;
  - its state, drawn as ticket 02 recorded. An added request names the Part `AlwaysEnglish` and links to `offers/<offerId>` while that Offer exists. A not-added request shows the reason `AsWritten`.

  With no request at all, the list says so and offers the form. A refusal and an API that cannot be reached are said with `WhyNotAnswered`.
- [x] **The query keys.** Every query about Part Requests is under `['part-requests']` in the dashboard's shared query keys. Whichever of tickets 03 and 04 lands first adds the key. A send asks it again.
- [x] **Words.** Every new text is in `i18n`'s dashboard set in the three languages, with `words.md`'s terms. Every plural form is given, and Arabic's one and two in words. No message formats a number. The Kurdish and Arabic are drafts under LANG-7.
- [x] **The end-to-end tests,** in the 360-pixel window, in Kurdish, Arabic and English, with made-up Vendors, Parts and part numbers made through the API:
  - sending from the empty search, with the words and Category filled, landing on the list with the request waiting;
  - sending from the section;
  - a request with no price, refused beside the price;
  - the three states, arranged by fulfilling and rejecting through the API as the Admin: added leading to the Offer, the reason as written, and waiting;
  - the fulfilled request's Offer on the Offers screen with the request's prices;
  - the Admin sending one for the Vendor under the band, which the Vendor's own portal then lists;
  - Kurdish and Arabic right to left, Western digits throughout, what was written shown as written, and `expectNoSidewaysScroll`.
- [x] **Accessibility.** `expectAccessible` passes in the light and the dark scheme on:
  - the list in each state;
  - the list with none;
  - the form with a refusal shown;
  - the empty search with its action.
- [x] **Motion.** What ticket 02's record makes move is filmed with `film` and judged by `snapsOf`, with reduced motion and without it.
- [x] **The inspector.** `pnpm dashboard:inspect` runs on the list and the form at 1440, 768 and 390 pixels, and at 1024 and 1280 where a desk layout changes between them. It runs in Kurdish and English, in both schemes, with the made-up Part Requests and with `--part-requests`. Every FAIL is fixed, and every WARN is fixed or defended in Comments, a design defence put to the owner. The results go in Comments as a table.
- [x] **A fault seen to fail once:** the Arabic text of a state removed, at the language files' check.
- [ ] **Phone checks**, recorded open until hosting: the form used with a thumb in Kurdish and English, a price and a part number typed on a Kurdish and an Arabic keyboard, the empty search's action reached with a thumb, the list read on a phone with a long Kurdish reason, and the motion felt with reduced motion on and off.
- [x] **Gates.** `pnpm check --skip-nx-cache` and `pnpm platform:check` pass.

## Comments

### 18 November 2026: built

On branch `part-requests/03-a-vendor-sends-a-part-request-and-follows-it`, from `part-requests/integration` at `fb4265b`, built to ticket 02's record: its Comments and the dashboard's DESIGN.md, the options at the owner's `.taste-skill/part-requests-02/`.

**The price fields moved down a layer first** (`d1d8ed7`, a move only). A feature may not import another, so the Offer form's price, in-stock and warranty fields went from the `offer-form` feature to the `offer` entity, with what they hold as typed and how they are sent and refused: `OfferDetailsFields`, `OfferDetailsTyped`, `offerDetailsTypedOf`, `offerDetailsOf` and `offerDetailRefusalOf`. The fields read their form through React Hook Form's `FormProvider`, as the Part form's specifications do, and take the prefix of their identifiers, so the Offer form's are as they were (`offer-form-usdPrice` and the rest). The Offer form's own tests passed unchanged on that commit, 25 of 25: `vendor-add-offer.spec.ts` (14) and `vendor-change-offer.spec.ts` (11).

**The rest** is one commit (`3a8b73f`):
- **The section.** The portal's sidebar and menu sheet gain Part Requests between Offers and Details, with lucide's `PackagePlus` (d1), marked current by `NavLink` as the other two. Since ADR-0011 the sections stand there and not in a top bar, as ticket 02 settled. Its addresses are `part-requests` and `part-requests/new`, relative to the route, in `vendor-portal-screens.tsx`, so the portal's frame and the acting frame serve the same screens.
- **The form**, the feature `part-request-form`, laid out as d4: one column at most 40rem, the Category (the browser's select, from the API's eight), the name (a field that grows, in its own direction) and the part number (left to right), then `OfferDetailsFields`, the refusal panel above the button and "Send the request". From 64rem "What happens next" stands beside it on Raised Stone, and on a phone it follows the form; the form's column is a CSS grid's first cell, so crossing 64rem keeps what is typed. Every digit goes through `westernDigitsIn`, the part number's too. A refusal of the Category, the name or the part number is said beside its field in the portal's language, under `PartRequestForm.refused`, and one of the Offer's details as the Offer form says it. Sending asks every query under `['part-requests']` again and returns to `..` with the request in the address's state (`SentPartRequest`).
- **From the empty search** (d3): the catalog search's empty result is an `output`, its title a heading, and under the sentence of what was searched it says that the Admin can add the Part, then offers "Search every Category" when a Category narrowed the search, and "Ask for it to be added", which opens `part-requests/new?search=<words>&category=<key>`, relative to the route. The form reads both from its address, so a reload keeps them, starts with them, says so on its Raised Stone line, and leads back to the search as it was. A search of no words offers no request.
- **The list**, the page `vendors-part-requests`, as d5: 20 a page, its page in the address, newest first, a table from 64rem (Part, Price, Sent, State) and two-line rows on a phone. Each request shows its Category's name, its name and part number `AsWritten`, its prices on `OfferPlate` (muted out of stock), when it was sent, its stock and its warranty, and its state as DESIGN.md's States draws it: Waiting with its days; Added as the Part `AlwaysEnglish` with "See your Offer" to `../offers/<offerId>`, or a Note Grey sentence once the Offer is removed; Not added with the reason `AsWritten`, line breaks kept, and "Send a corrected request". With none, the empty state offers the form. A refusal and an API that cannot be reached are said with `WhyNotAnsweredInThePortal`.
- **The query key.** `partRequestsKey`, `['part-requests']`, is in `shared/api/query-keys.ts`; the Vendor's list is under `['part-requests', 'of-vendor', vendorId, { page }]`. Ticket 04 may add the same key: the second to merge keeps one.
- **The motion** adds no curve and no duration: the note after a send arrives as Motion 6 says (`arrives`), and the request just sent arrives first in the list as a new row does (Motion 12), marked `data-arriving` on the list's first drawing, since the send asks the list again before the screen returns to it. Any row new to the same page answered again arrives, and one it no longer holds leaves, through `useLeavingRows`.
- **Words.** Every new text is in the dashboard set in the three languages: `VendorPortalFrame.partRequests`, four of `CatalogSearch`, and `PartRequestsScreen`, `NewPartRequest` and `PartRequestForm`. The English and Kurdish are ticket 02's drafts (`#words`), and the Arabic is drafted here with `words.md`'s terms (طلب قطعة, and قيد الانتظار, أُضيفت and لم تُضَف for the three states). Every counting message has every plural form, Arabic's one and two in words, and no message formats a number. The Kurdish and Arabic are drafts under LANG-7.
- `api-client` exports `SendPartRequestRequest`, the send's body, as it exports `CreateOfferRequest`.

### 18 November 2026: the end-to-end tests, written first

`vendor-part-requests-languages.spec.ts`, 10 lines in the 360-pixel window, with the browser in Arabic as written in Iraq, and its helpers: `part-requests.ts`, the requests over HTTP (`sendAPartRequest`, `vendorsPartRequests`, `fulfilAPartRequest`, `rejectAPartRequest`, `aMadeUpPartNumber`), which ticket 04 may share, and `vendor-part-requests.ts`, the portal's locators. Every Vendor, Part and part number is made through the API, and every line compares the screen with what the API answers, quoting no translation:
- **Sending from the section, in Kurdish**: the section marked current, the empty list offering the form, a request with its part number, price and warranty typed in Arabic-Indic digits, and the list with the note and the request waiting, today, as the API answers it.
- **A request with no price, in English**: refused beside the USD price, which takes the focus, and nothing sent.
- **The form in every language** (`checkInEveryLanguageOfTheVendorPortal`).
- **Sending from the empty search, in Arabic**: words narrowed to CPU coolers, the empty result a status with both actions, the form carrying the words and the Category through a reload, and the request waiting; and a second line for the way back to the search, Search every Category, and the form then opened with no Category.
- **The three states**, arranged by fulfilling and rejecting through the API as the Admin: in each language, added naming the Part and leading to `/offers/<offerId>`, the reason as written (Kurdish with Arabic-Indic digits, right to left in every language) and waiting, a name in Kurdish script right to left too, the same in every language; and the fulfilled request's Offer on its screen and on the Offers screen with the request's prices, stock and warranty.
- **The Admin acting as the Vendor** sends one under the band, from the bar's plus, lands on the list under the band, and the Vendor's own portal, in a browser of its own, lists it.
- **The motion**, with reduced motion and without it.

Each line was written before its code and run red first:
- **Cycle 1**, the first line alone: red for the right reason, no Part Requests section to tap (`portal-sections` held no `a[href$="/part-requests"]`). The Offer form's 25 lines ran with it, green.
- **Cycle 2**, every line written, with the pieces their lines drive held back by a scratch script: the added and not-added states, the refusals beside the form's own fields, and the empty search's action. 4 passed (the first line, the form's languages, the acting Admin and the motion without reduction: the relative addresses and the words came with the first slice). 6 failed, each for its reason: no `#part-request-form-usdPrice-error` (the refusal stood in the panel); the empty result not a status, and no `ask-for-it` (two lines); no `data-state="fulfilled"`, and no `see-offer` (two lines); and the reduced motion's opening, seen over 2 frames only under a 60-pixel bound. That bound was wrong for a phone's row, which takes some 140 pixels and passes 60 within a few frames on the out curve, so the line now counts the frames between none and the row's own height, and its `snapsOf` judgements are unchanged.
- **Cycle 3**, everything put back: 35 of 36 with the Offer form's and the portal frame's lines. The empty search's line found a real fault: after a reload the Category select showed none although the form held `cpuCooler`, because the Categories arrived after the select had taken its value. The select is now controlled through React Hook Form's `Controller`.
- **Cycle 4**: 10 of 10.

**Accessibility**: `expectAccessible` in light and dark on the list with none (the first line), the form with a refusal shown (the second), the empty search with its action (the fourth) and the list in each state (the sixth).

**Motion**, filmed with `film` four times slower and judged by `snapsOf`, with reduced motion and without: after a send the note fades in over several frames, and the request opens its space first in the list over several frames, its height and the row below it moving in no frame at once.

### 18 November 2026: the fault

Planted on the committed tree (`3a8b73f`) by one exact edit, run and taken out by the inverse edit, `git status` clean after, by a script in the ticket's scratch folder: the Arabic of the not-added state, `"notAdded": "لم تُضَف"`, removed from `ar.json`. `tools/check-language-files.mjs`, the step of `pnpm check`, failed: `libs/i18n/src/messages/dashboard/ar.json, "PartRequestsScreen.notAdded": is missing. The English file has it.`

### 18 November 2026: the inspector

The API and the dashboard were started under the e2e lock, the dashboard's sheet copied into `.taste-skill/`, and `pnpm dashboard:inspect --app` run as the Admin acting as the made-up shop's Vendor, `/vendors/00000000-0000-4000-8000-000000000001/portal`: on the list (`part-requests`), the form (`part-requests/new`, and from the search, `?search=Pretend+Frostline+240&category=cpuCooler`) and the empty search (`add?search=Pretend+Frostline+240&category=cpuCooler`), in Kurdish and English, in both schemes, at 1440, 768 and 390 pixels, with the made-up Part Requests and with `--part-requests worstCase|one|none`; and at 1024 and 1280 pixels on their own, since the list's table and the form's panel arrive at 64rem.

| Screen | Kurdish, light | Kurdish, dark | English, light | English, dark |
|---|---|---|---|---|
| The list, made-up requests | 0 FAIL, 0 WARN | 0, 0 | 0, 0 | 0, 0 |
| The list, `worstCase` | 0, 0 | 0, 0 | 0, 0 | 0, 0 |
| The list, `one` | 0 FAIL, 2 WARN | | 0 FAIL, 2 WARN | |
| The list, `none` | 0 FAIL, 2 WARN | | 0 FAIL, 2 WARN | |
| The form | 0, 0 | 0, 0 | 0, 0 | 0, 0 |
| The form from the search | 0, 0 | | 0, 0 | |
| The empty search with its action | 0 FAIL, 2 WARN | 0 FAIL, 2 WARN | 0 FAIL, 2 WARN | 0 FAIL, 2 WARN |

| At 1024 and 1280 pixels | 1024 | 1280 |
|---|---|---|
| The list, English, light | 0, 0 | 0, 0 |
| The list, Kurdish, dark | 0, 0 | 0, 0 |
| The list `worstCase`, Kurdish, light | 0, 0 | 0, 0 |
| The form, English, light | 0, 0 | 0, 0 |
| The form from the search, Kurdish, dark | 0, 0 | 0, 0 |

No FAIL. Every WARN is the pair `hero-void` and `panel-void` at 1440 pixels, on a screen shorter than the window: the list of one request or of none (53% of the first screen, a band of 437 to 490 pixels) and the empty search (33%, 233 to 245 pixels). They are defended below. The photographs were looked at: the table and its rows in both directions, the plate end-aligned, an English reason aligned left in the Kurdish portal and a Kurdish one right in the English, the worst case's names, part numbers and 300-character Kurdish reason wrapping in their cells and rows, and the form's panel level with its head from 64rem.

### 18 November 2026: the choices taken under the standing instruction

The owner was asleep, and ticket 02 had taken every design choice. Two more came up while building:
1. **The empty search's sentence.** Taken on the owner's standing instruction of 18 November 2026: the search's own sentence of what was searched is kept, "No Part in CPU cooler holds every word of “…” … Check the spelling, or search every Category." (it says truly that every word must match, and its "search every Category" now points at the button below it; the other option was DESIGN.md's shorter example sentence, "No CPU cooler has “…” in its name, its manufacturer or a part number.", which would have redrafted an existing sentence in three languages to say less). DESIGN.md's empty search now quotes it.
2. **The inspector's WARNs on short screens.** Taken on the owner's standing instruction of 18 November 2026, as a design defence: `hero-void` and `panel-void` at 1440 on the list with one request or none and on the empty search are kept (Framed sheet's sheet runs the window's height, and a short screen leaves its sheet empty below its content; the empty states already carry the screen's action, the search's now its two; the other options were to shorten the sheet to its content, which ADR-0011's frame does not do on any screen, or to fill it with content the screen does not have). `sharing` defended the same pair on the Referrals for one Vendor and for none.

### 18 November 2026: phone checks, open until hosting

As the owner's rule of 16 October 2026 asks, these wait for the platform to be hosted, and stay open:
- the form used with a thumb in Kurdish and in English;
- a price and a part number typed on a Kurdish and on an Arabic keyboard;
- the empty search's action reached with a thumb;
- the list read on a phone, with a long Kurdish reason;
- the motion felt with reduced motion on and off.

### 18 November 2026: the gates

- Each commit was gated on `pnpm check` before it was made: `d1d8ed7` (the move) and `3a8b73f` (the rest). Neither changes the API, so `pnpm integration:check` is not their gate.
- `pnpm platform:check` passed on `3a8b73f`, under the e2e lock: 476 lines in 24.0 minutes, this ticket's 10 among them.
- `part-requests/integration` was still at `fb4265b` when merged in, so the merge brought nothing.
- This record's commit is gated on `pnpm check --skip-nx-cache`, with every `*.tsbuildinfo` outside `node_modules` deleted first.
- The e2e lock was held for each run of the end-to-end tests, for the inspector's session and for `pnpm platform:check`, and released after each.
