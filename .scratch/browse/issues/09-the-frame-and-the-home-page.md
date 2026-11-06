# 09: The frame rebuilt and the home page

**Spec:** [the browse spec](../spec.md)

**What to build:** The Shopper app's frame is rebuilt to its new DESIGN.md: its header, the language switch, the currency switch, the footer's credit and the not-found page. They keep their behaviour. The language stays in the address, the currency in its cookie, and both switches work without script.

The placeholder page gives way to the home page. It lists the eight Categories, each with its icon and its name in the Shopper's language, each leading to its Category page.

On 5 November 2026 the owner answered ticket 07's critique for this frame. Its name slot is a way home, a third switch chooses the scheme (light, dark or device), and the not-found page lists the eight Categories, with nothing particular to Erbil. The home page is built to DESIGN.md's home page, so it reads the API: each Category's count and its first Part, one Part on the plate, and the platform's figures from ticket 15.

Every page gains a title and a description in its language, with the tags that let WhatsApp and search engines preview it (BRW-5). A new setting gives the Shopper app's own public address for them.

**Blocked by:** 05, 08, 15 (for the home page's figures only: the frame can be built before 15 lands)

**Status:** ready-for-agent

- [x] **The frame** is built to DESIGN.md, from the components it names, with logical classes only. The language switch, the currency switch, the not-found page and the footer's credit (CAT-9) behave as `languages` and `pricing` left them. Its name slot is a way home. A third switch, for the scheme (light, dark or device), works without script as the other two do. The not-found page lists the eight Categories, as DESIGN.md draws it.
- [x] **The home page** at `/{language}` lists the eight Categories with `CategoryIcon` and their names from `i18n`'s Shopper set. Each leads to `/{language}/categories/{category}`. The Category's name in the address is lower case with hyphens (`cpu`, `cpu-cooler`, `motherboard`, `ram`, `storage`, `gpu`, `case`, `psu`), mapped once, in the Shopper app, to the API's key. The Category pages themselves are ticket 10's. The home page is built to DESIGN.md's home page:
  - each Category with its count of Visible Parts and its first Part's Lowest Price, from `GET v1/visible-parts`;
  - one Part on the plate, chosen as DESIGN.md says;
  - the facts, from ticket 15's `GET v1/platform-figures`.

  Each figure is shown only where the API answers it.
- [x] **The placeholder goes**: its page, its sample of the API's status, and its line about the chosen currency. The home page takes over the proof that the Shopper app reads the API.
- [x] **The public address.** A new setting for the Shopper app's own public address. Its development default is `http://localhost:3000`. It is checked at start-up, like the Shopper app's other settings, and added to `.env.example`.
- [x] **Previews.** Every page has these, in its language:
  - a title and a description;
  - its canonical address, and its addresses in the other two languages;
  - Open Graph's title, description, type, locale and site name.

  The home page's description says what the platform is for. No description holds a price. The functions that write a page's preview are plain functions, tested at the Shopper's unit seam in each language.
- [x] **The words.** Every new text is in `i18n`'s Shopper set in all three languages, the Kurdish and Arabic as drafts under LANG-7, using `words.md`'s terms.
- [x] It keeps to Feature-Sliced Design's import rules and Next's routing folder rule, and its pages are rendered on the server for each request.
- [x] `pnpm platform:check` passes on every line. `shopper-page.spec.ts` is rewritten for the home page, and every other Shopper spec keeps passing:
  - In Kurdish, Arabic and English, the home page lists the eight Categories by their names in the page's language, and each leads to its Category's address.
  - Kurdish and Arabic are right to left.
  - The home page's figures match what the API answers, for the platform and for each Category.
  - The scheme switch changes the scheme with no script, and keeps it from page to page.
  - The not-found page lists the eight Categories, each leading to its Category's address, and answers 404.
  - The home page's HTML holds its title, its description, its canonical address, the other two languages' addresses and Open Graph's tags. It is read with no cookie, as a crawler would.
  - `expectAccessible` passes on the home page and the not-found page in the light and the dark scheme.
  - Any motion DESIGN.md gives the frame is filmed with `film` and judged by `snapsOf`, with reduced motion as well as without.
- [ ] **Taste's inspector.** `pnpm shopper:inspect` runs on the home page and the not-found page, in both schemes, in Kurdish and in English, at 1440, 768 and 360 pixels. Every FAIL is fixed, and every WARN is fixed or defended, with the results under Comments.
- [x] `break-ui` and `mobile-native` run on the frame and the home page, and what they found is fixed or recorded under Comments.
- [x] `pnpm check`'s language check is seen to fail once, with the Arabic of the home page's description removed, and then reverted. A preview's canonical address pointing at another language is shown once failing its unit test, and then reverted.
- [x] `pnpm check` passes with Docker stopped.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 6 November 2026: built, and three questions for the owner

**Commits.** `46c7aa6` sets the Shopper app in Big Shoulders and Public Sans, Fontsource's variable packages at 5.3.0, the release-age policy kept, Archivo gone, and writes the look's theme anew (`ui`). `9922be2` adds the public address, `SHOPPER_PUBLIC_URL`, checked at start-up in Next's instrumentation file with `API_URL`, in `.env.example` and the MVP spec, and passed by `pnpm shopper:inspect` as `http://localhost:3100`. `d6654c0` remembers the scheme in a cookie (`shopper`). `3d82863` merges `browse/integration` at `d969e37`, with ticket 15's `GET v1/platform-figures`. `1ec15a6` shows every inspected tab with full motion (`inspector`). `4505ebd` adds the stationery, the Shown Price, the preview and the photographs (`shopper`). `a7e4750` rebuilds the frame and gives it the home page, the not-found page, the previews, the words and the end-to-end lines; it spans `shopper`, `ui`, `i18n` and `e2e` and takes no scope. `5a17902` holds the frame and both pages to their worst cases (`shopper`). This record, DESIGN.md's corrections and the MVP spec's phone checks follow.

**Decisions this ticket left open.**

- **A Category's address.** `entities/category` maps each of the eight once, `namesInTheAddress` (`cpuCooler` to `cpu-cooler`), with `categoryAddress` for a link and `categoryOfTheAddress` for ticket 10's route; tested at the unit seam.
- **The plate's Part** is the Visible Part with the most Vendors on the first pages of the eight lists, read in the chosen currency; of several with as many, the first in the catalog's order of the Categories and then in its list's order, so the same data always gives the same Part (`thePlatesPart`, tested). Its Visible Offers are read once more, for its slip.
- **The slip** is read from those Offers in the API's order, nothing converted or compared again: the Lowest Price is the first Offer in stock with a Shown Price, the highest in stock the last, then how many Vendors, in stock and converted, the Platform Rate from the platform's figures, and a foot with the day the lowest was confirmed and its Vendor as written (`slipOf`, tested).
- **Each figure only where the API answers it**, and a read the API refuses or does not answer at all is nothing, as `@pcp/api-client` answers both with no data: the rate's fact and the slip's rate line are left out until the Admin sets the first rate, and with no API the page shows the eight Categories with no count, no plate and no facts (seen on a server whose API answered nothing: 200, the eight Categories, no count).
- **Previews** are written by `previewOf`, a plain function tested in each language (22 tests): the title, the description, the canonical address on the public address, the three languages' addresses and `x-default`, the bare address, which picks the visitor's language, and Open Graph's type, title, description, address, site name and locale (`ckb_IQ`, `ar_IQ`, `en_US`, the other two as alternates). The home page's title is the site's name. The not-found page has its title and description and Open Graph's, and names no address. WhatsApp's reader gets them in the head (Next sends an HTML-limited bot the metadata before the body), and the end-to-end line reads them so, with no cookie.
- **The scheme switch** is a form, `POST /<language>/scheme`, as the currency's is; the device's scheme is no cookie at all. With script it changes in place and sends the same form in the background, its redirect not followed; every colour changes in one frame (`data-scheme-changing` holds every transition for it), and the browser's bar takes the chosen scheme's colour.
- **Motion** is the theme's utilities (`print-on-arrival`, `print-in-view`, `feeds`, `settles`, `stamp-lands`, `leans`, `pressable`) and one small component, `PrintInView`, which holds a piece back below the first screen and prints it once as its top passes nine tenths of the window. A page come back to is marked by one line in the head; the not-found screen, drawn by script, marks itself before it is painted. Nothing moves without script or with reduced motion.
- **Built here for ticket 10**: the Shown Price, one component with its "≈" and its mark, and a Part's photo served through the Shopper app at `/photos/<id>`, the API's answer passed through with its caching headers.
- **shadcn/ui** on Base UI, Lyra style (`components.json`), its button held to DESIGN.md. Its CLI added `cn` 0.5.2, too new for the release-age policy; the workspace's versions were put back (`@base-ui/react` 1.9.0, `class-variance-authority` 0.7.1, `cn` 0.4.0) and no exception was written.
- **The photographs** are three of ticket 07's, CC BY only, each WebP at most 1,920 pixels wide made with sharp from the original and served by Next's image component at the width it is drawn, each credited in the back cover by its title, author, licence and what was done to it: the red-lit motherboard (CC BY 2.0, dimmed, 290,948 bytes), the built PC (CC BY 4.0, dimmed, 287,838) and a board's connectors (CC BY 2.0, cut to 4:3, 256,662). The renderings' copper heat sink is CC BY-SA and was not used (question 3).
- **The fonts**, measured in Chrome on the home page in each language and on the not-found page in English and Kurdish, at 1440 and 390 pixels: four files, 209,272 bytes, on every page: Big Shoulders' Latin (36,524), Public Sans' Latin (26,832), Noto Kufi Arabic's Arabic (123,688), which English pages load too for the language switch's names, and its mathematical file (22,228). That is ADR-0013's 187.0 KB, and its 22.2 KB with a "≈". But the mathematical file does not draw the "≈": asked of each face alone, Chrome drew it in Times; in the page's stack, in San Francisco (`CSS.getPlatformFontsForNode`, where an Arabic letter and "×" came from Noto Kufi Arabic, so the probe works). DESIGN.md says so now (question 1).
- **The not-found page** is Next's bare document, drawn by script, in development and in production alike; a route group did not change it and was taken out. Its switches need script, as before; its head is the server's. In development only, React's performance track throws on it ("'UnknownAddress' cannot have a negative time stamp"), from the catch-all route's `UnknownAddress`, which calls `notFound()`; production builds have no performance track.
- **Taste's inspector** now asks every tab for full motion unless Taste asks it for reduced motion (`1ec15a6`): this Mac reduces motion, and Chrome took that, so every page showed still. `pnpm dashboard:inspect` takes it too.
- **The words** are in all three languages; the Kurdish and Arabic are drafts under LANG-7, with `words.md`'s terms, and `words.md` gains Lowest Price. The site's name is "PC Parts and Prices", پارچە و نرخی کۆمپیوتەر, قطع الحاسوب وأسعارها.
- **The end-to-end helpers.** `sample.ts` went with the placeholder's sample; `expectTheSameInEveryLanguage` moved to `languages.ts`. On a phone the currency's choices are its marks, IQD and $, the same in every language, so that line now checks them the same and the switch's name different. The switches stand in DESIGN.md's order from the start side, so the line that wanted the currency switch on the end side now checks that it comes before the language switch.

**The end-to-end lines.** 68 Shopper lines pass (`5a17902`): `shopper-page.spec.ts`, rewritten, 8: the figures against the API in dinars and in dollars, for the platform, each Category and the plate with its slip; the eight Categories in order with their tear-off tabs; the name slot; the home page's and the not-found page's heads read as WhatsApp reads them; `expectAccessible` on both pages in both schemes. `shopper-scheme.spec.ts`, new, 6: the device followed; Dark chosen with no script, kept from page to page and for a year, and Device forgetting it; in place with script; every colour in one frame (filmed); the phone's one button; no other site. `shopper-motion.spec.ts`, new, 11, each filmed and judged by `snapsOf`: the not-found sheet printing as it opens; with reduced motion, both pages still and whole; the Categories sheet held back and printing in view, its counts settling from the end side, in English and in Kurdish, and printing once; the slip feeding in ten steps and its stamp landing after; focus showing a sheet whole at once; a page come back to by back or forward printed; nothing moving or held back without script; the switches' press, with and without reduced motion. `shopper-currency.spec.ts`, 15, every price on the home page in the chosen currency, and the plate's tabs as the same choice. `shopper-languages.spec.ts`, 24: the eight Categories by name in each language, leading to their addresses, in the browser and in what the server sends; the language switch keeping the query, with and without script; the Part's name and price drawn as written; the same digits in each language; the not-found page's eight Categories and its 404. `shopper-credit-languages.spec.ts`, 4, each photograph's credit among them. A film first failed on Chrome writing a tiny clip as `1.2e-05%`, which the reader took for -5%; it reads exponents now.

**The faults, each planted once by a script on the committed tree (`a7e4750`) and taken out by the inverse edit; each file was clean after.**

| Fault | What failed | Why |
|---|---|---|
| The Arabic of the home page's description removed from `ar.json` | `pnpm check`, at `tools/check-language-files.mjs` | `"Preview.home.description": is missing. The English file has it.` |
| A preview's canonical address pointing at another language (`addressIn(language === 'en' ? 'ar' : 'en')`) | `@pcp/shopper:test`: 6 tests of `preview-of.spec.ts`, its canonical address and another page's, in each language | `https://parts.example/en` in place of `https://parts.example/ckb`, and so on |

**Taste's inspector**, `pnpm shopper:inspect` with the Shopper's sheet at the root, the worktree's API on 3103 for its one reading of the catalog, at 1440, 1280, 1024, 768 and 390 pixels, the 360-pixel rule measured by the end-to-end lines, on `/` and `/no-such-page`, in Kurdish and in English, in both schemes; then again after `5a17902` (folders `.taste-skill/b09j-*`).

| Page | FAIL | WARN |
|---|---|---|
| Home | none | `dashed`, `no-footage`, `still-page` (12 moved); `grey-body` in light; `size-count` in Kurdish |
| Not-found | `still-page`, 2 moved (question 2) | `first-action`, `no-footage`; `blank-gap` at 768 in Kurdish |

- Fixed: on the not-found page, `body-size` (a FAIL in English: its only long text was the sheet's note, at 14 pixels), `name-only-title` and `grey-body`. Its note is what the page says, so it is now Body large in the Ink, as the card's sentence is.
- Defended: `dashed`, the dot leaders (T5), the tabs' perforations (T2) and the slip's dashed rules (T1), all kept by the owner; `grey-body` on the home page, where the text the inspector reads is the Categories' second lines, in Soft Ink as DESIGN.md's second lines are (6.6:1), the page's sentences being in the Ink; `no-footage`, the photographs being stills by design, and a clip costing a phone its data; the home page's `still-page`, the Motion the owner chose holding the paper still; `size-count`, DESIGN.md's hierarchy at the Tall Script Rule's sizes and the cropped name, a picture; `first-action`, the not-found page's actions being its eight Category links; `blank-gap`, the back cover's one full-screen rest.
- Looked at by eye in both runs: the card, the sheet, the plate, the facts row and the back cover in both schemes and both languages; nothing is cut, and the 390-pixel shots match the renderings. A shot can catch a sheet or the slip mid-print, as the inspector scrolls faster than a print.

**`break-ui`**, its worst cases from the stand-in's made-up shop (the catalog's longest Part names, 400 GPUs, the 7800X3D with 20 Vendors, Vendors named in Arabic script), at 1440 to 390 pixels and, for the 360-pixel stub and card, measured.

| # | Severity | Case | What happened | Fix |
|---|---|---|---|---|
| 1 | Ugly | The stub at 360 pixels in Kurdish and Arabic | The scheme's button wrapped by 2 pixels (330 needed, 328 had) | The switches 2 pixels apart on a phone, as the renderings set them (`switches.tsx`, `5a17902`) |
| 2 | Ugly | The card at 360 to 399 pixels | The scheme's button wraps under the other two (288 had, 312 to 326 needed) | Kept, as in the renderings; each choice keeps 44 pixels. DESIGN.md says so now |

What held up, seen: "1 Part" and 400 Parts on the sheet; the 7800X3D's 20 Vendors on the plate, its slip with a converted price ("≈ 628,500 IQD") and the lowest Offer's Vendor as written on a Kurdish page; long Part names wrapping in full on a Category's second line; and the API not answering at all, which the client answers as no data, so that the home page showed the eight Categories with no count, no plate and no facts. Held up, read from the code and its tests, as the made-up shop does not put them on the home page: a count of none ("0 Parts", its figure kept) and "One Part, 1 Vendor" with "See its Offer"; a 276-character first Part, which wraps in full (DESIGN.md's Long Name Rule); a price of eight digits with its "≈" in the slip at 360, which has room for it; a Vendor named in Arabic script, kept as written; no rate; no Visible Part at all.

