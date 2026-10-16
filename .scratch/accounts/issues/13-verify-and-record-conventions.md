# 13: Verify from a fresh clone and record the conventions in the MVP spec

**Spec:** [the accounts spec](../spec.md)

**What to build:** The module is proven sound as a whole, the way the next person to pick it up will meet it. That is a fresh clone in a new directory, with no `.env` and no Docker volumes, followed by the install, the checks, the services and `pnpm platform:check`, with none of the three apps started by hand. Results left over from earlier runs can hide a fault, so this run is the one that counts.

The conventions this module set are written into [the MVP spec](../../mvp/spec.md), so that `offers` and every later module start from them. This ticket closes `accounts`.

The services of the owner's own checkout are stopped before the fresh clone's services are started, because both would claim the same ports. They are started again afterwards.

**Blocked by:** 09, 10, 11, 12

**Status:** ready-for-agent

- [ ] In a fresh clone in a new directory, with no `.env` and no Docker volumes left from earlier runs, these all pass, with none of the three apps started by hand:
  - one install;
  - `pnpm check --skip-nx-cache`, with Docker stopped and before any browser is installed;
  - `pnpm boundaries:check`;
  - `pnpm integration:check`;
  - `pnpm services:up`, which writes the API's client secret, and then `pnpm services:check`;
  - the browser's one-time install, and then `pnpm platform:check`.
- [ ] Git reports a clean working tree after every command above. No password and no secret is committed.
- [ ] The owner is asked to check these once, in the owner's own browser. What they saw, or that it is still to be done, is recorded under Comments:
  - The hand-over's link opens WhatsApp's website with the message written, in each language, and the message reads well.
  - The Vendors screens, the details screen, its form and the band match DESIGN.md, and Impeccable's design hook raises nothing left unanswered.
  - Keycloak's screens a Vendor meets read correctly in Kurdish and in Arabic.
  - A Login with the `vendor` role and no Vendor, made in Keycloak's own console, sees the plain message in the Vendor portal. The Login is then deleted.
  - `pnpm check` still passes with Docker stopped and with no browser installed.
- [ ] These checks on a phone are recorded under Comments as open, waiting for hosting, with their boxes left open, and are added to the MVP spec's list under "Checks on a phone wait for hosting":
  - [ ] The hand-over's link opens the WhatsApp app on the Admin's phone, with the message written.
  - [ ] The location button fills the coordinates from the phone's position, in a shop in Erbil.
  - [ ] A phone number typed on a Kurdish and on an Arabic keyboard logs in.
  - [ ] The Vendors screens, Keycloak's screens and the details screen used with a thumb, in Kurdish and in English.
- [ ] The Technology section of the MVP spec gains the conventions this module set:
  - Vendors in the platform's database and Logins in Keycloak, changed only through the API in a safe order, and the known limit;
  - the rule for which Vendor a request acts for, and acting as a Vendor;
  - phone numbers: how they are read, stored, answered and shown;
  - temporary passwords and the hand-over;
  - the realm's changes: the API's client, the user profile, the password policy, brute-force detection, and the login screen's label, script and Kurdish text;
  - the Vendor portal's router, and how its pages are mounted under both routers;
  - the shared Keycloak of `pnpm integration:check`.
- [ ] Its commands table and its account of the development services say what `pnpm services:up`, `pnpm services:check`, `pnpm integration:check` and `pnpm platform:check` now do. The development Vendor is gone from them, and the sentence that `accounts` decides its fate is replaced by what was decided. Its settings table gains the API's settings for Keycloak's administration interface.
- [ ] It says to run `pnpm integration:check` after an upgrade of `@keycloak/keycloak-admin-client`, `libphonenumber-js` or Keycloak too, and `pnpm platform:check` after a change to the theme's script.
- [ ] The Order of work records that `accounts` is finished, with a link to this spec.
- [ ] Where PRODUCT.md describes Vendors' Logins or the Vendor portal, it is brought up to date.
- [ ] The spec's status is set to resolved, and every ticket of this module is resolved.
- [ ] The results are recorded under Comments.
