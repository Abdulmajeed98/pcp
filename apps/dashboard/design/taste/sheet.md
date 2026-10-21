# APP SHEET — Framed sheet

seed 616443693 · drawn 2026-10-21 · kind commerce · light
Brief: PC Part Pickers' dashboard, where the Admin keeps the PC parts catalog and each Erbil shop (Vendor) keeps its Offers' prices current in Kurdish, Arabic and English: keep the Rate Board, figures on plates from Erbil's money changers' boards, but only on prices and the rate, one leading plate per screen, units a quiet suffix with a proportional comma, each plate dated and muted when out of stock, and a plate that holds in both schemes on a low-chroma stone page; hard rules: WCAG 2.2 AA in both schemes with a switch between them, 44-pixel controls on a touchscreen and at least 36 under a mouse, no text under 14 pixels (15 in Kurdish and Arabic), 360 pixels first, right to left with logical properties, the Tall Script and No Capitals Rules, the fonts kept (Geist, Noto Sans Arabic, Geist Mono), Western digits

This is the style for this product. Adopt it whole and keep its move intact; everything the sheet does not fix comes from the
shared defaults in references/app-screens.md. Redraw only for a reason you can state (it contradicts the brand, or the product is
used in a way the style does not suit) and say why in your report. The values were measured on real product screens: use them
as given rather than rounding them towards your habits.

## 1. The style

The app chrome is one tinted L-shaped frame; the work sits on a white sheet with a hairline edge and soft corners, so depth comes from a single tone step and no shadow.

**The move:** One tinted frame holds the sidebar and the 48px top bar with no rule between them; the page is a white sheet inset 8px from the window's right and bottom edges, with a 1px edge, 16px corners and no shadow. The active tab is a 2px underline in ink or the accent; everything else in the chrome is grey.

**Colour budget:** under 3%; the brand shrinks to the logo and a 2px tab underline, the data carries the chroma.
**Off-style here:** a border between the sidebar and the top bar; a shadow under the sheet; cards whose border is heavier than the sheet's (#cdcfcf on cards read as heavy in the study); a fourth nesting level: frame, sheet and card are enough; different gutters for the KPI row and the chart row (20 against 24 was flagged).
Distilled from 6 screens: a developer platform overview, an analytics overview, an events analytics tab, a list detail, a reports dashboard, a flow builder. The study's second data hue in this style was an orange (#e88e46) that falls inside the house terracotta range; the third chart colour here is an amber moved out of that range and darkened to 3:1 on white.

**Its face.** Choose one of these (or one of your own of the same weight) before you build, write it in your notes next to
the screen's question, and check that it shows on the first screen. Without one the screen reads as a well-applied kit.

- The frame tinted from the product's colour in place of #f9fbfc: one low-chroma step of its hue (a green-grey for a climate or farm tool, a blue-grey for an observability tool, a stone for a print shop). The sheet stays white.
- The brand's own hue from the brief as --chart-1 in place of the dealt teal, on the main series and the one selected state, at 3:1 or more on white, never violet or indigo.
- IBM Plex Mono for IDs, keys and the figures in tables (one job): its figures have their own drawing, and a developer reads them as the product's.

## 2. Tokens

```css
:root {
  --ground: #f9fbfc;
  --surface: #ffffff;
  --raised: #f4f6f8;
  --active: #ebedee;
  --border: #e8eaec;
  --rule: #f0f1f2;
  --control: #cdced1;
  --text: #131416;
  --muted: #5d5f60;
  --accent: #1b6c80;
  --positive: #1e7b4f;
  --negative: #c4242a;
  --warning: #92400e;
  --chart-1: #1b6c80;
  --chart-2: #2f70bb;
  --chart-3: #a86f0c;
  --pill-positive-bg: #dcfae5;
  --pill-positive-ink: #04250e;
  --pill-negative-bg: #ffedea;
  --pill-negative-ink: #831c1e;
  --pill-warning-bg: #fffbeb;
  --pill-warning-ink: #92400e;
  --pill-neutral-bg: #ebedee;
  --pill-neutral-ink: #353736;
  --radius-card: 8px;
  --radius-control: 6px;
  --radius-sheet: 16px;
  --sheet-inset: 8px;
  --row-height: 48px;
  --sidebar-width: 228px;
  --gap: 24px;
  --pad: 24px;
  --control-height: 32px;
  --fs-title: 22px;
  --fs-section: 16px;
  --fs-kpi: 28px;
  --fs-body: 14px;
  --fs-small: 12px;
}
```

Density: medium. One gap value, horizontally and vertically. No shadow on anything at rest.

## 4. Shell — Tinted frame, white sheet

