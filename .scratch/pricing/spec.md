# Spec: Pricing

Status: resolved

This is `pricing`, the fifth module in the build order of [the MVP spec](../mvp/spec.md)'s capability map, after `offers` and the dashboard's redesign. It covers the requirements PRC-1 to PRC-4, and records PRC-5 for `builder`. This spec uses the vocabulary of [CONTEXT.md](../../CONTEXT.md) and follows [ADR-0002](../../docs/adr/0002-platform-rate-set-by-hand.md), [ADR-0003](../../docs/adr/0003-three-apps-one-api-keycloak.md), [ADR-0004](../../docs/adr/0004-architecture-per-app.md), [ADR-0008](../../docs/adr/0008-language-in-the-address-and-two-message-formats.md), [ADR-0010](../../docs/adr/0010-offer-history-kept-apart-from-the-offer.md) and [ADR-0011](../../docs/adr/0011-the-dashboards-look-is-framed-sheet.md). It builds on the conventions that `languages`, `catalog`, `accounts`, `offers` and the redesign recorded in the MVP spec.

On 2 November 2026 the owner made three decisions for this module:

- **The test seams** are the same three as `catalog`'s, `accounts'` and `offers'`. Every conversion, rounding boundary and ordering by price is proved through the API from the outside, and there is no unit-test seam for the conversion.
- **A Converted Price is never below one step.** A conversion that would round to 0 is shown as the first step, "≈ 250 IQD" or "≈ 1 $". This changes the rounding of Converted Prices, which the MVP spec's Boundaries say to ask the owner about first, and PRC-3 is amended to say so.
- **Totals (PRC-5) wait for `builder`.** That module shows the first total. This module records the rule and gives `builder` the Shown Price to add up.

Some words need care. The **Platform Rate** is the single number of IQD per USD that the Admin types in (PRC-1). A **Quoted Price** is a price a Vendor entered, in USD or IQD. A **Converted Price** is a price the platform derived from the other Quoted Price because the Vendor did not quote that currency. The **chosen currency** is the currency the Shopper has picked with the currency switch, IQD until they pick. A **Shown Price** is the price an Offer shows in the chosen currency: its Quoted Price in that currency if there is one, else its Converted Price. "Shown Price" is new, and the first ticket adds it to CONTEXT.md before any code uses it, as the MVP spec's Boundaries ask.

## Problem Statement

Vendors in Erbil quote some Parts in dollars and some in dinars, often depending on how they buy them. A Shopper comparing three shops can see one price as "349 $" and another as "560,000 IQD". To know which is cheaper they have to look up a rate, and the rate they find online, the official one, is about 20% below the rate the shops actually price against. A Shopper who reads prices in one currency also wants every price in it, and a Shopper who sees a price the platform calculated, not the one the Vendor entered, must be able to tell that it is approximate.

The Admin follows the Erbil market rate by hand and needs one place to set it, so that every derived price moves with it at once. Until this module the platform holds Quoted Prices only. It cannot put two Offers in different currencies in order, and a Part's visible Offers are ordered by how recently they were confirmed, not by price, against OFF-11.

## Solution

The Admin sets the Platform Rate on a screen of its own in the Admin console. It shows the current rate on the Rate Board's large plate, "1 $ = 1,575 IQD", with the day it was set, and a form to set a new one. A new rate takes effect on every Converted Price at the next request, and every rate ever set is kept with its time and who set it.

The API answers each of a Part's visible Offers with its Shown Price in the currency the caller asks for. A Shown Price says whether it is converted, and the Offers are ordered by it, in stock first, lowest price first. The conversion is written once, in the API, and is the same in every answer.

The Shopper app gets a currency switch in its frame, beside the language switch. It starts at IQD, and the Shopper's choice is remembered in the browser for a year. The Shopper's pages read the choice on the server. No Shopper page shows an Offer yet: `browse` builds the first ones and asks the API for prices in the chosen currency. Until then the placeholder page states the chosen currency, which proves the choice reaches the server.

## User Stories

### The Admin and the Platform Rate

