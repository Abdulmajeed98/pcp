# 04: Share a Build, open its link and copy it

**Spec:** [the sharing spec](../spec.md)

**What to build:**

- **Sharing.** A Shopper taps Share on their Build page and lands on its Shared Build page, whose address is the link to send. They can send it through their phone's share sheet, or copy it. Sharing an unchanged Build again gives the same link, and a changed Build a new one (SHR-1, SHR-4).
- **Opening the link.** Anyone who opens the link sees the Shared Build's Parts in the sender's language, with today's prices in both price views and today's Compatibility Problems, Warnings and unchecked rules (SHR-2). The page also gives its status, its power draw, and when it was shared. A browser that holds the same Build is told so.
- **Copying.** Anyone else can copy the Shared Build into their own Build, confirming once when they already have one, and change it. The Shared Build never changes (SHR-3).
- **The preview.** A link pasted into a chat shows a preview with no price.

Everything works before any script has loaded. This makes success criterion 7 true, and criterion 12 up to the page's head. The "send on WhatsApp" button comes in ticket 05.

**Blocked by:** 02

**Status:** ready-for-agent

- [x] **The pieces both pages draw, moved first**, in a commit of their own that changes nothing a Shopper sees.
  - The Build page's pieces that the Shared Build page also draws move down a layer, as Feature-Sliced Design asks, so that a second page may import them: the slip, the rules' sheet, the Vendors' sheet, the status and the words of the outcomes.
  - Every existing unit test and end-to-end test passes unchanged, and `pnpm boundaries:check` passes.
- [x] **Sharing.**
  - The Build page, built to DESIGN.md, has the share button when its Build holds a Part, and none when it is empty or refused.
  - The button is a plain form sent with POST to `/{language}/build/share`. The form sends the cookie's Build to `POST v1/shared-builds` and is answered by `answerAForm` with 303 and the Shared Build page.
  - A refusal, or an API that does not answer, comes back to the Build page with its reason in the address, which the page says.
- [x] **The Shared Build page** at `/{language}/builds/{sharedBuildId}`, built to DESIGN.md.
  - **What it reads.** On the server, for each request, after `connection()` and with no cache, it reads `GET v1/shared-builds/{id}`. It then reads `GET v1/build` with those `part` values in the chosen currency, in its own slice's `api` segment.
  - **What it draws.** The Parts with their quantities and no forms that change them, the status, the outcomes, the power draw and both price views. Each Visible Part links to its Part page and each Vendor to its Vendor page.
  - **What it says.** When the Build was shared, and the note that its Parts are fixed and its prices are today's.
- [x] **"This is your Build".** The page compares the browser's Build, read from its cookie, with the Shared Build's `part` values. When they are the same, it says so and offers no copy.
- [x] **Share the link.** With script, it uses `navigator.share` where the browser has it and copies to the clipboard where it does not. Without script, the link is shown as text to select.
- [x] **Copying.**
  - Copy into my Build is a plain form sent with POST to `/{language}/builds/{sharedBuildId}/copy`. When the browser holds a Build of its own, it asks to confirm once first, as emptying a Build does, with script and without.
  - It writes the cookie with `rememberTheBuild`, keeping only the Parts `GET v1/build` still answers (`heldByTheCatalog`), and is answered 303 with the Build page.
- [x] **The edges.**
  - An unknown Shared Build answers the not-found page with 404 in the page's language, from the page and from its preview.
  - A Shared Build whose Parts have all left the catalog says so and offers nothing to copy.
  - An API that does not answer shows the sheet that says the page cannot be read just now, with Try again.
- [x] **The language rule stays ADR-0008's.** The link carries its sender's language, and opening it is remembered as any Shopper address is. The switches keep the page, as they keep every page.
- [x] **The preview**, written by a plain function through `previewOf`:
  - the title names the Build by how many Parts it holds, in the page's language;
  - the description names its CPU and GPU when it has them, and no price and no city;
  - the image is the photo of its first Part with one, in the catalog's order of Categories;
  - the page is marked for search engines not to index.
