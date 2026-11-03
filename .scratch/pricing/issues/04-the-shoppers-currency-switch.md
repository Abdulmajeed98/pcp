# 04: The Shopper's currency switch

**Spec:** [the pricing spec](../spec.md)

**What to build:** Every Shopper page has a currency switch in its frame, beside the language switch, with two choices, dinars and dollars (PRC-2). It starts at IQD. A tap asks the server for the same page in the Shopper's language, and the server's answer remembers the choice in the browser for a year, so that it works before any script has loaded. The Shopper's pages read the choice on the server, through one function that every later page will use to ask the API in that currency. No Shopper page shows a price yet, so the placeholder page says which currency prices are shown in, as scaffolding that `browse`'s first page replaces.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] **The switch.** In the frame's header, on the end side, beside the language switch: the right in English, the left in Kurdish and Arabic. Two choices named in the page's language, the current one marked with `aria-current` and drawn as the language switch draws its current one, each at least 44 by 44 pixels. It is built as plainly as the language switch, from the same theme. Its deep design waits for `browse`.
- [x] **The remembered choice.** Each choice is a plain request to the server, not Next's or next-intl's link. The server's answer writes the choice into a cookie for a year and returns the Shopper to the page they were on, in their language. A cookie that is missing or holds anything else reads as IQD. The choice is not in the page's address.
- [x] **The reading.** One function in the Shopper app's shared layer reads the chosen currency on the server. The placeholder page uses it, and its comment says every later page asks the API in that currency.
- [x] **The placeholder's line.** One sentence saying prices are shown in dinars or in dollars, read on the server.
- [x] **The words.** The switch's label and its two choices, and the placeholder's sentence, are in `i18n`'s Shopper set in all three languages, the Kurdish and the Arabic as drafts under LANG-7. The names for dinars and dollars are added to `words.md`, which has none yet, marked for the owner's reading.
- [x] **The "not found" screen.** It holds the switch as it holds the language switch. If the browser draws that screen by script and the switch cannot work there without one, that is recorded under Comments, as the language switch's is.
- [x] It follows the root DESIGN.md's hard rules and the Shopper app's DESIGN.md as far as it goes, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules and Next's routing folder rule.
- [x] `pnpm platform:check` gains these lines and passes on every line:
  - A fresh browser shows the switch with dinars current, and the placeholder says prices are in dinars.
  - Choosing dollars returns to the same page with dollars current, and the placeholder says dollars. A reload, the "not found" screen and a new tab keep it. Choosing dinars switches back. A page with a query returns with the same query, with scripts and without (added by the code review's fixes, the owner's decision of 3 November 2026).
  - The switch works with JavaScript disabled.
  - Changing the language keeps the currency, and changing the currency keeps the language.
  - In `shopper-languages.spec.ts`, in Kurdish, Arabic and English: the switch is named in the page's language, sits on the end side, and each choice is at least 44 pixels each way.
  - `expectAccessible` passes on the placeholder page with the switch.
- [x] `pnpm check`'s language check is seen to fail once, with the Arabic of a choice removed, and then reverted.
- [x] Shown once and then reverted, each failing its own test: the cookie written for the session only, with no year; the choice written by the browser's script instead of the server's answer, tried with JavaScript disabled.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 2 November 2026: completed

**Commits.** `e1dcc10` the words, `c02b6b2` the switch, the remembered choice, the reading and the placeholder's line, `9cc529d` the end-to-end lines.

**What was built, and the decisions this ticket left open.**

