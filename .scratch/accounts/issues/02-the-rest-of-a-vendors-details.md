# 02: The rest of a Vendor's details, checked by the API

**Spec:** [the accounts spec](../spec.md)

**What to build:** The Admin gives a Vendor its address, phone number, WhatsApp number, map location, Instagram name and opening hours when creating it, and reads them back. Each is checked as the spec says. Each refusal names its field and a reason of its own, so that a form can show it beside the field. After this ticket a Vendor holds everything ACC-2 lists.

**Blocked by:** 01

**Status:** resolved

- [x] Before anything is written, these are found out and recorded under Comments:
  - how `libphonenumber-js` writes an Erbil landline and a mobile number in Iraq's own form;
  - a box of latitudes and longitudes around Iraq that holds the whole country and leaves out Erbil's coordinates typed the wrong way round;
  - Instagram's own rule for a name, from Instagram's help pages.
- [x] The Vendor table gains the six details, by a generated migration.
- [x] Every check of a detail runs before anything is made in Keycloak:
  - **Address.** Required, as written, at most 300 characters, on one or more lines.
  - **Phone number.** Required, a valid Iraqi number, a mobile or a landline, read and stored as the login phone number is, and answered in both forms.
  - **WhatsApp number.** Optional, an Iraqi mobile number, read and answered the same way.
  - **Map location.** Optional. A latitude and a longitude, both or neither, inside the box around Iraq.
  - **Instagram name.** Optional. An @ before it, or a profile's address around it, is taken off. It then follows Instagram's rule, 1 to 30 letters, digits, dots and underscores, and is stored in lower case.
  - **Opening hours.** Optional, as written, at most 300 characters, on one or more lines.
- [x] A refusal is `NOT_VALID`, naming the field and a reason, such as `notIraqi`, `notMobile`, `outsideIraq` or `tooLong`, with a reason of its own for each other kind. The first detail that does not fit is the one named. Every reason is listed under Comments, for the forms of tickets 06 and 08.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] `pnpm integration:check` passes with these tests, through the API's HTTP surface:
  - The Admin creates a Vendor with all six details and reads them back. The phone numbers are in both forms, and an Erbil landline is taken as the phone number. The Instagram name typed with an @, and one pasted as a profile's address, are each kept bare and in lower case. The address and the opening hours are exactly as written, with Arabic script, Arabic-Indic digits and line breaks kept.
  - A Vendor created without the optional details reads them back as absent.
  - Each of these is refused with an answer that names the field and its reason, and no Vendor and no Login is made: a landline as the WhatsApp number; a phone number that is not Iraqi; a location outside Iraq; Erbil's coordinates typed the wrong way round; a latitude without a longitude; an Instagram name with a space in it, and one of 31 characters; an address of 301 characters; no address; no phone number.
- [x] Shown once and then reverted, each failing its own test: the box around Iraq removed; a landline taken as the WhatsApp number; the @ kept on an Instagram name; the line breaks taken out of an address.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

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

### 16 October 2026: completed

**Every reason, for the forms of tickets 06 and 08.** A refusal is answered 400 with `NOT_VALID`, and its `additionalInformation` holds the `field` and the `reason`. Only the first detail that does not fit is named, in the order the Vendor form asks for them: name, city, address, map location, phone number, WhatsApp number, Instagram name, opening hours, login phone number.

