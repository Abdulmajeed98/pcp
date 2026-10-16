# 04: A Vendor's first login, in three languages, with the development Vendor retired

**Spec:** [the accounts spec](../spec.md)

**What to build:** A Vendor opens the dashboard and logs in at Keycloak's login screen with its login phone number, typed in whatever form its keyboard gives, and its temporary password. The screen's field is labelled "phone number" in each language. Keycloak then makes the Vendor choose its own password, in Kurdish, Arabic or English, and refuses one that does not fit the policy, in the same language. The Vendor then reaches the Vendor portal, which is still the placeholder until ticket 07.

The development Vendor is retired. The tests that logged in as it make a made-up Vendor instead and log in as that Vendor through its first login, the path a real Vendor takes.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Before anything is written, these are found out on the installed Keycloak and recorded under Comments:
  - whether a script named in the theme's properties is loaded on `keycloak.v2`'s login screen and on its screen that asks for a new password;
  - every message key those two screens, the password policy and a locked Login show, from the parent theme's English messages;
  - what the login screen shows a Login that brute-force detection has locked.
- [ ] The theme's messages label the name field "phone number" in Kurdish, Arabic and English.
- [ ] A script the theme adds turns what is typed in that field into the stored form before the form is sent, when it looks like a phone number: Arabic-Indic and Eastern Arabic-Indic digits become Western digits; spaces, dashes, dots and brackets go; and a leading 0, 00964 or 964 becomes +964. A name with a letter in it, such as the development Admin's, is left alone. No Keycloak template is copied into the theme.
- [ ] The theme's Kurdish messages gain every message the screen that asks for a new password, its errors, the password policy and a locked Login show. They are drafts awaiting review (LANG-7), marked as the existing Kurdish messages are, with words from the word list.
- [ ] **The development Vendor is retired.** `pnpm services:up` no longer creates it. `.env.example` no longer lists its two settings, and neither `pnpm services:check` nor `pnpm platform:check` asks for them. A value already in an owner's `.env` is left there and read by nothing. Ticket 03's reset removed its Login, but `pnpm services:up` made it again straight after. Once no test uses it, that one Login is deleted from the owner's Keycloak through Keycloak's administration interface, as Keycloak's own administrator, and this is recorded. No code is added for it.
- [ ] The end-to-end tests gain a helper that logs in as a made-up Vendor through its first login. It types the login phone number, sets the temporary password and then a new password in the page, never with Playwright's `fill`, and waits for the Vendor portal. The new password is made for the run and never printed.
- [ ] The tests that used the development Vendor use a made-up Vendor instead, and keep checking what they checked: that a Vendor gets the Vendor portal, that it cannot reach the Admin console's Catalog, and that the portal's switch works in the three languages.
- [ ] `pnpm platform:check` gains these lines, and passes on every line:
  - A made-up Vendor types its login phone number in Arabic-Indic digits with spaces, and logs in. Another types it in local form with dashes, and logs in.
  - The screen that asks for a new password refuses one of 4 characters, and one that is the login phone number, and then takes a good one. The Vendor portal opens.
  - The screen that asks for a new password, opened in each of the three languages with the login screen's own choice of language, declares that language. Its text differs between the three, and its Kurdish text is not its English text.
  - The login screen's field label differs between the three languages.
  - After the configured number of wrong passwords in a row, a made-up Vendor of its own is refused its right password.
  - The development Admin still logs in by its name.
- [ ] Shown once and then reverted, each failing on its own line: the script taken off the theme; the Kurdish text of the screen that asks for a new password taken off the theme; brute-force detection turned off in the running realm.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
