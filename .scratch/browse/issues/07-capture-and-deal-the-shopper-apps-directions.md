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
- [ ] **The hard rules** of the root DESIGN.md and PRODUCT.md's Accessibility & Inclusion, as the redesign's ticket 03 left them, are restated in the brief:
  - WCAG 2.2 AA in both schemes, with a switch between them;
  - 44-pixel controls on a touchscreen;
  - 14-pixel text;
  - 360 pixels wide;
  - right to left;
  - self-hosted fonts that draw all of Sorani (ADR-0006).

  A direction that brings a new font keeps that rule, or keeps the current fonts.
- [ ] **The deal.** Taste's script deals the directions with the run its SKILL.md gives for public pages, from the repository root. Its one-line brief says three things: the Shopper compares local shops' prices in Erbil, on a phone first, in Kurdish, Arabic and English; prices and the "≈" mark are the page's centre; and the hard rules hold.
- [ ] **The world of the subject.** Pictures of Erbil's bazaar, its computer shops, signs and lettering are found with Taste's `assets.mjs`, each with its credit recorded.
- [ ] **The rendering.** Each direction is drawn as four pages: the home page, a Category page with its filters, a Part page with several Offers, one converted, and a Vendor page. Each is drawn in Kurdish and in English, at 360 and 1440 pixels, filled with ticket 06's made-up shop, so that no page is empty or a placeholder. Every option keeps the hard rules, and an option that breaks one says so on its page.
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
