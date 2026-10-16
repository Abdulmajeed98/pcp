# The language is part of a Shopper address, and the two frontends use two libraries with two message formats

Two decisions of the `languages` module, which are costly to undo once pages, links and text depend on them. The owner made both on 10 October 2026. The module's spec is [.scratch/languages/spec.md](../../.scratch/languages/spec.md).

**The language is the first part of every Shopper address,** for all three languages: `/ckb/…`, `/ar/…` and `/en/…`. No language has a bare address. An address with no language is answered with a redirect to the same page in the remembered language, else the browser's, else Kurdish. An address with a language is shown in that language, whatever is remembered. next-intl gives the Shopper app this, and remembers the choice in a cookie that lasts a year.

**The Shopper app uses next-intl, and the dashboard uses react-i18next with i18next.** Each reads its text in its own library's own format: the Shopper app's in ICU, which is next-intl's, and the dashboard's in i18next's. All of it is in the `i18n` library, as one set of files for each frontend, and a third set, the shared terms, holds the text both show alike in plain text, which both libraries read the same way. A step of `pnpm check` holds each set to its format.

## Considered Options

For the Shopper's address:

- **The language in a cookie alone, with one address for all three languages.** Shorter addresses. Search engines would see one language, a link would open in whatever the receiver last chose rather than what the sender saw, and a cache in front of the platform could not tell the three apart.
- **A bare address for Kurdish, the default, and a prefix for the other two.** next-intl offers it. A Kurdish link and a link with no language would then be one address, and a Shopper who chose English and opened a Kurdish link would be sent to English.

For the dashboard's library:

- **`use-intl`, next-intl's own core, for React apps outside Next.** It reads the same ICU files with the same hooks, so the platform would have one message format. It was the recommendation. The owner chose react-i18next, the most widely used.
- **react-i18next with `i18next-icu`,** which makes i18next read ICU messages. One format and one set of rules, and i18next not used as its own documentation describes. It is the first thing to try if two formats prove a burden at the review of the text.

## Consequences

- Every Shopper link carries its language. A link handed to someone else opens in the language its sender read. Opening a link in another language changes what the Shopper app remembers, because next-intl remembers the language of the last address opened, and a use of the switch is such a visit. `sharing` decides whether a shared link keeps that rule.
- A Shopper page is never served without a language, so a cache can keep each language's page apart, and next-intl names each page's address in the other two languages for search engines.
- The platform has two message formats. A sentence that counts is one ICU message with its plural forms inside it in the Shopper app's files, and one i18next key for each plural form in the dashboard's: six for Arabic. A value is `{name}` in one and an element such as `<name/>` in the other. The README beside the files says how each is corrected, and `pnpm check` fails on a fault in either.
- Text that both frontends show with the same wording, such as the Category names, has to be plain text, in the shared terms.
- Neither library's own number formatting is used, because each formats a number in the page's language and writes a Kurdish one in Arabic-Indic digits. `formatNumber` in `i18n` writes every number, and `pnpm check` fails on a message that would let either library format one.
- The Vendor portal has no address for each language. Its switch changes the language in place and remembers it in the browser's storage, and only a use of the switch is remembered.