- [x] **Words.** Every new text is in the `i18n` library's Shopper set in all three languages, using `words.md`'s terms, the Kurdish and Arabic drafts for LANG-7. Part names stay in English. Removing the Arabic text of the note of what is fixed is seen to fail `pnpm check` once, then reverted.
- [x] **Seam 4**, the Shopper's unit tests:
  - the Shared Build page's address, and its link on the public address, in each language;
  - whether the browser's Build is the Shared Build, for the same Parts, another quantity, another order of kits and an empty Build;
  - the cookie written from a Shared Build's values, leaving out Parts the catalog no longer answers;
  - each form's refusal read back from the address, saying nothing for what it does not know;
  - the preview in each language;
  - the note of when a Build was shared, in Western digits.
- [x] **Seam 3**, in a window 360 pixels wide, in Kurdish, Arabic and English, each test making its own made-up Vendors, Parts and Offers through the API and picking its Build from its own browser:
  - **Opening the link.** A Shopper shares and lands on the Shared Build page. In a fresh browser the link opens the same Parts with prices that match `GET v1/build`. After the Admin changes one of its Offers' prices, the page shows the new price.
  - **Copying.** The fresh browser copies the Shared Build and changes the copy, and the link still shows the Shared Build unchanged (success criterion 7). With a Build of its own, the copy asks once first. The sender's own browser is told it holds this Build.
  - **Sharing again.** Sharing an unchanged Build again gives the same address, and sharing after a change gives a new one.
  - **Without script.** Sharing, and copying with its confirmation, work with script switched off.
  - **The preview.** The page's head, read with no cookie, holds its title, a description with no price, and its image, and asks not to be indexed.
  - **Language and layout.** Kurdish and Arabic are right to left, every number is in Western digits, Part names are in English, and `expectNoSidewaysScroll` passes.
  - **Accessibility and motion.** `expectAccessible` passes on the Shared Build page and on the Build page with its share button, in both schemes. The motion DESIGN.md adds is filmed with `film` and judged by `snapsOf`, with reduced motion and without it.
- [ ] **`pnpm shopper:inspect`** runs on the Shared Build page with each made-up Shared Build, and on the Build page with its share button. It runs in both schemes, in Kurdish and English, at 1440, 768 and 390 pixels, and at 1024 and 1280 for desk layouts, and in dollars as well. Every FAIL is fixed, and every WARN is fixed or defended under Comments against `builder` ticket 10's reference.
- [ ] **Phone checks** are recorded under Comments as open, waiting for hosting:
  - the share button and the phone's share sheet used with a thumb, in Kurdish and in English;
  - Copy into my Build and its confirmation with a thumb;
  - a Shared Build's link pasted into WhatsApp showing its preview in each language;
  - the motion felt on a real phone, with reduced motion on and off.
- [ ] `pnpm check` and `pnpm platform:check` pass, and the work is committed.

## Comments

### 17 November 2026: the pieces moved down a layer

**Read first**: the brief, the ticket, the sharing spec whole, the MVP spec's requirements SHR and BLD, its Testing strategy and the conventions the ticket touches (the builder module's above all), `apps/shopper/DESIGN.md` whole with ticket 02's additions, ticket 02 with its Comments and the drafted words in the owner's `.taste-skill/sharing-02/` (`#words`, `words.js`), `docs/agents/design-skills.md`, and the working memories the brief names.

**The move** (`b2d10df`, `refactor(shopper)`), in a commit of its own that changes nothing a Shopper sees. A page may not import another page, so the pieces the Shared Build page also draws moved from `_pages/build` into a widget, `widgets/build-quote` (the Build page is "a quote" in DESIGN.md), by `git mv` where they were files of their own:

- `model/findings.ts` (the words of the outcomes, `findingsOf`, `outcomeCountsOf`, `powerDrawOf`, `everyOutcomeIsWorded`) and `model/status.ts` (`statusOf`);
- `ui/build-slip.tsx`, `ui/rules-sheet.tsx`, `ui/vendors-sheet.tsx` and `ui/named-under.tsx`;
- and two pieces drawn out of the Build page's files into components of their own, unchanged in their markup: `ui/build-status.tsx` (the status's sentence and its CPU lines, from the Build's sheet) and `ui/part-line.tsx` (a Part's line, its price and its second line, from a Category's place, which keeps its controls under it).

The widget imports `underlinedAction` from `features/change-the-build`, which the Widgets layer may. `_pages/build`'s index now exports its preview and its page alone. The two unit tests of the status and the outcomes' words followed their functions to `test/widgets/build-quote/`, as the seam's tests mirror `src`, with their one import line changed and nothing else; every other unit test is untouched. `pnpm check` (836 unit tests, as before) and `pnpm boundaries:check` passed on the commit. The MVP spec still names `_pages/build/model/findings.ts` under The builder module's conventions, which ticket 06's record of the module's conventions updates (a follow-up).

### 17 November 2026: sharing, the Shared Build page and copying

**The commits**: `41aa0ca` (`feat`, no scope: the Shopper app, the Shopper set in `i18n` and the theme in `ui`) and `e522c59` (`test(e2e)`).

**The addresses, written once.**
- `entities/shared-build`: `sharedBuildPath(id)`, `/builds/<id>`; `sharedBuildAddress(language, id)`; and `sharedBuildLink(publicAddress, language, id)`, the link on `SHOPPER_PUBLIC_URL`, which ticket 05's message can take.
- `entities/build` gains `holdsTheSharedBuild(build, values)` and `copyOfTheSharedBuild(values, answered)` (below).

**Sharing** (`POST /<language>/build/share`, `_app/routes/share-and-copy.ts`, `shareTheBuild`). The cookie's Build is first read as the catalog holds it (`readTheBuildToChange`, as a change to the Build is), then sent to `POST v1/shared-builds` (`_app/api/share-a-build.ts`), and the form is answered by `answerAForm`, 303, with the Shared Build page in the form's language. A Part that has left the catalog is forgotten by the cookie when it shares, as a change forgets it, so that the sender's browser holds exactly the Build the API froze (story 11) and is told so. A refusal comes back to the Build page with its reason in the address, `?refused=nothingToShare` (an empty Build, or the API's `empty`), `notReadable` (any other 400 naming `part`) or `notShared` (no answer), read back by `refusedShareIn` (`features/share-a-build`), which says nothing for a reason it does not know, a change's refusal among them; the page says it under the button, and on an empty Build's slip in its place, since an empty Build has no button. `answerAForm` now also hands a form what its address names besides the language, which the copy needs.

