# 05: Deal the dashboard's directions and choose one

**Spec:** [the redesign spec](../spec.md)

**What to build:** Taste's script deals directions for the dashboard, never an agent picking one, and the owner chooses by eye. Each direction is rendered as real dashboard screens filled with the made-up shop's data and pictures of Erbil, shown in the built-in browser. The direction the owner chooses is kept in the repository, so that every later ticket, and a fresh clone, can build and inspect to it.

**Blocked by:** 03, 04

**Status:** resolved

- [x] The directions are dealt by `node ~/.claude/skills/design-taste-frontend/scripts/draw.mjs --app --keep type --options 3`, run from the repository root, with a one-line brief that carries ticket 04's line and the hard rules as ticket 03 left them. The fonts stay (ADR-0006).
- [x] Pictures of Erbil's bazaar, its money changers' boards and its shop signs are found with Taste's `assets.mjs`, each with its credit recorded.
- [x] Each direction is rendered as the portal's Offers screen, in Kurdish and in English, and the Catalog, at 360 and 1440 pixels, filled with ticket 01's fixture: no empty or placeholder screen.
- [x] Every option keeps the hard rules as ticket 03 left them; an option that breaks one says so on its page.
- [x] The options are shown in the built-in browser on one page, one option per anchor, two columns at most, before the owner is asked to choose. If the owner takes none, the script deals again.
- [x] The owner's choice is recorded under Comments with the owner's word.
- [x] The chosen direction's sheet (its tokens and the inspector's allowances) is committed into the repository, since Git ignores `.taste-skill/`, with a note under Comments of how to restore it there for the inspector.
- [x] `pnpm check` passes, and the work is committed.

## Comments

### 21 October 2026: the deal and the renderings

Everything below is in the owner's checkout at `.taste-skill/redesign-05/` (Git ignores it), and the comparison page is `.taste-skill/redesign-05/index.html`, served by the orchestrator from `.taste-skill` on port 4110, anchors `#o1`, `#o2` and `#o3`.

