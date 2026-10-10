# 01: Tailwind CSS in both frontends from one theme, and lint refuses a class that names a physical side

**Spec:** [the languages spec](../spec.md)

**What to build:** Both frontends are styled with Tailwind CSS 4 from one theme, a stylesheet in `ui` that each frontend's own stylesheet imports. Every class that has a side is written in its logical form, start and end, and lint refuses the physical form, left and right, in both frontends and in `ui`. A screen built later therefore cannot break right-to-left layout without anyone noticing.

This is the groundwork for the frames the later tickets build. It does no visual design: no colours, no typeface, no logo and no name. No font is downloaded, and pages use the device's own fonts.

This ticket holds two unknowns. The lint rule comes from `oxlint-tailwindcss`, which has to load as a second Oxlint plugin beside Nx's boundary plugin on the pinned Oxlint, and nobody has tried that. And the frontends take `ui` as source with no build step, so Tailwind CSS has to be told to read the classes used there.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Before anything is written, the current documentation of Tailwind CSS 4 is read for its set-up in a Next app and in a Vite app, for how it finds the classes used in source outside the app, and for its logical utilities. The documentation of `oxlint-tailwindcss` is read for the release that is installed, and Oxlint's for loading more than one plugin. The findings are recorded under Comments.
- [x] Tailwind CSS 4 is set up in the Shopper app and in the dashboard. Each has a stylesheet of its own that imports the theme from `ui`.
- [x] `ui` gains a second entry, for the theme's stylesheet. An import that reaches past either entry still fails, and the rule between the projects still passes.
- [x] The theme sets only what a frame needs. It holds no colour scheme, no typeface and no logo, and no font is downloaded.
- [x] Each placeholder page carries at least one class with a side, written in its logical form, and the class takes effect in the development server and in the built app.
- [x] Tailwind CSS reads the classes used in `ui`. Shown once and then reverted: a class used only in a file of `ui` takes effect on a page of each frontend. How it is told is recorded.
- [x] `oxlint-tailwindcss` is pinned exactly and loaded beside Nx's boundary plugin. Its `enforce-logical` rule is switched on for both frontends and for `ui`, and no other rule of it is.
- [x] `pnpm boundaries:check` passes on every line with the second plugin loaded.
- [x] Shown once and then reverted: a class with a physical side added to a file of the Shopper app, of the dashboard and of `ui` fails that project's lint, each on its own line, and its logical form passes.
- [x] If the plugin cannot be loaded beside Nx's on the pinned Oxlint, that is recorded with what was tried. The rule is then left out, the convention is recorded as one that nothing checks, and the rest of this ticket is still done.
- [x] A new package's install script is read before it is added to the list pnpm allows.
- [x] shadcn/ui is not set up, and no component is added to `ui`.
- [x] The two pages show what they showed before. `pnpm platform:check` passes on every line.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 10 October 2026: completed

**What the documentation says,** read before anything was written:

- **Tailwind CSS 4.3 in a Next app.** Tailwind's guide installs `tailwindcss`, `@tailwindcss/postcss` and `postcss`, names the plugin in `postcss.config.mjs`, and imports Tailwind with one line, `@import "tailwindcss"`, in a global stylesheet. Next's own guide lists the first two packages only and imports the stylesheet in the root layout. Next 16 builds with Turbopack, which runs a PostCSS configuration file itself.
- **In a Vite app.** The packages are `tailwindcss` and `@tailwindcss/vite`. The plugin is added to the Vite configuration, and the same line imports Tailwind.
- **How it finds classes.** Tailwind reads source files as plain text and makes a class for every word in them that could be one. It starts at the working directory and leaves out what `.gitignore` names, `node_modules`, stylesheets and binary files. `@source` names one more path to read, relative to the stylesheet the line is in, and the documentation gives it as the way to read a library. A class has to be written out whole: one put together from pieces is not found.
- **Logical utilities.** `ps-*` and `pe-*`, `ms-*` and `me-*`, `border-s` and `border-e`, `rounded-s` and `rounded-e`, `text-start` and `text-end`, and `inset-s-*` and `inset-e-*` set the logical properties, "which map to either the left or right side based on the text direction". `px-*` and `mx-*` set both sides at once and so have no side.
- **Oxlint's JavaScript plugins.** `jsPlugins` is a list, so more than one plugin can be loaded. A plugin's name is resolved from the configuration file that names it, and its rules are written `<plugin>/<rule>`. The interface is in alpha. The page does not say whether a file reached through `extends` may name a plugin.
- **`oxlint-tailwindcss`.** Its rules are written `tailwindcss/<rule>`, and none is on until it is listed. It needs Oxlint 1.43 or later and Tailwind CSS 4.1.15 or later. It reads classes from the `className` and `class` attributes, from `cn()`, `clsx()`, `cva()` and helpers like them, and from variables named like `className`. Most of its rules need `settings.tailwindcss.entryPoint`, the stylesheet that imports Tailwind, and settings are not passed on through `extends`. `enforce-logical` is off by default and is one of the rules that work without the stylesheet. Its options are `direction`, which is `inline`, `block` or `both` and is `both` unless set, and `allowlist`.
- **Which release that describes.** The plugin's website describes its newest release. The README of the installed release differs from the newest one's by one paragraph, about a second entry for shared configurations. The rule itself was read in the installed build.

**The two unknowns, settled on the installed tools.**

- **The plugin loads beside Nx's.** On Oxlint 1.87.0, `oxlint-tailwindcss` loads as a second plugin, and it loads from a file that is reached through `extends`. Both plugins' rules run on the same files: `pnpm boundaries:check` passes on all 108 lines, and the Shopper app, the dashboard and `ui`, whose cases are among them, now load both plugins. The ticket's way out, leaving the rule unchecked, was not needed.
- **How Tailwind CSS is told to read `ui`.** By one line in the theme: `@source './'`. Its path is relative to the theme, so it names `ui`'s own source folder from wherever the theme is imported. Each frontend is built from its own folder, so Tailwind reads that app and nothing else: with the line removed, a class named only in `ui` was missing from both built stylesheets.

**What differs from the first plan, or is not obvious.**

