# 08: Import from a folder shaped like OpenDB

**Spec:** [the catalog spec](../spec.md)

**What to build:** `pnpm catalog:import`, given a folder shaped like OpenDB, fills the catalog from its eight Category folders. A record becomes a Part when it has an OpenDB ID that matches its file name, a name and a manufacturer. Its part numbers are OpenDB's `part_numbers` together with its `mpn` identifiers. Its specifications are what fits its Category's list, with 0 taken as missing where 0 cannot be true. Barcodes and retailer data are left behind.

A record whose OpenDB ID is already in the catalog is skipped, so a second run changes nothing and the Admin's edits are never lost. Everything is written in one transaction. The import reports, for each Category and in total, what it imported, what was already there and what it left out and why.

The import is a second entry point of the API, as the OpenAPI writer is. It is a Command with its own port for reading OpenDB's records, and reading a folder is infrastructure. Fetching from GitHub arrives in ticket 09. The tests run on hand-written records that are plainly made up. No OpenDB record is copied into the repository.

**Blocked by:** 02, 04, 05, 06

**Status:** resolved

- [x] `ImportCatalogCommand`, with its Input and Output, a port through which it reads records, and an adapter that reads a folder.
- [x] The import reads from a source that names the commit it holds, and refuses one that names any other than the pinned commit. How a folder names its commit is decided here and recorded.
- [x] Only the eight folders are read, mapped to the Categories as the spec lists. Every other folder is ignored.
- [x] A record without an OpenDB ID that is a UUID and matches its file name, without a name or without a manufacturer is left out and named in the report with its reason. Ticket 04's count says how many there will be. If it is more than a handful, the owner is told before this ticket is closed.
- [x] Part numbers are `metadata.part_numbers` together with every `mpn` identifier, cleaned as the API cleans them. Barcodes, retailer listings, store codes and other metadata are not kept.
- [x] A value that does not fit its specification is left out and counted. So is a 0 where 0 cannot be true. A field that the list does not name is ignored.
- [x] A record whose OpenDB ID is in the catalog is skipped. The import never changes or removes a Part.
- [x] Everything is written in one transaction. A failure leaves the catalog as it was, and the command exits non-zero with a plain message.
- [x] The report names the commit and gives, for each Category and in total, the Parts imported, those already there, the records left out and the values left out.
- [x] `pnpm catalog:import` given a folder imports it into the development database. Its Nx target gets the database password the way `serve` and `migrate` do, from a file of its own beside them that names `.env`'s value (see ticket 02's Comments).
- [x] `pnpm integration:check` passes with these tests, which run the import through its entry on a made-up folder and read the result through the report and the API:
  - A complete record of each Category becomes a Part that a search finds.
  - Records without a name, without a manufacturer, or whose ID does not match the file name are left out and named.
  - A record in a `Monitor` folder is not imported.
  - A value of the wrong kind is left out and counted, and a length of 0 is listed among the missing needed specifications.
  - Part numbers combine both sources without duplicates, and no barcode or retailer data is anywhere in the Part.
  - A second run imports nothing, and reports every Part as already there.
  - A Part the Admin edited keeps the edit after a second run, and an edit leaves an imported Part's OpenDB ID as it was. Ticket 05 could not test that last point, because no Part had an OpenDB ID before the import.
  - A run that fails partway, on a record planted to make the database refuse it, leaves no Part behind.
  - A folder that names another commit is refused, and nothing is imported.
- [x] Shown once and then reverted, each failing its own test:
  - the import writing over a Part that is already there;
  - the transaction removed;
  - `Monitor` added to the folders read;
  - 0 kept as a length;
  - the `mpn` identifiers ignored.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 14 October 2026: completed

**For the owner to decide.**

- **28 records are left out, all for having no manufacturer,** as ticket 04 counted: 1 CPU, 1 cooler, 4 motherboards, 2 drives, 1 GPU, 15 cases and 4 power supplies. The report names each file. Giving them a manufacturer would be a change to OpenDB's data.
- **A cooler's list of sockets that names one socket outside the set is left out whole.** That is 31 coolers, which lose `cpu_sockets`, a needed specification, so the cooler rule will say it could not check them.
  - 13 of them name "LGA 115" or "LGA 1121" and no standard form of it. Keeping their other sockets would let the rule call such a cooler unfit for an LGA 1151 CPU it fits.
  - The other 18 name "LGA 1151v2" beside "LGA 1151", and would lose nothing if only the variant were left out.
  - Mapping the variants to values in the set is the owner's call, as ticket 04 recorded. A first version kept the known sockets. The review showed the 13, and that version was reverted.
- **11,191 values are left out.**
  - 11,147 of them are a 0 that stands for "not known". The most are 2,550 GPUs' memory bus, 1,051 motherboards' SATA 6 Gb/s ports, 856 and 752 power supplies' PCIe 6+2-pin and EPS connectors, and about 720 GPUs' memory clock and core count.
  - The other 44 do not fit: 31 coolers' sockets, 2 motherboards' sockets ("LGA 1151v2"), 9 CPUs' integrated graphics boost clock, given with a decimal point, 1 RAM kit's height, below 0, and 1 case's front USB ports, one of them not text.
- **The development database now holds the catalog:** 26,212 Parts, imported from a local copy of OpenDB at the pinned commit, outside the repository. Ticket 09's run from GitHub should find every one of them already there, which checks that it fetched the same data.

**Decided here.**

- **A folder names its commit in a file `COMMIT`,** beside the eight folders, which holds the commit's 40-character identifier and nothing else.
  - A copy of OpenDB says nothing of its commit, so whoever makes the folder writes the file. The import refuses a folder without the file, and a folder whose file names another commit.
  - The file is only as true as whoever wrote it. Ticket 09 has to confirm the commit of what it fetches before it writes one.
