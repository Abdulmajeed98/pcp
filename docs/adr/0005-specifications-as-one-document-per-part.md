# A Part's specifications are one document, described by its Category's specification list

A Part's specifications are stored as one JSON document in the Part's row, in OpenDB's own field names and nesting, rather than as columns or as a table of their own. A CPU's are `{ "socket": "AM5", "specifications": { "tdp": 65, "memory": { "types": ["DDR5"] } } }`. The eight Categories hold about 400 specifications between them, most of which no query will ever filter on, and the MVP spec's table of Compatibility Rules already names its fields in OpenDB's terms, so the fields a rule reads are the fields stored.

What a document may hold is not left open. Each Category has a specification list, written by hand in the API's domain, that names every specification by its place in the document, with its English label, its kind, its unit, its fixed set of values where a rule compares it, whether a Compatibility Rule needs it, and whether 0 stands for "not known". Nothing the list does not name is stored. Creating or editing a Part refuses a value that does not fit, and the import leaves such a value out and counts it. The API answers the lists, so that the dashboard builds its forms from them and keeps no copy.

## Amended 8 November 2026: the rules say what is needed, and hold the fixed sets

The `compatibility` module wrote the 21 Compatibility Rules in the shared library `@pcp/compatibility`, and two things the lists said moved there. A list no longer marks whether a Compatibility Rule needs a specification: the needed specifications are read from the rules' statements in the library, each rule naming the paths it reads in each Category, so that what the Admin is asked to fill in is what the rules read, and the two cannot drift apart. And the fixed sets of values the rules compare, such as the sockets, the RAM types and the form factors, live in the library, which the lists take them from: a new value, such as the socket of a CPU released later, is added there, once, for the Admin's forms and the rules alike. A specification is still added by a change to its list in code, with no migration. The rest of the decision stands: each Category's list names every specification by its place in the document, with its label, its kind, its unit and whether 0 stands for "not known", and nothing the list does not name is stored. The compatibility module's code review raised it (Standards 1).

## Considered Options

- **A column for each specification, in a table for each Category.** Every value would be typed by the database itself. Eight tables of up to 90 columns, and a migration for every specification added, for values that are read whole far more often than they are queried.
- **The OpenDB record as it comes, with no list.** The least work, but any value of any shape would be stored, a mistyped socket would make a false Compatibility Problem, and the dashboard would have nothing to build a form from.

## Consequences

- Changing how specifications are stored once real Vendor data exists needs the owner's agreement, as the MVP spec says of Parts and Offers.
- A query that filters on a specification, as a Category page's filters will, reads it from the document. PostgreSQL can index a path in a JSON document if that proves slow.
- A specification is added, or a fixed set gains a value such as a new socket, by a change to the list in code. No migration is needed.
- Checking a document gives a plain value, what fits and what does not, rather than an `Either`, because a check that finds problems still gives what fits, and the import keeps that. A use case turns a problem into the left side of its own `Either`, as ADR-0004 has it.
- The document's type in the API's description is a plain JSON object. A type for each Category would run to several hundred fields and says nothing the list does not already say.
