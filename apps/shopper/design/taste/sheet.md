# DIRECTION SHEET — The page is the object

seed 2092360077 · drawn 2026-11-04 · sector ecommerce
Brief: The Shopper app compares the prices that computer shops charge for PC parts, for people who build their own PCs, on a phone first, in Kurdish, Arabic and English, in dinars and dollars; prices and the ≈ mark of a converted price are the page's centre; hard rules hold: WCAG 2.2 AA in both schemes with a switch between them, 44-pixel controls on a touchscreen, no text under 14 pixels (15 in Kurdish and Arabic), 360 pixels wide, right to left, self-hosted fonts that draw all of Sorani

|             |                                                                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Direction   | The page is the object                                                                                                                                                          |
| Hero        | Card over a dim room                                                                                                                                                            |
| Type        | Big Shoulders / Public Sans                                                                                                                                                     |
| Colour      | Bone, green, chocolate                                                                                                                                                          |
| Sections    | list (The printed menu sheet) → showcase (Square plate, spare text) → intro (Title, note, facts row) → contact (Clip-out coupon form) → footer (Invitation over a cropped name) |
| Motion      | Pinned story                                                                                                                                                                    |
| Photographs | the "Mountain" set, as atmosphere                                                                                                                                               |

This is the direction for this build. Adopt it. Do not blend it with the layout you would have made anyway,
and do not redraw because it is unfamiliar: unfamiliar is the point. Redraw a slot only when it conflicts
with a stated brand constraint or needs an asset that does not exist, and say why in your report.

The parts of this sheet were written separately and will disagree in small ways. Settle every disagreement in this order:
**house rules** (including type no smaller than 13px and body text of 16px or more) → **the direction** (the idea, the composition habits, where the
one accent goes) → **the type system and the palette** (which face does which job, the five size steps, which colour is the ground and where the
accent goes) → **the hero blueprint** → **the section blueprints**. Under each blueprint below, "Adjusted for this page" lists where it disagrees.
In practice: take geometry from blueprints (columns, proportions, what sits where) and take everything else from above them. Map every size a
blueprint names onto one of your five type steps instead of adding a sixth. Use one button shape, one corner radius and one pair of page margins on
the whole page, whatever individual blueprints say. If a blueprint names a kind of typeface (a light serif, a heavy grotesk), use the dealt face.

## 1. The idea

Find the printed or physical artefact that already exists in the subject's world and build the page as that thing. A wedding site is the invitation card. A restaurant is its menu. A conference is the ticket; a record is its sleeve; a shop is the receipt or the swing tag; an archive is a stack of tabbed folders; a course is the syllabus sheet. The artefact supplies everything a template would otherwise invent: its proportions, its typographic manners, its way of grouping information. Visitors recognise the object instantly, which is why these pages feel specific.

Before anything else, write one sentence in your notes: "On this page, <the subject's own material> becomes <the device>."
Fill the first blank from your inventory of what only this client has (its name and what it means, its street, its numbers, its
constraint), then put the nearest competitor in the sentence: if it still works, the idea is the category's, not the client's.
Then name the one live thing the visitor can do on the page (SKILL.md step 4).

## 2. Composition

The first screen shows the artefact as a single filled panel (paper colour on a contrasting ground) centred or offset, with believable proportions: a card at 5:7, a ticket at about 2.2:1 with a notch cut by `clip-path`, a menu as a tall sheet. All primary content lives on it, set the way that object is set: centred and symmetrical for an invitation, in tidy aligned columns for a menu or ticket. The ground behind is a flat colour or one full-bleed photograph. As the page continues, each section is another piece of the same stationery: a second card, a tear-off stub, a folded panel, always filled shapes with real edges (straight, notched, scalloped, perforated by a dotted `border` of round dots at 4px or more), never outlined boxes. The footer is the back of the object.

## 3. Type — Big Shoulders / Public Sans

A tall American gothic taken from city signage, blunt and civic, over a plain public-service sans. Suits culture indexes, community projects, bars, sport clubs and local campaigns.

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Big+Shoulders:wght@800&family=Public+Sans:wght@400;600&display=swap"
  rel="stylesheet"
