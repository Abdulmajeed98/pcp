# 11: Resetting a Vendor's password

**Spec:** [the accounts spec](../spec.md)

**What to build:** The Admin resets a Vendor's password from its page, after confirming (ACC-5). The Vendor's sessions end. The page shows a new temporary password, once, with the same hand-over as after a create. The Vendor is made to replace it at its next login.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] Before anything is written, how the admin client ends a Login's sessions is read and recorded under Comments.
- [ ] **The API.** `ResetVendorPasswordCommand` and its endpoint answer the Admin only. A reset makes a new temporary password as ticket 01 does, gives it to Keycloak as a temporary credential, requires the Login to update its password, and ends the Login's sessions. The password is in the answer and nowhere else. A Vendor that does not exist is answered 404 with `VENDOR_NOT_FOUND`. While Keycloak's administration interface cannot be reached, a reset is answered 503 with `IDENTITY_SERVICE_UNAVAILABLE`.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] `pnpm integration:check` passes with these tests:
  - A reset answers a new temporary password, different from the first. It is the Login's, read at the token address, and the old one no longer is.
  - The Login is again required to update its password.
  - A session the test opened for the Login is ended.
  - A Vendor's reset is answered 403, and a call without a token 401.
- [ ] Shown once and then reverted, each failing its own test: the sessions left open; the password given as a lasting one.
- [ ] **The Admin console.** A Vendor's page gains a reset button, which asks the Admin to confirm first, with shadcn/ui's alert dialog unless ticket 12 has already added it. After the reset, the page shows the new password and ticket 06's hand-over. Cancelling changes nothing.
- [ ] It follows DESIGN.md, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [ ] `pnpm platform:check` gains these lines, and passes on every line:
  - As the development Admin, the Admin resets the password of a made-up Vendor that has chosen its own. The hand-over's link holds the new temporary password.
  - The Vendor's old password no longer logs in. The new temporary one leads to the screen that asks for a new password.
  - Cancelling the confirmation leaves the old password working.
  - `expectAccessible` passes on the confirmation, in the light and in the dark scheme.
- [ ] Shown once and then reverted, failing on its own line: the hand-over left holding the first temporary password.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.
