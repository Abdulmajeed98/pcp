---
name: The dashboard, Rate Board
description: The numbers a Vendor and the Admin keep, set like a money changer's board.
colors:
  warm-page: "oklch(0.967 0.007 88.6)"
  sheet: "oklch(0.985 0.004 91.4)"
  ink: "oklch(0.203 0.005 248.1)"
  plate-graphite: "oklch(0.303 0.009 248.1)"
  plate-amber: "oklch(0.791 0.134 79.5)"
  action-red: "oklch(0.501 0.178 28.7)"
  warning-brown: "oklch(0.531 0.119 65.1)"
  confirmed-green: "oklch(0.475 0.099 148.2)"
  shelf: "oklch(0.925 0.01 87.5)"
  note-grey: "oklch(0.484 0.013 256.7)"
  rule-sand: "oklch(0.874 0.013 86.8)"
  control-edge: "oklch(0.599 0.018 82.8)"
  night-page: "oklch(0.194 0.005 248.1)"
  night-ink: "oklch(0.934 0.008 91.5)"
  night-red: "oklch(0.708 0.155 26.9)"
typography:
  heading:
    fontFamily: "Geist Variable, Noto Sans Arabic Variable, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.333
  title:
    fontFamily: "Geist Variable, Noto Sans Arabic Variable, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Geist Variable, Noto Sans Arabic Variable, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  row:
    fontFamily: "Geist Variable, Noto Sans Arabic Variable, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.429
  figure:
    fontFamily: "Geist Mono Variable, monospace"
    fontSize: "1.25rem"
    fontWeight: 700
    fontFeature: "tnum"
  figure-large:
    fontFamily: "Geist Mono Variable, monospace"
    fontSize: "1.875rem"
    fontWeight: 700
    fontFeature: "tnum"
rounded:
  plate: "3.6px"
  control: "6px"
spacing:
  control: "44px"
  row: "8px"
  group: "16px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.warm-page}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 16px"
  button-outline:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 16px"
  input:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 12px"
  plate:
    backgroundColor: "{colors.plate-graphite}"
    textColor: "{colors.plate-amber}"
    typography: "{typography.figure}"
    rounded: "{rounded.plate}"
    padding: "2px 8px"
  part-picture:
    backgroundColor: "{colors.shelf}"
    rounded: "{rounded.control}"
    size: "40px"
  needed-mark:
    backgroundColor: "{colors.shelf}"
    textColor: "{colors.ink}"
    typography: "{typography.row}"
    rounded: "{rounded.plate}"
---

<!-- Written with ticket 10 of the catalog module, on 15 October 2026, before any dashboard screen existed. Its components were recorded on 16 October 2026 from what tickets 11 to 13 built: the Admin console's Catalog, a Part's page and the Part's form. The sections' menu and the Vendors' rows were added on 18 October 2026, with ticket 05 of the accounts module, and the Vendor's form, the map location's field and the hand-over the same day, with ticket 06. The band for the Admin acting as a Vendor was added on 18 October 2026, with ticket 09, and the alert dialog, deactivating a Vendor and the message for a deactivated Vendor on 19 October 2026, with ticket 12, and the Admin's edit of a Vendor the same day, with ticket 10, and the reset of a Vendor's password the same day, with ticket 11. The Missing specifications screen was added on 20 October 2026, with ticket 08 of the offers module, as the owner chose, and the Vendor portal's Offers screen, an Offer's row, the expiry banner and the portal's sections the same day, with ticket 03, as the owner chose them. -->

# Design System: the dashboard, Rate Board

## Overview

**Creative North Star: "The Rate Board"**

In the window of every money changer in Erbil hangs a board of plain figures on dark plates, set by hand and dated, and the Platform Rate follows it by hand too. The dashboard sets the numbers its people keep the same way. A Vendor's prices, the Platform Rate, the count of Offers about to expire and of Part Requests waiting: each is a figure on a small graphite plate, in amber, with the date it was last set beside it. Everything else is a warm, quiet page and ink, so that the plates are where the eye goes and what needs action is the only red.

