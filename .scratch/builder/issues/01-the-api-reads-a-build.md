# 01: The API reads a Build: its Parts and whether it is a Complete Build

**Spec:** [the builder spec](../spec.md)

**What to build:** Anyone, with no Login, can give the API a Build and read it back. A Build is a list of Part identifiers, with a quantity for each RAM kit and drive. The API answers the Build's Parts in the catalog's order of Categories, each with its summary, its quantity and whether it is a Visible Part. It also answers whether the Build is a Complete Build and which Categories it still needs. The rule for a Complete Build is written here once. This is the endpoint that tickets 02 and 03 extend with the rules' outcomes and the price views, and that `sharing` will read a shared Build through. No Shopper page reads it yet: the integration tests prove it.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] **The word.** **Unstocked Part** is added to CONTEXT.md under Shoppers and builds before any code uses it, as the spec defines it: a Part in a Build that no Vendor has in stock among its Visible Offers, whether or not it is still a Visible Part. Its words to avoid are "unavailable part", "missing part" and "sold-out part". CONTEXT.md already tells us to avoid "available part" for a Visible Part.
- [ ] **The endpoint.** `GET v1/build`, marked `@Public()` and described with `security: []`, answers the same with a good token, a bad one or none. `currency` is required and refused as `pricing` refuses it, though only ticket 03 answers a price, so that the contract does not change later.
- [ ] **The Build in the query.** `part` is repeated. Each value is a Part's identifier, followed for a RAM kit or a drive by `:` and its quantity. The API reads each Part's Category from the catalog. With no `part`, it reads an empty Build. The request and its reading are written once, so that ticket 04's picker takes the Build the same way.
- [ ] **Refusals**, each 400 `NOT_VALID` naming `part`:
  - a value that is not a Part's identifier;
  - a quantity on a Part that is not a RAM kit or a drive;
  - a RAM kit or a drive with no quantity;
  - a quantity that is not a whole number from 1 to 16 in Western digits;
  - two Parts of a Category that holds one;
  - one Part given twice;
  - more than 8 different RAM kits, or more than 8 different drives.
- [ ] **A Part the catalog does not hold** is left out of the answer, not refused, so that an old Build still opens.
- [ ] **The Parts**, in the catalog's order of Categories, and the Build's order for kits and drives. Each has the catalog's summary (identifier, Category, name, manufacturer, part numbers and photo's path), its quantity when it is a kit or a drive, and whether it is a Visible Part. Visibility is read through the rule `browse` wrote once, never a copy.
- [ ] **A Complete Build** holds a CPU, a motherboard, at least one RAM kit, at least one drive, a case and a PSU. It also holds a GPU unless the CPU has integrated graphics, and a CPU cooler unless the CPU includes one. The rule is written once, in the API's domain, beside the Build's reading.
  - A CPU **has integrated graphics** when its Integrated graphics specification is held and is not "None", as OpenDB writes a CPU without them.
  - It **includes a cooler** when its "Cooler included" specification is yes.
  - A CPU missing either specification counts as not providing it. The answer says which of the CPU's values is not known, so that the page can say why the GPU or the cooler is still needed.
  - Without a CPU, the GPU and the CPU cooler are still needed.
- [ ] **The Categories still needed** are answered in the catalog's order. An empty Build needs every Category.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] `pnpm integration:check` gains these tests, written before the code, and passes:
  - An empty Build answers no Part, is not complete, and needs every Category.
  - Each of the CPU, motherboard, RAM, storage, case and PSU, when missing, is listed as still needed. A Build holding all of them, a GPU and a CPU cooler is complete.
  - A CPU with integrated graphics makes the GPU unneeded, a CPU written "None" needs one, and a CPU missing the specification needs one, with the answer saying the value is not known. The same holds for "Cooler included" and the CPU cooler.
  - Two RAM kits and three drives count as RAM and storage once each, and their quantities are answered.
  - The Parts come in the catalog's order of Categories, whatever order they were given in.
  - A Part that is no longer visible, because its only Offer expired or its only Vendor was deactivated, is answered as not visible, and is still in the Build.
  - An identifier the catalog does not hold is left out.
  - Each refusal above names `part`. A missing or wrong `currency` is refused, naming its field.
  - An Admin's or a Vendor's token changes nothing in the answer.
- [ ] Each of these faults is planted once and then reverted, and each fails its own test: a CPU's "None" read as integrated graphics; a missing "Cooler included" read as yes; a second CPU accepted; a quantity on a CPU accepted.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.
