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
- **LANG-5** Prices and specifications use Western digits (0 to 9) in every language. The platform reads this widely: every number it shows is in Western digits.
- **LANG-6** The Shopper can switch language at any time and the choice is remembered in the browser. The first visit follows the browser's language and falls back to Kurdish. The Vendor portal follows the same rule, and remembers only a use of its switch.
- **LANG-7** Kurdish and Arabic text is drafted during development and reviewed by the owner, or someone the owner trusts, before launch.
- **LANG-8** Every screen is usable on a phone 360 pixels wide, in both directions. Shopper pages and the Vendor portal are designed for the phone first and adapt upward to larger screens.

### `catalog`

- **CAT-1** There are exactly eight Categories: CPU, CPU cooler, motherboard, RAM, storage, GPU, case and PSU.
- **CAT-2** The catalog is created by one import of [BuildCores OpenDB](https://github.com/buildcores/buildcores-open-db) at commit `ef7e601b78875a931a4ad9fa1ccce7000f3e5ecf`, of 5 October 2026, the last released under ODC-By 1.0 ([ADR-0001](../../docs/adr/0001-seed-catalog-from-buildcores-opendb.md)), taking its `CPU`, `CPUCooler`, `Motherboard`, `RAM`, `Storage`, `GPU`, `PCCase` and `PSU` folders (26,240 records at that commit). Each imported Part keeps its OpenDB ID, so a later feature can add new Parts without overwriting the Admin's edits.
- **CAT-3** A Part has a Category, a name, a manufacturer, its manufacturer part numbers, the specifications for its Category, and optionally one photo.
- **CAT-4** Only the Admin creates or edits Parts. A wrong specification would break compatibility checking for every Vendor, so Vendors never change the catalog.
- **CAT-5** The Admin can search the whole catalog, create a Part, edit any specification, and add or replace a Part's photo.
- **CAT-6** A Part without a photo shows its Category's icon. OpenDB has no images, so the Admin adds a photo when a Part gets its first Offer.
- **CAT-7** A Part is shown to Shoppers only while it has at least one visible Offer. An Offer is visible when it is not an Expired Offer and its Vendor is active. The rest of the catalog exists only for Vendors and the Admin to search.
- **CAT-8** The Admin has a list of every Part that has an Offer and is missing a specification that a Compatibility Rule needs. The aim is to keep this list empty. A Part on the list is still shown to Shoppers. The list arrives with `offers`, because before Offers it would hold most of the catalog. `catalog` marks which specifications are needed, and shows the missing ones on a Part's page and in its form.
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

Rules 11, 15 and 20 are the only rules that can produce a Compatibility Warning, because a strict reading would report Builds that in fact work:

- **Rule 11.** It is a Compatibility Problem when the PSU has fewer 6+2-pin connectors than the GPU has 6-pin and 8-pin sockets, or when the GPU has a 12V-2x6 or 12VHPWR socket and the PSU has neither that cable nor any 6+2-pin connector. It is a Compatibility Warning when the GPU has a 12V-2x6 or 12VHPWR socket and the PSU has no such cable but does have 6+2-pin connectors: the Build works only with the adapter that usually comes with the GPU.
- **Rule 15.** A 2.5-inch drive may take a free 3.5-inch bay when no 2.5-inch bay is left, because 466 of the 498 cases that give 0 internal 2.5-inch bays have 3.5-inch bays, which usually take one. It is a Compatibility Problem when the drives outnumber the bays that way. It is a Compatibility Warning when the case gives no internal bays at all and the Build has a 2.5-inch drive: test benches and small cases such as the FormD T1 mount an SSD somewhere OpenDB does not count as a bay.
- **Rule 20.** It is a Compatibility Problem when the PSU has no EPS connector at all. It is a Compatibility Warning when the PSU has at least one EPS connector but fewer than the motherboard has CPU power sockets: the extra socket is often optional.

Two rules read some of OpenDB's values in a way of their own, as the owner decided on 15 October 2026:

- **Rule 1.** A motherboard socket written "2 x <socket>", on 20 dual-socket server boards, takes a CPU of that socket. A socket written "Integrated …", on 13 boards with a CPU built in, means the board brings its own CPU, and any CPU added to it is a Compatibility Problem.
- **Rule 7.** A Thin Mini-ITX board fits any case that takes Mini-ITX, and a Flex ATX board any case that takes Micro ATX, because they share the mounting. No case at the pinned commit lists Thin Mini-ITX, and one lists Flex ATX.

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
- One repository, managed with Nx and pnpm. Applications live in `apps/` and shared libraries in `libs/`, named `@pcp/…` inside the workspace. Each app is one Nx project, and Nx's boundary rule governs what apps and libraries may import from each other. A tenth project, `@pcp/e2e`, holds the end-to-end tests.
- Six shared libraries:
  - `core`: the API's shared plumbing (errors, access control, database helpers, test helpers);
  - `compatibility`: the Compatibility Rules, run by both the API and the builder in the browser. It is plain TypeScript without Effect, and each rule returns one of its outcomes (CMP-3) as a plain value;
  - `api-client`: a typed client generated from the API's OpenAPI document;
  - `ui`: the components both frontends share, which carry no look, such as `AlwaysEnglish` and `CategoryIcon`, and each frontend's theme;
  - `i18n`: the text for all three languages;
  - `opendb`: what the platform takes from BuildCores OpenDB, written once: the pinned commit, OpenDB's address, its name and its licence's. The API's import and the Shopper app's credit import it. It is plain TypeScript and imports nothing, like `compatibility`.
- REST between the frontends and the API. The API describes itself with OpenAPI, through `@nestjs/swagger`, and the frontends call it only through `api-client`, which `@hey-api/openapi-ts` generates from that description. The generator is still before version 1.0, so its version is pinned exactly.
- The API uses NestJS 11 and follows the conventions of the owner's workplace backend: two layers (`domain` and `infrastructure`), Command and Query classes for use cases, abstract Store classes as ports, and errors returned as Effect `Either` values instead of thrown. ADR-0004 lists the conventions in full.
- Both frontends follow Feature-Sliced Design, with its import rules enforced by Oxlint.
- The API verifies every login itself, with `jose`: a token's signature against the keys the realm publishes, its expiry, its issuer and its audience. It keeps the caller of each request with `nestjs-cls`, and reads its settings through `@nestjs/config`, checked with `class-validator`.
- The dashboard logs in with `keycloak-js`, Keycloak's own adapter, and keeps tokens in memory only. The Shopper app has no login.
- End-to-end tests are written with Playwright and run in Chromium.
- Oxlint lints the whole repository and is the only linter. Oxfmt formats the whole repository's code and configuration, except the two files of import bans that a script writes, the generated client, the migrations drizzle-kit writes and the import's made-up folder shaped like OpenDB, which holds a file that is not JSON on purpose. It leaves the written records alone: `docs/`, `.scratch/`, CLAUDE.md, CONTEXT.md, PRODUCT.md, every DESIGN.md and every `.impeccable` folder, which Impeccable reads in their exact format. It is still before version 1.0, so its version is pinned exactly. Oxlint's version is pinned exactly as well, because the rule between projects runs on a part of Oxlint that may change in any release.
- Tailwind CSS with shadcn/ui for the interface, each app with its own components on Base UI ([ADR-0007](../../docs/adr/0007-a-look-and-components-for-each-app.md)).
- The dashboard's libraries, chosen by the owner on 14 October 2026 as the most widely used for each job: React Router, TanStack Query, React Hook Form and lucide's icons. **The catalog's conventions** below say how each is used.
- next-intl for the three languages in the Next.js app, and react-i18next, with i18next, for the three languages of the Vendor portal. The two read two message formats, ICU and i18next's own ([ADR-0008](../../docs/adr/0008-language-in-the-address-and-two-message-formats.md)). Both frontends match a browser's languages with `@formatjs/intl-localematcher`.
- Tailwind CSS 4, from the themes in `ui`, with `oxlint-tailwindcss` refusing a class that names a physical side. The plugin is pinned exactly: it is young and releases often, and it runs on the part of Oxlint that Oxlint keeps outside its version policy.
- The platform is packaged as Docker containers so that it runs the same on the development machine and on any host. The host is chosen when the MVP is nearly finished; the default is one rented server with 4 GB of memory running everything, with Cloudflare in front and nightly database backups.
- Git, with a commit after each piece of work, and a private GitHub repository later as an off-machine backup.

**Order of work**

The infrastructure is established first, with no product features:

1. The Nx and pnpm workspace, with the three apps and five shared libraries as empty shells.
2. Docker Compose running PostgreSQL and Keycloak for development. Keycloak's data lives in a second database on the same PostgreSQL server. Its setup (the Admin and Vendor roles, the dashboard's login client, the three languages) is kept as a file in the repository and loaded at startup.
3. The boundary and layer checks, wired in and failing on a violation.
4. Proof that the parts connect: the Admin logs in to the dashboard through Keycloak, the dashboard calls the API, the API verifies the login and answers who the caller is, and the Shopper app shows a page fetched from the API.

