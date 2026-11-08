# Spec: Compatibility

Status: resolved

This is `compatibility`, the seventh module in the build order of [the MVP spec](../mvp/spec.md)'s capability map, beside `browse`, which came first. It covers CMP-1 to CMP-5 and success criterion 11. This spec uses the vocabulary of [CONTEXT.md](../../CONTEXT.md) and follows [ADR-0001](../../docs/adr/0001-seed-catalog-from-buildcores-opendb.md), [ADR-0003](../../docs/adr/0003-three-apps-one-api-keycloak.md), [ADR-0004](../../docs/adr/0004-architecture-per-app.md) and [ADR-0005](../../docs/adr/0005-specifications-as-one-document-per-part.md). It builds on the conventions that `languages`, `catalog`, `accounts`, `offers`, the redesign, `pricing` and `browse` recorded in the MVP spec.

On 7 November 2026 the owner made three decisions for this module:

- **The test seams.** The rules are proved at one new seam, the public face of the shared library `@pcp/compatibility`. What changes in the API is proved at the seams it already has, `pnpm check` and `pnpm integration:check`. There are no end-to-end tests and no Shopper unit tests, since no screen changes, and no new endpoint: `builder` wires the rules into the picker and the Build page.
- **The library's tests run with Jest**, as `core`'s and the API's do. The library may import no npm package, in its test files as anywhere else, and Jest's tests import nothing.
- **A GPU that draws more than a PCIe slot supplies but lists no power socket has its sockets read as not known.** 695 of the 3,852 GPUs imported from OpenDB draw more than 75 W, the most a slot supplies, yet hold 0 for each of their four kinds of power socket, such as the Asus ROG STRIX GeForce RTX 3080 Ti at 350 W. The catalog reads a GPU's 0 sockets as true, so rule 11 would pass them with any PSU. The import now leaves the four out, and the development database is brought to the same reading.

This spec also corrects the MVP spec in one place. The rule notes the owner approved on 15 October 2026 let rules 11, 15 and 20 produce a Compatibility Warning. CMP-3 and the testing strategy still say only rules 11 and 20 do. This spec follows the rule notes, and the last ticket corrects the two lines.

Some words need care. A rule **applies** to a Build only when the Build contains the Parts it involves (CMP-2). Each rule that applies has one **outcome**: it passes, it finds a Compatibility Problem, it finds a Compatibility Warning, or it is **unchecked** because a needed specification is missing (CMP-3). A Part is **compatible** with a Build when adding it would cause no Compatibility Problem (CMP-4). The **estimated power draw** is the CPU's TDP plus the GPU's TDP plus 100 W (CMP-5). "Compatible" and "Estimated power draw" are not in CONTEXT.md yet, and the first ticket adds them before any code uses them, as the MVP spec's Boundaries ask.

## Problem Statement

A Shopper planning a PC can pick Parts that do not work together and find out only when the PC is put together: a CPU whose socket the motherboard does not have, RAM of the wrong type, a GPU too long for the case, an air cooler too tall for it, or a PSU too weak for the GPU or short of the cables it needs. Each check compares a specification of one Part with a specification of another, which the Shopper has to look up and read correctly. A mistake costs a trip back to the shop, or a Part that cannot be returned.

The platform already holds every Part's specifications, imported from OpenDB, but nothing judges them together. Many specifications are missing, some for most Parts of a Category. A check that skipped a missing one silently would tell a Shopper a Build works when nobody knows, and a check that gave up whenever anything was missing would bury every Build under warnings that do not matter. The Admin's Missing specifications list asks for the needed specifications, but which specifications are needed is marked by hand, apart from any rule, and could drift from the rules once they exist. And 695 GPUs claim to need no power cable at all, which no rule could see through.

## Solution

The 21 Compatibility Rules are written once, in the shared library `@pcp/compatibility`, as plain TypeScript that imports nothing, which both the API and the Shopper app may import (ADR-0004). Given a Build, the library answers the outcome of every rule that applies to it, in rule order, naming the Parts each outcome is about and, for an unchecked rule, the needed specifications it lacked. Given a Part and a Build, it answers whether the Part is compatible with the Build, which `builder`'s picker will ask of every Part it might show. It answers a Build's estimated power draw. A rule is unchecked only when a missing specification could change its outcome, so a missing value that cannot matter never makes a rule unchecked, and an unchecked rule is never passed.

