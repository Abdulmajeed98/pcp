# 02: The Shopper app's page is in Kurdish, Arabic and English, and its address names the language

**Spec:** [the languages spec](../spec.md)

**What to build:** A Shopper opens the site and it is in their language. The language is the first part of every page's address, for all three languages. An address with no language is answered with a redirect: to the browser's language when the platform has it, and to Kurdish otherwise. The server sends every page with its language and its direction already declared, so Kurdish and Arabic arrive right to left and nothing flashes. The tab's title is in the Shopper's language, and an address that matches no page gets a "not found" screen in it too.

This ticket is the first path through every part. It creates what `i18n` holds about the three languages, the Shopper app's language files, next-intl's set-up, and the end-to-end helper that checks a page in all three languages in a window 360 pixels wide. The switch and the remembered choice follow in ticket 03.

The page is still a placeholder. It keeps the line it fetches from the API, now in the Shopper's language, inside a frame: the part every later screen shares.

The Kurdish and the Arabic text is a draft. Nothing here has been read by a speaker yet.

**Blocked by:** 01

**Status:** resolved

- [x] Before anything is written, next-intl's documentation is read, for the release that is installed, for its routing set-up, its proxy, its request set-up, how a page learns its language, its types, its alternate links and a "not found" page. Next's documentation is read, for the installed version, for the proxy file and for root parameters. The findings are recorded under Comments.
- [x] Whether next-intl's set-up needs a newer Next than the one installed is settled first. If it does, Next is upgraded within version 16, and `pnpm check` and `pnpm platform:check` pass after the upgrade and before anything else changes. What was found is recorded.
- [x] `i18n` holds the three languages in the order Kurdish, Arabic, English: the tags `ckb`, `ar` and `en`, the names "کوردی", "العربية" and "English", and each one's direction. It holds Kurdish as the fallback.
- [x] `i18n` holds the rule for a browser's languages: the first one the platform has, a regional form counting as its language, and Kurdish when none matches. It uses the matching library next-intl uses, with its "best fit" method.
- [x] `i18n` depends on neither next-intl nor i18next, nor on React or Next. Its placeholder export is deleted, and each frontend's list of libraries it does not use yet loses the entry.
- [x] `i18n` holds the Shopper app's text as one JSON file for each language, in next-intl's format. English is the source. A note beside the files marks the Kurdish and the Arabic text as drafts awaiting review and names LANG-7.
- [x] The language is the first part of every page's address. No language has a bare address.
- [x] An address with no language is answered with a redirect to the same address in the browser's language, and in Kurdish when the platform does not have it.
- [ ] The server sends each page with its language and its direction declared on the document. No script sets either. *(It holds for every page but the "not found" screen, which the browser draws by script. The owner decides what becomes of that: see Comments.)*
- [x] The page's text and the tab's title come from the language files. The working title "PC Part Picker" appears nowhere.
- [x] The page keeps the line it fetches from the API and the line it shows when the API cannot be reached, each in the Shopper's language. It is still marked as a placeholder.
- [x] A page reads its text on the server. Only the text a component needs in the browser is sent there.
- [x] An address that matches no page is answered 404, with a "not found" screen inside the frame, in the visitor's language.
- [x] next-intl's alternate links stay switched on: the answer to a language's address names that page's address in all three languages.
- [x] The frame is laid out at 360 pixels wide first and adapts upward, with logical classes only.
- [x] next-intl's statement of the languages and its request set-up live in a segment of the Shared layer. Next's proxy file sits beside Next's routing folder and imports that segment and nothing else. The route files move under a language segment and still only re-export.
- [x] The statement of the import bans holds the proxy file to that. `pnpm boundaries:write` writes it out, and `pnpm boundaries:check` gains a refused case and an allowed case for the proxy file and passes on every line.
- [x] The page is still rendered when it is requested: `pnpm check` builds the Shopper app with no API running.
- [x] Code that asks for a key the English file does not have fails type-checking. Shown once and then reverted with a misspelled key.
- [x] The language tests run in Chromium in a window 360 pixels wide, and set the browser's language through Playwright's own setting. Step 4's tests keep their window.
- [x] A helper takes a page's address and checks it in all three languages: the language the page declares, its direction, and that it does not scroll sideways. It confirms that the page came back in the language it asked for before it reads anything else.
- [x] No test quotes a translation. The languages are told apart by the language the page declares and by the same piece of text differing between them.
- [x] `pnpm platform:check` gains these lines, and passes on every line, the old ones among them:
  - A browser set to Arabic as written in Iraq opens the bare address and arrives at the Arabic one. One set to English arrives at the English one. One set to French arrives at the Kurdish one, and so does one set to Kurdish. One that lists French and then Arabic arrives at the Arabic one.
  - Each language's address, fetched with no browser, declares that language and its direction and holds that language's text.
  - The same piece of text is different in each of the three languages.
  - An address that matches no page is answered 404, with the frame, in the visitor's language.
  - In each language the page does not scroll sideways.
  - The answer to a language's address names that page's address in all three languages.
  - The tab's title is different in each language.
  - Step 4's test, that the page comes from the API, passes at a language's address.
