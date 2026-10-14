# 06: Search the catalog through the API

**Spec:** [the catalog spec](../spec.md)

**What to build:** The Admin and Vendors search the whole catalog. A search term is split into words, and a Part matches when every word appears, in any case, in its name, its manufacturer or one of its part numbers. A search can be limited to one Category. Results come in pages, in the workplace's paging shape, ordered by name with the identifier breaking ties, so that moving between pages never skips or repeats a Part. Nobody without a Login can list Parts (CAT-7).

`core` gains the workplace's paging, and PostgreSQL's `pg_trgm` extension indexes the searched text, so that a search over 26,240 Parts stays fast.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Before anything is written, the workplace's paging document is read again, and PostgreSQL's documentation on `pg_trgm` and its indexes is read. The findings are recorded under Comments. It is settled and recorded whether drizzle-kit can write the migration that creates the extension, and whether the `pcp` user may create it.
- [ ] `core` gains the paging request, the paging attributes and the paging answer, in the workplace's shape. The page number counts from 0. The page size has a default and a maximum, and a larger size is refused. The answer holds the page's items, the total found, the page number and size, the total of pages, and whether this is the first or the last page.
- [ ] A migration creates the extension and an index over the searched text.
- [ ] `SearchPartsQuery`, with its Input and Output. The order is by name, and then by identifier.
- [ ] The endpoint answers the Admin and Vendors. Without a token it is answered 401.
- [ ] Each result holds the identifier, the Category, the name, the manufacturer and the part numbers.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] `pnpm integration:check` passes with these tests:
  - A word of the name, of the manufacturer or of a part number finds the Part, in any case.
  - Two words find only Parts that hold both.
  - An empty term finds every Part.
  - A Category limits the results to that Category.
  - Paging returns each Part once across the pages, in name order, with the right totals, and a page past the end is empty.
  - A Vendor's token is answered like the Admin's, and a call without a token is answered 401.
- [ ] Shown once and then reverted, each failing its own test: part numbers left out of the searched text; one word made enough to match; the Category ignored.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
