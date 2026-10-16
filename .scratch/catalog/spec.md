# Spec: The catalog

Status: resolved

This is `catalog`, the second module in the build order of [the MVP spec](../mvp/spec.md)'s capability map. It covers the requirements CAT-1 to CAT-9, apart from the list in CAT-8, which needs Offers (see [What this module is and is not](#what-this-module-is-and-is-not)). This spec uses the vocabulary of [CONTEXT.md](../../CONTEXT.md) and follows [ADR-0003](../../docs/adr/0003-three-apps-one-api-keycloak.md) and [ADR-0004](../../docs/adr/0004-architecture-per-app.md). It corrects [ADR-0001](../../docs/adr/0001-seed-catalog-from-buildcores-opendb.md), whose source changed its licence after the ADR was written.

On 14 October 2026 the owner confirmed the test seams and made three choices. The import takes OpenDB's data from the last commit released under ODC-By. The dashboard gets the most widely used router, data-fetching and form libraries. Photos are kept in PostgreSQL behind a port. On the same day the owner decided that the design research starts when the first real frontend page is built. That page is this module's Catalog, so the research comes first in this module's frontend work.

Some words need care. A **specification** is one named property of a Part, defined for its Category, such as a CPU's socket or a case's maximum GPU length. A Category's **specification list** names every specification a Part of that Category can hold. A **needed specification** is one that a Compatibility Rule reads, as listed in the MVP spec's rule table. A specification is **missing** when the Part holds no value for it. The **OpenDB ID** is the identifier a Part has in OpenDB. Parts the Admin creates have none. The **pinned commit** is the one commit of OpenDB that the import reads. **The import** is the command that fills the catalog from it. A **photo** is the one picture a Part may have. The **Category icon** is shown wherever a Part has no photo.

## Problem Statement

Every later module needs Parts. A Vendor makes an Offer for a Part, a Shopper browses Parts, and a Compatibility Rule compares two Parts' specifications. The catalog is empty, and the platform cannot store anything yet. The API has no database connection, no table, no migration, no Command, no Query and no Store. The pattern ADR-0004 describes for all of them has never been built once.

The Admin has nowhere to work. The Admin console is a placeholder page. The Admin cannot search the catalog, correct a specification OpenDB got wrong, add a Part that is sold in Erbil but missing from OpenDB, or give a Part a photo.

Nothing says what a page should look like. Every page so far has been a placeholder, and both the infrastructure steps and `languages` deliberately did no visual design. PRODUCT.md records the visual design and an accessibility standard as undecided. The first real page would otherwise set the look of every later page by accident.

The source itself has changed. ADR-0001 chose BuildCores OpenDB because it was licensed under ODC-By 1.0, which allows commercial use with attribution. On 5 October 2026, the day the MVP interview began, OpenDB moved to CC BY-NC-SA 4.0, which is non-commercial and share-alike. On 9 October its notice was reworded to cover all of its data. An import of OpenDB as it is today would put the platform under a non-commercial licence.

Some parts of this have a way of being wrong that looks right:

- **Re-running the import.** A second run that writes over existing Parts erases every correction the Admin has made, and nothing looks broken.
- **Zero for unknown.** OpenDB writes 0 for some values it does not know. A GPU of length 0 fits every case. A rule given that value would pass a Build it should have called unchecked, which the MVP spec forbids.
- **Free text where rules compare.** A rule compares a CPU's socket with a motherboard's. If the Admin can type "AM 5" where OpenDB says "AM5", a Shopper is shown a Compatibility Problem that does not exist.
- **Photos from a phone.** A photo taken in a shop carries the place it was taken and the device that took it.

## Solution

One command, `pnpm catalog:import`, fills the catalog. It reads OpenDB's eight Category folders at the last commit released under ODC-By: 26,240 Parts. Every imported Part keeps its OpenDB ID, and a second run adds nothing and changes nothing. The import reports what it did for each Category. No imported Part is shown to Shoppers, because none has an Offer yet.

Before the first page is built, its design is researched against sources, as the apps' architecture was, and the owner chooses from what the research recommends. The choices are written down where every later page and Impeccable's design hook read them: the visual system in DESIGN.md, the accessibility standard in PRODUCT.md, and the tokens in `ui`'s theme.

The Admin gets the Catalog in the Admin console, usable on a phone and built to that visual system. The Admin searches the whole catalog by name, manufacturer or part number, opens a Part and sees all of its specifications, with the needed ones that are missing marked. The Admin creates Parts that OpenDB lacks, edits any specification of any Part, and adds or replaces a Part's photo. A Part without a photo shows its Category's icon. Vendors can search the catalog through the API, ready for the Vendor portal's Offer screens in `offers`. Nobody but the Admin can change it.

Every Shopper page credits BuildCores OpenDB in its footer, in the Shopper's language, as the licence requires.

The owner gets the groundwork every later module copies. PostgreSQL is reached through Drizzle, with migrations generated from the schema. The first Commands, Queries and Stores return Effect's `Either`, and paged lists come back in the workplace's shape. The API has tests against a real PostgreSQL that start their own database. The dashboard has its first router, data-fetching and form libraries, and shadcn/ui's first components.

## User Stories

### The import

1. As the owner, I want one command to fill the catalog from OpenDB, so that a Vendor adding an Offer nearly always finds the Part already there.
2. As the owner, I want the import to read OpenDB only at the last commit released under ODC-By, so that the platform can be run as a business without a licence from BuildCores.
3. As the owner, I want the import to say which commit it imported, so that the record and the credit agree.
4. As the owner, I want only the eight Categories' folders imported, so that monitors, keyboards and everything else OpenDB holds stay out (CAT-1).
5. As the owner, I want each imported Part to keep its OpenDB ID, so that a later feature can add new Parts without overwriting the Admin's edits (CAT-2).
6. As the owner, I want a second run to add nothing and change nothing, so that running it twice does no harm.
7. As the Admin, I want a Part I have edited left exactly as I left it whenever the import runs, so that my corrections are never lost.
8. As the owner, I want the import to be all or nothing, so that a failure halfway never leaves half a catalog.
9. As the owner, I want a report for each Category of how many Parts were imported, how many were already there and how many were left out and why, so that I know what the catalog holds.
10. As the owner, I want a record with no name, or with no manufacturer that its name shows, left out and named in the report, so that the catalog holds no Part a Vendor could not recognise.
11. As the owner, I want a value that does not fit its specification left out and counted, so that a bad value in OpenDB cannot reach a Compatibility Rule.
12. As a Shopper, I want a length, a height or a wattage that OpenDB gives as 0 treated as unknown, so that a rule says it could not check instead of saying that a GPU fits.
13. As the owner, I want OpenDB's US retailer listings, store codes and barcodes left behind, so that the catalog holds only what the platform uses.
14. As a Vendor, I want each Part to carry every manufacturer part number OpenDB knows for it, so that my searches and, later, my sheet's rows find it.
15. As the owner, I want the import to read a folder on disk as well as fetch from GitHub, so that it can run without the network and be tested on made-up data.
16. As the owner, I want none of the imported Parts shown to Shoppers, so that the site shows only what Vendors stock (CAT-7).
17. As the owner, I want the import to run on a fresh installation as soon as the services have started, so that success criterion 1 holds with one command.
18. As the owner, I want the import to say plainly what went wrong when it cannot fetch the commit or reach the database, and to leave the catalog as it was, so that I can run it again.

