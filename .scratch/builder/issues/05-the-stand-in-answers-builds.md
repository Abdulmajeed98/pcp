# 05: The stand-in API answers Builds, with made-up Builds

**Spec:** [the builder spec](../spec.md)

**What to build:** The stand-in API that `pnpm shopper:inspect` starts answers what the Build page and the picker will read: `GET v1/build` and the picker's conditions on the Category list, from the made-up shop. The made-up shop gains made-up Builds, with the worst cases `break-ui` needs. Ticket 06 renders the design's options with them, and tickets 07 to 09 inspect the pages with them, all without touching the development database. No test of the platform relies on the stand-in.

**Blocked by:** 01, 02, 03, 04

**Status:** ready-for-agent

- [x] **What it answers.** `GET v1/build` and `GET v1/visible-parts` and its filters with the picker's parameters, `GET` alone, from the made-up shop, typed by `@pcp/api-client`'s own types. A change to the API's description that the stand-in does not follow fails `pnpm check`. Writes are still refused with 405 and every other path with 404.
- [x] **It copies no rule of the library.** It judges every Build and every candidate with `@pcp/compatibility` itself, `judgeBuild`, `isCompatible` and `estimatedPowerDrawOf`. Its one reading of the catalog, when the command starts, also reads its Parts' needed specifications and leaves out each one the API answers as missing for the Part, so that it holds no copy of the catalog's rule for what is missing. It also reads each CPU's Integrated graphics and "Cooler included".
- [x] **What no fixed data can carry.** It adds its fixed prices plainly into both views' totals. It states the second view's order and the Complete Build rule as it already states OFF-11's order, each with a comment naming the API's as the one that counts.
- [x] **The made-up Builds**, written once beside the made-up shop, each of its real Parts:
  - an empty Build;
  - a Complete Build with no Problem, quoted partly in USD so that its total is converted;
  - the worst case: a Compatibility Problem, a Compatibility Warning and an unchecked rule together, 8 different RAM kits and 8 different drives, the catalog's two longest Part names, an Unstocked Part, and the Part 20 Vendors offer.
- [x] Each made-up Build's answer is read once through the stand-in in each currency, and what it shows is recorded under Comments: its outcomes, its totals and its Vendors' order.
- [x] A field of the stand-in's answer is misspelt once and then reverted, and `pnpm check` fails on it.
- [x] `pnpm check` passes with Docker stopped.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 8 November 2026: the stand-in's Builds and picker, the made-up Builds and the fault checks

**What it answers.** `answerFromTheStandIn` (`apps/inspector/src/stand-in-api.ts`) answers `GET v1/build` and the picker's conditions on `GET v1/visible-parts` and `GET v1/visible-parts/filters`, `GET` alone, as before every write is refused with 405 `MADE_UP_SHOP_IS_READ_ONLY` and every other path with 404 `NOT_FOUND`. Every answer is typed by `@pcp/api-client`'s own types, which the client now exports (`BuildResponse`, `BuildPartResponse`, `BuildLowestPriceResponse`, `BuildPartInStockResponse`, `BuildVendorResponse`, `BuildMissingSpecificationResponse`, `RuleOutcomeResponse`, `EstimatedPowerDrawResponse`, `ReadBuildData`, `ReadVisiblePartsFiltersData`), and the parameters it reads, `part`, `inStockOnly` and `keepNotCompatible`, are named through `satisfies keyof` the operations' query types, so a field or a parameter the description renames fails the type check (both shown below).

- **The Build.** `part` is read as the API takes it: an identifier, and `:` with a quantity for a RAM kit or a drive. A Part the shop does not offer is left out, as the API leaves out one the catalog does not hold, and a quantity that is not a number is refused 400 `NOT_VALID` naming `part`; nothing else the API refuses is checked, since the Shopper app never sends it, as `browse` ticket 06's stand-in checks no more than its queries need. Parts come in the catalog's order of Categories and then the Build's. Every Part is visible and every price shown, since the shop holds only Visible Offers and a Platform Rate; an Unstocked Part has no Lowest Price.
- **The picker.** `inStockOnly=true` keeps the Parts some Vendor has in stock, on the list and on the filters' values and price range. With `part`, each Part listed answers `compatible`, and those that are not are left out unless `keepNotCompatible=true`; they are judged before they are paged. Without `part` no Part answers `compatible`.

