# 11: Resetting a Vendor's password

**Spec:** [the accounts spec](../spec.md)

**What to build:** The Admin resets a Vendor's password from its page, after confirming (ACC-5). The Vendor's sessions end. The page shows a new temporary password, once, with the same hand-over as after a create. The Vendor is made to replace it at its next login.

**Blocked by:** 06

**Status:** resolved

- [x] Before anything is written, how the admin client ends a Login's sessions is read and recorded under Comments.
- [x] **The API.** `ResetVendorPasswordCommand` and its endpoint answer the Admin only. A reset makes a new temporary password as ticket 01 does, gives it to Keycloak as a temporary credential, requires the Login to update its password, and ends the Login's sessions. The password is in the answer and nowhere else. A Vendor that does not exist is answered 404 with `VENDOR_NOT_FOUND`. While Keycloak's administration interface cannot be reached, a reset is answered 503 with `IDENTITY_SERVICE_UNAVAILABLE`.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] `pnpm integration:check` passes with these tests:
  - A reset answers a new temporary password, different from the first. It is the Login's, read at the token address, and the old one no longer is.
  - The Login is again required to update its password.
  - A session the test opened for the Login is ended.
  - A Vendor's reset is answered 403, and a call without a token 401.
- [x] Shown once and then reverted, each failing its own test: the sessions left open; the password given as a lasting one.
- [x] **The Admin console.** A Vendor's page gains a reset button, which asks the Admin to confirm first, with shadcn/ui's alert dialog unless ticket 12 has already added it. After the reset, the page shows the new password and ticket 06's hand-over. Cancelling changes nothing.
- [x] It follows DESIGN.md, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [x] `pnpm platform:check` gains these lines, and passes on every line:
  - As the development Admin, the Admin resets the password of a made-up Vendor that has chosen its own. The hand-over's link holds the new temporary password.
  - The Vendor's old password no longer logs in. The new temporary one leads to the screen that asks for a new password.
  - Cancelling the confirmation leaves the old password working.
  - `expectAccessible` passes on the confirmation, in the light and in the dark scheme.
- [x] Shown once and then reverted, failing on its own line: the hand-over left holding the first temporary password.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

## Comments

### 19 October 2026: how the admin client ends a Login's sessions

Read in `@keycloak/keycloak-admin-client` 26.8.1 as installed, and tried on Keycloak 26.8.0 in a throwaway container, with a Login that held a lasting password and one session opened at the token address:

- **Ending the sessions** is `users.logout({ id })`, which sends `POST /admin/realms/{realm}/users/{id}/logout`, "logout user from all sessions" in the client's own comment. Afterwards the administration interface lists no session for the Login, and the session's refresh token is refused with `invalid_grant`, "Session not active". Ticket 01 found that the API's client, holding `manage-users` alone, may call it.
- **Setting the password** is `users.resetPassword({ id, credential })`, which sends `PUT …/users/{id}/reset-password`. With `temporary: true` Keycloak adds `UPDATE_PASSWORD` to the Login's required actions; with `temporary: false` it takes it away.
- **A new password does not end the sessions by itself.** After `reset-password` the session was still listed and its refresh token still gave a token. So a reset makes two calls, and the fault of leaving the sessions open can fail a test.

### 19 October 2026: completed

**What was built.**

