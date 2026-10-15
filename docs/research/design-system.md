# How should the platform look, and which accessibility standard should it meet?

Researched on 15 October 2026 for ticket 10 of the `catalog` module, before the platform's first real page, the Admin console's Catalog, is built. The Shopper app is Next.js, the dashboard is a React single-page application, and both are styled with Tailwind CSS 4.3 from the theme in the `ui` library. shadcn/ui is chosen but not yet set up. `languages` decided that no font is downloaded, that the layout uses logical classes, and that an icon pointing along the reading direction is mirrored.

Every claim below cites the source that owns it. Paragraphs headed "Reading" are this document's own analysis, not something a source says. The platform's name, a logo and the rest of its brand identity are not researched here: the name is still open.

The research recommends, and the owner chooses. Each section ends with the owner's choice and its date.

## Summary

| Question | Recommendation | The owner's choice, 15 October 2026 |
|---|---|---|
| Accessibility standard | WCAG 2.2 level AA on every screen, checked by axe-core in `pnpm platform:check` | As recommended, and Oxlint's `jsx-a11y` plugin in `pnpm check` too |
| Type | The device's own fonts, at weights 400 and 700, with Kurdish and Arabic set a step larger and looser | Downloaded fonts, the most elegant for all three languages, chosen with each app's look |
| Colour | A light scheme only for now. The palette is chosen in Impeccable's direction round | A light and a dark scheme from the start, following the device |
| Spacing, sizes and controls | Tailwind's 4-pixel steps, 16-pixel body text, nothing under 14 pixels, controls at least 44 by 44 pixels | As recommended |
| Right to left | Apple's rules for what flips and what does not | As recommended |
| The two kinds of screen | One system. The dashboard packs more into a screen, and its controls shrink only under a mouse | Two designs, after a second search: each app has its own shadcn/ui style, components and look |
| shadcn/ui | Base UI, its default. Its tokens are kept, and the colours that fail WCAG are replaced | Base UI, as recommended |

## 1. The accessibility standard

### What the standards say

- WCAG 2.2 was first published as a W3C Recommendation on 5 October 2023. The current version is dated 12 December 2024. [1]
- It is also an ISO standard, ISO/IEC 40500:2025. The W3C announced this on 21 October 2025 and said that it "enables more countries to formally adopt WCAG 2.2." [2]
- The European standard for accessible ICT, EN 301 549, was updated to version 4.1.1 in September 2026, and adopts WCAG 2.2 in place of WCAG 2.1. It is not yet cited in the Official Journal, so the legal reference under the European Accessibility Act is still version 3.2.1, which is tied to WCAG 2.1 level AA. [3]
- WCAG 3.0 is a Working Draft, last published on 3 March 2026. [4]
- WCAG 2.2 adds six success criteria to WCAG 2.1: 2.5.7 Dragging Movements, 2.5.8 Target Size (Minimum), 3.2.6 Consistent Help, 3.3.7 Redundant Entry, 3.3.8 Accessible Authentication (Minimum) and 3.3.9 Accessible Authentication (Enhanced). It removes 4.1.1 Parsing as obsolete. [1]
- Level AAA is not meant for a whole site: "It is not recommended that Level AAA conformance be required as a general policy for entire sites because it is not possible to satisfy all Level AAA success criteria for some content." [1]

The level AA criteria that shape this platform's design most:

- **1.4.3 Contrast (Minimum):** text has "a contrast ratio of at least 4.5:1", and large-scale text 3:1. Large scale is "at least 18 point or 14 point bold", roughly 1.5 and 1.2 times the default body size. [1]
- **1.4.11 Non-text Contrast:** "Visual information required to identify user interface components and states" has a contrast ratio of at least 3:1 against adjacent colours. [1] A text input's border must meet it when it is the only visual cue to where the input is, and a focus indicator must meet it against the adjacent background. [5]
- **1.4.1 Use of Color (level A):** colour is not "the only visual means of conveying information". [1]
- **1.4.4 Resize Text:** text can be resized "up to 200 percent without loss of content or functionality." [1]
- **1.4.10 Reflow:** content can be read without scrolling in two directions "at a width equivalent to 320 CSS pixels". [1]
- **2.5.8 Target Size (Minimum):** targets are "at least 24 by 24 CSS pixels", with exceptions for spacing, an equivalent control, targets inside a sentence, and targets the browser draws. Level AAA's 2.5.5 asks for 44 by 44. [1]
- **2.4.7 Focus Visible** and **2.4.11 Focus Not Obscured (Minimum):** the keyboard focus is visible, and a focused control is "not entirely hidden due to author-created content." [1]
- **3.1.1 Language of Page** and **3.1.2 Language of Parts:** the language of the page, and of each passage in another language, can be determined by a program. [1]
- **3.3.8 Accessible Authentication (Minimum):** no step of a login requires "a cognitive function test (such as remembering a password or solving a puzzle)" unless a mechanism assists with it. [1]

