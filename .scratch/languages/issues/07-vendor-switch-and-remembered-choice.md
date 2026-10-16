# 07: The Vendor switches language in place, and the choice is remembered

**Spec:** [the languages spec](../spec.md)

**What to build:** The Vendor portal's frame gains a language switch, with each language named in that language and its own script. A tap changes the language, the direction and the tab's title in place: the page is not loaded again, Keycloak is not visited and nothing the Vendor was doing is lost.

The choice is remembered in the browser, also after the Vendor logs out and in again. From then on the Vendor portal opens in the remembered choice, else in the browser's language, else in Kurdish. Only a use of the switch is remembered. A language that was merely detected is not stored.

The Admin console has no switch. It neither reads nor writes the remembered choice, so a Vendor's language is still there after the Admin has used the same browser, and the Admin's screens stay in English after a Vendor has.

**Blocked by:** 06

**Status:** resolved

- [x] The Vendor portal's frame holds the switch on every screen. It lists Kurdish, Arabic and English in that order, each under its own name, and shows which one the portal is in.
- [x] A tap changes the language, the direction and the tab's title in place. The page is not loaded again and Keycloak is not visited.
- [x] A use of the switch is remembered in the browser's storage. Nothing is stored before the switch is used.
- [x] The Vendor portal opens in the remembered choice, else in the browser's language, else in Kurdish.
- [x] The choice holds after a reload, and after logging out and in again.
- [x] The message for a login that could not be completed follows the remembered choice too.
- [x] The Admin console has no switch. It neither reads nor writes the remembered choice.
- [x] The language choice is the only thing the dashboard keeps in the browser's storage. Tokens stay in memory only.
- [x] In each language the switch is inside a screen 360 pixels wide and large enough to tap, on the end side of the frame in both directions.
- [x] `pnpm platform:check` gains these lines, and passes on every line:
  - The development Vendor gets the page with the switch, and the development Admin gets a page without one.
  - A tap on another language changes the language and the direction the page declares. The page was not loaded again and Keycloak was not visited.
  - The choice holds after a reload, and after logging out and in again.
  - After the development Vendor has chosen Arabic and logged out, the development Admin in the same browser still gets English. When the development Vendor logs in again, Arabic is still remembered.
  - With a language remembered, the browser's storage still holds no token.
  - In each language the switch is inside the screen.
- [x] Shown once and then reverted, each failing on its own line: the dashboard made to ignore the remembered choice; the Admin console made to read it.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 16 October 2026: completed

**What was built.**

- **The switch** is `apps/dashboard/src/app/layouts/language-switch.tsx`, in the header of the Vendor portal's frame, on the end side. It is three buttons and not links, as the Shopper app's switch is, because the Vendor portal has no address for each language. Each is named by `languageNames` from `i18n` and carries its own `lang`. The one the portal is in is `aria-pressed`, on the Shelf ground (`bg-secondary`) and in a heavier weight. Each is at least 44 pixels each way (`min-h-control min-w-control`). The switch's name for a screen reader is a new message, `VendorPortalFrame.languageSwitch`, worded as the Shopper app's.
- **A tap** calls `chooseLanguage`, in the `i18n` segment of the Shared layer. It writes the choice to the browser's `localStorage`, calls i18next's `changeLanguage`, and the document then declares the language, its direction and the tab's title. `startLanguage` is now given the tab's title, so that the document follows the language in one place, at the start and at every switch. react-i18next's hook listens for i18next's `languageChanged`, as ticket 06 found, so every component is drawn again in the new language. Nothing is reloaded and Keycloak is not asked.
- **The Vendor portal's language** is `rememberedLanguage() ?? languageOfTheBrowser()`, in `halves.ts`, beside the rule for which half a login gets. The Admin console's entry is `'en'` and touches neither. The message for a login that could not be completed reads the Vendor portal's entry, so it follows the remembered choice too.
- **A browser that refuses its storage** to the page gives no remembered choice, and a choice made there holds on the page without being kept.
- **For the tests,** the button that logs out gained `data-testid="log-out"`, and the message for a failed login `data-testid="login-failed"`, so that a test finds them without quoting a translation.

**Keycloak's adapter and the browser's storage.** keycloak-js 26.2.4 keeps one entry of its own in `localStorage`, `kc-callback-<state>`, while a login is on its way through Keycloak: the state, the nonce and the PKCE verifier. It removes the entry when the dashboard comes back from Keycloak, and drops any older than an hour. It holds no token. When the storage is full, the adapter clears its own entries and no other. So the language is the one thing the dashboard keeps there, beside an entry that lives only for the length of a login.

**Tested now: the message for a login that could not be completed.** Ticket 06 left it untested. The test stops Keycloak's answer to the last step of a login, the exchange of the code for tokens, so `init()` fails and the message shows. It then declares the language the Vendor chose before, in a browser set to another.

**`pnpm platform:check`** gains 8 lines in `dashboard-languages.spec.ts`:

- The development Vendor gets the page with the language switch, and the development Admin gets a page without one.
- In each language the switch is inside the screen, large enough to tap, and on the end side of the frame. This line is the new helper, `readInEveryLanguageOfTheVendorPortal` in `apps/e2e/src/languages.ts`. It does for a screen of the Vendor portal what the Shopper app's helper does for a page: it confirms that the browser writes a Kurdish number in Arabic-Indic digits, then taps the switch for each language and checks the declared language and direction, the frame, the switch (the order, the own names, the one pressed, and its reach), the digits and the width. The checks of the switch's reach are now shared with the Shopper app's helper.
- A tap on another language changes the language, the direction and the tab's title in place. No page is loaded, no request goes to Keycloak, a mark set on the page is still there, and the caller is still shown.
- A language the Vendor portal only found from the browser is not remembered, and one chosen with the switch is. What one browser kept, without its cookies, is given to a second browser set to another language.
- In a browser set to English, the choice holds after a reload, and after logging out and in again.
- In a browser set to English, after the development Vendor has chosen Arabic and logged out, the development Admin still gets English, and when the development Vendor logs in again, Arabic is still remembered.
- In a browser set to English, the message for a login that could not be completed follows the remembered choice.
- With a language remembered, the browser's storage still holds no token.

The Shopper app's language tests and the login tests, 28 lines, pass with the shared checks of the switch.

**Fault checks,** each planted alone on a clean tree and reverted by the inverse edit.

| Fault | Result |
|---|---|
| The dashboard made to ignore the remembered choice: the Vendor portal's entry read it and threw it away | 5 of the 17 lines failed, each on the declared language: the line for a detected language, at the third browser; the reload and the new login; the Vendor's second login after the Admin's; the message for a failed login; and the line on tokens, after its reload. |
| The Admin console made to read it: `rememberedLanguage() ?? 'en'` | 1 line failed, the Admin's, which declared `ar` where `en` was expected. |

**For the owner, at review.** The switch is the first control of its kind in the dashboard. It follows `apps/dashboard/DESIGN.md` for its size, its corners and the Shelf ground of a selected thing, and Impeccable was not asked about it.

**`pnpm check`.** Each of this ticket's two commits passed on its own in a fresh clone, with Docker unreachable, no browser installed and Nx's cache skipped.
