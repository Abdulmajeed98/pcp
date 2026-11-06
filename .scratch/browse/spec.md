# Spec: Browse

Status: ready-for-agent

This is `browse`, the sixth module in the build order of [the MVP spec](../mvp/spec.md)'s capability map, after `pricing`. It covers BRW-1 to BRW-5, and the Shopper's side of CAT-7, CAT-9, OFF-7, OFF-11 and PRC-3. This spec uses the vocabulary of [CONTEXT.md](../../CONTEXT.md) and follows [ADR-0001](../../docs/adr/0001-seed-catalog-from-buildcores-opendb.md), [ADR-0003](../../docs/adr/0003-three-apps-one-api-keycloak.md), [ADR-0004](../../docs/adr/0004-architecture-per-app.md), [ADR-0005](../../docs/adr/0005-specifications-as-one-document-per-part.md), [ADR-0006](../../docs/adr/0006-fonts-downloaded-from-our-own-server.md), [ADR-0007](../../docs/adr/0007-a-look-and-components-for-each-app.md) and [ADR-0008](../../docs/adr/0008-language-in-the-address-and-two-message-formats.md). It builds on the conventions that `languages`, `catalog`, `accounts`, `offers`, the redesign and `pricing` recorded in the MVP spec.

It is the first module to build real Shopper pages. As the owner decided on 1 November 2026, it starts with the Shopper app's own design plan, made fresh and unique to it, and every page is built to that plan.

On 3 November 2026 the owner made two decisions for this module:

- **The test seams** are the same three as `catalog`'s, `accounts'`, `offers'` and `pricing`'s, plus a fourth: unit tests of the Shopper app's own functions. It is the first unit seam in a frontend, and its runner is chosen when that work begins, as the MVP spec says of each app's libraries.
- **The made-up data for design and inspection comes from a stand-in API.** `pnpm shopper:inspect` starts the Shopper app against a stand-in API that answers the public endpoints from a made-up shop and refuses every write. The development database is not touched.

On 5 November 2026 the owner added that the app will reach beyond Erbil. Its design carries nothing particular to Erbil: its pictures stand for PCs, not a place, and a Part page's preview counts the shops that offer the Part without naming a city.

On 6 November 2026 the owner chose the Shopper app's look, the printed price list, in tickets 07 and 08. Its home page and a Part's price slip print figures that no public endpoint gave: how many Vendors and Visible Offers the platform holds, the Platform Rate, and how long an Offer stays listed. The owner chose to add one public endpoint for them, `GET v1/platform-figures` (ticket 15).

Some words need care. A **Visible Offer** is an Offer that is not an Expired Offer and whose Vendor is active (CAT-7). A **Visible Part** is a Part with at least one Visible Offer: the only Parts a Shopper ever sees. A Part's **Lowest Price** is the lowest Shown Price among its in-stock Visible Offers, in the chosen currency. A Part whose Visible Offers are all out of stock has no Lowest Price. The three terms are new, and the first ticket adds them to CONTEXT.md before any code uses them, as the MVP spec's Boundaries ask. "Category page", "Part page" and "Vendor page" are the MVP spec's own names for the three kinds of page.

## Problem Statement

A Shopper in Erbil who wants a GPU, or a CPU for a new PC, has no single place to see which local shops have it and what each one charges. Today they visit shops in the bazaar, message several on WhatsApp or Instagram, and write down prices that change by the week. They cannot tell which shop is cheapest without asking them all. They cannot see in one place what a Part's specifications are next to what it costs locally. Once they find a shop, they have to hunt for its number, its location and when it opens.

The platform already holds the catalog, the Vendors, their Offers, Confirmations and Shown Prices in both currencies, but a Shopper sees none of it. The Shopper app has only its frame, two switches, a footer and a placeholder page. Its design, Fit Diagram, was drawn before any Shopper page existed. Nothing a Shopper could search for or share is indexed, and a link pasted into WhatsApp shows no preview.

## Solution

The Shopper app gets its own design, planned fresh and chosen by the owner by eye, and four kinds of page built to it, in Kurdish, Arabic and English, phone first:

- **The home page** lists the eight Categories, each with its icon, leading to its Category page.
- **A Category page** lists the Category's Visible Parts, each with its photo or the Category's icon, name, manufacturer and Lowest Price in the chosen currency, lowest first, with Parts that are all out of stock listed last and marked so. It can be searched by name, manufacturer and part number, filtered by manufacturer, a price range and the Category's key specifications, and paged. The search, the filters and the page are in the address, so a filtered page can be linked, reloaded and shared, and it works before any script has loaded.
- **A Part page** shows the Part's name, manufacturer, part numbers, photo or Category icon and its specifications in English, and lists every Visible Offer. Each Offer shows its Vendor's name, linked to the Vendor page, its Shown Price, marked "≈" when converted, whether it is in stock, its warranty, and how many days ago it was confirmed. The Offers are ordered in stock first, then lowest Shown Price first.
- **A Vendor page** shows the Vendor's name, city, address, phone number, WhatsApp number, Instagram name and opening hours, as the Vendor wrote them. Each contact detail is a link that opens the phone's dialler, a WhatsApp chat, Instagram or Google Maps. Below them are all its Visible Offers, each linked to its Part page.

