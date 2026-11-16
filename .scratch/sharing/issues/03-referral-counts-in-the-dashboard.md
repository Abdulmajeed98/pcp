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
- [x] **The design, led as the guide says.**
  - The Referrals screen is the Catalog's kind of list in Framed sheet (ADR-0011), as Expiring Offers is.
  - Where the count stands in the Vendor portal, and how it is worded, is put to the owner as options rendered in the built-in browser. The options are drawn in Kurdish and in English, at 390 and 1440 pixels, in both schemes, one option to an anchor.
  - The owner's choice is recorded under Comments with the owner's words.
  - Impeccable writes into the dashboard's DESIGN.md whatever it adds.
- [x] **The Referrals screen** at `/referrals`, in the Admin console's navigation, drawn by `PagedList` with its page in the address.
  - Each row names the Vendor `AsWritten`, marks a deactivated Vendor, gives its count in Western digits, and leads to the Vendor's page.
  - It reads `GET v1/referral-counts` through TanStack Query under a key of its own in `shared/api/query-keys.ts`.
  - A refusal and an API that cannot be reached are shown, as on the other Admin lists. The screen is in English.
- [x] **The Vendor's count** stands where the owner chose in the portal.
  - It is read from `GET v1/vendors/{vendorId}/referral-count` under a query key beside the Vendor's other keys.
  - It is in the portal's three languages, in Western digits. The Arabic forms for one and two say the count in words, as the portal's other counts do.
  - The Admin acting as the Vendor sees the same count.
- [x] **Words.** Every new portal text is in the `i18n` library's dashboard set in all three languages, the Kurdish and Arabic drafts for LANG-7. The language check passes.
- [x] **Seam 3**, in a window 360 pixels wide:
  - **Arranging.** The test makes its own made-up Vendors, shares a Build of its own made-up Parts and records Referrals over HTTP.
  - **The Referrals screen** lists the test's Vendors with their counts, a deactivated one marked, and leads to each Vendor's page. The test finds its own rows among earlier runs' as `admin-expiring-offers.spec.ts` does.
  - **The portal** shows the Vendor's count in Kurdish, Arabic and English. The Admin acting as it sees the same, and another made-up Vendor's portal shows its own count, not this one.
  - **Accessibility.** `expectAccessible` passes on both screens in the light and the dark scheme.
- [x] **`pnpm dashboard:inspect`** runs on the Referrals screen and on the portal's screen with the count. It runs in both schemes, the portal in Kurdish and in English, at 1440, 768 and 390 pixels, and at 1024 and 1280 for desk layouts. Every FAIL is fixed, and every WARN is fixed or defended under Comments.
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

### 17 November 2026: the owner's choice and the Vendor's count

**The options**, rendered in the built-in browser on the inspector's made-up shop (its Vendor's count of 1,284), each put into the captured page by script with nothing built, in Kurdish and English, at 390 and 1440 pixels, in both schemes, one option to an anchor, on the owner's page `.taste-skill/sharing-03/`: `#d1`, one Note Grey line under the Offers screen's title, worded as a plain sentence; `#d2`, a row among the details screen's Vendor details; `#d3`, a portal section of its own; `#d4`, `#d1`'s place worded with the term, "1,284 Referrals", and a line that explains it. `#d1` and `#d4` were also drawn at none. Two questions were put, each with my recommendation first: where the count stands (`#d1`), and how it is worded (the plain sentence), with a third, that the line is said at none too.

**The owner's choice**, in the owner's words: "all recommendations with proper motions". So the count stands on the Offers screen under its title, as one plain sentence, "Shoppers have sent you their Build 1,284 times on WhatsApp", and at none "No Shopper has sent you their Build on WhatsApp yet"; and it moves as the dashboard's Motion section moves a figure arriving, with reduced motion and the No Snap Rule. The paper plane is mirrored in Kurdish and Arabic, as an icon that points along the reading direction is.

