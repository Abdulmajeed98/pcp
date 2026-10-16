# 08: Numbers, counts and as-written text in the Vendor portal

**Spec:** [the languages spec](../spec.md)

**What to build:** A Vendor sees the same digits and the same grouping in the Vendor portal as a Shopper sees on the site: Western digits in every language. A count is worded with the plural form its language uses. A Part name and a specification stay in English and keep their order inside a Kurdish or an Arabic sentence, and as-written text is shown in its own direction. Category names are the ones the Shopper reads, from the shared terms.

The Vendor portal's placeholder page gains the same kinds of sample that ticket 04 put on the Shopper app's page, built from the same parts: `i18n`'s number formatter, the shared terms and `ui`'s two components. The Admin console's page does not change.

i18next writes a count differently from next-intl: one key for each plural form the language has, so an Arabic message that counts is six keys and an English one is two. How a number inside an i18next message is held to Western digits is this ticket's unknown.

**Blocked by:** 04, 06

**Status:** resolved

- [x] Before anything is written, i18next's documentation is read, for the release that is installed, for a message that counts, for how a value is put into a message and for its number formatting. The findings are recorded under Comments.
- [x] How a number inside an i18next message is held to Western digits is settled on the installed tools and recorded: where a counted message prints its count, and where a message formats a number.
- [x] i18next's own number formatting is never used as it comes.
- [x] The dashboard reads the shared terms, and the Vendor portal's page shows the eight Category names in the Vendor's language. A shared term is asked for by a key that is type-checked like any other.
- [x] The page shows a sentence with a count, for 1, 2, 3, 11 and 100. The Arabic message has all six plural forms, and the Kurdish and the English have two each.
- [x] The page shows the number 1,575,000, formatted by `i18n`'s function, beside a unit, and the two keep their order in every language.
- [x] The page shows a Part name and a specification inside a translated sentence, each marked as always in English with `ui`'s component.
- [x] The page shows two lines as someone wrote them, one in Arabic script and one in Latin script, each marked as written with `ui`'s component. Neither is in the language files.
- [x] The sample values are fixed in the page and plainly made up. Any Vendor named is fictional.
- [x] The Admin console's page is unchanged.
- [x] `pnpm platform:check` gains these lines, as the development Vendor, and passes on every line:
  - The sample number reads 1,575,000 in all three languages, and no Arabic-Indic digit is anywhere on the page in any language, the counted sentences among it.
  - The Part name and the specification are the same characters in all three languages, and each carries a left-to-right direction of its own.
  - The two as-written lines are the same in all three languages, and each carries its own direction.
  - The list of Category names is different in each of the three languages.
  - With the sample on it, the page still does not scroll sideways in any language.
- [x] Shown once and then reverted: a message made to format its number the way i18next does as it comes fails the digits line on the Kurdish page.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault check are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 10 October 2026: from ticket 04

- **This ticket's fault check passes wrongly in a browser set to English.** Chromium has no number formatting for Kurdish, and formats a Kurdish number in the language the browser itself is set to. A number formatted in the browser for a Kurdish page therefore comes out in Western digits in a browser set to English, and in Arabic-Indic digits in one set to Arabic as written in Iraq. Ticket 04 planted such a number in the Shopper app's frame, and every line passed.
- **The language tests' browser is now set to Arabic as written in Iraq,** for every file named `…-languages.spec.ts`. A test that sets a language of its own gives that up. The Shopper app's helper first confirms that the browser is one that shows the fault, and the Vendor portal's helper should do the same.
- **Pinning the digits is not enough.** In a browser set to French, a Kurdish number comes out as "1 575 000,5", also with the digits pinned to Western ones. The grouping follows the visitor's browser too. Ticket 04's Comments have the table.
- **What ticket 04 settled for next-intl:** no message formats a number. `formatNumber` writes it, and the message is given the text. A counted message is given `count`, which picks the plural form, and `countText`, which it shows. Whether the same holds in i18next is this ticket's to find out, on i18next itself.
- **Three things to build on.** In the tests' helper, `linesAsDrawn` reads the order a piece of text is drawn in, and `layoutOf` reads its direction and whether it is kept apart. The sample's values on the Shopper app's page start with a number where that matters, because that is the text a Kurdish sentence reorders: "Ryzen 5 7600" is left alone, and "80 mm" is drawn "mm 80".

### 16 October 2026: completed

**What was read first,** on i18next's site, which describes the current release; the installed one is 26.4.5.

- **A message that counts** (the page on plurals): one key for each plural form, such as `key_one` and `key_other`, and for Arabic `_zero`, `_one`, `_two`, `_few`, `_many` and `_other`. "The variable name must be `count`", and it must be given, or no form is found. The forms are "streamlined with the one used in the Intl API", and since version 24 a runtime without `Intl.PluralRules` resolves English's two forms only. A `_zero` key, where there is one, is used for 0 in any language. The page writes the count into a message as `{{count}}`, and does not say how it is written.
- **A value inside a message** (the page on interpolation): `{{value}}`, escaped by default, `{{- value}}` unescaped. The dashboard writes no value into a message, as ticket 06 settled: it puts it into the element the message names.
- **Its number formatting** (the page on formatting): `{{val, number}}` formats with `Intl.NumberFormat`, with its options written in the message or given with the value. The language "can be overridden by passing it in t.options", so it is otherwise the language of the call. A formatter can be added or replaced with `i18next.services.formatter.add`. `alwaysFormat`, off by default, sends every value through the formatter. Version 26 warns that the old `interpolation.format` function is to be removed. The page does not say whether `count` is formatted.