- [x] Shown once and then reverted, each failing on its own line: Kurdish stated as left to right; the fallback changed to English; Arabic taken out of the Shopper app's languages; an element wider than the screen added to the frame.
- [x] A new package's install script is read before it is added to the list pnpm allows.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 10 October 2026: completed, with one line that does not hold for one screen

**For the owner to decide.**

- **The "not found" screen is drawn by script.** The server answers an address that matches no page with the status 404, as asked. Its document is Next's bare one: no language, no direction and nothing in it. The browser then draws the screen, in the visitor's language, right to left where it should be and inside the frame. With scripts off, or before they load, the visitor sees an empty page. This is how Next answers every `notFound()`, in the development server and in the built app alike: the part of React that catches it runs in the browser only. next-intl's documentation gives this very set-up for a "not found" screen in a language. The line of this ticket that says the server sends each page with its language and direction therefore holds for every page but this one, and its box is left open.
  - **What it touches next.** Ticket 03 puts the switch on the "not found" screen and says the switch needs no script. On that screen it will need one. A page that a later module answers with `notFound()`, such as a Part that does not exist, will behave the same.
  - **A way out, tried and then removed.** Next has a page for exactly this case, `global-not-found`, for an app whose root layout is inside a segment of the address. It is behind an experimental setting, `experimental.globalNotFound`, and has been since Next 15.4. With the setting on and the catch-all route taken out, `/ar/no-such-page` was answered 404 with `<html lang="ar">` in what the server sent, in the development server and in the built app. It learns the language from the header next-intl's proxy puts on the request. It costs an experimental setting, a second place that draws the document and the frame, because that page is shown outside the layout, and a dependence on a header next-intl does not document. It mends an address that matches no page. It does not mend a `notFound()` called by a real page.
  - **My recommendation** is to leave it as it is for now and decide when `browse` builds the first page that can be "not found", because that is the case Shoppers will meet and the experimental page does not cover it.
- **Next 16.4 writes an `AGENTS.md`.** When an AI coding agent starts the development server, Next 16.4 writes an `AGENTS.md` into the app's folder, which tells agents to read the documentation that ships inside the package. It is switched off, with `agentRules: false` in `next.config.js`, because this repository keeps its instructions for agents in `CLAUDE.md` and `docs/agents`. Remove the line to have the file, and commit it once.

**What the documentation says,** read before anything was written. next-intl 4.14.9 is both the installed release and the current one, so its website describes what is installed. What it says was checked against the installed build.

- **Routing set-up.** `defineRouting` states the languages and the default one. Unless told otherwise the language is the first part of every address, for every language.
- **The proxy.** `createMiddleware`, given that statement, is the default export of Next's proxy file. It takes the language from the address first, then from its cookie, then from the browser's languages, then the default. It answers an address with no language with a redirect. It matches a browser's languages with `@formatjs/intl-localematcher`, with the "best fit" method, which is that library's own default. Before it matches, it puts the languages in order, longest tag first, to get round a fault in the library. The three tags are in that order already.
- **Request set-up.** A file whose default export is `getRequestConfig`, which answers the language and the messages of one request. Its path is given to next-intl's plugin in `next.config.js`. The current set-up reads the language from `next/root-params`. The earlier means, `requestLocale` and `setRequestLocale`, are marked as deprecated.
- **How a page learns its language.** On the server, `getLocale` and `getTranslations` ask the request set-up. `generateMetadata` uses `getTranslations` for the title.
- **Types.** An interface, `AppConfig`, is extended with the type of the languages and the type of one language's messages. A key is then checked against that one file. The arguments of a message are checked only with an experimental setting that writes a declaration file beside the JSON.
- **Alternate links.** On unless switched off. The answer carries a `Link` header with one entry for each language, and one more, `x-default`, for the address with no language.
- **A "not found" screen.** A `not-found` file in the language segment, and a catch-all route beside it whose page calls `notFound()`.
- **What reaches the browser.** `NextIntlClientProvider`, rendered on the server, passes all of the request's messages on to the browser unless it is told not to.
- **Next 16.4.0: the proxy file.** `proxy.ts` is at the project's root or inside `src`, at the same level as the routing folder. It exports one function, as the default export or under the name `proxy`, and may export a `config` whose `matcher` has to be a constant. The file was called `middleware` before Next 16.
- **Next 16.4.0: root parameters.** `next/root-params` was introduced in 16.3.0. It has one function for each part of the address that comes before the root layout, named after its folder, and it is for the server only. Its types are written by `next typegen`, which the Shopper app's `typecheck` target already runs.
- **Where Next's documentation is.** The same pages ship inside the package, under `node_modules/next/dist/docs`, for the installed version exactly.

