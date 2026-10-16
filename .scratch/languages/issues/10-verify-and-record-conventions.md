# 10: Verify from a fresh clone and record the conventions in the MVP spec

**Spec:** [the languages spec](../spec.md)

**What to build:** The module is proven sound as a whole, the way the next person to pick it up will meet it: a fresh clone in a new directory, with no `.env` and no Docker volumes, then the install, the checks, the services and `pnpm platform:check`, with none of the three apps started by hand. The infrastructure steps showed that results left over from earlier runs can hide a fault, so this run is the one that counts.

Some things a test cannot see. It reads the characters of a page and not the order they are drawn in, and it has no phone. The owner is asked to read those, once.

The conventions this module set are written into [the MVP spec](../../mvp/spec.md), so that the first module that builds a Shopper page or a Vendor portal screen starts from them. A new ADR records the two decisions that are hard to undo. This ticket closes `languages`. The review of the Kurdish and the Arabic text (LANG-7) stays open until launch.

The services of the owner's own checkout are stopped before the fresh clone's services are started, because both would claim the same ports. They are started again afterwards.

**Blocked by:** 03, 07, 09

**Status:** resolved

- [x] In a fresh clone in a new directory, with no `.env` and no Docker volumes left from earlier runs, one install followed by `pnpm check --skip-nx-cache` passes, with Docker stopped and before any browser is installed.
- [x] In the same clone, `pnpm boundaries:check` passes on every line, and Git then reports a clean working tree.
- [x] In the same clone, `pnpm services:up` followed by `pnpm services:check` passes on every line, the development Vendor's lines among them.
- [x] In the same clone, after the browser's one-time install, `pnpm platform:check` passes on every line with none of the three apps started by hand, and leaves none of them running.
- [x] The command's output holds a line for every check in the spec's second seam, and `pnpm check` holds a case for every item of its first seam.
- [x] The owner is asked to read these, once, in their own browser and on their own phone. What they saw, or that it is still to be done, is recorded under Comments:
  - On the Kurdish and the Arabic page of the Shopper app, the Part name and the specification read in their own order inside the sentence, and the number keeps its place beside its unit.
  - The Arabic sentence that counts is worded correctly for 1, 2, 3, 11 and 100.
  - On the English page, the line in Arabic script reads right to left.
  - The Sorani letters ڕ, ڵ, ێ, ۆ and ە are drawn correctly in the phone's own font, and on an older Android phone if one is at hand.
  - The frame and its switch are usable with a thumb on a real phone, in Kurdish and in English.
  - The same sample in the Vendor portal, logged in as the development Vendor.
- [x] No password is committed, Git ignores `.env`, and Git reports a clean working tree after every command above.
- [x] The Technology section of the MVP spec gains the conventions for text: that all translated text lives in `i18n`, its three sets and their formats, that English is the source, how each frontend reads its text, and that a key is type-checked.
- [x] The MVP spec gains the conventions for the Shopper app: the shape of an address, what an address with no language does, where the choice is remembered and for how long, and what ticket 03 found about when it is written. It gains where next-intl's set-up lives and what the proxy file may import.
- [x] The MVP spec gains the conventions for the dashboard: the rule for which half a login gets, how the Vendor portal chooses and remembers its language, and that the Admin console is in English with its own text written in the code.
- [x] The MVP spec gains the conventions for layout and numbers: that direction is stated in `i18n`, the rule against classes with a physical side and what checks it, the one number formatter and how each library is held to Western digits, the two components for as-written text, the rule for an icon that points, and the rule for the first shadcn/ui component.
- [x] The MVP spec gains how a page is tested in three languages: the helper, the window 360 pixels wide, and that no test quotes a translation.
- [x] The MVP spec's description of `pnpm check` gains the step that compares the language files. Its sentence on when to run `pnpm platform:check` gains this module's reasons.
- [x] The MVP spec gains the development Vendor's name and where its password is kept, in its table of development services and beside the development Admin.
- [x] The MVP spec's tables of directories and of import rules gain `ui`'s second entry and the proxy file. Its list of what is decided gains the libraries chosen in this module, with react-i18next beside next-intl.
- [x] The MVP spec's `languages` requirements gain the Vendor portal's rule, which follows LANG-6, and LANG-5 reads that every number is in Western digits.
- [x] The MVP spec says that `languages` is finished, with its date and a link to this spec, and that LANG-7 is still open.
- [x] A new ADR records that the language is part of a Shopper address, and that the two frontends use two libraries with two message formats, with the options that were considered.
- [x] PRODUCT.md names the dashboard's library beside the Shopper app's. CONTEXT.md gains a term only if the work found one that the glossary lacks.
- [x] A fault found here is fixed in this ticket, and the fix is recorded under Comments.
- [x] The results of the from-scratch run are recorded under Comments.
- [x] The work is committed.

## Comments

### 16 October 2026: completed, except the owner's reading by hand

**Still to be done, and only the owner can do it.** The six readings above, in the owner's own browser and on their own phone. The owner was asked for them on 16 October 2026, when this ticket closed. Their box is ticked because asking is what it asks for; what the owner sees is to be written here. To see the pages: with the services up, run `pnpm exec nx serve @pcp/api`, `pnpm exec nx serve @pcp/shopper` and `pnpm exec nx serve @pcp/dashboard`; open `http://localhost:3000/ckb`, `/ar` and `/en`; and open `http://localhost:3002`, log in as `development-vendor` with the password in `.env`, under `DEVELOPMENT_VENDOR_PASSWORD`, and use the switch. For the phone, the Shopper app is built and started as it would be served, with `pnpm exec nx build @pcp/shopper` and then `pnpm exec nx start @pcp/shopper`, and opened at the computer's own address on the same network, such as `http://192.168.1.20:3000/ckb`. Next's development server answers there too, but its documentation says it blocks requests for its development assets from any host but `localhost` unless `allowedDevOrigins` lists it, so the page might not be the one a Shopper sees. The Vendor portal is read on the computer, in a window as narrow as a phone: its login goes through Keycloak at `localhost:8080`, which a phone cannot reach.

