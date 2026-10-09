# 04: The Shopper app obeys the same bans, and Next's routing folder only routes

**Spec:** [the boundary checks spec](../spec.md)

**What to build:** The Shopper app is held to the same four bans as the dashboard, taken from the one place ticket 03 stated them and applied with the Shopper app's own layer names, `_app` and `_pages`. A change to a ban now reaches both frontends at once, so the two cannot drift apart.

The Shopper app has one thing the dashboard has not: Next's own routing folder, which sits outside the layers. From this ticket on, a file in it imports project code only from the App layer and from a page in the Pages layer, each through its index file. That is ADR-0004's sentence "Next's own `app` folder only routes", made checkable.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Before anything is configured, Feature-Sliced Design's current guide for Next.js is read again for what belongs in the routing folder and for where Next's special files go. The findings are recorded under Comments.
- [ ] The layer ban, the slice ban, the index ban and the ban on climbing relative imports hold in the Shopper app as they do in the dashboard, with the App and Pages layers named `_app` and `_pages`.
- [ ] The Shopper app takes its bans from the same statement as the dashboard. Shown once and then reverted: one ban weakened in that one place makes the proof fail on both apps' lines for it.
- [ ] A file in Next's routing folder may import project code only from the App layer and from a page in the Pages layer, each through its index file.
- [ ] A relative import inside the routing folder is allowed. A relative import that climbs from the routing folder into a layer is refused.
- [ ] The routing folder's rule carries its own message, which says what is forbidden and what to do instead.
- [ ] The bans are in place for the Widgets, Features and Entities layers, and no folder is created for them.
- [ ] Whatever states the Shopper app's rules is an input of its `lint` target: after a rule is changed, the target runs again and does not reuse a cached result.
- [ ] The proof gains the Shopper app's forbidden cases, the same list as the dashboard's in ticket 03 with the Shopper app's layer names, and these for the routing folder: a route file imports the Shared layer directly; a route file reaches past the App layer's index file; a route file reaches a layer by a relative path.
- [ ] The proof gains the Shopper app's allowed cases, the same list as the dashboard's, and these for the routing folder: a route file imports a page through its index file, and one file in the routing folder imports another by a relative path.
- [ ] Shown once and then reverted, each making the proof fail on its own lines: the routing folder's rule removed, and the routing folder's rule widened so that an allowed case fails.
- [ ] The proof's lines from tickets 01 to 03 still pass.
- [ ] `pnpm check` passes with no change to the Shopper app's source.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