### Searching the catalog

19. As the Admin, I want to search the whole catalog by a Part's name, so that I find a Part by the name a shop uses for it.
20. As the Admin, I want to search by manufacturer, so that I can see what the catalog holds from one brand.
21. As the Admin, I want to search by a manufacturer part number, so that I find the exact model printed on a box.
22. As the Admin, I want every word I type to count, in any order and in any case, so that "7600 ryzen" finds "AMD Ryzen 5 7600".
23. As the Admin, I want to narrow a search to one Category, so that "Ryzen" does not also list the coolers made for Ryzen.
24. As the Admin, I want results in pages with the total number found, so that a broad search stays fast on a phone.
25. As the Admin, I want each result to show its photo or its Category's icon, its name, its manufacturer and its Category, so that I can tell similar Parts apart.
26. As the Admin, I want results in a fixed order, so that moving between pages never skips or repeats a Part.
27. As the Admin, I want to be told plainly when a search finds nothing, so that I know to create the Part.
28. As a Vendor, I want the API to let me search the same catalog, so that the Vendor portal can offer it when Offers arrive (CAT-7).
29. As the owner, I want no Part listed to anyone who has not logged in, so that the catalog reaches Shoppers only through Offers (CAT-7).

### A Part

30. As the Admin, I want a page for each Part with everything the platform holds about it, so that I can check it before a Vendor relies on it.
31. As the Admin, I want the specifications shown under English labels, with their units, so that I can compare them with a manufacturer's page.
32. As the Admin, I want the needed specifications that are missing marked, so that I know which gaps stop compatibility checking (CAT-8).
33. As the Admin, I want to see whether a Part came from OpenDB or was created by me, so that I know where its data came from.
34. As the Admin, I want a Part with no photo to show its Category's icon, so that every Part has a picture (CAT-6).
35. As the Admin, I want to be told plainly when a Part does not exist, so that an old link does not show an empty page.

### Creating a Part

36. As the Admin, I want to create a Part that OpenDB lacks, so that Parts sold in Erbil and missing from OpenDB can be offered (CAT-5).
37. As the Admin, I want to choose the Category first and then be asked for that Category's specifications, so that I fill in the right ones.
38. As the Admin, I want to give it a name, a manufacturer and any number of part numbers, so that it can be found like any other Part.
39. As the Admin, I want to save a Part with some specifications still missing, so that I can add the rest when I know them.
40. As the Admin, I want a wrong value refused with a message that names the specification, so that I can see what to correct.
41. As the Admin, I want to choose from a list for a specification that a rule compares, such as a socket, so that "AM5" and "AM 5" cannot both exist and cause a false Compatibility Problem.
42. As the Admin, I want the needed specifications marked in the form, so that I fill those in first.

### Editing a Part

43. As the Admin, I want to edit any specification of any Part, so that I can correct OpenDB (CAT-5).
44. As the Admin, I want to clear a specification that is wrong and unknown, so that its rule is unchecked rather than wrong.
45. As the Admin, I want to edit a Part's name, manufacturer and part numbers, so that a Vendor finds it by the name the shop uses.
46. As the Admin, I want a Part's Category fixed once the Part exists, so that a Part never holds another Category's specifications.
47. As the Admin, I want an edit to take effect at once, so that the next search and the next page show it.

### Photos

48. As the Admin, I want to add a photo to a Part from my phone while I am in a shop, so that Shoppers will see what the Part looks like (CAT-5).
49. As the Admin, I want to replace a Part's photo, so that a poor picture can be improved.
50. As the Admin, I want a photo straight from a phone camera accepted, so that I do not have to resize or convert it first.
51. As a Shopper on slow mobile data, I want every photo made small before it is stored, so that a picture never costs me megabytes.
52. As the owner, I want location and camera data removed from every photo, so that a picture taken in a shop never shows where it was taken or on what.
53. As the owner, I want a file that is not really a picture refused, so that nothing else is ever stored or served as a photo.
54. As a Shopper, I want a photo fetched once and then kept by my browser and by any cache in front of the platform, so that it costs data only once.
55. As the owner, I want a replaced photo to get a new address, so that nobody is shown the old one from a cache.
56. As the owner, I want photos kept in the platform's database, so that the nightly backup covers them and no paid service is added.

### Who may do what

57. As the owner, I want only the Admin to create or edit a Part or its photo, so that a wrong specification never reaches every Vendor's Offers and every Shopper's Builds (CAT-4).
58. As the owner, I want the API to refuse a Vendor that tries to create or edit a Part, so that the rule holds whatever a screen does.
59. As a Vendor, I want the Vendor portal to offer no way to change the catalog, so that I am never shown something I may not use.

### The credit

60. As the owner, I want every Shopper page to credit BuildCores OpenDB in its footer, so that the platform keeps the licence's terms (CAT-9).
61. As a Shopper, I want the credit in my language, so that I can read it.
62. As a Shopper reading Kurdish or Arabic, I want "BuildCores OpenDB" and the licence's name kept in their own order, so that they read correctly inside the sentence.
63. As anyone, I want the credit to link to OpenDB and to the licence, so that the source and its terms can be found.
64. As the owner, I want the credit on the "not found" page too, so that no Shopper page lacks it.
65. As a Shopper on a phone 360 pixels wide, I want the credit to fit without sideways scrolling, so that the footer does not break the page.

### The groundwork for later modules

66. As the owner, I want the API to store its data in PostgreSQL through Drizzle, as the MVP spec decided, so that every later module stores data the same way.
67. As the owner, I want each change to the database made by a migration generated from the schema and kept in the repository, so that every installation's database is the same.
68. As the owner, I want migrations applied by a command of their own and never when the API starts, as at my workplace, so that two APIs starting at once cannot both change the database.
69. As the owner, I want `pnpm services:up` to apply them, so that a fresh machine is still ready in one step.
70. As the owner, I want `pnpm check` to fail when the schema has changed and no migration was generated, so that the two never drift apart.
71. As the owner, I want the first Commands, Queries and Stores built the way my workplace builds them, with errors returned as Effect's `Either`, so that this module is the pattern the others copy.
72. As the owner, I want paged lists answered in my workplace's shape, so that every later list looks the same to a frontend.
73. As the owner, I want the API to start while the database cannot be reached, as it starts without Keycloak, and to answer 503 to a call that needs the database, so that one slow service does not stop the API.
74. As the owner, I want the database password to be the API's one setting without a default, so that no password is ever committed.
75. As the owner, I want the dashboard's first router, data-fetching and form libraries chosen now, as the most widely used ones, so that the Vendor portal reuses them.
76. As the owner, I want shadcn/ui's first components added with its right-to-left setting on, so that the Vendor portal can reuse them in Kurdish and Arabic.
77. As the Admin, I want the catalog screens usable on a phone 360 pixels wide, because I set Vendors up in their shops (LANG-8).

