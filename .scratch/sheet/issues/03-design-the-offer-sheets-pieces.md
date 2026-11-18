# 03: Design the Offer sheet's pieces in the Vendor portal

**Spec:** [the sheet spec](../spec.md)

**What to build:** The Offer sheet brings pieces to the Vendor portal that the dashboard's DESIGN.md does not describe yet. They are designed inside Framed sheet (ADR-0011), with no new direction dealt:

- the Offer sheet screen, with its download, its file field and its upload;
- the way to it from the Offers screen;
- the upload's result, with its counts, its added Offers, its rows applied by the tie-break and its four kinds of skipped row;
- the Part Request form started from a skipped row.

First, the inspector's made-up shop learns to answer an upload, so that every option is shown with realistic, obviously fictional data. The owner then sees the options rendered and chooses by eye, and Impeccable records the choices. No screen is built here; ticket 04 builds it to this ticket's record. Read [the design skills guide](../../../docs/agents/design-skills.md) before starting, as CLAUDE.md asks.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] **The made-up result.** The dashboard's made-up shop answers an upload with a made-up result and writes nothing, as for every other call. It is typed against `api-client`, with the inspector's tests of it. Its result holds:
  - added Offers of real Parts;
  - a row applied by the tie-break;
  - one skipped row of each problem.
- [ ] **The worst cases.** `pnpm dashboard:inspect --offer-sheet-result worstCase|clean`, for `break-ui`, as `--part-requests` is. `clean` answers every row applied. `worstCase` adds what the spec's **The inspector** lists:
  - 4,800 skipped rows;
  - row numbers in the thousands;
  - part numbers of 100 code points and with no space;
  - a part number held by 81 Parts;
  - names in Kurdish and Arabic script;
  - the catalog's longest Part name among the added.
- [ ] **Reaching the result.** The result is reached through the inspector's own steps, a made-up file chosen first, as `part-requests`' dialogs were.
- [ ] **The screens as they are.** The Offers screen and the Part Request form are captured and critiqued before anything is proposed, by Taste's audit with Impeccable's `critique`.
- [ ] **What DESIGN.md lacks.** Impeccable adds to the dashboard's DESIGN.md whatever these pieces need and it does not yet say, before options are drawn.
- [ ] **The options, rendered.** Each piece is shown in two or three options in the built-in browser, from a page served from the scratchpad, never `file://`.
  - One option goes to an anchor, at most two columns.
  - Each is shown with the made-up shop's data, in Kurdish and English, at a phone's width and a desk's.
  - For a large options page, the owner looks and answers in chat before any choice dialog.
- [ ] **The open choices, put to the owner:**
  - whether the screen is also a fourth section of the sidebar and the menu sheet, or reached only from the Offers screen;
  - how the download and the file field stand, and how the upload says it is on its way;
  - the result's composition: the counts, the added Offers, the tie-break's rows and the skipped rows grouped by problem;
  - how a result of thousands of skipped rows stays readable on a phone: folded, paged or otherwise;
  - whether the Part Request form opens over the result or as its own screen, with the result kept either way;
  - the motion of the upload on its way and of the result arriving, led by Emil Kowalski's skills;
  - the copy, led by Impeccable: the refusals of a file, the four problems, a row already asked for, and why a part number is missing.
- [ ] **The record.** The owner's choices go under Comments, and Impeccable writes them, with their motion, into the dashboard's DESIGN.md. An ADR is written only if a choice replaces part of ADR-0011.
- [ ] **Gates.** `pnpm check --skip-nx-cache` passes. The made-up shop is typed against the client, and its tests pass.

## Comments
