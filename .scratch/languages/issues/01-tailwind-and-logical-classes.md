# 01: Tailwind CSS in both frontends from one theme, and lint refuses a class that names a physical side

**Spec:** [the languages spec](../spec.md)

**What to build:** Both frontends are styled with Tailwind CSS 4 from one theme, a stylesheet in `ui` that each frontend's own stylesheet imports. Every class that has a side is written in its logical form, start and end, and lint refuses the physical form, left and right, in both frontends and in `ui`. A screen built later therefore cannot break right-to-left layout without anyone noticing.

This is the groundwork for the frames the later tickets build. It does no visual design: no colours, no typeface, no logo and no name. No font is downloaded, and pages use the device's own fonts.

This ticket holds two unknowns. The lint rule comes from `oxlint-tailwindcss`, which has to load as a second Oxlint plugin beside Nx's boundary plugin on the pinned Oxlint, and nobody has tried that. And the frontends take `ui` as source with no build step, so Tailwind CSS has to be told to read the classes used there.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Before anything is written, the current documentation of Tailwind CSS 4 is read for its set-up in a Next app and in a Vite app, for how it finds the classes used in source outside the app, and for its logical utilities. The documentation of `oxlint-tailwindcss` is read for the release that is installed, and Oxlint's for loading more than one plugin. The findings are recorded under Comments.
- [ ] Tailwind CSS 4 is set up in the Shopper app and in the dashboard. Each has a stylesheet of its own that imports the theme from `ui`.
- [ ] `ui` gains a second entry, for the theme's stylesheet. An import that reaches past either entry still fails, and the rule between the projects still passes.
- [ ] The theme sets only what a frame needs. It holds no colour scheme, no typeface and no logo, and no font is downloaded.
- [ ] Each placeholder page carries at least one class with a side, written in its logical form, and the class takes effect in the development server and in the built app.
- [ ] Tailwind CSS reads the classes used in `ui`. Shown once and then reverted: a class used only in a file of `ui` takes effect on a page of each frontend. How it is told is recorded.
- [ ] `oxlint-tailwindcss` is pinned exactly and loaded beside Nx's boundary plugin. Its `enforce-logical` rule is switched on for both frontends and for `ui`, and no other rule of it is.
- [ ] `pnpm boundaries:check` passes on every line with the second plugin loaded.
- [ ] Shown once and then reverted: a class with a physical side added to a file of the Shopper app, of the dashboard and of `ui` fails that project's lint, each on its own line, and its logical form passes.
- [ ] If the plugin cannot be loaded beside Nx's on the pinned Oxlint, that is recorded with what was tried. The rule is then left out, the convention is recorded as one that nothing checks, and the rest of this ticket is still done.
- [ ] A new package's install script is read before it is added to the list pnpm allows.
- [ ] shadcn/ui is not set up, and no component is added to `ui`.
- [ ] The two pages show what they showed before. `pnpm platform:check` passes on every line.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
