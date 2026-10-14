# 09: `pnpm catalog:import` from GitHub at the pinned commit

**Spec:** [the catalog spec](../spec.md)

**What to build:** On a fresh installation, `pnpm catalog:import` with no folder given fetches OpenDB's eight Category folders at the pinned commit from GitHub, confirms that it holds that commit, and imports them. That makes success criterion 1 hold with one command. The commit is `ef7e601b78875a931a4ad9fa1ccce7000f3e5ecf`, the last released under ODC-By 1.0. It is written in one place in the repository.

ADR-0001 is amended for OpenDB's licence change, so that nobody later imports newer data by mistake.

**Blocked by:** 02, 08

**Status:** ready-for-agent

- [ ] Before anything is written, it is settled and recorded under Comments how the commit is fetched, as an archive of the commit or as a shallow clone of the eight folders. The record says how large the download is, and how the import confirms that what it holds is the pinned commit.
- [ ] The pinned commit is written in one place, and the import and the footer credit (ticket 14) both use it.
- [ ] With no folder given, the import fetches the pinned commit and imports it. What it fetched is kept out of Git.
- [ ] Data that is not the pinned commit is refused, and nothing is imported.
- [ ] When GitHub cannot be reached or the database cannot be reached, the command says so plainly, exits non-zero and leaves the catalog as it was.
- [ ] Run for real on the development database: the report's counts for each Category are recorded under Comments, together with the time it took and the number of records left out. A second run imports none.
- [ ] ADR-0001 is amended:
  - OpenDB's licence changed on 5 October 2026.
  - The catalog is imported from the pinned commit, the last released under ODC-By 1.0.
  - Later OpenDB data is under CC BY-NC-SA 4.0 and is not used without the owner's agreement.
  - "About 26,000" becomes the measured 26,240.
- [ ] Shown once and then reverted: with the pinned commit changed to another commit in the one place it is written, the import refuses the data it fetched.
- [ ] `pnpm check` passes with Docker stopped, and `pnpm integration:check` passes.
- [ ] The results of the real run and of the fault check are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.

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

