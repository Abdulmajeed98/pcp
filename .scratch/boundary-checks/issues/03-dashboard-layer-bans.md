# 03: The dashboard obeys Feature-Sliced Design's bans

**Spec:** [the boundary checks spec](../spec.md)

**What to build:** In the dashboard, lint refuses an import that breaks Feature-Sliced Design as ADR-0004 sets it out. A file cannot import from a layer above its own. A slice cannot import another slice on its own layer. A slice is imported through its index file and nothing deeper, and the Shared layer through each segment's index file. A relative import cannot be used to step around any of this: it may not climb out of its own slice, and in the App and Shared layers it may not climb into another layer.

The bans cover all six layers from now on, although only the App, Pages and Shared folders exist. They are stated once, in a form that ticket 04 applies to the Shopper app with its own layer names. How that is done is this ticket's one open question.

**Blocked by:** 02

**Status:** resolved

- [x] Before anything is configured, Feature-Sliced Design's current documentation is read for its layers, for slices and segments, for public APIs, and for which layers have no slices. Oxlint's documentation is read for whichever way of stating the bans once is being considered. The findings are recorded under Comments.
- [x] The layer ban: a file in the dashboard may import, through the `@/` alias, only the layers the spec's table allows for its own layer.
- [x] The slice ban: on the Pages, Widgets, Features and Entities layers, a file may not import its own layer through the alias. The segments of the App and Shared layers may import each other.
- [x] The index ban: a slice is imported through its index file, the Shared layer through each segment's index file, and the App layer through its own index file.
- [x] Relative imports: on a layer that has slices, a relative import may not climb out of its own slice. This holds for a file in the slice's own folder, in a segment, and in one folder inside a segment. A file nested deeper may not use a climbing relative import at all. In the App and Shared layers, a relative import may not climb into another layer.
- [x] All four bans cover type-only imports, re-exports and lazy `import()`.
- [x] The bans are in place for the Widgets, Features and Entities layers, and no folder is created for them.
- [x] Any layer may still import the dashboard's libraries by their `@pcp/…` names.
- [x] Each ban carries its own message, which says what is forbidden and what to do instead.
- [x] The bans are stated once, in a form the Shopper app can take up with other layer names. All the bans for one file are stated together, because a later block of an Oxlint configuration replaces an earlier one's options for a rule. The boundary rule's bridge stays declared in a JSON configuration. How the bans are stated, and why, is recorded under Comments.
- [x] Whatever states the bans is an input of the dashboard's `lint` target: after a ban is changed, the target runs again and does not reuse a cached result.
- [x] The proof gains the dashboard's forbidden cases, each refused by its own ban: a Shared file imports a page; a page imports another page; an import reaches past a slice's index file; an import reaches past a Shared segment's index file; a relative import climbs out of its slice, from each of the three depths; a file nested deeper uses a climbing relative import; a relative import in Shared climbs into another layer; a Features file imports the Widgets layer; one ban is broken with a lazy `import()`.
- [x] The proof gains the dashboard's allowed cases: a page imports Shared through a segment's index file; one segment of a slice imports another segment of the same slice by a relative path; one Shared segment imports another; the App layer imports a page through its index file.
- [x] Shown once and then reverted, each making the proof fail on its own lines: each of the four bans removed in turn, and one ban widened so that an allowed case fails.
- [x] The proof's lines from tickets 01 and 02 still pass, which shows that the boundary rule still holds in the dashboard.
- [x] `pnpm check` passes with no change to the dashboard's source.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 9 October 2026: completed

**What Feature-Sliced Design's documentation says,** checked against the bans:

- The layers, from the top, are App, Pages, Widgets, Features, Entities and Shared. "A module (file) in a slice can only import other slices when they are located on layers strictly below." That one sentence is both the layer ban and the slice ban.
- App and Shared have segments and no slices, and in those two layers "segments can import each other freely."
- A slice is used only through its public API, which is an index file of re-exports. Inside a slice imports are relative; between slices they use the alias.
- For Shared's `ui` and `lib` segments the documentation recommends an index file for each component, imported as `@/shared/ui/button`. The bans do not allow that yet: Shared is imported through a segment's index file, as the spec chose. The first shared component that needs its own index file is the moment to open it.
- One entity may refer to another through a notation of its own, `@x`. The bans refuse it, like any import past an index file. The spec leaves it out of scope.