**The motion**, led by Emil Kowalski's `emil-design-eng`, asked a concrete question and judged by its decision framework: the line is seen each time the Offers screen opens, so it moves only to keep the screen from jumping, never for show; it enters on `--ease-out`, its exit is faster than its arrival, and the figure never counts up (the Data Holds Still Rule). While the count is read, the line's mark and a one-line sketch in Raised Stone hold its place, still. The sentence then takes the sketch's place through the dashboard's own `ChangingInPlace` (the Platform Rate's, Motion 10): it fades in, 200 ms, over the sketch fading out, 150 ms, while the line's height follows from the sketch's to its own over 200 ms on `--ease-in-out`, 150 ms on `--ease-out` with reduced motion, so that the banner and the list move with it. A later count changes the same way; a count that cannot be read closes the line so and is not said; a count already read is drawn at once. It needs nothing that pulls against a hard rule, so no second question was put. DESIGN.md records it as Motion 11, with its reduced-motion row.

**The Vendor's count.** `ReferralCount` (`pages/offers/ui/referral-count.tsx`) stands under the Offers screen's title row, for the Vendor's own Login and, through the same screens, for the Admin acting as it. It reads `GET v1/vendors/{vendorId}/referral-count` with `useReferralCount` under `referralCountKey(vendorId)`, `['vendors', vendorId, 'referral-count']`, beside the Vendor's other keys in the `vendor` entity, so that a change to the Vendor asks it again. The sentence is `OffersScreen.referred` with every plural form of each language (`_one`, `_other`; Arabic `_zero` to `_other`, one and two in words) and `OffersScreen.referredNone` for none, the count written by `formatNumber` in Ink at weight 600 and never on a plate; the mark is `SendIcon` with `rtl:-scale-x-100`. The Kurdish and Arabic are drafts for LANG-7, with `words.md`'s Shopper and Build, and no word for Referral, which the sentence does not need. `node tools/check-language-files.mjs` passes.

**Seam 3** for the portal, written before the count and seen red together, each on its missing element, then green:

| File | Line | What it checks |
|---|---|---|
| `dashboard-languages.spec.ts` | the checks of every portal screen | in Kurdish, Arabic and English: the switch, the direction, Western digits, no sideways scroll; the sentence differs in each; the count is the API's, 3, in each (three Referrals recorded over HTTP, so that Arabic shows it as a number); the mark's `scale` is `-1 1` right to left and `none` in English |
| `dashboard-languages.spec.ts` | the Admin acting as the Vendor | the same count under `/vendors/{id}/portal` |
| `dashboard-languages.spec.ts` | another made-up Vendor | its own portal says none, with no count of this Vendor's |
| `vendor-referral-count.spec.ts` | the arrival, with and without reduced motion | the count's answer held until the screen is drawn, then filmed slowed four times: the sentence fades over several frames, what is below the line moves in no frame (`snapsOf`), by exactly the height the line gained |
| `vendor-referral-count.spec.ts` | WCAG 2.2 AA at 360 and at 1280 | `expectAccessible` in light and dark; at a desk the line stands under the title, on one line |

**`pnpm dashboard:inspect` on the portal's Offers screen with the count**, as the Admin acting as the made-up shop's Vendor (count 1,284, the band above):

| Run | Widths | FAIL | WARN |
|---|---|---|---|
| Kurdish, light | 1440, 768, 390 | 0 | 0 |
| Kurdish, dark | 1440, 768, 390 | 0 | 0 |
| English, light | 1440, 768, 390 | 0 | 0 |
| English, dark | 1440, 768, 390 | 0 | 0 |
| Kurdish, light | 1024 | 0 | 0 |
| Kurdish, dark | 1280 | 0 | 0 |
| English, light | 1280 | 0 | 0 |
| English, dark | 1024 | 0 | 0 |

The photographs were looked at: the line under the title in each, wrapping to two lines in Kurdish on a phone with the banner below it, the paper plane mirrored in Kurdish, and the count in Ink among Note Grey words.

**DESIGN.md** gained, as Impeccable records it: the Vendor's Referral count among the States, with the owner's choice and words; the line in the Vendor portal's layout; and Motion 11, the count's arrival, with its reduced-motion row.

**Phone checks, open, waiting for hosting** (the owner's rule of 16 October 2026): the Referrals screen read and used with a thumb at 360 pixels, its rows leading to a Vendor's page, in English; and the Vendor portal's count read with a thumb in Kurdish and in English, its arrival felt on a real phone with reduced motion on and off. Ticket 06 adds them to the MVP spec's list.