**`mobile-native`.** One fix: the room above the home page's card now clears a phone's notch (`pt-[max(2.5rem,env(safe-area-inset-top))]`, `card.tsx`), since the card's top row is the page's header. What held up, from the code: no tap highlight and no text inflation (`shopper.css`), `touch-action: manipulation` on links and buttons, hover only under a pointer that can hover, a press on `:active`, `svh` heights, no `vh` or `dvh`, words of controls not selectable, no long-press menu on buttons, a link's menu kept, the browser's bar in each scheme and in a chosen one, `viewport-fit=cover`, zoom never turned off, pull-to-refresh kept, as the pages are documents. What needs a phone waits for hosting, as the owner decided on 16 October 2026: the MVP spec's list gains this ticket's line, and these checks stay open.

**Checks.** Each commit was gated on `pnpm check --skip-nx-cache` with `DOCKER_HOST` pointed at a socket that does not exist and an empty `PLAYWRIGHT_BROWSERS_PATH`, every `*.tsbuildinfo` deleted first and the other pieces set aside: `1ec15a6`, `4505ebd` (its message reworded after, the tree unchanged), `a7e4750`, `5a17902` and this record. `46c7aa6`, `9922be2`, `d6654c0` and `3d82863` were checked out in a clone, installed offline and checked the same way, each passing. 108 unit tests in the Shopper's 10 files. `pnpm platform:check` passes on `5a17902`, the code of this branch's tip, 316 tests in 12.0 minutes, under the lock. `pnpm integration:check`, though no commit of this ticket changes the API, passes: 529 tests in 20 files, on its third run. The first stopped after 17 of the 20 files with no failure and no summary, as it did once in October; the second timed out while its Keycloak container started.

