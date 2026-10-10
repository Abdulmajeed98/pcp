# 03: The Shopper switches language on any page, and the choice is remembered

**Spec:** [the languages spec](../spec.md)

**What to build:** The frame of every Shopper page gains a language switch. It is three links to the page the Shopper is on, one in each language, each named in that language and its own script, so that a Shopper can find theirs on a page they cannot read. Because it is links, it works before any script has loaded. Switching keeps the Shopper on the same page.

The choice is remembered for a year. From then on an address with no language goes to the chosen language, whatever the browser's own language is. An address that names a language is still shown in that language, so that a link opens as its sender saw it.

This ticket holds one unknown, which `sharing` will need: exactly when next-intl writes down the choice, and whether merely opening a link in another language changes what is remembered.

**Blocked by:** 02

**Status:** resolved

- [x] Before anything is written, next-intl's documentation is read, for the release that is installed, for its links between languages and for its cookie: its lifetime, when it is written and what reads it. The findings are recorded under Comments.
- [x] The frame holds the switch on every page, the "not found" screen among them. It lists Kurdish, Arabic and English in that order, each under its own name, and shows which one the page is in.
- [ ] The switch is three links to the page the Shopper is on, one in each language. It needs no script. *(It holds for every page but the "not found" screen, which the browser draws by script, the switch with it. Ticket 02 left that screen to the owner: see Comments.)*
- [x] A tap on another language arrives at the same page in that language, with its language and direction declared.
- [x] The choice is remembered in a cookie that lasts a year.
- [x] With a choice remembered, an address with no language is answered with a redirect to the chosen language, although the browser is set to another.
- [x] An address that names a language is shown in that language, whatever is remembered.
- [x] When next-intl writes its cookie is found on the running app and recorded under Comments: at a switch, at a visit to an address in another language, or both. Whether opening a link in another language changes what is remembered is stated plainly, for ticket 10 to record.
- [x] In each language the switch is inside a screen 360 pixels wide and large enough to tap, on the end side of the frame in both directions.
- [x] The helper from ticket 02 also checks that the switch is on the page and inside the screen.
- [x] `pnpm platform:check` gains these lines, and passes on every line:
  - Each language's address, fetched with no browser, holds the switch's three links.
  - A tap on another language arrives at the same page in that language.
  - After a switch, the bare address goes to the chosen language, although the browser is set to another. The browser holds the choice for about a year, and not only for the session.
  - With Arabic remembered, the English address shows English.
  - The "not found" screen has the switch.
- [x] With scripts switched off in the browser, the switch still changes the language. This is a test if Playwright can switch scripts off, and is checked by hand and recorded otherwise.
- [x] Shown once and then reverted: with the cookie's lifetime removed, the line about the year fails.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault check are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 10 October 2026: completed, with one line that does not hold for one screen

**For the owner to decide.**

- **Opening a link in another language changes what is remembered.** This is the answer ticket 10 and `sharing` asked for, and it is yes. next-intl remembers the language of the last address the browser opened, and not the last use of the switch.
  - A Shopper who chose Kurdish and then opens a friend's link to an English page is sent to English from a bare address from then on.
  - A Shopper who has chosen nothing, whose phone is set to Arabic, and who opens a link to an English page, is remembered as English. They chose nothing.
  - The spec gives the Vendor portal the other rule: "Only a use of the switch is remembered." It gives the Shopper app no rule and asks only for this finding.
  - **To remember a use of the switch alone,** next-intl's cookie would be switched off and the platform would write the choice itself, when the switch is used. That is not built.
  - **My recommendation** is to decide it in `sharing`, which decides the shape of a link that is handed to someone else. Until then next-intl's rule stands. It has this for it: a Shopper gets back the language they last read in.
- **On the "not found" screen the switch needs a script.** Ticket 02 said it would. Next answers an address that matches no page with a bare document, and the browser draws the frame, the switch and the screen from it. With scripts off that address shows an empty page with no link on it, which was seen. Everywhere else the three links are in the page as the server sends it. The box for "It needs no script" is left open for this one screen. It closes when the owner decides what becomes of that screen, as ticket 02's Comments set out.
- **The switch is three plain links, and not next-intl's link.** The code review found the reason. next-intl's link changes the page in place once the page's scripts run, and then writes the cookie itself, from the browser. WebKit, which Safari is built on, keeps such a cookie for seven days at most: "persistent cookies created through document.cookie, are capped to a seven day expiry", and "Only cookies created through document.cookie are affected by this change" (WebKit's blog, "Intelligent Tracking Prevention 2.1", 21 February 2019). A Shopper on an iPhone would have been remembered for a week, and no test in Chromium could have shown it. A plain link asks the server for the page, and the server's answer writes the cookie, with scripts and without them.
  - **What it costs.** A switch loads the page again from the server. It does not change in place.
  - **What it was not tested on.** Safari. The tests run in Chromium only, as the spec says. A test holds the switch to asking the server, which is the part that can be tested here.
- **The year runs from the day the language was written down, and a visit does not renew it.** next-intl writes the cookie only when what is remembered changes. A Shopper who chose Arabic and comes back every week is asked nothing for a year. On the first visit after that, a bare address follows the phone's language again, and one tap brings Arabic back for another year.

