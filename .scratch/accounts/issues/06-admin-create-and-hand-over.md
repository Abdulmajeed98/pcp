# 06: Admin console: creating a Vendor, with the hand-over

**Spec:** [the accounts spec](../spec.md)

**What to build:** The Admin creates a Vendor in the Admin console on a phone, standing in the shop. The Admin fills in its details, taps once to fill the map location from the phone's position, and saves. The page then shows the temporary password, once, and the hand-over. The Admin chooses Kurdish, Arabic or English, each named in its own language. One link then opens a WhatsApp chat with the login phone number, from the Admin's own WhatsApp, with the dashboard's address, the login phone number and the temporary password already written. The Vendor logs in with them and is made to replace the password. This is the MVP's success criterion 2, end to end.

**Blocked by:** 04, 05

**Status:** resolved

- [x] Before anything is written, these are read and recorded under Comments:
  - WhatsApp's click-to-chat address, and how its text is encoded;
  - the browser's position in Chromium, and how Playwright gives a page a position;
  - how Google Maps shows a place's coordinates, so that pasting them works.
- [x] **The form.** It has an address of its own under the Vendors section, and a way to it from the list. It has every detail of a Vendor:
  - the city as a choice that holds Erbil, already chosen;
  - the address and the opening hours on several lines;
  - the optional details marked as optional;
  - each length limit shown.

  It is built with React Hook Form, as the Part form is. A refusal from the API is shown beside the field it names, for every reason ticket 02 listed.
- [x] **The map location field.** A button fills it from the browser's position. Coordinates as Google Maps shows them, "36.19, 44.01", can be typed or pasted. A refused position, or a browser without one, is said beside the field, and the coordinates can still be typed. The field is built once, in the layer that lets this form and the Vendor portal's form of ticket 08 both use it. Its text is in `i18n`'s dashboard set, as the text of a component both halves show is.
- [x] After a create, the page shows the temporary password once, in the mono font, beside the hand-over. Leaving the screen loses it.
- [x] **The hand-over.** A choice of the message's language, each language named in its own language and script, with Kurdish chosen first, and one link. The link is WhatsApp's click-to-chat address, with the digits of the login phone number in its international form and the message as its text.
- [x] **The message.** Each of these is on a line of its own: a greeting; the dashboard's address with its label; the login phone number, in Iraq's own form, with its label; the temporary password with its label; and a sentence that the Vendor will be asked to choose its own password. Each label is a message of its own and its value follows it on its line, so no message holds a value. The text is in `i18n`'s dashboard set, in the three languages, drafted and marked for review (LANG-7). The word list's Kurdish and Arabic for "login phone number", which ticket 04 added, is used, and the word list gains the Kurdish and the Arabic for "temporary password".
- [x] The dashboard's address in the message is the address the dashboard is served from.
- [x] It follows DESIGN.md, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [x] `pnpm platform:check` gains these lines, and passes on every line:
  - As the development Admin, in a window 360 pixels wide, the Admin creates a made-up Vendor in the form. The browser is given a position in Erbil, and the location button fills the coordinates from it.
  - The page then shows the temporary password and the hand-over. The link's address is WhatsApp's, with the login phone number's digits. Its text holds the dashboard's address, the login phone number and the password, each on a line of its own, and its text differs between the three languages.
  - In a fresh browser, the Vendor logs in with the login phone number and the password as the message gives them, is made to replace the password, and reaches the Vendor portal.
  - A phone number that is not Iraqi is refused beside its field.
  - The form does not scroll sideways, and `expectAccessible` passes on the form and on the hand-over, in the light and in the dark scheme.
- [x] Shown once and then reverted, each failing on its own line: the link pointed at the WhatsApp number instead of the login phone number; the password's line left out of the Arabic message; the location button filling the latitude and the longitude the wrong way round; a control of the form given no accessible name.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 18 October 2026: what was read before anything was written

**WhatsApp's click-to-chat address**, from WhatsApp's Help Center, "How to use click to chat" (faq.whatsapp.com/5913398998672934), read on 18 October 2026:

- **The address** is `https://wa.me/<number>`, where the number is "a full phone number in international format", with any zeroes, brackets or dashes left out. WhatsApp's own example is `https://wa.me/1XXXXXXXXXX`, and it names `https://wa.me/+001-(XXX)XXXXXXX` as the form not to use. So the + of the stored form goes too: `+9647501234567` is `https://wa.me/9647501234567`.
- **A written message** is `https://wa.me/<number>?text=<urlencodedtext>`, the text URL-encoded, and it "will automatically appear in the text field of a chat", so the Admin still sends it. WhatsApp's example writes a space as `%20`. `encodeURIComponent` writes a space as `%20`, a line break as `%0A`, and Kurdish and Arabic letters as their UTF-8 bytes.
- **Where it opens.** "Click to chat works on both your phone and WhatsApp Web."

