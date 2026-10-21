# 08: A Part's screens

**Spec:** [the redesign spec](../spec.md)

**What to build:** Everything the Admin does with one Part is rebuilt to the new DESIGN.md: a Part's page with its specifications and the missing ones marked, choosing a Category for a new Part, the form that creates a Part and the one that edits it, and adding a photo.

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] A Part's page, choosing a Category, the new Part's form, the edit form and adding a photo follow the new DESIGN.md and move as its Motion section says.
- [ ] Each passes `inspect.mjs --app` at 1440, 768 and 360 pixels through ticket 01's command.
- [ ] Emil's `break-ui` is run on a Part's page and its form: a long name, many specifications, every one missing, a refusal. What broke is fixed.
- [ ] `expectAccessible` passes on each screen in the accessibility tests' list, in the light and in the dark scheme. `pnpm check` and `pnpm platform:check` pass.
- [ ] Tests that had to change are listed under Comments with why; no test loses an assertion.
- [ ] The screens are shown to the owner in the built-in browser before the ticket closes, and the owner's remarks are recorded under Comments. DESIGN.md is corrected where building them taught something.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
