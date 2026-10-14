# 06: Search the catalog through the API

**Spec:** [the catalog spec](../spec.md)

**What to build:** The Admin and Vendors search the whole catalog. A search term is split into words, and a Part matches when every word appears, in any case, in its name, its manufacturer or one of its part numbers. A search can be limited to one Category. Results come in pages, in the workplace's paging shape, ordered by name with the identifier breaking ties, so that moving between pages never skips or repeats a Part. Nobody without a Login can list Parts (CAT-7).

`core` gains the workplace's paging, and PostgreSQL's `pg_trgm` extension indexes the searched text, so that a search over 26,240 Parts stays fast.

**Blocked by:** 01

**Status:** resolved

- [x] Before anything is written, the workplace's paging document is read again, and PostgreSQL's documentation on `pg_trgm` and its indexes is read. The findings are recorded under Comments. It is settled and recorded whether drizzle-kit can write the migration that creates the extension, and whether the `pcp` user may create it.
- [x] `core` gains the paging request, the paging attributes and the paging answer, in the workplace's shape. The page number counts from 0. The page size has a default and a maximum, and a larger size is refused. The answer holds the page's items, the total found, the page number and size, the total of pages, and whether this is the first or the last page.
- [x] A migration creates the extension and an index over the searched text.
- [x] `SearchPartsQuery`, with its Input and Output. The order is by name, and then by identifier.
- [x] The endpoint answers the Admin and Vendors. Without a token it is answered 401.
- [x] Each result holds the identifier, the Category, the name, the manufacturer and the part numbers.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] `pnpm integration:check` passes with these tests:
  - A word of the name, of the manufacturer or of a part number finds the Part, in any case.
  - Two words find only Parts that hold both.
  - An empty term finds every Part.
  - A Category limits the results to that Category.
  - Paging returns each Part once across the pages, in name order, with the right totals, and a page past the end is empty.
  - A Vendor's token is answered like the Admin's, and a call without a token is answered 401.
- [x] Shown once and then reverted, each failing its own test: part numbers left out of the searched text; one word made enough to match; the Category ignored.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 14 October 2026: completed

**For the owner to decide.**

- **Paging takes the workplace's shape and names:** `page` counted from 0, `size` defaulting to 10, and an answer with `content`, `pageNumber`, `pageSize`, `totalElements`, `totalPages`, `first` and `last`.
  - The largest size is 100, and the largest page number is 1,000,000, so that a page far past the end is answered as empty and never refused by the database.
  - There is no `sort` parameter: a search is always in name order, then by identifier.
- **Words are matched as written, in any case.** A Part with a word with an accent, or in Arabic script, is found only by the same letters, because nothing folds them. A word of fewer than three letters cannot use the index and is matched by reading every Part, which is quick enough at 26,240.
- **The searched text is a column of its own, kept by the Store.** It holds the name, the manufacturer and the part numbers, in lower case.
  - PostgreSQL cannot index the part numbers joined inside a query, because `array_to_string` is not immutable.
  - The column has no default, so a new way of writing Parts, such as the import, cannot compile without filling it.

**Found out first.**

- **PostgreSQL 18's documentation on `pg_trgm`:**
  - the extension is trusted, so a database's owner can create it without a superuser;
  - its GIN operator class `gin_trgm_ops` serves `LIKE` and `ILIKE` with a pattern that is not anchored at the start;
  - a pattern with no trigrams falls back to scanning the whole index.
- **The extension needs SQL that drizzle-kit cannot write from the schema.** `pnpm db:generate <name> --custom` now writes an empty migration that drizzle-kit records in its journal, and it was filled by hand. That is one departure from the workplace's "always generate", and the spec allows it.
- **On the development database,** `pnpm db:migrate` created the extension as the `pcp` user.
- **`%`, `_` and `\`** in a word are escaped and taken as themselves, and the pattern is sent as a parameter.

**The code review found:**

- the total described as a count on every page, in the description and the client;
- a huge page number answered 500;
- the count and the page read apart, so that a Part created between them could make them disagree. They now share one snapshot;
- Parts stored before the column existed left unsearchable. A migration now fills them: on the development database, 6 of its 7 test Parts had none before it and none lacked one after;
- the column's empty default, which would have let the import create Parts nobody could find;
- names that differed from the workplace's paging.

All are corrected, and the tests gained a backslash and a page far past the end.

**Faults.** Each was planted by a script that refused a dirty tree, made one exact edit, ran the tests and undid the edit. `git status` was clean after every one.

| Fault | Failed |
|---|---|
| Part numbers left out of the searched text | "finds a Part by a word of its name, of its manufacturer or of a part number", and nothing else |
| One word made enough to match | "finds only the Parts that hold every word" and the Category test, which searches with a word both Parts hold |
| The Category ignored | "finds only the Parts of a Category when one is given", and nothing else |

**Results.**

- `pnpm check` passes.
- `pnpm integration:check` passes 66 tests.
- `pnpm platform:check` passes 29 tests.

The photo's address in each result comes with ticket 07.