/>
```

- Display: **Big Shoulders** — weight 800 · tracking -0.005em · leading 0.88 · uppercase
- Text: **Public Sans** — 400 for body, 600 for emphasis · leading 1.5 · tracking 0

```css
:root {
  --step-small: clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem);
  --step-body: clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem);
  --step-lead: clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem);
  --step-head: clamp(2.5rem, 1.2rem + 5vw, 5.5rem);
}
```

Take the manners of the artefact: a bookish serif with small caps avoided, or a blunt condensed face for tickets and posters. Sizes stay within what print would use relative to the panel; the name is large on the panel, details are small and exact.
The direction decides sizes and how many of them; the type system decides how this face is set. Where the two give different tracking or leading, use the values of the type system: they are tuned to this face.
The display size itself comes from the hero blueprint below.

## 4. Colour — Bone, green, chocolate

```css
:root {
  --bg: #e5e1d8;
  --surface: #dad5ca;
  --ink: #2a1d17;
  --muted: #6b5b51;
  --accent: #456f3a;
  --accent-ink: #ffffff;
  --field-1: #456f3a;
  --field-1-ink: #ffffff;
}
```

Bone ground with chocolate-brown text takes most of the page. The green is spent on one large flat block, about a third of a screen, and on the button; all other colour comes from photographs.
Paper and ink plus the ground the paper sits on. Two or three flat colours in total, like a two-colour print job.

## 5. Imagery

**There are no photographs of the product and none can be faked.** Wherever this sheet calls for a picture of the object, draw the object: its pieces as flat shapes in inline SVG, large, in one graphic language and in the colours that make it worth buying (a glaze, a finish, a material), never grey placeholders (references/imagery.md §8). **Around the object, use real pictures of its world** from the open collections: its material up close, its town in old postcards, its craft in engravings, a museum piece of the same kind, never one a visitor could take for the product itself (references/imagery.md §3). Start with `node /Users/ryu/.claude/skills/design-taste-frontend/scripts/assets.mjs "kurdish postcard"`, then "kurdish old map" and "phone first", then queries from your inventory (its street, its materials, its trade's tools and history). Download what you use with `--get` and credit every one on the page (`--credits` prints the footer line). Type at scale and full colour fields carry the rest; the dealt photographs only where they plainly do not pretend to be the product. In your report, say that product photography is needed and which drawings it will replace, and list every found picture with its source and licence.

Optional. One photograph behind the object, or small photographs placed on it like tipped-in plates. The object itself is the image.

**Floor (the inspector checks it):** at least four real pictures on the page, usually six to twelve; SVG drawings do not count. One moving picture where an honest clip exists: `node <skill>/scripts/assets.mjs --video "<query>"`, used as a muted loop with a poster frame. Whatever this direction says about pictures, it is carried out with real ones.

Photographs dealt for this build, from the "Mountain" set (peaks, alpine valleys, snow and rock)
Order of preference for imagery: (1) the project's own photographs and product shots; (2) images you generate, if an image tool is
available; (3) real pictures of the subject's world found in the open collections (assets.mjs, downloaded and credited on the page);
(4) drawings of the subject in code; (5) these. They are real photographs (Unsplash licence, served by picsum.photos) of places, light and
texture. They are atmosphere, never a stand-in for a specific product, dish, person or interface. List the ones you use in your report so
they can be replaced.

- `https://picsum.photos/id/235/1600/1000` — Snow-covered peak rising above dark forested slopes and a lake · mid tone · slate blue, white, dark green · calm area: top · native landscape · photo: Paul E. Harrer
- `https://picsum.photos/id/260/1600/1000` — Snowy mountain peak framed by dark pine trees in mist · light tone · white, pale grey, dark green · calm area: centre · native portrait · photo: Sylwia Bartyzel
- `https://picsum.photos/id/931/1600/1000` — Layered mountain slopes fading into blue haze · mid tone · steel blue, pale blue, dark teal · calm area: top · native landscape · photo: Paul Earle
- `https://picsum.photos/id/906/1600/1000` — Sunlit snowy pyramid peak against a clear blue sky · mid tone · sky blue, white, dark slate · calm area: top · native landscape · photo: Andras Toth
- `https://picsum.photos/id/830/1600/1000` — Layered blue mountain ridges receding into haze · mid tone · cobalt blue, pale blue, navy · calm area: top · native landscape · photo: Luca Zanon
- `https://picsum.photos/id/29/1600/1000` — Rocky ridges and snow-covered peaks in a high mountain range · mid tone · slate grey, white, blue · native landscape · photo: Go Wild
- `https://picsum.photos/id/296/1600/1000` — Snow-capped mountain range beneath a deep blue sky · mid tone · deep blue, white, dark brown · calm area: top · native landscape · photo: Greg Shield
- `https://picsum.photos/id/538/1600/1000` — Bird soaring above snowy mountain ridges in black and white · mid tone · grey, white, black · black-and-white · calm area: top · native landscape · photo: Julia Revitt
  The last two path numbers are width and height: request the exact crop you render (`/1200/1500` for a 4:5 portrait, `/2400/1350` for a hero) and
  add `?grayscale` to desaturate. Use three to six of them, not all eight. Always set `width`, `height`, `alt` and `loading="lazy"` (not on the hero image).
  Other sets that fit this brief: architecture, hands-and-making, coast, city-day — `node draw.mjs --photos <set>` prints one in full; `--photos list` shows all sets. Taking photographs from another set is your call and is not a redraw; keep them to one light and one treatment.