### Checks and housekeeping

78. As the owner, I want the API's tests against a real PostgreSQL run by one command that needs Docker but not the services, so that `pnpm check` keeps passing with Docker stopped.
79. As the owner, I want those tests to start a database of their own, so that they never touch my development data.
80. As the owner, I want `pnpm platform:check` to prove the Admin's catalog screens and the credit in a real browser, so that the proof is of what a person sees.
81. As the owner, I want each check seen to fail once on a planted fault, so that I know it can fail.
82. As the owner, I want ADR-0001 corrected for the licence change, so that nobody later imports newer OpenDB data by mistake.
83. As the owner, I want the MVP spec to record the conventions this module sets, so that the next module finds them without reading this one.
84. As the owner, I want the work committed in pieces that each leave `pnpm check` passing, so that any piece can be read and reverted on its own.

### The design

85. As the owner, I want the design researched against sources before the first page is built, so that the first page does not set the look of every later page by accident.
86. As the owner, I want the research to recommend and me to choose, so that the platform looks the way I decided.
87. As the owner, I want an accessibility standard chosen, with the part a tool can check run in `pnpm platform:check`, so that every later page is held to it.
88. As a Shopper reading Kurdish or Arabic on a low-end Android phone, I want type that draws my script clearly at small sizes, so that I can read every page.
89. As the Admin, I want controls large enough to tap and text that stays readable in a shop's light, so that I can work on my phone behind a counter.
90. As the owner, I want the visual system written down in one place, as tokens and the rules for using them, so that every later page and every agent builds to the same system.
91. As the owner, I want shadcn/ui's theme set from those tokens in `ui`, so that the Admin console, the Vendor portal and the Shopper pages share one look.
92. As the owner, I want the platform's name and logo kept out of the research, so that the brand waits for the name, which is still open.

## Implementation Decisions

### What this module is and is not

- It builds the catalog: Parts, their specifications and photos, the import, the Admin's Catalog screens, the API's endpoints for them, and the Shopper footer's credit.
- It builds the groundwork the catalog needs first: the API's database, migrations, Effect's `Either`, structured errors, paging, and tests against a real PostgreSQL. In the dashboard it builds a router, data fetching, forms and shadcn/ui's first components.
- Its frontend work starts with the design research, because the Catalog is the platform's first real page. The research blocks the Catalog screens and the footer credit. It does not block the API, the database or the import, which can go ahead beside it.
- **CAT-7.** No Part has an Offer yet, so no Part is shown to Shoppers. This module adds no Shopper page and no public endpoint that lists Parts. `browse` adds both, and it filters by Offers.
- **CAT-8.** The list of every Part that has an Offer and is missing a needed specification arrives with `offers`. Built now, over all 26,240 Parts, it would hold most of the catalog, because several needed specifications are filled for fewer than one Part in five. This module marks which specifications are needed, and shows the missing ones on the Admin's Part page and in the form, which is what the list is built from.
- The Vendor portal gains no screen. Its catalog search arrives with `offers` (OFF-3). The API's search and Part endpoints already answer a Vendor.
- **Depends on `languages`.** The Admin console's screens build on the two halves of the dashboard that ticket 06 of `languages` creates. The test that a Vendor cannot reach them needs the development Vendor login from ticket 05. Tickets of this module that touch the dashboard are blocked by those two. The footer credit builds on the Shopper app's frame, which already exists.

### The source data

- The import reads OpenDB at commit `ef7e601b78875a931a4ad9fa1ccce7000f3e5ecf`, of 5 October 2026. It is the last commit before OpenDB's licence changed, and is released under ODC-By 1.0. The owner chose it on 14 October 2026.
- The commit is written in one place in the repository, and the import imports no other.
- At that commit, the eight folders hold 26,240 Parts. Further Notes gives the count for each Category.
- OpenDB's later data is under CC BY-NC-SA 4.0, and nothing in this module reads it. Pulling updates from OpenDB was already outside the MVP. It now needs a licence decision as well, and ADR-0001 says so.
- OpenDB's folders map to the Categories as follows: `CPU` to CPU, `CPUCooler` to CPU cooler, `Motherboard` to motherboard, `RAM` to RAM, `Storage` to storage, `GPU` to GPU, `PCCase` to case and `PSU` to PSU. Every other folder is ignored.
- Test data is made up and written by hand in OpenDB's shape. No OpenDB record is copied into the repository, and neither is any OpenDB schema.

### Parts

- A Part holds its Category, a name, a manufacturer, a list of manufacturer part numbers, its specifications, an optional photo, its OpenDB ID if it has one, and when it was created and last changed (CAT-3).
- A Part's identifier is the platform's own, and the OpenDB ID is kept beside it. No two Parts share an OpenDB ID. Parts the Admin creates have none.
- The eight Categories are fixed in code (CAT-1), with the same keys that `i18n`'s shared terms use for their names: `cpu`, `cpuCooler`, `motherboard`, `ram`, `storage`, `gpu`, `case` and `psu`.
- A Part's Category cannot change after it is created. A Part in the wrong Category is created again in the right one.
- The name and the manufacturer are required and are stored as written. Neither has to be unique.
- Part numbers are a list, possibly empty, with no duplicates when compared regardless of case. Two Parts may share a part number. SHT-5 already expects a sheet row to match more than one Part.
- From OpenDB the name is `metadata.name` and the manufacturer is `metadata.manufacturer`. The part numbers are `metadata.part_numbers` together with every identifier of type `mpn`, trimmed and with duplicates removed. Many records have an empty `part_numbers` and several `mpn` identifiers.
- Barcodes (`ean`, `upc`, `gtin`), retailer listings, US store codes, the manufacturer's link and OpenDB's other metadata are not kept.
- No Part is ever deleted, by the import or by the Admin. Deleting a Part is out of scope.

### Specifications