**How the bans are stated once.**

- **One module in `tools` states them, and a command writes them out.** The module takes the names of a frontend's App and Pages folders and returns the blocks of an Oxlint configuration. `pnpm boundaries:write` writes them to a file in the frontend's folder, and the frontend's lint configuration extends that file beside the root's. The written file for the dashboard has 18 blocks and about 750 lines, which is why it is not written by hand.
- **Why the bans cannot be stated more simply.** Oxlint has one slot for `no-restricted-imports`: a scratch repository showed that its TypeScript variant is the same rule under another name, and that a later block replaces an earlier block's options. Which layers a file may import depends on its layer, and how far a relative import may climb depends on its depth. Every pairing of a layer and a depth therefore needs its own block holding all its bans.
- **Why a written JSON file and not a TypeScript configuration.** Oxlint can read a TypeScript configuration, which could work the blocks out for itself. Nx's plugin does not read one: it would not see the boundary rule's bridge behind it, and the lint result would stop depending on the projects the dashboard imports. Nx follows a chain of JSON files, and the written file is an input of the dashboard's `lint` target.
- **The proof checks the written file against the statement.** Its first line fails when the two differ, and says to write the file again.
- **The formatter leaves the written file alone.** It is listed in the formatter's ignore patterns, so the written form and the committed form stay the same.

**What differs from the first plan, or is not obvious.**

- **A file at any other depth may not climb at all.** The first block for a sliced layer covers every file in it and refuses any climbing relative import. Three later blocks replace it for a file in the slice's own folder, in a segment, and in one folder inside a segment. What is left to the first block is a file nested deeper, and a file placed straight into the layer's folder, which belongs to no slice.
- **Inside a layer without slices, the alias goes through an index file and a relative path is free.** A Shared segment imports another as `@/shared/config` or as `../config`. Both are allowed lines in the proof.
- **The App layer may not reach past its own index file by the alias either,** for the same reason: from inside the layer the way in is a relative path.
- **Each ban has a message of its own, and there are six.** The relative-import ban has three: for leaving a slice, for climbing at a depth that is not followed, and for crossing into another layer from App or Shared.
- **The cases are written once for every frontend.** They take the frontend's two folder names, which the proof spells out itself and does not read from the statement. Ticket 04 runs the same cases for the Shopper app.
- **A new command, `pnpm boundaries:write`.** The ticket did not name it. It is run after the statement of the bans is changed.

**Fault checks,** each made in the statement, written out, and reverted:

| Fault | What failed |
|---|---|
| The layer ban removed | The Shared file that imports a page, the same import made lazily, and the Features file that imports the Widgets layer |
| The slice ban removed | The page that imports another page |
| The index ban removed | All three lines for an import past an index file: of a slice, of a page from the App layer, and of a Shared segment |
| The relative-import bans removed | All six: leaving a slice from each of the three depths, climbing in a file nested deeper, and crossing into another layer from Shared and from App |
| The depth that is followed lowered to two | Leaving a slice from a folder inside a segment, caught with the wrong message, and the allowed relative import from a folder inside a segment, refused |
| The slice ban put on every layer | The allowed line for a Shared segment that imports another through its index file |
| The written file edited by hand, the statement untouched | The line that compares the two, and the three Shared lines whose block had been taken out |

**Other results.**

- The dashboard's `lint` target twice: the second run came from the cache. After one ban was reworded and written out again, the target ran again and reported no cache hit.
- The proof's lines from tickets 01 and 02 still pass. The dashboard's two lines for `@pcp/core` and `@pcp/compatibility` are planted in its Shared layer, where the new bans apply as well, so the boundary rule and the new bans hold on the same file.
- `pnpm check` passes, and nothing under the dashboard's `src` folder has changed. The Widgets, Features and Entities folders were not created.

