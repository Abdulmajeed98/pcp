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
- [x] **The world of the subject.** Pictures of Erbil's bazaar, its computer shops, signs and lettering are found with Taste's `assets.mjs`, each with its credit recorded.
- [x] **The rendering.** Each direction is drawn as four pages: the home page, a Category page with its filters, a Part page with several Offers, one converted, and a Vendor page. Each is drawn in Kurdish and in English, at 360 and 1440 pixels, filled with ticket 06's made-up shop, so that no page is empty or a placeholder. Every option keeps the hard rules, and an option that breaks one says so on its page.
- [x] **The choosing.** The options are shown in the built-in browser on one page, one option per anchor, two columns at most, before the owner is asked. If the owner takes none, the script deals again. The owner's choice is recorded under Comments with the owner's word.
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

### 5 November 2026: the owner's answers to the first deal

The orchestrator showed the first page, and relayed the owner's words:

- **The directions:** "I liked (2) so make a new deal to replace the (1,3) and include (2) to see more".
- **The pictures:** "Since I am planning to broad the app outside of erbil, we don't need Erbil specific pictures, prepare the designs without erbil photos, it is preferred to be more PC enthusiastic instead which is the representation of PC uniquely. Search Credible sources like `dribbble.com` and similars".
- **Which comes first in ticket 09's frame:** "All of the options".
- **Whether the frame carries Erbil's warmth:** "No erbil specifics".
- **Whether the not-found page lists the Categories or a search:** "List the Categories".

So option 2, The page is the object, stays, drawn again without Erbil; two new directions replace options 1 and 3; the pictures stand for PCs, not for a place; and the box for the world of the subject is answered by pictures of PC hardware in place of Erbil's, with their credits.

### 5 November 2026: for ticket 09, the frame

The owner's answers to the critique's three questions, for ticket 09, which builds the frame:

- **All three P1 fixes come in the frame**: the way home and a name slot (a plain description until the platform's name is chosen); the three switches, the currency named on the page as the price's own control, the language, and the light, dark or device switch the hard rules ask for beside the language switch, told apart from one another and in fewer rows on a phone; and the not-found page.
- **No Erbil specifics** in the frame, nor anywhere in the design: the owner plans the app beyond Erbil.
- **The not-found page lists the eight Categories**, each leading to its Category page.

### 6 November 2026: the second deal

The brief, with no city: "The Shopper app compares the prices that computer shops charge for PC parts, for people who build their own PCs, on a phone first, in Kurdish, Arabic and English, in dinars and dollars; prices and the ≈ mark of a converted price are the page's centre; hard rules hold: WCAG 2.2 AA in both schemes with a switch between them, 44-pixel controls on a touchscreen, no text under 14 pixels (15 in Kurdish and Arabic), 360 pixels wide, right to left, self-hosted fonts that draw all of Sorani". It keeps the product, the three languages, dinars and dollars and the hard rules.

- **With the same sector**, from the root of this ticket's worktree: `node ~/.claude/skills/design-taste-frontend/scripts/draw.mjs --sector ecommerce --sections list,showcase,intro,contact,footer --brief "<the line>" --options 2`. It dealt `split-stage`, which is new, and `contact-sheet`, the first deal's option 1 again (its output in `dealt.md`). Taste's library holds only four directions for `ecommerce` that need no photographs of the product (`contact-sheet`, `page-is-the-object`, `pinned-poster` and `split-stage`); the first deal had taken three, and the draw keeps only the two most recent out of a pool so small. So `ecommerce` can give one new direction, and it gave it.
- **The split stage** was dealt in full with `--direction split-stage --out browse-07-deal2/o4`: seed 289709026.
- **The second new direction** was left to the script in the next nearest sector, `physical-product` (PC parts are physical products), with no direction named, so that the script itself chose it: `--sector physical-product --out browse-07-deal2/o5` with the same brief and sections. It dealt `sentence-as-layout`: seed 1777153484. Taste's history in `~/.taste-skill/history.json` now holds both; the writes were not refused. If the owner would rather the second came from another sector, the script deals again from it.
- **Option 2 is not dealt again**: its sheet stays as dealt on 4 November (seed 2092360077, in `browse-07-deal2/o2/direction.json`, a copy of the first deal's), since a new deal with the same seed would differ now that Taste's history has moved. Its brief still names Erbil; its renderings no longer do.

| Option | Direction | Seed | Sector | Type | Palette | Hero | Sections |
|---|---|---|---|---|---|---|---|
| 2 (kept) | The page is the object | 2092360077 | ecommerce | Big Shoulders / Public Sans | Bone, green, chocolate | Card over a dim room | The printed menu sheet · Square plate, spare text · Title, note, facts row · Clip-out coupon form · Invitation over a cropped name |
| 4 (new) | The split stage | 289709026 | ecommerce | Imbue / Albert Sans | Orange and black | Menu column, sticky photograph | Giant word, filled bar rows · Square plate, spare text · Narrow column, empty field · Photo strip, three-cell bar · Name across the last photograph |
| 5 (new) | The sentence is the layout | 1777153484 | physical-product | Newsreader | Stone and blueprint | Sentence with a photo strip | Statement, table pushed right · One frame, three distances · Headline crossing onto a photograph · The email as display type · Invitation over a cropped name |

Both new sheets suggest searching for "kurdish postcard" and "kurdish old map": Taste reads a place out of "in Kurdish" in the brief. Those searches were not made, as the owner asked for no place.

### 6 November 2026: the pictures and the references

**The pictures** stand for PCs: hardware, components and builds. Found with Taste's `assets.mjs` (licences safe for commercial use) with queries for motherboards, graphics cards, CPUs, RAM, builds, gaming PCs, water cooling, case fans, hardware, circuit boards, heat sinks, SSDs, power supplies and PC components, and downloaded with `--get` into `browse-07-deal2/assets/` with `credits.json`. Kept, 15:

- by Shixart1985, CC BY 2.0: a red-lit motherboard, a hand setting a RAM module into a board under red and blue light, a board's connectors under blue light;
- "Computer motherboard magnified by water" by Therringshaw, CC BY 4.0; "Computer Motherboard Closeup" by Lenharth Systems, CC0; "Four SDRAM DIMM slots on a computer motherboard" and "Full modular ATX power supply unit" by Project Kei, CC BY-SA 4.0;
- "computer case with RGB fans" by Ajith R N and a gloved hand holding a DDR5 SODIMM by dumanag, CC0, via the WordPress Photo Directory; "RGB computer cooling system with LED lighting" by SankalpSasnur, CC0;
- "Gaming-PC 20240426 HOF2514" by PantheraLeo1359531, CC BY 4.0; "SDRAM memory module, zoomed" by Vitaly Zdanevich, CC0; "Copper heat sink with pipes" by Charles Gaudette, CC BY-SA 3.0; "Water Cooled PC" by Dave Monk, CC BY-SA 2.0; "Infrared photography of computer hardware" by FritzchensFritz, CC0;
- all via Wikimedia Commons but the two from the WordPress Photo Directory, each with its page in `credits.json` and on the page's `#credits`.

Ten more were downloaded, looked at and dropped (their reasons in `assets/dropped.json`): six show a chip, card or board maker's name or logo large, which a neutral platform must not seem to endorse; one shows an identifiable young person; three had little to show. No picture stands next to a Part as if it were that Part: the Parts keep ticket 06's drawings, marked "Made-up photo".

**The references**, for how PC-enthusiast design looks, are linked on the page's `#references`, never copied into a rendering: on Dribbble, Daniel Ezsias' "Build Your PC Price Calculator", Daan's illustration of a graphics card's circuit board, Farzana Akter's "Gaming Product Landing Page", Panze studio's "PC Mate AI" parts app, and the galleries for the tags PC parts, custom PC and graphic card and the search "PC build"; on Behance, Andrey Karpets' "Gaming Computer Store" redesign, Karim Emad's "PC builder" case study, Alex Casabò's "Crystal PC Case Concept", Kresimir Jelusic's "pc case study", and the search "computer parts". They were found by web search; Dribbble served an empty page to an automated reader, so none was opened here, and the page says only what the search results describe: dark grounds, the hardware shown large, a picture of the build that changes as parts are chosen, filters by specification.

### 6 November 2026: the second deal's renderings

Built as the first deal's were (`browse-07-deal2/build/`, the same made-up shop and words, now with no place): for each option the four pages in Kurdish and English, in dinars and dollars, 48 pages, with the frame's three switches, pictures at 1440 by 900 and 360 by 780, the first screen and the whole page, in both schemes, in `browse-07-deal2/shots/`. None scrolls sideways at 360, measured by the page's own width and the viewport's.

- **The words name no place**: the name slot reads "PC Parts and Prices" ("پارچە و نرخی کۆمپیوتەر"), the home page's title "PC Parts, priced Vendor by Vendor" ("نرخی پارچە، فرۆشیار بە فرۆشیار"), and a Category page's line "9 Parts that Vendors offer now". **The made-up shop's own data still names Erbil**: one of ticket 06's made-up Vendors is called "Mock Hardware Erbil", the Vendors' addresses and their city say Erbil, and the API knows one city, `erbil`. The pages show a Vendor's data as written, as the spec asks (its city and address on its page), so it stays; it is ticket 06's to change if the owner wants it gone.
- **Option 2, drawn again**: the card's three words are now Parts, Prices and Vendors; it lies over a dim photograph of a red-lit motherboard in place of the Qaysari bazaar; a Category's printed sheet, a Part's Offers and a Vendor's coupon now lie over dim photographs of hardware, as its list blueprint allows, and the facts row carries a copper heat sink at 4:3. Its sheet, type, palette and compositions are unchanged.
- **Option 4, The split stage**: a sticky photograph of hardware (a water-cooled PC with orange tubing on the home page, changing to a copper heat sink and a red-lit board as their sections arrive; a board's connectors on a Category page; the Part itself on a white field on a Part page) beside a column set like a counter's price card: the name, the switches and the title centred, then one giant word over filled bars that open, each Category, group of Offers or filter a bar. The square plate breaks the split once, full width; the Vendor page opens with the photo strip and three cells; the footer is the name across a dim photograph of a power supply.
- **Option 5, The sentence is the layout**: "Every PC [four memory slots] priced" ("هەموو [ ] بە نرخ"), the word "part" in the photograph's place and in the heading's accessible name; then each section a statement on the left with its proof on the right, its table pushed right, every photograph printed in the one blue ink; one frame at three distances; "Nobody buys a better place" crossing onto a photograph, in paper colour where it lies on it; the Vendor's phone number as display type; an invitation over the cropped name.

**The hard rules in each option.** Every option keeps them; where its sheet as dealt breaks one, its section on the page says how it is held:

- All three: the dealt small steps of 12 and 13 pixels are held at 14, 15 in Kurdish; each palette is light only, so each has a dark scheme drawn from its own colours, with the switch; no dealt Latin face draws Arabic script, so Kurdish is set in fonts that draw all of Sorani (ADR-0006's list): Noto Kufi Arabic in option 2, Noto Naskh Arabic for display and Noto Sans Arabic for text in option 4, Noto Naskh Arabic in option 5. New faces would be self-hosted as ADR-0006 asks; the renderings load them from Google Fonts, and their packages are to be checked when one is chosen.
- Options 2 and 4: their type systems set Big Shoulders and Imbue in capitals, which the No Capitals Rule forbids; both are set in sentence case. Option 4's 20-pixel panel corners become square, the page's one radius.
- Option 5: on a phone its crossing headline may run to three lines, so it does not cross there; the photograph follows it.

**Taste's inspector on the renderings**, by its rules for public pages, at 1440 and 360, over a local server of the folder: the four pages in English and Kurdish in the light scheme and each option's Part page in the dark, ten runs an option, its pictures and `report.json` in `browse-07-deal2/inspect/`. Option 2: 3 to 6 FAIL and 4 to 7 WARN a page; option 4: 3 to 7 FAIL and 3 to 5 WARN; option 5: 4 to 5 FAIL and 3 to 5 WARN. Nothing it measures against a hard rule remains: no contrast under 4.5:1, no page scrolling sideways at 360, and a scan of every page found no text under 14 pixels nor Arabic-script text under 15. On the way, and fixed: a Kurdish word and a phone number that widened a right-to-left phone page by 3 pixels; option 4's Kurdish title on three lines, its footer's text 12 pixels from the edge and two warm whites it read as cream; and, from the scan, the language switch's Kurdish and Arabic names and a Vendor's Kurdish address at 14 pixels on English pages, now 15. What it still fails is what still renderings of working pages lack, as in the first deal: `still-page` in every run (no motion yet; Emil leads it in ticket 08), `few-pictures` (a Category, Part or Vendor page carries one to three real pictures), `blank-gap` and `empty-screens` (option 5's generous spaces, short stretches on a phone), `eyebrow` (the crumb or the frame's name above an h1), `body-size` (lists of 14-pixel lines read as running text), `off-centre` (option 4's split and option 2's offset sheets), `focal-point`, and `no-title` on a phone, where option 4's photograph or option 2's card comes first and the h1 starts 224 to 318 pixels down, inside a 780-pixel phone's first screen. Two more are the dealt devices themselves: option 5's `covered-text`, where the heading's paper-coloured copy lies over the heading, clipped to the photograph, as its blueprint's crossing asks; and option 2's `palette-cream` WARN in the dark scheme, its own bone ink. These, and the page rules above, are for the Kept box's allowances, once the owner has chosen.

### 6 November 2026: for the owner

The second deal's page is the scratchpad's `browse-07-deal2/index.html`, for the owner's `.taste-skill/browse-07-deal2/`; the first deal's page stays at `browse-07/` for comparison. Anchors: `#o2`, `#o4`, `#o5`, `#references` and `#credits`.

1. **The page is the object** (`#o2`, seed 2092360077), kept: the printed price list a computer shop hands over the counter; a card over a dim, red-lit motherboard, scalloped printed sheets over dim hardware, the Vendor as a clip-out coupon; Big Shoulders and Public Sans on bone, chocolate and one green.
2. **The split stage** (`#o4`, seed 289709026), new: half the screen holds still, a photograph of hardware or the Part itself, beside a price card that scrolls; a giant word over bars that open; Imbue and Albert Sans on hot orange and blue-black.
3. **The sentence is the layout** (`#o5`, seed 1777153484), new: one poster-sized sentence with a strip of memory slots for a word, every section a statement with its proof, the pictures printed in one blue; Newsreader on stone.

Or ask for another deal, from another sector if the owner names one. The boxes for the choosing, the sheet kept and the last one stay open, and the Status stays, until the owner chooses.

### 6 November 2026: the owner's answer to the second deal

The owner, in their words: "didn't like this dealt as well, give me another one and bring out more creativity". None of options 2, 4 and 5 is taken, so the script deals again, bolder, and the rendering is pushed further.

### 6 November 2026: the third deal

The second deal's brief, unchanged (no city), from the root of this ticket's worktree: `node ~/.claude/skills/design-taste-frontend/scripts/draw.mjs --sector physical-product --tone bold --sections list,showcase,intro,contact,footer --avoid contact-sheet,page-is-the-object,pinned-poster,split-stage,sentence-as-layout --brief "<the line>" --options 3`, then each in full with `--direction <id> --out browse-07-deal3/o<n>`. No `--have product-photo`: the Parts have no photographs of their own. The pool the avoid list left held five directions (`name-as-monument`, `colour-chapters`, `one-motif`, `borrowed-category`, `loud-flat-poster`), as expected; the script dealt `one-motif`, `colour-chapters` and `name-as-monument`, in that order (its output in `dealt.md`), and no agent chose among them. Taste's history in `~/.taste-skill/history.json` now holds all three; the writes were not refused.

| Option | Direction | Seed | Type | Palette | Hero | Sections | Motion |
|---|---|---|---|---|---|---|---|
| 6 | One motif | 1795324496 | League Spartan / Figtree | Soot and lime | Giant cropped shape | Cards that fold into spines · Object on a disc · Statement with inline thumbnails · Clip-out coupon form · The mark, built large | Shutter image |
| 7 | Colour chapters | 1987852394 | Roundo | Blue, red, black | Waterline headline | One item per poster line · Two objects, two fields · Statement tiles · Address in display rows · Contact as the headline | Masked headline |
| 8 | The name as a monument | 1208468623 | Red Hat Display / Red Hat Text | Plum-black and pink | Inset photograph, crossing wordmark | Giant word, filled bar rows · Square plate, spare text · Heading captions a panorama · The email as display type · Columns above, wordmark below | Scaling wordmark |

All three sheets say the product has no photographs and ask for drawings of it; their dealt atmosphere photographs ("Coast", "Mountain", "Architecture") and their suggested searches for Kurdish postcards are not used, as in the second deal.

### 6 November 2026: the third deal's renderings

Built as the second deal's were (`browse-07-deal3/build/`, the same made-up shop and place-free words): for each option the four pages in Kurdish and English, in dinars and dollars, 48 pages, with the frame's three switches; pictures at 1440 by 900 and 360 by 780, the first screen and the whole page, in both schemes, in `browse-07-deal3/shots/`. Each option is pushed to its sheet's boldest honest reading, and each is a PC enthusiast's page: the hardware drawn large in inline SVG in the option's own colours (`build/pc.mjs`: a CPU package with its pin-1 corner, capacitors and heat spreader, etched with real part numbers and specifications; a case fan; a heat sink's fins and copper pipes; a DDR memory stick; an M.2 drive; a graphics card with its fans, bracket and PCIe fingers; a die built from blocks), the made-up shop's real specifications and part numbers as the words (no benchmark score is invented), and the second deal's 15 photographs of hardware under reusable licences.

- **Option 6, One motif**: the one shape is the corner a CPU cuts off its package to mark pin 1. The home page crops a lime CPU 120vh across, etched "100-100000910WOF · 8 cores · 16 threads · 96 MB L3 · AM5 · 120 W", beside "Every part, priced"; the eight Categories are cards that fold into book spines as the page scrolls, each spine carrying its Category's name upright, six of them carrying a photograph of their hardware cut to the motif; on a lime disc you pick a drawn Part (CPU, graphics card, memory, drive, case fan); a statement holds four photographs as words; a Vendor is its clip-out coupon with the motif's notches; the footer's mark is a die of blocks. Category and Part pages open on the cropped CPU etched with that Part's own specifications, and every button, bullet and photograph's mask is the cut square.
- **Option 7, Colour chapters**: a PC's coolant line is the waterline. The home, Category and Part pages open on a white field over a blue one, the headline cut through its second line by the level, blue above and white below (red above it on black in the dark scheme), its size fitted so its two lines hold at every width: "Every part, every price", "CPUs, lowest first", the Part's name with its price under the water. Then flat poster chapters: the Categories one per line in red, each with its Lowest Price on the same baseline; a graphics card and a heat sink drawn huge in a blue and a black field, cropped by the top edge, the card's fans turning; statement tiles with a giant "≈"; a motherboard under a drop of water; the 7800X3D's spec sheet in display rows ("8 cores, 16 threads", "5 GHz boost, 96 MB L3", "AM5, 120 W", "559,000 IQD, the lowest of 20"); a navy closer whose display line is the way on (on a Vendor page, its phone number). A Vendor page opens on its address in display rows in blue, its Offers a red chapter.
- **Option 8, The name as a monument**: the name of what is priced is set so large that it crosses the photograph beside it, sized to its own length: "pc parts" ("پارچەکان") over a photograph of RGB fans that holds still while the column scrolls, "cpu" on its Category, "7800X3D" on its Part, the Vendor's name on two lines. Then the giant word "prices" over eight filled bars that open to their Parts and prices (a Category's filters and a Part's specifications are bars of the same kind); a square photograph made into a fan by the drawn frame laid over it, its blades turning, with three tabs; "Nobody buys a better place" over a panorama of memory slots; the Lowest Price as display type on plum (on a Vendor page, the phone number); the footer's columns over the full-width wordmark, uncovered as the page lifts off it.

**The motion, live**, built to the rules of Emil Kowalski's `animate` skill (the motion skills `docs/agents/design-skills.md` names): transform, opacity and clip-path only; the strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)` for entrances; linear for constant motion; press feedback at 0.97 in 140 ms; hover only under a fine pointer; no `transition: all`, no `scale(0)`, no ease-in. Each option's signature move: option 6's shutter (the Part's photograph and the drawn Part open from the start edge over 1.1 s while settling from 1.12), with the cards folding into spines and the CPU drifting on the scroll; option 7's masked headline (each line rises from behind its baseline over 900 ms, the second 110 ms later, both copies of the waterline in step), with the graphics card's fans turning; option 8's scaling name (it settles to 0.93 on a scroll timeline as the first screen leaves, the footer's wordmark grows from 0.94 to 1), with the fan on the plate turning. Around each: section entrances (24 pixels, 600 ms, 70 ms apart, once), the crossfades of a picked Part or tab, a bar's plus turning to a cross. **Reduced motion is respected**: under `prefers-reduced-motion: reduce` nothing moves and nothing is held back (checked on each option's four pages in both languages, at 1440 and 360, with the preference emulated, `build/reduced.mjs`), and keyboard focus inside a folded card unfolds it first. This Mac asks for reduced motion, which the owner's browser and headless Chrome both inherit, so the pages stand still when opened plainly; for this review only, `?motion=on` plays the motion anyway, and the page's "with motion" links and "Play it here" buttons use it. Ticket 08 still records the chosen direction's motion.

