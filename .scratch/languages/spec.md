# Spec: The three languages

Status: ready-for-agent

This is `languages`, the first module in the build order of [the MVP spec](../mvp/spec.md)'s capability map. It covers the requirements LANG-1 to LANG-8. The four infrastructure steps are finished, and this is the first module that builds on them. This spec uses the vocabulary of [CONTEXT.md](../../CONTEXT.md) and follows [ADR-0003](../../docs/adr/0003-three-apps-one-api-keycloak.md) and [ADR-0004](../../docs/adr/0004-architecture-per-app.md).

On 10 October 2026 the owner confirmed the test seams and made three choices: the Shopper app carries the language in the address, the dashboard gets its languages from react-i18next, and the dashboard tells the Vendor portal from the Admin console by the login's role, with a development Vendor login to test it.

Some words need care. A **language** is one of the platform's three: Kurdish (Sorani), Arabic and English, with the tags `ckb`, `ar` and `en`. **Western digits** are 0 to 9. The **Vendor portal** and the **Admin console** are the two halves of the dashboard. The **development Vendor login** is a Login with the Vendor role and no Vendor behind it yet. A **set** of language files is one file for each language, all holding the same messages.

## Problem Statement

A Shopper in Erbil reads Kurdish, Arabic or English, and so does a Vendor. The platform speaks English only, left to right, on two unstyled placeholder pages. The MVP spec says that every Shopper and Vendor screen is built in all three languages and both directions from its first version, and nothing exists to build one with. There are no language files, a page has no way to know its language, nothing sets a direction, there is no switch and there is no styling at all.

The first module that builds a real screen would have to make all of this in a hurry, beside its own product decisions. Each part has a way of being wrong that looks right:

- **Digits.** On the installed Node, a number formatted for Kurdish, or for Arabic as written in Iraq, comes out in Arabic-Indic digits. A price would be shown in digits that LANG-5 forbids, and every test written in English would pass.
- **Direction.** A screen styled with left and right looks correct in English. Finding and turning every such class afterwards is the expensive path the capability map warns about.
- **Mixed text.** A Part name stays in English in every language. Inside a Kurdish or an Arabic sentence the browser reorders its pieces unless the name is kept apart from the sentence.
- **Drafts.** The Kurdish and Arabic text is drafted during development and reviewed later. A placeholder broken in one language shows only when that page is opened in that language.

The dashboard has a problem of its own. The Vendor portal is in three languages and the Admin console is in English only, and nothing tells the two apart. The only login that exists is the development Admin, so nobody can see the Vendor portal at all.

## Solution

A Shopper opens the site and it is in their language. The first visit follows the browser's language, and falls back to Kurdish. The language is part of every page's address. Every page has a switch that names each language in its own script, and the choice is remembered. Kurdish and Arabic pages are laid out right to left. Every number is in Western digits. A Part name stays in English and reads in its own order, and what a Vendor wrote is shown as written.

A Vendor gets the same in the Vendor portal. The Admin gets the Admin console in English, left to right, with no switch.

The owner gets one place for all translated text, the `i18n` library, and two proofs. `pnpm check` proves that the language files agree with each other and that no class names a physical side. `pnpm platform:check` proves what a person sees, in a real browser 360 pixels wide. `pnpm services:up` creates a development Vendor login, so that the Vendor portal can be opened.

The two pages are still placeholders. Each becomes the proving ground: it shows a sample of every kind of text a later screen will hold. What this module leaves behind is the conventions the first real screen copies: where text lives, how a screen asks for it, how direction is set, how a number is formatted, how as-written text is marked, and how a page is tested in three languages.

## User Stories

### The Shopper's language

1. As a Shopper, I want the site in Kurdish (Sorani), Arabic or English, so that I can read it in the language I am most at home in.
2. As a Shopper whose phone is set to Arabic, I want my first visit to open in Arabic, so that I do not have to look for a switch.
3. As a Shopper whose phone is set to English, I want my first visit to open in English, so that the same holds for me.
4. As a Shopper whose phone is set to a language the platform does not have, I want the site in Kurdish, so that I get the city's first language and not a guess.
5. As a Shopper whose phone lists several languages, I want the first one the platform has, so that my own order of preference is respected.
6. As a Shopper, I want a language switch on every page, so that I can change language wherever I am.
7. As a Shopper, I want the switch to name each language in that language and its own script, so that I can find mine on a page I cannot read.
8. As a Shopper, I want the switch to show which language I am in, so that I know what a tap will change.
9. As a Shopper, I want switching to keep me on the page I was on, so that I do not lose my place.
10. As a Shopper, I want my choice remembered when I come back another day, so that I choose once.
11. As a Shopper, I want my choice to win over my phone's language, so that a phone set to English does not undo it.
12. As a Shopper on a weak connection, I want the switch to work before the page's scripts have loaded, so that I am not stuck in a language I cannot read.
13. As a Shopper, I want the language to be part of the page's address, so that a link I copy opens in the language I was reading.
14. As a Shopper who opens an address with no language in it, I want to be sent to that page in my language, so that a short link works.
15. As a Shopper who opens a link in another language, I want that page in the link's language with the switch on it, so that I see what the sender saw and can change it.
16. As a Shopper, I want the page to arrive from the server already in my language, so that it never flashes in another one first.
17. As a Shopper, I want the browser tab's title in my language, so that I can find the tab again.
18. As a Shopper who opens an address that does not exist, I want the "not found" page in my language, with the switch, so that I can find my way back.
19. As a Shopper, I want to be told in my language when the platform cannot be reached, so that I know it is not my mistake.
20. As a Shopper using a screen reader, I want each page to declare its language, so that it is read in the right voice.
21. As a person searching the web, I want each language's page to have its own address and to name the other two, so that the search engine offers me the right one.