Reading: no law makes the platform meet a standard today, because none of the laws above reaches a website in Erbil. A standard is still the only way to say what "accessible" means here and to check it. WCAG 2.2 level AA is the current W3C and ISO standard and the one the EU's standard has just moved to, and WCAG 2.1 is a subset of it, so choosing 2.2 loses nothing that 2.1 would give. The platform already meets several of its criteria by design: 3.1.1 and 3.1.2 through the language and direction set on every page and `ui`'s always-English mark; 3.3.8 because Keycloak's login is an ordinary form that a password manager can fill. 1.4.10's 320 pixels is narrower than the platform's own 360-pixel rule, so a screen designed at 360 must also not scroll sideways at 320.

### What a tool can check

- axe-core is Deque's open-source rules engine, under the Mozilla Public License 2.0. Its rules cover "WCAG 2.0, 2.1, 2.2 on level A, AA and AAA as well as a number of best practices", it can find "on average 57% of WCAG issues automatically", and it aims to return "zero false positives". What it cannot decide it returns as "incomplete", for a person to review. [6]
- The 57% comes from Deque's own study of over 2,000 audits, and counts issues found, not success criteria covered. Deque notes that the usual estimate, by criteria, is 20 to 30 percent. [8]
- Its rules carry WCAG tags. `color-contrast` is tagged `wcag2aa` and `wcag143`. `html-has-lang`, `html-lang-valid` and `valid-lang` check 3.1.1 and 3.1.2. `label`, `button-name`, `link-name` and `image-alt` check names and text alternatives. `target-size` is tagged `wcag22aa` and is off by default, because the WCAG 2.2 rules stay off until 2.2 is more widely required. [7]
- Playwright's documentation recommends `@axe-core/playwright` for accessibility testing, and shows a scan limited to WCAG tags whose violations are expected to be empty. It warns that "many accessibility problems can only be discovered through manual testing", and that excluding an element skips every rule on it and its descendants. [9]
- Oxlint, this repository's only linter, has a built-in `jsx-a11y` plugin, based on eslint-plugin-jsx-a11y, which is off by default. [10] It checks the source code, so it runs in `pnpm check` without a browser or Docker.
- Weekly downloads on npm, 6 to 12 October 2026: `axe-core` 79.7 million, `@axe-core/playwright` 14.3 million, `lighthouse` 5.4 million, `pa11y` 0.26 million, and `eslint-plugin-jsx-a11y` 50.2 million. [11]

Reading: axe-core is the most widely used tool by a wide margin, and Lighthouse's accessibility audit is built on it. Through `@axe-core/playwright` it runs in the end-to-end tests that `pnpm platform:check` already runs, against the page as the browser draws it, so it can measure contrast. A scan with the tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa` checks the automatable part of WCAG 2.2 AA. Whether naming `wcag22aa` turns `target-size` on, or the rule has to be enabled by name, is to be seen when the scan is first set up, by a planted fault. Tickets 11 and 14 already plan to add the scan as a helper.

What no tool here checks, and so is checked by hand against DESIGN.md: non-text contrast (1.4.11), colour as the only signal (1.4.1), whether the keyboard reaches everything in a sensible order and the focus is always visible (2.1.1, 2.4.3, 2.4.7), resizing to 200% (1.4.4), and whether the words make sense.

### Recommendation

WCAG 2.2 level AA, for every screen of the Shopper pages, the Vendor portal and the Admin console. axe-core through `@axe-core/playwright`, with the five tags above, in `pnpm platform:check`. Also turn on Oxlint's `jsx-a11y` plugin, so that `pnpm check` catches the mistakes visible in the code, such as a control with no name, without Docker.

### The owner's choice

15 October 2026: WCAG 2.2 level AA, checked by axe-core in `pnpm platform:check` and by Oxlint's `jsx-a11y` plugin in `pnpm check`, as recommended.

## 2. Type

### What the devices have

