# 04: Numbers, counts and as-written text on the Shopper app's page

**Spec:** [the languages spec](../spec.md)

**What to build:** Every number a Shopper sees is in Western digits, in every language, grouped in thousands the same way. A count is worded with the plural form its language uses, and Arabic has six. A Part name, a manufacturer name and a specification stay in English and keep their own order inside a Kurdish or an Arabic sentence. What a Vendor wrote is shown as written, in its own direction. Category names are translated.

The Shopper app's placeholder page becomes the proving ground: it gains a sample of each of these kinds of text. The sample values are fixed in the page and plainly made up, and any Vendor named is fictional. The first real page replaces them.

This ticket holds the module's most serious trap. On the installed Node, a number formatted for Kurdish comes out in Arabic-Indic digits, which LANG-5 forbids, and a test written in English would never see it. How a number inside a next-intl message is held to Western digits is settled first.

**Blocked by:** 02

**Status:** resolved

- [x] Before anything is written, next-intl's documentation is read, for the release that is installed, for numbers and counts inside a message and for its number formatting. HTML's own means of keeping a piece of text apart from the sentence around it, and of giving it a direction, are read up. The findings are recorded under Comments.
- [x] How a number inside a next-intl message is held to Western digits is settled on the installed tools and recorded: where a counted message prints its count, and where a message formats a number. Before it is held, the Kurdish page is seen to show Arabic-Indic digits.
- [x] Whether Chromium formats Kurdish and Arabic numbers as Node does is found out and recorded.
- [x] `i18n` has one function that formats a number: Western digits, thousands grouped with a comma and a point before decimals. Its output is the same in all three languages, and the same on the server as in the browser.
- [x] next-intl's own number formatting is never used as it comes.
- [x] `i18n` holds the shared terms as one JSON file for each language: the eight Category names, as plain text with no placeholder and no plural. The draft note covers them.
- [x] `ui` gains two components, both without styling. One marks text that is always in English and left to right. The other marks text shown as someone wrote it, and takes its direction from the text itself. Each keeps its text apart from the sentence around it, with HTML's own means and no library.
- [x] `ui`'s placeholder export is deleted, and each frontend's list of libraries it does not use yet loses the entry.
- [x] The page shows the eight Category names in the Shopper's language. A shared term is asked for by a key that is type-checked like any other.
- [x] The page shows a sentence with a count, for 1, 2, 3, 11 and 100. The Arabic message has all six plural forms.
- [x] The page shows the number 1,575,000, formatted by `i18n`'s function, beside a unit, and the two keep their order in every language.
- [x] The page shows a Part name and a specification inside a translated sentence, each marked as always in English.
- [x] The page shows two lines as someone wrote them, one in Arabic script and one in Latin script, each marked as written. Neither is in the language files.
- [x] The helper from ticket 02 also checks the digits: no Arabic-Indic digit, of either the Arabic or the Persian set, is anywhere on the page.
- [x] `pnpm platform:check` gains these lines, and passes on every line:
  - The sample number reads 1,575,000 in all three languages, and no Arabic-Indic digit is anywhere on the page in any language, the counted sentences among it.
  - The Part name and the specification are the same characters in all three languages, and each carries a left-to-right direction of its own.
  - The two as-written lines are the same in all three languages, and each carries its own direction.
  - The list of Category names is different in each of the three languages.
  - With the sample on it, the page still does not scroll sideways in any language.
- [x] Shown once and then reverted: with the hold on Western digits removed, the digits line fails on the Kurdish page.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault check are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 10 October 2026: completed

**For the owner to decide.**

- **The spec's two examples do not show the fault.** Stories 28 and 29 say that "Ryzen 5 7600" becomes "7600 5 Ryzen" inside a Kurdish or an Arabic sentence, and name "DDR5-6000". Chromium reorders neither of them, marked or not. What it reorders is text that starts with a number or a sign, as measured:

  | Written | Drawn, unmarked, in a Kurdish sentence |
  |---|---|
  | `80 mm` | `mm 80` |
  | `990 PRO 2TB` | `PRO 2TB 990` |
  | `1,575,000 IOPS` | `IOPS 1,575,000` |
  | `@pcp/compatibility` | `pcp/compatibility@` |
  | `2026-10-10T13:01:37.973Z` | `10T13:01:37.973Z-10-2026` |
  | `Ryzen 5 7600`, `DDR5-6000`, `Core i5-14600K`, `B650M-A`, `M.2 2280` | as written |

  - Every Part name is still marked, because a screen cannot know which name starts with a number.
  - The sample's Part name and specification were first the spec's two, and could not show the fault. They now start with a number.
  - **My recommendation:** ticket 10 corrects the example in the two stories when it records the conventions. Nothing else follows from it.