- **The switch** is `CurrencySwitch` in the App layer, `src/_app/layouts/currency-switch.tsx`, beside `LanguageSwitch`, and drawn as it is: two underlined choices, the chosen one bold and not underlined, each `min-h-11 min-w-11` with `px-3`, from the Shopper theme, with no class of its own. It is a `<form aria-label="…">` (a form landmark named in the page's language) with one `<button type="submit" name="currency" value="IQD|USD">` per choice; the chosen one carries `aria-current="true"`. A button, not a link: choosing changes what the browser keeps, which a GET link should not do, and a form keeps search engines and link prefetching away from it.
- **Where it sits.** At 360 pixels the two switches do not fit on one line (about 370 pixels in English and 340 in Kurdish against 328), and a line that wraps by the width of a font would put the currency switch in the middle in one language and at the end in another. So on a phone the header is a column, `flex-col items-end`, with the currency switch above the language switch, both on the end side; from `sm` up they share the line, `sm:flex-row sm:justify-end sm:gap-x-4`, the language switch still at the end. This is the plainest arrangement that holds the ticket's rules in all three languages; the Shopper's design plan at `browse` may change it.
- **The remembered choice.** The form is sent with `POST` to `/<language>/currency`, `app/[locale]/currency/route.ts`, which re-exports `chooseCurrency` from the App layer (`src/_app/routes/choose-currency.ts`), as Next's routing folder rule allows. It answers `303` with a relative `Location`, `/<language><page>`, so the browser asks for the page again with a plain `GET`, a reload does not send the form twice, and the Shopper returns to the host they asked. The page is the hidden field `page`, the address after the language, as the language switch reads it with `usePathname`, with its query from `useSearchParams` (every Shopper page is drawn for each request, so the server's form holds it too); anything that starts with neither a slash nor a question mark sends the Shopper to the first page, and since the language always comes first the answer can never lead to another site (tested with `//example.com`, `https://example.com`, `/\example.com` and `?//example.com`). A currency that is neither of the two is not written down. The query is kept, as the owner decided on 3 November 2026 after the code review (finding P4, `.scratch/pricing/review-fixes.md`); this ticket first kept none, as the language switch keeps none. `GET` at that address is answered 405 by Next.
- **The cookie** is `currency`, `IQD` or `USD`, written by `rememberCurrency` in the Shared layer with `Max-Age` a year (`60 × 60 × 24 × 365`, the language cookie's), `Path=/`, `SameSite=Lax` and `HttpOnly`, since only the server reads it. Not `Secure` yet, as next-intl's language cookie is not: the platform is served over plain HTTP in development, and hosting decides it.
- **The reading.** `chosenCurrency()`, in the Shared layer's new `currency` segment (`src/shared/currency`), reads the cookie with `cookies()` from `next/headers` and answers `IQD` when it is missing or holds anything else. The segment also gives `currencies`, `Currency` and `isCurrency`. The frame and the placeholder page read the currency through it, and its comment and the placeholder's say every later page asks the API in that currency through it. The client switch imports only the type, and the server hands it the choices with their names, because the segment's index reaches `next/headers`, which a browser component cannot import.
- **The words.** `Frame.currencySwitch` and `Frame.currencies.IQD|USD`, and `PlaceholderPage.pricesShownIn.IQD|USD`, two plain sentences rather than a `select`, so that each reads whole to a translator: English "Currency", "Dinars", "Dollars"; Kurdish "دراو", "دینار", "دۆلار"; Arabic "العملة", "دينار", "دولار". `words.md` gains **The currencies**, marked for the owner's reading, with دراو marked **to choose**. The Kurdish and the Arabic are drafts under LANG-7.
- **The "not found" screen** holds the switch as it holds the language switch, and keeps and changes the chosen currency with a script. With scripts switched off, the server's 404 is the bare document, and its switch is only inside the payload Next sends for the browser to draw from: the screen shows nothing, the language switch included (checked once with a throwaway test, which was removed).
- **Design skills.** The spec and this ticket defer the switch's deep design to `browse`, and ask for it as plain as the language switch, so no design skill was run and nothing waits on the owner. Impeccable's hook scanned each changed file and found nothing. The Shopper app's DESIGN.md records the footer only; the frame's switches go into it with `browse`'s design plan.

**How it was built.** Test-first at seam 3 (the spec's three seams, confirmed by the owner on 2 November 2026), in a new file, `shopper-currency.spec.ts`, with its helpers in `currencies.ts`. Each slice was seen red for its own reason before its code: a fresh browser's switch and line (no switch on the page), then choosing dollars (the form was sent and answered 405, so dollars never became current). The lines that followed (reload, new tab, the "not found" screen, a year, the language both ways, a foreign cookie, scripts off, no other site, WCAG) passed at once on that code; the faults below show the ones the ticket names can fail. `languages.ts` gains `expectWithinReach` and an element argument for `expectTheSwitchAtTheEndOfTheFrame`, which the language tests and the new lines share. A choice is found by the code it sends, `button[value="USD"]`, and the placeholder's line is read against the switch's own names for the two currencies, so no test quotes a translation.

**The faults, each planted once by a script on the committed tree, and reverted by the inverse edit; the tree was clean after each.**

| Fault | What failed | Why |
|---|---|---|
| The Arabic of the dollars choice removed from `shopper/ar.json` | `pnpm check`, at its language check: `libs/i18n/src/messages/shopper/ar.json, "Frame.currencies.USD": is missing. The English file has it.` | The Arabic file lacked a message the English file has |
| The cookie written for the session only, with no `maxAge` | "the browser holds the choice for about a year, and not only for the session", and the scripts-off line, which checks the same | The browser held no cookie with an end, so nothing outlives the session |
| The choice written by the browser's script, with `document.cookie` and a year, and not by the server's answer | "with scripts switched off › the switch still changes the currency" alone | With no script nothing wrote the choice, and dollars never became current; with scripts the script's cookie passed every other line, as the ticket expected |

**Checks.**

`pnpm platform:check` passes with 260 tests on `9cc529d`, under the shared lock: the eleven lines of `shopper-currency.spec.ts` and the two new lines of `shopper-languages.spec.ts` (on the first page and on the "not found" screen) among them.

`pnpm check` passes on each of the three commits in a fresh clone with `DOCKER_HOST` pointed at a socket that does not exist and an empty `PLAYWRIGHT_BROWSERS_PATH`; Docker itself was left running for the other implementers. The API did not change, so `pnpm integration:check` was not run.