- Android's font configuration draws Arabic script, which Kurdish (Sorani) is written in, with Noto Naskh Arabic. It has a "compact" variant, Noto Naskh Arabic UI, and both come in two weights only, 400 and 700. Latin text is drawn with Roboto, a variable font with weights 100 to 900. The file also says that device makers add their own font configuration. [12]
- In Iraq in September 2026, 86.34% of mobile browsing was on Android and 13.64% on iOS. [14] The largest makers were Honor (16%), Infinix (15.06%), Samsung (13.66%), Apple (13.64%), Tecno (13.07%) and Xiaomi (10.09%). [13]
- Tailwind's default `font-sans` is the device's own stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif`, followed by emoji fonts. [26]

Reading: on a stock Android phone a Kurdish or Arabic page is drawn in Noto Naskh Arabic UI, which is designed for interfaces. Four of the six largest makers in Iraq (Honor, Infinix, Tecno and Xiaomi) ship their own Android skins, and which Arabic font each puts first is not documented in any source found. The Sorani letters ڕ, ڵ, ێ, ۆ and ە are all in Unicode's basic Arabic block, which Noto Naskh Arabic covers. `languages` asked for them to be checked on the owner's phone. Unless the owner's phone is an Android phone from one of the makers with their own skin, the check needs one of those as well.

### What a downloaded font would cost

Measured on 15 October 2026 through the Google Fonts CSS API, as Chrome on Android receives it (WOFF2), for the Arabic subset that covers Sorani's letters. [15]

| Font | Arabic subset | Its Latin subset | Weights |
|---|---|---|---|
| IBM Plex Sans Arabic | 32.7 KiB for each weight | 13.6 KiB for each weight | one file for each weight |
| Vazirmatn | 45.2 KiB | 33.6 KiB | one variable file for all weights |
| Noto Naskh Arabic | 91.8 KiB | 19.3 KiB | one variable file |
| Noto Kufi Arabic | 120.9 KiB | 30.0 KiB | one variable file |
| Noto Sans Arabic | 162.3 KiB | 30.6 KiB | one variable file |

- Lighthouse tests a mobile page on its "Slow 4G" profile: 150 ms of latency and 1.6 Mbps down. [16] At that speed the files above take between 0.17 and 0.83 seconds for the Arabic subset alone, before latency.
- web.dev: "Web fonts are still a performance bottleneck." Without `font-display`, Chromium and Firefox hide text for up to 3 seconds while a font loads. `font-display: swap` shows text at once in another font and swaps it later, which can shift the layout. `font-display: optional` delays text by no more than 100 ms and skips a font that arrives late, so it never shifts the layout. [17]

Reading: a downloaded font would give every phone the same letter shapes, which the device's own fonts do not, given the skins above. The cost falls on the first visit, which for most Shoppers is a link opened from WhatsApp, on mobile data. With `font-display: optional` on a weak connection, the first visit would show the device's font anyway, so a downloaded font only helps on later visits and on faster connections. Weights other than 400 and 700 are the strongest reason to download one: without them the platform has two weights in Kurdish and Arabic.

### Kurdish and Arabic need more room

- Google's Material classes Arabic as a "tall" script, one that needs "extra line height to accommodate larger glyphs". Flutter's Material text styles make tall scripts one unit larger than English for every style smaller than the title style. [18]
- Apple: Arabic text "can appear too small when next to uppercased Latin text, because Arabic and Hebrew don't include uppercase letters", and increasing it by "about 2 points" often balances it. [19]

### Recommendation

Keep the device's own fonts, and download none. Use weights 400 and 700 only, because those are the two Android has for Arabic script. Set Kurdish and Arabic text one pixel larger than English at every size below a heading, with a looser line height. Avoid capitals and letter spacing for emphasis, because Arabic script has neither. Check the Sorani letters by hand on the owner's phone and on an Android phone from Honor, Infinix, Tecno or Xiaomi.

### The owner's choice

15 October 2026: the owner chose downloaded fonts instead, "the most elegant fonts for the apps for all the three languages". The fonts are chosen with each app's look, and their cost is recorded with them. The rest of the recommendation stands where it does not depend on the device's fonts: Kurdish and Arabic a step larger and looser, and no capitals or letter spacing for emphasis.

### Which fonts can draw Sorani

Google Fonts lists 57 families with an Arabic subset. [42] Its CSS API gives every family's Arabic subset the same `unicode-range`, so that range says nothing about which letters a family has. Each family's own character map was therefore read, from a subset of the family holding only Sorani's letters ڕ ڵ ێ ۆ ە ھ ڤ پ چ ژ گ ک ی, on 15 October 2026. [15]

- **Have every one of them:** Noto Sans Arabic (and its UI variant), Noto Naskh Arabic, Noto Kufi Arabic, IBM Plex Sans Arabic, Vazirmatn, Amiri, Scheherazade New, Lateef, Harmattan, Mirza, Parastoo, Mada, Fustat, Zain, Beiruti, Estedad, Reem Kufi and Kufam.
- **Lack some, mostly ڕ ڵ ێ ۆ and ە:** Cairo, Tajawal, Almarai, Readex Pro, El Messiri, Alexandria, Changa, Markazi Text, Rubik, Ruwudu, Alan Sans, Alyamama, Baloo Bhaijaan 2 and Handjet.

Reading: several of the most popular Arabic families on Google Fonts, Cairo, Tajawal and Almarai among them, cannot draw Kurdish. A Kurdish page set in one of them would draw those letters in another font, mid-word. Every family considered for this platform must be on the first list.

## 3. Colour

### What the palette must meet

Under WCAG 2.2 AA (section 1): 4.5:1 for text and 3:1 for large text; 3:1 for the borders that show where a control is, for focus indicators and for the marks that show a state; and no state shown by colour alone. [1] [5] Android's own guidance gives the same 4.5:1 and 3:1 thresholds. [21]

This platform has states that must stay apart without colour: in stock and not in stock, a Compatibility Problem, a Compatibility Warning, an unchecked rule, a Converted Price, and an Offer near expiry. Each needs a word or a mark as well as its colour.

### A dark scheme

- `prefers-color-scheme` tells a page which scheme the device is set to, and the `color-scheme` property and its meta tag tell the browser which schemes the page supports, so that its form controls, scroll bars and background match before the stylesheet arrives. [25]
- Chrome on Android has tested an automatic dark theme for light pages when the device is set to dark. A page opts out with `color-scheme: only light`. [24]
- shadcn/ui writes every colour twice, once for light and once in a `.dark` class. [30]

Reading: a dark scheme doubles the colours to choose and to check. axe-core checks the scheme the browser is in, so every scan would run twice. The Admin works in shops, in daylight. A Shopper browsing at night would welcome one. Because shadcn/ui's tokens are already pairs, a dark scheme can be added later without changing any component, which makes waiting cheap.

### The palette

The palette itself, with the rest of the platform's look, is chosen in Impeccable's direction round, which this research ends with. Whatever is chosen is measured against the thresholds above before it is recorded.

### Recommendation

A light scheme only, declared with `color-scheme: light`. A dark scheme is a later feature of its own.

### The owner's choice

15 October 2026: a light and a dark scheme from the start, each following the device's setting through `prefers-color-scheme`. Every colour pair is chosen and measured in both, and the automated scan runs in both.

## 4. Spacing, sizes and controls

### What the sources say

- Tailwind's spacing and sizing utilities all derive from one value, `--spacing: 0.25rem`, which is 4 pixels at the default text size. Its text sizes start at `text-xs` (0.75rem, 12 pixels) and `text-sm` (0.875rem), with `text-base` at 1rem and a line height of 1.5. [26]
- Apple: the default text size on iOS is 17 points and the minimum 11 points. A control's default size is 44 by 44 points and its minimum 28 by 28. [20]
- Android: "each interactive UI element have a focusable area, or touch target size, of at least 48dp x 48dp. Larger is even better." For a mouse or a trackpad, "the touch target can be smaller." [21]
- WCAG 2.2: 24 by 24 CSS pixels at level AA, 44 by 44 at level AAA. [1]
- Tailwind has `pointer-coarse` and `pointer-fine` variants, for a touchscreen and for a mouse, "useful for providing larger click targets on touch devices". [27] The `pointer` media query reports the primary pointing device, and has worked in every major browser since December 2018. [28]

### Recommendation

- **Spacing:** Tailwind's 4-pixel steps, using 4, 8, 12, 16, 24, 32 and 48 pixels for the rhythm of a page.
- **Type:** 16-pixel body text, set in `rem` so that the browser's text size setting scales it (1.4.4). The scale is Tailwind's from `text-sm` (14 pixels) to `text-3xl` (30 pixels). Nothing is smaller than 14 pixels, so `text-xs` is not used.
- **Controls:** anything tapped is at least 44 by 44 pixels, which meets WCAG 2.2's level AAA criterion, Apple's default and nearly Android's 48. Inputs and buttons are 44 pixels high.
- **Width:** every screen is designed at 360 pixels wide and must not scroll sideways at 320 (1.4.10).

### The owner's choice

15 October 2026: as recommended, with controls at least 44 by 44 pixels.

## 5. Right to left

`languages` recorded that an icon pointing along the reading direction is mirrored and one that does not point is left alone. The sources say more.

- W3C: the direction is set in the HTML, never with CSS, and a style sheet written with "start" and "end" rather than "left" and "right" mirrors the layout by itself. Text whose direction is unknown, such as what a user wrote, is marked with `dir="auto"` or `bdi`. [23]
- Apple's guidelines, which give the fullest list of the sources read: [19]
  - "Don't reverse the order of numerals in a specific number", such as a price or a phone number.
  - "Flip controls that show progress from one value to another", such as sliders and progress indicators, and controls that "navigate or access items in a fixed order", such as back, next and previous.
  - "Preserve the direction of a control that refers to an actual direction or points to an onscreen area."
  - "Avoid flipping images like photographs, illustrations, and general artwork", but reverse the order of images when the order means something.
  - "Flip interface icons that represent text or reading direction", and icons that show forward or backward motion.
  - "Don't flip logos or universal signs and marks", such as the checkmark, and avoid flipping icons of real-world objects, such as a clock.
  - Align one- and two-line text with the page, but a paragraph of three or more lines with its own language. Align every item of a list the same way, including items in another script.
- Android: drawables mirror with `autoMirrored` when the mirror image means the same; when it would change the meaning, "check with a bidirectional expert". [22] Android points to Material's bidirectionality guidelines for the full list. That page no longer shows its text, so it is not cited here.
- shadcn/ui's command rewrites physical classes as logical ones when `rtl` is on in `components.json`, turns `slide-in-from-right` into `slide-in-from-end`, and flips the icons it knows with `rtl:rotate-180`. Calendar, Pagination and Sidebar are converted by hand. Logical slide animations from `tw-animate-css` have a known fault, avoided by giving pop-up content a `dir`. [31]

### Recommendation

Adopt Apple's rules as the platform's, applied to its own content:

- **Mirrors:** the whole layout; back, next and previous; chevrons in breadcrumbs and in rows that open; progress and sliders; the order of a table's columns; any sequence whose order means something.
- **Does not mirror:** numbers, prices and part numbers; the Category icons, which are objects; a Part's photo; the checkmark and other universal marks; a control that means an actual side of the screen.
- **Alignment:** short text follows the page. A paragraph of three or more lines that a Vendor wrote follows its own language, which `AsWritten` already gives it. A list aligns every item the same way, so English Part names in a Kurdish list are aligned right.
- **Mixed text:** a number with its unit or currency, a Part name and a specification stay one left-to-right unit inside a Kurdish or Arabic sentence, through `AlwaysEnglish`. A Converted Price's "≈" is inside that unit.

### The owner's choice

15 October 2026: Apple's rules, as recommended.

## 6. The two kinds of screen

- IBM's Carbon design system has two sets of type styles: "productive", condensed, for product interfaces where users focus on tasks, and "expressive", for editorial and marketing pages, which "would be distracting if used in product". Its productive headings keep a fixed size, and its expressive headings change size with the screen. [29]
- shadcn/ui's visual styles are set once, when the project is set up: Vega is "the classic shadcn/ui look", Nova has "reduced padding and margins for compact layouts", Mira is "made for dense interfaces", Rhea is "a more compact Luma" with "smaller controls". [32] The style "cannot be changed after initialization". [34]
- A monorepo has one `ui` package holding the components, and every app's `components.json` must name the same style, icon library and base colour. [35]

Reading: the Admin console and the Vendor portal are working screens, read many times a day: lists of Parts and Offers, and forms. The Shopper's pages are read less often and must explain. In Carbon's terms, the dashboard is productive and the Shopper app sits between the two: it is a working product too, not a marketing page. Because both frontends take their components from the one `ui` library, they share one shadcn/ui style. Two looks would need two sets of components. The difference between the screens is therefore in how they are laid out, not in their parts. On a phone, the Admin and a Vendor tap as a Shopper does, so their controls cannot be smaller. Only under a mouse can they shrink.

### Recommendation

One system, with the same tokens and components everywhere.

- **The Shopper's pages** use more space between groups, one main column, and explain with words beside each state.
- **The Admin console and the Vendor portal** put more on a screen: rows rather than cards, secondary text at 14 pixels, tighter rhythm between rows, and a table on a wide screen where a phone gets a list.
- **Controls** stay at 44 pixels on a touchscreen everywhere. Under a mouse (`pointer-fine`), a dense table's controls may shrink to 32 pixels, still above WCAG 2.2 AA's 24.

### A second search: a design for each app

The owner chose the recommendation above, then asked whether the Shopper app and the dashboard could each have a design of its own, "tailored to them", and had this searched.

- Adobe's React Spectrum: themes are "variable definitions for light and dark color schemes, along with medium and large platform scales." The large scale "increases the size of most components so that they have larger hit targets", and React Spectrum "automatically switches between scales" by the device's pointer. "Themes can also be nested to allow different parts of an application to adopt a different appearance." [37]
- IBM's Carbon builds its themes on tokens: "Altering one, some, or all of the default token values will result in a new theme." [38]
- Shopify keeps two systems apart. Polaris exists so that an app "looks and feels native to the Shopify admin". [39] A storefront has a theme of its own, which "controls the organization, features, and style of a merchant's online store." [40]
- The Design Tokens Community Group published the first stable version of its format on 28 October 2025, to "manage light/dark modes, accessibility variants, and brand themes without file duplication." [41]
- shadcn/ui's documented monorepo has one `ui` package for the components, and every app's `components.json` names the same style. [35] The style is fixed when a set of components is created. [34] Two styles therefore need two sets of components, each with its own `components.json`. No source found describes that set-up.

Reading: two ways give each app its own look. In the first, as Spectrum and Carbon do, both apps share one set of components and each sets its own values for the tokens: its palette, typefaces, radius, shadows and density. shadcn/ui keeps those values as plain CSS variables, so each app's stylesheet can set its own. In the second, as Shopify does, each app has its own components too, so a button can differ in shape and spacing as well as colour. The second costs every component twice, and the Vendor portal shares the dashboard's.

### The owner's choice

15 October 2026, after the second search: two designs, each with its own set of components. The Shopper app and the dashboard each have their own shadcn/ui style, their own components and their own look, chosen in a direction round of their own. The Admin console and the Vendor portal share the dashboard's. What both share stays in `ui`: the accessibility standard, the sizes, the right-to-left rules, and the components that carry no look, such as `AlwaysEnglish` and `AsWritten`.

The owner named the products each should sit alongside, after seeing them: Nothing for the Shopper app, for how completely its look is its own, and Linear for the dashboard. They also named what would make a polished result feel wrong: a generic template look, a cold and corporate look, the neon of gaming hardware, and the repetitive patterns of AI-made interfaces.

## 7. shadcn/ui

### How its theme works

- Its theme is a set of CSS variables in pairs: a surface (`background`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`) and its `-foreground`, plus `border`, `input`, `ring`, five `chart` colours, eight `sidebar` colours and `--radius`. Light values are on `:root` and dark ones on `.dark`. [30]
- Tailwind reads them through an `@theme inline` block of the form `--color-primary: var(--primary)`. A new colour, such as `--warning`, is added the same way. The radius scale derives from one `--radius`, 0.625rem by default: `radius-sm` is 0.6 times it and `radius-xl` 1.4 times. [30]
- Its base colours are Neutral, Stone, Zinc, Mauve, Olive, Mist and Taupe. [30] The base colour, the style and whether it uses CSS variables cannot be changed after the project is set up. [34]
- In July 2026 Base UI became its default component library. Radix "is not being deprecated", and every component ships for both "unless a component exists only in Base UI". [32] Base UI is made "from the creators of Radix, Material UI, and Floating UI", and its makers say "Accessibility is our primary focus". [36] Set-up also offers React Aria. [33]
- Its visual styles are Vega, Nova, Maia, Lyra and Mira, from December 2025, and Luma, Sera and Rhea, from 2026. Set-up with `--defaults` uses the Nova preset. [32] [33]
- Weekly downloads on npm, 6 to 12 October 2026: `@base-ui/react` 17.4 million and `radix-ui`, Radix's single package, 17.1 million. Radix's separate packages are used far more widely: `@radix-ui/react-dialog` alone had 73.5 million. `react-aria-components` had 4.9 million. [11]