- **What a Vendor wrote may hold Arabic-Indic digits.** LANG-4 says it is shown as written. The helper finds an Arabic-Indic digit anywhere on a page, so a Vendor who writes "شارع ٦٠ متري" would fail the test of the first page that shows it. The sample's lines hold Western digits only.
  - **My recommendation:** a Vendor's own digits stay as written, and the helper leaves as-written text out when that page is built. It is decided there.
- **Nothing in `pnpm check` refuses a message that formats a number.** The hold on Western digits is a rule: no message writes `#` or `{…, number}`. On a page that a test opens, the helper catches a breach. A message on a page with no test, or one a test never brings up, is caught by nothing.
  - A number given to a message as a number, to a plain `{n}`, comes out in Western digits and without grouping: "1575000". Nothing sees that either.
  - **My recommendation:** ticket 09's step also fails on `#`, and on `number`, `date` and `time` inside braces, in the Shopper app's files. A note is under ticket 09's Comments. Its list of checks is not changed.
- **The new Kurdish and Arabic text is a draft,** like the rest: three sentences and the eight Category names. Two of the Kurdish names are a choice between several words in use: "بیرگەی هەڵگرتن" for storage and "پاوەر سەپلای" for PSU. Ticket 09's word list is where they are settled.

**How a number inside a next-intl message is held to Western digits.** This was the ticket's unknown.

- **A message never formats a number.** `formatNumber`, in `i18n`, writes it, and it reaches the message as text.
- **Where a counted message prints its count:** in `{countText}`, which is the count as `formatNumber` wrote it. The message is given the count twice: `{count, plural, …}` picks the plural form, and `{countText}` is what is shown. `#` is never written.
- **Where a message formats a number:** nowhere. `{…, number}` is never written, and next-intl's `format.number` is never called.
- **Before it was held,** the sample was written as next-intl's documentation shows, with `#` and `{speed, number}`. The server sent the Kurdish page with the digits of "١", "٢", "٣", "١١", "١٠٠" and "١٬٥٧٥٬٠٠٠", and the digits line failed "in Kurdish".
- **Only the Kurdish page shows it.** With `#` in the Arabic and the English file and not in the Kurdish one, every line passed. A test written in English, or in Arabic, never sees this fault.
- **The other ways, tried on the installed tools.** next-intl's own translator was run on Node, outside the app, and the browser's number formatting was run in Chromium:

  | Way | On Node | In Chromium |
  |---|---|---|
  | `#`, `{n, number}` or a skeleton, as it comes | Arabic-Indic digits for Kurdish | The digits and the grouping of the browser's own language |
  | A named format with `numberingSystem: 'latn'`, under `formats` | Western digits. It does not reach `#`, which is given no format at all | French grouping in a browser set to French |
  | The translator's language given as `ckb-u-nu-latn` | Western digits, `#` among them | Arabic-Indic digits in a browser set to Arabic as written in Iraq |
  | next-intl's formatters replaced by the platform's own | There is no public way. The server makes its formatters itself, after it has read the request set-up | The same |

**Whether Chromium formats Kurdish and Arabic numbers as Node does.** For Kurdish it does not. 1575000.5 was formatted on Node 24.21.0, which has ICU 78.3 and CLDR 48, and in the Chromium the tests drive, 156.0.8078.4, set to four languages:

| Formatted for | Node | Chromium set to English | Set to Arabic as written in Iraq | Set to French | Set to Kurdish |
|---|---|---|---|---|---|
| `ckb` | ١٬٥٧٥٬٠٠٠٫٥ | 1,575,000.5 | ١٬٥٧٥٬٠٠٠٫٥ | 1 575 000,5 | 1,575,000.5 |
| `ckb`, digits pinned by `numberingSystem` | 1,575,000.5 | 1,575,000.5 | 1,575,000.5 | 1 575 000,5 | 1,575,000.5 |
| `ckb-u-nu-latn` | 1,575,000.5 | 1,575,000.5 | ١٬٥٧٥٬٠٠٠٫٥ | 1 575 000,5 | 1,575,000.5 |
| `ar` | 1,575,000.5 | the same | the same | the same | the same |
| `ar-IQ` | ١٬٥٧٥٬٠٠٠٫٥ | the same | the same | the same | the same |
| `en-US`, digits pinned: what `formatNumber` does | 1,575,000.5 | the same | the same | the same | the same |

- **Chromium has no number formatting for Kurdish.** It lists none, and formats a Kurdish number in the language the browser itself is set to. Pinning the digits does not pin the grouping, and the extension on the tag is lost with the language.
- **So a number that a library formats in the browser, for a Kurdish page, depends on the visitor's browser.** That is why `formatNumber` fixes the language and does not take the page's.
- **Plural forms agree.** Chromium has plural rules for Kurdish. For 0, 1, 2, 3, 11 and 100, Node and Chromium choose the same form in all three languages. Arabic gives `zero`, `one`, `two`, `few`, `many` and `other` for those six, and Kurdish and English give `one` for 1 and `other` for the rest.

**What the documentation says,** read before anything was written. next-intl 4.14.9 is the installed release and the current one. What its website says was checked against the installed build.

- **A count inside a message.** `{count, plural, =0 {…} one {…} other {# followers}}`. The forms are `zero`, `one`, `two`, `few`, `many` and `other`, and `=3` matches one number exactly. The value at `#` "will be formatted as a number".
- **A number inside a message.** `{value, number}`, `{value, number, percent}`, a skeleton such as `{value, number, ::.##}`, and a named format such as `{price, number, currency}`, whose options are given at the call or once for the whole app, under `formats`.
- **Its number formatting.** `useFormatter` gives `format.number(value, options)`, which takes the options of the browser's own `Intl.NumberFormat`.
- **What it does not say.** None of these pages mentions digits or a numbering system. A language is an IETF BCP 47 tag, and nothing says whether a tag may carry an extension.
- **What the installed build does.** Every number goes to `Intl.NumberFormat` with the page's language. For `#` it is given no options, so nothing set under `formats` reaches it.
- **HTML's means of keeping text apart.** The `bdi` element "tells the browser's bidirectional algorithm to treat the text it contains in isolation from its surrounding text" (MDN). The text inside "does not influence the directionality of the surrounding text" and "is not influenced by" it.
- **HTML's means of giving text a direction.** The `dir` attribute. With `ltr` or `rtl`, "the contents of the element are explicitly directionally isolated" text in that direction (the HTML Standard). With `auto` they are isolated too, and the direction is taken from the first character that has one. The Standard calls that "very crude", for use "as a last resort when the direction of the text is truly unknown". That is the case for what a Vendor wrote.
- **`bdi` with no `dir`** "still behaves as if `dir="auto"` is specified" (MDN). The component writes `dir="auto"` out, so that it can be read.
- **In the browser's own stylesheet,** as the Standard gives it, `bdi` and every element with a `dir` get `unicode-bidi: isolate`, and `direction` follows `dir`. "`<bdi dir="ltr">` and `<span dir="ltr">` are exactly equivalent" (MDN), and `bdi` is the one that says what it is for.
- **`bdo` is not it.** It overrides the order of the characters themselves.

**What differs from the first plan, or is not obvious.**

