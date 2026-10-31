# 15: The Shopper app's new DESIGN.md, and its page rebuilt

**Spec:** [the redesign spec](../spec.md)

**What to build:** The direction the owner chose becomes the Shopper app's written design, and what the Shopper app has today is rebuilt to it, so the next module that builds Shopper pages starts from the new look. Impeccable rewrites its DESIGN.md with a Motion section led by Emil's skills, an ADR records what replaces ADR-0007's look for it, and its one page and its footer take the new look.

**Blocked by:** None (moved out of this spec on 1 November 2026)

**Status:** wontfix

- [ ] Impeccable rewrites `apps/shopper/DESIGN.md` from ticket 14's direction, its fonts unchanged (ADR-0006), with the hard rules as ticket 03 left them.
- [ ] **Motion**, led by `emil-design-eng` and `animate`: what moves and what stays still, the easing and durations, its direction in right-to-left, and what reduced motion does.
- [ ] An ADR records the Shopper app's new look and the options it was chosen over, and replaces the parts of [ADR-0007](../../../docs/adr/0007-a-look-and-components-for-each-app.md) it changes; ADR-0007 says which of its parts are replaced.
- [ ] The Shopper app has the scheme switch of ticket 03, light, dark or the device's, beside its language switch, remembered in the browser.
- [ ] The Shopper's page, its "not found" screen and its footer with the BuildCores OpenDB credit (CAT-9) follow the new DESIGN.md, in the three languages and both directions, laid out at 360 pixels first.
- [ ] They pass `inspect.mjs` at 1440, 768 and 360 pixels, in Kurdish and in English; the Shopper app needs no login, so the inspector runs on it directly.
- [ ] `expectAccessible` passes on them in the light and in the dark scheme. `pnpm check` and `pnpm platform:check` pass.
- [ ] The owner reads the new DESIGN.md and sees the page in the built-in browser, and every remark is answered before the ticket closes. The remarks and answers are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 1 November 2026: moved out of this spec

Later the same day the owner said: "we will start fresh designing plan for the shopper unique to it. and follow the principle for it then. this redesign session was for the dashboard". The redesign is the dashboard's alone, and this ticket is closed as moved out (`wontfix` here). The Shopper app gets a fresh design plan of its own when the `browse` module begins, following the same principles (Taste, Emil's skills and Impeccable each leading its area, every choice rendered and chosen by eye). Nothing recorded in this ticket binds that plan, the provisional answers on Fit Diagram included.
