# 07: Capture the Shopper app, deal its directions and choose one

**Spec:** [the browse spec](../spec.md)

**What to build:** The Shopper app's design is planned fresh, unique to it, as the owner decided on 1 November 2026. Ticket 07 holds the whole first half of that plan:

- the Shopper app as it is today is captured and critiqued;
- Taste's script deals directions for it, never an agent picking one;
- each direction is rendered as the four kinds of page, filled with ticket 06's made-up shop, in the built-in browser;
- the owner chooses one by eye, and it is kept in the repository so that every later ticket, and a fresh clone, can build and inspect to it.

**Blocked by:** 06

**Status:** ready-for-agent

- [x] **The capture.** The Shopper app as it is (its frame, both switches, the footer's credit, the placeholder page, the not-found page) is captured with `pnpm shopper:inspect` in both schemes, in Kurdish and in English, at 1440, 768 and 360 pixels.
- [x] **The critique.** Taste's redesign audit leads, and Impeccable's `critique` adds UX and copy. Together they cover the captured pages and the existing [apps/shopper/DESIGN.md](../../../apps/shopper/DESIGN.md), Fit Diagram, which `catalog` ticket 10 drew before any Shopper page existed. The findings are recorded under Comments. Nothing the redesign's closed tickets 14 and 15 recorded binds this plan.
- [x] **The hard rules** of the root DESIGN.md and PRODUCT.md's Accessibility & Inclusion, as the redesign's ticket 03 left them, are restated in the brief:
  - WCAG 2.2 AA in both schemes, with a switch between them;
  - 44-pixel controls on a touchscreen;
  - 14-pixel text;
  - 360 pixels wide;
  - right to left;
  - self-hosted fonts that draw all of Sorani (ADR-0006).

  A direction that brings a new font keeps that rule, or keeps the current fonts.
- [x] **The deal.** Taste's script deals the directions with the run its SKILL.md gives for public pages, from the repository root. Its one-line brief says three things: the Shopper compares local shops' prices in Erbil, on a phone first, in Kurdish, Arabic and English; prices and the "≈" mark are the page's centre; and the hard rules hold.
- [ ] **The world of the subject.** Pictures of Erbil's bazaar, its computer shops, signs and lettering are found with Taste's `assets.mjs`, each with its credit recorded.
- [x] **The rendering.** Each direction is drawn as four pages: the home page, a Category page with its filters, a Part page with several Offers, one converted, and a Vendor page. Each is drawn in Kurdish and in English, at 360 and 1440 pixels, filled with ticket 06's made-up shop, so that no page is empty or a placeholder. Every option keeps the hard rules, and an option that breaks one says so on its page.
- [ ] **The choosing.** The options are shown in the built-in browser on one page, one option per anchor, two columns at most, before the owner is asked. If the owner takes none, the script deals again. The owner's choice is recorded under Comments with the owner's word.
- [ ] **Kept.** The chosen direction's sheet (its tokens and the inspector's allowances) is committed under the Shopper app's design folder, as the dashboard's is, since Git ignores `.taste-skill/`. A note under Comments says how to restore it there for the inspector.
- [ ] `pnpm check` passes, and the work is committed.

## Comments

### 4 November 2026: the capture

With `pnpm shopper:inspect <path> --language ckb|en --scheme light|dark --widths 1440,768,360 --out <folder>`, from this ticket's worktree on `48dde29`, under the e2e lock, with the API built from the same tree on port 3103 (`API_URL=http://localhost:3103`, so that the lock's ports were left alone) and the services from the owner's checkout. Nothing listened on ports 3000 to 3002 when the lock was taken, nor on 3100 or 3101 after the last run. Each run said "The stand-in API answers at http://127.0.0.1:3101 from the made-up shop: 21 Vendors and 852 Offers of 434 real Parts" and drew its page in its scheme and language. The pictures, Taste's `report.json` and each run's log are in the scratchpad's `browse-07/capture/`, which the orchestrator copies to the owner's `.taste-skill/browse-07/capture/`.

The Shopper app has two pages today, and the frame, both switches and the footer's credit are on each:

