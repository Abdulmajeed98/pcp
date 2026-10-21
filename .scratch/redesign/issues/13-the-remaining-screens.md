# 13: The portal's details and the remaining screens

**Spec:** [the redesign spec](../spec.md)

**What to build:** The last screens of the dashboard take the new look, so that no screen is left in the old one: the portal's details screen and its contact details form, the plain messages for a Login with no Vendor and for a deactivated Vendor, the portal's and the Admin console's "not found" screens, and the screen shown when the login fails.

**Blocked by:** 11

**Status:** ready-for-agent

- [ ] The details screen, the contact details form, the two plain messages, both "not found" screens and the failed login follow the new DESIGN.md and move as its Motion section says.
- [ ] Each that can be reached logged in passes `inspect.mjs --app` at 1440, 768 and 360 pixels through ticket 01's command; the portal's in Kurdish and in English.
- [ ] Emil's `break-ui` is run on the details screen: a long address, every optional detail missing. What broke is fixed.
- [ ] The portal's screens pass `checkInEveryLanguageOfTheVendorPortal`. `expectAccessible` passes on each screen in the accessibility tests' list, in the light and in the dark scheme. `pnpm check` and `pnpm platform:check` pass.
- [ ] No screen of the dashboard is left in the old look: each route in both routers is listed under Comments with the ticket that rebuilt it.
- [ ] Tests that had to change are listed under Comments with why; no test loses an assertion.
- [ ] The screens are shown to the owner in the built-in browser before the ticket closes, and the owner's remarks are recorded under Comments. DESIGN.md is corrected where building them taught something.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