**What the documentation says,** read before anything was written. next-intl 4.14.9 is the installed release and the current one. What its website says was checked against the installed build.

- **Links between languages.** `createNavigation`, given the statement of the languages, makes `Link`, `usePathname`, `useRouter`, `getPathname` and `redirect`. `Link` with a `locale` leads to the page in that language and sets `hreflang`. Such a link is never fetched ahead, because that "could prematurely overwrite the locale cookie". `usePathname` is the address without its language. It is a hook for a component in the browser, and it throws in a Server Component. The switch the documentation shows is `<Link href={usePathname()} locale="…">` in such a component.
- **What a link needs.** `Link` asks `useLocale`, which in the browser reads `NextIntlClientProvider`. Without the provider it throws. The provider hands the browser every message of the language unless it is given `messages={null}`.
- **The cookie's name and lifetime.** `NEXT_LOCALE`, with `SameSite=lax` so that it is set when a visitor arrives from another site. It has no lifetime unless one is given, so it ends when the browser is closed. A setting given under `localeCookie` is merged with these. The documentation's own example gives it a year.
- **What reads it.** The proxy, and only for an address with no language. The order is the address, the cookie, the browser's languages, the default.
- **What writes it.** The proxy, when a page is asked for. It writes when something is remembered and the page's language is another one, and when nothing is remembered and the page's language is not the browser's. In the documentation's words, an address with a language "will take precedence over a previously matched locale that is saved in a cookie or the `accept-language` header and will update a previous cookie value". It does not write for the requests Next's router makes in the background. next-intl's `Link` and `useRouter` write it too, in the browser, at a click that changes the language.

**When the cookie is written, as seen on the running app.** Each line is one request, or one tap in Chromium. "Remembered" is what the cookie holds.

| What happened | What was written |
|---|---|
| A browser set to Arabic, with nothing remembered, opened the Arabic address | Nothing |
| The same browser opened the English address, as a link would | English, for a year |
| With Arabic remembered, the English address was opened | English, for a year |
| With Arabic remembered, the Arabic address was opened | Nothing. The year was not renewed |
| With Arabic remembered, a browser set to English opened the bare address | Nothing. It was sent to the Arabic address |
| A tap on the switch, with scripts running | What opening that address writes. The tap asked the server for the page, and the answer wrote it |
| A tap on the switch, with scripts switched off | The same |
| A background request of Next's router for the English address, with Arabic remembered | Nothing |
| The bare address, with `fr` remembered, which the platform lacks | The language the browser was sent to |
| An address that matches no page, in English, from a browser set to Arabic | English, for a year. The 404 answer carries it |
| The back button after a switch | The language of the page that came back. The browser asked the server for that page again, and the answer wrote it. Seen on the development server |

- **So: both.** The cookie is written at a switch and at a visit to an address in another language. A switch is not a case of its own: it is a visit to that address.
- **The cookie as the browser holds it:** for the whole site, `SameSite=Lax`, readable by scripts, and ending 365 days after it was written. It is not marked `Secure`. That is a matter for production, which is outside this module.
- **With next-intl's own link,** which was built first and then replaced: with scripts running, a tap asked the server for no page. The link's script wrote the cookie in the browser, and the router fetched the new page in the background. With scripts off, the tap asked the server and the server wrote it. The back button then asked the server for nothing, and the last language tapped stayed remembered while the earlier page was shown.

**What differs from the first plan, or is not obvious.**

- **No part of next-intl runs in the browser,** as before this ticket. Its provider is not rendered and `createNavigation` is not used. The first module that links from one page to another adds them. It should put `createNavigation` in a segment of its own in the Shared layer and not in `i18n`: Next's proxy file imports `i18n`, and would carry the links into every request.
- **Where the switch is.** In the App layer, beside the frame that holds it. Only the frame uses it. It is the element marked `data-testid="language-switch"`, which is how the tests find it.
- **Why it is a component for the browser.** It asks Next for the address of the page that is shown, which only such a component can do. The server renders it as well. The frame gives it the page's language and its label.
- **Which language the page is in.** That link is marked `aria-current="page"`, and is bold where the other two are underlined. No colour is used.
- **For a screen reader.** The switch has a label in the page's language, which is a new message, `Frame.languageSwitch`, drafted in Kurdish and Arabic like the rest. Each link declares its own language, so that each name is read in its own voice.
- **Large enough to tap** is taken as 44 pixels each way, the size Apple's guidelines and WCAG's "Target Size (Enhanced)" give. The tests hold each link to it.
- **A query is not kept.** The links keep the page's path. They drop a query, such as `?q=1`, and a fragment. No page has either yet. The first page that has a query decides whether the switch keeps it.
- **The names in the tests.** The tests find a link by the language's own name, so "کوردی", "العربية" and "English" are written out in the tests' helper. They are not translations. If the owner changes "کوردی" at review, it changes there and in `i18n`.
- **About a year, without naming the cookie.** The test reads every cookie the browser will keep after it is closed, finds the one that holds the chosen language, and expects it to end between 364 and 366 days from now. It then opens a second browser that holds only those cookies, as on another day, and expects the bare address to go to the chosen language.
- **Scripts off is a test.** Playwright can switch scripts off. The test first confirms that the browser runs none, and then taps.
- **Scripts on is confirmed too.** The test waits until the page's scripts have loaded and run, and then expects the tap to ask the server for the page. It was seen to fail on next-intl's link.
- **The helper can write the cookie.** It fetches each page with no browser through the browser's own cookies, so a page fetched in a language other than the browser's is remembered. No test reads what is remembered after it has called the helper.

