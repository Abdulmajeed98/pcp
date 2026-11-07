# The code review of the follow-ups

The follow-up tickets in `issues/`, 01 to 09, were implemented on `main` from `3cc5c1e` on 7 November 2026, and reviewed on two axes by separate reviewers: the repository's standards, and the tickets with the owner's decisions recorded in them. This file records how each finding was dealt with. Each ticket's own Comments say more.

## Comments

### 7 November 2026: the findings, and what was done

**Standards.**

1. **The Shopper's DESIGN.md out of date** (ticket 07): its not-found page and Motion said the page is a bare document the browser draws. Brought up to date, with the MVP spec's line on a page that is not found.
2. **No `pnpm boundaries:check` after the Nx upgrade** (ticket 08), which the MVP spec asks for. It failed on Nx 23.3.1, every line of the dashboard and the Shopper app; `tools/check-boundaries.mjs` now reads Nx 23.3's output, and it passes all 128 lines. The same change of Nx had hidden every test's line from `pnpm platform:check`, which now asks for static output.
3. **The out-of-scope record a deferral** (ticket 09): it now gives a lasting reason, that the glossary defines the platform as it is.
4. **Commit scopes**: commits about the inspector alone, the e2e tests alone or the word list alone lacked their project's scope. Their messages are written again, with `inspector`, `e2e` and `i18n`, before anything is pushed.
5. **No Taste inspector run for ticket 07**: run on the not-found page in both languages and schemes, 0 FAIL, the WARNs those browse ticket 09 defended.
6. **Smells**: the list of currencies and the reading of an option and its choices, each written twice, are now one (ticket 06); the undici release check moved into its test (ticket 01); `GlobalNotFound` takes its language as every page does, through the request set-up (ticket 07). The same fact about the not-found screen stated in many comments was left so: each file says why it does what it does, and the record of it is DESIGN.md. The two lines Nx's migration added to `.gitignore` sit under their own comment, and a comment wrapped short is rewrapped.
7. **Outside the brief**: `MarkAReturn`'s branch for a page the browser draws had lost its test; the motion line now comes back to an unknown Category's not-found page.

**Spec.**

1. **DESIGN.md** (ticket 07): as Standards 1.
2. **The Impeccable waiver** (ticket 03) silenced every size note on the Shopper theme, with no decision of the owner's behind it, where the ticket asked for the notes to be defended. Taken out; the design skills guide says the seven notes are expected and defended. A scoped waiver stays the owner's to choose.
3. **`.out-of-scope/` named nowhere** (ticket 09): `docs/agents/issue-tracker.md` now names it, and `.scratch/follow-ups/`.
4. **An address with a dot in it** came back in the Shopper app's first language (ticket 07): the proxy now sees every address under a language, test first.
5. **The not-found page's content read only in the browser** (ticket 07): a new line with scripts switched off finds its heading and the eight Categories.

**Checks before the review**, on `81ee0ec`: `pnpm check --skip-nx-cache` before every commit, `pnpm integration:check` 535 passed, `pnpm platform:check` exited 0 (Nx 23.3.1 printed no count; see Standards 2).
