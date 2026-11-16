# 03: Referral counts in the dashboard

**Spec:** [the sharing spec](../spec.md)

**What to build:** The Admin opens a Referrals screen in the Admin console and sees every Vendor with its Referral count, most first, a deactivated Vendor marked as such, each leading to the Vendor's page (SHR-7). A Vendor sees its own count in its portal, in its language, and the Admin sees the same count while acting as that Vendor. No other Vendor sees it. Referrals are arranged through the API in the tests, so this ticket does not wait for the Shopper's button. Ticket 05 proves a tap raising the count.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] **The inspector's made-up shop** answers `GET v1/referral-counts` and `GET v1/vendors/{vendorId}/referral-count` with:
  - Vendors with no Referral;
  - a deactivated Vendor;
  - a count in the thousands.

  It is typed against `@pcp/api-client` and still refuses every write.
- [ ] **The design, led as the guide says.**
  - The Referrals screen is the Catalog's kind of list in Framed sheet (ADR-0011), as Expiring Offers is.
  - Where the count stands in the Vendor portal, and how it is worded, is put to the owner as options rendered in the built-in browser. The options are drawn in Kurdish and in English, at 390 and 1440 pixels, in both schemes, one option to an anchor.
  - The owner's choice is recorded under Comments with the owner's words.
  - Impeccable writes into the dashboard's DESIGN.md whatever it adds.
- [x] **The Referrals screen** at `/referrals`, in the Admin console's navigation, drawn by `PagedList` with its page in the address.
  - Each row names the Vendor `AsWritten`, marks a deactivated Vendor, gives its count in Western digits, and leads to the Vendor's page.
  - It reads `GET v1/referral-counts` through TanStack Query under a key of its own in `shared/api/query-keys.ts`.
  - A refusal and an API that cannot be reached are shown, as on the other Admin lists. The screen is in English.
- [ ] **The Vendor's count** stands where the owner chose in the portal.
  - It is read from `GET v1/vendors/{vendorId}/referral-count` under a query key beside the Vendor's other keys.
  - It is in the portal's three languages, in Western digits. The Arabic forms for one and two say the count in words, as the portal's other counts do.
  - The Admin acting as the Vendor sees the same count.
- [ ] **Words.** Every new portal text is in the `i18n` library's dashboard set in all three languages, the Kurdish and Arabic drafts for LANG-7. The language check passes.
- [ ] **Seam 3**, in a window 360 pixels wide:
  - **Arranging.** The test makes its own made-up Vendors, shares a Build of its own made-up Parts and records Referrals over HTTP.
  - **The Referrals screen** lists the test's Vendors with their counts, a deactivated one marked, and leads to each Vendor's page. The test finds its own rows among earlier runs' as `admin-expiring-offers.spec.ts` does.
  - **The portal** shows the Vendor's count in Kurdish, Arabic and English. The Admin acting as it sees the same, and another made-up Vendor's portal shows its own count, not this one.
  - **Accessibility.** `expectAccessible` passes on both screens in the light and the dark scheme.
- [ ] **`pnpm dashboard:inspect`** runs on the Referrals screen and on the portal's screen with the count. It runs in both schemes, the portal in Kurdish and in English, at 1440, 768 and 390 pixels, and at 1024 and 1280 for desk layouts. Every FAIL is fixed, and every WARN is fixed or defended under Comments.
- [ ] **Phone checks**, the Referrals screen and the portal's count read with a thumb in Kurdish and in English, are recorded under Comments as open, waiting for hosting.
- [ ] `pnpm check` and `pnpm platform:check` pass, and the work is committed.

## Comments

### 17 November 2026: the made-up counts and the Referrals screen