Every page is rendered on the server with a title and a description in its language, and with the tags that let WhatsApp and search engines show a preview. A Part or Vendor that is no longer visible answers the Shopper app's not-found page with a 404. A deactivated Vendor's page disappears at once (ACC-7), and so do its Offers and every Part they alone made visible.

The API gains public endpoints for what these pages read: a Category's Visible Parts with their Lowest Price, that list's filter choices, a Visible Part, a visible Vendor and a visible Vendor's Visible Offers. Every visibility rule, price, search, filter and order is computed in the API, once, from the rules `offers` and `pricing` already wrote.

## User Stories

### Finding a Category

1. As a Shopper, I want the home page to list the eight Categories with their icons and names in my language, so that I can start from the kind of Part I need.
2. As a Shopper, I want every Category on the home page to lead to its Category page, so that I can see what the shops have of it.
3. As a Shopper, I want the frame's language and currency switches on every page, so that I can change either wherever I am.
4. As a Shopper, I want the footer's credit to BuildCores OpenDB on every page, as its licence requires, so that the data's source is honoured (CAT-9).
5. As a Shopper on a 360-pixel phone, I want every page laid out for my screen first, so that I can use it with one thumb in the bazaar (LANG-8).

### A Category page

6. As a Shopper, I want a Category page to list only Parts that some active shop offers right now, so that I never chase a Part nobody sells (CAT-7).
7. As a Shopper, I want each Part on the list to show its Lowest Price in my chosen currency, so that I know what it costs at the cheapest shop that has it.
8. As a Shopper, I want the list ordered by Lowest Price, lowest first, so that the cheapest Parts come first (BRW-1).
9. As a Shopper, I want Parts that every shop has out of stock listed last and marked out of stock, so that I see what I can buy first but still know the rest exist.
10. As a Shopper, I want a Lowest Price that the platform converted marked with "≈", so that I can tell it from a price a shop quoted (PRC-3).
11. As a Shopper, I want each Part on the list to show its photo, or its Category's icon when it has none, so that I can recognise it (CAT-6).
12. As a Shopper, I want each Part's name and manufacturer shown in English in every language, so that they match what is printed on the box (LANG-3).
13. As a Shopper, I want to see how many shops offer each Part, so that I know whether I have a choice of shop.
14. As a Shopper, I want every Part on the list to lead to its Part page, so that I can compare its shops.
15. As a Shopper, I want to search a Category page by Part name, manufacturer or part number, with words in any order and any case, so that I can find "rtx 4070" or "4070 RTX" the same way (BRW-2).
16. As a Shopper, I want to filter by manufacturer, so that I see only AMD's or only Intel's CPUs.
17. As a Shopper, I want to filter by a price range in my chosen currency, so that I see only what fits my budget.
18. As a Shopper, I want the Category's key specifications as filters: socket and core count for a CPU; air or liquid and radiator size for a CPU cooler; socket, form factor and RAM type for a motherboard; RAM type, total capacity and speed for RAM; SSD or HDD, capacity and interface for storage; chipset and memory for a GPU; form factor for a case; and wattage and efficiency rating for a PSU (BRW-2).
19. As a Shopper, I want each filter to offer only the values that the Category's Visible Parts actually have, so that I never pick a value that finds nothing.
20. As a Shopper, I want to pick more than one value of one filter, such as two sockets, and find Parts that have any of them, so that I can compare options side by side.
21. As a Shopper, I want filters of different specifications to narrow the list together, so that "AM5 with 8 cores" means both.
22. As a Shopper, I want to see which filters are on and clear any one of them or all of them, so that I am never stuck on an empty list.
23. As a Shopper, I want a search or filters that find nothing to say so plainly and offer to clear them, so that an empty list is never a dead end.
24. As a Shopper, I want a Category page with no Visible Parts at all to say that no shop offers one yet, so that I can tell it from a search that found nothing.
25. As a Shopper, I want the list in pages, with the page in the address, so that a long list loads quickly and I can go back to where I was.
26. As a Shopper, I want the search, the filters and the page in the address, so that I can reload, go back, or send a filtered list to a friend.
27. As a Shopper whose phone has blocked or not yet loaded the page's script, I want the search, the filters and the paging to work all the same, so that a slow connection never stops me.
28. As a Shopper, I want switching the currency to keep my search and filters but drop a price range typed in the other currency, so that a range of dinars is never read as dollars.
29. As a Shopper, I want switching the language to keep my search, filters and page, so that I lose nothing.

### A Part page