Automated checks on GitHub are added when the GitHub repository exists. Each app's libraries are chosen when work on that app begins, not before.

Step 1 was finished on 7 October 2026; its spec and tickets are in [.scratch/workspace](../workspace/spec.md). Step 2 was finished on 9 October 2026; its spec and tickets are in [.scratch/dev-services](../dev-services/spec.md). Step 3 was finished on 9 October 2026; its spec and tickets are in [.scratch/boundary-checks](../boundary-checks/spec.md). Step 4 was finished on 9 October 2026; its spec and tickets are in [.scratch/connection-proof](../connection-proof/spec.md). The infrastructure is complete. The commands, services, settings, layout, import rules and code conventions the four steps produced are below.

`languages`, the first module, was finished on 16 October 2026; its spec and tickets are in [.scratch/languages](../languages/spec.md). The review of the Kurdish and the Arabic text, LANG-7, stays open until launch. The conventions it set are below, under **The three languages**, and in the commands, the layout and the import rules.

`catalog`, the second module, was finished on 16 October 2026; its spec and tickets are in [.scratch/catalog](../catalog/spec.md). The checks on a phone that its tickets list wait for hosting, as every module's do (see **Checks on a phone wait for hosting**, under Testing strategy); until then their boxes stay open. The conventions it set are below, under **The catalog's conventions**, and in the commands, the settings, the layout and the import rules.

**Commands**

All commands are run from the repository root, with Node 24 and pnpm. An install under another Node major version, or with npm or yarn, is refused. The four `services` commands, `pnpm integration:check` and `pnpm platform:check` need Docker to be running, and `pnpm db:migrate` and `pnpm catalog:import` need the services; no other command does.

| Command | What it does |
|---|---|
| `pnpm install` | Installs everything for all ten projects. It does not download the browser that `pnpm platform:check` drives. |
| `pnpm check` | Runs the format check, compares the frontends' written import bans with their statement, compares the language files, generates the frontends' client again and compares it with the committed one, checks that every change to the API's schema has its committed migration, lints the files that belong to no project, then runs lint, type-check, test and build for every project that has the target. It exits non-zero if any part fails. |
| `pnpm check --skip-nx-cache` | The same, with every task run again. Nx keeps its cache under the home directory, so a fresh clone on the same machine reuses old results unless the cache is skipped. |
| `pnpm format` | Rewrites source and configuration files into the agreed format. |
| `pnpm exec nx serve @pcp/shopper` | Starts the Shopper app on port 3000. |
| `pnpm exec nx serve @pcp/api` | Starts the API on port 3001. |
| `pnpm exec nx serve @pcp/dashboard` | Starts the dashboard on port 3002. |
| `pnpm exec nx <target> <project>` | Runs one target for one project, for example `pnpm exec nx test @pcp/core`. |
| `pnpm services:up` | Starts PostgreSQL and Keycloak in Docker, in the background, and returns when both are healthy, the platform's database has every committed migration, applied with `pnpm db:migrate`, and the development Admin and the development Vendor logins exist. The first start creates `.env` with random local passwords. A value that is in `.env` is never changed, and a setting that is new is added to it. |
| `pnpm services:down` | Stops both services and keeps their data. |
| `pnpm services:reset` | Stops both services and deletes their data. The next start is a first start. |
| `pnpm services:check` | Checks the running services from the outside and prints one line for each thing it checked, the platform's database having every committed migration among them. It exits non-zero if any line fails, and says so plainly when the services are not running. |
| `pnpm boundaries:check` | Proves the import rules. For each case it plants a temporary file holding one import where a rule applies, lints through Nx with the cache skipped, and prints one line for the case. It exits non-zero if any line fails, and it removes what it planted. |
| `pnpm boundaries:write` | Writes the frontends' import bans, as they are stated in `tools`, into the file each frontend's lint configuration extends. |
| `pnpm api-client:write` | Writes the API's description of itself into `apps/api/openapi.json`, and then generates the frontends' client from it into `libs/api-client/src/generated`. |
| `pnpm db:generate <name>` | Generates the API's next migration from its schema, into `apps/api/src/drizzle`, named `NNNN_<name>.sql`. It refuses to make a name up. With `--custom` it writes an empty one, which drizzle-kit records, for SQL it cannot write from the schema. It needs no database. |
| `pnpm db:migrate` | Applies the API's committed migrations to the development database, under an advisory lock, and says how many it applied. |
| `pnpm catalog:import` | Imports the eight Categories from BuildCores OpenDB at the pinned commit into the development database, fetched from GitHub, or from a folder given after it. It prints a line for each Category, the totals and the commit it imported. A second run imports none. |
| `pnpm integration:check` | Runs each project's tests against a real PostgreSQL that the tests start in a container. It needs Docker, but not the services, and says so plainly when Docker is not running. |
| `pnpm platform:check` | Proves that the parts connect, in a real browser. It makes sure that the development services are running, that the platform's database has every migration and that the browser is installed, and says so plainly when any is not. It then starts each of the three apps that is not running, runs the end-to-end tests in Chromium, prints one line for each, and stops the apps it started. It exits non-zero if any line fails, and it is never answered from Nx's cache. |
| `pnpm exec playwright install chromium` | Downloads the browser that `pnpm platform:check` drives. It is run once on each machine. |

Every project has a `lint` and a `typecheck` target. Only the API and `core` have a `test` target, and only the three apps have a `build` target. `@pcp/e2e` has an `e2e` target, which `pnpm platform:check` runs and `pnpm check` does not. The API has an `integration` target, which `pnpm integration:check` runs for every project that has one, and `migrate` and `catalog-import`, which `pnpm db:migrate` and `pnpm catalog:import` run.

`pnpm check` does not start or need the services, and it needs no browser.

The step that compares the language files reads the three sets in `libs/i18n/src/messages`. For each, it fails when a message of the English file is missing from another language, or another language holds one the English file does not; when a message cannot be read in its set's format, the Shopper app's with the release of `intl-messageformat` that next-intl uses; when a message names other placeholders than the English one; when a sentence that counts lacks a plural form its language has or, in the dashboard's set, has one it does not, or a form that stands for many counts leaves out a value the sentence shows; when a message lets its library format a number, or holds an Arabic-Indic digit; when a shared term holds anything in braces or angle brackets, or counts; and when a name at the top of the shared terms is at the top of a frontend's set. Each failure names the file, the message and what is wrong.

`pnpm check` does not run `pnpm boundaries:check`. Run it after a change to the lint configuration, to a project's tags or to the name of a layer folder, after an upgrade of Oxlint or Nx, and when a project is added. Run it on its own: `pnpm check` and a development server would both see the planted files while it runs.

Run `pnpm integration:check` after a change to a schema, a migration, a Store, a Command or a Query, and after an upgrade of Drizzle, `pg`, Effect or Testcontainers. `pnpm check` does not run it.

Run `pnpm db:generate <name>` after any change to a schema, and commit the migration with it. `pnpm check` fails until it has been run.

Run `pnpm api-client:write` after any change to an endpoint or to a Response class. `pnpm check` fails until it has been run: one of the API's tests compares the committed description with what the API describes, and a step of `pnpm check` generates the client again and compares it with the committed one. Neither file is edited by hand.

