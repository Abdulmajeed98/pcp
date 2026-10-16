# 09: `pnpm check` compares the language files, and the drafts are ready for review

**Spec:** [the languages spec](../spec.md)

**What to build:** `pnpm check` gains a step that compares the language files, so that a fault in one language is found before anyone opens a page in it. The Kurdish and the Arabic text is a draft that the owner, or someone the owner trusts, will correct before launch (LANG-7). A placeholder broken while correcting a sentence is then caught by the check and not by a Shopper.

The step is a script of the workspace's own, in the manner of the step that compares the written import bans with their statement. It reads all three sets: the shared terms, the Shopper app's text in next-intl's format, and the dashboard's text in i18next's format.

The reviewer also gets what they need to start: every draft marked as one, and a word list that gives the Kurdish and the Arabic word chosen for each of the platform's terms, so that every later screen uses the same word.

**Blocked by:** 04, 08

**Status:** resolved

- [x] The step is a script in `tools` that `pnpm check` runs with its other comparisons. It needs neither Docker nor a browser.
- [x] For each set, it fails when a message of the English file is missing from the Kurdish or the Arabic file.
- [x] For each set, it fails when the Kurdish or the Arabic file holds a message the English file does not.
- [x] For each set, it fails when a message cannot be read in that set's format.
- [x] For each set, it fails when a message names different placeholders in different languages.
- [x] In the dashboard's set, a message that counts is treated as one message. Each language must hold exactly the plural forms that language has: six for Arabic, and two each for Kurdish and English.
- [x] In the Shopper app's set, an Arabic message that counts must have all six plural forms.
- [x] It fails when a shared term holds a placeholder or a plural.
- [x] A failure names the file, the message and what is wrong with it, and the step exits non-zero. With the files as they stand it passes.
- [x] Shown once and then reverted, each failing with its own message: a message removed from an Arabic file; a message added to a Kurdish file only; a placeholder renamed in a Kurdish file; a brace removed from a message; one plural form removed from an Arabic message of the dashboard; one plural form removed from an Arabic message of the Shopper app; a placeholder put into a shared term.
- [x] The note beside the language files marks the Kurdish and the Arabic text of all three sets as drafts awaiting review, and names LANG-7. It says how a correction is checked: by running `pnpm check`.
- [x] A word list beside the files gives the Kurdish and the Arabic word used for each CONTEXT.md term that appears on a screen, and for the eight Categories. It is marked as a draft, and the language files use the words it gives.
- [x] `pnpm check` passes with Docker stopped and no browser installed.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 10 October 2026: from ticket 04

- **A check this ticket's list does not have. The owner decides whether it gains it.** Ticket 04 holds every number to Western digits by a rule: no message of the Shopper app writes `#` or `{…, number}`. next-intl formats both in the page's language, and a Kurdish page then shows Arabic-Indic digits. With `#` in the Arabic and the English file only, every line of the Shopper app's tests passed. This step reads every message already, and could fail on `#`, and on `number`, `date` and `time` inside braces, in the Shopper app's files.
- **One name at the top of two sets.** The Shopper app adds the shared terms to its own text. A name used at the top of both, such as a second `Category`, would let one hide the other. This step could fail on that too.
- **A counted message of the Shopper app names its count twice:** `{count, plural, …}` picks the form, and `{countText}` is the count as it is shown. An Arabic form that says the count in a word, such as `one`, holds no `{countText}`. So the placeholders are compared for a whole message, and not for each plural form.

### 16 October 2026: completed

**What was built.**