- Each Category has a specification list, written by hand in the API's domain. Each entry gives a specification's place in OpenDB's field names and nesting, its English label, its kind, its unit if it has one, and whether it is a needed specification.
- The kinds are: a whole number, a decimal number, text, yes or no, one of a fixed set of values, several of a fixed set, a list of text, and a list of rows whose own fields have kinds. The last is for specifications such as a motherboard's PCIe and M.2 slots.
- A specification that a rule compares for equality, such as a socket, a RAM type or a form factor, is one of a fixed set, or several of one. The set is the values OpenDB uses at the pinned commit. A new value, such as the socket of a CPU released later, is added to the list in code. This keeps a typing variant from causing a false Compatibility Problem.
- The needed specifications are the fields that the MVP spec's rule table names. Every one is on its Category's list.
- A Part's specifications are stored as one JSON document, in OpenDB's field names and nesting, so that the fields named in the MVP spec's rule table are the fields stored. Only what the list names can be stored. A new ADR records this, because changing it once real Vendor data exists needs the owner's agreement under the MVP spec.
- The lists cover every specification OpenDB defines for the eight Categories, except retailer and identity data. Further Notes says what is left out.
- A specification for which 0 cannot be true, such as a length, a height, a wattage or a number of expansion slots, treats 0 as missing. The list marks each one. Which needed specifications OpenDB fills with 0 is found out first, on the pinned commit.
- The API answers a Category's specification list, so that the dashboard builds its forms and its Part page from it rather than holding a copy. `browse` will use the same answer for the Shopper's Part page.
- On the Admin's Part page, each specification is shown under its English label. The Admin console is in English only. How labels are shown to Shoppers is decided in `browse`.

### The import

- It is a second entry point of the API, as the OpenAPI writer already is, because the API is the only part that touches the database (ADR-0003). It is run with `pnpm catalog:import`.
- It fetches the pinned commit's eight folders from GitHub, or reads them from a folder on disk when it is given one. How it fetches them, as an archive of the commit or as a shallow clone, is settled first. Either way it checks that what it holds is the pinned commit, and it imports nothing otherwise.
- It is a Command with its own Store and a port through which it reads OpenDB's records. Fetching, unpacking and reading files are infrastructure.
- A record becomes a Part when it has an OpenDB ID that matches its file name, a name and a manufacturer. A record that names no manufacturer takes the one its name begins with, among those its folder's other records name, and the report names it. It is left out as a copy when a record of that manufacturer has one of its part numbers, or when the import's short list of known copies names it. Any other record is left out, and named in the report with its reason.
- A cooler's sockets that list "LGA 1151v2" beside "LGA 1151" lose the variant, which the set of sockets does not hold, and keep the rest. Any other list with a socket outside the set is left out whole and counted.
- A specification value that does not fit its entry on the list is left out of the Part and counted. So is a value of 0 where 0 cannot be true. A field that the list does not name is ignored.
- A record whose OpenDB ID is already in the catalog is skipped. The import never changes or removes a Part.
- Everything is written in one transaction. A failure leaves the catalog as it was, and the command exits non-zero with a plain message.
- The report gives, for each Category and in total, the Parts imported, the Parts already in the catalog, the records left out and the values left out. It names the commit it imported.
- The import shows nothing to Shoppers and creates no Offer.
- Running it in production is part of the packaging work, which comes later.

### Searching

- One endpoint searches the catalog. It answers the Admin and Vendors (CAT-7), and refuses a call without a token.
- A search term is split into words. A Part matches when every word appears, ignoring case, in its name, its manufacturer or one of its part numbers. An empty term matches every Part.
- A search can be limited to one Category.
- Results come in pages, in the workplace's paging shape: a page number counted from 0, a page size with a maximum, and an answer that holds the page's items, the total number found and where the page stands. They are ordered by name, with the Part's identifier breaking ties so that the order is stable.
- Each result holds what the Admin's list shows: the identifier, the Category, the name, the manufacturer, the part numbers and the photo's address if there is one.
- PostgreSQL's `pg_trgm` extension indexes the searched text, as the workplace does for its searches, so that a substring search over 26,240 Parts stays fast.

### Creating and editing

- Only the Admin creates a Part, edits one, or adds or replaces a photo. A Vendor's attempt is answered 403 by the API (CAT-4).
- Creating takes the Category, the name, the manufacturer, the part numbers and any specifications.
- Editing replaces the name, the manufacturer, the part numbers and the specifications as a whole, as the form sends them. A specification left out of the edit is cleared. The Category is not part of an edit.
- Every value is checked against the Category's specification list. A refusal names the specification and the reason, in the error body the API already uses, so that the form can show it beside the field.
- The Part's time of last change is updated, and nothing else is recorded. Recording catalog edits is not in the MVP.

### Photos

- A Part has at most one photo (CAT-3). Adding one to a Part that has one replaces it.
- A JPEG, PNG or WebP image of up to 10 MB is accepted. The type is judged from the file's content, as the workplace's upload does, and not from its name. Anything else is refused.
- With sharp, the photo is made at most 1,200 pixels on its longer side and never enlarged, re-encoded as WebP, and stripped of all metadata, location and camera data among it.
- Photos are stored in PostgreSQL, behind an abstract `PhotoStore` that is the port. The owner chose this on 14 October 2026. It adds no service, and the nightly backup covers it. An object store can replace it later without a change to the domain.
- A photo is served by a public endpoint at an address that holds the photo's own identifier. A replaced photo gets a new address. The answer says that it may be cached for a year and never changes.
- A replaced photo is deleted.
- Removing a photo without replacing it is not in CAT-5, and is not built.
- **Category icons.** `ui` gains a component that shows a Category's icon, from lucide, the icon set shadcn/ui uses. It has `cpu`, `fan`, `circuit-board`, `memory-stick`, `hard-drive`, `gpu`, `pc-case` and `plug-zap`. An icon that points along the reading direction would be mirrored in a right-to-left page, and none of these points.

### The API's endpoints

All paths begin with `v1`, as every path of the API does. The names here describe them, and the exact paths are the tickets' to choose.

| Endpoint | Who may call it | What it does |
|---|---|---|
| The Categories | Admin, Vendor | The eight Categories, each with its specification list |
| Search Parts | Admin, Vendor | One page of Parts that match a term, optionally in one Category |
| A Part | Admin, Vendor | Everything about one Part, with its missing needed specifications listed |
| Create a Part | Admin | Creates a Part |
| Edit a Part | Admin | Replaces a Part's name, manufacturer, part numbers and specifications |
| Add a photo | Admin | Stores a new photo for a Part and replaces any earlier one |
| A photo | Everyone | The photo's WebP file, cacheable for a year |

- A Part that does not exist is answered 404 with its own error code.
- A Part's specifications appear in the API's description as a JSON object. The specification list says what it may hold. A type for each Category in the description would run to several hundred fields and adds nothing that the list does not already say.
- `pnpm api-client:write` is run after each endpoint, as the MVP spec already requires.

### The API's database

