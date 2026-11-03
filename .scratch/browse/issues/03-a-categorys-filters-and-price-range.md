# 03: A Category's filters and price range through the API

**Spec:** [the browse spec](../spec.md)

**What to build:** Anyone, with no Login, can ask the API which filters a Category has and which values its Visible Parts hold for each. Those filters are the manufacturer, the key specifications of BRW-2's table, and the range of Lowest Prices in the chosen currency. Ticket 02's list of Visible Parts can then be narrowed by them. Several values of one filter match a Part that has any of them, and different filters must all match. The filters are stated once, in the API's domain, beside the specification lists, so the Shopper app builds its form from the answer and holds no list of its own.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] **The statement.** For each of the eight Categories, BRW-2's filters, each named by the specification's place in the Part's document as the specification list names it, plus the manufacturer. The filters are:
  - CPU: socket, core count.
  - CPU cooler: air or liquid (`water_cooled`), radiator size.
  - Motherboard: socket, form factor, RAM type.
  - RAM: RAM type, total capacity, speed.
  - Storage: SSD or HDD (the drive type), capacity, interface.
  - GPU: chipset, memory.
  - Case: form factor.
  - PSU: wattage, efficiency rating.

  Each filter has the parameter name it is asked by, and this statement is the only place that name is set.
- [ ] **The filters' endpoint.** `GET v1/visible-parts/filters` with `category` and `currency`, both required, marked `@Public()` and described with `security: []`. It answers, for the Category:
  - the manufacturers;
  - each filter, by its parameter name, with its values;
  - the lowest and highest Lowest Price in the asked currency, each null when no Part has a Lowest Price.
- [ ] **The values.** They are the distinct values the Category's Visible Parts hold, read before any filter or search is applied, so they never shift as the Shopper chooses. Numbers are ordered by size and text alphabetically. Yes-or-no values are booleans. A stored 0 that the specification list says means "not known" is not a value. A filter with no values is left out. There are no counts.
- [ ] **Narrowing the list.** `GET v1/visible-parts` gains `manufacturer`, `lowest`, `highest`, and one parameter for each filter of the Category, repeated for several values. Several values of one filter match a Part that has any of them. Different filters must all match. A Part missing a filter's specification, or holding a 0 that means "not known", matches no value of that filter. The search and the filters narrow together.
- [ ] **The price range.** `lowest` and `highest` are whole numbers in the chosen currency. Both ends are included, and they are compared with the Lowest Price as answered, after rounding (PRC-4). A Part with no Lowest Price is left out whenever either end is given.
- [ ] **Refusals.** Each is 400 with `NOT_VALID`, naming the parameter:
  - a filter's parameter that the Category does not have;
  - a value that is not of the filter's kind;
  - `lowest` or `highest` that is not a whole number;
  - `lowest` above `highest`.
- [ ] **If it is slow.** A query against the development catalog, about 26,000 Parts with Offers on a few hundred, answers within a second on the owner's machine. If it does not, an index on a path of the specifications document is added with its migration, as ADR-0005 allows. What was measured is recorded under Comments.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] `pnpm integration:check` gains these tests, written before the code, and passes:
  - Each of the eight Categories' filters, proved at least once on made-up Parts: two values of one filter match either; two filters must both match; a Part missing the specification matches neither. Manufacturer is proved once.
  - A filter's values come only from Visible Parts. They are ordered by size or alphabetically. They stay the same whatever filters the list was asked with. A filter with no values is left out.
  - The price range's ends are the lowest and highest Lowest Price in the asked currency, and are null when no Part has one.
  - The range includes both ends. It compares rounded Lowest Prices: a Part quoted only at 158.80 $ converts at 1,575 to 250,110 IQD, which rounds to 250,000 IQD, so `highest=250000` finds it. It leaves out Parts with no Lowest Price.
  - Each refusal above names its parameter.
- [ ] Each of these is shown once and then reverted, and each fails its own test: values read after the filters are applied; a Part missing a specification matching a filter; the range compared with the unrounded price; several values of one filter joined with "and".
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.
