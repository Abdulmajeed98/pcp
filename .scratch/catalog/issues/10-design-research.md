# 10: Design research, before the first real page

**Spec:** [the catalog spec](../spec.md)

**What to build:** The platform's design is researched against primary sources before its first real page is built, which is the Admin console's Catalog. The research recommends, and the owner chooses. The choices are written down where every later page and Impeccable's design hook read them:

- the visual system in DESIGN.md at the repository root;
- the accessibility standard in PRODUCT.md;
- the tokens in `ui`'s theme, which both frontends import.

The owner decided on 14 October 2026 that the design is researched when the first real frontend page is built, and not before. The platform's name, a logo and the rest of its brand identity are not part of this research, because the name is still open.

The research needs the owner, who chooses from its recommendations. It may be done in more than one sitting.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Impeccable's context is loaded for this repository before anything is written, and PRODUCT.md is read in full.
- [x] A research document under `docs/research` answers each question below. It cites the primary source behind each claim, as the architecture research does. Where it compares options, it includes the most widely used one and says how adoption compares.
  - **The accessibility standard:** which one and at which level, and which part of it a tool can check in `pnpm platform:check`, with the tool. WCAG 2.2 level AA is weighed first.
  - **Type:** how Sorani, Arabic and Latin text are drawn clearly on a low-end Android phone. `languages` decided that no font is downloaded, and the research may reopen that, stating the cost in data on a weak connection.
  - **Colour:** a palette whose contrast meets the chosen standard, and whether there is a dark scheme.
  - **Scales:** a spacing and type scale for a screen 360 pixels wide first, and the smallest size of a control.
  - **Right to left:** what mirrors and what does not, beyond the rule for icons that `languages` recorded.
  - **The two kinds of screen:** how the dense lists and forms of the Admin console and the Vendor portal differ from the Shopper's pages, within one system.
  - **shadcn/ui:** how its theme is set from the tokens, and which of its defaults stay.
- [x] The owner's choice on each question is recorded in the research document, with the date.
- [x] DESIGN.md exists at the repository root, in the format Impeccable reads: tokens first, then the rules for using them.
- [x] PRODUCT.md names the chosen accessibility standard in place of "undecided", and points to DESIGN.md.
- [x] `ui`'s theme carries the tokens, and both frontends build with it.
- [x] Any choice that is hard to undo, such as a downloaded font, has an ADR.
- [x] Nothing names the platform or adds a logo.
- [x] `pnpm check` passes with Docker stopped.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 15 October 2026: the research, the owner's choices, and what they changed

**The research** is [docs/research/design-system.md](../../../docs/research/design-system.md), with every question answered against primary sources, a recommendation for each, and the owner's choice beside it with the date.

**The owner overruled three recommendations.**

- **Fonts.** The research recommended the device's own fonts. The owner asked for "the most elegant fonts for the apps for all the three languages", so fonts are downloaded, from each app's own server through Fontsource (ADR-0006). The specimens showed that Cairo, Tajawal, Almarai, Readex Pro and several other popular Arabic families cannot draw Sorani's ڕ, ڵ, ێ, ۆ and ە; every font chosen can.
- **A dark scheme.** The research recommended light only for now. The owner chose light and dark from the start, following the device. Tickets 11 to 14 now run every check in both.
- **One system.** The research recommended one system with denser dashboard screens. The owner had a second search done, and chose a look and a set of shadcn/ui components for each app (ADR-0007), as Shopify keeps its admin apart from its storefronts.

**So the ticket's deliverables became plural.**

- DESIGN.md is three files: the root one, for the floor both apps share, and one in each app's folder, which Impeccable reads for that app.
- `ui`'s theme is three files: the shared `theme.css`, and `themes/shopper.css` and `themes/dashboard.css`, which each app imports. Both apps build with them.
- Each app has a surface brief with its direction contract, in its `.impeccable/surfaces` folder.

**The looks**, chosen in Impeccable's direction rounds, with the owner looking at each hand in the browser:

- **The Shopper app: Fit Diagram**, a Build drawn like a motherboard manual, each rule a numbered callout. The owner's pick over the roll (Dot Display). Archivo and Noto Kufi Arabic, shadcn/ui's Lyra style, square corners. The owner named Nothing as the product to sit alongside, for how completely its look is its own.
- **The dashboard: Rate Board**, the numbers people keep on dark plates in amber figures, each dated, like a money changer's window. The owner's pick in a second hand, after re-rolling the first. Geist, Noto Sans Arabic and Geist Mono, shadcn/ui's Mira style. The owner named Linear.
- Both palettes were measured against WCAG 2.2 AA in both schemes before and after they were written. None fails; the closest pair is 4.59:1.

**Oxlint's `jsx-a11y` plugin is on** for both frontends and `ui`, since the owner chose it. A planted image with no `alt` failed `@pcp/shopper:lint` with "Missing `alt` attribute", and was reverted.

**Also corrected**: PRODUCT.md said the catalog had not been imported yet, and that no application code existed.

**Still to be checked by hand**, in tickets 14 and 15: Sorani's letters in both apps' fonts on the owner's phone and on an Android phone from Honor, Infinix, Tecno or Xiaomi.
