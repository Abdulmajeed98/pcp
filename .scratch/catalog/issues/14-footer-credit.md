# 14: The footer credit on every Shopper page

**Spec:** [the catalog spec](../spec.md)

**What to build:** Every Shopper page credits BuildCores OpenDB in its footer, in the Shopper's language, as ODC-By 1.0 requires (CAT-9). The English text follows the example notice in the licence's section 4.3: the platform contains information from BuildCores OpenDB, which is made available under the ODC Attribution License. "BuildCores OpenDB" and the licence's name keep their own order inside a Kurdish or an Arabic sentence. The credit links to OpenDB at the pinned commit, where the licence is still ODC-By, and to the ODC-By 1.0 licence on the Open Data Commons site.

It is laid out to the Shopper app's look, Fit Diagram, in `apps/shopper/DESIGN.md`, and to the root DESIGN.md that both apps share, in the Shopper app's fonts. It is rendered on the server with the rest of the page and needs no script. It is on the "not found" page too.

**Blocked by:** 10

**Status:** ready-for-agent

- [ ] The Shopper app's frame gains a footer on every page, the "not found" page among them, holding the credit.
- [ ] The credit's sentence is in the Shopper app's language files. The English follows the licence's example notice. The Kurdish and the Arabic are drafts, covered by the existing draft note.
- [ ] "BuildCores OpenDB" and "ODC Attribution License" are marked with `ui`'s component for text that is always in English, and are not translated.
- [ ] One link goes to OpenDB at commit `ef7e601b78875a931a4ad9fa1ccce7000f3e5ecf`, and the other to the ODC-By 1.0 licence on the Open Data Commons site. The commit comes from the one place ticket 09 writes it, or, if ticket 09 is not done yet, this ticket creates that place.
- [ ] The footer follows `apps/shopper/DESIGN.md` and the root DESIGN.md, in light and in dark, is laid out at 360 pixels wide first, and uses logical classes only.
- [ ] The end-to-end tests gain a helper that runs the automated part of the chosen accessibility standard, WCAG 2.2 level AA, on a page, unless ticket 11 has already added it. It runs axe-core through `@axe-core/playwright` with the tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa`, in the light and in the dark scheme.
- [ ] `pnpm platform:check` gains these lines, and passes on every line:
  - On the first page and on the "not found" page, in all three languages, the footer holds the credit in what the server sends, before any script runs.
  - The two names carry a left-to-right direction of their own, and the links go to the pinned commit and to the licence.
  - The credit's text differs between the three languages.
  - The pages still do not scroll sideways.
  - The accessibility helper passes on the first page in each language, in light and in dark.
- [ ] Shown once and then reverted, each failing on its own line: the credit taken off the "not found" page; the always-English mark taken off the credit.
- [ ] If `languages`' check of the language files exists, the new messages pass it.
- [ ] Checked by hand: the Kurdish and the Arabic credit are drawn clearly, in Noto Kufi Arabic, and read correctly on the owner's phone and, as ADR-0006 asks, on an Android phone from Honor, Infinix, Tecno or Xiaomi if one is at hand.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks and the by-hand check are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
