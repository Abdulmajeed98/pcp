# 02: Capture and critique the current dashboard

**Spec:** [the redesign spec](../spec.md)

**What to build:** The owner sees the dashboard as it is today, screen by screen, beside what each design skill finds wrong with it. Five screens are captured with ticket 01's command: the Catalog, a Part, the Vendors, the portal's Offers and the Offer form. The portal's screens are captured in English and in Kurdish; the Admin console's in English, its only language (LANG-1). Beside each screen are Taste's redesign audit and its inspector's findings, Emil's review and Impeccable's critique, each finding labelled with the skill it came from, on one page in the built-in browser. Nothing in the app changes.

**Blocked by:** 01

**Status:** resolved

- [x] Each of the five screens is photographed at 1440, 768 and 360 pixels with ticket 01's command and `--app`. The Part is a real one with a photo and a missing specification; the Offers screen shows the fixture's Offers and the expiry banner.
- [x] **Taste:** its redesign audit and `inspect.mjs --app`'s findings for each screen, as its `SKILL.md` and its chapter on app screens describe them.
- [x] **Emil:** `emil-design-eng` asked a concrete question of each screen, and `review-animations` on what moves (the dashboard has little motion, so the review says where motion is missing as well as where it is wrong).
- [x] **Impeccable:** its `critique` of each screen, adding UX and copy.
- [x] Every finding names its source skill. A short summary per screen says where the skills agree and where they pull apart.
- [x] Findings that trace back to a hard rule of the root DESIGN.md or PRODUCT.md's Accessibility & Inclusion are marked, for ticket 03. Findings on the Rate Board's plates, graphite, amber and figures are marked as against the idea or against its execution, for ticket 04.
- [x] The page is served from a folder that outlasts this session (`.taste-skill/`, which Git ignores), one screen per anchor, two columns at most, and opened in the built-in browser for the owner.
- [x] The summaries and the marked findings are recorded under Comments, so tickets 03 and 04 can read them without the page.
- [x] No source file of the app changes.

## Comments

### 21 October 2026: the captures

All with ticket 01's command, `pnpm dashboard:inspect <address> [--language en|ckb] --app --widths 1440,768,360 --out .taste-skill/redesign-02/<folder>`, with the API (3001) and the dashboard (3002) started from this ticket's worktree under the e2e lock, and the development services from the owner's checkout. Every run exited 0. The pictures, Taste's `report.json` for each run and the page are in the owner's checkout at `.taste-skill/redesign-02/` (`index.html`, anchors `#catalog`, `#part`, `#vendors`, `#offers`, `#offer-form`, `#motion`, `#hard-rules`, `#rate-board`, `#scores`).

| Folder | Screen | Address |
|---|---|---|
| `catalog` | Catalog | `/catalog` |
| `part` | A Part: Intel Core i5 4690K, real (from OpenDB), lacking one needed specification (Memory types) | `/catalog/parts/1a70133b-…` |
| `part-photo` | A Part with a photo: an end-to-end test's made-up Part | `/catalog/parts/3445d4a3-…` |
| `vendors` | Vendors | `/vendors` |
| `offers-en`, `offers-ckb` | The portal's Offers, as the made-up shop, 13 Offers and the expiry banner | `/vendors/00000000-0000-4000-8000-000000000001/portal` |
| `offer-form-en`, `offer-form-ckb` | The Offer form for a new Offer of AMD Ryzen 7 9700X | `…/portal/add/265a854e-…` |
| `catalog-search-en` | The portal's "Add an Offer" search, at 1440 only for the open point below | `…/portal/add` |