30. As a Shopper, I want a Part page to show the Part's name, manufacturer and part numbers, so that I can be sure which model it is.
31. As a Shopper, I want the Part's photo on its page, or its Category's icon when it has none, so that I can recognise it.
32. As a Shopper, I want the Part's specifications listed with their English labels and units, in the order the catalog keeps them, so that I can check what matters to me (LANG-3).
33. As a Shopper, I want specifications the catalog does not know left out, not shown as 0 or empty, so that nothing on the page is false.
34. As a Shopper, I want every Visible Offer for the Part listed, so that I can compare every shop that has it (BRW-3).
35. As a Shopper, I want each Offer to show its Vendor's name as the Vendor wrote it, so that I know the shop (LANG-4).
36. As a Shopper, I want each Offer to show its Shown Price in my chosen currency, marked "≈" when the platform converted it, so that I compare like with like and know which figure is approximate.
37. As a Shopper, I want each Offer to say whether it is in stock, so that I do not visit a shop for nothing.
38. As a Shopper, I want each Offer to show its warranty in months, or nothing when the shop states none, so that I can weigh a cheaper Offer against a longer warranty.
39. As a Shopper, I want each Offer to say how many days ago the shop confirmed it, so that I know how fresh the price is (OFF-7).
40. As a Shopper, I want the Offers ordered in stock first and then by price, lowest first, with no Offer ever promoted, so that I can trust the order (OFF-11).
41. As a Shopper, I want each Offer's Vendor to lead to its Vendor page, so that I can find how to reach the shop.
42. As a Shopper, I want a Part page whose Part is no longer offered to say plainly that it is not found, so that an old link is not a broken page.
43. As a Shopper, I want the Part page to lead back to its Category page, so that I can keep comparing.

### A Vendor page

44. As a Shopper, I want a Vendor page to show the shop's name, city and address as the shop wrote them, so that I can find it (LANG-4).
45. As a Shopper, I want to tap the shop's phone number to call it, so that I can ask before I go.
46. As a Shopper, I want to tap the shop's WhatsApp number to open a chat with it, so that I can message it the way people in Erbil do.
47. As a Shopper, I want to tap the shop's Instagram name to open its profile, so that I can see its posts.
48. As a Shopper, I want to tap the map pin to open the shop's location in Google Maps, so that I can get directions, with no map loaded on the page itself (BRW-4).
49. As a Shopper, I want the shop's opening hours shown as the shop wrote them, so that I know when to go.
50. As a Shopper, I want a contact detail the shop has not given left out, not shown empty, so that the page shows only what is real.
51. As a Shopper, I want every one of the shop's Visible Offers listed, grouped by Category, each with its Part's name, Shown Price, in-stock status, warranty and days since Confirmation, so that I can see what else it sells.
52. As a Shopper, I want each Offer on a Vendor page to lead to its Part page, so that I can compare that Part's other shops.
53. As a Shopper, I want a Vendor page whose shop has no Visible Offers right now to say so, and still show how to reach it, so that the page is not empty.
54. As a Shopper, I want a deactivated shop's page to answer that it is not found, so that I never contact a shop that has left the platform (ACC-7).

### Links, previews and search engines

55. As a Shopper, I want a Part page's link pasted into WhatsApp to show a preview with the Part's name and a description, so that the friend I send it to knows what it is (BRW-5, success criterion 12).
56. As a Shopper, I want a link's preview in the language of the link, so that a Kurdish link previews in Kurdish.
57. As a Shopper, I want a Part's preview to show its photo when it has one, so that it is recognisable in a chat.
58. As a Shopper, I want every page to have a title and description in its language, so that a search engine lists it well.
59. As a Shopper searching Google in Kurdish, Arabic or English, I want to find the platform's page in my language, so that I land on a page I can read (ADR-0008).
60. As a Shopper, I want a preview never to show a price, so that a preview cached by WhatsApp never shows a price that has since changed.

### Prices and languages

61. As a Shopper, I want every price and number in Western digits in every language, so that prices read the same everywhere (LANG-5).
62. As a Shopper reading Kurdish or Arabic, I want the pages laid out right to left, with prices, part numbers and specifications still reading correctly, so that nothing is jumbled (LANG-2).
63. As a Shopper, I want every price on every page in my chosen currency, so that I never convert in my head (PRC-2).
64. As a Shopper, I want a price the shop quoted in my currency shown exactly as quoted, so that the platform never changes the shop's own figure (PRC-3).

### The owner

65. As the owner, I want the Shopper app's design dealt by Taste's script and rendered in the built-in browser with realistic, obviously fictional data, so that I can choose it by eye.
66. As the owner, I want the chosen design recorded in the Shopper app's DESIGN.md with a section on motion, and in an ADR where it replaces an earlier decision, so that every later Shopper page follows it.
67. As the owner, I want every Shopper page built in this module to pass Taste's inspector at 1440, 768 and 360 pixels, in both schemes and in Kurdish and English, so that what is built matches what I chose.
68. As the owner, I want the made-up data the design is judged on to stay out of the development database, so that my own data and the tests' are not mixed with it.
69. As the owner, I want Kurdish and Arabic drafts of every new Shopper text kept for my review before launch (LANG-7), so that I can have them checked.

### Later modules

