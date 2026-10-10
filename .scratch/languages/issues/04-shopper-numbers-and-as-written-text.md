# 04: Numbers, counts and as-written text on the Shopper app's page

**Spec:** [the languages spec](../spec.md)

**What to build:** Every number a Shopper sees is in Western digits, in every language, grouped in thousands the same way. A count is worded with the plural form its language uses, and Arabic has six. A Part name, a manufacturer name and a specification stay in English and keep their own order inside a Kurdish or an Arabic sentence. What a Vendor wrote is shown as written, in its own direction. Category names are translated.

The Shopper app's placeholder page becomes the proving ground: it gains a sample of each of these kinds of text. The sample values are fixed in the page and plainly made up, and any Vendor named is fictional. The first real page replaces them.

This ticket holds the module's most serious trap. On the installed Node, a number formatted for Kurdish comes out in Arabic-Indic digits, which LANG-5 forbids, and a test written in English would never see it. How a number inside a next-intl message is held to Western digits is settled first.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Before anything is written, next-intl's documentation is read, for the release that is installed, for numbers and counts inside a message and for its number formatting. HTML's own means of keeping a piece of text apart from the sentence around it, and of giving it a direction, are read up. The findings are recorded under Comments.
- [ ] How a number inside a next-intl message is held to Western digits is settled on the installed tools and recorded: where a counted message prints its count, and where a message formats a number. Before it is held, the Kurdish page is seen to show Arabic-Indic digits.
- [ ] Whether Chromium formats Kurdish and Arabic numbers as Node does is found out and recorded.
- [ ] `i18n` has one function that formats a number: Western digits, thousands grouped with a comma and a point before decimals. Its output is the same in all three languages, and the same on the server as in the browser.
- [ ] next-intl's own number formatting is never used as it comes.
- [ ] `i18n` holds the shared terms as one JSON file for each language: the eight Category names, as plain text with no placeholder and no plural. The draft note covers them.
- [ ] `ui` gains two components, both without styling. One marks text that is always in English and left to right. The other marks text shown as someone wrote it, and takes its direction from the text itself. Each keeps its text apart from the sentence around it, with HTML's own means and no library.
- [ ] `ui`'s placeholder export is deleted, and each frontend's list of libraries it does not use yet loses the entry.
- [ ] The page shows the eight Category names in the Shopper's language. A shared term is asked for by a key that is type-checked like any other.
- [ ] The page shows a sentence with a count, for 1, 2, 3, 11 and 100. The Arabic message has all six plural forms.
- [ ] The page shows the number 1,575,000, formatted by `i18n`'s function, beside a unit, and the two keep their order in every language.
- [ ] The page shows a Part name and a specification inside a translated sentence, each marked as always in English.
- [ ] The page shows two lines as someone wrote them, one in Arabic script and one in Latin script, each marked as written. Neither is in the language files.
- [ ] The helper from ticket 02 also checks the digits: no Arabic-Indic digit, of either the Arabic or the Persian set, is anywhere on the page.
- [ ] `pnpm platform:check` gains these lines, and passes on every line:
  - The sample number reads 1,575,000 in all three languages, and no Arabic-Indic digit is anywhere on the page in any language, the counted sentences among it.
  - The Part name and the specification are the same characters in all three languages, and each carries a left-to-right direction of its own.
  - The two as-written lines are the same in all three languages, and each carries its own direction.
  - The list of Category names is different in each of the three languages.
  - With the sample on it, the page still does not scroll sideways in any language.
- [ ] Shown once and then reverted: with the hold on Western digits removed, the digits line fails on the Kurdish page.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault check are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
