# 05: The Admin edits a Part through the API

**Spec:** [the catalog spec](../spec.md)

**What to build:** The Admin corrects a Part. An edit replaces the Part's name, manufacturer, part numbers and specifications as a whole, as the form will send them, so a specification the edit leaves out is cleared and its rule becomes unchecked rather than wrong. The Category of a Part never changes. Only the Admin edits, and the API itself refuses a Vendor.

**Blocked by:** 03

**Status:** resolved

- [x] `EditPartCommand`, with its Input and Output, and an endpoint that only the Admin may call.
- [x] An edit holds the name, the manufacturer, the part numbers and the specifications, checked exactly as creation checks them, part numbers cleaned in the same way.
- [x] An edit has no Category. One sent with it does not change the Part's Category.
- [x] The Part's OpenDB ID and its creation time are unchanged. Its time of last change is updated.
- [x] A Part that does not exist is answered 404 with its code. A Vendor's edit is answered 403, and an edit without a token 401.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] `pnpm integration:check` passes with tests for each item above, among them:
  - An edit that leaves out a needed specification makes the Part list it as missing.
  - A value outside a fixed set is refused, naming the specification.
- [x] Shown once and then reverted, each failing its own test: the Vendor role added to editing; an edit that merges with the stored specifications instead of replacing them.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing: the edit as one piece, and the review's corrections as another.

## Comments

### 14 October 2026: completed

**For the owner to decide.**

- **A Category sent with an edit is refused with 400**, naming `category`, rather than ignored. That is the API-wide rule ticket 01 set, which refuses a field a Request does not declare. Either way the Category does not change, as the spec asks.
- **The Part's answer now says when the Part was created and when it last changed** (`createdAt`, `updatedAt`), as ticket 01's Comments promised. Both times come from the database's clock. The review found that an edit first took the API's clock, so a Part could have seemed to change before it was created.
- **Two edits at once: the last one wins.** Nothing asks the Admin to reload a Part someone else changed in the meantime. There is one Admin, and the spec asks for no more.

**How it works.**

- Create and edit share one Request base, holding the name, the manufacturer, the part numbers and the specifications. Creating adds the Category.
- `EditPartCommand` reads the Part first, for its Category, so that it checks the specifications against the right list. It then replaces what the edit holds, and the Store's update touches nothing else.
- A Part that does not exist is answered 404 with `PART_NOT_FOUND`, the same error reading one gives.

**Not tested here.** That an edit leaves an imported Part's OpenDB ID as it was cannot be tested yet: every Part so far was created by the Admin, with none. The Store's update does not touch the column. Ticket 08 now tests it on an imported Part.

**The code review found:**

- the two clocks;
- an edit's tests covering only one of creation's checks, now joined by a blank name and an unknown specification;
- a few smaller things: a check of the identifier's form written twice, and a long chain of unwrapping in the command.

All are corrected.

**Faults.** Each was planted by a script that refused a dirty tree, made one exact edit, ran the tests and undid the edit. `git status` was clean after every one.

| Fault | Failed |
|---|---|
| The Vendor role added to editing | "refuses a Vendor, and changes nothing", and nothing else |
| An edit that merges with the stored specifications instead of replacing them | "replaces the name, the manufacturer, the part numbers and the specifications, and keeps the rest", and nothing else |

**Results.**

- `pnpm check` passes.
- `pnpm integration:check` passes, with 49 tests of the Part endpoints.
- `pnpm platform:check` passes 29 tests.
