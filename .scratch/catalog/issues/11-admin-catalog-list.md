# 11: Admin console: the Catalog list and search

**Spec:** [the catalog spec](../spec.md)

**What to build:** The Admin opens the Catalog in the Admin console on a phone and searches the whole catalog by name, manufacturer or part number, optionally in one Category. The results come in pages, each with its Category's icon, name, manufacturer, Category and part numbers. When nothing is found, the screen says so. This is the platform's first real page, and it is built to the dashboard's look, Rate Board, in `apps/dashboard/DESIGN.md`, and to the root DESIGN.md that both apps share.

The dashboard gains its first libraries, the most widely used for each job, as the owner chose on 14 October 2026:

- React Router for the screens' addresses;
- TanStack Query for calls to the API, which still go through `@pcp/api-client`;
- shadcn/ui's first components: the dashboard's own set (ADR-0007), on Base UI in the Mira style, themed from the dashboard's tokens in `@pcp/ui/themes/dashboard.css` and set up with its right-to-left setting on;
- lucide's icons.

`ui` gains the Category icon. `pnpm platform:check` gains the automated part of the chosen accessibility standard.

**Blocked by:** 02, 06, 10, and tickets 05 and 06 of [the languages spec](../../languages/spec.md)

**Status:** resolved

- [x] Before anything is written, these are read for the releases that will be installed, and the findings are recorded under Comments:
  - React Router's modes, and which suits a client-rendered app whose routes are declared in the App layer;
  - TanStack Query's set-up, and how it fits `@pcp/api-client`'s calls, which never throw;
  - shadcn/ui's set-up when each app has its own set of components (ADR-0007): where the dashboard's set lives, how its command writes there with the right-to-left setting on, on Base UI in the Mira style, and how its `components.json` points at the dashboard's theme. shadcn/ui's documentation describes one set in a monorepo, so this is to be found out. Two things the set-up must not undo: the dark scheme follows the device through `prefers-color-scheme` and Tailwind's own `dark:` variant, so no `.dark` class variant is added; and a control whose border is the only sign of where it is draws it in `input`, not `border`, which is too light for WCAG's 3:1.
