# 08: Missing specifications for the Admin

**Spec:** [the offers spec](../spec.md)

**What to build:** The Admin console gains Missing specifications, reached from the top bar's menu. It lists every Part that has an Offer and lacks a needed specification, naming the ones it lacks (CAT-8). Each Part leads to its edit form, and saving returns to the list. Once its gaps are filled, it leaves the list, and the aim is to keep the list empty. A Part on the list is still shown to Shoppers.

**Blocked by:** 01

**Status:** resolved

- [x] **The endpoint.** `GET v1/parts/missing-specifications`, for the `admin` role only, through `ListPartsMissingSpecificationsQuery` and `core`'s `PagingRequest`. It answers one page of Parts that have at least one Offer, from any Vendor, expired or not, and lack at least one needed specification. Each Part has its identifier, Category, name and manufacturer, the path and English label of each missing needed specification, and how many Offers it has. The Parts are ordered by Category in the catalog's order, then by Offers, most first, then by name. The needed specifications are read from each Category's specification list in code, and what counts as missing is what the Part's page already marks as missing, "0 means not known" among it. So a change to the list in code changes the answer at once.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] **The screen**, in English, in the top bar's menu. Each row shows the Part's name and manufacturer `AlwaysEnglish`, its Category, the labels of the missing specifications and its count of Offers, and leads to the Part's edit form. Saving the form returns to the list. The total is shown, and an empty list says that nothing is missing.
- [x] Before building, the screen is shown to the owner in the built-in browser in two choices in the dashboard's look. The owner picks one, and the choice is recorded under Comments.
- [x] It follows DESIGN.md and the dashboard's own, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [x] `pnpm integration:check` gains these tests, and passes:
  - A Part with an Offer and an empty needed specification is listed, with that specification named.
  - A Part with the same gap and no Offer is not listed.
  - A Part whose gaps the Admin fills through the Part's edit leaves the list.
  - A needed specification holding 0 where 0 means "not known" counts as missing.
  - A Vendor's token is answered 403, and a call without a token 401.
- [x] `pnpm platform:check` gains these lines, and passes on every line, in a window 360 pixels wide:
  - A made-up Part with an empty needed specification and an Offer from a made-up Vendor is listed. Its row leads to the edit form. After the gap is filled and saved, the list no longer holds it.
  - `expectAccessible` passes on the screen, in the light and in the dark scheme.
- [x] Shown once and then reverted, each failing its own test: Parts with no Offer listed; a specification that is not needed counted as missing.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

## Comments

### 20 October 2026: the API, waiting for the owner's choice of the screen

**Commits so far.** `65716c9` a Part counts a kept 0 as missing where 0 means "not known", `308c750` the endpoint, its tests and the client written again.

**Decisions this ticket left open.**

- **Where it lives.** `GET v1/parts/missing-specifications` is in the Part controller, declared before `GET v1/parts/{partId}`, which would otherwise take `missing-specifications` for a Part's identifier. `ListPartsMissingSpecificationsQuery` is in `domain/part`, and the query is `PartStore.listMissingSpecifications`, which joins the Offers. It is not in the Offer Store, which ticket 02 changes at the same time, and it answers Parts, not Offers.
- **The answer.** One page in `core`'s paged answer, each Part with `id`, `category`, `name`, `manufacturer`, `missingSpecifications`, a list of `{ path, label }` in the Category's list order, and `offerCount`. The labels are the English ones of the list in code. No photo yet: the screen's choice decides whether a row shows one.
- **What counts as missing.** `Specification.isMissingIn(value)`, written once in the domain: nothing, null, an empty text, an empty choice of several or list of text, and 0 where 0 means "not known". An empty list of rows is a value, as before. A Part's page (`missingNeededSpecifications`) now asks the same, so the two cannot disagree. Before, the page counted only a value that was not there; a 0 never reached it, since every endpoint and the import refuse one, but a Part kept before its list said 0 means "not known" could hold one, and the ticket asks that the list count it. The Store asks the same of each Part's document in SQL, built from each specification's kind and flag, so that the database decides which Parts are listed and the page and its total agree.
- **Which Offers count.** Every Offer of the Part, from any Vendor, active or deactivated, expired or not.
- **The order.** Category in the order of `Category.values()`, the catalog's order, then Offers, most first, then name, then identifier, so that moving between pages never skips or repeats one. The page and its total are read in one snapshot, as the catalog search reads them.
- **A kept 0 in a test.** No endpoint can store a 0 where 0 means "not known", so `keepSpecificationsAsTheyAre` in `test-utils/database/test-database.ts` writes a Part's document directly, as a Part kept before its list changed holds it. It is the one place these tests arrange data through the database rather than the API.

**How it was built.** The first test (a Part with an Offer and a gap is listed) and the two refusals were run red first: the list was answered 404 by `GET v1/parts/{partId}`, and a Vendor's token 404 rather than 403. Then the domain, the Store and the endpoint, and the other tests in `part.controller.missing-specifications.integration-spec.ts`, eleven in all, and one more in `part.controller.integration-spec.ts` for a Part's page.

**The faults, each planted once by a script on a clean tree, run against both Part test files, and reverted by restoring the file's text; the tree was clean after each.**

