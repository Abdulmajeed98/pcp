# 13: Admin console: editing a Part and its photo

**Spec:** [the catalog spec](../spec.md)

**What to build:** The Admin corrects any Part from its page. The edit form opens filled with the Part as it is, and saving replaces the Part's name, manufacturer, part numbers and specifications, so a specification emptied in the form is cleared. The Category cannot be changed.

The Admin adds a photo from a phone, straight from the camera or from the phone's pictures, and can replace it. The photo then shows on the Part's page and in the Catalog in place of the Category's icon.

**Blocked by:** 05, 07, 12

**Status:** ready-for-agent

- [ ] The edit form is the creation form, filled with the Part. It shows the Category but does not let it be changed.
- [ ] Saving sends the whole Part, and a specification emptied in the form is cleared. A refusal is shown beside the field it names.
- [ ] The Part's page offers to add a photo, or to replace the one it has. A file the API refuses is reported in plain words.
- [ ] The photo field asks the browser for JPEG, PNG or WebP, so that an iPhone converts a photo it took as HEIC to JPEG as it sends it. The API keeps refusing HEIC, as the owner decided on 15 October 2026.
- [ ] The photo shows on the Part's page and in the Catalog's results in place of the Category's icon.
- [ ] The screens follow DESIGN.md, are laid out at 360 pixels wide first, use logical classes only, and keep to Feature-Sliced Design's import rules.
- [ ] `pnpm platform:check` gains these lines, and passes on every line, as the development Admin in a window 360 pixels wide:
  - The Admin edits a specification of a made-up Part, and the page shows the new value.
  - The Admin empties a needed specification, and the page marks it as missing.
  - The Admin adds a small made-up photo, and the page and the Catalog show it in place of the icon.
  - A second photo replaces it, and the photo's address changes.
  - The edit form does not scroll sideways, and the accessibility helper passes on it.
- [ ] Shown once and then reverted, each failing on its own line: the photo's address left unchanged after a replacement; an emptied specification left out of what is sent.
- [ ] Checked by hand, on the owner's phone: the Catalog, a Part's page and both forms are usable with a thumb, and a photo taken with the phone's camera is accepted and shown. On an iPhone, that includes a photo the camera saved as HEIC.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks and the by-hand check are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