| Field | Reason | When |
|---|---|---|
| `name` | `missing` | Left out, null, empty or blank |
| `name` | `tooLong` | Over 100 characters |
| `city` | `missing` | Left out, null, empty or blank |
| `city` | `notInTheSet` | Not one of the set, which holds `erbil` only |
| `address` | `missing` | Left out, null, empty, or spaces and line breaks alone |
| `address` | `tooLong` | Over 300 characters |
| `mapLocation.latitude` | `missing` | A longitude without a latitude |
| `mapLocation.longitude` | `missing` | A latitude without a longitude |
| `mapLocation` | `outsideIraq` | Outside the box around Iraq, which is also what two coordinates typed the wrong way round are |
| `phoneNumber` | `missing` | Left out, null, empty or blank |
| `phoneNumber` | `notIraqi` | Not a valid Iraqi number, a mobile or a landline |
| `whatsAppNumber` | `notIraqi` | Not a valid Iraqi number |
| `whatsAppNumber` | `notMobile` | An Iraqi landline |
| `instagramName` | `notAnInstagramName` | Once an @ or a profile's address is taken off, anything but a to z, 0 to 9, dots and underscores, or nothing at all. The address of a post is one of these. |
| `instagramName` | `tooLong` | Over 30 characters, once the @ or the address is taken off |
| `openingHours` | `tooLong` | Over 300 characters |
| `loginPhoneNumber` | `missing` | Left out, null, empty or blank |
| `loginPhoneNumber` | `notIraqi` | Not a valid Iraqi number |
| `loginPhoneNumber` | `notMobile` | An Iraqi landline |
| `loginPhoneNumber` | `taken` | Another Vendor or a Login holds it |

A detail sent as the wrong kind of JSON value, a text for a latitude or a number for an address, and a field the request does not declare, inside the map location too, are refused by the request's own check, as on every endpoint: `NOT_VALID` naming each such field, with no reason. A form never sends them.

**For the owner to decide.**

- **A detail of the wrong JSON kind is refused before the others are checked, with no reason.** So a name of 101 characters sent with `address: 42` is refused naming `address`, with no reason, not `name` with `tooLong`. The spec review found this, quoting "a reason of its own for each other kind". **My recommendation:** keep it. Each detail's kind is what the description and the generated client already state, a form built on the client cannot send another, and checking kinds in the use case would mean taking every detail as `unknown`.
- **Instagram's rules about dots are not applied.** Guides by others say a name cannot start or end with a dot or hold two together. Instagram's help pages say nothing of it, and neither does the spec, so a name such as `.made..up.` is taken. It cannot be an account's name, so nobody has one to type.

**Decisions this ticket left open.**

- **The request.** `POST /v1/vendors` takes `address`, `mapLocation` as `{ latitude, longitude }` in degrees, `phoneNumber`, `whatsAppNumber`, `instagramName` and `openingHours` beside ticket 01's `name`, `city` and `loginPhoneNumber`.
- **The answer.** A Vendor is answered with `address`, `mapLocation` as `{ latitude, longitude }` or null, `phoneNumber` in both forms, `whatsAppNumber` in both forms or null, `instagramName` or null, and `openingHours` or null. An absent detail is null, as a Part's absent photo is.
- **Not given.** A detail left out and one sent as null are the same. A required detail that holds only spaces and line breaks is `missing`. An optional one left empty or blank is taken as not given, since a form left empty sends that. A map location of `{}` is no map location.
- **Ticket 01's open question.** A missing, empty or blank name, a missing or empty city, a city outside the set and a missing login phone number now have reasons of their own: `missing` and `notInTheSet`, the reason a Part's specification outside its set already has. The request checks each detail only for its kind of JSON value, and the use case checks the rest.
- **The checks of the six contact details** are one piece of the domain, `ContactDetails.check`, so that ticket 08's edit of them uses the same checks.
- **The box** is latitude 29.0 to 37.4 and longitude 38.7 to 49.2, its edges inside it. A latitude and a longitude are stored as `double precision`, and answered as they were sent.
- **The table** gains `address` and `phone_number`, both required, and `latitude`, `longitude`, `whatsapp_number`, `instagram_name` and `opening_hours`. A database rule, `vendor_map_location_whole`, keeps a latitude and a longitude together or neither. The two required columns have no default, which only a table with rows would need: no database holds a Vendor yet, since the development services wait for ticket 03.
- **Each stored detail is read again** when a Vendor is read, as ticket 01's login phone number is. A box made smaller later would answer 500 for a Vendor stored outside it.
- **Lengths** count Unicode code points, as the name's does, and the description states `maxLength` for the address and the opening hours. The Instagram name's limit is not stated there, because a profile's address is longer than the name it holds.

