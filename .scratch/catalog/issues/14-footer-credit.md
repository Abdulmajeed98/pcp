# 14: The footer credit on every Shopper page

**Spec:** [the catalog spec](../spec.md)

**What to build:** Every Shopper page credits BuildCores OpenDB in its footer, in the Shopper's language, as ODC-By 1.0 requires (CAT-9). The English text follows the example notice in the licence's section 4.3: the platform contains information from BuildCores OpenDB, which is made available under the ODC Attribution License. "BuildCores OpenDB" and the licence's name keep their own order inside a Kurdish or an Arabic sentence. The credit links to OpenDB at the pinned commit, where the licence is still ODC-By, and to the ODC-By 1.0 licence on the Open Data Commons site.

It is laid out to the Shopper app's look, Fit Diagram, in `apps/shopper/DESIGN.md`, and to the root DESIGN.md that both apps share, in the Shopper app's fonts. It is rendered on the server with the rest of the page and needs no script. It is on the "not found" page too.

**Blocked by:** 10

**Status:** resolved

- [x] The Shopper app's frame gains a footer on every page, the "not found" page among them, holding the credit.
- [x] The credit's sentence is in the Shopper app's language files. The English follows the licence's example notice. The Kurdish and the Arabic are drafts, covered by the existing draft note.
- [x] "BuildCores OpenDB" and "ODC Attribution License" are marked with `ui`'s component for text that is always in English, and are not translated.
- [x] One link goes to OpenDB at commit `ef7e601b78875a931a4ad9fa1ccce7000f3e5ecf`, and the other to the ODC-By 1.0 licence on the Open Data Commons site. The commit comes from the one place ticket 09 writes it, or, if ticket 09 is not done yet, this ticket creates that place.
- [x] The footer follows `apps/shopper/DESIGN.md` and the root DESIGN.md, in light and in dark, is laid out at 360 pixels wide first, and uses logical classes only.
- [x] The end-to-end tests gain a helper that runs the automated part of the chosen accessibility standard, WCAG 2.2 level AA, on a page, unless ticket 11 has already added it. It runs axe-core through `@axe-core/playwright` with the tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa`, in the light and in the dark scheme, and a planted target smaller than 24 pixels shows whether `target-size` runs.
- [x] `pnpm platform:check` gains these lines, and passes on every line:
  - On the first page and on the "not found" page, in all three languages, the footer holds the credit in what the server sends, before any script runs. *(It holds for the first page. The "not found" screen is sent as a bare document and drawn by script, credit and all, so there the credit is checked as the browser shows it: see Comments.)*
  - The two names carry a left-to-right direction of their own, and the links go to the pinned commit and to the licence.
  - The credit's text differs between the three languages.
  - The pages still do not scroll sideways.
  - The accessibility helper passes on the first page in each language, in light and in dark.
- [x] Shown once and then reverted, each failing on its own line: the credit taken off the "not found" page; the always-English mark taken off the credit.
- [x] If `languages`' check of the language files exists, the new messages pass it.
- [ ] Checked by hand: the Kurdish and the Arabic credit are drawn clearly, in Noto Kufi Arabic, and read correctly on the owner's phone and, as ADR-0006 asks, on an Android phone from Honor, Infinix, Tecno or Xiaomi if one is at hand.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks and the by-hand check are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 16 October 2026: completed

**For the owner to know.**

- **Every Shopper page's footer credits BuildCores OpenDB,** in the words of ODC-By 1.0's own example notice in section 4.3: "Contains information from BuildCores OpenDB which is made available under the ODC Attribution License." The Kurdish and the Arabic are drafts, covered by the language files' draft note, and pass `languages`' check of the language files.
- **"BuildCores OpenDB" and "ODC Attribution License"** reach the sentence as values, as the placeholder's English names do, so they are not in the language files and are not translated. Each is a link holding `AlwaysEnglish`: to OpenDB at commit `ef7e601b78875a931a4ad9fa1ccce7000f3e5ecf`, and to `https://opendatacommons.org/licenses/by/1-0/`.
- **`@pcp/opendb` holds the credit's facts** beside the pinned commit: OpenDB's address at that commit, its name, and the licence's name and address. The Shopper app now imports it, as ticket 09 planned. The end-to-end tests write the commit and both addresses out for themselves, so that a credit pointing elsewhere fails there.
- **The footer stays at the foot of the window** on a short page: the frame is now a column whose main part takes the room left. It is set in the Shopper app's small size, in Caption Grey, with its links in Manual Blue, above a Rule Grey rule.
- **The "not found" screen's credit is drawn by script.** Next sends every address that matches no page as a bare document, and the browser draws the frame, the footer and the screen from it, as `languages` ticket 02 found and the MVP spec records; `browse` decides what becomes of that screen. So the credit is in what the server sends on every page but that one, and on that one it is checked as the browser shows it. With scripts off, that screen is empty, credit and all.
- **The frame's comment no longer says it does no visual design.** It carries no logo and no name, which wait for the platform's name.
- **Still to be checked by hand,** as the ticket asks, and so its box is open: the Kurdish and the Arabic credit drawn clearly in Noto Kufi Arabic and reading correctly on the owner's phone, and on an Android phone from Honor, Infinix, Tecno or Xiaomi if one is at hand (ADR-0006). Captured in this session's browser at 360 pixels, in light and in dark, both sentences read with the two names in their place, in Latin script, inside the Kurdish and the Arabic.

**The planted faults,** each made on a clean tree, run against `src/shopper-credit-languages.spec.ts`, and undone by the inverse edit:

| Fault | The line that failed | The others |
|---|---|---|
| The "not found" screen hides the footer | The first page and the "not found" screen credit BuildCores OpenDB in their footer | 2 passed |
| The two names' `AlwaysEnglish` replaced by a plain `span` | The credit's two names keep their own direction, and link to the pinned commit and to the licence | 2 passed |

- The first try at the first fault moved the footer from the frame into the first page. That put it inside `<main>`, where a `footer` is no longer the page's footer landmark, so the first page failed too and all three tests failed. The fault was planted again on the "not found" screen alone.
- The tests were first written with the names' check inside the check of the credit's presence on both pages, so the second fault failed two tests. They were split so that each of the ticket's lines is one test, in a commit of its own.

**The checks.**

- `pnpm platform:check` passed all 75 tests, the 3 of this ticket among them.
- `pnpm check --skip-nx-cache` passed with `DOCKER_HOST` pointed at a socket that does not exist.
- The first page and the "not found" screen were captured in Kurdish, Arabic and English, at 360 and 1440 pixels wide, in light and in dark. The round found nothing to correct.

**The commits,** each leaving `pnpm check` passing:

- the end-to-end tests, written first;
- the footer and its credit;
- the tests split along the ticket's lines.

### 16 October 2026: the code review

The review of tickets 11 to 14 found three things in the credit, each corrected:

- **Its links were lines of 14-pixel text,** where the root DESIGN.md asks that anything tapped be 44 by 44 pixels, with no exception for a link inside a sentence as WCAG makes. The credit's lines are now as tall as a control, and each link is a box that high.
- **The language files did not show the English names as English.** They now mark both with `<english>`, inside the tags that make the links, as their README asks.
- **On the "not found" screen only the credit's text was checked.** The test of the names' direction and links now runs there too, as the browser draws it.