The dashboard holds two surfaces. The Admin console, in English, is used on a phone in a Vendor's shop and at a desk. The Vendor portal, in Kurdish, Arabic and English, is used on a phone behind the counter, between serving people at it. Both are dense, quick working screens in the manner of Linear: rows rather than cards, few words, nothing that moves without reason. Their navigation, tables, forms and buttons are the ordinary ones of the web, on shadcn/ui's compact Mira style.

The shared floor is in [the root DESIGN.md](../../DESIGN.md), and the reasons in ADR-0006 and ADR-0007.

**Key Characteristics:**

- A warm page and ink; colour is for plates, action and state, never decoration.
- Numbers that matter on dark plates, in amber Geist Mono, each with its date.
- Dense rows; every control still 44 pixels high.
- Small, firm corners; borders, not shadows.
- The same look in Kurdish and Arabic, right to left, as in English.

## Colors

A money changer's window: a warm page, black ink, graphite plates with amber figures, and red only where something needs doing. Each colour's name in code follows it, from `@pcp/ui/themes/dashboard.css`; the values are in the tokens above.

### Primary

- **Ink** (`--foreground`, `--primary`, `--ring`): text, the focus ring, and the one filled primary button. **Night Ink** in the dark scheme, where the primary button turns light.
- **Plate Graphite** (`--plate`) and **Plate Amber** (`--plate-figure`): the plates and their figures, the same in both schemes, at 6.9:1.

### Secondary

The states, each also said in words or a mark, never in colour alone.

- **Action Red** (`--destructive`): what needs the Vendor's or the Admin's action, such as an Offer about to expire, and destructive actions. **Night Red** in the dark scheme.
- **Warning Brown** (`--warning`): a warning that needs no action yet.
- **Confirmed Green** (`--success`): confirmed today, and in stock.

### Neutral

- **Warm Page** (`--background`) and **Sheet** (`--card`, `--popover`): the page, and a raised surface such as a menu. **Night Page** in the dark scheme.
- **Shelf** (`--secondary`): a quiet surface, such as a secondary button or a selected row.
- **Note Grey** (`--muted-foreground`): secondary lines, at 4.5:1 or more on every surface.
- **Rule Sand** (`--border`): the rules between rows.
- **Control Edge** (`--input`): the border of an input or any control whose border is the only sign of where it is, at 3:1 against the page.

### Named Rules

**The Amber Is Only on Plates Rule.** Plate Amber appears on Plate Graphite and nowhere else: not as an accent, not on the page, not as a glow.

**The Red Is for Action Rule.** Action Red marks what someone must do, and always beside words that say what.

## Typography

**Body Font:** Geist (with Noto Sans Arabic for Kurdish and Arabic)
**Arabic-script Font:** Noto Sans Arabic
**Figure Font:** Geist Mono, on plates, and for a temporary password

**Character:** a quiet, precise grotesque and its monospace, beside a clear Arabic-script sans: the voice of a well-kept ledger read at a glance.

### Hierarchy

- **Heading** (600, 1.5rem, 1.333): a screen's title on a wider screen.
- **Title** (600, 1.25rem, 1.4): a screen's title on a phone.
- **Body** (400, 1rem, 1.5): forms, inputs and buttons.
- **Row** (500, 0.875rem, 1.429): the text of a dense row, with its secondary line in Note Grey.
- **Figure** (700, 1.25rem, tabular figures): a price or a count on a row's plate.
- **Figure large** (700, 1.875rem, tabular figures): the one leading figure of a screen, such as the Platform Rate, at the shared scale's largest size.

A temporary password, shown once after a Vendor is created, is in Geist Mono at 1.5rem, weight 700, on a Sheet panel with a Rule Sand border, never on a plate: it is not a figure, and its look keeps a and o, or 5 and s, apart for the Admin reading it out.

Kurdish and Arabic follow the root's Tall Script Rule. Figures are always Western digits, so Geist Mono serves all three languages.

### Named Rules

