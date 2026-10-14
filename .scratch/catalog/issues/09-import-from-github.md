# 09: `pnpm catalog:import` from GitHub at the pinned commit

**Spec:** [the catalog spec](../spec.md)

**What to build:** On a fresh installation, `pnpm catalog:import` with no folder given fetches OpenDB's eight Category folders at the pinned commit from GitHub, confirms that it holds that commit, and imports them. That makes success criterion 1 hold with one command. The commit is `ef7e601b78875a931a4ad9fa1ccce7000f3e5ecf`, the last released under ODC-By 1.0. It is written in one place in the repository.

ADR-0001 is amended for OpenDB's licence change, so that nobody later imports newer data by mistake.

**Blocked by:** 02, 08

**Status:** resolved

- [x] Before anything is written, it is settled and recorded under Comments how the commit is fetched, as an archive of the commit or as a shallow clone of the eight folders. The record says how large the download is, and how the import confirms that what it holds is the pinned commit.
- [x] The pinned commit is written in one place, and the import and the footer credit (ticket 14) both use it.
- [x] With no folder given, the import fetches the pinned commit and imports it. What it fetched is kept out of Git.
- [x] Data that is not the pinned commit is refused, and nothing is imported.
- [x] When GitHub cannot be reached or the database cannot be reached, the command says so plainly, exits non-zero and leaves the catalog as it was.
- [x] Run for real on the development database: the report's counts for each Category are recorded under Comments, together with the time it took and the number of records left out. A second run imports none.
- [x] ADR-0001 is amended:
  - OpenDB's licence changed on 5 October 2026.
  - The catalog is imported from the pinned commit, the last released under ODC-By 1.0.
  - Later OpenDB data is under CC BY-NC-SA 4.0 and is not used without the owner's agreement.
  - "About 26,000" becomes the measured 26,240.
- [x] Shown once and then reverted: with the pinned commit changed to another commit in the one place it is written, the import refuses the data it fetched.
- [x] `pnpm check` passes with Docker stopped, and `pnpm integration:check` passes.
- [x] The results of the real run and of the fault check are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 14 October 2026: settled before anything was written

**The commit is fetched as an archive, not as a shallow clone.**

- **The archive** is GitHub's `https://github.com/buildcores/buildcores-open-db/archive/<commit>.tar.gz`, which GitHub sends from `codeload.github.com`.
  - It holds the whole repository at that commit: 16,249,191 bytes compressed, fetched in 2.7 s from Erbil.
  - Only the eight Category folders are read from it, about 86 MB of JSON. Monitors, keyboards, the schemas and the rest are skipped as the archive is read.
  - It needs nothing but HTTPS. A shallow clone would download about the same, but needs Git on whatever machine runs the import, and the machine that runs it in production is not decided yet.
- **The import confirms the commit from the archive itself.**
  - `git archive`, which GitHub uses, writes the commit an archive holds into the archive's first header, as its `comment`. The archive of the pinned commit fetched today says `ef7e601b78875a931a4ad9fa1ccce7000f3e5ecf` there.
  - The import reads that header, and not the address it asked for. Only that commit is imported, so an archive that names another commit, or none, imports nothing.
  - The import trusts GitHub, over HTTPS, to send the archive `git archive` made. Checking each file's hash against the commit's tree would ask the same GitHub for the tree, and would add nothing.
- **The archive is read as it arrives, in memory,** and nothing is written to disk. So nothing fetched can reach Git, and nothing is left behind after a run.
- **The archive is read with node-tar** (`tar` 7.5).
  - node-tar is downloaded about 90 million times a week, and its entries carry the archive's first header, the commit among it.
  - tar-stream, at about 110 million, keeps that header to itself.
  - node-tar has no install script. Its files are never written to disk here, so its past flaws in unpacking to disk do not apply.
- **The pinned commit is written in one new library, `@pcp/opendb`,** tagged `scope:shared` like `compatibility`.
  - It is the only kind of library that both the API and the Shopper app may import, and the footer credit of ticket 14 needs the commit too.
  - The library holds the commit and OpenDB's address, and imports nothing.
  - The MVP spec's list of projects gains it in ticket 15.

### 14 October 2026: completed

**For the owner to decide.**

- **`pnpm catalog:import`, with no folder, now fills the catalog from GitHub in one command.** Into an empty database it imported the counts below in 12.3 s, the download included, and a second run imported none.
- **The development database was already full.** Ticket 08 filled it from a local copy of the pinned commit. The run from GitHub found every one of its 26,212 Parts already there, and left out the same 28 records. That shows that GitHub's archive and the local copy hold the same records.
- **A sixth shared library, `@pcp/opendb`, holds the pinned commit and OpenDB's address.** The import reads them from there, and ticket 14's credit will too.
  - The MVP spec names five shared libraries, so ticket 15's list now asks for it to be added to the projects table.
  - The API's domain is the first to import a library other than `core` and `effect`. ADR-0004 allows it, and the workplace's document on layers does not mention it.
