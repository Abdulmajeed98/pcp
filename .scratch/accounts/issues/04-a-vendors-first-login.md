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
  - After the configured number of wrong passwords in a row, a made-up Vendor of its own is refused its right password. The wrong passwords are sent more than a second apart, so that Keycloak's quick-login check, which locks a Login after two failures within a second, does not lock it first. The owner kept that check, as ticket 03's Comments record.
  - The development Admin still logs in by its name.
- [ ] Shown once and then reverted, each failing on its own line: the script taken off the theme; the Kurdish text of the screen that asks for a new password taken off the theme; brute-force detection turned off in the running realm.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 16 October 2026: what was found out before anything was written

Found out on Keycloak 26.8.0, the image the development services run: its own login templates and messages, read from the image's `org.keycloak.keycloak-themes-26.8.0.jar`, and a throwaway container on another port that imported the repository's realm file, with a copy of the theme that named a probe script. A script in Playwright's Chromium opened both screens in each language and read them. The owner's services were not touched.

- **A script named in the theme's properties is loaded on both screens.** `keycloak.v2`'s `template.ftl`, which the login screen and the screen that asks for a new password share, writes one `<script src="…/resources/…/login/pcp/js/…" type="text/javascript">` for each name in the theme's `scripts` property, in the page's head. The probe script ran on the login screen, before and after a wrong password, and on the screen that asks for a new password, before and after each refusal. `keycloak.v2`'s own properties set no `scripts`, so naming one drops nothing of the parent's. The script runs before the form exists, being a plain script in the head, so it has to wait for the page or listen on the document.
- **The login screen's form.** `#kc-form-login`, with `#username`, `#password` and the button `#kc-login`. Its `onsubmit` only disables the button. The field's label is `label[for=username]`, from the message `username`, because the realm does not allow logging in by email. A wrong password, and a locked Login, are shown under the name field, in `#input-error-username`, not in the alert.
- **The login screen's own choice of language** is the select `#login-select-toggle`, whose options are addresses with `kc_locale` set. A choice made there holds for the screen that asks for a new password that follows in the same browser.
- **The screen that asks for a new password** is `#kc-passwd-update-form`, with `#password-new`, `#password-confirm`, the box `#logout-sessions` and the button `#kc-submit`. It opens with a warning in the alert above the form. A refusal by the password policy replaces it with a danger alert, `.pf-v5-c-alert.pf-m-danger`, and stays on the same address. Passwords that do not match are shown under `#password-confirm`, in `#input-error-password-confirm`, and a missing one under the new password, in `#input-error-password-new`. Keycloak's own script on the page also checks the length when the field's `change` event fires, which setting the value in the page does not fire.
- **The keys these screens show, from the parent theme's English messages** (`base`'s `messages_en.properties`; `keycloak.v2`'s adds none):

  | Where | Keys |
  |---|---|
  | The login screen, already in the theme's Kurdish | `loginTitle` (the tab's title), `loginAccountTitle`, `username`, `password`, `doLogIn`, `showPassword`, `hidePassword`, `invalidUserMessage` |
  | The screen that asks for a new password | `updatePasswordTitle`, `updatePasswordMessage` ("You need to change your password to activate your account."), `passwordNew`, `passwordConfirm`, `logoutOtherSessions`, `doSubmit`, and `loginTitle`, `showPassword` and `hidePassword` as above |
  | Its errors | `missingPasswordMessage`, `notMatchPasswordMessage` |
  | The password policy | `invalidPasswordMinLengthMessage`, `invalidPasswordNotUsernameMessage` |
  | A locked Login | `accountTemporarilyDisabledMessage` |

  `doCancel` shows only when an application asks for the new password itself, which the dashboard does not. The language select's `aria-label` is the key `languages`, which no English file of Keycloak's holds, so it reads "languages" in every language. `loginTitleHtml` is `{0}`, the realm's name. The page's script also names the other five length and character policies' messages, and shows only those of policies the realm has.
- **What a locked Login is shown.** Five wrong passwords 1.5 seconds apart locked a Login. The fifth was answered with `invalidUserMessage`, and the right password after it with `accountTemporarilyDisabledMessage`, both under the name field and both "Invalid username or password." in English. On the Kurdish screen the fifth was answered in the theme's Kurdish and the right password in Keycloak's English, since the theme lacks that key. Keycloak's log names the second `user_temporarily_disabled`. Two wrong passwords 0.94 seconds apart, sent by a first probe, locked a Login by the quick-login check, as ticket 03 found.
- **Digits.** Keycloak writes the 8 of `invalidPasswordMinLengthMessage` in Arabic-Indic digits on the Kurdish and on the Arabic screen ("minimum length ٨"), through the locale it formats the message in. LANG-5's wider reading wants every number in Western digits. A message given the number as `{0}` cannot have it otherwise.
- **Keycloak's Arabic** names the screen that asks for a new password "تم تحديث كلمة المرور", which reads as "the password has been updated". It is Keycloak's text, which the spec keeps. The by-hand reading of Keycloak's screens in Arabic, in ticket 13, is where it would be raised.
