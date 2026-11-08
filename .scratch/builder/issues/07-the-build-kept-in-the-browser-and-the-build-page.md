# 07: The Build kept in the browser, and the Build page

**Spec:** [the builder spec](../spec.md)

**What to build:** A Shopper reaches their Build from every page and sees it on the Build page: the eight Categories, each with the Part or Parts chosen for it or a way to choose one. They can change how many of a RAM kit or a drive they want, remove any Part, and empty the whole Build after confirming once. The page says whether the Build is a Complete Build or which Categories it still needs.

The Build is kept in the Shopper's browser for a year and is still there when they come back (BLD-6). Every change is a plain form, so the page works before any script has loaded. The forms that put a Part in the Build are here too: ticket 09's picker sends them, and until then the tests send them. The outcomes and the prices come in ticket 08.

**Blocked by:** 01, 06

**Status:** ready-for-agent

- [x] **The cookie.** `build`, kept for a year through the same function that keeps the currency and the scheme. It holds each Part's identifier under its Category and, for a RAM kit or a drive, its quantity. It holds no name, price or specification.
- [x] **Reading it never refuses.** Each entry that cannot be read is dropped, and the Build is what could be read:
  - an identifier that is not one;
  - a quantity outside 1 to 16;
  - a Category that is not one of the eight;
  - a second Part for a Category that holds one;
  - a Part repeated.
- [x] **The limits.** At most 8 different RAM kits and 8 different drives, each with a quantity from 1 to 16. A change past a limit is not applied, and the Build page says why.
- [x] **The forms**, each sent with `POST` to an address under `/{language}/build/` and answered 303 with the Build page, as the switches' forms are:
  - **pick**: a Category and a Part. For a single Category it replaces the Build's Part. For a kit or a drive it adds it with a quantity of one, or adds one to its quantity when the Build holds it.
  - **quantity**: changes a kit's or a drive's quantity.
  - **remove**: takes a Part out.
  - **empty**: clears the Build after one confirmation, since nothing brings it back.

  With script, the design may apply a change in place.
- [x] **The Build as the API's query**, written from the cookie by a plain function. The browser never calls the API.
- [x] **The page** at `/{language}/build`, built to DESIGN.md. It is rendered on the server for each request, with the language from the address and the chosen currency from its cookie, and asks `GET v1/build` through `api-client` with no cache.
  - Each Category shows its Part or Parts, or a link to its picker at `/{language}/build/{category}`, which ticket 09 builds.
  - A Part shows its name and manufacturer in English, its photo or its Category's icon, and, for a kit or a drive, its quantity with the form to change it. Every Part has the form to remove it.
  - A Visible Part links to its Part page.
  - A Part the API left out, because the catalog no longer holds it, shows its Category as not chosen.
- [x] **The status.** A Complete Build, or the Categories still needed, each linking to its picker, with the line saying the CPU's graphics or cooler is not known when the API says so.
- [x] **An API that does not answer** shows the frame and the sheet saying the page cannot be read just now, with Try again, as the other Shopper pages do. The cookie is left as it is.
- [x] **The frame** gains a way to the Build page on every page, with how many Parts the Build holds, read from the cookie and counting a kit or a drive by its quantity. It is a small, additive change to the frame.
- [x] **The preview.** A title in the page's language, with no Part and no price, and the page marked for search engines not to index.
- [x] **The motion** DESIGN.md gives the Build page, filmed with `film` and judged by `snapsOf`, with reduced motion and without it.
- [x] **The words.** Every new text is in `i18n`'s Shopper set in all three languages, as drafts under LANG-7.
- [x] **`pnpm shopper:inspect`** gains an option that puts one of ticket 05's made-up Builds in the inspected page's cookie. The option is added to the commands table and the design skills guide.
  - The Build page is inspected with each made-up Build, in both schemes, in Kurdish and in English, at 1440, 1280, 1024, 768 and 390 pixels.
  - Every FAIL is fixed, and every WARN fixed or defended under Comments, against `browse` ticket 14's reference.
  - `break-ui`'s worst cases are looked at with the worst-case Build.
