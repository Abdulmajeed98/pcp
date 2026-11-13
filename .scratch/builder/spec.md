# Spec: Builder

Status: resolved

This is `builder`, the eighth module in the build order of [the MVP spec](../mvp/spec.md)'s capability map, after `browse` and `compatibility`. It covers BLD-1 to BLD-9, PRC-4's choice of the cheapest Offer, PRC-5's totals, the Shopper's side of CMP-2 to CMP-5, and success criteria 5 and 6. This spec uses the vocabulary of [CONTEXT.md](../../CONTEXT.md) and follows [ADR-0003](../../docs/adr/0003-three-apps-one-api-keycloak.md), [ADR-0004](../../docs/adr/0004-architecture-per-app.md), [ADR-0005](../../docs/adr/0005-specifications-as-one-document-per-part.md), [ADR-0008](../../docs/adr/0008-language-in-the-address-and-two-message-formats.md) and [ADR-0013](../../docs/adr/0013-the-shopper-apps-look-is-the-printed-price-list.md). It builds on the conventions that `languages`, `catalog`, `accounts`, `offers`, the redesign, `pricing`, `browse` and `compatibility` recorded in the MVP spec.

On 8 November 2026 the owner confirmed the test seams. They are the four that already exist: `pnpm check`, the API from the outside over a real PostgreSQL, the running platform in a browser, and the Shopper app's own functions. There is no new seam. The compatibility library's own seam is left as it is, because this module adds no rule: it hands the library real Builds and shows what it answers.

Some words need care. A **Build**, a **Complete Build**, **Compatible** and the **Estimated power draw** mean what CONTEXT.md says. "The picker", "the Build page", "the first price view" and "the second price view" are the MVP spec's own names. BLD-9's Part that "no longer has an in-stock visible Offer" needs a term of its own, because CONTEXT.md tells us to avoid "available part" as a name for a Visible Part, so "unavailable" would blur the two. The first ticket adds **Unstocked Part** to CONTEXT.md before any code uses it: a Part in a Build that no Vendor has in stock among its Visible Offers, whether or not it is still a Visible Part. A Part's **Lowest Price** keeps its meaning, so the first price view's "cheapest in-stock Offer" for a Part is the Offer its Lowest Price comes from.

## Problem Statement

A Shopper can now find a Part, see which Vendors offer it and what each charges, but cannot plan a whole PC. Nothing keeps the Parts they have settled on, so they write them down and go back to each Part page to compare. Nothing tells them whether the CPU, the motherboard, the RAM, the case and the PSU they have picked work together. The 21 Compatibility Rules exist in a library that no page calls, and the Shopper is left to compare sockets, lengths and connectors by hand. Nothing adds up what the Build costs, either at the cheapest Vendor for each Part or at a single Vendor that could sell most of it, so the Shopper cannot tell whether buying everything from one shop costs much more than visiting four. They cannot tell either whether their list is a whole PC or still lacks a PSU.

## Solution

The Shopper app gets two new kinds of page, in Kurdish, Arabic and English, phone first, in the printed price list's look:

- **The Build page** shows the Shopper's Build: each of the eight Categories with the Part or Parts chosen for it, or a way to choose one. It says whether the Build is a Complete Build and, if not, which Categories it still needs. It lists every Compatibility Problem, every Compatibility Warning and every unchecked rule, in words that name the Parts involved, and never stops the Shopper from keeping an incompatible Build. It shows the Estimated power draw. It shows both price views. The first gives the Lowest Price of each Part and the Vendor it comes from, with the total across Vendors as the headline. The second lists each Vendor that has any of the Build's Parts in stock, with that Vendor's total for the Parts it has and the Parts it lacks. An Unstocked Part is shown as such and left out of every total.
- **The picker** lists a Category's Parts that some Vendor has in stock, lowest price first, with the Category page's search and filters. It hides Parts that are not Compatible with the Build so far, and a switch shows them all, marking the incompatible ones. Picking a Part puts it in the Build: it replaces the Build's Part for a Category that holds one, and adds a RAM kit or a drive beside the others.

The Build is kept in the Shopper's browser, so it is still there when they come back. Every page that shows it is drawn on the server for each request and works before any script has loaded. The frame leads to the Build page from every page.

The API gains one public endpoint that reads a Build: its Parts, both price views, whether it is complete, every rule's outcome and the Estimated power draw. All of it is computed in the API, from the rules `offers`, `pricing`, `browse` and `compatibility` already wrote. The Category list's endpoint gains the picker's conditions: in stock only, and Compatible with a given Build.

## User Stories

### Starting a Build

