# 03: Review the hard rules with the owner

**Spec:** [the redesign spec](../spec.md)

**What to build:** The owner goes through the platform's hard rules one at a time and keeps, adjusts or drops each where it makes screens rigid. The rules are the floor of the root [DESIGN.md](../../../DESIGN.md) and the Accessibility & Inclusion of [PRODUCT.md](../../../PRODUCT.md): among them 44-pixel controls, 14-pixel text, 360 pixels wide, right-to-left, and self-hosted fonts that draw all of Sorani. WCAG 2.2 AA is the owner's standard and is not reviewed unless the owner reopens it. Both documents then say what the owner decided.

**Blocked by:** 02

**Status:** resolved

- [x] Ticket 02's page is open in the built-in browser before the first rule is asked about.
- [x] Each rule is put to the owner on its own, with what ticket 02's critique says against it, if anything, and what keeping, adjusting or dropping it would change on the screens.
- [x] Each rule is recorded under Comments as kept, adjusted or dropped, with the owner's word.
- [x] The root DESIGN.md and PRODUCT.md are edited to match, and the list of hard rules in `docs/agents/design-skills.md` too, if it changed.
- [x] Where a skill's rule still pulls against a kept rule, the conflict is put to the owner rather than settled by an agent.
- [x] `pnpm check` passes, and the work is committed.

## Comments

### 21 October 2026: the owner's review of the hard rules

Ticket 02's page was open in the built-in browser at its `#hard-rules` section before the first rule was asked. The two rules a skill pulls against were also drawn in today's dashboard tokens with the made-up shop's data, at `.taste-skill/redesign-03/index.html` in the owner's checkout: the Catalog's search and rows at 44, 36 and 32 pixels under a mouse, the portal's phone chrome in four rows and in two, and a secondary line at 14 and at 12 pixels in English and Kurdish. Each rule was put to the owner on its own, with what the critique said against it and what each choice would change. WCAG 2.2 AA was not reviewed.

| Rule | What the critique said | The owner's word | Result |
|---|---|---|---|
| 1. Controls at 44 pixels | Taste: studied app screens run 28 to 40, median 34; the desktop Catalog's search takes two rows of 44. Impeccable: right on a phone, where the cure is fewer rows | "Adjust: 36 with mouse" | **Adjusted.** 44 by 44 on a touchscreen stays; under a mouse an app may go to 36, never lower. The dashboard's own rule of 44 under a mouse too, chosen earlier, is dropped, for ticket 06 to write. On a phone, fewer rows, not smaller ones |
| 2. No text under 14 pixels (15 in Kurdish and Arabic) | Taste: four sizes only, hierarchy from weight and colour alone; its cleanest scales add 12 | "Keep 14" | **Kept.** Hierarchy is to come from a larger top size and stronger weight and colour steps in ticket 05's directions. This is the one kept rule a skill still pulls against, and the owner settled it |
| 3. 360 pixels first, never sideways at 320, for low to mid-range Android on weak data | No pull | "Keep" | **Kept** |
| 4. Right to left, logical properties only, the mirroring rules, three languages from the first version | No pull; the Kurdish screens mirror correctly | "Keep" | **Kept** |
| 5. The Tall Script Rule | No pull | "Keep" | **Kept** |
| 6. The No Capitals Rule | No pull; Taste's sentence case agrees | "Keep" | **Kept** |
| 7. Self-hosted fonts that draw all of Sorani | No pull; the fonts stay (ADR-0006) | "Keep" | **Kept** |
| 8. A light and a dark scheme, following the device | No pull on the rule; the Rate Board's dark execution is ticket 04's | "Adjust: add a switch" | **Adjusted.** Both schemes and the device's default stay, and a switch lets the user choose one |
| 9. Western digits; numbers, Part names, part numbers and specifications as one left-to-right unit; a Vendor's text as written | No pull | "Keep" | **Kept** |

Asked where the scheme switch goes, the owner answered "Every app": the Admin console, the Vendor portal and the Shopper app each get a light, dark or device choice beside the language switch, remembered in the browser as the Vendor portal's language is. A box for it was added to tickets 06, 07, 11 and 15.

**Edited to match:** the root `DESIGN.md` (Key Characteristics, Layout's Controls and a new Scheme line, and the Don't on sizes), `PRODUCT.md`'s Accessibility & Inclusion, and the list of hard rules in `docs/agents/design-skills.md`.

**For ticket 05's brief, the hard rules as they now stand:** WCAG 2.2 AA in both schemes with a switch between them; 44-pixel controls on a touchscreen and at least 36 under a mouse; no text under 14 pixels (15 in Kurdish and Arabic); 360 pixels first; right to left with logical properties; the Tall Script and No Capitals Rules; the fonts kept; Western digits.
