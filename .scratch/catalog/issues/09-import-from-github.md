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
