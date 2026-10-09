# 03: The dashboard obeys Feature-Sliced Design's bans

**Spec:** [the boundary checks spec](../spec.md)

**What to build:** In the dashboard, lint refuses an import that breaks Feature-Sliced Design as ADR-0004 sets it out. A file cannot import from a layer above its own. A slice cannot import another slice on its own layer. A slice is imported through its index file and nothing deeper, and the Shared layer through each segment's index file. A relative import cannot be used to step around any of this: it may not climb out of its own slice, and in the App and Shared layers it may not climb into another layer.

The bans cover all six layers from now on, although only the App, Pages and Shared folders exist. They are stated once, in a form that ticket 04 applies to the Shopper app with its own layer names. How that is done is this ticket's one open question.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Before anything is configured, Feature-Sliced Design's current documentation is read for its layers, for slices and segments, for public APIs, and for which layers have no slices. Oxlint's documentation is read for whichever way of stating the bans once is being considered. The findings are recorded under Comments.
- [ ] The layer ban: a file in the dashboard may import, through the `@/` alias, only the layers the spec's table allows for its own layer.
- [ ] The slice ban: on the Pages, Widgets, Features and Entities layers, a file may not import its own layer through the alias. The segments of the App and Shared layers may import each other.
- [ ] The index ban: a slice is imported through its index file, the Shared layer through each segment's index file, and the App layer through its own index file.
- [ ] Relative imports: on a layer that has slices, a relative import may not climb out of its own slice. This holds for a file in the slice's own folder, in a segment, and in one folder inside a segment. A file nested deeper may not use a climbing relative import at all. In the App and Shared layers, a relative import may not climb into another layer.
- [ ] All four bans cover type-only imports, re-exports and lazy `import()`.
- [ ] The bans are in place for the Widgets, Features and Entities layers, and no folder is created for them.
- [ ] Any layer may still import the dashboard's libraries by their `@pcp/…` names.
- [ ] Each ban carries its own message, which says what is forbidden and what to do instead.
- [ ] The bans are stated once, in a form the Shopper app can take up with other layer names. All the bans for one file are stated together, because a later block of an Oxlint configuration replaces an earlier one's options for a rule. The boundary rule's bridge stays declared in a JSON configuration. How the bans are stated, and why, is recorded under Comments.
- [ ] Whatever states the bans is an input of the dashboard's `lint` target: after a ban is changed, the target runs again and does not reuse a cached result.
- [ ] The proof gains the dashboard's forbidden cases, each refused by its own ban: a Shared file imports a page; a page imports another page; an import reaches past a slice's index file; an import reaches past a Shared segment's index file; a relative import climbs out of its slice, from each of the three depths; a file nested deeper uses a climbing relative import; a relative import in Shared climbs into another layer; a Features file imports the Widgets layer; one ban is broken with a lazy `import()`.
- [ ] The proof gains the dashboard's allowed cases: a page imports Shared through a segment's index file; one segment of a slice imports another segment of the same slice by a relative path; one Shared segment imports another; the App layer imports a page through its index file.
- [ ] Shown once and then reverted, each making the proof fail on its own lines: each of the four bans removed in turn, and one ban widened so that an allowed case fails.
- [ ] The proof's lines from tickets 01 and 02 still pass, which shows that the boundary rule still holds in the dashboard.
- [ ] `pnpm check` passes with no change to the dashboard's source.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