`pnpm check` does not run `pnpm platform:check`. Run it after a change to the realm file, to the guard or an access rule, to the dashboard's login code, to either frontend's call to the API or to an app's settings, after a change to either frontend's language set-up or to a frame, after a change to a screen, to a component, to `ui` or to a theme, and after an upgrade of Keycloak, `keycloak-js`, `jose`, Next, next-intl, i18next, react-i18next, Tailwind CSS, Playwright, React Router, TanStack Query, React Hook Form, Base UI or axe-core. An app that is already running is used and left running. A failed run leaves a report and a trace under `apps/e2e/test-output`, which Git ignores. A trace holds what was typed into the login screen.

**Development services**

Both services listen on the owner's machine only, and are for development only.

| Service | Address | What it holds |
|---|---|---|
| PostgreSQL 18.6 | `localhost:5432` | The `pcp` database, which is the platform's and is owned by the user `pcp`, and the `keycloak` database, owned by the user `keycloak`. Neither user can connect to the other's database. The platform's tables are made by the API's migrations, whose record is the table `drizzle.__drizzle_migrations`. |
| Keycloak 26.8.0 | `http://localhost:8080` | The `pcp` realm, whose issuer is `http://localhost:8080/realms/pcp`. It has the roles `admin` and `vendor`. The realm file holds no logins, and `pnpm services:up` creates two, the development Admin and the development Vendor. The platform's one client in it is `dashboard`, whose access tokens name `pcp-api` as an audience; Keycloak adds six clients of its own to every realm. Its login screen is in Kurdish (Sorani), Arabic and English. |

- **Passwords.** No password is committed. They are in `.env`, which Git ignores; `.env.example` lists the settings without their values. Keycloak's own console is at `http://localhost:8080/admin` and is opened with Keycloak's own administrator account, whose name and password are in `.env`. That account is not the platform's Admin.
- **The development logins.** `pnpm services:up` creates two logins in the realm, each when the realm has none of that name: `development-admin`, with the `admin` role, and `development-vendor`, with the `vendor` role and no Vendor behind it. Each holds its one platform role and no other. Their names and their generated passwords are kept in `.env`, as `DEVELOPMENT_ADMIN_NAME` and `DEVELOPMENT_ADMIN_PASSWORD`, and `DEVELOPMENT_VENDOR_NAME` and `DEVELOPMENT_VENDOR_PASSWORD`, which `.env.example` lists without their values. `pnpm platform:check` says so, and names `pnpm services:up`, when `.env` lacks them. They are the logins to open the Admin console and the Vendor portal with during development, and the ones `pnpm platform:check` logs in with. They exist in development only, and `accounts` decides what becomes of the development Vendor. Keycloak's default profile asks a login for a first name, a last name and an email address, and sends a login without them to a screen that asks for them, so each login is created with all three.
- **The reset rule.** PostgreSQL runs its set-up script only when its data is empty, and Keycloak imports the realm only when the realm does not exist yet. A change to the database set-up script or to the realm file, which holds the realm's languages, therefore takes effect only after `pnpm services:reset` and a new start. The theme is different: in development mode Keycloak reads it afresh for every page, so a change to its text or to its language list shows on the next page load.
- **The data and the passwords belong together.** The data is created with the passwords that are in `.env` at the first start. If `.env` is deleted while the data is kept, the next start writes new passwords that the data does not know; `pnpm services:reset` and a new start put that right. Stopping and resetting work without `.env`.
- **Renaming the realm.** Keycloak refuses to start when the realm file's name and the realm's name differ, so the two are changed together.

**The apps' settings**

Each app reads its settings from its environment. Every one has the development value as its default, so all three apps start with no environment file, apart from the API's database password, `DATASOURCE_PASSWORD`, which is the first setting of any app that is a secret. It has no default, and the API refuses to start without it and names it.

In development its value is the one `.env` holds for the `pcp` user, `PCP_DB_PASSWORD`. When Nx runs the API's `serve`, `migrate` or `catalog-import` target, it reads a file of the target's own, `apps/api/.serve.env`, `apps/api/.migrate.env` or `apps/api/.catalog-import.env`, which is committed and holds two lines, `DATASOURCE_PASSWORD=${PCP_DB_PASSWORD}` and `KEYCLOAK_CLIENT_SECRET=${PCP_API_CLIENT_SECRET}`, and Nx expands them from `.env` at the repository root. A value set in the shell wins, which is how a server will give its own. No copy of the password is written anywhere else. Each later target that reaches the database gets a file of its own the same way. No other app reads `.env`.

| App | Setting | Default | What it is |
|---|---|---|---|
| The API | `PORT` | `3001` | The port it listens on. |
| The API | `CORS_ALLOWED_ORIGINS` | `http://localhost:3002` | The origins it accepts browser calls from, separated by commas. |
| The API | `KEYCLOAK_ISSUER` | `http://localhost:8080/realms/pcp` | The realm whose tokens it accepts. The API has to reach this address, to fetch the realm's keys. |
| The API | `KEYCLOAK_AUDIENCE` | `pcp-api` | The audience a token has to name. |
| The API | `DATASOURCE_URL` | `postgresql://localhost:5432/pcp` | Where the platform's database is: its host, its port and the database's name. A login written into it is not read. |
| The API | `DATASOURCE_USERNAME` | `pcp` | The database user the API logs in as, which owns the platform's database. |
| The API | `DATASOURCE_PASSWORD` | None | That user's password, a secret. In development, Nx gives it from `.env`, as above. |
| The API | `OPENDB_REPOSITORY_URL` | `https://github.com/buildcores/buildcores-open-db` | Where the import fetches the pinned commit's archive from. Only the import reads it. It takes plain HTTP only from this machine, where the tests' stand-in for GitHub listens, because the import trusts the commit the archive names in its own header. |
| The Shopper app | `API_URL` | `http://localhost:3001` | The API's address. It is read on the server when a page is requested, and is never sent to the browser. |
| The dashboard | `VITE_KEYCLOAK_URL` | `http://localhost:8080` | Keycloak's address. |
| The dashboard | `VITE_KEYCLOAK_REALM` | `pcp` | The realm. |
| The dashboard | `VITE_KEYCLOAK_CLIENT_ID` | `dashboard` | Its login client. |
| The dashboard | `VITE_API_URL` | `http://localhost:3001` | The API's address. |

- The API checks its settings when it starts. A malformed one stops it with a message that names it.
- The dashboard's settings are fixed when it is built, and every one of them ends up in the browser.
- Values for a server are supplied when the platform is packaged, which is later work.

**Directory layout**

| Path | What lives there |
|---|---|
| `apps/api` | The API. Its domain and infrastructure layers are under `src/app`, and its tests are under `src/test`, mirroring `src/app`. Its migrations, which drizzle-kit writes, are under `src/drizzle`, and its other entries, `migrate.ts`, `import-catalog.ts` and `write-openapi.ts`, are beside `main.ts`. Its description of itself, `openapi.json`, is in its folder, with `drizzle.config.ts` and the three files that give a target the database password. |
| `apps/shopper` | The Shopper app. Next's `app` folder only routes, with every route under the language segment `[locale]`; the Feature-Sliced Design layers are under `src`, with the App and Pages layers named `_app` and `_pages`. Next's proxy file, `proxy.ts`, which redirects an address with no language, is beside the `app` folder. |
| `apps/dashboard` | The dashboard. Its Feature-Sliced Design layers are under `src`, its own shadcn/ui components in the Shared layer's `ui` segment, and `components.json`, which says where shadcn/ui's command writes them, in its folder. |
| `apps/e2e` | The end-to-end tests, which `pnpm platform:check` runs. |
| `libs/core`, `libs/compatibility`, `libs/api-client`, `libs/ui`, `libs/i18n`, `libs/opendb` | The six shared libraries. Each is imported by its `@pcp/…` name through its single entry file, `src/index.ts`, and is consumed as TypeScript source with no build step. `@pcp/core` has a second entry, `@pcp/core/test-utils`, which holds test helpers and which only test files import. `@pcp/ui` has two stylesheet entries, `@pcp/ui/themes/shopper.css` and `@pcp/ui/themes/dashboard.css`, one for each frontend's look (ADR-0007), and each imports the library's shared `theme.css`. The client under `libs/api-client/src/generated` is generated. `i18n`'s language files are under `libs/i18n/src/messages`, with a README on correcting them and a word list. |
| `services` | What the development services are set up from: PostgreSQL's set-up script, and Keycloak's realm file and theme. The Sorani text of the login screen is in the theme. |
| `tools` | Scripts the workspace itself needs, among them the ones behind `pnpm services:up` and `pnpm services:check`, the statement of the frontends' import bans, the two scripts behind `pnpm boundaries:write` and `pnpm boundaries:check`, and the ones behind `pnpm api-client:write` and `pnpm platform:check`. |
| The repository root | The workspace's own configuration: the package manifest and lockfile, the pnpm workspace file, and the Nx, TypeScript, Oxlint, Oxfmt and Jest settings that every project extends. Also the Compose file for the development services, `.env.example`, and the lint rules for test files, which the API and `core` extend. |

