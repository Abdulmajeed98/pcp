# 05: The Shopper's unit seam, started on the currency switch's address

**Spec:** [the browse spec](../spec.md)

**What to build:** The Shopper app gets unit tests of its own functions, the fourth seam the owner added on 3 November 2026, and the first in either frontend. The runner is the owner's choice, made from the agent's research. The seam's first function is a real change in this module. The currency switch keeps the page's query as `pricing` built it, but now drops `lowest` and `highest`, because a price range typed in dinars must never be read as dollars.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] **The research.** It reads Next.js's current documentation on testing and the unit-test runners it documents. For each runner, it finds how widely used it is (its weekly downloads), how it runs in an Nx project (Nx's own plugin for it, if any), and how it fits this workspace's TypeScript, its ES modules, Node 24, and the Shopper app's next-intl and Feature-Sliced Design. Sources are cited. It is recorded under Comments.
- [ ] **The owner's choice.** The runners are put to the owner, the most widely used one that fits recommended first, as the owner has chosen every library so far. The owner's word is recorded under Comments.
- [ ] **Its set-up.** The runner is installed pinned to an exact version, with no exception to the workspace's release-age rule. It runs through the Shopper app's own `test` target, so `pnpm check` runs it. Where the tests live is decided and recorded under Comments.
- [ ] **The first function.** It writes the address the currency switch returns to: the page the Shopper was on, with its query, without `lowest` and `highest`. Its tests are written before the code, and they prove each of these:
  - the rest of the query is kept, a repeated parameter among it;
  - `lowest` and `highest` are dropped, alone or together;
  - a page with no query returns with none;
  - the language part of the address is kept.
- [ ] **Its use.** The currency switch's server answer uses the function, and it is the only place the rule is written.
- [ ] `pnpm platform:check`'s `shopper-currency.spec.ts` gains a line and passes on every line: a page whose query holds `lowest`, `highest` and another parameter returns without the two and with the other, with scripts and without.
- [ ] **What the seam tests.** Plain functions only, through their module's public face. Never a server component, a page, the API, or what the browser draws. This is written where the seam's tests live.
- [ ] Shown once and then reverted: the function keeping `lowest`, failing its unit test.
- [ ] `pnpm check` passes with Docker stopped, its new unit tests among it.
- [ ] The results of the fault check are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
