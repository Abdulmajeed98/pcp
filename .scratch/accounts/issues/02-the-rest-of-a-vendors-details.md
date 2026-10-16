# 02: The rest of a Vendor's details, checked by the API

**Spec:** [the accounts spec](../spec.md)

**What to build:** The Admin gives a Vendor its address, phone number, WhatsApp number, map location, Instagram name and opening hours when creating it, and reads them back. Each is checked as the spec says. Each refusal names its field and a reason of its own, so that a form can show it beside the field. After this ticket a Vendor holds everything ACC-2 lists.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Before anything is written, these are found out and recorded under Comments:
  - how `libphonenumber-js` writes an Erbil landline and a mobile number in Iraq's own form;
  - a box of latitudes and longitudes around Iraq that holds the whole country and leaves out Erbil's coordinates typed the wrong way round;
  - Instagram's own rule for a name, from Instagram's help pages.
- [ ] The Vendor table gains the six details, by a generated migration.
- [ ] Every check of a detail runs before anything is made in Keycloak:
  - **Address.** Required, as written, at most 300 characters, on one or more lines.
  - **Phone number.** Required, a valid Iraqi number, a mobile or a landline, read and stored as the login phone number is, and answered in both forms.
  - **WhatsApp number.** Optional, an Iraqi mobile number, read and answered the same way.
  - **Map location.** Optional. A latitude and a longitude, both or neither, inside the box around Iraq.
  - **Instagram name.** Optional. An @ before it, or a profile's address around it, is taken off. It then follows Instagram's rule, 1 to 30 letters, digits, dots and underscores, and is stored in lower case.
  - **Opening hours.** Optional, as written, at most 300 characters, on one or more lines.
- [ ] A refusal is `NOT_VALID`, naming the field and a reason, such as `notIraqi`, `notMobile`, `outsideIraq` or `tooLong`, with a reason of its own for each other kind. The first detail that does not fit is the one named. Every reason is listed under Comments, for the forms of tickets 06 and 08.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] `pnpm integration:check` passes with these tests, through the API's HTTP surface:
  - The Admin creates a Vendor with all six details and reads them back. The phone numbers are in both forms, and an Erbil landline is taken as the phone number. The Instagram name typed with an @, and one pasted as a profile's address, are each kept bare and in lower case. The address and the opening hours are exactly as written, with Arabic script, Arabic-Indic digits and line breaks kept.
  - A Vendor created without the optional details reads them back as absent.
  - Each of these is refused with an answer that names the field and its reason, and no Vendor and no Login is made: a landline as the WhatsApp number; a phone number that is not Iraqi; a location outside Iraq; Erbil's coordinates typed the wrong way round; a latitude without a longitude; an Instagram name with a space in it, and one of 31 characters; an address of 301 characters; no address; no phone number.
- [ ] Shown once and then reverted, each failing its own test: the box around Iraq removed; a landline taken as the WhatsApp number; the @ kept on an Instagram name; the line breaks taken out of an address.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.