**The inspector's made-up shop** (`a50b6d9`). `apps/inspector/src/made-up-referral-counts.ts` gives each of the 21 made-up Vendors of `made-up-vendors.ts` a Referral count: the shop's own Vendor, "Made-up PC Parts", 1,284; three Vendors tied on 312, so that their names decide their order; six with none, "Pretend Tech", which gave no WhatsApp number, and the longest name among them; and "Imaginary Gaming Corner" deactivated with 46, since a deactivated Vendor keeps its Referrals. `answerFromTheMadeUpShop` answers `GET v1/referral-counts` from them, a page at a time, in the API's order (most first, then name, then identifier), and `GET v1/vendors/{shop's Vendor}/referral-count` with the shop's own count; another Vendor's count is left to the API. Both answers are typed by `@pcp/api-client`'s `ReferralCountsPageResponse` and `ReferralCountResponse`, which the client's entry now exports with `VendorsReferralCountResponse`. Every write is still refused, `POST v1/shared-builds` and a Referral's `POST` among them. The names' order is stated with `Intl.Collator('en')`, as the Shopper's stand-in compares names, and the test's expected order is the development database's own: `ORDER BY name` on the 21 names under its `en_US.utf8` gave the same order as the collator, read on 17 November 2026. Four tests in `made-up-shop.spec.ts` were red first, the list answered `undefined` (left to the API) and the count 404, then green.

**The Referrals screen** at `/referrals`, the sixth of the Admin console's sections, with a paper plane (`SendIcon`): `pages/referrals`, the Catalog's kind of list drawn by `PagedList` with its page in the address (`usePageInTheAddress`), 20 Vendors a page, as Expiring Offers is. It reads `GET v1/referral-counts` through TanStack Query under `referralCountsKey`, `['vendors', 'referral-counts']`, in `shared/api/query-keys.ts`: under the Vendors' key, so that deactivating or renaming a Vendor asks it again. A row names the Vendor `AsWritten`, marks a deactivated Vendor with `DeactivatedMark` as the Vendors' list does, gives its count by `formatNumber`, and leads to `/vendors/{id}`: a table from 64rem (Vendor, State, Referrals, the count end-aligned in tabular figures) and two-line rows on a phone ("1,284 Referrals"). A refusal and an API that cannot be reached are said in the refusal panel, "The Referrals could not be listed.", with `WhyNotAnswered`; the one empty list, no Vendor at all, says "No Vendor yet". The screen is in English.

**Seam 3**, `apps/e2e/src/admin-referrals.spec.ts`, in the 360-pixel window, with `referrals.ts` holding `shareABuildOf`, `recordAReferral` and `referralCountOf` over HTTP. Its set-up makes three made-up Vendors, two with a WhatsApp number, shares a Build of a made-up Part, records two Referrals for one and one for the other, then deactivates the second; the third has none. Each Vendor's place on the list is asked of the API, 100 a page, from the first page for a Vendor with Referrals and from the last for one with none (the newest made-up name with none is among the last of the many with none), and its dashboard page is opened by `?page=N`, as `admin-missing-specifications.spec.ts` finds its Part. Five lines, all red first for the right reason (no section in the menu, no screen at `/referrals`), then green:

| Line | What it checks |
|---|---|
| The menu leads to the Referrals | the section, the address, the API's 200 |
| Each Vendor listed with its count | 2, 1 and 0 as the API answers them, the deactivated one marked, each name `AsWritten`, no sideways scroll, the row leading to the Vendor's page |
| WCAG 2.2 AA | `expectAccessible` in light and dark, on the page holding the deactivated Vendor |
| A refusal and no API | a 503 `DATABASE_UNAVAILABLE` and an aborted call, each said |
| At a desk's width | the table's columns Vendor, State and Referrals, no plate, the table across the sheet, `expectAccessible`, the row leading to the Vendor's page |

`admin-platform-rate.spec.ts`'s line that lists the menu sheet's sections gained "Referrals" at the end; its 18 lines pass.

**`pnpm dashboard:inspect` on the Referrals screen**, on the made-up shop's 21 Vendors:

| Run | Widths | FAIL | WARN |
|---|---|---|---|
| light | 1440, 768, 390 | 0 | 0 |
| dark | 1440, 768, 390 | 0 | 0 |
| light | 1024 | 0 | 0 |
| light | 1280 | 0 | 0 |
| dark | 1024 | 0 | 0 |
| dark | 1280 | 0 | 0 |

The photographs were looked at: the count of Vendors in words on the end side, the tie of three at 312 in name order, Latin before Arabic script, the deactivated mark in its column, and the long English name wrapping on a phone.

**DESIGN.md** gained, as Impeccable records it: a Vendor's Referral count among the rows and tables; the Referrals among the Admin console's sections, with its paper plane; the Referrals among the lists that keep the filter bar's line for their count alone; and a Referral count among the counts that are words, never plates.