### Its default colours against WCAG

Measured on 15 October 2026 from the light values on shadcn/ui's theming page [30], converted from OKLCH to sRGB and compared with WCAG's formula [1]:

| Pair | Ratio | Needed | Passes |
|---|---|---|---|
| `border` and `input` (#e5e5e5) on `background` (white) | 1.26:1 | 3:1 where the border alone shows the control | no |
| `ring` (#a1a1a1) on white, the focus indicator | 2.58:1 | 3:1 | no |
| `muted-foreground` (#737373) on white | 4.74:1 | 4.5:1 | yes |
| `muted-foreground` on `muted` (#f5f5f5) | 4.35:1 | 4.5:1 | no |
| `destructive` (#e7000b) on white | 4.77:1 | 4.5:1 | yes |
| `foreground` (#0a0a0a) on white | 19.80:1 | 4.5:1 | yes |

Reading: axe-core measures text contrast but not borders or focus rings, so the two failures above would pass `pnpm platform:check` unnoticed. The fix belongs in the tokens, where every component reads it.

### Recommendation

- **Component library:** Base UI, shadcn/ui's default, made by Radix's original authors. Its single package is now downloaded as often as Radix's, though Radix's older separate packages are still used about four times as widely. Choosing Radix would keep shadcn/ui's full support, with the risk that a later component exists only for Base UI.
- **Style, base colour and radius:** chosen with the palette in the direction round, because they are part of the look.
- **Kept:** the token names and their pairs, the `@theme inline` mapping, the radius scale from one `--radius`, the right-to-left setting, and lucide's icons.
- **Changed:** `input` to at least 3:1 against the surfaces it sits on, for every control whose border is the only sign of where it is, while `border` stays a light rule for lines that only divide, which WCAG does not hold to 3:1 [5]; `ring` to at least 3:1, drawn at full strength; `muted-foreground` to at least 4.5:1 on `muted` too; controls to 44 pixels high on a touchscreen; the `.dark` values left out while the scheme is light only.
- **Added:** tokens for the platform's own states, each a pair: success and warning, beside `destructive`. An unchecked rule needs no colour of its own: it is drawn in `muted-foreground` with its own mark and the words "not checked", since colour alone may not carry it.
- **Left unused until needed:** `chart` and `sidebar`.

### The owner's choice

15 October 2026: Base UI, as recommended, for both sets of components. Each app's style, base colour and radius come with its look. The dark values are kept, since both schemes are built. They switch with the device's setting, through `prefers-color-scheme`, rather than with shadcn/ui's `.dark` class, so that a page arrives in the right scheme with no script; Tailwind's own `dark:` variant follows the same setting [27], and the components' `dark:` classes keep working as long as the set-up does not replace it with a class.

## 8. The two looks

Each app's look was chosen on 15 October 2026 in a direction round of Impeccable's, which deals visual directions drawn from the audience's world and from a catalogue of challengers, and in which the owner kept, swapped or re-rolled each hand. Every direction lends a working screen four things only: its palette, its type, its density and one signature move. The navigation and the controls stay the ordinary ones of the web.

The fonts were then chosen from specimens setting the same Kurdish, Arabic and English content in four pairings each, all of them from the first list in section 2. The shadcn/ui styles were chosen after comparing them on shadcn/ui's own page.

The pairings shown, with what a Kurdish page would download of each, measured from Google Fonts [15], and each family's rank on Google Fonts by popularity, where 1 is the most used of its 1,950 families [42]:

| | Pairing | A Kurdish page | Ranks |
|---|---|---|---|
| Shopper A | Fustat | 56 KiB | 392 |
| **Shopper B, chosen** | **Noto Kufi Arabic with Archivo** | **209 KiB** | **161 and 33** |
| Shopper C | Beiruti | 98 KiB | 1,022 |
| Shopper D | Noto Naskh Arabic with Schibsted Grotesk | 138 KiB | 183 and 69 |
| Dashboard A | Vazirmatn, figures in Sofia Sans Condensed | 119 KiB | 234 and 251 |
| **Dashboard B, chosen** | **Geist with Noto Sans Arabic, figures in Geist Mono** | **214 KiB** | **61, 108 and 94** |
| Dashboard C | Mada, figures in Big Shoulders | 110 KiB | 379 and 425 |
| Dashboard D | Zain, figures in Antonio | 83 KiB | 639 and 223 |

Noto Sans Arabic is the most used family on Google Fonts that can draw Sorani: the two Arabic-script families ranked above it, Rubik and Cairo, cannot (section 2). Both chosen pairings were the heaviest of their four.

How the fonts are served was weighed too (ADR-0006). Fontsource packages open-source fonts "into individual NPM packages for self-hosting", which removes the connection to a third-party server and keeps each font at a fixed version [43]. Its packages split each font by script, with a `unicode-range` for each file, and set `font-display: swap`, as their CSS shows. Weekly downloads on npm, 6 to 12 October 2026: `@fontsource-variable/geist` 3.3 million, `@fontsource-variable/geist-mono` 2.2 million, `@fontsource-variable/archivo` 0.43 million, `@fontsource-variable/noto-sans-arabic` 0.11 million and `@fontsource-variable/noto-kufi-arabic` 6,800. Next's own font loader is part of Next and Google's font servers are not packages, so neither has a count that compares.

| | The Shopper app | The dashboard |
|---|---|---|
| The look | **Fit Diagram**: the platform draws how Parts fit, the way a motherboard manual does, and every check is a numbered callout on the drawing | **Rate Board**: the numbers a Vendor and the Admin keep are set like a money changer's board, plain figures on dark plates, refreshed by hand and dated |
| How it was chosen | The owner's pick over the roll, Dot Display, and a challenger, Build Line Map | The owner's pick in a second hand, after re-rolling the first |
| Palette | Manual paper and print black, manual blue for fit lines, callouts and the primary action, red only for a Compatibility Problem | A warm, quiet page and ink, red for what needs action, amber figures only on the dark plates |
| Text faces | Archivo, with its width axis, and Noto Kufi Arabic | Geist and Noto Sans Arabic |
| Figures | The text faces | Geist Mono, on the plates |
| shadcn/ui style | Lyra: "Boxy and sharp. Pairs well with mono fonts." [32] | Mira: "Compact. Made for dense interfaces." [32] |
| Corners | Square | 6 pixels |
| A page with Arabic script on it downloads | 214 KB: Noto Kufi Arabic's Arabic file (124 KB) and Archivo's Latin file (90 KB) | 218 KB: Noto Sans Arabic's Arabic file (166 KB), Geist (29 KB) and Geist Mono (23 KB) |
| A page with none downloads | 90 KB | 52 KB |

The download sizes are of the self-hosted files, measured in the built apps on 15 October 2026. A page downloads the Arabic file as soon as it shows one word in Arabic script, and every Shopper page does: its language switch names Kurdish and Arabic in their own script, "کوردی" and "العربية". So every Shopper page downloads about 214 KB of fonts on the first visit, in English too, about 1.1 seconds at Lighthouse's Slow 4G, and none after [16]. Only an English page with no Arabic script on it, such as the Admin console's, downloads the smaller amount.

Every colour pair of both looks was measured in both schemes against WCAG 2.2 AA before it was written, and again from the theme files after: no pair fails. The closest are the Shopper app's warning colour with white text, at 4.59:1, and the dashboard's warning colour on its page, at 4.93:1.

## Sources

1. W3C, [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/), W3C Recommendation, 12 December 2024
2. W3C Web Accessibility Initiative, [WCAG 2.2 Approved as an ISO Standard](https://www.w3.org/WAI/news/2025-10-21/wcag22-iso), 21 October 2025
3. AccessibleEU (European Commission), [The European accessibility standard EN 301 549 has been updated](https://accessible-eu-centre.ec.europa.eu/content-corner/news/european-accessibility-standard-en-301-549-has-been-updated-2026-09-07_en), 7 September 2026
4. W3C, [W3C Accessibility Guidelines (WCAG) 3.0](https://www.w3.org/TR/2026/WD-wcag-3.0-20260303/), Working Draft, 3 March 2026
5. W3C Web Accessibility Initiative, [Understanding Success Criterion 1.4.11: Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
6. Deque, [axe-core](https://github.com/dequelabs/axe-core) (README)
7. Deque, [axe-core rule descriptions](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
8. Deque, [Automated testing study identifies 57 percent of digital accessibility issues](https://www.deque.com/blog/automated-testing-study-identifies-57-percent-of-digital-accessibility-issues), March 2021 (a study by the tool's own vendor)
9. Playwright documentation, [Accessibility testing](https://playwright.dev/docs/accessibility-testing)
10. Oxc documentation, [Oxlint plugins](https://oxc.rs/docs/guide/usage/linter/plugins.html)
11. npm registry download counts for 6 to 12 October 2026, from `api.npmjs.org`: `axe-core`, `@axe-core/playwright`, `lighthouse`, `pa11y`, `eslint-plugin-jsx-a11y`, `@base-ui/react`, `radix-ui`, `@radix-ui/react-dialog` and `react-aria-components`
12. Android Open Source Project, [fonts.xml](https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/data/fonts/fonts.xml), branch `main`
13. StatCounter, [Mobile vendor market share in Iraq](https://gs.statcounter.com/vendor-market-share/mobile/iraq), September 2026
14. StatCounter, [Mobile operating system market share in Iraq](https://gs.statcounter.com/os-market-share/mobile/iraq), September 2026
15. Google Fonts CSS API (`fonts.googleapis.com/css2`), queried on 15 October 2026 as Chrome on Android, with the size of each WOFF2 file read from its `Content-Length`
16. Lighthouse, [Network throttling](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md)
17. Katie Hempenius and Barry Pollard, [Best practices for fonts](https://web.dev/articles/font-best-practices), web.dev, updated 4 October 2022
18. Flutter API reference, [ScriptCategory](https://api.flutter.dev/flutter/material/ScriptCategory.html)
19. Apple, Human Interface Guidelines, [Right to left](https://developer.apple.com/design/human-interface-guidelines/right-to-left)
20. Apple, Human Interface Guidelines, [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), updated 9 June 2025
21. Android Developers, [Make apps more accessible](https://developer.android.com/guide/topics/ui/accessibility/apps)
22. Android Developers, [Support different languages and cultures](https://developer.android.com/training/basics/supporting-devices/languages)
23. W3C Internationalization, [Structural markup and right-to-left text in HTML](https://www.w3.org/International/questions/qa-html-dir)
24. Chrome for Developers, [Auto Dark Theme](https://developer.chrome.com/blog/auto-dark-theme), updated 21 October 2021
25. Thomas Steiner, [Improved dark mode default styling with the color-scheme CSS property and the corresponding meta tag](https://web.dev/articles/color-scheme), web.dev, updated 8 April 2020
26. Tailwind CSS documentation, [Theme variables](https://tailwindcss.com/docs/theme)
27. Tailwind CSS documentation, [Hover, focus, and other states](https://tailwindcss.com/docs/hover-focus-and-other-states)
28. MDN, [pointer](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer)
29. IBM Carbon Design System, [Typography: overview](https://carbondesignsystem.com/elements/typography/overview/)
30. shadcn/ui, [Theming](https://ui.shadcn.com/docs/theming)
31. shadcn/ui, [RTL](https://ui.shadcn.com/docs/rtl)
32. shadcn/ui changelog: [npx shadcn create](https://ui.shadcn.com/docs/changelog/2025-12-shadcn-create) (December 2025), [Introducing Luma](https://ui.shadcn.com/docs/changelog/2026-03-luma) (March 2026), [Introducing Sera](https://ui.shadcn.com/docs/changelog/2026-04-sera) (April 2026), [Introducing Rhea](https://ui.shadcn.com/docs/changelog/2026-05-rhea) (May 2026) and [Base UI as the Default](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default) (July 2026)
33. shadcn/ui, [CLI](https://ui.shadcn.com/docs/cli)
34. shadcn/ui, [components.json](https://ui.shadcn.com/docs/components-json)
35. shadcn/ui, [Monorepo](https://ui.shadcn.com/docs/monorepo)
36. Base UI, [About](https://base-ui.com/react/overview/about)
37. Adobe, React Spectrum, [Theming](https://react-spectrum.adobe.com/react-spectrum/theming.html)
38. IBM Carbon Design System, [Themes: overview](https://carbondesignsystem.com/elements/themes/overview/)
39. Shopify, [Polaris web components](https://shopify.dev/docs/api/app-home/polaris-web-components)
40. Shopify, [Theme architecture](https://shopify.dev/docs/storefronts/themes/architecture)
41. W3C Design Tokens Community Group, [Design Tokens specification reaches first stable version](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/), 28 October 2025
42. Google Fonts, the family metadata at `fonts.google.com/metadata/fonts`, read on 15 October 2026
43. Fontsource, [Introduction](https://fontsource.org/docs/getting-started/introduction)
