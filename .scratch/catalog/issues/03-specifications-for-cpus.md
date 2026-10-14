# 03: Specifications, end to end for CPUs

**Spec:** [the catalog spec](../spec.md)

**What to build:** A CPU carries its specifications. The API holds the CPU's specification list. The list gives each specification's place in OpenDB's field names and nesting, its English label, its kind, its unit, its fixed set of values where a rule compares it, whether it is needed, and whether 0 can be true for it.

The API answers the eight Categories with their lists. A CPU is created with specifications that are checked against its list, and reading it back gives them and lists the needed ones that are missing. The other seven lists arrive in ticket 04, and until then they are empty.

This ticket builds the mechanism every list uses, on one Category. A new ADR records how specifications are stored, because changing it once real Vendor data exists needs the owner's agreement.

**Blocked by:** 01

**Status:** resolved

- [x] Before anything is written, OpenDB's `CPU` folder at the pinned commit `ef7e601b78875a931a4ad9fa1ccce7000f3e5ecf` is read from a local copy, which is not committed. The findings are recorded under Comments:
  - every CPU field and the kind of value it holds;
  - the values the socket and the memory types take;
  - which needed CPU specifications hold 0, and where 0 cannot be true.
- [x] The list knows these kinds: a whole number, a decimal number, text, yes or no, one of a fixed set, several of a fixed set, a list of text, and a list of rows whose own fields have kinds. Each entry has an English label and, where it has one, a unit.
- [x] The CPU's list covers every field OpenDB defines for a CPU except retailer and identity data. Its needed specifications are the three that the MVP spec's rule table names: `socket`, `specifications.memory.types` and `specifications.tdp`.
- [x] A specification that a rule compares for equality is one of a fixed set, or several of one. The set is the values found at the pinned commit.
- [x] A Part's specifications are stored as one JSON document in OpenDB's field names and nesting, added by a generated migration.
- [x] A new endpoint answers the Admin and Vendors with the eight Categories, each with its key and its specification list. Without a token the call is answered 401.
- [x] Creating a Part takes its specifications, and every value is checked against the Category's list. Each of these is refused with an answer that names the specification:
  - a value outside a fixed set;
  - a word where a number belongs;
  - a specification the list does not name;
  - a row of the wrong shape: built, but tested through the API in ticket 04, because a CPU has no list of rows;
  - 0 where 0 cannot be true.
- [x] Reading a Part gives its specifications and lists the needed specifications it is missing.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] A new ADR records that specifications are stored as one JSON document per Part, in OpenDB's field names, and that each Category's specification list describes them.
- [x] `pnpm integration:check` passes with tests for each item above:
  - A CPU with every kind of value is created and read back.
  - A CPU with some specifications missing lists the missing needed ones.
  - Each refusal names its specification.
  - The Categories' answer holds the eight Categories, and the CPU's list has the three needed specifications marked.
- [x] Shown once and then reverted, each failing its own test: the needed mark taken off `socket`; the fixed-set check removed; a specification the list does not name accepted.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 14 October 2026: completed

**For the owner to decide.**

- **A refusal names the first specification that does not fit, not all of them.** Its `additionalInformation` holds three things:
  - `field`, the place in the request, such as `specifications.cores.total`;
  - `specification`, the specification's own path, `cores.total`, which is how the Part's missing specifications name it;
  - `reason`, such as `notInTheSet`, `notANumber`, `zeroMeansMissing` or `unknown`.

  The Admin's form (ticket 12) is meant to check values against the same list before it sends them, so one refusal at a time should rarely be seen. Returning all of them would mean a use case returning several errors, which no use case does yet.
- **Only specifications a rule compares are fixed sets.** For a CPU these are the socket and the memory types. The packaging was a fixed set at first, and the review pointed out that no rule compares it, so it is text.
- **One CPU in OpenDB has no manufacturer: the AMD Ryzen Threadripper 7970X** (`cd030ee7-8539-4b8a-8fa8-1738ad51e50b`). As the spec stands, ticket 08's import leaves it out and names it. The Admin can create it by hand.
- **A CPU without integrated graphics has the model "None"** in OpenDB, 418 of them. It is kept as written.
- **Choices made about values.** The spec left these open:
  - A number below 0 is refused.
  - An empty choice of several, an empty text and null count as missing.
  - A choice of several keeps each value once.
  - An empty list of rows is a value: a motherboard with no M.2 slot has none.