- [x] React Router, TanStack Query, lucide-react and shadcn/ui's first components are added, as the current stable releases. A new package's install script is read before it is listed.
- [x] The router lives in the App layer. The Catalog has an address of its own in the Admin console.
- [x] The Vendor portal is unchanged. A Vendor who opens the Catalog's address gets the Vendor portal.
- [x] `ui` gains a component that shows a Category's icon: `cpu`, `fan`, `circuit-board`, `memory-stick`, `hard-drive`, `gpu`, `pc-case` and `plug-zap`.
- [x] The Catalog has a search box, a choice of Category named from the shared terms in English, and the results in pages with the total found. It says so plainly when nothing is found, and shows a refusal from the API as one.
- [x] Its text is English, written where it is used, as `languages` decided for the Admin console.
- [x] It follows `apps/dashboard/DESIGN.md` and the root DESIGN.md, in light and in dark, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules. `pnpm boundaries:check` passes if the lint configuration or a layer folder changed.
- [x] The end-to-end tests gain a helper that runs the automated part of the chosen accessibility standard, WCAG 2.2 level AA, on a page, unless ticket 14 has already added it. It runs axe-core through `@axe-core/playwright` with the tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa`, in the light and in the dark scheme, and a planted target smaller than 24 pixels shows whether `target-size` runs.
- [x] `pnpm platform:check` gains these lines, and passes on every line:
  - As the development Admin, in a window 360 pixels wide: a made-up Part, created over HTTP with a name unique to the run, is found on the Catalog by a word of its name and by its part number. It shows its Category's icon.
  - Choosing another Category leaves it out.
  - The Catalog does not scroll sideways.
  - The accessibility helper passes on the Catalog, in light and in dark.
  - As the development Vendor, the Catalog's address does not show the Catalog.
- [x] Shown once and then reverted, each failing on its own line: the Category's choice ignored; the Vendor sent to the Admin console; a control given no accessible name.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 16 October 2026: settled before anything was written

**React Router 8.4.0, in data mode.**

- Its documentation names three modes. Declarative mode declares routes as JSX inside `<BrowserRouter>`. Data mode declares them as route objects outside React's rendering, passed to `createBrowserRouter`, and adds loaders, actions and pending states. Framework mode wraps data mode in React Router's own Vite plugin, with routes in a configuration file.
- Framework mode is left out: it brings its own plugin, build and file layout, and the dashboard is a client-rendered app that Nx builds with plain Vite.
- Data mode is chosen. The routes are plain objects that the App layer declares in one file, apart from the components, which is where Feature-Sliced Design puts them. Its loaders are not used, because TanStack Query fetches the data. It leaves room for an error screen for each route, and for a blocker on a form left half filled, which only data mode has.
- The router is made once, after the login and only for the Admin console. keycloak-js cleans the login's answer off the address as the dashboard starts, so a router made before that would start from an address with the answer still on it.
- React Router 8 needs React 19.2.7 or later and Node 22.22 or later. The workspace has React 19.3.0 and Node 24.

**TanStack Query 5, beside `@pcp/api-client`.**

- A query function must throw, or return a rejected promise, for TanStack Query to treat the query as failed. A client that does not throw, as `fetch` does not, has to be made to.
- `@pcp/api-client`'s calls never throw. They answer with `data`, or with `error`, the API's error body, and with no response at all when the API cannot be reached.
- So one small function in the Shared layer's `api` segment turns a call's answer into its data, or throws: a refusal, which keeps the status and the API's error body, or "unreachable". Each screen reads `error` and says which it was, and a form reads the error body's `field` to put the refusal beside its field.
- TanStack Query retries a failed query three times by default, which would hold a 403 or a 404 on screen for several seconds. Only "unreachable" is retried, once.
- One `QueryClient` is made in the App layer and given to both halves.

**shadcn/ui 4.21.5, with each app's own set (ADR-0007).**

- Its documented monorepo keeps one set in a shared package, and every app's `components.json` must name the same style. Two styles therefore need two `components.json` files and two sets.
- The dashboard's set is in the dashboard, in the Shared layer's `ui` segment, `apps/dashboard/src/shared/ui`, imported as `@/shared/ui` through its index file. `apps/dashboard/components.json` names the style `base-mira`, Base UI under the Mira style, with `rtl: true`, lucide's icons and the aliases of the Shared layer. The Shopper app's set will have its own `components.json`, in its own folder, when its first component is added.
- With `rtl: true` the CLI writes logical classes and props in place of physical ones, such as `end-*` for `right-*` and `pe-*` for `pr-*`, and turns icons that point with `rtl:rotate-180`. A right-to-left page also needs Base UI's `DirectionProvider`, which shadcn/ui's `direction` component gives under its own name, and a menu's popup is given `dir` as well.
- The CLI no longer writes a `utils` file. Components import `cn` from shadcn's own package, `cn`, which replaces `clsx` and `tailwind-merge`.
- What its output needs before it is kept, found with `shadcn add … --dry-run --view` before anything was written:
  - It imports one component from another past the index file, as `@/shared/ui/separator`. Feature-Sliced Design's bans refuse that, so such an import is made relative, `./separator`, inside the segment.
  - The Mira style is compact: controls are 28 pixels high, with 12-pixel text from `text-xs`. The root DESIGN.md asks for 44 pixels and no text under 14, and the theme takes `text-xs` away, so each component is set to `h-control` and the body or small size.
  - Its focus ring is drawn at 30% strength, `ring-ring/30`. The root DESIGN.md asks for full strength, so each is drawn in `ring` itself.
  - The outline button draws its border in `border`. The border is what shows such a button's edge, so it is drawn in `input`, which meets 3:1.
- Two things the set-up must not undo, and does not: the CLI was given the dashboard's own stylesheet as its `tailwind.css`, and adding the components wrote no CSS, so no `.dark` class variant and no colours of shadcn/ui's own reached it. The dark scheme still follows the device through Tailwind's own `dark:`.
- The components are added with `pnpm dlx shadcn@4.21.5 add …` from the dashboard's folder. `shadcn` and `cn` have no install script.

### 16 October 2026: completed

**For the owner to know.**

- **The Admin console opens on the Catalog,** at `/catalog`, in place of its placeholder. It searches the whole catalog and shows 20 Parts a page, in name order, with the count found on the screen's one plate. The address holds the search, so a search survives a reload and the back button.
- **Two choices the owner made on 16 October 2026, when asked:**
  - A row does not yet end in an amber plate with how many needed specifications the Part lacks, as the dashboard's brief draws it. The search's answer does not hold that count, and the missing-specifications list arrives with `offers`.
  - The top bar has no menu of sections while the Catalog is the only one. It names the console, and shows the caller's name and Log out. The menu arrives with the second section.
- **The dashboard's shadcn/ui components** are its own, in `apps/dashboard/src/shared/ui`, added with `pnpm dlx shadcn@4.21.5 add …` from the dashboard's folder and then held to the root DESIGN.md, as the first comment says. The command reads the `@/` alias from the app's `tsconfig.json`, which held none, and the first run wrote its files into a folder named `@`. The alias is now in `tsconfig.json` as well as `tsconfig.app.json`.
- **Two new pieces of the Shared layer** serve every later screen: `dataOf`, which turns `@pcp/api-client`'s answer into data or throws a refusal for TanStack Query, and the Plate. The Category's list and names are in a new Entities slice, `category`, which ticket 12's form will use.
- **The Admin's login test changed.** It read the placeholder's line with the caller's roles, which the Catalog replaces. It now finds the caller's name in the top bar and the Catalog below it, the half a login with the role `admin` gets.
- **`ui`'s Category icon** takes the Categories' own keys, and says which Category it is drawn for in `data-category`, so that a test can read it. It is hidden from screen readers, because the Category's name is always in words beside it.

**The accessibility helper.**

- `apps/e2e/src/accessibility.ts` runs axe-core 4.13 through `@axe-core/playwright` with the tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa`, in the light and the dark scheme.
- **`target-size` runs with those tags alone.** Two 12-pixel buttons planted side by side in the top bar failed the helper with `target-size`, so the rule does not need turning on by name. A single small target alone passes it, as WCAG 2.5.8's spacing exception allows, so the plant used two.
- Its first run failed `color-contrast` in the dark scheme on the Log out button and a row's name. Both change colour with a transition, and axe measured them while they were moving from the light scheme's colours. The helper now waits for every running animation and transition to finish before it scans.

