# 08: A Vendor changes its contact details

**Spec:** [the accounts spec](../spec.md)

**What to build:** In its portal, a Vendor changes its address, map location, phone number, WhatsApp number, Instagram name and opening hours, without asking anyone (ACC-8), and sees them at once. Standing in its shop, it fills the map location from its phone's position. A refusal is shown beside its field, in the Vendor's language. The Vendor cannot change its name, city or login phone number there, and the API refuses them if they are sent.

**Blocked by:** 06, 07

**Status:** resolved

- [x] **The API.** `EditContactDetailsCommand` and its endpoint follow the rule of ticket 07, so the Admin may call it for any Vendor and a Vendor's Login only for its own. Its Request declares the six contact details and nothing else. It replaces what it holds, clears an optional detail it leaves out, and checks each detail as ticket 02 does.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] `pnpm integration:check` passes with these tests:
  - The Vendor's own Login changes its contact details and reads them back.
  - The same request with a name, a city or a login phone number added is refused, and nothing changes.
  - The Admin changes the contact details of any Vendor through the same endpoint.
  - Another Vendor's Login is answered 403.
  - An optional detail left out is cleared.
  - A detail that does not fit is refused, naming its field and its reason.
  - A call without a token is answered 401.
- [x] Shown once and then reverted, each failing its own test: the name declared on the Request; an optional detail left out but kept.
- [x] **The portal's form**, on the details screen or on a screen of its own, built with React Hook Form. It uses ticket 06's map location field, in the Vendor's language. Every reason the API gives has a message in the three languages, shown beside its field. After a save the details screen shows the new values. The name, the city and the login phone number are not in the form.
- [x] Its text is in `i18n`'s dashboard set, in the three languages, drafted and marked for review.
- [x] It follows DESIGN.md, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [x] `pnpm platform:check` gains these lines, and passes on every line:
  - A made-up Vendor changes its address, written with Arabic text and Arabic-Indic digits, and its opening hours. The details screen shows both exactly as written.
  - The browser is given a position in Erbil, and the location button fills the coordinates from it.
  - A phone number that is not Iraqi is refused beside its field, and the refusal's text differs between Kurdish and English.
  - The form passes `checkInEveryLanguageOfTheVendorPortal` in all three languages, and does not scroll sideways.
  - `expectAccessible` passes on the form, in the light and in the dark scheme.
- [x] Shown once and then reverted, each failing on its own line: the form sending the name; a refusal shown away from its field; a control of the form given no accessible name.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

## Comments

### 18 October 2026: completed

**What was built.**