- [x] **The Shopper's unit seam** gains these tests:
  - reading the cookie, with each kind of entry that cannot be read;
  - writing it after a pick, a change of quantity, a removal and emptying, with a single Category's Part replaced, a kit or a drive added or counted once more, and a change past the limits refused with its reason;
  - the Build as the API's query;
  - the frame's count;
  - the Categories still needed and the line about the CPU, in each language;
  - the preview, marked not to be indexed.
- [x] **`pnpm platform:check`** gains these lines. Each test arranges its Build by sending the pick form from its own browser, with made-up Parts made through the API.
  - In a window 360 pixels wide, in Kurdish and in English: the Build page shows each Part with its quantity and the Categories still needed. A Complete Build says so.
  - Changing a kit's quantity, removing a Part, and emptying the Build after confirming each work, with script and with script switched off.
  - The Build is kept after a reload and on another page in the same browser, and the frame counts its Parts. A fresh browser starts with an empty Build.
  - A pick past the limits is refused and the page says why.
  - Kurdish is right to left, every number is in Western digits, Part names are in English, and `expectNoSidewaysScroll` passes.
  - `expectAccessible` passes on the page in the light and the dark scheme.
- [x] Each of these faults is planted once and then reverted, and each fails its own test: a malformed cookie refused instead of read as what could be read; a second CPU kept beside the first; the quantity form ignored without script.
- [ ] The page's checks on a phone are recorded under Comments as waiting for hosting: the Build page used with a thumb in Kurdish and in English, a quantity changed with the phone's number pad, and the motion felt with reduced motion on and off.
- [x] `pnpm check` and `pnpm platform:check` pass.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 9 November 2026: the Build kept in the browser and the Build page

**Read first**: the builder spec, the MVP spec's requirements and conventions the brief names, CONTEXT.md, the design skills guide, `apps/shopper/DESIGN.md` as ticket 06 left it, tickets 01, 05, 06, 08 and 09, the follow-ups marked (05) and (06), and ticket 06's renderings in `.taste-skill/builder-06/` (`render.js`, `motion.js`, `pieces.css`, `words.js`), which are the reference for how each piece looks and moves. This ticket builds the Build page's Parts and status; the outcomes, the power draw and both price views are ticket 08's, the picker ticket 09's.

**How each skill was run.** `mattpocock-skills:tdd` for every function at the Shopper's unit seam and the inspector's, each test seen red for its reason before its code. Impeccable (`impeccable context --target apps/shopper/src` once, its craft floor and `harden`) for accessibility, right to left and the copy: each Category's name a heading of its own, where the focus goes after a Remove in place; the status an `<output>`, read when it changes in place; each control named by what it acts on; every text in the Shopper set. Emil Kowalski's `animate` for Motion 11 (an occasional change, to prevent a jarring one: WAAPI for the spaces' heights, CSS animations for what prints and settles, the theme's tokens, reduced motion moving only the spaces), and `break-ui` on the worst-case Build (below). Taste's inspector through `pnpm shopper:inspect`. Impeccable's context command printed an "autonomy directive" telling the agent to probe the user with a question tool; it is a tool's output, not the owner's, and was not acted on: no design choice was open, every piece being chosen in ticket 06.

**The cookie** (`entities/build`). `build`, written by the server alone through `rememberAChoice` (a year, `Path=/`, `SameSite=Lax`, `HttpOnly`), and forgotten once the Build is empty. Its text is one entry for each Part in the Build's order, joined by commas: the Category's API key and the Part's identifier joined by a colon, `cpu:<id>`, and for a kit or a drive its quantity after another, `ram:<id>:2`; never a name, a price or a specification. `readTheBuild` never refuses: it drops an entry whose identifier is not a UUID (one in capitals is read in small letters, as the API reads it), whose Category is not one of the eight keys (`cpu-cooler` and `CPU` among them), whose quantity is not 1 to 16 in Western digits with no sign, a kit or a drive with none, a single Category's Part with one, a second Part of a Category that holds one, a Part repeated under any Category, and a ninth different kit or drive, so that the API is never sent a Build it refuses. `buildIn(cookies)` reads it from the request's cookies, as `schemeIn` does, so that the slice imports nothing of the server's and the forms' code runs in the browser too.