1. As the Admin, I want a Platform Rate section in the Admin console's navigation, so that I can find the rate in one place.
2. As the Admin, I want the current Platform Rate shown on the screen's one leading plate as "1 $ = 1,575 IQD", so that I can read it at a glance.
3. As the Admin, I want to see the day the current rate was set beside the plate, so that I know how stale it is.
4. As the Admin, I want to type a new rate as a whole number of dinars per dollar and save it, so that I can follow the Erbil market rate.
5. As the Admin, I want the new rate to take effect on every Converted Price immediately, so that no Shopper sees prices at yesterday's rate after I change it.
6. As the Admin, I want a rate far outside any real one, such as one with a slipped digit, refused beside the field, so that one typo does not distort every price on the platform.
7. As the Admin, I want a rate that is not a whole number, or not a number at all, refused with the reason, so that I know what to fix.
8. As the Admin, I want to type the rate in Western or Arabic-Indic digits, with or without a thousands separator, so that my phone's keyboard does not stand in the way.
9. As the Admin, I want the screen to tell me plainly when no Platform Rate has been set, and what Shoppers see until it is, so that I set it before the first Vendor goes live.
10. As the Admin, I want saving a rate equal to the current one to count as setting it again, so that the day beside the plate says I checked it today.
11. As the Admin, I want the plate to show the new rate and today's date once I save, without reloading the page, so that I know the save took effect.
12. As the Admin, I want the screen usable on my phone at 360 pixels, in the light and the dark scheme, so that I can change the rate wherever I am.
13. As the Admin, I want the rate never fetched from an exchange-rate service, so that Converted Prices follow the market rate shops actually use (ADR-0002).
14. As the Admin, I want only my Login to read or set the rate through the Admin console's endpoints, so that no Vendor can change what every Shopper sees.

### What a Shopper will see

15. As a Shopper, I want a currency switch on every page, beside the language switch, so that I can choose IQD or USD wherever I am.
16. As a Shopper, I want prices in IQD on my first visit, so that I see the currency most shops in Erbil use (PRC-2).
17. As a Shopper, I want my currency choice remembered when I come back, so that I do not have to choose again.
18. As a Shopper, I want the switch to work before the page's scripts have loaded, so that it works on a slow phone connection.
19. As a Shopper, I want the switch named in my language and drawn on the end side of the header in Kurdish and Arabic as in English, so that it reads naturally in each direction.
20. As a Shopper, I want each choice of the switch large enough to tap with a thumb, so that I can use it on a phone.
21. As a Shopper, I want every Offer's price in my chosen currency, so that I can compare shops without a calculator.
22. As a Shopper, I want an Offer the Vendor quoted in my currency to show exactly what the Vendor entered, so that I see the shop's own price where there is one.
23. As a Shopper, I want an Offer quoted only in the other currency converted at the Platform Rate, so that I can still compare it.
24. As a Shopper, I want a Converted Price rounded to the nearest 250 IQD or the nearest whole dollar, so that it does not pretend to a precision it does not have.
25. As a Shopper, I want a Converted Price marked "≈", so that I know it is the platform's estimate and not the shop's quote.
26. As a Shopper, I want a very small converted price shown as at least 250 IQD or 1 $, never as 0, so that no Part looks free.
27. As a Shopper, I want a Part's Offers ordered with in-stock Offers first and then by price in my chosen currency, lowest first, so that the best place to buy is at the top (OFF-11, PRC-4).
28. As a Shopper, I want Offers compared by the prices as I see them, so that the order matches the figures on my screen even when it differs between currencies.
29. As a Shopper, I want no Offer promoted or reordered for any reason but price and stock, so that I can trust the order.
30. As a Shopper, I want an Offer still listed with its Quoted Price in the other currency when no Platform Rate exists yet, after the Offers that have a price in my currency, so that a missing rate hides nothing.

### For a Vendor

31. As a Vendor, I want my Quoted Prices kept exactly as I entered them whatever the Platform Rate does, so that a change of rate never rewrites my prices.
32. As a Vendor, I want an Offer quoted in both currencies always shown with my own price in each, so that a Shopper never sees a figure I did not quote when I quoted one.

### Groundwork for later modules

33. As the developer of `browse`, I want the Shown Price computed in the database, from a rule written once, so that a Category page can order and page Parts by their lowest price without a second copy of the conversion.
34. As the developer of `browse`, I want the chosen currency read on the server through one function in the Shopper app, so that every page asks the API in the same currency.
35. As the developer of `builder`, I want the rule for totals recorded (PRC-5), with every Shown Price saying whether it is converted, so that the totals can carry their "≈" correctly.
36. As the owner, I want every Platform Rate ever set kept with its time and who set it, so that a past Converted Price can be reconstructed later, as the Offer history allows for Quoted Prices.

