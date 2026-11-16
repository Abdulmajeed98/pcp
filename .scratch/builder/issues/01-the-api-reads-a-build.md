# 01: The API reads a Build: its Parts and whether it is a Complete Build

**Spec:** [the builder spec](../spec.md)

**What to build:** Anyone, with no Login, can give the API a Build and read it back. A Build is a list of Part identifiers, with a quantity for each RAM kit and drive. The API answers the Build's Parts in the catalog's order of Categories, each with its summary, its quantity and whether it is a Visible Part. It also answers whether the Build is a Complete Build and which Categories it still needs. The rule for a Complete Build is written here once. This is the endpoint that tickets 02 and 03 extend with the rules' outcomes and the price views, and that `sharing` will read a shared Build through. No Shopper page reads it yet: the integration tests prove it.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] **The word.** **Unstocked Part** is added to CONTEXT.md under Shoppers and builds before any code uses it, as the spec defines it: a Part in a Build that no Vendor has in stock among its Visible Offers, whether or not it is still a Visible Part. Its words to avoid are "unavailable part", "missing part" and "sold-out part". CONTEXT.md already tells us to avoid "available part" for a Visible Part.
- [x] **The endpoint.** `GET v1/build`, marked `@Public()` and described with `security: []`, answers the same with a good token, a bad one or none. `currency` is required and refused as `pricing` refuses it, though only ticket 03 answers a price, so that the contract does not change later.
- [x] **The Build in the query.** `part` is repeated. Each value is a Part's identifier, followed for a RAM kit or a drive by `:` and its quantity. The API reads each Part's Category from the catalog. With no `part`, it reads an empty Build. The request and its reading are written once, so that ticket 04's picker takes the Build the same way.
- [x] **Refusals**, each 400 `NOT_VALID` naming `part`:
  - a value that is not a Part's identifier;
  - a quantity on a Part that is not a RAM kit or a drive;
  - a RAM kit or a drive with no quantity;
  - a quantity that is not a whole number from 1 to 16 in Western digits;
  - two Parts of a Category that holds one;
  - one Part given twice;
  - more than 8 different RAM kits, or more than 8 different drives.
- [x] **A Part the catalog does not hold** is left out of the answer, not refused, so that an old Build still opens.
- [x] **The Parts**, in the catalog's order of Categories, and the Build's order for kits and drives. Each has the catalog's summary (identifier, Category, name, manufacturer, part numbers and photo's path), its quantity when it is a kit or a drive, and whether it is a Visible Part. Visibility is read through the rule `browse` wrote once, never a copy.
- [x] **A Complete Build** holds a CPU, a motherboard, at least one RAM kit, at least one drive, a case and a PSU. It also holds a GPU unless the CPU has integrated graphics, and a CPU cooler unless the CPU includes one. The rule is written once, in the API's domain, beside the Build's reading.
  - A CPU **has integrated graphics** when its Integrated graphics specification is held and is not "None", as OpenDB writes a CPU without them.
  - It **includes a cooler** when its "Cooler included" specification is yes.
  - A CPU missing either specification counts as not providing it. The answer says which of the CPU's values is not known, so that the page can say why the GPU or the cooler is still needed.
  - Without a CPU, the GPU and the CPU cooler are still needed.
- [x] **The Categories still needed** are answered in the catalog's order. An empty Build needs every Category.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] `pnpm integration:check` gains these tests, written before the code, and passes:
  - An empty Build answers no Part, is not complete, and needs every Category.
  - Each of the CPU, motherboard, RAM, storage, case and PSU, when missing, is listed as still needed. A Build holding all of them, a GPU and a CPU cooler is complete.
  - A CPU with integrated graphics makes the GPU unneeded, a CPU written "None" needs one, and a CPU missing the specification needs one, with the answer saying the value is not known. The same holds for "Cooler included" and the CPU cooler.
  - Two RAM kits and three drives count as RAM and storage once each, and their quantities are answered.
  - The Parts come in the catalog's order of Categories, whatever order they were given in.
  - A Part that is no longer visible, because its only Offer expired or its only Vendor was deactivated, is answered as not visible, and is still in the Build.
  - An identifier the catalog does not hold is left out.
  - Each refusal above names `part`. A missing or wrong `currency` is refused, naming its field.
  - An Admin's or a Vendor's token changes nothing in the answer.
