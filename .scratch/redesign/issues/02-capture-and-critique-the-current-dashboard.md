# 02: Capture and critique the current dashboard

**Spec:** [the redesign spec](../spec.md)

**What to build:** The owner sees the dashboard as it is today, screen by screen, beside what each design skill finds wrong with it. Five screens are captured with ticket 01's command: the Catalog, a Part, the Vendors, the portal's Offers and the Offer form. The portal's screens are captured in English and in Kurdish; the Admin console's in English, its only language (LANG-1). Beside each screen are Taste's redesign audit and its inspector's findings, Emil's review and Impeccable's critique, each finding labelled with the skill it came from, on one page in the built-in browser. Nothing in the app changes.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Each of the five screens is photographed at 1440, 768 and 360 pixels with ticket 01's command and `--app`. The Part is a real one with a photo and a missing specification; the Offers screen shows the fixture's Offers and the expiry banner.
- [ ] **Taste:** its redesign audit and `inspect.mjs --app`'s findings for each screen, as its `SKILL.md` and its chapter on app screens describe them.
- [ ] **Emil:** `emil-design-eng` asked a concrete question of each screen, and `review-animations` on what moves (the dashboard has little motion, so the review says where motion is missing as well as where it is wrong).
- [ ] **Impeccable:** its `critique` of each screen, adding UX and copy.
- [ ] Every finding names its source skill. A short summary per screen says where the skills agree and where they pull apart.
- [ ] Findings that trace back to a hard rule of the root DESIGN.md or PRODUCT.md's Accessibility & Inclusion are marked, for ticket 03. Findings on the Rate Board's plates, graphite, amber and figures are marked as against the idea or against its execution, for ticket 04.
- [ ] The page is served from a folder that outlasts this session (`.taste-skill/`, which Git ignores), one screen per anchor, two columns at most, and opened in the built-in browser for the owner.
- [ ] The summaries and the marked findings are recorded under Comments, so tickets 03 and 04 can read them without the page.
- [ ] No source file of the app changes.
