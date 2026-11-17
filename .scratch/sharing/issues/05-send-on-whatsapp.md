# 05: Send on WhatsApp

**Spec:** [the sharing spec](../spec.md)

**What to build:** In the second price view, on the Build page and on the Shared Build page, each Vendor that gave a WhatsApp number has a "send on WhatsApp" button (SHR-5).

- **One tap** shares the Build if it has not been shared yet and records a Referral (SHR-6).
- **It opens a WhatsApp chat** with that Vendor in a new tab. The message is in the page's language and holds the Shared Build's link.
- **The count rises.** That Vendor's Referral count rises by one, and the Admin and that Vendor see it, nobody else.
- **The platform sends nothing itself.**

This makes success criterion 8 true.

**Blocked by:** 03, 04

**Status:** ready-for-agent

- [x] **The buttons**, built to DESIGN.md, on each Vendor's line of both pages' second price view. A Vendor that gave no WhatsApp number has no button, and its Vendor page stays linked.
- [x] **The forms.** Each button is a plain form sent with POST, with `vendor`, and opens in a new tab (`target="_blank"`), as the Vendor page's WhatsApp cell does.
  - From the Build page it is sent to `/{language}/build/send`, which shares the cookie's Build through `POST v1/shared-builds` first.
  - From the Shared Build page it is sent to `/{language}/builds/{sharedBuildId}/send`.
  - Each then records the Referral through `POST v1/shared-builds/{id}/referrals`, and is answered by `answerAForm` with 303 and the chat's address. `whatsAppChatWith` from `@pcp/links` writes that address with the number the Referral answered.
- [x] **The message** is one sentence in the page's language, naming the Vendor as it wrote its name, then the link. The link is `SHOPPER_PUBLIC_URL` followed by the Shared Build page's address in that language. It names no price and no city.
- [x] **Refusals.** A Vendor deactivated, or without a WhatsApp number, since the page was drawn, an empty or refused Build, and an API that does not answer each come back to the page the form was sent from, with the reason in the address. The page says the reason, and no chat is opened.
- [x] **With script**, the button cannot be pressed again while its first tap is being handled. Without script, each tap is a Referral, as SHR-6 says.
- [x] **Words.** The message and the refusals are in the `i18n` library's Shopper set in all three languages, the Kurdish and Arabic drafts for LANG-7. Removing the Arabic text of the message is seen to fail `pnpm check` once, then reverted.
- [x] **Seam 4**, the Shopper's unit tests:
  - the message in each language holds the link and the Vendor's name as written, and no price;
  - each refusal is read back from the address.
- [x] **Seam 3**, in a window 360 pixels wide, in Kurdish, Arabic and English. The chat is never opened: the test reads the address the new tab is sent to, and answers it with `page.route` so that nothing leaves the machine.
  - **From the Build page.** Tapping a Vendor's button opens a new tab to WhatsApp's chat with that Vendor's number. Its message holds the Shared Build's link in the page's language.
  - **The count rises.** That Vendor's count rises by one on the Admin console's Referrals screen and in its own portal. Another made-up Vendor's portal shows its count unchanged (success criterion 8).
  - **From the Shared Build page**, the same holds.
  - **No WhatsApp number.** A Vendor that gave none has no button.
  - **Without script.** Sending works with script switched off.
  - **Accessibility and motion.** `expectAccessible` passes on both pages with their buttons, in both schemes. The motion DESIGN.md adds is filmed with `film` and judged by `snapsOf`.
- [x] **`pnpm shopper:inspect`** runs on the Build page and on the Shared Build page with their buttons. It runs in both schemes, in Kurdish and English, at 1440, 768 and 390 pixels, and at 1024 and 1280 for desk layouts. Every FAIL is fixed, and every WARN is fixed or defended under Comments.
- [ ] **Phone checks** are recorded under Comments as open, waiting for hosting:
  - "send on WhatsApp" opening the WhatsApp app in a chat with the Vendor, with the message written in each language;
  - the button used with a thumb;
  - its motion felt on a real phone, with reduced motion on and off.
- [x] `pnpm check` and `pnpm platform:check` pass, and the work is committed.

## Comments

### 17 November 2026: Send on WhatsApp, its forms and its words