70. As the `builder` module, I want the Category page's list, search, filters and order written as one public endpoint, so that the picker uses the same list with its own extra condition (BLD-2).
71. As the `builder` and `sharing` modules, I want the Shown Price drawn by one component of the Shopper app, with its "≈", so that a total and a shared Build draw prices the same way.

## Implementation Decisions

### What this module is and is not

- It covers BRW-1 to BRW-5. It is the first module in which a Shopper sees an Offer, so it also makes true in a browser what `offers` and `pricing` proved at the API: OFF-7, OFF-11, PRC-3 and success criterion 3.
- It builds no Build, picker, total or Compatibility check. Those are `compatibility`'s and `builder`'s.

### The design comes first

The Shopper app's design is planned fresh, following the principles the dashboard's redesign used and [docs/agents/design-skills.md](../../docs/agents/design-skills.md) records. Each skill leads its own area.

- **The current state is captured and critiqued first**, by Taste's redesign audit with Impeccable's `critique`: the frame, the switches, the footer and the existing [apps/shopper/DESIGN.md](../../apps/shopper/DESIGN.md), Fit Diagram, which `catalog` ticket 10 drew before any Shopper page existed. Nothing the redesign's closed tickets 14 and 15 recorded binds the new plan.
- **The directions are dealt by Taste's script**, with the page run its SKILL.md gives for public pages, never picked by an agent. Each is rendered in the built-in browser as the four kinds of page filled with the made-up shop's data, in Kurdish and English, at a phone's width and a desk's, one option to an anchor and two columns at most. The owner chooses by eye.
- **The real world of the subject** is gathered with Taste's `assets.mjs`, from open archives with their credits, as the guide says.
- **Impeccable records the choice** in the Shopper app's DESIGN.md, replacing Fit Diagram, with a section on motion led by Emil Kowalski's skills. It writes an ADR when the choice replaces part of ADR-0007, and commits the sheet as Taste dealt it under the Shopper app's design folder, as the dashboard's is.
- **The hard rules hold** against every direction: WCAG 2.2 AA in both schemes with a switch between them, 44-pixel controls on a touchscreen, 14-pixel text, 360 pixels wide, right to left, and self-hosted fonts that draw all of Sorani (ADR-0006). A direction that pulls against one is put to the owner.
- **The frame, switches and footer are rebuilt to the chosen design** before the pages are. They keep their behaviour: the language in the address, the currency in its cookie, and both switches working without script.
- **Emil leads the feel on a phone** (`mobile-native`): tap highlights, the viewport, safe areas, inputs that do not zoom, the filters used with a thumb. `break-ui` runs on each page with the made-up shop's worst cases: the longest Part name the catalog holds, a Vendor name in Arabic script beside English, a shop with no contact details but its phone, a Category with one Part, and one with 400.
- The API's public endpoints and the Shopper app's functions with no look can be built while the design is chosen. No page is built before its design is recorded.

### The stand-in API and `pnpm shopper:inspect`

- The Shopper app calls the API on the server, so the dashboard inspector's way of answering calls in the browser cannot feed it. `pnpm shopper:inspect` starts a stand-in API in `apps/inspector`, starts a Shopper app on a port of its own with `API_URL` set to the stand-in, runs Taste's `inspect.mjs` unchanged against the URL it is given, and stops both. It takes `--language`, `--scheme`, `--widths` and `--out` as `pnpm dashboard:inspect` does.
- The stand-in answers the public endpoints the Shopper app calls, and nothing else, from the made-up shop. It refuses every other request. It converts no price and judges no visibility: every price is fixed in both currencies, and it only picks and pages its fixed Parts plainly for the queries the inspection uses. No test relies on it. Its answers are typed by `api-client`'s own types, so a change to the API's description that the made-up shop does not follow fails `pnpm check`'s type checks.
- The made-up shop grows from one Vendor to several, each obviously fictional in name, with a full set of Offers across all eight Categories: quoted in USD, in IQD and in both, in stock and out of stock, confirmed today and 13 days ago, with and without a warranty, and some converted. Its Parts are real Parts of the catalog, read by Category and exact name as the dashboard's made-up shop already reads them, because no Part is invented (ADR-0001). It adds the worst cases `break-ui` needs.
- It needs the services, the API and the imported catalog for that one reading of the Parts, as `pnpm dashboard:inspect` does.

### The Shopper's addresses

Every address starts with the language, as ADR-0008 has it.

| Address | Page |
|---|---|
| `/{language}` | The home page: the eight Categories |
| `/{language}/categories/{category}` | A Category page, with `search`, the filters and `page` in its query |
| `/{language}/parts/{partId}` | A Part page |
| `/{language}/vendors/{vendorId}` | A Vendor page |

- A Category is named in the address in lower case with hyphens (`cpu`, `cpu-cooler`, `motherboard`, `ram`, `storage`, `gpu`, `case`, `psu`), mapped once in the Shopper app to the API's key for it. An unknown Category answers the not-found page with a 404.
- The query of a Category page holds `search`, `manufacturer`, `lowest` and `highest` for the price range, one parameter for each of the Category's filters, and `page`. A filter with several values repeats its parameter. Anything else in the query is ignored. A value the Category's filters do not know is dropped, never refused, so an old link still opens.
- The home page replaces the placeholder page and its sample from `connection-proof`. The address of the placeholder's API status and its line about the chosen currency go with it.
- The currency switch keeps the page's query, as `pricing` built it, except `lowest` and `highest`, which it drops, because they were typed in the other currency.

