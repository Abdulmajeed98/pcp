# 11: The Vendor portal's frame and the Offers screen

**Spec:** [the redesign spec](../spec.md)

**What to build:** The Vendor portal takes the new look, with its first screen rebuilt from end to end: the frame's top bar with the Vendor's name, Log out and the language switch, the portal's sections, the band shown while the Admin acts as a Vendor, and the Offers screen with its expiry banner and confirm-all. It is laid out for a phone behind the counter first, in Kurdish, Arabic and English, in both directions.

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] The portal's frame, its sections, the language switch and the band of the Admin acting as a Vendor follow the new DESIGN.md.
- [ ] The Offers screen, an Offer's row, the expiry banner, confirm-all and its result, the search and the empty screen follow it, and move as its Motion section says, mirrored in right-to-left, with reduced motion respected.
- [ ] The Offers screen passes `inspect.mjs --app` at 1440, 768 and 360 pixels through ticket 01's command, acting as the fixture's Vendor, in Kurdish and in English, with every state of an Offer on it.
- [ ] Emil's `break-ui` and `mobile-native` are run on the Offers screen: long Part names, a price in the millions of dinars, a dozen expired Offers, none at all; and how it takes a thumb at 360 pixels. What broke is fixed.
- [ ] It passes `checkInEveryLanguageOfTheVendorPortal`; prices and Part names are still drawn left to right with no Arabic-Indic digit.
- [ ] `expectAccessible` passes on the screen with the banner, in the light and in the dark scheme. `pnpm check` and `pnpm platform:check` pass.
- [ ] Tests that had to change are listed under Comments with why; no test loses an assertion.
- [ ] The screen is shown to the owner in the built-in browser before the ticket closes, in Kurdish and in English, and the owner's remarks are recorded under Comments. DESIGN.md is corrected where building it taught something.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