**It copies no rule of the library.** A Build is judged by `judgeBuild` and `estimatedPowerDrawOf`, and a candidate by `isCompatible`, from `@pcp/compatibility`. The rules are handed each Part's needed specifications as the reading of the catalog left them (`neededHeldIn` in `catalog-parts.ts`): the paths `neededSpecificationsOf` answers for its Category, read from the Admin's `GET v1/parts/{partId}`, leaving out each one the answer's `missingNeededSpecifications` names, so a stored 0 the API counts as missing never reaches the rules. The catalog keeps only the fields of a row it does not count as missing, so a row is taken as it is. The same reading takes each CPU's Integrated graphics and Cooler included (`cpuValues`), at the paths the API's CPU list names, each left out when the document does not hold it. A missing specification is labelled from its Part's Specification list, its own label or, for a field of a row, the list's and the field's, as the API's `labelsAt` does.

- **Node and the library.** The commands run their TypeScript in Node, which cannot load `@pcp/compatibility` as written: its relative imports name no extension, which the API's and the Shopper app's bundlers allow. Rather than change the library, `apps/inspector/src/typescript-libraries.ts` registers a resolve hook (`module.registerHooks`, in Node 24) that looks again for a `.ts` file when a relative import from a file under `libs/` is not found, and nothing else. `pnpm shopper:inspect` and `pnpm dashboard:inspect`, whose shop reads the catalog through the same module, load it with `node --import`. Without it both commands stop with `ERR_MODULE_NOT_FOUND`, seen on each; with it both start. The inspector's Jest resolves the library itself.