**The browser's position in Chromium**, from MDN, read on 18 October 2026:

- `navigator.geolocation.getCurrentPosition(success, error, options)` gives a position with `coords.latitude` and `coords.longitude`, in degrees, and asks the person for leave first if it must ("Geolocation: getCurrentPosition() method", modified 6 April 2026). Its options are `maximumAge`, `timeout`, which is Infinity by default, and `enableHighAccuracy`.
- It is available only in a secure context. A page served from `localhost` is one: "An origin is potentially trustworthy if has a host value of localhost" ("Secure contexts"). On a server the dashboard needs HTTPS for it, which the hosting work gives.
- A failure is a `GeolocationPositionError` whose `code` is `1`, `PERMISSION_DENIED`, `2`, `POSITION_UNAVAILABLE`, or `3`, `TIMEOUT` ("GeolocationPositionError: code property"). A browser without the interface has no `navigator.geolocation`.

**How Playwright gives a page a position**, from Playwright's API reference, read on 18 October 2026:

- A browser context takes `geolocation: { latitude, longitude, accuracy? }` and `permissions`, "a list of permissions to grant to all pages in this context", among them `'geolocation'` ("Browser", `newContext`'s options; `test.use` takes the same).
- `browserContext.setGeolocation` changes the position, and "passing null or undefined emulates position unavailable". `browserContext.grantPermissions` grants permissions, optionally for one origin, and the reference warns that supported permissions "differ between browsers".

**How Google Maps shows a place's coordinates**, from Google Maps Help, "Search by latitude & longitude in Google Maps" (support.google.com/maps/answer/18539), read for a computer and for Android on 18 October 2026:

- On a computer, right-clicking the map shows "your latitude and longitude in decimal format" at the top of a pop-up, and clicking them copies them. On Android, a pin dropped by touching and holding the map shows them in the search box.
- The format Google asks for is decimal degrees, the latitude first, then a comma and a space, then the longitude: "Correct: 41.40338, 2.17403". "41,40338, 2,17403", with decimal commas, is named incorrect.
- Its search box also takes degrees, minutes and seconds, `41°24'12.2"N 2°10'26.5"E`, and degrees and decimal minutes, `41 24.2028, 2 10.4418`. Those are what a person types into Google Maps, not what it shows when copied, so the field takes decimal degrees only.

So the map location field takes two numbers in decimal degrees, the latitude first, with a comma between them and any spaces around it, which is what pasting Google Maps' copied coordinates gives. The location button writes the browser's position the same way.

### 18 October 2026: completed

**What was built.**

- **The form**, at `/vendors/new`, opened by New Vendor beside the Vendors list's heading, and shown beside the list on a desk's screen as a Vendor's page is. It is built with React Hook Form, as the Part form is, in `features/vendor-form`, and holds every detail in three groups: the Vendor (name, city), its contact details (address, map location, phone number, WhatsApp number, Instagram name, opening hours) and its Login (login phone number). The city is a choice holding Erbil, already chosen, from the Vendor entity's `cities`. The address and the opening hours are textareas, laid out in the direction of what is typed, as is the name. The optional details carry an "Optional" mark beside their label, which the control names as part of its description, and each length limit is said below its control: 100 for the name, 300 for the address and the opening hours, 30 for an Instagram name.
- **Refusals.** Every field and reason of ticket 02's table has a sentence, shown beside the field it names, which takes the focus; a refused latitude or longitude is shown beside the map location. A required detail left empty is said by the form before anything is sent, with the same sentence. `IDENTITY_SERVICE_UNAVAILABLE`, and any refusal that names no detail, are said above the form, and so is an API that cannot be reached.
- **The map location field**, `MapLocationField` in the Vendor entity, so that ticket 08's form uses it too. It takes coordinates as Google Maps writes them, and its button, "Use this phone's position", fills them from `navigator.geolocation`, written with seven decimals. While it looks it says so; a refused position, one not found, and a browser with none are each said beside the field in Action Red, and the coordinates can still be typed. Text that is not two numbers is refused there. Its text is in `i18n`'s dashboard set, `MapLocationField`, in the three languages, drafted for review.
- **After a create** the screen shows the Vendor's name, the temporary password once in Geist Mono at 1.5rem on a Sheet panel, and the hand-over, with a way to the Vendor's page. The password lives in the screen's own state: leaving it, or opening New Vendor again, loses it.
- **The hand-over**, in `features/hand-over`: the message's language as three radios, each named in its own language and script, Kurdish first and chosen, and one link, "Open the chat in WhatsApp", in a new tab so that the password stays on screen. The link is `https://wa.me/<digits>?text=<message>`, with the login phone number's digits and the message encoded by `encodeURIComponent`.
- **The message**: a greeting; "Vendor portal:" and `window.location.origin`; "Phone number:" and the login phone number in Iraq's own form; "Temporary password:" and the password; and a sentence that the Vendor will choose its own password, each on a line of its own. Each label and sentence is a message of `HandOver` in the dashboard set, in the three languages, drafted and marked for review, using the word list's ژمارەی تەلەفۆن and رقم الهاتف. The word list gains "Temporary password", وشەی نهێنیی کاتی and كلمة المرور المؤقتة, the Kurdish for "password" as the theme's Keycloak screens write it.
- **Shared.** The dashboard gains shadcn/ui's textarea, added with its command and held to DESIGN.md, and an `OptionalMark`. `@pcp/api-client` exports `CreateVendorRequest` and `CreatedVendorResponse`. The dashboard's DESIGN.md records the optional mark, the textarea, the descriptions, the map location's field, the temporary password's look and the hand-over, and the MVP spec's lists of the Admin console's screens and of the tests that call `expectAccessible` name the new ones. The API did not change.

**The new lines of `pnpm platform:check`**, in `apps/e2e/src/admin-new-vendor.spec.ts`, each as the development Admin in a window 360 pixels wide, with a browser given a position in Erbil, 36.1911744, 44.0094145:

| Line | How it is told |
|---|---|
| The Admin opens the form from the list, with Erbil chosen, fills in a made-up Vendor, fills its map location from the position, and creates it; the screen shows the temporary password, and the Vendor holds that location | New Vendor followed from the list; the city's value and its option's text; the field's value after the button, latitude first; the password twelve characters of the API's set; the Vendor's page, reached from its link, shows the coordinates and no password |
| The hand-over offers the message in the three languages, Kurdish chosen first; its link opens a chat with the login phone number, and its text holds the dashboard's address, the login phone number and the password, each on a line of its own, in a different text in each language | For each language, the link's address is `https://wa.me/964…` with the login phone number's digits, though the Vendor has a WhatsApp number of its own; each value is on exactly one line, after a label; the three texts differ; in Kurdish and Arabic the phone line, drawn right to left in the page, shows the number's groups in their own order |
| In a fresh browser, the Vendor logs in with the login phone number and the password as the Kurdish message gives them, is made to replace the password, and reaches the Vendor portal | The values read after each label's colon in the Kurdish message; the number typed key by key in Iraq's own form, with its spaces |
| A phone number that is not Iraqi is refused beside its field, which takes the focus, and nothing is created | `+44 20 7946 0958`; the field's description holds the refusal, it is marked invalid and focused, and no password is shown |
| The form does not scroll sideways and meets WCAG 2.2 level AA in light and in dark, as opened and with refusals and a position problem shown | `expectNoSidewaysScroll` and `expectAccessible` twice, the second after `setGeolocation(null)` and an empty create |
| The temporary password and the hand-over do not scroll sideways and meet WCAG 2.2 level AA in light and in dark | The same, after a create |

The first line was run before the screen existed and failed waiting for New Vendor; the second before the hand-over existed and failed waiting for the language's radios. The third, fourth and fifth passed when first run: they go through what the first two slices had already built, the API's refusals, Keycloak's theme and the form's own markup. The faults below show that they can fail. The phone line's drawn order was added after the code review and failed before its fix, on the Kurdish message drawn 8732, 750, 0753.

**Fault checks**, each planted after the work was committed by a script that refused a target differing from `HEAD`, made one exact edit, ran `src/admin-new-vendor.spec.ts`, wrote the file back and printed `git status`, which showed only this ticket's file after each:

| Fault | Failed |
|---|---|
| The link pointed at the WhatsApp number instead of the login phone number, `vendor.whatsAppNumber ?? vendor.loginPhoneNumber` given to the hand-over | The hand-over's line, on the chat's address, `wa.me/9647534601459` for `wa.me/9647589679049`; and the fresh browser's line, since the message then gave the WhatsApp number to log in with. 4 passed. |
| The password's line left out of the Arabic message | The hand-over's line alone: "one line of the Arabic message holds the password", none did. 5 passed. |
| The location button filling the latitude and the longitude the wrong way round | The first line alone, the field holding `44.0094145, 36.1911744`. 5 passed. |
| A control of the form given no accessible name, the city's label pointed at nothing | The first line, which found no control labelled City, and the form's accessibility line, by axe's `select-name` on `#vendor-city`. 4 passed. |
| Not asked for: a refusal shown above the form, away from its field | The refusal's line alone, the phone number's description holding only its own sentence. 5 passed. |

**Results.**

- `pnpm platform:check` passes 99 tests, 6 of them new, against the owner's services with no reset.
- `pnpm check` and `pnpm boundaries:check` pass. Each of the six commits passed `pnpm check --skip-nx-cache` in a fresh clone in the scratchpad, installed offline, with `DOCKER_HOST` pointed at a socket that does not exist and no browser installed.
- No password or secret from `.env` was found in the runs' output.

### 18 October 2026: the code review

Two reviewers read the change, one against the repository's standards and one against this ticket and the spec. Corrected:

- **The phone number was drawn backwards in Kurdish and Arabic.** The spec reviewer predicted from Unicode's bidirectional algorithm that the spaces between the number's groups take a right-to-left line's direction, and the new check showed "0750 123 4567" drawn as "4567 123 0750". A left-to-right mark now stands between the label's colon and the number in a right-to-left message (rule W7). It is outside the value, because the login screen's script would not take it off a copied number.
- **The fresh browser's login followed the English message.** It now follows the Kurdish one, the one chosen first, reading each value after its label in any language.
- **"Shop" in the tests' comments**, which CONTEXT.md avoids for a Vendor, and a garbled sentence. Reworded.
- **The textarea's comment said 44 pixels**, where its class and DESIGN.md say 96. Corrected, and a comment left with a short line was reflowed.
- **The required details' messages were written twice**, in the form and in the refusals. They are `missingDetailMessages`, used by both. The cities moved to the Vendor entity, the form's field is `DetailField`, since it holds the city's select too, and a refusal is paired with its detail once, without a fallback that could not be taken.

Kept as they are: `showWhyNot` is the Part form's shape again, and the "Optional" mark draws the "Needed" mark's classes, which Feature-Sliced Design keeps apart; each is a candidate for the Shared layer at a third use. The `aria-describedby` lists are built in the form and in the map location's field, which are in layers that cannot share a helper of `features/part-form`. `MapLocationField` is in the Vendor entity although it holds an interaction, because the ticket asks for one field both forms use, and an entity is the layer both features can import. Reading Arabic-Indic digits and the Arabic comma in coordinates, the link to the Vendor's page and the form's own check of required details were not asked for; each is small, and the first serves ticket 08's Vendors, who type on a Kurdish or an Arabic keyboard.

**For ticket 08.** `MapLocationField` takes a React Hook Form `Control`, which ticket 08's form, also built with React Hook Form, gives it. The field's own text is in the three languages, but the API's refusals of a map location, `outsideIraq` and `missing`, are said in the Admin console's English in `features/vendor-form`. The portal's form needs them in the three languages, as it needs every reason.

**Results after the review**, against the owner's services with no reset: `pnpm platform:check` passes 99 tests, `pnpm check` passes, and each commit passed `pnpm check --skip-nx-cache` from a fresh clone with Docker unreachable.

**Left open, as the spec lists them.** By hand in the owner's browser: the hand-over link opening WhatsApp's website with the message written in each language, and the message reading well; the Vendors screens matching DESIGN.md. On a phone, once the platform is hosted, now listed in the MVP spec's "Checks on a phone wait for hosting": the link opening the WhatsApp app, the location button in a Vendor's place in Erbil, and the form and the hand-over used with a thumb. On a server the button needs HTTPS, since the browser gives a position only to a secure context.

### 18 October 2026: decisions left open, for the owner

Each was taken the way the ticket or DESIGN.md pointed, and none blocks the module.

- **The message's wording.** The greeting says "Hello. Here are your login details for the Vendor portal.", and the dashboard's address is labelled "Vendor portal:", the name a Vendor knows it by, rather than "Dashboard:". **My recommendation:** keep it, and read the Kurdish and the Arabic with the rest of LANG-7's review.
- **The temporary password is not on a plate.** DESIGN.md kept Geist Mono for plates; the ticket asks for the mono font. It is on a Sheet panel, since a password is not a figure, and DESIGN.md now says so. **My recommendation:** keep it.
- **The button says "Use this phone's position"**, as the Admin stands in a Vendor's place with a phone. At a desk the same button gives the computer's position. **My recommendation:** keep it; at a desk the Admin pastes coordinates.
- **The hand-over link opens in a new tab**, so that the password stays on screen if WhatsApp's website opens in the same browser. **My recommendation:** keep it.
