# 07: A GPU above 75 W that lists no power socket is read as not known

**Spec:** [the compatibility spec](../spec.md)

**What to build:** The owner's decision of 7 November 2026. 695 of the 3,852 GPUs imported from OpenDB draw more than 75 W, the most a PCIe slot supplies, yet hold 0 for each of their four kinds of power socket, such as the Asus ROG STRIX GeForce RTX 3080 Ti at 350 W. Read as true, those zeros would let rule 11 pass such a GPU with any PSU. The import now reads them as not known and leaves the four out, so rule 11 is unchecked for such a GPU, and the Admin sees it on Missing specifications, with its four sockets to fill in, once a Vendor offers it. The development database, which a new import does not change, is brought to the same reading in place.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] **The reading.** A GPU whose TDP is above 75 W and which holds 0 for each of its 6-pin, 8-pin, 12VHPWR and 12V-2x6 power sockets is imported without the four. The import counts them among the values it left out, with a reason of its own, which its report prints. A GPU of 75 W or less with no socket keeps its zeros, since a slot powers it; so does one whose TDP is missing; and a GPU with any socket keeps all four counts as given. The reading stands beside the import's other readings of OpenDB's records, with why.
- [ ] **The import's alone.** The Admin may still give any GPU any socket counts, and the GPU's specification list still reads a 0 socket as true. Its comment says how the import reads a GPU above 75 W with none.
- [ ] `pnpm integration:check` gains these tests, on the import's made-up folder, written before the code, and passes:
  - a GPU above 75 W with 0 for each socket is imported without the four, counted among the values left out with its reason;
  - a GPU of exactly 75 W with no socket keeps its zeros;
  - a GPU above 75 W with one 8-pin socket keeps all four counts;
  - the first GPU, once offered, is on Missing specifications with its four power sockets missing, and its Part, read through the API, names the same four paths.
- [ ] **The pinned commit.** The import run in memory over the pinned commit, as the catalog's fix of 7 November 2026 ran it, reads exactly 695 GPUs so and changes nothing else. The run is recorded under Comments.
- [ ] **The development database.** One guarded SQL block, computed from a read-only export of the database, removes the four sockets from the imported GPUs that hold that pattern and from no other Part, and rolls back unless exactly the count the export found changed. It is tried first on a throwaway copy of the database loaded from the export, and run on the owner's database only after the owner's yes, which is recorded under Comments. Afterwards the imported GPUs are what the import's run of the pinned commit makes of them.
- [ ] Shown once and then reverted, failing its own test: the reading taken out of the import.
- [ ] `pnpm integration:check` and `pnpm check` pass, `pnpm check` with Docker stopped.
- [ ] The results of the fault check and of the database's correction are recorded under Comments.
- [ ] The work is committed in pieces, each leaving both checks passing.