The library also states which specifications each rule reads and the fixed sets of values the rules compare. The API's specification lists take both from it, so the needed specifications the Admin is asked to fill in are exactly the ones the rules read, and a new socket is added in one place, for the Admin's forms and the rules alike.

The import reads a GPU above 75 W that lists no power socket as lacking its sockets, so rule 11 is unchecked for it, and the Admin's Missing specifications list shows it once a Vendor offers it. The development database is brought to that reading in place.

No screen changes. `builder` turns the outcomes into words in three languages, hides Parts that are not compatible from the picker, and lists the outcomes on the Build page.

## User Stories

### What a Shopper will be told

These come true for a Shopper when `builder` shows the library's outcomes.

1. As a Shopper, I want to be told when my CPU's socket differs from my motherboard's, so that I do not buy a pair that cannot fit (rule 1).
2. As a Shopper with a dual-socket server board, I want a CPU of the board's socket accepted, so that a board written "2 x LGA 2011-3" is not reported as a mismatch (rule 1).
3. As a Shopper, I want any CPU added to a motherboard that has its CPU built in reported as a Compatibility Problem, so that I do not buy a CPU the board cannot take (rule 1).
4. As a Shopper, I want to be told when my CPU cooler does not list my CPU's socket, so that I do not buy a cooler that cannot be mounted (rule 2).
5. As a Shopper, I want to be told when my CPU does not support my RAM's type, so that I do not buy memory the CPU cannot use (rule 3).
6. As a Shopper, I want to be told when my RAM's type differs from my motherboard's, so that I do not buy memory that does not fit its slots (rule 4).
7. As a Shopper, I want to be told when my RAM kits hold more sticks than my motherboard has slots, counting every kit and how many of it I chose, so that I do not buy memory I cannot install (rule 5).
8. As a Shopper, I want to be told when my RAM adds up to more than my motherboard's maximum, so that I do not pay for memory the board cannot address (rule 6).
9. As a Shopper, I want to be told when my case does not take my motherboard's form factor, so that I do not buy a board that cannot be mounted (rule 7).
10. As a Shopper with a Thin Mini-ITX or Flex ATX board, I want it accepted by a case that takes Mini-ITX or Micro ATX boards, so that a board that shares the mounting is not refused (rule 7).
11. As a Shopper, I want to be told when my Build has a GPU and my motherboard has no 16-lane PCIe slot, so that I do not buy a GPU I cannot seat (rule 8).
12. As a Shopper, I want to be told when my GPU is longer than my case allows, so that I do not buy a GPU that will not close inside the case (rule 9).
13. As a Shopper, I want to be told when my GPU is thicker than the expansion slots my case has, so that a 2.5-slot card is not put in a case with two slots (rule 10).
14. As a Shopper, I want to be told when my PSU lacks the connectors my GPU needs, so that I do not buy a PSU that cannot power it (rule 11).
15. As a Shopper whose GPU has a 12VHPWR or 12V-2x6 socket, I want a Compatibility Warning, not a Problem, when my PSU has no such cable but has 6+2-pin connectors, so that I know the Build works with the adapter that usually comes with the GPU (rule 11).
16. As a Shopper, I want to be told when my PSU's wattage is below 1.3 times my Build's estimated power draw, so that I do not buy a PSU that runs at its limit (rule 12, CMP-5).
17. As a Shopper, I want a PSU of exactly 1.3 times the estimated power draw accepted, so that the line falls where the rule says it does.
18. As a Shopper, I want to be told when I have more SATA drives than my motherboard has SATA ports, counting every drive and how many of it I chose, so that I do not buy a drive I cannot connect (rule 13).
19. As a Shopper with an M.2 drive, I want it counted against the M.2 slots that take drives, and not against SATA ports or a slot meant for a wireless card, so that the count matches the board (rules 13 and 14).
20. As a Shopper, I want to be told when I have more M.2 drives than my motherboard has M.2 slots for them (rule 14).
21. As a Shopper, I want to be told when I have more 3.5-inch or 2.5-inch drives than my case has bays, with a 2.5-inch drive allowed in a free 3.5-inch bay, so that an older tower with no 2.5-inch bay is not refused (rule 15).
22. As a Shopper with a 2.5-inch drive and a case that gives no internal bay at all, I want a Compatibility Warning, so that I know a small case or a test bench may mount it somewhere the catalog does not count (rule 15).
23. As a Shopper, I want to be told when I have more SATA drives than my PSU has SATA power connectors (rule 16).
24. As a Shopper, I want to be told when my air cooler is taller than my case allows, and not to be told it of a liquid cooler, so that the check reads the cooler that sits on the CPU (rule 17).
25. As a Shopper, I want to be told when my case does not take my PSU's form factor (rule 18).
26. As a Shopper, I want to be told when my PSU is longer than my case allows (rule 19).
27. As a Shopper, I want to be told when my PSU has no CPU power connector, and warned when it has fewer than my motherboard has sockets, since the extra socket is often optional (rule 20).
28. As a Shopper, I want to be told when my motherboard has connectors on its back and my case does not take such boards (rule 21).
29. As a Shopper, I want a rule that could not be checked because a needed specification is missing to say so, and never to pass, so that I do not trust a Build nobody verified (CMP-3).
30. As a Shopper, I want a rule judged and not reported unchecked when the missing specification could not change its outcome, so that an ordinary motherboard is not reported unchecked because a case does not say whether it takes back-connect boards.
31. As a Shopper, I want a Compatibility Problem that the known specifications already prove reported as a Problem, even when another specification is missing, so that a missing value never hides a certain fault.
32. As a Shopper with an unfinished Build, I want a rule judged only once my Build has the Parts it involves, so that a Build of two Parts is not flooded with outcomes (CMP-2).
33. As a Shopper, I want each outcome to name the Parts it is about, so that I know which Part to change (BLD-4).
34. As a Shopper picking a Part, I want the picker to hide only the Parts that would cause a Compatibility Problem with my Build, and to keep a Part that only brings a Warning or an unchecked rule, so that a missing specification never keeps a Part from me (CMP-4, BLD-3).
35. As a Shopper replacing a Part, I want each candidate judged in place of the one of its Category I already have, so that the picker shows what fits the rest of my Build.
36. As a Shopper whose Build already has a Compatibility Problem, I want Parts that play no part in that Problem still shown in the picker, so that I can finish the rest of the Build while I fix it.
37. As a Shopper, I want the picker and the Build page to give the same answer, so that a Part the picker offered is never a Problem on the Build page.

