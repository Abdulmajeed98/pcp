# Fonts are downloaded, from each app's own server

The platform's pages are set in fonts it sends, not in the device's own. The Shopper app uses Archivo and Noto Kufi Arabic, and the dashboard uses Geist, Noto Sans Arabic and Geist Mono. The owner chose them on 15 October 2026, asking for "the most elegant fonts for the apps for all the three languages", and overruled the research's recommendation to download none, which `languages` had decided before. The research is in [docs/research/design-system.md](../research/design-system.md).

Each font comes from a Fontsource package in the `ui` library and is served by the app itself, from its own address, with the page. A page downloads only the files that hold the letters it uses, so a page with no word in Arabic script fetches no Arabic file.

A font must draw every letter of Sorani. Several of the most popular Arabic-script fonts cannot draw ڕ, ڵ, ێ, ۆ or ە, and a Kurdish page set in one of them would draw those letters in another font, mid-word. The research lists which families can.

## Considered Options

- **The device's own fonts, the research's recommendation.** Nothing to download. Android draws Kurdish and Arabic in Noto Naskh Arabic at two weights only, and the phone makers most common in Iraq ship their own skins, whose fonts are not documented, so the platform would look different on every phone.
- **Google's font servers.** The same files, with no package to keep. Every page would ask a second company's server for them, which costs a connection on a weak network and tells that company who visits.
- **Next's own font loader.** Self-hosts fonts for the Shopper app, but not for the dashboard, which is built with Vite, and it fetches the files when the app is built.

## Consequences

- A page with Arabic script on it downloads about 214 KB of fonts in the Shopper app and 218 KB in the dashboard on the first visit, about 1.1 seconds at Lighthouse's Slow 4G, and nothing after. Every Shopper page is such a page, in English too, because its language switch names Kurdish and Arabic in their own script. Only a page with no Arabic script, such as the Admin console's, downloads less: 52 KB. Setting the switch's two names in the device's font would spare an English page the Arabic file, at the cost of those two words looking different.
- Text is shown at once in the device's font and changes to the downloaded one when it arrives, which Fontsource's `font-display: swap` does. On a slow first visit the page may shift as it changes.
- Changing a font means measuring its size again and checking that it draws Sorani, and an ADR if the reason here no longer holds.
- The Sorani letters are still checked by hand on the owner's phone and on an Android phone from Honor, Infinix, Tecno or Xiaomi, as `languages` asked.
- The fonts are under the SIL Open Font License 1.1, which lets them be sent with the platform's pages.
