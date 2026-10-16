# 04: A Vendor's first login, in three languages, with the development Vendor retired

**Spec:** [the accounts spec](../spec.md)

**What to build:** A Vendor opens the dashboard and logs in at Keycloak's login screen with its login phone number, typed in whatever form its keyboard gives, and its temporary password. The screen's field is labelled "phone number" in each language. Keycloak then makes the Vendor choose its own password, in Kurdish, Arabic or English, and refuses one that does not fit the policy, in the same language. The Vendor then reaches the Vendor portal, which is still the placeholder until ticket 07.

The development Vendor is retired. The tests that logged in as it make a made-up Vendor instead and log in as that Vendor through its first login, the path a real Vendor takes.

**Blocked by:** 03

**Status:** resolved

- [x] Before anything is written, these are found out on the installed Keycloak and recorded under Comments:
  - whether a script named in the theme's properties is loaded on `keycloak.v2`'s login screen and on its screen that asks for a new password;
  - every message key those two screens, the password policy and a locked Login show, from the parent theme's English messages;
  - what the login screen shows a Login that brute-force detection has locked.
- [x] The theme's messages label the name field "phone number" in Kurdish, Arabic and English.
- [x] A script the theme adds turns what is typed in that field into the stored form before the form is sent, when it looks like a phone number: Arabic-Indic and Eastern Arabic-Indic digits become Western digits; spaces, dashes, dots and brackets go; and a leading 0, 00964 or 964 becomes +964. A name with a letter in it, such as the development Admin's, is left alone. No Keycloak template is copied into the theme.
- [x] The theme's Kurdish messages gain every message the screen that asks for a new password, its errors, the password policy and a locked Login show. They are drafts awaiting review (LANG-7), marked as the existing Kurdish messages are, with words from the word list.
- [x] **The development Vendor is retired.** `pnpm services:up` no longer creates it. `.env.example` no longer lists its two settings, and neither `pnpm services:check` nor `pnpm platform:check` asks for them. A value already in an owner's `.env` is left there and read by nothing. Ticket 03's reset removed its Login, but `pnpm services:up` made it again straight after. Once no test uses it, that one Login is deleted from the owner's Keycloak through Keycloak's administration interface, as Keycloak's own administrator, and this is recorded. No code is added for it.
- [x] The end-to-end tests gain a helper that logs in as a made-up Vendor through its first login. It types the login phone number, sets the temporary password and then a new password in the page, never with Playwright's `fill`, and waits for the Vendor portal. The new password is made for the run and never printed.
- [x] The tests that used the development Vendor use a made-up Vendor instead, and keep checking what they checked: that a Vendor gets the Vendor portal, that it cannot reach the Admin console's Catalog, and that the portal's switch works in the three languages.
- [x] `pnpm platform:check` gains these lines, and passes on every line:
  - A made-up Vendor types its login phone number in Arabic-Indic digits with spaces, and logs in. Another types it in local form with dashes, and logs in.
  - The screen that asks for a new password refuses one of 4 characters, and one that is the login phone number, and then takes a good one. The Vendor portal opens.
  - The screen that asks for a new password, opened in each of the three languages with the login screen's own choice of language, declares that language. Its text differs between the three, and its Kurdish text is not its English text.
  - The login screen's field label differs between the three languages.
  - After the configured number of wrong passwords in a row, a made-up Vendor of its own is refused its right password. The wrong passwords are sent more than a second apart, so that Keycloak's quick-login check, which locks a Login after two failures within a second, does not lock it first. The owner kept that check, as ticket 03's Comments record.
  - The development Admin still logs in by its name.
- [x] Shown once and then reverted, each failing on its own line: the script taken off the theme; the Kurdish text of the screen that asks for a new password taken off the theme; brute-force detection turned off in the running realm.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

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

### 16 October 2026: completed

**What was built.**

