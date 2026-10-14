# 11: Admin console: the Catalog list and search

**Spec:** [the catalog spec](../spec.md)

**What to build:** The Admin opens the Catalog in the Admin console on a phone and searches the whole catalog by name, manufacturer or part number, optionally in one Category. The results come in pages, each with its Category's icon, name, manufacturer, Category and part numbers. When nothing is found, the screen says so. This is the platform's first real page, and it is built to DESIGN.md.

The dashboard gains its first libraries, the most widely used for each job, as the owner chose on 14 October 2026:

- React Router for the screens' addresses;
- TanStack Query for calls to the API, which still go through `@pcp/api-client`;
- shadcn/ui's first components, themed from the tokens and set up with its right-to-left setting on;
- lucide's icons.

`ui` gains the Category icon. `pnpm platform:check` gains the automated part of the chosen accessibility standard.

**Blocked by:** 02, 06, 10, and tickets 05 and 06 of [the languages spec](../../languages/spec.md)

**Status:** ready-for-agent

- [ ] Before anything is written, these are read for the releases that will be installed, and the findings are recorded under Comments:
  - React Router's modes, and which suits a client-rendered app whose routes are declared in the App layer;
  - TanStack Query's set-up, and how it fits `@pcp/api-client`'s calls, which never throw;
  - shadcn/ui's set-up for a monorepo with its right-to-left setting, and where its command can write into `ui` under its single entry.
- [ ] React Router, TanStack Query, lucide-react and shadcn/ui's first components are added, as the current stable releases. A new package's install script is read before it is listed.
- [ ] The router lives in the App layer. The Catalog has an address of its own in the Admin console.
- [ ] The Vendor portal is unchanged. A Vendor who opens the Catalog's address gets the Vendor portal.
- [ ] `ui` gains a component that shows a Category's icon: `cpu`, `fan`, `circuit-board`, `memory-stick`, `hard-drive`, `gpu`, `pc-case` and `plug-zap`.
- [ ] The Catalog has a search box, a choice of Category named from the shared terms in English, and the results in pages with the total found. It says so plainly when nothing is found, and shows a refusal from the API as one.
- [ ] Its text is English, written where it is used, as `languages` decided for the Admin console.
- [ ] It follows DESIGN.md, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules. `pnpm boundaries:check` passes if the lint configuration or a layer folder changed.
- [ ] The end-to-end tests gain a helper that runs the automated part of the chosen accessibility standard on a page, unless ticket 14 has already added it.
- [ ] `pnpm platform:check` gains these lines, and passes on every line:
  - As the development Admin, in a window 360 pixels wide: a made-up Part, created over HTTP with a name unique to the run, is found on the Catalog by a word of its name and by its part number. It shows its Category's icon.
  - Choosing another Category leaves it out.
  - The Catalog does not scroll sideways.
  - The accessibility helper passes on the Catalog.
  - As the development Vendor, the Catalog's address does not show the Catalog.
- [ ] Shown once and then reverted, each failing on its own line: the Category's choice ignored; the Vendor sent to the Admin console; a control given no accessible name.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