**The planted faults,** each made by one exact edit on a clean tree, run against `src/admin-catalog.spec.ts`, and undone by the inverse edit:

| Fault | The line that failed | The others |
|---|---|---|
| The Category's choice left out of the API call | A search in its own Category finds it, and choosing another leaves it out | 5 passed |
| Every login sent to the Admin console | As the development Vendor, the Catalog's address shows the Vendor portal | 5 passed |
| Log out's text taken away, leaving a button with no name | The Catalog meets WCAG 2.2 level AA, with `button-name` | 5 passed |
| Two 12-pixel buttons side by side | The Catalog meets WCAG 2.2 level AA, with `target-size` | 5 passed |

**The checks.**

- `pnpm platform:check` passed all 58 tests, the Catalog's 6 among them.
- `pnpm check --skip-nx-cache` passed with `DOCKER_HOST` pointed at a socket that does not exist.
- `pnpm boundaries:check` passed, after the dashboard gained its Entities layer's first folder.
- The Catalog was captured at 360 and 1440 pixels wide, in light and in dark, with results, with none, and on every Part. That round found "Admin console" breaking onto two lines at 360 pixels, and the empty state suggesting a search of every Category when the search already was one. Both were corrected.

**The commits,** each leaving `pnpm check` passing:

- the research, before anything was written;
- the libraries;
- the dashboard's shadcn/ui components;
- `ui`'s Category icon;
- the end-to-end tests, written first;
- the Catalog.

### 16 October 2026: the code review, and the finish

A review of tickets 11 to 14 on two axes, the repository's standards and the spec, ran in two agents of their own. What it found for this ticket's screens, all corrected:

- **The Catalog was one column at a desk.** The dashboard's DESIGN.md gives a list a detail pane beside it on a wider screen, and the owner chose on 16 October 2026 to build it now. From 64rem wide, the list keeps a 26rem column on the start side and the Part opened from it, its edit form or a new Part shows beside it, its row marked as the open one. On a phone the opened screen takes the whole screen, and the list is not rendered, so it asks the API for nothing. Every link and return among these screens keeps the Catalog's search on its address. The pane has two tests of its own, written first.
- **Corners of 4.8 pixels**, Mira's `rounded-md`, where the look sets 6 on controls and panels. They are `rounded-lg` now.
- **The results dimmed to 60% while the next page arrived**, which took Note Grey under 4.5:1. They stay at full strength, and a line beside the count says "Searching…".
- **A link drawn as a button had lost its outline,** found while capturing ticket 13, and fixed there.

**Impeccable's finish,** which the dashboard's brief asks for. Its own reviewer and documenter agents are not available in this session, so both ran in this thread, from the files Impeccable ships for that.

- The first viewport at 360 pixels keeps the brief's promises: the search field and the Category's choice 44 pixels high, a plate with the count, and dense rows of icon, name and manufacturer. Its two departures are the owner's choices of 16 October 2026: no menu of sections yet, and no plate at the end of a row. The type is Geist, the figures Geist Mono on the plate, the ground Warm Page, and nothing the craft floor refuses is on it.
- Its one material finding was the missing detail pane, now built and captured at 1440 pixels in light and in dark.
- `apps/dashboard/DESIGN.md` now records the components the Catalog, a Part's page and the form built, as its own note asked: buttons, inputs and choices, fields, rows, plates, the states and the navigation, with their tokens. The root DESIGN.md and the Shopper app's say where.