- **A new setting, `OPENDB_REPOSITORY_URL`,** names where the archive is fetched from. Its default is OpenDB's repository on GitHub, and the tests point it at a stand-in.
  - It takes plain HTTP only from this machine, because the import trusts the commit the archive names in its own header.
  - Only the import reads it.
- **The commit is still written in two places besides `@pcp/opendb`,** both on purpose:
  - the import's tests write it out, so that they compare against a value of their own and not against the code they test;
  - the made-up folder's `COMMIT` file names it, as any folder given to the import must.

  That second copy is why the planted fault failed every import test.
- **The import holds up to about 600 MB while it runs,** because it keeps the eight folders' 86 MB of JSON in memory, against about 460 MB from a folder. The 4 GB server the spec plans has room for it.

**The run on an empty database,** a throwaway PostgreSQL 18.6 on the owner's Mac, fetching from GitHub over the owner's connection:

| Category | Imported | Records left out | Values left out |
|---|---|---|---|
| CPU | 788 | 1 | 3,622 |
| CPU cooler | 2,412 | 1 | 180 |
| Motherboard | 3,697 | 4 | 1,065 |
| RAM | 4,876 | 0 | 53 |
| Storage | 3,493 | 2 | 0 |
| GPU | 3,864 | 1 | 4,499 |
| Case | 3,789 | 15 | 111 |
| PSU | 3,293 | 4 | 1,661 |
| **Total** | **26,212** | **28** | **11,191** |

- It took 12.3 s, and a second run took 11.0 s and imported none. Each of the 28 records left out has no manufacturer, as ticket 08 recorded.
- On the development database, the run from GitHub took 12 s and found all 26,212 already there. A second run did the same.

**Plain messages.** Each failure exits non-zero, names what failed, and ends "Nothing was imported":

| When | The message begins |
|---|---|
| GitHub cannot be reached | "GitHub could not be reached to fetch <address>: connect ECONNREFUSED…" |
| GitHub answers with an error | "GitHub answered 503 when asked for <address>." |
| The download is cut off | "The download of <address> was cut off: other side closed." |
| What came is not an archive | "The archive fetched from <address> could not be read: TAR_BAD_ARCHIVE: Unrecognized archive format." |
| The archive names no commit | "The archive fetched from <address> does not say which commit of OpenDB it holds." |
| The archive names another commit | "The source holds OpenDB at commit <commit>, and the import reads only commit ef7e601b…, the last released under ODC-By 1.0." |
| The database cannot be reached | "The database could not be reached, and nothing was imported: connect ECONNREFUSED…" |

The fetch gives up when nothing has come for 60 s. That is not tested, because a test of it would wait a minute.

**The code review found:**

- a failed read that left the download running, and an error answer whose body was not cancelled;
- one 10-minute limit on the whole fetch, where a stalled connection should be given up on sooner;
- a download cut off partway, reported as an unreadable archive and not as GitHub;
- the commit taken from whichever entry first carried one, not from the first;
- an empty folder in the archive taken as missing, where a folder on disk gives it as empty;
- record files sorted by each source, one of them by the machine's language;
- the setting taking plain HTTP from anywhere;
- an error made in the Store only to look at its type, and a general helper kept in a file about OpenDB's records;
- no test of a cut-off download or of an answer that is not an archive;
- ticket 15's list missing the new library and setting.

All are corrected. The review also noted that the whole archive is read before its commit is checked, which costs about 3 s on a refused archive. That is left as it is.

**Faults.** Each was planted by a script that refused a dirty tree, made one exact edit, ran the tests and undid the edit. `git status` was clean after each one.

| Fault | Failed |
|---|---|
| The pinned commit changed in `@pcp/opendb`, the one place it is written | "fetches the pinned commit's archive and imports its eight folders", with the import refusing the archive it fetched: "The source holds OpenDB at commit ef7e601b…, and the import reads only commit 0123…". 16 other import tests failed too, because the tests and the made-up folder name the pinned commit themselves. |
| Plain HTTP taken from any machine | "stop the application when OpenDB's repository is reached over plain HTTP on another machine…", and nothing else |

**Results.**

- `pnpm check` passes, also with Docker unreachable.
- `pnpm integration:check` passes 100 tests, 19 of them the import's.
- ADR-0001 is amended for the change of licence, with the measured 26,240 records, of which 26,212 become Parts.
- The work was committed in four pieces, each leaving `pnpm check` passing:
  - the fetch decision;
  - the fetch itself, with the library, the setting and the tests, which were not split further;
  - the amended ADR;
  - the review's corrections.