### Direction

22. As a Shopper reading Kurdish or Arabic, I want the page laid out right to left, so that it reads the way my language does.
23. As a Shopper reading English, I want the page laid out left to right, so that the same holds for me.
24. As a Shopper, I want the direction to change with the language when I switch, so that I never read Arabic in an English layout.
25. As a Shopper reading right to left, I want everything that has a side to be mirrored, spacing, alignment and arrows among it, so that nothing looks left behind.
26. As a Shopper, I want the server to send the page in its direction, so that it does not jump from one side to the other while it loads.

### Text that is not translated

27. As a Shopper, I want Part names, manufacturer names and specifications in English in every language, so that they match the name on the box and in the shop.
28. As a Shopper reading Kurdish or Arabic, I want an English Part name inside a sentence to keep its own order, so that "Ryzen 5 7600" does not become "7600 5 Ryzen".
29. As a Shopper reading Kurdish or Arabic, I want a specification such as "DDR5-6000" to keep its order, so that I can compare it with another.
30. As a Shopper, I want Category names in my language, so that I can find my way without knowing the English word.
31. As a Shopper, I want what a Vendor wrote, its name, its address and its opening hours, shown exactly as written, so that it matches the sign on the shop.
32. As a Shopper reading English, I want a Vendor's address written in Arabic to read right to left inside my left-to-right page, so that it is readable.
33. As a Vendor, I want my own words shown as I wrote them in every language, so that nobody mistranslates the name of my business.

### Numbers

34. As a Shopper, I want every price and specification in Western digits in every language, so that I read the same figure the Vendor quotes.
35. As a Shopper, I want every other number in the same digits, so that a page never mixes two sets of digits.
36. As a Shopper, I want a large number grouped in thousands, the same way in every language, so that I can read 1,575,000 at a glance.
37. As a Shopper reading Kurdish or Arabic, I want a number with its unit or its currency to keep its order inside a sentence, so that the figure and the unit do not swap places.
38. As a Shopper reading Arabic, I want a count worded with the plural form Arabic uses for that number, so that the sentence is correct for 1, 2, 3, 11 and 100.
39. As a Vendor, I want the same digits and the same grouping in the Vendor portal, so that what I type and what I read look alike.

### The Vendor portal

40. As a Vendor, I want the Vendor portal in Kurdish (Sorani), Arabic or English, so that I can keep my Offers current in my own language.
41. As a Vendor, I want my first visit to follow my browser's language and fall back to Kurdish, so that the portal behaves as the Shopper's pages do.
42. As a Vendor, I want a language switch on every screen of the portal, so that I can change language at any time.
43. As a Vendor, I want switching to change the screen in place, so that I am not logged out and lose nothing I was doing.
44. As a Vendor, I want my choice remembered in this browser, also after I log out and in again, so that I choose once.
45. As a Vendor reading Kurdish or Arabic, I want the portal laid out right to left, so that it reads the way my language does.
46. As a Vendor, I want the browser tab's title in my language, so that I can find the tab again.

### The Admin console

47. As the Admin, I want the Admin console in English and left to right whatever my browser's language is, so that it is one thing and never half translated.
48. As the Admin, I want no language switch in the Admin console, so that nothing offers a translation that does not exist.
49. As the Admin, I want a language chosen in the Vendor portal on the same browser to leave the Admin console alone, so that helping a Vendor in their shop does not change my screens.
50. As a Vendor, I want my remembered language to still be there after the Admin has used the same browser, so that the Admin's visit changes nothing for me.
51. As the owner, I want one rule, in one place, for which half of the dashboard a login gets, so that `accounts` extends it and does not invent it.

### The development Vendor login

52. As the owner, I want a development Vendor login to exist once the services have started, so that I can open the Vendor portal during development.
53. As the owner, I want it created by the command that starts the services, so that a fresh machine is ready in one step.
54. As the owner, I want its password generated on my machine and kept in `.env`, so that the rule against committing passwords holds without exception.
55. As the owner, I want its settings added to the `.env` I already have, with no value that is there changed and no reset of the services, so that my services' data keeps working.
56. As the owner, I want that login to hold the Vendor role and no other, so that it sees what a real Vendor will see.
57. As the owner, I want a later start to leave that login and its password alone, so that what I have saved keeps working.
58. As the owner, I want `pnpm services:check` to say that the login exists with its role, so that a missing one is reported plainly.

