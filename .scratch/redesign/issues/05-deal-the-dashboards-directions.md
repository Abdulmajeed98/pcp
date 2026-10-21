# 05: Deal the dashboard's directions and choose one

**Spec:** [the redesign spec](../spec.md)

**What to build:** Taste's script deals directions for the dashboard, never an agent picking one, and the owner chooses by eye. Each direction is rendered as real dashboard screens filled with the made-up shop's data and pictures of Erbil, shown in the built-in browser. The direction the owner chooses is kept in the repository, so that every later ticket, and a fresh clone, can build and inspect to it.

**Blocked by:** 03, 04

**Status:** ready-for-human

- [ ] The directions are dealt by `node ~/.claude/skills/design-taste-frontend/scripts/draw.mjs --app --keep type --options 3`, run from the repository root, with a one-line brief that carries ticket 04's line and the hard rules as ticket 03 left them. The fonts stay (ADR-0006).
- [ ] Pictures of Erbil's bazaar, its money changers' boards and its shop signs are found with Taste's `assets.mjs`, each with its credit recorded.
- [ ] Each direction is rendered as the portal's Offers screen, in Kurdish and in English, and the Catalog, at 360 and 1440 pixels, filled with ticket 01's fixture: no empty or placeholder screen.
- [ ] Every option keeps the hard rules as ticket 03 left them; an option that breaks one says so on its page.
- [ ] The options are shown in the built-in browser on one page, one option per anchor, two columns at most, before the owner is asked to choose. If the owner takes none, the script deals again.
- [ ] The owner's choice is recorded under Comments with the owner's word.
- [ ] The chosen direction's sheet (its tokens and the inspector's allowances) is committed into the repository, since Git ignores `.taste-skill/`, with a note under Comments of how to restore it there for the inspector.
- [ ] `pnpm check` passes, and the work is committed.