- **The label.** The theme gains `messages_en.properties` and `messages_ar.properties`, each holding only `username`: "Phone number" and "رقم الهاتف", the Arabic marked as a draft awaiting review. The Kurdish `username` is "ژمارەی تەلەفۆن". The Kurdish `invalidUserMessage` now names the phone number too, so that the field and its error say the same thing.
- **The script**, `services/keycloak/themes/pcp/login/resources/js/phone-number.js`, named by the theme's `scripts`. It listens for the submit of `#kc-form-login` on the whole document, since Keycloak loads it before the form exists, and rewrites `#username` just before the form is sent. It reads digits and separators as the API's `PhoneNumber` does, the same characters in both, and keeps what was typed when anything but digits and a leading + is left. No template is copied.
- **The Kurdish text.** `messages_ckb.properties` gains the eleven keys the findings above list for the screen that asks for a new password, its errors, the policy and a locked Login, under the file's draft mark (LANG-7), with the word list's هەژمار for Login and چوونەدەرەوە for logging out. `accountTemporarilyDisabledMessage` is the same text as `invalidUserMessage`, as Keycloak keeps them. `invalidPasswordMinLengthMessage` writes the 8 itself, in Western digits, with a comment that it follows the realm's `length(8)`, because Keycloak's `{0}` would be ٨ on the Kurdish screen. Read back in the throwaway container, every piece of the screen, both policy refusals ("… لانیکەم 8 پیت …"), both field errors and a locked Login's message came in Kurdish.
- **The tests' helpers.** `logInForTheFirstTime` in `apps/e2e/src/vendors.ts` types the login phone number with `pressSequentially`, in the stored form unless the test gives another, sets the temporary password and then `aNewPassword()`, "new-password-" and a word unique to the run, in the page, and waits for the Vendor portal's frame. `aMadeUpVendorThatHasLoggedIn` makes a Vendor as the development Admin and runs that first login, each in a browser context of its own. `development-logins.ts` gains `chooseKeycloaksLanguage`, `submitTheNewPasswordScreen` and `expectTheVendorPortal`. `DevelopmentLogin` became `LoginDetails`, since a made-up Vendor's details are not a development login's. A typed number may reach Playwright's log, as the comment beside `submitTheLoginScreen` says; the passwords never do.
- **The tests that used the development Vendor.** `dashboard-login.spec.ts` makes a Vendor and checks its name and role after the first login. `admin-catalog.spec.ts` makes one for its test. `dashboard-languages.spec.ts` makes one in `beforeAll` for the file, which a worker makes again after a failed test. Their names say "a made-up Vendor".
- **The development Vendor retired.** `tools/development-logins.mjs` lists the development Admin alone, with a comment on the Vendor's retirement. `.env.example` loses its two settings, and `pnpm services:up` its fixed name. `pnpm services:check` has 37 lines now, the development Vendor's three gone, and `pnpm platform:check` asks `.env` for the Admin's name and password only. The owner's `.env` keeps `DEVELOPMENT_VENDOR_NAME` and `DEVELOPMENT_VENDOR_PASSWORD`, read by nothing.

**The new lines of `pnpm platform:check`**, all in `apps/e2e/src/vendor-first-login.spec.ts`:

| Line | How it is told |
|---|---|
| The login screen's name field is labelled "Phone number", in a different text in each of the three languages | The label read after choosing each language with the login screen's select; the English is "Phone number" |
| A made-up Vendor types its login phone number in Arabic-Indic digits with spaces, and logs in to the Vendor portal through its first login | Typed as ٠٧٥٠ ١٢٣ ٤٥٦٧ is; the portal then names the Login by the stored form |
| The same, in local form with dashes | Typed as 0750-123-4567 is |
| The screen that asks for a new password refuses one of 4 characters, and one that is the login phone number, and then takes a good one, and the Vendor portal opens | Each refusal is answered 200 with the same screen and a danger alert; the good one leads to the portal's frame |
| The screen that asks for a new password, opened in each of the three languages with the login screen's own choice of language, declares that language, its text differs between the three, and its Kurdish text is not its English text | One Vendor and browser for each language; `lang` and `dir`, then six pieces (heading, warning, both labels, the box's label and the button), each Kurdish piece unlike its English one |
| After the configured number of wrong passwords in a row, sent more than a second apart, a made-up Vendor of its own is refused its right password | `failureFactor` and `quickLoginCheckMilliSeconds` read from the realm file; the wrong passwords 1.5 seconds apart; the right one answered 200 with the login screen and its error, not sent on |
| The development Admin still logs in by its name, typed at the login screen | The name, with letters and dashes, typed key by key; the Admin console names the Admin |

Each was run before the code it checks was written. The label line failed with `Received: "Username"`. Both typed-number lines failed waiting for `#kc-passwd-update-form`, the login having been refused. The language line failed with the Kurdish and the English text the same, Keycloak's English. The refusal, lock and Admin lines check what Keycloak and the realm already did, and passed at once; the lock line was seen to fail by its fault below.

**The development Vendor's Login deleted.** Once the whole `pnpm platform:check` had passed with no test using it, a script in the scratchpad, not in the repository, logged in to the owner's Keycloak as Keycloak's own administrator with the settings in `.env`, found the Login `development-vendor` by its exact name (enabled, realm roles `default-roles-pcp`, `uma_authorization`, `offline_access` and `vendor`, 26 sessions left by earlier runs), and deleted it with `DELETE /admin/realms/pcp/users/{id}`, answered 204. Read back, the realm has no Login of that name, and the development Admin's Login is there. No code was added for it, and there was no reset.

