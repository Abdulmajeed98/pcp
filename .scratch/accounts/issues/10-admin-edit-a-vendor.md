# 10: The Admin edits a Vendor

**Spec:** [the accounts spec](../spec.md)

**What to build:** The Admin edits every detail of a Vendor in the Admin console, its name, city and login phone number among them (ACC-8). Changing the login phone number renames the Vendor's Login, so that the Vendor logs in with the new number and the password it had.

**Blocked by:** 06

**Status:** resolved

- [x] Before anything is written, these are found out on the installed Keycloak and recorded under Comments: how the admin client renames a Login; whether, with `editUsernameAllowed` on and the user profile letting only `admin` edit the name, the API's client renames a Login while the Login cannot rename itself in Keycloak's account pages; and how a test asks Keycloak's account interface as a Login. Ticket 01 found that a rename is refused while `editUsernameAllowed` is off, and ticket 03 that the profile lets `user` edit the name too.
- [x] **The realm.** The realm file turns `editUsernameAllowed` on, and its user profile lets only `admin` edit a Login's name. The owner's running realm gets the same two changes once, through Keycloak's administration interface as Keycloak's own administrator, with no reset and no script added for it. What was changed is recorded under Comments.
- [x] **The API.** `EditVendorCommand` and its endpoint answer the Admin only. The edit replaces every detail, clears an optional detail it leaves out, and checks each detail as tickets 01 and 02 do.
- [x] Changing the login phone number renames the Login first and the Vendor second. When the Vendor cannot be stored, the Login's name is put back. When that fails too, the Login's identifier is logged. A login phone number another Vendor holds is refused, and no Login is renamed.
- [x] While Keycloak's administration interface cannot be reached, an edit that changes the login phone number is answered 503 with `IDENTITY_SERVICE_UNAVAILABLE`, and nothing changes.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] `pnpm integration:check` passes with these tests:
  - The Admin's edit changes the name and the login phone number.
  - The Login is renamed to match, and its password is still the one it had, read at the token address.
  - An optional detail left out is cleared.
  - A login phone number another Vendor holds is refused, and neither Login is renamed.
  - An edit whose Vendor cannot be stored, by a fault planted for the test, leaves the Login with its old name.
  - With the Keycloak container paused, an edit of the login phone number is answered 503, and nothing changes.
  - A Vendor's edit is answered 403, and a call without a token 401.
  - A Login that changes its own name through Keycloak's account interface is refused, and keeps its name.
- [x] Shown once and then reverted, each failing its own test: the put-back removed; the Login left with its old name; the name made editable by `user` again.
- [x] **The edit form.** A Vendor's page gains a way to its edit form, which has the create form's fields, filled with the Vendor's details. A refusal is shown beside the field it names. After a save, the Vendor's page shows the new values.
- [x] It follows DESIGN.md, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [x] `pnpm platform:check` gains these lines, and passes on every line:
  - As the development Admin, in a window 360 pixels wide, the Admin changes a made-up Vendor's name and login phone number, and its page shows both.
  - The Vendor, which had already chosen its own password, logs in with the new number and that password. The old number no longer logs in.
  - `expectAccessible` passes on the edit form, in the light and in the dark scheme.
- [x] Shown once and then reverted, failing on its own line: the edit form sending the old login phone number.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

## Comments

### 19 October 2026: found out on the installed Keycloak, before anything was written

On a Keycloak 26.8.0 container of its own, the development services' image, started from a copy of the realm file with the two changes below, and removed afterwards, with `@keycloak/keycloak-admin-client` 26.8.1 read from `node_modules`:

- **How the admin client renames a Login.** `users.update({ id }, { username })`, which sends `PUT /admin/realms/pcp/users/{id}` with the new name alone. As the API's client, holding `manage-users` and no other role, it was answered 204. The Login kept its identifier, its enabled state, its required action `UPDATE_PASSWORD` and its roles: an update changes only what it sends. Its password was kept too: its temporary password was then "Account is not fully set up" under the new name and "Invalid user credentials" under the old one. A name another Login holds was answered 409, "User exists with same username", a Login that does not exist 404, and the Login's own name again 204. Ticket 01 found that a rename is refused with `error-user-attribute-read-only` while `editUsernameAllowed` is off.
- **Who may rename once `editUsernameAllowed` is on.** With the user profile letting only `admin` edit `username`, the API's client renamed a Login, as above, and the Login itself was refused in Keycloak's account interface: `POST /realms/pcp/account/` with its own profile and a new `username` was answered 400, `{"field":"username","errorMessage":"error-user-attribute-read-only"}`, and the account interface's `GET` gave `username` as `readOnly: true`. The name stayed. With the profile changed back to let `user` edit it too, the same request was answered 204 and the Login was renamed. So both changes are needed together, and the second is what stops a Vendor renaming its own Login.
- **How a test asks Keycloak's account interface as a Login.** The Login logs in at the token address with the password grant, through the test's own `test-password-check` client, which needs a lasting password: a temporary one is answered "Account is not fully set up". The test gives it one as Keycloak's administrator of the container (`PUT /users/{id}/reset-password`, `temporary: false`), as its first login would. The token then calls `{url}/realms/pcp/account/` with `accept: application/json`, which the account interface needs to answer JSON instead of the account pages: `GET` reads the Login's profile and `POST` sends it back changed. The default roles give the Login `manage-account`, and the token's audience holds `account`, so nothing is added to the realm for it. `renameItselfInItsAccount` in `keycloak-administrator.ts` does this.

### 19 October 2026: the owner's running realm changed by hand

Once the realm file held both changes, a script in the scratchpad, not in the repository, logged in to the owner's Keycloak as Keycloak's own administrator, with the name and password in `.env`, and changed the realm `pcp` through the administration interface. No secret was printed, there was no reset, and no code was added for it.

| | Before | After |
|---|---|---|
| The realm's `editUsernameAllowed`, by `PUT /admin/realms/pcp` with that field alone, answered 204 | `false` | `true` |
| Who may edit `username` in the user profile, by `PUT /admin/realms/pcp/users/profile` with the profile as read and `edit` changed, answered 200 | `admin`, `user` | `admin` |

Read back afterwards: who may view `username` is still `admin` and `user`, the profile still holds `username` and `email` only, the password policy (`length(8) and notUsername`), brute-force detection, the themes, the languages and the other settings read the same, and the development Admin's Login is there.

### 19 October 2026: completed

**What was built.**

- **The realm.** The realm file turns `editUsernameAllowed` on, and its user profile lets only `admin` edit `username`; who may view it is unchanged.
- **The API.** `PUT v1/vendors/{vendorId}`, open to `admin` alone, runs `EditVendorCommand`. It reads the Vendor (404 with `VENDOR_NOT_FOUND` when there is none), checks every detail as a create does and replaces them all, so an optional detail left out, or sent as null, is cleared. A login phone number another Vendor holds is refused as `taken` before Keycloak is asked. When the number changes, the Login is renamed first, through the new `LoginStore.rename` over `users.update`, and the Vendor second, through the new `VendorStore.edit`. When the Vendor cannot be stored, the Login's name is put back; when that fails too, the Command logs the Login's identifier and answers 503 with `IDENTITY_SERVICE_UNAVAILABLE`. A name a Login made by hand in Keycloak holds is answered by Keycloak with 409, which the Store gives as `isLoginNameTaken` and the Command as `taken`. An edit that keeps the login phone number, typed in any form, does not ask Keycloak, so it goes through while Keycloak cannot be reached. The answer is the Vendor, as reading it answers.
- **Shared with the create.** The checks of the name, the city, the contact details and the login phone number moved from `CreateVendorCommand` into `VendorDetails.check`, which both Commands use, with `UncheckedVendorDetails` as their Input's details; `longestVendorName` moved with them. The create's Request's fields moved to `VendorDetailsRequest`, which `CreateVendorRequest` and the new `EditVendorRequest` extend, as `ContactDetailsRequest` is shared. The create's description is unchanged but for "is known by", where it said "will be known by".
- **The client.** `pnpm api-client:write` was run; the client has `editVendor` and exports `EditVendorRequest`.
- **The edit form.** A Vendor's page in the Admin console gains an outlined "Edit" link with a pencil mark, beside "Open its portal" in a row that wraps, as a Part's page has its Edit. It opens `pages/edit-vendor` at `vendors/{vendorId}/edit`, a child of the Vendors as a Vendor's page is, so it shows beside the list on a wide screen and the list keeps its row marked. The screen has a back link to the Vendor, the title "Edit the Vendor" and the Vendor's name as it writes it below it. The form is ticket 06's `VendorForm`, given the Vendor: filled with its details as they are, its phone numbers in Iraq's own form and its Instagram name bare, saved with "Save the Vendor". A refusal is shown beside the field it names, as the create's are; a refusal that names no field says "The Vendor was not saved." and, for Keycloak that cannot be reached, that neither the Vendor nor its Login was changed. The login phone number's description says that a new number changes what the Vendor logs in with and keeps its password. After a save the Vendor's page draws the Vendor as the API answered it, and the list is asked again.
- DESIGN.md records the Vendor's actions and the edit form.

