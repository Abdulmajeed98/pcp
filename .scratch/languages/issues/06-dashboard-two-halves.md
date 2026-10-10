# 06: The dashboard has two halves: the Vendor portal in the Vendor's language, and the Admin console in English

**Spec:** [the languages spec](../spec.md)

**What to build:** The dashboard tells its two halves apart, by one rule in one place. A login that holds the Admin role gets the Admin console. Every other login gets the Vendor portal. A login that holds both roles gets the Admin console.

A Vendor's first visit to the Vendor portal follows the browser's language, and falls back to Kurdish. Kurdish and Arabic are laid out right to left, and the tab's title is in the Vendor's language. The Admin console is in English and left to right, whatever the browser's language is.

react-i18next gives the dashboard its languages, as the owner chose on 10 October 2026. The dashboard's text is a set of language files of its own in `i18n`, in i18next's own format. The switch and the remembered choice follow in ticket 07.

Both pages are still placeholders. The Vendor portal's page keeps who the API says the caller is and its two buttons, in the Vendor's language, inside a frame. The Admin console's page is what the dashboard shows today.

This ticket holds one unknown: whether the dashboard can read the login's roles from Keycloak's adapter before it renders anything.

**Blocked by:** 01, 02, 05

**Status:** ready-for-agent

- [ ] Before anything is written, the documentation of i18next and of react-i18next is read, for the releases that are installed, for starting it with text that is already loaded, for changing the language, for its types and for React 19. Keycloak's guide to its JavaScript adapter is read for the roles of a login. The findings are recorded under Comments.
- [ ] Whether the dashboard can read the login's roles from the adapter before it renders anything is settled first and recorded. It reads them from the same claim the API reads.
- [ ] react-i18next and i18next give the dashboard its languages. The plugin that makes i18next read ICU messages is not used, and neither is the plugin that detects a browser's language.
- [ ] `i18n` holds the dashboard's text as one JSON file for each language, in i18next's own format. English is the source, and the draft note covers the Kurdish and the Arabic.
- [ ] The rule for which half a login gets is applied once, when the dashboard starts, and is stated in one place: the Admin role gets the Admin console, also when the login holds the Vendor role too, and every other login gets the Vendor portal.
- [ ] The Vendor portal opens in the browser's language when the platform has it, and in Kurdish otherwise. It asks `i18n`'s rule, the one ticket 02 wrote.
- [ ] The dashboard sets the document's language, direction and title when it starts. The direction comes from `i18n`, and no library is asked for it.
- [ ] The Vendor portal's page keeps who the API says the caller is and its two buttons, in the Vendor's language, inside a frame laid out at 360 pixels wide first, with logical classes only. It is still marked as a placeholder.
- [ ] The Admin console is in English and left to right. Its page is what the dashboard shows today.
- [ ] Text that only the Admin console shows is written in English where it is used, and is not in the language files. A component that both halves use takes its text from the files, and in the Admin console it shows the English.
- [ ] The message for a login that could not be completed follows the Vendor portal's rule, because nobody is known yet.
- [ ] Code that asks for a key the English file does not have fails type-checking. Shown once and then reverted with a misspelled key.
- [ ] Tokens stay in memory only. No router and no data-fetching, form or state library is added.
- [ ] `pnpm platform:check` gains these lines, and passes on every line, step 4's among them:
  - As the development Vendor, with the browser set to Arabic, the page declares Arabic and right to left. Set to English, it declares English and left to right. Set to French, it declares Kurdish and right to left.
  - The same piece of text is different in each of the three languages, and so is the tab's title.
  - In each language the Vendor portal's page does not scroll sideways in a window 360 pixels wide.
  - As the development Admin, with the browser set to Arabic, the page declares English and left to right.
  - The Admin console's page does not scroll sideways.
- [ ] Shown once and then reverted, each failing on its own line: the rule for which half turned round; the document's direction no longer set.
- [ ] A new package's install script is read before it is added to the list pnpm allows.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