- PostgreSQL, through Drizzle with `pg` (node-postgres), as the MVP spec decided and as the workplace does.
- Drizzle schemas live in the infrastructure layer, one file per table, beside the Store that uses them. One database module provides the client.
- **Settings.** The API gains three: `DATASOURCE_URL`, which defaults to the development database's address; `DATASOURCE_USERNAME`, which defaults to `pcp`; and `DATASOURCE_PASSWORD`, which has no default. The workplace splits its database settings the same way. These names keep this repository's unprefixed style.
- The password is the first setting of any app that is a secret. The API refuses to start without it and names it. In development its value is the one `.env` already holds for the `pcp` user, and the commands that start the API or the import supply it from there. No copy of it is written anywhere else. How it reaches `nx serve`, the import and `pnpm platform:check` is found out first.
- The API connects only when a call needs the database. It starts while PostgreSQL cannot be reached, and answers 503 to a call that needs the database. That is how it already behaves while Keycloak's keys cannot be had.
- **Migrations.** `drizzle-kit` generates them from the schema into the API's source tree, as the workplace does. They go forward only, and each file name says what it does. The extension that search needs is created by the first migration. Whether `drizzle-kit` can write that, or a hand-written migration is needed, is found out first.
- Migrations are applied by a command of their own, which holds a PostgreSQL advisory lock while it runs, as the workplace's runner does. The API never applies them when it starts.
- `pnpm db:migrate` applies them to the development database. `pnpm services:up` applies them once PostgreSQL is healthy, so a fresh machine is ready in one step. `pnpm services:check` gains a line saying that the platform's database has every migration applied.
- A new step of `pnpm check` fails when the schema holds a change that no committed migration makes. It needs no database.

### Domain conventions this module sets

- The first entities, Commands, Queries and Stores are built here: a Part entity with getters, a `PartStore` that is the port and a `DatabasePartStore` that implements it, and one class for each use case, such as `CreatePartCommand`, `EditPartCommand`, `SearchPartsQuery`, `ReadPartQuery`, `AddPartPhotoCommand` and `ImportCatalogCommand`, each with its own Input and Output.
- Effect 3, the major version the workplace uses. Effect 4, released on 1 October 2026, has no `Either` module. Domain and Store code never throws. It returns `Either`, and the controller turns a failure into the API's existing error body.
- `core` gains what is not specific to the catalog: the structured errors that domain code returns, the exception the controller raises from one, its mapping in the existing filter, the paging request, attributes and answer, and a shared test database for the tests.
- The API keeps what is its own: its database module, its schemas, its Stores and its migrations.

### The Admin console

- Its screens are the Catalog list with search, a Part's page, the form for a new Part and the form for editing one. They sit in the Admin console half of the dashboard and are in English only, with the text written where it is used, as `languages` decided. Category names come from the shared terms, in English.
- The libraries are the most widely used for each job. The owner chose them on 14 October 2026:
  - React Router for the screens' addresses;
  - TanStack Query for calls to the API, which still go through `@pcp/api-client`;
  - React Hook Form for the forms;
  - shadcn/ui's first components, set up with its right-to-left setting on, as `languages` recorded, and lucide icons. They are the dashboard's own set, on Base UI in the Mira style (ADR-0007).
- The forms are built from the Category's specification list, one field for each specification, with the kind setting the control. The needed specifications are marked. A refusal from the API is shown beside the field it names.
- The router lives in the App layer. The screens follow Feature-Sliced Design under the import rules that `pnpm boundaries:check` proves. Where the dashboard's own shadcn/ui components live is settled when they are added.
- Every screen is laid out at 360 pixels wide first, with logical classes only, because the Admin works in the Vendors' shops on a phone (LANG-8).
- **Design.** The screens are built to the dashboard's look, Rate Board, in `apps/dashboard/DESIGN.md`, and to the root DESIGN.md (see [The design research](#the-design-research)), with shadcn/ui's components themed from the dashboard's tokens. They are in English, and follow the same look as the Vendor portal will. The Shopper pages have a look of their own.
- Tokens stay in memory only, as before. A refusal from the API is shown, and never answered by starting a login.

### The design research

- It is the first frontend ticket of this module, and a research ticket. The owner decided on 14 October 2026 that the design is researched when the first real frontend page is built, and not before.
- It researches against primary sources, as [the architecture research](../../docs/research/app-architecture.md) did, and cites them. Its findings are written to a new document under `docs/research`. It recommends, and the owner chooses. Where it compares options, it includes the most widely used one and says how adoption compares.
- It answers these questions:
  - **The accessibility standard.** Which one, at which level, and which part of it a tool can check in `pnpm platform:check`. WCAG 2.2 level AA was suggested on 14 October 2026 as the one to weigh first.
  - **Type.** How Sorani, Arabic and Latin text are drawn clearly on a low-end Android phone. `languages` decided that no font is downloaded. The research may reopen that, with the cost in data on a weak connection stated.
  - **Colour.** A palette whose contrast meets the chosen standard, and whether the platform has a dark scheme.
  - **Spacing, sizes and touch targets.** A spacing and type scale for a screen 360 pixels wide first, and the smallest size a control can have.
  - **Right to left.** What mirrors and what does not, beyond the rule for icons that `languages` recorded.
  - **The two kinds of screen.** How the dense lists and forms of the Admin console and the Vendor portal differ from the Shopper's pages, within one system.
  - **shadcn/ui.** How its theme is set from the tokens, and which of its defaults stay.
- **What it leaves behind.**
  - DESIGN.md at the repository root, in the format Impeccable reads: tokens first, then the rules for using them. Impeccable's design hook is turned on for this repository, and it reads PRODUCT.md and DESIGN.md.
  - PRODUCT.md updated, with the chosen accessibility standard in place of "undecided".
  - `ui`'s theme carrying the tokens, so that both frontends use them.
  - An ADR for any choice that is hard to undo, such as a downloaded font.
- The platform's name, a logo and the rest of its brand identity are not part of it. The MVP spec leaves the name open until before launch, and the brand waits for it.
- Every screen built after it, in this module and later, is built to DESIGN.md.
- **What it decided, on 15 October 2026.** The research is in [docs/research/design-system.md](../../docs/research/design-system.md), and the owner's choices are recorded there with it:
  - WCAG 2.2 level AA, checked by axe-core in `pnpm platform:check` and by Oxlint's `jsx-a11y` plugin in `pnpm check`, which is on from this ticket.
  - Downloaded fonts, overruling `languages` (ADR-0006).
  - A light and a dark scheme, following the device. Every check of a screen runs in both.
  - Controls at least 44 by 44 pixels, and no text under 14 pixels.
  - Apple's rules for what mirrors right to left.
  - Base UI under shadcn/ui.
  - Instead of one system, a look and a set of components for each app, after a second search the owner asked for (ADR-0007). The Shopper app's look is Fit Diagram, on the Lyra style, set in Archivo and Noto Kufi Arabic. The dashboard's is Rate Board, on the Mira style, set in Geist, Noto Sans Arabic and Geist Mono. Each app's folder has its own DESIGN.md, which Impeccable reads for it, and the root DESIGN.md holds what both share. Each look's tokens are a theme in `ui`, `@pcp/ui/themes/shopper.css` and `@pcp/ui/themes/dashboard.css`, which import the shared `theme.css`.

