# 08: Numbers, counts and as-written text in the Vendor portal

**Spec:** [the languages spec](../spec.md)

**What to build:** A Vendor sees the same digits and the same grouping in the Vendor portal as a Shopper sees on the site: Western digits in every language. A count is worded with the plural form its language uses. A Part name and a specification stay in English and keep their order inside a Kurdish or an Arabic sentence, and as-written text is shown in its own direction. Category names are the ones the Shopper reads, from the shared terms.

The Vendor portal's placeholder page gains the same kinds of sample that ticket 04 put on the Shopper app's page, built from the same parts: `i18n`'s number formatter, the shared terms and `ui`'s two components. The Admin console's page does not change.

i18next writes a count differently from next-intl: one key for each plural form the language has, so an Arabic message that counts is six keys and an English one is two. How a number inside an i18next message is held to Western digits is this ticket's unknown.

**Blocked by:** 04, 06

**Status:** ready-for-agent

- [ ] Before anything is written, i18next's documentation is read, for the release that is installed, for a message that counts, for how a value is put into a message and for its number formatting. The findings are recorded under Comments.
- [ ] How a number inside an i18next message is held to Western digits is settled on the installed tools and recorded: where a counted message prints its count, and where a message formats a number.
- [ ] i18next's own number formatting is never used as it comes.
- [ ] The dashboard reads the shared terms, and the Vendor portal's page shows the eight Category names in the Vendor's language. A shared term is asked for by a key that is type-checked like any other.
- [ ] The page shows a sentence with a count, for 1, 2, 3, 11 and 100. The Arabic message has all six plural forms, and the Kurdish and the English have two each.
- [ ] The page shows the number 1,575,000, formatted by `i18n`'s function, beside a unit, and the two keep their order in every language.
- [ ] The page shows a Part name and a specification inside a translated sentence, each marked as always in English with `ui`'s component.
- [ ] The page shows two lines as someone wrote them, one in Arabic script and one in Latin script, each marked as written with `ui`'s component. Neither is in the language files.
- [ ] The sample values are fixed in the page and plainly made up. Any Vendor named is fictional.
- [ ] The Admin console's page is unchanged.
- [ ] `pnpm platform:check` gains these lines, as the development Vendor, and passes on every line:
  - The sample number reads 1,575,000 in all three languages, and no Arabic-Indic digit is anywhere on the page in any language, the counted sentences among it.
  - The Part name and the specification are the same characters in all three languages, and each carries a left-to-right direction of its own.
  - The two as-written lines are the same in all three languages, and each carries its own direction.
  - The list of Category names is different in each of the three languages.
  - With the sample on it, the page still does not scroll sideways in any language.
- [ ] Shown once and then reverted: a message made to format its number the way i18next does as it comes fails the digits line on the Kurdish page.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault check are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