- **The deal.** From the root of the owner's checkout: `node ~/.claude/skills/design-taste-frontend/scripts/draw.mjs --app --keep type --options 3 --kind commerce --brief "<one line>"`. `--kind` is required with `--app`; `commerce` (seller and shop back offices: orders, payouts, products) is the kind the dashboard is. The brief's line names the product, then carries ticket 04's line word for word and ticket 03's hard rules as they now stand; its full text is in `dealt.md` and at the head of each sheet.
- **Two were dealt, not three.** Taste's library holds only two styles for `commerce`, `framed-sheet` and `achromatic-ledger`, and the draw deals from those alone, in that order. Dealing again gives the same two. A third needs another kind, which would steer the draw, so it is left to the owner (`#o3` lists the kinds that deal three). Each dealt style's full sheet was then dealt with the same command plus `--style <id>` and `--out .taste-skill/redesign-05/o1` (and `o2`), in the order dealt: o1 Framed sheet, seed 616443693, shell "tinted frame, white sheet"; o2 Achromatic ledger, seed 2018673135, shell "open plane". Both are light styles and both dealt the list pattern "table with tabs and a filter bar". `~/.taste-skill/history.json` now records both.
- **Erbil's pictures**, found with `assets.mjs` and downloaded with `--get` into `assets/` with `credits.json`. Kept: "Street Scene with Baghdad-Mosul Signs - Erbil - Iraq" by Adam Jones, Ph.D., CC BY-SA 3.0; "Erbil Qaisari Bazaar" by Sarchia Khursheed, "Hawler (Erbil) Citadel from the Bazaar" by Leviclancy, "Kurdistan - Erbil - Qaysari Market" by Lamacchiacosta, "Bazaar in Erbil 01" by Levi Clancy and "Qaisary Bazaar of Erbil" by Sarbast.T.Hameed, each CC BY-SA 4.0, all via Wikimedia Commons, with their pages in `credits.json` and on the comparison page. Two more were downloaded and dropped: one shows a real shop's sign with its phone number, the other a real, named man at work. **No openly licensed picture of an Erbil money changer's board was found** ("Erbil money changer", "Erbil currency exchange", "Kurdistan money exchange", "money exchange Iraq", "money changer": the hits were from other cities, or of soldiers); Openverse did not answer within its 30 seconds on several searches, so Wikimedia Commons answered alone.
- **The renderings** are static pages, no app source used or changed: for each option, the portal's Offers screen in Kurdish (`offers-ckb.html`) and in English (`offers-en.html`) as the made-up shop's Vendor sees it, and the Admin console's Catalog (`catalog.html`), each in the light and the dark scheme (`?scheme=light|dark`, or the switch on the page). They are written by `build/build.mjs` from `build/data.mjs` and `build/words.mjs`. The Offers are ticket 01's thirteen, oldest Confirmation first, with the API's rules of 14 days and 3 of warning (2 expired, 3 about to expire, 3 out of stock, 3 with no warranty stated); their Parts' manufacturers were read from the development database. The Catalog shows the real search "Ryzen X3D" in CPU, the 16 Parts the API's one-ILIKE-per-word search finds, with the AMD Ryzen 7 7800X3D open and its specifications in the API's labels and order; the Category counts are the real Parts' (26,228 in all, the end-to-end tests' 1,171 made-up Parts left out). Only `SELECT`s were run against the database. The Portal's words are the app's own messages; the new ones the dealt pattern needs (the tabs, the column headings, the scheme switch's Light, Dark and Device, the pictures' captions) are drafts, in English and Kurdish, for Impeccable's clarify.
- **What each option was given that its sheet leaves open** (the sheet says to choose these while building): o1's face is its frame tinted to a cool stone (#f1f0ed) from the bazaar's brick, and its plates take the sheet's own amber; o2's face is a stone ground (#f4f3f1, its sheet's own suggestion for a shop) and its one hue, a blue, goes on the plates' figures. Both put one Erbil picture at the foot of the desktop sidebar. The dark scheme of both comes from the chapter's shared dark defaults (app-screens §9.5), since neither sheet fixes one.
- **Ticket 04's line, in both**: plates only on prices, one per Offer (dollars before dinars), none on counts; units a smaller grey Geist suffix; the comma set in Geist so it takes no mono cell; each plate's Confirmation beside it; an out-of-stock plate pale with grey figures; in the dark, a plate darker than the page with a lit edge. No leading plate is drawn on either screen: neither has a leading figure (the Offers' question is a count, and counts stay off plates; the Catalog has no price).
- **The hard rules.** As dealt, both sheets break some: a 12-pixel small size (both), 32-pixel controls (o1) or navigation rows (o2), control edges under WCAG's 3:1 (both), a light scheme only (both). The renderings hold every rule (14 pixels, 15 in Kurdish; 36 under a mouse on a wide screen and 44 otherwise; edges and greys darkened to 3:1 and 4.5:1; both schemes and the switch; right to left with logical properties; Tall Script; no capitals; Western digits; the three fonts self-hosted), and each option's page says what was raised.
- **Taste's inspector** (`inspect.mjs --app --widths 1440,360` on each page in each scheme, pictures in `shots/`): o1, 0 FAIL and 0 WARN on all six; o2, 0 FAIL on all six and 1 WARN on the Catalog at 360 in both schemes (a Category tab 15 pixels from the edge where the tab row scrolls sideways). The faults it found on the way were fixed: a caption 12 pixels from the edge, the selected Catalog row read as a button with a shadow (an inset rule), a grey at 4.3:1, the Catalog's list ending 650 pixels above its Part, and the Catalog's phone screen scrolling sideways. Whole-page pictures at 1440 by 900 and 360 by 780 are in `full/` (by `build/full.mjs`, with Taste's own `cdp.mjs`).

### 21 October 2026: for the owner

- **Choose by eye** on `.taste-skill/redesign-05/index.html`: 1 Framed sheet (`#o1`), 2 Achromatic ledger (`#o2`), or ask for a new deal. `#o3` explains why there is no third: the kind `commerce` holds only two styles; a third needs another kind, which is the owner's call (`analytics`, `devtools` or `creator` deal three; `markets`, the nearest to a money changer's board, deals two dark ones).
- The boxes for the owner's choice, the chosen sheet committed into the repository and its note, and the page shown in the built-in browser, are left open until then, and the Status stays. The box for the pictures is left open too: the bazaar and its signs were found with their credits, but no money changer's board in Erbil; accept the pictures as found, or name a source.

### 21 October 2026: the owner's answers, and two more directions

The owner looked at the page and answered:

- **The directions.** "deal 2 more besides the Take 1 and Take 2 to see more options and creativity". Asked which kind to deal from, the owner chose "creator".
- **The pictures.** "Accept as found": the bazaar, the Citadel and the trilingual road sign as found, with no money changer's board. That box is ticked.