**The API's tests**, in a file of their own, `vendor.controller.edit.integration-spec.ts`, so that tickets 11 and 12, which add to `vendor.controller.integration-spec.ts`, merge without meeting it, against a real PostgreSQL and a real Keycloak:

| Ticket's line | Tests |
|---|---|
| The Admin's edit changes the name and the login phone number | One: every detail changed, the name in Sorani with Arabic-Indic digits and the login phone number typed in Arabic-Indic digits, answered and read back so, `updatedAt` later |
| The Login is renamed to match, and its password is still the one it had, read at the token address | One: the Login, given a lasting password first as a first login would, is found by the new name with the same identifier, enabled, asked for nothing, holding `vendor`; the token address takes the password under the new name and answers "Invalid user credentials" under the old. Not asked for: an edit that keeps the number, typed with +964, leaves the Login as it is |
| An optional detail left out is cleared | Two: left out, sent as null |
| A login phone number another Vendor holds is refused, and neither Login is renamed | One, the number typed in another form, both Vendors unchanged; and, not asked for, a number a Login made by hand in Keycloak holds, refused as taken through Keycloak's 409 |
| An edit whose Vendor cannot be stored, by a fault planted for the test, leaves the Login with its old name | One: a `CHECK (false) NOT VALID` constraint, which refuses every edit and not the stored row, answered 500, the Login found by its old name with its identifier, none by the new, the Vendor unchanged |
| With the Keycloak container paused, an edit of the login phone number is answered 503, and nothing changes | One; and, not asked for, an edit that keeps the number taken while paused |
| A Vendor's edit is answered 403, and a call without a token 401 | Two, the Vendor's own Login among them, nothing changed |
| A Login that changes its own name through Keycloak's account interface is refused, and keeps its name | One: answered 400 with `error-user-attribute-read-only` for `username`, the name kept |
| Not asked for: each detail checked as tickets 01 and 02 do | Ten: no name, a name of 101 characters, a city outside the set, no address, a number in London, coordinates the wrong way round, a landline as the login phone number, no login phone number, a name that is not text, an undeclared field; nothing changed in each, the Login kept. And two answered 404 |

The first was run before the endpoint existed and failed on its 404. The Command, the Stores and the endpoint were then written together, and the other 24 passed when first run; the faults below show that they can fail.

**The new lines of `pnpm platform:check`**, in `admin-edit-vendor.spec.ts`, as the development Admin in a window 360 pixels wide, each with a made-up Vendor of its own that has been through its first login and chosen its own password:

| Line | How it is told |
|---|---|
| The Admin changes a made-up Vendor's name and login phone number, and its page shows both | The Edit link opens the form at its address, filled with the Vendor's name and its login phone number in Iraq's own form; after the save the page's heading is the new name and its login phone number's row holds the new number; no sideways scroll |
| The Vendor logs in with the new number and the password it had chosen; the old number no longer logs in | In a fresh browser the new number and that password open the Vendor portal with the new name in its frame; in another, the old number and that password are refused at Keycloak's login screen |
| `expectAccessible` passes on the edit form, in the light and in the dark scheme | As opened, and with a number in London refused beside its field, which is marked invalid and described by the refusal; no sideways scroll |