Inside the API the `~/` alias means `src/app`. Inside each frontend the `@/` alias means `src`.

**Import rules**

Lint refuses an import that breaks any rule below, so `pnpm check` does too, and `pnpm boundaries:check` proves that each rule still refuses a violation.

_Between the ten projects._ Each project carries a scope tag and a type tag in its package manifest, and the constraints between the tags are in the root Oxlint configuration.

| Project | Tags | May import |
|---|---|---|
| `@pcp/api` | `scope:api`, `type:app` | `@pcp/core`, `@pcp/compatibility`, `@pcp/opendb` |
| `@pcp/shopper` | `scope:web`, `type:app` | `@pcp/api-client`, `@pcp/ui`, `@pcp/i18n`, `@pcp/compatibility`, `@pcp/opendb` |
| `@pcp/dashboard` | `scope:web`, `type:app` | `@pcp/api-client`, `@pcp/ui`, `@pcp/i18n`, `@pcp/compatibility`, `@pcp/opendb` |
| `@pcp/core` | `scope:api`, `type:lib` | No other project |
| `@pcp/api-client`, `@pcp/ui`, `@pcp/i18n` | `scope:web`, `type:lib` | No other project |
| `@pcp/compatibility`, `@pcp/opendb` | `scope:shared`, `type:lib` | No other project, and no npm package |
| `@pcp/e2e` | `scope:e2e`, `type:e2e` | No other project |

- A project is imported by its `@pcp/…` name and never by a relative path. A library is imported through its single entry file, `@pcp/core` through its second entry as well, and each frontend's stylesheet imports its own theme from `@pcp/ui`. An import that reaches past an entry fails type-checking. The three apps export nothing, so an app cannot be imported by its name at all.
- A project with no tags may import no other project. A new project is tagged before it imports anything.
- A library may import no other library. The first dependency between two libraries is made by changing that constraint on purpose.
- The ban on npm packages in `@pcp/compatibility` sees a package only once it is installed. An import of a package that is not installed fails type-checking instead.
- This is Nx's boundary rule, run under Oxlint through a bridge that Nx marks as experimental. It reads the project graph that Nx caches on disk. With no cached graph it prints a warning, checks nothing and passes. `pnpm check` and `pnpm exec nx lint <project>` have the graph. Bare `oxlint` is not a boundary check, and neither is a run in which Nx has been told not to cache the graph (`NX_CACHE_PROJECT_GRAPH=false`).
- The rule applies to every file of a project, the files at its root among them. The files that belong to no project are linted before Nx has cached a graph, with a second configuration at the repository root that extends the first and switches this one rule off.

_Inside the API._ A file in the domain layer may not import the infrastructure layer, by the `~/` alias or by a relative path. The infrastructure layer may import the domain layer. The test tree is not covered, as at the workplace. `@pcp/core` has the same two layers and the same ban.

_Inside each frontend._ The layers, from the top, with what a file in each may import through the `@/` alias:

| Layer | Folder in the dashboard | Folder in the Shopper app | Has slices | May import |
|---|---|---|---|---|
| App | `app` | `_app` | No | Every layer below |
| Pages | `pages` | `_pages` | Yes | Widgets, Features, Entities, Shared |
| Widgets | `widgets` | `widgets` | Yes | Features, Entities, Shared |
| Features | `features` | `features` | Yes | Entities, Shared |
| Entities | `entities` | `entities` | Yes | Shared |
| Shared | `shared` | `shared` | No | Other segments of Shared |

- **No import from a layer above.**
- **No import of another slice on the same layer.** Two slices are joined on a layer above. Inside a slice, imports are relative.
- **Nothing past an index file.** A slice is imported as `@/<layer>/<slice>`, a segment of the Shared layer as `@/shared/<segment>`, and the App layer as a whole. A layer that has slices or segments is never imported with nothing named after it.
- **The `@/` alias reaches the six layers and nothing else.** A folder in `src` that is not a layer cannot be imported from a layer or from a route file.
- **A relative import stays at home.** Home is the slice, or the layer in the App and Shared layers, which have no slices. A climb is followed from the home folder itself, from a segment and from one folder inside a segment. A file at any other depth may not climb with a relative import at all.
- **A relative import is written in its shortest form:** any climbing first, as `../`, and no `.` or `..` after it. The bans count the `../` an import starts with, and a longer spelling would get past the count.
- **A layer that has slices holds no files of its own.** A file put straight into its folder may make no relative import.
- **Next's routing folder only routes.** In the Shopper app, a file in Next's `app` folder imports a page from the Pages layer or the App layer, each through its index file, and nothing else from the project. It reaches them through the alias and never by a relative path.
- **Next's proxy file imports the languages and nothing else.** In the Shopper app, `proxy.ts` imports next-intl's statement of the languages from the `i18n` segment of the Shared layer, through its index file and by the alias, and nothing else from the project. Next runs it before it answers every request.
- The bans cover all six layers, although the Widgets, Features and Entities folders are created only when the first slice needs them.
- The bans are stated once, in `tools`, and `pnpm boundaries:write` writes them into `.oxlintrc.feature-sliced.json` in each frontend's folder. That file is never edited by hand: change the statement and write it again. `pnpm check` fails when the two differ.
- Two things the bans cannot see. A file with no imports, put straight into a layer that has slices, can still be imported as if it were a slice. A file in `src` outside the six layers is under no ban itself, though nothing in a layer or in the routing folder can import it.
- Type-only imports, re-exports and lazy `import()` count as imports under every rule here.

**The API's conventions in code**

Step 4 built these once, on two endpoints, for every module to copy. ADR-0004 gives the reasons.