**The from-scratch run.** A clone of the repository, at `72b71ea`, was made in a new folder with another name, so that Docker gave it volumes of its own, with no `.env`. The owner's services were stopped first, and started again afterwards.

| Step | Result |
|---|---|
| `pnpm install` | Passed, in 3 seconds |
| `pnpm check --skip-nx-cache` | Passed: the format check, the import bans, the language files, the client, the migrations, the files outside the projects, then 25 tasks for the ten projects. Docker was made unreachable for the command and Playwright pointed at a folder that holds no browser. 14 seconds |
| `pnpm boundaries:check` | Passed on all 114 lines |
| `pnpm services:up` | Created `.env` and both development logins, in 17 seconds |
| `pnpm services:check` | Passed on all 37 lines, the development Vendor's among them: the login exists and is switched on, holds the `vendor` role and does not hold the `admin` role |
| `pnpm exec playwright install chromium` | Nothing to download: the browser was in this machine's cache |
| `pnpm platform:check` | Passed on all 52 lines in 41 seconds, with no app started by hand. Afterwards nothing listened on the apps' ports and no Nx process was left |

Git reported a clean working tree after every step, and ignores `.env`. As in the earlier steps, Docker itself was never stopped: the owner's services were stopped, and `pnpm check` was pointed at a socket that does not exist. The clone's services were then reset, which deleted its volumes, and the clone was deleted. The owner's services were started again and pass their 37 lines.

The 25 tasks of `pnpm check` took under nine seconds of Nx's time with the cache skipped. That is not a cache answering: the API's and the dashboard's builds were written inside the check's window in the clone, which had none before.

**Every check has its line or its case.**

- **The second seam, in `pnpm platform:check`.** The Shopper app: the five first visits, from the server, the three differ, the switch on the first page and on the "not found" screen, the choice remembered for about a year, the address that wins, the switch with scripts off, the "not found" screen, the digits, the Part name and the specification, the as-written lines, the Category names, the width, the addresses for search engines, the title, and step 4's line, which opens `/en`. The Vendor portal, as the development Vendor: which half, the first visit in Arabic, English and French, the switch in place, the choice after a reload and a new login, a detected language not kept, the message for a failed login, no token stored, and the digits, the sample and the width in each language. The Admin console, as the development Admin: English and left to right in a browser set to Arabic, no switch, left alone after a Vendor's choice, and the width.
- **The development Vendor login,** in `pnpm services:check`.
- **The first seam, in `pnpm check`.** The language files: the step that compares them, which ticket 09 saw fail on seventeen planted faults. Keys: each frontend's `typecheck`, which ticket 06 and ticket 08 saw fail on a misspelled key, a shared term's among them. Classes: the lint rule, which ticket 01 saw refuse a physical class in each frontend and in `ui`. Still true: everything `pnpm check` proved before passes, with Docker unreachable and no browser.

**What was written.**

- **The MVP spec.** Its Technology section gains **The three languages**: the languages and the rule for a browser's; where the text lives, its three sets and their formats, that English is the source and a key is type-checked, the README and the word list; numbers, `formatNumber`, and how each library is held to Western digits; direction, the rule against classes with a physical side and what checks it, `ui`'s `@source` line, the rule for an icon that points and for the first shadcn/ui component; the two components for text that is not translated; the Shopper app's addresses, its cookie, when next-intl writes it, the switch, and where next-intl's set-up and the proxy file are; the dashboard's two halves, the Vendor portal's remembered choice and the Admin console; and how a page is tested in three languages. Its list of what is decided gains react-i18next beside next-intl, the matching library, and Tailwind CSS with `oxlint-tailwindcss`. `pnpm check`'s row and a paragraph after the table describe the new step, and the sentence on when to run `pnpm platform:check` gains this module's reasons. The development logins gain their two names in `.env`. The layout names the language segment, the proxy file and the language files, and the import rules gain the proxy file's. LANG-5 and LANG-6 gain their wider readings, and the spec says that `languages` is finished and that LANG-7 is still open. `ui`'s stylesheet entries were already recorded, by the `catalog` module's ADR-0007.
- **ADR-0008,** `docs/adr/0008-language-in-the-address-and-two-message-formats.md`, records that the language is part of a Shopper address and that the two frontends use two libraries with two message formats, with the options considered for each and what follows.
- **PRODUCT.md** names react-i18next for the dashboard, beside next-intl for the Shopper app.
- **The languages spec's stories 28 and 29,** which ticket 04 found gave examples the browser leaves whole, now give "990 PRO 2TB" and "80 mm", which it does reorder, and say so.
- **CONTEXT.md** gains no term. "Vendor portal" and "Admin console" name the dashboard's two halves, which PRODUCT.md and the MVP spec define; they are names of the product's parts and not of the domain.

**No fault was found here.** The faults this module's last tickets found were fixed in them, and the code review's findings are under ticket 09.

**What stays open after `languages`.**

- LANG-7: the review of the Kurdish and the Arabic text, and of the word list, before launch.
- The owner's six readings above.
- From ticket 03: whether opening a link in another language should change what the Shopper app remembers. `sharing` decides it.
- From ticket 02: the "not found" screen, which alone needs a script. `browse` decides it.
- From ticket 04: how a page's test reads a Vendor's own Arabic-Indic digits in text shown as written. The first page that shows such text decides it.
