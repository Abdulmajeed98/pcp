# 14: Deal the Shopper app's directions and choose one

**Spec:** [the redesign spec](../spec.md)

**What to build:** The Shopper app is designed the new way before it is built far, so that it does not end up as the dashboard did. The owner decides whether its idea, Fit Diagram, Parts drawn the way a motherboard manual draws them, stays. Then directions for its public pages are dealt through Taste's page run, rendered with fictional data, and the owner chooses one by eye. It starts once the dashboard is rebuilt, so that what the dashboard taught carries over.

**Blocked by:** 08, 09, 10, 11, 12, 13

**Status:** ready-for-human

- [ ] What the dashboard's rebuild taught, from the Comments of tickets 06 to 13, is summed up for the owner first.
- [ ] Taste and Impeccable critique the Shopper's DESIGN.md and its one page, and the owner decides whether Fit Diagram is kept as it is, kept with its execution changed, or dropped. The decision is recorded under Comments with the owner's word.
- [ ] The directions are dealt by Taste's page run as its `SKILL.md` describes it, from the repository root, never picked by an agent, with the hard rules as ticket 03 left them and the fonts kept (ADR-0006). Pictures of Erbil come from `assets.mjs` with their credits.
- [ ] Each direction is rendered as the Shopper's pages to come (a Part with its Offers, and a Build), in Kurdish and in English, at 360 and 1440 pixels, filled with realistic, obviously fictional data, and with the BuildCores OpenDB credit in the footer (CAT-9).
- [ ] The options are shown in the built-in browser on one page, one per anchor, two columns at most, before the owner is asked to choose. If the owner takes none, the script deals again.
- [ ] The owner's choice is recorded under Comments, and the chosen direction's sheet is committed into the repository, since Git ignores `.taste-skill/`.
- [ ] `pnpm check` passes, and the work is committed.