### The Admin

38. As the Admin, I want Missing specifications to ask for exactly the specifications the rules read, taken from the rules themselves, so that filling the list makes rules checkable and asks for nothing they do not read.
39. As the Admin, I want a CPU cooler that lacks "Liquid cooled" listed on Missing specifications once it has an Offer, since rule 17 reads it to tell an air cooler from a liquid one.
40. As the Admin, I want a GPU above 75 W that lists no power socket listed on Missing specifications once it has an Offer, so that I fill in its sockets instead of rule 11 passing it with any PSU.
41. As the Admin, I want a Part's page and form to mark the same needed specifications as Missing specifications does, as they do now.
42. As the Admin, I want the values my forms offer for a socket, a RAM type, a form factor, a drive's interface and an M.2 slot's key to be the same sets the rules compare, written once, so that adding a new socket is one change for the forms and the rules alike.

### Later modules

43. As the `builder` module, I want one call that judges a whole Build and answers each applicable rule's outcome in rule order, so that the Build page lists every Problem, Warning and unchecked rule (BLD-4).
44. As `builder`, I want one call that says whether a Part is compatible with a Build, so that the picker hides Parts that are not compatible with the same rules the Build page uses (BLD-3).
45. As `builder`, I want the estimated power draw from the library, so that no Shopper code adds up a TDP.
46. As `builder`, I want an unchecked outcome to name each missing needed specification and its Part, so that its words can say what is missing.
47. As `builder` and `sharing`, I want the library to take a Build as plain values and import nothing, so that it runs the same in the API, on the Shopper app's server and in the browser.
48. As `sharing`, I want a shared Build's current Compatibility Problems judged by the same library (SHR-2).

### The owner

49. As the owner, I want every Compatibility Rule to have a passing test for each outcome it can have, written before the code, so that success criterion 11 holds.
50. As the owner, I want each reading of OpenDB's values I decided proved by a test: rule 1's dual-socket and built-in boards, rule 7's Thin Mini-ITX and Flex ATX boards, rule 11's adapter, rule 15's free 3.5-inch bay and missing bays, and rule 20's optional socket.
51. As the owner, I want CMP-3 and the testing strategy corrected to say that rules 11, 15 and 20 can produce a Compatibility Warning, as my decision of 15 October 2026 says.
52. As the owner, I want the library to stay plain TypeScript with no npm package and no other project, so that it runs anywhere and `pnpm boundaries:check` still proves the ban.
53. As the owner, I want the development database brought to the import's reading of GPU power sockets by a guarded block tried first on a throwaway copy, so that it holds what a fresh import of the pinned commit makes.
54. As the owner, I want this module's conventions recorded in the MVP spec when it is finished, so that `builder` builds on them.