**The One Leading Plate Rule.** A screen has at most one large plate.

## Layout

On a phone, one column: a quiet top bar with the sections behind a menu button, then the screen's search or filters, then rows. On a wider screen the sections are in the top bar itself, and a list gains a detail pane beside it. Lists are rows, not cards: what the row is, one secondary line, and its plate at the end side.

From 64rem wide, the Catalog keeps its list in a column 26rem wide on the start side, and shows the Part opened from it, its edit form or a new Part beside it, past a Rule Sand rule; before a Part is opened, the pane says how to open one. The Vendors list does the same with a Vendor's page. On a phone the opened screen takes the whole screen. The console's content is at most 80rem wide. The top bar had no menu of sections while the Catalog was the only one, as the owner chose on 16 October 2026, and gained it with the Vendors, the second, on 18 October 2026.

The Vendor portal opens on its Offers screen, in one column at every width: its title, the expiry banner when an Offer needs confirming, the line that says how many confirm-all confirmed, the search of the Vendor's own Offers, the count on its plate, the rows, and the way to the other pages. A Vendor with no Offer gets the empty state in place of the search and the rows. The details screen is the portal's second section.

Rows are 8 pixels apart inside, groups 16. Every control is 44 pixels, under a mouse as on a touchscreen, as the owner chose; density comes from rows and spacing, never from smaller controls.

## Elevation & Depth

Flat, with one exception. Surfaces are told apart by Rule Sand rules and Sheet grounds. A menu or a dialog over the page has a Control Edge border and a soft shadow that falls downward, `0 8px 24px` at low opacity, so that it reads as lifted off the page.

### Named Rules

**The Border First Rule.** A row, a panel or a field gets a border or a change of ground, never a shadow. Only what floats over the page casts one.

## Shapes

Small, firm corners: 6 pixels on controls and panels, about 4 on plates. Plates are always rectangles, sized to their figure.

## Components

The dashboard's own shadcn/ui components, on Base UI in the Mira style, are in `apps/dashboard/src/shared/ui`. Mira draws them compact; here each is held to the root DESIGN.md, so the compactness comes from rows and spacing and never from a smaller control. They were built with the Admin console's Catalog, a Part's page and the Part's form, on 16 October 2026.

### Buttons

- **Shape:** small, firm corners (6px, `rounded-lg`), 44 pixels high, 16 pixels of padding on each side, body-size text at weight 500.
- **Primary:** Ink ground with Warm Page text, one in each pane, for the action the pane is for: Search, Create the Part, Save the Part. Night Ink turns it light in the dark scheme.
- **Outline:** a Control Edge border on the page, for every other action: New Part, Edit, Log out, the photo's button, a page of results.
- **Ghost:** no edge, for a quiet action beside an outlined one, such as making a list of rows not known again.
- **Hover / Focus:** hover takes a Shelf ground; focus draws a 2-pixel Ink outline 2 pixels out, at full strength. A press moves the button down one pixel.
- **A link or a label that looks like a button** takes the same classes through `buttonVariants`, merged so that the variant's edge wins.

### Inputs and choices

- **Style:** Sheet ground, a Control Edge border, 6px corners, 44 pixels high, body-size text, a placeholder in Note Grey.
- **Choice:** the browser's own select, so that a phone opens its own picker, with a chevron in Note Grey on the end side.
- **Boxes to tick:** the browser's own checkbox, 20 pixels, in two columns of rows 44 pixels high, each with its label.
- **Focus:** the same 2-pixel Ink outline as a button.
- **Error:** the field's edge in Action Red, and one sentence in Action Red below it that says what is wrong, which the control names as its description.

### Fields