## 6. Hero — Card over a dim room

A full-bleed, low-key photograph of the room fills the viewport, darkened with `filter: brightness(0.7)` so it reads as atmosphere. Centred over it is one square-cornered panel in a flat warm tone taken from the photograph: columns 4–10, about 55% of the width and 62% of the height, a filled programme card with 32px padding. Along its top edge the three words of the title are spread to the left, centre and right in bold condensed capitals at clamp(28px, 2.5vw, 38px); that line is the headline. Under it sit two left-aligned blocks in the same face and size, line-height 1.0: the facts (date, time, place) as three short lines, then one supporting sentence held to 30ch. Along the card's bottom edge: a credit at left in 14px, the single action as a solid rectangular button in the centre, one text link at right. There is no navigation outside the card. The card is `position: sticky`: as the page scrolls it shrinks with `transform: scale` toward the bottom-left corner and stays there as a ticket-sized stub while photographs of differing sizes pass on a flat ground.

On a phone: The photograph fills 100svh and the card sits centred at full width minus 16px margins, 70svh tall. The title words stack as a two-line heading at 9vw at the card's top-left. The facts and the supporting sentence follow at 5.2vw in the condensed face. The action button spans the card's bottom edge. On scroll the card shrinks to a 120px stub pinned bottom-left.
Headline: The event or venue name, three words at most and up to about 8 characters each, spread across the card's top edge; two lines on a phone.

Adjusted for this page:

- It names a kind of typeface: use the dealt faces (display Big Shoulders, text Public Sans) and their settings; capitals only where the type system sets them.
- It sets a sentence large over several lines: jurors read that as a long headline. Either cut it to a two-line headline at display size, or keep it a statement at 36px or less on three lines (24px, four lines on a phone).
- Its vw sizes assume a face of normal width: with this condensed display face, size the words to fill the measure the blueprint gives them instead of copying the vw value.

## 7. Sections, in order

Each is a composition to rebuild with this project's content. Keep the geometry; change the subject. Re-order or drop a
section when the argument of the page needs it (see references/copy.md), never to fall back to a card grid.

### 1. list — The printed menu sheet (band)

The list is one tall sheet of paper. A filled paper-colour panel 640px wide sits centred, or offset to columns 7–12, on a contrasting flat ground or a full-bleed photograph, with square corners and its top and bottom edges cut into shallow scallops by `clip-path` or an SVG `mask`. Inside, 64px padding and a centred, symmetrical setting like a printed card: the venue or section name at 40–48px, a one-line note at 15px, then three or four groups 56px apart. Each group opens with its name at 22px, centred. Items follow at 17px with 16px between them: the dish or service at the left of a 420px measure, the price at the right with tabular figures, and a one-line description at 14px in the soft ink under the name. Alignment alone links name and price; there are no leaders. The sheet ends with the opening hours as two centred lines. Holds 12–24 items.
On a phone: The sheet spans the screen with 10px of ground showing at each side and 28px padding; the scalloped edges stay at top and bottom. The measure is the full inner width and prices stay right-aligned. Group names at 20px, items at 16px.

### 2. showcase — Square plate, spare text (split)

One flat field split 50/50, at least 88svh tall. Left half: a single square photograph filling the half's width minus 40px margins, vertically centred, square corners. A large simple shape may be laid over it to turn the photograph into the object it stands for: a ring 86% of its width with a 6px stroke and a small solid dot at the centre makes a record; a notch cut by clip-path makes a ticket stub. Right half, a flex column with space-between: at the top a row of three plain text tabs at 18px (editions, years, variants), the active one in full ink and the others at 40%; in the middle the title, two to four words at 32–40px bold, with a 34ch description 48px below; along the bottom two filled rectangular cells side by side, each half the column wide and 72px tall, acting as the two actions, one in ink and one a tone off the field.
On a phone: The square photograph comes first at full width with 16px margins. The tabs sit under it as one row at 17px. Then the title at 28px, the description, and the two action cells stacked, each full width and 60px tall.

