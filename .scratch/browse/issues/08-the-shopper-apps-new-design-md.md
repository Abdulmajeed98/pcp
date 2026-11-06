# 08: The Shopper app's new DESIGN.md, its Motion and an ADR

**Spec:** [the browse spec](../spec.md)

**What to build:** The direction the owner chose in ticket 07 becomes the Shopper app's written design, the one its frame and every page in this module are built to. Impeccable rewrites the Shopper app's DESIGN.md from it, replacing Fit Diagram, and it gains a section on Motion of its own, led by Emil's skills. An ADR records what replaces the look that ADR-0007 gave the Shopper app.

**Blocked by:** 07

**Status:** ready-for-agent

- [x] Impeccable rewrites `apps/shopper/DESIGN.md` from ticket 07's direction, replacing Fit Diagram. It covers the tokens, Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, and Do's and Don'ts.
- [x] **The components this module needs**, each with its place:
  - the frame and its header, the language switch and the currency switch;
  - the footer's credit;
  - a Category on the home page;
  - a Part on a Category page;
  - the Shown Price, with its "≈", and "out of stock";
  - the search;
  - the filters, the choices that are on, and clearing them;
  - the price range;
  - paging;
  - the empty states, both for a Category with no Visible Parts and for a search that found nothing;
  - a Part's photo, and its Category's icon in its place;
  - the specifications;
  - an Offer;
  - a Vendor's contact details and their links;
  - the not-found page.
- [x] **Motion**, led by `emil-design-eng` and `animate`: what moves and what stays still, the easing and durations, how a movement is interrupted, its direction in right to left, and what reduced motion does.
- [x] **The feel on a phone**, led by `mobile-native`: tap highlights, the viewport and safe areas, inputs that do not zoom the page, the filters used with a thumb, and no button's words selected under a resting thumb.
- [ ] The hard rules of the root DESIGN.md hold throughout. A rule of the direction that pulls against one was put to the owner, and the answer is recorded under Comments.
- [x] **The ADR.** A new ADR records the Shopper app's look and the options it was chosen over, and replaces the parts of [ADR-0007](../../../docs/adr/0007-a-look-and-components-for-each-app.md) it changes. ADR-0007 says which of its parts are replaced.
- [x] [docs/agents/design-skills.md](../../../docs/agents/design-skills.md)'s "Where the chosen directions are kept" names the Shopper app's direction, its sheet, its DESIGN.md and its ADR.
- [ ] The owner reads the new DESIGN.md, with the Motion section's movements shown in the built-in browser, and every remark is answered before the ticket closes. The remarks and answers are recorded under Comments.
- [ ] `pnpm check` passes, and the work is committed.

## Comments

### 6 November 2026: the DESIGN.md, its Motion and the ADR

**Written.** `apps/shopper/DESIGN.md` is rewritten whole from ticket 07's direction, replacing Fit Diagram: Taste's The page is the object as kept in `apps/shopper/design/taste/` (`held-rules.md`, `sheet.md`, `direction.json`), with its seven tweaks and seven motions as the owner kept them, in the file's own terms. Its visual source is the renderings the owner approved, `.taste-skill/browse-07-chosen/` in the owner's checkout (`index.html`, `o2/*.html`, `build/`, read, never written): their tokens, sizes, cuts and timings were read from `build/o2.mjs`, `build/motion.mjs`, `build/base.mjs` and `build/common.mjs`, and their review scaffolding (`?motion=on`, `?drop=`, the T and M numbers, the "made up" lines) is in neither the file nor the app. In Impeccable's DESIGN.md format: the tokens in the front matter in both schemes (hex, the sheet's own format) and in a table that names each colour's variable for ticket 09; Overview; Colors; Typography; Layout, with **The feel on a phone** as its own part; Elevation & Depth; Shapes; Components; a section of its own on **Motion**, after Components as the dashboard's is; and Do's and Don'ts. [ADR-0013](../../../docs/adr/0013-the-shopper-apps-look-is-the-printed-price-list.md) records the look and the options it was chosen over. ADR-0007 now says it is partly replaced by ADR-0013, and which sentence; ADR-0006 says the same of its naming of the Shopper app's fonts and of the Shopper's 214 KB. The root DESIGN.md's Overview names the Shopper app's look the printed price list.

**How each skill was run.**

