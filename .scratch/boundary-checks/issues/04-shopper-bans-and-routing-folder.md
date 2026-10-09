# 04: The Shopper app obeys the same bans, and Next's routing folder only routes

**Spec:** [the boundary checks spec](../spec.md)

**What to build:** The Shopper app is held to the same four bans as the dashboard, taken from the one place ticket 03 stated them and applied with the Shopper app's own layer names, `_app` and `_pages`. A change to a ban now reaches both frontends at once, so the two cannot drift apart.

The Shopper app has one thing the dashboard has not: Next's own routing folder, which sits outside the layers. From this ticket on, a file in it imports project code only from the App layer and from a page in the Pages layer, each through its index file. That is ADR-0004's sentence "Next's own `app` folder only routes", made checkable.

**Blocked by:** 03

**Status:** resolved

- [x] Before anything is configured, Feature-Sliced Design's current guide for Next.js is read again for what belongs in the routing folder and for where Next's special files go. The findings are recorded under Comments.
- [x] The layer ban, the slice ban, the index ban and the ban on climbing relative imports hold in the Shopper app as they do in the dashboard, with the App and Pages layers named `_app` and `_pages`.
- [x] The Shopper app takes its bans from the same statement as the dashboard. Shown once and then reverted: one ban weakened in that one place makes the proof fail on both apps' lines for it.
- [x] A file in Next's routing folder may import project code only from the App layer and from a page in the Pages layer, each through its index file.
- [x] A relative import inside the routing folder is allowed. A relative import that climbs from the routing folder into a layer is refused.
- [x] The routing folder's rule carries its own message, which says what is forbidden and what to do instead.
- [x] The bans are in place for the Widgets, Features and Entities layers, and no folder is created for them.
- [x] Whatever states the Shopper app's rules is an input of its `lint` target: after a rule is changed, the target runs again and does not reuse a cached result.
- [x] The proof gains the Shopper app's forbidden cases, the same list as the dashboard's in ticket 03 with the Shopper app's layer names, and these for the routing folder: a route file imports the Shared layer directly; a route file reaches past the App layer's index file; a route file reaches a layer by a relative path.
- [x] The proof gains the Shopper app's allowed cases, the same list as the dashboard's, and these for the routing folder: a route file imports a page through its index file, and one file in the routing folder imports another by a relative path.
- [x] Shown once and then reverted, each making the proof fail on its own lines: the routing folder's rule removed, and the routing folder's rule widened so that an allowed case fails.
- [x] The proof's lines from tickets 01 to 03 still pass.
- [x] `pnpm check` passes with no change to the Shopper app's source.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 9 October 2026: completed

**What Feature-Sliced Design's guide for Next.js says,** read before the rule was written:

- Next's `app` folder stays at the project's root and the layers live under `src`, with the App and Pages layers named `_app` and `_pages` to keep them apart from Next's own folders.
- A route file re-exports a page: `export { ExamplePage as default, metadata } from '@/_pages/example';`.
- An API route's code goes in an `api-routes` segment of the App layer and is re-exported from the routing folder.
- Middleware and instrumentation files sit at the project's root, beside the routing folder.
- A module that may only be imported on the server can be given a second index file, `index.server.ts`.

**What follows from that for the rule.**

- **The routing folder's two sources are the ones the guide uses:** a page, and the App layer. Everything a route file needs from further down reaches it through one of those.
- **An API route's code will come through the App layer's one index file.** The guide's own example imports the `api-routes` segment directly. Here the App layer has a single index file, so that import would be refused as reaching past it. When the first API route is written, either the App layer's index file re-exports it or the rule is opened for that segment.
- **A second index file for server-only code is refused as well,** as an import past the index file. That is a decision for the first slice that needs one.
- **Files at the Shopper app's root are not covered by these bans.** No middleware or instrumentation file exists yet. One that appears is outside both `src` and the routing folder. (Corrected on 9 October 2026. This first said that the rules between projects applied to such a file. They did not at the time, and they do since the code review: see the Comments of ticket 05.)

**What differs from the first plan, or is not obvious.**

- **The Shopper app needed nothing new for the four bans.** It was added to the list of frontends with its two folder names, the bans were written out for it, and its lint configuration extends the written file. All of its 20 lines then passed.
- **The routing folder's rule is one more block in the Shopper app's written file.** It has three parts: the four lower layers are refused with a message of its own, the App layer and a page are refused past their index files with the index ban's message, and a relative path that climbs into `src` is refused with the message for crossing into a layer.
- **Two patterns that match one import make two reports.** The third fault below showed it. The proof counts that as a failure, so the patterns of a block must not overlap.
- **The proof has seven lines for the routing folder:** four refused and three allowed. The ticket listed three refused and two allowed. The added ones are a route file that reaches past a page's index file, and a route file that imports the App layer through its index file.

**Fault checks,** each made in the statement, written out, and reverted:

| Fault | What failed |
|---|---|
| The slice ban removed | "A page that imports another page is refused", for the dashboard and for the Shopper app |
| The routing folder's rule removed | All four refused lines for a route file |
| The routing folder's rule widened to refuse the Pages layer | "A route file that imports a page through its index file is allowed"; the line for reaching past a page's index file, which was reported twice; and the line for nothing unplanted, which named the Shopper app's real route file |

**Other results.**

- The Shopper app's `lint` target twice: the second run came from the cache. After the routing rule was reworded and written out again, the target ran again and reported no cache hit.
- The proof's 75 lines all pass, among them every line from tickets 01 to 03.
- `pnpm check` passes. Nothing under the Shopper app's `src` folder or its routing folder has changed, and the Widgets, Features and Entities folders were not created.