### The footer credit

- The Shopper app's frame gains a footer on every page, the "not found" page among them, with one line of credit. It is laid out to the visual system.
- In English it follows the example notice in ODC-By section 4.3: it says that the platform contains information from BuildCores OpenDB, which is made available under the ODC Attribution License. The Kurdish and the Arabic are drafts, like the rest of the Shopper's text.
- "BuildCores OpenDB" and the licence's name are marked as always in English with `ui`'s component, so that they keep their order inside a Kurdish or an Arabic sentence.
- The credit links to OpenDB at the pinned commit, where the licence is still ODC-By, and to the ODC-By 1.0 licence on the Open Data Commons site.
- It is rendered on the server with the rest of the page, and needs no script.

### Commands this module adds

| Command | What it does |
|---|---|
| `pnpm catalog:import` | Imports the eight Categories from OpenDB's pinned commit into the development database, or from a folder given to it. It prints a line for each Category and the commit it imported. |
| `pnpm db:migrate` | Applies the API's migrations to the development database. |
| `pnpm integration:check` | Runs each project's tests against a real PostgreSQL that the tests start in a container. It needs Docker, but not the services, and says so plainly when Docker is not running. |

The command that generates a migration from the schema is added as well, and its name is the ticket's to choose.

### Versions

- Drizzle ORM 0.45 and drizzle-kit 0.31, which are the stable releases, while 1.0 is still a release candidate. `pg` 8. Effect 3. Testcontainers 12 with its PostgreSQL module, running the same `postgres:18.6` image as the development services. sharp 0.35.
- React Router, TanStack Query, React Hook Form, lucide-react and shadcn/ui's components are the current stable releases when the work is done.
- pnpm refuses an install script that the workspace file does not list, and sharp has one. A new package's script is read before it is listed.

### Recording

- ADR-0001 is amended. OpenDB's licence changed on 5 October 2026. The catalog is imported from the pinned commit, the last released under ODC-By 1.0. Later OpenDB data is under CC BY-NC-SA 4.0 and is not used without the owner's agreement. Its count is replaced by the measured 26,240.
- A new ADR records how specifications are stored: one JSON document per Part, in OpenDB's field names, described by each Category's specification list.
- The MVP spec's Technology section gains the conventions set here. They are: the database settings and the first secret; migrations and when they are applied; the Command, Query and Store pattern as built; Effect's version; structured errors; paging; the shared test database and `pnpm integration:check`; photos and the `PhotoStore` port; the dashboard's libraries; shadcn/ui's place in `ui`; and the import and its commit. Its commands table gains the three new commands, and its settings table gains the database settings.
- The MVP spec says when to run `pnpm integration:check`: after any change to a schema, a migration, a Store, a Command or a Query, and after an upgrade of Drizzle, `pg`, Effect or Testcontainers.
- CAT-2 in the MVP spec names the pinned commit, and CAT-8 says that its list arrives with `offers`.
- PRODUCT.md's account of the catalog data names the pinned commit, and its stack names the dashboard's libraries.
- The design research's findings are in `docs/research`, the visual system is in DESIGN.md, and the accessibility standard is in PRODUCT.md. The MVP spec's Technology section points to all three.
- CONTEXT.md gains **Specification** if the owner agrees: the glossary already relies on the word, in Compatibility Rule, and does not define it.
- The work is committed in pieces, each leaving `pnpm check` passing.

## Testing Decisions

A good test of this module asks the platform a question from the outside and reads the answer. It calls an endpoint, runs the import, or opens a screen. It then reads what came back: the answer's body and status, the report, the Parts a search finds, and what the page shows. It does not ask which Store method ran, which SQL was sent, how a column is named or how a component is built. All of those may change while the Admin sees the same catalog.

There are three seams. The owner confirmed them on 14 October 2026. Two already exist. The second is new infrastructure behind a surface that already exists: the API's HTTP surface, as its tests already use it, now over a real database.

### Seam 1: the repository root, through `pnpm check`

- **Migrations.** The committed migrations make every change the schema holds.
- **The description.** The committed OpenAPI document and the generated client match the API, as before.
- **Still true.** Everything `pnpm check` proved before still passes, with Docker stopped and no browser installed. The API's existing tests of its HTTP surface still pass, which shows that the API starts without a database.

Each line is seen to fail once, by a deliberate fault that is then reverted: a column added to a schema with no migration generated, and an endpoint added without `pnpm api-client:write`.

### Seam 2: the API from the outside, over a real PostgreSQL

`pnpm integration:check` starts a PostgreSQL container, applies the committed migrations, builds the API as `createTestAppWithLogins` does, and talks to it over HTTP with tokens from the Keycloak stand-in. The import is run through its entry, in the test's process, on a made-up folder shaped like OpenDB, and its result is read through the report and through the API. One container serves every test file, and the tables are emptied between tests. Nothing is mocked.

**The import**

- A complete made-up record of each Category becomes a Part with its Category, name, manufacturer and specifications, and can then be found by searching.
- The report names the commit, and counts what was imported, what was already there and what was left out, for each Category.
- A record without a name and one without a manufacturer are left out and named in the report.
- A record in a folder outside the eight, such as `Monitor`, is not imported.
- A value of the wrong kind is left out of the Part and counted. A length of 0 is missing, and is listed among the Part's missing needed specifications.
- The part numbers are the record's `part_numbers` and its `mpn` identifiers, without duplicates. Its barcodes and retailer listings are not anywhere in the Part.
- A second run imports nothing and reports every Part as already in the catalog.
- A Part the Admin has edited keeps the edit after a second run.
- A run that fails partway, on a record planted to make the database refuse it, leaves no Part behind.
- A folder that does not hold the pinned commit is refused, and nothing is imported.

**Searching and reading**

- A word of the name, of the manufacturer or of a part number finds the Part, in any case, and two words find only Parts that hold both.
- A search limited to a Category finds no Part of another Category.
- Paging returns each Part once across the pages, in name order, with the total.
- A Vendor's token is answered like the Admin's. A call without a token is answered 401.
- A Part that does not exist is answered 404 with its error code.
- The Categories' answer holds the eight Categories, and each one's list holds every field the MVP spec's rule table names for it, marked as needed.

**Creating and editing**

- The Admin creates a Part with some specifications missing, reads it back, and finds the missing needed ones listed.
- A value outside a specification's fixed set, a word where a number belongs, and an unknown specification are each refused with an answer that names the specification.
- An edit replaces what it holds and clears what it leaves out. A Category sent with an edit does not change the Part's Category.
- A Vendor's attempt to create a Part, to edit one and to add a photo is answered 403. Without a token the answer is 401.

**Photos**

