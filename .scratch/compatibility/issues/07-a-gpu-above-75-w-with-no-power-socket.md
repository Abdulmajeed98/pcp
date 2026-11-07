# 07: A GPU above 75 W that lists no power socket is read as not known

**Spec:** [the compatibility spec](../spec.md)

**What to build:** The owner's decision of 7 November 2026. 695 of the 3,852 GPUs imported from OpenDB draw more than 75 W, the most a PCIe slot supplies, yet hold 0 for each of their four kinds of power socket, such as the Asus ROG STRIX GeForce RTX 3080 Ti at 350 W. Read as true, those zeros would let rule 11 pass such a GPU with any PSU. The import now reads them as not known and leaves the four out, so rule 11 is unchecked for such a GPU, and the Admin sees it on Missing specifications, with its four sockets to fill in, once a Vendor offers it. The development database, which a new import does not change, is brought to the same reading in place.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] **The reading.** A GPU whose TDP is above 75 W and which holds 0 for each of its 6-pin, 8-pin, 12VHPWR and 12V-2x6 power sockets is imported without the four. The import counts them among the values it left out, with a reason of its own, which its report prints. A GPU of 75 W or less with no socket keeps its zeros, since a slot powers it; so does one whose TDP is missing; and a GPU with any socket keeps all four counts as given. The reading stands beside the import's other readings of OpenDB's records, with why.
- [x] **The import's alone.** The Admin may still give any GPU any socket counts, and the GPU's specification list still reads a 0 socket as true. Its comment says how the import reads a GPU above 75 W with none.
- [x] `pnpm integration:check` gains these tests, on the import's made-up folder, written before the code, and passes:
  - a GPU above 75 W with 0 for each socket is imported without the four, counted among the values left out with its reason;
  - a GPU of exactly 75 W with no socket keeps its zeros;
  - a GPU above 75 W with one 8-pin socket keeps all four counts;
  - the first GPU, once offered, is on Missing specifications with its four power sockets missing, and its Part, read through the API, names the same four paths.
- [x] **The pinned commit.** The import run in memory over the pinned commit, as the catalog's fix of 7 November 2026 ran it, reads exactly 695 GPUs so and changes nothing else. The run is recorded under Comments.
- [ ] **The development database.** One guarded SQL block, computed from a read-only export of the database, removes the four sockets from the imported GPUs that hold that pattern and from no other Part, and rolls back unless exactly the count the export found changed. It is tried first on a throwaway copy of the database loaded from the export, and run on the owner's database only after the owner's yes, which is recorded under Comments. Afterwards the imported GPUs are what the import's run of the pinned commit makes of them.
- [x] Shown once and then reverted, failing its own test: the reading taken out of the import.
- [x] `pnpm integration:check` and `pnpm check` pass, `pnpm check` with Docker stopped.
- [ ] The results of the fault check and of the database's correction are recorded under Comments.
- [ ] The work is committed in pieces, each leaving both checks passing.

## Comments

### 7 November 2026: the reading, built test-first

- **Where it is.** `withoutPowerSocketsNotKnown`, in `apps/api/src/app/domain/catalog-import/opendb-record.ts`, beside the import's other readings of OpenDB's records (`withoutRedundantSocket`, `partNumbersKept`), with why: the 695 GPUs, the Asus ROG STRIX GeForce RTX 3080 Ti at 350 W, rule 11, the 299 GPUs of 75 W or less and the 4 with no TDP. It reads the document the GPU list's check keeps, so the TDP and the four counts it compares are values the list took: a TDP above 75, and 0 for each of `pcie_6_pin`, `pcie_8_pin`, `pcie_12VHPWR` and `pcie_12V_2x6`. Such a Part holds no `power_connectors`, as one whose record gives no count does, since the four are all the GPU's list holds there.
- **A reason of its own.** The import's values left out are `ValueLeftOut`s now, whose reason is a `ValueLeftOutReason`: one of the list's `SpecificationProblemReason`s, or `noPowerSocketAbove75W`, which the specification list does not know. The report prints it as "0 for each power socket, where the GPU draws more than the 75 W a PCIe slot supplies", one line for each of the four paths, and counts the four among the GPUs' values left out.
- **The import's alone.** The specification list and `checkSpecifications` are unchanged, so the Admin may give any GPU any counts, and a 0 socket is still true there. The GPU list's comment says how the import reads a GPU above 75 W with none.
- **The tests**, in `import-catalog.integration-spec.ts`, under "a GPU's power sockets", each on a copy of the made-up folder whose GPU is given a TDP, the four counts and a length, so that its sockets are the only needed specifications it can lack:
  1. *Once offered, on Missing specifications with its four power sockets, which its Part names too* (a made-up Vendor and its Offer added by the Admin, and the realm emptied after): written first and run red, the list empty where the GPU was expected, its zeros held as known. Green once the import left the four out of a GPU holding 0 for each.
  2. *Imported without the four, counted among the values left out with its reason*: red, the Part already without them but no line for them in the report. Green once counted with the new reason.
  3. *Exactly 75 W keeps its zeros* and *a missing TDP keeps its zeros*, written together: both red, the zeros left out whatever the TDP. Green once the reading asked for a TDP above 75 W.
  4. *Above 75 W with one 8-pin socket keeps all four counts*: passed when written. The reading asked for 0 in each of the four from its first step, since the file's first test already held the sample's own GPU, 165 W with one 8-pin socket, to its four counts. It was seen failing with a planted fault, below.
  5. *The zeros the Admin gives a GPU above 75 W are kept*: passed when written, the reading being the import's alone. It holds the second box.
  The missing TDP and the last two are beyond the ticket's four; each holds a sentence of the first two boxes.

