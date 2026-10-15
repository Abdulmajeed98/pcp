# 06: The dashboard has two halves: the Vendor portal in the Vendor's language, and the Admin console in English

**Spec:** [the languages spec](../spec.md)

**What to build:** The dashboard tells its two halves apart, by one rule in one place. A login that holds the Admin role gets the Admin console. Every other login gets the Vendor portal. A login that holds both roles gets the Admin console.

A Vendor's first visit to the Vendor portal follows the browser's language, and falls back to Kurdish. Kurdish and Arabic are laid out right to left, and the tab's title is in the Vendor's language. The Admin console is in English and left to right, whatever the browser's language is.

react-i18next gives the dashboard its languages, as the owner chose on 10 October 2026. The dashboard's text is a set of language files of its own in `i18n`, in i18next's own format. The switch and the remembered choice follow in ticket 07.

Both pages are still placeholders. The Vendor portal's page keeps who the API says the caller is and its two buttons, in the Vendor's language, inside a frame. The Admin console's page is what the dashboard shows today.

This ticket holds one unknown: whether the dashboard can read the login's roles from Keycloak's adapter before it renders anything.

**Blocked by:** 01, 02, 05

**Status:** resolved

- [x] Before anything is written, the documentation of i18next and of react-i18next is read, for the releases that are installed, for starting it with text that is already loaded, for changing the language, for its types and for React 19. Keycloak's guide to its JavaScript adapter is read for the roles of a login. The findings are recorded under Comments.
- [x] Whether the dashboard can read the login's roles from the adapter before it renders anything is settled first and recorded. It reads them from the same claim the API reads.
- [x] react-i18next and i18next give the dashboard its languages. The plugin that makes i18next read ICU messages is not used, and neither is the plugin that detects a browser's language.
- [x] `i18n` holds the dashboard's text as one JSON file for each language, in i18next's own format. English is the source, and the draft note covers the Kurdish and the Arabic.
- [x] The rule for which half a login gets is applied once, when the dashboard starts, and is stated in one place: the Admin role gets the Admin console, also when the login holds the Vendor role too, and every other login gets the Vendor portal.
- [x] The Vendor portal opens in the browser's language when the platform has it, and in Kurdish otherwise. It asks `i18n`'s rule, the one ticket 02 wrote.
- [x] The dashboard sets the document's language, direction and title when it starts. The direction comes from `i18n`, and no library is asked for it.
- [x] The Vendor portal's page keeps who the API says the caller is and its two buttons, in the Vendor's language, inside a frame laid out at 360 pixels wide first, with logical classes only. It is still marked as a placeholder.
- [x] The Admin console is in English and left to right. Its page is what the dashboard shows today.
- [x] Text that only the Admin console shows is written in English where it is used, and is not in the language files. A component that both halves use takes its text from the files, and in the Admin console it shows the English.
- [x] The message for a login that could not be completed follows the Vendor portal's rule, because nobody is known yet.
- [x] Code that asks for a key the English file does not have fails type-checking. Shown once and then reverted with a misspelled key.
- [x] Tokens stay in memory only. No router and no data-fetching, form or state library is added.
- [x] `pnpm platform:check` gains these lines, and passes on every line, step 4's among them:
  - As the development Vendor, with the browser set to Arabic, the page declares Arabic and right to left. Set to English, it declares English and left to right. Set to French, it declares Kurdish and right to left.
  - The same piece of text is different in each of the three languages, and so is the tab's title.
  - In each language the Vendor portal's page does not scroll sideways in a window 360 pixels wide.
  - As the development Admin, with the browser set to Arabic, the page declares English and left to right.
  - The Admin console's page does not scroll sideways.
- [x] Shown once and then reverted, each failing on its own line: the rule for which half turned round; the document's direction no longer set.
- [x] A new package's install script is read before it is added to the list pnpm allows.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 16 October 2026: completed

**What was read first.**

- **The releases.** i18next 26.4.6 and react-i18next 17.0.18 were the latest, both published the day before. pnpm 12 refuses a release younger than its minimum release age, and offered to write an exception for each into `pnpm-workspace.yaml`. That exception was not kept. The installed releases are i18next 26.4.5 and react-i18next 17.0.16, the newest old enough to pass. Neither has an install script, nor has anything they bring: `@babel/runtime`, `html-parse-stringify` and `use-sync-external-store`. Each has `prepare` only, which runs in its own repository and not on install. Nothing was added to the list pnpm allows.
- **i18next, starting with text already loaded.** Its configuration page: `resources` are the "resources to initialize with", `lng` "overrides language detection", `fallbackLng` defaults to `'dev'` and `false` stops it, and `initAsync` defaults to `true`. Its API page: `init` and `changeLanguage` return a promise, `changeLanguage` without a language "uses the language detector", and `languageChanged` fires "when changeLanguage got called". In the installed build, `init` loads at once, without a timer, whenever `resources` are given, whatever `initAsync` says.
- **Its types.** `CustomTypeOptions` is extended by module augmentation, with `defaultNS` and `resources`, which "is used to infer the appropriate keys". It needs `strict` or `strictNullChecks`, both of which `tsconfig.base.json` has. JSON imports work for keys; values are not typed as literals.
- **react-i18next.** `initReactI18next` hands the instance to every component. `useTranslation` takes a namespace, a `keyPrefix` and a `lng`, and `useSuspense` is `true` by default. Its site says nothing about re-rendering on a change of language, nor about React 19 or StrictMode, beyond requiring React 16.7 or later. In the installed build, the hook listens for `languageChanged`, so a component shows a new language when `changeLanguage` is called, which is what ticket 07's switch needs. Its peer range is React 16.8 or later, and the dashboard runs React 19.3.
- **Keycloak's JavaScript adapter.** The guide lists `realmAccess`, "The realm roles associated with the token", `hasRealmRole`, and `tokenParsed`. It does not say when they are set. In the installed `keycloak-js` 26.2.4, `realmAccess` is `tokenParsed.realm_access`, set when the access token is, which is before `init()` resolves after a login.