They were run after the form was written, and passed when first run; the fault below shows that they can fail.

**Fault checks**, each planted after the work was committed, by a script that refused a tree differing from `HEAD`, made one exact edit, ran the one test file, wrote the file back and printed `git status`, which was clean after each:

| Fault | Failed |
|---|---|
| The put-back removed: the second rename skipped | The test of the planted database fault alone, the Login found by neither name but the new. 24 passed. |
| The Login left with its old name: the first rename skipped | The rename test, which found a Login by the old name; the hand-made Login's test, answered 200 for 400; and the paused Keycloak's test, answered 200 for 503. 22 passed. |
| The name made editable by `user` again, in the realm file the test's Keycloak imports | The account interface's test alone, its rename answered 204. 24 passed. |
| The edit form sending the old login phone number, in the edit page | The first line, the page's login phone number still the old one; and the second line, which timed out after 30 seconds at Keycloak's login screen, the new number refused. The accessibility line passed. |

**Results**, against the owner's services with no reset, on the branch before the merge: `pnpm integration:check` passes 231 tests, 25 of them new; `pnpm platform:check` passes 123 tests, 3 of them new, run with `COMPOSE_PROJECT_NAME=pc-part-pickers` from the worktree so that it reached the owner's services; and `pnpm check` and `pnpm boundaries:check` pass. Each of the three commits passed `pnpm check --skip-nx-cache` in a fresh clone in the scratchpad, installed offline, with `DOCKER_HOST` pointed at a socket that does not exist and no browser installed.

**After merging `accounts/integration`**, which brought ticket 12, three files met it. The controller and the module take both tickets' Commands. A Vendor's page keeps the row of Edit and Open its portal, with ticket 12's activation below it. The test utilities had `giveALastingPassword` twice, the same function written by both tickets; ticket 12's is kept. The client was written again with `pnpm api-client:write`. On the merge, `pnpm check` passes, `pnpm integration:check` passes 245 tests, and `COMPOSE_PROJECT_NAME=pc-part-pickers pnpm platform:check`, under the lock, passes 127.

**What the end-to-end run did not check.** The services' Keycloak imports nothing again, so `pnpm platform:check` met the realm as the owner's running one holds it, changed by hand as recorded above, and not the realm file; `pnpm integration:check` met the realm file. This ticket changes no theme.

**Left open.** By hand in the owner's browser: the Vendor's page and the edit form matching DESIGN.md, at 360 pixels and wider, with the form beside the list. The ticket asks for no check on a phone; the spec's "the Vendors screens used with a thumb" stays with ticket 06's line in the MVP spec.

### 19 October 2026: decisions left open, for the owner

Each was taken the way the ticket, the spec or DESIGN.md pointed, and none blocks the module.

- **The link's words and place.** "Edit", with a pencil mark, as a Part's page and the owner's choice for the contact details' link have it, in one row with "Open its portal" below the Vendor's name. Tickets 11 and 12 add their buttons to the same page. **My recommendation:** keep it, and let the reset and the deactivation join the row.
- **A screen of its own**, at the Vendor's address with `/edit`, beside the list on a wide screen, as a Part's edit form is, rather than the form on the Vendor's page. **My recommendation:** keep it.
- **The screen's words.** The title "Edit the Vendor", as "Edit the Part", the Vendor's name in Note Grey below it, the back link "The Vendor", the button "Save the Vendor", and "The Vendor was not saved." above a refusal that names no field. **My recommendation:** keep them.
- **The login phone number's description on the edit:** "A mobile number. The Vendor logs in with it. A new number changes what the Vendor logs in with, and its password stays." The form does not ask the Admin to confirm a new number, and nothing is handed over: the Vendor logs in with the password it had. **My recommendation:** keep it; telling the Vendor its new number is the Admin's, in the shop.
- **Sessions after a rename.** A Login's sessions and tokens are kept when it is renamed: the API finds a Vendor by its Login's identifier, which stays, so a Vendor whose number the Admin changes stays logged in. **My recommendation:** keep it; a reset ends sessions where that is wanted.
- **An edit that keeps the number while Keycloak cannot be reached** goes through, since it needs no Keycloak; the spec answers 503 for "a call that needs it". **My recommendation:** keep it.