Adjusted for this page:

- It fades text: anything a visitor reads, inactive items of a list included, is `--ink` or `--muted` at full strength (contrast 4.5:1 or more). The active item is told apart by `--ink` against `--muted`, weight or the accent, not by fading the rest.

### 3. intro — Title, note, facts row (split)

First row: a heading of two to four words in a light weight at clamp(44px, 5vw, 76px) sits on the left margin in columns 1–6; a three-line paragraph at 16px, 260px wide, sits in columns 10–12 with its last line on the heading's baseline. Columns 7–9 stay empty. 120px lower, a second row sets three or four facts (a date, a time, a place, a price) as large light text at clamp(28px, 3vw, 44px), spread across the 12 columns with `justify-content: space-between`. Each fact has a one-line explanation at 14px directly under it in the soft ink, left-aligned to the fact. Facts are separated only by the space between them, so the row reads like the line of times on a printed programme. A photograph may start under the right half of the facts row, 5 columns wide at 4:3. Padding 140px top, 120px bottom.
On a phone: Heading at 11vw on the left margin; the note follows directly under it at 16px, full width. The facts become a two-column grid with a 32px row gap, each fact at 26px with its explanation beneath. Any photograph goes last, full width.

Adjusted for this page:

- Its vw sizes assume a face of normal width: with this condensed display face, size the words to fill the measure the blueprint gives them instead of copying the vw value.

### 4. contact — Clip-out coupon form (split)

The form is a coupon to cut out. One filled card in a strong flat colour, about 2.2:1, spans columns 2–11 with a 14px radius, with 120px of ground above and below. Semicircular notches 28px across are cut into its top and bottom edges at the 46% mark with `clip-path` or an SVG `mask`, and a vertical row of round dots (a dotted `border-left` 5px thick in the ground colour) joins the two notches as the perforation. Left of the perforation, with 48px padding: a two-line heading of three to five words at clamp(28px, 3vw, 44px) in heavy capitals at the top, and one sentence at 16px at the bottom. Right of it: four inputs stacked with 10px gaps, each a filled block 52px tall in a lighter tone of the card with its placeholder at 16px, then a full-width solid submit bar 56px tall in the darkest ink. Inputs keep visually hidden `label` elements.
On a phone: The card turns upright and spans the width with 12px margins. The perforation becomes horizontal: notches on the left and right edges, dots across. Heading and sentence sit above it; the four inputs and the submit bar sit below, each 54px tall.

Adjusted for this page:

- It names its own corners: use the one radius of this page (square unless the direction says otherwise) and one button shape.
- It names a kind of typeface: use the dealt faces (display Big Shoulders, text Public Sans) and their settings; capitals only where the type system sets them.
- It draws lines or borders: keep them only inside a table, a form or a `data-ui` fragment; elsewhere separate with space or a change of ground.
- Its vw sizes assume a face of normal width: with this condensed display face, size the words to fill the measure the blueprint gives them instead of copying the vw value.

### 5. footer — Invitation over a cropped name (statement)

Close and footer in one full-viewport field of the inverse colour. Upper third, columns 1–7: a two-line invitation at about 5vw, three to five words, with one filled rectangular button beneath it. At columns 10–12, top-aligned with the invitation, three or four social or contact links stacked at 16px. The wordmark fills the bottom of the screen at 26–30vw on one line, `white-space: nowrap`, heavier and larger than the viewport can hold: it is pushed down with `transform: translateY(30%)` so the bottom edge cuts through the letters, and a long name also runs off the right edge. `overflow: hidden` on the footer does the cropping. One row of credits and legal links at 13px sits directly above the wordmark's cap line, spread left and right. The cropped name must be recognisable from its upper two-thirds alone; test that it is.
On a phone: Invitation at 11vw on two lines at the top with a full-width button. Links follow as one row of words at 15px. The wordmark sits at 34vw at the bottom, cropped by both the bottom and the right edge, with the legal row above it at 12px.

Adjusted for this page:

- It sets text at 12px: use your small step (13px or more) instead.
- Its vw sizes assume a face of normal width: with this condensed display face, size the words to fill the measure the blueprint gives them instead of copying the vw value.