## Implementation Decisions

### What this module is and is not

- It covers CMP-1 to CMP-5: the 21 rules as the MVP spec's table and rule notes give them, what applies, the four outcomes, what is compatible, and the estimated power draw. It makes success criterion 11 true.
- It adds no screen, no endpoint and no text a Shopper or a Vendor reads. The outcomes' words, the picker and its switch, the Build page and a Complete Build are `builder`'s.
- It changes the catalog in three ways: which specifications are needed is read from the library, which makes a CPU cooler's "Liquid cooled" needed; the fixed sets of values the rules compare move into the library; and the import reads a GPU above 75 W with no power socket as lacking its sockets.

### The library's public face

- `@pcp/compatibility` stays plain TypeScript, with no Effect, no npm package and no other project, as its `scope:shared` tags already enforce. Its outcomes are plain values, not success and failure (ADR-0004). It is imported through its single entry file. Its placeholder export goes; the API imports the library for real from now on, and the Shopper app's list of libraries it does not use yet keeps proving the library resolves through a real export, until `builder` imports it.
- **The Build as the rules read it.** At most one each of CPU, CPU cooler, motherboard, GPU, case and PSU, and any number of RAM kits and drives, each kit and drive with its quantity, at least one (BLD-1). Each Part carries an identifier the caller gives, its Part's identifier, and its needed specifications in OpenDB's names and nesting, as the catalog holds them (ADR-0005).
- **Judging a Build.** The library answers the outcome of every rule that applies to the Build, in rule order: the rule's number, its outcome, and the Parts it is about. For a Compatibility Problem or a Compatibility Warning, those are the Parts whose values make it, every counted kit or drive among them for a rule that counts. For an unchecked rule, they are each Part whose missing needed specification could change the outcome, with that specification's path.
- **Judging a Part against a Build** (CMP-4). A Part is compatible with a Build unless the Build with it has a Compatibility Problem that names it. The Part goes in place of the Build's Part of its Category for the six Categories a Build holds one of, and beside the Build's others, with a quantity of one, for a RAM kit or a drive. A Compatibility Warning or an unchecked rule never makes a Part incompatible. A Problem the Build already had that does not name the Part does not make it incompatible.
- **The estimated power draw** (CMP-5), for a Build with a CPU: the CPU's TDP plus the GPU's TDP, 0 W without a GPU, plus 100 W. It is not known when a TDP it needs is missing.
- **What each rule reads.** Each rule is stated once, with its number, the Categories it involves, the specifications it reads in each, and its judgment. From those statements the library answers each Category's needed specifications, by their paths. A rule that reads a list of rows, such as a motherboard's PCIe slots, names the list.
- **The values the rules compare.** The fixed sets of the specifications that rules compare or read by value move unchanged from the API's domain into the library, and the library exports them: sockets, RAM types, motherboard form factors, PSU form factors, a drive's interfaces and form factors, and an M.2 slot's keys. A new value, such as the socket of a CPU released later, is added there, once, for the Admin's forms and the rules alike.

### What the rules read, and when a rule is unchecked

- A Part's needed specifications reach the library with every specification the catalog counts as missing left out. The catalog's rule decides what is missing, once, in the API: nothing, null, an empty text, an empty choice of several or list of text, and a 0 where 0 means "not known". The library holds no copy of that rule. A value it is given is known, and a value it is not given is missing. A field of a row, such as a PCIe slot's lanes, may be left out the same way. Whoever hands the rules a Part, `builder` first, leaves out what the catalog counts as missing, through the specification list's own rule, and the last ticket records that contract in the MVP spec.
- **A rule is unchecked only when a missing specification could change its outcome.** A missing value is taken to be any value its specification could hold, 0 among them, though the catalog stores no 0 where 0 means "not known". When the values present settle the outcome whatever the missing ones hold, the rule passes, warns or finds a Problem on them. So an ordinary motherboard passes rule 21 whatever the case says, though 3,078 of the 3,781 imported cases do not say whether they take back-connect boards; a Build with no SATA drive passes rule 13 whatever its motherboard's SATA ports, though 1,053 of the 3,691 imported motherboards lack their SATA 6 Gb/s ports; and a cooler that fits under the case's limit passes rule 17 whether or not it says it is liquid cooled.
- One outcome per rule: a Compatibility Problem when the values present prove one; otherwise unchecked when a missing value could still change the outcome; otherwise a Compatibility Warning or a pass, as the values say.
- A Part whose kind a rule cannot tell, such as a drive with no interface for rule 13 or a cooler with no "Liquid cooled" for rule 17, is one the rule may involve, and the same principle decides.

