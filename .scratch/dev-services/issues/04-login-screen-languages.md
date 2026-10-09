# 04: The login screen in Kurdish (Sorani), Arabic and English, right to left where it should be

**Spec:** [the development services spec](../spec.md)

**What to build:** Keycloak's login screen is offered in the platform's three languages, so that a Vendor meets them from the first screen. Kurdish is used when nothing else decides (LANG-6), and the Kurdish and Arabic screens are laid out right to left (LANG-2). Keycloak ships English and Arabic but not Sorani, so the repository holds a Keycloak theme that adds it, as [ADR-0003](../../../docs/adr/0003-three-apps-one-api-keycloak.md) says. The Sorani text is a draft and is marked as awaiting the owner's review (LANG-7).

This ticket holds the step's one unknown. Keycloak's documentation does not say how it chooses the direction of a language, so how it treats Sorani is found out on the running service.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Before the theme is written, Keycloak's current documentation on themes and on languages is checked for the pinned version. The findings are recorded under Comments.
- [ ] The repository holds a Keycloak theme that extends Keycloak's default and adds Sorani. It is mounted into the Keycloak container, and the realm uses it.
- [ ] The theme declares the three languages for the login, account and email screens, because Keycloak offers a language in a realm only when all three kinds of screen support it.
- [ ] The realm's languages are Kurdish (Sorani), Arabic and English, with the tags `ckb`, `ar` and `en`. Kurdish is the default.
- [ ] The Sorani text covers the login screen only. It is a draft and is marked in the repository as awaiting the owner's review. Any Sorani text that is missing falls back to Keycloak's English.
- [ ] How Keycloak chooses a direction for Sorani is tested on the running service, and the finding is recorded under Comments. The theme sets the direction itself if Keycloak does not.
- [ ] The Kurdish and Arabic login screens are laid out right to left, and the English one left to right.
- [ ] The theme changes no colours, layout or logo. The login screen's heading does not show the working title "PC Part Picker" as a brand.
- [ ] The scripted check gains assertions that the login screen is served in Kurdish, Arabic and English, each with that language's text, and that Kurdish is used when the request names no language.
- [ ] The scripted check gains assertions that the Kurdish and Arabic login screens declare a right-to-left direction and the English one left-to-right.
- [ ] The scripted check gains an assertion that the realm's default language is Kurdish. It reads this through Keycloak's administration interface, as Keycloak's own administrator.
- [ ] Shown once and then reverted, each after a reset and each making the scripted check fail on its own line: Sorani taken out of the theme's language list, the realm's default language changed to English, and the direction of the Kurdish screen left as left-to-right.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
