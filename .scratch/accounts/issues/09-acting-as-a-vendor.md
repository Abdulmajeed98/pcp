# 09: Acting as a Vendor

**Spec:** [the accounts spec](../spec.md)

**What to build:** From a Vendor's page in the Admin console, the Admin opens that Vendor's portal and does there everything the Vendor can do, with the Admin's own Login (ACC-6). Every screen shows a band that names the Vendor, as written, and links back to its page. The portal is in its own language, by the portal's own rule, with its switch. Leaving it returns the Admin console to English, left to right, with its own title.

**Blocked by:** 08

**Status:** ready-for-agent

- [ ] **Which half.** `halfFor`'s comment says that the Admin console can now also show a Vendor's portal, at an address under the Vendor's page. No other rule is made.
- [ ] The Admin console's router mounts the Vendor portal's pages under that address, in the Vendor portal's frame, with the band. Each page learns its Vendor from the address, as ticket 07 found.
- [ ] Every request made there carries the Admin's own token. Keycloak's impersonation is not used.
- [ ] **The band** is on every screen of the portal while the Admin acts as a Vendor. It names the Vendor, `AsWritten`, and links back to the Vendor's page. Its text is in `i18n`'s dashboard set, in the three languages, drafted and marked for review. If ticket 12 is done, it also says when the Vendor is deactivated; otherwise ticket 12 adds that.
- [ ] **Language.** Entering the portal sets the document's language, direction and title by the Vendor portal's rule: the language chosen with its switch in this browser, else the browser's, else Kurdish. The switch works there and is remembered in this browser. Leaving the portal sets the document back to English, left to right, with the Admin console's title.
- [ ] A Vendor's page in the Admin console gains a link that opens its portal.
- [ ] It follows DESIGN.md, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [ ] `pnpm platform:check` gains these lines, and passes on every line. Each runs as the development Admin, in a window 360 pixels wide:
  - From a made-up Vendor's page, the Admin opens its portal. The band names the Vendor on the details screen and on its form, and the document declares the portal's language.
  - The Admin changes the Vendor's opening hours there. The Vendor, logged in in another browser, sees the change.
  - The portal's switch changes the language there.
  - The band's link returns to the Vendor's page, which declares English, left to right, with the Admin console's title.
  - `expectAccessible` passes on the portal with its band, in the light and in the dark scheme.
- [ ] Shown once and then reverted, each failing on its own line: the band taken off; the document left in the portal's language after leaving; the portal's pages asking for the Caller's Vendor instead of the Vendor in the address.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
