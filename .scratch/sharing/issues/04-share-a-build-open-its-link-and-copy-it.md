# 04: Share a Build, open its link and copy it

**Spec:** [the sharing spec](../spec.md)

**What to build:**

- **Sharing.** A Shopper taps Share on their Build page and lands on its Shared Build page, whose address is the link to send. They can send it through their phone's share sheet, or copy it. Sharing an unchanged Build again gives the same link, and a changed Build a new one (SHR-1, SHR-4).
- **Opening the link.** Anyone who opens the link sees the Shared Build's Parts in the sender's language, with today's prices in both price views and today's Compatibility Problems, Warnings and unchecked rules (SHR-2). The page also gives its status, its power draw, and when it was shared. A browser that holds the same Build is told so.
- **Copying.** Anyone else can copy the Shared Build into their own Build, confirming once when they already have one, and change it. The Shared Build never changes (SHR-3).
- **The preview.** A link pasted into a chat shows a preview with no price.

Everything works before any script has loaded. This makes success criterion 7 true, and criterion 12 up to the page's head. The "send on WhatsApp" button comes in ticket 05.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] **The pieces both pages draw, moved first**, in a commit of their own that changes nothing a Shopper sees.
  - The Build page's pieces that the Shared Build page also draws move down a layer, as Feature-Sliced Design asks, so that a second page may import them: the slip, the rules' sheet, the Vendors' sheet, the status and the words of the outcomes.
  - Every existing unit test and end-to-end test passes unchanged, and `pnpm boundaries:check` passes.
- [ ] **Sharing.**
  - The Build page, built to DESIGN.md, has the share button when its Build holds a Part, and none when it is empty or refused.
  - The button is a plain form sent with POST to `/{language}/build/share`. The form sends the cookie's Build to `POST v1/shared-builds` and is answered by `answerAForm` with 303 and the Shared Build page.
  - A refusal, or an API that does not answer, comes back to the Build page with its reason in the address, which the page says.
- [ ] **The Shared Build page** at `/{language}/builds/{sharedBuildId}`, built to DESIGN.md.
  - **What it reads.** On the server, for each request, after `connection()` and with no cache, it reads `GET v1/shared-builds/{id}`. It then reads `GET v1/build` with those `part` values in the chosen currency, in its own slice's `api` segment.
  - **What it draws.** The Parts with their quantities and no forms that change them, the status, the outcomes, the power draw and both price views. Each Visible Part links to its Part page and each Vendor to its Vendor page.
  - **What it says.** When the Build was shared, and the note that its Parts are fixed and its prices are today's.
- [ ] **"This is your Build".** The page compares the browser's Build, read from its cookie, with the Shared Build's `part` values. When they are the same, it says so and offers no copy.
- [ ] **Share the link.** With script, it uses `navigator.share` where the browser has it and copies to the clipboard where it does not. Without script, the link is shown as text to select.
- [ ] **Copying.**
  - Copy into my Build is a plain form sent with POST to `/{language}/builds/{sharedBuildId}/copy`. When the browser holds a Build of its own, it asks to confirm once first, as emptying a Build does, with script and without.
  - It writes the cookie with `rememberTheBuild`, keeping only the Parts `GET v1/build` still answers (`heldByTheCatalog`), and is answered 303 with the Build page.
- [ ] **The edges.**
  - An unknown Shared Build answers the not-found page with 404 in the page's language, from the page and from its preview.
  - A Shared Build whose Parts have all left the catalog says so and offers nothing to copy.
  - An API that does not answer shows the sheet that says the page cannot be read just now, with Try again.
- [ ] **The language rule stays ADR-0008's.** The link carries its sender's language, and opening it is remembered as any Shopper address is. The switches keep the page, as they keep every page.
- [ ] **The preview**, written by a plain function through `previewOf`:
  - the title names the Build by how many Parts it holds, in the page's language;
  - the description names its CPU and GPU when it has them, and no price and no city;
  - the image is the photo of its first Part with one, in the catalog's order of Categories;
  - the page is marked for search engines not to index.
- [ ] **Words.** Every new text is in the `i18n` library's Shopper set in all three languages, using `words.md`'s terms, the Kurdish and Arabic drafts for LANG-7. Part names stay in English. Removing the Arabic text of the note of what is fixed is seen to fail `pnpm check` once, then reverted.
- [ ] **Seam 4**, the Shopper's unit tests:
  - the Shared Build page's address, and its link on the public address, in each language;
  - whether the browser's Build is the Shared Build, for the same Parts, another quantity, another order of kits and an empty Build;
  - the cookie written from a Shared Build's values, leaving out Parts the catalog no longer answers;
  - each form's refusal read back from the address, saying nothing for what it does not know;
  - the preview in each language;
  - the note of when a Build was shared, in Western digits.
- [ ] **Seam 3**, in a window 360 pixels wide, in Kurdish, Arabic and English, each test making its own made-up Vendors, Parts and Offers through the API and picking its Build from its own browser:
  - **Opening the link.** A Shopper shares and lands on the Shared Build page. In a fresh browser the link opens the same Parts with prices that match `GET v1/build`. After the Admin changes one of its Offers' prices, the page shows the new price.
  - **Copying.** The fresh browser copies the Shared Build and changes the copy, and the link still shows the Shared Build unchanged (success criterion 7). With a Build of its own, the copy asks once first. The sender's own browser is told it holds this Build.
  - **Sharing again.** Sharing an unchanged Build again gives the same address, and sharing after a change gives a new one.
  - **Without script.** Sharing, and copying with its confirmation, work with script switched off.
  - **The preview.** The page's head, read with no cookie, holds its title, a description with no price, and its image, and asks not to be indexed.
  - **Language and layout.** Kurdish and Arabic are right to left, every number is in Western digits, Part names are in English, and `expectNoSidewaysScroll` passes.
  - **Accessibility and motion.** `expectAccessible` passes on the Shared Build page and on the Build page with its share button, in both schemes. The motion DESIGN.md adds is filmed with `film` and judged by `snapsOf`, with reduced motion and without it.
- [ ] **`pnpm shopper:inspect`** runs on the Shared Build page with each made-up Shared Build, and on the Build page with its share button. It runs in both schemes, in Kurdish and English, at 1440, 768 and 390 pixels, and at 1024 and 1280 for desk layouts, and in dollars as well. Every FAIL is fixed, and every WARN is fixed or defended under Comments against `builder` ticket 10's reference.
- [ ] **Phone checks** are recorded under Comments as open, waiting for hosting:
  - the share button and the phone's share sheet used with a thumb, in Kurdish and in English;
  - Copy into my Build and its confirmation with a thumb;
  - a Shared Build's link pasted into WhatsApp showing its preview in each language;
  - the motion felt on a real phone, with reduced motion on and off.
- [ ] `pnpm check` and `pnpm platform:check` pass, and the work is committed.