### The text and its review

59. As the owner, I want every translated text in the `i18n` library, with one file for each language, so that no text is hidden in a component.
60. As the reviewer, I want the Kurdish and the Arabic text in files that hold nothing but text, so that I can correct it without reading code.
61. As the reviewer, I want each draft language marked as awaiting review, so that nobody mistakes a draft for the final wording (LANG-7).
62. As the reviewer, I want a placeholder I break while correcting a sentence to be caught by a check, so that a Shopper never finds it.
63. As the reviewer, I want the Kurdish and the Arabic word chosen for each of the platform's terms written down in one place, so that every later screen uses the same word for a Part, a Vendor, an Offer and a Build.
64. As the owner, I want a message missing from one language to fail `pnpm check`, so that no page can fall back to another language unnoticed.
65. As the owner, I want a message left behind in one language only to fail `pnpm check`, so that the files do not collect dead text.
66. As the owner, I want a message that cannot be read by its library to fail `pnpm check`, so that it never reaches a page.
67. As the owner, I want a message that names different placeholders in different languages to fail `pnpm check`, so that a number or a name cannot go missing from one of them.
68. As the owner, I want a key that code asks for and the files do not have to fail type-checking, so that a typing mistake is found before the page is opened.
69. As the owner, I want the eight Category names drafted once, in all three languages, and used by both frontends, so that the Shopper and the Vendor read the same word.

### A narrow phone

70. As a Shopper on a phone 360 pixels wide, I want every page usable in both directions with no sideways scrolling, so that the platform works on the phone I have.
71. As a Shopper on that phone, I want the language switch on the screen and large enough to tap, so that I can reach it with a thumb.
72. As a Vendor on that phone, I want the same in the Vendor portal, so that I can use it behind the counter.
73. As a Shopper on slow mobile data, I want pages that use my phone's own fonts, so that I do not wait for a font to download.
74. As a Shopper on a larger screen, I want the page to use the space, so that phone first does not mean phone only.

### Building later screens

75. As the owner, I want lint to refuse a class that names a physical side, so that a screen built later cannot break right-to-left layout without anyone noticing.
76. As the owner, I want one function that formats a number, so that no screen can show digits of its own choosing.
77. As the owner, I want one way to mark text that is always in English and one for text shown as someone wrote it, so that no screen writes the markup by hand and forgets it.
78. As the owner, I want one helper that checks any page in all three languages, so that the test of a later page is a single call.
79. As the owner, I want Tailwind CSS set up in both frontends from one shared theme, so that the first real screen starts from the same ground in both.
80. As the owner, I want the rule for adding shadcn/ui written down now, so that its first component arrives ready for right to left.

### Checks and housekeeping

81. As the owner, I want `pnpm check` to pass with Docker stopped and no browser installed, so that the language checks cost nothing to run.
82. As the owner, I want `pnpm platform:check` to prove the languages in a real browser 360 pixels wide, so that the proof is of what a Shopper sees.
83. As the owner, I want each check seen to fail once on a planted fault, so that I know it can fail.
84. As the owner, I want the MVP spec to record the conventions this module sets, so that the next module finds them without reading this one.
85. As the owner, I want the work committed in pieces that each leave `pnpm check` passing, so that any piece can be read and reverted on its own.

## Implementation Decisions

### What this module is and is not

- It builds the means of showing a screen in three languages and two directions, and proves them on the two placeholder pages. It builds no product screen.
- The two pages stay marked as placeholders. Each gains a frame, which is the part every later screen shares and which holds the language switch, and a sample of each kind of text.
- Tailwind CSS arrives here, because direction is a matter of layout. No visual design is done: no colours, no typeface, no logo and no name. The working title "PC Part Picker" appears on no screen.

### The three languages

- The tags are `ckb`, `ar` and `en`, the same three the Keycloak realm uses. They are listed in that order wherever the three are listed.
- Kurdish and Arabic are right to left and English is left to right. That is stated once, in `i18n`, and neither frontend asks a library for it.
- Kurdish is the fallback wherever nothing else decides.
- The switch names the languages as "کوردی", "العربية" and "English". These three names are the same on every page and are not translated.
- A browser states its languages in its own order. The first one the platform has is used, a regional form counts as its language, so that Arabic as written in Iraq is Arabic, and when none matches the language is Kurdish.
- Both frontends match with the same library, the one next-intl uses, and with its "best fit" method, so that they cannot disagree. That method also knows a few relations between languages. Of the languages tried, it sends a browser set to Urdu to English, and every other language the platform lacks to Kurdish. Further Notes has the list.

### `i18n`