**The hard rules in each option.** Every option keeps them; where its sheet breaks one, its section on the page says how it is held:

- All three: the dealt small steps of 12 and 13 pixels are held at 14, 15 in Kurdish, and the etching on a drawing is left out wherever the drawing is too small to carry it at 14; no dealt Latin face draws Arabic script, so Kurdish is set in Noto Kufi Arabic and Noto Sans Arabic, the Shopper app's fonts today; the new Latin faces would be self-hosted (ADR-0006), and the renderings load them from Google Fonts (League Spartan, Figtree, Red Hat Display, Red Hat Text) and Fontshare (Roundo, under the Indian Type Foundry's free licence, to be checked before any use in the app).
- Option 6: the pin-1 corner is cut on the start side, so it moves to the top right in Kurdish.
- Option 7: the sheet's capitals are held in sentence case (the No Capitals Rule), and the letters under the waterline are white, since navy on blue fails contrast; the red field takes black ink; its palette is light only, so its dark scheme turns the paper black and the black chapter white.
- Option 8: the names are set in lower case as its hero asks, a part number in its own case; the hero's `difference` blend is replaced by white on a hero that stays dark in both schemes; its "email as display type" is the Lowest Price (the platform has no address yet) or a Vendor's phone number.

**Measured on the renderings.** None scrolls sideways at 360, 1024, 1280 or 1440, measured with the motion playing, by the page's own width and the viewport's (`build/overflow.mjs`); a scan of every page at 360 and 1440 found no text under 14 pixels nor Arabic-script text under 15 (`build/sizes.mjs`); under reduced motion nothing moves and nothing is held back (`build/reduced.mjs`). **Taste's inspector**, by its rules for public pages, over a local server of the folder, with `?motion=on` so that it measures the motion layer this Mac would otherwise stop, at 1440 and 390: it draws a 360-pixel screen only 225 pixels tall, which made its first-screen rules on a phone meaningless in the second deal, and 360 is measured above. It ran on the four pages in English and Kurdish in the light scheme and each option's Part page in the dark, ten runs an option, and on the home, Category and Vendor pages in the dark for their contrast, six more an option; its pictures and `report.json` are in `browse-07-deal3/inspect/` and `inspect-dark/`. Option 6: 1 FAIL a page; option 7: 1 to 2; option 8: 1 to 2 (the second deal's options, at 1440 and 360, had 3 to 7). No contrast finding remains in either scheme. On the way, and fixed: buttons and coupon links whose cut shape was drawn behind them, so that their text measured 1:1 against the page (the shape is now their own background, and the focus ring is drawn inside the cut); option 7's Offer lines, which took a chapter's white soft ink onto a white list; separators and outlines drawn as shadows; secondary lines of 14 pixels that read as running text (now 16); crumbs and labels above titles; Kurdish headlines and a Kurdish Vendor's name on three lines; a monument whose type box reached the sentence above it; a phone page widened by a long Kurdish word; and shutters that never opened, because Chrome measures a fully clipped element as empty (the observer now watches the shutter's parent). What it still fails: `few-pictures` on the Category, Part and Vendor pages, which carry none or one real picture (each home page now carries four to six), and three devices of the sheets themselves: option 6's folded cards lie over the cards beneath them (`covered-text`; each keeps its name on its spine, and keyboard focus unfolds it first), option 7's two copies of the waterline headline lie one over the other, each clipped to its field (`covered-text`), and option 8's `eyebrow` reads a Part's last line above the display price, or a list's last line above the plate's title, with one `off-centre` on the Kurdish home page. Its `no-footage` WARN is on every page: the moving pictures are drawn, not filmed. These are for the Kept box's allowances, once the owner has chosen.

### 6 November 2026: for the owner, the third deal

The third deal's page is the scratchpad's `browse-07-deal3/index.html`, for the owner's `.taste-skill/browse-07-deal3/`; the first two deals' pages stay at `browse-07/` and `browse-07-deal2/`, linked from its top bar. Anchors: `#o6`, `#o7`, `#o8`, `#references` and `#credits`. Each option shows its pages still, in both schemes, and moving: its "Play it here" buttons start the live home page in place.

1. **One motif** (`#o6`, seed 1795324496): a CPU's pin-1 corner as the one shape; a giant etched lime CPU, cards that fold into spines, a disc of drawn Parts, the coupon; League Spartan and Figtree on soot and lime.
2. **Colour chapters** (`#o7`, seed 1987852394): the coolant line as a waterline through every page's headline, then flat poster chapters, a graphics card whose fans turn, a spec sheet in display rows; Roundo on blue, red, black and navy.
3. **The name as a monument** (`#o8`, seed 1208468623): the Part's or Category's name set huge across a held photograph of hardware, bars that open, a fan laid over a photograph, the Lowest Price as display type; Red Hat on plum-black, white and one pink.

Or ask for another deal. Whichever sheet is chosen is committed with no Erbil in it. The boxes for the choosing, the sheet kept and the last one stay open, and the Status stays, until the owner chooses.

### 6 November 2026: the owner's choice

The owner, in their words: "Out of all deals the first deal's second (02) directions was the most elegant out of them, but it needs some motion in it. so we will go with that direction but tweak it to be more creative and add motion as well." The direction is the first deal's option 2, The page is the object (seed 2092360077). What the owner found elegant is kept: the idea (the printed price list a computer shop hands over the counter), Big Shoulders over Public Sans, bone, chocolate and one green, the shaped edges, the print-like alignment and the few inks. The owner's rule of 5 November still holds: nothing names a city, and the pictures are PC hardware, as in the second deal's redraw.

### 6 November 2026: the sheet kept

`apps/shopper/design/taste/`, as the dashboard's is kept: `direction.json`, `sheet.md` and `held-rules.md`, with no Erbil in them.

- Dealt again from the root of this ticket's worktree with the same seed and the brief that names no city (`draw.mjs --sector ecommerce --sections list,showcase,intro,contact,footer --direction page-is-the-object --seed 2092360077 --brief "<the line>" --out browse-07-chosen/redeal`), Taste kept the direction, hero, sections and motion but dealt other type (`anton-work`, Anton over Work Sans) and another palette (`moss-sand`). So the first deal's sheet is kept as dealt, with only `input.brief` replaced by the brief that names no city, and `sheet.md` printed from it with `draw.mjs --show`. Against the first deal's printed sheet two lines differ: the brief, and the imagery note's suggested searches, which Taste reads from the brief.
- `held-rules.md` says what the sheet breaks and how the Shopper app keeps each hard rule, lists the tweaks and motions offered here, and says how to restore the sheet for the inspector: Taste's `inspect.mjs` reads `.taste-skill/direction.json` in the folder it runs from, or the folder above its `--out`; so copy the sheet there at the repository root before `pnpm shopper:inspect`, the dashboard's going back before the dashboard is inspected, or pass an `--out` inside `apps/shopper/design/taste/`.
- The sheet's `allow` list stays empty until the owner answers question 2 below, so the Kept box stays open for its allowances.

### 6 November 2026: the chosen direction, tweaked and moving

Built from the second deal's redraw of option 2 (`browse-07-chosen/build/`, the same made-up shop and place-free words; the Vendor page no longer prints the city word of its own): the four pages in Kurdish and English, in dinars and dollars, 16 pages; pictures at 1440 by 900 and 360 by 780, the first screen and the whole page, in both schemes, in `browse-07-chosen/shots/`. Each tweak and each motion is numbered, and `?drop=T2,M3` (any numbers) shows a page without them, so the owner can keep or drop each one.

- **T1, the price slip**: the 7800X3D's figures as a till slip with a torn foot (Lowest Price, the highest in stock, Vendors, in stock, converted, the rate, with dotted leaders), signed with the day the lowest was confirmed and its Vendor; on the home page's plate and beside a Part's Offers. **T2, tear-off tabs**: the Categories sheet ends along a perforation in eight tabs, each a link to its Category; the Vendor's coupon in six tabs carrying its phone number, each a call. **T3, the box label**: a Part's specifications open with the label on its box, six key lines, a drawing of the package and its part number as a Code 39 barcode (drawn in code; not yet read by a scanner). **T4, the stamp**: the Lowest Price stamped on the slip in the green ink, a Category's sheet stamped "Lowest price first". **T5, dot leaders** from each name to its price on every printed sheet. **T6, printer's marks**: crop marks off each sheet's corners and a bar of the three inks under it, from 768 pixels up. **T7, printed drawings**: hardware in the text's ink, as an old price list's engraving (a heat sink on the Categories sheet, a CPU package on a Category's sheet and the box label).
- **Motion**, built to the rules of Emil Kowalski's `animate` skill, the motion of paper and print: **M1** a sheet prints out as it comes into view (uncovered from its top edge while it slides 18 pixels, 900 ms, the strong ease-out, once); **M2** prices settle into their column (16 pixels from the end side, 45 ms apart); **M3** the stamp lands (from 1.6 times its size, 320 ms); **M4** the slip feeds in ten steps over a second; **M5** a tear-off tab leans from its perforation under a mouse and when pressed; **M6** a line of the green ink scans the barcode once (700 ms, constant speed); **M7** the sheet's own move, the pinned story: the slip holds its place beside a Part's Offers from 1024 pixels up. Buttons settle to 0.97 when pressed. Under reduced motion nothing moves and nothing is held back; for this review `?motion=on` plays the motion on this Mac, which asks for reduced motion. Ticket 08 records the motion the owner accepts.

**Measured on the renderings**: no page scrolls sideways at 360, 1024, 1280 or 1440, measured with the motion playing (a stamp drawn larger before it lands had widened a Kurdish page by 8 pixels; it is now clipped inside its paper); no text under 14 pixels nor Arabic-script text under 15; under reduced motion nothing moves and nothing is held back, at 1440 and 360. **Taste's inspector**, by its rules for public pages, with `?motion=on`, at 1440 and 390, on the four pages in English and Kurdish in the light scheme and the Part page in the dark (ten runs), and on the home, Category and Vendor pages in the dark for their contrast (six more), its pictures and `report.json` in `browse-07-chosen/inspect/` and `inspect-dark/`: 1 to 2 FAIL a page (the first deal's option 2 had 3 to 6), and no contrast finding in either scheme. On the way, and fixed: description lines and the footer's credits at 14 pixels that read as running text (now 16), a Category's sheet narrower than its column, a heading set under the box label, and too few pictures on the home page (the Categories sheet now lies over a dim photograph of a built PC, a Part's specifications over memory chips). What it still fails: `few-pictures` on the Category, Part and Vendor pages (one to three pictures), `off-centre` (the sheets sit off the middle on purpose), and `eyebrow` (the frame's switches above the card's title). It warns `dashed` (the perforations), `palette-cream` (question 1) and `still-page` on some pages (the motion plays once, as each sheet arrives). These are for the Kept box's allowances, with answer 2.

### 6 November 2026: for the owner, the chosen direction

The page is the scratchpad's `browse-07-chosen/index.html`, for the owner's `.taste-skill/browse-07-chosen/`; before the tweaks is the first deal's `browse-07/index.html#o2`, linked from its top bar. Anchors: `#tweaks`, `#motion`, `#move` (the home and Part pages live, with "Play it here"), `#pages`, `#rules`, `#questions` and `#credits`.

1. **The dark scheme's bone ink**, which the inspector reads as cream: recommended, keep it and record `palette-cream` as an allowance; or cool it to a near-white so the warning goes.
2. **Which of Taste's rules inspect Shopper pages**: recommended, its rules for public pages for every page, with allowances for `few-pictures`, `eyebrow` and, with answer 1, `palette-cream`; or `--app` for the Category, Part and Vendor pages and the public rules for the home page.

And which tweaks and motions to keep. The sheet-kept box waits for answer 2's allowances, and the last box and the Status stay until the work is done.
