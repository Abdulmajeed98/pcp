# 05: The Admin edits a Part through the API

**Spec:** [the catalog spec](../spec.md)

**What to build:** The Admin corrects a Part. An edit replaces the Part's name, manufacturer, part numbers and specifications as a whole, as the form will send them, so a specification the edit leaves out is cleared and its rule becomes unchecked rather than wrong. The Category of a Part never changes. Only the Admin edits, and the API itself refuses a Vendor.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] `EditPartCommand`, with its Input and Output, and an endpoint that only the Admin may call.
- [ ] An edit holds the name, the manufacturer, the part numbers and the specifications, checked exactly as creation checks them, part numbers cleaned in the same way.
- [ ] An edit has no Category. One sent with it does not change the Part's Category.
- [ ] The Part's OpenDB ID and its creation time are unchanged. Its time of last change is updated.
- [ ] A Part that does not exist is answered 404 with its code. A Vendor's edit is answered 403, and an edit without a token 401.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] `pnpm integration:check` passes with tests for each item above, among them:
  - An edit that leaves out a needed specification makes the Part list it as missing.
  - A value outside a fixed set is refused, naming the specification.
- [ ] Shown once and then reverted, each failing its own test: the Vendor role added to editing; an edit that merges with the stored specifications instead of replacing them.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
