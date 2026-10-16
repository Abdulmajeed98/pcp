# 12: Deactivating and reactivating a Vendor

**Spec:** [the accounts spec](../spec.md)

**What to build:** The Admin deactivates a Vendor from its page, after confirming (ACC-7). From that moment the API refuses every request the Vendor makes, even with a token that has not run out. Its Login is disabled and its sessions end, so it cannot log in, and its open portal shows a plain message in its language. The list and the Vendor's page mark it as deactivated. The Admin reactivates it, and it logs in again with the password it had.

No Shopper page shows a Vendor yet. The state this ticket records is what `offers` and `browse` read to hide a deactivated Vendor and its Offers.

**Blocked by:** 05, 07

**Status:** ready-for-agent

- [ ] **The API.** `DeactivateVendorCommand` and `ReactivateVendorCommand`, with their endpoints, answer the Admin only:
  - Deactivating marks the Vendor first, then disables the Login and ends its sessions.
  - Reactivating enables the Login first, and marks the Vendor last.
  - Doing either again finishes one that failed halfway. When it is already done, it changes nothing and is not refused.
  - While Keycloak's administration interface cannot be reached, either is answered 503 with `IDENTITY_SERVICE_UNAVAILABLE`, and what was already done is kept.
- [ ] The rule of ticket 07 gains its last part. A Vendor's own Login may act for its Vendor only while that Vendor is active. Otherwise it is answered 403 with `VENDOR_DEACTIVATED`, checked on every request. The Admin may still act for a deactivated Vendor.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] `pnpm integration:check` passes with these tests:
  - After a deactivation, the Vendor's own token, which has not run out, is answered 403 with `VENDOR_DEACTIVATED` when reading its Vendor, asking for the Caller's Vendor and changing its contact details.
  - Its Login is disabled, and a session the test opened is ended. The Admin still reads it, marked deactivated.
  - Deactivating it again changes nothing and is not refused.
  - A deactivation with the Keycloak container paused leaves the Vendor marked and refused. Once Keycloak is back, doing it again disables the Login.
  - After a reactivation, the same token is answered again. The Login is enabled, and its password is the one it had.
  - A Vendor's deactivation and reactivation are answered 403, and calls without a token 401.
- [ ] Shown once and then reverted, each failing its own test: the active check removed from the rule; the Login left enabled after a deactivation; a second deactivation refused.
- [ ] The theme's Kurdish messages gain the messages Keycloak's login screen shows a disabled Login. They are drafts awaiting review, marked as the others are.
- [ ] **The Admin console.** A Vendor's page gains a deactivate button, which asks the Admin to confirm first, with shadcn/ui's alert dialog unless ticket 11 has already added it, and a reactivate button for a deactivated Vendor. The list and the page mark a deactivated Vendor. If ticket 09 is done, its band says when the Vendor is deactivated; otherwise ticket 09 adds that.
- [ ] **The Vendor portal.** A deactivated Vendor sees a plain message in the portal's language, in the frame, with the log out button and nothing else. This happens when the portal starts and on its next call to the API when the portal is already open. Its text is in `i18n`'s dashboard set, in the three languages, drafted and marked for review, and the word list gains the word for a Deactivated Vendor.
- [ ] It follows DESIGN.md, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [ ] `pnpm platform:check` gains these lines, and passes on every line:
  - The development Admin deactivates a made-up Vendor while its portal is open in another browser. The Vendor's next action there shows the plain message. Its text differs between Kurdish and English.
  - Logging in as that Vendor is refused at Keycloak's login screen.
  - The list and the Vendor's page mark it as deactivated.
  - The Admin reactivates it, and it logs in with the password it had.
  - `expectAccessible` passes on the confirmation and on the message, in the light and in the dark scheme.
- [ ] Shown once and then reverted, each failing on its own line: the deactivated message replaced by the screen's ordinary refusal; the list's mark taken off.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.