**Read first**: the brief, the ticket, the sharing spec whole, the MVP spec's requirements SHR and BLD, its Testing strategy and the conventions the ticket touches (the builder module's and the browse module's above all), `apps/shopper/DESIGN.md`'s Send on WhatsApp, The WhatsApp message, The feel on a phone and Motion 12, tickets 02 to 04 with their Comments and ticket 02's drafted words in the owner's `.taste-skill/sharing-02/` (`words.js`, `#d7`, `#d9m`, `#words`), `docs/agents/design-skills.md`, and the working memories the brief names.

**The commits**: `85fe6b2` (`feat`, no scope: the Shopper app, the Shopper set in `i18n` and the theme in `ui`) and `28d2746` (`test(e2e)`).

**The buttons** (`features/send-on-whatsapp`, drawn by the `build-quote` widget's Vendors' sheet on both pages):
- `SendOnWhatsApp`: a cell of the Board, 44 pixels tall (36 under a mouse at a desk, as every control of the theme) with 14 at its sides, "Send on WhatsApp" and the drawn arrow, mirrored in Kurdish and Arabic; its name for a screen reader "Send on WhatsApp to <the Vendor as written>, in a new tab", which holds its words (WCAG 2.5.3). It stands at the end of the row whose start is "Its Parts", floated there before the disclosure as ticket 02's rendering floats it, so that on a line too narrow for both, as at a phone's largest text, it takes the row and "Its Parts" the next (seen at 390 pixels with the text at 32 pixels in Kurdish and English).
- `NoWhatsAppNumber`: "Gave no WhatsApp number" in Body Soft Ink in its place, the Vendor's name still a link to its Vendor page; `GET v1/build`'s `hasWhatsAppNumber` decides which.
- The arrow is the coupon's map cell's, moved unchanged from `_pages/vendor` into the Shared layer (`OutArrow`), so that both pieces draw it.
- Each Vendor's line is the anchor `vendor-<id>` (`vendorLineAnchor`), where a refused send opens the page.