- _Layout._ A feature lives in `src/app/infrastructure/<feature>/`, with its controller in `endpoints/` beside its Request and Response classes, its Store in `store/` beside its Drizzle schema, and a NestJS module that the root module imports. A use case and its entity live in `src/app/domain/<entity>/`. `catalog` built the first Commands, Queries and Stores, with Effect's `Either`, and **The catalog's conventions** below say how.
- _Paths._ A controller declares no path. Each method carries its full path, which begins with a version: `@Get('v1/caller')`.
- _Access._ One global guard, in `@pcp/core`, stands in front of every endpoint. An endpoint carries `@PreAuthorize([Role.ADMIN, Role.VENDOR])`, which lets in a caller that holds any one of the roles listed, or `@Public()`. An endpoint with neither is refused for every caller.
- _What the guard checks._ Every token's signature against the keys the realm publishes, its expiry, its issuer and its audience. A token that states no expiry is refused. The keys are fetched on first need and kept for ten minutes at a time, so that verifying a request is not as a rule a call to Keycloak, and the API starts without it. A token that names a key the API does not have makes it fetch the keys again, though not within thirty seconds of its last fetch.
- _Refusals._ No token, or a token that fails a check, is answered 401. A good token that lacks the role, or a good token at an endpoint with no access rule, is answered 403. While the realm's keys cannot be had, a call with a token is answered 503. While the database cannot be reached, a call that needs it is answered 503 with `DATABASE_UNAVAILABLE`, and the API listens to its pool's error event, so that a database that stops does not end it.
- _Requests._ Every request is checked against its Request class, with class-validator's `whitelist` and `forbidNonWhitelisted`: a field the class does not declare is refused, and each refused field is named in `additionalInformation`.
- _The caller._ A controller injects `CallerResolver` and calls `getCaller()`, which gives the login's identifier, its name and its platform roles. The guard fills it only after every check has passed. It is read in the infrastructure layer only, and a use case is handed plain values.
- _Answers._ An endpoint's Response class has readonly fields, each with `@ApiProperty`, a private constructor and a static `of` factory. The error body is the one Response class with a public constructor, because the filter builds it.
- _Errors._ One global filter gives every error the same body: a list named `errors`, each entry with a `code`, a `title` and a `detail`, and `additionalInformation` when there is something in it. The title and the detail are keys for the frontends to turn into text, made from the code: an error a use case returns has a code of its own, such as `PART_NOT_FOUND`, which gives `PART_NOT_FOUND.title`. What an exception said is never in the body.
- _The description._ An endpoint carries `@ApiOperation` and the success response that fits it, such as `@ApiOkResponse`, or `@ApiCreatedResponse` for a create, with no compiler plugin. An operation is named after its controller method, and that name becomes the client's function name, so method names are unique across the controllers. A public endpoint adds `security: []` to its `@ApiOperation`, because the client sends a token only where the description asks for one.
- _Settings._ A new setting is a field of the API's `EnvironmentVariables` class, with its default and its `class-validator` checks.
- _Set-up._ `configureApplication` sets the application up, apart from starting it. The real start and every test call it.
- _Tests of an endpoint._ They go through the API's HTTP surface. `createTestApp` builds the real root module, sets it up with `configureApplication` and listens on a free port, and the test sends requests with `fetch`. A test that calls an endpoint as someone uses `createTestAppWithLogins`, which also starts a stand-in that publishes keys as Keycloak would, and whose `tokenOf` makes a token for a login with given roles. The stand-in, the tokens and `expectErrorResponse`, which asserts a refusal, come from `@pcp/core/test-utils`. The guard is never overridden, and nothing is mocked but the clock, in the tests that have to let time pass. A test sets a setting before it builds the application, because the settings are read when the root module is loaded.
- _Test files._ They are held to the workplace's eight lint rules for Jest, among them `it` and not `test`, a `describe` around every test, and an assertion in every test. A helper counts as an assertion only when the lint rules list it by name.

**Calling the API from a frontend**

- A frontend calls the API only through `@pcp/api-client`. `createApiClient` takes the API's address and, optionally, a function that supplies a token, and gives one function for each operation the API describes. A call answers with `data`, or with `error`, which is the API's error body.
- A call never throws. When the request cannot be made, it answers with no `data` and no `response`, although its types say there always is a response. The Shopper app reads any answer without data as "the API cannot be reached". The dashboard tells a refusal, which has a response, from a call that could not be made, which has none.
- _The Shopper app_ makes its client in the Shared layer's `api` segment, with no token. A page fetches in its own slice's `api` segment, on the server, after `await connection()`, so that it is rendered when it is requested and never when the app is built.
- _The dashboard_ starts its login once, in the App layer's entry file, before React renders anything. The login is in the Shared layer's `auth` segment. The client, in the `api` segment, asks `auth` for a token that is still valid before each call. When Keycloak refuses to renew a token, the adapter sends the browser to the login screen itself. When Keycloak cannot be asked, the call is not made and the page says so.
- _The dashboard's screens_ call the API through TanStack Query, and every query and every change goes through `dataOf`, in the `api` segment, which gives the call's data or throws a `Refusal` or an `Unreachable`, because a query has to throw to fail. **The catalog's conventions** below say more.
- A refusal from the API is shown. It is never answered by starting a login, so that an API that refuses every token cannot send the browser round Keycloak for ever.

**The three languages**

`languages` built these once, on the two placeholder pages, for every Shopper page and every Vendor portal screen to copy. [ADR-0008](../../docs/adr/0008-language-in-the-address-and-two-message-formats.md) records the two decisions that are costly to undo, and the module's tickets record what was found on the installed tools.

_The languages._

- The three are `ckb`, `ar` and `en`, the tags the Keycloak realm uses, listed in that order wherever the three are listed. Kurdish is the fallback wherever nothing else decides.
- `i18n` states them once, with each one's own name in its own script ("کوردی", "العربية", "English", never translated), its direction (`rtl`, `rtl`, `ltr`) and the rule for a browser's languages: the first one the platform has, a regional form counting as its language, else Kurdish. The rule is `@formatjs/intl-localematcher` with its "best fit" method, which next-intl uses too, so the two frontends cannot disagree. It sends a browser set to Urdu to English.
- Neither frontend asks a library for a language's direction.

_The text._

- Every translated text is in `i18n`, under `src/messages`, in three sets, each one JSON file for each language. A file holds nothing but text. English is the source: its messages define what the other two hold, and a key is type-checked against the English file.
  - `shared/`: the shared terms, which both frontends show with the same wording. They are plain text, with nothing in braces or angle brackets. So far they are the eight Category names.
  - `shopper/`: the Shopper app's text, in next-intl's format, ICU.
  - `dashboard/`: what the Vendor portal shows, and the text of a component both halves of the dashboard show, in i18next's own format. Text that only the Admin console shows is written in English where it is used, and is not here.
- Each frontend adds the shared terms to its own set, so a shared term is asked for by its key like any other. A name at the top of the shared terms is never at the top of a frontend's set.
- The README beside the files says how a message is corrected, and a word list beside them, `words.md`, gives the Kurdish and the Arabic word for each term of CONTEXT.md a Shopper or a Vendor reads. A screen that shows a term for the first time takes its word from there.
- The Kurdish and the Arabic text is a draft until the review LANG-7 asks for, and the README says so for each file.
- A value is never written into a message by a frontend's own formatting. In the Shopper app's files it is `{name}`, and a piece of text kept apart is `<english>…</english>`, which the page fills. In the dashboard's files every value is an element the message names, such as `<name/>`, which the page fills with react-i18next's `Trans`, so that React shows it as text. Nothing is written in double braces there, and i18next's escaping is off, because React escapes what it shows.
- A sentence that counts is worded with every plural form its language has: `one` and `other` in Kurdish and English, and `zero`, `one`, `two`, `few`, `many` and `other` in Arabic. In the Shopper app's files it is one ICU message, `{count, plural, …}`; in the dashboard's it is one key for each form, such as `partsFound_one`.
- `pnpm check` compares the files (see Commands). A correction is checked by running it.

_Numbers._

- Every number the platform shows is in Western digits, 0 to 9, not only prices and specifications, grouped in thousands with a comma and with a point before decimals: 1,575,000.5.
- `formatNumber`, in `i18n`, writes every number. Its answer is the same in all three languages, on the server and in the browser. It takes no language: Node writes a Kurdish number in Arabic-Indic digits, and Chromium, which has no number formatting for Kurdish, writes one in the language the browser itself is set to.
- No message formats a number. A number reaches a message as text, written by `formatNumber`. A sentence that counts is given the count twice: the count picks the wording, and the text `formatNumber` wrote is what is shown, as `{countText}` in the Shopper app's files and as `<count/>` in the dashboard's. `#`, `{…, number}`, `{…, date}` and `{…, time}` are never written in the Shopper app's files, nor anything in double braces in the dashboard's, and `pnpm check` fails on each. next-intl's `format.number` and i18next's own number formatting are never used.
- A Vendor's own digits, in what a Vendor wrote, are shown as written. The first page that shows such text decides how its test reads them.
- Currency, rounding and the "≈" mark are `pricing`'s. Dates and times, and "3 days ago", arrive with the first screen that shows one: Node has no Sorani wording for relative time.

_Direction and layout._