**Whether a newer Next was needed.** It was. The installed Next was 16.1.7, and next-intl's current set-up needs root parameters, which arrived in 16.3. Next is now 16.4.0, released on 6 October 2026. Nx's Next plugin took it without a change. `pnpm check --skip-nx-cache` and `pnpm platform:check` passed on the upgrade alone, before anything else changed, and it is a commit of its own. Next 16.4 declares a plain stylesheet itself, so the declaration ticket 01 added is deleted, as its file said to.

**What differs from the first plan, or is not obvious.**

- **next-intl's plugin and Nx.** The plugin takes the request set-up's path from the working directory and will not take an absolute one. Next works in the app's folder. Nx reads `next.config.js` from the repository root, where a path from the app's folder names nothing, and with `NODE_ENV` set to `development` next-intl then throws. Nx could not work out the project graph, and no Nx command ran for any project. It showed once during the work and then hid, because Nx keeps what it read. `next.config.js` now writes the path from wherever it is read. Seen to fail and then to pass, from a cleared Nx state.
- **Nothing is remembered yet.** next-intl remembers a language in a cookie unless told not to. With that on, an Arabic browser that opened `/en` got a cookie and was sent to English from the bare address for as long as it stayed open. The cookie is switched off, with `localeCookie: false`, so that an address with no language follows the browser alone. Ticket 03 switches it on with a lifetime. What was seen, which is part of what ticket 03 has to find out: the cookie is written when the language of an address differs from the browser's, at a visit and not only at a switch, and it lasts until the browser is closed.
- **A browser that lists two languages.** Playwright's `locale` holds one language. A list is refused, and leaving it unset gives American English, not nothing. For "French and then Arabic" the test writes the list into each request on its way out, which changes what is sent to a server and not what the browser tells a page. The Shopper app's server reads only the first. Each first-visit line also confirms what the browser sent before it reads where it arrived. That check caught my first attempt, which had set nothing and would have passed as "a language the platform lacks".
- **The helper reads the server's answer as well.** It opens the page in each language in a browser, and it also fetches it with no browser and reads the language and the direction there. A later page that calls it is therefore held to the server sending both. The "not found" test says that its screen is drawn by script, and the helper then reads the browser only.
- **The language segment is the folder `[locale]`,** the name next-intl's documentation uses. Next names the root parameter after the folder.
- **`i18n` still has one entry.** The Shopper app's messages are exported from it, typed as the English file. A message missing from the Kurdish or the Arabic file already fails `i18n`'s own type-checking, because the three are held in one record of that type. Ticket 09's step is still needed: type-checking sees neither a message that only one language has nor a broken placeholder.
- **The arguments of a message are not type-checked.** TypeScript reads every text of a JSON file as a plain string. next-intl's experimental setting for this would write a file into `i18n` on every build, and is not used.
- **No language file reaches the browser.** No component needs text in the browser yet, so `NextIntlClientProvider` is not used at all. In the answer to `/ar` there is no message key, and no text of a message that the page does not show. The text of the "not found" screen is in it, already drawn: Next sends that screen with every page, for the browser to show if it has to.
- **Library names and the timestamp are not kept apart yet.** On the Kurdish and the Arabic page, `@pcp/compatibility, @pcp/ui` and the time the API started sit inside a right-to-left sentence, and the browser may reorder their pieces. Ticket 04 builds the component that keeps such text apart, and it should use it here.
- **An address with a dot in it is a file.** The proxy leaves it alone, as next-intl's documentation sets it up, so that files are not redirected. `/favicon.ico` and `/en/file.txt` are answered 404 with Next's bare document. A page whose address holds a dot would need a line in the proxy's `matcher`.
- **Other addresses, as seen:** `/EN` is redirected to `/en`, `/en/` to `/en`, and `/?q=1` keeps its query. `/fr` is not a language of the platform, so it is redirected to `/ckb/fr`, which is "not found" in Kurdish.
- **The frame** is in the App layer, beside the root layout that uses it. It is the element marked `data-testid="frame"`, which is how the tests find it. It breaks a word that is too long for the screen. It has no header yet: ticket 03 adds the switch.
- **The proxy file's bans.** They are for every file at the app's root whose name starts with `proxy.`, which is how a planted file can stand in for the real one. Oxlint's pattern for that reaches a file of that name at any depth, so the block is written first and the layers' blocks replace it. That was seen to matter: with the block last, a file in the Shared layer named like the proxy file got the proxy's bans in place of its layer's.
- **The matching library** is at 0.8.14, the release next-intl's own range resolves to, and `i18n` lists the same range so that there is one copy. Its newest release is 0.9.0.
- **Install scripts.** The two packages brought 18 more. pnpm stops at a script the workspace file does not list, and did not stop. None of the 18 has one, except a second copy of `@swc/core`, 1.16.13, which next-intl asks for. Its script is the same file, byte for byte, as the one already allowed. `pnpm-workspace.yaml` is unchanged.
- **Step 4's test** opens `/en` instead of the bare address, in its old window.

