# The language files

Every translated text of the platform is in this folder, and nowhere else. A file holds nothing but text, so that it can be corrected without reading code.

- `shopper/` is the Shopper app's text: one file for each language, in next-intl's format, which is ICU.

English is the source. `en.json` defines which messages there are, and the other two files hold the same messages under the same keys.

## Drafts awaiting review (LANG-7)

- **Kurdish (Sorani), the `ckb.json` files: DRAFT.** Nothing here has been read by a Sorani speaker yet, so it must not reach a Shopper as it is.
- **Arabic, the `ar.json` files: DRAFT.** Nothing here has been read by an Arabic speaker yet, so it must not reach a Shopper as it is.

The owner, or someone the owner trusts, reviews both before launch.

## Correcting a message

Change the text between the quotation marks and nothing else. The key before the colon stays as it is. So does anything inside braces, such as `{libraries}`, and anything inside angle brackets, such as `<time>` and `</time>`: the page puts a value or an element there, and each may move within the sentence to where the language wants it.