- The document declares its language and its direction. The Shopper app's server sends every page with both, and the dashboard sets both when it starts and at every switch.
- Every class that has a side is written in its logical form, start and end: `ps-*`, `me-*`, `text-start`, `border-s`, `rounded-e`, `inset-s-*`. Lint refuses the physical form, left and right, in both frontends and in `ui`, with `enforce-logical` from `oxlint-tailwindcss`, pinned exactly and held to left and right; top and bottom are left alone. The rule reads a class where it is written whole, in `className`, `class`, `cn()` and `clsx()`, and not one put together in a template string or written in a stylesheet. A class is therefore written where the rule reads it.
- Tailwind reads `ui`'s classes through one `@source` line in `ui`'s shared theme.
- An icon that points along the reading direction, such as an arrow, is mirrored on a page that runs right to left. One that does not point is left alone.
- The first shadcn/ui component is added with shadcn/ui's right-to-left setting on, so that the command that adds a component writes logical classes. Its documentation names three components it converts by hand, and a fault in the sliding animations of pop-up parts, with a workaround.
- Every page and screen is laid out for a phone 360 pixels wide first and adapts upward, does not scroll sideways, and puts its language switch on the end side of its frame. A word too long for the screen is broken.

_Text that is not translated._

- `ui` has two components for it, and a screen never writes their markup by hand. Neither kind of text is in the language files.
  - `AlwaysEnglish` marks text that is English and left to right in every language: a Part name, a manufacturer name, a specification, and a number with its unit or its currency. Inside a Kurdish or an Arabic sentence the browser otherwise reorders such text when it starts with a number or a sign: "80 mm" is drawn "mm 80", "990 PRO 2TB" "PRO 2TB 990". A name that starts with a letter, such as "Ryzen 5 7600", happens to be left whole, and is marked all the same, because a screen cannot know which name starts with a number.
  - `AsWritten` marks text shown as someone wrote it, such as a Vendor's name, address and opening hours. It takes its direction from its own first letter.
- Both are `bdi` elements, HTML's own means, with no library and no styling.

_The Shopper app._

- next-intl gives it its languages. The language is the first part of every address, for all three: `/ckb/…`, `/ar/…`, `/en/…`. An address with no language is answered with a redirect to the same page in the remembered language, else the browser's, else Kurdish. An address with a language is shown in that language, whatever is remembered.
- The language is remembered in next-intl's cookie, for a year from when it is written. next-intl writes it when a page in another language than the remembered one is asked for, or, when nothing is remembered, in another language than the browser's. So opening a link in another language changes what is remembered, as a use of the switch does, and a visit does not renew the year. `sharing` decides whether a shared link keeps that rule.
- The switch is three plain links to the page the Shopper is on, one in each language, in the frame of every page. A tap asks the server for the page, and the server's answer writes the cookie, so it works with no script, and the year holds in Safari, which keeps a cookie a script writes for seven days at most. The link to the language the page is in is marked `aria-current="page"`. A query is not kept yet.
- A page reads its text on the server, from the language files, and no language file reaches the browser. `NextIntlClientProvider` is not rendered yet, and the first component that needs text in the browser is handed only that text.
- The tab's title comes from the language files. With each page next-intl sends the page's address in the other two languages, for search engines.
- next-intl's statement of the languages and its request set-up are in the `i18n` segment of the Shared layer. Next's proxy file, `proxy.ts`, sits beside the routing folder and imports that segment and nothing else from the project. The route files are under the folder `[locale]`, and still only re-export.
- An address that matches no page is answered 404 with the "not found" screen in the frame, in the visitor's language. Next sends that screen as a bare document that the browser draws, so it alone has no language in what the server sends and needs a script. `browse` decides what becomes of it, with the first page that can be "not found".

_The dashboard._

- react-i18next, with i18next, gives it its languages. Neither the plugin that reads ICU messages nor the one that detects a browser's language is used. All three languages' text is given to i18next at the start, and no language falls back to another.
- **Which half.** A login that holds the `admin` role gets the Admin console, also when it holds `vendor` too. Every other login gets the Vendor portal. The rule is `halfFor`, in the App layer, applied once when the dashboard starts, to the realm roles the access token holds, which is the claim the API reads. `accounts` extends this rule and does not invent another.
- **The Vendor portal** opens in the language chosen with its switch in this browser, else the browser's, else Kurdish. Only a use of the switch is remembered, in the browser's `localStorage`. A language that was only found from the browser is never stored. The choice lasts across a logout. It is the only thing the dashboard keeps in the browser's storage, beside an entry Keycloak's adapter keeps for the length of a login; tokens stay in memory.
- The switch is a button for each language, named in its own language and script, in the frame of every Vendor portal screen. A tap changes the language, the direction and the tab's title in place, with no reload and no visit to Keycloak.
- What is shown before anyone is known, such as the message for a login that could not be completed, follows the Vendor portal's rule.
- **The Admin console** is in English and left to right, whatever the browser's language is, and has no switch. It neither reads nor writes the Vendor portal's remembered choice. When the Admin acts as a Vendor (`accounts` ticket 09), it shows that Vendor's portal under the Vendor's page, at `/vendors/:vendorId/portal`, in the portal's language by the portal's rule, with the portal's switch, which reads and writes the remembered choice there. Leaving the portal returns the document to English, left to right, and to the Admin console's title.

_Testing a page in three languages._

- The language tests are the files named `…-languages.spec.ts`. They run in Chromium in a window 360 pixels wide, with the browser set to Arabic as written in Iraq, which writes a number it formats for Kurdish in Arabic-Indic digits. A test that sets a language of its own gives that up.
- A Shopper page's test calls `checkInEveryLanguage`, or `readInEveryLanguage` to read something in each language too, once, with the page's address. A Vendor portal screen's test opens the screen and calls `checkInEveryLanguageOfTheVendorPortal` or `readInEveryLanguageOfTheVendorPortal`, which show it in each language by the switch. Both run one loop. Each first confirms the browser shows the fault, and then, in each language, that the page declares that language and its direction, before it reads anything else; that it is in the frame; that the switch is there, inside the screen, large enough to tap and on the end side; that no Arabic-Indic digit is on it, but in text marked as written, which a Vendor wrote with its own digits (LANG-4) and which the screen's test checks as written; and that it does not scroll sideways. The Shopper app's helper also reads what the server sent.
- No test quotes a translation, because the review may change every one. A test tells the languages apart by the language the page declares and by the same piece of text differing between them, and finds an element by a test id or by a value that is the same in every language. The languages' own names, which are not translations, are written out in the tests.
- `linesAsDrawn` reads the order a piece of text is drawn in, and `layoutOf` reads its direction and whether it is kept apart. The checks of the Shopper app's placeholder sample are in `sample.ts`. The Vendor portal's sample went with its placeholder, and its checks moved to the details screen (`accounts` ticket 07), where the screen has the same kind of text.

**The catalog's conventions**

`catalog` built these once, for the catalog, for every later module to copy. [ADR-0005](../../docs/adr/0005-specifications-as-one-document-per-part.md), [ADR-0006](../../docs/adr/0006-fonts-downloaded-from-our-own-server.md) and [ADR-0007](../../docs/adr/0007-a-look-and-components-for-each-app.md) record the decisions that are costly to undo, and the module's tickets record what was found on the installed tools.

_The database._

- The API reaches PostgreSQL through Drizzle ORM 0.45 with `pg` 8, through one `DatabaseProvider` in its infrastructure layer, whose pool opens a connection only when a query needs one. Drizzle's 1.0 is a release candidate, and its online documentation describes it, so the installed package's own types are the reference.
- Drizzle's schemas are in the infrastructure layer, one file for each table, beside the Store that uses it.
- The API starts while PostgreSQL cannot be reached, as it starts without Keycloak, and answers a call that needs the database 503 with `DATABASE_UNAVAILABLE`. It listens to its pool's error event, so that a database that stops does not end it.
- **Migrations** are generated from the schema by drizzle-kit 0.31 into `apps/api/src/drizzle`, which Oxfmt leaves alone. They go forward only, and each file's name says what it does: `pnpm db:generate <name>` refuses to make one up. SQL that drizzle-kit cannot write from the schema, such as creating `pg_trgm`, goes into an empty migration that `pnpm db:generate <name> --custom` records in the journal, filled in by hand.
- Migrations are applied by a command of their own, `pnpm db:migrate`, which holds the advisory lock `pg_try_advisory_lock(hashtext('pcp-api-migrations'))` on the connection that applies them, and says so and applies none while another run holds it. The API never applies them when it starts. `pnpm services:up` runs `pnpm db:migrate` once PostgreSQL is healthy, `pnpm services:check` says whether every committed migration is applied, and `pnpm platform:check` refuses to start without them.
- A step of `pnpm check` generates the migrations again into a copy under the API's own `tmp`, with no database, and fails unless drizzle-kit says "No schema changes" and writes no file. It shows the migration that is missing.

