# 06: Design the Build page and the picker

**Spec:** [the builder spec](../spec.md)

**What to build:** The Build page and the picker are new kinds of page, which [the Shopper app's DESIGN.md](../../../apps/shopper/DESIGN.md) does not describe. Their pieces are designed inside the printed price list's look (ADR-0013), with no new direction dealt. Each piece's options are rendered with the made-up shop and its made-up Builds, the owner chooses by eye, and Impeccable writes the choices into DESIGN.md before any page is built. Each skill leads its own area, as [the design skills guide](../../../docs/agents/design-skills.md) records. This ticket stops for the owner's choice.

**Blocked by:** 05

**Status:** resolved

- [x] **The guide is read first**, and so are DESIGN.md, ADR-0013 and `browse`'s design tickets 07 and 08. Fit Diagram's idea of a Build drawn like a motherboard manual, which ADR-0013 records as `builder`'s, binds nothing.
- [x] **The pieces to design**, Taste leading their composition inside the chosen direction:
  - the Build page as a sheet of the same stationery: the eight Categories, each with its Part or Parts or a way to choose one, a kit's or a drive's quantity, removing a Part, and emptying the Build with its one confirmation;
  - its status, a Complete Build or the Categories still needed, with the line saying a CPU's graphics or cooler is not known;
  - its outcomes, Problems, then Warnings, then unchecked rules, and the line counting the passes, with the Estimated power draw;
  - the first price view with its headline total, and an Unstocked Part, never shown by colour alone;
  - the second price view, each Vendor with its total, the Parts it has and the Parts it lacks;
  - the picker as a Category page's sheet, with the switch, the pick control, the mark of the Part already in the Build and the mark of a Part that is not Compatible;
  - the frame's way to the Build page, with how many Parts the Build holds, as a small, additive change to the frame.
- [x] **The words of an outcome.** Impeccable leads their copy. One example of each kind, a Problem, a Warning and an unchecked rule, is drafted in English, naming its Parts and what fails without the values compared, and is shown with the options.
- [x] **The rendering.** Each piece's options are drawn with ticket 05's made-up shop and Builds, in Kurdish and in English, at 390 pixels and at 1440, and at 1024 and 1280 where a desk layout differs, in both schemes. They are served from the scratchpad, never opened as a file, and shown in the built-in browser, one option to an anchor and two columns at most, before the owner is asked. An option that breaks a hard rule says so on its page.
- [x] **The motion**, led by Emil Kowalski's skills: whether a Part arriving in the Build, a quantity changing, a total settling and an outcome appearing move at all, and how, in the motion of paper and print DESIGN.md already holds. It covers reduced motion and the No Snap Rule. Movements are rendered live for the owner, as `browse`'s were.
- [x] **The feel on a phone**, led by Emil's `mobile-native`: the pick control and the switch taking a tap at once, the quantity typed on the phone's number pad, and the Build page's length on a phone.
- [x] **The worst cases**, led by Emil's `break-ui`, on the worst-case Build: 8 kits and 8 drives, the longest names, every kind of outcome at once, 20 Vendors in the second view, and an empty Build.
- [x] **The choosing.** The owner's choice for each piece is recorded under Comments with the owner's words. A choice the owner refuses is rendered again.
- [x] **The record.** Impeccable writes the choices into the Shopper app's DESIGN.md, the motion in its Motion section, before any page is built. The hard rules hold, and a piece that pulls against one is put to the owner. An ADR is written only if a choice replaces part of ADR-0013.
- [x] `pnpm check` passes, and the work is committed.

## Comments

### 9 November 2026: the renderings, for the owner

**Read first**, before anything was drawn: `docs/agents/design-skills.md`, `apps/shopper/DESIGN.md` whole, ADR-0013, `browse` tickets 07 and 08 with their Comments, ticket 05's Comments and the builder spec. Fit Diagram's motherboard manual was not used: every piece is drawn in the printed price list's stationery, and no new direction was dealt (Taste's run for "a component or a single section, not a page": match the surrounding design, no draw).