**The forms** (`_app/routes/send-on-whatsapp.ts`), each a plain form sent with POST and `vendor` to a new tab (`target="_blank"`), answered by `answerAForm` with 303:
- `POST /{language}/build/send` (`sendTheBuild`) shares the cookie's Build first, as Share this Build does: the share form's step moved out of `shareTheBuild` into `shareTheBrowsersBuild` and `aRefusedShare` in `share-and-copy.ts`, which both forms use, the share form's answers unchanged (its 12 lines pass).
- `POST /{language}/builds/{sharedBuildId}/send` (`sendTheSharedBuild`) sends that Shared Build.
- The ticket likens the new tab to the Vendor page's WhatsApp cell, which opens its chat in the same tab; the coupon's cell that opens a new tab is Open in Google Maps, whose arrow Send on WhatsApp draws, as DESIGN.md says (a follow-up for ticket 06's record).
- Each then records the Referral through `POST v1/shared-builds/{id}/referrals` (`_app/api/record-a-referral.ts`) and answers the new tab with `chatWithTheVendor`: `whatsAppChatWith` from `@pcp/links` with the number the Referral answered, never a copy the page was drawn with, and the message written in.

**The message** (`theMessage`): one sentence in the page's language naming the Vendor as it wrote its name, then the link on a line of its own, `sharedBuildLink` on `SHOPPER_PUBLIC_URL` in the page's language; no price and no city. The words are ticket 02's, the owner's choice: "Hello {vendor}, I planned this PC on {site}: do you have its Parts?", the platform named by `Site.name`, the name slot's words, so that they are written once; the Kurdish is ticket 02's draft and the Arabic its rendering's, both for LANG-7. The Vendor's name is handed to the sentence as a value, never read as words of the message, so a name holding `{` or `'` is written as it is, and no direction mark is put around it, as DESIGN.md says.

**The refusals**, each back to the page the form was sent from with its reason in the address, which the page says, and no chat (`addressAfterARefusedSend`, `refusedSendIn`):
- A Vendor no longer reachable, deactivated (404 `VENDOR_NOT_FOUND`) or without a WhatsApp number (400 naming `vendorId`) since the page was drawn: `?refused=notReachable&vendor=<id>#vendor-<id>`. Under its line, "<the Vendor as written> can no longer be reached through the platform."; a Vendor whose line has gone, as a deactivated one's has, at the head of the Vendors' sheet (see what waits on the owner).
- An API that does not answer, or fails: `?refused=notOpened&vendor=<id>#vendor-<id>`, "WhatsApp could not be opened just now. Try again in a moment." under the line.
- From the Build page, an empty Build or one the API refuses: answered as a share refused is, `?refused=nothingToShare` and `?refused=notReadable` (see what waits on the owner).
- A Vendor the form names by anything but an identifier, which only a form sent by hand does, is not written into the address: `?refused=notReachable#vendors`. The reader says nothing for a reason it does not know, and reads a Vendor that is no identifier as none. A Vendor past the fifth comes unfolded when its send was refused.

**With script** the button is the Shared layer's `SubmitOnce`: from its first tap it says "Opening WhatsApp…" at once, keeps its pressed ground and takes no other tap or Enter. Its page is not left, since the form opens a new tab, so `SubmitOnce` now also takes taps again when the page is seen again after being hidden (`visibilitychange`), as when the Shopper comes back from WhatsApp, beside its return from the back-forward cache; its idle words may carry a drawn mark after them. Without script each tap is sent and is a Referral.

**The motion** (Motion 12): the press settles to 0.97 and the busy words change at once in a held width; a refused send's line prints in under its Vendor's line, `prints-under-its-line` in the theme (11's `line-prints`, `--line-print`, 150 ms after the first paint), the page shown printed as a page opened at an anchor is, there at once with reduced motion or without script, and printed on a page come back to.

**The words**, in the Shopper set in all three languages, `BuildPage.send`: the button, its busy words, its name for a screen reader, "Gave no WhatsApp number", the message and three refusals, using `words.md`'s Vendor (فرۆشیار, البائع); the Kurdish is ticket 02's draft where it drafted one, the rest drafted here, for LANG-7.

**Seen by hand**, as ticket 04 saw its own, since no line of the platform can make the API not answer the Shopper app's server: a Shopper app on port 3112 pointed at an API that does not answer (`API_URL=http://127.0.0.1:9`). A send from the Build page came back `303 /ckb/build?refused=notOpened&vendor=<id>#vendor-<id>`; one from a Shared Build page first answered **500**, since the client hands back what the request threw when no answer comes and reading it as the API's errors threw again. Fixed in `7071eea` (`fix(shopper)`): why a Referral was refused is a plain function of the Shared layer's `api` segment, `whyAReferralWasRefused`, which reads only the API's own errors, its unit test seen red on that `TypeError` first; the same send then came back `303 /en/builds/<id>?refused=notOpened&vendor=<id>#vendor-<id>`, and one with no Vendor `?refused=notReachable#vendors`.

### 17 November 2026: the tests at the two seams, and the faults

**Seam 4**, the Shopper's unit tests, written before the code each tests and each seen red on an assertion first, the functions answering nothing: 935 tests in 46 files, 40 of them new.

| Test | What it holds |
|---|---|
| `features/send-on-whatsapp/the-message.spec.ts` | the message in English as the owner chose it, in Kurdish and Arabic as drafted, then the link; in each language the Vendor's name as written, in Latin, Kurdish and Arabic script and one holding `{`, `'` and `&`, in one sentence, the link in its language on the last line, no figure and no currency's mark around it, no city, a different sentence in each language; and the chat's address, `wa.me` with the number's digits and the message written in |
| `features/send-on-whatsapp/a-refused-send.spec.ts` | each refusal's address, from the Build page and a Shared Build page in each language, opened at the Vendor's line; the Vendor in small letters; none written, and the page opened at its Vendors, for a Vendor that is no identifier; each read back, and nothing read for a share's, a copy's or a change's refusal, a reason in other letters or another parameter |

**Seam 3**, `shopper-send-on-whatsapp-languages.spec.ts` with `send-on-whatsapp.ts`, in the 360-pixel window: 12 lines, 1.3 minutes. They make three Vendors, two with a WhatsApp number whose Logins have logged in, so that each one's portal can be read, and one without; four Parts and seven Offers through the API, the Platform Rate set; and pick the Build from their own browser, GPU first.

**The chat is never opened.** A route sees only the first request of a redirect, not the address it leads to (Playwright's own note on `page.route`), so in the first three runs a route on `wa.me` missed the tab's request, which reached WhatsApp's site in the headless browser, `wa.me` answering it with its page for starting a chat on `api.whatsapp.com`, with a made-up number and the test's message, about nine times in all; nothing was sent to anyone, since a message is sent only by its sender in WhatsApp itself, and it is reported to the coordinator. The test now answers the form itself (`answerWhatsAppsChatHere`): it asks the Shopper app for the form's answer with no redirect followed, reads the address the tab is sent to, and answers a chat with a page of its own, and a refusal as the Shopper app answers it. Under that, the file's browser finds `wa.me`, `api.whatsapp.com` and `web.whatsapp.com` nowhere (`--host-resolver-rules`), so that no line of it can reach WhatsApp even if a route missed.

| Line | What it checks |
|---|---|
| From the Build page, in Kurdish, Arabic and English | the form's POST, `target="_blank"` and its address in the page's language; its name naming the Vendor; a tap opens a new tab sent to `wa.me` with the Vendor's number as the API answers it; the message's first line names the Vendor as written, with no figure or currency, and differs in each language; its link is the Shared Build page in the page's language, whose stored values are the Build's; one Shared Build for the three; the page tapped stays where it was; the count, as the API answers it, rises by one each tap; then the Admin's Referrals screen and the Vendor's own portal show the API's count, and the other Vendor's portal says none (success criterion 8) |
| From the Shared Build page, in the three languages | the same, from a fresh browser, the link exactly the page's address in its language, the Shared Build unchanged |
| No WhatsApp number | on both pages, no button and its words in the button's place, the name still linking to its Vendor page |
| One tap while busy | the button busy, its name now its busy words; its form sent again with `requestSubmit` opens no second tab, one chat, the count up by one |
| Without script | two taps, two chats, the count up by two (SHR-6) |
| Refusals | a Vendor deactivated since the Build page was drawn: back to the Build page with `notReachable`, the line gone and the refusal at the sheet's head with the anchor; a Vendor without a WhatsApp number since the Shared Build page was drawn: back to that page, "Gave no WhatsApp number" on its line and the refusal under it naming it; an emptied Build and one the API refuses: `nothingToShare` and `notReadable`, said as a share's; an API that does not answer: the page reads `notOpened` from its address and says it under the line, in view; in each, no chat and no Referral |
| WCAG 2.2 AA | `expectAccessible` in Kurdish and English, light and dark, on the Build page with its buttons, a Vendor with none and a refusal said, and on the Shared Build page with its buttons |
| Motion 12, with and without reduced motion | filmed with `film` slowed four times: the button's width held as it turns busy, the next Vendor's line not moving (`snapsOf`); filmed from the first frame with `filmFromTheFirstFrame`: the refusal prints in (and is there at once with reduced motion), holds its height from the first frame, and the next line, from the refusal's own line, never snaps, judged once the page's fonts have arrived, whose arrival moves every line of the page once (24 to 72 pixels in the first runs) |

`admin-referrals.spec.ts`'s helpers for the Referrals screen moved, unchanged, into `referrals.ts` (`findOnTheReferrals`, which takes the Admin's authorization), and the browsers `aMadeUpVendorThatHasLoggedIn` and `atTheLoginScreenInABrowserOfItsOwn` make now run script whatever the worker's first line asked: a worker restarted at the line with script switched off had run the file's set-up with script off and never reached Keycloak's login screen.

**The faults**, each planted with one exact edit after its work was committed, run, and reverted by the inverse edit, `git status` clean after each:

| Fault | Run | What failed, and why |
|---|---|---|
| The Arabic message, `BuildPage.send.message`, removed from `shopper/ar.json` (the ticket's own fault) | `pnpm check` | Exit 1 at `check-language-files.mjs`: `ar.json, "BuildPage.send.message": is missing. The English file has it.` |
| The form opening in the same tab (`target="_blank"` removed) | the Build page's line | its form's `target` expected `_blank`, received none |
| The message's link always in English | the Shared Build page's line | in Kurdish, the link `…/en/builds/<id>` where `…/ckb/builds/<id>` was expected |
| A busy button sending its form again (`SubmitOnce`'s guard removed) | the one-tap line | "no second tab": a second tab opened |
| No refusal at the sheet's head for a Vendor no longer on the page | the deactivated Vendor's line | the refusal with the Vendor's anchor not found |
| The refusal not printing in (`prints-under-its-line` removed) | both motion lines | with full motion, "the refusal prints in" false; with reduced motion it passed, as it should |

### 17 November 2026: Taste's inspector, and what waits on the owner

`pnpm shopper:inspect` ran under the lock on `28d2746`, against this worktree's built API on 3103 for the catalog's one reading, with the Shopper's sheet in place: 16 runs in `.taste-skill/sharing-05-inspect/` (ignored by Git), the Build page with its buttons on the complete and the worst-case Build, and the Shared Build page with its buttons for a reader with no Build (`…700001`) and for one with a Build of its own on the worst case (`…700002`, `--build complete`, 18 Vendors, four with no WhatsApp number), in Kurdish and English, light and dark, at 1440, 1280, 1024, 768 and 390 pixels. **0 FAIL.**

| Page | Runs | WARNs |
|---|---|---|
| The Build page, complete (`--build complete`) | `build-*` | `dashed`; `no-footage` at 1280 and 1440; `grey-body` in light; `name-only-title` at 390 in Kurdish |
| The Build page, worst case (`--build worstCase`) | `buildworst-*` | `dashed`; `no-footage`; `grey-body` in light; `name-only-title` at 390 and 768 in Kurdish |
| A Shared Build, a reader with no Build (`…700001`) | `copy-*` | `dashed`; `no-footage`; `grey-body` in light; `name-only-title` at 390 and 768 in Kurdish |
| The worst-case Shared Build, a reader with a Build of its own (`…700002`) | `worst-*` | `dashed`; `no-footage`; `grey-body` in light |

Every WARN is ticket 04's, defended there against the references the owner kept (`browse` ticket 14's and `builder` ticket 10's) and kept by the owner's `#d2` answer of 17 November: `dashed`, the dot leaders, perforations and the slip's rules; `no-footage`, still photographs by design; `grey-body` in light, second lines and notes in Soft Ink at 6.6:1, "Gave no WhatsApp number" among them now; `name-only-title` in Kurdish, the slip's heading and total above the title saying what the page is. None is new with the buttons, which stand far below every first screen the inspector judges.

The inspector's pictures keep one desk, one tablet and one phone, none reaching the Vendors' sheet, so the sheet was looked at in captures of its own on the made-up shop (the stand-in on 3111, `next dev` on 3110 in `tmp/viewing`), every one with nothing scrolling sideways: at 390 in English and Kurdish, at 1440, at 1024 and 1280 on the worst case in English and Kurdish and in the dark on both pages, at 360 on the worst case, and at a phone's largest text (32 pixels) at 390 and 320 pixels, where the cell takes the row, its words on several lines, and "Its Parts" the next. Each cell stands at the end of its row, its arrow mirrored in Kurdish, "Gave no WhatsApp number" in Soft Ink in its place, and a refusal under its line or at the sheet's head.

**What waits on the owner**, put on the page `.taste-skill/sharing-05/` (from the scratchpad's `sharing-05/`), each built as option A, the recommendation, and drawn from the built page on the made-up shop with B beside it:

1. `#d1`: **a Vendor deactivated since the page was drawn has no line any more**, and the page no longer has its name, since the API answers a deactivated Vendor to no Shopper, where DESIGN.md says the refusal stands under the Vendor's line and names it. A (built): at the head of the Vendors' sheet, under its note, where the address's anchor lands, "The Vendor you chose can no longer be reached through the platform.", and under the slip's action on a page left with no Vendors' sheet. B: the same place naming the Vendor, the form sending its name for the address to carry back, not recommended, since anyone could then make a link whose page says any name "can no longer be reached".
2. `#d2`: **a Vendor that took away its WhatsApp number since the page was drawn**, for which DESIGN.md has no words. A (built): the deactivated Vendor's words under its line, "Mock Hardware House can no longer be reached through the platform.", the sharing spec counting both as a Vendor no longer reachable, the line itself now saying "Gave no WhatsApp number". B: words of its own, "… no longer gives a WhatsApp number, so no chat was opened."
3. `#d3`: **an emptied Build, or one the API refuses, sent from the Build page**. A (built): answered as Share this Build's refusals, since a send shares first: the empty Build's slip says "Your Build holds no Part yet, so there is nothing to share.", and a Build the API refuses shows its own sheet. B: words of their own for a send, "… so there is nothing to send."

So the box of the refusals stays open until the owner answers, and DESIGN.md is written with the answers, by Impeccable, with what building taught: a refused send's line opens the fold of the Vendors past the fifth when its Vendor is among them, the refusal stands at the foot of the Vendor's line, under "Its Parts", as ticket 02's rendering set it, and a button sent to a new tab takes taps again once its page is seen again.

**Phone checks, open, waiting for hosting** (the owner's rule of 16 October 2026):
- "send on WhatsApp" opening the WhatsApp app in a chat with the Vendor, with the message written in each language, its link previewed, and the Vendor's name in Kurdish or Arabic inside an English message, and the other way round, drawn in its own direction;
- the button used with a thumb, in Kurdish and in English, at the end of its row beside "Its Parts" and, at a phone's largest text, on its own row; coming back from WhatsApp to the page as it was left, the button taking a tap again;
- its motion felt on a real phone, with reduced motion on and off: the press, the busy words in a held width, and a refused send's line printing in.

**The gates so far**, before the owner's answers:
- `pnpm check` before each commit, 935 unit tests in 46 files among it.
- `pnpm platform:check`, under the lock, on `7071eea`: 466 passed in 22.7 minutes, none failed, this ticket's 12 lines among them and every earlier spec unchanged but `admin-referrals.spec.ts`, whose helpers moved.
- `pnpm integration:check` was not run: the ticket changes no API code.
- This record is gated with `pnpm check --skip-nx-cache` after deleting every `*.tsbuildinfo` outside `node_modules`. `sharing/integration` has not moved since `b65eb55`, which the branch starts from; the Finish merges it again once the owner has answered.

### 17 November 2026: the owner's answers, and the Finish

The coordinator put the three questions and the page in `.taste-skill/sharing-05/` to the owner, and relayed the owner's words: "All recommendations". So, each as built:

1. **`#d1` A.** A send refused for a Vendor no longer on the page, as one deactivated since the page was drawn, is said at the head of the Vendors' sheet, under its note, without the Vendor's name: "The Vendor you chose can no longer be reached through the platform."; on a page left with no Vendors' sheet, under the slip's action.
2. **`#d2` A.** A Vendor that took away its WhatsApp number since the page was drawn is said under its line in the deactivated Vendor's words, "<the Vendor as written> can no longer be reached through the platform.", the line now saying "Gave no WhatsApp number".
3. **`#d3` A.** A send from the Build page of an emptied Build, or of one the API refuses, is answered as Share this Build's refusals are, since a send shares first.

The refusals' box is ticked: every refusal the ticket names comes back to the page the form was sent from with its reason in the address, the page says it, no chat is opened, and seam 3 proves each that a line of the platform can cause, the API that does not answer seen by hand.

**DESIGN.md**, merged by Impeccable as the file stands (its `document` reference's merge, the owner's answers being the instruction), in the file's own terms: the head comment; Components › The Build page › Send on WhatsApp, with the three answers and, from building, the refusal at the foot of its Vendor's line under "Its Parts", as ticket 02's rendering set it, and a Vendor past the fifth coming unfolded with its refusal; Layout › The feel on a phone › One tap, one Referral, a button sent to a new tab taking taps again once its page is seen again; and Motion 12's refused send, printing in at the sheet's head too. Nothing of ADR-0013 is replaced, so no ADR is written.

**The Finish.**
- `sharing/integration` is still `b65eb55`, the commit the branch starts from, so there was nothing to merge.
- Every `*.tsbuildinfo` outside `node_modules` deleted, then `pnpm check --skip-nx-cache` on the commit that closes this record.
- No code changed since `pnpm platform:check` passed on `7071eea` (466 passed), so it was not run again; `pnpm integration:check` was not needed, the ticket changing no API code.
