# 03: A Category's filters and price range through the API

**Spec:** [the browse spec](../spec.md)

**What to build:** Anyone, with no Login, can ask the API which filters a Category has and which values its Visible Parts hold for each. Those filters are the manufacturer, the key specifications of BRW-2's table, and the range of Lowest Prices in the chosen currency. Ticket 02's list of Visible Parts can then be narrowed by them. Several values of one filter match a Part that has any of them, and different filters must all match. The filters are stated once, in the API's domain, beside the specification lists, so the Shopper app builds its form from the answer and holds no list of its own.

**Blocked by:** 02

**Status:** resolved

- [x] **The statement.** For each of the eight Categories, BRW-2's filters, each named by the specification's place in the Part's document as the specification list names it, plus the manufacturer. The filters are:
  - CPU: socket, core count.
  - CPU cooler: air or liquid (`water_cooled`), radiator size.
  - Motherboard: socket, form factor, RAM type.
  - RAM: RAM type, total capacity, speed.
  - Storage: SSD or HDD (the drive type), capacity, interface.
  - GPU: chipset, memory.
  - Case: form factor.
  - PSU: wattage, efficiency rating.

  Each filter has the parameter name it is asked by, and this statement is the only place that name is set.
- [x] **The filters' endpoint.** `GET v1/visible-parts/filters` with `category` and `currency`, both required, marked `@Public()` and described with `security: []`. It answers, for the Category:
  - the manufacturers;
  - each filter, by its parameter name, with its values;
  - the lowest and highest Lowest Price in the asked currency, each null when no Part has a Lowest Price.
- [x] **The values.** They are the distinct values the Category's Visible Parts hold, read before any filter or search is applied, so they never shift as the Shopper chooses. Numbers are ordered by size and text alphabetically. Yes-or-no values are booleans. A stored 0 that the specification list says means "not known" is not a value. A filter with no values is left out. There are no counts.
- [x] **Narrowing the list.** `GET v1/visible-parts` gains `manufacturer`, `lowest`, `highest`, and one parameter for each filter of the Category, repeated for several values. Several values of one filter match a Part that has any of them. Different filters must all match. A Part missing a filter's specification, or holding a 0 that means "not known", matches no value of that filter. The search and the filters narrow together.
- [x] **The price range.** `lowest` and `highest` are whole numbers in the chosen currency. Both ends are included, and they are compared with the Lowest Price as answered, after rounding (PRC-4). A Part with no Lowest Price is left out whenever either end is given.
- [x] **Refusals.** Each is 400 with `NOT_VALID`, naming the parameter:
  - a filter's parameter that the Category does not have;
  - a value that is not of the filter's kind;
  - `lowest` or `highest` that is not a whole number;
  - `lowest` above `highest`.
- [x] **If it is slow.** A query against the development catalog, about 26,000 Parts with Offers on a few hundred, answers within a second on the owner's machine. If it does not, an index on a path of the specifications document is added with its migration, as ADR-0005 allows. What was measured is recorded under Comments.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] `pnpm integration:check` gains these tests, written before the code, and passes:
  - Each of the eight Categories' filters, proved at least once on made-up Parts: two values of one filter match either; two filters must both match; a Part missing the specification matches neither. Manufacturer is proved once.
  - A filter's values come only from Visible Parts. They are ordered by size or alphabetically. They stay the same whatever filters the list was asked with. A filter with no values is left out.
  - The price range's ends are the lowest and highest Lowest Price in the asked currency, and are null when no Part has one.
  - The range includes both ends. It compares rounded Lowest Prices: a Part quoted only at 158.80 $ converts at 1,575 to 250,110 IQD, which rounds to 250,000 IQD, so `highest=250000` finds it. It leaves out Parts with no Lowest Price.
  - Each refusal above names its parameter.
- [x] Each of these is shown once and then reverted, and each fails its own test: values read after the filters are applied; a Part missing a specification matching a filter; the range compared with the unrounded price; several values of one filter joined with "and".
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

## Comments

### 4 November 2026: completed

**Commits.** `79be508` moves the rule for a Part that lacks a specification, asked of its document, out of the Part Store into `infrastructure/part/specification-at.ts`, with `specificationAt`, the value at a specification's path, so that the Offer Store asks both; the path is now written into the statement rather than passed with it (see below), and the Parts missing specifications are found as before. `f8bd581` adds the filters' statement, `GET v1/visible-parts/filters`, the filter and price-range parameters of the list, their tests and the client written again; it spans `api` and `api-client` and takes no scope.

