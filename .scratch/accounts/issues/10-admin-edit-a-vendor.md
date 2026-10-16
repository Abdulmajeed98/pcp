# 10: The Admin edits a Vendor

**Spec:** [the accounts spec](../spec.md)

**What to build:** The Admin edits every detail of a Vendor in the Admin console, its name, city and login phone number among them (ACC-8). Changing the login phone number renames the Vendor's Login, so that the Vendor logs in with the new number and the password it had.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] Before anything is written, these are found out on the installed Keycloak and recorded under Comments: how the admin client renames a Login, and whether the realm needs a setting for it.
- [ ] **The API.** `EditVendorCommand` and its endpoint answer the Admin only. The edit replaces every detail, clears an optional detail it leaves out, and checks each detail as tickets 01 and 02 do.
- [ ] Changing the login phone number renames the Login first and the Vendor second. When the Vendor cannot be stored, the Login's name is put back. When that fails too, the Login's identifier is logged. A login phone number another Vendor holds is refused, and no Login is renamed.
- [ ] While Keycloak's administration interface cannot be reached, an edit that changes the login phone number is answered 503 with `IDENTITY_SERVICE_UNAVAILABLE`, and nothing changes.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] `pnpm integration:check` passes with these tests:
  - The Admin's edit changes the name and the login phone number.
  - The Login is renamed to match, and its password is still the one it had, read at the token address.
  - An optional detail left out is cleared.
  - A login phone number another Vendor holds is refused, and neither Login is renamed.
  - An edit whose Vendor cannot be stored, by a fault planted for the test, leaves the Login with its old name.
  - With the Keycloak container paused, an edit of the login phone number is answered 503, and nothing changes.
  - A Vendor's edit is answered 403, and a call without a token 401.
- [ ] Shown once and then reverted, each failing its own test: the put-back removed; the Login left with its old name.
- [ ] **The edit form.** A Vendor's page gains a way to its edit form, which has the create form's fields, filled with the Vendor's details. A refusal is shown beside the field it names. After a save, the Vendor's page shows the new values.
- [ ] It follows DESIGN.md, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [ ] `pnpm platform:check` gains these lines, and passes on every line:
  - As the development Admin, in a window 360 pixels wide, the Admin changes a made-up Vendor's name and login phone number, and its page shows both.
  - The Vendor, which had already chosen its own password, logs in with the new number and that password. The old number no longer logs in.
  - `expectAccessible` passes on the edit form, in the light and in the dark scheme.
- [ ] Shown once and then reverted, failing on its own line: the edit form sending the old login phone number.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.