1. As a Shopper, I want a way to my Build from every page, so that I can go back to it while I browse.
2. As a Shopper, I want to see how many Parts my Build holds from the frame, so that I know whether I have started one.
3. As a Shopper with no Build yet, I want the Build page to show the eight Categories, each with a way to choose a Part, so that I know where to begin.
4. As a Shopper, I want the Categories on the Build page in the catalog's order, so that the Build reads the same way as the home page.

### Picking Parts

5. As a Shopper, I want to choose a Part for a Category from a list of Parts that some Vendor has in stock, so that I only pick what I can buy in a local shop (BLD-2).
6. As a Shopper, I want the picker's Parts ordered by Lowest Price, lowest first, in my chosen currency, so that the cheapest options come first (BLD-2, PRC-4).
7. As a Shopper, I want to search the picker by name, manufacturer and part number, as on a Category page, so that I can find a Part I already know.
8. As a Shopper, I want the picker's filters to be the Category page's filters, so that I narrow it the way I have learned.
9. As a Shopper, I want the picker's filters to offer only values that Parts in stock hold, so that a choice does not lead to an empty list.
10. As a Shopper, I want the picker's search, filters and page kept in its address, so that a reload keeps them.
11. As a Shopper, I want to see each Part's photo or its Category's icon, its name, its manufacturer and its Lowest Price in the picker, so that I can tell Parts apart.
12. As a Shopper, I want to open a Part's page from the picker, so that I can read its specifications and every Offer before I pick it.
13. As a Shopper, I want the Part already in my Build marked in the picker, so that I can see what I would replace.
14. As a Shopper, I want picking a CPU, CPU cooler, motherboard, GPU, case or PSU to replace the one my Build holds, so that a Build never holds two of them (BLD-1).
15. As a Shopper, I want picking a RAM kit or a drive to add it beside the others, or add one more of it if my Build already holds it, so that I can put several in one PC (BLD-1).
16. As a Shopper, I want to go to my Build page after picking a Part, so that I see at once what it changed.
17. As a Shopper, I want to change how many of a RAM kit or a drive my Build holds, so that two identical kits do not have to be picked twice.
18. As a Shopper, I want to remove any Part from my Build, so that I can change my mind.
19. As a Shopper, I want to empty my whole Build after confirming once, so that I can start a new PC without removing each Part.
20. As a Shopper, I want the picker to tell me apart a Category no Vendor has in stock, a search that found nothing, and a list where every Part is incompatible, so that I know what to change.
21. As a Shopper whose Build holds as many kits or drives as the platform keeps, I want to be told I cannot add another, so that a pick is never lost without a word.

### Compatibility in the picker

22. As a Shopper, I want the picker to hide the Parts that would cause a Compatibility Problem with my Build so far, so that I pick from Parts that fit (BLD-3).
23. As a Shopper, I want a switch that shows every Part, so that I can still pick one the rules say will not fit (BLD-3).
24. As a Shopper with the switch on, I want each incompatible Part marked as not Compatible with my Build, so that I know which ones the rules would have hidden.
25. As a Shopper, I want a Part that only causes a Compatibility Warning, or that a rule cannot check, to stay in the picker, so that missing data does not hide Parts that may fit (CMP-4).
26. As a Shopper replacing a Part, I want the picker to judge each candidate in place of the one my Build holds, so that my current CPU does not make every other CPU look incompatible.
27. As a Shopper adding a RAM kit or a drive, I want the picker to judge it as one more beside what my Build holds, so that a kit that would exceed my motherboard's slots is hidden.
28. As a Shopper with an empty Build, I want the picker to show every Part in stock, so that the first pick is free.

### The Build page: compatibility

29. As a Shopper, I want every Compatibility Problem in my Build listed, in words that name the Parts involved, so that I know what to replace (BLD-4).
30. As a Shopper, I want every Compatibility Warning listed apart from the Problems, saying what the Build needs to work, so that I know about the adapter or the extra socket (BLD-4).
31. As a Shopper, I want every rule that could not be checked listed, naming the Part and the specification it lacks, so that I never take an unchecked rule as passed (CMP-3).
32. As a Shopper, I want to be told how many rules were checked and passed, so that I know the Build was judged.
33. As a Shopper, I want to keep an incompatible Build, so that the platform informs and never forbids (BLD-4).
34. As a Shopper, I want Part names and specification names in English in every language, so that they match the box and the shop's list (LANG-3).
35. As a Shopper, I want my Build's Estimated power draw shown, or the Part whose TDP is missing, so that I can judge the PSU myself (CMP-5).
36. As a Shopper, I want a rule judged only when my Build holds the Parts it involves, so that an unfinished Build is not buried in outcomes that do not apply yet (CMP-2).

### The Build page: is it complete?