- **Label:** small size, weight 500, above its control. A needed specification carries a "Needed" mark beside its label: small, weight 500, on a Shelf ground with 4-pixel corners, which the control also names as part of its description.
- **Groups:** a field set with its legend, at body size and weight 500. Two fields to a row on a wider screen; a list, a set of boxes or a list of rows takes the whole row.
- **Lists:** each entry a line with a 44-pixel square remove button beside it, and an outlined Add button below. A list of rows puts each row in a Rule Sand box with 6px corners.
- **Optional:** a detail a form lets the person leave out carries an "Optional" mark beside its label, drawn as the "Needed" mark is, and named by its control as part of its description. The label itself stays the detail's name.
- **Several lines:** an address or opening hours is a textarea styled as an input, at least 96 pixels high and growing with its text, laid out in the direction of what is typed.
- **Description:** each length limit and each form a value may be written in is said below the control in Note Grey, before its error.
- **The map location:** its coordinates, left to right, and below them an outlined button with a locating mark that fills them from the device's position. While it looks, a Note Grey line says so; a refused or missing position is said in Action Red in the same place, and the coordinates can still be typed.

### Rows

- **Character:** a list is rows, never cards. Rule Sand rules divide the rows, and close the list above and below.
- **A row:** the Part's picture, then its name in the row type (14 pixels, weight 500) and one secondary line in Note Grey. The whole row is the link, with a Shelf ground on hover and on the row of the Part open beside the list, while the link's name is the Part's alone.
- **A Vendor's row:** its name as it writes it, then one secondary line with its login phone number and, for a deactivated Vendor, the "Deactivated" mark, drawn as the "Needed" mark is. It has no picture.
- **A Vendor's details:** a row each, divided and closed by Rule Sand rules, the detail's name in Note Grey on the start side and its value beside it, two fifths and three fifths of the row, at small size. What the Vendor wrote takes its own direction; a phone number, the coordinates and an Instagram name run left to right. A Vendor's page in the Admin console and the Vendor portal's details screen share them; the details screen puts them in three groups, the Vendor, its contact details and its Login, each after a heading at body size and weight 500. Beside the contact details' heading, or below it when the row is too narrow, an outlined button-sized link opens the Vendor's form for them, a screen of its own with a back link above its title. That form is drawn as the Admin's Vendor form is, in the portal's language, with the six contact details in one group and no legend.
- **A Vendor's actions:** on its page in the Admin console, below its name, in two groups, each a row that wraps on a phone. First the outlined button-sized links, as a Part's page has its Edit: Edit, with a pencil mark before it, and Open its portal. Then, on a row of their own, the actions that log the Vendor out or let it back in, each opening the alert dialog: the outlined button Reset the password, with a key mark before it, and Deactivate, or for a deactivated Vendor Reactivate and Deactivate again. Edit opens the Admin's Vendor form, filled with the Vendor's details as they are, on a screen of its own titled "Edit" and the Vendor's name as it writes it, with a back link above the title that names the Vendor too. The form is the one for a new Vendor, saved with "Save".
- **An Offer's row**, on the Vendor portal's Offers screen: the Part's picture, then its name in the row type and one secondary line in Note Grey with its manufacturer and its Category; below them, on a line of their own, each price quoted on its own plate, the dollars before the dinars, "349.99 $" and "1,875,000 IQD", so that the Part's name keeps the whole width on a phone; then one line at small size with the last Confirmation, the stock and the warranty. The Confirmation is a word and its own mark: confirmed today in Confirmed Green with a circled tick, an older one in Note Grey with a clock, about to expire with the days left and expired with its days, both in Action Red at weight 500, with a warning triangle and a circled cross. In stock is in Confirmed Green, out of stock in Note Grey. A warranty that is not stated is left out. The row is not a link until an Offer can be opened. The owner chose it on 20 October 2026, over prices in plain Geist Mono at the end side and over smaller plates stacked there.
- **A Part missing specifications:** drawn as the Catalog's row, its picture, its name and one secondary line with its manufacturer, its Category and its count of Offers, then one line in Action Red after a circled exclamation mark that says what it lacks, "Lacks TDP, Memory types", by the needed specifications' labels. The whole row opens the Part's edit form, beside the list from 64rem, and saving returns to the list. The owner chose it on 20 October 2026 over rows grouped by Category with a mark for each missing specification and a plate for each count of Offers.
- **The picture:** a 40-pixel square on a Shelf ground with 6px corners, holding the Category's icon at 20 pixels, or the photo filling it. A Part's page shows it at 80 pixels.

