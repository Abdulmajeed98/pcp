# 12: Deactivating and reactivating a Vendor

**Spec:** [the accounts spec](../spec.md)

**What to build:** The Admin deactivates a Vendor from its page, after confirming (ACC-7). From that moment the API refuses every request the Vendor makes, even with a token that has not run out. Its Login is disabled and its sessions end, so it cannot log in, and its open portal shows a plain message in its language. The list and the Vendor's page mark it as deactivated. The Admin reactivates it, and it logs in again with the password it had.

No Shopper page shows a Vendor yet. The state this ticket records is what `offers` and `browse` read to hide a deactivated Vendor and its Offers.

**Blocked by:** 05, 07

**Status:** resolved

- [x] **The API.** `DeactivateVendorCommand` and `ReactivateVendorCommand`, with their endpoints, answer the Admin only:
  - Deactivating marks the Vendor first, then disables the Login and ends its sessions.
  - Reactivating enables the Login first, and marks the Vendor last.
  - Doing either again finishes one that failed halfway. When it is already done, it changes nothing and is not refused.
  - While Keycloak's administration interface cannot be reached, either is answered 503 with `IDENTITY_SERVICE_UNAVAILABLE`, and what was already done is kept.
- [x] The rule of ticket 07 gains its last part. A Vendor's own Login may act for its Vendor only while that Vendor is active. Otherwise it is answered 403 with `VENDOR_DEACTIVATED`, checked on every request. The Admin may still act for a deactivated Vendor.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] `pnpm integration:check` passes with these tests:
  - After a deactivation, the Vendor's own token, which has not run out, is answered 403 with `VENDOR_DEACTIVATED` when reading its Vendor, asking for the Caller's Vendor and changing its contact details.
  - Its Login is disabled, and a session the test opened is ended. The Admin still reads it, marked deactivated.
  - Deactivating it again changes nothing and is not refused.
  - A deactivation with the Keycloak container paused leaves the Vendor marked and refused. Once Keycloak is back, doing it again disables the Login.
  - After a reactivation, the same token is answered again. The Login is enabled, and its password is the one it had.
  - A Vendor's deactivation and reactivation are answered 403, and calls without a token 401.
- [x] Shown once and then reverted, each failing its own test: the active check removed from the rule; the Login left enabled after a deactivation; a second deactivation refused.
- [x] The theme's Kurdish messages gain the messages Keycloak's login screen shows a disabled Login. They are drafts awaiting review, marked as the others are.
- [x] **The Admin console.** A Vendor's page gains a deactivate button, which asks the Admin to confirm first, with shadcn/ui's alert dialog unless ticket 11 has already added it, and a reactivate button for a deactivated Vendor. The list and the page mark a deactivated Vendor. If ticket 09 is done, its band says when the Vendor is deactivated; otherwise ticket 09 adds that.
- [x] **The Vendor portal.** A deactivated Vendor sees a plain message in the portal's language, in the frame, with the log out button and nothing else. This happens when the portal starts and on its next call to the API when the portal is already open. Its text is in `i18n`'s dashboard set, in the three languages, drafted and marked for review, and the word list gains the word for a Deactivated Vendor.
- [x] It follows DESIGN.md, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [x] `pnpm platform:check` gains these lines, and passes on every line:
  - The development Admin deactivates a made-up Vendor while its portal is open in another browser. The Vendor's next action there shows the plain message. Its text differs between Kurdish and English.
  - Logging in as that Vendor is refused at Keycloak's login screen.
  - The list and the Vendor's page mark it as deactivated.
  - The Admin reactivates it, and it logs in with the password it had.
  - `expectAccessible` passes on the confirmation and on the message, in the light and in the dark scheme.
- [x] Shown once and then reverted, each failing on its own line: the deactivated message replaced by the screen's ordinary refusal; the list's mark taken off.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

## Comments

### 19 October 2026: completed

**What was built.**