| Fault | Tests that failed | Why |
|---|---|---|
| Parts with no Offer listed (the Offers joined with a left join) | Leaves out a Part with the same gap and no Offer | The Part with no Offer was listed |
| A specification that is not needed counted as missing (the Query passes every specification, not the needed ones) | Five: the not-needed one left out, the one naming the gap, every missing one named, the edit that drops a Part, the kept 0 | A whole CPU was listed for its series, cores and clocks, and the other Parts named them beside TDP |
| Also tried: the Store's SQL not counting 0 where 0 means "not known" | The kept 0 counted as missing, on the list | The Part was not listed |
| Also tried: `isMissingIn` not counting that 0 | The kept 0, on the list and on a Part's page | The page did not name it, and the list named nothing for the Part |

**Checks so far.** `pnpm integration:check` passes with 311 tests in 9 files on `308c750`, and with 300 on `65716c9`. `pnpm check --skip-nx-cache` passes on both in a fresh clone, with `DOCKER_HOST` pointed at a socket that does not exist and an empty `PLAYWRIGHT_BROWSERS_PATH`.

**The screen waits for the owner's choice.** Two decisions are captured at 360 pixels in the Admin console's real frame, from the API's real answer for made-up Parts and Vendors: the rows (the Catalog's rows with a red "Lacks …" line, or rows grouped by Category with marks and a plate each), and the empty list's words. The screen, its end-to-end lines and their accessibility checks are built after the choice.

### 20 October 2026: the owner's choice, and the screen

**The owner's choice.** Shown the two decisions at 360 pixels (`decisions-08`, `#d1` and `#d2`), the owner kept both as recommended:

- **The rows** are the Catalog's own: the Part's picture, its name, one secondary line with its manufacturer, its Category and its count of Offers, then one line in Action Red after a circled exclamation mark, "Lacks TDP, Memory types". The list's total is the screen's one plate. Rows grouped by Category, with a mark for each missing specification and a plate for each count of Offers, were not taken.
- **The empty list** says "Nothing is missing", with a circled tick, and "Every Part with an Offer has all its needed specifications." The wording "No Part to fill in" was not taken.

**Commits.** `bf44133` the Part's photo in the answer and the client written again, `46de9ee` the page in the address moved to `shared/lib`, `bf34dce` the screen, its menu entry, the edit form's return to the list and DESIGN.md, `80ca9d2` the end-to-end lines, `d0adb01` the merge of `offers/integration`, which brought ticket 02, and this record.

**Decisions this part left open.**

- **The photo.** The chosen row shows the Part's picture as the Catalog's does, so the answer gained `photoPath`, read with the Part's photo in the same query, and a test that a Part's photo is answered.
- **The addresses.** The list is `/missing-specifications`, its page in the address as the Vendors' is (`?page=2`), and a Part's edit form is its child, `/missing-specifications/parts/{partId}/edit`. From 64rem the list keeps the start side and the form opens beside it, as the Catalog and the Vendors lay out theirs; on a phone the form takes the whole screen.
- **Returning to the list.** `EditPartPage` takes an optional `returnTo`, an address and a name. The router gives the Missing specifications one, so the form's back link reads "Missing specifications" and saving returns to the list, page kept. From the Catalog nothing changes. The list's query is under the Parts' key, so saving an edit asks for it again and a Part whose gaps were filled is gone at once.
- **The page in the address** moved from the Vendors' slice to `shared/lib` as `usePageInTheAddress`, since both lists use it and one slice may not import another.
- **The menu** names the third section "Missing specifications", after the Catalog and the Vendors. Expiring Offers joins it with ticket 07.
- **The client's index** now exports `MissingSpecificationResponse`, `PartMissingSpecificationsResponse` and `PartsMissingSpecificationsPageResponse`.

**How it was built.** The test of the photo was run red first (no `photoPath` in the answer), then the API, then the screen, then `admin-missing-specifications.spec.ts`. Its first run failed for a reason of its own: it looked for a field named "TDP", which the form labels "TDP (W)". The development database keeps the made-up Parts of earlier runs, so the test pages through the list until it finds its own Part, and after saving pages through it again to see the Part gone.

**The end-to-end lines**, at 360 pixels: the top bar's menu leads to the list; a made-up CPU without its TDP, with an Offer from a made-up Vendor, is on it with "Lacks TDP" and "1 Offer"; its row opens the edit form; after the TDP is filled and saved the list is shown again and no longer holds the Part; the list does not scroll sideways; `expectAccessible` passes on it in the light and the dark scheme.

**A fault in the screen**, planted once by a script while holding the e2e lock and reverted by restoring the file's text: the router gave the edit form no `returnTo`. The first end-to-end line failed, because saving went to `/catalog/parts/{partId}` and not to `/missing-specifications`; the accessibility line passed. The tree was clean after it.

**The merge.** Ticket 02 changed the Part Store's imports, which were joined by hand (its search moved to `search-text.ts`, so `ilike` is gone), and the description and the client were written again with `pnpm api-client:write` rather than merged.

**Checks.** On the merge, `d0adb01`: `pnpm integration:check` passes with 324 tests in 9 files, and `pnpm platform:check` passes on all 134 lines, the two new ones among them. Before the merge, on `80ca9d2`, `pnpm platform:check` passed with 134 lines too and `pnpm integration:check` with 312 tests. `pnpm check --skip-nx-cache` passes on every commit of the ticket, `20d0f88` to `d0adb01`, in a fresh clone with `DOCKER_HOST` pointed at a socket that does not exist and an empty `PLAYWRIGHT_BROWSERS_PATH`. The API is the same from `bf44133` to `80ca9d2`, so its integration run covers those commits. No check here is on a phone, so nothing waits for hosting.