- **The Part's photo.** No real Part has a photo: the development database's 47 photos all belong to end-to-end tests' made-up Parts ("Made-up test Part …"), each a 64-byte test image. Writing one is out of scope, so the Part screen is a real Part with its Category icon, as every real Part is today, and the photo case is captured on one made-up Part. The first box is left open for the owner (below).
- **The open point from ticket 01, the Offer form.** The portal's catalog search sends `GET /v1/parts?vendorId=00000000-…-0001`, and the API answers 404 `VENDOR_NOT_FOUND`; the screen shows "The catalog could not be searched. The platform refused, with 404, VENDOR_NOT_FOUND." (`catalog-search-en`). So the form cannot be reached through the search. It was opened at its own address, `…/portal/add/<Part id>`, which only reads: the Part from the API, the Vendor from the fixture. Saving would send a POST, which ticket 01's command refuses with 405 inside Chrome; nothing was saved.
- **Nothing written.** Vendors 1,657, Offers 193, Offer history 233, Parts 27,399 and photos 47, counted read-only before the first run and after the last, the same.
- **The scheme.** The inspector's Chrome follows the Mac's appearance, which is dark, so these first captures are in the dark scheme. The light ones followed on the owner's word (see "the light captures" below).
- **Taste's inspector**, every run: 0 FAIL. WARNs: `palette-cream` on every screen at every width (the warm Night Ink text, #ebe9e3); `icon-tiles` on the Catalog (21), a Part (20) and the Offers (13); `hero-void` on the Catalog (42%) and the Vendors (67%); `unused-canvas` on the Catalog (206 px) and a Part (251 px, 381 on the photo case); `many-h1` on a Part. 0 moving elements anywhere. Taste's lint (`lint.mjs --app apps/dashboard/src libs/ui/src`): 0 FAIL, 6 WARN, monospace on the plates and the temporary password, the alert dialog's shadow.

### 21 October 2026: how each skill was run