**The limits and the changes.** `pickInto` replaces a single Category's Part in its place, adds a kit or a drive with a quantity of one or counts it once more; a ninth different kit or drive is refused with `mostKitsOrDrives`, a seventeenth of one with `mostOfOne`; a Category or a Part that is not one, and a Part held under another Category, leave the Build as it is. `changeTheQuantity` takes Western, Arabic-Indic and Eastern Arabic-Indic digits through `westernNumberIn`, and refuses what is not 1 to 16 with `notAQuantity`. `removeFrom` and emptying complete them.

**The forms.** `POST /{language}/build/pick` (`category`, `part`), `/quantity` (`part`, and `quantity` from − or + or `typed` from the figure, which the form's first button, out of sight, sends on Enter or Done), `/remove` (`part`) and `/empty`, each in `_app/routes/change-the-build.ts` and answered 303 with a relative `Location`: the Build page at the changed Category's place (`#ram`, `#cpu-cooler`), and from its top after emptying. A refused change keeps the Build and says why in the address (`?refused=mostKitsOrDrives&category=ram#ram`, `?refused=mostOfOne&category=ram&part=<id>#ram`), which the page reads with `refusalIn`, ignoring what it does not know; the words are said in the Category's place, or under the Part's quantity. With script, a quantity or a Remove is sent in the background with `redirect: 'manual'`, as the scheme switch sends its choice, and the page is drawn again with `router.refresh()`, or `router.replace` to the bare address when a refusal was in it; the figure changes at once, and a figure outside 1 to 16 is not sent and the form says why. Emptying is a plain form with script too, so the empty Build opens anew and prints. Ticket 09's picker sends the pick form; until then the end-to-end tests send it.

**The Build as the API's query**: `partValuesOf`, `<id>` or `<id>:<quantity>` in the Build's order, sent by the page's server as `GET v1/build`'s `part` through `api-client`, `cache: 'no-store'`, after `connection()`. The browser never calls the API.

**The page** (`_pages/build`), to DESIGN.md: the stub, the Build's till slip beside the Build's sheet over the dim photograph of a built PC, the slip first on a phone and pinned from 64rem, the back cover. The slip carries the Parts and whether it is complete, and the stamp only on a Complete Build with no Problem (ticket 08 adds its other lines). The sheet: "Your Build" as the `h1`, the status, the two groups of Categories, each Part with its photo or icon, its name in English, linked when it is a Visible Part, its manufacturer, Change or its quantity at the start of its controls and Remove at the end, Add another while fewer than 8, a cell to choose a Part for an empty Category, the line that the CPU makes a GPU or a cooler unneeded with a link to choose one all the same, and Empty the Build with its one confirmation. A Part the API leaves out leaves its Category not chosen, since the page draws the API's Parts. **The status** is `statusOf`: a Complete Build, with how many Problems remain when it holds any, the Categories still needed as the API answers them, each a link to its picker at `/{language}/build/{category}`, or that no Part is chosen yet; and under it, when the Build holds a CPU and no Part of the Category it stands in for, that it has integrated graphics or comes with a cooler, or, when the API lists the value in `cpuValuesNotKnown`, that it does not say. **An API that does not answer** was seen with a Shopper app whose API was a port nothing listens on: 200, the frame counting the cookie's one Part, "Your Build cannot be read just now", Try again to `/en/build`, and the cookie as it was.

**The frame**: "Your Build" and its count in a square of the Ink, in the stub and the home page's card (`FrameRow`), at the end of the name's row below 48rem and first on the switches' side from 48rem, its name for a screen reader "Your Build, 8 Parts", marked `aria-current="page"` on the Build page. The first `pnpm platform:check` failed three of `shopper-category-languages.spec.ts`'s films: the Category page's sheet moved 44 pixels in its first frames at 360 pixels, up in English and down in Kurdish. On a phone the way to the Build shared the name's row and wrapped under the name when the two did not fit, and the page's fonts arrive after its first frame (measured with the fonts and with them blocked: the name 168 pixels in Big Shoulders and 207 in the fallback, 201 in Noto Kufi Arabic and 183 in the fallback), so the row unwrapped in English and wrapped in Kurdish as they arrived. The row is now a size container, and the way to the Build stands under the name below 21em of its own text and at its end above, whatever the fonts: under it at 360 pixels in every language and in the home page's card at 390, beside it on the stub at 390; the stub then measures the same with the fonts and without, at 320, 360 and 390 pixels and at twice the text, in the three languages, and DESIGN.md says so. The count is `partsCountedIn`, read from the cookie, **each Part once whatever its quantity, as DESIGN.md says, not by its quantity as this ticket's box says**: put to the owner below, so that box stays open.

**The preview**: `buildPreview`, "Your Build · PC Parts and Prices" in each language, a description naming no Part and no price, `robots: { index: false }`, with `previewOf`'s other tags.

**The motion**, Motion 11 in `features/change-the-build/lib/in-place.ts` and the theme's new tokens and rules (`--line-print`, `--settle-again`, `--leave`, `line-prints`, `[data-arrived]`, `[data-settles-again]`, from `pieces.css`): a line Remove takes out fades in 100 ms and folds in 150 as the form is sent; once the page is drawn again, every space the change altered, a Category's place, the status, the slip's lines and the sheet's foot, moves from the height it had to its own (250 ms opening, 150 folding, 150 each way with reduced motion), each line it gains prints in, the stamp lands, and each figure it altered settles again; with reduced motion nothing fades, prints or settles. A first version opened only the arriving lines' spaces, and removing the CPU then jumped the page by the status's two lines about the CPU; the spaces are now moved whole. Emptying's disclosure opens and folds as the filters' fold does, at every width (`unfolds-in-place`). DESIGN.md is corrected for each, and for the slip, which lies on the first screen and so prints as the page opens, as the renderings drew it, rather than feeding.

**The words**: `Frame.yourBuild`, `Frame.yourBuildName`, `BuildPage.*` and `Preview.build.*` in the Shopper set in English, Kurdish and Arabic, drafts under LANG-7, the Kurdish taken from ticket 06's renderings where they had it, the terms words.md's (بیڵد, تجميعة, بیڵدی تەواو, تجميعة مكتملة); the limits' numbers are placeholders filled by `formatNumber`. `pnpm check`'s language files' check passes.

**`pnpm shopper:inspect --build empty|complete|worstCase`** puts a made-up Build in every tab's `build` cookie, written by `buildCookieOf` (`apps/inspector/src/made-up-builds.ts`) from `partValuesOf`, encoded as Next encodes a cookie. It is in the MVP spec's commands table and the design skills guide, with an example.

**The tests.** At the Shopper's unit seam, 102 tests in 6 new files (485 in 29 in all): reading the cookie with each kind of entry that cannot be read; writing it after a pick, a quantity, a removal and emptying, a single Category's Part replaced, a kit or a drive added or counted once more, and the limits refused with their reasons; the address a change answers with and the refusal read back; the Build as the API's query; the frame's count; the status and the lines about the CPU in each language; and the preview, not indexed. The inspector gained 2 tests and extended one (140 in all). At seam 3, `shopper-build-languages.spec.ts` in the 360-pixel window, 12 lines, each arranging its Build with the pick form from its own browser and made-up Parts made through the API with no specification, and reading the Build back from `GET v1/build`: each Part with its quantity and the Categories still needed, compared with the API's answer, and the two lines about the CPU, in Kurdish and English, and a Complete Build stamped; `readInEveryLanguage` on the page in all three languages with a kit held 16 times, the names in English and kept apart; a quantity by +, typed in Arabic-Indic digits and by −, a Remove, Keep them and emptying after confirming, the frame's count following, with script and with script switched off; a figure of 17 refused with why, both ways; the Build kept after a reload, on the home page and for a year in an `HttpOnly` cookie, the frame leading back to it, and a fresh browser's Build empty with eight cells to choose; the head not indexed and naming no Part or price; a ninth kit and a seventeenth of one refused with why; `expectAccessible` in both schemes, in English with the confirmation open and in Kurdish; and Motion 11 filmed slowed four times, with reduced motion and without, a kit and then the CPU removed in place, `snapsOf` finding nothing below snapping, the line fading only without reduced motion, its space folding either way, and the cell to choose a CPU printing in only without it. They were written after the page, and all 11 then written passed on their first run; the quantity fault below shows two of them red for their reason.

**Desk layouts.** At 1024 and 1280 pixels, captured apart, since the inspector keeps one desk picture: the slip beside the sheet in both languages, the stub one row at 1280 and two at 1024 in English as in Kurdish; the renderings measure the same (93 pixels at 1024 in both languages, 57 at 1280), so DESIGN.md's "at 1024 pixels in Kurdish" now says both.

**`break-ui`** on the worst-case Build, and the others, at 320 and 390 pixels, with the text at its size and at twice it, in Kurdish and English, in both schemes, measured in headless Chrome (sideways scroll, anything past the window, controls under 44 pixels, text under 14 or Arabic script under 15). Found and fixed: the Kurdish Change (گۆڕین) and Remove (لابردن) were 43 pixels wide (every underlined action is now at least 44 each way); at twice the text in Kurdish at 320 the quantity's form ran 5 pixels past its line (the form now shrinks its figure to 1.75em at the least), and so did Add another (it now starts under the picture as the line's controls do); and the confirmation's two buttons were wider than the sheet at twice the text (they now wrap their words). Held up: the 276- and 205-character names wrap whole; 22 Parts and quantities of 16 keep their column; + is off at 16; nothing scrolls sideways anywhere. The worst case is about 6,000 pixels long at 390 in English and 6,800 in Kurdish, before ticket 08's sheets.

