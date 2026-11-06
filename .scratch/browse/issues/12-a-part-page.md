# 12: A Part page

**Spec:** [the browse spec](../spec.md)

**What to build:** A Shopper opens a Part from its Category page. The page shows:

- the Part's name, manufacturer and part numbers;
- its photo, or its Category's icon;
- its specifications, in English;
- every Visible Offer for it, in OFF-11's order.

Each Offer shows its Vendor's name as written, leading to the Vendor page, and its Shown Price, marked "≈" when converted. It also shows whether it is in stock, its warranty, and how many days ago it was confirmed (BRW-3, OFF-7).

A link to the page pasted into WhatsApp previews the Part in the link's language, with its photo, and with no price (BRW-5, success criterion 12). A Part that is no longer visible answers the not-found page with a 404. With this page, success criterion 3 is true in a browser: a USD-only Offer, seen in IQD, shows a price marked "≈".

**Blocked by:** 04, 10, 15 (the price slip's Platform Rate)

**Status:** ready-for-agent

- [ ] **The page** at `/{language}/parts/{partId}`, built to DESIGN.md. It is rendered on the server for each request. It asks `GET v1/visible-parts/{partId}`, and `GET v1/parts/{partId}/offers` in the chosen currency, with no cache. A Part that is not visible, an unknown Part, and a visible Part whose Offers are gone by the time they are asked for, answer the not-found page with a 404 status, in the page's language.
- [ ] **The Part.** Its name, manufacturer and part numbers through `AlwaysEnglish`. Its photo from ticket 10's address, or `CategoryIcon`. Its Category, named in the page's language and leading back to its Category page.
- [ ] **The specifications.** Shown in the order the API answers them, each with its English label, value and unit through `AlwaysEnglish` (LANG-3). A yes-or-no value is worded in English. Nothing the API leaves out is shown.
- [ ] **An Offer** shows:
  - its Vendor's name through the as-written component (LANG-4), leading to `/{language}/vendors/{vendorId}`;
  - its Shown Price through ticket 10's component;
  - in stock or out of stock, in words, never only a colour;
  - its warranty in months with the ICU plural, left out when null;
  - days since Confirmation with the ICU plural: today, one day ago, n days ago.

  The Offers are in the order the API answers them, and none is promoted or highlighted (OFF-11). The wording of days and of a warranty are plain functions, tested at the Shopper's unit seam in each language.
- [ ] **The preview.** The title names the Part. The description names the Part, its manufacturer and Category, and how many shops offer it, in the page's language, with no price. Open Graph's image is the Part's photo, on the Shopper app's public address, when it has one. These are tested at the unit seam.
- [ ] **The words.** Every new text is in `i18n`'s Shopper set in all three languages, as drafts under LANG-7.
- [ ] `pnpm platform:check` passes on every line. These are checked in a window 360 pixels wide, in Kurdish and in English:
  - A Part reached from its Category page shows its name, part numbers and specifications in English.
  - Its Offers are in OFF-11's order, a converted one with "≈", each with in stock or out of stock, warranty and days since Confirmation.
  - A USD-only Offer, seen in IQD, shows a price rounded to 250 and marked "≈", and in USD its Quoted Price.
  - An Offer's Vendor leads to the Vendor page's address.
  - Deactivating the Part's only Vendor makes the page answer the not-found page with a 404, and reactivating it brings the page back.
  - Kurdish is right to left, with part numbers and specifications reading correctly, and every number in Western digits.
  - The page's HTML holds its title, description, canonical address, the other two languages' addresses, Open Graph's tags and, for a Part with a photo, its image. There is no price, read with no cookie, as a crawler would.
  - `expectAccessible` passes in the light and the dark scheme.
  - Any motion DESIGN.md gives the page is filmed with `film` and judged by `snapsOf`, with reduced motion as well as without.
- [ ] **Taste's inspector.** `pnpm shopper:inspect` runs on a Part page with a photo and one without, in both schemes, in Kurdish and in English, at 1440, 768 and 360 pixels. Every FAIL is fixed, and every WARN is fixed or defended, with the results under Comments.
- [ ] `break-ui` runs with a Part of 20 Offers, the longest name, a Vendor name in Arabic script and a Part with every specification. `mobile-native` runs too. What they found is fixed or recorded under Comments.
- [ ] Shown once and then reverted, each failing its own test: "2 days ago" worded with the singular; a price in the preview's description.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