37. As a Shopper, I want to be told whether my Build is a Complete Build, so that I know I have a whole PC (BLD-5).
38. As a Shopper, I want the Categories my Build still needs listed, so that I know what is left to choose (BLD-5).
39. As a Shopper whose CPU has integrated graphics, I want my Build to count as complete without a GPU, so that I am not pushed to buy one I do not need.
40. As a Shopper whose CPU comes with a cooler, I want my Build to count as complete without a CPU cooler, for the same reason.
41. As a Shopper whose CPU does not say whether it has graphics or a cooler, I want the GPU or the cooler counted as needed, with a line saying why, so that the platform does not guess in my favour.
42. As a Shopper, I want a Build of any size, even one Part, to be kept, so that I can come back to it unfinished (BLD-5).

### The Build page: prices

43. As a Shopper, I want each Part shown with its Lowest Price, times its quantity, and the Vendor it comes from, so that I know where to buy each Part cheapest (BLD-7).
44. As a Shopper, I want the sum of those prices shown as the Build's headline total, so that I know the least the PC costs across shops (BLD-7, PRC-5).
45. As a Shopper, I want a total that includes any Converted Price marked "≈", so that I know it is approximate (PRC-5).
46. As a Shopper, I want each Vendor that has any of my Parts in stock listed with its own total for the Parts it has and the Parts it lacks, so that I can buy the most from one shop (BLD-8).
47. As a Shopper, I want the Vendors that lack the fewest Parts first, then the cheapest, so that the shop I would visit first comes first (BLD-8).
48. As a Shopper, I want each Vendor's name to lead to its Vendor page, so that I can find its address and number.
49. As a Shopper, I want an Unstocked Part shown as one that no Vendor has in stock, and left out of every total, so that a total never counts a price I cannot pay (BLD-9).
50. As a Shopper, I want an Unstocked Part listed once, not as missing under every Vendor, so that the Vendor list stays readable.
51. As a Shopper, I want every price and total to follow my chosen currency and switch with it, so that I compare in one currency (PRC-2, PRC-4).
52. As a Shopper, I want prices read fresh each time I open the page, so that a total never shows a price that has since changed.
53. As a Shopper, I want no Vendor promoted, highlighted or moved up for payment in either price view, so that I can trust the order (OFF-11).

### Keeping the Build

54. As a Shopper, I want my Build kept in my browser and still there when I come back, so that I can plan over several days (BLD-6).
55. As a Shopper, I want my Build kept when I switch language, currency or scheme, so that a switch never loses work.
56. As a Shopper, I want the picker and the Build page to work before any script has loaded, as every Shopper page does, so that a slow phone on a weak connection can still build.
57. As a Shopper, I want a Part that has left the catalog dropped from my Build without an error, so that an old Build still opens.

### Phones and languages

58. As a Shopper on a phone 360 pixels wide, I want the picker and the Build page usable with a thumb in each language, so that I can build on the phone I own (LANG-8, success criterion 5).
59. As a Shopper reading Kurdish or Arabic, I want the Build page laid out right to left, with every number in Western digits, so that it reads like the rest of the site (LANG-2, LANG-5).
60. As a Shopper, I want every compatibility outcome worded in my language, with the Part names left in English, so that I understand it (LANG-1, LANG-3).

### The owner

61. As the owner, I want the Build page and the picker designed in the printed price list's look, with the options for their new pieces rendered and chosen by eye, so that the Shopper app stays one object.
62. As the owner, I want the Kurdish and Arabic texts of this module drafted and kept for my review before launch (LANG-7).
63. As the owner, I want this module's phone checks recorded as waiting for hosting, so that they do not hold the module back.

### Later modules

64. As the developer of `sharing`, I want one endpoint that reads any Build of Part identifiers and quantities, so that a shared Build's page reads its frozen copy the same way (SHR-2).
65. As the developer of `sharing`, I want the second price view built so that a "send on WhatsApp" button can be added to each Vendor (SHR-5).

## Implementation Decisions

### What this module is and is not

- It covers BLD-1 to BLD-9, PRC-4's choice of the cheapest Offer and PRC-5's totals, and makes CMP-2 to CMP-5 true for a Shopper. It makes success criteria 5 and 6 true in a browser.
- It adds no Compatibility Rule and changes none. It does not change the power formula, the 14-day expiry or the rounding of Converted Prices, each of which the MVP spec's Boundaries leave to the owner.
- It shares no Build, stores no Build on the platform, and sends nothing on WhatsApp. Those belong to `sharing`.

### The design comes first

