# 08: Missing specifications for the Admin

**Spec:** [the offers spec](../spec.md)

**What to build:** The Admin console gains Missing specifications, reached from the top bar's menu. It lists every Part that has an Offer and lacks a needed specification, naming the ones it lacks (CAT-8). Each Part leads to its edit form, and saving returns to the list. Once its gaps are filled, it leaves the list, and the aim is to keep the list empty. A Part on the list is still shown to Shoppers.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] **The endpoint.** `GET v1/parts/missing-specifications`, for the `admin` role only, through `ListPartsMissingSpecificationsQuery` and `core`'s `PagingRequest`. It answers one page of Parts that have at least one Offer, from any Vendor, expired or not, and lack at least one needed specification. Each Part has its identifier, Category, name and manufacturer, the path and English label of each missing needed specification, and how many Offers it has. The Parts are ordered by Category in the catalog's order, then by Offers, most first, then by name. The needed specifications are read from each Category's specification list in code, and what counts as missing is what the Part's page already marks as missing, "0 means not known" among it. So a change to the list in code changes the answer at once.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] **The screen**, in English, in the top bar's menu. Each row shows the Part's name and manufacturer `AlwaysEnglish`, its Category, the labels of the missing specifications and its count of Offers, and leads to the Part's edit form. Saving the form returns to the list. The total is shown, and an empty list says that nothing is missing.
- [ ] Before building, the screen is shown to the owner in the built-in browser in two choices in the dashboard's look. The owner picks one, and the choice is recorded under Comments.
- [ ] It follows DESIGN.md and the dashboard's own, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [ ] `pnpm integration:check` gains these tests, and passes:
  - A Part with an Offer and an empty needed specification is listed, with that specification named.
  - A Part with the same gap and no Offer is not listed.
  - A Part whose gaps the Admin fills through the Part's edit leaves the list.
  - A needed specification holding 0 where 0 means "not known" counts as missing.
  - A Vendor's token is answered 403, and a call without a token 401.
- [ ] `pnpm platform:check` gains these lines, and passes on every line, in a window 360 pixels wide:
  - A made-up Part with an empty needed specification and an Offer from a made-up Vendor is listed. Its row leads to the edit form. After the gap is filled and saved, the list no longer holds it.
  - `expectAccessible` passes on the screen, in the light and in the dark scheme.
- [ ] Shown once and then reverted, each failing its own test: Parts with no Offer listed; a specification that is not needed counted as missing.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.