| Folder | Page | Path | Taste's inspector |
|---|---|---|---|
| `home-ckb-light`, `home-ckb-dark`, `home-en-light`, `home-en-dark` | The placeholder | `/` | 4 FAIL, 6 WARN in each |
| `missing-ckb-light`, `missing-ckb-dark` | The not-found page | `/no-such-page` | 4 FAIL, 6 WARN |
| `missing-en-light` | The not-found page | `/no-such-page` | 5 FAIL, 8 WARN |
| `missing-en-dark` | The not-found page | `/no-such-page` | 5 FAIL, 7 WARN |

- **The placeholder**, in all four: FAIL `few-pictures` (none), `no-title` (no h1), `still-page` (one element moves), `off-centre` (at 768 in English, its content 40 pixels from the left edge and 91 from the right; at 1440 and 768 in Kurdish, 452 against 376); WARN `hairline` (the footer's rule), `first-action` (no button), `no-footage`, `no-hero`, `off-centre` (376 against 427 at 1440 in English, 28 against 16 at 360 in Kurdish) and `hero-void` (37 to 40% of the first screen one empty block). The same four FAIL and six WARN as ticket 06 recorded.
- **The not-found page**: FAIL `few-pictures`, `focal-point` (the largest type is 16 pixels, 17 in Kurdish), `blank-gap` (a stretch of 724 to 732 pixels holds nothing) and `still-page`, and in English `body-size` (most running text is the footer's 14 pixels); WARN `hairline`, `first-action`, `no-footage`, `small-title` (the h1 is 16 pixels, 17 in Kurdish), `name-only-title` ("Page not found" and nothing else says what this is), `hero-void` (80% of the first screen), and in English `measure` (103 characters a line) and, in the light scheme, `grey-body` (the footer's grey, 6.8:1).
- **Prices** show in dinars, the Shopper's starting currency. The placeholder still says "The API cannot be reached": its one call, `GET v1/status`, is not a public endpoint, and the stand-in refused it and said so in each log, as ticket 06 recorded.
- **Taste's lint** (`lint.mjs apps/shopper/src apps/shopper/app libs/ui/src/themes/shopper.css`): 1 FAIL, `hairline` on the footer's `border-t`; 0 WARN.
- **Impeccable's detector** (`impeccable detect --json apps/shopper/src`, and again on `apps/shopper/app` and `libs/ui/src/themes`): nothing found, exit 0.

### 4 November 2026: the critique

Taste's redesign audit leads ("Record the before" and "A review stops here" in its `SKILL.md`, scored with its `references/critique.md`); Impeccable's `critique` adds UX and copy. Both were read against the pictures above and against [apps/shopper/DESIGN.md](../../../apps/shopper/DESIGN.md). Nothing the redesign's closed tickets 14 and 15 recorded was taken as binding.

**Taste: the captured pages**, in its critique's shape:

- Seen in one second: a short column of small black text near the top of a white page, and a grey rule near the bottom. On the not-found page, two lines of 16-pixel text and the rule.
- Idea: none on any page. Fit Diagram exists only in the DESIGN.md; nothing of it is drawn.
- Live thing: the currency switch, which changes one sentence of the placeholder; no price exists for it to change.
- Layout words: frame = switches at the end / main = a list of lines / footer = rule and sentence.
- Scores: design 3 · usability 4 · creativity 2 · content 2 → overall 3.0. Caps applied: FAIL present (6.0), no picture (design 6.5), no title on the first screen (usability 6), a hairline (6.5), placeholder content (content 5), no button on the first screen (usability 7).
- The three changes that would move the pages most: (1) a first screen that says what this is, in an h1 at display size, and leads straight to the eight Categories; (2) prices, and the "≈" beside a converted one, drawn as the page's centre in one decided figure style; (3) a frame of one pair of equal margins, with a place for the name and a way home, its switches told apart, and a footer that closes the page without a rule.

**Taste: the DESIGN.md, Fit Diagram.**

- Its idea is a Build drawn like a motherboard manual, which belongs to the `builder` module; on the four pages `browse` builds there is no Build, so it shrinks to paper, print black, square corners and ruled lines, which Taste reads as a well-applied kit.
- It fails the competitor test: put any other PC-parts site in "a Build drawn like a motherboard manual" and the sentence still works. Nothing in it is of Erbil, its shops or its two currencies.
- The Ruled Not Raised Rule (rules and borders everywhere) is against Taste's house rule of no thin rules; the lint's one FAIL is that rule, on the footer.
- Its Do of a Converted Price "with its ≈ in Caption Grey" makes the mark quieter than the figure, where the brief makes prices and the "≈" the page's centre.

**Impeccable: `critique`**, adding UX and copy.

⚠️ DEGRADED: single-context. Impeccable's critique asks for two isolated sub-agents; it ran inline inside this implementer, as redesign ticket 02's did, with Assessment A (the design review) written before the detector ran. No browser overlay was injected: Taste's inspector, run through `pnpm shopper:inspect`, gave the browser evidence. No snapshot was written to `.impeccable/critique/`, which Git does not ignore.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | The chosen language and currency are told only by bold against underline |
| 2 | Match with the real world | 2 | "This address matches no page", "Libraries: @pcp/compatibility" and "The API cannot be reached" are the engineers' words |
| 3 | User control and freedom | 1 | No way home: the frame has no name or home link, and the not-found page offers nothing to go to |
| 4 | Consistency and standards | 3 | The two switches behave alike; they also look alike, which hides which is which |
| 5 | Error prevention | n/a | Nothing to fill in yet |
| 6 | Recognition rather than recall | 2 | The currency switch has no visible name ("Currency" is only its accessible label) |
| 7 | Flexibility and efficiency | n/a | No task yet |
| 8 | Aesthetic and minimalist design | 2 | Minimal by absence; nothing leads |
| 9 | Error recovery | 1 | The not-found page names the problem in internal words and offers no next step |
| 10 | Help and documentation | n/a | No task yet |
| **Total** | | **13/28** (46%) | **Poor** |

- **Design specificity:** category-interchangeable, by absence. Nothing on the pages belongs to Erbil, its shops or its prices.
- **What works:** both switches work without script, as real links and a real form, 44 pixels each way, with `aria-current` on the chosen one and each language named in its own script, `lang` and `hreflang` set; right to left is correct, the header's order mirrors and the credit keeps OpenDB's and the licence's names as English units; the credit is on every page, the not-found page too (CAT-9).
- **[P1] No way home and no identity.** The frame carries no name and no home link (it waits for the platform's name), and the not-found page strands the Shopper. Fix: a home link in the frame's name slot, a plain description until the name is chosen, and the not-found page leading to the eight Categories. (`$impeccable clarify`, `$impeccable onboard`)
- **[P1] No scheme switch.** The root DESIGN.md's Scheme line asks for a light, dark or device switch beside the language switch in every app (the owner's word "Every app", 21 October 2026); the Shopper app follows the device only. This is a hard rule the app does not keep today. Fix: a third switch, working without script as the other two do. (`$impeccable harden`)
- **[P1] The currency switch reads as a second language switch.** "Dinars Dollars" and "کوردی العربية English" are two rows of the same underlined words; a first-time Shopper cannot tell that one changes every price. Fix: name it on the page ("Prices in"), and draw it as the price's own control rather than as a link row. (`$impeccable clarify`)
- **[P2] On a phone the switches take two rows**, 88 pixels, before anything else, the currency switch above the language switch. Fix: fewer rows, not smaller ones, as the root DESIGN.md says. (`$impeccable adapt`)
- **[P2] The not-found copy.** "Page not found. This address matches no page." Fix, in words a Shopper uses: say that the Part or shop may no longer be offered and offer the Categories. (`$impeccable clarify`)
- **[P2] The DESIGN.md is out of date for this module:** its surface brief's first viewport is the Build page, its components wait for "the first page", and it says nothing of a Category, Part or Vendor page, the scheme switch, or how a price and its "≈" are drawn. The rules that would still hold whatever the direction: one primary action a screen, every state in words as well as colour, prices in tabular figures. (`$impeccable document`, with ticket 08)
- **Persona red flags.** Jordan (first time): cannot tell what the site is, which switch changes prices, or where to go from the not-found page. Casey (a phone, one thumb): two rows of switches before any content at 360. Sam (screen reader, keyboard): the h1 exists only on the not-found page, at body size; the placeholder has none; no choice of scheme for someone who needs light on a dark-set phone.
- **Questions for the owner**, asked with the direction rather than now, since the owner is not answering while this runs: which comes first in ticket 09's frame, the way home and the name slot, the three switches, or the not-found page; whether the frame should carry Erbil's warmth or stay neutral beside a loud direction; and whether the not-found page should list the Categories or search.

**Where they agree and pull apart.** Both find the pages empty of the subject: no title, no prices, no picture, nothing of Erbil. Both want a way home and the switches told apart. They pull apart on the rule above the footer: Taste fails it as a hairline, while Fit Diagram's Ruled Not Raised Rule asks for it; the direction the owner chooses settles that. Findings that trace to a hard rule: the missing scheme switch (both schemes with a switch), and nothing else; the 44-pixel targets, 14-pixel text, 360 pixels, right to left and the fonts hold today.

### 4 November 2026: the hard rules in the brief

The deal's one-line brief carries the hard rules of the root DESIGN.md and PRODUCT.md's Accessibility & Inclusion as the redesign's ticket 03 left them: WCAG 2.2 AA in both schemes with a switch between them; 44-pixel controls on a touchscreen; no text under 14 pixels (15 in Kurdish and Arabic); 360 pixels wide; right to left; self-hosted fonts that draw all of Sorani (ADR-0006). A direction that brings a new Latin face keeps the last rule by setting Kurdish in a Sorani font the repository already serves.

### 4 November 2026: the deal

From the root of this ticket's worktree, the run Taste's `SKILL.md` gives for public pages (step 3), dealing three:

```
node ~/.claude/skills/design-taste-frontend/scripts/draw.mjs --sector ecommerce --sections list,showcase,intro,contact,footer --brief "<the line>" --options 3
```

The line: "The Shopper app compares local shops' prices for PC parts in Erbil, on a phone first, in Kurdish, Arabic and English; prices and the ≈ mark of a converted price are the page's centre; hard rules hold: WCAG 2.2 AA in both schemes with a switch between them, 44-pixel controls on a touchscreen, no text under 14 pixels (15 in Kurdish and Arabic), 360 pixels wide, right to left, self-hosted fonts that draw all of Sorani". `ecommerce` is the nearest of Taste's sectors to a comparison of shops' prices. The sections are the four pages' parts, in the order of their argument: a list (the Categories, a Category's Parts, a Part's Offers), a showcase (one Part), an intro (the promise that no Vendor buys its place), a contact (a Vendor) and the footer (the credit to OpenDB); the hero is implied. No `--tone`, `--have` or `--keep` was given: the project has no photographs of its own, and the hard rules let a direction bring a new Latin face.

It dealt, in this order, `contact-sheet`, `page-is-the-object` and `pinned-poster`. Each was then dealt in full with the same command plus `--direction <id>` and `--out` into its own folder, so that no sheet overwrote another:

| Option | Direction | Seed | Type | Palette | Hero | Sections |
|---|---|---|---|---|---|---|
| 1 | The contact sheet | 253395428 | Bricolage Grotesque | Frost and slate | Lit strip, four corners | Two-ended rows, narrow column · One image across tiles · Narrow column, empty field · Photo strip, three-cell bar · A footer of tiles |
| 2 | The page is the object | 2092360077 | Big Shoulders / Public Sans | Bone, green, chocolate | Card over a dim room | The printed menu sheet · Square plate, spare text · Title, note, facts row · Clip-out coupon form · Invitation over a cropped name |
| 3 | The pinned poster | 1959420171 | Cabinet Grotesk | Bubblegum and lime | Pinned title over portraits | Line-up at one type size · One frame, three distances · Pinned sentence, photographs pass · The email as display type · Photograph half, menu half |

The three sheets (`direction.json`, and each printed as `oN-sheet.md`) and the deal's output (`dealt.md`) are in the scratchpad's `browse-07/`, which the orchestrator copies to the owner's `.taste-skill/browse-07/`. Taste kept the draws in `~/.taste-skill/history.json`; the write there was not refused. No agent chose among them.

### 4 November 2026: the world of the subject

Found with Taste's `assets.mjs` (Openverse, Wikimedia Commons, the Art Institute of Chicago and the Met, licences safe for commercial use), with queries for Erbil's bazaar, the Qaysari bazaar, Erbil's computer shops and electronics market, shop signs, street signs, Kurdish calligraphy and Sorani lettering, the citadel, market streets and Hawler; downloaded with `--get` into `browse-07/assets/` with `credits.json`. Kept, all via Wikimedia Commons but one:

- "Historic core of the Erbil Bazaar 2", "Erbil Bazaar 2", "Erbil Bazaar 3", "Bazaar in Erbil 01", "02", "04" and "06", by Levi Clancy, CC BY-SA 4.0;
- "Erbil Qaisari Bazaar" by Sarchia Khursheed, "Kurdistan - Erbil - Qaysari Market" by Lamacchiacosta and "Qaisary Bazaar of Erbil" by Sarbast.T.Hameed, CC BY-SA 4.0;
- "Erbil Citadel, Erbil, Kurdistan Region of Iraq" by MSinjari, CC BY-SA 3.0;
- the signs: "A road sign ofr Baghdad, Kirkuk, Duhok, and Sulaymaniyah in Erbil DSF2315" (its title as written) by Levi Meir Clancy, CC0, and "Street signs in Erbil" by Jeffrey Beall, CC BY 2.0, via Flickr; both carry the city's three scripts.

Each picture's page and licence are in `credits.json` and on the comparison page's `#credits`. Two more were downloaded and dropped, "Inside the Bazaar - Erbil - Iraq" and "Views around Teyrawa Bazaar in Erbil 01", because real shops' signs and names fill them and the platform must not seem to list a real shop. **No openly licensed picture of an Erbil computer shop was found**: "Erbil computer shop" and "Erbil electronics market" found none (Openverse did not answer the first within its 30 seconds), and "computer shop Iraq" found only military pictures. Nor was Sorani lettering on a shop sign found ("Kurdish shop sign", "Sorani script sign", "Kurdish calligraphy" found nothing of Erbil). The box stays open for the owner: accept the pictures as found, or name a source.

### 4 November 2026: the renderings

Static pages, built by `browse-07/build/build.mjs` from the made-up shop as ticket 06's stand-in answered it during the capture (`browse-07/data/shop.json`, read by `dump-stand-in.mjs` with GETs of the public endpoints only), and from words in English and Kurdish (`build/common.mjs`). No app source was used or changed. For each option, the four pages in Kurdish and in English, each in dinars and in dollars (`oN/<page>-<language>[-usd].html`), 48 pages in all:

- **The home page**: the eight Categories with their counts, the Lowest Price of each one's first Part, one Part's twenty Offers or their Lowest Price, the promise that no Vendor buys its place.
- **A Category page with its filters**: CPU, its 9 Visible Parts in the stand-in's order, the Intel Core i7 14700K's Lowest Price converted ("≈ 575,000 IQD"), the AMD Ryzen 9 7950X3D out of stock at every Vendor and last; search, manufacturer, socket, cores and a price range, as a real form, folded behind a Filters button on a phone.
- **A Part page**: the AMD Ryzen 7 7800X3D, its made-up photo, part numbers and 26 specifications, and its 20 Offers, in stock first and then by price, four of them converted and marked "≈" with the Vendor's own quote beside them, three out of stock, Vendor names in Kurdish, Arabic and Latin script, the 47-character "Invented Components & Accessories Trading Company" and "شركة التقنيات الوهمية لتجارة الحاسبات وملحقاتها" among them.
- **A Vendor page**: "کۆگای پارچەی خەیاڵی", every contact detail as links (dialler, WhatsApp, Instagram, Google Maps), its address and hours as written, and its 10 Offers grouped by Category, the catalog's longest Part name (276 characters) among them.

Every page carries the frame's three switches: prices in dinars or dollars, the language (Arabic is shown, not drawn), and the scheme, light, dark or the device's, beside the language switch; on a phone they fold into one row (IQD, $, the three languages, and one button that turns the scheme). The scheme switch works by script; without it each page follows the device. The wordmark slot reads "PC Parts in Erbil" as a plain description, since the platform's name is still to be chosen (PRODUCT.md's Brand Commitments). Kurdish and the other new words are drafts for LANG-7.

