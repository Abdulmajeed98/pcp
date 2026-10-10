# 02: The Shopper app's page is in Kurdish, Arabic and English, and its address names the language

**Spec:** [the languages spec](../spec.md)

**What to build:** A Shopper opens the site and it is in their language. The language is the first part of every page's address, for all three languages. An address with no language is answered with a redirect: to the browser's language when the platform has it, and to Kurdish otherwise. The server sends every page with its language and its direction already declared, so Kurdish and Arabic arrive right to left and nothing flashes. The tab's title is in the Shopper's language, and an address that matches no page gets a "not found" screen in it too.

This ticket is the first path through every part. It creates what `i18n` holds about the three languages, the Shopper app's language files, next-intl's set-up, and the end-to-end helper that checks a page in all three languages in a window 360 pixels wide. The switch and the remembered choice follow in ticket 03.

The page is still a placeholder. It keeps the line it fetches from the API, now in the Shopper's language, inside a frame: the part every later screen shares.

The Kurdish and the Arabic text is a draft. Nothing here has been read by a speaker yet.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Before anything is written, next-intl's documentation is read, for the release that is installed, for its routing set-up, its proxy, its request set-up, how a page learns its language, its types, its alternate links and a "not found" page. Next's documentation is read, for the installed version, for the proxy file and for root parameters. The findings are recorded under Comments.
- [ ] Whether next-intl's set-up needs a newer Next than the one installed is settled first. If it does, Next is upgraded within version 16, and `pnpm check` and `pnpm platform:check` pass after the upgrade and before anything else changes. What was found is recorded.
- [ ] `i18n` holds the three languages in the order Kurdish, Arabic, English: the tags `ckb`, `ar` and `en`, the names "کوردی", "العربية" and "English", and each one's direction. It holds Kurdish as the fallback.
- [ ] `i18n` holds the rule for a browser's languages: the first one the platform has, a regional form counting as its language, and Kurdish when none matches. It uses the matching library next-intl uses, with its "best fit" method.
- [ ] `i18n` depends on neither next-intl nor i18next, nor on React or Next. Its placeholder export is deleted, and each frontend's list of libraries it does not use yet loses the entry.
- [ ] `i18n` holds the Shopper app's text as one JSON file for each language, in next-intl's format. English is the source. A note beside the files marks the Kurdish and the Arabic text as drafts awaiting review and names LANG-7.
- [ ] The language is the first part of every page's address. No language has a bare address.
- [ ] An address with no language is answered with a redirect to the same address in the browser's language, and in Kurdish when the platform does not have it.
- [ ] The server sends each page with its language and its direction declared on the document. No script sets either.
- [ ] The page's text and the tab's title come from the language files. The working title "PC Part Picker" appears nowhere.
- [ ] The page keeps the line it fetches from the API and the line it shows when the API cannot be reached, each in the Shopper's language. It is still marked as a placeholder.
- [ ] A page reads its text on the server. Only the text a component needs in the browser is sent there.
- [ ] An address that matches no page is answered 404, with a "not found" screen inside the frame, in the visitor's language.
- [ ] next-intl's alternate links stay switched on: the answer to a language's address names that page's address in all three languages.
- [ ] The frame is laid out at 360 pixels wide first and adapts upward, with logical classes only.
- [ ] next-intl's statement of the languages and its request set-up live in a segment of the Shared layer. Next's proxy file sits beside Next's routing folder and imports that segment and nothing else. The route files move under a language segment and still only re-export.
- [ ] The statement of the import bans holds the proxy file to that. `pnpm boundaries:write` writes it out, and `pnpm boundaries:check` gains a refused case and an allowed case for the proxy file and passes on every line.
- [ ] The page is still rendered when it is requested: `pnpm check` builds the Shopper app with no API running.
- [ ] Code that asks for a key the English file does not have fails type-checking. Shown once and then reverted with a misspelled key.
- [ ] The language tests run in Chromium in a window 360 pixels wide, and set the browser's language through Playwright's own setting. Step 4's tests keep their window.
- [ ] A helper takes a page's address and checks it in all three languages: the language the page declares, its direction, and that it does not scroll sideways. It confirms that the page came back in the language it asked for before it reads anything else.
- [ ] No test quotes a translation. The languages are told apart by the language the page declares and by the same piece of text differing between them.
- [ ] `pnpm platform:check` gains these lines, and passes on every line, the old ones among them:
  - A browser set to Arabic as written in Iraq opens the bare address and arrives at the Arabic one. One set to English arrives at the English one. One set to French arrives at the Kurdish one, and so does one set to Kurdish. One that lists French and then Arabic arrives at the Arabic one.
  - Each language's address, fetched with no browser, declares that language and its direction and holds that language's text.
  - The same piece of text is different in each of the three languages.
  - An address that matches no page is answered 404, with the frame, in the visitor's language.
  - In each language the page does not scroll sideways.
  - The answer to a language's address names that page's address in all three languages.
  - The tab's title is different in each language.
  - Step 4's test, that the page comes from the API, passes at a language's address.
- [ ] Shown once and then reverted, each failing on its own line: Kurdish stated as left to right; the fallback changed to English; Arabic taken out of the Shopper app's languages; an element wider than the screen added to the frame.
- [ ] A new package's install script is read before it is added to the list pnpm allows.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
