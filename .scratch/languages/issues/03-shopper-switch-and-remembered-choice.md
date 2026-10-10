# 03: The Shopper switches language on any page, and the choice is remembered

**Spec:** [the languages spec](../spec.md)

**What to build:** The frame of every Shopper page gains a language switch. It is three links to the page the Shopper is on, one in each language, each named in that language and its own script, so that a Shopper can find theirs on a page they cannot read. Because it is links, it works before any script has loaded. Switching keeps the Shopper on the same page.

The choice is remembered for a year. From then on an address with no language goes to the chosen language, whatever the browser's own language is. An address that names a language is still shown in that language, so that a link opens as its sender saw it.

This ticket holds one unknown, which `sharing` will need: exactly when next-intl writes down the choice, and whether merely opening a link in another language changes what is remembered.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Before anything is written, next-intl's documentation is read, for the release that is installed, for its links between languages and for its cookie: its lifetime, when it is written and what reads it. The findings are recorded under Comments.
- [ ] The frame holds the switch on every page, the "not found" screen among them. It lists Kurdish, Arabic and English in that order, each under its own name, and shows which one the page is in.
- [ ] The switch is three links to the page the Shopper is on, one in each language. It needs no script.
- [ ] A tap on another language arrives at the same page in that language, with its language and direction declared.
- [ ] The choice is remembered in a cookie that lasts a year.
- [ ] With a choice remembered, an address with no language is answered with a redirect to the chosen language, although the browser is set to another.
- [ ] An address that names a language is shown in that language, whatever is remembered.
- [ ] When next-intl writes its cookie is found on the running app and recorded under Comments: at a switch, at a visit to an address in another language, or both. Whether opening a link in another language changes what is remembered is stated plainly, for ticket 10 to record.
- [ ] In each language the switch is inside a screen 360 pixels wide and large enough to tap, on the end side of the frame in both directions.
- [ ] The helper from ticket 02 also checks that the switch is on the page and inside the screen.
- [ ] `pnpm platform:check` gains these lines, and passes on every line:
  - Each language's address, fetched with no browser, holds the switch's three links.
  - A tap on another language arrives at the same page in that language.
  - After a switch, the bare address goes to the chosen language, although the browser is set to another. The browser holds the choice for about a year, and not only for the session.
  - With Arabic remembered, the English address shows English.
  - The "not found" screen has the switch.
- [ ] With scripts switched off in the browser, the switch still changes the language. This is a test if Playwright can switch scripts off, and is checked by hand and recorded otherwise.
- [ ] Shown once and then reverted: with the cookie's lifetime removed, the line about the year fails.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault check are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