- **The API.** `DeactivateVendorCommand` at `POST v1/vendors/{vendorId}/deactivate` and `ReactivateVendorCommand` at `POST v1/vendors/{vendorId}/reactivate`, open to `admin` only, each answering 200 with the Vendor as it now is, as the change of contact details answers. The paths follow the workplace backend's actions on a resource, such as `…/{id}/approve` and `…/publish`. Deactivating reads the Vendor, marks it deactivated when it is active, then disables its Login and ends its sessions. Reactivating enables the Login, then marks the Vendor active when it is not. The Login is disabled or enabled, and its sessions ended, whether or not that was done before, so a Command that failed halfway is finished by doing it again; one already done changes nothing, the Vendor's time of last change included, and is not refused. A Vendor that does not exist is answered 404 with `VENDOR_NOT_FOUND`. While Keycloak's administration interface cannot be reached, either is answered 503 with `IDENTITY_SERVICE_UNAVAILABLE`, and what the database already holds is kept.
- **The ports.** `VendorStore` gains `markDeactivated` and `markActive`. `LoginStore` gains `disable`, `enable` and `endSessions`, which `KeycloakLoginStore` makes with the admin client's `users.update({ id }, { enabled })` and `users.logout({ id })`. An update that names only `enabled` keeps the Login's name and its password; the tests read both. Ticket 11 may add its own way to end a Login's sessions; the two are to be made one at the merge.
- **The rule** gains its last part in `VendorAccessRule.ownVendorOf`, as ticket 07 pointed: a Vendor's own Login whose Vendor is deactivated is answered 403 with `VENDOR_DEACTIVATED`, read from the database on every request, at every Vendor endpoint and at the Caller's Vendor. The Admin's branch does not go through it, so the Admin still reads, changes and acts as a deactivated Vendor.
- `pnpm api-client:write` was run: the client has `deactivateVendor` and `reactivateVendor`. The list's test, which had marked a Vendor deactivated in the database for want of an endpoint, now calls the endpoint.
- **The theme.** The Kurdish messages gain `accountDisabledMessage`, ئەم هەژمارە ناچالاک کراوە. پەیوەندی بە بەڕێوەبەرەوە بکە., a draft marked as the others are. On Keycloak 26.8.0 a disabled Login given its right password is shown that message in the alert above the form; given a wrong one, it is shown the wrong password's text under the name field, as any Login is. Keycloak's own Arabic and English give the rest.
- **The alert dialog.** shadcn/ui's, added with `pnpm dlx shadcn@4.21.5 add alert-dialog` from the dashboard's folder; the button it rewrote was restored from its commit. It is held to the root DESIGN.md: its sentence at body size, not Mira's 12 pixels, its title at title size, both on the start side, 44-pixel buttons, a Control Edge border and the soft shadow of what floats, as wide as a phone but for its gutter, its button imported by a relative path. Its size variants, its media slot and the animations no plugin draws are left out. Ticket 11 may add the same component; the two are to be made one at the merge.
- **The Admin console.** `features/vendor-activation` puts, below "Open its portal" on a Vendor's page, an outlined Deactivate, which opens the dialog, "Deactivate this Vendor?", naming the Vendor as written and saying what deactivating does, with Cancel and a red Deactivate; and, for a deactivated Vendor, an outlined Reactivate with no dialog. After either, the page draws the Vendor as the API answered, and the list asks again. A deactivation that failed halfway shows its refusal, "The Vendor was not deactivated in full.", and keeps Deactivate for a Vendor it has already marked, so that the Admin can finish it. The list and the page already marked a deactivated Vendor (ticket 05).
- **The band.** Ticket 09 is done, so the band says, after its first sentence, that the Vendor is deactivated: `ActingAsVendor.deactivated`.
- **The Vendor portal.** The frame shows a deactivated Vendor `VendorPortalFrame.deactivated` in place of the portal, drawn as the message for a Login with no Vendor is: a top bar with the language switch alone, the sentence and Log out. It does so when the portal starts, since the Caller's Vendor is refused with `VENDOR_DEACTIVATED`, and on the portal's next call to the API when it is already open: TanStack Query's caches of queries and of changes, in `query-client.ts`, ask for the Caller's Vendor again on any refusal with that code, and that query's own refusal asks nothing again.
- **Text.** `VendorPortalFrame.deactivated` and `ActingAsVendor.deactivated` in `i18n`'s dashboard set, in the three languages, drafted for review. The word list gains Deactivated Vendor, فرۆشیاری ناچالاککراو and البائع المعطَّل, the Arabic marked to choose against غير المفعَّل.
- **DESIGN.md** records the dialog, deactivating on a Vendor's page, the band's second sentence and the message in the portal's top bar. The MVP spec names the confirmation and the message among the screens that call `expectAccessible`, and lists this ticket's checks on a phone.

**The API's tests**, in `vendor.controller.integration-spec.ts`, against a real PostgreSQL and a real Keycloak. The test utilities gain `loginWithId`; `giveALastingPassword`, which sets a Login's password as its first login does, so that the test can log in at the token address and hold a session; and `sessionsOf`.

