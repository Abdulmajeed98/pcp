# 13: Admin console: editing a Part and its photo

**Spec:** [the catalog spec](../spec.md)

**What to build:** The Admin corrects any Part from its page. The edit form opens filled with the Part as it is, and saving replaces the Part's name, manufacturer, part numbers and specifications, so a specification emptied in the form is cleared. The Category cannot be changed.

The Admin adds a photo from a phone, straight from the camera or from the phone's pictures, and can replace it. The photo then shows on the Part's page and in the Catalog in place of the Category's icon.

**Blocked by:** 05, 07, 12

**Status:** resolved

- [x] The edit form is the creation form, filled with the Part. It shows the Category but does not let it be changed.
- [x] Saving sends the whole Part, and a specification emptied in the form is cleared. A refusal is shown beside the field it names.
- [x] The Part's page offers to add a photo, or to replace the one it has. A file the API refuses is reported in plain words.
- [x] The photo field asks the browser for JPEG, PNG or WebP, so that an iPhone converts a photo it took as HEIC to JPEG as it sends it. The API keeps refusing HEIC, as the owner decided on 15 October 2026.
- [x] The photo shows on the Part's page and in the Catalog's results in place of the Category's icon.
- [x] The screens follow `apps/dashboard/DESIGN.md` and the root DESIGN.md, in light and in dark, are laid out at 360 pixels wide first, use logical classes only, and keep to Feature-Sliced Design's import rules.
- [x] `pnpm platform:check` gains these lines, and passes on every line, as the development Admin in a window 360 pixels wide:
  - The Admin edits a specification of a made-up Part, and the page shows the new value.
  - The Admin empties a needed specification, and the page marks it as missing.
  - The Admin adds a small made-up photo, and the page and the Catalog show it in place of the icon.
  - A second photo replaces it, and the photo's address changes.
  - The edit form does not scroll sideways, and the accessibility helper passes on it, in light and in dark.
- [x] Shown once and then reverted, each failing on its own line: the photo's address left unchanged after a replacement; an emptied specification left out of what is sent.
- [ ] Checked by hand, on the owner's phone: the Catalog, a Part's page and both forms are usable with a thumb, and a photo taken with the phone's camera is accepted and shown. On an iPhone, that includes a photo the camera saved as HEIC. *(After hosting: on 16 October 2026 the owner decided that the checks on a phone are made at the end, once the platform's services are hosted, and not on the development services.)*
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks and the by-hand check are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 16 October 2026: completed

**For the owner to know.**

- **Edit** on a Part's page opens the creation form at `/catalog/parts/<id>/edit`, filled with the Part as it is, with its Category named above it and no way to change it. Saving sends the whole Part and returns to its page.
- **The photo is sent as soon as it is chosen.** The page's button reads "Add a photo" or "Replace the photo"; it is the label of a hidden file field, so that it keeps the field's name and its focus. It asks the browser for `image/jpeg,image/png,image/webp`. A refusal is said in words for each of the API's reasons: no file, larger than 10 MB, not a JPEG, PNG or WebP picture, or too many pixels.
- **The photo shows wherever the Category's icon did**, on the Part's page and in the Catalog's rows, at the address the API gives it. In a row it is decorative, because the Part's name is beside it; on the page it is "Photo of" the Part.
- **A fix to ticket 11's and 12's links.** A link drawn as an outlined button, such as New Part, showed no edge: the base's `border-transparent` and the variant's `border-input` both reached the page, and the transparent one won. `buttonVariants` now merges them, as the Button component always did. The inspection round of this ticket found it, on Edit and on the photo's button.
- **Still to be checked by hand, on the owner's phone,** as the ticket asks, and so its box is open: the Catalog, a Part's page and both forms used with a thumb, and a photo taken with the phone's camera accepted and shown, an iPhone's HEIC photo among them. No phone was at hand in this session.

**The planted faults,** each made by one exact edit on a clean tree, run against `src/admin-edit.spec.ts`, and undone by the inverse edit:

| Fault | The line that failed | The others |
|---|---|---|
| The API's photo store keeps the old photo's identifier for its replacement, so its address does not change | The Admin adds a photo, which the page and the Catalog show, and a second replaces it at a new address | 6 passed |
| The edit merges the form's specifications over the Part's old ones, so an emptied one is left out of what is sent | The Admin empties a needed specification, and the page marks it as missing | 6 passed |

The first fault is in the API, because the address of a photo is the API's to change. The development API that the preview had started was stopped first, so that the tests ran against one built from the planted source.

**The checks.**

- `pnpm platform:check` passed all 72 tests, the 7 of this ticket among them.
- `pnpm check --skip-nx-cache` passed with `DOCKER_HOST` pointed at a socket that does not exist.
- `pnpm boundaries:check` passed.
- The Part's page with a photo and the edit form were captured at 360 and 1440 pixels wide, in light and in dark. The first round found the outlines missing on Edit and the photo's button, and the second showed them corrected.

**The commits,** each leaving `pnpm check` passing:

- the end-to-end tests, written first;
- the fix to links drawn as buttons;
- the edit form and the photo.

### 16 October 2026: the code review

The review of tickets 11 to 14 found that nothing checked which Category's icon a Part's page shows. Ticket 12's test now reads `data-category` on the page's icon. Its finding that an untouched save could change a Part's rows and lists is recorded and corrected under ticket 12, and the test of it, "saving the edit form without a change leaves the Part as it was", is with this ticket's tests: a motherboard with a row with every field missing and a list entry written with spaces around it is saved untouched and read back the same.