**Decisions this ticket left open.**

- **The statement** is `apps/api/src/app/domain/specification/filters.ts`, beside the specification lists. `Filter.of(category, parameter, path)` finds the specification at the path in the Category's own list, so its kind, unit and "0 means not known" come from the list; a path the list lacks, or a specification that holds a list, stops the API at start. The parameters are `socket`, `cores` (`cores.total`); `waterCooled` (`water_cooled`), `radiatorSize`; `socket`, `formFactor`, `ramType` (`memory.ram_type`); `ramType`, `capacity`, `speed`; `driveType` (`storage_type`), `capacity`, `interface`; `chipset`, `memory`; `formFactor`; `wattage`, `efficiencyRating`. They are in camel case, as the Category keys are, and none is one of the list's own (`size` is paging's, so the radiator's is `radiatorSize`). Filters of two Categories asked by one parameter (`socket`, `formFactor`, `ramType`, `capacity`) offer the same kind of value, checked when the statement is read. The manufacturer is the filter every Category has, a Part's own field and no specification, so it is the list's own `manufacturer` parameter rather than an entry of the statement.
- **A filter's kind** is the kind of value it offers: `number` (a whole number), `text` (a fixed set or free text) or `yesNo`. A value asked is read by its kind (Western digits only, `true` or `false`, or the text) and then checked by its specification's own `check`, so a socket outside the shared set, a negative or fractional number and a 0 that stands for "not known" are refused as "not of the filter's kind", naming the parameter.
- **The request declares each filter's parameter from the statement.** `ListVisiblePartsRequest` applies Swagger's and class-validator's decorators to each parameter `filterParameters()` gives, so that no other file names them, the global pipe's whitelist takes them, and the description lists each with the Categories and paths it filters (`socket?: Array<string>`, `cores?: Array<number>`, `waterCooled?: Array<boolean>` in the client). A parameter given once is read as a list of one. A parameter no Category has is refused by the pipe's whitelist, naming it; one the Category lacks, by `choicesOf` in the domain. A guard stops the API at start if a filter's parameter is one the class already declares.
- **The price range** is `PriceRange` in `domain/offer`. `lowest` and `highest` are whole numbers in Western digits, at most 15 of them, so that each is read exactly; anything else (`abc`, `1.5`, `-5`, the empty text, `1e6`) is refused by the request, naming the end. `lowest` above `highest` is refused by the domain, naming `lowest`. The Store compares the Lowest Price as answered, after rounding, with each end times the currency's units in one (cents for USD), so `highest=158` leaves out a Part at 158.80 $ and `highest=159` keeps it.
- **The filters' answer** is `{ manufacturers, filters: [{ parameter, kind, unit?, values }], priceRange: { currency, lowest, highest } }`. The unit is the specification's, left out when it has none, as the Categories' answer does. The ends are decimal text, as a Lowest Price's amount is (`158.80`, `250000`), or null.
- **One statement.** The Lowest Price is no longer written inside the list: `whatTheirOffersSay(client, currency, now)` at the Offer Store's module level gives the current rate and the lateral subquery `offered` of ticket 02, and both the list and the filters' read join them once. `theVisiblePartsOf(category, now)` is the Category with `visiblePart(now)`. The filters' read is one `select` of aggregates over the Category's Visible Parts: `array_agg(distinct manufacturer order by manufacturer)`, one `jsonb_agg(distinct value order by value) filter (where not isMissingAt(…))` per filter in `jsonb_build_array`, and `min` and `max` of `offered.lowest_amount`, so the values, the manufacturers and both ends are read with the rate in one snapshot. JSON orders numbers by size and text by the database's collation, as names are ordered.
- **The path written into the statement.** PostgreSQL takes `jsonb_agg(distinct x order by x)` only when the `order by` is the same expression as the argument, and two bound parameters holding the same path are not, so `specificationAt` writes the path as a literal (`#> '{cores,total}'`), refusing a path that is not letters, digits and underscores.
- **Matching** is `specificationAt(…) in ('"AM5"'::jsonb, '"AM4"'::jsonb)`, JSON against JSON, so that a number matches a number and text matches text. A Part missing the specification holds null there and matches nothing, and a value asked is never one that stands for "not known", so no extra condition is needed for either.
- **The values are read before any filter or search.** The endpoint takes only `category` and `currency`, as the spec's table has it, and refuses any other parameter (the pipe's whitelist), so a request cannot narrow them. The test asks the list with filters that find one Part, then the filters, and finds every value, from Parts that other filters would leave out and from a Part missing another filter's specification.
- **The order of the routes.** `GET v1/visible-parts/filters` is declared after the list and is the only other route in `VisiblePartsController`; ticket 04's `GET v1/visible-parts/{partId}` must be declared after it, or `filters` would be read as a Part's identifier. The controller says so.