_Use cases, Stores and errors._

- A use case is a class in the domain layer, a Command when it changes data and a Query when it only reads: `CreatePartCommand`, `EditPartCommand`, `AddPartPhotoCommand`, `ImportCatalogCommand`, `SearchPartsQuery`, `ReadPartQuery`, `ReadPhotoQuery`. Each has its own Input and Output classes, beside it in the same file, exported under its own names, apart from the import, which has no Input: the source it reads is injected, as every port is.
- An entity is a class with getters, such as `Part`. Its Store is an abstract class in the domain layer, the port, such as `PartStore`, and the infrastructure layer implements it, as `DatabasePartStore`. The abstract class is the injection token.
- Effect 3, the major version the workplace uses: Effect 4 has no `Either`. Domain and Store code never throws. It returns `Either`, whose left side is one of `core`'s structured errors, `NotFoundError` or `NotValidError`, each with a code of its own from which its title and detail keys are made: `PART_NOT_FOUND` gives `PART_NOT_FOUND.title`. A database's failure becomes `DATABASE_UNAVAILABLE` or a database error the same way.
- The controller turns a left side into `core`'s `ErrorStructureException`, which the global filter gives the error body every refusal has. A structured error's fixed details, such as the field it is about and why, are in the body's `additionalInformation`.
- Every request is checked against its Request class, with class-validator's `whitelist` and `forbidNonWhitelisted`: a field the class does not declare is refused, and each refused field is named in `additionalInformation`.
- An endpoint carries `@ApiOperation` and the success response that fits it, such as `@ApiOkResponse`, or `@ApiCreatedResponse` for a create.

_Paging._

- A list is asked for a page at a time, in the workplace's shape and names, with `core`'s `PagingRequest`: `page` counted from 0 and `size`, 10 unless asked, at most 100. Page numbers above 1,000,000 are refused, and a page past the end is answered empty. The answer holds `content`, `pageNumber`, `pageSize`, `totalElements`, `totalPages`, `first` and `last`, read in one snapshot so that they agree.

_Specifications._

- A Part's specifications are one JSON document, in OpenDB's field names and nesting, which its Category's specification list describes (ADR-0005). The lists are written by hand in the API's domain. Each entry gives a specification's path, English label, kind, unit, whether 0 means "not known", and whether it is a needed specification.
- A specification that a Compatibility Rule compares for equality, such as a socket, is one of a fixed set, or several of one, and a new value is a change to the list in code.
- The API answers the eight Categories with their lists, and every frontend builds its forms and its pages from that answer, holding no copy of its own.

_Photos._

- A Part has at most one photo, kept in PostgreSQL behind the `PhotoStore` port, one row for each Part. An object store can replace it later with no change to the domain.
- sharp 0.35 makes every photo WebP, at most 1,200 pixels on its longer side, never enlarged, turned upright, with no metadata. A JPEG, PNG or WebP picture of up to 10 MB and 100 million pixels is taken, judged by its content, and every refusal is `NOT_VALID` with `field: 'photo'` and a `reason`: `missing`, `tooLarge`, `notAPhoto` or `tooManyPixels`.
- A photo is served without a token at `/v1/photos/<id>`, a path on the API, which a frontend puts the API's address in front of, and may be cached for a year. A replacement is a new row at a new address, and the old one is deleted.

_The import._

- `pnpm catalog:import` is the API's second entry, `src/import-catalog.ts`, run by its `catalog-import` target. It fills the catalog from BuildCores OpenDB at commit `ef7e601b78875a931a4ad9fa1ccce7000f3e5ecf` of 5 October 2026, the last released under ODC-By 1.0 (ADR-0001). Later OpenDB data is under CC BY-NC-SA 4.0 and is not used without the owner's agreement.
- The commit, OpenDB's address, its name and the licence's name and address are written once, in `@pcp/opendb`, which both the API and the Shopper app import.
- With no folder, the import fetches the commit's archive from `OPENDB_REPOSITORY_URL`, reads it in memory and imports nothing unless the archive's own header names the pinned commit. Given a folder, it reads that, which must name the commit in a `COMMIT` file.
- It imports the eight Categories' folders only, in one transaction, and never changes or removes a Part: a record whose OpenDB ID is already in the catalog is skipped, so a second run imports none. It prints, for each Category and in total, the Parts imported, those already there, the records left out and the values left out, and the commit.

_Tests against a real database._

- `pnpm integration:check` runs each project's `*.integration-spec.ts` files against PostgreSQL 18.6 in a container that Testcontainers 12 starts for the run, from `@pcp/core/test-utils`'s shared test database. Every test file shares the one container, the committed migrations are applied first, and the tables are emptied between tests. Nothing is mocked. It needs Docker but not the services, and says so plainly when Docker is not running. Testcontainers also downloads its own helper image, `testcontainers/ryuk`, which removes a container a run left behind.
- Run it after a change to a schema, a migration, a Store, a Command or a Query, and after an upgrade of Drizzle, `pg`, Effect or Testcontainers. `pnpm check` does not run it.

_The dashboard's libraries._

- React Router 8, in data mode. The Admin console's routes are declared in the App layer, in `admin-console-router.tsx`, and its router is made after the login. The Vendor portal's routes are declared beside them, in `vendor-portal-router.tsx`, from its screens in `vendor-portal-screens.tsx`, which the Admin console's router mounts again under a Vendor's page, at `vendors/:vendorId/portal`, for the Admin acting as that Vendor (`accounts` ticket 09). The portal's own frame learns the Vendor from the API, and the Admin's from its address, and either gives a screen its identifier through `<Outlet context>`, which a screen reads with `useVendorShown`. A link between two of the portal's screens, and a way back after a save, is written relative to the route, such as `contact-details` and `..`, so that it leads to the same screen under either router. An address of the other half's matches no screen of either.
- TanStack Query 5, with one `QueryClient` in the App layer for both halves. Every call goes through `@pcp/api-client`, and `dataOf`, in the Shared layer's `api` segment, turns its answer into the data or throws: a `Refusal`, with the status and the API's errors, or `Unreachable`. Only `Unreachable` is retried, once. Every query about Parts is under the key `parts`, so that a change to a Part asks every search and every Part again.
- React Hook Form 7. A Part's form registers each specification at `specifications.` and its path, so its values are already in OpenDB's nesting, and a refusal's `field` is the name of the field it is about.
- lucide-react for icons. `ui` has the `CategoryIcon`, which every frontend shows for a Part without a photo.

_Each app's components._

- Each app has its own shadcn/ui components (ADR-0007), on Base UI. The dashboard's are in its Shared layer's `ui` segment, `apps/dashboard/src/shared/ui`, imported as `@/shared/ui`, in the `base-mira` style with `rtl` on, as `apps/dashboard/components.json` says. The Shopper app's will be in its own Shared layer under a `components.json` of its own, in the Lyra style, when its first component is added.
- A component is added with `pnpm dlx shadcn@<version> add <name>` from the app's folder, and then held to the root DESIGN.md: 44 pixels high, no text under 14 pixels, a focus outline in `ring` at full strength, a control's edge in `input`, and one component importing another by a relative path, as Feature-Sliced Design's bans require. The command reads the `@/` alias from the app's `tsconfig.json`. It may rewrite components already adapted, which are restored from Git. Its components import `cn` from shadcn's own `cn` package.
- `buttonVariants` gives a link or a label the button's look, with its classes merged.

_Design and accessibility._