- [x] Each of these faults is planted once and then reverted, and each fails its own test: a CPU's "None" read as integrated graphics; a missing "Cooler included" read as yes; a second CPU accepted; a quantity on a CPU accepted.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

## Comments

### 8 November 2026: reading a Build, the Complete Build rule and the fault checks

**The word.** CONTEXT.md gained **Unstocked Part** under Shoppers and builds, after **Complete Build**, in its own first commit (`da53d10`). No code of this ticket uses it: ticket 03 answers the prices that make a Part unstocked.

**The endpoint and the Build in the query.**

- `GET v1/build` is `BuildController.readBuild` in `apps/api/src/app/infrastructure/build/`, the client's `readBuild`, `@Public()` with `security: []` in the description (checked in `openapi.json`). `ReadBuildRequest` declares `currency` with `ChosenCurrencyAsked`, the decorator `pricing` and `browse` use, so it is refused as they refuse it. The Query does not read it yet; ticket 03 passes it on.
- `part` is declared by `BuildAsked`, in `infrastructure/build/endpoints/build-asked.ts`, as `CategoryAsked` is for `category`, and read by `BuildReading`, in `domain/build/`, an injectable rule that `BuildModule` exports, as `VendorModule` exports `VendorAccessRule`. Ticket 04 declares `part` on the Category list's request with `BuildAsked` and injects `BuildReading`.
- `BuildReading.read(values, now)` reads each value (`partsAskedIn`, `parts-asked.ts`), asks the `BuildStore` for the Parts the catalog holds, and builds the `Build` (`Build.of`, `Build.ts`), which holds BLD-1's rules and the order. `DatabaseBuildStore` reads each Part's row and photo with whether it is a Visible Part as one column, `visiblePart(now)`, the rule `browse` wrote once, in one statement; `visible-offer.ts`'s comment now names a Build's Parts among its readers. The Query reads now once.
- An identifier is read in either case, as `isUuid` takes it, and answered as the catalog writes it; a Part named in both cases is one Part given twice.
- A value naming a Part the catalog does not hold is dropped after its form is read, so `<unknown>:17` is still refused, and the catalog's rules (a quantity, two of a Category, the limits) are judged on the Parts it holds.

**The refusals.** Each is 400 `NOT_VALID` with `field: 'part'` and a `reason`, which the ticket does not ask for; it is added as the Offer's details and the Platform Rate name theirs, so that each test proves its own refusal: `notAnIdentifier`, `notAQuantity` (anything but a whole number from 1 to 16 in Western digits: `0`, `17`, `1.5`, `٢`, `1e1`, an empty one, one with a space, `2:2`), `repeated`, `quantityGiven`, `quantityMissing`, `twoOfACategory` and `tooMany`. They are judged in that order: each value's form, then a Part given twice, then each Part the catalog holds in the Build's order, then the limits. The limits are written once, `MOST_DIFFERENT_KITS_OR_DRIVES` (8) and `MOST_OF_ONE_KIT_OR_DRIVE` (16), in `Build.ts`. A Build of 8 kits, 8 drives and a Part of each other Category, 22 `part` values, is taken.

**The answer.** `parts`, each the catalog's `PartSummaryResponse` with `quantity` (null for a Part of a Category a Build holds one of) and `visible`; `complete`; `stillNeeded`, Category keys in the catalog's order; and `cpuValuesNotKnown`, a list of `integratedGraphics` and `includesCooler`.

