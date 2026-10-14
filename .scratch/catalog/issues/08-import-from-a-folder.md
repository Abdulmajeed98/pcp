# 08: Import from a folder shaped like OpenDB

**Spec:** [the catalog spec](../spec.md)

**What to build:** `pnpm catalog:import`, given a folder shaped like OpenDB, fills the catalog from its eight Category folders. A record becomes a Part when it has an OpenDB ID that matches its file name, a name and a manufacturer. Its part numbers are OpenDB's `part_numbers` together with its `mpn` identifiers. Its specifications are what fits its Category's list, with 0 taken as missing where 0 cannot be true. Barcodes and retailer data are left behind.

A record whose OpenDB ID is already in the catalog is skipped, so a second run changes nothing and the Admin's edits are never lost. Everything is written in one transaction. The import reports, for each Category and in total, what it imported, what was already there and what it left out and why.

The import is a second entry point of the API, as the OpenAPI writer is. It is a Command with its own port for reading OpenDB's records, and reading a folder is infrastructure. Fetching from GitHub arrives in ticket 09. The tests run on hand-written records that are plainly made up. No OpenDB record is copied into the repository.

**Blocked by:** 02, 04, 05, 06

**Status:** ready-for-agent

- [ ] `ImportCatalogCommand`, with its Input and Output, a port through which it reads records, and an adapter that reads a folder.
- [ ] The import reads from a source that names the commit it holds, and refuses one that names any other than the pinned commit. How a folder names its commit is decided here and recorded.
- [ ] Only the eight folders are read, mapped to the Categories as the spec lists. Every other folder is ignored.
- [ ] A record without an OpenDB ID that matches its file name, without a name or without a manufacturer is left out and named in the report with its reason. Ticket 04's count says how many there will be. If it is more than a handful, the owner is told before this ticket is closed.
- [ ] Part numbers are `metadata.part_numbers` together with every `mpn` identifier, cleaned as the API cleans them. Barcodes, retailer listings, store codes and other metadata are not kept.
- [ ] A value that does not fit its specification is left out and counted. So is a 0 where 0 cannot be true. A field that the list does not name is ignored.
- [ ] A record whose OpenDB ID is in the catalog is skipped. The import never changes or removes a Part.
- [ ] Everything is written in one transaction. A failure leaves the catalog as it was, and the command exits non-zero with a plain message.
- [ ] The report names the commit and gives, for each Category and in total, the Parts imported, those already there, the records left out and the values left out.
- [ ] `pnpm catalog:import` given a folder imports it into the development database.
- [ ] `pnpm integration:check` passes with these tests, which run the import through its entry on a made-up folder and read the result through the report and the API:
  - A complete record of each Category becomes a Part that a search finds.
  - Records without a name, without a manufacturer, or whose ID does not match the file name are left out and named.
  - A record in a `Monitor` folder is not imported.
  - A value of the wrong kind is left out and counted, and a length of 0 is listed among the missing needed specifications.
  - Part numbers combine both sources without duplicates, and no barcode or retailer data is anywhere in the Part.
  - A second run imports nothing, and reports every Part as already there.
  - A Part the Admin edited keeps the edit after a second run.
  - A run that fails partway, on a record planted to make the database refuse it, leaves no Part behind.
  - A folder that names another commit is refused, and nothing is imported.
- [ ] Shown once and then reverted, each failing its own test:
  - the import writing over a Part that is already there;
  - the transaction removed;
  - `Monitor` added to the folders read;
  - 0 kept as a length;
  - the `mpn` identifiers ignored.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
