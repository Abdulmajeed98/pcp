# 03: Specifications, end to end for CPUs

**Spec:** [the catalog spec](../spec.md)

**What to build:** A CPU carries its specifications. The API holds the CPU's specification list. The list gives each specification's place in OpenDB's field names and nesting, its English label, its kind, its unit, its fixed set of values where a rule compares it, whether it is needed, and whether 0 can be true for it.

The API answers the eight Categories with their lists. A CPU is created with specifications that are checked against its list, and reading it back gives them and lists the needed ones that are missing. The other seven lists arrive in ticket 04, and until then they are empty.

This ticket builds the mechanism every list uses, on one Category. A new ADR records how specifications are stored, because changing it once real Vendor data exists needs the owner's agreement.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Before anything is written, OpenDB's `CPU` folder at the pinned commit `ef7e601b78875a931a4ad9fa1ccce7000f3e5ecf` is read from a local copy, which is not committed. The findings are recorded under Comments:
  - every CPU field and the kind of value it holds;
  - the values the socket and the memory types take;
  - which needed CPU specifications hold 0, and where 0 cannot be true.
- [ ] The list knows these kinds: a whole number, a decimal number, text, yes or no, one of a fixed set, several of a fixed set, a list of text, and a list of rows whose own fields have kinds. Each entry has an English label and, where it has one, a unit.
- [ ] The CPU's list covers every field OpenDB defines for a CPU except retailer and identity data. Its needed specifications are the three that the MVP spec's rule table names: `socket`, `specifications.memory.types` and `specifications.tdp`.
- [ ] A specification that a rule compares for equality is one of a fixed set, or several of one. The set is the values found at the pinned commit.
- [ ] A Part's specifications are stored as one JSON document in OpenDB's field names and nesting, added by a generated migration.
- [ ] A new endpoint answers the Admin and Vendors with the eight Categories, each with its key and its specification list. Without a token the call is answered 401.
- [ ] Creating a Part takes its specifications, and every value is checked against the Category's list. Each of these is refused with an answer that names the specification:
  - a value outside a fixed set;
  - a word where a number belongs;
  - a specification the list does not name;
  - a row of the wrong shape;
  - 0 where 0 cannot be true.
- [ ] Reading a Part gives its specifications and lists the needed specifications it is missing.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] A new ADR records that specifications are stored as one JSON document per Part, in OpenDB's field names, and that each Category's specification list describes them.
- [ ] `pnpm integration:check` passes with tests for each item above:
  - A CPU with every kind of value is created and read back.
  - A CPU with some specifications missing lists the missing needed ones.
  - Each refusal names its specification.
  - The Categories' answer holds the eight Categories, and the CPU's list has the three needed specifications marked.
- [ ] Shown once and then reverted, each failing its own test: the needed mark taken off `socket`; the fixed-set check removed; a specification the list does not name accepted.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
