# 03: Referral counts in the dashboard

**Spec:** [the sharing spec](../spec.md)

**What to build:** The Admin opens a Referrals screen in the Admin console and sees every Vendor with its Referral count, most first, a deactivated Vendor marked as such, each leading to the Vendor's page (SHR-7). A Vendor sees its own count in its portal, in its language, and the Admin sees the same count while acting as that Vendor. No other Vendor sees it. Referrals are arranged through the API in the tests, so this ticket does not wait for the Shopper's button. Ticket 05 proves a tap raising the count.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] **The inspector's made-up shop** answers `GET v1/referral-counts` and `GET v1/vendors/{vendorId}/referral-count` with:
  - Vendors with no Referral;
  - a deactivated Vendor;
  - a count in the thousands.

  It is typed against `@pcp/api-client` and still refuses every write.
- [ ] **The design, led as the guide says.**
  - The Referrals screen is the Catalog's kind of list in Framed sheet (ADR-0011), as Expiring Offers is.
  - Where the count stands in the Vendor portal, and how it is worded, is put to the owner as options rendered in the built-in browser. The options are drawn in Kurdish and in English, at 390 and 1440 pixels, in both schemes, one option to an anchor.
  - The owner's choice is recorded under Comments with the owner's words.
  - Impeccable writes into the dashboard's DESIGN.md whatever it adds.
- [ ] **The Referrals screen** at `/referrals`, in the Admin console's navigation, drawn by `PagedList` with its page in the address.
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