**The share button** (`ShareThisBuild`, `features/share-a-build`) is on the Build's slip under its price lines and a dashed rule, above its foot, drawn when the Build holds a Part. The slip (`BuildSlip`) takes what the Shopper can do as its children, in a space of its own (`data-space="slip-actions"`), so that a Remove in place that empties the Build folds it as Motion 11 folds a space. Its button is `SubmitOnce` (`shared/ui`), a form's own button that, with script, says "Sharing…" from its first tap, keeps its pressed ground and takes no other tap or Enter until the page is shown again (`pageshow` from the browser's cache), its two labels in one cell (`HeldWords`) so that it holds its width; without script it is a plain button.

**The Shared Build page** (`_pages/shared-build`, `app/[locale]/builds/[sharedBuildId]/page.tsx`).
- It reads `GET v1/shared-builds/{id}` and then `GET v1/build` with its `part` values in the chosen currency, in its own `api` segment, after `connection()`, with no cache, through React's `cache` so that the page and its preview read once (`readTheSharedBuildPage`). 404 or 400 is not found; no answer, or a Build the API refuses, is not read.
- It draws the widget's slip (headed "Shared Build · 8 Parts"), the rules' sheet and the Vendors' sheet with `whose: 'shared'`, which speak of the Build as the sender's ("Its CPU has integrated graphics…", "Has 4 of its 18 Parts", the rules' note on "this Build" and its closing line "Copy it into your Build to change a Part."), and a sheet of its own (`SharedBuildSheet`): "A shared Build" as the `h1`, the date stamp under it at every width, the status with its Categories as words, the note of when it was shared and what is fixed and what is today's, how many Parts have left the catalog when some have, and its Categories with each Part's line (`PartLine` with `quantityShown`, "Quantity 2" on a kit's or a drive's second line, since the sheet has no quantity form), a Category it does not hold left out.
- On its slip, what its reader can do (`WhatTheReaderCanDo`): Copy into my Build, or "This is your Build" with the printed mark of a chosen thing (`PrintedMark` gains `chosen`, additively), then the link and Share the link.
- A Shared Build whose Parts have all left the catalog is one sheet (`AllGone`); an unknown one answers the not-found page with 404 in the page's language, from the page and from its preview; and an API that does not answer shows the sheet that says it cannot be read just now, with Try again. The last was seen by hand on a Shopper app pointed at an API that does not answer (port 3112, `API_URL=http://127.0.0.1:9`): the page answered 200 with "This Build cannot be read just now" and Try again to the same address, a copy came back with `?refused=notCopied` and a share with `?refused=notShared`; no line of the platform can make the API not answer the server.

**"This is your Build"**: `holdsTheSharedBuild(build, values)` sets the cookie's Build in the catalog's order of Categories, keeping its own order of kits and drives, and compares its `part` values with the Shared Build's, read in small letters. So a Build picked GPU first is the same Build, and kits in another order are not, as the API shares them.

**Share the link** (`ShareTheLink`, a client component). The printed link is `printed-link` in the theme: left to right, isolated, breaking anywhere, `user-select: all`. The button reads whether the browser has a share sheet through `useSyncExternalStore`, "Share the link" on the server and wherever `navigator.share` exists (called in the tap, nothing awaited before it, a closed sheet saying nothing), and "Copy the link" elsewhere, which writes the link to the clipboard and turns to "✓ Link copied" for 2.5 seconds, a second press copying again and keeping the words, a refused copy saying nothing, an `output` telling a screen reader. Without script the button is not drawn (`@media (scripting: none)`), and the link is the text to select.

**Copying** (`POST /<language>/builds/<id>/copy`, `copyASharedBuild`). It reads the Shared Build and the Parts the API still answers of it (`_app/api/read-a-shared-build-to-copy.ts`), writes `copyOfTheSharedBuild(values, answered)` with `rememberTheBuild`, each Part under the Category the API answers it in, so that a Part the catalog no longer answers is left out as `heldByTheCatalog` leaves one out of a change, and answers 303 with the Build page from its top (`addressAfterACopy`), opened anew and printing (Motion 12). An unknown Shared Build, or one whose Parts have all gone, comes back to its page, the cookie untouched; no answer comes back with `?refused=notCopied` (`refusedCopyIn`, `features/copy-a-shared-build`). `CopyIntoMyBuild` is a plain form's `SubmitOnce` for an empty Build, and otherwise the summary of a disclosure confirmed in place as Empty the Build is, "Replace my 5 Parts" and "Keep mine" (in place with script, a link to the page without).

**The language rule** stays ADR-0008's: the share answers with the page in the form's language, so the link carries its sender's language; opening it sets `NEXT_LOCALE` as any Shopper address does (seen on the copy's and the page's answers); and the frame's switches keep the page, as the language line's `readInEveryLanguage` checks.

**The preview** (`sharedBuildPreview`, through `previewOf`): its title names the Build by how many Parts it was shared with, "A shared Build of 8 Parts · PC Parts and Prices", counting its frozen values, so that a link whose Parts have all gone is not called a Build of none; its description names its CPU and GPU when it has them, in English, and no price and no city, "A PC with the AMD Ryzen 5 7600X and the Palit Dual OC GeForce RTX 4070 SUPER 12GB GDDR6X Black. See its Parts, whether they work together, and what each Vendor charges for them."; its image is the photo of its first Part with one, in the API's order, which is the catalog's order of Categories; and `robots: { index: false }`.

**The motion** (Motion 12): the theme gains `--swap` and `--tick-print`, `held-words` (every label in one grid cell; the busy words change at once; `data-swaps` cross-fades with a 2-pixel blur and prints the tick in from its start edge, mirrored right to left; with reduced motion no blur and the tick whole), and `printed-link`. The modifier ticket 02 asked for is on `unfolds-in-place`: a disclosure marked `data-confirmation`, Empty the Build and Copy into my Build, opens and folds in 150 ms each way with reduced motion, where the other folds still open at once. The page's stamps land as a sheet's do (`--stamp-at` 900 ms on the sheet and 1150 ms on the slip), and a copied Build lands on the Build page from its top, printing anew, not at an anchor, as ticket 02 recorded.

**The words**, in the Shopper set in all three languages: `BuildPage.share`, `SharedBuildPage` (its title, slip, stamp, the note of when and what is fixed, the dates written with the Gregorian months as Iraq names them in Kurdish and Arabic, the quantity, the words a Shared Build changes, the copy, "This is your Build", the link, all gone, not read) and `Preview.sharedBuild`, using `words.md`'s Shared Build (بیڵدی هاوبەشکراو, تجميعة مُشارَكة). The Kurdish is ticket 02's draft where it drafted one; the Arabic is drafted here, for LANG-7. Part names stay in English. No message formats a number: a count, a day and a year reach a message as text, the year with no grouping.

**When it was shared** is counted in calendar days of Coordinated Universal Time (`whenShared`), the same for every reader and on every server, so that "Shared today" names the day it was shared; a Build shared at 01:00 in Erbil, 22:00 the day before in UTC, says that earlier day. It is the platform's first day written on a Shopper page; a time zone of the platform's own would be a choice to record (a follow-up).

**Where DESIGN.md and this build part**, each DESIGN.md's (the owner's later choice):
- Replace my 5 Parts and Keep mine stand one above the other, each as wide as the slip and 12 pixels apart, as DESIGN.md's The feel on a phone gives every sharing button, where ticket 02's rendering set them side by side as Empty the Build's are.
- The ticket's words "the slip, the rules' sheet, the Vendors' sheet, the status and the words of the outcomes" were moved, and with them a Part's line, which the Shared Build's sheet draws too.

### 17 November 2026: the tests at the two seams, and the faults

**Seam 4**, the Shopper's unit tests, written before the code each tests and each seen red on an assertion first (a function that answered nothing, or the wrong address), never on a missing module: 893 tests in 44 files, 57 of them new.

| Test | What it holds |
|---|---|
| `entities/shared-build/shared-build-address.spec.ts` | the Shared Build page's address in each language, and its link on the public address |
| `entities/build/the-shared-build-it-holds.spec.ts` | the browser's Build is the Shared Build for the same Parts picked in another order of Categories and for identifiers in capitals, and not for another quantity, another order of kits, a Part more or fewer, or an empty Build |
| `entities/build/a-copy-of-a-shared-build.spec.ts` | the cookie written from a Shared Build's values, in their order with each quantity, leaving out the Parts the API no longer answers, identifiers in capitals read as the API reads them |
| `features/share-a-build/a-refused-share.spec.ts`, `features/copy-a-shared-build/a-copy-answered.spec.ts` | each form's answer and its refusal read back from the address, in each language, nothing read for what is not known (a change's refusal, a reason in other letters, another parameter) |
| `_pages/shared-build/shared-build-preview.spec.ts` | the preview in each language: the title counting the Parts shared, Parts gone among them, a description naming the CPU and GPU, the CPU alone, the GPU alone or neither, no price, the first photo in the catalog's order or none, `noindex`, the canonical address |
| `_pages/shared-build/when-shared.spec.ts` | the note of when a Build was shared and its stamp, in each language, today, a day, 3, 12 and 400 days ago in Arabic's own plurals, every number in Western digits and a year with no grouping |
| `widgets/build-quote/build-status.spec.ts` (three new lines) | a Shared Build's CPU lines speak of its CPU, in each language |