**What no fixed data can carry**, each beside a comment naming the API's statement as the one that counts: both views' totals add the fixed Shown Prices plainly in cents or dinars (`timesQuantity`, `totalOf`; the API's `totals.ts`); the second view's order is `inTheSecondViewsOrder` (the API's `price-views.ts`), fewest Parts lacked, then the lowest total, then the name in English collation, then the identifier; and the rule for a Complete Build is `completenessOf` (the API's `complete-build.ts`).

**The made-up Builds** are `madeUpBuilds` in `apps/inspector/src/made-up-builds.ts`, beside the made-up shop, each Part by its Category and exact name; `partValuesOf(shop, build)` gives a Build as the API's `part` values, for ticket 07's cookie. Every Part is a real Part the shop offers. The shop gained eight named Offers so that the Builds could hold them, from Vendors 6, 7 and 11 to 16, none of whose tests read them: the MSI MAG A850GL PCIE5 II, which every rule passes with; four kits, the GIGASTONE Game PRO (183 characters, the catalog's longest RAM name), two Corsair Vengeance LPX and a G.Skill Flare X5; and three drives, the Inland Premium 512GB (176, the longest drive name), a Crucial MX500 and a Seagate IronWolf. It now holds 860 Offers of 442 real Parts. Each name was checked unique among the development database's Parts through psql.

- `empty`: no Part.
- `complete`: AMD Ryzen 5 7600X, Noctua NH-D15, MSI MAG B650 TOMAHAWK, two CORSAIR Vengeance kits, a Samsung 990 Pro, the Palit RTX 4070 SUPER beside the CPU's integrated graphics, the Corsair 4000D and the MSI A850GL. The cooler, the board and the PSU are quoted in dollars alone.
- `worstCase`: the AMD Ryzen 7 7800X3D, which 20 Vendors offer; the 276-character Corsair H100i cooler, which holds no CPU socket; the B650 TOMAHAWK; 8 different kits, the Flare X5 16 times; 8 different drives, the Inland 16 times and the IronWolf 4; the 205-character ASUS DUAL RTX 2060 SUPER, which no Vendor has in stock; the 4000D; and the MSI A650BN, one EPS connector for the board's two CPU power sockets.
- **A choice the ticket left no room for: "the catalog's two longest Part names".** Both are CPU coolers, 276 and 210 characters, and a Build holds one cooler (BLD-1), so no Build can hold both. The worst case holds the longest, and the longest name a Build can hold beside it, the GPU's, the third longest in the catalog (205), which also makes it an Unstocked Part; the next longest cooler stays in the picker's list of coolers. Put to the owner in the report.

**Each Build read through the stand-in**, on 8 November 2026, by a script while `pnpm shopper:inspect / --language en --scheme light --widths 390` ran under the lock with the API built from this branch on port 3103 (`API_URL=http://localhost:3103`). The command said "The stand-in API answers at http://127.0.0.1:3101 from the made-up shop: 21 Vendors and 860 Offers of 442 real Parts". The script found each Part's identifier by its exact name in the stand-in's own list, then asked `GET v1/build` for each Build in IQD and in USD, and checked every answer against `apps/api/openapi.json`: every required property, none the description lacks, each of its type, enum and nullability. "Every answer is as the description says." The stand-in refused nothing. The home page's inspection, which this ticket does not change, reported 0 FAIL and 2 WARN.

| Build | Outcomes | Estimated power draw | Total across Vendors | Vendors, in order |
|---|---|---|---|---|
| Empty, IQD and USD | none; not complete, all eight Categories still needed | none | none | none |
| Complete, IQD | complete; all 21 rules pass | 425 W | ≈ 2,693,500 | Made-up PC Parts ≈ 2,253,250 (has 6, lacks 2), Mock Hardware House 140,000, Sample Systems ≈ 203,250, کۆگای پارچەی خەیاڵی 262,000, حاسبات المثال 925,000 (each has 1, lacks 7) |
| Complete, USD | the same | 425 W | ≈ 1,710.00 | the same order: ≈ 1,430.00, 89.00, 129.00, 165.00, 589.00 |
| Worst case, IQD | complete; Problems 3, 4, 5, 6, 13, 14, 15 and 16; Warning 20, naming the board and the PSU; unchecked 2, the cooler's Sockets; 11 pass (1, 7 to 12, 17 to 19, 21) | 435 W | ≈ 6,824,750, leaving out the four Unstocked Parts: the Trident Z5 kit, the SN850X, the 870 Evo and the ASUS GPU | 18: کۆگای پارچەی خەیاڵی 1,089,000 and Made-up PC Parts ≈ 1,392,750 (lack 14), حاسبات المثال 756,000 (15), then lacking 16: Pretend Tech 631,000, ئەلیکترۆنیاتی خەیاڵ 642,000, تەکنەلۆجیای نموونە 664,000, عالم الحاسوب الافتراضي ≈ 670,250, Mock Hardware House 738,000, کۆمپیوتەری وەهمی 783,000, متجر التجربة للإلكترونيات ≈ 789,250, شركة التقنيات الوهمية لتجارة الحاسبات وملحقاتها ≈ 1,236,750, Not-a-Real PC Shop 3,240,000; then lacking 17: Example Electronics Bazaar 562,000, Invented Components & Accessories Trading Company 583,000, Sample Systems 586,000, Fictional Circuits 612,000, Dummy Digital ≈ 628,500, Demo Devices 720,000 |
| Worst case, USD | the same | 435 W | ≈ 4,341.00 | the same order: ≈ 689.00, ≈ 884.00, ≈ 479.00; ≈ 401.00 to ≈ 2,061.00; 357.00 to ≈ 464.00 |

The picker was asked once each too, and answered as the description says: the CPUs for the Complete Build, in stock only with the switch on, 8 (the Ryzen 9 7950X3D, which every Vendor has out of stock, left out), the three AM5 CPUs Compatible; the RAM kits for the worst case in stock only, none, since the Build's rule 5 Problem names every kit whose modules are known, as the compatibility module's conventions say, and with the switch the 7 in stock, each not Compatible; and the RAM filters in stock only, four manufacturers, DDR4 and DDR5, 16, 32 and 64 GB, 3200, 3600 and 6000, from 48,000 to 219,000 IQD.

**The tests**, at the seams `browse` ticket 06 chose for the inspector, each written before its code and seen red for the reason given: `readTheShoppersCatalog` 2 new and its first test extended, `answerFromTheStandIn` 23 new, the made-up Builds 5 in a file of their own, 138 in the inspector in all. The catalog's stand-in for the tests gained a few needed specifications, CPU values and list entries, all made up.

| Test | First run |
|---|---|
| The reading holds each Part's needed specifications, leaving out each one the API answers as missing; and each CPU's two values | Red: neither field in the read Part |
| An empty Build | Red: 404, not one of the endpoints |
| The Parts in order with quantities, Lowest Prices times them and Vendors; in dollars; one the shop does not offer; the refusals | Red: no Part answered, and a bad quantity answered 200 (a missing currency already refused) |
| The total across Vendors in each currency; an Unstocked Part left out of it | Red: the total null |
| The second view: its Vendors, totals, Parts had and lacked, never an Unstocked Part, its order; ties by name, differing between currencies | Red: no Vendor |
| The Complete Build: every Category; a CPU with graphics or a cooler; one holding neither value, or one; none without a CPU, kits and drives counted once | Red: every Category still needed |
| The outcomes judged by the library and the draw; a missing specification labelled, a row's field by the list's and its own label | Red: no outcome |
| The picker: in stock only; Compatible with a Build; the switch; a CPU in place of the Build's; nothing without a Build; paging after judging; the filters in stock only | Red: the conditions ignored, but for "nothing without a Build", which held already. The paging test then failed once on its own miscount of the page, and was corrected |
| The made-up Builds read whole; their part values; the empty, Complete and worst-case Builds | Red: the Builds empty (a first run failed on the missing module, so the module was written with empty Builds and run again) |
| The platform's figures | Failed once the shop gained its eight Offers, 852 to 860, and was brought up to date |

**The fault checks**, each planted by one exact edit on `d819666` by a script that refused a dirty tree, ran `pnpm check --skip-nx-cache` and reverted by the inverse edit; `git status` was clean after each:

| Fault | Edit | Failed |
|---|---|---|
| A field of the stand-in's answer misspelt | `priceNotShown: false` to `priceNotShwon: false` in `buildPartOf` | `@pcp/inspector:typecheck`, TS2561 "'priceNotShwon' does not exist in type 'BuildPartResponse'. Did you mean to write 'priceNotShown'?", and `@pcp/inspector:test`, 2 of 138 |
| Beyond the ticket: a parameter the description does not name | `'keepNotCompatible'` to `'keepNotCompatable'` in its `satisfies` | `@pcp/inspector:typecheck`, TS1360, the text not among the list's query parameters, and `@pcp/inspector:test`, 1 of 138 |

**The pieces**, each gated on `pnpm check` (32 tasks succeeded each time). `pnpm integration:check` and `pnpm platform:check` were not run: the API is unchanged, the client gains type exports alone, and no end-to-end test relies on the stand-in.

- `7fbd367` feat: read the made-up shop's needed specifications from the catalog
- `b95f440` feat: answer GET v1/build from the made-up shop
- `af67a65` feat(inspector): answer the picker's conditions from the made-up shop
- `d819666` feat(inspector): write the made-up Builds beside the made-up shop
- this record

**With Docker stopped.** Each of the four commits passed `pnpm check --skip-nx-cache` in a fresh clone in the scratchpad, after `pnpm install --frozen-lockfile --offline`, with `DOCKER_HOST` pointed at a socket that does not exist and `PLAYWRIGHT_BROWSERS_PATH` at an empty folder: 32 tasks succeeded each time. The owner's services stayed up, so Docker itself was not stopped, as in tickets 01 to 04.
