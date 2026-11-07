# Design skills

Three families of design skills are installed at user level, and each **leads** the area it knows best. Read this before any design work on `apps/dashboard` or `apps/shopper`: designing, redesigning, critiquing, polishing, typography, colour, layout, motion or how a screen feels on a phone.

- **Impeccable** (`impeccable`), with this project's hook in `.claude/settings.local.json`.
- **Taste** (`design-taste-frontend`, tasteskill v2), from [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill).
- **Emil Kowalski's skills** (`emil-design-eng` and fourteen more), from [emilkowalski/skills](https://github.com/emilkowalski/skills).

The owner chose this set on 21 October 2026 because the dashboard, built with Impeccable alone, read as cold, rigid and templated.

Impeccable's detector, which its hook runs on every edit, judges a file against the `DESIGN.md` nearest to it, going up the folders. So the themes in `libs/ui/src/themes/` are judged against the root DESIGN.md, the platform's shared foundations. The dashboard's theme keeps the root's sizes and passes. The Shopper's takes the display sizes of `apps/shopper/DESIGN.md`, so the detector gives seven advisory notes on `shopper.css`, `design-system-font-size`, one for each of those sizes that the root lacks. They are expected and defended, not waived (follow-up ticket 03): its sizes are checked against the Shopper's DESIGN.md instead, the four display roles in its front matter and their Kurdish and Arabic settings in its Typography, and an eighth note there is a real one.

## Who leads what

The skill that leads an area decides it. The others contribute only inside that decision, and Impeccable writes every decision into the app's `DESIGN.md` (and an ADR when it replaces one).

| Area | Lead | The others' part |
|---|---|---|
| The record: `PRODUCT.md`, each `DESIGN.md`, ADRs, tokens | Impeccable | Taste and Emil propose; Impeccable records |
| Concept and art direction: the idea, composition, type, palette, imagery | Taste | Impeccable's `bolder` and `colorize` work inside the chosen direction |
| Layout and density of working screens: lists, tables, forms, the shell | Taste (`references/app-screens.md`) | Impeccable's `layout` and `distill` |
| Critique of an existing screen | Taste (its redesign audit and `inspect.mjs`) | Impeccable's `critique` adds UX and copy |
| Motion: whether to animate, easing, duration, transitions, gestures | Emil (`emil-design-eng`, `animate`, `find-animation-opportunities`, `review-animations`, `improve-animations`, `animation-performance`) | none; Emil's skills replace Impeccable's `animate` |
| Feel on a phone: touch, tap, viewport, safe areas | Emil (`mobile-native`) | Impeccable's `adapt` |
| Worst-case data: long names, empty lists, huge counts | Emil (`break-ui`) | Impeccable's `harden` covers errors, i18n and right-to-left |
| Variants of one piece of UI side by side | Emil (`prototype`) | none |
| Accessibility, right-to-left, the hard rules, UX copy | Impeccable (`audit`, `clarify`, `harden`) | none |

The hard rules are in the root [DESIGN.md](../../DESIGN.md) and in [PRODUCT.md](../../PRODUCT.md)'s Accessibility & Inclusion: WCAG 2.2 AA in both schemes, with a switch between them, 44-pixel controls on a touchscreen and 36 under a mouse, 14-pixel text, 360 pixels wide, right-to-left, self-hosted fonts that draw all of Sorani. They hold against every skill. When a skill's rule pulls against one, put the conflict to the owner rather than choosing.

Emil's `apple-design` is a reference for springs, gestures and materials inside Emil's lead, and `animation-vocabulary` names an effect. `pick-ui-library` applies only when a need falls outside shadcn/ui on Base UI, and the library is then the owner's choice. `animate-expo`, `write-swift` and `ask-sonner` apply only if Expo, Swift or Sonner join the stack.

Invoke `emil-design-eng` with a concrete question: invoked bare, it answers with one fixed greeting and nothing else.

## Where the ideas come from

