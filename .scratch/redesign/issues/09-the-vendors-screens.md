# 09: The Vendors' screens

**Spec:** [the redesign spec](../spec.md)

**What to build:** Everything the Admin does with Vendors is rebuilt to the new DESIGN.md: the list of Vendors, a Vendor's page, creating a Vendor and the hand-over of its temporary password, editing it, resetting its password, and deactivating and reactivating it.

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] The Vendors' list, a Vendor's page, the new Vendor's form and the hand-over, the edit form, the reset of a password and the dialogs that deactivate and reactivate follow the new DESIGN.md and move as its Motion section says.
- [ ] Each passes `inspect.mjs --app` at 1440, 768 and 360 pixels through ticket 01's command, with the fixture's Vendor among the real ones.
- [ ] Emil's `break-ui` is run on the list and a Vendor's page: a long shop name, a long address, a deactivated Vendor, no Vendors. What broke is fixed.
- [ ] `expectAccessible` passes on each screen in the accessibility tests' list, in the light and in the dark scheme. `pnpm check` and `pnpm platform:check` pass.
- [ ] Tests that had to change are listed under Comments with why; no test loses an assertion.
- [ ] The screens are shown to the owner in the built-in browser before the ticket closes, and the owner's remarks are recorded under Comments. DESIGN.md is corrected where building them taught something.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
