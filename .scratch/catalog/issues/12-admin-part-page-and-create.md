# 12: Admin console: a Part's page and creating a Part

**Spec:** [the catalog spec](../spec.md)

**What to build:** The Admin opens a Part from the Catalog. The page shows everything the platform holds about it:

- its Category's icon, name, manufacturer and part numbers;
- every specification under its English label with its unit;
- the needed specifications that are missing, marked;
- whether the Part came from OpenDB or was created by the Admin.

The Admin creates a Part that OpenDB lacks. The Category is chosen first, and then a form built from that Category's specification list asks for its specifications. The kind of each specification sets its control, fixed sets are offered as choices, and needed specifications are marked. A Part can be saved with specifications still missing. A refusal from the API is shown beside the field it names.

React Hook Form arrives here, as the owner chose on 14 October 2026.

**Blocked by:** 04, 11

**Status:** ready-for-agent

- [ ] Before anything is written, React Hook Form's documentation is read for the release that will be installed: forms whose fields are not known in advance, lists of rows, and errors set from a server's answer. The findings are recorded under Comments.
- [ ] React Hook Form is added, as the current stable release.
- [ ] A Part's page has an address of its own. A Part that does not exist gets a plain "not found" message.
- [ ] The page shows each specification by its kind: a list of rows as a small table, yes or no in words, numbers with their units. A missing specification shows as missing, and a missing needed one is marked.
- [ ] The new Part's form asks for the Category first, and then builds its fields from that Category's specification list, read from the API and never copied into the dashboard.
- [ ] A fixed set is offered as a choice, and nothing outside it can be entered. Part numbers can be added and removed. Lists of rows can be added to and removed from.
- [ ] A refusal from the API is shown beside the field it names. Success opens the new Part's page.
- [ ] The screens follow `apps/dashboard/DESIGN.md` and the root DESIGN.md, in light and in dark, are laid out at 360 pixels wide first, use logical classes only, and keep to Feature-Sliced Design's import rules.
- [ ] `pnpm platform:check` gains these lines, and passes on every line, as the development Admin in a window 360 pixels wide:
  - The Admin creates a Part through the form, with a name unique to the run and some needed specifications left out, and arrives at its page.
  - The page marks the needed specifications that were left out.
  - In the form, a value outside a fixed set cannot be chosen, and a word typed where a number belongs is refused beside its field.
  - Neither screen scrolls sideways, and the accessibility helper passes on both, in light and in dark.
- [ ] Shown once and then reverted, each failing on its own line: the mark on a missing needed specification taken off; the refusal shown at the top of the form instead of beside its field.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
