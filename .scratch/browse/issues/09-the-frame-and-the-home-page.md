# 09: The frame rebuilt and the home page

**Spec:** [the browse spec](../spec.md)

**What to build:** The Shopper app's frame is rebuilt to its new DESIGN.md: its header, the language switch, the currency switch, the footer's credit and the not-found page. They keep their behaviour. The language stays in the address, the currency in its cookie, and both switches work without script.

The placeholder page gives way to the home page. It lists the eight Categories, each with its icon and its name in the Shopper's language, each leading to its Category page.

On 5 November 2026 the owner answered ticket 07's critique for this frame. Its name slot is a way home, a third switch chooses the scheme (light, dark or device), and the not-found page lists the eight Categories, with nothing particular to Erbil. The home page is built to DESIGN.md's home page, so it reads the API: each Category's count and its first Part, one Part on the plate, and the platform's figures from ticket 15.

Every page gains a title and a description in its language, with the tags that let WhatsApp and search engines preview it (BRW-5). A new setting gives the Shopper app's own public address for them.

**Blocked by:** 05, 08, 15 (for the home page's figures only: the frame can be built before 15 lands)

**Status:** ready-for-agent

- [ ] **The frame** is built to DESIGN.md, from the components it names, with logical classes only. The language switch, the currency switch, the not-found page and the footer's credit (CAT-9) behave as `languages` and `pricing` left them. Its name slot is a way home. A third switch, for the scheme (light, dark or device), works without script as the other two do. The not-found page lists the eight Categories, as DESIGN.md draws it.
- [ ] **The home page** at `/{language}` lists the eight Categories with `CategoryIcon` and their names from `i18n`'s Shopper set. Each leads to `/{language}/categories/{category}`. The Category's name in the address is lower case with hyphens (`cpu`, `cpu-cooler`, `motherboard`, `ram`, `storage`, `gpu`, `case`, `psu`), mapped once, in the Shopper app, to the API's key. The Category pages themselves are ticket 10's. The home page is built to DESIGN.md's home page:
  - each Category with its count of Visible Parts and its first Part's Lowest Price, from `GET v1/visible-parts`;
  - one Part on the plate, chosen as DESIGN.md says;
  - the facts, from ticket 15's `GET v1/platform-figures`.

  Each figure is shown only where the API answers it.
- [ ] **The placeholder goes**: its page, its sample of the API's status, and its line about the chosen currency. The home page takes over the proof that the Shopper app reads the API.
- [ ] **The public address.** A new setting for the Shopper app's own public address. Its development default is `http://localhost:3000`. It is checked at start-up, like the Shopper app's other settings, and added to `.env.example`.
- [ ] **Previews.** Every page has these, in its language:
  - a title and a description;
  - its canonical address, and its addresses in the other two languages;
  - Open Graph's title, description, type, locale and site name.

  The home page's description says what the platform is for. No description holds a price. The functions that write a page's preview are plain functions, tested at the Shopper's unit seam in each language.
- [ ] **The words.** Every new text is in `i18n`'s Shopper set in all three languages, the Kurdish and Arabic as drafts under LANG-7, using `words.md`'s terms.
- [ ] It keeps to Feature-Sliced Design's import rules and Next's routing folder rule, and its pages are rendered on the server for each request.
- [ ] `pnpm platform:check` passes on every line. `shopper-page.spec.ts` is rewritten for the home page, and every other Shopper spec keeps passing:
  - In Kurdish, Arabic and English, the home page lists the eight Categories by their names in the page's language, and each leads to its Category's address.
  - Kurdish and Arabic are right to left.
  - The home page's figures match what the API answers, for the platform and for each Category.
  - The scheme switch changes the scheme with no script, and keeps it from page to page.
  - The not-found page lists the eight Categories, each leading to its Category's address, and answers 404.
  - The home page's HTML holds its title, its description, its canonical address, the other two languages' addresses and Open Graph's tags. It is read with no cookie, as a crawler would.
  - `expectAccessible` passes on the home page and the not-found page in the light and the dark scheme.
  - Any motion DESIGN.md gives the frame is filmed with `film` and judged by `snapsOf`, with reduced motion as well as without.
- [ ] **Taste's inspector.** `pnpm shopper:inspect` runs on the home page and the not-found page, in both schemes, in Kurdish and in English, at 1440, 768 and 360 pixels. Every FAIL is fixed, and every WARN is fixed or defended, with the results under Comments.
- [ ] `break-ui` and `mobile-native` run on the frame and the home page, and what they found is fixed or recorded under Comments.
- [ ] `pnpm check`'s language check is seen to fail once, with the Arabic of the home page's description removed, and then reverted. A preview's canonical address pointing at another language is shown once failing its unit test, and then reverted.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