Sidebar and top bar share one tinted ground with no rule between them, forming an L; the page lives on a white sheet. Variant one: the sheet butts against the sidebar and the top bar and is inset 8px from the right and bottom edges, 16px radius, 1px edge. Variant two: a flush L-frame with no inset, the frame marked by one rule. Variant three: sidebar and content are two floating panels inset 12px from every edge with a 12px gutter. The top bar, when present, is 48px and holds a centred search, the account button and a help or AI icon. Inside the sheet the content has 24px padding and starts with the breadcrumb or title row.
Numbers: chrome #f6f6f6-#f9fbfc (a warm #f7f6f2 once); sheetInset 8px from the window's right and bottom edges (12 and 16 once each); sheetRadius 10-16, median 16; sheetEdge 1px #eaeaea-#ededed, no shadow; sidebarWidth 220-263 (228 on two screens); topBar 48px on the chrome ground with no rule; search 548x32 centred on the window with a shortcut hint; contentPadding 24; floatingVariant both panels inset 12px with a 12px gutter, radius 10.
On a phone: The frame disappears: the sheet becomes the screen, with a 48px top bar (menu button, title, one action) on the chrome tint. The search moves into the menu sheet or behind an icon.

## 5. Screens

### overview — KPIs as the chart's tabs

One card per subject, 8-16px apart: the main chart card runs full width, and any card holding a table of five columns or fewer, or a short list, pairs with its neighbour in two columns, the page header indented by the card padding so the title, the card titles, the numbers and the plot share one left edge. Balances that do not change during the day go first, in one container split by 1px dividers into equal columns; a zero balance is grey and its caption becomes the next step. In the main card, 2-4 KPIs sit in a row and act as the chart's series tabs: the selected one carries a 2px rule and an ink label, the others keep a grey label and their value in ink at a lighter weight (a grey value reads as disabled); when the tabs are the per-entity breakdown the brief asks for (takings by shop), nothing is greyed and the rule alone marks the selection. Choosing one swaps the series. Under them, one line chart as wide as the card's content (about 1136x220 in the study): 3-4 solid 1px gridlines, 4-6 round y ticks at 12px, a 2-3px line in ink with straight segments and no fill, an 8px hover dot with a 1px dashed guide and the line after the cursor in pale grey. Close with a 2-3 row comparison table on a 36px pitch, value and change columns right-aligned under a 14px grey header such as 'vs prior Monday'.
On a phone: KPI tabs become a 2-up grid above the chart, with the selected cell marked by a fill (never an underline floating inside the grid) or a row of tabs that scrolls sideways; the chart is full width, 160-200px tall, with 4 x labels; the comparison table keeps its two right-aligned columns.

### list — Table with tabs and a filter bar

Title row: an 18-24px title on the left, at most an outlined secondary and the one primary (36px) on the right. Underline tabs for the list's states on a full-width 1px rule with a 2px indicator as wide as the label; 22-32px below, the toolbar: a search of about 252-316 x 32-36 on the left, the count ('7 events') and the sort on the right. The table sits on the panel or page ground with no card around it: a header of 12-13px grey sentence-case labels with no fill and no rule, rows on a 48-56px pitch for one line or 72-92px with a thumbnail (media height plus 24-32px), 1px rules 3-7% darker than the ground or no rules at all, the identity column given the most width, numbers right-aligned in tabular figures with the unit muted ('5 /10'), one status mark per row and one kebab at the far right. Drop a column that is empty in every row (a blank co-host column left a 300px dead band). On an overview, cap the rows and link to the full list; on the full list, state the total and load more at the end.
On a phone: Rows become two-line items: identity and the key number on line 1, the secondary fields in 13px grey on line 2, the kebab at the right. Tabs scroll in their own row; the search becomes a full-width field.

### detail — Object header and a six-column grid

The page header is the object itself: one card (88px, 14px padding) holding a 50x62 cover, the 18/600 name with 28px icon buttons beside it (open, copy, share), a 13px grey meta line (date, time, place) and outlined 36px actions on the right. Under it, underline tabs on a full-width 1px rule, then a 36px row with a segmented time range on the left and a refresh button on the right. The body is one 6-column grid with one gutter (14px) in both directions whose spans change by row while every edge lands on the same lines: 3 KPI tiles of 2 columns, the main chart in 4 columns beside a side chart in 2, two progress cards of 3, a full-width trend of 6. Give the widest card to the screen's question, and do not give 824px to one ring and one legend row (flagged).
On a phone: The header card keeps cover, name and meta, with actions in a kebab; every grid item takes the full width in the same order.

## 6. Always

Real data for this product, written before the markup: names, amounts that add up, dates in order, units on every figure,
honest zeros and dashes. One chart answers one question. No gradients, glows, glass, icons in tinted squares, sparklines on KPIs,
rainbow charts, emoji, lorem or Acme. `<skill>/assets/app.css` and `<skill>/assets/charts.js` are a neutral start set to these
rules. Check with `node <skill>/scripts/lint.mjs <files>` and `node <skill>/scripts/inspect.mjs <page>`: this sheet switches both
to app rules.

Saved to /Users/ryu/workspace/pc-part-pickers/.taste-skill/direction.json · reprint with `node draw.mjs --show`