**Settled first: the roles before anything is rendered.** They can be read. `init()` with `login-required` resolves only once someone is logged in, and by then `realmAccess` holds the access token's `realm_access`, the claim the API reads with `callerFromClaims`. The dashboard reads it then and renders nothing before. The adapter decodes the token without checking it. That is enough for choosing what to show, because the API checks the token on every call.

**What was built.**

- **The rule for which half** is `halfFor`, in `apps/dashboard/src/app/halves.ts`: a login with the `admin` role gets the Admin console, also with `vendor` too, and every other login gets the Vendor portal. Role names are compared without regard to case, as the API's `Role.named` compares them. `main.tsx` applies it once, after the login and before the first render.
- **Each half's language and tab title** are one record beside it. The Admin console is `en`, titled "Admin console". The Vendor portal is `languageForBrowser(navigator.languages)` from `i18n`, the rule ticket 02 wrote, and is titled from the language files. A login that could not be completed reads the Vendor portal's entry, because nobody is known yet.
- **Starting the languages.** `startLanguage` gives i18next the text of all three languages at once: the dashboard's own files and the shared terms, in one namespace. It then sets the document's `lang` and `dir`, the direction from `i18n`'s `directions`. `i18next.dir()` is never asked. No language falls back to another (`fallbackLng: false`), so a message missing from one shows its key. Neither the plugin for ICU messages nor the language detector is used.
- **The language files** are `libs/i18n/src/messages/dashboard/{ckb,ar,en}.json`, in i18next's own format, exported as `dashboardMessages` with the type `DashboardMessages`. The README describes them, its draft note now says the drafts must not reach a Vendor either, and its notes on counts and numbers say which format each applies to.
- **A value inside a sentence.** react-i18next's `Trans` puts a value written as `{{…}}` through i18next's escaping, and then reads the sentence as markup. To keep a login's name from ever being read as markup, a value is never written into a message. The message names an element, `<name/>`, and the page passes `Trans` that element with the value already inside it, which React shows as text. i18next's own escaping is switched off, because React escapes what it shows.
- **Keys are type-checked** against the English files and the shared terms, through `apps/dashboard/src/shared/i18n/i18next.d.ts`.
- **The pages.** The Vendor portal's page is in a frame, marked `frame`, laid out at 360 pixels wide first, with logical classes only, and says it is a placeholder. The Admin console's page is today's, with its first line now "Admin console placeholder." in place of "Dashboard placeholder.", written in English where it is used. Who the API says the caller is, with "Ask the API again" and "Log out", is a widget both pages show, `widgets/caller`, so its text comes from the files, and in the Admin console it is the English. The login's name is marked as written, and the role names as always English.
- **The buttons** follow `apps/dashboard/DESIGN.md`, which ticket 10 of `catalog` wrote after this ticket: 44 pixels high (`min-h-control`), a 6-pixel corner (`rounded-lg`), and a border in `input`. This is the one visual change to the Admin console's page. The ticket's "what the dashboard shows today" was written before there was a design.
- **Tokens stay in memory only.** Step 4's test of the browser's storage still passes. No router, and no data-fetching, form or state library, was added.
- **A new layer.** The dashboard gains its first `widgets` folder. `pnpm boundaries:check` passed all 114 cases.

**`pnpm platform:check`** has 39 lines, all passing: the 30 there were after ticket 05, and 9 new ones in `dashboard-languages.spec.ts`, which runs 360 pixels wide.

- As the development Vendor, with the browser set to Arabic, the Vendor portal declares Arabic and right to left; set to English, English and left to right; set to French, Kurdish and right to left.
- In each of the three, the Vendor portal's page does not scroll sideways.
- The placeholder's notice, and the tab's title, differ in each of the three languages.
- As the development Admin, with the browser set to Arabic, the Admin console declares English and left to right, and does not scroll sideways.

**Fault checks,** each planted alone on a clean tree and reverted. They were run before the code review and again after it, with the same result.

| Fault | Result |
|---|---|
| The rule for which half turned round | 8 of the 9 new lines failed. The Admin's two lines failed on the declared language. The Vendor's failed on the direction or on the missing frame. The one that passed is the Vendor's in English, whose Admin console is English and left to right too; its width line failed, on the frame. |
| The document's direction no longer set | All 9 new lines failed, on the `dir` attribute. |
| A key misspelled, `VendorPortalPlaceholder.notise` | `@pcp/dashboard:typecheck` failed with TS2345 and listed the keys there are. |

**Seen once, by me, in screenshots 360 pixels wide,** light and dark: the Vendor portal in Kurdish, Arabic and English, and the Admin console with the browser set to Arabic. In Arabic, `development-vendor` breaks after its hyphen and keeps its own order across the two lines.

**For the owner, at review.**

- **New draft words.** The Vendor portal is "پۆرتاڵی فرۆشیار" in Kurdish and "بوابة البائع" in Arabic. "فرۆشیار" and "البائع" mean "seller", which CONTEXT.md avoids in English for a Vendor. Ticket 09's word list is where the Kurdish and the Arabic word for Vendor are settled, and these follow it.
- **Not tested: the message for a login that could not be completed.** It shows when Keycloak cannot be reached at the start. No test makes that happen. It was read, and type-checked.

**`pnpm check`.** Every commit passed on its own in a fresh clone, with Docker unreachable and the cache skipped, as ticket 05's Comments describe.

