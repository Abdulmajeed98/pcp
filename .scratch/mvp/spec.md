# Spec: PC Part Picker MVP

Status: approved by the owner on 6 October 2026.

This spec records the outcome of a design interview held on 5 and 6 October 2026. It uses the vocabulary defined in [CONTEXT.md](../../CONTEXT.md); a capitalised term such as Offer or Build means exactly what that file says. Two decisions it relies on are recorded separately: [ADR-0001](../../docs/adr/0001-seed-catalog-from-buildcores-opendb.md) (catalog seeded from BuildCores OpenDB) and [ADR-0002](../../docs/adr/0002-platform-rate-set-by-hand.md) (Platform Rate set by hand).

"PC Part Picker" is a working title.

## Objective

People in Erbil who want to build a desktop PC cannot easily find out which parts local shops actually have, what each shop charges, or whether the parts they have picked will work together. This platform lets a Shopper assemble a Build from Parts that local Vendors stock, checks the Build for Compatibility Problems, and shows what each Vendor charges.

The MVP is comparison only. The platform shows prices and availability and helps the Shopper contact a Vendor; it takes no orders, handles no payment and arranges no delivery.

Three kinds of people use it:

- A **Shopper** plans a Build and compares Vendors. Shoppers have no account.
- A **Vendor** keeps its Offers current through a portal. Each Vendor has one login.
- The **Admin** is the platform's owner, who signs up Vendors in person, maintains the catalog and sets the Platform Rate. There is one Admin.

Listing is free for Vendors and ranking is neutral: nobody can pay for a better position.