### Checks and housekeeping

37. As the owner, I want the new endpoints in the OpenAPI document and the generated client, so that the frontends call them only through `api-client`.
38. As the owner, I want every new Shopper text in all three languages, so that the switch is translated from its first version (LANG-1).
39. As the owner, I want the new Admin console screen to pass Taste's inspector at 1440, 768 and 360 pixels in both schemes, as every dashboard screen now must.
40. As the owner, I want the module's conventions recorded in the MVP spec when it is finished, so that `browse` and `builder` build on them.

## Implementation Decisions

### What this module is and is not

- It covers PRC-1 to PRC-4, and the ordering by price that `offers` left for it (OFF-11). It adds no Shopper page that shows a price. The Shopper side of PRC-3 and PRC-4 is the public endpoint of a Part's visible Offers, which `browse` renders and marks with "≈". The Shopper app gets the currency switch, the remembered choice and the server-side reading of it.
- PRC-5, totals, is `builder`'s. The rule stands as the MVP spec gives it: a total is the sum of the Shown Prices, each multiplied by its quantity, and is marked "≈" when any of them is a Converted Price.
- PRC-3 in the MVP spec gains the owner's decision of 2 November 2026: a Converted Price never rounds below one step, 250 IQD or 1 $.

### The Platform Rate

- The rate is a whole number of IQD per USD, from 500 to 5,000. The limits catch a slipped digit, such as 15,750 or 157 for 1,575, and leave room for any rate the market has seen. They are checked once, in the domain, and no frontend holds a copy of them. A refusal says "The rate is outside the allowed range." without the numbers, as the Offers' limits do.
- Every setting of the rate is kept as a row in its own table: the rate, the time from the API's clock, and `set_by`, the Caller's Login identifier. The newest row is the current Platform Rate. Nothing is ever updated or deleted, so a past Converted Price can be reconstructed. Nothing in the MVP displays the history.
- Setting a rate equal to the current one adds a row, so that the day shown says when the Admin last checked it.
- Until the first row exists there is no Platform Rate. The platform works without one, and no Converted Price exists until the Admin sets it. No migration and no development service sets a rate: a person types in every Platform Rate (ADR-0002).
- The domain has `PlatformRate`, `SetPlatformRateCommand`, `ReadPlatformRateQuery` and an abstract `PlatformRateStore`, in a `platform-rate` domain folder and a matching infrastructure module, following the API's two layers, Commands and Queries, and Stores as ports (ADR-0004).

### Converting a price

- The rule is written once, in the API's domain: the IQD step (250) and the USD step (one whole dollar), with what follows. Its SQL form is one function at the Offer Store's module level, the expression for a Shown Price in a currency at a rate, read from that rule, as the expiry's moments and the visible-Offer rule already are. No frontend converts a price, holds the rate for converting, or holds the steps.
- **IQD from USD:** the USD Quoted Price in cents × the rate ÷ 100, rounded to the nearest multiple of 250, half up.
- **USD from IQD:** the IQD Quoted Price ÷ the rate, rounded to the nearest whole dollar, half up.
- **Never below one step:** a result that rounds to 0 is answered as one step, 250 IQD or 1 $.
- Every value involved is a whole number (cents, dinars, a whole rate), so the arithmetic is exact integer arithmetic, in the database as in the rule, with no binary fraction anywhere.
- A Quoted Price in the chosen currency is shown as entered: cents kept, and dinars not rounded to 250 (OFF-2, and the Offers' conventions).
- An Offer quoted in both currencies always shows its own Quoted Price in each, and is never converted.

### A Part's visible Offers

- `GET v1/parts/{partId}/offers` takes `currency`, `USD` or `IQD`, and it is required. A missing or other value is refused 400 with `NOT_VALID`, `field: 'currency'`. Nobody calls the endpoint yet, so nothing breaks. Making it required means no page can forget to send the choice.
- Each visible Offer in the answer keeps both Quoted Prices as entered and gains `shownPrice`: `{ currency, amount, converted }`, or null. `amount` is decimal text, as `usdPrice` already is: USD with two decimals ("349.99", and "350.00" for a converted 350), IQD in whole dinars ("1575000"). It is text because one field holds both currencies and cents stay exact. `shownPrice` is null only when the Offer has no Quoted Price in the chosen currency and there is no Platform Rate.
- The order: in stock first, then the Shown Price, lowest first, with Offers whose Shown Price is null after the others in their stock group, then the most recent Confirmation, then the Vendor's name, then the Offer's identifier. Offers are compared by the Shown Price as answered, rounded (PRC-4), so the order can differ between currencies.
- The Shown Price and the order are computed in the same query that reads the visible Offers, with the current Platform Rate read in that query, so that one answer never mixes two rates. The visible-Offer rule is read through `visibleOffer(now)`, as before.
- `browse`'s later queries (a Category page's lowest in-stock price, its order and its pages) and `builder`'s use the same SQL expression.