**Seam 3**, `shopper-sharing-languages.spec.ts` with `shared-build-page.ts`, in the 360-pixel window: 12 lines, every one passed on their first run (1.3 minutes). They make two Vendors, six Parts (the motherboard with a photo, the first in the catalog's order with one) and nine Offers through the API, set the Platform Rate, and pick the Build from their own browser, GPU first. They were written after the pages, so they were seen red through faults planted once each and reverted (below). They cover: sharing in Kurdish and English landing on the Shared Build page, the printed link equal to its address, the API's frozen values in the catalog's order, the sender's browser told it holds the Build with no copy, and a fresh browser opening the same Parts with prices, total and Vendors as `GET v1/build` answers them, one Shared Build whichever language shared it; an Offer's price changed by the Admin shown on the page, the frozen values unchanged; a fresh browser copying at once, changing the copy, the link unchanged, then with a Build of its own the copy asking first, Keep mine folding it, Replace copying again, and the link then saying it is the browser's Build; sharing again giving the same address, a change a new one, the old link unchanged; an empty Build with no button and a share sent all the same refused; an unknown Shared Build's 404 in each language; sharing and copying with its confirmation with script switched off, the link selectable and its button not drawn; the page's head read as WhatsApp's crawler with no cookie (title, description naming the CPU and GPU, no price, the board's photo, `noindex`, canonical and Open Graph); right to left in Kurdish and Arabic with Western digits, Part names in English and the link left to right; `expectAccessible` on the Shared Build page with its confirmation open, on the Build page with its share button and on a "This is your Build" slip, in Kurdish and English, in both schemes; and Motion 12 filmed with `film` and judged by `snapsOf` with reduced motion and without: the date stamp landing (and not, reduced), the copy's confirmation and Empty the Build's opening over many frames with nothing under them snapping, and Copy the link turning to "Link copied" in place, its width held, its words cross-fading, the link on the clipboard.

