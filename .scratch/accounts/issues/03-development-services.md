# 03: The API manages Logins in the development services

**Spec:** [the accounts spec](../spec.md)

**What to build:** The owner's development services gain what tickets 01 and 02 need, and the API, run with `nx serve`, makes Vendors' Logins in the owner's own Keycloak. The realm also gains its password policy and its brute-force detection here, so that every change to the realm file reaches the owner's services in one reset.

`pnpm services:up` writes the API's client secret into `.env`, and the Compose file gives it to Keycloak. `pnpm services:check` says whether the API's client can manage Logins, and `pnpm platform:check` asks for the secret. The end-to-end tests gain a made-up Vendor, created over HTTP as the development Admin. That Vendor logs in at Keycloak's login screen and is shown the screen that asks for a new password, which proves the whole path on the running platform.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Before anything is written, these are read for the installed releases, and the findings are recorded under Comments:
  - Keycloak 26.8's realm settings for a password policy and for brute-force detection, and what a locked Login sees;
  - how the Compose file gives Keycloak's container a setting from `.env`.
- [ ] The realm file gains a password policy, at least 8 characters and not the Login's name, and turns on brute-force detection. After a few wrong passwords in a row a Login is locked for a time that grows with each further failure, up to 15 minutes. The numbers chosen are recorded under Comments.
- [ ] `.env.example` lists the API's client secret without its value. `pnpm services:up` writes a random value for it at the first start, and adds it to an existing `.env` that lacks it, as it does for each password. The Compose file gives it to Keycloak.
- [ ] The API's `serve` target gets it from `.env` through its committed env file, as it gets the database password, and so does each other target ticket 01 found to need it. No copy of it is written anywhere else.
- [ ] `pnpm services:check` gains a line saying that the API's client logs in to Keycloak and finds the realm's Logins. Where it checks the realm's clients, it counts the API's client.
- [ ] `pnpm platform:check` says so plainly, and names `pnpm services:up`, when `.env` lacks the secret.
- [ ] Before the reset, the owner is told that it deletes the platform's database, which holds the imported catalog and test data, and Keycloak's data, and the owner agrees. Then `pnpm services:reset`, `pnpm services:up` and `pnpm catalog:import` are run, and `pnpm services:check` passes. Each step's outcome is recorded under Comments.
- [ ] The end-to-end tests gain `createAMadeUpVendor`, which creates a Vendor over HTTP as the development Admin. It is named "Made-up test Vendor" with a number unique to the run, has a login phone number unique to the run and every required detail, and gives the test its login phone number and temporary password, which are never printed. Nothing is ever sent to that number.
- [ ] `pnpm platform:check` gains this line, and passes on every line: a made-up Vendor logs in at Keycloak's login screen with its login phone number in the stored form and its temporary password, and Keycloak shows the screen that asks for a new password, told apart by its address and its form.
- [ ] Shown once and then reverted, each failing on its own line: the client's secret changed in `.env`, which `pnpm services:check` reports; the required password update left off a new Login, which the new line of `pnpm platform:check` reports. Neither needs a second reset.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
