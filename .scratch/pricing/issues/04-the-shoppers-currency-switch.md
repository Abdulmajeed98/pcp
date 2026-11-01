# 04: The Shopper's currency switch

**Spec:** [the pricing spec](../spec.md)

**What to build:** Every Shopper page has a currency switch in its frame, beside the language switch, with two choices, dinars and dollars (PRC-2). It starts at IQD. A tap asks the server for the same page in the Shopper's language, and the server's answer remembers the choice in the browser for a year, so that it works before any script has loaded. The Shopper's pages read the choice on the server, through one function that every later page will use to ask the API in that currency. No Shopper page shows a price yet, so the placeholder page says which currency prices are shown in, as scaffolding that `browse`'s first page replaces.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] **The switch.** In the frame's header, on the end side, beside the language switch: the right in English, the left in Kurdish and Arabic. Two choices named in the page's language, the current one marked with `aria-current` and drawn as the language switch draws its current one, each at least 44 by 44 pixels. It is built as plainly as the language switch, from the same theme. Its deep design waits for `browse`.
- [ ] **The remembered choice.** Each choice is a plain request to the server, not Next's or next-intl's link. The server's answer writes the choice into a cookie for a year and returns the Shopper to the page they were on, in their language. A cookie that is missing or holds anything else reads as IQD. The choice is not in the page's address.
- [ ] **The reading.** One function in the Shopper app's shared layer reads the chosen currency on the server. The placeholder page uses it, and its comment says every later page asks the API in that currency.
- [ ] **The placeholder's line.** One sentence saying prices are shown in dinars or in dollars, read on the server.
- [ ] **The words.** The switch's label and its two choices, and the placeholder's sentence, are in `i18n`'s Shopper set in all three languages, the Kurdish and the Arabic as drafts under LANG-7. The names for dinars and dollars are added to `words.md`, which has none yet, marked for the owner's reading.
- [ ] **The "not found" screen.** It holds the switch as it holds the language switch. If the browser draws that screen by script and the switch cannot work there without one, that is recorded under Comments, as the language switch's is.
- [ ] It follows the root DESIGN.md's hard rules and the Shopper app's DESIGN.md as far as it goes, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules and Next's routing folder rule.
- [ ] `pnpm platform:check` gains these lines and passes on every line:
  - A fresh browser shows the switch with dinars current, and the placeholder says prices are in dinars.
  - Choosing dollars returns to the same page with dollars current, and the placeholder says dollars. A reload, the "not found" screen and a new tab keep it. Choosing dinars switches back.
  - The switch works with JavaScript disabled.
  - Changing the language keeps the currency, and changing the currency keeps the language.
  - In `shopper-languages.spec.ts`, in Kurdish, Arabic and English: the switch is named in the page's language, sits on the end side, and each choice is at least 44 pixels each way.
  - `expectAccessible` passes on the placeholder page with the switch.
- [ ] `pnpm check`'s language check is seen to fail once, with the Arabic of a choice removed, and then reverted.
- [ ] Shown once and then reverted, each failing its own test: the cookie written for the session only, with no year; the choice written by the browser's script instead of the server's answer, tried with JavaScript disabled.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