### Each rule's reading of OpenDB's values

The table gives what a rule needs in a Build to apply and how it reads OpenDB's values, where the MVP spec's table leaves room. Figures are the imported Parts at the pinned commit, read from the development database on 7 November 2026, and on 8 November for the readings the owner decided that day. A length is in millimetres, and equal fits.

| # | Applies when the Build has | How it reads the values |
|---|---|---|
| 1 | A CPU and a motherboard | Equal sockets. A board's "2 x \<socket\>" (20 boards) takes a CPU of that socket, and a board's "Integrated …" (13 boards) makes any CPU a Problem, as the rule notes say. A board's "LGA 2011-3 Narrow" (7 boards) or "2 x LGA 2011-3 Narrow" (4 of the 20) takes a CPU of LGA 2011-3, as the owner decided on 8 November 2026: "Narrow" names the mounting of the board's cooler, and no CPU names it. |
| 2 | A CPU and a CPU cooler | The CPU's socket among the cooler's sockets. |
| 3 | A CPU and a RAM kit | Each kit's type among the CPU's memory types. |
| 4 | A motherboard and a RAM kit | Each kit's type equal to the board's. |
| 5 | A motherboard and a RAM kit | Every kit's modules times its quantity, against the board's memory slots. |
| 6 | A motherboard and a RAM kit | Every kit's modules times each module's capacity times its quantity, in GB, against the board's maximum memory. |
| 7 | A motherboard and a case | The board's form factor among the case's. A Thin Mini-ITX board fits where Mini-ITX does and a Flex ATX board where Micro ATX does, as the rule notes say. |
| 8 | A GPU and a motherboard | A Problem when no row of the board's PCIe slots has 16 lanes. An empty list of slots, which 13 boards hold, is a value: the board has none. A row with no lanes (6 rows) is unknown. |
| 9 | A GPU and a case | The GPU's length against the case's longest GPU. |
| 10 | A GPU and a case | The slots the GPU occupies, which may be a fraction such as 2.5 (586 GPUs), against the case's expansion slots: more than the case has is a Problem. |
| 11 | A GPU and a PSU | As the rule notes say. The GPU's 6-pin and 8-pin sockets are counted together against the PSU's 6+2-pin connectors. A 12V-2x6 socket and a 12VHPWR socket both take the PSU's 12VHPWR cable, the only such connector OpenDB lists for a PSU, and the GPU needs as many of those cables as the larger of its 12VHPWR and 12V-2x6 counts, as the owner decided on 8 November 2026: a card that lists its one socket under both kinds needs one (2 GPUs), and a card with two sockets of one kind needs two (2 GPUs). A PSU with fewer cables than the GPU needs is read as one with no such cable: the adapter's Warning when it has 6+2-pin connectors, and a Problem when it has none. |
| 12 | A CPU and a PSU | The PSU's wattage below 1.3 times the estimated power draw, compared in whole numbers, ten times the wattage against thirteen times the draw, so a PSU of exactly 1.3 times passes. |
| 13 | A motherboard and a drive | The SATA drives against the board's ports, so a Build with no SATA drive passes whatever the ports. A SATA drive is one whose interface is SATA 1.5, 3.0 or 6.0 Gb/s and whose form factor is no M.2 size: a drive of an M.2 size and such an interface is an M.2 SATA drive (3 drives), as one whose interface is M.2 SATA is, as the owner decided on 8 November 2026. An mSATA, SAS or U.2 drive is no SATA drive either, and a drive of a SATA interface whose form factor is missing may be an M.2 SATA drive. The board's ports are its SATA 6 Gb/s and 3 Gb/s ports together. |
| 14 | A motherboard and a drive | The M.2 drives against the board's M.2 slots, so a Build with no M.2 drive passes whatever the slots. An M.2 drive is one whose form factor is an M.2 size, and an M.2 SATA drive one whose interface is M.2 SATA or SATA 1.5, 3.0 or 6.0 Gb/s, as the owner decided on 8 November 2026. A slot keyed M takes any M.2 drive (10,231 slots), a slot keyed B only an M.2 SATA drive (2), a slot keyed E none, since it is for a wireless card (602), and a slot with no key is unknown (12). An empty list of slots is a board with none, but the import leaves it out as not known on a board of a socket of 2017 or later (36 boards), as the owner decided the same day. A slot's sizes are not compared: no rule reads them. |
| 15 | A case and a drive | The 3.5-inch and 2.5-inch drives against the case's bays, so a Build with neither passes whatever the bays. A drive by its form factor, whatever its interface. A 2.5-inch drive takes a free 3.5-inch bay, and a case that gives no internal bay at all (32 cases) brings a Warning for 2.5-inch drives, as the rule notes say. |
| 16 | A PSU and a drive | SATA drives as for rule 13, against the PSU's SATA power connectors, so a Build with no SATA drive passes whatever the connectors. An M.2 drive needs none, an M.2 SATA drive among them. |
| 17 | A CPU cooler and a case | An air cooler, one whose "Liquid cooled" is no, against the case's tallest cooler. A liquid cooler passes. |
| 18 | A PSU and a case | The PSU's form factor among the case's. No form factor stands in for another. |
| 19 | A PSU and a case | The PSU's length against the case's longest PSU. |
| 20 | A motherboard and a PSU | The board's CPU power sockets are the entries of its CPU power connectors (one to three), against the PSU's EPS 8-pin connectors, as the rule notes say. |
| 21 | A motherboard and a case | A Problem when the board has connectors on its back and the case does not take such boards. |

