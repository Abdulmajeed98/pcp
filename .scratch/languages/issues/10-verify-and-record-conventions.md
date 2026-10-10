# 10: Verify from a fresh clone and record the conventions in the MVP spec

**Spec:** [the languages spec](../spec.md)

**What to build:** The module is proven sound as a whole, the way the next person to pick it up will meet it: a fresh clone in a new directory, with no `.env` and no Docker volumes, then the install, the checks, the services and `pnpm platform:check`, with none of the three apps started by hand. The infrastructure steps showed that results left over from earlier runs can hide a fault, so this run is the one that counts.

Some things a test cannot see. It reads the characters of a page and not the order they are drawn in, and it has no phone. The owner is asked to read those, once.

The conventions this module set are written into [the MVP spec](../../mvp/spec.md), so that the first module that builds a Shopper page or a Vendor portal screen starts from them. A new ADR records the two decisions that are hard to undo. This ticket closes `languages`. The review of the Kurdish and the Arabic text (LANG-7) stays open until launch.

The services of the owner's own checkout are stopped before the fresh clone's services are started, because both would claim the same ports. They are started again afterwards.

**Blocked by:** 03, 07, 09

**Status:** ready-for-agent

- [ ] In a fresh clone in a new directory, with no `.env` and no Docker volumes left from earlier runs, one install followed by `pnpm check --skip-nx-cache` passes, with Docker stopped and before any browser is installed.
- [ ] In the same clone, `pnpm boundaries:check` passes on every line, and Git then reports a clean working tree.
- [ ] In the same clone, `pnpm services:up` followed by `pnpm services:check` passes on every line, the development Vendor's lines among them.
- [ ] In the same clone, after the browser's one-time install, `pnpm platform:check` passes on every line with none of the three apps started by hand, and leaves none of them running.
- [ ] The command's output holds a line for every check in the spec's second seam, and `pnpm check` holds a case for every item of its first seam.
- [ ] The owner is asked to read these, once, in their own browser and on their own phone. What they saw, or that it is still to be done, is recorded under Comments:
  - On the Kurdish and the Arabic page of the Shopper app, the Part name and the specification read in their own order inside the sentence, and the number keeps its place beside its unit.
  - The Arabic sentence that counts is worded correctly for 1, 2, 3, 11 and 100.
  - On the English page, the line in Arabic script reads right to left.
  - The Sorani letters ڕ, ڵ, ێ, ۆ and ە are drawn correctly in the phone's own font, and on an older Android phone if one is at hand.
  - The frame and its switch are usable with a thumb on a real phone, in Kurdish and in English.
  - The same sample in the Vendor portal, logged in as the development Vendor.
- [ ] No password is committed, Git ignores `.env`, and Git reports a clean working tree after every command above.
- [ ] The Technology section of the MVP spec gains the conventions for text: that all translated text lives in `i18n`, its three sets and their formats, that English is the source, how each frontend reads its text, and that a key is type-checked.
- [ ] The MVP spec gains the conventions for the Shopper app: the shape of an address, what an address with no language does, where the choice is remembered and for how long, and what ticket 03 found about when it is written. It gains where next-intl's set-up lives and what the proxy file may import.
- [ ] The MVP spec gains the conventions for the dashboard: the rule for which half a login gets, how the Vendor portal chooses and remembers its language, and that the Admin console is in English with its own text written in the code.
- [ ] The MVP spec gains the conventions for layout and numbers: that direction is stated in `i18n`, the rule against classes with a physical side and what checks it, the one number formatter and how each library is held to Western digits, the two components for as-written text, the rule for an icon that points, and the rule for the first shadcn/ui component.
- [ ] The MVP spec gains how a page is tested in three languages: the helper, the window 360 pixels wide, and that no test quotes a translation.
- [ ] The MVP spec's description of `pnpm check` gains the step that compares the language files. Its sentence on when to run `pnpm platform:check` gains this module's reasons.
- [ ] The MVP spec gains the development Vendor's name and where its password is kept, in its table of development services and beside the development Admin.
- [ ] The MVP spec's tables of directories and of import rules gain `ui`'s second entry and the proxy file. Its list of what is decided gains the libraries chosen in this module, with react-i18next beside next-intl.
- [ ] The MVP spec's `languages` requirements gain the Vendor portal's rule, which follows LANG-6, and LANG-5 reads that every number is in Western digits.
- [ ] The MVP spec says that `languages` is finished, with its date and a link to this spec, and that LANG-7 is still open.
- [ ] A new ADR records that the language is part of a Shopper address, and that the two frontends use two libraries with two message formats, with the options that were considered.
- [ ] PRODUCT.md names the dashboard's library beside the Shopper app's. CONTEXT.md gains a term only if the work found one that the glossary lacks.
- [ ] A fault found here is fixed in this ticket, and the fix is recorded under Comments.
- [ ] The results of the from-scratch run are recorded under Comments.
- [ ] The work is committed.
