# 06: The dashboard's new DESIGN.md, its Motion and an ADR

**Spec:** [the redesign spec](../spec.md)

**What to build:** The direction the owner chose becomes the dashboard's written design, the one every screen is rebuilt to. Impeccable rewrites the dashboard's DESIGN.md from it, with a section on Motion of its own, led by Emil's skills. An ADR records what replaces the look that ADR-0007 gave the dashboard.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Impeccable rewrites `apps/dashboard/DESIGN.md` from ticket 05's direction: its tokens, Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, and Do's and Don'ts. The fonts are unchanged (ADR-0006).
- [ ] Every component the current DESIGN.md describes has its place in the new one, or is listed as dropped: buttons, inputs and fields, rows, plates, states, dialogs, removing an Offer, deactivating a Vendor, the hand-over, the expiry banner, navigation and the portal's sections.
- [ ] Choices the owner made in earlier tickets (such as the Offers screen's four in `offers` ticket 03) are kept unless the direction replaces them, and each one replaced is listed under Comments.
- [ ] **Motion**, led by `emil-design-eng` and `animate`: what moves and what stays still, the easing and durations, how a movement is interrupted, its direction in right-to-left, and what reduced motion does.
- [ ] The hard rules of the root DESIGN.md, as ticket 03 left them, hold throughout.
- [ ] A new ADR records the dashboard's new look and the options it was chosen over, and replaces the parts of [ADR-0007](../../../docs/adr/0007-a-look-and-components-for-each-app.md) it changes; ADR-0007 says which of its parts are replaced.
- [ ] The owner reads the new DESIGN.md, with the Motion section's movements shown in the built-in browser, and every remark is answered before the ticket closes. The remarks and answers are recorded under Comments.
- [ ] `pnpm check` passes, and the work is committed.
