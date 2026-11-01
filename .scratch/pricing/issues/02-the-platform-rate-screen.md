# 02: The Platform Rate screen in the Admin console

**Spec:** [the pricing spec](../spec.md)

**What to build:** The Admin console gains Platform Rate, reached from its sections. The screen shows the current Platform Rate on its one leading plate, "1 $ = 1,575 IQD", with the day it was set beside it, and below it a form to set a new one (PRC-1). A save changes the plate at once, with no reload. With no Platform Rate yet, the screen says so, and says what Shoppers see until one is set. The screen is in English, as the whole Admin console is (LANG-1).

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] **The section.** Platform Rate, at `/platform-rate`, with an icon from lucide, after Expiring Offers in the Admin console's sections, in the sidebar and in the menu sheet. The Admin console's placeholder no longer names it as to come, if it does.
- [ ] **The plate.** The screen's one leading plate, as the dashboard's DESIGN.md gives the Platform Rate: "1 $ = 1,575 IQD", written by `formatNumber` and `AlwaysEnglish`, named as one image with its words for a reader, and the day it was set beside it. It is built with the shared `Plate` and `ScreenTitle`.
- [ ] **No Platform Rate.** The dashboard's empty state takes the plate's place: no Platform Rate yet, and until one is set, an Offer quoted in one currency is shown to Shoppers in that currency only. The form is below it.
- [ ] **The form.** React Hook Form's, with one field for IQD per USD and Save, using `FieldError` and `BusyLabel`. The field takes digits as the Offer form does, through `westernDigitsIn`, and drops separators and spaces. It refuses a value that is not a number itself as `notANumber`, and sends anything else for the API to judge. The API's refusal is shown beside the field, as "The rate is outside the allowed range." without the numbers. No frontend holds the limits.
- [ ] **The query.** Under its own key, `['platform-rate']`. A save writes the answer into it, so the plate shows the new rate and today's date at once.
- [ ] **The look.** It follows the root DESIGN.md's hard rules and the dashboard's DESIGN.md, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules. If the screen needs something DESIGN.md does not say, Impeccable adds it to DESIGN.md before the screen is built. If that leaves a design choice open, the choices are rendered in the built-in browser with realistic, obviously fictional figures, the owner picks one by eye, and the choice is recorded under Comments.
- [ ] **The motion.** The plate's change of figures after a save follows DESIGN.md's Motion section and the No Snap Rule, with reduced motion as well as without, through `shared/lib/motion.ts` and no animation library.
- [ ] `pnpm platform:check` gains these lines and passes on every line, in a window 360 pixels wide:
  - The Admin reaches Platform Rate from the menu sheet.
  - The Admin sets a rate, and the plate shows "1 $ = n IQD" with today's date, with no reload. The development database is shared, so the test sets a rate of its own and reads only that.
  - A rate typed in Arabic-Indic digits with a separator is saved as its value.
  - A rate out of range is refused beside the field, and the plate keeps the current rate.
  - Given an answer with no Platform Rate through `page.route`, the empty state says so and the form is still there.
  - `expectAccessible` passes on the screen, in the light and in the dark scheme.
  - The plate's change is filmed with `film` and judged by `snapsOf`, with reduced motion and without.
- [ ] **Taste's inspector.** `pnpm dashboard:inspect /platform-rate --scheme light --app --widths 1440,768,360`, and the same in the dark scheme, as the empty state and with a rate. Every FAIL is fixed. Every WARN is fixed or defended under Comments, and a defence that is a design choice is put to the owner. The results go under Comments as a table, and the photographs are looked at.
- [ ] Shown once and then reverted, each failing its own test: the save no longer writing the answer into the query (the plate keeps the old rate until a reload); the digits not passed through `westernDigitsIn`.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
