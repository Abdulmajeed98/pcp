# 06: Admin console: creating a Vendor, with the hand-over

**Spec:** [the accounts spec](../spec.md)

**What to build:** The Admin creates a Vendor in the Admin console on a phone, standing in the shop. The Admin fills in its details, taps once to fill the map location from the phone's position, and saves. The page then shows the temporary password, once, and the hand-over. The Admin chooses Kurdish, Arabic or English, each named in its own language. One link then opens a WhatsApp chat with the login phone number, from the Admin's own WhatsApp, with the dashboard's address, the login phone number and the temporary password already written. The Vendor logs in with them and is made to replace the password. This is the MVP's success criterion 2, end to end.

**Blocked by:** 04, 05

**Status:** ready-for-agent

- [ ] Before anything is written, these are read and recorded under Comments:
  - WhatsApp's click-to-chat address, and how its text is encoded;
  - the browser's position in Chromium, and how Playwright gives a page a position;
  - how Google Maps shows a place's coordinates, so that pasting them works.
- [ ] **The form.** It has an address of its own under the Vendors section, and a way to it from the list. It has every detail of a Vendor:
  - the city as a choice that holds Erbil, already chosen;
  - the address and the opening hours on several lines;
  - the optional details marked as optional;
  - each length limit shown.

  It is built with React Hook Form, as the Part form is. A refusal from the API is shown beside the field it names, for every reason ticket 02 listed.
- [ ] **The map location field.** A button fills it from the browser's position. Coordinates as Google Maps shows them, "36.19, 44.01", can be typed or pasted. A refused position, or a browser without one, is said beside the field, and the coordinates can still be typed. The field is built once, in the layer that lets this form and the Vendor portal's form of ticket 08 both use it. Its text is in `i18n`'s dashboard set, as the text of a component both halves show is.
- [ ] After a create, the page shows the temporary password once, in the mono font, beside the hand-over. Leaving the screen loses it.
- [ ] **The hand-over.** A choice of the message's language, each language named in its own language and script, with Kurdish chosen first, and one link. The link is WhatsApp's click-to-chat address, with the digits of the login phone number in its international form and the message as its text.
- [ ] **The message.** Each of these is on a line of its own: a greeting; the dashboard's address with its label; the login phone number, in Iraq's own form, with its label; the temporary password with its label; and a sentence that the Vendor will be asked to choose its own password. Each label is a message of its own and its value follows it on its line, so no message holds a value. The text is in `i18n`'s dashboard set, in the three languages, drafted and marked for review (LANG-7). The word list gains the Kurdish and the Arabic for "login phone number" and "temporary password".
- [ ] The dashboard's address in the message is the address the dashboard is served from.
- [ ] It follows DESIGN.md, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [ ] `pnpm platform:check` gains these lines, and passes on every line:
  - As the development Admin, in a window 360 pixels wide, the Admin creates a made-up Vendor in the form. The browser is given a position in Erbil, and the location button fills the coordinates from it.
  - The page then shows the temporary password and the hand-over. The link's address is WhatsApp's, with the login phone number's digits. Its text holds the dashboard's address, the login phone number and the password, each on a line of its own, and its text differs between the three languages.
  - In a fresh browser, the Vendor logs in with the login phone number and the password as the message gives them, is made to replace the password, and reaches the Vendor portal.
  - A phone number that is not Iraqi is refused beside its field.
  - The form does not scroll sideways, and `expectAccessible` passes on the form and on the hand-over, in the light and in the dark scheme.
- [ ] Shown once and then reverted, each failing on its own line: the link pointed at the WhatsApp number instead of the login phone number; the password's line left out of the Arabic message; the location button filling the latitude and the longitude the wrong way round; a control of the form given no accessible name.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