- **The step** is `tools/check-language-files.mjs`, which `pnpm check` runs after it compares the import bans and before anything else that takes time. It reads the three sets in `libs/i18n/src/messages`, needs neither Docker nor a browser, prints one line for each problem, naming the file, the message and what is wrong, and exits non-zero when there is one. With the files as they stand it prints nothing and passes.
- **How it reads a Shopper app message.** With `intl-messageformat`, the package next-intl reads a message with, at the release next-intl uses, 11.2.15. It is found through next-intl's own dependencies, from next-intl to `use-intl` to `intl-messageformat`, and so is the parser it uses, `@formatjs/icu-messageformat-parser` 3.5.18, whose names for the kinds of element the check uses. Nothing was added to the workspace's dependencies, and the check cannot fall out of step with next-intl. use-intl gives the package its formatters and no other option, so the check reads a message as next-intl does.
- **How it reads a dashboard message.** As i18next and react-i18next's `Trans` read it: an element as `<name/>` or `<name>…</name>`, which must be balanced, and another message nested as `$t(key)`. i18next itself reads almost anything, so "cannot be read" there is what `Trans` would draw wrongly: an angle bracket that starts or ends no element, and an element left open or closed where none is open.
- **What it compares.** For each set, the messages of each language with the English file's, by key; and the placeholders of each message: a value or a tag in the Shopper app's files, an element or a nested message in the dashboard's. A sentence that counts is compared as a whole, as ticket 04's note asks, because an Arabic form that says its count in a word holds no `{countText}`.
- **Counts.** In the dashboard's files the keys of one counted message, such as `partsFound_one` and `partsFound_other`, are read as one message, and each language must hold exactly the forms `Intl.PluralRules` gives it: `zero`, `one`, `two`, `few`, `many` and `other` for Arabic, `one` and `other` for Kurdish and English. In the Shopper app's files each plural must hold every form its language has. In both, a form that stands for many counts, `few`, `many` or `other`, must show every value the sentence shows, so a count dropped from one form fails.
- **The shared terms** must be plain text: nothing in braces or angle brackets, and no key that ends in a plural form, because the dashboard reads them with i18next, which would read such keys as a sentence that counts.
- **The two rules the owner added on 16 October 2026,** from ticket 04's note. A message that lets its library format a number fails: `#`, and a value formatted as a number, a date or a time, in the Shopper app's files, and anything in double braces in the dashboard's. And a name at the top of the shared terms that is also at the top of `shopper/` or `dashboard/` fails, because each frontend adds the shared terms to its own set, its own names over them.
- **An Arabic-Indic digit typed into a message fails,** in any set. The code review found that it passed. It is the slip a reviewer correcting a sentence could make, and the same fault for a Shopper as one a library writes.
- **The note beside the files,** `libs/i18n/src/messages/README.md`, now names the Kurdish and the Arabic file of each of the three sets as a draft awaiting review, names LANG-7, says that a correction is checked by running `pnpm check`, and lists what the check fails on. Its notes on counts and numbers say how a counted message is written in each format, and why nothing in double braces is written in the dashboard's files.
- **The word list,** `libs/i18n/src/messages/words.md`, gives the Kurdish and the Arabic word for each term of CONTEXT.md that a Shopper or a Vendor reads, the two apps' own names and the eight Categories. Specification list, Needed specification and Referral are left out, and it says why: only the Admin console shows them, in English. It is marked as a draft. The files use its words: پارچە and قطعة for a Part, فرۆشیار and البائع for a Vendor, کڕیار and المتسوّق for a Shopper, بانگکەر and المتصل for the caller, and the words for logging in and out.

**Fault checks,** each planted alone on a clean tree, run against the step, and reverted by the inverse edit. Each failed with its own message, and the step exited non-zero. The first was also run through `pnpm check`, which stopped at the step. They were run before the code review and again after it, with the same result; the last five are the review's.