### The API's endpoints

| Endpoint | Who may call it | What it does |
|---|---|---|
| `GET v1/platform-rate` | Admin | The current Platform Rate, `{ current: { iqdPerUsd, setAt } }`, or `{ current: null }` when none has been set |
| `PUT v1/platform-rate` | Admin | Sets the Platform Rate to `iqdPerUsd`, a JSON whole number, as a new row, answering 200 with the same shape as the read |
| `GET v1/parts/{partId}/offers?currency=USD\|IQD` | Public | As `offers` built it, with `shownPrice` on each visible Offer and the order by price |

- Both rate endpoints carry `@PreAuthorize([Role.ADMIN])`, so a Vendor's token is answered 403 with `ACCESS_DENIED`, and no token is answered 401. A refused rate is answered 400 with `NOT_VALID`, `field: 'iqdPerUsd'`, and a reason: `missing`, `notANumber`, `notWhole` or `outOfRange`.
- The new table has its committed migration, and the OpenAPI document and the generated client are written again.

### The dashboard

- The Admin console gains a section, **Platform Rate**, at `/platform-rate`, with an icon from lucide, after Expiring Offers in the sections' order. The Admin console is in English only (LANG-1).
- The screen is the one the dashboard's DESIGN.md already names for the large plate: one leading plate, "1 $ = 1,575 IQD", with the day it was set beside it, and below it the form, a single field for IQD per USD and Save. It is built from the shared components (`ScreenTitle`, `Plate`, `FieldError`, `BusyLabel`) in the dashboard's Framed sheet look, and follows its motion rules, with the plate's change of figures under the No Snap Rule. If the screen needs something DESIGN.md does not say, Impeccable adds it to DESIGN.md before the screen is built.
- With no Platform Rate, the screen shows the dashboard's empty state in place of the plate: no Platform Rate yet, and until one is set, an Offer quoted in one currency is shown to Shoppers in that currency only. The form is below it.
- The field takes digits as the Offer form does, through `westernDigitsIn`, dropping separators and spaces. It refuses a value that is not a number itself as `notANumber`, and sends anything else for the API to judge.
- The form is React Hook Form's. The query is under a key of its own, `['platform-rate']`, and a save writes the answer into it so the plate changes at once.
- The screen passes Taste's inspector at 1440, 768 and 360 pixels in the light and the dark scheme.

### The Shopper app

- The **currency switch** is in the frame's header, on the end side, beside the language switch: two choices, dinars and dollars, named in the Shopper's language, the current one marked with `aria-current`, each at least 44 by 44 pixels.
- Like the language switch, each choice is a plain request to the server for the same page. The server's answer writes the choice into a cookie for a year and returns the Shopper to the page they were on, in their language. It works before any script has loaded, and Safari's seven-day limit on what a page's script writes does not apply.
- The choice is not in the page's address. A shared link opens in the recipient's own currency. The language is in the address because search engines index each language (ADR-0008), and the currency changes no page's words.
- One function in the Shopper app's shared layer reads the chosen currency on the server, IQD when there is no cookie or its value is not one of the two. Every later page asks the API in that currency.
- The placeholder page gains one line saying which currency prices are shown in. It is scaffolding like the rest of its sample, and the first real page replaces it.
- The texts are in `i18n`'s Shopper set in all three languages, the Kurdish and Arabic drafts under LANG-7, using `words.md`'s terms. The switch's names for the two currencies are added to `words.md` if they are not there.
- The switch's deep design waits for `browse`, where the Shopper app's design is planned fresh. This module builds it as plainly as the language switch, from the same theme.

