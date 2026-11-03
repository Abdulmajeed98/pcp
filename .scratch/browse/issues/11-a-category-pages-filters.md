# 11: A Category page's filters and price range

**Spec:** [the browse spec](../spec.md)

**What to build:** On a Category page the Shopper can filter by manufacturer, by a price range in the chosen currency, and by the Category's key specifications (BRW-2). Each filter offers only the values the Category's Visible Parts hold. Several values of one filter find Parts with any of them, and different filters narrow the list together. The Shopper sees which filters are on and can clear one or all.

The filters are in the address, like the search, and work before any script has loaded. The form is built from the API's answer of the Category's filters, so the Shopper app holds no list of them, only their names in three languages.

**Blocked by:** 01, 03, 10

**Status:** ready-for-agent

- [ ] **The form** is built to DESIGN.md from `GET v1/visible-parts/filters`, asked in the chosen currency. It is a plain form sent with GET, with the search, so it works before any script has loaded. With script, a choice may apply as soon as it is made, as DESIGN.md says.
- [ ] **The choices.** Each choice is a native control, named in the page's language. Filter names are in `i18n`'s Shopper set, keyed by the parameter names the API answers. A specification's values are English through `AlwaysEnglish`, as LANG-3 has them. The words for yes-or-no values ("Air" and "Liquid" for a CPU cooler) are translated.
- [ ] **The address.** Several values of one filter repeat its parameter. A parameter or a value that the Category's filters do not offer is dropped, never sent, so an old link still opens. These rules are plain functions tested at the Shopper's unit seam.
- [ ] **The price range.** Two fields in the chosen currency, with the range of Lowest Prices shown as their hint. They take Western, Arabic-Indic or Eastern Arabic-Indic digits, read through ticket 01's shared reading of digits, which drops separators. A value that is not a whole number, or a lowest above the highest, is not sent, and the form says why beside the field.
- [ ] **On, and clearing.** The filters that are on are shown, each can be cleared on its own, and all can be cleared at once. A list the filters empty says so and offers to clear them.
- [ ] **Both switches.** Switching the currency keeps the filters and drops the price range, as ticket 05 made it. Switching the language keeps everything.
- [ ] **The words.** Every new text is in `i18n`'s Shopper set in all three languages, as drafts under LANG-7.
- [ ] `pnpm platform:check` passes on every line. The test makes its own made-up Parts with the specifications it filters on, its own Vendor and its Offers. These are checked in a window 360 pixels wide, in Kurdish and in English:
  - A filter narrows the list, and the address holds it.
  - Two values of one filter find either.
  - Two filters must both match.
  - Clearing one, and clearing all, restore the list.
  - With JavaScript disabled the same filters work.
  - A price range typed in Arabic-Indic digits with a separator narrows the list by Lowest Price.
  - Switching the currency drops the range and keeps the filters.
  - Switching the language keeps all of them.
  - An address with an unknown filter and an unknown value opens with both dropped.
  - `expectAccessible` passes with filters on, in the light and the dark scheme.
  - Any motion DESIGN.md gives the filters is filmed with `film` and judged by `snapsOf`, with reduced motion as well as without.
- [ ] **Taste's inspector.** `pnpm shopper:inspect` runs on a Category page with filters on and with filters that empty the list, in both schemes, in Kurdish and in English, at 1440, 768 and 360 pixels. Every FAIL is fixed, and every WARN is fixed or defended, with the results under Comments.
- [ ] `break-ui` runs with a filter of 40 values and with every filter on at once. `mobile-native` runs on the filters used with a thumb and the price fields with the phone's number pad. What they found is fixed or recorded under Comments.
- [ ] Shown once and then reverted, each failing its own test: an unknown value sent to the API; the range kept through the currency switch.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