**`pnpm platform:check`** has 24 lines: the 18 it had and 6 new ones. One old line has a longer name: the "not found" line now says "with the frame and the switch".

- Each language's address, fetched with no browser, holds the switch's three links.
- A tap on another language arrives at the same page in that language, on the first page.
- The same, on the "not found" screen. It is the only other address there is, and it shows that the page is kept.
- After a switch to Arabic in a browser set to English, the bare address goes to Arabic, and the browser holds the choice for about a year, and not only for the session.
- With Arabic remembered, the English address shows English.
- With scripts switched off, the switch still changes the language, and the choice is kept as it is with scripts.

**Fault checks,** each reverted. The first is the one this ticket asks for. Each was planted on the reviewed code, alone, and taken out again by the inverse edit.

| Fault | What happened |
|---|---|
| The cookie's lifetime removed | 2 lines failed: the line about the year, and the line with scripts switched off. Each found no cookie that outlasts the session. In both, the bare address had first gone to Arabic: the session still remembered. |
| English left out of the switch | 8 lines failed: every line that opens a page in all three languages, the line about the three links, and both tap lines. |
| Every link made to lead to the first page | 2 lines failed, both on the "not found" screen: the tap arrived at the first page, and the link "is to this page in Kurdish" was not. |
| The switch drawn in the browser only | 6 lines failed: the lines that read what the server sent, and the line with scripts switched off. The tap lines passed, because scripts drew it. |
| The switch put on the start side | 5 lines failed, each "the switch is on the end side of the frame": 149 pixels of room at the end, where less than 16 was expected. |
| The links made 24 pixels high | 5 lines failed, each "large enough to tap": 24, where at least 44 was expected. |
| The remembered language made to win over the address, in the proxy file | 9 lines failed, "with Arabic remembered, the English address shows English" among them. |
| next-intl's own link in place of the plain one | 2 lines failed: the tap asked the server for no page. |
| Before the switch was built | The 5 lines that open a page in every language failed. |
| Before the cookie was switched on | 3 lines failed: the bare address went to English. |

**Seen once, by hand.**

- **The pages at 360 pixels,** in all three languages, and the "not found" screen in Arabic. The switch is at the top, on the right in English and on the left in Kurdish and Arabic. Kurdish comes first in reading order in each. On the English page the three links are at 144 to 205, 205 to 263 and 263 to 344 pixels across, and 16 to 60 down.
- **At 1024 pixels** the switch stays on the end side of the frame, in English and in Arabic.
- **The "not found" address with scripts off** shows an empty page with no link on it.
- **The Arabic page as the server sends it** holds no message key and nothing of next-intl's provider.

**What the code review found and changed.** Two reviewers read the work, one against the spec and one against the repository's conventions.

- **The seven days in Safari.** The switch became plain links, as above.
- **The year was checked for one writer of two.** With next-intl's link, the browser wrote the cookie with scripts and the server wrote it without, and the year was checked only with scripts. There is one writer now, and the year and the day after are checked both ways.
- **Two tests read a page before they had confirmed its language:** the one that reads the three links in what the server sent, and the one with scripts switched off. The spec's rule is to confirm first.
- **Comments that said more than is true.** The switch's comment said its links are in the page as it arrives, and did not except the "not found" screen. The statement of the languages had its comment above another constant. The helper's comments did not say that the server has to send the switch's links.
- **Names.** The helper's two checks of the switch now say where each looks. A link's whole address had the same name as the part of an address after the language. The message was named `languages` and holds the switch's label.
- **Small things.** The tap test lists the languages in the platform's order. Four checks that a link is inside the window are one.
- **Left as it is.** The switch stays in the App layer. The line about the three links stays a line of its own, although the helper checks the same for every page, because this ticket lists it. A query is not kept, as above.

**The checks.** `pnpm check --skip-nx-cache` passed for each of the three commits that change code, each checked out on its own into a fresh folder with a fresh install, with Docker made unreachable for the command and Playwright pointed at a folder that holds no browser. It also passed in the working folder with the two service containers stopped. `pnpm boundaries:check` passed on all 114 lines. `pnpm platform:check` passed on all 24 lines and left no app running.

**Worth knowing.**

- **One file of the tests** can be run alone: `pnpm exec nx e2e @pcp/e2e --skip-nx-cache -- src/shopper-languages.spec.ts`. It starts and stops the apps as `pnpm platform:check` does, and does not first make sure that the services are running.
- **The services are stopped.** They were stopped when this work began. `pnpm services:up` starts them.