| Ticket's line | Test |
|---|---|
| After a deactivation, the own token that has not run out is answered 403 with `VENDOR_DEACTIVATED` when reading its Vendor, asking for the Caller's Vendor and changing its contact details | The first, which also reads that the address did not change |
| Its Login is disabled, and a session the test opened is ended; the Admin still reads it, marked deactivated | The second: the session seen at Keycloak before and gone after, the Login disabled and keeping its name, the token address answering `Account disabled`, and the Vendor marked on its own and on the list |
| Deactivating it again changes nothing and is not refused | The fourth, which compares the two answers whole |
| With Keycloak paused, the Vendor is left marked and refused; once Keycloak is back, doing it again disables the Login | The fifth: 503, marked, refused, its Login still enabled, then disabled |
| After a reactivation, the same token is answered again, the Login is enabled, and its password is the one it had | The sixth, at the token address with the Login's own password |
| A Vendor's deactivation and reactivation are answered 403, and calls without a token 401 | Two lines each, which also read that nothing changed |
| Not asked for | The Admin changes a deactivated Vendor's contact details; reactivating an active Vendor changes nothing; a reactivation with Keycloak paused leaves the Vendor refused, and doing it again finishes it; 404 for a Vendor that does not exist |

The first was run before the code existed and failed on the endpoint's 404. The others were written with the code and passed when first run; the faults below show that the asked-for ones can fail.

**The new lines of `pnpm platform:check`**, in `admin-deactivate-vendor.spec.ts`, run in order on one made-up Vendor that has been through its first login, at 360 pixels:

| Ticket's line | Test |
|---|---|
| The Admin deactivates a made-up Vendor while its portal is open in another browser; its next action there shows the plain message, whose text differs between Kurdish and English; `expectAccessible` on the confirmation and on the message, in light and dark | The first: the Vendor opens its form for the contact details in its own browser, the Admin confirms on the Vendor's page, the Vendor presses Save, and the message shows with Log out and the switch, no form, no name and no link, read in Kurdish and English by the switch, with no sideways scroll |
| Logging in as that Vendor is refused at Keycloak's login screen | The second: a wrong password is refused under the name field, and the right one in the alert above the form, with another text |
| The list and the Vendor's page mark it as deactivated | The third, from the list's row to the page; the band of its portal says so too |
| The Admin reactivates it, and it logs in with the password it had | The fourth |

They were written after the code. Their first run failed for the test's own reason: the login line read a part of Keycloak's page that is not shown to a disabled Login. The faults below show that each asked-for line can fail.

**Fault checks**, each planted after the work was committed, by a script that refused a tree differing from `HEAD`, made exact edits, ran the one test file, wrote the files back and printed `git status`, which was clean after each:

| Fault | Failed |
|---|---|
| The active check removed from the rule | Three API tests, each answered 200 where 403 was expected: the token after a deactivation, and the Vendor refused after a deactivation and a reactivation with Keycloak paused. 115 passed. |
| The Login left enabled after a deactivation, the call to `disable` taken out | Three API tests, each reading the Login enabled: the Login disabled after a deactivation, the second deactivation's line and the paused line's second deactivation. 115 passed. |
| A second deactivation refused, with `VENDOR_DEACTIVATED` | Two API tests, each answered 403 where 200 was expected: the second deactivation, and the one that finishes a deactivation Keycloak did not answer. 116 passed. |
| The deactivated message replaced by the screen's ordinary refusal, the frame's branch for it taken out | The first end-to-end line, finding no message; Playwright then ran none of the other three, which follow it in order. |
| The list's mark taken off | The third end-to-end line, on the row's text; the reactivation line, which follows it, did not run, and the first two passed. |

**Results.** `pnpm integration:check` passes 220 tests. `pnpm platform:check` passes 124 tests against the owner's services with no reset, run with `COMPOSE_PROJECT_NAME=pc-part-pickers` so that its look at the database reaches the owner's services from the worktree. `pnpm check` passes. Each commit passed `pnpm check --skip-nx-cache` in a fresh clone in the scratchpad, installed offline, with `DOCKER_HOST` pointed at a socket that does not exist and no browser installed; Docker itself was not stopped, since the development services were shared with tickets 10 and 11.

**Left unchecked by the end-to-end run.** The running Keycloak's theme is mounted from the owner's checkout, so `pnpm platform:check` met Keycloak's English for a disabled Login, and the theme's new Kurdish message has not yet been seen on its screen. `pnpm integration:check` copies the worktree's theme into its container, but its tests ask the token address, which shows no theme. Once merged, the Kurdish login screen of a deactivated Vendor should show the new text.