- **The API.** `ResetVendorPasswordCommand` and `POST /v1/vendors/{vendorId}/password-reset`, for the Admin only. It reads the Vendor, makes a temporary password as a create does, gives it to the Login as a temporary credential, so that Keycloak requires the Login to update its password, and then ends the Login's sessions. It answers 200 with `{ temporaryPassword }`, which no other answer holds. A Vendor that does not exist is 404 `VENDOR_NOT_FOUND`, a Keycloak that does not answer 503 `IDENTITY_SERVICE_UNAVAILABLE`, a Vendor's call 403 and a call without a token 401. `LoginStore` gains `setTemporaryPassword`; `endSessions` is the one ticket 12 added, which the merge kept, as it kept ticket 12's `giveALastingPassword` and `sessionsOf` in the tests' helpers in place of this ticket's own copies. The response class is `PasswordResetResponse` and the controller's method `resetVendorPassword`: a class named `ResetPasswordResponse` collided with the generated client's own type for an operation named `resetPassword`, which the generator then called `ResetPasswordResponse2`.
- **The Admin console.** A Vendor's page gains Reset the password, an outlined button with a key mark, in the row of its actions after Edit and Open its portal. It opens shadcn/ui's alert dialog, which asks "Reset the password of …?", naming the Vendor as it writes it, and says that the Vendor is logged out wherever it is logged in, that its password stops working and that a new temporary password is shown once. Cancel changes nothing. Reset the password, in Action Red, closes the dialog when the reset is done; the page then shows one line that the password is reset and the Vendor logged out, the temporary password and ticket 06's hand-over. A second reset replaces both. A refusal is said in the dialog, which stays open. The password lives in the page's own state, keyed by the Vendor, so it is lost on leaving and never shown on another Vendor's page.
- **Shared.** The temporary password's panel moved from the new Vendor's screen to the hand-over's feature, as `TemporaryPassword`, and its sentence now says the Vendor replaces it "at its next login", which holds after a create and after a reset. The end-to-end tests' hand-over helpers moved to `apps/e2e/src/hand-over.ts`. This ticket added the alert dialog (`36b94e7`) before ticket 12 was merged; at the merge ticket 12's copy was kept, as the coordinator asked, and the reset uses it unchanged. The dashboard's DESIGN.md names the reset in the action row, in the dialogs and in the hand-over, and the MVP spec's lists of screens and of accessibility checks name it.
- **`expectAccessible`** now waits for a transition that replaces a cancelled one (`9ed4a3d`). With the dialog open in the dark scheme, the action's colour transition was cancelled and another took its place: first the cancelled one's promise was refused, which failed the test, and then axe measured the new transition halfway and reported a contrast of neither scheme. Three runs of the reset's spec in a row then passed.

**The tests.** `pnpm integration:check` gains, in the Vendor endpoints' spec: a reset answers a new temporary password, different from the first, which the token address takes as the Login's ("not fully set up") while the first is refused as a wrong password; a Login that had chosen its own password is again required to update it, and its own password no longer logs in; a session the test opened is ended; a later read holds no password; 404 for an identifier no Vendor has and for a text that is no identifier; 503 with Keycloak paused, the Vendor's own password still working; 403 for the Vendor's own Login and 401 without a token, the password kept. Each was seen red first, answered 404 by a route that did not exist yet.

`pnpm platform:check` gains `admin-reset-password.spec.ts`, as the development Admin in a window 360 pixels wide, each line with a made-up Vendor of its own that has been through its first login:

| Line | How it is told |
|---|---|
| The Admin resets the password; the hand-over's link holds the new temporary password; a second reset gives another, which the link then holds instead | The shown password has the API's twelve characters and equals the password the Kurdish message gives after its label; after the second reset the shown password differs from the first, and the message gives the second |
| The Vendor's own password no longer logs in, and the new temporary one leads to the screen that asks for a new password | In a fresh browser, Keycloak's login screen refuses the old password, and the new one, read from the message, opens the screen that asks for a new password |
| Cancelling the confirmation leaves the old password working | No password is shown after Cancel, and the Vendor logs in with its own password and reaches its portal |
| The confirmation does not scroll sideways, and `expectAccessible` passes on it in light and in dark | `expectNoSidewaysScroll` and `expectAccessible` with the dialog open |

All four were run red first, and failed waiting for the Reset the password button after their set-up had passed.

**Fault checks**, each planted on committed work by a script that refused a dirty tree, made exact edits, ran the tests and wrote the file back; the tree was clean after each. The two API faults were run before the merges and again on the merged tip, with the same results.