**How it was built.** With `mattpocock-skills:tdd`, at seam 2, through the API's HTTP surface, in `apps/api/src/test/infrastructure/offer/endpoints/visible-parts.controller.filters.integration-spec.ts`. The first test, the whole answer of a CPU's filters, was red on 404, and its implementation was the whole read of the filters, so the tests of the values and the range written after it passed when first run. The tests of narrowing, one per filter of every Category, two filters together, the manufacturer, the search with a filter and the total, were written together and were red on 400, the parameters being undeclared; one step made them all pass. The tests of the range were red on 400 too (`lowest` undeclared). The refusals passed when written, from the steps before. The faults below show that each of the ticket's four fails its own test. 49 tests: the whole answer, 6 of the values and 2 of the range's ends; 18 of one filter each (two values match either, and a Part missing it matches neither), 8 of two filters together (each Category's first two, and the case's one filter with its manufacturer), the manufacturer, the search with a filter and the total; 5 of the range; the tokens; and 5 of refusals.

**The faults, each planted once by a script on the committed tree (`f8bd581`), run against that file, and reverted by the inverse edit; `git status` was clean after each.**

| Fault | Tests that failed | Why |
|---|---|---|
| Values read after the filters are applied: the endpoint takes no filter, so the fault narrows the Parts the values are read from as if every filter were on with all its values, keeping only those that hold each filter's specification | The values stay the same whatever filters the list was asked with; a filter none holds is left out; yes or no and a number with its unit; both tests of the range's ends (5 of 49) | AM4 and 14 cores were gone, held by Parts missing the other filter's specification; the tower cooler's `false` was gone for want of a radiator size; the range was null, its Parts holding no specification |
| A Part missing a specification matching a filter (`… is null or … in (…)`) | One filter's two values for each of the 18 filters (18 of 49) | The Part missing the specification, "D", was listed beside "A" and "B" |
| The range compared with the unrounded price (the first in-stock Offer's Quoted Price in the currency, or the other converted without rounding) | Compares the Lowest Price as answered, after rounding (1 of 49) | `highest=250000` found nothing: 158.80 $ at 1,575 was 250,110 IQD, above the end, where the answer shows 250,000 |
| Several values of one filter joined with "and" (one `=` for each value, all required) | One filter's two values for each of the 18 filters (18 of 49) | Two values asked together found no Part, since none holds both |

**If it is slow.** Measured on 4 November 2026 against the development database, which held 30,421 Parts (4,765 CPUs) and about 1,250 Offers on some 1,200 Parts, the end-to-end runs of other tickets adding to them as it was read, 1,059 of them Visible Offers, almost all on CPUs: the API built from this branch, served on port 3103 so as to leave the lock's ports alone, asked over HTTP with `curl` three times each. `GET v1/visible-parts/filters` answered in 5 to 12 ms for each of the eight Categories, the CPUs' slowest; the list in 7 to 13 ms unfiltered, 9 to 16 ms with two sockets, 11 to 12 ms with a price range in USD, and 27 to 28 ms with a search, two filters, a manufacturer, both ends and page 3 together. Every answer is well within a second, so no index was added and no migration was written.

**Checks.** `79be508` and `f8bd581` were each gated on `pnpm check --skip-nx-cache` and `pnpm integration:check`: 430 tests in 15 files, then 479 in 16, 49 of them new. The merge of `browse/integration` at `77db8c8`, ticket 01's shared libraries, is `a8e5586`; it passed `pnpm check --skip-nx-cache`, `pnpm integration:check` (479 tests in 16 files) and, since it brought in changes to the dashboard, `pnpm platform:check` under the lock (288 passed in 10.6 minutes). `pnpm check --skip-nx-cache` passes with Docker stopped on `79be508`, `f8bd581` and `a8e5586`, each checked out in the worktree and installed offline, with `DOCKER_HOST` pointed at a socket that does not exist and an empty `PLAYWRIGHT_BROWSERS_PATH`; Docker itself was left running for the owner's services and the other tickets' runs. This record's commit was gated on `pnpm check` the same way.