The owner has no references or brand to hand over, so the skills supply the ideas and the owner judges them by eye.

1. **Deal directions with Taste's script**, never by picking one yourself: `node ~/.claude/skills/design-taste-frontend/scripts/draw.mjs --app --kind <kind> --brief "<one line>" --options 3` for working screens, or the page run in its `SKILL.md` for the Shopper app's public pages. Run it from the repository root.
2. **Find the subject's real world** with `scripts/assets.mjs`: for the Shopper app, pictures that stand for PCs (hardware, components and builds: boards, fans, memory, coolers, a built PC), never a place, since the platform will reach beyond Erbil (the owner, 5 November 2026). Take them from the open archives under licences that allow reuse, each with its credit, and drop any that shows a maker's name or logo large or a person who could be known. Dribbble and Behance are references to link and look at, never pictures to use. It needs the network and no keys.
3. **Show every option rendered** in the built-in browser before asking the owner to choose: a page served from the scratchpad, one option per anchor, two columns at most.
4. **Fill screens with realistic, obviously fictional data**: a made-up Vendor with a full set of Offers, prices and dates, never empty or placeholder screens (PRODUCT.md's Evidence on Hand says what must not be invented).
5. **Look at what was built** with `scripts/inspect.mjs --app <url> --widths 1440,768,390`, and fix what it fails. On the dashboard and on the Shopper app, run it through the project's own commands, below. Phones are inspected at 390 pixels, not 360: the inspector draws its 360-pixel window only 225 pixels tall, which makes its rules for the first screen meaningless on a phone, and the rule of 360 pixels, no page scrolling sideways, is measured by the end-to-end tests' `expectNoSidewaysScroll` in their 360-pixel window, as the owner decided on 7 November 2026 (browse's code review).

Taste writes its working files to `.taste-skill/` at the repository root, which Git ignores, and keeps its history of past draws in `~/.taste-skill/history.json` so that consecutive draws differ.

## The inspector on the dashboard

The dashboard's screens sit behind Keycloak's login, so Taste's inspector reaches them through `pnpm dashboard:inspect` (`apps/inspector`, the redesign's ticket 01), which logs in as the development Admin from `.env`, answers every call for Vendors and Offers from a made-up shop, refuses every write, and then runs `inspect.mjs` unchanged:

```bash
mkdir -p .taste-skill && cp apps/dashboard/design/taste/direction.json .taste-skill/direction.json
pnpm dashboard:inspect http://localhost:3002/catalog --scheme light --app --widths 1440,768,390 --out .taste-skill/<folder>
pnpm dashboard:inspect http://localhost:3002/vendors/00000000-0000-4000-8000-000000000001/portal --language ckb --scheme dark --app --widths 1440,768,390 --out .taste-skill/<folder>
```

The made-up shop also holds a Platform Rate, 1,575 dinars to the dollar; `--no-platform-rate` shows the Platform Rate screen as it is before the first rate is set.

It needs the services, the API (3001) and the dashboard (3002) running and the catalog imported. Every ticket that builds or changes a dashboard screen runs it on each screen it changed, in both schemes, the Vendor portal's in Kurdish and in English, before it closes: every FAIL fixed, every WARN fixed or defended in the ticket. The MVP spec's **The redesign's conventions** says the rest.

## The inspector on the Shopper app

The Shopper app reads the API on its server, where the inspector's Chrome cannot answer for it, so Taste's inspector reaches its pages through `pnpm shopper:inspect` (`apps/inspector`, `browse` ticket 06). It reads the made-up shop's real Parts from the catalog once, logged in at Keycloak as the development Admin from `.env`, then starts a **stand-in API** on port 3101 that answers the public endpoints the Shopper app reads (a Category's Visible Parts and its filters, a Visible Part and its Offers, a visible Vendor and its Offers, a Part's photo) from the made-up shop, and refuses every other request and every write, saying each one it refused. It starts a Shopper app of its own on port 3100 with `API_URL` set to the stand-in, leaving the owner's on port 3000 alone, runs `inspect.mjs` unchanged, and stops both when it ends. Nothing is read from or written to the development database's Vendors and Offers.

```bash
mkdir -p .taste-skill && cp apps/shopper/design/taste/direction.json .taste-skill/direction.json
pnpm shopper:inspect / --language ckb --scheme light --widths 1440,768,390 --out .taste-skill/<folder>
pnpm shopper:inspect /categories/gpu --language en --scheme dark --widths 1440,1280,1024,768,390 --out .taste-skill/<folder>
pnpm shopper:inspect /categories/cpu --language ckb --scheme light --currency USD --widths 1440,390 --out .taste-skill/<folder>
```

- **The sheet it reads.** Taste's inspector takes its rules' allowances, and whether a page is a working screen, from a sheet: `.taste-skill/direction.json` in the folder it runs from, the repository's root, or else the `direction.json` in the folder above its `--out`. The first it finds wins. So copy the Shopper's sheet to the root's `.taste-skill/` before `pnpm shopper:inspect`, as above, and the dashboard's back (`cp apps/dashboard/design/taste/direction.json .taste-skill/direction.json`) before the dashboard is inspected; the dashboard's sheet is an app's, and read for a Shopper page it would inspect the page as a working screen. Or, with no copy at the root, give `--out` a folder inside `apps/shopper/design/taste/`, whose `direction.json` is then the one read; Git does not ignore that folder, so its pictures must be kept out of every commit.
- **Phones at 390.** The inspector draws its 360-pixel window only 225 pixels tall (it has heights for 390 and 375, not 360), which makes its rules for the first screen meaningless on a phone. So phones are inspected at 390, and the rule of 360 pixels, no page scrolling sideways, is measured separately: by the end-to-end tests' `expectNoSidewaysScroll` in their 360-pixel window, on each page they open. The owner kept this on 7 November 2026, for the dashboard too (browse's code review).