### 19 October 2026: the code review of tickets 10 to 12

The review of `accounts/integration` since `4f0c6a5` was fixed on `accounts/review-fixes`. What belongs to this ticket:

- **A test across tickets.** The edit's spec gains a line: a deactivated Vendor whose login phone number the Admin changes stays deactivated, and its renamed Login stays disabled, refused at the token address with `Account disabled`. It passed when first run, as the code already did so; a planted fault that sent `enabled: true` with the rename failed it, and nothing else (153 passed).
- **The tests' copies.** The edit's spec had copied the error bodies `IDENTITY_SERVICE_UNAVAILABLE`, `VENDOR_NOT_FOUND` and `INTERNAL_SERVER_ERROR`, the SQL runner and the planted constraint from the Vendor endpoints' spec. They are now in `src/test/test-utils/error-bodies.ts` and `test-database.ts`, and the planted constraint, `CHECK (false) NOT VALID`, refuses a create and an edit alike.
- **One helper for a Vendor that does not exist.** `existingVendor`, beside the Commands, turns what a store gives back into the Vendor or `VENDOR_NOT_FOUND`. The edit, the deactivation, the reactivation, the reset, the change of contact details and the rule for which Vendor a request acts for use it.
- **Names.** In `EditVendorCommand`, `oldName` and `newName` are now `oldLoginName` and `newLoginName`, as they hold login phone numbers in the form a Login is named by.
- **The store.** `CreateVendorParams` carries `VendorDetails` and the Login's identifier, as `EditVendorParams` carries `VendorDetails`, and both write the same columns through one `detailsColumns`. `DatabaseVendorStore`'s edit, change of contact details and mark of a Vendor active or not share `updateOneWhere`, beside `readOneWhere`; the mark's helper is now `storeWhetherActive`. The API's answers did not change: every test passed unchanged.
- **The form's words.** `vendor-form.tsx` chose between the create's and the edit's words in four places, and passed `editing` to `whyNotSaved`. `model/texts.ts` holds both sets, and the form picks one.
- **The MVP spec** names the edit form among the Admin console's screens, and among those that call `expectAccessible`, as opened and with a refusal shown.

**Results on the branch's tip** are under ticket 12's heading of the same day.

### 19 October 2026: the owner's decisions

The decisions were put to the owner on 19 October 2026, one at a time, each rendered in the built-in browser. The screens were captured from the real app, at 360 pixels wide, by a throwaway end-to-end test, deleted after. Each alternative was made by changing the page in that test, not the source, and laid beside the screen as built. The numbers are those of the list in ticket 13.

1. **The Edit link**: **"Edit"**, as built and as recommended.
2. **The edit form on a screen of its own**: **kept**, as built and as recommended.
3. **The edit screen's words**: **changed**, against my recommendation. The screen names the Vendor: its title is "Edit" and the Vendor's name as it writes it, its back link is the Vendor's name, and its button is "Save". "The Vendor was not saved." stays above a refusal that names no field. The name below the title is gone, as the title now holds it.
4. **A new login phone number without a confirmation**: **kept**, as built and as recommended.
5. **Sessions kept when a Login is renamed**: **kept**, as built and as recommended.
6. **An edit that keeps the number while Keycloak is down**: **kept**, as built and as recommended.

**What changed for decision 3.** `edit-vendor-page.tsx` names the Vendor in its title and back link, and saves with "Save". DESIGN.md says so. `admin-edit-vendor.spec.ts` finds the screen by "Edit" and the Vendor's name, checks that the back link names the Vendor and leads to its page, and saves with "Save". Its three lines failed before the change, each not finding the new title, and pass after.