- **The plugin is pinned at 1.14.0, and the spec's notes name 1.15.1.** Release 1.15.1 was three hours old when this was done, and 1.15.0 was 22 hours old. pnpm holds back a release younger than a day. It let the exact pin of 1.15.1 through only by writing an exception, `minimumReleaseAgeExclude`, into `pnpm-workspace.yaml`. That exception was not kept. 1.14.0 was thirteen days old and needs none. The owner may prefer 1.15: a day later it needs no exception either.
- **What 1.15 changes in the rule.** In 1.14.0 `enforce-logical` knows left and right only, and for `left-0` it names `start-0`. In 1.15 it also turns top and bottom into `mbs-*`, `pbs-*` and the like unless it is held to one direction, and it names `inset-s-0`, which is the name Tailwind 4.3's own documentation uses. `start-0` still works. A new screen writes `inset-s-*` and `inset-e-*`.
- **The rule is held to left and right.** It is switched on with `direction` set to `inline`. Top and bottom do not change with the direction of a language, and the spec's convention is start and end for left and right. In 1.14.0 the setting changes nothing. It is there so that an upgrade does not begin to refuse `mt-4`.
- **The rule is told nothing about the theme's stylesheet.** In the installed release it works from a table of its own, and no entry point is set. With one set it would also check that the logical class it names exists in the theme, and lint would then depend on stylesheets, which are not among the inputs of Nx's lint targets. The cost of leaving it out: a class that is not Tailwind's but begins like a physical one, such as `left-panel`, is refused. The rule's `allowlist` option is the way out when that happens.
- **The rule is stated once.** It is in `.oxlintrc.logical-classes.json` at the repository root, which the Shopper app, the dashboard and `ui` extend, as the API and `core` extend the rules for test files. Nx's plugin follows `extends`, so that file is an input of the three lint targets: after it was changed, the three ran again and were not answered from the cache. The API, `core` and the other libraries do not load the plugin.
- **`ui` has a lint configuration of its own.** It had none and took the root's. Its new one extends the root's and the rule's.
- **The theme is where Tailwind CSS is imported.** `libs/ui/src/theme.css` holds `@import 'tailwindcss'` and the `@source` line, and each frontend's stylesheet is one line that imports `@pcp/ui/theme.css`. A frontend therefore cannot take Tailwind without the theme.
- **The theme sets nothing yet.** It has no `@theme` block. Tailwind's default fonts are the device's own, and neither built stylesheet holds a `@font-face` rule or a `url()`. Tailwind's own default colours and sizes are there for a later screen to use. Choosing among them is that screen's design, and is not done here.
- **Where a frontend's stylesheet lives.** In the App layer, in a `styles` segment: `src/_app/styles/global.css` in the Shopper app, which the root layout imports, and `src/app/styles/global.css` in the dashboard, which the entry file imports. Next's routing folder still only routes.
- **`ui`'s second entry.** `@pcp/ui/theme.css` is a line in the `exports` of `ui`'s manifest. Tailwind resolves a stylesheet import through `exports`, so an import past the entry fails the build of either frontend.
- **Which manifest lists what.** `ui` lists `tailwindcss`, because its stylesheet imports it. The two build plugins, `@tailwindcss/postcss` and `@tailwindcss/vite`, are listed at the root only, as Vite's React plugin is. `postcss` is not listed anywhere, although Tailwind's guide installs it: `@tailwindcss/postcss` 4.3.3 depends on it itself, Next runs the plugin with the PostCSS it brings, and Next's guide leaves it out.
- **TypeScript 6 refuses the Shopper app's stylesheet import.** It refuses an import for its side effect when it cannot find what is imported. Vite's types declare a stylesheet, so the dashboard was unaffected. The installed Next, 16.1.7, declares CSS modules only, and Next 16.4.0 declares a plain stylesheet as well. The Shopper app has a declaration of its own until Next is upgraded, and the file says so. Ticket 02 settles whether Next is upgraded.
- **Tailwind's base styles change how the placeholder pages look.** They show the same text. Tailwind removes the browser's own margins and its look of a button, and sets the device's own sans-serif font. Each page is now inside a `main` element with a margin, and its text is set in from the start side with `ps-4`. The dashboard's two buttons carry a plain border so that they still look like buttons, and the space between them is a second class with a side, `me-2`. Nothing sets a direction yet, so the start side is the left on both pages until tickets 02 and 06.
- **No install script.** Tailwind CSS added 31 packages to the lockfile, most of them builds for other machines, and the plugin one more. pnpm stops an install at a script the workspace file does not list, and it did not stop. The manifests of the installed ones were read as well, and none has an install script. `pnpm-workspace.yaml` is unchanged.
- **Tailwind makes a class for an ordinary word.** The dashboard's built stylesheet holds `.hidden`, `.fixed` and `.block`, which nobody wrote as classes: the words are in comments. It costs a few bytes.

**What the rule sees and what it does not,** found by planting classes in a file of the dashboard:

- It refuses `pl-*`, `pr-*`, `ml-*`, `mr-*`, `left-*`, `right-*`, `border-l`, `border-r`, `rounded-l`, `rounded-r` and the four corners, `text-left`, `text-right`, `float-left`, `float-right`, `clear-left`, `clear-right` and the scroll margins and paddings. It does so behind a variant such as `md:` or `hover:`, with a minus sign, with a value in brackets and with `!`. A physical class behind `rtl:` or `ltr:` is refused too.
- It reads the `className` and `class` attributes, with a plain string, a condition or `&&` in them, the arguments of `cn()` and `clsx()`, and a variable named `className` or `classes`.
- It does not read a class inside the `${}` of a template string, in a list that is joined, in the first half of two strings joined with `+`, in the arguments of a helper it does not know, or in a variable under another name. It does not read a stylesheet either: a physical class after `@apply`, or a property such as `padding-left` written by hand, passes. A class is therefore written where the rule reads it. The width test that ticket 02 writes is what is left for the rest.
- It passes `mt-4`, `top-0`, `border-t`, `px-4`, `mx-auto` and every logical class.

