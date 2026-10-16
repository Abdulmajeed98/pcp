# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Decided by the owner before this file was written, in [ADR-0003](docs/adr/0003-three-apps-one-api-keycloak.md), [ADR-0004](docs/adr/0004-architecture-per-app.md) and the spec's Technology section. The parts that shape interface work:

- Shopper app: Next.js, rendered on the server, with next-intl.
- Dashboard: one client-rendered React single-page application holding the Vendor portal and the Admin console, with react-i18next. The Vendor portal is in three languages, and the Admin console in English only.
- Tailwind CSS with shadcn/ui on Base UI. Each frontend has a look and a set of components of its own ([ADR-0007](docs/adr/0007-a-look-and-components-for-each-app.md)), with downloaded fonts ([ADR-0006](docs/adr/0006-fonts-downloaded-from-our-own-server.md)). The `ui` library holds what both share and each look's theme, and `i18n` the text for all three languages.
- Both frontends follow Feature-Sliced Design.
- The visual design is in [DESIGN.md](DESIGN.md) for what both frontends share, [apps/shopper/DESIGN.md](apps/shopper/DESIGN.md) for the Shopper app's look and [apps/dashboard/DESIGN.md](apps/dashboard/DESIGN.md) for the dashboard's.
- The dashboard's libraries, the most widely used for each job, as the owner chose on 14 October 2026: React Router for the screens' addresses, TanStack Query for calls to the API, React Hook Form for forms, and lucide's icons.

Any further library is chosen when work on that app begins.

## Users

Three kinds of people use the platform. Shoppers are the primary audience.

- **Shopper.** A person in Erbil planning a desktop PC and finding where to buy its Parts. Shoppers have no account, and their pages are designed for a phone first, in Kurdish (Sorani), Arabic or English. Both first-time and experienced builders are served. A first-time builder knows what the PC is for and roughly what they can spend, but not which Parts fit together. An experienced builder knows Parts by model name and wants the quickest route to who has them and for how much. Where the two conflict, the first-time builder wins: the page explains instead of assuming knowledge. (Confirmed by the owner on 6 October 2026.)
- **Vendor.** A business that sells Parts to the public from one location and has agreed to show its Offers. Each Vendor has one login, is signed up in person by the Admin, and cannot sign itself up. Who in the shop keeps the Offers current, on which device and how often, is **not known yet** (asked on 6 October 2026). It is to be learned while signing Vendors up. Until then the spec's two routes stand as equals: a phone-first portal, and an Excel sheet for bulk changes.
- **Admin.** The platform's owner, one person, who signs up Vendors in their shops, maintains the catalog, works the Part Request queue and sets the Platform Rate. The Admin console is in English only.

## Product Purpose

People in Erbil who want to build a desktop PC cannot easily find out which Parts local shops actually have, what each shop charges, or whether the Parts they have picked will work together. The platform lets a Shopper assemble a Build from Parts that local Vendors stock, checks it against the Compatibility Rules, and shows what each Vendor charges.

The MVP is comparison only. It shows prices and availability and helps the Shopper contact a Vendor. It takes no orders, handles no payment and arranges no delivery.

Success is the thirteen success criteria in [the MVP spec](.scratch/mvp/spec.md). There is no launch date and no minimum number of Vendors.

## Positioning

A parts catalog built around another market cannot truthfully say any of these:

- **It shows what Erbil's Vendors have now.** A Part appears only while a Vendor has a visible Offer for it. An Offer left unconfirmed for 14 days is hidden, and every Offer says how many days ago it was confirmed.
- **Its prices are the prices in the shop.** Each Offer shows the Vendor's Quoted Price in USD, IQD or both. A missing currency is filled with a Converted Price at the Platform Rate, which the Admin sets by hand to follow the Erbil market rate instead of the official one (ADR-0002).
- **Nobody can buy a better position.** Listing is free, and Offers are always ordered by price with in-stock Offers first.
- **It works in the city's languages.** Kurdish (Sorani), Arabic and English, with right-to-left layout.
- **It checks compatibility and says when it could not.** There are twenty-one Compatibility Rules, and a rule with a missing specification is reported as unchecked, never as passed.

## Operating Context

- **Phones, in poor conditions.** Devices and connections in Erbil are mixed, and the constrained case is the requirement: a low to mid-range Android phone on slow or unreliable mobile data. (Confirmed by the owner on 6 October 2026.) Every screen must be usable at 360 pixels wide in both text directions.
- **WhatsApp is the hand-over channel.** A Shopper sends a Build to a Vendor through a WhatsApp button, a link pasted into WhatsApp must show a preview, and the Admin hands a Vendor its login details over WhatsApp. The platform itself sends no SMS, email or WhatsApp message.
- **Instagram and Google Maps.** A Vendor page carries the Vendor's Instagram name and a map pin that opens Google Maps. No map is embedded.
- **Two currencies.** Vendors quote in USD, IQD or both, and the Shopper switches the whole site between them. The site starts in IQD.
- **Vendors are signed up face to face.** The Admin visits the shop, creates the account and can act as that Vendor to set it up on the spot.
- **Excel.** A Vendor can download its Offers as an .xlsx file, edit it and upload it again.
- **The purchase happens elsewhere.** A Shopper's journey on the platform ends at a Vendor's WhatsApp chat, phone number or door.

## Capabilities and Constraints

Requirement-level detail lives in [the MVP spec](.scratch/mvp/spec.md), vocabulary in [CONTEXT.md](CONTEXT.md) and decisions in [docs/adr/](docs/adr/). This section summarises them. Where it disagrees with one of them, that document is right and this file needs correcting.

**Surfaces**

