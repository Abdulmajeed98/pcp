# 07: The new look's foundations, proved on the Catalog

**Spec:** [the redesign spec](../spec.md)

**What to build:** The dashboard takes the new look at its base, and the Admin console's Catalog is the first screen rebuilt to it from end to end. The tokens of both schemes, the shared components and the Admin console's frame follow the new DESIGN.md, so every screen gains the new base at once, while only the Catalog is laid out anew. The Catalog's search, its Category, the count, the rows and the way between pages are built as DESIGN.md says, with motion as its Motion section says.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] The tokens of the light and the dark scheme follow the new DESIGN.md.
- [ ] Every shared component of the dashboard follows it: buttons, inputs, fields, choices, rows, plates or what replaced them, tables, alerts, dialogs, the empty state and the list's pages.
- [ ] The Admin console's frame and its navigation follow it, with the scheme switch of ticket 03: light, dark or the device's, beside the language, remembered in the browser. Controls are 36 pixels under a mouse and 44 on a touchscreen.
- [ ] The Catalog is rebuilt to it, and moves as the Motion section says, with reduced motion respected.
- [ ] Every other screen still works and passes its tests, with the new base until its own ticket lays it out.
- [ ] The Catalog passes `inspect.mjs --app` at 1440, 768 and 360 pixels through ticket 01's command, with the direction's allowances restored from ticket 05.
- [ ] Emil's `break-ui` is run on the Catalog's list: long Part names, a huge count, nothing found. What broke is fixed.
- [ ] `expectAccessible` passes on the Catalog in the light and in the dark scheme. `pnpm check` and `pnpm platform:check` pass.
- [ ] It is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [ ] Tests that had to change are listed under Comments with why; no test loses an assertion.
- [ ] The Catalog is shown to the owner in the built-in browser before the ticket closes, and the owner's remarks are recorded under Comments. DESIGN.md is corrected where building it taught something.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
