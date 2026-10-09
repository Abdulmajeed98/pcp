# 04: The login screen in Kurdish (Sorani), Arabic and English, right to left where it should be

**Spec:** [the development services spec](../spec.md)

**What to build:** Keycloak's login screen is offered in the platform's three languages, so that a Vendor meets them from the first screen. Kurdish is used when nothing else decides (LANG-6), and the Kurdish and Arabic screens are laid out right to left (LANG-2). Keycloak ships English and Arabic but not Sorani, so the repository holds a Keycloak theme that adds it, as [ADR-0003](../../../docs/adr/0003-three-apps-one-api-keycloak.md) says. The Sorani text is a draft and is marked as awaiting the owner's review (LANG-7).

This ticket holds the step's one unknown. Keycloak's documentation does not say how it chooses the direction of a language, so how it treats Sorani is found out on the running service.

**Blocked by:** 03

**Status:** resolved

- [x] Before the theme is written, Keycloak's current documentation on themes and on languages is checked for the pinned version. The findings are recorded under Comments.
- [x] The repository holds a Keycloak theme that extends Keycloak's default and adds Sorani. It is mounted into the Keycloak container, and the realm uses it.
- [x] The theme declares the three languages for the login, account and email screens, because Keycloak offers a language in a realm only when all three kinds of screen support it.
- [x] The realm's languages are Kurdish (Sorani), Arabic and English, with the tags `ckb`, `ar` and `en`. Kurdish is the default.
- [x] The Sorani text covers the login screen only. It is a draft and is marked in the repository as awaiting the owner's review. Any Sorani text that is missing falls back to Keycloak's English.
- [x] How Keycloak chooses a direction for Sorani is tested on the running service, and the finding is recorded under Comments. The theme sets the direction itself if Keycloak does not.
- [x] The Kurdish and Arabic login screens are laid out right to left, and the English one left to right.
- [x] The theme changes no colours, layout or logo. The login screen's heading does not show the working title "PC Part Picker" as a brand.
- [x] The scripted check gains assertions that the login screen is served in Kurdish, Arabic and English, each with that language's text, and that Kurdish is used when the request names no language.
- [x] The scripted check gains assertions that the Kurdish and Arabic login screens declare a right-to-left direction and the English one left-to-right.
- [x] The scripted check gains an assertion that the realm's default language is Kurdish. It reads this through Keycloak's administration interface, as Keycloak's own administrator.
- [x] Shown once and then reverted, each after a reset and each making the scripted check fail on its own line: Sorani taken out of the theme's language list, the realm's default language changed to English, and the direction of the Kurdish screen left as left-to-right.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 9 October 2026: completed

**How Keycloak chooses a direction.** This was the step's one unknown, and the documentation is silent on it. It was found on the running service and in Keycloak's own templates:

- The login page declares its direction in its opening tag, and only when the realm has languages switched on.
- **Keycloak takes the direction from the language's own name.** A name written right to left makes the screen right to left. No list of right-to-left languages is involved.
- With no theme, Keycloak has no name for Sorani. It shows the bare tag, "ckb", and lays the Kurdish screen out left to right, in English.
- Once a theme declares `ckb`, Keycloak names the language itself, as "کوردیی ناوەندی", and the screen becomes right to left. So the theme does not have to set the direction: declaring the language is enough.
- A theme can give the language another name. When that name was written in Latin letters, the Kurdish screen went back to left to right. The Sorani text file carries a note about this.

**What Keycloak's documentation says,** checked before the theme was written:

- A theme is a folder with one sub-folder for each kind of screen, each holding a settings file that names its parent theme and its languages.
- A language is added with a text file for it and an entry in the theme's language list. The text files are UTF-8.
- A language is offered in a realm only when the login, account and email screens all support it.
- In development mode themes are not cached.

**What differs from the first plan, or is not obvious.**

- **The theme gives Sorani no name of its own.** Keycloak's name, "کوردیی ناوەندی" (Central Kurdish), is shown on all three screens. The shorter "کوردی" was tried and works, but it would show on the Kurdish screen only unless it were also added for Arabic and English. Which name to use is the owner's choice, at review.
- **The Sorani draft is nine lines:** the page title, the heading, the two field labels, the button, the two labels of the show-password button, and the message for a wrong name or password. Everything else on the login screens falls back to Keycloak's English.
- **The check holds a copy of one Sorani phrase,** the heading. It needs a known phrase to tell Sorani text from the English fallback. When the review changes that heading, the copy in the check changes with it.
- **A request that names no language** is one without `ui_locales`. A browser also sends its own language, and Keycloak follows it: a browser set to English gets the English screen, and one set to German, which the realm does not offer, gets Kurdish. That is the rule of LANG-6.
- The theme's parents are Keycloak's current themes: `keycloak.v2` for login, `keycloak.v3` for account and `keycloak` for email.
- The whole themes folder is mounted, so a second theme would need no change to the Compose file.
- The realm uses the theme for all three kinds of screen. Keycloak's server information lists `ckb`, `ar` and `en` for each.
- A change to the Sorani text shows on the next page load, with no restart. A change to the realm's languages or default language needs a reset, like the rest of the realm file.

**Fault checks,** each after `pnpm services:reset` and a new start, and each reverted:

| Fault | Lines that failed |
|---|---|
| Sorani taken out of the login theme's language list | "The Kurdish login screen is laid out right to left": the page declares the direction ltr. The Sorani text is still served, because its file is still there. |
| The realm's default language changed to English | "The login screen is in Kurdish when the request names no language" and "Kurdish is the realm's default language". |
| Kurdish given a name in Latin letters, which leaves its screen left to right | "The Kurdish login screen is laid out right to left". |
| The realm no longer uses the theme | "The login screen is served in Kurdish, with its text" and "The Kurdish login screen is laid out right to left". |
| Arabic taken out of the realm's languages | Both Arabic lines: the page says its language is ckb. |
| English taken out of the realm's languages | Both English lines. |
| After reverting | All 27 lines pass and it exits 0. |

**A fault in the check itself, found by these.** With Arabic taken out of the realm, "The Arabic login screen is laid out right to left" at first still passed: Keycloak served the Kurdish screen instead, which is also right to left. Each language line now confirms that the page came back in the language it asked for before it looks at anything else. The fault was planted again and both Arabic lines failed.

Before the theme existed, the Kurdish and Arabic lines were run and seen to fail: with languages off, every page came back in English.

**By-hand results.**

| Check | Result |
|---|---|
| The Kurdish login screen | Title "چوونەژوورەوە بۆ Platform", heading "Platform", field labels and button in Sorani, direction right to left. The working title does not appear. |
| The language list on each screen | Kurdish: "ئینگلیزی (English)", "عەرەبی (العربية)", "کوردیی ناوەندی". Arabic and English name Kurdish as "السورانية الكردية (کوردیی ناوەندی)" and "Central Kurdish (کوردیی ناوەندی)". |
| The account screens with the theme | Load, in Kurdish and right to left by default, with Keycloak's English text. |
| Files in the theme | Three settings files and one text file. No style sheet, template or image. |
| `pnpm check` with no daemon reachable | Passes. |