- Rules 5, 6 and 13 to 16 count every kit and drive in the Build, multiplied by its quantity, as the MVP spec says.
- Rules 13 to 16 involve every drive, so each applies to a Build with any drive and passes one with no drive of its kind, as the owner kept for rules 13, 15 and 16 on 8 November 2026, and as rule 14 does in the same way.
- Rules 1, 2, 3, 4, 7 and 18 compare whole values from the fixed sets, so two spellings of one value cannot make a false Problem.

### The catalog takes what is needed from the rules

- The API's specification lists stop marking needed specifications by hand. A specification is needed when the library's statement of the rules names its path for its Category, and the Categories endpoint, a Part's missing needed specifications and Missing specifications all read it so. The API's domain imports the library, which its tags allow.
- The needed specifications stay what they are, with one addition: a CPU cooler's "Liquid cooled", which rule 17 reads to tell an air cooler from a liquid one. One imported cooler lacks it, and joins Missing specifications if a Vendor offers it.
- The fixed sets move into the library unchanged, and the API's lists import them from there. The Admin's forms offer the same values as before.
- Every path the library names is in its Category's list. The Categories endpoint's test, which writes out the needed specifications from the MVP spec's table and does not read them from the platform, proves it, and gains "Liquid cooled".

### The import's reading of a GPU's power sockets

- A GPU whose TDP is above 75 W and which holds 0 for each of its four power sockets, 6-pin, 8-pin, 12VHPWR and 12V-2x6, is imported without the four: they are missing, as a 0 that means "not known" is, and the import counts them among the values it left out, with a reason of its own. At the pinned commit that is 695 GPUs. A GPU of 75 W or less with no socket keeps its zeros, since a slot powers it (299 GPUs), and so does one whose TDP is missing (4).
- The reading is the import's alone, as its other readings of OpenDB's records are. The Admin may still give any GPU any socket counts, and the specification list still reads one 0 socket as true.
- The development database is brought to the reading in place, as the owner agreed on 7 November 2026, by one guarded SQL block tried first on a throwaway copy, as the catalog's part numbers were the same day. It removes the four sockets from the imported GPUs that hold that pattern, and from no other Part, and stops unless it finds the count the copy found. No Offer names any of the 695 in the development database today. Afterwards the imported Parts are what a fresh import of the pinned commit makes, and the last ticket confirms it.

### Recording

- The last ticket verifies the module from a fresh clone and records its conventions in the MVP spec, under **The compatibility module's conventions**: the library's public face; the Build it reads, and the contract that whoever hands it a Part leaves out what the catalog counts as missing; when a rule is unchecked; each rule's reading; the needed specifications and fixed sets read from the library; the import's reading of GPU power sockets; and the library's test seam.
- It corrects CMP-3 and the testing strategy to rules 11, 15 and 20, and updates the MVP spec's description of the `compatibility` library, the catalog's conventions on specification lists and on the import, and the commands and layout where the library's `test` target adds to them.
- No check by hand and no check on a phone is added, since no screen changes.

