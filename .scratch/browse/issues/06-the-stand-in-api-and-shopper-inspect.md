# 06: The stand-in API and `pnpm shopper:inspect`

**Spec:** [the browse spec](../spec.md)

**What to build:** The Shopper app's design is judged, and its pages inspected, on realistic, obviously fictional data that never touches the development database, as the owner decided on 3 November 2026.

The Shopper app calls the API on the server, so it cannot be fed in the browser as the dashboard's inspector feeds the dashboard. `pnpm shopper:inspect` starts a stand-in API that answers the public endpoints from a made-up shop of several Vendors. It then starts a Shopper app of its own pointed at the stand-in, runs Taste's inspector on the page it is given, and stops both. Ticket 07 renders the design's options from the same made-up shop.

**Blocked by:** 02, 03, 04

**Status:** ready-for-agent

- [ ] **The made-up shop grows** from one Vendor to several. Their names are obviously fictional, in Kurdish, Arabic and Latin script.
  - Most Vendors have every contact detail. One has only its phone number. One has no Visible Offers.
  - Their Offers cover all eight Categories: quoted in USD, in IQD and in both; in stock and out of stock; confirmed today, yesterday and 13 days ago; with a warranty and without; and with Shown Prices both quoted and converted, at a Platform Rate of 1,575.
  - Its Parts are real Parts of the catalog, read by Category and exact name, as the dashboard's made-up shop already reads them (ADR-0001: no Part is invented).
  - It holds the worst cases `break-ui` needs: the longest Part name the catalog holds among Parts with a photo and without, a Category offered by one Part, a Category with 400 Visible Parts, a Part with 20 Visible Offers, and a Vendor name in Arabic script beside one in Latin.
- [ ] **The stand-in API** answers the endpoints the Shopper app calls, and nothing else, from the made-up shop. Those endpoints are a Category's Visible Parts and its filters, a Visible Part and its Visible Offers, a visible Vendor and its Offers, and a Part's photo. It refuses every other request and every write, and logs what it refused. It holds every price fixed, in both currencies, and converts nothing. It answers a Category's list for the queries the inspection uses, picking and paging its fixed Parts plainly. It is a stand-in for looking at pages, never a second statement of the API's rules, and no test relies on it.
- [ ] **Typed by the API's description.** Its answers are typed with `api-client`'s own types, so a change to the description they do not follow fails `pnpm check`'s type check.
- [ ] **The command.** `pnpm shopper:inspect <path>` does all of the following:
  - It starts the stand-in, and a Shopper app on a port of its own with `API_URL` set to the stand-in. It leaves the owner's own Shopper app, on port 3000, alone.
  - It runs Taste's `inspect.mjs` unchanged against the path, passing Taste's options through, with `--language`, `--scheme`, `--widths` and `--out` as `pnpm dashboard:inspect` takes them.
  - It stops both, even when the inspection fails.
  - It says plainly when a port it needs is taken, and stops only what it started.
- [ ] **What it needs.** The services, the API and the imported catalog, for the one reading of the Parts at its start, as `pnpm dashboard:inspect` needs them. It says so plainly when any of them is missing.
- [ ] **Proved by running it.** Each of the stand-in's endpoints is asked once, by hand, and answers as the API's description says. `pnpm shopper:inspect` is run on the Shopper app's current page in both schemes, in Kurdish and in English, at 1440, 768 and 360 pixels. What it reported is recorded under Comments.
- [ ] **The guide.** [docs/agents/design-skills.md](../../../docs/agents/design-skills.md) gains a part on the inspector on the Shopper app, beside the dashboard's.
- [ ] Shown once and then reverted: a field of the made-up shop's answer misspelt, failing `pnpm check`.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