- A large made-up JPEG that carries location data is stored and served as a WebP image no longer than 1,200 pixels on its longer side, with no metadata at all.
- A smaller image is not enlarged.
- A text file named like a picture is refused, and so is an image over 10 MB.
- A replaced photo gets a new address, and the old address answers 404.
- The photo is served without a token, with an answer that may be cached for a year.

**The database's absence.** With the container stopped, a call that needs the database is answered 503, and the API's status endpoint still answers.

Each group is seen to fail once, by a deliberate fault that is then reverted:

- the import writing over Parts that are already there;
- the transaction removed;
- `Monitor` added to the folders read;
- 0 kept as a length;
- the `mpn` identifiers ignored;
- part numbers left out of the search;
- the Vendor role added to editing;
- the metadata kept on a photo;
- the content check replaced by the file name;
- an old photo left in place after a replacement.

### Seam 3: the running platform, from the outside

`pnpm platform:check` observes the services and the three apps through a real browser. It first makes sure that the platform's database has every migration applied, and says so plainly, naming `pnpm services:up`, when it does not. It does not need the catalog imported.

**The Admin console, as the development Admin, in a window 360 pixels wide**

- The Admin creates a Part with a made-up name, unique to the run, and a made-up part number.
- Searching for a word of its name finds it, and so does searching for its part number.
- Its page shows its Category's icon and marks its missing needed specifications.
- The Admin edits a specification, and the page shows the new value.
- The Admin adds a small made-up photo, and the page shows it in place of the icon. A second photo replaces it.
- A value outside a specification's set cannot be chosen, and a word typed where a number belongs is refused beside its field.
- No screen scrolls sideways.

**The Vendor portal, as the development Vendor.** An address of the Admin console's Catalog does not show the Catalog.

**The Shopper app**

- On every page checked, in all three languages, the footer holds the credit, with "BuildCores OpenDB" in English and marked to keep its own direction, and with links to the pinned commit and to the licence. The "not found" page is one of the pages checked.
- The credit is in what the server sends, before any script runs.
- The credit's text differs between the three languages.
- The page still does not scroll sideways.

**The accessibility standard.** The part of the chosen standard that a tool can check is run on the Catalog list, a Part's page, the Part form and a Shopper page, in each language for the Shopper page. Which tool does it is the design research's to recommend.

The Parts this seam creates stay in the development database, named so that they are plainly test data. `pnpm services:reset` clears them.

Each group is seen to fail once, by a deliberate fault that is then reverted: the needed mark taken off one specification; the photo's address left unchanged after a replacement; the Vendor sent to the Admin console; the credit taken off the "not found" page; the always-English mark taken off the credit; a control on the Part form given no accessible name.

### The rest

- **From scratch.** In a fresh clone in a new directory, with no `.env` and no Docker volumes, all of these pass, with none of the three apps started by hand: one install; the browser's install; `pnpm check --skip-nx-cache`; `pnpm boundaries:check`; `pnpm integration:check`; `pnpm services:up`, which applies the migrations; `pnpm services:check`; `pnpm catalog:import`; and `pnpm platform:check`. The import imports 26,240 Parts less those the report leaves out. A second run imports none.
- **By hand, once.** The owner checks:
  - The report's numbers make sense, and a few well-known Parts, such as an AMD Ryzen 5 7600, are found with the right specifications.
  - How long the import took on the owner's connection.
  - On the owner's phone, the Catalog is usable with a thumb, and a photo taken with the phone's camera is accepted.
  - The Catalog screens and the footer match DESIGN.md, and Impeccable's design hook raises nothing left unanswered.
  - The Sorani and Arabic text in the footer is drawn clearly on the owner's phone, and on an older Android phone if one is at hand.
  - The credit reads correctly in Kurdish and in Arabic.
  - `pnpm check` still passes with Docker stopped and with no browser installed.
- **Prior art.**
  - The API's existing tests of its HTTP surface, built with `createTestAppWithLogins`, are the model for seam 2. The workplace's testing guide is the model for the shared test database and for emptying tables between tests.
  - The step of `pnpm check` that compares the generated client with the committed one is the model for the step that compares migrations with the schema.
  - The existing end-to-end tests and their helpers are the model for seam 3: the login helpers, and the helper that checks a page in all three languages.
- **Recording.** The results of the fault checks and of the by-hand checks are written under the Comments heading of the ticket that carries them out.

## Out of Scope

- Showing any Part to Shoppers: the Category pages, Part pages, search and filters of `browse`, and a public endpoint that lists Parts.
- The Missing specifications list (CAT-8), which arrives with `offers`.
- Offers, the Vendor portal's catalog search, Part Requests and the sheet.
- The Compatibility Rules themselves. This module only marks which specifications they need.
- Any OpenDB data after the pinned commit, and pulling updates from OpenDB.
- Deleting a Part, merging two Parts, and removing a photo without replacing it.
- More than one photo for a Part, several sizes of a photo, and an object store for photos.
- Recording who changed a Part and when, beyond its time of last change.
- Barcodes, retailer data and links to the manufacturer's pages.
- Translating specification labels for Shoppers. `browse` decides how labels are shown to Shoppers.
- The platform's name, a logo and the rest of its brand identity. The visual system is in scope, and the brand waits for the name.
- Running the import or the migrations on a server, and the rest of packaging.
- Running `pnpm integration:check` or `pnpm platform:check` as part of `pnpm check`.

## Further Notes

- **Choices made here that no ADR records.** The owner may overrule any of them before work starts:
  - The CAT-8 list waits for `offers`, and this module only marks what is needed.
  - The search and Part endpoints answer Vendors already, with no screen to use them.
  - The Category is fixed once a Part exists.
  - An edit replaces a Part's fields as a whole, and clears a specification it leaves out.
  - Part numbers are OpenDB's `part_numbers` together with its `mpn` identifiers. Some `mpn` values are fragments, such as `WHT` or `MESH`, which may make a sheet row match more than one Part. SHT-5 reports that.
  - Records with no manufacturer are not imported with a blank one. CAT-3 says that a Part has a manufacturer. On 15 October 2026 the owner decided that one whose name begins with a manufacturer of its folder takes that one.
  - Specifications compared for equality are fixed sets, and a new value is a change to code.
  - Photos: JPEG, PNG and WebP up to 10 MB, stored as WebP at most 1,200 pixels on the longer side.
  - The database settings' names: `DATASOURCE_URL`, `DATASOURCE_USERNAME` and `DATASOURCE_PASSWORD`.
  - The Parts that `pnpm platform:check` creates are left in the development database.
  - The credit's wording follows the licence's own example.
  - The specifications' type in the API's description is a plain JSON object.