**How each skill was run.** Taste (`design-taste-frontend`) led the composition of each piece inside the chosen direction: the till slip, the sheet, its items and leaders, the stamp, the swing tag and the cells, reused rather than added to. Impeccable (`impeccable`, `impeccable context --target apps/shopper/src` once, then its `clarify` reference) led the copy: the outcomes' words, the status, the picker's three empty states, the Unstocked Part and the one confirmation, each naming its action on its button. Emil Kowalski's `emil-design-eng` was asked the concrete question of what a Part arriving, a quantity changing, a total settling, an outcome appearing and emptying should do, and its frequency gate and its exit-faster-than-arrival rule shaped option A of the motion; `mobile-native` led the feel on a phone; `break-ui` ran on the worst-case and empty Builds. The design skills' own files were not changed.

**The renderings.** The scratchpad's `builder-06/` (for the owner's `.taste-skill/builder-06/`, served on port 4110): `index.html` lays out fourteen pieces, `#p1` to `#p14`, then `#phone` and `#choices`; each piece has its two options side by side, A the recommendation every time, with its reason. Each option is drawn live, in a window of a phone's size (390 by 780) and a desk's (1440 by 900, and for the arrangement 1280 by 800 and 1024 by 768), in English and in Kurdish, with a switch for the light and the dark scheme, one for dinars and dollars, one that plays the motion on a Mac set to reduce it (as browse ticket 08's review page did), and one that slows it four times. `view.html` draws every window with `render.js`, from `data/`: the stand-in API's answers in both currencies for ticket 05's three made-up Builds (`empty`, `complete`, `worstCase`) and four Builds made of the complete one's own Parts (`partial`, its CPU, motherboard and RAM; `lessPsu`; `threeKits`, a third RAM kit; `lessGpu`), the picker's answers for every Category of each, in stock only, with and without the switch, and the real Shopper's server-drawn markup of the stub, the back cover, the swing tag of each Category, the icons and the printed drawings. The stand-in was started on port 3111 by a scratchpad script that imports the inspector's modules, with a Shopper app on 3110 (`SHOPPER_INSPECTION_DIST_DIR=tmp/viewing`) and the catalog read once through this worktree's API on 3103; no port of the e2e lock was used. Every class is the Shopper theme's own, compiled from `@pcp/ui/themes/shopper.css` with the Shopper's own Tailwind pipeline into `shopper.css`, its fonts copied beside it; the few rules the new pieces add are in `pieces.css`, each a proposal for the theme. Two renderings carry worded examples, said so on the page: a CPU that does not say whether it comes with a cooler (every CPU of the made-up shop says), and a Category no Vendor has in stock.

**The pieces put to the owner**, each in `#choices`: the arrangement (the till slip beside the sheet, or the total at the sheet's head with the rules beside it); a Category on the sheet; the quantity (− 2 +, or a field and Set); emptying (confirmed in place, or a page of its own); the status (words and the stamp, or a checklist); the outcomes (grouped by kind with marks of their own shapes, or one list with each kind stamped); the words of an outcome (in Categories with the Parts named under, or the Parts inside the sentence); a Part's price (the line's total, or the price of one); each Vendor's total (one sheet of lines that unfold, or a till slip each); the picker (a Pick cell and the switch in the sheet, or the price as the pick and the switch with the filters); the picker when no Part fits (say so and offer the switch, or show them all marked); the frame's way to the Build (in the stub with its count, or a tab hanging from it); and the motion (what a change brings prints in, or each change a new page).

**The words of an outcome**, drafted in English with option A, each naming what fails and its Parts, never the values compared: a Compatibility Problem, rule 5 on the complete Build with a third kit, "The RAM kits have more sticks than the motherboard has slots. Remove a kit, or choose a motherboard with more slots.", then the MSI MAG B650 TOMAHAWK and the CORSAIR Vengeance kit named under it; a Compatibility Warning, rule 20 on the worst case, "The PSU has fewer CPU power connectors than the motherboard has sockets. Many motherboards start with one; the motherboard's manual says."; an unchecked rule, rule 2 on the worst case, "Whether the CPU cooler fits the CPU's socket could not be checked. Check the cooler's box before you buy.", then "Not in the catalog: Sockets" and the cooler's name. Option B puts every Part's name inside the sentence, which a Kurdish sentence with nine English names around it shows the cost of.

**The motion**, rendered live in `#p13` with three changes applied in place as the page will with script (pick the PSU, a third RAM kit, remove the GPU), read back in headless Chrome with `getAnimations()`: with option A, an arriving line opens its space in 250 ms and prints in over 450 ms with its price settling from 150 ms, the slip's changed figures and the line's total settle again in 300 ms, the stamp lands when the change completes the Build with no Problem, and a leaving line fades in 100 ms and folds in 150; with reduced motion nothing prints, fades or settles, and the spaces open and fold in 150 ms, so that nothing jumps (the No Snap Rule); option B moves nothing. Every movement is on `transform`, `opacity` and `clip-path` but the spaces, whose height moves as the filters' fold does.

**The worst cases**, `break-ui` on the worst-case Build and the empty one, at 320, 390, 1024, 1280 and 1440 pixels, in both schemes, in Kurdish and English, and at a phone's largest text (200%). What broke was fixed in the renderings and is listed in `#p14` for the owner to keep: the "Complete Build" stamp landed on a Build with 8 Problems (now only with no Problem, the sentence saying the Problems remain); at 200% the sheet grew past the window (every new list takes one shrinking column, the controls start under the picture once a line stacks, the quantity's figure narrows); the stub's name row ran 76 pixels past the window in Kurdish at 200% (it wraps); the rules' sheet listed every Part of every outcome, 5,100 pixels on a phone (past three Parts the rest fold, 3,700); 18 Vendors made 4,400 pixels (past five the rest fold, 2,600); the complete Build's RAM picker, which lists no kit since its board is full, said "0 RAM kits in stock that fit" (any list the Build empties takes the "none fits" state); and the Kurdish title of the rules' sheet took three lines (shortened). One is the owner's, outside these pages: at 200% a converted total of seven figures is up to 30 pixels wider than its line, since a price never breaks inside, which holds for today's Category and Part pages too.

**Measured.** Each of the 132 windows, in each scheme, in headless Chrome: drawn, no script error, nothing scrolling sideways, no text under 14 pixels nor Arabic script under 15. At 320 pixels nothing scrolls sideways. On a phone at 390 pixels the complete Build's page is about 6,850 pixels long in English and 7,760 in Kurdish, the worst case's 14,500 and 16,800, the empty Build's 2,800.

Nothing is written into DESIGN.md before the owner chooses. The boxes for the pieces, the rendering's showing, the motion, the feel on a phone, the choosing, the record and the last stay open until then.

### 9 November 2026: the owner's choice

The coordinator served the page at the owner's `.taste-skill/builder-06/` and showed it to the owner, then relayed the owner's words exactly: "Keep every A". What follows is the coordinator's reading of those words, recorded as such: every option A on all fourteen pieces, and with `#p14` the seven worst-case fixes.

1. `#p1` The arrangement: the Build's till slip beside the Build's sheet, pinned from 64rem and first on a phone, then the rules' sheet, then the Vendors.
2. `#p2` A Category on the sheet: the Category's icon and name head its place, each Part printed as on a Category page, an empty Category a "Choose …" cell, one not needed saying why.
3. `#p3` The quantity: − 2 +, each cell a button of a plain form, the figure typed on the number pad.
4. `#p4` Emptying: confirmed in place, "Remove all 8 Parts" and "Keep them".
5. `#p5` The status: in words, the stamp only on a Complete Build with no Problem.
6. `#p6` The outcomes: grouped by kind under their counts, each led by a mark of its own shape, the passes and the Estimated power draw as lines of the sheet.
7. `#p7` The words: a sentence in Categories and its way out, the Parts named under it.
8. `#p8` A Part's price: the line's total at its end, its quantity and Vendor under it; an Unstocked Part said in words.
9. `#p9` Each Vendor's total: one sheet, each Vendor a line that unfolds, the first open.
10. `#p10` The picker: a Pick cell under each Part, the switch in the sheet's head, "In your Build" and "Does not fit your Build" in words with their marks.
11. `#p11` When no Part fits: say so, with Show all as the sheet's primary button and See why on your Build.
12. `#p12` The frame's way: "Your Build" and its count in the stub.
13. `#p13` Motion: what a change brings prints in, its space opening and folding so that nothing jumps.
14. `#p14` The worst cases: the stamp withheld while Problems remain; one shrinking column for every new list, controls under the picture on a stacked line and a narrower quantity figure; the stub's name row wrapping; an outcome's Parts folding past three; the Vendors folding past five; the "none fits" state for any list the Build empties; and the shorter Kurdish title of the rules' sheet.

No option was refused, so nothing is drawn again.

### 9 November 2026: the record

Impeccable writes the choices into `apps/shopper/DESIGN.md`, merging them into the file as it stands (its `document` reference's merge, the ticket being the instruction to change an existing DESIGN.md), in the file's own terms; nothing else in it changes. Its head comment says what this ticket added and that nothing of ADR-0013 is replaced, so no ADR is written.

| Piece | In DESIGN.md |
|---|---|
| The Build page as a sheet of the same stationery | Overview's list of pages; Layout › The pieces, page by page (the Build page, the picker); Components › The Build page › The Build's till slip, The Build's sheet, A Category on the Build's sheet, The quantity, Emptying the Build |
| Its status, with the line that a CPU's graphics or cooler is not known | Components › The Build page › The status; the stamp only on a Complete Build with no Problem, in The stationery › The stamp too |
| Its outcomes, the passes and the Estimated power draw | Components › The Build page › The rules' sheet, The words of an outcome; Shapes › Printed marks |
| The first price view and an Unstocked Part | Components › The Build page › A Part's price on the Build's sheet, and the slip's Lowest total |
| The second price view | Components › The Build page › The Vendors' sheet |
| The picker, its switch, its pick control and its marks | Components › The picker › Its sheet, The switch, A Part in the picker, The empty states |
| The frame's way to the Build page | Components › The frame › The way to the Build |
| The motion | Motion: the intro's one exception, the tokens `--unfold` (now also a Build line's space), `--line-print`, `--settle-again` and `--leave`, When a movement plays › A change to the Build, What moves › 11, What stays still, When a movement is interrupted, Right to left, Reduced motion |
| The feel on a phone | Layout › The feel on a phone: the Build with a thumb, the quantity on the number pad, the picker's switch, back to the Build after a pick, the page's length |
| The worst cases | The seven fixes, each where it acts: the stamp (The stationery, the Build's slip), the one shrinking column (The picker's last line, Do's), the name row wrapping (The way to the Build), the folds of an outcome's Parts and of the Vendors, the "none fits" state, the Kurdish title (The rules' sheet) |

Do's and Don'ts gain three lines: say an outcome in Categories and name its Parts under it, the marks told by their shapes; let every new list shrink and fold what runs long; and never set a Part's name inside an outcome, compare its values, stamp a Build with a Problem as complete, or stop a Shopper keeping a Build. The Don't on animating prices now names Motion 11 as its exception.

**The hard rules hold.** Every colour of the new pieces is one the file has measured: Soft Ink and the Ink on Sheet Paper, Green's Ink on Print Green for the switch when on, the paper's colour on the Ink for "Remove all" and the count, Print Green only as the stamp and the switch, never as text on the Board. Every control is at least 44 pixels on a touchscreen (Pick, Change, Remove, Add another, the quantity's cells and figure, the switch, the way to the Build, Empty the Build and its two answers), no text is under 14 pixels nor Arabic script under 15 (checked in the 132 windows in each scheme), nothing scrolls sideways at 320 or 390, every side is logical so that each piece mirrors in Kurdish and Arabic, and no font is added. No piece pulls against one, so nothing more was put to the owner.

**Motion and the phone, against the existing file.** Motion 11 keeps the file's curve and its arrival rule, and adds three tokens. One difference from the filters is the owner's choice of `#p13`: with reduced motion a Build line's space still opens and folds, in 150 ms, where the filters' fold opens at once, so that a change in place never jumps (the No Snap Rule). The by-hand checks on a phone (the pick control and the switch with a thumb, the quantity on the number pad, the motion with reduced motion on and off) wait for hosting, as the builder spec's Open checks already list them; ticket 10 adds them to the MVP spec's list.

**The gates.** `pnpm check` passes on the commit, with the documents formatted; this ticket changes no code.