### Plates

- **The plate** is the look's signature: Plate Amber figures in Geist Mono at 20 pixels, weight 700, tabular, on Plate Graphite, with 3.6-pixel corners and 8 pixels of padding each side, sized to its figure. Its words follow it on the page, in body text.
- **Where:** the count of Parts a search found, the count of Vendors, the count of Parts missing specifications, and the count of a Part's needed specifications that are not known: one in each pane. On the Vendor portal's Offers screen the count of the Vendor's Offers is the pane's count, inside its sentence, and each price of an Offer's row is on a plate of its own, as the Do's below ask.

### States

- **Empty:** centred on the page between two Rule Sand rules, with an icon on a 40-pixel Shelf square, a title at body size and weight 500, a sentence in Note Grey, and the action that helps, such as Create a Part. A list whose aim is to be empty says the work is done: the Missing specifications' empty list is "Nothing is missing", with a circled tick.
- **The expiry banner:** at the head of the Vendor portal's Offers screen, under its title and above the search, only while an Offer is expired or about to expire. A Sheet panel with an Action Red border and 6px corners: a warning triangle and a title in Action Red at body size and weight 500, then one sentence for each count that is not 0, the count in weight 600 and not on a plate, then a Note Grey sentence on what confirming means, then the pane's one primary button, "Confirm all my Offers", as wide as the panel on a phone. While it is on its way the button says so and waits; a refusal is said below it in Action Red. Once the API answers, one line in Confirmed Green at weight 500, with a double tick, says how many Offers were confirmed, and stays after the banner has left. The owner chose it on 20 October 2026, over the counts on plates and over a compact Shelf panel without a title, and its place under the title over a banner pinned to the bottom of the screen and over one below the search.
- **Refusal:** a Sheet panel with an Action Red border and text, its title saying what was not done and its sentence why, with the API's status and code kept in English.
- **Loading:** rows sketched in Shelf and Muted where the first answer will be. While the next answer arrives, the last stays at full strength, and a line beside the count says "Searching…".
- **Missing:** a specification the Part lacks reads "Not known" in Note Grey; a needed one reads "Needed, not known" in Action Red at weight 500, after a circled exclamation mark.

### Dialogs

- **The alert dialog** asks to confirm an action that logs a Vendor out, such as resetting its password or deactivating it, or that lets it back in, reactivating it. A refusal is said in it, in Action Red at small size above its buttons: what was not done, then why the API did not answer, as the Admin console says it everywhere. The dialog stays open to try again, and closes only when the action is done. It floats over a scrim that dims the page, on a Sheet ground with a Control Edge border, 6px corners and the soft shadow of what floats. On a phone it is as wide as the screen but for a 16-pixel gutter, and never wider than 28rem. Its title is at title size and weight 600, its sentence at body size in Note Grey, both on the start side; its buttons are 44 pixels high, stacked on a phone with the action on top, and in a row on the end side from 40rem, Cancel outlined before the action.
- **The action** that cannot be taken back without another, such as Deactivate, is drawn in Action Red, the one red of the pane, because it is what needs care. Reactivate, which logs nobody out, is drawn as the primary button.

### Deactivating a Vendor

- **On a Vendor's page**, after Reset the password: an outlined "Deactivate", which opens the alert dialog naming the Vendor as it writes it and saying what deactivating does; for a deactivated Vendor an outlined "Reactivate" in its place, whose alert dialog says that the Vendor logs in again with the password it had, and after it a ghost "Deactivate again", which opens the alert dialog too. While either action is on its way, its button says so and waits.
- **A deactivation that is refused**, or that failed halfway, is said in the alert dialog, as every refusal there is: that the Vendor was not deactivated in full, and why. The dialog stays open, so that the Admin deactivates again at once.
- **Deactivate again** finishes a deactivation that failed halfway after the Vendor was marked, and changes nothing otherwise. The page cannot tell such a Vendor from one deactivated in full, so every deactivated Vendor's page has it, quiet beside Reactivate, which is what that page is mostly for.
- **A reactivation that is refused** is said in its alert dialog, as every refusal there is: that the Vendor was not reactivated and is still deactivated, and why. The dialog stays open to try again.