## Testing Decisions

A good test sees the rules from the outside, as `builder` will: it hands the library a Build of made-up Parts, whose needed specifications are written in OpenDB's names as the catalog holds them, and judges only what the library answers. It never calls a rule's own helper or reads how a rule is put together. A test that would still pass after a rule was copied into the API, or after its comparison moved from `>` to `>=`, proves nothing a Shopper will rely on.

The owner confirmed the seams on 7 November 2026. Every rule's tests are written before the rule, as the MVP spec's testing strategy asks of logic that could mislead a Shopper.

### The new seam: the library's public face

- **The runner** is Jest, as `core`'s: the workspace's Jest preset with SWC, the test files' eight lint rules, tests under the library's `src/test`, and a `test` target, so `pnpm check` runs them. The tests use Jest's globals and import nothing from Jest or any other package, since the library's ban covers its test files. A helper that asserts is named in the lint rules' list of assertions, as `expectErrorResponse` is.
- **Each rule, each outcome.** For every rule, one test for each outcome it can have: it passes, it finds a Compatibility Problem, it is unchecked, and for rules 11, 15 and 20 it finds a Compatibility Warning (success criterion 11).
- **The readings.** Rule 1's "2 x" and "Integrated" boards, rule 7's Thin Mini-ITX and Flex ATX boards, rule 11's adapter, rule 15's free 3.5-inch bay and a case with no internal bay, rule 20's optional socket, rule 14's keys and rule 13's SATA drives, each as the table above says.
- **The boundaries.** A GPU exactly as long as the case allows fits and one a tenth of a millimetre longer does not; a PSU of exactly 1.3 times the estimated power draw passes and one watt less does not; slots, ports, bays and connectors at exactly the count and one over.
- **Quantities.** Two of one kit count as two kits' sticks and capacity, and two of one drive as two drives, in rules 5, 6 and 13 to 16.
- **Applying.** A Build without the Parts a rule involves gets no outcome for it (CMP-2), and an empty Build gets none at all.
- **Unchecked only when it matters.** A missing value that could change the outcome makes the rule unchecked and names the Part and the path; one that could not leaves the rule judged; a Problem the present values prove is a Problem though another value is missing; and no outcome is ever a pass where a missing value could have made it a Problem.
- **Compatible** (CMP-4). A Part replaces the Build's Part of its Category; a kit or a drive is added with a quantity of one; a Warning or an unchecked rule leaves a Part compatible; a Problem the Build already had that does not name the Part leaves it compatible; and a Part that makes a Problem is not.
- **The estimated power draw** (CMP-5). A Build without a GPU counts 0 W for it, and a missing TDP leaves the draw unknown.
- **The values the rules compare** are the sets the API's forms offer, proved at seam 1 below rather than here.

### Seam 1: the repository root, through `pnpm check`

- **The library's tests** run with every project's tests.
- **The needed specifications.** The Categories endpoint's test, through the API's HTTP surface, compares every Category's needed specifications with the table it writes out from the MVP spec, now with "Liquid cooled", so a rule that stops reading a path, or names one its Category's list lacks, fails here.
- **The fixed sets.** The Categories endpoint's test of the values a rule compares, already there, still passes once the sets come from the library.
- **Still true.** Everything `pnpm check` proved before still passes, with Docker stopped and no browser installed.
- **`pnpm boundaries:check`**, run on its own, since a project gains a target and test files: the library still refuses an npm package and another project.

Each new line is seen to fail once, by a deliberate fault planted after a commit and then reverted: a rule's comparison turned from `>` to `>=`, which an exact boundary's test catches; rule 17's reading of "Liquid cooled" dropped, which the needed specifications' table catches; and the import's GPU reading removed, which seam 2 catches.

### Seam 2: the API from the outside, over a real PostgreSQL and a real Keycloak

`pnpm integration:check`, as `browse` left it.

- **The import.** A made-up OpenDB folder's GPU above 75 W with 0 for each socket is imported without the four, counted among the values left out with its reason; one at 75 W with none keeps its zeros; one above 75 W with a socket keeps all four counts as given.
- **Missing specifications.** Once offered, such a GPU is listed with its four power sockets missing, and a CPU cooler that lacks "Liquid cooled" is listed with it missing, read through the API as the Admin.
- **A Part's page.** The same GPU's and cooler's missing needed specifications, read through the API, name the same paths.