- It holds the three languages with their tags, names and directions, the fallback, the rule for a browser's languages, the number formatter, and three sets of language files.
- It depends on neither next-intl nor i18next, nor on React or Next. Each frontend joins it to its own library.
- **Shared terms.** Text both frontends show with the same wording. In this module that is the eight Category names. It holds plain text only, with no placeholder and no plural, because plain text is the one thing both libraries read alike.
- **The Shopper app's text,** in next-intl's format, which is ICU.
- **The dashboard's text,** in i18next's own format.
- Each set is one JSON file for each language. English is the source: its messages define what the other two must hold.
- The Kurdish and the Arabic files are drafts. A note beside the files says so for each language and names LANG-7, as the login screen's Sorani file does.
- A word list beside the files gives the Kurdish and the Arabic word used for each CONTEXT.md term that appears on a screen. It is a draft like the rest.
- Its placeholder export is deleted.

### The Shopper app

- next-intl gives the Shopper app its languages, as the MVP spec decided.
- The language is the first part of every page's address, for all three languages. No language has a bare address.
- An address with no language is answered with a redirect to the same address in a language: the remembered choice, else the browser's language, else Kurdish.
- An address with a language is shown in that language. The address wins over the remembered choice and over the browser.
- The choice is remembered in a cookie that lasts a year. next-intl's own cookie lasts only until the browser is closed, so the lifetime is set.
- The server sends every page with its language and its direction declared on the document. No script sets either.
- The switch is three links to the page the Shopper is on, one in each language. It needs no script.
- The page's title comes from the language files.
- next-intl sends, with each page, the addresses of that page in the other languages, for search engines. That stays switched on.
- An address that matches no page is answered 404, with a "not found" screen in the frame, in the visitor's language.
- A page reads its text on the server. Only the text a component needs in the browser is sent there.
- next-intl's statement of the languages and its request set-up live in a segment of the Shared layer. Next's proxy file sits beside Next's routing folder and imports that segment and nothing else. The route files move under a language segment and still only re-export.
- The statement of the import bans is extended to hold the proxy file to that, and `pnpm boundaries:check` gains a case for it.
- A page is still rendered when it is requested, as step 4 set.
- Next is upgraded within version 16 if next-intl's current set-up needs it.

### The dashboard

- react-i18next, with i18next, gives the dashboard its languages. The owner chose it on 10 October 2026.
- Its language files are in i18next's own format. The plugin that makes i18next read ICU messages is not used.
- **Which half.** A login that holds the Admin role gets the Admin console. Every other login gets the Vendor portal. A login that holds both roles gets the Admin console. The rule is applied once, when the dashboard starts, from the login the adapter already holds, and it reads the roles from the same claim the API reads.
- **The Vendor portal** opens in the remembered choice, else the browser's language, else Kurdish. Only a use of the switch is remembered, in the browser's storage. A language that was merely detected is not stored.
- The switch changes the language in place. It causes no reload and no visit to Keycloak.
- The dashboard sets the document's language, direction and title when it starts and at every switch.
- **The Admin console** is in English, left to right, with no switch. It neither reads nor writes the remembered choice.
- Text that only the Admin console shows is written in English where it is used, and is not in the language files. A component that both halves use takes its text from the files, and in the Admin console it shows the English.
- The message for a login that could not be completed is shown before anyone is known, so it follows the Vendor portal's rule.
- The language choice is the first thing the dashboard keeps in the browser's storage. Tokens stay in memory only.
- No router and no data-fetching, form or state library is added.

### Direction and layout

- Tailwind CSS 4 is set up in both frontends. The theme is one stylesheet in `ui`, which each frontend's own stylesheet imports. `ui` therefore gains a second entry, for that stylesheet.
- Every class that has a side is written in its logical form: start and end, never left and right.
- Lint refuses the physical form in both frontends and in `ui`. The rule is `enforce-logical` from `oxlint-tailwindcss`, loaded as a second Oxlint plugin beside Nx's.
- An icon that points along the reading direction is mirrored in right-to-left pages. An icon that does not point is left alone. No icon exists yet, so this is recorded as the rule for the first one.
- shadcn/ui is not set up here. The rule for the module that adds its first component is recorded: it is set up with its right-to-left setting on, so that the command that adds a component writes logical classes.
- No font is downloaded. Pages use the device's own fonts.
- The frame is designed at 360 pixels wide first and adapts upward.

### Text that is shown as written

- `ui` gains its first two components, both without styling.
- One marks text that is always in English and left to right: a Part name, a manufacturer name, a specification, and a number with its unit or its currency. It gives the text a left-to-right direction of its own and keeps it apart from the sentence around it.
- The other marks text shown as someone wrote it, such as what a Vendor wrote. It takes its direction from the text itself and keeps it apart from the sentence around it.
- Both use HTML's own means for this and no library. Neither kind of text is in the language files.
- `ui`'s placeholder export is deleted, like `i18n`'s, and each frontend's list of libraries it does not use yet loses both entries.

### Numbers