**Fault checks**, each planted by a script that refused a dirty tree, made one change, ran the whole `pnpm platform:check` and undid the change by its inverse:

| Fault | Failed |
|---|---|
| The script taken off the theme: the `scripts=js/phone-number.js` line removed from `theme.properties` | The two typed-number lines, and nothing else: each waited for `#kc-passwd-update-form`, the login refused. 85 passed. |
| The Kurdish text of the screen that asks for a new password taken off the theme: its six keys removed from `messages_ckb.properties` | The language line, and nothing else: the Kurdish and the English text were the same. 86 passed. |
| Brute-force detection turned off in the running realm, with `PUT /admin/realms/pcp` setting `bruteForceProtected` to false | The lock line, and nothing else: the right password was answered 302, not 200. 86 passed. |

The first fault's undo left `theme.properties` with the script's line moved to its top, because the script undid a removal by replacing the empty text. The file was written back by hand to its committed text, `git status` was clean, and the script was changed to mark each removal with a comment line, which the undo replaces. The other two faults left the tree clean. Detection was turned back on by the same script. The realm read back afterwards holds what the realm file sets: `bruteForceProtected` true, `permanentLockout` false, `maxTemporaryLockouts` 0, `LINEAR`, `failureFactor` 5, `waitIncrementSeconds` 60, `maxFailureWaitSeconds` 900, `maxDeltaTimeSeconds` 43200, `quickLoginCheckMilliSeconds` 1000, `minimumQuickLoginWaitSeconds` 60, and `passwordPolicy` `length(8) and notUsername`. No password from `.env` and no new password was found in any run's output, counted by a script that printed none of them, and no made-up number in the failed runs'.

**Results**, against the owner's services with `COMPOSE_PROJECT_NAME=pc-part-pickers` and the worktree's `.env` a link to the owner's, with no reset:

- `pnpm platform:check` passes 87 tests, 7 of them new.
- `pnpm services:check` passes 37 lines.
- `pnpm check --skip-nx-cache` passes with `DOCKER_HOST` pointed at a socket that does not exist.
- `pnpm integration:check` passes 168 tests. Its Keycloak container mounts the theme, so the two commits that change the theme were also checked with it after they were made, in a clone in the scratchpad: 168 tests passed at each. Each of the six commits before this record passed `pnpm check --skip-nx-cache` there, installed offline with `DOCKER_HOST` unreachable, and each was gated on `pnpm check` in the working tree, holding only its own files, before it was made.
- `pnpm services:up`, run once after the retirement, added nothing to `.env` and created no Login.
- The last runs of `pnpm services:check` and `pnpm platform:check` were made after the deletion and the fault checks. After this record the services are stopped with `pnpm services:down`, so that no container keeps a folder of the worktree mounted. Their data stays in the volume.

**On a phone, once the platform is hosted.** The spec's checks that a phone number typed on a Kurdish and on an Arabic keyboard logs in, and that Keycloak's screens are used with a thumb, are ticket 13's, and wait for hosting as the owner decided. The tests here type Arabic-Indic digits through Chromium's text input, not a phone's keyboard.

**Decisions this ticket left open, for the owner.** Each was taken the most conservative way, and none blocks the module.

- **The 8 in the Kurdish policy message is written in the file.** Keycloak's `{0}` would show ٨, which LANG-5's wider reading forbids, so the Kurdish says 8 in Western digits and has to change by hand if the realm's length changes. The comment beside it says so. **My recommendation:** keep it.
- **Keycloak's Arabic shows ٨ too**, in its own `invalidPasswordMinLengthMessage`, and calls the screen "تم تحديث كلمة المرور", "the password has been updated". The ticket gives the theme's Arabic only the label and keeps Keycloak's other Arabic text, so neither was changed. **My recommendation:** give the theme's Arabic those two messages in ticket 13's reading of Keycloak's Arabic screens, the 8 written as in Kurdish.
- **Keycloak's English and Arabic errors still say "username"**, as in "Invalid username or password." and "must not be equal to the username", beside a field now labelled "phone number". Only the Kurdish was changed, being the theme's own text. **My recommendation:** give `invalidUserMessage`, `accountTemporarilyDisabledMessage` and `invalidPasswordNotUsernameMessage` "phone number" in the theme's English and Arabic as well, in ticket 13 or a ticket of their own.
- **The word list has no word for "phone number" yet.** The label uses ژمارەی تەلەفۆن and رقم الهاتف. Ticket 06 adds "login phone number" to the word list. **My recommendation:** ticket 06 takes the same words, or changes these with its own.
- **A failed test's trace now also holds a made-up Vendor's new password**, beside the temporary password the MVP spec's Testing strategy already names. Nothing of it is printed. **My recommendation:** ticket 13 adds "and its new password" to that paragraph.

### 16 October 2026: the code review