**The fault checks**, each planted by one exact edit on a committed, clean tree by a script that refused a dirty one, run, and reverted by the inverse edit; `git status` was clean after each:

| Fault | Edit | Failed |
| --- | --- | --- |
| A malformed cookie refused instead of read as what could be read | in `readTheBuild`, an entry that cannot be read returns an empty Build | `the-build-cookie.spec.ts`, 15 of 22: each "drops each entry that cannot be read, and keeps the rest" |
| A second CPU kept beside the first | in `pickInto`, a single Category's Part always appended | `changing-the-build.spec.ts`, 2 of 27: "replaces the Build's Part of a Category that holds one, in its place" and "leaves the Build as it is for the Part the Build holds already" |
| The quantity form ignored without script | the quantity form's `method="post"` to `"get"` | under the lock, `shopper-build-languages.spec.ts` with scripts switched off, 2 of 2: after + the page held no quantity form ("Expected: \"3\"", the figure not found), and after the figure of 17 no form said why |

**`pnpm shopper:inspect`** on `/build` with each made-up Build (`--build empty`, `complete` and `worstCase`), in both schemes, in Kurdish and English, at 1440, 1280, 1024, 768 and 390 pixels, with the Shopper's sheet in place and this worktree's API on port 3103 for the made-up shop's one reading of the catalog (`API_URL`), under the lock; the worst case was inspected again after `break-ui`'s fixes. 0 FAIL in each of the 16 runs; the photographs were looked at (the phone's pages of each Build in both languages, the desk's first screens): the stamp lands on the Complete Build alone, and Kurdish mirrors the slip to the sheet's start side.