**The second deal**, from the root of the owner's checkout, with the same brief: `node ~/.claude/skills/design-taste-frontend/scripts/draw.mjs --app --keep type --options 2 --kind creator --brief "<the same line>"` (its output in `dealt-creator.md`). It dealt, in this order, `accent-ladder` and `true-black-flat`; neither repeats o1 or o2. Each full sheet was dealt with `--style <id>` into `o3` and `o4`:

- **o3 Accent ladder**, seed 1380793601, light, shell "ruled T-frame" (a sidebar and a 64-pixel top bar on one ground, divided by 1-pixel rules). One raspberry (#b8336a) at full strength on small marks only (the one filled button, the chosen tab, the active section's icon), its pale tints on areas (the active section's row). Its face: the raspberry kept, with the plates' figures in its palest tint; the ground is ticket 04's stone (#f4f3f1) in place of the sheet's #f9fafb.
- **o4 True-black flat**, seed 1875170293, dark, the same shell. Elevation by lightness alone, no borders or shadows on cards (20-pixel corners), the active section only brighter, the primary an inverted white pill, every control a pill. Its face: a warm near-black ground (#0e0d0c); the dealt lime on the plates' figures, and as "in stock".

Both are rendered exactly as o1 and o2, by the same generator (`build/build.mjs`) with a third shell for the T-frame; o1's and o2's pages come out the same as before. As dealt, o3 breaks the 36-pixel floor with 32-pixel controls, uses a 12-pixel small size and control edges under 3:1, and has a light scheme only; o4 uses a 12-pixel small size and control edges under 3:1, and has a dark scheme only. Each is held in the drawing and marked on its page: o3's dark and o4's light come from the chapter's shared defaults on the stone; o4's lime, which fails as text on white, says "in stock" in a dark green in the light scheme; o3's 32-pixel title is held to 24 on a phone, the chapter's phone size. The `creator` kind has no list pattern in Taste's library, so both sheets leave the list screen to the chapter's rules, and it is built as in o1 and o2. Taste's inspector, on each page in each scheme at 1440 and 360: 0 FAIL throughout, and 1 WARN on each Catalog at 360 (the tab row that scrolls sideways). The page's note where `#o3` said "no third direction" now says that o3 and o4 were dealt from `creator` at the owner's word, and the page has four anchors, `#o1` to `#o4`.

Still for the owner: the choice among the four (or another deal), then the chosen sheet committed with its note.

### 21 October 2026: the owner's choice

The orchestrator opened the page in the built-in browser with all four options, `#o1` to `#o4`, before the owner was asked. The owner chose **"1, Framed sheet"**.

**The chosen sheet, dealt in full.** From the root of the owner's checkout, the same command as the first deal with the chosen style and the seed the deal gave it: `node ~/.claude/skills/design-taste-frontend/scripts/draw.mjs --app --keep type --kind commerce --style framed-sheet --seed 616443693 --brief "<the same line>"`. It wrote `.taste-skill/direction.json` there, the very sheet the renderings were drawn from (equal to `redesign-05/o1/direction.json` but for the moment it was dealt). `~/.taste-skill/history.json` records it.

**Kept in the repository** at `apps/dashboard/design/taste/`, beside the app it styles, for tickets 06 and 07:

- `direction.json`, the sheet as Taste's scripts read it, formatted by the repository's formatter (the same JSON);
- `sheet.md`, the same sheet printed (`draw.mjs --show`): the style, its move, its face, its tokens, the shell and the screens;
- `held-rules.md`, what the renderings did with it: what the dealt sheet breaks and how the dashboard keeps each hard rule (36 under a mouse, 14 pixels, 3:1 control edges, a dark scheme and the switch), the face chosen inside it (the cool stone frame), the Rate Board as ticket 04 decided, the tokens as rendered in both schemes, and the inspector's allowances, which are none.

**To restore it for the inspector**, from the repository root: `mkdir -p .taste-skill && cp apps/dashboard/design/taste/direction.json .taste-skill/direction.json`. Taste's `inspect.mjs` and `lint.mjs` then switch to the app rules by themselves, and `node ~/.claude/skills/design-taste-frontend/scripts/draw.mjs --show` reprints the sheet. The renderings, the four sheets and the generator stay in the owner's `.taste-skill/redesign-05/`.

Every box is ticked.