- **Taste** (`design-taste-frontend`, loaded with its chapter on app screens read whole): the redesign audit is its "Record the before" and "A review stops here" steps, with its chapter's screen question and its seven questions, the inspector's measurements, and three changes per screen.
- **Emil**: `emil-design-eng` was loaded through the Skill tool with the Catalog's question, and the four other screens' questions were put to it in the same session (its text does not change with the question). Its answers are in its required Before, After and Why tables on the page. `review-animations` **could not be run**: the Skill tool refuses it (`disable-model-invocation`, reserved for the owner's own `/review-animations`), and says not to replicate it by other means. The motion review on the page (`#motion`) comes from `find-animation-opportunities`, Emil's read-only finder, and `emil-design-eng`'s rules, and says where motion is missing as well as where it is wrong. The second box stays open for the owner to run `/review-animations` (below).
- **Impeccable** (`impeccable critique`, after `impeccable context --target apps/dashboard/src`): single-context, which its critique calls degraded, because it ran inside an implementer that does not start agents of its own; the design review was written down before the detector ran. Its detector (`impeccable detect --json apps/dashboard/src`) found nothing. Its browser overlay was not run (the screens sit behind Keycloak; Taste's logged-in inspector gave the browser evidence). No snapshot was written to `.impeccable/critique/`, which Git does not ignore. Nielsen total 25/40, Acceptable.

### 21 October 2026: the summaries per screen

- **Catalog.** Agree: the desktop width is wasted (the empty pane is the biggest block, 900 by 600) and the screen has no face of its own (stock Geist on near-black, "Admin console" in plain text, no mark); Taste and Impeccable want the pane to carry the Admin's work instead of "Open a Part from the list…". Apart: Taste reads the boxed Category icon on every row as a template habit, the DESIGN.md and CAT-6 as the photo's slot; Taste accepts mono figures as a style's decision, Impeccable doubts a count of Parts belongs on a plate.
- **A Part.** Agree: the gap is reported far from where it is seen or fixed. The plate says "1 needed specification is not known" without naming it, and the row that does is the last of about thirty, four screens down at 360. Apart: Taste wants a grey dash for a missing value; Impeccable and PRODUCT.md want "Not known", grouped rather than shortened.
- **Vendors.** Agree: the emptiness is the problem (one row, 67% of the first screen blank, 37 words), and it is filled with the Vendors' own state (expiring, last confirmed, deactivated), not with motion or ornament. Apart: Taste would bring the expiring Offers into this list; Impeccable keeps the separate task screen but wants this one to point at it.
- **The portal's Offers.** Agree: on a phone the first Offer starts about 700 pixels down, under four rows of chrome, the title, the banner and the search; the 20 price plates out-shout the states that need action; Emil and Impeccable find the end of Confirm all flat for the screen's most important moment. Apart: Taste would quieten the prices, while the DESIGN.md's Do (the owner's choice of 20 October) puts every price on a plate; the boxed icons, as on the Catalog. The banner's copy is the best on the dashboard; the counts agree with the rows; Kurdish mirrors cleanly.
- **The Offer form.** Agree: the form is sound, the most correct of the five and the plainest, and it says too little about its result (Taste's preview of the Offer's row, Impeccable's missing sentence on the "≈" converted price, Emil's flat landing after save). Apart: Taste would add a live preview; Impeccable would fix the words and the "≈" first, and asks whether a preview earns its height on a phone. Neither section is marked while the form is open.

### 21 October 2026: findings marked for ticket 03 (the hard rules)

- **44-pixel controls** (Taste, Impeccable). The root DESIGN.md asks 44 pixels on a touchscreen; the dashboard's DESIGN.md holds every control to 44 under a mouse too, as the owner chose. Taste's studied screens run 28 to 40, median 34. On the desktop Catalog the search, Category and Search take two rows of 44-pixel controls in a 416-pixel column; on the portal's phone screen four 44-pixel rows of chrome come before the title. Impeccable's verdict on the phone: the rule is right there, so the fix is fewer rows, not smaller ones.
- **No text under 14 pixels** (Taste, Impeccable). With no 12-pixel tier the screens use four sizes, 14, 16, 20 and 24; every secondary line, state, warranty and label is at 14, and hierarchy comes from weight and colour alone. Taste's cleanest app scales are 12/14/16/24.
- **360 pixels first** (Taste, Impeccable). No pull against it; the findings at 360 are about what comes first, not the width.
- **Right to left, the Tall Script Rule, no capitals** (Taste, Impeccable). No conflict: the Kurdish screens mirror and are set correctly, and Taste's sentence case agrees with the No Capitals Rule.

### 21 October 2026: findings marked for ticket 04 (the Rate Board)

- **Idea, supported** (Taste). Taste asks each product for one element only it has, from its own world; figures on graphite plates from Erbil's money changers is that kind of idea, and colour on data is Taste's first rule for app screens.
- **Idea, its reach** (Impeccable, Taste). The board is about prices and the rate; the Catalog, a Part and the Vendors hold neither, so their plates carry counts ("27,399", "1", "1 Vendor") and read as badges.
- **Idea, where it would earn its place** (Taste). The Offer form, as a preview of the plates the Vendor's price will hang on, and the Platform Rate screen.
- **Execution, over-applied** (Taste, Impeccable). 13 Offers carry 20 plates, the loudest marks on the screen, while the states that need action are 14-pixel text.
- **Execution, no leading figure** (Taste). The large plate for a screen's one leading figure has not been built, so no plate leads any screen.
- **Execution, undated** (Impeccable). The DESIGN.md's Do puts the date beside each plate; the dates are on another line in another colour.
- **Execution, units as loud as figures** (Taste). "$" and "IQD" are bold amber mono inside the plate; Taste sets units as a smaller grey suffix.
- **Execution, the mono comma** (Taste, Emil). Geist Mono gives the comma a whole cell: "27 , 399", "266 , 000 IQD".
- **Execution, graphite on night** (Taste). In the dark scheme the plate sits one step above the Night Page and reads as a grey chip. The light captures show the board's image holding there, a dark plate on a warm page, so the idea survives the light scheme and its execution fails in the dark one.
- **Execution, the warm page** (Taste, light scheme). The inspector flags the Warm Page itself, #f6f4ef, as a yellow-cream ground on every screen; its fix keeps the warmth in a low-chroma stone or bone.
- **Execution, heavier in light** (Taste). On the Offers screen the 20 plates become near-black blocks on the warm page, the darkest masses on the screen.
- **Execution, out of stock** (Impeccable). An Offer no one can buy keeps full-strength plates.

### 21 October 2026: for the owner

- **Open the page.** `.taste-skill/redesign-02/index.html` in your checkout, one screen per anchor; the orchestrator serves it. That box is left for the orchestrator.
- **`/review-animations`.** It cannot be started by an agent. Run `/review-animations` on `apps/dashboard/src` yourself, or accept the motion review on the page (`#motion`, from `find-animation-opportunities` and `emil-design-eng`) in its place. The Emil box stays open until then.
- **The Part's photo.** No real Part has a photo, and nothing may be written to the development database. Accept the real Part without a photo beside the made-up Part with its test photo, or add a photo to a real Part yourself in the dashboard and ask for that screen again. The first box stays open until then.

### 21 October 2026: the owner's answers

- **The Part's photo.** "Accept as captured": the real Part without a photo, and the photo case on a made-up Part. The first box is ticked.
- **The light scheme.** "Add light captures". Done below.
- **`review-animations`.** "I'll run it": the owner runs `/review-animations` and adds the review. The Emil box stays open, and the page's `#motion` section is marked as a stand-in until then.

### 21 October 2026: the light captures

- **The option.** `pnpm dashboard:inspect` takes `--scheme light|dark` (`feat(inspector)`, `apps/inspector/src/colour-scheme.ts`), recorded in ticket 01's how-to-run note. Every tab the inspector opens is asked for the scheme through the DevTools protocol's `Emulation.setEmulatedMedia`, sent with `page.send`, one of the seven methods the owner accepted; no new method of Taste's. Taste's own tab for reduced motion is asked for reduced motion again in the same call, since a call replaces every feature an earlier one set. Built test-first: the seams are `takeTheScheme` (the option off the command line, refused unless light or dark, 4 tests) and `emulatedMedia` (the call's parameters, 2 tests), chosen by me while the owner was not answering; the Chrome side is proved by the runs. A planted fault, dropping the reduced motion from the call, failed "keeps the reduced motion Taste asked the tab for", and was undone by the inverse edit.
- **The runs.** The same eight addresses with `--scheme light`, into `<folder>-light` (`catalog-light`, `part-light`, `part-photo-light`, `vendors-light`, `offers-en-light`, `offers-ckb-light`, `offer-form-en-light`, `offer-form-ckb-light`), under the e2e lock, every run exit 0 with 0 FAIL. The database's counts were the same after them (Vendors 1,657, Offers 193, Offer history 233, Parts 27,399, photos 47). The page shows each light capture under its dark one.
- **What the light scheme changes.** `palette-cream` is flagged on the Warm Page ground itself (#f6f4ef) on every screen, where in dark it was the warm Night Ink text; the boxed icons are read as `icon-chips` (icons in tinted squares) rather than `icon-tiles`; the plates read as true dark plates on a warm page, the board's own image, and on the Offers screen as the darkest, loudest masses. Everything else (the empty panes, the missing face, the Part's gap four screens down, the Offers' chrome on a phone, the form's missing "≈") is the same in both schemes. Also seen in both, and added to the page: Confirm all my Offers and Search are two filled primaries in one pane.

### 21 October 2026: the owner's `review-animations`

The owner ran `/review-animations` on `apps/dashboard/src` on 21 October 2026. It now leads the page's `#motion` section; the earlier findings of `find-animation-opportunities` and `emil-design-eng` are kept below it, each labelled Emil. Its findings, each Emil's:

- **The alert dialog** (`shared/ui/alert-dialog.tsx:33,44`) and its scrim appear and vanish in one frame, the shadcn animations having been dropped with `tw-animate-css`. Base UI's `data-starting-style` and `data-ending-style`: the popup from `opacity-0 scale-[0.96]`, 200 ms on `cubic-bezier(0.23,1,0.32,1)`, the scrim's opacity 150 ms, the exit 150 ms, the origin at the centre.
- **The press** (`shared/ui/button.tsx:10`), `active:translate-y-px` with the transform not transitioned: `active:scale-[0.97]`, 150 ms on the same curve.
- **The switch's thumb** (`shared/ui/switch.tsx:21`) on Tailwind's default curve: the same 150 ms on `cubic-bezier(0.23,1,0.32,1)`, with `motion-reduce:transition-none`.
- **No motion tokens**: `--ease-out`, `--ease-in-out` and two or three durations in the dashboard's theme, named in DESIGN.md's Motion section (ticket 06).
- **Hover timing mixed**: rows fade over 100 ms (`item.tsx:37`) while the frames' navigation links and `back-link.tsx:11` snap; pick one.
- **No reduced-motion handling**: `motion-reduce:` on every movement, keeping opacity and colour.
- **Where motion is missing**, for ticket 06: the dialog's entrance and exit; Confirm all's result (an opacity and colour settle on the changed cells); an Offer removed from the list (a height-free exit that keeps the Vendor's place); the note after an Offer is added (a 150 to 200 ms fade with a 4 to 8 px rise). **Left alone**: route changes, the Catalog's paging, search as you type, the language switch.
- **A correction**: Tailwind v4 already gates `hover:` behind `(hover: hover)`, so the stand-in's and Emil's Catalog finding about hover on touch was wrong; the page says so.

**Its verdict**: no feel-breaking regressions, nothing to delete, performance and interruptibility clean; origin, physicality and cohesion fall short (the dialog from nothing, the unseated press, weak curves, mixed hover timing, no tokens); no reduced-motion handling, harmless today. **Decision: Block, for the redesign, not as a regression.** Ticket 06's Motion section should fix the dialog and the press, and carry the tokens, the reduced-motion rule and the four missing moments.

### 21 October 2026: closed

The orchestrator opened the page for the owner in the built-in browser on 21 October 2026, served from `.taste-skill` on port 4110. With the owner's `review-animations` in place, every box is ticked.