- **The folder given is OpenDB's own `open-db` folder.** A relative path is taken from where the command was typed, which pnpm keeps in `INIT_CWD`.
- **A source that lacks one of the eight folders is refused,** so that a folder given by mistake, such as the repository's root, imports nothing.
- **A record is left out, and named, when:**
  - it is not JSON;
  - its OpenDB ID is not a UUID, or is not its file's name;
  - another record read before it has the same OpenDB ID (there are none at the pinned commit);
  - its name or its manufacturer is missing, or holds only spaces, as the Admin's may not.
- **Values left out are counted only for the Parts a run creates,** so a second run counts none.
- **A group of specifications given as anything but an object,** such as a GPU's `power_connectors` as text, is refused when the Admin sends it, as `notAGroup`, and the import counts it. Before, it was taken as an unknown name, and the import lost it without a count. There are none at the pinned commit.
- **Each Part is written by a statement of its own,** all in one transaction, so that a record the database refuses is named in the message. That takes 12.5 s for the whole catalog, where writing a thousand rows at a time took 4.4 s.
- **The Command has no Input.** The source it reads is given to its module and injected, as every other port is. Ticket 09 gives it the fetched commit in the same way.
- **The import has a Store of its own,** `CatalogImportStore`, as the spec asks, although it writes the Part's table. The columns every Store writes, the search text among them, are made by one function, so that the two Stores cannot drift apart.
- **Oxfmt does not format the made-up folder,** because one of its files is not JSON on purpose. Ticket 15's list of conventions gains it, and the import's `.catalog-import.env`.

**The code review found:**

- the OpenDB source carried in the Command's Input rather than injected;
- a repeated OpenDB ID counted as imported although the database skipped it;
- a group of specifications given as text lost without a count;
- a refused record not named, and an unexpected error shown as a stack trace;
- a socket list kept in part, which could cause a false Compatibility Problem;
- the columns and the search text written three times, and the UUID check written twice;
- "imported" meaning two things in the import's code;
- no test of a missing folder, of a file that is not JSON, of a bad OpenDB ID, or of each Category's Part in full;
- that commit messages do not follow the workplace's document on them, and neither does this repository's history. That is left to the owner, in ticket 15.

All but the last are corrected.

**Faults.** Each was planted by a script that refused a dirty tree, made one exact edit, ran the import's and the Part endpoints' tests, and undid the edit. `git status` was clean after every one.

| Fault | Failed |
|---|---|
| The import writing over a Part that is already there | "keeps the Admin's edit through a second run…" and "imports nothing on a second run…" |
| The transaction removed | "leaves no Part behind when the database refuses a record partway through…", and nothing else |
| `Monitor` added to the folders read | "imports nothing from a folder that holds no Category…", the test of every Category's Part, and the second run's table |
| 0 kept as a length | "leaves out and counts a value that does not fit…", the test of every Category's Part, and the second run's table |
| The `mpn` identifiers ignored | "combines the part numbers with the manufacturer part numbers…" and the test of every Category's Part |
| A second record with a taken OpenDB ID kept | "leaves out a record that is not JSON…" and the second run's table |
| A group given as text taken as an unknown name | "refuse a value where a group of specifications belongs…", "leaves out and counts a value that does not fit…" and the second run's table |

**Results.**

- `pnpm check` passes, also with Docker unreachable.
- `pnpm integration:check` passes 92 tests, 11 of them the import's.
- In a throwaway PostgreSQL, the local copy imported 26,212 Parts and left out 28 records and 11,191 values, in 12.5 s and at most about 460 MB. A second run imported none and found 26,212 already there.
- On the development database, `pnpm catalog:import` did the same in 13 s, and a second run in 11 s. The database then held 26,212 Parts with an OpenDB ID, and for each Category as many as the report says, beside the 8 Parts the end-to-end test had created.

### 15 October 2026: the owner's decisions

The owner decided the two questions above, and the import changed with them:

- A cooler that lists "LGA 1151v2" beside "LGA 1151" drops the variant and keeps its other sockets. 18 coolers keep theirs. The 13 that name "LGA 115" or "LGA 1121" are still left out whole.
- A record with no manufacturer takes the one its name begins with, among those its folder's other records name, in the spelling most of them use. The report names each one under "Manufacturers taken from the name".
  - The first run of this on the development database made duplicates. 20 of the 28 records are thinner copies of a complete record of the same manufacturer, with the same part number. The owner chose to leave such a copy out, and the report names it.
  - Another manufacturer's record with the same part number does not make a copy, because OpenDB gives some records another make's part number by mistake.
  - Two more records copy a complete one without sharing a part number with it: "ASRock X370 Killer SLI AM4" and "DeepCool MATREXX 70 RGB". Nothing deletes a Part, so the owner chose to list them in the import as known copies, which it leaves out and names.
  - 4 records take their manufacturer from their name: the Palit RTX 5060 Infinity 2 OC, a KEDIERS case, the Zalman GigaMax 600W and the Cooler Master MWE Gold 550 V2. "MB ASRock AMD TRX50 Threadripper" and the Louqe "Ghost S1" are still left out.

At the pinned commit the import now makes 26,216 Parts, leaves out 24 records, and leaves out 11,173 values. Each change has a planted fault that failed its own test: the variant socket kept; no manufacturer taken from a name; the name's own spelling taken instead of the folder's; the copy check removed; copies counted across all manufacturers; and the list of known copies ignored.

The development database was reset and imported again, and holds 26,216 Parts with no duplicates. The catalog spec's Further Notes list all fourteen of the day's decisions.