- **The path** is the page's address without its language; `--language` gives the language (Kurdish when left out), and the address is `http://localhost:3100/<language><path>`, query and all. `--scheme` and the inspector's own options work as they do for the dashboard. `--currency IQD` or `--currency USD` shows every price in dinars or in dollars, as the frame's switch would: each tab holds the choice in the cookie the Shopper app keeps it in, `currency`, before it opens the page (follow-up ticket 06).
- **The made-up shop** (`made-up-vendors.ts`, `made-up-offers.ts`, `the-shoppers-shop.ts`) is 21 obviously fictional Vendors, named in Kurdish, Arabic and Latin script, most with every contact detail, "Pretend Tech" with only its phone number and "Imaginary Gaming Corner" with no Visible Offer, and their Offers of real Parts in all eight Categories: quoted in USD, in IQD and in both, in and out of stock, confirmed today to 13 days ago, with and without a warranty, every Shown Price fixed in both currencies at a Platform Rate of 1,575. Its Parts are real Parts of the catalog (ADR-0001), each read by its Category and exact name, as the spec has it: the 38 its Offers name, and 396 more GPUs (`made-up-gpus.ts`, browse's code review), spread across the Category, which with its own four make a Category of 400 Visible Parts. `pnpm catalog:import` reads the one commit of OpenDB the platform is pinned to (`@pcp/opendb`), so every import holds them; a name the catalog does not hold once, or a Part made on the platform, stops the command and says which, and in which file. Each holds the part numbers the catalog holds that are codes, one word, since OpenDB lists a Part's own name among the codes of some. No Vendor's name names a city: Erbil is in their city and addresses alone, the API's only city. Its worst cases, for `break-ui`: the catalog's two longest Part names (276 characters, with a made-up photo, and 210, without), one case as the only Part of its Category, 400 GPUs, an AMD Ryzen 7 7800X3D offered by 20 Vendors, and Vendor names in Arabic script beside Latin. The made-up photos are drawings made when the command starts, since no Part imported from OpenDB has a photo.
- **It is a stand-in for looking at pages**, and states as little of the API's rules as the shop's fixed data allows: it converts no price, since every price is fixed in both currencies, judges no visibility, since the shop holds only Visible Offers of active Vendors, and takes a Part's Lowest Price as the first of its Offers in stock, as the price slip does. Two rules it must still state, since no fixed data can carry them (browse's code review): OFF-11's order of Offers, a Part's and a Vendor's within each Category, and BRW-1's order of a Category's Parts by their Lowest Price, because every price is fixed in both currencies and the two orders can differ, as the AMD Ryzen 7 7800X3D's Offers do, so that no order written into the shop holds for both; and what a Part lacks of a specification, as `isMissingIn` has it, because the API labels a Part's specifications for a Visible Part alone, and the shop's Parts are not visible in the development database, so the stand-in labels the document the Admin's read of each gave, by each specification's `zeroMeansMissing` in the lists the API answers. No test of the platform relies on it. Its answers are typed by `@pcp/api-client`, so a change to the API's description the shop does not follow fails `pnpm check`. A filter the API adds is shown only once it is added to the stand-in's own list of filters in `stand-in-api.ts`.
- It needs the services, the API (3001, or `API_URL`) and the imported catalog for its one reading of the Parts at the start, and says plainly which is missing; the dashboard need not run. It says so when port 3100 or 3101 is taken, and stops only what it started. Next's files for its Shopper app are in `apps/shopper/tmp/inspection/`, with its log, `next-dev.log`. Without `--currency`, prices show in dinars, the Shopper's starting currency.