The MVP is finished when every item under [Success criteria](#success-criteria) holds. There is no launch date and no minimum number of Vendors.

## Scope

### In the MVP

- Eight Categories: CPU, CPU cooler, motherboard, RAM, storage, GPU, case and PSU.
- Parts in new condition only.
- One city, Erbil. Each Vendor's city is recorded so that a second city later is only a filter.
- Three languages: Kurdish (Sorani), Arabic and English.
- Prices in both USD and IQD, switchable by the Shopper.
- Twenty-one Compatibility Rules.
- A responsive website designed for phones first.

### Not in the MVP

Each of these was considered and deliberately left for later:

- Orders, checkout, payment, delivery and reservations of stock.
- Shopper accounts.
- Used Parts, and any product outside the eight Categories (monitors, peripherals, laptops, prebuilt PCs, case fans).
- Stock quantities. An Offer is in stock or not.
- Integration with a Vendor's POS system or website, and reading a Vendor's own free-form spreadsheet.
- Vendor self sign-up, more than one login per Vendor, and more than one location per Vendor.
- Paid placement or any other paid Vendor feature.
- Messages sent by the platform itself (SMS, email or WhatsApp), including automated reminders.
- Showing price history, reviews, and ready-made Builds.
- Pulling updates from OpenDB after the first import.
- Compatibility Rules that OpenDB has no data for (see [Rules left for later](#rules-left-for-later)).
- A native mobile app.

## Capability map

The MVP is split into modules that can each be built and verified on their own. Pick them up in dependency order.

| Module id | Responsibility | Depends on |
|---|---|---|
| `languages` | Three languages, right-to-left layout, number formatting | none |
| `catalog` | Categories, Parts and their specs, the OpenDB import, photos | none |
| `accounts` | Admin and Vendor logins, Vendor profiles, acting as a Vendor | none |
| `offers` | Offers, Confirmation, expiry, price history, the Vendor portal's Offer screens | `catalog`, `accounts` |
| `pricing` | Platform Rate, Converted Prices, the currency switch | `offers` |
| `browse` | Category pages, search and filters, Part page, Vendor page | `catalog`, `offers`, `pricing` |
| `compatibility` | The Compatibility Rules | `catalog` |
| `builder` | Building a Build, the picker, the two price views | `browse`, `compatibility`, `pricing` |
| `sharing` | Shared Build links, the WhatsApp button, Referrals | `builder`, `accounts` |
| `part-requests` | Part Requests and the Admin's queue | `catalog`, `offers` |
| `sheet` | Downloading and uploading the Offer sheet | `offers`, `part-requests` |

Build order: `languages`, `catalog`, `accounts` → `offers` → `pricing` → `browse`, `compatibility` → `builder` → `sharing`, `part-requests` → `sheet`.

`languages` comes first because every later screen is built in all three languages and both directions from its first version; adding right-to-left layout afterwards is the expensive path.

## Requirements

### `languages`

- **LANG-1** The Shopper pages and the Vendor portal are available in Kurdish (Sorani), Arabic and English. The Admin console is in English only.
- **LANG-2** Kurdish and Arabic are laid out right to left; English left to right.
- **LANG-3** Part names, manufacturer names and specifications are shown in English in every language. Everything else in the interface, including Category names, is translated.
- **LANG-4** Text a Vendor writes (its name, address, opening hours) is shown as written, untranslated.
- **LANG-5** Prices and specifications use Western digits (0 to 9) in every language.
- **LANG-6** The Shopper can switch language at any time and the choice is remembered in the browser. The first visit follows the browser's language and falls back to Kurdish.
- **LANG-7** Kurdish and Arabic text is drafted during development and reviewed by the owner, or someone the owner trusts, before launch.
- **LANG-8** Every screen is usable on a phone 360 pixels wide, in both directions. Shopper pages and the Vendor portal are designed for the phone first and adapt upward to larger screens.

### `catalog`

- **CAT-1** There are exactly eight Categories: CPU, CPU cooler, motherboard, RAM, storage, GPU, case and PSU.
- **CAT-2** The catalog is created by one import of [BuildCores OpenDB](https://github.com/buildcores/buildcores-open-db), taking its `CPU`, `CPUCooler`, `Motherboard`, `RAM`, `Storage`, `GPU`, `PCCase` and `PSU` folders (about 26,000 Parts). Each imported Part keeps its OpenDB ID, so a later feature can add new Parts without overwriting the Admin's edits.
- **CAT-3** A Part has a Category, a name, a manufacturer, its manufacturer part numbers, the specifications for its Category, and optionally one photo.
- **CAT-4** Only the Admin creates or edits Parts. A wrong specification would break compatibility checking for every Vendor, so Vendors never change the catalog.
- **CAT-5** The Admin can search the whole catalog, create a Part, edit any specification, and add or replace a Part's photo.
- **CAT-6** A Part without a photo shows its Category's icon. OpenDB has no images, so the Admin adds a photo when a Part gets its first Offer.
- **CAT-7** A Part is shown to Shoppers only while it has at least one visible Offer. An Offer is visible when it is not an Expired Offer and its Vendor is active. The rest of the catalog exists only for Vendors and the Admin to search.
- **CAT-8** The Admin has a list of every Part that has an Offer and is missing a specification that a Compatibility Rule needs. The aim is to keep this list empty. A Part on the list is still shown to Shoppers.
- **CAT-9** Every Shopper page credits BuildCores OpenDB in its footer, as its licence requires.

### `accounts`

- **ACC-1** Shoppers have no account. Each Vendor has one login. There is one Admin.
- **ACC-2** The Admin creates a Vendor with its name, city, address, map location, phone number, WhatsApp number, Instagram name, opening hours and login phone number. Vendors cannot sign themselves up.
- **ACC-3** A Vendor logs in with its phone number and a password. The Admin sets a temporary password when creating the account, and the Vendor must replace it at first login.
- **ACC-4** After creating an account, the Admin taps a button that opens a WhatsApp chat with the Vendor, from the Admin's own WhatsApp, with the login details already written. The platform itself sends no SMS, email or WhatsApp message.
- **ACC-5** The Admin can reset a Vendor's password. This sets a new temporary password and offers the same WhatsApp hand-over.
- **ACC-6** The Admin can open any Vendor's portal and do everything that Vendor can do, so that a Vendor can be set up on the spot in its shop.
- **ACC-7** The Admin can deactivate a Vendor. Its page and all its Offers disappear from Shopper pages at once and it can no longer log in. Reactivating it reverses this.
- **ACC-8** A Vendor can edit its own address, map location, phone number, WhatsApp number, Instagram name and opening hours without approval. Only the Admin changes its name, city or login phone number.

### `offers`

- **OFF-1** A Vendor has at most one Offer for a Part.
- **OFF-2** An Offer holds a Quoted Price in USD, in IQD or in both (at least one), whether the Part is in stock, an optional warranty length in months, and the time of its last Confirmation.
- **OFF-3** In the portal a Vendor can search the whole catalog by name, manufacturer or part number and add an Offer for any Part.
- **OFF-4** A Vendor can change an Offer's prices, in-stock status and warranty, and can remove the Offer.
- **OFF-5** Creating an Offer, changing it, or uploading its row in the sheet counts as a Confirmation. The portal also has one button that confirms all of the Vendor's Offers at once.
- **OFF-6** An Offer whose last Confirmation is more than 14 days old is an Expired Offer. It is hidden from Shoppers everywhere and stays listed in the portal, marked as expired, until the Vendor confirms it again. The 14 days are the same for every Vendor.
- **OFF-7** Wherever a Shopper sees an Offer, it says how many days ago it was last confirmed.
- **OFF-8** The portal shows a banner when any of the Vendor's Offers will expire within 3 days.
- **OFF-9** The Admin has a list of Vendors with Offers expiring within 3 days, so the Admin can remind them personally.
- **OFF-10** Every change to an Offer's Quoted Prices or in-stock status is recorded with its time from the first day. Nothing in the MVP displays this history; it is kept because it cannot be reconstructed later.
- **OFF-11** Wherever Offers are listed for a Shopper, they are ordered by price, lowest first, with in-stock Offers before out-of-stock ones. No Offer is ever promoted, highlighted or reordered for payment.

### `pricing`

- **PRC-1** The Platform Rate is a single number of IQD per USD that the Admin types in. It is never fetched from an exchange-rate service (ADR-0002). Changing it takes effect on every Converted Price immediately.
- **PRC-2** The Shopper can switch every price on the site between USD and IQD. The choice is remembered in the browser and starts as IQD.
- **PRC-3** In the Shopper's chosen currency, an Offer shows its Quoted Price if the Vendor quoted that currency. Otherwise it shows a Converted Price: the other Quoted Price multiplied or divided by the Platform Rate, rounded to the nearest 250 IQD or the nearest whole dollar, and marked with "≈".
- **PRC-4** Sorting by price and choosing the cheapest Offer compare the prices as shown in the Shopper's chosen currency.
- **PRC-5** A total is the sum of the shown prices, each multiplied by its quantity. A total that includes any Converted Price is marked with "≈".

### `browse`

- **BRW-1** Each Category has a page listing its visible Parts with the lowest in-stock price for each, lowest price first. Parts whose Offers are all out of stock are listed last, marked out of stock.
- **BRW-2** A Category page can be searched by Part name, manufacturer and part number, and filtered by manufacturer, price range and the Category's key specifications:

  | Category | Filters |
  |---|---|
  | CPU | Socket, core count |
  | CPU cooler | Air or liquid, radiator size |
  | Motherboard | Socket, form factor, RAM type |
  | RAM | RAM type, total capacity, speed |
  | Storage | SSD or HDD, capacity, interface |
  | GPU | Chipset, memory |
  | Case | Form factor |
  | PSU | Wattage, efficiency rating |

- **BRW-3** A Part page shows the Part's name, photo or Category icon, specifications, and every visible Offer with the Vendor's name, price, in-stock status, warranty and days since Confirmation.
- **BRW-4** A Vendor page shows the Vendor's name, address, phone number, WhatsApp number, Instagram name, opening hours and all its visible Offers. Tapping the map pin opens the location in Google Maps; no map is embedded.
- **BRW-5** Shopper pages are rendered on the server so that search engines can index them and a link pasted into WhatsApp shows a preview with a title and description.

### `compatibility`

- **CMP-1** The platform checks the 21 Compatibility Rules listed under [Compatibility Rules](#compatibility-rules).
- **CMP-2** A rule applies only when the Build contains the Parts it involves.
- **CMP-3** Each applicable rule has one outcome: it passes, it is a Compatibility Problem, it is a Compatibility Warning, or it is unchecked because a specification it needs is missing. An unchecked rule is never presented as passed. Only rules 11 and 20 can produce a Compatibility Warning.
- **CMP-4** A Part is compatible with a Build when adding it would cause no Compatibility Problem. Neither a Compatibility Warning nor an unchecked rule makes a Part incompatible.
- **CMP-5** Estimated power draw is the CPU's TDP plus the GPU's TDP plus 100 W for everything else. A Build without a GPU counts 0 W for it.

### `builder`

- **BLD-1** A Build holds exactly one each of CPU, motherboard, case and PSU, at most one CPU cooler and at most one GPU, and any number of RAM kits and storage drives, each with a quantity.
- **BLD-2** For each Category the Shopper picks from a list of Parts that have at least one in-stock visible Offer, lowest price first, with the same search and filters as the Category page.
- **BLD-3** The picker hides Parts that are not compatible with the Build so far. A switch shows them all.
- **BLD-4** The Build page lists every Compatibility Problem, every Compatibility Warning and every unchecked rule in words that name the Parts involved. It never prevents the Shopper from keeping an incompatible Build.
- **BLD-5** The Build page says whether the Build is a Complete Build and, if not, which Categories are still needed. A Build can be saved and shared at any stage.
- **BLD-6** The Build is saved in the Shopper's browser and is still there when they return. A browser holds one Build at a time.
- **BLD-7** The first price view shows, for each Part, the cheapest in-stock Offer and the Vendor it comes from, and the total. This total may span several Vendors and is the headline figure.
- **BLD-8** The second price view lists each Vendor that has an in-stock Offer for at least one Part in the Build, with that Vendor's total for the Parts it has and the Parts it is missing. Vendors missing the fewest Parts come first, then the lowest total.
- **BLD-9** A Part in the Build that no longer has an in-stock visible Offer is shown as unavailable and left out of the totals.

### `sharing`

- **SHR-1** Sharing a Build creates a link to a frozen copy of its Parts and quantities, stored by the platform.
- **SHR-2** A shared Build page always shows current prices, both price views, and the current Compatibility Problems.
- **SHR-3** Anyone who opens a shared Build can copy it into their own builder and change it. The shared copy never changes.
- **SHR-4** If the Shopper changes their Build after sharing it, sharing again creates a new link.
- **SHR-5** In the second price view, each Vendor has a "send on WhatsApp" button. It opens a WhatsApp chat with that Vendor, with a message in the Shopper's language that contains the Build's link. If the Build has not been shared yet, the link is created at that moment.
- **SHR-6** Each tap on that button is recorded as a Referral, with the Vendor, the Build and the time.
- **SHR-7** The Admin sees every Vendor's Referral count. A Vendor sees only its own, in the portal. Nobody else sees any.

### `part-requests`

- **REQ-1** When a Vendor cannot find a Part in the catalog, it sends a Part Request with the Part's name, manufacturer part number, Category, its Quoted Price or prices, in-stock status and warranty.
- **REQ-2** The Admin has a queue of Part Requests. For each one the Admin creates the Part with its specifications, or matches the request to a Part that already exists, or rejects it with a reason.
- **REQ-3** When a request is fulfilled by a new or an existing Part, the Vendor's Offer for that Part goes live with the details from the request.
- **REQ-4** The Vendor sees the state of each of its requests in the portal.

### `sheet`

- **SHT-1** A Vendor can download its current Offers as an Excel file (.xlsx) with one row per Offer and these columns: manufacturer part number, Part name, price in USD, price in IQD, in stock, and warranty in months. The Part name is there for reading and is ignored on upload.
- **SHT-2** The Vendor uploads a file in the same layout. Each row is matched to a Part by its manufacturer part number.
- **SHT-3** A matched row updates the Vendor's Offer for that Part, or creates the Offer if there is none. Every matched row counts as a Confirmation.
- **SHT-4** Offers that do not appear in the uploaded file are left untouched.
- **SHT-5** After an upload the Vendor sees a result: how many rows were applied, which rows matched no Part, which matched more than one Part, and which were invalid (for example no price). Rows with a problem are skipped and the rest are still applied.
- **SHT-6** The Vendor can turn any row that matched no Part into a Part Request.
- **SHT-7** Only the platform's own layout is accepted.

### The Admin console at a glance

The Admin's screens are specified in the modules above. Together they are:

| Screen | What the Admin does there | Requirements |
|---|---|---|
| Vendors | Create, send login details, reset password, act as, deactivate | ACC-2 to ACC-7 |
| Catalog | Search, create and edit Parts, add photos | CAT-4 to CAT-6 |
| Missing specifications | Fill in gaps for Parts that have Offers | CAT-8 |
| Part Requests | Fulfil or reject requests | REQ-2 |
| Platform Rate | Set the rate | PRC-1 |
| Expiring Offers | See which Vendors to remind | OFF-9 |
| Referrals | See counts per Vendor | SHR-7 |

## Compatibility Rules

Field names are those of OpenDB. "Coverage" is the share of OpenDB Parts in which the rule's least-filled field is present, measured on 5 October 2026. Rules with low coverage start out unchecked for most Builds and become checkable as the Admin works through the missing-specifications list (CAT-8).

| # | A Compatibility Problem exists when | Fields compared | Coverage |
|---|---|---|---|
| 1 | The CPU's socket differs from the motherboard's | `CPU.socket`, `Motherboard.socket` | 100% |
| 2 | The cooler does not list the CPU's socket | `CPU.socket`, `CPUCooler.cpu_sockets` | 100% |
| 3 | The CPU does not support the RAM's type | `RAM.ram_type`, `CPU.specifications.memory.types` | 89% |
| 4 | The RAM's type differs from the motherboard's | `RAM.ram_type`, `Motherboard.memory.ram_type` | 100% |
| 5 | The Build has more RAM sticks than the motherboard has slots | `RAM.modules.quantity`, `Motherboard.memory.slots` | 100% |
| 6 | The Build's total RAM exceeds the motherboard's maximum | `RAM.modules.capacity_gb`, `Motherboard.memory.max` | 100% |
| 7 | The case does not accept the motherboard's form factor | `Motherboard.form_factor`, `PCCase.supported_motherboard_form_factors` | 100% |
| 8 | The Build has a GPU and the motherboard has no 16-lane PCIe slot | `Motherboard.pcie_slots` | 100% |
| 9 | The GPU is longer than the case allows | `GPU.length`, `PCCase.max_video_card_length` | 96% |
| 10 | The GPU occupies more slots than the case has | `GPU.total_slot_width`, `PCCase.expansion_slots` | 99% |
| 11 | The PSU cannot power the GPU (see below) | `GPU.power_connectors`, `PSU.connectors` | 100% |
| 12 | The PSU's wattage is below 1.3 times the estimated power draw | `CPU.specifications.tdp`, `GPU.tdp`, `PSU.wattage` | 100% |
| 13 | The Build has more SATA drives than the motherboard has SATA ports | `Storage.interface`, `Motherboard.storage_devices` | 100% |
| 14 | The Build has more M.2 drives than the motherboard has M.2 slots | `Storage.form_factor`, `Motherboard.m2_slots` | 80% |
| 15 | The Build has more 3.5-inch or 2.5-inch drives than the case has bays | `Storage.form_factor`, `PCCase.internal_3_5_bays`, `PCCase.internal_2_5_bays` | 99% |
| 16 | The Build has more SATA drives than the PSU has SATA power connectors | `Storage.interface`, `PSU.connectors.sata` | 100% |
| 17 | An air cooler is taller than the case allows | `CPUCooler.height`, `PCCase.max_cpu_cooler_height` | 36% |
| 18 | The case does not accept the PSU's form factor | `PSU.form_factor`, `PCCase.supported_power_supply_form_factors` | 19% |
| 19 | The PSU is longer than the case allows | `PSU.length`, `PCCase.max_psu_length` | 17% |
| 20 | The PSU has no CPU power connector (see below) | `Motherboard.power_connectors.cpu_power`, `PSU.connectors.eps_8_pin` | 16% |
| 21 | The motherboard has rear-facing connectors and the case does not support them | `Motherboard.back_connect_connectors`, `PCCase.supports_rear_connecting_motherboard` | 18% |

Rules 5, 6 and 13 to 16 count every kit and drive in the Build, multiplied by its quantity.

Rules 11 and 20 are the only rules that can produce a Compatibility Warning, because a strict reading would report Builds that in fact work:

- **Rule 11.** It is a Compatibility Problem when the PSU has fewer 6+2-pin connectors than the GPU has 6-pin and 8-pin sockets, or when the GPU has a 12V-2x6 or 12VHPWR socket and the PSU has neither that cable nor any 6+2-pin connector. It is a Compatibility Warning when the GPU has a 12V-2x6 or 12VHPWR socket and the PSU has no such cable but does have 6+2-pin connectors: the Build works only with the adapter that usually comes with the GPU.
- **Rule 20.** It is a Compatibility Problem when the PSU has no EPS connector at all. It is a Compatibility Warning when the PSU has at least one EPS connector but fewer than the motherboard has CPU power sockets: the extra socket is often optional.

With these rules every Category takes part in at least one rule, and every pair of Categories that physically connect is covered.

### Rules left for later

OpenDB has no field for these, so each would need a new specification typed in for every Part, or a third-party data source:

- A liquid cooler's radiator fits the case.
- The RAM's height clears a large air cooler.
- An older motherboard needs a BIOS update before it accepts a newer CPU.
- The cooler can handle the CPU's heat.

## Technology

The stack and each app's architecture are decided and recorded in [ADR-0003](../../docs/adr/0003-three-apps-one-api-keycloak.md) and [ADR-0004](../../docs/adr/0004-architecture-per-app.md). The research behind them is in [docs/research/app-architecture.md](../../docs/research/app-architecture.md).

**Decided**

- TypeScript throughout, on Node 24.
- Three applications:
  - the Shopper app, built with Next.js and rendered on the server;
  - the dashboard, one client-rendered React single-page application holding both the Vendor portal and the Admin console;
  - the API, built with NestJS. It is the only part that touches the database. Both frontends call it, and the Next.js app never reads the database itself.
- Keycloak as the identity service. Vendors log in through it; the Admin console creates Vendors and resets passwords through the API, which calls Keycloak. It ships English and Arabic login screens; the Kurdish (Sorani) text is added in a custom theme.
- PostgreSQL as the database, run in Docker during development, with Drizzle for database access and migrations.
- One repository, managed with Nx and pnpm. Applications live in `apps/` and shared libraries in `libs/`, named `@pcp/…` inside the workspace. Each app is one Nx project, and Nx's boundary rule governs what apps and libraries may import from each other.
- Five shared libraries:
  - `core`: the API's shared plumbing (errors, access control, database helpers, test helpers);
  - `compatibility`: the Compatibility Rules, run by both the API and the builder in the browser. It is plain TypeScript without Effect, and each rule returns one of its outcomes (CMP-3) as a plain value;
  - `api-client`: a typed client generated from the API's OpenAPI document;
  - `ui`: shared components and the Tailwind theme;
  - `i18n`: the text for all three languages.
- REST between the frontends and the API. The API describes itself with OpenAPI, and the frontends call it only through `api-client`.
- The API uses NestJS 11 and follows the conventions of the owner's workplace backend: two layers (`domain` and `infrastructure`), Command and Query classes for use cases, abstract Store classes as ports, and errors returned as Effect `Either` values instead of thrown. ADR-0004 lists the conventions in full.
- Both frontends follow Feature-Sliced Design, with its import rules enforced by Oxlint.
- Oxlint lints the whole repository and is the only linter. Oxfmt formats the whole repository; it is still before version 1.0, so its version is pinned exactly.
- Tailwind CSS with shadcn/ui for the interface.
- next-intl for the three languages in the Next.js app.
- The platform is packaged as Docker containers so that it runs the same on the development machine and on any host. The host is chosen when the MVP is nearly finished; the default is one rented server with 4 GB of memory running everything, with Cloudflare in front and nightly database backups.
- Git, with a commit after each piece of work, and a private GitHub repository later as an off-machine backup.

**Order of work**

The infrastructure is established first, with no product features:

1. The Nx and pnpm workspace, with the three apps and five shared libraries as empty shells.
2. Docker Compose running PostgreSQL and Keycloak for development. Keycloak's data lives in a second database on the same PostgreSQL server. Its setup (the Admin and Vendor roles, the dashboard's login client, the three languages) is kept as a file in the repository and loaded at startup.
3. The boundary and layer checks, wired in and failing on a violation.
4. Proof that the parts connect: the Admin logs in to the dashboard through Keycloak, the dashboard calls the API, the API verifies the login and answers who the caller is, and the Shopper app shows a page fetched from the API.

Automated checks on GitHub are added when the GitHub repository exists. Each app's libraries are chosen when work on that app begins, not before.

Step 1 was finished on 7 October 2026; its spec and tickets are in [.scratch/workspace](../workspace/spec.md). The commands and layout it produced are below. The commands for running PostgreSQL and Keycloak, the boundary and layer checks, and the code conventions are added here as steps 2 to 4 are finished.

**Commands**

All commands are run from the repository root, with Node 24 and pnpm. An install under another Node major version, or with npm or yarn, is refused.

| Command | What it does |
|---|---|
| `pnpm install` | Installs everything for all eight projects. |
| `pnpm check` | Runs the format check, lints the files that belong to no project, then runs lint, type-check, test and build for every project that has the target. It exits non-zero if any part fails. |
| `pnpm check --skip-nx-cache` | The same, with every task run again. Nx keeps its cache under the home directory, so a fresh clone on the same machine reuses old results unless the cache is skipped. |
| `pnpm format` | Rewrites source and configuration files into the agreed format. |
| `pnpm exec nx serve @pcp/shopper` | Starts the Shopper app on port 3000. |
| `pnpm exec nx serve @pcp/api` | Starts the API on port 3001. |
| `pnpm exec nx serve @pcp/dashboard` | Starts the dashboard on port 3002. |
| `pnpm exec nx <target> <project>` | Runs one target for one project, for example `pnpm exec nx test @pcp/core`. |

Every project has a `lint` and a `typecheck` target. Only the API and `core` have a `test` target, and only the three apps have a `build` target.

**Directory layout**

| Path | What lives there |
|---|---|
| `apps/api` | The API. Its domain and infrastructure layers are under `src/app`, and its tests are under `src/test`, mirroring `src/app`. |
| `apps/shopper` | The Shopper app. Next's `app` folder only routes; the Feature-Sliced Design layers are under `src`, with the App and Pages layers named `_app` and `_pages`. |
| `apps/dashboard` | The dashboard. Its Feature-Sliced Design layers are under `src`. |
| `libs/core`, `libs/compatibility`, `libs/api-client`, `libs/ui`, `libs/i18n` | The five shared libraries. Each is imported by its `@pcp/…` name through its single entry file, `src/index.ts`, and is consumed as TypeScript source with no build step. |
| `tools` | Scripts the workspace itself needs. |
| The repository root | The workspace's own configuration: the package manifest and lockfile, the pnpm workspace file, and the Nx, TypeScript, Oxlint, Oxfmt and Jest settings that every project extends. |

Inside the API the `~/` alias means `src/app`. Inside each frontend the `@/` alias means `src`.

## Testing strategy

Tests are written before the code for logic where a mistake would mislead a Shopper:

- Each Compatibility Rule, with one test for each outcome it can have: passing, a Compatibility Problem, being unchecked and, for rules 11 and 20, a Compatibility Warning.
- Price conversion, rounding, the "≈" mark, and totals (PRC-3 to PRC-5).
- Offer expiry at the 14-day boundary (OFF-6).
- Whether a Build is a Complete Build (BLD-5).
- Both price views, including ordering and missing Parts (BLD-7 to BLD-9).
- Matching sheet rows to Parts (SHT-2 to SHT-5).

End-to-end tests cover the main journeys: a Shopper builds and shares a Build; a Vendor adds, edits and confirms Offers; the Admin creates a Vendor and fulfils a Part Request.

The API's tests use Jest with SWC and live under `src/test/`, mirroring `src/app/`: `*.spec.ts` for unit tests with mocked Stores, and `*.integration-spec.ts` for tests against a real PostgreSQL started in a test container. The frontends' test tools are chosen when work on them begins.

## Boundaries

**Always**

- Use the terms in CONTEXT.md, exactly as written, in code, tests and interface text. If a needed concept has no term, add it to CONTEXT.md first.
- Build every Shopper and Vendor screen in all three languages and both directions from its first version.
- Design for a phone-width screen first.
- Record every price and in-stock change (OFF-10).
- Check a library's current documentation before using it.

**Ask the owner first**

- Adding, removing or changing a Compatibility Rule, the power formula, the 14-day expiry or the rounding of Converted Prices.
- Building anything listed under [Not in the MVP](#not-in-the-mvp).
- Adding any service that costs money or sends messages.
- Changing how Parts or Offers are stored once real Vendor data exists.

**Never**

- Promote, highlight or reorder an Offer for payment.
- Fetch the Platform Rate from an exchange-rate service.
- Let a Vendor create or edit a Part.
- Show a Converted Price without the "≈" mark.
- Show Shoppers an Expired Offer or an Offer from a deactivated Vendor.
- Present an unchecked Compatibility Rule as passed.
- Show a Vendor's Referral count to another Vendor or to Shoppers.
- Commit passwords, keys or other secrets.

## Success criteria

The MVP is finished when all of these hold:

1. On a fresh installation, one command imports the catalog: about 26,000 Parts across the eight Categories, none of them visible to Shoppers.
2. The Admin creates a Vendor and sends its login details through WhatsApp; the Vendor logs in with the temporary password and is made to replace it.
3. A Vendor adds an Offer quoted only in USD. A Shopper sees the Part with that USD price, and in IQD sees a price marked "≈", converted at the Platform Rate and rounded to the nearest 250 IQD.
4. An Offer left unconfirmed for more than 14 days disappears from every Shopper page and returns when the Vendor confirms it.
5. A Shopper on a phone assembles a Complete Build in each of the three languages. Incompatible Parts are hidden from the picker; with the switch on, picking one makes the Build page list the Compatibility Problem.
6. The Build page shows the cheapest total across Vendors and each Vendor's own total with its missing Parts.
7. A shared Build link opens the same Parts with current prices. Copying it and changing the copy leaves the shared Build unchanged.
8. Tapping "send on WhatsApp" opens a chat with the Vendor containing the Build's link, and that Vendor's Referral count rises by one, visible to the Admin and to that Vendor only.
9. A Vendor downloads its sheet, changes some prices, adds one row with a known part number and one with an unknown one, and uploads it. The prices change, one Offer is created, and the unknown row is reported and can be turned into a Part Request.
10. The Admin fulfils that Part Request and the Vendor's Offer goes live.
11. Every Compatibility Rule has passing tests for each outcome it can have.
12. A link to a Part page or a shared Build, pasted into WhatsApp, shows a preview.
13. Every Shopper page and Vendor portal screen is usable at 360 pixels wide in English and in Arabic.

## Open questions

1. **The platform's name.** To be chosen before the public launch. It should not be "PC Part Picker", which is an existing company's brand.