- [The root DESIGN.md](../../DESIGN.md) holds what both apps share, and each app's folder has a DESIGN.md of its own for its look: Fit Diagram for the Shopper app and Rate Board for the dashboard. Impeccable reads all three. Each look's tokens are a theme in `ui`, `@pcp/ui/themes/shopper.css` and `@pcp/ui/themes/dashboard.css`, which import the shared `theme.css`. The fonts are downloaded from each app's own server, through Fontsource (ADR-0006): Archivo and Noto Kufi Arabic for the Shopper app, Geist, Noto Sans Arabic and Geist Mono for the dashboard. The research behind them is in [docs/research/design-system.md](../../docs/research/design-system.md).
- The accessibility standard is WCAG 2.2 level AA, for every screen, in both schemes. Oxlint's `jsx-a11y` plugin checks the frontends and `ui` in `pnpm check`. In `pnpm platform:check`, the end-to-end tests' `expectAccessible` runs axe-core through `@axe-core/playwright` with the tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa`, which turn on `target-size` too, in the light and in the dark scheme, once running transitions have finished. The tests of the Catalog, a Part's page, the form for a new Part, the edit form, the Vendors list with the menu of sections open, a Vendor's page, the form for a new Vendor with a refusal shown, the temporary password with the hand-over, the Vendor portal's details screen, its form for the contact details with a refusal and a position problem shown, its message for a Login with no Vendor behind it, the portal as the Admin acts as a Vendor, with its band, the confirmation of a Vendor's deactivation, the Vendor portal's message for a deactivated Vendor, and the Shopper app's first page call it.
- The Admin console's screens so far are the Catalog, a Part's page, the choice of Category and the form for a new Part, and the edit form, and the Vendors list, a Vendor's page, and the form for a new Vendor with its temporary password and hand-over, all in English and laid out at 360 pixels first. A menu in the top bar leads to its two sections, the Catalog and the Vendors.

_The footer credit._

- Every Shopper page's frame holds a footer crediting BuildCores OpenDB in the Shopper's language, in the words of ODC-By 1.0's example notice, with OpenDB's name and the licence's marked `AlwaysEnglish` and linked to the pinned commit and to the licence (CAT-9).

_Commit messages._

- Conventional Commits 1.0.0, with commitlint's conventional types (`build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`) and the Nx project's folder name as the scope, or `tools` for a commit that changes only the workspace's scripts in `tools/`, as the owner decided on 16 October 2026. The scope is left out when a commit spans several projects. A subject and every body line are at most 72 characters. commitlint checks each message in the commit-msg hook that husky installs, as the owner decided on 15 October 2026. Earlier commits keep their own style.

**End-to-end tests**

- They are the `@pcp/e2e` project, written with Playwright's test runner. They see the platform through a browser and over HTTP, and import none of its code.
- A test that needs the Admin calls `logInToTheDashboard`, which logs the development Admin in at Keycloak's login screen. A test that needs a Vendor gives it `developmentVendor`, and it logs the development Vendor in instead. `openTheDashboardAs` does the same and waits until the page is drawn whole, and `logOutOfTheDashboard` logs out with the page's own button. Each test starts in a fresh browser. The password is set in the page and never typed with Playwright's `fill`, which writes what it types into the log of a step that fails.
- Keycloak's login screen is told by its address and its form, and never by its text, which is in three languages.
- Every screen's test runs `expectAccessible`, the automated part of WCAG 2.2 level AA, in the light and in the dark scheme (see **The catalog's conventions**).
- A test that needs a Part creates a made-up one over HTTP as the development Admin, with `createAMadeUpPart`, named "Made-up test Part" and a number unique to the run, and finds it by that number. These Parts stay in the development database, plainly test data, and `pnpm services:reset` clears them. A test that needs a photo makes a small PNG in memory, with `aMadeUpPhoto`, and no picture is kept in the repository.
- The Admin console's tests run in a window 360 pixels wide, and the Catalog's detail pane is tested at 1,280.

**Worth knowing about the toolchain**

- _One copy of NestJS._ pnpm keeps a copy of a package for each set of peers it resolves. `core` and the API once got a copy of NestJS each, and NestJS cannot inject a class from one copy into the other: the API's tests failed with "Nest can't resolve dependencies". The root manifest therefore lists `supports-color`, which nothing imports, and `pnpm-workspace.yaml` says why. If that failure returns, check that `apps/api` and `libs/core` link to the same `@nestjs/core`.
- _Packages published as ES modules only._ Jest loads CommonJS and leaves `node_modules` untransformed. The shared Jest preset names the packages that SWC has to transform for it. `jose` is the first.
- _Install scripts._ pnpm stops an install when a dependency has an install script that `pnpm-workspace.yaml` does not list. A script is read before its package is listed, and one that reports to a third party is listed as not to be run.
- _A serve that is killed from outside_ can leave Nx's own processes behind, and the next serve then waits for them. Their command lines contain `nx.js serve` and `run-executor.js`.

## Testing strategy

Tests are written before the code for logic where a mistake would mislead a Shopper:

- Each Compatibility Rule, with one test for each outcome it can have: passing, a Compatibility Problem, being unchecked and, for rules 11 and 20, a Compatibility Warning.
- Price conversion, rounding, the "≈" mark, and totals (PRC-3 to PRC-5).
- Offer expiry at the 14-day boundary (OFF-6).
- Whether a Build is a Complete Build (BLD-5).
- Both price views, including ordering and missing Parts (BLD-7 to BLD-9).
- Matching sheet rows to Parts (SHT-2 to SHT-5).

End-to-end tests cover the main journeys: a Shopper builds and shares a Build; a Vendor adds, edits and confirms Offers; the Admin creates a Vendor and fulfils a Part Request. They are written with Playwright, in `@pcp/e2e`, and `pnpm platform:check` runs them.

**Checks on a phone wait for hosting.** On 16 October 2026 the owner decided that every check a module asks to be made by hand on a phone, in every module of the project, is made at the end, once the platform's services are hosted, and not on the development services. A ticket records such a check as open, with this reason, and leaves its box open; the check does not hold its module back. The hosting work makes them all. Open so far:

- `languages`, ticket 10: the Sorani letters ڕ, ڵ, ێ, ۆ and ە in the phone's own font, and on an older Android phone if one is at hand; the frame and its language switch used with a thumb, in Kurdish and in English.
- `catalog`, tickets 13 to 15: the Catalog, a Part's page and both forms used with a thumb; a photo from the phone's camera, an iPhone's HEIC photo among them; the footer's credit drawn clearly in Noto Kufi Arabic and read correctly in Kurdish and Arabic; the Sorani letters in both apps' fonts, on an Android phone from Honor, Infinix, Tecno or Xiaomi if one is at hand (ADR-0006).
- `accounts`, ticket 06: the hand-over's link opening the WhatsApp app on the Admin's phone with the message written, in each language; the location button filling the coordinates from the phone's position, in a Vendor's place in Erbil, over HTTPS; the form and the hand-over used with a thumb.
- `accounts`, ticket 07: the Vendor portal's details screen and its top bar used with a thumb, in Kurdish and in English.
- `accounts`, ticket 08: the form for the contact details used with a thumb, in Kurdish and in English, an address typed on a Kurdish keyboard among it; its location button filling the coordinates from the phone's position, in the Vendor's place, over HTTPS.
- `accounts`, ticket 09: acting as a Vendor in its shop on the Admin's phone, the band and its link back used with a thumb, in Kurdish and in English.
- `accounts`, ticket 12: deactivating a Vendor and confirming, and reactivating it, used with a thumb; the Vendor portal's message for a deactivated Vendor, and Keycloak's refusal of its login, read on a phone in Kurdish and in English.

A module that leaves another adds it here.

**Traces hold test passwords.** A failed end-to-end test keeps a Playwright trace in `apps/e2e/test-output/`, which git ignores. It holds what the test typed and was answered, the development Admin's password and a made-up Vendor's temporary password and new password among them. On the owner's machine that stays as it is, as the owner decided on 16 October 2026. A CI server that keeps traces, which the hosting work may add, must treat them as holding test passwords.

The API's tests use Jest with SWC and live under `src/test/`, mirroring `src/app/`: `*.spec.ts` for unit tests with mocked Stores and for tests of an endpoint through the API's HTTP surface, and `*.integration-spec.ts` for tests against a real PostgreSQL started in a test container. The frontends' unit-test tools are chosen when work on them begins.

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
