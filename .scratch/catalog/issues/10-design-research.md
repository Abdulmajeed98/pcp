# 10: Design research, before the first real page

**Spec:** [the catalog spec](../spec.md)

**What to build:** The platform's design is researched against primary sources before its first real page is built, which is the Admin console's Catalog. The research recommends, and the owner chooses. The choices are written down where every later page and Impeccable's design hook read them:

- the visual system in DESIGN.md at the repository root;
- the accessibility standard in PRODUCT.md;
- the tokens in `ui`'s theme, which both frontends import.

The owner decided on 14 October 2026 that the design is researched when the first real frontend page is built, and not before. The platform's name, a logo and the rest of its brand identity are not part of this research, because the name is still open.

The research needs the owner, who chooses from its recommendations. It may be done in more than one sitting.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Impeccable's context is loaded for this repository before anything is written, and PRODUCT.md is read in full.
- [ ] A research document under `docs/research` answers each question below. It cites the primary source behind each claim, as the architecture research does. Where it compares options, it includes the most widely used one and says how adoption compares.
  - **The accessibility standard:** which one and at which level, and which part of it a tool can check in `pnpm platform:check`, with the tool. WCAG 2.2 level AA is weighed first.
  - **Type:** how Sorani, Arabic and Latin text are drawn clearly on a low-end Android phone. `languages` decided that no font is downloaded, and the research may reopen that, stating the cost in data on a weak connection.
  - **Colour:** a palette whose contrast meets the chosen standard, and whether there is a dark scheme.
  - **Scales:** a spacing and type scale for a screen 360 pixels wide first, and the smallest size of a control.
  - **Right to left:** what mirrors and what does not, beyond the rule for icons that `languages` recorded.
  - **The two kinds of screen:** how the dense lists and forms of the Admin console and the Vendor portal differ from the Shopper's pages, within one system.
  - **shadcn/ui:** how its theme is set from the tokens, and which of its defaults stay.
- [ ] The owner's choice on each question is recorded in the research document, with the date.
- [ ] DESIGN.md exists at the repository root, in the format Impeccable reads: tokens first, then the rules for using them.
- [ ] PRODUCT.md names the chosen accessibility standard in place of "undecided", and points to DESIGN.md.
- [ ] `ui`'s theme carries the tokens, and both frontends build with it.
- [ ] Any choice that is hard to undo, such as a downloaded font, has an ADR.
- [ ] Nothing names the platform or adds a logo.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