### The API's public endpoints

Each is marked `@Public()`, answers the same with a good token, a bad one or none, and is described for OpenAPI with `security: []`, as `GET v1/parts/{partId}/offers` already is. Each takes `currency`, `USD` or `IQD`, where it answers a price, and refuses a missing or other value with 400, `NOT_VALID` and `field: 'currency'`, as that endpoint does.

| Endpoint | What it answers |
|---|---|
| `GET v1/visible-parts?category&currency&search&manufacturer&lowest&highest&<filters>&page&size` | One page of a Category's Visible Parts, each with its Lowest Price or null, how many Vendors offer it, and whether any Offer is in stock, in BRW-1's order |
| `GET v1/visible-parts/filters?category&currency` | The Category's filters, each with the values its Visible Parts hold, and the lowest and highest Lowest Price |
| `GET v1/visible-parts/{partId}` | A Visible Part: its Category, name, manufacturer, part numbers, photo's path and its specifications with their labels, or 404 `NOT_FOUND` when the Part is not visible |
| `GET v1/parts/{partId}/offers?currency` | As `pricing` left it: the Part's Visible Offers with their Shown Price, in OFF-11's order |
| `GET v1/visible-vendors/{vendorId}` | An active Vendor's name, city, address, map location, phone number, WhatsApp number, Instagram name and opening hours, or 404 `NOT_FOUND` when the Vendor is deactivated or unknown |
| `GET v1/visible-vendors/{vendorId}/offers?currency&page&size` | One page of an active Vendor's Visible Offers, each with its Part's identifier, Category, name, manufacturer and photo's path, its Shown Price, in-stock status, warranty and days since Confirmation |
| `GET v1/platform-figures` | The platform's figures: how many active Vendors it has and how many Visible Offers it lists, the current Platform Rate or none, and how many days an Offer stays current without a Confirmation. When and by whom the rate was set stays the Admin's |

- The visible-Offer rule is read through `visibleOffer(now)`, the Shown Price through `pricing`'s SQL expression for a Shown Price at the current Platform Rate, and the search through the catalog's word rule: every word, in any order and any case, in the name, the manufacturer or a part number. None of them is written a second time. Each answer reads the Platform Rate once, in the same query as the rest, so that one answer never mixes two rates.
- **A Category's list** orders Parts with a Lowest Price first, lowest first; then in-stock Parts with no Lowest Price, which happens only with no Platform Rate; then Parts whose Visible Offers are all out of stock. Within each, ties fall to the Part's name, then its identifier. The page size and its limits are the catalog's paging, through `PagingRequest`.
- **The price range** compares the Lowest Price as answered, after rounding, as PRC-4 says sorting does, and both ends are included. A Part with no Lowest Price is left out whenever either end is given. `lowest` and `highest` are whole numbers in the chosen currency. A value that is not a whole number, or `lowest` above `highest`, is refused with 400, `NOT_VALID`, naming the field. The Shopper app never sends such a value: it drops what it cannot read before it asks.
- **The filters** are written once, in the API's domain, beside the specification lists: for each Category, the specifications from BRW-2's table, each named by its place in the Part's document, as the list names it, and the manufacturer. A CPU cooler's "Air or liquid" is its `water_cooled` yes-or-no. Storage's "SSD or HDD" is its drive type. Every filter is a choice among values. Several values of one filter match a Part that has any of them. Different filters must all match. A Part missing a filter's specification matches no value of that filter.
- **A filter's values** are the distinct values the Category's Visible Parts hold, before any filter or search is applied, so the choices never shift under the Shopper. Numbers are ordered by size and text alphabetically. A filter with no values is left out of the answer. The answer gives no counts.
- **The filters in the request** are refused when unknown for the Category, with 400, `NOT_VALID`, naming the parameter, because the Shopper app sends only what the filters' answer offered.
- **A Visible Part's specifications** are answered in the order of its Category's specification list, each with its English label, its value and its unit. A specification the Part does not hold is left out, and so is a stored 0 where the list says 0 means "not known". Yes-or-no values are answered as booleans, and the Shopper app words them. A Part is visible by the same rule as anywhere: an Admin's or Vendor's token gives no more.
- **A visible Vendor's Offers** are grouped by Category in the catalog's fixed order of the eight. Within each Category they are in OFF-11's order: in stock first, then lowest Shown Price, then the most recent Confirmation, then the Part's name, then the Offer's identifier.
- The OpenAPI document and the generated client are written again. No migration is needed. If a query proves slow, an index on a path of the specifications document may be added with its migration, as ADR-0005 allows.

### The Shopper app