**How it was built.** Test first at seam 2, in slices: every detail stored and read back, an Instagram profile's address, absent details, then the refusals of the map location, of the Instagram name, and of the required details and lengths. Some tests passed when first run, because they go through code an earlier slice had already written: the phone numbers that are not Iraqi and the landline as the WhatsApp number, the optional details left out or null, the refusals of a wrong JSON kind, and every phone number in each form. The faults below show that the ones they name can fail.

**The code review.** Two sub-agents read the change, one against the repository's standards and one against this ticket and the spec. Corrected:

- The commit that added the details had the scope `api` while it also changed the generated client. A commit about several projects has no scope, so its message was amended before anything was pushed.
- The Vendor's map location was described as where its shop is, a word CONTEXT.md avoids for a Vendor. It is now where the Vendor is, in the code and the description.
- A city sent empty was refused as `notInTheSet`. It is `missing`, as a blank name is.
- Seam 2 asks for the phone numbers typed with +964, with 00964 and in Arabic-Indic digits. Only the login phone number was tested so. The phone number and the WhatsApp number now are too.
- Contact details before they are checked were `TypedContactDetails`, which reads as checked for type. They are `UncheckedContactDetails`. `text-as-written.ts` also checks phone numbers, which are not kept as written, and is now `detail-text.ts`. The WhatsApp number and the Instagram name are read by one helper, not by two copies of the same lines.

Left as they are:

- The rule that a map location is both or neither stays in `ContactDetails.check`. It names a field of the request, and a `MapLocation` always has both.
- The Instagram name stays a string. It has one form, unlike a phone number, and `readInstagramName` is its only way in.
- The database rule on the map location, the Instagram share links and the `m.` host, and the tests of a longitude without a latitude and of a post's address were not asked for. Each is small, and each guards what the ticket asks.
- Adding a detail touches about eight files, which ADR-0004's two layers make so.
- `MapLocationRequest` writes its own one-line test of whether a value was given.

**Fault checks.** Each was planted by a script that refused a dirty tree, made one exact edit, ran the Vendor tests and put the file back. `git status` was clean after every one. They were run before and after the code review, with the same results.

| Fault | Failed |
|---|---|
| The box around Iraq removed | "refuses a location outside Iraq" and "refuses Erbil's coordinates typed the wrong way round", and nothing else |
| A landline taken as the WhatsApp number | "refuses a landline as the WhatsApp number", and nothing else |
| The @ kept on an Instagram name | "keeps an Instagram name typed with an @ before it bare and in lower case", and "lets the Admin create a Vendor with every detail", whose name has an @: both were answered 400 instead of 201, since an @ is outside Instagram's rule |
| The line breaks taken out of an address | "lets the Admin create a Vendor with every detail" and "takes an address and opening hours of 300 characters, as written", whose addresses have line breaks |

**Results.**

- `pnpm integration:check` passes 168 tests, 66 of them the Vendor's (30 before this ticket), in about 29 seconds once both images are on the machine.
- `pnpm check` passes with Docker unreachable.
- Each of the four commits passes from a fresh clone, by script: an offline install, `pnpm check --skip-nx-cache` with `DOCKER_HOST` pointed at a socket that does not exist and no browser installed, and `pnpm integration:check` with Docker. The integration tests number 132, 135, 163 and 168.
- The stop of `pnpm integration:check` that ticket 01 recorded, after five of its seven test files, did not happen in the eight full runs made here.
- Migration 0008 was generated by `pnpm db:generate add-vendor-contact-details`, and `pnpm api-client:write` was run after every change to the endpoints.