**The Complete Build rule** is `completenessOf(build)` in `domain/build/complete-build.ts`, beside the reading. It reads the CPU's two values through the CPU list's own specifications, which `cpu.specifications.ts` now names once, `integratedGraphics` and `coolerIncluded`, and through `Specification.isMissingIn`, so a value the catalog counts as missing (nothing, null, an empty text) is not held and provides nothing. "None" is compared exactly, as OpenDB writes it: the 774 imported CPUs in the development database hold 409 "None" and 365 other models, and 237 yes and 537 no for "Cooler included", read through psql on 8 November 2026. `cpuValuesNotKnown` lists each value the Build's CPU does not hold, whether or not the Build holds the GPU or the cooler, and none without a CPU; the Build page says why a GPU or a cooler is needed beside that Category in `stillNeeded`.

**The tests**, 30 in `apps/api/src/test/infrastructure/build/endpoints/build.controller.integration-spec.ts`, were each written before their code and run, one slice at a time, with the reason each failed read:

| Test | First run |
|---|---|
| An empty Build | Red: 404, no endpoint |
| A Part's summary | Red: 400, `part` not declared |
| A value that is not an identifier | Red: 500, the database refused the text as a UUID |
| The catalog's order and the quantities | Red: 400, `id:2` refused as no identifier |
| An identifier the catalog does not hold | Passed: the Store's read already drops it |
| An identifier in capitals | Red: found by the database but not matched back, so no Part answered |
| Visible, expired at 14 days and a millisecond, deactivated and reactivated | Red: every Part answered not visible |
| Each of the seven refusals of `part` | Red: 200 |
| A missing, empty or unknown `currency`; an undeclared parameter; the tokens | Passed: `ChosenCurrencyAsked`, the global pipe and `@Public()` already give them |
| Complete with every Category; each of the six missing; "None" needs a GPU; "no" needs a cooler; no CPU needs both; two kits and three drives | Passed on the rule as the first slice wrote it, every Category not held |
| Integrated graphics make the GPU unneeded | Red: the GPU still needed |
| Integrated graphics not held, and held as an empty text | Red: `cpuValuesNotKnown` empty |
| A cooler included makes it unneeded; not held; neither value held | Red: the cooler still needed, or not said to be not known |

**The fault checks**, each planted by one exact edit on `7d8b8f8` by a script that refused a dirty tree, ran the test file, and reverted by the inverse edit; `git status` was clean after each:

| Fault | Edit | Failed |
|---|---|---|
| A CPU's "None" read as integrated graphics | `provides: (value) => value !== 'None'` to `provides: () => true` in `complete-build.ts` | `written "None" needs one`: complete, with no GPU still needed |
| A missing "Cooler included" read as yes | `provides` answers true for the cooler's value when the CPU does not hold it | `not held needs one, …` and `needs both a GPU and a CPU cooler …`: no cooler still needed |
| A second CPU accepted | `twoOfACategory`'s condition skips the CPU in `Build.of` | `refuse two Parts of each Category …`: 200 for two CPUs |
| A quantity on a CPU accepted | `quantityGiven`'s condition skips the CPU in `Build.of` | `refuse a quantity on a Part of each Category …`: 200 for a CPU with `:1` |

**The pieces.** Each commit was gated on `pnpm integration:check` (21 suites; 566 tests after the second, 578 after the third) and `pnpm check --skip-nx-cache` after deleting every `*.tsbuildinfo`:

- `da53d10` docs: name the Unstocked Part in CONTEXT.md
- `3460b71` feat: read a Build's Parts through GET v1/build
- `7d8b8f8` feat: answer whether a Build is a Complete Build

**With Docker stopped.** Each of the three commits passed `pnpm check --skip-nx-cache` in a fresh clone in the scratchpad, after `pnpm install --frozen-lockfile --offline`, with `DOCKER_HOST` pointed at a socket that does not exist and `PLAYWRIGHT_BROWSERS_PATH` at an empty folder: 32 tasks succeeded each time. The owner's services stayed up, so Docker itself was not stopped.