- It follows Feature-Sliced Design as `connection-proof` and `languages` laid it out. The four pages are in the pages layer. The Part, Offer and Vendor, each with their pieces of UI, are in the entities layer. The Category page's search and filters are a feature. The frame is in the app layer. The routing folder stays thin. The import bans are written again from `tools` if a new layer or segment needs one.
- **Every page is rendered on the server for each request**, reading the language from the address and the chosen currency from its cookie through the function `pricing` added, and asking the API without a cache. Prices change by the hour and depend on the cookie, so no page is built ahead or cached by Next.js.
- **The API is called only through `api-client`**, on the server, at `API_URL`, which never reaches the browser.
- **A Part's photo** is served by the Shopper app at an address of its own that passes the API's photo through, with the API's cache headers. The browser never needs the API's address, and a preview's image is on the Shopper app's own origin.
- **The Shopper app's own public address** is a new setting, used for the canonical address, the addresses in the other languages and a preview's image. Its development default is the Shopper app's local address, port 3000. It is checked at start-up like the Shopper app's other settings, and added to `.env.example` and the MVP spec's table of settings.
- **A Shown Price is drawn by one component**: the amount in Western digits with the chosen currency's mark, as `languages` and `pricing` set them out, and "≈" before it when it is converted. The Lowest Price, the Offers on a Part page and those on a Vendor page all use it, and so will `builder`. No Shopper code converts or rounds a price.
- **Days since Confirmation** are worded in each language with the ICU plural: today, one day ago, n days ago. The API answers the number, as `offers` built it.
- **A warranty** is worded in months with the ICU plural, and left out when null.
- **Out of stock** is worded the same on a Category page and an Offer, and is never only a colour.
- **The Vendor's contact details** are drawn through the as-written component `languages` built, with the text's own direction (LANG-4). Phone numbers are `tel:` links. The WhatsApp number opens WhatsApp's chat address. The Instagram name opens its profile. The map location opens Google Maps' search for the coordinates, in a new tab. Nothing from Google is loaded on the page (BRW-4). The rules for WhatsApp's chat address and Google Maps' address are written once for both frontends, in a shared library the boundary rules allow, moved there from the dashboard. A detail the Vendor has not given is left out.
- **The search and the filters are a plain form sent with GET**, so they work before any script has loaded. Each choice is a native control, named in the page's language. With script, the design may apply a choice as soon as it is made. A price range is typed in Western or Arabic-Indic digits, read through the same reading of digits the dashboard uses, which moves to a shared library.
- **Labels.** Category names, filter names, the words for yes-or-no values, "Air" and "Liquid", and every other new text are in `i18n`'s Shopper set in all three languages, using `words.md`'s terms. The Kurdish and Arabic drafts stay for the owner's review under LANG-7. A specification's own label and value are English (LANG-3), drawn through `AlwaysEnglish`, and so are Part and manufacturer names and part numbers.
- **Previews (BRW-5).** Every page has a title and a description in its language, its canonical address, its addresses in the other two languages, and Open Graph's title, description, type, locale and, for a Part with a photo, its image. A Part page's description names the Part, its manufacturer and Category, and how many shops offer it. A Vendor page's names the shop and its city. A Category page's names the Category. No description holds a price.
- **Not found.** An unknown Category, a Part that is not visible and a Vendor that is deactivated or unknown answer the Shopper app's existing not-found page with a 404 status, in the page's language.
- **The frame** keeps the language switch, the currency switch and the footer's credit (CAT-9), rebuilt to the new design.

### Recording

- The first ticket adds Visible Offer, Visible Part and Lowest Price to CONTEXT.md.
- The last ticket verifies the module from a fresh clone and records its conventions in the MVP spec, under **The browse module's conventions**: the public endpoints and their rules, the filters' statement, the addresses and their query, the photo's pass-through, the new setting, the Shown Price component, the stand-in API and `pnpm shopper:inspect`, and the Shopper's unit seam and its runner. It adds `pnpm shopper:inspect` to the table of commands and to the design skills guide, adds this module's phone checks to **Checks on a phone wait for hosting**, and records the Shopper's design where the guide says the chosen directions are kept.

## Testing Decisions

A good test sees the platform from the outside, as a Shopper, a search engine or a later module would: through the API's HTTP surface, through a browser, or, at the fourth seam, through a function's own inputs and outputs. It never reads a query's SQL, a component's internals or the order in which the code does things. A test that would still pass after a visibility rule or the conversion was copied a second time proves nothing about what a Shopper sees.

The owner confirmed four seams on 3 November 2026. Tests of a Category page's order, the Lowest Price, the price range and the filters are written before the code, as the MVP spec's testing strategy asks of logic that could mislead a Shopper.

### Seam 1: the repository root, through `pnpm check`

- **The description.** The committed OpenAPI document and the generated client match the API, with the new public endpoints.
- **The language files.** Every new Shopper text is in all three languages, with no value inside a message and no number formatting.
- **The made-up shop.** The stand-in's fixed answers type-check against `api-client`, so a change to the description they do not follow fails here.
- **The import bans.** The Shopper app's new layers and segments keep Feature-Sliced Design's rules.
- **The Shopper's unit tests**, seam 4, run here, as every project's `test` target does.
- **Still true.** Everything `pnpm check` proved before still passes, with Docker stopped and no browser installed.

