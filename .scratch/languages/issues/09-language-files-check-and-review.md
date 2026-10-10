# 09: `pnpm check` compares the language files, and the drafts are ready for review

**Spec:** [the languages spec](../spec.md)

**What to build:** `pnpm check` gains a step that compares the language files, so that a fault in one language is found before anyone opens a page in it. The Kurdish and the Arabic text is a draft that the owner, or someone the owner trusts, will correct before launch (LANG-7). A placeholder broken while correcting a sentence is then caught by the check and not by a Shopper.

The step is a script of the workspace's own, in the manner of the step that compares the written import bans with their statement. It reads all three sets: the shared terms, the Shopper app's text in next-intl's format, and the dashboard's text in i18next's format.

The reviewer also gets what they need to start: every draft marked as one, and a word list that gives the Kurdish and the Arabic word chosen for each of the platform's terms, so that every later screen uses the same word.

**Blocked by:** 04, 08

**Status:** ready-for-agent

- [ ] The step is a script in `tools` that `pnpm check` runs with its other comparisons. It needs neither Docker nor a browser.
- [ ] For each set, it fails when a message of the English file is missing from the Kurdish or the Arabic file.
- [ ] For each set, it fails when the Kurdish or the Arabic file holds a message the English file does not.
- [ ] For each set, it fails when a message cannot be read in that set's format.
- [ ] For each set, it fails when a message names different placeholders in different languages.
- [ ] In the dashboard's set, a message that counts is treated as one message. Each language must hold exactly the plural forms that language has: six for Arabic, and two each for Kurdish and English.
- [ ] In the Shopper app's set, an Arabic message that counts must have all six plural forms.
- [ ] It fails when a shared term holds a placeholder or a plural.
- [ ] A failure names the file, the message and what is wrong with it, and the step exits non-zero. With the files as they stand it passes.
- [ ] Shown once and then reverted, each failing with its own message: a message removed from an Arabic file; a message added to a Kurdish file only; a placeholder renamed in a Kurdish file; a brace removed from a message; one plural form removed from an Arabic message of the dashboard; one plural form removed from an Arabic message of the Shopper app; a placeholder put into a shared term.
- [ ] The note beside the language files marks the Kurdish and the Arabic text of all three sets as drafts awaiting review, and names LANG-7. It says how a correction is checked: by running `pnpm check`.
- [ ] A word list beside the files gives the Kurdish and the Arabic word used for each CONTEXT.md term that appears on a screen, and for the eight Categories. It is marked as a draft, and the language files use the words it gives.
- [ ] `pnpm check` passes with Docker stopped and no browser installed.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 10 October 2026: from ticket 04

- **A check this ticket's list does not have. The owner decides whether it gains it.** Ticket 04 holds every number to Western digits by a rule: no message of the Shopper app writes `#` or `{…, number}`. next-intl formats both in the page's language, and a Kurdish page then shows Arabic-Indic digits. With `#` in the Arabic and the English file only, every line of the Shopper app's tests passed. This step reads every message already, and could fail on `#`, and on `number`, `date` and `time` inside braces, in the Shopper app's files.
- **One name at the top of two sets.** The Shopper app adds the shared terms to its own text. A name used at the top of both, such as a second `Category`, would let one hide the other. This step could fail on that too.
- **A counted message of the Shopper app names its count twice:** `{count, plural, …}` picks the form, and `{countText}` is the count as it is shown. An Arabic form that says the count in a word, such as `one`, holds no `{countText}`. So the placeholders are compared for a whole message, and not for each plural form.