### 6 November 2026: for the owner

Three questions, each shown with its pictures on a page in the session's scratchpad, `browse-09/index.html`. Until they are answered the inspector's box stays open, and the ticket with it.

1. **The "≈".** None of the three faces draws it, so the device's own sans does. **A (recommended):** keep the device's "≈", which every phone draws, and stop fetching Noto Kufi Arabic's mathematical file (22 KB) by declaring its Arabic file ourselves in place of importing the whole package: no new library. **B:** add a face that draws "≈" the same everywhere, such as Noto Sans Math from Fontsource: a library, the owner's to choose. **C:** leave it as built.
2. **Taste's `still-page` on the not-found page,** a FAIL: one sheet prints there, and nothing else moves, as DESIGN.md's Motion keeps the paper still. **A (recommended):** let the Shopper's sheet allow `still-page`, as it allows four rules already, for the reason the Motion gives. **B:** give the page more movement, such as its eight Categories settling in, which DESIGN.md keeps for prices and counts alone.
3. **The facts row's photograph.** The renderings' copper heat sink is CC BY-SA. **A (recommended, as built):** a PC's expansion slots and their connectors, Shixart1985, CC BY 2.0, cut to 4:3: no maker's name, and its blue and orange sit with the bone and chocolate. **B:** "RGB computer cooling system with LED lighting", SankalpSasnur, CC0, nearer a heat sink but the loudest colour on the page.
