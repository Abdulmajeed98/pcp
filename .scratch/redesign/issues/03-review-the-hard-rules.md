# 03: Review the hard rules with the owner

**Spec:** [the redesign spec](../spec.md)

**What to build:** The owner goes through the platform's hard rules one at a time and keeps, adjusts or drops each where it makes screens rigid. The rules are the floor of the root [DESIGN.md](../../../DESIGN.md) and the Accessibility & Inclusion of [PRODUCT.md](../../../PRODUCT.md): among them 44-pixel controls, 14-pixel text, 360 pixels wide, right-to-left, and self-hosted fonts that draw all of Sorani. WCAG 2.2 AA is the owner's standard and is not reviewed unless the owner reopens it. Both documents then say what the owner decided.

**Blocked by:** 02

**Status:** ready-for-human

- [ ] Ticket 02's page is open in the built-in browser before the first rule is asked about.
- [ ] Each rule is put to the owner on its own, with what ticket 02's critique says against it, if anything, and what keeping, adjusting or dropping it would change on the screens.
- [ ] Each rule is recorded under Comments as kept, adjusted or dropped, with the owner's word.
- [ ] The root DESIGN.md and PRODUCT.md are edited to match, and the list of hard rules in `docs/agents/design-skills.md` too, if it changed.
- [ ] Where a skill's rule still pulls against a kept rule, the conflict is put to the owner rather than settled by an agent.
- [ ] `pnpm check` passes, and the work is committed.
