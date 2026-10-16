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

## Comments

### 16 October 2026: what was found out before anything was written

- **How `libphonenumber-js` 1.13.15 writes Iraqi numbers**, tried in the API's own install with `libphonenumber-js/max`:
  - An Erbil landline, `066 223 4567`, is `FIXED_LINE`. It is stored as `+964662234567` and written in Iraq's own form as `066 223 4567`: a 0, the area code 66, and the seven digits of the line as three and four. Typed as `0662234567`, `066 2234567` or `+964 66 223 4567`, it is the same number, written the same way.
  - A mobile number, `0750 123 4567`, is `MOBILE`. It is stored as `+9647501234567` and written `0750 123 4567`: a 0, the three digits of the network, and seven digits as three and four.
  - The library's metadata for Iraq: a mobile number is 7, then 3 to 9, then eight more digits. A landline is Baghdad's 1 with seven digits, or a two-digit area code (21, 23 to 25, 30, 32, 33, 36, 37, 40, 42, 43, 50, 53, 60, 62 or 66) with six or seven digits. So Erbil's 66 also takes a six-digit line: `066 223 456` is valid, and written so. Baghdad's `01 543 2100` is written with one digit before the first space.
  - Iraq's own form always starts with the 0 that is dropped after +964.
- **A box around Iraq.** From two sources:
  - OpenStreetMap's boundary of Iraq (relation 304934), whose bounding box Nominatim gives: latitude 29.0586 to 37.3807, longitude 38.7926 to 49.1068. Its east edge is out in the Gulf, because the boundary holds Iraq's waters.
  - Natural Earth's 1:10m countries, with the bounds worked out from the points of Iraq's shape: latitude 29.0631 to 37.3755, longitude 38.7745 to 48.5593.
  - The box: **latitude 29.0 to 37.4, longitude 38.7 to 49.2**, the smallest box in tenths of a degree that holds both. Erbil, by OpenStreetMap, is at 36.1912, 44.0094, inside it. Typed the wrong way round, as 44.0094, 36.1912, the latitude is above 37.4 and the longitude below 38.7, so it is outside.
  - Every place in Iraq has a longitude above 38.7 and a latitude below 37.4. So any Iraqi coordinates typed the wrong way round fall outside the box, not only Erbil's, as long as the box's north edge stays below its west edge.
- **Instagram's rule for a name.** Instagram's help pages do not state it in full. Read in the built-in browser:
  - "What can you do if an Instagram username is already claimed but seems inactive" (help.instagram.com/513717858639392) says that periods, numbers, underscores or abbreviations can be added to a name to find one that is free.
  - "How to change your Instagram profile information" (help.instagram.com/583107688369069), "Creating an Account & Username" (help.instagram.com/1642053262784201) and "About username changes between Threads and Instagram" (help.instagram.com/1748374355831404) say how to change a name, and nothing about what it may hold. The help centre's own search showed nothing.
  - Instagram's Terms of Use say that a name may not use a domain name or a URL without Instagram's written consent.
  - No page of Instagram's states the limit of 30 characters, that the letters are Latin ones, or the rules about dots that guides by others add: not first, not last and not two together. Those guides agree with the spec: 1 to 30 letters, digits, dots and underscores.
  - So the API applies the spec's rule as it is written. Once an @ or a profile's address is taken off, a name is 1 to 30 of the Latin letters a to z, the digits 0 to 9, dots and underscores, and it is kept in lower case. The rules about dots are not applied: neither the spec nor Instagram states them, and a name Instagram refuses cannot exist to be typed.