**Left open, as the spec lists them.** By hand in the owner's browser: the confirmation, the buttons on a Vendor's page and the message matching DESIGN.md, and the Kurdish refusal at Keycloak's login screen after the merge. On a phone, once the platform is hosted, now listed in the MVP spec's "Checks on a phone wait for hosting": deactivating with its confirmation and reactivating used with a thumb, and the message and Keycloak's refusal read on a phone in Kurdish and in English.

### 19 October 2026: decisions left open, for the owner

Each was taken the way the ticket, the spec or DESIGN.md pointed, and none blocks the module.

- **The deactivated message has the language switch**, as the owner chose on 18 October 2026 for a Login with no Vendor behind it, and is drawn the same way, though the ticket says "with the log out button and nothing else". **My recommendation:** keep it, so that the message can be read in another language.
- **The message's words**: "This Vendor is deactivated, so its portal cannot be opened. Ask the Admin to reactivate it.", and the band's "This Vendor is deactivated: it cannot log in, and Shoppers do not see it.", with Kurdish ناچالاک کراوە and Arabic معطَّل and تم تعطيل. **My recommendation:** keep them, and read the Kurdish and the Arabic with the rest of LANG-7's review, the Arabic word with the word list's alternative.
- **Reactivating asks for no confirmation.** The spec asks to confirm a deactivation and a reset, each because it logs the Vendor out; reactivating logs nobody out. **My recommendation:** keep it at one tap.
- **The dialog's confirm button is red**, the dialog's one Action Red, while Deactivate on the page is outlined. **My recommendation:** keep it, as red marks what needs care.
- **The dialog's words**: "Deactivate this Vendor?", and that the Vendor "is logged out at once and cannot log in, and Shoppers no longer see it or its Offers, until you reactivate it. Its details and its password are kept." **My recommendation:** keep them; no Shopper page shows a Vendor yet, and `offers` and `browse` make the sentence true.
- **Where the buttons are**: below "Open its portal", in the column under the Vendor's name. Tickets 10 and 11 add their actions to the same page. **My recommendation:** settle the order of the page's actions once the three are merged.
- **The endpoints answer the Vendor**, with 200, where the workplace backend's actions answer 204. **My recommendation:** keep it, so that the page draws the Vendor as the API answered.

### 19 October 2026: the code review of tickets 10 to 12

The review of `accounts/integration` since `4f0c6a5` was fixed on `accounts/review-fixes`. What belongs to this ticket:

- **Finishing a half-done deactivation from the page.** The page offered Deactivate while `vendor.active || deactivate.isError`, and the error was lost when the page was left, so a Vendor marked deactivated with its Login still enabled showed only Reactivate. The page cannot tell that Vendor from one deactivated in full, so every deactivated Vendor's page now has a ghost "Deactivate again" after the outlined Reactivate, quieter than it, as DESIGN.md's ghost button is for a quiet action beside an outlined one. It opens the alert dialog, "Deactivate this Vendor again?", which says that the Vendor is marked deactivated already, that if its deactivation was not finished it may still be able to log in, that doing it again logs it out and stops it logging in, and that nothing else changes, with Cancel and a red "Deactivate again". The API already finishes a deactivation done again.
- **The dialog's rule.** The deactivation's dialog closed before its call and showed a refusal on the page, against DESIGN.md's rule for the alert dialog. It now does as the reset's does: a refusal is said in the dialog, "The Vendor was not deactivated in full." and the shared `WhyNotAnswered`, in Action Red, the action button says "Deactivating…" while the call is on its way, and the dialog closes only when the deactivation is done. A reactivation's refusal stays in the panel below the buttons, as it has no dialog. DESIGN.md's rule now says a refusal is what was not done and then why, since `WhyNotAnswered` can be two sentences, and its section on deactivating says the same as the rule.
- **The end-to-end lines.** The first line answers the first deactivation with 503 and `IDENTITY_SERVICE_UNAVAILABLE` in the browser, through Playwright's `page.route`, once, as `answerAsForALoginWithNoVendor` stands in for the API, since the tests cannot pause the shared Keycloak; the refusal is read in the dialog, `expectAccessible` passes with it shown, and the second try deactivates. A new line, after the list's and before the reactivation, reads the deactivated Vendor's buttons in order, Reactivate then Deactivate again, deactivates it again through the dialog, with `expectAccessible` on that dialog, and reads it still deactivated. The first was run before the change and failed finding no refusal in the dialog; with the dialog changed and before "Deactivate again" existed, the new line failed on the buttons, Reactivate alone, and the other three passed.
- **The page.** `VendorActivation` lost its `key={vendor.id}` and the comment on it: the page keys the Vendor's details by the Vendor already. The router's comment is wrapped at 78 columns.
- **The store.** The mark of a Vendor active or not shares `updateOneWhere` with the edits, and its helper is `storeWhetherActive` (see ticket 10's heading of the same day).
- **The MVP spec** names deactivating, reactivating and deactivating again among the Admin console's screens, and the deactivation's confirmation, with a refusal shown, and the confirmation of deactivating again among those that call `expectAccessible`.

**Results on the branch's tip,** for the review's fixes as a whole:

- `pnpm integration:check` passes 257 tests, three more than before the review: the two across tickets and the reset's order.
- `COMPOSE_PROJECT_NAME=pc-part-pickers pnpm platform:check` passes 132 tests against the owner's running services, under the shared lock, one more than before: the deactivation again. The fixes change nothing in Keycloak's theme or realm, so nothing was left unchecked for the theme mounted from the owner's checkout.
- `pnpm check` passes. Every commit that touches the API passed `pnpm integration:check` and `pnpm check` before it was made, and the others `pnpm check`.

**Left open.** By hand in the owner's browser: "Deactivate again" beside Reactivate, and the refusal in the deactivation's dialog, matching DESIGN.md.

### 19 October 2026: decisions left open, for the owner, from the code review

- **"Deactivate again" on every deactivated Vendor's page**, a ghost button after Reactivate, since the page cannot tell a half-done deactivation from a finished one. **My recommendation:** keep it; the API could later answer whether the Login is enabled, and the page show the button only then, at the cost of a call to Keycloak on every read of a Vendor.
- **Its words**: the button and the dialog's action "Deactivate again", the title "Deactivate this Vendor again?", and the sentence that the Vendor "is marked deactivated already. If its deactivation was not finished, it may still be able to log in: doing it again logs it out and stops it logging in. Nothing else changes." **My recommendation:** keep them.
- **Its dialog asks to confirm**, as every deactivation does, though doing it again logs out only a Vendor that should not be logged in. **My recommendation:** keep it, so that the button beside Reactivate cannot be taken for it by a slip.
- **DESIGN.md's rule for a refusal in the alert dialog** now reads "what was not done, then why", where it said "one Action Red sentence", since the shared words of `WhyNotAnswered` can be two sentences. **My recommendation:** keep it.

### 19 October 2026: the owner's decisions

The decisions were put to the owner on 19 October 2026, one at a time, each rendered in the built-in browser. The screens were captured from the real app, at 360 pixels wide, by a throwaway end-to-end test, deleted after. Each alternative was made by changing the page in that test, not the source, and laid beside the screen as built. The numbers are those of the list in ticket 13.

15. **The language switch on the deactivated message**: **kept**, as built and as recommended. The owner saw it beside the message without the switch, in Kurdish and English.
16. **The deactivated message's and the band's words**: **kept as drafts** for LANG-7's review, as recommended.
17. **Reactivating asks for no confirmation**: **changed**, against my recommendation. Reactivate now opens the alert dialog too, "Reactivate this Vendor?", saying that the Vendor logs in again with the password it had and that Shoppers see it again. It is confirmed with the primary button, not Action Red, as it logs nobody out. A refused reactivation is said in the dialog, which stays open, as every refusal there is, in place of the refusal panel below the buttons.
18. **The confirm button filled in Action Red**: **kept**, as built and as recommended. The owner saw it beside one outlined in red.
19. **The deactivation dialog's sentence about Shoppers**: **kept**, as built and as recommended.
20. **The order of a Vendor page's actions**: **changed**, as recommended. Two groups, each a row that wraps: Edit and Open its portal, then Reset the password with Deactivate, or with Reactivate and Deactivate again. The owner saw it beside the three rows as built.
21. **Deactivate and reactivate answer 200 with the Vendor**: **kept**, as built and as recommended.
22. **"Deactivate again" on every deactivated Vendor's page**: **kept**, as built and as recommended. The owner saw the page beside one without it.
23. **Its words**: **kept**, as built and as recommended.
24. **Its confirmation**: **kept**, as built and as recommended.
25. **DESIGN.md's rule for a refusal in a dialog**: **kept**, "what was not done, then why", as recommended.

**What changed for decisions 17 and 20.** `VendorActivation` draws its buttons alone, each through one `Confirmed` dialog, so that the Vendor's page places them in the row after Reset the password. DESIGN.md and the MVP spec say so. In `admin-deactivate-vendor.spec.ts` the line of Deactivate again checks the two groups, and the reactivation's line cancels a confirmation first, which changes nothing, then confirms, and calls `expectAccessible` on the dialog. Both failed before the change: the first on the groups, and the second, run on its own against the old component, not finding the dialog. All eight lines of the two changed files pass after.
