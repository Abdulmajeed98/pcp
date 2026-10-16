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

**Status:** resolved

- [x] Before anything is written, React Hook Form's documentation is read for the release that will be installed: forms whose fields are not known in advance, lists of rows, and errors set from a server's answer. The findings are recorded under Comments.
- [x] React Hook Form is added, as the current stable release.
- [x] A Part's page has an address of its own. A Part that does not exist gets a plain "not found" message.
- [x] The page shows each specification by its kind: a list of rows as a small table, yes or no in words, numbers with their units. A missing specification shows as missing, and a missing needed one is marked.
- [x] The new Part's form asks for the Category first, and then builds its fields from that Category's specification list, read from the API and never copied into the dashboard.
- [x] A fixed set is offered as a choice, and nothing outside it can be entered. Part numbers can be added and removed. Lists of rows can be added to and removed from.
- [x] A refusal from the API is shown beside the field it names. Success opens the new Part's page.
- [x] The screens follow `apps/dashboard/DESIGN.md` and the root DESIGN.md, in light and in dark, are laid out at 360 pixels wide first, use logical classes only, and keep to Feature-Sliced Design's import rules.
- [x] `pnpm platform:check` gains these lines, and passes on every line, as the development Admin in a window 360 pixels wide:
  - The Admin creates a Part through the form, with a name unique to the run and some needed specifications left out, and arrives at its page.
  - The page marks the needed specifications that were left out.
  - In the form, a value outside a fixed set cannot be chosen, and a word typed where a number belongs is refused beside its field.
  - Neither screen scrolls sideways, and the accessibility helper passes on both, in light and in dark.
- [x] Shown once and then reverted, each failing on its own line: the mark on a missing needed specification taken off; the refusal shown at the top of the form instead of beside its field.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 16 October 2026: settled before anything was written

**React Hook Form 7.90.0**, from its documentation of `register`, `useFieldArray` and `setError`.

- **Fields not known in advance.** `register` takes any name, and a name with dots nests its value: `specifications.cores.total` gives `{ specifications: { cores: { total } } }`. Each specification is registered under `specifications.` and its path, so the form's values are already in OpenDB's field names and nesting, and a refusal's `field`, such as `specifications.cores.total`, is the name of the field it is about.
- **Lists.** `useFieldArray` keeps a list's rows, and its rules bind the form:
  - each entry must be an object, never a bare string, so part numbers and a list of text are held as `{ value }` and unwrapped when the form is sent;
  - the key of each rendered row is the `id` the hook gives it, never its index;
  - two actions are not run one after the other in one handler;
  - `shouldUnregister: true` is not supported.
- **Errors from the API.** `setError(name, { type, message }, { shouldFocus })` puts an error on a field, where the form shows it beside the field, and `root.` names an error that belongs to no field. An error set this way is cleared when its field is validated again. The API names the first specification it refuses, as the owner decided on 15 October 2026, so the form shows that one.
- **Inputs give text.** A number is typed into a text field with a numeric keyboard, not a number field, so that a word typed where a number belongs reaches the API and is refused beside the field, by the same specification list the API keeps. A number field would stop the word before anyone saw why.

**How the form is laid out.**

- The Category is chosen first, on a screen of its own at `/catalog/new`, and the form for it is at `/catalog/new/<category>`. Choosing again means going back, so a form never holds another Category's values.
- An empty field is a missing specification. A yes-or-no specification is a choice of "Not known", "Yes" and "No", so that "not known" can be said.
- A list of rows, such as a motherboard's M.2 slots, can be not known, known to be empty, or a list of rows. OpenDB keeps an empty list as a value: a board with no M.2 slot has none, and a Compatibility Rule treats that otherwise than a list nobody knows. The form keeps the three apart, so that saving a Part never turns "none" into "not known".

### 16 October 2026: completed

**For the owner to know.**

- **A Part's page** is at `/catalog/parts/<id>`, and every row of the Catalog opens one. The whole row is the link, while the link's name is the Part's alone, so that a screen reader does not read the row twice. The count of missing needed specifications is the screen's one plate, and each missing needed specification says "Needed, not known" in Action Red, with a mark, because it is something the Admin has to do.
- **A new Part** starts from New Part on the Catalog, and from the Catalog's "No Part found", which offers to create one. The Category is chosen on its own screen, `/catalog/new`, with the eight Categories' icons, and the form for it is at `/catalog/new/<category>`.
- **The form sends numbers as typed when they are not numbers.** "six" in Cores reaches the API, which refuses it by the same specification list it keeps, and the form puts the refusal beside Cores, as its description, and focuses it. Name and manufacturer are checked in the form as well, because an empty one needs no API to say so.
- **A list of rows can be not known, known to be empty, or rows**, as the first comment explains. It starts not known, Add a row makes it known, removing the last row leaves it known and empty ("None."), and Not known makes it not known again.
- **On a wider screen the form puts two fields to a row**, and a list or a set of boxes to tick takes a whole row. The inspection round found every field stretched across 1,000 pixels at a desk.
- **The form is the feature `part-form`**, so that ticket 13's edit uses the same one. The Part's picture, the specification document's paths and the Part's query are in a new Entities slice, `part`, and a specification's label with its unit moved to the `category` slice, which both the form and the page read.
- **Two more of shadcn/ui's components**, `field` and `table`, came with the command. It rewrote the `label` and `separator` already adapted, which were restored from Git. Its checkbox was not added: a native checkbox inside its label gives a row 44 pixels high and needs no lint exception.

**The planted faults,** each made by one exact edit on a clean tree, run against `src/admin-part.spec.ts`, and undone by the inverse edit:

| Fault | The line that failed | The others |
|---|---|---|
| The mark on a missing needed specification replaced by a plain "Not known" | The Admin creates it with needed specifications left out, and arrives at its page, which marks them | 6 passed |
| Every refusal shown above the form instead of beside its field | A word typed where a number belongs is refused beside its field | 6 passed |

**The checks.**

- `pnpm platform:check` passed all 65 tests, the 7 of this ticket among them.
- `pnpm check --skip-nx-cache` passed with `DOCKER_HOST` pointed at a socket that does not exist.
- `pnpm boundaries:check` passed, after the dashboard gained its Features layer's first folder.
- The Part's page, the choice of Category and the form were captured at 360 and 1440 pixels wide, in light and in dark, for an imported CPU and an imported motherboard with three lists of rows. The first round found the specification lists' add buttons reading "Add a cpu power connectors", and the form's fields stretched across a desk's screen. Both were corrected, and the second round showed them right.

**The commits,** each leaving `pnpm check` passing:

- the reading, before anything was written;
- React Hook Form;
- the `field` and `table` components;
- the end-to-end tests, written first;
- the Part's page and the form.
