# 14: Deal the Shopper app's directions and choose one

**Spec:** [the redesign spec](../spec.md)

**What to build:** The Shopper app is designed the new way before it is built far, so that it does not end up as the dashboard did. The owner decides whether its idea, Fit Diagram, Parts drawn the way a motherboard manual draws them, stays. Then directions for its public pages are dealt through Taste's page run, rendered with fictional data, and the owner chooses one by eye. It starts once the dashboard is rebuilt, so that what the dashboard taught carries over.

**Blocked by:** 08, 09, 10, 11, 12, 13

**Status:** ready-for-human

- [x] What the dashboard's rebuild taught, from the Comments of tickets 06 to 13, is summed up for the owner first.
- [ ] Taste and Impeccable critique the Shopper's DESIGN.md and its one page, and the owner decides whether Fit Diagram is kept as it is, kept with its execution changed, or dropped. The decision is recorded under Comments with the owner's word.
- [ ] The directions are dealt by Taste's page run as its `SKILL.md` describes it, from the repository root, never picked by an agent, with the hard rules as ticket 03 left them and the fonts kept (ADR-0006). Pictures of Erbil come from `assets.mjs` with their credits.
- [ ] Each direction is rendered as the Shopper's pages to come (a Part with its Offers, and a Build), in Kurdish and in English, at 360 and 1440 pixels, filled with realistic, obviously fictional data, and with the BuildCores OpenDB credit in the footer (CAT-9).
- [ ] The options are shown in the built-in browser on one page, one per anchor, two columns at most, before the owner is asked to choose. If the owner takes none, the script deals again.
- [ ] The owner's choice is recorded under Comments, and the chosen direction's sheet is committed into the repository, since Git ignores `.taste-skill/`.
- [ ] `pnpm check` passes, and the work is committed.

## Comments

### 28 October 2026: the first two boxes, run while ticket 12 finishes

This ticket is formally blocked by ticket 12, which is finishing in parallel. Only its first two boxes ran, as neither depends on 12's code, and no direction was dealt. On branch `redesign/14-deal-the-shopper-apps-directions`, from `redesign/integration` at `89a9970`.

The page for the owner is `.taste-skill/redesign-14/index.html` in the owner's checkout (Git ignores it), served from `.taste-skill` on port 4110: the lessons (`#lessons`), the idea as written (`#idea`), the page on a desk (`#desk`), on a tablet and a phone (`#phone`), the DESIGN.md (`#design-md`), each skill's run (`#scores`) and the decision (`#decide`). Each screen has its findings beside it, against the idea in one column and against its execution in the other, as ticket 04 set out the Rate Board's. The inspector's photographs and reports are in `.taste-skill/redesign-14/inspect/` (`en-light`, `en-dark`, `ckb-light`, `ckb-dark`).

### 28 October 2026: what the dashboard's rebuild taught