- Every number the platform shows is in Western digits, not only prices and specifications.
- `i18n` has one function that formats a number: Western digits, thousands grouped with a comma and a point before decimals. Its output is the same in all three languages, and the same on the server as in the browser.
- Neither library's own number formatting is used as it comes, because for Kurdish it gives Arabic-Indic digits. How each is held to Western digits is settled first, on the installed tools.
- A count is worded with the plural forms its language has. Arabic has six, and an Arabic message that counts has all six.
- Currency, rounding and the "≈" mark belong to `pricing`. Dates and times belong to the first screen that shows one.

### The development Vendor login

- `pnpm services:up` creates it when the realm has no login of that name, the way it creates the development Admin.
- It is named `development-vendor`, holds the `vendor` role and no other platform role, and has a first name, a last name and an email address, so that Keycloak does not ask for them at the first login.
- Its name and its generated password are two new settings in `.env`, which `.env.example` lists without values. They are added to an `.env` that exists, and no value that is there is changed.
- The realm file does not change, so no reset is needed.
- `pnpm services:check` gains its lines: the login exists, is enabled and holds the `vendor` role.
- `pnpm platform:check` says so, and names `pnpm services:up`, when `.env` lacks the two settings.
- It exists in development only, and it has no Vendor behind it. `accounts` decides what becomes of it.

### The placeholder pages

- The Shopper app's page keeps the line fetched from the API, now in the Shopper's language, and gains a sample: the eight Category names; a sentence with a count, shown for 1, 2, 3, 11 and 100; the number 1,575,000; a Part name and a specification inside a sentence; and two lines shown as written, one in Arabic script and one in Latin script.
- The Vendor portal's page keeps who the API says the caller is and its two buttons, in the Vendor's language, and gains the same kinds of sample.
- The Admin console's page is what the dashboard shows today.
- The sample values are fixed in the page and are plainly made up. Any Vendor named is fictional.
- The first real page replaces each placeholder, sample and all.

### The checks in `pnpm check`

- A new step compares the language files, in the manner of the step that compares the import bans. It is a script in `tools`.
- For each set it fails when a message of the English file is missing from another language, when another language holds a message the English file does not, when a message cannot be read in its format, and when a message names different placeholders in different languages.
- In the dashboard's set a message that counts is one message, and each language must hold exactly the plural forms that language has.
- It fails when a shared term holds a placeholder.
- Both frontends type-check their keys against the English files, so a key that does not exist fails `typecheck`.
- The lint rule above runs with each project's `lint` target.

### The end-to-end tests

- The language tests run in Chromium in a window 360 pixels wide. The tests step 4 wrote keep their window.
- A browser's language is set for a test through Playwright's own setting, which changes both what the browser tells a page and what it sends to a server.
- A helper takes a page's address and checks it in all three languages: the declared language, the direction, the digits and the width. A later page's test calls it.
- A second helper logs in as the development Vendor, as the existing one does for the development Admin.
- A test never quotes a translation, because the review may change every one of them. It tells the languages apart by the language the page declares and by the same piece of text differing between them.

### Versions

- next-intl, i18next, react-i18next and Tailwind CSS are the current stable releases when the work is done.
- `oxlint-tailwindcss` is pinned exactly. It is young, it releases often, and it runs on the part of Oxlint that Oxlint keeps outside its version policy.
- pnpm refuses an install script that the workspace file does not list. A new package's script is read before it is listed.

### Recording

- The MVP spec's Technology section gains the conventions this module set: where text lives and how each frontend reads it; the shape of a Shopper address; where each frontend remembers the choice; how direction is set; the number formatter; the two components for as-written text; the rule against physical classes; the rule for which half of the dashboard a login gets; the new step of `pnpm check`; the development Vendor login and its settings; and the libraries chosen.
- Its `languages` requirements gain the Vendor portal's rule, which follows LANG-6, and LANG-5's wider reading, that every number is in Western digits.
- It says when to run `pnpm platform:check` for this module's sake: after a change to either frontend's language set-up or to the frame, and after an upgrade of next-intl, i18next, react-i18next or Tailwind CSS.
- A new ADR records two decisions that are hard to undo: the language is part of a Shopper address, and the two frontends use two libraries with two message formats.
- PRODUCT.md names the dashboard's library beside the Shopper app's.
- CONTEXT.md gains a term only if the work finds one that the glossary lacks.
- The work is committed in pieces, each leaving `pnpm check` passing.

## Testing Decisions

A good test of this module asks the running platform a question from the outside and reads the answer. It opens an address in a browser set to a language and reads which language the page declares, which direction it has and what is on it. It does not ask which function of a library was called, what a cookie or a storage key is named, or which class an element carries, all of which may change freely while a Shopper sees the same page.

A language test first confirms that the page came back in the language it asked for, and only then reads anything else. Step 2 learned this: a check of the Arabic login screen once passed on a Kurdish page, because both are right to left.

There are two seams, and both already exist. The owner confirmed them on 10 October 2026. No unit-test tool is added to the frontends.

