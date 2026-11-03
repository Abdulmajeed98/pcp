# 08: The Shopper app's new DESIGN.md, its Motion and an ADR

**Spec:** [the browse spec](../spec.md)

**What to build:** The direction the owner chose in ticket 07 becomes the Shopper app's written design, the one its frame and every page in this module are built to. Impeccable rewrites the Shopper app's DESIGN.md from it, replacing Fit Diagram, and it gains a section on Motion of its own, led by Emil's skills. An ADR records what replaces the look that ADR-0007 gave the Shopper app.

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] Impeccable rewrites `apps/shopper/DESIGN.md` from ticket 07's direction, replacing Fit Diagram. It covers the tokens, Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, and Do's and Don'ts.
- [ ] **The components this module needs**, each with its place:
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
- [ ] **Motion**, led by `emil-design-eng` and `animate`: what moves and what stays still, the easing and durations, how a movement is interrupted, its direction in right to left, and what reduced motion does.
- [ ] **The feel on a phone**, led by `mobile-native`: tap highlights, the viewport and safe areas, inputs that do not zoom the page, the filters used with a thumb, and no button's words selected under a resting thumb.
- [ ] The hard rules of the root DESIGN.md hold throughout. A rule of the direction that pulls against one was put to the owner, and the answer is recorded under Comments.
- [ ] **The ADR.** A new ADR records the Shopper app's look and the options it was chosen over, and replaces the parts of [ADR-0007](../../../docs/adr/0007-a-look-and-components-for-each-app.md) it changes. ADR-0007 says which of its parts are replaced.
- [ ] [docs/agents/design-skills.md](../../../docs/agents/design-skills.md)'s "Where the chosen directions are kept" names the Shopper app's direction, its sheet, its DESIGN.md and its ADR.
- [ ] The owner reads the new DESIGN.md, with the Motion section's movements shown in the built-in browser, and every remark is answered before the ticket closes. The remarks and answers are recorded under Comments.
- [ ] `pnpm check` passes, and the work is committed.
