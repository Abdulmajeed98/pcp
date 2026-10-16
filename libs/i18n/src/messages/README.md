# The language files

The translated text of the platform's own screens is in this folder. A file holds nothing but text, so that it can be corrected without reading code. The one translated text kept elsewhere is the Sorani text of Keycloak's login screen, which is with Keycloak's theme, under `services/keycloak`.

- `shared/` is the shared terms: text that both frontends show, with the same wording. Here that is the names of the eight Categories. One file for each language, and plain text only: a shared term has nothing in braces and nothing in angle brackets, because the two frontends read those differently.
- `shopper/` is the Shopper app's text: one file for each language, in next-intl's format, which is ICU.
- `dashboard/` is the dashboard's text: what the Vendor portal shows, and the text of a part that both halves of the dashboard share. One file for each language, in i18next's own format. Text that only the Admin console shows is in English in the code, and is not here.

English is the source. `en.json` defines which messages there are, and the other two files hold the same messages under the same keys.

## Drafts awaiting review (LANG-7)

- **Kurdish (Sorani), `shared/ckb.json`, `shopper/ckb.json` and `dashboard/ckb.json`: DRAFT.** Nothing here has been read by a Sorani speaker yet, so it must not reach a Shopper or a Vendor as it is.
- **Arabic, `shared/ar.json`, `shopper/ar.json` and `dashboard/ar.json`: DRAFT.** Nothing here has been read by an Arabic speaker yet, so it must not reach a Shopper or a Vendor as it is.
- **The word list, [`words.md`](words.md): DRAFT.** It gives the Kurdish and the Arabic word for each of the platform's terms that a Shopper or a Vendor reads, and the files use those words. A word changed there is changed in every file that uses it.

The owner, or someone the owner trusts, reviews all of them before launch.

## Checking a correction

Run `pnpm check` at the root of the repository. One of its steps compares the language files, and it fails, naming the file, the message and what is wrong, when:

- a message of an `en.json` file is missing from the `ckb.json` or the `ar.json` beside it, or one of those holds a message the `en.json` does not;
- a message cannot be read in its set's format, as when a brace or an angle bracket is lost;
- a message names other placeholders than the English one: braces and angle brackets with other names inside, or a name dropped;
- a sentence that counts lacks a plural form its language has, or, in the dashboard's files, has one its language does not;
- a message lets its library write a number, which a Kurdish page would show in Arabic-Indic digits (see Numbers below);
- a shared term holds anything in braces or angle brackets, or a name at the top of the shared terms is also at the top of `shopper/` or `dashboard/`.

## Correcting a message

Change the text between the quotation marks and nothing else. The key before the colon stays as it is. So does anything inside braces, such as `{libraries}`, and anything inside angle brackets, such as `<time>` and `</time>` or `<name/>`: the page puts a value or an element there, and each may move within the sentence to where the language wants it.

In the dashboard's files a tag that closes itself, such as `<name/>`, stands for a value the page puts there whole, such as a login's name. It is never written out in these files.

What stands between `<english>` and `</english>` is text that is the same in every language and runs left to right, such as a Part name, a manufacturer name, a specification or a number beside its unit. The page puts it there, and it is never written in these files (LANG-3).

In the Shopper app's files, a sentence that counts holds one wording for each plural form its language has: `one` and `other` in English and in Kurdish, and `zero`, `one`, `two`, `few`, `many` and `other` in Arabic. Each form's name stays as it is, and the wording is what follows it in braces.

In the dashboard's files a sentence that counts is one key for each plural form its language has, such as `partsFound_one` and `partsFound_other`: `_one` and `_other` in English and in Kurdish, and `_zero`, `_one`, `_two`, `_few`, `_many` and `_other` in Arabic. The part of the key before the form's name stays as it is, and so does the form's name. Each wording may hold `<count/>`, where the page puts the count as it is shown, or leave it out, as an Arabic wording does that says the count in a word.

## Numbers

No message formats a number. A number reaches a message as text, already written in Western digits by `formatNumber`, and the message only places it. A sentence that counts is therefore given its count twice. In the Shopper app's files `{count, plural, …}` picks the wording, and `{countText}` is the count as it is shown. In the dashboard's files the count picks the key, and `<count/>` is the count as it is shown.

`#` and `{…, number}` are never written in the Shopper app's files, although both are valid in that format. Nothing in double braces is written in the dashboard's files: `{{count}}` would write the count with no grouping, as 1575000, and `{{count, number}}` would format it in the page's language. next-intl and i18next each format a number in the page's language, and a Kurdish page then shows Arabic-Indic digits (LANG-5). `pnpm check` fails on each of them, and on `{…, date}` and `{…, time}` in the Shopper app's files, which next-intl formats the same way.