- **Impeccable** (`impeccable`, with `impeccable context --target apps/shopper/src` once, then its `document` reference). Its `document` asks before overwriting an existing DESIGN.md; the ticket is the instruction to rewrite. It is run in scan mode on the approved renderings, since the app's own code still wears Fit Diagram until ticket 09. It asks the owner for the qualitative words (the North Star, the colours' names); the owner is not answering while this runs, so I chose them, and they are question 3 below and on the review page, which is where Impeccable's interview is put in this run. Its sidecar, `.impeccable/design.json`, is not written, as no app in the repository has one (the dashboard's ticket did the same); the motion tokens are in the Motion section. Its craft floor was read for its bans; the direction's own blueprints override its 6rem display cap (the cropped name) as the floor allows. `impeccable doctor --target apps/shopper` after the rewrite reports only `config-build-path-unset`, which stays unanswered without image generation.
- **Taste's sheet decides the direction**: the idea, the type and palette, the pieces of stationery, their compositions and the pinned story are the sheet's and `held-rules.md`'s. The sheet asks that every size be mapped onto its few steps rather than a new one added for each blueprint; the renderings used about fifteen sizes, and the file gathers them onto nine (the inspector warns `size-count` above nine). Taste's motion rules (`references/motion.md`, §8 to §10: "reveals only below the fold, once", "nothing above the fold waits for scroll", a first screen's load sequence settled by 1.2 s) agree with Emil's on when a sheet prints.
- **Emil**: `emil-design-eng`, loaded through the Skill tool with the concrete question of what each of the seven movements should record (what moves and stays still, curves and durations as tokens, interruption, a sheet printing while the Shopper scrolls or filters or goes back, right to left, reduced motion, and which risk feeling slow or hiding content); and `animate`, whose build sequence settled each in its order. Its frequency gate is why a sheet prints once a page view and never on a list drawn again: a Category page's list is drawn again tens of times a visit, and its recipe for a scroll reveal says "fire it once". Its tool rule is why the record names CSS transitions and animations on `transform`, `opacity` and `clip-path` and no library; its timings are the renderings', with the stagger capped at ten prices. `mobile-native` leads **The feel on a phone**: the viewport, safe areas, `svh`, the tap highlight, `touch-action`, hover gating, inputs at 16 pixels, words under a resting thumb (with the phone's long-press menu kept on contact links, so that a Vendor's number can be copied), overscroll, `theme-color` in each scheme, and the filters with a thumb. Its checks on a real phone wait for hosting, as the owner decided for the whole project; the browse spec's open checks already hold them ("the pages used with a thumb", "the filters with the phone's keyboard", "the motion felt with reduced motion on and off").
- **TDD**: the ticket writes documents and no platform code, so nothing at the four agreed seams is driven test-first; `pnpm check` is the gate.

**Every component the ticket names, and its place.**

| Component | In DESIGN.md |
|---|---|
| The frame and its header | Components › The frame: the stub on every page but the home page, the card's top row on the home page |
| The language switch, the currency switch | The frame › The switches, the currency switch (named "Prices in", its choices named as prices are, the plate's tabs where a price leads), the language switch |
| The scheme switch | The frame › The scheme switch: Light, Dark, Device, a plain form remembered in a cookie, one button on a phone |
| The footer's credit | The frame › The footer's credit, on the back cover, with the photographs' credits after OpenDB's |
| A Category on the home page | The home page › A Category on the home page, with its icon (story 1) |
| A Part on a Category page | A Category page › A Part on a Category page, with its photo or icon in a small square (story 11) |
| The Shown Price, its "≈", and "out of stock" | A Part page › The Shown Price |
| The search | A Category page › The search, in sight on a phone |
| The filters, the choices that are on, clearing them | A Category page › The filters; The choices that are on, and clearing them |
| The price range | A Category page › The price range |
| Paging | A Category page › Paging |
| The empty states | A Category page › The empty states, the two told apart in words |
| A Part's photo, and its Category's icon in its place | A Part page › A Part's photo (CAT-6) |
| The specifications | A Part page › The specifications, with the box label and its barcode |
| An Offer | A Part page › An Offer, on a Part page and on a Vendor page |
| A Vendor's contact details and their links | A Vendor page › the coupon, its cells and its tear-off tabs |
| The not-found page | The not-found page, listing the eight Categories (the owner, 5 November 2026) |

**Where the file goes beyond the renderings**, for the owner's reading (each drawn on the review page):

- The pieces the renderings did not draw: the frame at 360 pixels, a Part's square on a Category page, the choices that are on, paging, the two empty states, an Offer out of stock, the not-found page and the filters on a phone.
- Each Category on the home page has its icon, and each Part on a Category page its photo or its Category's icon, as the spec's stories 1 and 11 ask; the renderings had neither.
- On a phone the search stays in sight above the folded filters (the renderings folded it with them), and the filters unfold in place, smoothly, Motion 10, a movement beside the owner's seven, for the owner's "no rigid snaps" of 22 October 2026.
- A chosen chip carries a check mark as well as its green (the root's "every state in words or a mark"); an Offer out of stock has its price in Soft Ink; buttons and cells take a deeper ground under the pointer and when pressed (Pressed Green, Deep Board, new tokens measured at 7.9:1 and more); the tear-off tabs' perforations are drawn at half the Ink, 3.1:1 and 4.4:1 (the renderings used 40 to 45%, 2.7:1 in the light scheme), and on the coupon at 60%.
- The scheme switch works without script, as a plain form remembered in a cookie and drawn by the server, as ticket 07's critique asked of all three switches; the renderings' switch used script.
- Sizes gathered onto the steps: the frame's name 22 pixels (24 rendered), an item's name and price 18 (17), sentences 16 (17), every sheet's, plate's, coupon's and label's title 36 to 56 (32 to 56), the facts row's heading 44 to 88 (44 to 76) and its figures 24 to 36 (28 to 44), the Part plate's Lowest Price 20 (22).
- The Long Name Rule: a Part's name on the plate and the box label steps down past 40 and 80 characters, for the catalog's 276-character name; ticket 12 checks the bands.
- Each photograph is credited on the page that shows it; the home page's one Part is the data's choice, never a hand's; the home page's facts show a count only where the API answers one.

**The hard rules, and where each holds.**

| Rule | Held by |
|---|---|
| WCAG 2.2 AA in both schemes | Every pair measured (the Colors section's figures): text 4.5:1 or more on its grounds (Soft Ink on the Board, 5.0:1, the lowest), a state's mark and a tab's edge 3:1 or more, the focus ring 7.1:1 or more. The sheet's Soft Ink `#6b5b51` is 4.43:1 on the Board, so the renderings' `#62534a` is kept. Print Green as text is kept to Sheet Paper (5.3:1): on the Bone Ground it is 4.49:1 and on the Board 4.0:1, which the One Green Rule forbids |
| A switch between the schemes | The scheme switch, beside the language switch, Device first, remembered, drawn before the first paint |
| 44 pixels on a touchscreen, 36 under a mouse | Every control, chip, cell, switch and tab; tabs 150 pixels tall |
| No text under 14 pixels (15 in Kurdish and Arabic) | Typography: the sheet's 13 and 12 held at 14; Arabic script at 15 on English pages too |
| 360 pixels wide | Layout's phone forms, measured on each page at 360 by the end-to-end tests (the inspector's 360 window is 225 pixels tall) |
| Right to left | Logical sides throughout; the settle, the scan, the notches, the slip's side and paging's arrows mirrored; the barcode, prices and photos never |
| Self-hosted fonts that draw all of Sorani | Kurdish and Arabic whole in Noto Kufi Arabic; Big Shoulders and Public Sans from Fontsource in `ui` (ticket 09), drawing no Arabic script, so no word changes font mid-word |
| The No Capitals Rule | Big Shoulders in sentence case (the Sentence Case Rule) |

**A rule of the direction that pulls against the root DESIGN.md**, put to the owner (question 1): the display face's sizes (Display 44 to 88 pixels, Sheet title 36 to 56, Facts 24 to 36, Label 22), beyond the root's shared scale, which lets a look set only a screen's title, its buttons' text and one board figure; and the 120 pixels between the pieces, beyond the root's rhythm of 4 to 48 pixels. DESIGN.md records them as the direction sets them and says the allowance is the owner's, as the dashboard's DESIGN.md did for its board figure; the root DESIGN.md is unchanged until the owner answers. No hard rule is broken.

**The fonts.** Big Shoulders and Public Sans have Fontsource variable packages, `@fontsource-variable/big-shoulders` and `@fontsource-variable/public-sans`, both 5.3.0 of 19 July 2026 (old enough for pnpm's minimum release age), SIL Open Font License 1.1. They are not installed here: that is ticket 09's, with the frame. The sizes in ADR-0013 come from the packages' file listings on jsDelivr's index, not from a download: Big Shoulders' Latin file 36.5 KB, Public Sans' 26.8 KB, against Archivo's 90.1 KB with its width axis; Noto Kufi Arabic's Arabic file 123.7 KB, unchanged. The "≈" is in neither Latin face's subsets, and Noto Kufi Arabic's mathematical subset (22.2 KB) holds it, so it is drawn from there in every language; ticket 09 checks it once the faces are installed.

**Also changed, from earlier tickets' follow-ups.**

- `apps/shopper/.impeccable/surfaces/src.md`, Impeccable's surface brief, is rewritten whole to the new direction from inside the app, its target `src`: its audience and its STORY name no city, and its chosen direction, contract and first viewport are the printed price list's. It still said Fit Diagram.
- `docs/agents/design-skills.md`: step 2 of "Where the ideas come from" now sends agents to pictures that stand for PCs, never a place, with Dribbble and Behance as references only; "The inspector on the Shopper app" says which sheet the inspector reads (the root's `.taste-skill/direction.json` first, or the folder above `--out`; the first found wins, so the dashboard's sheet left at the root would inspect a Shopper page as a working screen), and that phones are inspected at 390 since its 360-pixel window is 225 pixels tall, the 360 rule being measured by the end-to-end tests' `expectNoSidewaysScroll`; its commands use 390 and copy the Shopper's sheet first; "Where the chosen directions are kept" names the Shopper app's direction, its sheet, its DESIGN.md and ADR-0013.
- `apps/shopper/design/taste/held-rules.md`, "For the inspector": corrected the same way. It said an `--out` inside `apps/shopper/design/taste/` was enough, which holds only with no sheet at the root, since the inspector reads the root's first (`inspect.mjs`, its sheet loop).

**Not changed here.** `@pcp/ui/themes/shopper.css` still holds Fit Diagram's tokens and Archivo: ticket 09 rewrites it with the frame. The MVP spec's line on each app's look and fonts still names Fit Diagram and Archivo for the Shopper app; ticket 14 records the module's conventions there.

### 6 November 2026: the review page

The scratchpad's `browse-08/index.html` (with `assets/`), for the owner's `.taste-skill/browse-08/`: DESIGN.md rendered to read, built by a script from the file in the worktree, with one anchor to a section, `#overview`, `#colors`, `#typography`, `#layout`, `#elevation`, `#shapes`, `#components`, `#motion` and `#dos`, then `#questions` and `#credits`. Each movement of the Motion section plays live beside its words, `#m1` to `#m10` (the owner's seven are 1 to 7), each with its Play: Motion 1 has Open the page, which prints the sheet with its prices and stamp, and Apply a filter, which draws the list again in place with nothing moving, the two halves of the arrival rule. Each piece the renderings did not draw is drawn beside its words in Components, and the palette, the type steps and the cuts beside theirs, all filled with ticket 06's made-up shop as ticket 07 read it. At the top: **Play the motion**, a switch for this review only, since the owner's Mac asks for reduced motion (without it, every sample stands still and finished, as the app will under that setting); **Slow ×4**; **Samples in** English or Kurdish, right to left; and the page's colours. The stationery the renderings already drew is linked to them.

Checked in the built-in browser before handing over: no console error; no sideways scroll at the pane's 901 pixels or at 1440; no price, name or switch cut by its paper in English or Kurdish; the movements' timings read with `getAnimations()` match the tokens (the print 900 ms and its 18-pixel slide on the strong ease-out, the prices 500 ms from 300 ms and 45 ms apart, the stamp 120 and 320 ms from 900 ms and 1150 ms on the slip, the feed 1000 ms in `steps(10)`, the scan 700 ms from 400 ms at a constant speed); and the slip held 16 pixels from its box's top while the Offers scrolled 700 pixels beneath it. The pane was hidden for part of the check, which stops the movements' clock, so their progress was read from their timings rather than watched; the owner sees them with the pane open.

### 6 November 2026: for the owner

Read DESIGN.md on the review page (`.taste-skill/browse-08/index.html`, served on port 4110 as `/browse-08/`), with **Play the motion** on, then answer:

1. **The display face's sizes and the pieces' spaces, against the root DESIGN.md** (`#questions`, `#typography`). Recommended: the root lets a look's display face take sizes of its own in `rem`, each at least 1.375rem (22 pixels), and lets a look space its own pieces beyond 48 pixels in 4-pixel steps, the shared text sizes staying as they are and the Shopper keeping them, since the direction's large type is the look you chose and nothing in it breaks a hard rule. Or: the same allowance, and the text face too at the renderings' sizes (a 17-pixel body and item names).
2. **When the sheets print** (`#m1`). Recommended: once a page view, when the Shopper comes to the page; a page drawn again (a filter, a search, another page of results) or come back to is shown printed, and nothing moves without script, so that a Shopper who filters a list many times a visit never waits for it. Or: every sheet prints each time a page loads, as the renderings do.
3. **The names.** Recommended: keep the North Star "The Counter Price List", the look's name "the printed price list", and the colours' names (Bone Ground, Sheet Paper, Board, Chocolate Ink and Bone Ink, Soft Ink, Print Green, Coupon Green, Back Cover). Or: name any of them yourself.

The box for the rule put to the owner, the box for the owner's reading and the last box stay open, and the Status stays, until the remarks are answered here.