- **Where the tests of the Categories are.** They are in `pnpm check`, not `pnpm integration:check` as the ticket says, because the Categories need no database.
- **Lists of rows.** A CPU has none, so a list of rows could not be tested through the API here. Ticket 04 now does it with a motherboard's slots.
- **The socket set.** It is the CPU's alone for now. Ticket 04 now makes it one set shared by CPUs, motherboards and coolers.
- **The glossary.** "Specification", "specification list" and "needed specification" are used throughout but are not in CONTEXT.md. Ticket 15 asks the owner whether to add them.

**OpenDB's `CPU` folder at commit `ef7e601b`,** read from a local copy outside the repository:

- 789 records.
  - Every ID matches its file name, every record has part numbers, and one record has no manufacturer.
  - The CPU's list covers all 30 fields outside the retailer, identity and metadata blocks, under OpenDB's own names.
- **Sockets, 20:** AM3+, AM4, AM5, FM2, FM2+, G34, LGA 1150, LGA 1151, LGA 1155, LGA 1200, LGA 1356, LGA 1700, LGA 1851, LGA 2011, LGA 2011-3, LGA 2066, sTR4, sTR5, sTRX4, TR4.
- **Memory types:** DDR3, DDR4 and DDR5. 85 records give an empty list, which counts as missing.
- **Zeros that mean "not known"**, which the list treats as missing:

  | Field | Zeros |
  |---|---|
  | `cache.l2` | 1 |
  | `clocks.performance.boost` | 15, all on processors with no boost |
  | `clocks.efficiency.base` and `boost` | about 636, on processors with no efficiency cores |
  | `cores.performance` | 623, when the cores are not split, so the count is unknown |
  | `specifications.integratedGraphics` clocks and shaders | about 380, some of them on processors that have graphics |
  | `specifications.memory.maxSupport` | 48 |
  | `specifications.ppt` | 534 |
  | `specifications.tdp` | none |

- **Zeros that are true**, which the list keeps: `cores.efficiency` (635, on processors without efficiency cores) and `cache.l3` (72, older AMD processors that have none).
- **Units.** Processor clocks are in GHz (1.1 to 6), and graphics clocks in MHz. Nine graphics boost clocks are decimals in GHz. Taken as whole numbers in MHz they do not fit, so the import will leave them out and count them.

**The code review found:**

- the reason for a refusal written in the log only, where the spec asks for it in the error body;
- a name the list does not have let through when its value was null;
- one bad field of a row throwing away the whole list of rows, which the import would have felt;
- a refusal and the missing specifications naming one specification two ways;
- a few smaller things: two copies of a helper, sets exported before anything used them, and a comment that stated a later ticket's work as fact.

All are corrected.

Running the tests also found that a test application which could not be built left its Keycloak stand-in listening, and Jest waited for ever. That is corrected too: a planted failure to build now ends the run in 3 seconds with the error.

ADR-0005 records how specifications are stored. It now also says that checking a document gives a plain value rather than an `Either`, and why.

**Faults.** Each was planted by a script that refused a dirty tree, made one exact edit, ran the tests and undid the edit. `git status` was clean after every one.

| Fault | Failed |
|---|---|
| The needed mark taken off the CPU's socket | The Categories test of what is needed, and the first Part test, whose missing specifications changed |
| The fixed-set check removed | "refuse a value outside a fixed set", and nothing else |
| A name the list does not have accepted | The two tests of an unknown specification, and nothing else |

**Results.**

- `pnpm check` passes.
- `pnpm integration:check` passes 31 tests.
- `pnpm platform:check` passes 29 tests.
- The development database gained the migration through `pnpm db:migrate`, after `pnpm services:check` had reported it missing.