Each new line is seen to fail once, by a deliberate fault that is then reverted: a parameter added to an endpoint without `pnpm api-client:write`, the Arabic text of a filter's name removed, and a field of the made-up shop's answer misspelt.

### Seam 2: the API from the outside, over a real PostgreSQL and a real Keycloak

`pnpm integration:check`, as `pricing` left it. Vendors, Parts and Offers are made through the API, and the Platform Rate is set through it as the Admin. Tables are emptied between tests. Nothing is mocked but the API's clock, moved with `moveTheClockTo` where expiry matters.

**Visibility, for every new endpoint**

- A Part with no Offer, one whose only Offer is an Expired Offer, and one whose only Vendor is deactivated, are not listed, have no filters' values, and answer 404 as a Visible Part. Confirming the Offer again, or reactivating the Vendor, brings each back.
- A deactivated Vendor answers 404 with its Offers' list, and an unknown one does too.
- An Admin's or a Vendor's token changes nothing in any answer, and no token is needed.

**A Category's list**

- Only the asked Category's Visible Parts are listed.
- The Lowest Price is the lowest in-stock Shown Price, ignoring out-of-stock and invisible Offers, in each currency. It is marked converted when the Offer it comes from was converted.
- The order is by Lowest Price, lowest first. Parts with no Lowest Price follow: in-stock ones first, with no Platform Rate, then all-out-of-stock ones. Ties fall to the name, then the identifier.
- The order can differ between currencies, as `pricing` proved for one Part's Offers.
- The count of Vendors counts Visible Offers, in stock or not.
- The search finds by name, manufacturer and part number, with words in any order and any case, and an empty search finds all.
- The price range includes both ends, compares rounded Lowest Prices, and leaves out Parts with no Lowest Price. Refusals name `lowest` or `highest` for a value that is not whole, and for `lowest` above `highest`.
- Each of the eight Categories' filters is proved at least once on made-up Parts: two values of one filter match either, two filters must both match, and a Part missing the specification matches neither. Manufacturer is proved once.
- An unknown filter for the Category, an unknown Category, and a missing or wrong `currency` are refused, each naming its field.
- Paging answers the page's size and the total, as the catalog's paging does.

**A Category's filters**

- Each filter's values are the distinct values its Visible Parts hold, ordered by size or alphabetically, and nothing from an invisible Part.
- A filter none of the Visible Parts holds a value for is left out.
- The price range's ends are the lowest and highest Lowest Price in the asked currency, and are null with no Lowest Price.

**A Visible Part**

- It answers its specifications in its list's order with labels and units, leaving out a specification it does not hold and a 0 that means "not known".

**A visible Vendor and its Offers**

- The Vendor answers its contact details, with null for each one it has not given, and never its Login phone number.
- Its Offers are grouped by the catalog's order of Categories, and are in OFF-11's order within each. Each has its Shown Price in the asked currency, and Expired Offers are left out.

**The platform's figures**

- With no Vendor, no Offer and no rate, it answers zero, zero, none and the days an Offer stays current.
- A deactivated Vendor and its Offers are not counted, nor is an Expired Offer. Reactivating the Vendor, or confirming the Offer again, counts them again.
- The rate is none until one is set, and then the latest one set. The answer never says when it was set or by whom.

Prior art: `offers`' and `pricing`'s integration tests of a Part's Visible Offers, with their refusals and their orders; the catalog's tests of its search and its paging.

### Seam 3: the running platform, from the outside

`pnpm platform:check`, in Chromium. The development database is shared and keeps what earlier runs left, so each test makes its own made-up Vendor, made-up Parts with names unique to the run, and Offers through the API, sets the Platform Rate it needs, and finds its own rows by searching for its Parts' names, as the end-to-end guide now says.

**In a window 360 pixels wide, in Kurdish and in English**

- The home page lists the eight Categories, and each leads to its Category page.
- A Category page lists the test's Parts by Lowest Price, an all-out-of-stock Part last and marked, and a converted Lowest Price with "≈".
- A search and a filter narrow the list, the address holds them, a reload keeps them, and clearing them restores the list. With script disabled the same search and filter work.
- A search that finds nothing says so and offers to clear it.
- Switching the currency keeps the search and drops the price range. Switching the language keeps both.
- A Part page shows the Part, its specifications in English, and its Offers in OFF-11's order, with "≈", in-stock status, warranty and days since Confirmation. Its Vendor leads to the Vendor page.
- A Vendor page shows its contact details as links with the right addresses, and its Offers lead to their Part pages.
- A Part made invisible by deactivating its only Vendor answers the not-found page with a 404, and so does the Vendor's page.
- Kurdish and Arabic pages are right to left, and every price is in Western digits.

**Previews**

- A Part page's HTML holds its title, description, canonical address, the other two languages' addresses and Open Graph's tags, its image when the Part has a photo, and no price, read as a crawler would, with no cookie.