## 8. Motion — Pinned story

One element holds its place with `position: sticky` (a title, a frame, a product fragment) while the items that belong to it scroll past or swap inside it. The page's ordinary scrolling does the work; nothing is hijacked. Hold it for about one screen per step and three screens at most, two held stages per page at most, with a line of text on every held screen. Recipe: 'Pinned story' in references/motion.md.
This is the signature move, the one loud moment. Around it the page still needs the rest of the motion layer (SKILL.md step 9): an entrance for the parts of every section, feedback on every control, and one moving picture. The inspector fails a page that barely moves. Recipes: references/motion.md.

## 10. Where the richness comes from

Recognition. The shaped edges, the print-like alignment and the limited inks make a familiar object out of plain HTML.

## 11. How this direction goes wrong

Choose an artefact that truly belongs to the subject, or it becomes costume. Shape the edges with fills and `clip-path`; an outlined rectangle with a thin border is not an object. Keep text sizes readable on a phone, where the object becomes full width with its shaped edge kept at top and bottom.

## 12. Real references

Studied sites that work this way. Take the principle, never the specifics: no names, copy, images or signature assets of theirs.

- **The Deep End** (One Page Love, studied score 7.5) `opl-the-deep-end`
  Idea: The whole site is one invitation card floating over ambient footage, which shrinks into a pinned corner ticket as scattered stills scroll past.
  Hero: Full-bleed, dim, amber-toned video of a listening room: a modular synth and speaker at top, a person lying on a silk cushion in soft focus. Centred over it is a square-cornered panel about 55% of the viewport wide and 62% tall, a blurred brown-to-taupe wash. Inside, the three words of the title are spread along the top edge at left, centre and right in bold condensed caps. A small line-diagram logo sits below. Two left-aligned text blocks at 2.5vw in the same heavy condensed face, tightly leaded: five lines of event details, four of description. Bottom edge: credits left, an RSVP box centre, a small link right. No navigation.
  Worth taking: Spread the words of a short title to the left, centre and right of a card's top edge so the name becomes its frame.
- **WeekSync** (One Page Love, studied score 7.1) `opl-weeksync`
  Idea: The page is a paper coupon: a dotted cut line with a scissors icon frames the viewport, and on scroll the navigation rail is cut free while the rest of the sheet tilts and falls away.
  Hero: Taupe-grey field wrapped by a black dotted rounded-rectangle border inset 16px from every edge. A left rail about 26% wide holds, centred on its own axis, a small black logo glyph at the top, a two-line mono tagline and a text link in braces; four nav labels, each under a small empty circle, stack at the bottom of the rail. A scissors icon sits on the bottom dotted line where rail meets main area. The main area carries one four-line statement in medium grotesk at 3vw, flush left and flush top, ending in the first quarter of the height. The remaining three quarters are empty.
  Worth taking: Give the page a physical metaphor that also does layout work: a dotted cut line frames the viewport, then separates the nav rail on scroll.
- **Aardvark Book Club** (Awwwards Site of the Day, studied score 7.7) `aww-aardvark-book-club`
  Idea: A book club dressed as a sweet shop: fat black type, tumbling 3D books and boxes on wavy colour fields, annotated with handwritten asides.
  Hero: A saturated yellow field with two large wavy blobs, pale yellow then orange, rising from the bottom. A three-line headline in Champ Bold, black, at about 8.3vw with leading under 0.85, is flush to a 15px left margin and reaches 60% across. Beneath it: a four-line paragraph 310px wide and a magenta split button (label plus arrow square). Right of centre a 3D hardback in navy and pink tilts 20 degrees, 600px tall; another book is cropped by the top-left corner, a third by the bottom edge. A purple handwritten note sits rotated at far right. Nav: pale-yellow pill links centred, an orange login button, black round social icons.
  Worth taking: Give each section one flat saturated colour inside a large-radius inset panel and keep the type black across all of them.
  Full notes on any of them: `node draw.mjs --site <id>`.

## Always

Headlines two lines or fewer at every width. No eyebrow labels, no monospace, no 01/02/03, no thin rules, no gradients, no shadows at rest,
no cream-and-terracotta, no violet. The frame: one h1 on the first screen that says what this is, equal outer margins, no
section huddled on one side with the other half empty, no blank stretch over half a screen, a heading on every section.
`inspect.mjs` measures all of it.

Saved to apps/shopper/design/taste/direction.json · reprint with `node draw.mjs --show`