| Fault | Failed |
|---|---|
| The sessions left open: `endSessions` not called by the Command | "ends a session the Login had open", and nothing else (126 passed on the merged tip) |
| The password given as a lasting one: `temporary: false` in `setTemporaryPassword` | "answers a new temporary password … while the first no longer is", whose token address then gave a token, and "… requires the Login to update its password again", which found no `UPDATE_PASSWORD` (125 passed) |
| The hand-over left holding the first temporary password: the page gave the hand-over the first reset's password while it showed the latest | The first line alone, on the message's password after the second reset; 3 passed |

**Results on the branch's tip,** after merging `accounts/integration` at `f5f98e6`, with tickets 10 and 12 in it:

- `pnpm integration:check` passes 254 tests.
- `COMPOSE_PROJECT_NAME=pc-part-pickers pnpm platform:check` passes 131 tests against the owner's running services, under the shared lock. This ticket changes nothing in Keycloak's theme or realm, so the theme mounted from the owner's checkout left nothing of it unchecked.
- `pnpm check` passes, and each commit, the two merges among them, passed `pnpm check --skip-nx-cache` from a fresh clone, installed offline, with `DOCKER_HOST` pointed at a socket that does not exist and no browser installed. `pnpm integration:check` was run on the API's commit and on each merge; the commits between them change no API code.

**Left open.** By hand in the owner's browser: the confirmation and the reset's hand-over matching DESIGN.md, and the reset's WhatsApp message reading well. On a phone once the platform is hosted, as ticket 06 already listed in the MVP spec: the hand-over and the Vendor's page used with a thumb.

### 19 October 2026: decisions left open, for the owner

Each was taken the way the ticket, the spec or DESIGN.md pointed, and none blocks the module.

- **The address and the answer.** `POST /v1/vendors/{vendorId}/password-reset`, answered 200, not 201, with `{ temporaryPassword }` alone, since the page already holds the Vendor. **My recommendation:** keep it.
- **The order of the two steps.** The password first, then the sessions. A failure between them answers 503 with the new password set and the sessions open; the Admin resets again, which makes another password and ends them. **My recommendation:** keep it: ending the sessions first would let the old password log in again before it was replaced.
- **A deactivated Vendor's password can be reset.** Nothing refuses it; its Login stays disabled until it is reactivated, and then logs in with the new temporary password. **My recommendation:** keep it, so that the Admin can prepare a Vendor's return.
- **The wording.** The button and the dialog's action say "Reset the password", the dialog asks "Reset the password of …?", and the page then says "The password is reset, and the Vendor is logged out." The action is in Action Red, as ticket 12's Deactivate is. **My recommendation:** keep them.
- **The temporary password's sentence** after a create now says "at its next login" where it said "at its first login", so that one panel serves both. **My recommendation:** keep it.

### 19 October 2026: the code review of tickets 10 to 12

The review of `accounts/integration` since `4f0c6a5` was fixed on `accounts/review-fixes`. What belongs to this ticket:

- **The order of the two steps, changed.** The spec says a call that needs Keycloak and cannot reach it "is answered 503 with `IDENTITY_SERVICE_UNAVAILABLE`, and nothing is changed". A reset gave the password first and ended the sessions second, so a failure of the second answered 503 with the old password already gone. `ResetVendorPasswordCommand` now ends the sessions first and gives the password second: a failure of the second leaves the old password working, as it was. This replaces the order recorded among this ticket's decisions above, and ADR-0009's list of orders gains the reset. The ADR also said the API changes a Login "only in a Command that changes the Vendor as well", which the reset does not; it now says a Command about that Vendor, and that the reset changes the Login alone. The code did not change for it.
- **The window that remains.** Between the two calls, a few milliseconds, whoever knows the old password can log in again and open a session, which the reset then does not end. The Admin who resets again ends it. Ending the sessions a second time after the password would close the window, at the cost of a third call, and was not done.
- **Its test.** A new line plants a password policy in the test's realm, `length(13)` in place of `length(8)`, which the twelve-character temporary password fails, so that Keycloak refuses the second call and answers every other. The reset is then answered 500 with `INTERNAL_SERVER_ERROR`, as any refusal by Keycloak is; the session the test opened is ended, the old password still logs in, and the Login is asked for nothing. It was run before the change and failed on the session still open. The old fault, the sessions left open with `endSessions` taken out, still fails "ends a session the Login had open", and now the new line too (153 passed).
- **A test across tickets.** A reset of a deactivated Vendor's password leaves its Login disabled: the new temporary password is refused at the token address with `Account disabled`, and the Vendor stays deactivated. It passed when first run; a planted fault that enabled the Login after the reset failed it, and nothing else (153 passed).
- **The endpoint's name.** `POST v1/vendors/{vendorId}/password-reset` is now `POST v1/vendors/{vendorId}/reset-password`. The workplace backend names an action on a resource by a verb after it, as its `…/{id}/approve`, `…/{id}/reject`, `…/me/publish` and `…/me/unpublish` are, and keeps nouns for what a request makes or replaces, as its `…/me/draft` and `…/images` are, and as this API's `contact-details` is. The reset is an action, as `deactivate` and `reactivate` are. `pnpm api-client:write` was run; the client's operation is still `resetVendorPassword`, and the dashboard did not change for it.
- **The port.** `LoginStore.setTemporaryPassword` takes `SetTemporaryPasswordParams`, as `rename` takes `RenameLoginParams` and the workplace backend's ports take a Params class.
- **The refusal in the confirmation** used its own copy of the Vendor form's `whyNotSaved`. It is now "The password was not reset." followed by the shared `WhyNotAnswered`, as the deactivation's is, and `features/reset-password/model/refusals.ts` is gone.
- **The end-to-end tests.** The reset's `beforeEach` logs in at the Vendor's page through `openTheVendorsPage` in `admin-vendors.ts`, which the deactivation's and the edit's tests share. The hand-over's `valuesOf` writes the left-to-right mark as the escape `‎` again, which oxfmt leaves as it is in that line, and is no longer exported.

### 19 October 2026: decisions left open, for the owner, from the code review

- **The order of a reset's two steps**, now the sessions first. **My recommendation:** keep it, as the spec's "nothing is changed" asks; the window above is the price.
- **The reset's path**, `reset-password`, a verb, as the workplace backend's actions are. **My recommendation:** keep it.
- **The refusal's words** lose "The login service cannot be reached, so the reset may not be finished. Reset the password again in a moment.", which named Keycloak in plain words, for the shared "The API refused, with 503, IDENTITY_SERVICE_UNAVAILABLE." **My recommendation:** keep the shared words, as the review asked; if plain words for that code are wanted, they belong in `WhyNotAnswered`, for every screen at once.

### 19 October 2026: the owner's decisions

The decisions were put to the owner on 19 October 2026, one at a time, each rendered in the built-in browser. The screens were captured from the real app, at 360 pixels wide, by a throwaway end-to-end test, deleted after. Each alternative was made by changing the page in that test, not the source, and laid beside the screen as built. The numbers are those of the list in ticket 13.

7. **The reset's path** (with 13): **`reset-password`, answering 200 with `{ temporaryPassword }`**, as built after the code review and as recommended.
8. **The order of a reset's two steps** (with 12): **the sessions first, then the password**, as built after the code review and as recommended.
9. **A deactivated Vendor's password can be reset**: **kept**, as built and as recommended.
10. **The reset's words**: **kept**, as built and as recommended.
11. **"At its next login" after a create too**: **kept**, as built and as recommended.
14. **The confirmation's refusal in the shared words**: **kept**, as built.

Nothing in this ticket's code changed. The reset's button moved to the second row of a Vendor page's actions, by decision 20, recorded in ticket 12.