**The faults**, each planted with one exact edit after its work was committed, run, and reverted by the inverse edit, `git status` clean after each:

| Fault | Run | What failed, and why |
|---|---|---|
| The Arabic text of the note of what is fixed, `SharedBuildPage.fixed`, removed from `shopper/ar.json` (the ticket's own fault) | `pnpm check` | Exit 1 at `check-language-files.mjs`: `ar.json, "SharedBuildPage.fixed": is missing. The English file has it.` |
| `holdsTheSharedBuild` answering no Build (`values.length > 0` made `< 0`) | the sharing spec | 3 of 12 failed, each at `getByTestId('this-is-your-build')` not visible: the sender's browser told it holds the Build, the copy then being the browser's Build, and the accessibility line's "This is your Build" slip |
| The copy's answer writing no cookie (`write: undefined`) | the sharing spec | 2 of 12 failed: the fresh browser's Build page listed no Part where it expected the Shared Build's four, with script and with scripts switched off |

### 17 November 2026: Taste's inspector, and what waits on the owner

`pnpm shopper:inspect` ran under the lock against this worktree's API on 3103, with the Shopper's sheet in place, 34 runs in `.taste-skill/sharing-04-inspect/` (ignored by Git): each Shared Build page and the Build page with its share button, in Kurdish and English, light and dark, at 1440, 1280, 1024, 768 and 390 pixels, and in dollars at 1440 and 390. The runs:

| Page | Run | What it found |
|---|---|---|
| A Shared Build page, a reader with no Build (`…700001`) | `copy-*` | **FAIL `no-title` at 390 and 768**, the title 999 to 1,095 pixels down; `dashed`; `no-footage` |
| The worst-case Shared Build, a reader with a Build of its own (`…700002`, `--build complete`) | `worst-*`, `usd-worst-*` | **FAIL `no-title` at 390 and 768** (1,031 to 1,155 down); `first-action` at 1024, and at 1280 in Kurdish; `dashed`; `no-footage` |
| The complete Shared Build in its "This is your Build" state (`…700001`, `--build complete`) | `yours-*`, `usd-yours-*` | **FAIL `no-title` at 390 and 768** (1,095 to 1,239 down); `first-action` at 1024 and 1280, and 1440 in Kurdish; `grey-body` in light; `dashed`; `no-footage` |
| A Shared Build whose Parts have all gone (`…700003`) | `gone-*` | `no-footage`; `blank-gap` at 768 in Kurdish |
| The Build page with its share button (`--build complete`) | `build-*`, `usd-build-*` | `name-only-title` at 390 and 768 in Kurdish; `grey-body` in light; `dashed`; `no-footage`. Its `first-action`, defended at every width until now, is gone: the share button is its first screen's action |

This box stays open: **the FAILs are not fixed**, because each fix moves a piece DESIGN.md places, which is the owner's to choose. Below 64rem the Shared Build's slip comes first, as chosen, and carries the copy or "This is your Build", the link and Share the link, so the page's title is off a phone's and a tablet's first screen; from 64rem the rules' counts on the slip push Share the link below a desk's first screen. The share button also takes the worst-case Build page's title off a phone's first screen in Kurdish (it starts at 851 of 844 pixels, measured on the built page; the run inspected the complete Build). The options are rendered from the built pages, their own pieces moved, in the scratchpad's `sharing-04/` (for the owner's `.taste-skill/sharing-04/`): `#d1` where the slip's actions stand, A (recommended) one action right under the price lines at every width with the rest on the Shared Build's sheet and the Parts line left out below 64rem, which puts the title and the one action on the first screen at every inspected width in both languages on both pages, or B the sheet first on a Shared Build page below 64rem; and `#d2` the Build page's `name-only-title` in Kurdish at 390 and 768, A (recommended) defended as the owner kept it for the worst case on 13 November. `measured.json` there holds every measure.

**Defended against the references** (`builder` ticket 10's and `browse` ticket 14's, which the owner kept): `dashed`, the dot leaders, the perforations and the slip's rules; `no-footage`, still photographs by design; `grey-body` in light, the second lines and the notes in Soft Ink at 6.6:1, here also "This is your Build"'s note; and `blank-gap` at 768, the back cover's one full-screen rest, on the page whose Parts have all gone.

**Box 1's end-to-end half**: the Build page's, the picker's and the motion's specs (`shopper-build-languages`, `shopper-build-rules-and-prices-languages`, `shopper-picker-languages`, `shopper-motion`), unchanged, 45 lines, passed under the lock on `e522c59`, which holds the move; `pnpm platform:check` at the Finish runs them all again.

**Phone checks, open, waiting for hosting** (MVP spec, Checks on a phone wait for hosting):
- the share button and the phone's share sheet used with a thumb, in Kurdish and in English;
- Copy into my Build and its confirmation with a thumb;
- a Shared Build's link pasted into WhatsApp showing its preview in each language, which needs a public address;
- the motion felt on a real phone, with reduced motion on and off: the page printing and its stamps landing, the busy words, "Link copied", the confirmations opening and a copied Build arriving.

**Ticket 02's last open box**, `pnpm shopper:inspect` opening a Shared Build page in its "This is your Build" state, is shown by the `yours-*` runs here: with `--build complete` on `/builds/00000000-0000-4000-8000-000000700001` every run drew the slip's "This is your Build" and no copy (their pictures in `.taste-skill/sharing-04-inspect/yours-*`).