**The rule for a browser's languages,** run once on the installed library through `i18n`'s function. Nothing calls that function yet. The Shopper app's redirect is next-intl's own call to the same library, and the lines of `pnpm platform:check` prove that one.

| The browser states | The language |
|---|---|
| Arabic as written in Iraq | Arabic |
| British English | English |
| Sorani as written in Iraq, or in Iran | Kurdish |
| `ku`, Kurdish as a whole | Kurdish |
| French, German, Persian or Turkish | Kurdish |
| French and then Arabic | Arabic |
| French and then English | English |
| Urdu | English |
| Nothing, or a tag that cannot be read | Kurdish |

**Fault checks,** each reverted. `pnpm platform:check` has 18 lines: the 7 it had and 11 new ones.

| Fault | What happened |
|---|---|
| A key misspelled in the placeholder page, `apiUnreachible` | `@pcp/shopper:typecheck` failed with TS2345 and named the keys the English file has. |
| Kurdish stated as left to right in `i18n` | 5 lines failed, each "in Kurdish", expecting `rtl` and reading `ltr`: the four that open the page in every language, and the "not found" line. The five first-visit lines, the alternate links and step 4's test passed. |
| The fallback changed to English | 1 line failed: the French browser arrived at the English address. The Kurdish browser still arrived at the Kurdish one. |
| Arabic taken out of the Shopper app's languages | 8 lines failed: both browsers that should arrive at Arabic arrived at Kurdish, every line that opens the Arabic address failed there, and the alternate links no longer named it. |
| An element 500 pixels wide added to the frame | 5 lines failed, first on the Kurdish page: the page was 516 pixels wide in a window of 360. A page laid out right to left is therefore measured too. |
| The alternate links switched off | 1 line failed: the one about them. |
| One title for every language | 1 line failed: the one about the title. |
| The "not found" test told that its screen comes from the server | Its line failed: the server's answer declared no language. This is the helper's check of what the server sends. |
| The proxy file's bans, before they were stated | The four refused cases failed with "lint did not report it", and the allowed one passed. |
| A message taken out of the Arabic file | `@pcp/i18n:typecheck` failed with TS2322. |

**Seen once, by hand.**

- **With no API running,** each language's address is answered 200 and shows the line about the API in that language.
- **The built app.** The Shopper app was built and served with `nx start`, and the 11 language lines passed against it. `pnpm platform:check` runs the development servers.
- **The build** lists `/[locale]` as rendered on demand, with no API running.
- **The working title** appears in no file of the Shopper app, of `i18n` or of the tests.

**What the code review found and changed.**

- **The helper read the browser alone.** It now reads the server's answer as well, as above.
- **next-intl's cookie was on.** It is off, as above.
- **Comments that said more than is true.** Two in `i18n` described a switch and a dashboard that do not exist yet. The note beside the language files said that translated text is nowhere else, and the Sorani text of the login screen is with Keycloak's theme. The layout said "every page".
- **A claim nothing proved.** The statement of the bans said that a file inside a layer keeps its layer's bans when it is named like the proxy file. `pnpm boundaries:check` has a case for it now.
- **Small things.** The helper returns what a test reads in each language, so three tests no longer fill a map each. The window's width is stated once. A few names say what they hold.
- **Left as it is.** The tests say "visitor" for someone at an address that matches no page, as this ticket does. The tests' helper file holds the three languages, the checks, the reading of a served page and the reading of the `Link` header: it is one file until a second set of language tests wants part of it.

**The checks.** `pnpm check --skip-nx-cache` passed for each of the six commits that change code, each checked out on its own into a fresh folder with a fresh install, with Docker made unreachable for the command and Playwright pointed at a folder that holds no browser. It takes about 6 seconds. It also passed on the reviewed work while the two service containers were stopped. `pnpm boundaries:check` passed on all 114 lines: the 108 it had, five for the proxy file and one for a file named like it. `pnpm platform:check` passed on all 18 lines and left no app running.

**Worth knowing.**

- **`pnpm platform:check` is the way to run the tests.** Run directly with Playwright, against apps started by hand, the run did not end: Playwright started the missing app itself and then waited for it to stop.
- **Another session was at work in this repository at the same time.** The service containers were stopped once from outside this work, and a run of the end-to-end tests that this work had not started used the apps' ports for a moment. Neither touched a result recorded here: the fault checks were run before both, and `pnpm check` and `pnpm platform:check` were run again after both.