- *Shopper pages:* a page per Category with search and filters; a Part page listing every visible Offer; a Vendor page; the builder with its picker; the Build page with its Compatibility Problems, Compatibility Warnings, unchecked rules and two price views (the cheapest total across Vendors, and each Vendor's own total with the Parts it is missing); shared Build pages; and the language and currency switches.
- *Vendor portal:* searching the catalog and adding Offers; editing and confirming them, one at a time or all at once; the expiry banner; Part Requests and their state; the sheet download and upload with its result report; the Vendor's own Referral count; and its own contact details.
- *Admin console:* Vendors, Catalog, Missing specifications, Part Requests, Platform Rate, Expiring Offers and Referrals.

**Fixed product facts**

- Eight Categories: CPU, CPU cooler, motherboard, RAM, storage, GPU, case and PSU. Parts in new condition only. One city, Erbil.
- An Offer is in stock or not. There are no stock quantities.
- A Converted Price is rounded to the nearest 250 IQD or the nearest whole dollar and always carries "≈", as does any total that includes one.
- A Part may have one photo. OpenDB supplies none, so a Part without one shows its Category's icon.
- A Build is saved in the Shopper's browser, one per browser. A shared Build is a frozen copy of its Parts shown with current prices.
- The Build page never prevents a Shopper from keeping an incompatible Build.
- Every Shopper page credits BuildCores OpenDB in its footer, as its licence requires.

**Language rules**

- Shopper pages and the Vendor portal are in Kurdish (Sorani), Arabic and English. The Admin console is in English only.
- Kurdish and Arabic are laid out right to left.
- Part names, manufacturer names and specifications stay in English in every language. Category names and the rest of the interface are translated.
- Text a Vendor writes is shown as written.
- Prices and specifications use Western digits (0 to 9) in every language.
- The first visit follows the browser's language and falls back to Kurdish.

**Terminology**

Interface text uses the CONTEXT.md terms exactly and respects its "avoid" lists: Part, not product or item; Vendor, not store or shop; Build, not cart; Offer, not listing.

**Never**

- Promote, highlight or reorder an Offer for payment.
- Show a Converted Price without "≈".
- Show Shoppers an Expired Offer or an Offer from a deactivated Vendor.
- Present an unchecked Compatibility Rule as passed.
- Show a Vendor's Referral count to another Vendor or to Shoppers.

**Out of the MVP**

Orders, payment and delivery; Shopper accounts; used Parts; anything outside the eight Categories; price history on screen; reviews; ready-made Builds; a native app. The spec has the full list, and building any of it needs the owner's agreement first.

**Undecided**

- The platform's name (see Brand Commitments).
- Who operates the Vendor portal in a shop, and on what device (see Users).

## Brand Commitments

- "PC Part Picker" is a working title only. The final name is to be chosen before the public launch and must not be "PC Part Picker", which is an existing company's brand. Design work must not treat the working title as the brand.
- Neutrality is a public promise: listing is free and no position is for sale.
- No name, logo, voice or other identity asset has been decided.

## Evidence on Hand

- **Catalog data.** BuildCores OpenDB: 26,240 records across the eight Categories with structured specifications, at commit `ef7e601b78875a931a4ad9fa1ccce7000f3e5ecf` of 5 October 2026, the last released under ODC-By 1.0 (ADR-0001). OpenDB's later data is under CC BY-NC-SA 4.0 and is not used. `pnpm catalog:import` imports 26,216 Parts from that commit, leaving out 24 records that name no manufacturer or copy another.
- **Rule coverage.** The spec's Compatibility Rules table gives, for each rule, the share of OpenDB Parts that have the fields it needs, measured on 5 October 2026. It ranges from 100% down to 16%.
- **The currency gap.** On 1 October 2026 the Erbil market rate was about 1,575 IQD per USD against an official rate of 1,300 (ADR-0002).

Absent, and not to be invented:

- Vendors. The repository records no signed-up Vendor, so there are no real Vendor names, addresses, logos or shop photos. Design work that needs a Vendor uses an obviously fictional one.
- Part photos. OpenDB has none.
- Real Offers and prices.
- Testimonials, usage figures, press and partner logos.
- Reviewed Kurdish and Arabic text. Translations are drafted during development and reviewed by the owner, or someone the owner trusts, before launch.

## Product Principles

1. **Say only what is known.** Show Offers a Shopper can act on today and how old each one is. Mark every Converted Price. Call an unchecked rule unchecked.
2. **Neutral by construction.** Price and stock decide the order. Nothing a Vendor does or pays changes its position.
3. **Explain for the first-time builder without slowing the experienced one.** When the two pull apart, explain.
4. **Worst conditions first.** Design starts from a narrow phone, a right-to-left language and a weak connection, and adapts upward from there.
5. **Inform, then hand over.** The platform advises and never blocks. The decision and the purchase belong to the Shopper and the Vendor.

## Accessibility & Inclusion

- Every Shopper and Vendor screen is built in all three languages and both text directions from its first version.
- Every screen is usable at 360 pixels wide.
- Pages are built for low to mid-range Android phones on weak mobile data.
- A Shopper who has never built a PC must be able to understand a Compatibility Problem from the words on the page, which name the Parts involved.
- **The standard is WCAG 2.2 level AA**, for every screen of the Shopper pages, the Vendor portal and the Admin console, in both colour schemes. The owner chose it on 15 October 2026, after [the design research](docs/research/design-system.md). The part a tool can check is checked by axe-core in `pnpm platform:check` and by Oxlint's `jsx-a11y` plugin in `pnpm check`. The rest is checked by hand against [DESIGN.md](DESIGN.md), which also sets two rules beyond level AA: controls at least 44 by 44 pixels, and no text under 14 pixels.