### The rest

- No end-to-end test and no Shopper unit test is added: no screen changes, and the Admin's screens show "Liquid cooled" and a GPU's sockets from the API's answer as they show any needed specification.
- No Taste inspection, since no page or screen changes.
- Prior art: `core`'s Jest set-up for a library's tests; the API's unit test of the filters' statement, which proves a domain statement whole against a table of the MVP spec; the Categories endpoint's test and its table of needed specifications; the import's integration test and its made-up folder, for a record read in a way of the import's own, as a cooler's "LGA 1151v2" is; and the Missing specifications integration tests.

## Out of Scope

- The outcomes' words in three languages, the Build page, the picker, its switch, hiding incompatible Parts, and a Complete Build: `builder`.
- An endpoint that judges a Build or a Part, and the API's function that hands a stored Part to the rules: `builder`, which this spec gives the contract for.
- A shared Build's Compatibility Problems: `sharing`.
- The rules left for later in the MVP spec: a liquid cooler's radiator, RAM height under an air cooler, a BIOS update, and a cooler's capacity for the CPU's heat. Any new rule, or a Warning from any rule but 11, 15 and 20.
- What no rule reads: an M.2 slot's sizes, a PCIe add-in drive's slot, SAS and U.2 controllers, case fans.
- A form factor standing in for another in rule 18, such as an SFX supply in a case that lists only ATX.
- Any other change to how the catalog reads a 0, and a refusal in the Admin's form of a GPU above 75 W with no socket.
- Pulling updates from OpenDB after the first import.
- Any screen, page or text for a Shopper, a Vendor or the Admin.

## Further Notes

- **Decisions this spec takes that the owner may want to revisit.** They follow the MVP spec's words where they leave room, and none is costly to change before real Vendor data exists:
  - A rule is unchecked only when a missing specification could change its outcome, not whenever one it reads is missing.
  - A Part is compatible unless a Problem names it, so a Problem the Build already had does not hide Parts that play no part in it.
  - The needed specifications are read from the rules, which makes a CPU cooler's "Liquid cooled" needed.
  - The fixed sets of values the rules compare move into the library.
  - Rule 14 counts slots by their key, and rule 18 lets no form factor stand in for another: 3 ATX/EPS supplies are a Problem in a case that lists only ATX.
  - A GPU that lacks some of its socket counts but not all (87 GPUs, such as one listing one 8-pin socket and nothing else) leaves rule 11 unchecked until the Admin fills them in, as do the 6 that lack all four.
  - No endpoint is added: `builder` decides where the rules run for the picker and for the Build page.
- **Two Problems cannot arise from the catalog's data today.** The catalog reads a PSU's 0 EPS connectors and 0 PCIe 6+2-pin connectors as "not known" (the owner's decision 6 of 15 October 2026), so a PSU with none is stored without them, and rule 20's "no EPS connector at all" and rule 11's "no such cable and no 6+2-pin connector" come out unchecked instead. The library still judges them as the rules say when it is given a 0, and its tests prove both Problems so.
- **Coverage.** Rules 17 to 21 stay unchecked for most Builds until the Admin fills in the cases' and PSUs' specifications, as the MVP spec's coverage column says. Missing specifications lists only Parts that have an Offer, so the Admin's work follows what Vendors stock.
- **No ADR.** Undoing any decision here loses no data: the sets and the needed specifications are code, and a GPU's zeros and a motherboard's empty list of M.2 slots come back from OpenDB at the pinned commit. The owner kept it so on 8 November 2026, beside ADR-0005's amendment of that day.
- **Success criteria.** This module makes criterion 11 true. Criterion 5's Compatibility half, incompatible Parts hidden from the picker and a Compatibility Problem listed on the Build page, is `builder`'s.
- **Open checks.** The `offers` module's checks in the owner's browser and `browse`'s, listed in their last tickets, are still open and do not hold this module back. This module adds no check by hand and none on a phone. It adds no text, so nothing joins the review that LANG-7 asks for.
- **Next steps.** `builder` follows. It hands the rules each Part through the catalog's rule for what is missing, asks whether a Part is compatible for every Part its picker might show, reusing the Category page's endpoint, words each outcome in three languages, and draws the Build page with the Shown Price component.
