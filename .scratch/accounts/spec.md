# Spec: Accounts

Status: resolved

This is `accounts`, the third module in the build order of [the MVP spec](../mvp/spec.md)'s capability map. It covers the requirements ACC-1 to ACC-8. This spec uses the vocabulary of [CONTEXT.md](../../CONTEXT.md) and follows [ADR-0003](../../docs/adr/0003-three-apps-one-api-keycloak.md), [ADR-0004](../../docs/adr/0004-architecture-per-app.md), [ADR-0007](../../docs/adr/0007-a-look-and-components-for-each-app.md) and [ADR-0008](../../docs/adr/0008-language-in-the-address-and-two-message-formats.md). It builds on the conventions `languages` and `catalog` recorded in the MVP spec.

On 16 October 2026 the owner confirmed the three test seams. For the second, they chose a real Keycloak, started by the tests, behind the API, over a stand-in for Keycloak's administration interface and over mocking its client.

Some words need care. A **Login** is the account in Keycloak, as CONTEXT.md defines it. A Vendor's **login phone number** is the phone number its Login is known by and logged in with. A **temporary password** is one that the platform makes for a Login, which the Vendor must replace with its own at its next login. The **hand-over** is the WhatsApp chat the Admin opens to give a Vendor its login details. A Vendor's **contact details** are its address, map location, phone number, WhatsApp number, Instagram name and opening hours: the details it may change itself (ACC-8). **Acting as a Vendor** is the Admin using a Vendor's portal on that Vendor's behalf, with the Admin's own Login (ACC-6). A **deactivated Vendor** is one the Admin has switched off (ACC-7). A Vendor's **own Login** is the one Login that belongs to it.

## Problem Statement

No Vendor exists. The platform has two Logins, the development Admin and the development Vendor, and `pnpm services:up` makes both by hand in Keycloak. The development Vendor holds the Vendor role with no Vendor behind it, because the platform has nowhere to keep a Vendor. Every later module needs Vendors: an Offer belongs to one, a Shopper contacts one, and a Referral counts for one.

The Admin cannot sign up a shop. The owner signs Vendors up in person, in their shops in Erbil, on a phone. The Admin console has a Catalog and nothing else. There is no screen to record a shop's details, no way to give it a Login, and no way to send it the login details. ADR-0003 says the Admin never uses Keycloak's own console in daily work, but nothing else can make a Login.

A Vendor cannot log in as a Vendor. Keycloak's login screen asks for a user name, and a Vendor's Login is its phone number. A Vendor has nobody to set a password for it, and nothing makes it choose its own.

The Vendor portal is a placeholder. It shows a sample of the three languages and who the caller is. A Vendor cannot see its own details, let alone change them.

The Admin cannot help a Vendor on the spot, reset a forgotten password, or stop a Vendor that should no longer be listed.

Some parts of this have a way of being wrong that looks right:

- **Phone numbers typed in many ways.** A shop's card says "0750 123 4567". A Vendor's keyboard may write "٠٧٥٠ ١٢٣ ٤٥٦٧" in Arabic-Indic digits, or "+964 750 123 4567". Keycloak compares names exactly, so a Login made from one form refuses the others, and the Vendor is told that its password is wrong.
- **A Login in two places.** Keycloak keeps the Login and the platform's database keeps the Vendor. A failure halfway through creating a Vendor can leave a Login with no Vendor, which holds the phone number so that the Admin cannot try again.
- **A token outlives a deactivation.** The API checks tokens itself, without asking Keycloak. Disabling a Login in Keycloak stops the next login, but a deactivated Vendor's token still works until it runs out.
- **Acting as a Vendor by borrowing its Login.** If the Admin logs in as the Vendor, the API cannot tell who made a change, and the Admin needs a password that only the Vendor should know.
- **A Vendor editing what only the Admin may change.** A form that sends the name along with the address would let a Vendor rename itself (ACC-8).

## Solution

The Admin gets a Vendors section in the Admin console, usable on a phone. The Admin creates a Vendor with its name, city, address, map location, phone number, WhatsApp number, Instagram name, opening hours and login phone number. Standing in the shop, the Admin fills the map location from the phone's own position with one tap. Phone numbers are accepted in any form a person types them and kept in one form.

Creating the Vendor makes its Login in Keycloak, through the API. The platform makes a temporary password and shows it to the Admin once. One tap then opens a WhatsApp chat with the Vendor's login phone number, from the Admin's own WhatsApp, with the dashboard's address, the login phone number and the temporary password already written, in Kurdish, Arabic or English as the Admin chooses. The platform sends nothing itself.

The Vendor opens the dashboard and logs in with its phone number, typed in whatever form its keyboard gives. Keycloak then makes it choose its own password, in its language, before it reaches the Vendor portal. The portal's first real screen shows the Vendor's details. The Vendor changes its contact details there without asking anyone. Its name, city and login phone number are shown and changed only by the Admin.

The Admin can reset a Vendor's password, which gives a new temporary password and the same hand-over. The Admin can open any Vendor's portal from the Admin console and do there everything that Vendor can, with the Admin's own Login, under a band that names the Vendor. The Admin can deactivate a Vendor, which ends its sessions, stops it logging in and makes the API refuse its requests at once, and can reactivate it.

The owner gets the groundwork every later module copies. The API manages Logins in Keycloak through a client of its own. One rule in the API decides which Vendor a request acts for, for every Vendor portal endpoint that `offers` and later modules add. The Vendor portal gets its router. The development Vendor is retired: the tests make Vendors through the API, as the Admin does.

## User Stories

### Creating a Vendor

1. As the Admin, I want to create a Vendor with its name, city, address, map location, phone number, WhatsApp number, Instagram name, opening hours and login phone number, so that a shop I sign up in person is on the platform the same day (ACC-2).
2. As the Admin, I want creating a Vendor to make its Login too, so that I never open Keycloak's own console (ADR-0003).
3. As the Admin, I want the platform to make the temporary password, so that I do not have to invent one on a phone in a shop.
4. As the Admin, I want to see the temporary password once, right after creating the Vendor, so that I can hand it over.
5. As the owner, I want the platform to keep no copy of a temporary password, so that nothing it stores holds a password.
6. As the Admin, I want to type a phone number as it is written on a shop's card, with spaces, with or without +964, or in Arabic-Indic digits, so that I never have to reformat it.
7. As the Admin, I want a phone number that is not an Iraqi number refused beside its field, so that a digit too many or too few cannot make a Vendor that nobody can call.
8. As the Admin, I want a landline refused as a login phone number and as a WhatsApp number, so that both can receive WhatsApp messages.
9. As the Admin, I want a login phone number that another Vendor already has refused beside its field, so that two Vendors never share a Login (ACC-1).
10. As the Admin, standing in the shop, I want to fill the map location from my phone's position with one tap, so that I do not have to find the shop on a map.
11. As the Admin, I want to paste the coordinates Google Maps shows for a place instead, so that I can set the location when I am not in the shop.
12. As the Admin, I want a location outside Iraq refused, so that a latitude and a longitude typed the wrong way round are caught.
13. As the Admin, I want to paste an Instagram profile's address, or a name with an @ before it, and have the name kept, so that I can copy it from wherever I find it.
14. As the Admin, I want the map location, the WhatsApp number, the Instagram name and the opening hours to be optional, so that a shop without one of them can still be signed up.
15. As the Admin, I want Erbil to be the city offered, so that the city is recorded now and a second city later is only a filter.
16. As the Admin, I want every refusal shown beside the field it names, as the Part form shows its refusals.
17. As the owner, I want a failure partway through creating a Vendor to leave neither a Vendor without a Login nor a Login without a Vendor, so that the Admin can simply try again.
18. As the owner, I want creating a Vendor to change nothing while Keycloak cannot be reached, and the Admin told so plainly, so that a half-made Vendor never exists.