- **The API.** `PUT v1/vendors/{vendorId}/contact-details`, open to `admin` and `vendor`, runs `EditContactDetailsCommand`. It asks `VendorAccessRule` first, so the Admin may name any Vendor and a Vendor's Login only its own, and a Vendor learns nothing about another from the refusal of a detail. It then checks the six details with `ContactDetails.check`, ticket 02's check, and replaces them through `VendorStore.editContactDetails`, which takes `EditContactDetailsParams`. A detail left out, sent as null or left empty is cleared. The answer is the Vendor, as reading it answers.
- **The Request.** The six contact details moved to `ContactDetailsRequest`, which `CreateVendorRequest` extends, as `CreatePartRequest` extends `PartFieldsRequest`. `EditContactDetailsRequest` adds nothing to it, so a name, a city or a login phone number sent with it is refused by the check of undeclared fields, naming the field. `pnpm api-client:write` was run; the client has `editContactDetails` and exports `EditContactDetailsRequest`. The create's description now lists the contact details before the name, the city and the login phone number.
- **The portal's form**, on a screen of its own, `pages/edit-contact-details`, at `contact-details` under the details screen, opened by an outlined link beside the "Contact details" heading. The form is `features/contact-details-form`, built with React Hook Form and filled with the Vendor's details as they are: the address and the opening hours on several lines in their own direction, ticket 06's `MapLocationField` with its location button, the phone number and the WhatsApp number left to right on a phone's keyboard for numbers, and the Instagram name left to right. The optional details are marked so and each length limit is said. The name, the city and the login phone number are not in it. Saving sends the six details and nothing else, puts the Vendor as the API answered it in the cache and goes back to the details screen. The link and the way back are written relative to the route, so they reach the same screens under ticket 09's router.
- **Refusals.** Every reason `ContactDetails.check` gives has a message in `ContactDetailsForm.refused`, in the three languages, shown beside its field, which takes the focus. The form keeps a refusal as its message's key and says it when it is drawn, so it follows the language switch; `MapLocationField` says its own refusal at draw time too, and a refusal the form sets on it through `refusalText`. A refusal that names no detail, or an API that cannot be reached, is said above the form with `WhyNotAnsweredInThePortal`.
- **Text.** `ContactDetailsForm` and `VendorDetails.changeContactDetails` in `i18n`'s dashboard set, in the three languages, drafted for review, with the word list's زانیاریی پەیوەندی and معلومات الاتصال for "Contact details". A limit is placed by `<longest/>`, written by `formatNumber`; no message holds a number. The word list needed no new term. (The key became `VendorDetails.edit` with the owner's decisions below.)
- **Shared.** The length limits moved from `features/vendor-form` to the Vendor entity, `longest`, which both forms read. `useVendor`'s key is `vendorKey`. Setting the API's refusals beside their fields, at its third form, moved to `shared/api` as `setRefusalsBesideTheirFields`, used by the Part form, the Vendor form and this one. DESIGN.md records the link and the form; the MVP spec records relative links between the portal's screens and the form among the screens that call `expectAccessible`.

**The API's tests**, in `vendor.controller.integration-spec.ts`, against a real PostgreSQL and a real Keycloak:

| Ticket's line | Tests |
|---|---|
| The Vendor's own Login changes its contact details and reads them back | One: every detail changed, Sorani text with Arabic-Indic digits among them, the name and the login phone number kept, `updatedAt` later, the read the same |
| A name, a city or a login phone number added is refused, and nothing changes | Three, each answered 400 naming its field, the Vendor read unchanged |
| The Admin changes any Vendor's contact details through the same endpoint | One |
| Another Vendor's Login is answered 403 | One, with `VENDOR_ACCESS_DENIED`, nothing changed; and, not asked for, a Login with no Vendor answered the same, and the Admin answered 404 for a Vendor that does not exist |
| An optional detail left out is cleared | Three: left out, sent as null, left empty |
| A detail that does not fit is refused, naming its field and its reason | Eleven: no address, an address over 300 characters, a place outside Iraq, coordinates the wrong way round, a latitude alone, no phone number, a number in London, a landline as the WhatsApp number, an Instagram name with spaces, opening hours over 300 characters, an address that is not text; nothing changed in each |
| A call without a token is answered 401 | One, nothing changed |

The first was run before the endpoint existed and failed on its 404. The others passed when first run: they go through what the first had built and through tickets 02 and 07's checks. The faults below show that they can fail.

**The new lines of `pnpm platform:check`**, in `vendor-contact-details.spec.ts`, as a made-up Vendor after its first login, in a window 360 pixels wide, with a browser set to English and given a position in Erbil, and in `dashboard-languages.spec.ts`. No line quotes the portal's text: each finds a control by its id, the link by its address and the location button by a test id.

| Line | How it is told |
|---|---|
| The Vendor changes its address, in Sorani with Arabic-Indic digits, and its opening hours; the details screen shows both exactly as written; the form holds the six contact details and sends those alone | The form's controls are named the six details and no other; the PUT's body holds the six keys; the screen's text of each, read as drawn, is what was typed |
| The location button fills the coordinates from a position in Erbil | `36.1911744, 44.0094145` in the field |
| A phone number that is not Iraqi is refused beside its field, which takes the focus, and the refusal follows the language switch, different in Kurdish and English | The field marked invalid and focused, its description naming the refusal; the refusal's text changes when Kurdish is chosen, with no new save, and is the English again when English is |
| `expectAccessible` on the form, in light and dark, as opened and with a refusal and a position problem shown; no sideways scroll | As the line says |
| The form passes `checkInEveryLanguageOfTheVendorPortal` in all three languages, and does not scroll sideways | `dashboard-languages.spec.ts`, whose browser writes a number formatted for Kurdish in Arabic-Indic digits, which the helper requires; the English browser of the other file failed that guard |
| Not asked for: the form's text differs in each language | `dashboard-languages.spec.ts` |

The five lines of the first file were run before the screen existed and failed waiting for its link. The line of the language switch was added after the code review and failed first on the refusal left in English.

**Fault checks**, each planted after the work was committed, against the code as committed after the review, by a script that refused a tree differing from `HEAD` but for `.claude/` and the MVP spec, made exact edits, ran the one test file, wrote the files back and printed `git status`, which showed only those two after each:

| Fault | Failed |
|---|---|
| The name declared on the Request | The API's line of the name added alone: answered 200 for 400. 103 passed. |
| An optional detail left out but kept, the Store leaving a null column as it was | The three clearing lines, each reading the old map location, WhatsApp number, Instagram name and opening hours. 101 passed. |
| The form sending the name | The first line, on the PUT's body, which held `name`. The refusal's line and the accessibility line failed too: the API refuses the undeclared name before it reads the phone number, so no refusal stands beside the field. 1 passed. |
| A refusal shown away from its field, above the form | The refusal's line, the field not marked invalid, and the accessibility line, which waits for the same mark. 2 passed. |
| A control of the form given no accessible name, the WhatsApp number's label pointed at nothing | The accessibility line alone, by axe's `label` rule. 3 passed. |

Each was also run once before the code review, against the first commits, with the same result but for the first portal line, which then failed on not reaching the details screen.

### 18 October 2026: the code review

Two reviewers read the change, one against the repository's standards and one against this ticket and the spec. Corrected:

- **A refusal stayed in the old language** when the Vendor switched, because the form translated it when it was set. It is kept as a key and said when drawn (see above), with a test line that failed first.
- **The form's test quoted the portal's English**, which the MVP spec's rule for tests forbids, and its check that the name, the city and the login phone number are not in the form looked for their English labels, which a reworded label would pass. It finds controls by id, and checks the form's controls and the PUT's body by the details' names.
- **The Store's write took two arguments**, where every other takes one Params class. It takes `EditContactDetailsParams`.
- **Setting refusals beside their fields** was at its third form, the point ticket 06 named for the Shared layer. It moved there.
- A cast of the caught error, and a callback's name, `each`, in the Command.

Kept as they are: `DetailField` and `PhoneInput` are in this form and the Admin's Vendor form, two features that cannot import each other, at their second use. The reasons a detail may be refused are listed in the API, in each form and in the language files; the API's description does not list them, so nothing generates them. The screen's title and way back sit under `ContactDetailsForm`, and it borrows `VendorDetails.reading` and `notRead`, the same sentences. The caller's identifier and roles travel with the Vendor's identifier as plain values, as the spec asks of a use case.

**Results after the review**, against the owner's services with no reset: `pnpm platform:check` passes 112 tests, `pnpm integration:check` passes 206, and `pnpm check` and `pnpm boundaries:check` pass. Each of the four commits passed `pnpm check --skip-nx-cache` in a fresh clone in the scratchpad, installed offline, with `DOCKER_HOST` pointed at a socket that does not exist and no browser installed.

**Left open, as the spec lists them.** By hand in the owner's browser: the form matching DESIGN.md. On a phone, once the platform is hosted, now listed in the MVP spec's "Checks on a phone wait for hosting": the form used with a thumb, in Kurdish and in English, an address typed on a Kurdish keyboard among it, and its location button in the Vendor's place, over HTTPS.

### 18 October 2026: decisions left open, for the owner

Each was taken the way the ticket or DESIGN.md pointed, and none blocks the module.

- **A screen of its own**, opened by a link beside the "Contact details" heading, rather than the form on the details screen. The details screen stays a page to read, and the form gets the whole width of a phone. **My recommendation:** keep it.
- **The link's words**, "Change your contact details", زانیاریی پەیوەندییەکانت بگۆڕە and غيّر معلومات الاتصال الخاصة بك, on an outlined button. **My recommendation:** keep them, and read the Kurdish and the Arabic with the rest of LANG-7's review.
- **The sentence under the form's title**, "You change these yourself, and they are saved at once." It says ACC-8 to the Vendor. **My recommendation:** keep it.
- **A refusal for a detail that is too long** says it is too long, and the limit is said once, below the control, so that no refusal holds a number. **My recommendation:** keep it.

### 18 October 2026: the owner's decisions

The four decisions were put to the owner on 18 October 2026, one at a time, each rendered in the built-in browser. The screens were captured from the real app, at 360 pixels wide, by a throwaway end-to-end test, deleted after. Each alternative was made by changing the page in that test, not the source, and laid beside the screen as built.

- **Where the form lives.** **A screen of its own**, as built and as recommended. The owner saw it beside the form in place of the contact details' rows on the details screen, in Kurdish and English.
- **The link's words.** **"Edit"**, دەستکاری and تعديل, not the words recommended. It is short and stays beside the heading on a phone. The link is described by the heading it stands beside, `aria-describedby`, so a screen reader says "Edit, Contact details" (`8786ac4`). The first line of `vendor-contact-details.spec.ts` checks that description, and failed first without it. Where the Comments above name the link "Change your contact details", they record what was built first.
- **The sentence under the form's title.** **Kept**, as built and as recommended.
- **A refusal of a detail that is too long.** **It says the limit**, not as recommended: "The address is over 300 characters.", "The opening hours are over 300 characters." and "An Instagram name is at most 30 characters.", as the Admin's form says them, in the three languages, drafted for review. The limit is placed by `<longest/>`, written by `formatNumber`, so the messages still hold no number of their own, and the refusal is said when drawn, so it follows the language switch (`8786ac4`). A new line of `vendor-contact-details.spec.ts` refuses an address of 308 characters, in words, and finds 300 in the refusal in English and in Kurdish, the two texts different; it failed first on "The address is too long."

**A fault found while laying them out.** An address of 301 letters with no space made the page 4,141 pixels wide: the shared textarea grew sideways with its content. It now grows downwards only, at most as wide as its field, and breaks a word wider than that, `max-w-full` and `wrap-anywhere` (`cd429c5`). The Admin console's Vendor form uses the same textarea. A new line fills the address and the opening hours with one word of 120 characters each and finds no sideways scroll; it failed first, the page 1,680 pixels wide.

**Results after the decisions**, against the owner's services with no reset: `pnpm platform:check` passes 114 tests, and `pnpm check` and `pnpm boundaries:check` pass. Both commits passed `pnpm check --skip-nx-cache` in a fresh clone, installed offline, with `DOCKER_HOST` pointed at a socket that does not exist and no browser installed. The API did not change, so `pnpm integration:check` was not run.