### Seam 1: the repository root, through `pnpm check`

- **The language files.** The three languages of each set hold the same messages. Every message can be read in its format. Every message names the same placeholders in all three. The shared terms hold plain text. An Arabic message that counts has all six plural forms.
- **Keys.** Code in either frontend that asks for a key the English files do not have fails type-checking.
- **Classes.** A class that names a physical side is refused in both frontends and in `ui`, and its logical form is accepted.
- **Still true.** Everything `pnpm check` proved before still passes, with Docker stopped and no browser installed.

Each line is seen to fail once, by a deliberate fault that is then reverted: a message removed from the Arabic file; a message added to the Kurdish file only; a placeholder renamed in the Kurdish file; a brace removed from a message; one plural form removed from an Arabic message of the dashboard; a placeholder put into a shared term; a key misspelled in each frontend; a class with a physical side added in each frontend and in `ui`.

### Seam 2: the running platform, from the outside

The services and the three apps run, and `pnpm platform:check` observes them through a real browser 360 pixels wide.

**The Shopper app**

- **The first visit follows the browser.** A browser set to Arabic as written in Iraq opens the bare address and arrives at the Arabic one. One set to English arrives at the English one. One set to French arrives at the Kurdish one, and so does one set to Kurdish. One that lists French and then Arabic arrives at the Arabic one.
- **From the server.** Each language's address, fetched with no browser and so with no script run, declares that language and its direction, holds that language's text, and holds the switch's three links.
- **The three differ.** The same piece of text is different in each of the three languages, so none has fallen back to another.
- **The switch.** A tap on another language arrives at the same page in that language, with its language and direction declared.
- **Remembered.** After a switch, the bare address goes to the chosen language, although the browser is set to another. The browser holds the choice for about a year, and not only for the session.
- **The address wins.** With Arabic remembered, the English address shows English.
- **Not found.** An address that matches no page is answered 404, with the frame and the switch, in the visitor's language.
- **Digits.** The sample number reads 1,575,000 in all three languages. No Arabic-Indic digit is anywhere on the page in any language, the counted sentences among it.
- **As written.** The Part name and the specification are the same characters in all three languages and carry a left-to-right direction of their own. The two as-written lines are the same in all three, and each carries its own direction.
- **Width.** In each language the page does not scroll sideways, and the switch is inside the screen.
- **For search engines.** The answer to a language's address names that page's address in all three languages.
- **The title.** The tab's title is different in each language.
- **The page still comes from the API.** Step 4's test passes at a language's address.

**The Vendor portal, as the development Vendor**

- **Which half.** The development Vendor logs in and gets the page with the language switch.
- **The first visit follows the browser.** A browser set to Arabic gets Arabic, right to left. One set to French gets Kurdish.
- **The switch.** A tap changes the language and the direction in place: the page is not loaded again and Keycloak is not visited.
- **Remembered.** The choice holds after a reload, and after logging out and in again.
- **Digits and width.** As for the Shopper app, in each language.
- **No token is stored.** Step 4's test of the browser's storage still passes with a language remembered.

**The Admin console, as the development Admin**

- **English only.** With the browser set to Arabic, the page declares English and left to right, and has no switch.
- **Left alone.** After the development Vendor has chosen Arabic in the same browser and logged out, the development Admin still gets English. When the development Vendor logs in again, Arabic is still remembered.
- **Width.** The page does not scroll sideways.

**The development Vendor login.** `pnpm services:check` prints its lines and they pass.

Each group is seen to fail once, by a deliberate fault that is then reverted: the hold on Western digits removed, which fails on the Kurdish page; Kurdish stated as left to right; the fallback changed to English; the cookie's lifetime removed; Arabic taken out of the Shopper app's languages; an element wider than the screen added to the frame; the rule for which half turned round; the dashboard made to ignore the remembered choice; the development Vendor given the Admin role.

### The rest

- **From scratch.** In a fresh clone in a new directory, with no `.env` and no Docker volumes: one install, the browser's install, `pnpm check --skip-nx-cache`, `pnpm boundaries:check`, `pnpm services:up`, `pnpm services:check` and `pnpm platform:check` all pass, with none of the three apps started by hand. Earlier steps showed that results left over from earlier runs can hide a fault, so this run is the one that counts.
- **By hand, once.** A test reads the characters of a page and cannot see the order they are drawn in, so the owner reads these:
  - On the Kurdish and the Arabic page of the Shopper app, the Part name and the specification read in their own order inside the sentence, and the number keeps its place beside its unit.
  - The Arabic sentence that counts is worded correctly for 1, 2, 3, 11 and 100.
  - On the English page, the line in Arabic script reads right to left.
  - The Sorani letters ڕ, ڵ, ێ, ۆ and ە are drawn correctly in the font of the owner's own phone, and of an older Android phone if one is at hand.
  - With scripts switched off in the browser, the Shopper app's switch still changes the language.
  - The frame is usable with a thumb on a real phone, in Kurdish and in English.
  - `pnpm services:up` on the owner's existing `.env` adds the two new settings and changes no value that was there. Run a second time, it leaves the development Vendor and its password as they were.
  - `pnpm check` passes with Docker stopped and with no browser installed.