### Recording

- The last ticket verifies the module from a fresh clone and records its conventions in the MVP spec, under **The pricing module's conventions**: the rate's table and limits, the conversion rule and its SQL expression, the Shown Price and its field, the order, the currency switch's cookie and the function that reads it. It also amends PRC-3 with the one-step floor, adds PRC-5's move to `builder`, adds the Platform Rate screen to the Admin console's table, and adds this module's phone checks to **Checks on a phone wait for hosting**.

## Testing Decisions

A good test here sees the platform from the outside, as the Admin, a Shopper or a later module would: through the API's HTTP surface, or through a browser. It never calls the domain's conversion directly, and it never reads the SQL expression. A test that would still pass after the rule was copied a second time, or after rounding moved from the database into the response, proves nothing about what a Shopper sees.

There are three seams, the same three as `catalog`'s, `accounts'` and `offers'`. The owner confirmed them on 2 November 2026. Tests of conversion, rounding and the "≈" flag are written before the code, as the MVP spec's testing strategy asks.

### Seam 1: the repository root, through `pnpm check`

- **Migrations.** The committed migrations make every change the schema holds, the Platform Rate's table among them.
- **The description.** The committed OpenAPI document and the generated client match the API, with the two rate endpoints and `shownPrice`.
- **The language files.** Every new Shopper text is in all three languages, with no value inside a message and no number formatting.
- **Still true.** Everything `pnpm check` proved before still passes, with Docker stopped and no browser installed.

Each line is seen to fail once, by a deliberate fault that is then reverted: a column added to the rate's schema with no migration, the `currency` parameter added without `pnpm api-client:write`, and the Arabic text of the currency switch removed.

### Seam 2: the API from the outside, over a real PostgreSQL and a real Keycloak

`pnpm integration:check`, as `offers` left it. Vendors, Parts and Offers are made through the API. The rate is set through the API as the Admin. Tokens come from the stand-in. Tables are emptied between tests, the rate's table included. Nothing is mocked but the API's clock, moved with `moveTheClockTo` where a test reads when a rate was set.

**The Platform Rate**

- With no rate set, the read answers `{ current: null }`.
- The Admin sets 1,575 and reads it back with the time from the API's clock. Setting 1,600 makes it the current one, and setting 1,600 again moves its time.
- Every setting adds one row with its rate, time and the Admin's Login identifier. The test reads the rows from the database with a helper like `offerHistoryRows()`, as the one exception to reading the platform from outside.
- 499, 5,001, 1575.5, a text and a missing rate are each refused, naming `iqdPerUsd` and the reason. 500 and 5,000 are accepted.
- A Vendor's token is refused 403 at both endpoints. No token is refused 401.

**Shown Prices and conversion**, each at a rate chosen to make the arithmetic plain:

- An Offer quoted only in USD, asked in USD, shows its Quoted Price with its cents and `converted: false`. Asked in IQD, it shows the conversion rounded to 250 and `converted: true`.
- An Offer quoted only in IQD, asked in IQD, shows its dinars as entered, not a multiple of 250, `converted: false`. Asked in USD, it shows whole dollars, `converted: true`.
- An Offer quoted in both shows its own Quoted Price in each currency, never converted, even when the rate would give a different figure.
- Rounding: exactly half a step rounds up and just below it rounds down, both ways (for example, at 1,500: 0.25 $ → 500 IQD, 0.24 $ → 250 IQD; 2,250 IQD → 2 $, 2,249 IQD → 1 $).
- The floor: a conversion that would round to 0 is one step, in each direction.
- A large price at the top of the Offers' limits converts exactly, with no rounding error.
- A change of rate changes every Converted Price on the next read, and no Quoted Price.
- With no rate, an Offer not quoted in the chosen currency answers `shownPrice: null` and keeps both Quoted Prices.
- A missing `currency`, and one that is neither `USD` nor `IQD`, are refused, naming `currency`.

**The order**

- In-stock Offers come before out-of-stock ones, whatever their prices.
- Within each group, lowest Shown Price first, compared after rounding.
- The order differs between currencies when an Offer quoted in both is compared with one converted: an Offer quoted at 100 $ and 160,000 IQD comes before one quoted at 101 $ in USD, and after it in IQD at 1,575.
- Equal Shown Prices fall back to the most recent Confirmation, then the Vendor's name, then the identifier.
- Offers with a null Shown Price come after the others in their group.
- An Expired Offer and a deactivated Vendor's Offer are still left out, as `offers` proved, with the rate set.