Two reviewers read the change, one against the repository's standards and one against this ticket and the spec. Neither found a hard violation. Corrected:

- **The language files' README** said that the one translated text outside `i18n` is the Sorani text of Keycloak's login screen. It now names what the theme holds: the Sorani text of both screens a Vendor meets, a draft, and the field's label in Arabic, a draft, and in English.
- **The theme's script claimed to read a number as the API's `PhoneNumber` does.** Tried on the installed `libphonenumber-js` with the API's options, the API reads 07501234567, 009647501234567, +9647501234567, 9647501234567 and 7501234567 all as +9647501234567: it takes a bare 964, which its own comment does not list, and a number with no leading 0. The script shares the API's clean-up only, the same digits and separators, and turns a leading 0, 00964 or 964 into +964, as the spec lists. Its comment now says so. A Vendor who types its number with no leading 0 is not found by Keycloak, while the API would read that number. The spec's list was kept.
- **The repeated set-up in the tests.** `createAMadeUpVendorAsTheAdmin` logs in as the development Admin and creates a Vendor. `atTheLoginScreenInABrowserOfItsOwn` opens the dashboard in a browser context of its own, waits for the login screen, and closes the context in `finally`, so every new test, and the older one in that file, closes its browser whatever happens. `logInForTheFirstTime` now starts at the login screen the helper shows. `temporaryLoginOf` gives a Vendor's login phone number and temporary password. The language line logs the Admin in once and creates its three Vendors with that authorization, since a second Admin login in the same page found the Admin logged in already, which a first run of the change showed.
- **One shape for both refusals.** `expectTheLoginScreenToRefuse` and `expectTheNewPasswordScreenToRefuse` share `expectRefused`. It waits for the form's answer, expects 200 rather than a redirect, and gives back the error shown, under the name field, in the alert above the form or under a password field.
- **`submitTheLoginScreen` takes a Login's details**, `LoginDetails`, and an option `{ typeTheName: true }` in place of the flag `'set' | 'typed'`. `logInForTheFirstTime` takes `{ loginPhoneNumberAsTyped }` in place of a parameter named `typed`.
- **Keycloak's screens have a module of their own**, `apps/e2e/src/keycloak-screens.ts`, which holds `LoginDetails`, both screens' checks, the language select, the two forms and the refusals. `development-logins.ts` keeps the development Admin and the dashboard's login and logout. `expectTheVendorPortal` moved to `vendors.ts`.
- **`tools/development-logins.mjs`** exports `developmentAdmin`, not a list of one, and has no `otherRole`. `start-services.mjs`, `check-services.mjs` and `check-platform.mjs` name it, and their comments speak of the one Login. The comment no longer tells the file's history. The lines of `pnpm services:check` read as before.
- **The lock line's title** said "more than a second apart", while the wait is `quickLoginCheckMilliSeconds` plus half a second. It now says "sent further apart than the quick-login check's interval". The loop's formatter is `inThatForm`, not `write`.
- **Every Kurdish key the ticket added is now read by a line.** The language line also sends the screen's four refusals in each language: 4 characters, the login phone number, no password, and a confirmation that does not match. Each Kurdish one must differ from the English one. The lock line runs on the Kurdish login screen, and expects the locked Login's error to be the same text as a wrong password's, which is the theme's Kurdish. Taking all five refusal keys off the Kurdish file failed the language line on piece 8, the login phone number's refusal in Keycloak's English, and the lock line, on "Invalid username or password." against the Kurdish. The length refusal in Keycloak's English differs from the English screen's only by its ٨, so comparing alone let it pass. Each Kurdish piece is now also checked for Arabic-Indic digits. With only `invalidPasswordMinLengthMessage` taken off, the language line failed on piece 7, "Invalid password: minimum length ٨.", and nothing else. Both faults were planted by a script that refused a dirty tree and put each line back by a mark, and `git status` was clean after each.

Kept as they are, as the review asked: the 8 written into the Kurdish length message, Keycloak's Arabic title and digit, and "username" in Keycloak's English and Arabic errors, which are left for the owner above. The message for a disabled Login is ticket 12's, and the MVP spec's changes are ticket 13's.

**Results after the review**, against the owner's services with no reset, the same way as before:

- `pnpm platform:check` passes 87 tests.
- `pnpm services:check` passes 37 lines.
- `pnpm integration:check` passes 168 tests, run for the commit that changes the theme's script.
- `pnpm check --skip-nx-cache` passes with `DOCKER_HOST` pointed at a socket that does not exist.
- No password from `.env` and no new password was found in the runs' output.
- Each of the four commits was gated on `pnpm check`'s exit status in the working tree, holding only that commit's files.
- The services were stopped again afterwards with `pnpm services:down`. Their data stays in the volume.