- **Prior art.** `pnpm services:check` already asks Keycloak's login screen for each of the three languages, confirms the page came back in that language, and then reads its direction. That is the model for a language test. The step of `pnpm check` that compares the written import bans with their statement is the model for the step that compares the language files. Step 4's end-to-end tests, and their helper that logs in as the development Admin, are the model for the tests at the second seam.
- **Recording.** The results of the fault checks and of the by-hand checks are written under the Comments heading of the ticket that carries them out.

## Out of Scope

- Any real screen in the Shopper app, the Vendor portal or the Admin console.
- Visual design: colours, a typeface, a downloaded font, a logo, and the platform's name.
- shadcn/ui and any component beyond the two for as-written text.
- The review of the Kurdish and the Arabic text (LANG-7). This module drafts them and marks them as drafts. The review is done before launch.
- Dates, times and "days ago" (OFF-7), which arrive with the first screen that shows one.
- Currency, rounding and the "≈" mark, which belong to `pricing`.
- Turning the API's error keys into text. It arrives with the first screen that shows a Vendor an error. Until then the placeholder shows a refusal as it does today, inside a translated sentence.
- Carrying the language between the dashboard and Keycloak's login screen, in either direction. Each remembers its own. More Sorani text for the login screen, and any change to the theme.
- Keeping a Vendor's language on the server.
- The language of a message the platform writes for WhatsApp, and the shape of a link that is handed to someone else (SHR-5). `sharing` decides both.
- A sitemap, page descriptions and link previews (BRW-5), which belong to `browse`.
- Everything in `accounts`: a Vendor behind the development Vendor login, real Vendor logins, and acting as a Vendor.
- A router and a data-fetching, form or state library in either frontend.
- The frontends' unit-test tools.
- Sending a browser only the language it shows. The dashboard's three files are small now and all three are loaded.
- A fourth language, Kurmanji among them, and regional forms of the three.
- Translating a Part name, a manufacturer name or a specification, and translating what a Vendor wrote. LANG-3 and LANG-4 rule both out.
- Translating the Admin console.
- An accessibility standard, which PRODUCT.md records as undecided.
- Browsers other than Chromium, and tests on a real phone.
- Running `pnpm platform:check` as part of `pnpm check`.
- Anything for production, and automated checks on GitHub.

## Further Notes

- **Choices made here that no ADR records.** The owner may overrule any of them before work starts:
  - The dashboard's files are in i18next's own format, so the platform has two message formats. The alternative is below.
  - Every number is in Western digits. LANG-5 names prices and specifications only.
  - The Vendor portal follows the rule LANG-6 gives for the Shopper. The MVP spec gives the Vendor portal no rule of its own.
  - A login with the Admin role gets the Admin console, also when it holds the Vendor role too, and every other login gets the Vendor portal.
  - Text that only the Admin console shows is written in English in the code.
  - An address in a language is shown in that language, whatever is remembered.
  - The Shopper's choice is remembered for a year.
  - The switch says "کوردی". Keycloak's login screen says "کوردیی ناوەندی", which is Keycloak's own name for the language. Step 2 left the choice between them to the owner, at review.
  - The addresses use `ckb`, which is the tag for Sorani and the one the realm uses. `ku` is shorter, and names Kurdish as a whole.
  - No font is downloaded.
  - Tailwind CSS arrives with this module, and `ui` gains a second entry for its stylesheet. Step 3 recorded that a library has a single entry file, and step 4 gave `core` a second one.
  - The language files are compared by a script of the workspace's own.
  - The names: `development-vendor` and its two settings.
- **The libraries considered and not chosen.**
  - For the dashboard: `use-intl` is next-intl's own core for React apps outside Next, and reads the same files with the same hooks. It was the recommendation. The owner chose react-i18next, which is the most widely used.
  - `i18next-icu` makes i18next read ICU messages, and would give both frontends one format and one set of files. It was left out so that each library works the way its own documentation describes. If two formats prove a burden at review, it is the first thing to try.
  - `i18next-browser-languagedetector` finds and stores the browser's language for i18next. Its documentation suggests that it stores what it detected, not only what was chosen, and the Admin console must store nothing. The rule is a few lines and is written here.
  - `@lingual/i18n-check` is the tool next-intl's documentation names for comparing language files. It is before version 1.0, and its documentation does not say that it reports a message held by one language only, a message that cannot be read, or the extra plural forms Arabic has in i18next's format.
  - `eslint-plugin-rtl-friendly` refuses physical classes under ESLint. `oxlint-tailwindcss` is written for Oxlint, which is this repository's only linter.
  - Keeping the Shopper's language in a cookie alone, with one address for all three languages. Search engines would see one language, and a cache in front of the platform could not tell the three apart.
