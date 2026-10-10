# 07: The Vendor switches language in place, and the choice is remembered

**Spec:** [the languages spec](../spec.md)

**What to build:** The Vendor portal's frame gains a language switch, with each language named in that language and its own script. A tap changes the language, the direction and the tab's title in place: the page is not loaded again, Keycloak is not visited and nothing the Vendor was doing is lost.

The choice is remembered in the browser, also after the Vendor logs out and in again. From then on the Vendor portal opens in the remembered choice, else in the browser's language, else in Kurdish. Only a use of the switch is remembered. A language that was merely detected is not stored.

The Admin console has no switch. It neither reads nor writes the remembered choice, so a Vendor's language is still there after the Admin has used the same browser, and the Admin's screens stay in English after a Vendor has.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] The Vendor portal's frame holds the switch on every screen. It lists Kurdish, Arabic and English in that order, each under its own name, and shows which one the portal is in.
- [ ] A tap changes the language, the direction and the tab's title in place. The page is not loaded again and Keycloak is not visited.
- [ ] A use of the switch is remembered in the browser's storage. Nothing is stored before the switch is used.
- [ ] The Vendor portal opens in the remembered choice, else in the browser's language, else in Kurdish.
- [ ] The choice holds after a reload, and after logging out and in again.
- [ ] The message for a login that could not be completed follows the remembered choice too.
- [ ] The Admin console has no switch. It neither reads nor writes the remembered choice.
- [ ] The language choice is the only thing the dashboard keeps in the browser's storage. Tokens stay in memory only.
- [ ] In each language the switch is inside a screen 360 pixels wide and large enough to tap, on the end side of the frame in both directions.
- [ ] `pnpm platform:check` gains these lines, and passes on every line:
  - The development Vendor gets the page with the switch, and the development Admin gets a page without one.
  - A tap on another language changes the language and the direction the page declares. The page was not loaded again and Keycloak was not visited.
  - The choice holds after a reload, and after logging out and in again.
  - After the development Vendor has chosen Arabic and logged out, the development Admin in the same browser still gets English. When the development Vendor logs in again, Arabic is still remembered.
  - With a language remembered, the browser's storage still holds no token.
  - In each language the switch is inside the screen.
- [ ] Shown once and then reverted, each failing on its own line: the dashboard made to ignore the remembered choice; the Admin console made to read it.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
