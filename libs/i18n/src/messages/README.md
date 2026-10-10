# The language files

The translated text of the platform's own screens is in this folder. A file holds nothing but text, so that it can be corrected without reading code. The one translated text kept elsewhere is the Sorani text of Keycloak's login screen, which is with Keycloak's theme, under `services/keycloak`.

- `shared/` is the shared terms: text that both frontends show, with the same wording. Here that is the names of the eight Categories. One file for each language, and plain text only: a shared term has nothing in braces and nothing in angle brackets, because the two frontends read those differently.
- `shopper/` is the Shopper app's text: one file for each language, in next-intl's format, which is ICU.

English is the source. `en.json` defines which messages there are, and the other two files hold the same messages under the same keys.

## Drafts awaiting review (LANG-7)

- **Kurdish (Sorani), the `ckb.json` files: DRAFT.** Nothing here has been read by a Sorani speaker yet, so it must not reach a Shopper as it is.
- **Arabic, the `ar.json` files: DRAFT.** Nothing here has been read by an Arabic speaker yet, so it must not reach a Shopper as it is.

The owner, or someone the owner trusts, reviews both before launch.

## Correcting a message

Change the text between the quotation marks and nothing else. The key before the colon stays as it is. So does anything inside braces, such as `{libraries}`, and anything inside angle brackets, such as `<time>` and `</time>`: the page puts a value or an element there, and each may move within the sentence to where the language wants it.

What stands between `<english>` and `</english>` is text that is the same in every language and runs left to right, such as a Part name, a manufacturer name, a specification or a number beside its unit. The page puts it there, and it is never written in these files (LANG-3).

A sentence that counts holds one wording for each plural form its language has: `one` and `other` in English and in Kurdish, and `zero`, `one`, `two`, `few`, `many` and `other` in Arabic. Each form's name stays as it is, and the wording is what follows it in braces.

## Numbers

No message formats a number. A number reaches a message as text, already written in Western digits by `formatNumber`, and the message only places it. A sentence that counts is therefore given its count twice: `{count, plural, …}` picks the wording, and `{countText}` is the count as it is shown.

`#` and `{…, number}` are never written here, although both are valid in this format. Each lets the library format the number in the page's language, and a Kurdish page then shows Arabic-Indic digits (LANG-5).