- **`formatNumber` takes a number and nothing else.** It has no language and no options. It keeps every decimal it is given, up to twenty, and does not round on its own. Currency, rounding and the "≈" mark are `pricing`'s.
- **The two names in a counted message** are `count` and `countText`. `count` is the name i18next needs for its own plural forms, so ticket 08 can use the same two.
- **Kurdish has two plural forms, and the draft words both alike,** because a Kurdish noun does not change after a number. The message still holds both.
- **A message marks text that stays in English with an `<english>` tag,** and the page puts the text there: `<english>{part}</english>`. The note beside the language files tells a reviewer to leave it as it is.
- **The two components** are `AlwaysEnglish` and `AsWritten`, in `ui`. Each is a `bdi` element and passes on what it is given, such as a class. `AlwaysEnglish` fixes `dir="ltr"` and `lang="en"`, and `AsWritten` fixes `dir="auto"`. Neither can be given a `dir`.
- **The libraries' names and the time the API started are marked too,** as ticket 02 asked. Both are among the text a Kurdish sentence reorders, as the table above shows.
- **The shared terms** are `libs/i18n/src/messages/shared`, one file for each language, shaped `{ "Category": { "cpu": "…" } }`. The keys are `cpu`, `cpuCooler`, `motherboard`, `ram`, `storage`, `gpu`, `case` and `psu`, in CONTEXT.md's order.
- **The Shopper app adds the shared terms to its own text** in its request set-up, and next-intl's types are given both. A page asks for `getTranslations('Category')`. A name at the top of both sets, such as a second `Category`, would let one hide the other. Nothing checks that yet.
- **`ui` holds React components now.** It reads TSX, lists React, and is linted with the React rules.
- **The dashboard's list of libraries it does not use yet is gone.** `ui` was its only entry. Its placeholder page no longer names any library. Two cases of `pnpm boundaries:check` named that file, and now name the API client's file, which both frontends have.
- **A test can see the order text is drawn in.** The spec says it cannot. The tests measure where the browser drew each character, and read each line from left to right. So "the Part name and the specification read in their own order", "the number keeps its place beside its unit" and "the line in Arabic script reads right to left" are lines of `pnpm platform:check` now. The owner's own reading, in ticket 10, is a second look.
- **The language tests' browser is set to Arabic as written in Iraq,** unless a test sets its own. It is the browser in which a number formatted in the browser, for Kurdish, comes out in Arabic-Indic digits. The helper first confirms that, and fails with a plain message in any other browser.
- **The digits check reads** what the server sent, what the browser shows, and the tab's title. It does not read what is inside an attribute, such as a label for a screen reader.
- **The sample's values** start with a number where that matters: the Part name "500 Sample 1TB", the specification "80 mm", and the address "12 Sample Street, Erbil". The Vendor's name starts in Arabic script and holds Latin script too. No Part and no Vendor has these names. The unit beside 1,575,000 is "IOPS" and not a currency, because how a price is written is `pricing`'s.
- **The tests' reader of a served page** no longer writes a gap where an element inside a line starts or ends. "name." had read "name ." as soon as the name was marked.
- **The tests name the sample's values,** such as "80 mm". They are not translations: they are the same in all three languages.
- **The helper's short form, `checkInEveryLanguage`, has no caller now.** The line that used it reads the sample as well. It stays for the test of a later page.

**`pnpm platform:check`** has 28 lines: the 24 it had and 4 new ones. One old line is renamed.

- The Part name and the specification are the same characters in all three languages, and each carries a left-to-right direction of its own. Each is also drawn in the order it is written in.
- The two as-written lines are the same in all three languages, and each carries its own direction. Each also starts on its own side.
- The sample number reads 1,575,000 in all three languages, and no Arabic-Indic digit is anywhere on the page in any language, the counted sentences among it. The number is also drawn before its unit.
- The list of Category names is different in each of the three languages.
- With the sample on it, the page still does not scroll sideways in any language. This is the old line "in each language the page does not scroll sideways".

**Fault checks,** each reverted. The first is the one this ticket asks for. Each was planted on the reviewed code, alone, and taken out again by the inverse edit. The Shopper app's 22 lines were run on each.