| Fault | What the step said |
|---|---|
| A message removed from the Shopper app's Arabic file | `shopper/ar.json, "PlaceholderPage.apiUnreachable": is missing. The English file has it.` |
| A message added to the dashboard's Kurdish file only | `dashboard/ckb.json, "Caller.logOutEverywhere": is not in the English file, which is the source.` |
| A placeholder renamed in the Shopper app's Kurdish file, `{libraries}` to `{library}` | `shopper/ckb.json, "PlaceholderPage.notice": names <english>, {library}, where the English one names <english>, {libraries}.` |
| A brace removed from the Shopper app's English counted message | `shopper/en.json, "PlaceholderPage.partsFound": cannot be read in next-intl's format: EXPECT_ARGUMENT_CLOSING_BRACE, at character 1.` |
| `partsFound_few` removed from the dashboard's Arabic file | `dashboard/ar.json, "VendorPortalPlaceholder.partsFound": lacks the plural form few, which Arabic has.` |
| `few` removed from the Shopper app's Arabic counted message | `shopper/ar.json, "PlaceholderPage.partsFound": lacks the plural form few of {count}, which Arabic has.` |
| `{name}` put into the Arabic shared term for CPU | `shared/ar.json, "Category.cpu": holds a placeholder or markup, and a shared term is plain text.` |
| `<name/>` made `<name>` in the dashboard's English file | `dashboard/en.json, "Caller.answer": cannot be read: it leaves <name> open.` |
| `#` in place of `{countText}` in the Shopper app's Kurdish counted message | `writes its count with "#". next-intl would format the count in the page's language, …` |
| `{speed, number}` in the Shopper app's English file | `formats {speed} itself, as a number. …` |
| `{{count, number}}` in place of `<count/>` in the dashboard's Kurdish file | `writes a value in double braces, "{{count, number}}". Put it into an element the message names, such as <count/>: …` |
| A group `Category` added at the top of the Shopper app's three files | One line for each file: `"Category": is a name at the top of the shared terms too. …` |
| The shared term for RAM made `ram_one` and `ram_other` in the three files | One line for each file: `"Category.ram": is a message that counts, as i18next writes one, and a shared term is plain text.` |
| `<count/>` dropped from the dashboard's Kurdish `partsFound_other` | `its form other leaves out <count>, which a form for many counts shows.` |
| `{countText}` dropped from the `other` form of the Shopper app's Kurdish counted message | `its form other of {count} leaves out {countText}, which a form for many counts shows.` |
| `$t(Caller.logOut)` added to the dashboard's Arabic `Caller.askAgain` only | `names $t(Caller.logOut), where the English one names no placeholder.` |
| ٣ typed into a sentence of the Shopper app's Kurdish file | `holds the Arabic-Indic digit "٣". Every number the platform shows is in Western digits (LANG-5).` |

**The code review,** of tickets 07, 08 and 09 together, in two halves: the repository's standards, and the spec and the tickets. Neither found a breach of a written standard. What it found and what was done:

- **Ticket 09's step.** A shared term written as a counted message passed, and the branch meant to catch it could not run: the shared terms are now read as i18next reads them. A count dropped from one plural form passed, a nested message in one language passed, and so did a typed Arabic-Indic digit: each now fails, above. The kinds of element were numbered by hand, and are now the parser's own names. Names that meant two things were renamed.
- **Ticket 07.** `startLanguage` took a half's language and its title apart, and now takes the two together. The switch read its own label from a message filed under the frame, and the frame now hands it the label, as the Shopper app's frame does. The line on which half has the switch counted the Vendor portal's buttons before it confirmed the page's language, and now confirms it first.
- **Ticket 08.** The Vendor portal's helper repeated the Shopper app's whole loop. Both now run one loop, `readInEachLanguage`, and each says only how it shows the page and what its switch looks like. The Vendor portal gained `checkInEveryLanguageOfTheVendorPortal`, as the Shopper app has `checkInEveryLanguage`.
- **Left as it is.** The two placeholder pages hold the same sample values, each in its own app. They are scaffolding that the first real page replaces, and the tests may not import an app's code.
- **Tickets 07 and 08's fault checks** were run again after the review, with the same result as before.

**`pnpm check`.** Each of this ticket's commits, and each of the review's, passed on its own in a fresh clone, with Docker unreachable, no browser installed and Nx's cache skipped. The two language test files, 43 lines, pass after the review.