### The hand-over

- **After a create:** the Vendor's name as the screen's title, one line that it is made, then the temporary password under its label, with a Note Grey sentence that it is shown this once.
- **After a reset:** on the Vendor's page, below its actions and above its details, one line that the password is reset and the Vendor logged out, then the temporary password and the hand-over drawn as after a create. A second reset replaces both.
- **The message's language:** three choices in a row, each the browser's own radio, 20 pixels, inside a 44-pixel box with a Control Edge border and 6px corners, labelled with the language's own name in its own script; the chosen one takes a Shelf ground and weight 600, as the Vendor portal's switch marks its language.
- **The link:** the pane's one primary button, "Open the chat in WhatsApp", with a speech-bubble mark before it and the new-tab mark after it.

### Navigation

- **The top bar:** the page's own ground, closed by a Rule Sand rule, with the console's name at weight 600 on the start side, and the caller's name in Note Grey and Log out on the end side.
- **The sections:** the Catalog, the Vendors and the Missing specifications, each a link 44 pixels high with 6px corners, in Note Grey, and the one the Admin is in at weight 600 on a Shelf ground. On a phone they are behind a 44-pixel menu button at the bar's start, which opens them as a column below the bar, closed by choosing one; from 64rem they sit in the bar after the console's name.
- **The Vendor portal's top bar:** the page's own ground, closed by a Rule Sand rule, with the Vendor's name, as it writes it, at weight 600 on the start side, then the outlined Log out and the language switch, the switch last, on the end side. On a phone the name shares its row with Log out and the switch has the row below, at the end; from 40rem the three share one row. A Login with no Vendor behind it, and a deactivated Vendor, each get the bar with the switch alone, then one plain sentence of its own and Log out below it.
- **The Vendor portal's sections:** Offers, its first screen, and Details, on a row of their own at the foot of its top bar, each a link 44 pixels high with 6px corners, in Note Grey, and the one the Vendor is in at weight 600 on a Shelf ground, as the Admin console's sections are. The plain messages have none. The owner chose them on 20 October 2026, over two tabs sharing the width with an Ink underline.
- **The band, while the Admin acts as a Vendor:** across the whole width, above the Vendor portal's top bar, on a Shelf ground closed by a Rule Sand rule, so that it is never taken for part of the Vendor's own portal. On the start side, one sentence at small size and weight 500 that names the Vendor, as it writes it, followed, for a deactivated Vendor, by one that says it is deactivated; on the end side, a small underlined link, 44 pixels high, back to the Vendor's page in the Admin console. Its content is as wide as the portal's, and the link takes the row below when the sentence fills the row. It is in the portal's language, because the Vendor may be reading over the Admin's shoulder. A Vendor's page in the Admin console opens it with an outlined button-sized link, "Open its portal", below the Vendor's name.
- **Back:** a small Note Grey link above a screen's title, with a chevron that points back in the reading direction, underlined on hover, 44 pixels high.

## Do's and Don'ts

### Do:

- **Do** put every price, the Platform Rate and every count that needs action on a plate, with the date it was last set or confirmed beside it.
- **Do** give every Offer state a word and its own mark: Visible, Expiring, Expired and Hidden.
- **Do** end every row that needs action with one line of plain words saying why.
- **Do** keep the Vendor portal as dense in Kurdish and Arabic as in English, laid out right to left.

### Don't:

- **Don't** put Plate Amber anywhere but on Plate Graphite, or make it glow.
- **Don't** use cards for lists, or shadows on anything that does not float.
- **Don't** add a second large plate to a screen.
- **Don't** shrink a control below 44 pixels.
- **Don't** reach for a cold, grey corporate console, the gaming look of neon and dark glows, or a generic template's cards and gradients.