- **The owner's decisions of 15 October 2026,** on what tickets 01 to 09 left open:
  1. A cooler that lists "LGA 1151v2" beside "LGA 1151" keeps its other sockets. "LGA 115", "LGA 1121" and a motherboard's "LGA 1151v2" are not mapped, and the Admin fills those in.
  2. A record with no manufacturer takes the one its name begins with, among its folder's manufacturers, unless it copies a complete record. 20 of the 28 share a part number with a complete record of that manufacturer and are left out as copies, and 2 more are listed in the import as known copies, because nothing deletes a Part. 4 become Parts, and 2 have no manufacturer their name shows.
  3. A case's 0 internal 2.5-inch bays is kept, and rule 15 lets a 2.5-inch drive take a free 3.5-inch bay. The MVP spec's rule notes say how.
  4. Dual-socket and CPU-built-in boards are kept, and rule 1 reads their sockets. The MVP spec's rule notes say how.
  5. Rule 7 fits a Thin Mini-ITX board where Mini-ITX fits, and a Flex ATX board where Micro ATX fits.
  6. A 0 stays "not known" for motherboards' SATA ports and power supplies' EPS, PCIe, SATA and 24-pin connectors.
  7. The API keeps JPEG, PNG and WebP. Ticket 13's photo field asks for them, so that an iPhone converts its HEIC.
  8. Search keeps matching words as written. Folding accents and Arabic-script letters is designed in `browse`, where Shoppers search.
  9. A refusal of specifications names the first one that does not fit.
  10. When two edits of one Part overlap, the last one wins.
  11. `@pcp/opendb` holds the pinned commit, and `OPENDB_REPOSITORY_URL` names where the archive is fetched from.
  12. The API's targets get the database password through a committed env file of their own, which names `.env`'s value.
  13. Commit messages follow Conventional Commits 1.0.0, with commitlint's conventional types and the project's folder as the scope, checked by commitlint in a commit-msg hook.
  14. CONTEXT.md gains Specification, Specification list and Needed specification.
- **OpenDB's licence, as found on 14 October 2026.** This is a reading of the licences, not legal advice.
  - Up to commit `ef7e601b78875a931a4ad9fa1ccce7000f3e5ecf` (5 October 2026, 14:25 UTC), OpenDB's licence file was ODC-By 1.0.
  - Commit `80c21e10f1` (5 October 2026, 14:33 UTC) introduced CC BY-NC-SA 4.0 for new data. Its notice said that earlier ODC-By material "retains its earlier permissions, including commercial use". It named commit `2ec94628fa91bcd175742da900b89d56ddcb810d` (4 September 2026) as a legacy baseline, and said that the baseline is not the only ODC-By release.
  - Commit `50059f5ec7` (9 October 2026) reworded the notice to apply CC BY-NC-SA 4.0 to all of OpenDB's data.
  - ODC-By 1.0 section 9 says that releasing the database under different terms "will not withdraw this License", and section 4.3 gives the example notice that the credit follows.
  - The owner chose the last ODC-By commit over the named baseline. It holds a further 117 commits of corrections.
- **OpenDB at the pinned commit:**

  | Category | Parts |
  |---|---|
  | CPU | 789 |
  | CPU cooler | 2,413 |
  | Motherboard | 3,701 |
  | RAM | 4,876 |
  | Storage | 3,495 |
  | GPU | 3,865 |
  | Case | 3,804 |
  | PSU | 3,297 |
  | **Total** | **26,240** |

  - Every record has an `opendb_id` that matches its file name. Its specifications are top-level fields and nested objects, such as a CPU's `cores`, `clocks` and `specifications`. Its name and manufacturer are under `metadata`.
  - Blocks that are not kept: `general_product_information` (US store codes and a manufacturer's link), `identifiers`, apart from the `mpn` values (barcodes and retailer listings), and `metadata` other than the name, the manufacturer and the part numbers.
  - Sampled records show zeros where a value does not apply or is not known, such as a CPU's efficiency cores and its `ppt`.
- **Checked in the npm registry on 14 October 2026:**
  - The latest releases are `drizzle-orm` 0.45.4 (1.0 is at release candidate 5), `drizzle-kit` 0.31.11, `pg` 8.23.1, `effect` 4.0.4 (3.22.2 is the latest Effect 3), `@testcontainers/postgresql` 12.2.1, `sharp` 0.35.5, `react-router` 8.4.0, `@tanstack/react-query` 5.104.2, `react-hook-form` 7.90.0 and `lucide-react` 1.57.0.
  - The workplace's backend uses Drizzle 0.45, `pg` 8, Effect 3.19, Testcontainers 12 and sharp 0.35.
  - Effect 4.0.4 exports no `Either` module, and Effect 3.22.2 does.
  - Weekly downloads: `react-router` 56.8 million and `@tanstack/react-router` 19.9 million; `@tanstack/react-query` 65.1 million and `swr` 19.4 million; `react-hook-form` 53.7 million, `formik` 4.7 million and `@tanstack/react-form` 3.9 million.
  - lucide 1.57 has an icon for each Category: `cpu`, `fan`, `circuit-board`, `memory-stick`, `hard-drive`, `gpu`, `pc-case` and `plug-zap`.
- **Not yet known, and found out first.** Each is settled on the installed tools before the code that depends on it is written, and the finding is recorded in the ticket:
  - How the import fetches the pinned commit, how large the download is and how long the import takes, and how it confirms that it holds that commit.
  - How many records lack a name or a manufacturer. If it is more than a handful, the owner is told before the import is final.
  - Which needed specifications OpenDB fills with 0, and for which of them 0 cannot be true.
  - The set of values each compared specification takes at the pinned commit.
  - How the database password reaches the API under `nx serve`, the import and `pnpm platform:check`. Nx loads a `.env` file at the workspace root into a task's environment by default, and the API's own configuration is told to ignore it.
  - Whether `drizzle-kit` can write the migration that creates `pg_trgm`, and whether the `pcp` user may create it. The extension is trusted in PostgreSQL, so a database's owner can create it.
  - How `pnpm check` finds a schema change that has no migration, without a database.
  - Whether sharp's prebuilt binaries install and load on the owner's Mac and in the Linux image the API will run in.
  - Which of React Router's modes suits a client-rendered app whose routes are declared in the App layer, and how TanStack Query's client and `@pcp/api-client` fit together.
  - Where shadcn/ui's command can write components inside `ui`, with its right-to-left setting on and under `ui`'s single entry.
- **Design and accessibility.** Until now PRODUCT.md has recorded both as undecided, and `languages` deliberately did no visual design. Impeccable's design hook is turned on for this repository, and PRODUCT.md was written as the product record it reads. On 14 October 2026 the owner decided that the design research starts when the first real frontend page is built. The Catalog is that page, so the research is the first frontend ticket here, and DESIGN.md does not exist until it is done.
- **No reset.** The migrations add tables to the platform's database, and `pnpm services:up` applies them to the owner's existing services. Nothing in the realm file or in the database set-up script changes.
- **Next steps.** `accounts` is the other module with no dependencies. `offers` builds on this one: it opens the catalog search in the Vendor portal and builds the CAT-8 list. `compatibility` reads the needed specifications that this module marks.
