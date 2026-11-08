# 08: The Build page's compatibility and prices

**Spec:** [the builder spec](../spec.md)

**What to build:** The Build page now shows two things.

- **What the rules found.** Every Compatibility Problem, every Compatibility Warning and every unchecked rule, in words that name the Parts involved, with how many rules passed and the Estimated power draw. It never stops the Shopper from keeping an incompatible Build (BLD-4).
- **What the Build costs.** The first price view gives each Part's Lowest Price and the Vendor it comes from, with the total across Vendors as the page's headline. The second view lists each Vendor with its own total, the Parts it has and the Parts it lacks, fewest lacked first. Totals that hold a Converted Price are marked "≈", and an Unstocked Part is shown as such and left out of every total.

This makes success criterion 6 true, and the half of criterion 5 where an incompatible Part's Problem is listed, which ticket 09 reaches through the picker.

**Blocked by:** 02, 03, 07

**Status:** ready-for-agent

- [ ] **The outcomes**, built to DESIGN.md: Problems first, then Warnings, then unchecked rules, each group in rule order, and a line counting the rules that passed.
  - Each outcome is worded for its rule in the page's language, naming its Parts in English, saying what fails without the values compared.
  - An unchecked rule names each missing specification by its English label and its Part.
  - Nothing on the page stops the Shopper from keeping the Build.
- [ ] **The words for every rule.** A plain function words each rule's every outcome. A type check fails `pnpm check` until every rule's every outcome is worded, as a new filter's name does. Rules 11, 15 and 20 have a Warning, and every rule has a Problem and an unchecked case. Every text is in `i18n`'s Shopper set in all three languages, as drafts under LANG-7.
- [ ] **The Estimated power draw**, or the Part whose TDP is missing. Without a CPU it is left out.
- [ ] **The first price view.** Each Part has its Lowest Price times its quantity, drawn by `ShownPrice`, and the Vendor it comes from, linked to its Vendor page. The total is the page's headline, with "≈" when converted. An Unstocked Part says that no Vendor has it in stock, never by colour alone. When the API says a price could not be shown, the page says so beside the total. No Shopper code converts, rounds, adds or compares a price.
- [ ] **The second price view.** Each Vendor has its name, linked to its Vendor page, its total through `ShownPrice`, the Parts it has and the Parts it lacks, in the API's order. It is built so that `sharing` can add a "send on WhatsApp" button to each Vendor.
- [ ] **The currency switch** changes every price and total on the page. What "≈" means is said once under the sheet when a price on it is converted, as on the other Shopper pages.
- [ ] **The motion** DESIGN.md gives the outcomes and the totals, filmed with `film` and judged by `snapsOf`, with reduced motion and without it.
- [ ] **`pnpm shopper:inspect`** on the Build page with each made-up Build, in both schemes, in Kurdish and in English, at 1440, 1280, 1024, 768 and 390 pixels, and in dollars at 1440 and 390 pixels. Every FAIL is fixed, and every WARN fixed or defended under Comments. `break-ui`'s worst cases are looked at with the worst-case Build.
- [ ] **The Shopper's unit seam** gains tests that word every rule's every outcome in each language, each naming its Parts, and an unchecked rule naming its missing specifications in English.
- [ ] **`pnpm platform:check`** gains these lines, in a window 360 pixels wide, in Kurdish and in English, each arranging its Build with the pick form and made-up Parts carrying the specifications it needs:
  - A CPU and a motherboard of different sockets make the page list a Compatibility Problem naming both Parts. A Build with no Problem lists none and counts its passes.
  - The page shows each Part's Lowest Price and Vendor and the total, and each Vendor's total with the Parts it lacks, in the order the API answers (success criterion 6). It is compared with the API's answer, never with a quoted translation.
  - A total that holds a Converted Price shows "≈", and switching the currency changes every price.
  - Changing a kit's quantity changes the totals.
  - Deactivating the only Vendor of a Build's Part shows it as unstocked and leaves it out of the totals.
  - Kurdish is right to left and every price is in Western digits. `expectAccessible` passes in the light and the dark scheme.
- [ ] Each of these faults is planted once and then reverted, and each fails its own check: one rule's Warning left unworded, which fails `pnpm check`; the Vendors drawn in another order than the API's; a Converted Price's "≈" left off the total.
- [ ] The page's checks on a phone are recorded under Comments as waiting for hosting: the outcomes and both price views read on a phone in Kurdish and in English, and the motion felt with reduced motion on and off.
- [ ] `pnpm check` and `pnpm platform:check` pass.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