**Settled on the installed tools:** i18next 26.4.5, in Node 24.21.0 and in Chromium from Playwright 1.64.0 set to Arabic as written in Iraq, which gave the same text in every case. The count was 1,575,000.

| Message | Kurdish | Arabic | English |
|---|---|---|---|
| `{{count}} parts` | 1575000 parts | 1575000 parts | 1575000 parts |
| `{{count, number}} parts` | ١٬٥٧٥٬٠٠٠ parts | 1,575,000 parts | 1,575,000 parts |
| `{{val, number}}`, with 1,575,000.5 | ١٬٥٧٥٬٠٠٠٫٥ | 1,575,000.5 | 1,575,000.5 |

- **Where a counted message prints its count:** `{{count}}` is written as it is given, in Western digits but with no grouping. That is not `formatNumber`'s text.
- **Where a message formats a number:** `{{…, number}}` formats in the language of the message, so a Kurdish one gets Arabic-Indic digits, in Node and in Chromium alike. Chromium writes plain `ar` in Western digits; Arabic as written in Iraq, ticket 04 found, it does not.
- **The plural forms** i18next finds: for Kurdish, 1 gives `_one` and 0, 2 and 3 give `_other`. For Arabic, 0, 1, 2, 3, 11 and 100 give `_zero`, `_one`, `_two`, `_few`, `_many` and `_other`.

**So the dashboard holds a number as the Shopper app does: no message formats one.** A counted message is given the count, which picks the key, and names `<count/>` where the count is shown. The page puts `formatNumber(count)` there, with react-i18next's `Trans`, whose `count` property picks the form. Any other number is put whole into the element its message names, as the speed is into `<speed/>`. Nothing in double braces is written in the dashboard's files, and the README beside them now says so, with the reasons. i18next's own number formatting is never used. Replacing its `number` formatter with one that writes Western digits would also have held the digits. It was not done, so that the two sets keep one rule, and ticket 09's check can hold both to it.

**What was built.**

- **The sample** is on the Vendor portal's placeholder page, with the values of the Shopper app's: the eight Category names, asked for from the shared terms by type-checked keys; a sentence that counts, for 1, 2, 3, 11 and 100; "1,575,000 IOPS" inside a sentence; "500 Sample 1TB" and "80 mm" inside a sentence, each marked with `AlwaysEnglish`; and two lines shown as written, each marked with `AsWritten`, which are not in the language files. Its values are fixed in the page.
- **The messages** are new keys of `VendorPortalPlaceholder` in the dashboard's files. The Arabic counted message has six keys, and the Kurdish and the English two each. The wording is the Shopper app's draft, written in i18next's format.
- **The Admin console's page** did not change.

**`pnpm platform:check`** gains 5 lines in `dashboard-languages.spec.ts`, as the development Vendor, each through the Vendor portal's helper and so in each language by the switch:

- The sample number reads 1,575,000 in all three languages, and no Arabic-Indic digit is anywhere on the page in any language, the counted sentences among it.
- The Part name and the specification are the same characters in all three languages, and each carries a left-to-right direction of its own.
- The two as-written lines are the same in all three languages, and each carries its own direction.
- The list of Category names is different in each of the three languages.
- With the sample on it, the page still does not scroll sideways in any language.

The checks of the sample moved from the Shopper app's test file to `apps/e2e/src/sample.ts`, and both files call them, so the two samples are checked by the same code. The Shopper app's line on the width now also finds the specification.

The whole `pnpm platform:check` then had 52 lines, all passing: the 39 there were after ticket 06, 8 from ticket 07 and these 5.

**Fault checks,** each planted alone on a clean tree and reverted by the inverse edit.

| Fault | Result |
|---|---|
| The Kurdish counted message's `_other` form made to write `{{count, number}}` in place of `<count/>` | 6 of the 22 lines failed, each at its Kurdish step, on "the page shows no Arabic-Indic digit": the page showed ٢, ٣, ١١ and ١٠٠. They are the six lines that go through the Vendor portal's helper. |
| A shared term's key misspelled, `Category.cpuu` | `@pcp/dashboard:typecheck` failed with TS2345 and listed the keys there are. |

**Seen once, by me, in screenshots 360 pixels wide,** in the light scheme, in each language: the switch on the end side, the Part name and the specification in their own order inside the Kurdish and the Arabic sentence, the speed beside its unit, and the Arabic line running right to left on the English page. The browser's console showed no warning from React.

**For the owner, at review.** The Kurdish counted sentence has the same wording for one and for more, as the Shopper app's draft has.

**`pnpm check`.** Each of this ticket's two commits passed on its own in a fresh clone, with Docker unreachable, no browser installed and Nx's cache skipped.