- **Checked in the npm registry on 10 October 2026:**
  - next-intl 4.14.9 accepts Next 12 to 16 and React 19. `use-intl` is published at the same version. next-intl brings `@swc/core` and `@parcel/watcher`, whose install scripts the workspace file already lists.
  - i18next is at 26.4.2 and react-i18next at 17.0.16. Both declare TypeScript 5, 6 or 7, and this repository has 6.0.3.
  - Tailwind CSS, its PostCSS plugin and its Vite plugin are at 4.3.3. The Vite plugin accepts Vite 8.
  - `oxlint-tailwindcss` is at 1.15.1, published the day before. An earlier release said it needs Oxlint 1.43 or later, and this repository pins 1.87.0.
  - Next is at 16.4.0. The installed Next is 16.1.7, and Nx's Next plugin accepts any Next below 17.
- **Checked in the documentation on 10 October 2026:**
  - next-intl: it chooses a language from the address first, then its cookie, then the browser's languages, then the default. It matches a browser's languages with the "best fit" method of a FormatJS library. Its cookie is a session cookie unless a lifetime is set. It sends each page's addresses in the other languages in a header by default. In Next 16 its code runs in the proxy file, which was called the middleware file before. Its current set-up reads the language from Next's root parameters, which Next has by default from 16.3. Its types check a key against one language's file only.
  - i18next: a message that counts is written as one key for each plural form its language has, so an Arabic one has six keys and an English one has two. Its built-in number format goes through the browser's own number formatting, in the page's language. Its types check a key against the files it is given.
  - shadcn/ui: with its right-to-left setting on, the command that adds a component rewrites physical classes as logical ones. This applies to its newer styles, and three components are converted by hand. It reports a fault in the sliding animations of pop-up parts, with a workaround.
  - `oxlint-tailwindcss`: `enforce-logical` rewrites physical classes as logical ones and is off by default. The plugin is for Tailwind CSS 4.
- **Checked on the installed Node, 24.21.0, on 10 October 2026:**
  - A number formatted for `ckb` or for `ar-IQ` comes out in Arabic-Indic digits. Plain `ar` and `en` come out in Western digits.
  - With the numbering pinned to Western digits, 1575000.5 comes out as "1,575,000.5" for all three.
  - Kurdish and English have two plural forms. Arabic has six.
  - Node has no Sorani wording for relative time: three days ago comes out as "-3 d". The module that shows "confirmed 3 days ago" (OFF-7) needs messages of its own for it.
  - Node knows that `ckb` and `ar` are right to left.
- **Checked on the matching library next-intl uses, `@formatjs/intl-localematcher` 0.8.1, on 10 October 2026,** with Kurdish as the default:
  - Arabic as written in Iraq gives Arabic, British English gives English, and Sorani as written in Iraq or in Iran gives Kurdish.
  - `ku`, the tag for Kurdish as a whole, gives Kurdish.
  - French, German, Persian, Turkish, Hebrew, Chinese and Russian give Kurdish.
  - French listed before Arabic gives Arabic, and French listed before English gives English.
  - Urdu gives English under "best fit", and Kurdish under the stricter "lookup" method. It is the one case found where the two differ.
- **Not yet known, and found out first.** Each of these is settled on the installed tools before the code that depends on it is written, and the finding is recorded in the ticket:
  - How a number inside a message is held to Western digits in each library: in next-intl, where a counted message prints its count, and in i18next, where a message formats a number. The Kurdish page fails the digits test until it is.
  - Whether Chromium formats Kurdish and Arabic numbers as Node does. The number formatter has to give the same text on the server and in the browser.
  - Exactly when next-intl writes its cookie, and whether opening a link in another language changes what is remembered. The finding is recorded in the MVP spec, because `sharing` needs it.
  - Whether next-intl's set-up needs Next 16.3, and whether Nx's Next plugin and the rest of the workspace take that upgrade cleanly.
  - Whether `oxlint-tailwindcss` loads beside Nx's boundary plugin on the pinned Oxlint, and what it needs to be told about the theme's stylesheet. If it cannot be used, the rule against physical classes is recorded as a convention that nothing checks, and the width test is what is left.
  - How Tailwind CSS is told to read the classes used in `ui`, which the frontends take as source with no build step.
  - How i18next's types and next-intl's types are each given the English files, with the shared terms among them.
  - Whether the dashboard can read the login's roles from the adapter before it renders anything.
- **No reset.** Nothing in the realm file or in the database set-up changes. The owner's running services gain the development Vendor login at the next `pnpm services:up`.
- **The lesson from the infrastructure steps.** Results left over from earlier runs hid faults in all four. Every claim in this module is checked on a fresh clone, with Nx's cache skipped.
- **Next steps.** `catalog` and `accounts` stand beside this module at the start of the build order, and neither depends on it. The first module that builds a Shopper page or a Vendor portal screen copies the conventions recorded here.