| Fault | What happened |
|---|---|
| The hold removed: `#` in place of `{countText}`, in all three languages | 8 lines failed, each "in Kurdish": "the server sends the page with no Arabic-Indic digit". They are the lines that open the first page in every language. |
| The same, in the Arabic and the English file only | All 22 lines passed. |
| `formatNumber` made to format in Kurdish | The same 8 lines failed, each "in Kurdish". |
| A number that only the browser formats, in the page's language, put into the frame | Before the review: all 22 lines passed. After it: 9 lines failed, each "in Kurdish": "the page shows no Arabic-Indic digit". |
| The language tests' browser left set to English | 9 lines failed, before any page was opened: "this browser writes a number it formats for Kurdish in Arabic-Indic digits". |
| `AlwaysEnglish` made a plain `span` | 2 lines failed, "in Kurdish". The Part name was drawn "Sample 1TB 500", and the number "IOPS 1,575,000". |
| `AsWritten` given a fixed left-to-right direction | 1 line failed, "in Kurdish": the line that starts in Arabic script, drawn with its Arabic on the left, did not start on its own side. |
| `AsWritten` made a plain `span` | 1 line failed, "in Kurdish": the line was not kept apart. |
| The Arabic shared terms given the English names | 1 line failed: the list of Category names was the same in two languages. |
| A shared term's key misspelled in the page, `gpuu` | `@pcp/shopper:typecheck` failed with TS2345 and named the eight keys. |
| The sample's first sentence kept on one line | 8 lines failed, each "in Kurdish": "the page is no wider than the window". |
| Before `AlwaysEnglish` existed | The number's line failed "in Kurdish": its text ran right to left and was not kept apart. |
| Before `AsWritten` existed | The as-written line failed "in Kurdish": not kept apart. |

**Seen once, by me, in screenshots 360 pixels wide.** The owner's own reading is ticket 10's.

- **On the Kurdish and the Arabic page,** "500 Sample 1TB" and "80 mm" read in their own order inside the sentence, "1,575,000 IOPS" has its number before its unit, and the sentence's full stop is at its left end.
- **On the English page,** the Vendor's name is drawn "(Example Computers) حاسبات المثال": it starts at its right.
- **On the Kurdish page,** "12 Sample Street, Erbil" reads left to right.
- **The Arabic counted sentences** read "قطعة واحدة", "قطعتين", "3 قطع", "11 قطعة" and "100 قطعة". Whether that is the wording a speaker would choose is the review's.

**What the code review found and changed.** Two reviewers read the work, one against the spec and one against the repository's conventions.

- **The sample could not show its fault,** and `AlwaysEnglish`'s comment gave the example that the browser leaves alone. Both are as above.
- **The digits check had no hold on a number formatted in the browser.** The tests' browser was set to English. It is as above, and a planted number shows it.
- **Comments that said more than is true.** `formatNumber` "does not round": it keeps twenty decimals. LANG-5 names prices and specifications, and it is this module that writes every number so. LANG-3 does not name a number beside its unit. The `<english>` tag was said to hold four kinds of text, and holds the libraries' names and a time as well. The width line said the sample is seen first, and the page is measured first. "Every value is made up", when the Categories are real.
- **Small things.** Each piece of the sample is named once in the tests, and so are the counts 8 and 2. The page's reader of Category names is called `categoryName`.
- **Left as it is.** A caller can give either component a class or a style, and a style could undo what the component does. Later screens need the class. The Category line compares the three lists whole, as this ticket words it: a reviewer may well keep "RAM" in two languages. The list of elements inside a line is the HTML Standard's, although the pages use three of them.

**The checks.** `pnpm check --skip-nx-cache` passed for each of the six commits, each checked out on its own into a fresh clone with a fresh install, with Docker made unreachable for the command and Playwright pointed at a folder that holds no browser. One clone's install first failed on pnpm's own offline record of a package. pnpm installed when the check was run, the check passed, and a second fresh clone of that commit passed both. `pnpm check --skip-nx-cache` also passed in the working folder with no service container running. `pnpm boundaries:check` passed on all 114 lines. `pnpm platform:check` passed on all 28 lines and left no app running.

**Worth knowing.**

- **The third commit was first made with a type error in the tests,** and `pnpm check` failed on it. My own command went on to commit after a failed check. It was amended before anything was built on it, and each of the six commits was then checked on its own, as above.
- **The fault script restored a file wrongly once.** It kept a copy of a file at each edit, and one fault edited a file three times. The file was left with two planted lines. It was restored from the last commit, which held everything, and the script now keeps the first copy.
- **For ticket 08.** In a browser set to English, a number that i18next formats for Kurdish comes out in Western digits. Its fault check passes wrongly there. A note is under ticket 08's Comments.
- **The services are stopped.** They were stopped when this work began, were started for `pnpm platform:check`, and were stopped again. `pnpm services:up` starts them.