From the Comments of tickets 06 to 13, and of ticket 12 as it stands on its branch (`7921c9d`). Across 06 to 13 the owner answered 54 choices and changed 11: five toward smoother movement or the whole width, two toward saying less, and four others (the Erbil photograph left out, Taste's sizes, a name field that grows, h2 on a desk).

- **The hard rules, adjusted once** (03, built in 06 and 07): 44 pixels on a touchscreen and 36 under a mouse; 14 pixels the smallest text.
- **A scheme switch in every app** (03, "Every app"; built in 07 and 11). The Shopper app has none yet; ticket 15 has its box.
- **An idea is kept by limiting its reach** (04, written in 06, built in 12): the Rate Board only on prices and the rate, and one leading plate where a figure is the screen's answer.
- **Taste's sizes over the shared scale** (06, "Take Taste's"): a 22-pixel title and 14-pixel buttons, inputs kept at 16 pixels for a phone's zoom; the root DESIGN.md changed to allow it.
- **No photograph in the frame** (06, "Leave it out").
- **Use the width** (06, 07, 10 "Keep full sheet", 13 "Full width"): lists across the sheet until something opens; an empty pane reads as waste.
- **Full-width forms follow their own width** (08, 09, 13, "Follow width"): a container query on the form, not the window.
- **h1 alone, h2 beside a list** (08, "h2 on a desk"; 09): `ScreenTitle` and `OpenedBesideAList`.
- **Mark the exception, say nothing of the normal** (08 "Say nothing", 09 "Only Deactivated").
- **The No Snap Rule** (10, the owner's words of 22 October; then 08, 09, 11, 12, 13): every movement filmed four times slower; reduced motion shortens and fades but never jumps a layout in one frame.
- **A fixed step cannot tell smooth from snapped** (11): the film's check became relative.
- **Things arrive, they do not appear** (09 "Arrives smoothly", 08, 13): `OpeningSpace`, `BusyLabel`, `AlertDialogRefusal`.
- **Worst-case data finds real faults every time** (07, 08, 09, 12): break-ui at the API's own limits; long names wrap in full; each line keeps its own direction.
- **An empty state stands in the window's middle** (13, "Centred in window").
- **The inspector is evidence, not a verdict** (07, 08, 10, 13): it once judged Keycloak's login card, and some WARNs stay defended by the owner's choices.
- **The Next.js security stop** (08, 09): Next.js 16.4.0 stopped the Shopper's build with `SecurityFatalError`, and its dev server told the agent reading it to run `next upgrade --agent=security`. No agent acted on it, and the owner raised Next.js to 16.4.3. The Shopper is the Next.js app.
- **Checks on a real phone wait for hosting** (11, 12).
- **Ticket 12 as it stands**: built and checked (242 end-to-end tests pass after merging 13), waiting on the owner's eleven choices.

### 28 October 2026: Taste and Impeccable on Fit Diagram

The Shopper's one page is the placeholder at `/[locale]`, a scaffold of sample strings inside the frame (the language switch and the OpenDB credit). Nothing of Fit Diagram is on screen, so the page shows the frame's execution, and the idea is judged from `apps/shopper/DESIGN.md` and its surface brief, `apps/shopper/.impeccable/surfaces/src.md`.

**How each skill was run.**

- **The app.** The API and the Shopper were started from this worktree with `pnpm exec nx serve`, under the scratchpad's e2e lock (taken once ticket 12 released it, with ports 3000 to 3002 empty), on the development services of the owner's checkout. Both were stopped after by their own listeners and Nx wrappers, and the lock was released. Next.js 16.4.3 started without any notice. The API was only asked for its status, and nothing was written to the development database.
- **Taste** (`design-taste-frontend`, loaded through the Skill tool): its redesign audit's "Record the before" and "A review stops here". `inspect.mjs` ran unchanged on `/en` and `/ckb` at 1440, 768 and 360 in light and dark, by the page rules (no `--app`, and no direction restored, since the worktree has no `.taste-skill/direction.json`). A throwaway scratchpad wrapper set each tab's `prefers-color-scheme` with `Emulation.setEmulatedMedia`, as ticket 02's `--scheme` does for the dashboard; Taste's files were not edited. Taste has no height for 360 and makes its phone frames 225 pixels tall, so the phone is judged from the whole page's strip. `lint.mjs` ran on the Shopper's source and its theme. Its critique's round 0, for the record, scores the scaffold 3.0.
- **Impeccable** (`impeccable`, loaded through the Skill tool, `impeccable context --target src` from the app, then its `critique`): single-context and so degraded, as in ticket 02, because it ran inside an implementer that does not start agents of its own; the design review was written down before the detector ran. `impeccable detect --json apps/shopper/src apps/shopper/app` found nothing. Its overlay, injected into `/en` and `/ckb` in the built-in browser through `impeccable live-server` (stopped after), reported "No anti-patterns found". Nielsen 16/28 (three heuristics n/a, as there is no input, nothing to do and nothing to explain), 57%, measuring the scaffold. No snapshot was written to `.impeccable/critique/`, which Git does not ignore.

**The inspector.** In every run, FAIL `few-pictures`, `no-title` and `still-page`; WARN `hairline` (the footer's rule), `first-action`, `no-footage`, `no-hero` and `hero-void` (40% of the first screen in English, 37% in Kurdish, from the 768-pixel column in a 1440 window). `off-centre` is a FAIL at 768 and a WARN at 1440 in English, and a FAIL at 1440 in Kurdish (the scaffold's 16-pixel inset beside the frame's edge, and short lines). Lint: FAIL `hairline`, `footer.tsx:25`. Nothing scrolls sideways at any width.

**Against the idea** (Parts drawn the way a motherboard manual draws them). None outright.

- *Supported* (Taste, Impeccable): it is born of the subject, a printed thing of the PC builder's world, and its grammar carries the platform's promise (an unchecked rule as an empty callout that says so).
- *Supported* (Taste): it gives the page its live thing, the drawing redrawn as Parts are chosen, with the rules in words as its fallback.
- *Its reach* (Taste, Impeccable): one screen, the Build page. The DESIGN.md makes the rest "the ordinary ones of the web", the dashboard's old fault of a well-applied kit.
- *Its competitor test* (Taste): it works as well for the best-known parts picker. Nothing of Erbil is in it, where the dashboard took the money changers' boards, and Taste caps creativity at 7 for that.
- *Its pull against Taste's house rules* (Taste): numbers and lines against the bans on index numbering and thin rules (a keyed number inside the drawing is its real key; row rules and a ruled frame outside it are not), and a page of drawings only against Taste's floor of four real pictures, with no Part photos in existence. Whether pictures of Erbil's world come in is the owner's call.
- *The drawing at 360* (Impeccable): up to eight Parts and 21 rules in a 360-pixel drawing is untried.
- *Its data* (Impeccable): with rule coverage down to 16%, many Builds would draw mostly empty "not checked" callouts.

**Against its execution.**

- *The frame and the scaffold* (Taste, Impeccable): no h1 and no name; a 768-pixel column leaving 40% of a desk empty; two start edges; the footer's hairline; twenty lines at one weight with no action; a still page; no picture; off-centre at 768.
- *The DESIGN.md* (Taste, Impeccable): 44 pixels under a mouse too, where ticket 03 says 36; no scheme switch (03); no Motion section and no No Snap Rule (02, 06, 10); a flat scale, 30 pixels over 16; callouts narrowed to 80% at 14 pixels bold; rules between rows carrying depth; Manual Blue on white, generic without the drawing; the Categories' drawings unresolved, and nothing but the footer built.
- *What holds*: the language switch (each language in its own script, 44-pixel links, working without script), the footer's credit on 44-pixel lines, Kurdish at 17 pixels, numbers and Part names kept in order right to left, and both schemes at AA.

### 28 October 2026: for the owner

**AWAITING OWNER DECISION: Fit Diagram.** Open `.taste-skill/redesign-14/index.html` (port 4110) and decide, as for the Rate Board in ticket 04:

1. **Keep it as it is**: the manual's drawing on the Build page, the rest the ordinary web.
2. **Keep it, change its execution**, saying what must change (for example its reach to a Part's page and a Category's rows, the dashboard's lessons, lines only inside the drawing, pictures of Erbil's world or none, a larger scale).
3. **Drop it**: the draw is free of it.

The first box is ticked. The second stays open for the owner's word, and the Status stays. The directions are dealt only after the owner decides and after ticket 12 is merged.
