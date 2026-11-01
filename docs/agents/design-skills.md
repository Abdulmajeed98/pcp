# Design skills

Three families of design skills are installed at user level, and each **leads** the area it knows best. Read this before any design work on `apps/dashboard` or `apps/shopper`: designing, redesigning, critiquing, polishing, typography, colour, layout, motion or how a screen feels on a phone.

- **Impeccable** (`impeccable`), with this project's hook in `.claude/settings.local.json`.
- **Taste** (`design-taste-frontend`, tasteskill v2), from [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill).
- **Emil Kowalski's skills** (`emil-design-eng` and fourteen more), from [emilkowalski/skills](https://github.com/emilkowalski/skills).

The owner chose this set on 21 October 2026 because the dashboard, built with Impeccable alone, read as cold, rigid and templated.

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
2. **Find the subject's real world** with `scripts/assets.mjs`: Erbil's bazaar, its money changers' boards, shop signs and lettering, from open archives with their credits. It needs the network and no keys.
3. **Show every option rendered** in the built-in browser before asking the owner to choose: a page served from the scratchpad, one option per anchor, two columns at most.
4. **Fill screens with realistic, obviously fictional data**: a made-up Vendor with a full set of Offers, prices and dates, never empty or placeholder screens (PRODUCT.md's Evidence on Hand says what must not be invented).
5. **Look at what was built** with `scripts/inspect.mjs --app <url> --widths 1440,768,360`, and fix what it fails. On the dashboard, run it through the project's own command, below.

Taste writes its working files to `.taste-skill/` at the repository root, which Git ignores, and keeps its history of past draws in `~/.taste-skill/history.json` so that consecutive draws differ.

## The inspector on the dashboard

The dashboard's screens sit behind Keycloak's login, so Taste's inspector reaches them through `pnpm dashboard:inspect` (`apps/inspector`, the redesign's ticket 01), which logs in as the development Admin from `.env`, answers every call for Vendors and Offers from a made-up shop, refuses every write, and then runs `inspect.mjs` unchanged:

```bash
mkdir -p .taste-skill && cp apps/dashboard/design/taste/direction.json .taste-skill/direction.json
pnpm dashboard:inspect http://localhost:3002/catalog --scheme light --app --widths 1440,768,360 --out .taste-skill/<folder>
pnpm dashboard:inspect http://localhost:3002/vendors/00000000-0000-4000-8000-000000000001/portal --language ckb --scheme dark --app --widths 1440,768,360 --out .taste-skill/<folder>
```

It needs the services, the API (3001) and the dashboard (3002) running and the catalog imported. Every ticket that builds or changes a dashboard screen runs it on each screen it changed, in both schemes, the Vendor portal's in Kurdish and in English, before it closes: every FAIL fixed, every WARN fixed or defended in the ticket. The MVP spec's **The redesign's conventions** says the rest.

## Where the chosen directions are kept

- **The dashboard**: Framed sheet, chosen by the owner on 21 October 2026. The sheet as Taste dealt it is committed in [apps/dashboard/design/taste/](../../apps/dashboard/design/taste/) (`direction.json`, which the inspector's app rules read once restored into `.taste-skill/`, `sheet.md` and `held-rules.md`), since Git ignores `.taste-skill/`. What it became is [apps/dashboard/DESIGN.md](../../apps/dashboard/DESIGN.md) and [ADR-0011](../adr/0011-the-dashboards-look-is-framed-sheet.md). The renderings the owner chose from stay in the owner's `.taste-skill/redesign-05/`, and the redesign's record in `.scratch/redesign/`.
- **The Shopper app**: none yet. Its design is planned fresh, unique to it, as the first work of the `browse` module, the same way: its direction dealt by Taste, chosen by the owner by eye, and its sheet committed in the repository as the dashboard's is.

## Kept out on purpose

- **Anthropic's `frontend-design` plugin** is turned off in the user settings, `~/.claude/settings.json`, so it does not add a fourth voice on art direction. On another machine, turn it off the same way.
- **Taste's older and image skills** moved to [taste-skill-classics](https://github.com/Leonxlnx/taste-skill-classics) and [imagegen-skills](https://github.com/Leonxlnx/imagegen-skills) and are not installed: v2's own library replaces the classic styles, and the image skills need an image-generation tool this setup lacks.

## Updating

Run updates from a folder outside the repository: inside it, npm stops on the root `package.json`'s `devEngines` (EBADDEVENGINES).

- Taste and Emil: `npx skills update -g`.
- Impeccable: `npx impeccable update`, then follow its own notes.

Afterwards, check `~/.claude/settings.json` for hooks an update added, and remove them: the project already runs Impeccable's hook from its own settings.