| Build | Kurdish, light and dark | English, light and dark |
| --- | --- | --- |
| Empty | `dashed`, `no-footage`, `blank-gap` at 768 | `dashed`, `no-footage` |
| Complete | `dashed`, `no-footage`, `blank-gap` at 768, `first-action` at 1440 | `dashed`, `no-footage`, `first-action` at 1440 |
| Worst case, before and after the fixes | `dashed`, `no-footage`, `blank-gap` at 768, `first-action` at 1440 | `dashed`, `no-footage`, `first-action` at 1440 |

Defended as browse ticket 14's reference defends them: `dashed` (the slip's dashed rules and the dotted leaders), `no-footage` (still photographs by design) and `blank-gap` at 768 in Kurdish (the back cover's one full-screen rest). New, and put to the owner below since its defence is a design choice: `first-action` at 1440 on a Build that holds Parts, whose first screen is the slip and the sheet's head, with each Part's Change and Remove as underlined words (DESIGN.md's A Category on the Build's sheet, the owner's `#p2` and `#p3`) and no cell or button; an empty Build's first screen holds its cells to choose a Part and has no such WARN.

**Checks on a phone wait for hosting**, as every module's do, recorded open: the Build page used with a thumb in Kurdish and in English, a quantity changed with the phone's number pad, and the motion felt on a real phone with reduced motion on and off.