**Fault checks,** each reverted:

| Fault | What happened |
|---|---|
| A class named only in a file of `ui`, `pe-[7px]`, put on both pages through an export of `ui` | In Chromium the page had 7 pixels of padding on its end side in both frontends, in the development servers and in the built apps. |
| The same, with the `@source` line taken out of the theme | Neither built stylesheet held the class. In the Shopper app's development server, and in a dashboard development server started afresh, the padding was 0. A dashboard development server that was already running kept the class until it was restarted. |
| A physical class in each of the three: `pl-4` on the Shopper app's page and on the dashboard's, and `ml-4 text-left` in a new file of `ui` | Before the rule existed, the three lint targets passed. With the rule, `@pcp/ui:lint`, `@pcp/shopper:lint` and `@pcp/dashboard:lint` each failed and named the class and its logical form, and `pnpm check` exited with 1 and listed the three as failed tasks. |
| The same three places in logical form: `ps-4`, and `ms-4 text-start` | The three lint targets passed. |
| A TypeScript import past `ui`'s entry, `@pcp/ui/src/index`, in each frontend | Type-checking failed in both with "Cannot find module". |
| A stylesheet import past `ui`'s second entry, `@pcp/ui/src/theme.css`, in each frontend | Both builds failed with "./src/theme.css is not exported". |

**The classes take effect.** Before the set-up, neither page had a `main` element, and both were in Times with the browser's 8-pixel margin. With it, Chromium reports a start-side padding of 16 pixels on both pages and an end-side margin of 8 pixels on the dashboard's first button, under `nx serve` and in the built apps, which were served with `nx start @pcp/shopper` and `nx preview @pcp/dashboard`.

**What the code review found and changed.**

- **A bar that was decoration.** The first version marked each placeholder page with a thick bar on its start side. This ticket does no visual design, and the bar is gone. The start-side padding stayed.
- **The build plugins were listed twice.** Each frontend's manifest listed `tailwindcss` and its build plugin beside the root's. Neither frontend imports `tailwindcss`, and Vite's React plugin is listed at the root only. The two manifests are as they were before this ticket.
- **Two declarations that match equally.** The Shopper app's declaration of a plain stylesheet also matches a CSS module, which Next declares, and TypeScript takes the first of two that match equally. Which came first depended on the order the compiler read the files in. The file now names Next's declarations first. A CSS module imported for a moment was still typed as Next declares it.
- **Left as it is.** The two placeholder pages hold the same comment and nearly the same classes, and the two stylesheets the same line. The spec asks for a stylesheet in each frontend, and both pages are replaced by the first real ones.

**The checks.** `pnpm check --skip-nx-cache` passed for all nine projects, 23 tasks, with Docker made unreachable for the command, by pointing it at a closed port, and with Playwright pointed at a folder that holds no browser. Docker itself was not stopped, because the services were needed for the last check. It took 5.5 seconds, and 5.8 before this ticket. `pnpm boundaries:check` passed on all 108 lines. `pnpm platform:check` passed on all seven and left no app running. `pnpm check` passed before each of the three commits that change code.

**Worth knowing.**

- **An upgrade of the plugin is followed by lint with the cache skipped.** The inputs of Nx's lint targets name Oxlint among the packages and not this plugin, so a lint result cached under 1.14.0 would be reused under a newer release. The same has always held for Nx's own plugin. After an upgrade, a physical class is planted once more to see the rule refuse it.
- **Nothing proves the rule again on demand.** `pnpm boundaries:check` proves the import rules after every upgrade. The class rule was shown once, as this ticket asks. A case for it in that command would be the way to prove it again, and is not built.
- **Nx's cache does not follow an upgrade of Tailwind CSS either.** Each frontend's build names only its bundler among the packages it depends on. After an upgrade, `pnpm check --skip-nx-cache` and `pnpm platform:check` are run, as the spec already says for the second.