**Accessibility and motion**

- `expectAccessible` passes on each page in the light and the dark scheme.
- Motion the design adds is filmed with `film` and judged by `snapsOf`, with reduced motion as well as without.

**Taste's inspector**

- `pnpm shopper:inspect` on each of the four pages, in both schemes, in Kurdish and English, at 1440, 768 and 360 pixels. The results go in the ticket's Comments as the MVP spec's redesign conventions ask: every FAIL fixed, every WARN fixed or defended.

The existing `shopper-page.spec.ts` of the placeholder is rewritten for the home page. `shopper-currency.spec.ts`, `shopper-languages.spec.ts` and `shopper-credit-languages.spec.ts` keep passing against the rebuilt frame.

Prior art: `shopper-currency.spec.ts` and `shopper-languages.spec.ts` for the frame and its switches, `admin-missing-specifications.spec.ts` for opening a made-up Part's page, `vendors.ts` and `offers.ts` for making made-up Vendors and Offers, `currencies.ts` for setting a rate, and the redesign's motion films.

### Seam 4: the Shopper app's own functions

The owner added this seam on 3 November 2026. It is the first unit seam in a frontend.

- **The runner** is chosen by the ticket that starts the seam. It reads Next.js's current documentation on testing and the runners it supports, and puts the most widely used one that fits an Nx project in this workspace to the owner, as the owner has chosen every library so far. The runner runs through the Shopper app's `test` target, so `pnpm check` runs it.
- **What it tests** is plain functions of the Shopper app, called with their inputs and judged by their outputs:
  - reading a Category page's query: a Category's search, filters, price range and page read from the address, with unknown parameters, values the filters do not know and unreadable ranges dropped, and Arabic-Indic digits read;
  - writing a Category page's address back from a set of choices, including clearing one choice and clearing all;
  - the currency switch's address dropping `lowest` and `highest` and keeping the rest;
  - a Shown Price as drawn in each language and currency, with and without "≈", in Western digits;
  - days since Confirmation and a warranty worded in each language;
  - the links out: a phone number's and Instagram's addresses (WhatsApp's and Google Maps' are the shared library's);
  - a page's preview: title, description and tags in each language, with no price.
- **What it does not test**: server components, pages, the API and anything the browser draws. Seams 2 and 3 cover them.
- A function tested here is tested through the module's public face, never through a helper it uses.

## Out of Scope

- A Build, the picker, totals and both price views: `builder`. The Category page's endpoint is written so the picker can reuse it, but no picker condition is added here.
- Compatibility Rules and anything that judges whether Parts fit: `compatibility`.
- Shared Builds, the "send on WhatsApp" button and Referrals: `sharing`.
- A search across all Categories at once, from the home page or the frame.
- Sorting a Category page by anything but price, or a choice of sort.
- Counts beside a filter's values, and values that narrow as other filters are chosen.
- A list of all Vendors, or a map of them.
- Ranges on specifications, such as "6 to 12 cores": every specification filter is a choice among values.
- A sitemap, `robots.txt` beyond what Next.js gives, structured data for search engines, and an analytics service.
- An embedded map, or anything loaded from Google (BRW-4).
- Price history on any page.
- A Part's specifications in Kurdish or Arabic (LANG-3).
- Names of Parts or Categories in the address, beyond the Category's own key.
- Caching pages at Next.js or at Cloudflare: hosting.
- Any change to the dashboard beyond moving a shared rule (the WhatsApp chat address, the reading of digits) into a shared library.

## Further Notes

- **Decisions this spec takes that the owner may want to revisit.** These follow the MVP spec's words where they leave room, and none is costly to change:
  - A Part with all Offers out of stock shows no price on a Category page, only "out of stock", and a price range leaves it out.
  - The Category page shows how many shops offer each Part.
  - Every specification filter is a choice among the values present, with no counts, not narrowed by the other filters.
  - The currency switch drops a price range rather than converting it.
  - A Vendor page's Offers are grouped by Category, in OFF-11's order within each.
  - Previews hold no price.
  - The addresses use `categories/`, `parts/` and `vendors/` with identifiers, not names.
- **Success criteria.** This module makes criterion 3 true in a browser: a USD-only Offer seen in IQD with "≈". It makes criterion 12 true for a Part page; a shared Build's preview is `sharing`'s. It adds the Shopper's pages to criterion 13.
- **Open checks.** The `offers` module's checks in the owner's browser, listed in its ticket 09, are still open and do not hold this module back. This module's checks on a phone wait for hosting, as every module's do: the pages used with a thumb in Kurdish and in English, the filters with the phone's keyboard, the contact links opening the dialler, WhatsApp, Instagram and Google Maps, a Part page's link previewed in the WhatsApp app, and the motion felt with reduced motion on and off.
- **LANG-7.** The Kurdish and Arabic texts this module adds join the review that stays open until launch.
- **Next steps.** `compatibility` can start beside or after this module. `builder` follows both, reusing the Category page's endpoint and the Shown Price component.
