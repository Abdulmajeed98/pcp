# 03: A Vendor sends a Part Request and follows it

**Spec:** [the part-requests spec](../spec.md)

**What to build:** A Vendor whose catalog search finds nothing taps the empty result's action and lands on the Part Request form. The form is filled with the search's words as the name and the search's Category. The Vendor completes it with the part number and the Offer it would make, and sends it (REQ-1). A new Part Requests section in the portal's top bar leads to the same form at any time, and to the Vendor's Part Requests (REQ-4). Each request there shows its state:
- waiting, with its days;
- added, naming the catalog's Part and leading to the Vendor's Offer for it;
- not added, with the Admin's reason as written.

This works in Kurdish, Arabic and English, at 360 pixels, and for the Admin acting as the Vendor.

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [ ] **The price fields, shared.** In a commit of its own, the Offer form's price, in-stock and warranty fields move down a layer, where Feature-Sliced Design asks it, so that both forms draw the same fields. The Offer form's own tests pass unchanged.
- [ ] **The section.** The top bar gains Part Requests between Offers and Details, marked current as the other two are. Its addresses are `part-requests` and `part-requests/new`, relative to the route, so the portal's own frame and the acting frame serve the same screens.
- [ ] **The form.** React Hook Form's, with:
  - the Category chosen from the API's eight;
  - the name and the part number;
  - the shared price, in-stock and warranty fields.

  Digits go through `westernDigitsIn`, in the part number too. Each refusal is said beside its field in the portal's language. Sending returns to `part-requests` with a note naming the request, carried in the address's state.
- [ ] **From the empty search.** The catalog search's empty result gains the action, placed as ticket 02 recorded. It opens the form with the search's words as the name and the search's Category, carried in the address so that a reload keeps them.
- [ ] **The list.** Paged, 20 a page, with its page in the address, newest first. Each request shows:
  - its Category's name;
  - its name and part number `AsWritten`;
  - its prices on plates as an Offer's are shown, with its stock and warranty;
  - when it was sent;
  - its state, drawn as ticket 02 recorded. An added request names the Part `AlwaysEnglish` and links to `offers/<offerId>` while that Offer exists. A not-added request shows the reason `AsWritten`.

  With no request at all, the list says so and offers the form. A refusal and an API that cannot be reached are said with `WhyNotAnswered`.
- [ ] **The query keys.** Every query about Part Requests is under `['part-requests']` in the dashboard's shared query keys. Whichever of tickets 03 and 04 lands first adds the key. A send asks it again.
- [ ] **Words.** Every new text is in `i18n`'s dashboard set in the three languages, with `words.md`'s terms. Every plural form is given, and Arabic's one and two in words. No message formats a number. The Kurdish and Arabic are drafts under LANG-7.
- [ ] **The end-to-end tests,** in the 360-pixel window, in Kurdish, Arabic and English, with made-up Vendors, Parts and part numbers made through the API:
  - sending from the empty search, with the words and Category filled, landing on the list with the request waiting;
  - sending from the section;
  - a request with no price, refused beside the price;
  - the three states, arranged by fulfilling and rejecting through the API as the Admin: added leading to the Offer, the reason as written, and waiting;
  - the fulfilled request's Offer on the Offers screen with the request's prices;
  - the Admin sending one for the Vendor under the band, which the Vendor's own portal then lists;
  - Kurdish and Arabic right to left, Western digits throughout, what was written shown as written, and `expectNoSidewaysScroll`.
- [ ] **Accessibility.** `expectAccessible` passes in the light and the dark scheme on:
  - the list in each state;
  - the list with none;
  - the form with a refusal shown;
  - the empty search with its action.
- [ ] **Motion.** What ticket 02's record makes move is filmed with `film` and judged by `snapsOf`, with reduced motion and without it.
- [ ] **The inspector.** `pnpm dashboard:inspect` runs on the list and the form at 1440, 768 and 390 pixels, and at 1024 and 1280 where a desk layout changes between them. It runs in Kurdish and English, in both schemes, with the made-up Part Requests and with `--part-requests`. Every FAIL is fixed, and every WARN is fixed or defended in Comments, a design defence put to the owner. The results go in Comments as a table.
- [ ] **A fault seen to fail once:** the Arabic text of a state removed, at the language files' check.
- [ ] **Phone checks**, recorded open until hosting: the form used with a thumb in Kurdish and English, a price and a part number typed on a Kurdish and an Arabic keyboard, the empty search's action reached with a thumb, the list read on a phone with a long Kurdish reason, and the motion felt with reduced motion on and off.
- [ ] **Gates.** `pnpm check --skip-nx-cache` and `pnpm platform:check` pass.

## Comments