**For the owner**, so the frame's box and the inspection's stay open:

1. The frame's count. This ticket's box counts a kit or a drive by its quantity; DESIGN.md, as ticket 06 wrote it, counts each Part once whatever its quantity, and the renderings showed that (the worst case "22 Parts"). Built as DESIGN.md says. Recommended: keep it, since the frame, the slip's "Your Build · 8 Parts" and "Remove all 8 Parts" then count the lines a Shopper sees on the sheet; counting by quantity would make the frame say 3 for a CPU and a kit held twice, beside two lines. Either is one line of `partsCountedIn` and its test.
2. `first-action` at 1440 on a Build that holds Parts. Recommended: keep the page as chosen and defend it, as the owner kept it for a Category page with nothing on: the first screen of a Build is what the Build is, its slip and its status, and each Part's actions are its own underlined words, as `#p2` and `#p3` chose; a button there would be a second primary action beside the picker's Pick, which ticket 09 builds.

**The gates.** Each piece was committed only once `pnpm check` passed on it. `pnpm platform:check` under the lock first failed the three Category page films above, then passed after the name row's fix: 403 passed in 17.4 minutes, the 12 lines of `shopper-build-languages.spec.ts` among them. `pnpm integration:check` was not run: the API is unchanged. The last commit passed `pnpm check --skip-nx-cache` with every `*.tsbuildinfo` outside `node_modules` deleted first. `builder/integration` was still at `30e5a75`, so merging it changed nothing.

**The pieces**:

- `7e06c4a` feat: keep the Build in its cookie and word its status
- `48697a5` feat(shopper): answer the forms that change the Build
- `f08c28f` feat: draw the Build page with its Parts and status
- `adc8bd3` feat(inspector): inspect a page with a made-up Build in its cookie
- `1ad3676` fix(shopper): move each space a change in place alters
- `e353703` test(e2e): read the Build page and change its Build in a phone's window
- `da827fe` fix(shopper): keep the Build's controls whole at a phone's largest text
- `2adcfac` test(e2e): read the Build page's head as a search engine would
- `ef7c3fe` fix(shopper): place the way to the Build by its row's width, not fonts
- `d434d13` docs(shopper): record the Build page, its tests and its fault checks

### 9 November 2026: the owner's answers

The coordinator relayed the owner's answers to both questions, each the recommended option, given after the owner had seen the inspection's pictures in `.taste-skill/builder-07/`:

1. **The frame's count**: "Each Part once (Recommended)". The owner chose to count each Part once, whatever its quantity, over this ticket's box, which counts a kit or a drive by its quantity; the box's wording stays as it was, and `partsCountedIn` stays as built. The frame's box is ticked, and DESIGN.md's The way to the Build names the choice.
2. **`first-action` at 1440 on a Build that holds Parts**: "Keep it, defend it (Recommended)". It is defended by the owner, beside `dashed`, `no-footage` and `blank-gap` at 768, which browse ticket 14's reference defends. As a Category page's `first-action` is held in DESIGN.md's The swing tag rather than in the sheet's allowances (`held-rules.md` and `direction.json` allow five other rules), this one is held in DESIGN.md's The Build's till slip. The inspection's box is ticked.

The box for the checks on a phone stays open, waiting for hosting.
