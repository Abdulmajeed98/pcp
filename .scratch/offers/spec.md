# Spec: Offers

Status: resolved

This is `offers`, the fourth module in the build order of [the MVP spec](../mvp/spec.md)'s capability map. It covers the requirements OFF-1 to OFF-11, and the list of CAT-8, which `catalog` left for this module. This spec uses the vocabulary of [CONTEXT.md](../../CONTEXT.md) and follows [ADR-0003](../../docs/adr/0003-three-apps-one-api-keycloak.md), [ADR-0004](../../docs/adr/0004-architecture-per-app.md), [ADR-0005](../../docs/adr/0005-specifications-as-one-document-per-part.md), [ADR-0007](../../docs/adr/0007-a-look-and-components-for-each-app.md), [ADR-0008](../../docs/adr/0008-language-in-the-address-and-two-message-formats.md) and [ADR-0009](../../docs/adr/0009-vendors-in-the-database-logins-in-keycloak.md). It builds on the conventions that `languages`, `catalog` and `accounts` recorded in the MVP spec.

On 20 October 2026 the owner confirmed the three test seams, the same three as `catalog`'s and `accounts'`. They also chose how a test lets time pass: the API, not PostgreSQL, is the source of every Confirmation's time and of "now" in every expiry check, and a test moves only the API's clock. They preferred this to backdating rows in the database and to a new Clock port.

Some words need care. An **Offer** is one Vendor's price and in-stock status for one Part, as CONTEXT.md defines it. A **Confirmation** is a Vendor's statement that an Offer is correct as of that moment. An **Expired Offer** is one whose last Confirmation is more than 14 days old. A **visible Offer** is one that is not an Expired Offer and whose Vendor is active (CAT-7). An Offer **about to expire** is one that is not yet expired and will be within 3 days. The **Offer history** is the record of every change to an Offer's Quoted Prices or in-stock status (OFF-10). A **needed specification** is one a Compatibility Rule reads, as `catalog` marked it.

## Problem Statement

The catalog holds about 26,000 Parts, and Vendors can log in, but no Vendor can yet say what it sells. Without that, a Shopper has nothing to compare, and every later module (`pricing`, `browse`, `builder`, `sharing`, `part-requests`, `sheet`) has nothing to stand on.

A Vendor in Erbil needs to find a Part it stocks among those 26,000 and say, from its phone, at what price, in dollars, in dinars or both, whether it has it now and for how long it guarantees it. Prices in Erbil move with the dollar, so a Vendor's prices go stale quickly, and a Shopper who travels across the city for a price that is a month old loses trust in the platform. The Vendor therefore needs to keep its prices current with as little effort as possible, and to be told when they are about to go stale.

The Admin signs Vendors up in person and needs to add a Vendor's first Offers on the spot, from the Vendor's own portal. Later the Admin needs to know which Vendors to remind before their Offers disappear, and which Parts that now have Offers lack a specification that compatibility checking needs.

The owner needs every change of price and stock recorded from the first day, because that history cannot be reconstructed later, and needs the rule for what a Shopper may see written once, so that no later module shows an Expired Offer or one from a deactivated Vendor.

## Solution

The Vendor portal gains an Offers screen, which becomes its first screen. It lists the Vendor's Offers, each with its Part, prices, stock, warranty and how long ago it was confirmed, and marks Expired Offers. A banner says when Offers are expired or about to expire, and one button confirms them all. From the Offers screen the Vendor searches the whole catalog by name, manufacturer or part number, picks a Part and adds its Offer; opens an Offer and changes it; or removes it. Saving an Offer, changed or not, confirms it. All of it is in Kurdish, Arabic and English, in both directions, laid out for a phone first.

The Admin, acting as a Vendor, does all of this from the Vendor's portal on the spot. The Admin console gains two screens: Expiring Offers, which lists the Vendors with Offers expired or about to expire so that the Admin can remind them, and Missing specifications, which lists every Part that has an Offer and lacks a needed specification, with a way into its edit form.

The API stores Offers, one per Vendor and Part, records every change of price and stock with its time and its Caller, and decides once which Offers are visible. It answers, without a token, a Part's visible Offers with how many days ago each was confirmed, so that `pricing` and `browse` build Shopper pages on a rule already written and tested.

## User Stories

### Finding a Part to offer

1. As a Vendor, I want to search the whole catalog from my portal, so that I can find a Part I stock among about 26,000.
2. As a Vendor, I want to search by a Part's name, so that I can find "Ryzen 5 7600" by typing it.
3. As a Vendor, I want to search by manufacturer, so that I can find a Part when I remember only its brand and model.
4. As a Vendor, I want to search by manufacturer part number, so that I can type the code printed on the box in front of me.
5. As a Vendor, I want to narrow the search to one Category, so that a GPU's name does not bring up coolers named after it.
6. As a Vendor, I want each result to show the Part's name, manufacturer, Category and photo or Category icon, so that I can tell similar Parts apart.
7. As a Vendor, I want each result to show its key part numbers, so that I can match the one on my box.
8. As a Vendor, I want a result I already have an Offer for to say so and lead to that Offer, so that I do not try to add a second one.
9. As a Vendor, I want the results a page at a time, so that the search stays quick on my phone.
10. As a Vendor, I want to be told when nothing matches, so that I know to try other words, and later to send a Part Request.
11. As a Vendor, I want Part names, manufacturers and part numbers shown in English in every language, so that they match the box and the manufacturer's site (LANG-3).

### Adding an Offer

12. As a Vendor, I want to add an Offer for any Part in the catalog, so that Shoppers can see that I sell it (OFF-3).
13. As a Vendor, I want to give a price in USD, in IQD or in both, so that I quote the way I actually sell (OFF-2).
14. As a Vendor, I want the form to refuse an Offer with no price at all, so that I never publish a Part without a price.
15. As a Vendor, I want to give a USD price with cents if I use them, so that a price such as 349.99 is kept as I wrote it.
16. As a Vendor, I want to give an IQD price as whole dinars, so that it matches how dinars are written.
17. As a Vendor, I want to type prices with thousands separators or in Arabic-Indic digits, so that I can type them as my keyboard writes them.
18. As a Vendor, I want a price that is zero, negative or absurdly large refused beside its field, so that a typing mistake does not reach Shoppers.
19. As a Vendor, I want to say whether the Part is in stock, so that Shoppers know whether to come now.
20. As a Vendor, I want in stock to be the starting choice, so that the usual case takes no tap.
21. As a Vendor, I want to give an optional warranty in months, so that Shoppers can compare guarantees.
22. As a Vendor, I want a warranty that is not a whole number of months, or is longer than ten years, refused beside its field, so that a typing mistake is caught.
23. As a Vendor, I want the form to show the Part I am offering, its name, photo or icon and part numbers, so that I know I picked the right one.
24. As a Vendor, I want adding an Offer to count as its Confirmation, so that a new Offer is current from the start (OFF-5).
25. As a Vendor, I want a second Offer for a Part I already offer refused, so that I keep one price per Part (OFF-1).
26. As a Vendor, I want to return to my Offers after adding one, with the new one in the list, so that I can see it took.
27. As a Vendor, I want to add one Offer after another without losing my place in the search, so that setting up many Parts is quick.

### My Offers

28. As a Vendor, I want my portal to open on my Offers, so that the work I do most is the first thing I see.
29. As a Vendor, I want each Offer in the list to show its Part's name, Category, prices, stock and warranty, so that I can check them at a glance.
30. As a Vendor, I want each Offer to say how many days ago I last confirmed it, so that I know which are getting old.
31. As a Vendor, I want an Offer confirmed today to say so, rather than "0 days ago", so that it reads naturally.
32. As a Vendor, I want Expired Offers marked as expired in the list, so that I know Shoppers no longer see them (OFF-6).
33. As a Vendor, I want Offers about to expire marked with the days left, so that I can act before they disappear.
34. As a Vendor, I want the Offers that need attention first, oldest Confirmation first, so that I do not have to scroll to find them.
35. As a Vendor, I want to search my own Offers by name, manufacturer or part number, so that I can find one among hundreds.
36. As a Vendor, I want my Offers a page at a time, so that the list stays quick on my phone.
37. As a Vendor, I want to see how many Offers I have, so that I know the size of what I keep.
38. As a Vendor with no Offers yet, I want the screen to say so and lead me to the catalog search, so that I know how to start.
39. As a Vendor, I want my prices written in Western digits, grouped in thousands, with their currency, so that they read the same in every language (LANG-5).
40. As a Vendor, I want both prices shown when I quoted both, so that I see exactly what I entered.

### Changing an Offer

41. As a Vendor, I want to open an Offer and change its prices, stock and warranty, so that it stays true (OFF-4).
42. As a Vendor, I want to remove one of my two prices as long as the other stays, so that I can switch to quoting one currency.
43. As a Vendor, I want saving an Offer to confirm it, even when I changed nothing, so that I can confirm one Offer on its own (OFF-5).
44. As a Vendor, I want saving an Expired Offer to bring it back to Shoppers at once, so that I can rescue one I forgot.
45. As a Vendor, I want a refused change to say which field is wrong, in my language, so that I can correct it.
46. As a Vendor, I want an Offer I opened by an old link, and since removed, to say it no longer exists, so that I am not left on a broken screen.

### Removing an Offer

47. As a Vendor, I want to remove an Offer for a Part I no longer sell, so that Shoppers stop seeing it (OFF-4).
48. As a Vendor, I want to confirm before an Offer is removed, so that a stray tap does not remove it.
49. As a Vendor, I want to add an Offer again for a Part whose Offer I removed, so that I can sell it again later.

### Confirming

50. As a Vendor, I want one button that confirms all my Offers at once, so that keeping my prices current takes one tap when nothing changed (OFF-5).
51. As a Vendor, I want confirming all to confirm my Expired Offers too, so that they all come back to Shoppers.
52. As a Vendor, I want to be told how many Offers I confirmed, so that I know it worked.
53. As a Vendor, I want a banner when any of my Offers will expire within 3 days, so that I confirm them in time (OFF-8).
54. As a Vendor, I want the banner to also count my Expired Offers, so that I know some are already hidden.
55. As a Vendor, I want the confirm-all button in the banner, so that I act where I am told.
56. As a Vendor, I want the banner gone once nothing is expired or about to expire, so that it means something when it shows.
57. As a Vendor, I want my 14 days to be the same as every other Vendor's, so that the rule is fair (OFF-6).

### What a Shopper will see

58. As a Shopper, I never want to see an Expired Offer, so that I do not travel for a stale price (OFF-6).
59. As a Shopper, I never want to see an Offer from a deactivated Vendor, so that I do not go to a shop that has left the platform (ACC-7).
60. As a Shopper, I want each Offer to say how many days ago it was confirmed, so that I can judge how fresh it is (OFF-7).
61. As a Shopper, I want in-stock Offers before out-of-stock ones, so that I see first where I can buy now (OFF-11).
62. As a Shopper, I want an Offer that a Vendor confirms again to come back at once, so that I see it as soon as it is current.
63. As a Shopper, I want no Offer promoted, highlighted or placed for payment, so that I can trust the order (OFF-11).

### Acting as a Vendor

64. As the Admin, I want to add, change, confirm and remove a Vendor's Offers from its portal, so that I can set a Vendor up on the spot in its shop (ACC-6).
65. As the Admin, I want the portal's Offers screens under a Vendor's page to be the same screens the Vendor sees, so that I can show the Vendor how they work.
66. As the Admin, I want my changes recorded as mine and not the Vendor's, so that the history tells who changed a price.
67. As the Admin, I want to manage a deactivated Vendor's Offers, so that I can prepare it before reactivating it.

### Expiring Offers

68. As the Admin, I want a list of Vendors with Offers expired or about to expire, so that I can remind them personally (OFF-9).
69. As the Admin, I want each Vendor in it to show how many Offers are about to expire and how many have expired, so that I remind the most urgent first.
70. As the Admin, I want each Vendor's phone and WhatsApp numbers in the list, so that I can call or message from it.
71. As the Admin, I want a WhatsApp link for each Vendor, so that I open the chat with one tap from my own WhatsApp.
72. As the Admin, I want deactivated Vendors left out of the list, so that I do not remind a Vendor that has left.
73. As the Admin, I want the Vendors with the soonest expiry first, so that I start with the most urgent.
74. As the Admin, I want each Vendor in the list to lead to its page, so that I can act as it from there.

### Missing specifications

75. As the Admin, I want a list of every Part that has an Offer and lacks a needed specification, so that I can keep compatibility checking whole (CAT-8).
76. As the Admin, I want each Part in it to show which needed specifications are missing, so that I know what to look up.
77. As the Admin, I want each Part in it to lead to its edit form, so that I can fill the gaps at once.
78. As the Admin, I want a Part to leave the list as soon as its gaps are filled, so that an empty list means the work is done.
79. As the Admin, I want the list ordered by Category, then by how many Offers a Part has, so that the Parts most Shoppers will see come first.
80. As the Admin, I want the list a page at a time, with its total, so that I can see how much is left.
81. As the Admin, I want the list to say so when it is empty, so that I know nothing needs doing.
82. As the Admin, I want a Part on the list still shown to Shoppers, so that a missing specification does not hide a Vendor's Offer (CAT-8).

### The Admin console

83. As the Admin, I want the top bar's menu to lead to Expiring Offers and Missing specifications, beside the Catalog and the Vendors, so that I reach them from anywhere.
84. As the Admin, I want the Admin console's new screens in English and laid out at 360 pixels first, so that I can use them on my phone (LANG-1, LANG-8).

### Who may do what

85. As a Vendor, I want no other Vendor to read, change or remove my Offers, so that my prices are mine.
86. As a Vendor, I want a request for another Vendor's Offers refused without saying whether that Vendor exists, so that nothing leaks.
87. As the owner, I want a deactivated Vendor's own Login refused at every Offer endpoint at once, so that it cannot change prices after leaving.
88. As the owner, I want the Expiring Offers and Missing specifications lists open to the Admin only, so that a Vendor learns nothing about other Vendors.
89. As the owner, I want a Part's visible Offers readable without a token, so that the Shopper app, which has no login, can show them.
90. As the owner, I want no endpoint to let a Vendor change a Part, so that the catalog stays the Admin's (CAT-4).

### The history

91. As the owner, I want every change to an Offer's Quoted Prices or in-stock status recorded with its time, so that price history can be shown later (OFF-10).
92. As the owner, I want an Offer's creation and its removal recorded in the same history, so that the record has no gaps.
93. As the owner, I want each record to hold who made the change, the Vendor's Login or the Admin's, so that it can be told later.
94. As the owner, I want the history kept when an Offer is removed, so that removing an Offer loses nothing.
95. As the owner, I want a Confirmation that changes nothing not recorded as a change, so that the history holds changes only.
96. As the owner, I want a change to the warranty alone not recorded, so that the history holds what OFF-10 asks for and nothing more.

### Groundwork for later modules

97. As the owner, I want the rule for a visible Offer written once in the API, so that `pricing`, `browse`, `builder` and `sharing` use the same rule.
98. As the owner, I want the API to answer how many days ago an Offer was confirmed, so that every page counts days the same way.
99. As the owner, I want a Part's visible Offers answered with both Quoted Prices as entered, so that `pricing` adds Converted Prices without changing what is stored.
100. As the owner, I want the Offer's Store able to find a Vendor's Offer by Part, so that `sheet` and `part-requests` create or update Offers through the same Commands.
101. As the owner, I want the dashboard's plural forms drawn by a Vendor portal screen, so that the language tests check them where they are shown, as `accounts` ticket 07 left waiting.
102. As the owner, I want the Category names shown on a Vendor portal screen, so that the portal's language tests check them in each language, as `accounts` ticket 07 left waiting.
103. As the owner, I want the MVP spec to record the conventions this module sets, so that `pricing` and every later module copy them.

### Checks and housekeeping

104. As the owner, I want the new tables made by committed migrations, so that the development database and any later one get the same schema.
105. As the owner, I want the generated client to describe the new endpoints, so that the frontends call them with types.
106. As the owner, I want every new Vendor portal text in all three languages, so that `pnpm check` holds the files together.
107. As the owner, I want every new screen checked for WCAG 2.2 AA in both schemes, so that the portal stays usable for everyone.
108. As the owner, I want this module's checks on a phone recorded as open until hosting, so that they are not forgotten.

## Implementation Decisions

### What this module is and is not

- It covers OFF-1 to OFF-11 and the CAT-8 list. It adds no Shopper page: the Shopper side of OFF-6, OFF-7 and OFF-11 is one public endpoint that `browse` renders. Ordering by price (OFF-11) needs the Platform Rate when the Offers quote different currencies (PRC-4), so it arrives with `pricing`; until then the endpoint orders in-stock Offers first and, within each group, by the time of Confirmation, newest first.
- Offers are entered one at a time in the portal. The sheet (`sheet`) and Part Requests (`part-requests`) later create and update Offers through the same Commands.

### Offers

- An Offer belongs to one Vendor and one Part. The pair is unique in the database, so a second Offer for the same pair is refused even under two requests at once (OFF-1). A second one is answered 400 with `NOT_VALID`, `field: 'partId'` and `reason: 'taken'`, as a taken login phone number is.
- An Offer holds a USD price, an IQD price, or both, at least one; whether it is in stock; an optional warranty in months; the time of its last Confirmation; and when it was created.
- **USD** is a positive amount with at most two decimal places, at most 100,000.00, stored as a whole number of cents and answered as a decimal string, "349.99", so that no frontend meets a binary fraction. **IQD** is a positive whole number of dinars, at most 150,000,000, stored and answered as a whole number. No rounding to 250 is required of a Quoted Price.
- The **warranty** is optional, a whole number of months from 1 to 120. Left out or sent as null, it is not stated.
- **In stock** is required. The form starts with it on.
- The reasons a detail is refused, each with its `field`: `missing` (no price at all, given on `usdPrice`), `notANumber`, `notPositive`, `tooManyDecimals`, `tooLarge`, and `notWholeMonths`. The first detail that does not fit is the one named, in the form's order: USD, IQD, in stock, warranty.
- The portal's form takes digits as a Vendor's keyboard writes them: Arabic-Indic and Eastern Arabic-Indic digits become Western digits, and thousands separators, spaces and the Arabic thousands separator are dropped, before the value is sent. The API takes numbers only in Western digits.
- A Part can get an Offer whatever its specifications, photo or Category.
- An Offer is never changed by a change to its Part, and a Part with Offers cannot be deleted, as no Part can be.

### Confirmation and expiry

- **Every Confirmation's time comes from the API's clock.** The API, not PostgreSQL, writes the time of each Confirmation and supplies "now" to every expiry check and every count of days, as a parameter of the query where the database compares. This is the owner's choice, so that a test moves time by moving the API's clock alone.
- Creating an Offer, saving it, changed or not, and the confirm-all action each count as a Confirmation and set its time to now (OFF-5). The confirm-all action confirms every Offer of the Vendor, Expired Offers among them, in one statement, and answers how many it confirmed.
- **An Offer is an Expired Offer when now is more than 14 days, of 24 hours each, after its last Confirmation.** At exactly 14 days it is not yet expired; one millisecond later it is (OFF-6). The 14 days are one constant in the API's domain, the same for every Vendor.
- **An Offer is about to expire when it is not expired and will be within 3 days**, that is when its last Confirmation is more than 11 days ago (OFF-8, OFF-9).
- **Days since Confirmation** are the whole days of 24 hours elapsed since it, rounded down. 0 is shown as "today". The API answers the count, so that every frontend counts the same way, and also the time itself.
- An Offer is a **visible Offer** when it is not an Expired Offer and its Vendor is active. The rule is written once, in the API's domain, with its query in the Offer Store, and every answer for Shoppers goes through it (CAT-7).

### The Offer history

- Every change to an Offer's USD price, IQD price or in-stock status adds one row to the Offer history, with the time from the API's clock, the Vendor, the Part, the values after the change, and the Caller's Login identifier (OFF-10). Creating an Offer adds a row with its first values, and removing one adds a row marking the removal.
- The history is keyed by Vendor and Part, not by the Offer, so it survives an Offer's removal and continues when the Offer is added again.
- A Confirmation that changes neither price nor stock adds no row. A change to the warranty alone adds no row.
- The row and the change it records are written in one transaction.
- Nothing in this module reads the history back, and no endpoint answers it. Integration tests read it through the database, as the one exception to reading the platform from outside, because nothing else can show it.

### Who may do what

- Every Vendor portal endpoint names its Vendor in its address, `v1/vendors/{vendorId}/offers…`, and decides with `VendorAccessRule`, which `VendorModule` now exports. A Caller with the `admin` role may act for any Vendor, active or deactivated; a Vendor's own Login only for itself, and only while active (ADR-0009).
- An Offer named in the address that belongs to another Vendor, or does not exist, is answered 404 with `OFFER_NOT_FOUND`, after the rule has allowed the Vendor, so a Vendor learns nothing of another's Offers.
- The two Admin lists are for the `admin` role only. A Part's visible Offers are public.

### The API's endpoints

| Endpoint | Who may call it | What it does |
|---|---|---|
| `GET v1/vendors/{vendorId}/offers` | Admin, the Vendor's own Login | One page of the Vendor's Offers, Expired Offers among them, each with its Part's name, manufacturer, Category and photo, its prices, stock, warranty, time of Confirmation, days since it, whether it is expired and whether it is about to expire. Searchable by the Part's name, manufacturer or part number. Ordered by last Confirmation, oldest first, then by Part name. Also answers the Vendor's counts of Offers, Expired Offers and Offers about to expire |
| `POST v1/vendors/{vendorId}/offers` | Admin, the Vendor's own Login | Creates the Offer for a Part, as a Confirmation, answering 201 with the Offer |
| `GET v1/vendors/{vendorId}/offers/{offerId}` | Admin, the Vendor's own Login | One Offer, with its Part |
| `PUT v1/vendors/{vendorId}/offers/{offerId}` | Admin, the Vendor's own Login | Replaces the prices, stock and warranty, as a Confirmation, and clears what it leaves out |
| `DELETE v1/vendors/{vendorId}/offers/{offerId}` | Admin, the Vendor's own Login | Removes the Offer, answering 204 |
| `POST v1/vendors/{vendorId}/offers/confirm` | Admin, the Vendor's own Login | Confirms every Offer of the Vendor, answering 200 with how many |
| `GET v1/parts/{partId}/offers` | Public | The Part's visible Offers, each with the Vendor's identifier and name, both Quoted Prices as entered, stock, warranty, time of Confirmation and days since it. A Part that does not exist is answered 404 with `PART_NOT_FOUND`; one with none, an empty list |
| `GET v1/offers/expiring` | Admin | One page of active Vendors with Expired Offers or Offers about to expire, each with its name, phone number and WhatsApp number in both forms, and the two counts. Ordered by the soonest expiry among its Offers, then by name |
| `GET v1/parts/missing-specifications` | Admin | One page of Parts that have at least one Offer and lack a needed specification, each with its Category, name, manufacturer, the paths and labels of the missing needed specifications, and how many Offers it has. Ordered by Category in the catalog's order, then by Offers, most first, then by name |

- The search endpoint for the catalog, `GET v1/parts`, already answers a Vendor. Its answer gains, for a Vendor's own Login and for the Admin with a `vendorId` given, the identifier of that Vendor's Offer for each Part, when there is one, so that a result can lead to it (story 8).
- Every list uses `core`'s `PagingRequest` and paged answer.
- The confirm action is a verb after the resource, as `reset-password` and `deactivate` are.
- The Commands and Queries are `CreateOfferCommand`, `EditOfferCommand`, `RemoveOfferCommand`, `ConfirmAllOffersCommand`, `ListVendorsOffersQuery`, `ReadOfferQuery`, `ListVisibleOffersOfPartQuery`, `ListVendorsWithExpiringOffersQuery` and `ListPartsMissingSpecificationsQuery`. The checks of an Offer's details are written once, `OfferDetails.check`, in the domain.
- The Offer entity knows its own expiry, given now: whether it is expired, whether it is about to expire and its days since Confirmation. The Store's queries use the same constants, so that a list and an entity cannot disagree.

### The API's database

- Two tables: `offer`, with a unique pair of Vendor and Part, prices as nullable whole numbers with a check that at least one is present, and indexes for the Vendor's list and for a Part's visible Offers; and `offer_history`, which references neither the Offer nor cascades from it.
- Both are made by committed migrations, generated with `pnpm db:generate`.
- The missing-specifications list reads the needed specifications from the Category's specification list in code and asks the database which of their paths are empty in each Part's document, so that a change to the list in code changes the list at once.

### The dashboard

- **The Vendor portal's screens.** The Offers screen becomes the portal's first screen, and the details screen moves to its own address, `details`, with the contact details form below it. The portal's top bar gains its two sections, Offers and Details. Every link between screens stays relative to the route, so both the portal's own router and the acting frame serve them unchanged.
- **The Offers screen**: the banner (when any Offer is expired or about to expire) with both counts and the confirm-all button; a search of the Vendor's own Offers; the paged list; a button to add an Offer; a message for a Vendor with none.
- **Adding**: a catalog search screen, with a Category filter, whose results say "you offer this" and lead to the Offer; picking a Part opens the Offer form for it. After saving, the Vendor returns to the search, kept as it was, with a note that the Offer was added.
- **The Offer form**: the Part at its head, USD and IQD fields, the in-stock switch and the warranty field. A refusal is shown beside its field, in the portal's language. The same form changes an Offer, with Remove, which asks first in shadcn/ui's alert dialog.
- Prices are shown with `formatNumber`, the currency after the amount as "$" and "IQD", marked `AlwaysEnglish`. Part names, manufacturers and part numbers are `AlwaysEnglish`. Category names are the shared terms.
- "Confirmed today", "confirmed 1 day ago", "expired", "expires in 2 days", the banner's counts and the confirm-all result are sentences that count, in every plural form of each language, with the count written by `formatNumber`. Their Kurdish and Arabic are drafts under LANG-7, taking their words from `words.md`; Offer, Confirmation and Expired Offer get their Kurdish and Arabic words there if they lack them.
- Every query about a Vendor's Offers is under one key, so that any change to an Offer, and the confirm-all action, asks the list, the counts and the banner again.
- **The Admin console** gains Expiring Offers and Missing specifications, in English, in the top bar's menu beside the Catalog and the Vendors. Expiring Offers shows each Vendor's name `AsWritten`, the two counts, the phone number as a `tel:` link and the WhatsApp number as a `https://wa.me/<digits>` link in a new tab, each in Iraq's own form and `AlwaysEnglish`, and leads to the Vendor's page. Missing specifications shows each Part with its Category, the missing specifications' labels and its count of Offers, and leads to its edit form, from which saving returns to the list.
- Each screen is laid out for 360 pixels first, with logical classes only, held to the root DESIGN.md and the dashboard's look, Rate Board.