### 7 November 2026: the pinned commit, read in memory

As the catalog's fix of 7 November 2026 ran it: a script in the session's scratchpad ran `ImportCatalogCommand` over `GitHubOpenDbSource`, the pinned commit's archive read in memory from GitHub, with a Store that only records the Parts it is given, from `apps/api` with `SWC_NODE_PROJECT=tsconfig.app.json node --require @swc-node/register`. It ran once on `686f498`, the tip of `compatibility/integration`, and once with the change, and a second script compared the two runs Part by Part and line by line.

- **Before**: 25,974 Parts, 3,852 GPUs among them. Of the GPUs that hold 0 for each of the four sockets, 695 are above 75 W, 299 at 75 W or less and 4 have no TDP, the spec's figures.
- **After**: the same 25,974 Parts, in the same order, with the same names, manufacturers and part numbers, the same 266 records left out and the same manufacturers taken from names. **Exactly 695 GPUs differ, each only by losing its four 0 sockets**: 143 of 76 to 150 W, 338 of 151 to 250 W and 214 above 250 W, the "Asus ROG STRIX GAMING OC GeForce RTX 3080 Ti 12GB GDDR6X Black / Silver" at 350 W among them. No two records became one Part: the twins are as they were.
- **The report** differs in three places only: the GPUs' values left out, 4,489 before and 7,269 after, and the total's, 11,083 and 13,863, both 2,780 more, four for each of the 695; and four new lines, `gpu, power_connectors.pcie_12VHPWR, 0 for each power socket, where the GPU draws more than the 75 W a PCIe slot supplies: 695`, and the same for `pcie_12V_2x6`, `pcie_6_pin` and `pcie_8_pin`.
- The 299 GPUs of 75 W or less and the 4 with no TDP keep their zeros, and the 2,701 above 75 W with a socket keep their counts.

### 7 November 2026: the fault checks

Each was planted on `8c03ffa` with one exact edit by a script, which ran the import's integration tests and reverted it by the inverse edit; `git status` was clean after each.

| Fault | Failing tests | Why they failed |
|---|---|---|
| The reading taken out of the import: `withoutPowerSocketsNotKnown(checked, category)` replaced by `{ document: checked, leftOut: [] }` | 2 of 32: *imported without the four, counted…* and *once offered, on Missing specifications…* | The GPU above 75 W kept its four zeros, so its specifications held `power_connectors`, and Missing specifications was empty where it was expected |
| The reading loosened from 0 for each socket to 0 for any (`every` to `some`) | 5 of 32: *keeps all four counts of a GPU above 75 W with one 8-pin power socket*, and the four earlier tests that read the sample's own GPU, 165 W with one 8-pin socket | The GPU with one 8-pin socket lost its four counts, and the report counted four values more |

### 7 November 2026: the development database, tried on a throwaway copy

- **Read first**, read-only through `psql`: 25,974 imported Parts, and among the imported GPUs that hold 0 for each power socket, 695 above 75 W, 299 at 75 W or less and 4 with no TDP, as in memory. No Offer, no row of Offer history and no photo names any of the 695. The 317 imported Parts that the two corrections of 7 November 2026 changed hold their time of change from that hour, 11:00 UTC, so a correction sets it, and this block does too.
- **The export**: `pg_dump` of the database, read-only, 25 MB, in the session's scratchpad. One hash of every table's rows, in the order of their identifiers, was the same in the owner's database and in the copy loaded from it: 34,065 Parts (25,974 imported, 8,091 made up), 4,025 Offers, 4,675 rows of Offer history, 398 photos, 1,115 Platform Rates and 7,123 Vendors.
- **Before the block**, the database's imported Parts were exactly what the import made of the pinned commit before the change: 25,974, none stored otherwise.
- **The block**, computed in Node with the import's own `partOfRecord`, each imported Part's stored specifications, name and manufacturer going back through it as a record of its Category's folder: 695 GPUs come out without their four sockets, for the new reason, and every other of the 25,974 Parts comes out exactly as stored. They are the 695 of the in-memory run, and each comes out as the import makes it of the pinned commit. The block is one PL/pgSQL `DO` block around one `UPDATE` from the list of the 695, each with its identifier, its OpenDB ID, the specifications the export read and the corrected ones. It changes a Part only while it is an imported GPU above 75 W that holds exactly the specifications read, with 0 for each socket, and only when the corrected specifications are the read ones without `power_connectors`; it sets the Part's time of change; and it raises an error, which undoes all of it, unless exactly 695 Parts changed.
- **The trial**, on a throwaway `postgres:18.6` container with no published port, loaded from the export, `pcp` a non-superuser owner of its database as in the development services, and the block run as `pcp`:
  1. *The guard.* One of the 695 was changed as an Admin's edit would change it, its TDP from 150 W to 151 W. The block raised "The block would change 694 GPUs, and the export found 695. Nothing is changed.", and every table hashed as before it. The planted change was undone, and the copy hashed as the export again.
  2. *The block*: "NOTICE: The four power sockets of 695 imported GPUs are left out." Only the imported Parts' hash changed; the made-up Parts, Offers, Offer history, photos, Platform Rates and Vendors hashed as before. Row by row, exactly the 695 changed, each only in its specifications, which lost `power_connectors`, and in its time of change; its name, manufacturer, part numbers and search text were as before.
  3. *Afterwards* the copy's imported Parts were exactly what the import makes of the pinned commit with the change: 25,974, none stored otherwise.
  4. *Once more*, on the corrected copy, the block raised ("would change 0 GPUs") and changed nothing.
- The container and its volume were removed. The block waits for the owner's yes before it runs on the owner's database.