Every ticket that builds or changes a Shopper page runs it on each page it changed, in both schemes, in Kurdish and in English, at 1440, 768 and 390 pixels and at 1024 and 1280 for its desk layouts, with the Shopper's sheet in place, before it closes: every FAIL fixed, every WARN fixed or defended in the ticket. A ticket that changes how a page writes its prices also runs it in dollars, `--currency USD`, in Kurdish and in English at 1440 and 390 pixels, since prices in dollars are written otherwise, with cents and the dollar sign, and the Offers marked "≈" are then the ones quoted in dinars. Every Shopper page is inspected with Taste's rules for public pages, never `--app`, and the sheet allows five of them (`few-pictures`, `eyebrow`, `off-centre`, `palette-cream` and `still-page`), as the owner decided on 6 November 2026 (the fifth in browse ticket 09) and `apps/shopper/design/taste/held-rules.md` gives each its reason. Browse ticket 14's run from a fresh clone, in its Comments, is the reference for what each Shopper page's WARNs are and why.

## Reading what the inspector reports

Found while the `browse` tickets inspected the Shopper's pages; each holds for the dashboard's command too.

- **Every tab moves.** Both commands ask Chrome for full motion in every tab unless Taste itself asks for reduced motion (browse ticket 09): a Mac set to reduce motion had made every inspected page still, and `still-page` judged the stillness.
- **One picture of each kind.** The inspector keeps one desk, one tablet and one phone picture, whatever widths it is given, so the desk layouts at 1024 and 1280 pixels need captures of their own (browse ticket 10): a run at that width alone (`--widths 1024`) keeps its picture, as browse ticket 14 took them, or the built-in browser or a throwaway end-to-end line takes one.
- **`body-size` names no element.** It counts each run of text of 40 characters or more, so a page whose only long run is in the Small size, a sheet's closing line for one, reads as small body text (browse ticket 11). Look for the longest runs on the page.
- **A folded `<details>` is measured as if drawn.** `first-action` counts buttons inside a fold that the browser does not draw, and misses them where a stacked foot puts them below the first screen, so its reading on a page with a folded fold can be wrong either way (browse ticket 11). Read it against the photographs.
- **`name-only-title` reads one run of text at a time.** A line explains a name when one run of its words holds six words or 36 characters, so an element inside the explaining line, such as a city's own, splits it and hides it from the check (browse ticket 13). Write such a line as one run.
- **Node's fetch on a reset connection.** Both commands ask a read of the API again, twice at most, when its connection drops as it goes out, which fetch reports as `ECONNRESET` or, on macOS, as `setTypeOfService EINVAL` (`apps/inspector/src/asked-again.ts`): `pnpm shopper:inspect`'s reading of the catalog, and `pnpm dashboard:inspect`'s searches of the catalog and the two reads it makes for a tab, the list of Vendors and the shop's Vendor's search. Not asked again: the checks that the API and Keycloak answer, each the first request to its server; the inspection's Shopper app, already asked every half second until it answers; and the login's token, one `POST` that trades a code Keycloak takes once, which is not a read. Node 24.21.0's fetch (undici 7.29.1) can also throw that EINVAL, uncaught, from a socket's own event, as for a connection reset as it opens (browse's code review), where no retry reaches it. So both commands set a socket's type of service at best effort, ignoring the refusal where it is thrown, as undici's fix does (`apps/inspector/src/type-of-service.ts`, follow-up ticket 01). undici fixed it in [nodejs/undici#5547](https://github.com/nodejs/undici/pull/5547), released in 8.8.0 and, by its backport to undici 7 ([nodejs/undici#6075](https://github.com/nodejs/undici/issues/6075)), in 7.30.2 on 5 November 2026; Node 24.22.2 still bundles 7.30.1. Once Node's own undici holds the fix, the inspector's unit test of the patch fails, to say that the patch can go.

## Where the chosen directions are kept

- **The dashboard**: Framed sheet, chosen by the owner on 21 October 2026. The sheet as Taste dealt it is committed in [apps/dashboard/design/taste/](../../apps/dashboard/design/taste/) (`direction.json`, which the inspector's app rules read once restored into `.taste-skill/`, `sheet.md` and `held-rules.md`), since Git ignores `.taste-skill/`. What it became is [apps/dashboard/DESIGN.md](../../apps/dashboard/DESIGN.md) and [ADR-0011](../adr/0011-the-dashboards-look-is-framed-sheet.md). The renderings the owner chose from stay in the owner's `.taste-skill/redesign-05/`, and the redesign's record in `.scratch/redesign/`.
- **The Shopper app**: the printed price list, Taste's The page is the object (`page-is-the-object`, seed 2092360077), chosen by the owner on 6 November 2026 from three deals, with the seven tweaks and seven motions of its renderings kept. The sheet as Taste dealt it, with the brief that names no city, is committed in [apps/shopper/design/taste/](../../apps/shopper/design/taste/) (`direction.json`, which the inspector's rules for public pages read once copied into `.taste-skill/`, `sheet.md` and `held-rules.md`). What it became is [apps/shopper/DESIGN.md](../../apps/shopper/DESIGN.md) and [ADR-0013](../adr/0013-the-shopper-apps-look-is-the-printed-price-list.md). The renderings the owner chose from stay in the owner's `.taste-skill/browse-07/`, `browse-07-deal2/`, `browse-07-deal3/` and `browse-07-chosen/`, and the record in `.scratch/browse/`, tickets 07 and 08.

## Kept out on purpose

- **Anthropic's `frontend-design` plugin** is turned off in the user settings, `~/.claude/settings.json`, so it does not add a fourth voice on art direction. On another machine, turn it off the same way.
- **Taste's older and image skills** moved to [taste-skill-classics](https://github.com/Leonxlnx/taste-skill-classics) and [imagegen-skills](https://github.com/Leonxlnx/imagegen-skills) and are not installed: v2's own library replaces the classic styles, and the image skills need an image-generation tool this setup lacks.

## Updating

Run updates from a folder outside the repository: inside it, npm stops on the root `package.json`'s `devEngines` (EBADDEVENGINES).

- Taste and Emil: `npx skills update -g`.
- Impeccable: `npx impeccable update`, then follow its own notes.

Afterwards, check `~/.claude/settings.json` for hooks an update added, and remove them: the project already runs Impeccable's hook from its own settings.
