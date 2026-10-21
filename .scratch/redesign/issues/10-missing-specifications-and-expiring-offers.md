# 10: Missing specifications and Expiring Offers

**Spec:** [the redesign spec](../spec.md)

**What to build:** The Admin console's two lists of work to do are rebuilt to the new DESIGN.md: Missing specifications, the Parts with an Offer that lack a specification a Compatibility Rule needs (CAT-8), and Expiring Offers, the Vendors to remind, with their WhatsApp links.

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] Missing specifications and Expiring Offers follow the new DESIGN.md and move as its Motion section says. The Part's edit form under Missing specifications is ticket 08's and is not laid out here.
- [ ] Each passes `inspect.mjs --app` at 1440, 768 and 360 pixels through ticket 01's command, Expiring Offers with the fixture's Offers about to expire.
- [ ] Emil's `break-ui` is run on both lists: a long name, many gaps, an empty list. What broke is fixed.
- [ ] `expectAccessible` passes on both, in the light and in the dark scheme. `pnpm check` and `pnpm platform:check` pass.
- [ ] Tests that had to change are listed under Comments with why; no test loses an assertion.
- [ ] The screens are shown to the owner in the built-in browser before the ticket closes, and the owner's remarks are recorded under Comments. DESIGN.md is corrected where building them taught something.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