### Handing over the login details

19. As the Admin, I want one tap to open a WhatsApp chat with the Vendor's login phone number from my own WhatsApp, with the login details already written, so that the Vendor gets them without the platform sending anything (ACC-4).
20. As the Admin, I want to choose the message's language from Kurdish, Arabic and English, each named in its own language, so that the Vendor reads it in its own.
21. As a Vendor, I want the message to hold the dashboard's address, my login phone number and my temporary password, and to say that I will choose my own password, so that I can log in without calling anyone.
22. As a Vendor, I want each value in the message on a line of its own after its label, so that a phone number or a password reads correctly inside Kurdish or Arabic text.
23. As the owner, I want the message's Kurdish and Arabic text drafted and marked for review like every other translation, so that LANG-7's review covers it.
24. As the owner, I want the platform itself to send no SMS, email or WhatsApp message, so that it adds no service that sends messages (ACC-4).

### Logging in for the first time

25. As a Vendor, I want to log in with my phone number and a password (ACC-3).
26. As a Vendor, I want the login screen to name the field "phone number" in my language, so that I know what to type. The field says "Phone number or name", as the Admin logs in with a name (the owner's choice of 19 October 2026).
27. As a Vendor, I want my phone number accepted however my keyboard writes it, in Arabic-Indic or Western digits, with spaces or dashes, starting with 0 or with +964, so that I am not refused for writing my own number my way.
28. As a Vendor, I want to be made to replace the temporary password at my first login, so that only I know my password (ACC-3).
29. As a Vendor, I want the screen that asks for my new password in Kurdish, Arabic or English, like the login screen, so that I understand what it asks.
30. As a Vendor, I want my new password to need at least 8 characters and not to be my phone number, and to be told plainly in my language when it does not fit.
31. As a Vendor, I want my Login to ask me for nothing else, no email address and no name, so that a shop without email can log in.
32. As a Vendor, I want to reach my portal as soon as my new password is set, with my Vendor's name shown, so that I know I am in the right place.
33. As the owner, I want a Login locked for a while after several wrong passwords in a row, so that guessing a Vendor's password from its public phone number is slow.

### The Vendor portal

34. As a Vendor, I want a screen showing my details, so that I can check what the platform holds about my shop.
35. As a Vendor, I want to change my contact details myself, without waiting for approval (ACC-8).
36. As a Vendor, I want my name, city and login phone number shown but not changeable by me, with a sentence saying that the Admin changes them (ACC-8).
37. As a Vendor, I want my address and opening hours kept and shown exactly as I wrote them, in any script and with any digits (LANG-4).
38. As a Vendor, I want my phone numbers shown in Iraq's own form, in Western digits, in every language (LANG-5).
39. As a Vendor, I want to fill my map location from my phone's position when I am in my shop.
40. As a Vendor, I want my map location to open in Google Maps, so that I can check that it points at my shop.
41. As a Vendor, I want the portal in Kurdish, Arabic or English, with its switch, as the placeholder had it (LANG-1, LANG-6).
42. As a Vendor, I want to log out from every screen.
43. As a Vendor, I want every screen usable on a phone 360 pixels wide, in both directions (LANG-8).
44. As a Vendor, I want a refusal shown beside the field it is about, in my language.

### Resetting a password

45. As the Admin, I want to reset a Vendor's password, so that a Vendor that has forgotten it can log in again the same day (ACC-5).
46. As the Admin, I want the reset to give a new temporary password and the same hand-over (ACC-5).
47. As the Admin, I want to reset a password I lost before handing it over, so that losing it costs nothing.
48. As the owner, I want a reset to end the Vendor's open sessions, so that whoever knew the old password is logged out.
49. As a Vendor, I want to be made to replace the new temporary password at my next login.
50. As the Admin, I want to confirm a reset before it happens, so that a slip of the thumb does not log a Vendor out.

### Acting as a Vendor

51. As the Admin, I want to open any Vendor's portal from its page in the Admin console, so that I can set a Vendor up on the spot in its shop (ACC-6).
52. As the Admin, I want to do there everything the Vendor can do, so that the Vendor needs to do nothing while I am with it (ACC-6).
53. As the Admin, I want to act as a Vendor with my own Login, so that I never need the Vendor's password.
54. As the Admin, I want a band on every screen naming the Vendor I am acting as, with a way back to the Admin console, so that I never mistake whose portal I am in.
55. As the Admin, I want the portal shown in the language chosen with its switch, so that I can show a Vendor its portal in its own language.
56. As the Admin, I want the Admin console back in English when I leave the portal.
57. As the owner, I want every request made while acting as a Vendor to carry the Admin's own Login, so that the API always knows who acted.

### Deactivating and reactivating

58. As the Admin, I want to deactivate a Vendor, so that a shop that closes or misbehaves stops being listed (ACC-7).
59. As the owner, I want a deactivated Vendor unable to log in, and its open sessions ended (ACC-7).
60. As the owner, I want the API to refuse a deactivated Vendor's requests at once, even with a token that has not run out, so that "at once" holds (ACC-7).
61. As a Vendor whose portal is open when it is deactivated, I want a plain message in my language on my next action, and not a broken screen.
62. As the owner, I want whether a Vendor is deactivated recorded, so that `offers` and `browse` hide its page and its Offers from Shoppers (CAT-7, ACC-7).
63. As the Admin, I want to reactivate a Vendor, so that it can log in again with the password it had and its details unchanged (ACC-7).
64. As the Admin, I want to confirm a deactivation before it happens.
65. As the Admin, I want to see on the list and on each Vendor's page whether it is deactivated.
66. As the owner, I want a deactivation or a reactivation that failed halfway to be finished by doing it again, so that a failure never leaves a Vendor half switched off.

### The Admin's Vendors

67. As the Admin, I want a list of every Vendor, deactivated ones among them, ordered by name, in pages, so that I can find any Vendor.
68. As the Admin, I want each row to show the Vendor's name as written, its login phone number and whether it is deactivated.
69. As the Admin, I want a page for each Vendor with all its details and its actions: edit, reset the password, open its portal, and deactivate or reactivate.
70. As the Admin, I want the map location on that page to open in Google Maps.
71. As the Admin, I want to edit every detail of a Vendor, its name, city and login phone number among them (ACC-8).
72. As the Admin, I want changing a Vendor's login phone number to change what it logs in with and to keep its password.
73. As the Admin, I want the console's frame to offer the Catalog and the Vendors as its two sections.

### Who may do what

74. As the owner, I want only the Admin able to create Vendors, list them, change a name, a city or a login phone number, reset a password, deactivate and reactivate (ACC-2 to ACC-8).
75. As the owner, I want a Vendor's Login able to read and change only its own Vendor, so that no Vendor can see or change another, even by guessing an address.
76. As the owner, I want a Login that holds the Vendor role and has no Vendor behind it refused, with a plain message in the portal, so that a Login made by hand in Keycloak's console cannot act as anyone.
77. As the owner, I want no Vendor endpoint to answer a call without a token.

### The groundwork for later modules

78. As the owner, I want the API to reach Keycloak's administration interface through a client of its own that may manage the realm's Logins and nothing more, so that the platform's own console never needs Keycloak's administrator.
79. As the owner, I want that client's secret generated into `.env` by `pnpm services:up` and never committed.
80. As the owner, I want the API to start while Keycloak cannot be reached, and to answer a call that needs Keycloak with 503, changing nothing.
81. As the owner, I want the rule for which Vendor a request acts for written once, so that every Vendor portal endpoint `offers` adds uses the same rule.
82. As the owner, I want the Vendor portal to have a router, so that `offers` adds screens to it the way the Admin console adds them.
83. As the owner, I want the development Vendor retired and the tests to make made-up Vendors through the API, so that the tests exercise the path a real Vendor takes.
84. As the owner, I want `pnpm integration:check` to run the API against a real Keycloak started from the repository's realm file, so that a mistake about Keycloak's behaviour fails a test.
85. As the owner, I want `pnpm services:check` to say whether the API's client can manage Logins.

### Checks and housekeeping

86. As the owner, I want CONTEXT.md to gain the terms this module introduces, before code uses them.
87. As the owner, I want the word list to give the Kurdish and the Arabic word for each new term a Vendor reads.
88. As the owner, I want the MVP spec to record the conventions this module sets, so that `offers` copies them.

## Implementation Decisions

### What this module is and is not

- It builds Vendors and their Logins: creating, listing, reading and editing Vendors, temporary passwords and the hand-over, resetting a password, acting as a Vendor, deactivating and reactivating. It covers the API's endpoints, the Admin console's Vendors section, the Vendor portal's first real screen and the realm's changes.
- It builds the groundwork the Vendor portal needs: its router, the rule for which Vendor a request acts for, and the API's client for Keycloak's administration interface.
- **ACC-7's Shopper side.** No Shopper page shows a Vendor yet. This module records whether a Vendor is deactivated. `offers` and `browse` hide a deactivated Vendor's Offers and page, as CAT-7 and BRW-4 already say.
- **What Shoppers see of a Vendor** (BRW-4) is `browse`'s. This module keeps what that page shows and decides how each field is stored.
- **Depends on `languages` and `catalog`.** It builds on the dashboard's two halves, its language set-up, its components and the conventions `catalog` recorded: Effect's `Either`, structured errors, paging, migrations and the tests against a real database. No ticket waits on another module.

### Logins and Vendors

- Keycloak keeps each Login: its name, its password and whether it may log in. The platform's database keeps each Vendor. Only two things are in both: the link between them, and the login phone number, which is a detail of the Vendor and the Login's name. The API changes the two copies together.
- A Vendor holds the identifier of its own Login, which is the token's subject and the Caller's identifier. No two Vendors hold the same Login (ACC-1).
- A Vendor's Login is named by its login phone number, in the one stored form below. The workplace's Logins are named the same way.
- A Vendor's Login holds the `vendor` role and no other.
- Only the API changes a Vendor's Login, and only through a Command that changes the Vendor as well. Each such Command makes its two changes in the order that is safe if the second fails, and puts the first back where it can:
  - **Creating** makes the Login, then the Vendor. When the Vendor cannot be stored, the Login is deleted again.
  - **Changing the login phone number** renames the Login, then the Vendor. When the Vendor cannot be stored, the Login's name is put back.
  - **Deactivating** marks the Vendor first, so that the API refuses it at once, and then disables the Login and ends its sessions.
  - **Reactivating** enables the Login first and marks the Vendor last, so that the API goes on refusing it until both are done.
  - A deactivation or a reactivation that fails halfway is finished by doing it again. Doing either a second time when it is already done changes nothing and is not refused.
- When the step that puts a Login back fails too, the API logs the Login's identifier and answers that the identity service is unavailable. Further Notes names this as a known limit.
- A new ADR records this split, and acting as a Vendor (below).

### Phone numbers

- `libphonenumber-js` reads, checks and writes every phone number. It is the most widely used phone number library for JavaScript: about 28.3 million downloads a week, against 1.8 million for `google-libphonenumber`, the port of Google's own library, in the week to 16 October 2026.
- A number is read as Iraqi unless it says otherwise. Before it is read, Arabic-Indic and Eastern Arabic-Indic digits become Western digits, and spaces, dashes, dots and brackets are dropped. "0750 123 4567", "+964 750 123 4567", "00964 750 123 4567" and "٠٧٥٠ ١٢٣ ٤٥٦٧" are the same number.
- A number is stored in one form, the international one with no spaces: `+9647501234567`.
- The API answers each number in two forms: the stored one, for links, and the one a person reads, in Iraq's own form, "0750 123 4567". So no frontend needs the library.
- The phone number must be a valid Iraqi number, a mobile or a landline. The WhatsApp number and the login phone number must be valid Iraqi mobile numbers.
- Every frontend shows a phone number marked `AlwaysEnglish`, so that a Kurdish or an Arabic sentence cannot reorder its groups of digits.

### The other details of a Vendor

- **Name.** Required, as written, at most 100 characters. Names need not be unique. It is shown `AsWritten`.
- **City.** Required. One of a fixed set in code, which holds Erbil only. Its name is a shared term in the three languages. A second city is a change to the set.
- **Address.** Required, as written, at most 300 characters, on one or more lines. It is shown `AsWritten`, with a Vendor's own digits as written.
- **Map location.** Optional. A latitude and a longitude, both or neither, inside a box around Iraq, so that the two typed the wrong way round are refused. A form fills it from the browser's own position with one tap, or takes "36.19, 44.01" as Google Maps shows a place's coordinates. A frontend opens it with a Google Maps address that searches for those coordinates, which is Google's documented way to link to a place. No map is embedded.
- **Phone number.** Required.
- **WhatsApp number.** Optional. A Vendor without one gets no "send on WhatsApp" button in `sharing`.
- **Instagram name.** Optional. Instagram's own rule: 1 to 30 letters, digits, dots and underscores. An @ before it, or a profile's address around it, is taken off. It is stored in lower case, as Instagram treats names, and shown `AlwaysEnglish`.
- **Opening hours.** Optional, as written, at most 300 characters, on one or more lines. It is plain text, as LANG-4 says, and is shown `AsWritten`.
- **Login phone number.** Required, a mobile number, unique among Vendors.
- **Active.** Every Vendor is active when it is created.
- A Vendor also records when it was created and when it last changed. Nothing else is recorded about its changes.
- A Vendor is never deleted. Deleting a Vendor is out of scope, as deleting a Part is.

### Temporary passwords

- The API makes each temporary password, with a cryptographically secure generator. It is 12 characters of lower-case letters and digits, without those that look alike (0, o, 1, l and i), so that a Vendor can type it on a phone without the shift key.
- It is given to Keycloak as a temporary credential, and the Login is required to update its password. Keycloak then asks for a new password at the next login, before anything else.
- It is in the answer to the create or the reset, and nowhere else. No later answer holds it, and the platform's database never does.
- The Admin console shows it once, in the mono font, beside the hand-over. Leaving the screen loses it, and a reset makes another.
- A temporary password does not expire. Expiring an unused one is out of scope.

### The hand-over

- After a create or a reset, the Admin console shows the hand-over: a choice of the message's language, each language named in its own language and script as the switch names them, with Kurdish chosen first, and one link that opens WhatsApp.
- The link is WhatsApp's own click-to-chat address, with the login phone number's digits and the message as its text. On a phone it opens the WhatsApp app, and on a computer WhatsApp's website.
- It opens a chat with the login phone number, because that is the person who logs in. The Vendor's WhatsApp number may be the shop's, answered by its staff.
- The message holds, each on a line of its own, a greeting, the dashboard's address, the login phone number with its label, the temporary password with its label, and a sentence saying that the Vendor will be asked to choose its own password.
- The Vendor reads it, so its text is in `i18n`'s dashboard set, in the three languages, drafted and marked for review (LANG-7). Each label is a message of its own, and the value follows it on its line, so that no message holds a value and no message is formatted by i18next. The dashboard set's rules are kept: no double braces and no number formatting.
- The dashboard's address in the message is the address the dashboard is served from.

### The realm

These change the realm file. Keycloak imports it only into a realm that does not exist, so the owner's services are reset once (see Further Notes).

- **The API's client.** A confidential client for the API, with a service account and no login through a browser. Its service account holds the fewest of Keycloak's realm-management roles with which the API can find, create, rename, enable, disable and delete a Login, set its password, give it the `vendor` role and end its sessions. Its secret is not in the realm file: the file names an environment setting that Keycloak reads when it imports the realm, and the Compose file gives it from `.env`. `pnpm services:up` writes a random secret into `.env` at the first start, as it writes each password.
- **No email and no names.** The realm's user profile asks a Login for no email address, first name or last name, so that Keycloak never sends a Vendor to a screen that asks for them.
- **Renaming a Login.** The realm allows a Login's name to be changed, which Keycloak refuses otherwise, and its user profile lets only `admin` change it, so that a Vendor cannot rename its own Login in Keycloak's account pages. Ticket 10 makes this change, and makes it in the owner's running realm once through the administration interface, with no reset.
- **A password policy.** A Login's own password has at least 8 characters and is not its name. Keycloak's own messages say so on the screen that asks for a new password.
- **Guessing is slow.** Keycloak's brute-force detection is on. After a few wrong passwords in a row a Login is locked for a time that grows with each further failure, up to 15 minutes. The exact numbers are the ticket's.
- **The login screen.** Its name field is labelled "Phone number or name" in the three languages, through the theme's messages, as a Vendor's Login is named by its phone number and the Admin's by a name. The refusal of a wrong one names both. The owner chose this on 19 October 2026, over "phone number" alone. A script the theme adds turns what is typed there into the stored form before the form is sent, when it looks like a phone number: Arabic-Indic and Eastern Arabic-Indic digits become Western digits, spaces, dashes, dots and brackets go, and a leading 0, 00964 or 964 becomes +964. A name with a letter in it, such as the development Admin's, is left alone. No Keycloak template is copied into the theme.
- **Sorani text.** The theme's Kurdish messages gain everything the screens a Vendor now meets show: the screen that asks for a new password, its errors, the password policy's messages, and the messages for a disabled and for a locked Login. Keycloak ships the Arabic and the English text.
- The `pcp-api` audience the API checks keeps its name. The API's client may take the same name.

### Who may do what

- **The Admin only:** creating a Vendor, listing Vendors, editing every detail of a Vendor, resetting a password, deactivating and reactivating. A Vendor's call is answered 403.
- **The Admin, or the Vendor's own Login:** reading a Vendor and changing its contact details. The rule is written once, in the API's domain, and every Vendor portal endpoint uses it, those of `offers` and later modules among them:
  - a Caller that holds the `admin` role may act for any Vendor, active or deactivated;
  - a Caller that holds only the `vendor` role may act only for the Vendor whose Login it is, and only while that Vendor is active;
  - a Vendor named in the address that is not the Caller's own is answered 403, so that a Vendor learns nothing about another Vendor's identifier;
  - the Caller's own Vendor, when deactivated, is answered 403 with `VENDOR_DEACTIVATED`. This is checked on every request, so a deactivated Vendor is refused at once, whatever its token says.
- **A Vendor's Login only:** asking for the Caller's own Vendor, which the Vendor portal does when it starts. A Login with no Vendor behind it is answered 404 with `VENDOR_NOT_FOUND`.
- A call without a token is answered 401, as every endpoint but the public ones already is.
- `core` gains a structured error for a refused access, answered 403 with a code of its own, beside `NotFoundError` and `NotValidError`.

### Acting as a Vendor

- The Admin acts as a Vendor in the API, with the Admin's own Login. Every Vendor portal endpoint names its Vendor in its address, and the rule above lets the Admin name any Vendor. Keycloak's own impersonation is not used. It would end the Admin's own session, and the API would see the Vendor as the Caller.
- The Caller is always the Login the request was made with, so a later module that records who changed something can tell the Admin from the Vendor.
- In the dashboard, the Admin console opens a Vendor's portal at an address of its own, under the Vendor's page. It shows the Vendor portal's own screens in the Vendor portal's frame, with a band on every screen that names the Vendor, as written, and links back to the Vendor's page in the Admin console.
- The band is in the portal's language, from the language files, because the Vendor may be reading over the Admin's shoulder.
- While acting as a Vendor the dashboard follows the Vendor portal's language rule: the language chosen with its switch in this browser, else the browser's, else Kurdish. The switch works and is remembered in this browser, which is the Admin's own. Leaving the portal returns the document to English, left to right, and to the Admin console's title.
- The Admin may act as a deactivated Vendor, and the band says that it is deactivated.

### The API's endpoints

All paths begin with `v1`. The names here describe them, and the exact paths are the tickets' to choose.

| Endpoint | Who may call it | What it does |
|---|---|---|
| The Vendors | Admin | One page of Vendors, active and deactivated, ordered by name |
| Create a Vendor | Admin | Creates the Vendor and its Login, and answers the temporary password once |
| A Vendor | Admin, the Vendor's own Login | Every detail of one Vendor, and whether it is active |
| The Caller's Vendor | Vendor | The Vendor whose Login the Caller is |
| Edit a Vendor | Admin | Replaces every detail, the name, city and login phone number among them |
| Edit contact details | Admin, the Vendor's own Login | Replaces the Vendor's contact details and nothing else |
| Reset a password | Admin | Gives the Login a new temporary password, ends its sessions, and answers the password once |
| Deactivate a Vendor | Admin | Marks the Vendor deactivated, disables its Login and ends its sessions |
| Reactivate a Vendor | Admin | Enables the Login and marks the Vendor active |

- A Vendor that does not exist is answered 404 with `VENDOR_NOT_FOUND` when the Admin asks for it. A Vendor's Login that names any Vendor but its own is answered 403, whether that Vendor exists or not.
- An edit replaces what it holds and clears an optional detail it leaves out, as a Part's edit does.
- The request for the contact details declares those six details only. A name, a city or a login phone number sent with it is refused by the API's existing check of undeclared fields, so a Vendor cannot change them (ACC-8).
- A detail that does not fit is answered with `NOT_VALID`, naming the field and a reason of its own, such as `notIraqi`, `notMobile`, `outsideIraq`, `tooLong` or `taken`, so that each form shows it beside its field. The first detail that does not fit is the one named, as with a Part's specifications.
- While Keycloak's administration interface cannot be reached, a call that needs it is answered 503 with `IDENTITY_SERVICE_UNAVAILABLE`, and nothing is changed.
- `pnpm api-client:write` is run after each endpoint, as the MVP spec already requires.

### The API's database

- One table for Vendors, made by a generated migration. The Login's identifier and the login phone number are each unique.
- The list is ordered by name, with the identifier breaking ties so that paging is stable, in `core`'s paging shape.

### Domain conventions this module sets

- An entity `Vendor`, with getters, and its port `VendorStore`, implemented in the infrastructure layer over the database.
- A port for Logins, `LoginStore`, an abstract class in the domain layer, implemented in the infrastructure layer over Keycloak's administration interface. It finds, creates, renames, enables, disables and deletes a Login, sets a temporary password, and ends a Login's sessions. Its failures are `Either` values, as a database Store's are.
- The Keycloak side uses `@keycloak/keycloak-admin-client`, Keycloak's own client for its administration interface, which the workplace's backend uses. It is wrapped in the API's infrastructure, and no other code imports it.
- The use cases are Commands and Queries, each with its own Input and Output: `CreateVendorCommand`, `EditVendorCommand`, `EditContactDetailsCommand`, `ResetVendorPasswordCommand`, `DeactivateVendorCommand`, `ReactivateVendorCommand`, `ListVendorsQuery`, `ReadVendorQuery` and `ReadCallersVendorQuery`. Their names are the tickets' to refine.
- The rule for which Vendor a request acts for is one piece of the domain, handed the Caller's identifier and roles as plain values by the controller, as every use case is.
- **Settings.** The API gains settings for Keycloak's administration interface: where Keycloak is, the realm, the API's client and that client's secret. The secret is the API's second setting with no default, and the API refuses to start without it and names it. In development it reaches each API target that needs it through that target's committed env file, from `.env`, as the database password does. The settings are separate from `KEYCLOAK_ISSUER`, so that the tests can check tokens against the stand-in while they manage Logins in a real Keycloak. Their names keep the repository's unprefixed style, and are the ticket's to settle.
- The API connects to Keycloak's administration interface only when a call needs it, and starts while Keycloak cannot be reached, as it already starts without the database and without the realm's keys.

### The dashboard

- **Which half.** `halfFor` is extended, and no other rule is made. A Login that holds the `admin` role gets the Admin console, which can now also show a Vendor's portal at an address under that Vendor's page. Every other Login gets the Vendor portal, which first asks the API for the Caller's own Vendor.
- **The Vendor portal's router.** The Vendor portal gets a React Router in data mode, declared in the App layer as the Admin console's is, and made after the login. Its screens are pages the Admin console's router also mounts when the Admin acts as a Vendor. The Vendor whose portal is shown reaches each screen from the route, so the same page serves both.
- **The details screen.** The Vendor portal's first real screen shows the Vendor's details. The Vendor changes its contact details in a form on it, or on a screen of its own. Its name, city and login phone number are shown, with a sentence that the Admin changes them. Every text is in the three languages, in `i18n`'s dashboard set, with the words for new terms from the word list.
- **The placeholder goes.** The details screen replaces the Vendor portal's placeholder page and its sample, as the placeholder's own comment says. What the sample proved in the portal is proved on the details screen where the screen has the same kind of text: text as written, text always in English, and Western digits. The details screen has no sentence that counts and no Category name. Until `offers` adds a screen that does, `pnpm check`'s comparison of the language files is the only check of the dashboard's plural forms. The Shopper app's placeholder keeps its sample until `browse`.
- **The frame.** The Vendor portal's frame shows the Vendor's name, as written, and a log out button beside the language switch. A Login with no Vendor behind it, and a deactivated Vendor, see a plain message in the portal's language in the frame, with the log out button and nothing else.
- **The Admin console.** It gains a Vendors section: the list, a Vendor's page, the form for a new Vendor and the form for editing one, in English, as `languages` decided. The frame's top bar gains a menu of its two sections, the Catalog and the Vendors. Resetting a password and deactivating each ask the Admin to confirm first, because each logs the Vendor out.
- **The map location.** Both forms have a button that fills it from the browser's position. A refusal, or a browser without a position, is said beside the field, and the coordinates can still be typed.
- **Design.** The screens are built to the dashboard's look, Rate Board, and to the root DESIGN.md, with the dashboard's own shadcn/ui components, at 360 pixels wide first and with logical classes only. Any component added is held to the root DESIGN.md as `catalog` recorded.
- Tokens stay in memory only, and a refusal from the API is shown and never answered by starting a login, as before.

### The development Vendor

- It is retired. `pnpm services:up` no longer creates it, `.env.example` no longer lists its two settings, and neither `pnpm services:check` nor `pnpm platform:check` asks for it. A value already in an owner's `.env` is left there and read by nothing.
- The reset this module needs removed the Login, but `pnpm services:up` made it again before it was retired. Ticket 04 deletes that one Login from the owner's Keycloak by hand, through Keycloak's administration interface, once no test uses it.
- The end-to-end tests make a made-up Vendor through the API as the development Admin, as they make a made-up Part. A test that needs the Vendor portal then logs in as that Vendor at Keycloak's login screen and replaces its temporary password, the path a real Vendor takes.
- During development the owner opens the Vendor portal by creating a Vendor in the Admin console, or by acting as one.
- The development Admin stays as it is.

### Commands this module changes

- `pnpm services:up` writes the API's client secret into `.env` at the first start, and adds it to an existing `.env` that lacks it. It no longer creates the development Vendor.
- `pnpm services:check` gains a line saying that the API's client can log in to Keycloak and find the realm's Logins. It loses the development Vendor's line.
- `pnpm integration:check` starts a Keycloak container beside PostgreSQL, from the repository's realm file, once for the run.
- `pnpm platform:check` no longer asks `.env` for the development Vendor, and asks for the API's client secret.

### Versions

- `@keycloak/keycloak-admin-client` at the newest release that pnpm's minimum release age allows, in the 26.8 line that matches Keycloak 26.8.0. It was 26.8.1, of 13 October 2026, when this spec was written. It is published as an ES module only, so Jest's shared preset names it, and the packages it needs, among those SWC transforms, as it names `jose`.
- `libphonenumber-js` at the newest release pnpm allows. It was 1.13.15, of 8 October 2026.
- A Keycloak container for the tests is the same image and version the development services run.

### Recording

- **CONTEXT.md** gains these terms, under Logins and under Vendors and offers, before any code uses them. Each avoids the words listed:
  - **Login phone number**: the phone number a Vendor's Login is known by and logged in with. _Avoid_: username, user name.
  - **Temporary password**: a password the platform makes for a Login, which the Vendor must replace with its own at its next login. _Avoid_: initial password, one-time password, OTP.
  - **Contact details**: a Vendor's address, map location, phone number, WhatsApp number, Instagram name and opening hours, which the Vendor may change itself. _Avoid_: profile, shop info.
  - **Acting as a Vendor**: the Admin using a Vendor's portal on its behalf, with the Admin's own Login. _Avoid_: impersonation, logging in as.
  - **Deactivated Vendor**: a Vendor the Admin has switched off, which is hidden from Shoppers and cannot log in until the Admin reactivates it. _Avoid_: suspended, banned, disabled, deleted.
- **The word list** gains the Kurdish and the Arabic word for each of these that a Vendor reads, drafted and marked for review.
- **A new ADR** records that Vendors are kept in the platform's database and their Logins in Keycloak, changed only through the API in a safe order, and that the Admin acts as a Vendor in the API with its own Login, not through Keycloak's impersonation.
- **The MVP spec** gains the conventions this module sets, as `catalog`'s did: the Logins and the rule for which Vendor a request acts for, phone numbers, the hand-over, the realm's changes, the Vendor portal's router, the retired development Vendor, and the changed commands and settings. It gains the checks on a phone this module leaves.

## Testing Decisions

A good test of this module asks the platform a question from the outside and reads the answer. It calls an endpoint, opens a screen, or logs in at Keycloak's screen. It then reads what came back: the answer's body and status, what the page shows, what a link holds, and what Keycloak says about a Login through its own administration interface. It does not ask which Store method ran, which SQL was sent, which call the admin client made or how a component is built. All of those may change while the Admin and the Vendor see the same thing.

There are three seams, the same three as `catalog`'s. The owner confirmed them on 16 October 2026. The second gains a real Keycloak behind the same HTTP surface.

### Seam 1: the repository root, through `pnpm check`

- **Migrations.** The committed migrations make every change the schema holds.
- **The description.** The committed OpenAPI document and the generated client match the API.
- **The language files.** The details screen's text, the band and the hand-over's lines are in all three languages, with no value inside a message and no number formatting.
- **Still true.** Everything `pnpm check` proved before still passes, with Docker stopped and no browser installed. The API's tests of its HTTP surface that need neither the database nor Keycloak still pass, which shows that the API starts without either.

Each line is seen to fail once, by a deliberate fault that is then reverted: a column added to the Vendors' schema with no migration, an endpoint added without `pnpm api-client:write`, and a hand-over line missing from the Arabic file.

### Seam 2: the API from the outside, over a real PostgreSQL and a real Keycloak

`pnpm integration:check` starts a PostgreSQL container and a Keycloak container, each once for the run. Keycloak imports the repository's realm file, with a secret for the API's client that the test gives it. The API is built as `createTestAppWithLogins` builds it, with its administration settings pointed at that Keycloak. The test talks to the API over HTTP, with tokens for any Login from the existing stand-in, whose subject is the identifier of a Login the API made. What a Login holds in Keycloak is read through Keycloak's administration interface, as Keycloak's own administrator of the container. Whether a password is a Login's is read at the container's token address, through a client the test adds to its own container's realm for that purpose and never to the realm file. The tables are emptied, and the test's Logins removed, between tests. Nothing is mocked.

**Creating**

- The Admin creates a Vendor with its phone numbers typed in local form with spaces, with +964, with 00964, and in Arabic-Indic digits. Reading it back gives each in the stored form and in Iraq's own form.
- Its Login exists, named by the login phone number in the stored form, holding the `vendor` role and no other, enabled, with no email address or names, and required to update its password.
- The temporary password in the answer is the Login's: the token address says that the Login is not yet set up, and does not say that the password is wrong. No later answer holds it.
- A number that is not Iraqi, a landline as the login phone number or as the WhatsApp number, a location outside Iraq, a latitude and a longitude typed the wrong way round, an Instagram name that breaks Instagram's rule, a name that is too long and a missing required detail are each refused with an answer that names the field and the reason.
- An Instagram profile's address and a name with an @ are each kept as the bare name.
- A login phone number another Vendor holds is refused as taken, and Keycloak holds no second Login.
- A create whose Vendor cannot be stored, by a fault planted to make the database refuse it, leaves no Login behind in Keycloak.
- With the Keycloak container paused, a create is answered 503 with `IDENTITY_SERVICE_UNAVAILABLE`, and no Vendor exists.

**Reading and listing**

- The list holds active and deactivated Vendors in name order, each once across the pages, with the total, and says which are deactivated.
- The Vendor's own Login reads its Vendor, and is answered 403 for another Vendor. The Admin reads any Vendor. A Vendor that does not exist is answered 404 with `VENDOR_NOT_FOUND`.
- The Caller's Vendor answers a Vendor's own Login with its Vendor, and a Login with the `vendor` role and no Vendor with 404 and `VENDOR_NOT_FOUND`.

**Editing**

- The Vendor's own Login changes its contact details, and reads them back. The same request with a name, a city or a login phone number added is refused, and nothing changes.
- The Admin changes the contact details of any Vendor through the same endpoint, as when acting as it.
- The Admin's edit changes the name, the city and the login phone number. The Login is renamed to match and keeps its password, and an optional detail left out is cleared.
- A login phone number another Vendor holds is refused, and neither Login is renamed.

**Resetting a password**

- A reset answers a new temporary password, different from the first, which is the Login's. The old one no longer is, and the Login is again required to update its password.
- A session the test opened for the Login is ended.

**Deactivating and reactivating**

- After a deactivation, the Vendor's own token, which has not run out, is answered 403 with `VENDOR_DEACTIVATED` at every Vendor endpoint. Its Login is disabled, and a session the test opened is ended. The Admin still reads it, marked deactivated.
- Deactivating it again changes nothing and is not refused.
- After a reactivation, the same token is answered again, the Login is enabled, and its password is the one it had.

**Who may do what.** A Vendor's token at each Admin-only endpoint is answered 403, and every Vendor endpoint answers a call without a token with 401.

Each group is seen to fail once, by a deliberate fault that is then reverted:

- the check that a login phone number is free removed;
- the `admin` role given to a new Login instead of `vendor`;
- the password given as a lasting one instead of a temporary one;
- the deletion of the Login removed from a failed create;
- Arabic-Indic digits left unconverted;
- the active check removed from the rule for which Vendor a request acts for;
- the ownership check removed from that rule;
- the name added to the contact details' request;
- the sessions left open after a reset;
- the Login left enabled after a deactivation.

### Seam 3: the running platform, from the outside

`pnpm platform:check` observes the services and the three apps through a real browser, Keycloak's own screens among them. Every Vendor it makes is a made-up Vendor, named "Made-up test Vendor" with a number unique to the run, and a login phone number unique to the run. Nothing is sent to that number. The Vendors and their Logins stay in the development services, plainly test data, and `pnpm services:reset` clears them.

**The Admin console, as the development Admin, in a window 360 pixels wide**

- The Admin creates a made-up Vendor in the form. The browser is given a position in Erbil, and the location button fills the coordinates from it.
- The page then shows the temporary password and the hand-over. The link opens a WhatsApp chat with the login phone number's digits. Its text holds the dashboard's address, the login phone number and the password, each on its own line. Its text differs between the three languages.
- The list finds the new Vendor, and its page shows every detail, the map location as a link to Google Maps.
- The Admin edits a detail, and the page shows the new value.
- A number that is not Iraqi is refused beside its field.
- No screen scrolls sideways.

**A Vendor's first login, in a fresh browser**

- The Vendor opens the dashboard and types its login phone number at Keycloak's login screen in Arabic-Indic digits with spaces, with the temporary password.
- Keycloak shows the screen that asks for a new password. A password of 4 characters is refused there. A good one is taken.
- The Vendor portal opens on the details screen, with the Vendor's name in the frame.
- The screen that asks for a new password, opened in each of the three languages, differs between them, and its Kurdish text is not Keycloak's English.

**The Vendor portal, as that Vendor**

- The details screen passes the Vendor portal's language checks in all three languages, with `checkInEveryLanguageOfTheVendorPortal`.
- The name, the address and the opening hours are drawn as written. An address written with Arabic text and Arabic-Indic digits is drawn exactly so. The phone numbers are in Western digits, kept apart from the text around them.
- The Vendor changes its address and its opening hours, and the screen shows them.
- The name, the city and the login phone number cannot be changed there.
- An address of the Admin console's Vendors section does not show it.

**Acting as a Vendor, as the development Admin**

- From the Vendor's page, the Admin opens its portal. A band names the Vendor on every screen, the document declares the portal's language, and the details screen is the Vendor's.
- The Admin changes the Vendor's opening hours there, and the Vendor sees the change.
- The band's link returns to the Vendor's page, in English, left to right.

**Resetting, deactivating and reactivating**

- The Admin resets the password. The old password no longer logs in, and the new temporary one leads to the screen that asks for a new password.
- The Admin deactivates the Vendor while its portal is open in another browser. Its next action there shows the plain message in its language. Logging in is refused at Keycloak's screen.
- The Admin reactivates it, and it logs in with the password it had.

**The accessibility standard.** `expectAccessible` runs, in the light and in the dark scheme, on the Vendors list, a Vendor's page, the form for a new Vendor, the edit form, the hand-over, the details screen with its form, and the band.

The tests that used the development Vendor make a made-up Vendor instead, and keep checking what they checked: that a Vendor gets the Vendor portal, that it cannot reach the Admin console's Catalog, and that the portal's switch works in the three languages.

Each group is seen to fail once, by a deliberate fault that is then reverted: the hand-over link pointed at the WhatsApp number instead of the login phone number; the login screen's script taken off the theme; the Kurdish text of the screen that asks for a new password taken off the theme; the `AlwaysEnglish` mark taken off a phone number; the band taken off the acting portal; the deactivated message replaced by the screen's ordinary refusal; a control of the Vendor form given no accessible name.

### The rest

- **From scratch.** In a fresh clone in a new directory, with no `.env` and no Docker volumes, all of these pass, with none of the three apps started by hand: one install; the browser's install; `pnpm check --skip-nx-cache`; `pnpm boundaries:check`; `pnpm integration:check`; `pnpm services:up`, which writes the API's client secret; `pnpm services:check`; and `pnpm platform:check`.
- **By hand, once, in the owner's own browser.**
  - The hand-over link opens WhatsApp's website with the message written, in each language, and the message reads well.
  - The Admin console's Vendors screens and the details screen match DESIGN.md, and Impeccable's design hook raises nothing left unanswered.
  - Keycloak's screens a Vendor meets read correctly in Kurdish and in Arabic.
  - `pnpm check` still passes with Docker stopped and with no browser installed.
- **On a phone, once the platform is hosted.** These are recorded open in the ticket that carries them, and listed under "Checks on a phone wait for hosting" in the MVP spec:
  - the hand-over link opens the WhatsApp app on the Admin's phone, with the message written;
  - the location button fills the coordinates from the phone's position, in a shop in Erbil;
  - a phone number typed on a Kurdish and on an Arabic keyboard logs in;
  - the Vendors screens, Keycloak's screens and the details screen used with a thumb, in Kurdish and in English.
- **Prior art.**
  - The API's tests against a real database, built with `createTestAppWithLogins` and the shared test database, are the model for seam 2. The shared Keycloak container follows the shared test database: one container for the run, started from the test utilities, with what each test made removed between tests.
  - The existing stand-in that publishes keys as Keycloak would, and its `tokenOf`, still make the tokens.
  - The end-to-end tests of the Catalog are the model for seam 3: the login helpers, `createAMadeUpPart` for a made-up Vendor, `expectAccessible`, and the Vendor portal's language helpers.
  - `pnpm services:check`'s existing lines about the realm are the model for its new line.
- **Recording.** The results of the fault checks and of the checks by hand are written under the Comments heading of the ticket that carries them out.

## Out of Scope

- What Shoppers see of a Vendor: its page (BRW-4), and hiding a deactivated Vendor's Offers, which `offers` and `browse` build on the state this module records.
- Offers, Confirmations, the expiring-Offers list, Referrals and their counts, Part Requests and the sheet, in the portal and in the Admin console.
- Vendor self sign-up, more than one Login per Vendor, and more than one location per Vendor, which the MVP leaves out.
- A Vendor changing its own password from the portal, and a forgotten password reset by email or SMS. The Admin resets passwords (ACC-5).
- Any message the platform sends itself.
- More than one Admin, a screen to create one, and the Admin's Login on a server, which is packaging work.
- Deleting a Vendor, and merging two.
- Recording who changed a Vendor, or what the Admin did while acting as one, beyond the time of the last change.
- Expiring a temporary password that was never used.
- How long a Login stays logged in, and a "remember me" choice. Keycloak's defaults stay.
- A second factor at login.
- A second city.
- An embedded map, and reading a place from a shortened Google Maps link.
- The realm, its secrets and the services on a server, and the rest of packaging.
- Running `pnpm integration:check` or `pnpm platform:check` as part of `pnpm check`.

## Further Notes

- **Choices made here that no ADR records.** The owner may overrule any of them before work starts:
  - The platform makes the temporary password, rather than the Admin typing one. ACC-2 says that the Admin sets it, which the Admin's action does.
  - The temporary password is 12 lower-case letters and digits without look-alikes.
  - The hand-over opens a chat with the login phone number, not with the WhatsApp number.
  - The Admin chooses the hand-over's language, Kurdish first. No Vendor stores a language.
  - Phone numbers are stored in the international form, and the Login is named by it, as the workplace names its Logins.
  - The phone number may be a landline. The WhatsApp number and the login phone number must be mobile numbers.
  - The map location, the WhatsApp number, the Instagram name and the opening hours are optional, and a location must be inside Iraq.
  - The lengths: 100 characters for a name, 300 for an address and 300 for opening hours.
  - The city is a fixed set in code, holding Erbil.
  - A Login's own password needs at least 8 characters and must not be its name. Brute-force detection is on.
  - The login screen's field is labelled "phone number" for everyone, the Admin included. On 19 October 2026 the owner overruled this: it is labelled "Phone number or name", because the Admin logs in with a name.
  - The Admin may act as a deactivated Vendor.
  - A reset ends the Vendor's sessions. Reactivating keeps the password the Vendor had.
  - A Vendor named in an address that is not the Caller's own is answered 403, not 404.
  - The development Vendor is retired, and the tests make Vendors through the API.
  - The Vendor portal's placeholder and its sample go, and the dashboard's plural forms are drawn by no screen until `offers`.
- **A known limit.** If the step that puts a Login back fails as well, a Login can be left with no Vendor behind it. It holds its phone number, so a create with that number is refused as taken until the Login is deleted in Keycloak's own console. The API logs the Login's identifier when this happens. It needs two failures in a row, in two services, within one request.
- **Checked on 16 October 2026:**
  - Weekly downloads in the week to 16 October 2026: `libphonenumber-js` about 28.3 million, `google-libphonenumber` about 1.8 million and `@keycloak/keycloak-admin-client` about 0.35 million.
  - `@keycloak/keycloak-admin-client` 26.8.1 was published on 13 October 2026 as an ES module only. It depends on Microsoft's Kiota packages, which are pre-releases. The workplace's backend uses it at `^26.6.2`, lists it among the packages its Jest preset transforms, and names its Logins by their international phone number, such as `+9647554322112` in its tests.
  - `libphonenumber-js` 1.13.15 was published on 8 October 2026.
  - The realm file has no password policy and no brute-force detection, and its user profile is Keycloak's default, which asks for an email address and two names. `pnpm services:up` creates the two development Logins with all three for that reason.
  - The login theme extends `keycloak.v2` and its Kurdish messages hold only the login screen's text.
- **Not yet known, and found out first.** Each is settled on the installed tools before the code that depends on it is written, and the finding is recorded in the ticket:
  - Whether Keycloak 26.8.0 reads an environment setting named in the realm file when it imports it, so that the client's secret stays out of the file, and how the Compose file passes it.
  - How the realm file states the user profile without an email address or names, and whether the development Admin still needs them.
  - The fewest realm-management roles with which the API's client can do everything `LoginStore` does, and whether renaming a Login needs a realm setting.
  - Whether a script named in the theme's properties is loaded on `keycloak.v2`'s login screen, and on the screen that asks for a new password.
  - Every message key the screens a Vendor now meets show, from the parent theme's English messages, so that the Kurdish file lacks none.
  - Whether Keycloak's token address tells a temporary password apart from a wrong one, and how a test's own client asks it.
  - How long the Keycloak container takes to start in `pnpm integration:check`, and how the shared container is reached from every test file.
  - Which of the API's targets must have the client's secret, given that the API checks every setting when it starts: the API's server, and perhaps the migration and the import, which do not use it.
  - How Jest's shared preset transforms `@keycloak/keycloak-admin-client` and the packages it needs.
  - How `libphonenumber-js` writes an Erbil landline and a mobile number in Iraq's own form, and which of its metadata sets tells a mobile from a landline.
  - How React Router mounts the Vendor portal's pages under both routers, and how a page learns the Vendor it shows.
- **A reset.** The realm's changes take effect only in a realm Keycloak imports afresh. The owner runs `pnpm services:reset` and `pnpm services:up` once, after the ticket that changes the realm file, and then `pnpm catalog:import` again. The reset also deletes the platform's database, which holds only the imported catalog and test data. The ticket says so before it is run.
- **Next steps.** `offers` builds on this module: its Vendor portal screens use the portal's router and the rule for which Vendor a request acts for, the Admin acts as a Vendor to add Offers on the spot, and its expiring-Offers list names Vendors. `browse` shows a Vendor's details and hides a deactivated Vendor. `sharing` uses the WhatsApp number for "send on WhatsApp" and counts Referrals per Vendor.