### Recording

- The conventions this module sets are written into the MVP spec under a part of their own, **The offers module's conventions**: the API as the source of time, the rule for a visible Offer, how prices are stored and answered, the history, the endpoints, and the portal's screens.
- The open checks on a phone are added to the MVP spec's list under Testing strategy.
- No ADR is expected. If storing USD in cents or keeping the history apart from the Offer is challenged during the work, it is recorded as one, since both are costly to undo once real Vendor data exists.

## Testing Decisions

A good test of this module asks the platform a question from the outside and reads the answer. It calls an endpoint, or opens a screen, and reads what came back: the answer's body and status, and what the page shows. It does not ask which Store method ran, which SQL was sent or how a component is built. The one exception is the Offer history, which nothing answers yet: an integration test reads its rows from the database, because no other way to see it exists.

There are three seams, the same three as `catalog`'s and `accounts'`. The owner confirmed them on 20 October 2026.

Tests of the expiry at the 14-day boundary and of the 3-day warning are written before the code, as the MVP spec's testing strategy asks.

### Seam 1: the repository root, through `pnpm check`

- **Migrations.** The committed migrations make every change the schema holds.
- **The description.** The committed OpenAPI document and the generated client match the API.
- **The language files.** Every new Vendor portal text is in all three languages, each sentence that counts with every plural form its language has, with no value inside a message and no number formatting.
- **Still true.** Everything `pnpm check` proved before still passes, with Docker stopped and no browser installed.

Each line is seen to fail once, by a deliberate fault that is then reverted: a column added to the Offers' schema with no migration, an endpoint added without `pnpm api-client:write`, and the Arabic `few` form of a counting sentence removed.

### Seam 2: the API from the outside, over a real PostgreSQL and a real Keycloak

`pnpm integration:check`, as `accounts` left it. Vendors are made through the API, as the Admin makes them, so that each has a real Login; Parts through the API too. Tokens come from the stand-in. The tables are emptied, and the test's Logins removed, between tests. Nothing is mocked but the API's clock: a test that lets time pass fakes Jest's `Date` alone, leaving every timer that `pg` and NestJS need real, as the access tests already do.

**Adding and reading**

- A Vendor adds an Offer quoted only in USD, only in IQD, and in both, and reads each back as entered, "349.99" kept with its cents.
- An Offer with no price, a price of zero, a negative price, three decimal places in USD, a fraction of a dinar, a price over the limit, a warranty of 0 or 121 months or of half a month are each refused, naming the field and the reason.
- A second Offer for the same Part is refused as taken; two at once leave one Offer.
- An Offer for a Part that does not exist is answered 404 with `PART_NOT_FOUND`.
- The Vendor's list holds its Offers only, searchable by name, manufacturer and part number, each once across the pages, oldest Confirmation first, with the three counts.
- The catalog search, asked for a Vendor, names that Vendor's Offer for each Part it offers, and no other Vendor's.

**Changing, removing and confirming**

- Changing an Offer replaces its prices, stock and warranty, clears a warranty left out, and confirms it.
- Saving an Offer unchanged confirms it.
- Removing an Offer makes it 404 for its Vendor and absent from the Part's visible Offers; adding it again works.
- Confirming all confirms every Offer of the Vendor, its Expired Offers among them, answers how many, and touches no other Vendor's.

**Expiry, with the clock moved**

- An Offer confirmed 14 days ago to the millisecond is visible and not expired; one millisecond later it is expired, hidden from the Part's visible Offers, and listed for its Vendor marked expired.
- An Offer confirmed 11 days ago to the millisecond is not about to expire; one millisecond later it is, and its Vendor appears in Expiring Offers with a count of one.
- Days since Confirmation are 0 just before 24 hours, 1 at 24 hours, and 14 at the boundary.
- Saving, or confirming all, brings an Expired Offer back to the Part's visible Offers at once.

**Visibility**

- A Part's visible Offers leave out Expired Offers and a deactivated Vendor's Offers, and return the latter when the Vendor is reactivated.
- They come in-stock first, and are answered without a token.
- Expiring Offers leaves out deactivated Vendors.

**Missing specifications**

- A Part with an Offer and an empty needed specification is listed, with that specification named; a Part with no Offer is not; a Part whose gaps the Admin fills through the Part's edit leaves the list.

**The history**

- Creating an Offer, changing its price, changing its stock and removing it each add one row, with the time from the moved clock, the values after the change and the Caller's Login identifier; the Admin acting as the Vendor is recorded as the Admin.
- Saving unchanged, confirming all, and changing the warranty alone add none.
- The rows survive the Offer's removal.

**Who may do what**

- A Vendor's token at another Vendor's Offers is answered 403 with `VENDOR_ACCESS_DENIED`, whether that Vendor exists or not; at another Vendor's Offer through its own address, 404 with `OFFER_NOT_FOUND`.
- A deactivated Vendor's own token, not run out, is answered 403 with `VENDOR_DEACTIVATED` at every Offer endpoint; the Admin still manages its Offers.
- A Vendor's token at Expiring Offers and Missing specifications is answered 403; every Vendor endpoint answers a call without a token with 401.

Each group is seen to fail once, by a deliberate fault that is then reverted:

- the expiry compared with "at least" instead of "more than" 14 days;
- the database's clock used for a Confirmation's time instead of the API's;
- the active check left out of the rule for a visible Offer;
- the unique pair of Vendor and Part removed;
- the history row written for a Confirmation that changes nothing;
- the ownership check left out of reading an Offer by its identifier;
- the Admin-only rule removed from Expiring Offers.

The domain's own tests with mocked Stores, as `catalog` wrote for its Commands, are written only where a rule has a case HTTP cannot reach cheaply; the integration tests are the proof.

### Seam 3: the running platform, from the outside

`pnpm platform:check`, in Chromium, as `accounts` left it. Every Vendor is a made-up Vendor that has logged in, made with `aMadeUpVendorThatHasLoggedIn`; every Part a made-up Part, made with `createAMadeUpPart`. Moving time is not done here; the expiry is proved at seam 2, and an expired Offer for the screens is not needed beyond the banner, which a page route gives (see below).

**The Vendor portal, in a window 360 pixels wide**

- The portal opens on the Offers screen, with the message for a Vendor with none and its link to the search.
- The Vendor searches the catalog by the made-up Part's number, picks it, adds an Offer quoted only in USD with a warranty, and sees it in the list with "today".
- The search now says the Vendor offers that Part, and leads to the Offer.
- A price typed in Arabic-Indic digits with separators is saved as its value.
- An Offer with no price is refused beside the USD field.
- The Vendor changes the Offer to in IQD too, out of stock, and the list shows both prices and the stock.
- The Vendor removes it after confirming, and the list no longer holds it.
- The banner, given an answer with Offers about to expire and expired through Playwright's `page.route`, as `answerAsForALoginWithNoVendor` does, shows both counts; confirm-all asks the real API and says how many it confirmed.
- The details screen is reached by its section in the top bar, and the contact details form still saves.

**The languages.** The Offers screen, the catalog search and the Offer form each pass `checkInEveryLanguageOfTheVendorPortal`. `readInEveryLanguageOfTheVendorPortal` reads a counting sentence, which differs between the languages, and the Category names, which differ too; the Part's name and number and the prices are drawn left to right in Kurdish and Arabic and hold no Arabic-Indic digit.

**Acting as a Vendor.** The Admin opens a made-up Vendor's portal from its page, adds an Offer under the band, and the Vendor, logged in, sees it.

**The Admin console.** Missing specifications lists a made-up Part with an Offer and an empty needed specification, leads to its edit form, and after the gap is filled the Part is gone from the list. Expiring Offers is reached from the menu and shows its empty message or its rows; a row's links hold the Vendor's numbers.

**Accessibility.** `expectAccessible` runs on the Offers screen with the banner, the catalog search with results, the Offer form with a refusal shown, the removal's dialog, Expiring Offers and Missing specifications, in the light and the dark scheme.

### The rest

- Checks on a phone wait for hosting, and are recorded open: the Offers screen, the catalog search and the Offer form used with a thumb, in Kurdish and in English; a price typed on a Kurdish and on an Arabic keyboard; the confirm-all button reached in the banner with a thumb; Expiring Offers' WhatsApp link opening the app on the Admin's phone.
- Prior art: the Vendor endpoints' integration tests for seam 2, the access tests for moving the clock, the Vendor portal's details screen and contact details tests for seam 3, and the Catalog's tests for a paged search.

## Out of Scope

- Ordering Offers by price, Converted Prices, the "≈" mark and the Platform Rate: `pricing`.
- Any Shopper page, a Part's page, a Category page or a Vendor's page for Shoppers: `browse`. This module gives `browse` the public endpoint and the rule.
- Showing the Offer history anywhere (OFF-10 keeps it only).
- Part Requests, and turning a search with no result into one: `part-requests`. The empty search only says that nothing matches.
- The Offer sheet: `sheet`.
- Stock quantities, used Parts, reservations, or any price per quantity.
- Reminders sent by the platform: the Admin reminds Vendors personally from Expiring Offers.
- A different expiry for some Vendors, or a setting for the 14 days.
- Showing the count of missing specifications in the Catalog's rows, which `catalog` ticket 11 noted. It may follow once the list exists, as a small change of its own.
- Recording who confirmed an Offer, apart from the history's rows for changes.

## Further Notes

- **Decisions this spec takes that the owner may want to revisit.** These follow the MVP spec's words where they leave room, and none of them is costly to change before real Vendor data exists:
  - The Offers screen replaces the details screen as the portal's first screen.
  - Saving an Offer unchanged counts as a Confirmation, which gives a Vendor a way to confirm one Offer on its own.
  - The banner and Expiring Offers count Expired Offers as well as those about to expire.
  - The history records the Caller's Login identifier as well as the time.
  - A Quoted Price in USD keeps cents.
  - Until `pricing`, a Part's visible Offers are ordered in-stock first, then by the most recent Confirmation.
- **The deactivation dialog's words** that `accounts` kept, that Shoppers no longer see the Vendor or its Offers, become true for Offers with this module's public endpoint and fully true with `browse`.
- **What `accounts` ticket 07 left waiting** — a sentence that counts and the Category names on a Vendor portal screen — is checked on the Offers screen and the catalog search.
- **Next steps.** `pricing` builds on this module: it adds the Platform Rate, answers each visible Offer's price in the Shopper's currency and orders by it. `part-requests` and `sheet` create Offers through this module's Commands, and count each as a Confirmation.