Pictures of each page at 1440 by 900 and 360 by 780, the first screen and the whole page, in both schemes, are in `browse-07/shots/` (by `build/shoot.mjs`, with Taste's own `cdp.mjs`); none scrolls sideways at 360.

**The hard rules in each option.** Every option keeps them; where its sheet as dealt breaks one, its page says how it is held:

- All three: the dealt small step is 13 pixels (and 12 for a legal line in options 2 and 3), held at 14, 15 in Kurdish, units of prices included; each palette is light only, so each has a dark scheme drawn from its own colours, with the switch; no dealt Latin face draws Arabic script, so Kurdish is set in a Sorani font the repository already serves: Noto Sans Arabic in option 1, Noto Kufi Arabic in options 2 and 3. A new Latin face would be self-hosted as ADR-0006 asks; the renderings load it from Google Fonts or Fontshare, and its package is to be checked when it is chosen.
- Option 1: the hero's 14-pixel sentence and text-link action become body text and a real 48-pixel button. The "Mountain" photographs dealt with the sheet are replaced by the pictures of Erbil.
- Option 2: the type system sets Big Shoulders in capitals, which the No Capitals Rule forbids; it is set in sentence case. The coupon's inputs become the Vendor's contact links.
- Option 3: black display type over the bazaar's dark pictures fails contrast, so the title sits above the portrait instead of across it; lime fails as text on the pink (about 2:1), so it is used only behind black, on the main button and one highlighter swipe, as the sheet says. Cabinet Grotesk comes from Fontshare under its own licence; whether it may be served from the platform's own server is to be checked before it is chosen.

**Taste's inspector on the renderings**, by its rules for public pages, at 1440 and 360, over a local server of the folder: the four pages in English and Kurdish in the light scheme and each option's Part page in the dark, ten runs an option, its pictures and `report.json` in `browse-07/inspect/`. Option 1: 4 to 5 FAIL and 2 to 6 WARN a page; option 2: 4 to 7 FAIL and 4 to 7 WARN; option 3: 2 to 4 FAIL and 3 to 9 WARN. Nothing it measures against a hard rule remains: no contrast under 4.5:1, no text under 14 pixels, and a scan of every Kurdish page found no Arabic-script text under 15; no page scrolls sideways at 360. On the way it found, and these were fixed: the Vendor's contact cells in options 1 and 2 at 4.2:1 and 4.1:1 (now 7.4:1 and 7.9:1), the units of prices and option 3's quoted prices set at 10 to 12 pixels, option 1's mosaic heading and Kurdish title on three lines, option 2's three words on three lines at 360. What it still fails is what a still rendering of working pages lacks: `still-page` in every run (no motion layer yet; Emil leads it in ticket 08), `few-pictures` (a Category, Part or Vendor page carries one or two real pictures, not four), `blank-gap` and `empty-screens` (option 1's narrow column, the pins, and short stretches on a phone), `eyebrow` (the crumb or the frame's name above an h1), `body-size` (lists of 14-pixel lines read as running text), `off-centre` (option 2's split plate and offset sheet), and `focal-point` and `no-title` on a phone where a picture or a card comes first. A public page's rules fit the home page better than a list of Parts: whether the Shopper's working pages are inspected as pages or with `--app`, and the allowances the chosen sheet carries, is for the Kept box.

**Motion.** The renderings carry each sheet's compositional moves (option 1's sideways strip and runs, option 3's pinned title and sentence; option 2's card that shrinks to a stub as the page scrolls is not built) and simple hovers, not each sheet's whole motion layer: motion is Emil's to lead, in ticket 08's DESIGN.md.

### 4 November 2026: for the owner

The comparison page is the scratchpad's `browse-07/index.html`, which the orchestrator copies to the owner's `.taste-skill/browse-07/` and serves on port 4110 as `/browse-07/`: `#before` (the capture), `#o1`, `#o2`, `#o3` (one option each, its idea, its sections, how it holds the hard rules, then each of the four pages in English and Kurdish at 1440 side by side and at 360 side by side, with a Light and Dark switch for all the pictures and a link to each live page in dinars and dollars), and `#credits`.

1. **The contact sheet** (`#o1`, seed 253395428): everything at once, small, in strict rows, nothing featured; a dark field with a lit strip of the bazaar, each Category a run of its Parts' frames with their prices, a Part's Offers twenty equal tiles; Bricolage Grotesque on frost and slate with one teal.
2. **The page is the object** (`#o2`, seed 2092360077): the printed price list a shop hands over the counter; a card over the dim Qaysari bazaar, scalloped printed sheets with names at the left and prices at the right, the Vendor as a clip-out coupon; Big Shoulders and Public Sans on bone, chocolate and one green.
3. **The pinned poster** (`#o3`, seed 1959420171): a title pinned while the bazaar's portraits and the rows pass beneath it; the Categories and Offers as a line-up at one type size, a Part between its Lowest Price and "at 20 Vendors", a Vendor's phone number as display type; Cabinet Grotesk on bubblegum pink with lime for the action.

Or ask for a new deal. Also waiting on the owner: the pictures as found (no computer shop, no Sorani shop lettering), and the critique's three questions above. The boxes for the world of the subject, the choosing, the sheet kept and the last one stay open, and the Status stays, until the owner chooses.
