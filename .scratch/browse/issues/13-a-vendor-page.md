# 13: A Vendor page

**Spec:** [the browse spec](../spec.md)

**What to build:** A Shopper opens a Vendor from one of its Offers. The page shows the Vendor's name, city, address and opening hours as the Vendor wrote them (LANG-4). Each contact detail is a link:

- the phone number calls the shop;
- the WhatsApp number opens a chat with it;
- the Instagram name opens its profile;
- the map pin opens its location in Google Maps, with nothing loaded from Google on the page (BRW-4).

A detail the Vendor has not given is left out. Below them are all its Visible Offers, grouped by Category, each leading to its Part page. A Vendor with no Visible Offers says so and still shows how to reach it. A deactivated Vendor's page answers the not-found page with a 404 (ACC-7).

**Blocked by:** 01, 12

**Status:** ready-for-agent

- [ ] **The page** at `/{language}/vendors/{vendorId}`, built to DESIGN.md. It is rendered on the server for each request. It asks `GET v1/visible-vendors/{vendorId}`, and its Offers in the chosen currency, with no cache. A deactivated or unknown Vendor answers the not-found page with a 404 status, in the page's language.
- [ ] **The Vendor.** Its name, city, address and opening hours through the as-written component, with the text's own direction.
- [ ] **The links.**
  - The phone number is a `tel:` link.
  - The WhatsApp number opens ticket 01's shared WhatsApp chat address.
  - The Instagram name opens its profile.
  - The map location opens ticket 01's shared Google Maps address in a new tab.

  Each link is named in the page's language. The phone's and Instagram's addresses are plain functions, tested at the Shopper's unit seam.
- [ ] **The Offers** are grouped by Category, with headings that name each Category in the page's language. Each Offer shows its Part's photo or `CategoryIcon`, its name and manufacturer through `AlwaysEnglish`, its Shown Price, in stock or out of stock, its warranty and its days since Confirmation, as ticket 12 draws them. It leads to its Part page. They are paged, with the page in the address. With none, the page says the shop has no Offers right now.
- [ ] **The preview.** The title and description name the shop and its city, in the page's language, with no price.
- [ ] **The words.** Every new text is in `i18n`'s Shopper set in all three languages, as drafts under LANG-7.
- [ ] `pnpm platform:check` passes on every line. These are checked in a window 360 pixels wide, in Kurdish and in English:
  - A Part page's Offer leads to its Vendor's page.
  - The phone, WhatsApp, Instagram and Google Maps links have the right addresses.
  - A detail the test's Vendor has not given is not shown.
  - The Offers are grouped by Category and lead to their Part pages.
  - A Vendor with no Visible Offers says so and shows its contact details.
  - Deactivating the Vendor makes its page answer the not-found page with a 404, and so does the page of a Part it alone offered.
  - Kurdish is right to left, a name written in Latin script reads correctly within it, and every number is in Western digits.
  - The page's HTML holds its title, description, canonical address, the other two languages' addresses and Open Graph's tags, and no price.
  - `expectAccessible` passes in the light and the dark scheme.
  - Any motion DESIGN.md gives the page is filmed with `film` and judged by `snapsOf`, with reduced motion as well as without.
- [ ] **Taste's inspector.** `pnpm shopper:inspect` runs on a Vendor page with every detail, on the one with only its phone number, and on the one with no Visible Offers. Each is run in both schemes, in Kurdish and in English, at 1440, 768 and 360 pixels. Every FAIL is fixed, and every WARN is fixed or defended, with the results under Comments.
- [ ] `break-ui` runs with a Vendor name in Arabic script, a long address, and a Vendor with 400 Offers. `mobile-native` runs on the contact links used with a thumb. What they found is fixed or recorded under Comments.
- [ ] Shown once and then reverted, each failing its own test: an empty Instagram link shown for a Vendor with none; the Offers drawn in one list without their Categories.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