The existing test of the endpoint's order by Confirmation is rewritten for the order by price.

### Seam 3: the running platform, from the outside

`pnpm platform:check`, in Chromium, as the redesign left it. The development database is shared and keeps what earlier runs left, so the Admin's test sets a rate of its own and reads only that.

**The Admin console, in a window 360 pixels wide**

- The Platform Rate section is reached from the menu sheet.
- The Admin sets a rate and the plate shows "1 $ = n IQD" with today's date, with no reload.
- A rate typed in Arabic-Indic digits with a separator is saved as its value.
- A rate out of range is refused beside the field, and the plate keeps the current rate.
- The empty state for no Platform Rate, given through `page.route`, as other refusals the shared services cannot cause are, says so and still offers the form.
- `expectAccessible` passes in the light and the dark scheme.
- The plate's change of figures is filmed with `film` and judged by `snapsOf`, with reduced motion as well as without.

**The Shopper app**

- A fresh browser shows the switch with dinars current, and the placeholder says prices are in dinars.
- Choosing dollars returns to the same page with dollars current. A reload, another page and a new tab keep it. Choosing dinars again switches back.
- The switch works with JavaScript disabled.
- In Kurdish, Arabic and English, the switch is named in the page's language and sits on the end side, and each choice is at least 44 pixels each way. These checks go in `shopper-languages.spec.ts`, which runs in the languages' own browser project.
- The language switch keeps the chosen currency, and the currency switch keeps the language.

**Taste's inspector**

- `pnpm dashboard:inspect /platform-rate --scheme light|dark --app --widths 1440,768,360`, with the results in the ticket's Comments as the MVP spec's redesign conventions ask.

### The rest

- Prior art: `offers`' integration tests of a Part's visible Offers and of the Offer details' refusals for seam 2, `offerHistoryRows()` for reading the rate's rows, the Expiring Offers and Missing specifications tests for an Admin screen at seam 3, `shopper-languages.spec.ts` and `shopper-page.spec.ts` for the Shopper's frame and its remembered language, and the redesign's motion films.

## Out of Scope

- Any Shopper page that shows an Offer or a price, the "≈" drawn beside a figure, and the Shopper app's design: `browse`, which plans that design fresh.
- A Category page's lowest price per Part, and its order and pages by price: `browse`, with this module's SQL expression.
- Totals and both price views (PRC-5, BLD-7 to BLD-9): `builder`.
- Showing the history of the Platform Rate, or of any price.
- Fetching the rate from any service, or suggesting one to the Admin (ADR-0002).
- A preview of the effect of a new rate, or a confirmation dialog before saving it. The limits are the guard.
- A Vendor's own rate, a different rate per Vendor, or the rate a Vendor priced against.
- Showing Converted Prices in the Vendor portal or on the Admin's screens of Offers.
- A currency other than USD and IQD, or the currency in the page's address.
- A development Platform Rate set by `pnpm services:up`.

## Further Notes

- **Decisions this spec takes that the owner may want to revisit.** These follow the MVP spec's words where they leave room, and none is costly to change before real Vendor data exists:
  - The rate's limits, 500 to 5,000 IQD per USD, and that it is a whole number.
  - Saving the same rate again counts as setting it, and moves its day.
  - Rounding half up.
  - With no Platform Rate, an Offer not quoted in the chosen currency has no Shown Price and is ordered after the others in its stock group.
  - The chosen currency lives in a cookie and not in the address.
  - `currency` is required on the public endpoint.
  - The rate's history is kept from the first setting, though nothing shows it.
- **Success criterion 3** of the MVP spec, a USD-only Offer seen by a Shopper as "≈" dinars, is proved at the API here. It is fully true in a browser once `browse` draws a Part's page.
- **The offers module's by-hand checks** in the owner's browser, listed in its ticket 09, are still open. They do not hold this module back.
- **Next steps.** `browse` and `compatibility` come next in the build order. `browse` starts with the Shopper app's own design plan, then renders Shown Prices with their "≈" in the chosen currency through the function this module adds, and orders a Category page with this module's SQL expression.