- The Build page and the picker are new kinds of page that [the Shopper app's DESIGN.md](../../apps/shopper/DESIGN.md) does not describe. The look stays the printed price list (ADR-0013), and no new direction is dealt. As the browse module's conventions ask, Impeccable adds what DESIGN.md lacks before anything is built: the Build page as a sheet of the same stationery, its two price views, its list of outcomes, its status and the picker's switch and pick control.
- Each skill leads its own area, as [the design skills guide](../../docs/agents/design-skills.md) records. Taste leads the composition of the new pieces inside the chosen direction. Impeccable writes DESIGN.md and leads the copy of the outcomes, right to left and accessibility. Emil Kowalski's skills lead the motion, such as a Part arriving in the Build, a quantity changing and a total settling, and the feel on a phone. `break-ui` runs on both pages with the worst cases below.
- The options for each new piece are rendered in the built-in browser with the made-up shop's data, in Kurdish and English, at a phone's width and a desk's, one option to an anchor and two columns at most. The owner chooses by eye. Fit Diagram's idea of a Build drawn like a motherboard manual, which ADR-0013 records as `builder`'s, binds nothing.
- The hard rules hold. A piece that pulls against one is put to the owner. An ADR is written only if a choice replaces part of ADR-0013.
- The API's endpoint and conditions, and the Shopper app's functions with no look, can be built while the design is chosen. No page is built before its design is recorded.

### The Build in the Shopper's browser

- **The Build is kept in a cookie**, `build`, for a year, written as the currency and the scheme are, so that the server reads it before drawing a page and the Build page works before any script has loaded. The cookie holds each Part's identifier under its Category and, for a RAM kit or a drive, its quantity. It never holds a name, a price or a specification: those are read from the API for each request, so a Build never shows a price that has since changed.
- **One Build per browser** (BLD-6). Picking a Part for the CPU, CPU cooler, motherboard, GPU, case or PSU replaces the Build's Part of that Category. Picking a RAM kit or a drive adds it with a quantity of one, or adds one to its quantity when the Build already holds it.
- **The limits** keep the cookie small: at most 8 different RAM kits and 8 different drives, each with a quantity from 1 to 16. A pick past a limit is not applied, and the page says why. The API refuses a Build past the same limits.
- **A cookie that cannot be read is never refused.** Each entry that cannot be read is dropped: an identifier that is not one, a quantity out of range, a Category that is not one of the eight, a second Part for a Category that holds one, and a Part repeated. The Build is what could be read. A Part the catalog no longer holds is left out of the API's answer, so its Category shows as not chosen, and the cookie forgets it at the next change.
- **Every change is a plain form sent with POST** to an address under `/{language}/build/`, answered 303 with the Build page, as the switches' forms are: pick, change a quantity, remove, and empty. Emptying asks to confirm once, since nothing brings a Build back. With script, the design may apply a change in place.
- The cookie is the Shopper app's alone. The Shopper app's server reads it and sends the Build to the API as the endpoint's query. The browser never calls the API.

### The Shopper's addresses

| Address | What it is |
|---|---|
| `/{language}/build` | The Build page |
| `/{language}/build/{category}` | The picker for a Category, with the Category page's query and the switch's parameter when it shows every Part |
| `/{language}/build/…` with `POST` | The forms that pick, change a quantity, remove and empty, each answered 303 |

- A Category in the picker's address is written as on a Category page (`cpu`, `cpu-cooler`, …). An unknown one answers the not-found page with a 404.
- **The picker's query is the Category page's query**, read and written by the same functions of the `search-parts` feature, with one more parameter for the switch. The address holds only what is on, as a Category page's does.
- The language, currency and scheme switches keep the Build, which is in its cookie, and the picker's query, as they keep a Category page's.
- **The frame** gains a way to the Build page on every page, with how many Parts the Build holds. It is a small, additive change to the `frame-header` widget, as the browse module's conventions allow.
- **The Build page and the picker are not indexed.** Each depends on the cookie, so each is marked for search engines not to index, and its preview is plain: a title in the page's language, with no Part and no price. A shared Build's preview is `sharing`'s.

### The API: reading a Build

`GET v1/build?currency&part=…` reads a Build that it is given and stores nothing. It is `@Public()`, carries `security: []`, and answers the same with a good token, a bad one or none. `currency` is required and refused as `pricing` refuses it. `part` is repeated: each value is a Part's identifier, followed for a RAM kit or a drive by `:` and its quantity. The API knows each Part's Category from the catalog. With no `part`, it reads an empty Build.

It answers:

- **The Parts**, in the catalog's order of Categories and then in the Build's order. Each has its summary (identifier, Category, name, manufacturer, part numbers and photo's path), its quantity when it is a kit or a drive, whether it is a Visible Part, so that the Shopper app links only a Visible Part to its Part page, and its Lowest Price with the Vendor of the Offer it comes from, or none when it is an Unstocked Part.
- **The first price view's total**: each Part's Lowest Price times its quantity, added up, marked converted when any of them is a Converted Price, and leaving out Unstocked Parts. It is none when no Part has a Lowest Price.
- **The second price view**: each active Vendor with an in-stock Visible Offer for at least one of the Build's Parts. Each Vendor has its identifier and name, the Parts it has in stock with each Shown Price, its total (each Shown Price times its quantity, marked converted when any is converted), and the Parts it lacks. The Parts it lacks are the Build's Parts that other Vendors stock and it does not. An Unstocked Part is in no Vendor's list. The Vendors are ordered by how many Parts they lack, fewest first, then by their total, lowest first, then by name, then by identifier.
- **Whether it is a Complete Build**, and the Categories it still needs, in the catalog's order.
- **Every rule's outcome**, as `judgeBuild` answers it, passes included, in rule order. Each names its Parts by their identifiers. An unchecked rule names each missing specification by its Part, its path and its English label from the Part's Specification list, so that the Shopper app can name it in English (LANG-3).
- **The Estimated power draw**, as `estimatedPowerDrawOf` answers it: the watts, the Parts whose TDP is missing, or none for a Build without a CPU.

The endpoint follows these rules:

- **One statement, one moment.** The Shown Prices, both views and the visibility of every Offer are read at one Platform Rate, taken once in the statement that reads them, as every public read that answers a price does. The visible-Offer rule, the Shown Price, the Lowest Price and OFF-11's order of a Part's Offers are read through the rules `browse` wrote once and never written a second time. So the Offer behind a Part's Lowest Price is the one its Part page lists first. Adding up the totals and ordering the Vendors are new, and are written once in the API's domain. The Shopper app converts, rounds, adds and compares nothing.
- **Totals add Shown Prices as answered**, after rounding, as PRC-5 says. A Part whose first in-stock Offer has no Shown Price, which happens only before the first Platform Rate with an Offer quoted only in the other currency, has no Lowest Price. It is left out of the total, and the answer says that a price could not be shown.
- **Refusals**, each 400 `NOT_VALID` naming `part`: a value that is not an identifier; a quantity on a Part that is not a kit or a drive; a quantity outside 1 to 16; a kit or a drive with no quantity; two Parts of a Category that holds one; one Part given twice; and more than 8 different kits or drives. The Shopper app never sends any of them.
- **Unstocked and invisible Parts are still judged.** They stay in the Build until the Shopper removes them, so the rules read them like any other Part.

### Handing a stored Part to the rules

- The compatibility module's conventions leave this function to `builder`. The API reads each Part's needed specifications, the paths `neededSpecificationsOf` answers for its Category, from its document, and leaves out every value its Specification list counts as missing, through `Specification.isMissingIn`, a field of a row included. The library is never given a value the catalog counts as not known. This function is written once, in the API, and both the Build's reading and the picker use it.
- It reads the specifications of the Build's Parts and of the picker's candidates, and nothing else of the catalog.

### Whether a Build is a Complete Build

- A Build is a Complete Build when it holds a CPU, a motherboard, at least one RAM kit, at least one drive, a case and a PSU, plus a GPU unless the CPU has integrated graphics, and a CPU cooler unless the CPU includes one (CONTEXT.md, BLD-5).
- A CPU **has integrated graphics** when its Integrated graphics specification is held and is not "None", as OpenDB writes a CPU without them. It **includes a cooler** when its "Cooler included" specification is yes. A CPU missing either specification counts as not providing it, so the GPU or the cooler stays needed, and the answer says the CPU's value is not known so the page can say why. On 8 November 2026 every one of the 774 imported CPUs holds both values: 365 have integrated graphics and 237 include a cooler.
- Without a CPU, the GPU and the CPU cooler are counted as still needed.
- Neither specification is a needed specification, since no rule reads it, so Missing specifications does not ask for them. The rule is written once, in the API's domain, beside the Build's reading.

### The picker's conditions on `GET v1/visible-parts`

`browse` wrote the Category list's endpoint for the picker to reuse. This module adds its conditions, and a Category page that sends none of them is answered exactly as before.

- **In stock only** (BLD-2): a parameter that keeps only the Visible Parts with at least one in-stock Visible Offer. The order stays BRW-1's, with a Lowest Price first and lowest first. The filters' endpoint takes the same parameter, so the picker's choices are the values its in-stock Parts hold, still before any choice is made, so that they never shift.
- **Compatible with a Build** (BLD-3): the Build, given in `part` as `GET v1/build` takes it and refused as it refuses it. Each Part in the list answers whether it is Compatible with the Build, through the library's `isCompatible`, which puts a Part of a single Category in place of the Build's Part and adds a kit or a drive beside the others. Parts that are not Compatible are left out, unless the switch's parameter asks to keep them. A Compatibility Warning or an unchecked rule leaves a Part in the list (CMP-4).
- **Paging comes after judging.** The page and the total count only the Parts kept, so the Store reads every Part that matches the search, the filters, the price range and the stock condition, in order, with its needed specifications. The domain judges each Part, and then the list is paged through the same paging. A page past the end still answers its total. The speed is measured against the development database, as `browse` measured its list, which holds thousands of made-up Parts from earlier runs. If it proves slow, the measurement goes to the owner before anything is cached or indexed.
- Without a Build, no Part answers whether it is Compatible.

### What the Build page says

- **The eight Categories**, in the catalog's order, each with its Part or Parts or a link to the picker. A Part shows its name, manufacturer, photo or its Category's icon, and, for a kit or a drive, its quantity with a form to change it. Every Part has a form to remove it. A Visible Part links to its Part page.
- **The status**: a Complete Build, or the Categories still needed, each linking to its picker.
- **The outcomes**: Compatibility Problems first, then Compatibility Warnings, then unchecked rules, each group in rule order, and a line saying how many rules passed. Each outcome is worded for its rule in the page's language and names its Parts in English. An unchecked rule names each missing specification by its English label. The words for each rule and each outcome it can have are plain functions in the Shopper app, and a type check fails `pnpm check` until every rule's every outcome is worded, as a new filter's name does. The words say what fails and name the Parts, without the values compared.
- **The Estimated power draw**, or the Part whose TDP is missing.
- **The first price view**: each Part with its Lowest Price times its quantity, drawn by `ShownPrice`, the Vendor it comes from linked to its Vendor page, and the total as the page's headline, with "≈" when converted. An Unstocked Part says that no Vendor has it in stock, which is never shown by colour alone.
- **The second price view**: each Vendor with its total, the Parts it has and the Parts it lacks, in the API's order, each Vendor's name linked to its Vendor page.
- **Words.** Every new text is in the `i18n` library's Shopper set in all three languages, using `words.md`'s terms. The Kurdish and Arabic drafts wait for the owner's review under LANG-7. Part names, manufacturer names and specification labels are drawn in English (LANG-3).
- **An API that does not answer**: the page shows the frame and the sheet saying it cannot be read just now, with Try again, as the other Shopper pages do. The Build stays in its cookie.

### The stand-in API and `pnpm shopper:inspect`

- The stand-in answers `GET v1/build` and the picker's conditions from the made-up shop, so that the new pages can be inspected and shown to the owner without the development database. It judges with the compatibility library itself, so it copies no rule, and it adds up its fixed prices plainly, as it already states OFF-11's order. Its one reading of the catalog also reads its Parts' needed specifications and the two specifications a Complete Build reads.
- `pnpm shopper:inspect` gains a way to open a page with a made-up Build in its cookie. The made-up Builds are an empty one; a Complete Build with no Problem; and the worst case: a Problem, a Warning and an unchecked rule together, 8 kits and 8 drives, the catalog's longest names, an Unstocked Part, and the Part 20 Vendors offer.
- No test of the platform relies on the stand-in.

### Recording

- The first ticket adds **Unstocked Part** to CONTEXT.md.
- The last ticket verifies the module from a fresh clone and records **The builder module's conventions** in the MVP spec: the Build's cookie and its limits, the addresses and forms, `GET v1/build` and its rules, the picker's conditions, the function that hands a stored Part to the rules, the Complete Build rule, the words for each outcome, and the stand-in's Builds. It adds the module's phone checks to **Checks on a phone wait for hosting**, and the inspector's new option to the commands table and the design skills guide.
- The Shopper app does not import `@pcp/compatibility`, since the API judges every Build. The placeholder that proves the library resolves in the Shopper app stays, with its comment corrected to say so.

## Testing Decisions

A good test sees the platform from the outside, as a Shopper or a later module would: through the API's HTTP surface, through a browser, or through a Shopper function's own inputs and outputs. It never reads a query's SQL, the order the code does things in, or a helper behind a module's public face. A test that would still pass if a price were added up a second time somewhere else proves nothing about what a Shopper sees.

The owner confirmed the four seams on 8 November 2026. As the MVP spec's testing strategy asks, tests are written before the code for whether a Build is complete, both price views with their order and their missing Parts, and totals with their "≈".

### Seam 1: the repository root, through `pnpm check`

- **The description.** The committed OpenAPI document and the generated client match the API, with `GET v1/build` and the picker's parameters.
- **The language files.** Every new Shopper text is in all three languages.
- **The words for every outcome.** A rule's outcome left unworded fails the type check.
- **The made-up shop.** The stand-in's answers type-check against `api-client`.
- **The import bans.** The Shopper app's new pages, features and segments keep Feature-Sliced Design's rules.
- **The Shopper's unit tests**, seam 4, run here.

Each new line is seen to fail once, through a deliberate fault that is then reverted: a parameter added to the endpoint without `pnpm api-client:write`, the Arabic text of the Build page's title removed, and one rule's Warning left unworded.

### Seam 2: the API from the outside, over a real PostgreSQL and a real Keycloak

`pnpm integration:check`, as `compatibility` left it. Vendors, Parts and Offers are made through the API, and the Platform Rate is set through it as the Admin. Made-up Parts carry the specifications each test needs. Nothing is mocked but the API's clock.

**The first price view**

- Each Part's Lowest Price comes from its in-stock Visible Offers only. It ignores out-of-stock Offers, Expired Offers and a deactivated Vendor's Offers, and it names the Vendor of that Offer. With two equal prices, it is the Offer the Part page lists first.
- The total is each Lowest Price times its quantity, added up, marked converted when any is a Converted Price, and answered in each currency.
- A Part made unstocked by putting its Offer out of stock, by letting it expire past 14 days and by deactivating its only Vendor is answered as an Unstocked Part and left out of the total. Confirming the Offer again, or reactivating the Vendor, brings it back.

**The second price view**

- Only active Vendors with an in-stock Visible Offer for a Build's Part are listed.
- Each Vendor's total is its Shown Prices times their quantities, marked converted when any is converted. It lists the Parts it has and the Parts it lacks, and never an Unstocked Part.
- The order is fewest Parts lacked first, then the lowest total, then the name, then the identifier. It is proved on Vendors that tie on each key in turn.
- The order can differ between currencies.

**One moment**

- A Platform Rate changed while a Build is read never mixes two rates in one answer, proved with the lock-and-wait helper `changeWhileReading`, as `browse` proved its figures.

**Whether a Build is a Complete Build**

- An empty Build needs every Category. Each of the CPU, motherboard, RAM, storage, case and PSU, when missing, is listed as still needed.
- A CPU with integrated graphics makes the GPU unneeded. A CPU written "None" needs one. A CPU missing the specification needs one, and the answer says the value is not known. The same holds for "Cooler included" and the CPU cooler.
- Two RAM kits and three drives count as RAM and storage once each.

**The rules, judged from stored Parts**

- Each rule that applies answers its outcome, passes included, in rule order. A Problem names its Parts, and a rule that does not apply answers nothing.
- A needed specification stored as 0 where 0 means "not known", made with `keepSpecificationsAsTheyAre`, is answered as missing, by path and English label, and makes its rule unchecked. A value the Part does not hold does the same.
- An Unstocked Part and a Part that is no longer visible are still judged.
- The Estimated power draw is answered, or the missing TDP named, or none without a CPU.

**The picker's conditions**

- In stock only leaves out a Part whose Offers are all out of stock, and a Part whose only in-stock Offer is expired or belongs to a deactivated Vendor. The filters' values with the same condition come only from Parts in stock.
- With a Build, a Part that would cause a Compatibility Problem is left out and is kept with the switch, marked not Compatible. A Part that causes only a Warning, or that a rule cannot check, is kept and marked Compatible.
- A CPU is judged in place of the Build's CPU, not beside it. A RAM kit that would take the Build past the motherboard's slots is left out.
- The total and the pages count only the Parts kept, and a page past the end still answers the total.
- Without the new parameters, the list answers exactly as `browse`'s tests prove.

**Refusals and tokens**

- Each refusal names `part`. An Admin's or a Vendor's token changes nothing, and no token is needed.

Prior art: `browse`'s and `pricing`'s integration tests of the Category list, a Part's Visible Offers and the platform's figures, with `changeWhileReading` and `keepSpecificationsAsTheyAre`; `offers`' tests of expiry with `moveTheClockTo`; and the compatibility library's made-up Parts, as a guide to the specifications a test Part needs for each rule.

### Seam 3: the running platform, from the outside

`pnpm platform:check`, in Chromium. Each test makes its own made-up Vendors, made-up Parts with names unique to the run and the specifications the test needs, and their Offers through the API. It sets the Platform Rate it needs and finds its own Parts in the picker by searching for their names. It compares what a page shows with what the API answers, and never quotes a translation.

**In a window 360 pixels wide**

- In Kurdish, Arabic and English, a Shopper picks a Complete Build through the pickers and the Build page says it is complete (success criterion 5).
- The picker hides a made-up CPU of another socket than the Build's motherboard. With the switch on, it shows it marked, and picking it makes the Build page list the Compatibility Problem, naming both Parts (success criterion 5).
- The Build page shows each Part's Lowest Price and Vendor and the total, and each Vendor's total with the Parts it lacks, in the API's order (success criterion 6). A converted total shows "≈", and switching the currency changes every price.
- Changing a kit's quantity changes the totals. Removing a Part, and emptying the Build after confirming, both work.
- Deactivating the only Vendor of a Build's Part shows it as unstocked and leaves it out of the totals.
- The Build is kept after a reload and on another page in the same browser, and a fresh browser starts with an empty Build.
- With script switched off, picking, changing a quantity and removing all work.
- Kurdish and Arabic are right to left, every number is in Western digits, Part names are in English, and `expectNoSidewaysScroll` passes.

**Accessibility and motion**

- `expectAccessible` passes on both pages in the light and the dark scheme.
- The motion the design adds is filmed with `film` and judged by `snapsOf`, with reduced motion and without it.

**Taste's inspector**

- `pnpm shopper:inspect` on the Build page, with each made-up Build, and on the picker, in both schemes, in Kurdish and English, at 1440, 768 and 390 pixels, and at 1024 and 1280 for desk layouts. The prices are also inspected in dollars. Every FAIL is fixed and every WARN fixed or defended in the ticket's Comments, against `browse` ticket 14's reference.

Prior art: `shopper-category-filters-languages.spec.ts` for a picker's search and filters, `shopper-currency.spec.ts` for the switches and a page without script, `shopper-part-languages.spec.ts` for comparing a page with the API's answer, the `vendors.ts` and `offers.ts` helpers, `createAMadeUpPart`, and the redesign's motion films.

### Seam 4: the Shopper app's own functions

Vitest, as `browse` started it. Plain functions are called with their inputs and judged by their outputs, through their module's public face:

- reading the Build's cookie: entries under their Categories, quantities, and each kind of entry that cannot be read, dropped;
- writing it after a pick, a change of quantity, a removal and emptying: a single Category's Part replaced, a kit or a drive added or counted once more, and a pick past the limits refused with its reason;
- the Build as the API's query, from the cookie;
- the picker's address and query, with the switch, and the Category page's query unchanged;
- every rule's outcome worded in each language, naming its Parts, and an unchecked rule naming its missing specifications in English;
- the Categories still needed, and the line saying a CPU's graphics or cooler is not known, in each language;
- the frame's count of Parts;
- each new page's preview, marked not to be indexed, with no Part and no price.

It never tests a server component, a page, the API or what the browser draws. Seams 2 and 3 cover them.

## Out of Scope

- Sharing a Build, a shared Build's page, its preview, the "send on WhatsApp" button and Referrals: `sharing`.
- Storing a Build on the platform, a Build kept across devices, and more than one Build per browser.
- Adding a Part to the Build from a Part page or a Category page. The picker is the way in for now, and the button is a later feature.
- Choosing a particular Vendor's Offer for a Part. The first price view always takes the Lowest Price.
- A route that visits several Vendors, delivery, or anything that orders or reserves stock.
- Showing the values a rule compared, such as both sockets, in an outcome's words.
- New Compatibility Rules, a recommended PSU wattage, and anything the rules left for later.
- Comparing two Builds, ready-made Builds, and price history.
- Parts outside the eight Categories, such as case fans, monitors and an operating system.
- Caching any page or answer: hosting.
- Any change to the dashboard.

## Further Notes

- **Decisions this spec takes that the owner may want to revisit.** Each follows the MVP spec's words where they leave room, and none is costly to change:
  - The Build is kept in a cookie, so the Build page works before script loads and is drawn on the server, with at most 8 different kits and 8 different drives, each 1 to 16.
  - Picking a kit or a drive adds one, and picking any other Part replaces the Build's Part of its Category.
  - A CPU that does not say whether it has graphics or a cooler counts as not providing them.
  - An Unstocked Part is listed once, not as lacking under every Vendor.
  - The picker marks an incompatible Part only when the switch shows it, and the Build page says why once it is picked.
  - An outcome names its Parts and what fails, without the values compared.
  - The Build page shows how many rules passed and the Estimated power draw.
  - The picker's filters offer the values of Parts in stock only.
  - The Build page and the picker are not indexed by search engines.
- **Success criteria.** This module makes criteria 5 and 6 true. It adds the Build page and the picker to criterion 13. Criterion 7 and the shared Build's half of criterion 12 are `sharing`'s.
- **Open checks.** This module's checks on a phone wait for hosting, as every module's do: the picker and the Build page used with a thumb in Kurdish and in English, a quantity changed with the phone's number pad, the switch and the pick control each taking a tap at once, and the motion felt on a real phone with reduced motion on and off.
- **LANG-7.** The Kurdish and Arabic texts this module adds, the words of every outcome among them, join the review that stays open until launch.
- **Next steps.** `sharing` follows, reusing `GET v1/build` for a shared Build's current prices and outcomes (SHR-2) and the second price view for its WhatsApp button (SHR-5). `part-requests` can start beside it.
