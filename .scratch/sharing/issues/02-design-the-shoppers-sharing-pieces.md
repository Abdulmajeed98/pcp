# 02: Design the Shopper's sharing pieces

**Spec:** [the sharing spec](../spec.md)

**What to build:** The share button, the Shared Build page, Copy into my Build and the "send on WhatsApp" button are pieces that [the Shopper app's DESIGN.md](../../../apps/shopper/DESIGN.md) does not describe yet. They are designed inside the printed price list's look (ADR-0013), with no new direction dealt. The stand-in API that `pnpm shopper:inspect` starts first learns to answer Shared Builds, so that each piece's options are rendered with made-up data, and ticket 04 and 05's pages can be inspected without the development database. The owner chooses each piece by eye, and Impeccable writes the choices into DESIGN.md before any page is built.

**Blocked by:** 01

**Status:** resolved

- [x] **The stand-in answers Shared Builds.**
  - It answers `GET v1/shared-builds/{id}` for three made-up Shared Builds:
    - one made from the made-up Build `complete`;
    - one made from `worstCase`;
    - one whose Parts no catalog holds.
  - `GET v1/build`'s Vendors answer whether they gave a WhatsApp number, and some of the made-up shop's Vendors have none.
  - It is typed by `@pcp/api-client`'s own types, so a change to the description that it does not follow fails `pnpm check`.
  - Writes are still refused with 405, and every other path with 404. No test of the platform relies on it.
- [x] **`pnpm shopper:inspect` opens a Shared Build page by its path.** With `--build complete` and the `complete` Shared Build, the page is in its "This is your Build" state. The commands table and the design skills guide say how.
- [x] **The guide is read first**, and so are DESIGN.md, ADR-0013 and `builder`'s design ticket 06.
- [x] **The pieces to design**, Taste leading their composition inside the chosen direction:
  - the share button on the Build page, shown only when the Build holds a Part;
  - the Shared Build page as a sheet of the same stationery: its Parts with their quantities and no forms that change them, its status, its outcomes, its power draw and both price views, as the Build page draws them;
  - when the Build was shared, and the note that its Parts are fixed and its prices are today's;
  - "This is your Build", for a browser that holds the same Build;
  - Copy into my Build, with its one confirmation when the browser holds a Build of its own;
  - Share the link: the phone's share sheet, a copy where there is none, and the link as text to select without script;
  - the "send on WhatsApp" button on each Vendor's line in the second price view, a Vendor's line with no button where it gave no WhatsApp number, and what the page says when a send is refused;
  - a Shared Build whose Parts have all left the catalog.
- [x] **The words.** Impeccable leads their copy. They are drafted in English and shown with the options:
  - the WhatsApp message: one sentence naming the Vendor, then the link, with no price and no city;
  - the note of what is fixed and what is today's;
  - the copy's confirmation;
  - the refusals.

  `words.md` gains Shared Build and Referral in the three languages, the Kurdish and Arabic drafts for LANG-7.
- [x] **The rendering.** Each piece's options are drawn with the made-up shop and its Shared Builds, in Kurdish and in English, at 390 pixels and at 1440, at 1024 and 1280 where a desk layout differs, and in both schemes. They are served from the scratchpad, never opened as a file, and shown in the built-in browser, one option to an anchor and two columns at most, before the owner is asked. An option that breaks a hard rule says so on its page.
- [x] **The motion**, led by Emil Kowalski's skills: whether the share, the hand-off to WhatsApp, a copy landing on the Build page and a button busy with its first tap move at all, and how, in the motion of paper and print DESIGN.md already holds. It covers reduced motion and the No Snap Rule. Movements are rendered live for the owner.
- [x] **The feel on a phone**, led by Emil's `mobile-native`: the share sheet, a new tab opening WhatsApp, and each button taking a tap at once.
- [x] **The worst cases**, led by Emil's `break-ui`:
  - the `worstCase` Shared Build;
  - the Shared Build whose Parts are all gone;
  - 20 Vendors, some without a WhatsApp number;
  - the longest names;
  - a Vendor name in Kurdish inside the English message.
- [x] **The choosing.** The owner's choice for each piece is recorded under Comments with the owner's words. A choice the owner refuses is rendered again.
- [x] **The record.** Impeccable writes the choices into the Shopper app's DESIGN.md, the motion in its Motion section, before any page is built. The hard rules hold, and a piece that pulls against one is put to the owner. An ADR is written only if a choice replaces part of ADR-0013.
- [x] `pnpm check` passes, and the work is committed.

## Comments

### 17 November 2026: the stand-in's Shared Builds, and the renderings for the owner

**Read first**, before anything was drawn: `docs/agents/design-skills.md`, `apps/shopper/DESIGN.md` whole, ADR-0013, `builder`'s design ticket 06 with its Comments, the sharing spec, the MVP spec's conventions the ticket touches, and ticket 01's Comments.

**The stand-in answers Shared Builds** (`cfbc7fe`).

- `apps/inspector/src/made-up-shared-builds.ts` holds three made-up Shared Builds, each with an identifier that says it is made up: `complete` (`00000000-0000-4000-8000-000000700001`), made from the made-up Build `complete`, shared three hours before the command starts; `worstCase` (`…700002`), made from `worstCase`, 12 days before; and `leftTheCatalog` (`…700003`), eight `part` values no catalog holds (a CPU, a motherboard, two RAM kits and a drive with their quantities, a GPU, a case and a PSU), 400 days before, whose Build `GET v1/build` answers as empty, as it leaves out a Part that has left the catalog. Their values are the made-up Builds' `partValuesOf`, in the catalog's order of Categories and then the Build's, as the API freezes them.
- The shop holds them (`ShoppersShop.sharedBuilds`, written by `theShoppersShop` at its `now`), and `answerFromTheStandIn` answers `GET v1/shared-builds/{id}` from them, typed `SharedBuildResponse`, its address checked against `ReadSharedBuildData['url']` with `satisfies`, so that a renamed path or field fails `pnpm check`. An identifier it holds none of, or text that is not one, is answered 404 `SHARED_BUILD_NOT_FOUND`, as the API answers it, not as a refusal of the stand-in's. Every write is still 405 (sharing and recording a Referral among them) and every other read 404 (the Referral counts among them). `@pcp/api-client`'s index now exports `SharedBuildResponse` and `ReadSharedBuildData`, which it had not.
- `GET v1/build`'s Vendors already answered `hasWhatsAppNumber` from ticket 01. Three more Vendors give every detail but a WhatsApp number, Mock Hardware House, متجر التجربة للإلكترونيات and Demo Devices, beside Pretend Tech: one of the complete Build's five Vendors, and four of the worst case's 18. The dashboard's shop keeps its Vendor as it was.
- No test of the platform relies on it.

The tests, at the inspector's unit seam, `pnpm check`:

| Test | First run |
|---|---|
| `stand-in-api.spec.ts`: the complete Shared Build answered with its eight values in the catalog's order, its quantities and the moment three hours before the tests' now | Red: 404, the path not answered |
| the worst case's 22 values, its 16 kits and drives with quantities, 12 days before | Passed: the first slice's answer already held every Shared Build |
| the one no catalog holds, 400 days before, eight values with three quantities, its Build reading empty | Red: three quantities expected, the data held two (a RAM kit was missing; the data was corrected to the comment) |
| an unknown identifier and a text answered 404 `SHARED_BUILD_NOT_FOUND`, not refused | Passed: the first slice's answer |
| writes to `v1/shared-builds` and its referrals refused 405; reads of the Referral counts and other paths 404 | Passed: the refusals were already general |
| `the-shoppers-shop.spec.ts`: four Vendors give no WhatsApp number, the three with every other detail | Red: one Vendor without, three expected |
| `made-up-builds.spec.ts`: the complete Build's second view holds one Vendor without a number of five, the worst case's four of 18 | Red: none of the complete Build's |
| `made-up-shared-builds.spec.ts`: the complete and worst-case Shared Builds hold what `--build complete` and `--build worstCase` put in the cookie, so the browser holding one is told it is its own Build; the third holds none of the shop's Parts; the identifiers | Passed: a relation the first slice built |

**`pnpm shopper:inspect` opens a Shared Build page by its path**, `/builds/<identifier>`, and prints the three pages' paths as it starts. The commands table (the MVP spec) and the design skills guide say how. It was run once under the lock, against this worktree's API on 3103: `pnpm shopper:inspect /builds/00000000-0000-4000-8000-000000700001 --language en --scheme light --build complete --widths 390`, which started the stand-in with its 3 Shared Builds and the Shopper app, and answered the not-found page, since the Shared Build page is ticket 04's (0 FAIL, 1 WARN, `first-action`, on the not-found page). The box stays open: the page's "This is your Build" state can be seen only once ticket 04 builds the page; the stand-in already answers what it needs.

**The renderings**, for the owner, are in the scratchpad's `sharing-02/` (for the owner's `.taste-skill/sharing-02/`, served on port 4110): `index.html` lays out ten choices, `#d1` to `#d10`, each option at an anchor of its own (`#d1a`, `#d1b`, …), A the recommendation every time with its reason, then `#worst`, `#phone`, `#words` and `#answers`. Every window is the real Shopper app: its Build page, drawn by the app on the made-up shop through the stand-in (on 3111, with `next dev` on 3110 in `tmp/viewing`, the catalog read once through this worktree's API on 3103, no port of the lock used), was captured with its stylesheet, fonts and pictures and no script into `base/`, and each option is drawn into that markup with the theme's own classes by `pieces.js`; the few rules the new pieces add are in `pieces.css`, each a proposal for the theme. Each window is live: its buttons play what they would do (share lands on the Shared Build page, send shows the new tab's message, copy lands on the Build page, Copy the link answers in place). Phones at 390, desks at 1440, and 1024 and 1280 for the composition, whose desk layout is the Build page's; English and Kurdish; a switch for both schemes, one for reduced motion and one that slows every movement four times.

How each skill was run: Taste (`design-taste-frontend`) for "a component or a single section, not a page", no draw, matching the printed price list, the pieces reused (the slip, the sheet, the stamp, the cells, the mark of a chosen thing); Impeccable's `clarify` for every word, drafted in English with the Kurdish for LANG-7; Emil Kowalski's `emil-design-eng` asked what the share, the hand-off to WhatsApp, a copy landing, a busy button and Copy the link should do, its frequency gate keeping every new motion out but the stamp's landing and the words that answer a tap; `mobile-native` for the share sheet, the new tab and the taps; `break-ui` on the worst cases. The design skills' own files were not changed.

**Measured.** 280 drawings in headless Chrome, every window in both schemes and each phone also at 320 pixels: no script error, nothing scrolling sideways, no text under 14 pixels nor Arabic script under 15. The new controls are 44 pixels or more on a touchscreen; at the desks the theme's own controls take 36 under a mouse, as DESIGN.md allows. On a phone at 390 pixels the complete Shared Build is about 6,570 pixels long in English and 7,510 in Kurdish, the worst case's 13,330 and 15,590 with its folds folded, and a Shared Build whose Parts have all gone 1,470 and 1,650.

**`words.md`** gains Shared Build (بیڵدی هاوبەشکراو, تجميعة مُشارَكة) and Referral (ڕەوانەکردن, إحالة), the drafts for LANG-7; Referral leaves the list of terms no Shopper or Vendor reads, since the Vendor portal now shows a count.

Nothing was written into DESIGN.md before the owner chose. The checks on a phone wait for hosting, as the spec's Open checks list them.

### 17 November 2026: the owner's choice

The coordinator served the page at the owner's `.taste-skill/sharing-02/` and showed it to the owner, then relayed the owner's words exactly: "all recommendations with proper motions". What follows is the coordinator's reading of those words, recorded as such: every option A of `#d1` to `#d10`, and the six fixes of `#worst`.

1. `#d1` The share button: on the Build's till slip, the Build page's one primary button.
2. `#d2` The Shared Build page: the Build page's composition, its slip carrying what a reader can do.
3. `#d3` When it was shared: "Shared 12 days ago, on 5 November 2026. Its Parts stay as they were shared; its prices are today's.", and a date stamp under the title.
4. `#d4` "This is your Build": on the slip in the copy's place, with the mark of a chosen thing.
5. `#d5` Copy into my Build: confirmed in place, as emptying is; no question for an empty Build.
6. `#d6` Share the link: the link printed on the slip, and one button, the share sheet or a copy.
7. `#d7` Send on WhatsApp: a cell at the end of the row that holds "Its Parts"; "Gave no WhatsApp number" where there is none; a refusal under the line.
8. `#d8` All Parts gone: one sheet that says so, with "Start your own Build".
9. `#d9` The motion: each moment answered by the paper.
10. `#d10` The WhatsApp message: it names the Vendor and the platform.
11. `#worst`: the stamp under the title, the link breaking anywhere, the held widths, "Gave no WhatsApp number", the words that speak of the Build as the sender's, and the note counting Parts that left the catalog.

No option was refused, so nothing is drawn again. The follow-up the first report raised was taken too, as the coordinator relayed: Empty the Build's confirmation opens and folds in 150 ms with reduced motion, as the copy's does (the No Snap Rule). That changes the Build page's Motion 10 for Empty the Build, recorded in DESIGN.md; the code is ticket 04's, which builds the copy's confirmation beside it, and nothing in the Shopper app changes here.

**"With proper motions"**, as the coordinator read it: the motion is not thinned out, each new piece moving as the paper-and-print motion DESIGN.md holds. Emil Kowalski's `emil-design-eng` and `animate` led it, and its frequency gate still kept anything that would play on every visit out. What `#d9`'s A already showed stands: the Shared Build page printing as the Build page does with its two stamps landing, the press and the busy words, "Link copied" cross-fading, the copy's confirmation unfolding and a copied Build arriving on the Build page and printing anew. Three movements `#d9`'s A had not shown were added and drawn live under a new anchor, `#d9m`, on the same page: the tick of "✓ Link copied" printing in from its start edge (200 ms, 60 ms after the words), a refused send's line printing in under its Vendor (Motion 11's line print, 150 ms after the first paint), and both confirmations opening in 150 ms with reduced motion. None pulls against a hard rule, so none was put to the owner again. Read back in headless Chromium with `getAnimations()`: an arriving Shared Build page runs the sheet's and the slip's prints (900 ms), the date stamp's landing at 900 ms and "Complete Build"'s at 1150 ms, and its prices settling 45 ms apart from 300 ms; "Copy the link" runs the 150-ms cross-fade and the 200-ms tick from 60 ms; the refusal runs its 450-ms print from 150 ms. In a browser asking for reduced motion both confirmations, sampled each frame, opened from 52 to about 200 pixels over 150 ms rather than in one frame.

The coordinator's message also listed "a copied Build arriving on the Build page shown printed as a pick's answer is". The recommendation the owner kept, `#d9` A, has the Build page opened anew and printing, as after emptying, and that is what is recorded: a copy is answered with the Build page from its top, not at an anchor as a pick's is, and printing anew is the fuller motion "proper motions" asks for. This is flagged in the report, so that the coordinator can say if the other was meant.

### 17 November 2026: the record

Impeccable writes the choices into `apps/shopper/DESIGN.md`, merging them into the file as it stands (its `document` reference's merge, the ticket being the instruction to change an existing DESIGN.md), in the file's own terms. Its head comment says what this ticket added and that nothing of ADR-0013 is replaced, so no ADR is written.

| Piece | In DESIGN.md |
|---|---|
| The share button | Components › The Build page › The share button, and the till slip's `first-action` sentence: the first screen of a Build that holds Parts now has its one action; an empty Build's stays defended |
| The Shared Build page | Overview; Layout › The pieces, page by page; Components › The Shared Build page (its slip, Copy into my Build, "This is your Build", the link and Share the link, its sheet, all Parts gone, an unknown Shared Build) |
| When it was shared, and the stamp | Components › The stationery › The stamp; The Shared Build page › Its sheet |
| Send on WhatsApp, no number, refusals | Components › The Build page › Send on WhatsApp |
| The WhatsApp message | Components › The Build page › The WhatsApp message |
| The motion | Motion: the tokens `--swap` and `--tick-print`, and `--unfold` for the two confirmations; When a movement plays › Sharing, copying and sending; What moves › 12; What stays still; When a movement is interrupted; Right to left; Reduced motion; and Empty the Build's confirmation in 150 ms with reduced motion, in Emptying the Build too |
| The feel on a phone | Layout › The feel on a phone: the share sheet, the link by hand, a new tab opening WhatsApp, one tap one Referral, thumbs on the sharing pieces, and the Shared Build page's length |
| The worst cases | Each where it acts: the stamp under the title, the link breaking anywhere, held widths (Motion 12, Do's), "Gave no WhatsApp number", the words a Shared Build changes, the note of Parts gone |

Do's and Don'ts gain a line each: hold a button's width when its words change, say a busy button's work in its words, say why a line has no Send on WhatsApp, and let an address break anywhere; and never offer a form that changes a Shared Build, speak to its reader as its owner, put a price or a city in the message, or turn a spinner on the paper.

**The hard rules hold.** Every colour of the new pieces is one the file has measured: Print Green with Green's Ink for the two primary buttons, the Ink with the paper's colour for Replace, the Board with the Ink for the cells, Soft Ink on Sheet Paper for the notes, Print Green as the stamp. Every control is 44 pixels or more on a touchscreen (52 on the slip), no text is under 14 pixels nor Arabic script under 15, nothing scrolls sideways at 320 or 390 pixels in either scheme (280 drawings), every side is logical so that each piece mirrors in Kurdish and Arabic, and no font is added. One piece changes an earlier defence rather than a hard rule: the share button gives the Build page's first screen the action Taste's `first-action` asked for, which the owner had kept defended; it was put to the owner as `#d1` A, which says so.

The words of the new pieces are drafted in English and Kurdish in the renderings' `#words` (and the message in Arabic), for ticket 04 and 05 to put into the Shopper set; `words.md`'s Shared Build and Referral are committed with the first record.

**`pnpm shopper:inspect` and "This is your Build".** The box stays open for ticket 04, which builds the Shared Build page; the command already opens the page's path, and with `--build complete` the browser holds the complete Shared Build's Build.

### 18 November 2026: the last box, ticked by ticket 06

The box for `pnpm shopper:inspect` opening a Shared Build page by its path, in its "This is your Build" state with `--build complete` and the `complete` Shared Build, is ticked. Ticket 04 built the page, and its `yours-*` runs drew that state, as its Comments say: with `--build complete` on `/builds/00000000-0000-4000-8000-000000700001` every run drew "This is your Build" and no copy, before the owner's `#d1` answer (`.taste-skill/sharing-04-inspect/yours-*`) and after it (`sharing-04-inspect-2/yours-*`, Share the link as the slip's one action). The code review's inspection drew it again (`sharing-review-inspect/yours-*`), and so did ticket 06's runs from a fresh clone, `yours-*` in Kurdish and English, light and dark, at five widths, and in dollars, each with Share the link as the slip's one action, "This is your Build" on the sheet and no copy, 0 FAIL (ticket 06's Comments). The commands table and the design skills guide have said how since this ticket.
