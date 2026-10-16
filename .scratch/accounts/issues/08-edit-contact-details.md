# 08: A Vendor changes its contact details

**Spec:** [the accounts spec](../spec.md)

**What to build:** In its portal, a Vendor changes its address, map location, phone number, WhatsApp number, Instagram name and opening hours, without asking anyone (ACC-8), and sees them at once. Standing in its shop, it fills the map location from its phone's position. A refusal is shown beside its field, in the Vendor's language. The Vendor cannot change its name, city or login phone number there, and the API refuses them if they are sent.

**Blocked by:** 06, 07

**Status:** ready-for-agent

- [ ] **The API.** `EditContactDetailsCommand` and its endpoint follow the rule of ticket 07, so the Admin may call it for any Vendor and a Vendor's Login only for its own. Its Request declares the six contact details and nothing else. It replaces what it holds, clears an optional detail it leaves out, and checks each detail as ticket 02 does.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] `pnpm integration:check` passes with these tests:
  - The Vendor's own Login changes its contact details and reads them back.
  - The same request with a name, a city or a login phone number added is refused, and nothing changes.
  - The Admin changes the contact details of any Vendor through the same endpoint.
  - Another Vendor's Login is answered 403.
  - An optional detail left out is cleared.
  - A detail that does not fit is refused, naming its field and its reason.
  - A call without a token is answered 401.
- [ ] Shown once and then reverted, each failing its own test: the name declared on the Request; an optional detail left out but kept.
- [ ] **The portal's form**, on the details screen or on a screen of its own, built with React Hook Form. It uses ticket 06's map location field, in the Vendor's language. Every reason the API gives has a message in the three languages, shown beside its field. After a save the details screen shows the new values. The name, the city and the login phone number are not in the form.
- [ ] Its text is in `i18n`'s dashboard set, in the three languages, drafted and marked for review.
- [ ] It follows DESIGN.md, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [ ] `pnpm platform:check` gains these lines, and passes on every line:
  - A made-up Vendor changes its address, written with Arabic text and Arabic-Indic digits, and its opening hours. The details screen shows both exactly as written.
  - The browser is given a position in Erbil, and the location button fills the coordinates from it.
  - A phone number that is not Iraqi is refused beside its field, and the refusal's text differs between Kurdish and English.
  - The form passes `checkInEveryLanguageOfTheVendorPortal` in all three languages, and does not scroll sideways.
  - `expectAccessible` passes on the form, in the light and in the dark scheme.
- [ ] Shown once and then reverted, each failing on its own line: the form sending the name; a refusal shown away from its field; a control of the form given no accessible name.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.
