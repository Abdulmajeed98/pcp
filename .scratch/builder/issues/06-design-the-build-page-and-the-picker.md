# 06: Design the Build page and the picker

**Spec:** [the builder spec](../spec.md)

**What to build:** The Build page and the picker are new kinds of page, which [the Shopper app's DESIGN.md](../../../apps/shopper/DESIGN.md) does not describe. Their pieces are designed inside the printed price list's look (ADR-0013), with no new direction dealt. Each piece's options are rendered with the made-up shop and its made-up Builds, the owner chooses by eye, and Impeccable writes the choices into DESIGN.md before any page is built. Each skill leads its own area, as [the design skills guide](../../../docs/agents/design-skills.md) records. This ticket stops for the owner's choice.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] **The guide is read first**, and so are DESIGN.md, ADR-0013 and `browse`'s design tickets 07 and 08. Fit Diagram's idea of a Build drawn like a motherboard manual, which ADR-0013 records as `builder`'s, binds nothing.
- [ ] **The pieces to design**, Taste leading their composition inside the chosen direction:
  - the Build page as a sheet of the same stationery: the eight Categories, each with its Part or Parts or a way to choose one, a kit's or a drive's quantity, removing a Part, and emptying the Build with its one confirmation;
  - its status, a Complete Build or the Categories still needed, with the line saying a CPU's graphics or cooler is not known;
  - its outcomes, Problems, then Warnings, then unchecked rules, and the line counting the passes, with the Estimated power draw;
  - the first price view with its headline total, and an Unstocked Part, never shown by colour alone;
  - the second price view, each Vendor with its total, the Parts it has and the Parts it lacks;
  - the picker as a Category page's sheet, with the switch, the pick control, the mark of the Part already in the Build and the mark of a Part that is not Compatible;
  - the frame's way to the Build page, with how many Parts the Build holds, as a small, additive change to the frame.
- [ ] **The words of an outcome.** Impeccable leads their copy. One example of each kind, a Problem, a Warning and an unchecked rule, is drafted in English, naming its Parts and what fails without the values compared, and is shown with the options.
- [ ] **The rendering.** Each piece's options are drawn with ticket 05's made-up shop and Builds, in Kurdish and in English, at 390 pixels and at 1440, and at 1024 and 1280 where a desk layout differs, in both schemes. They are served from the scratchpad, never opened as a file, and shown in the built-in browser, one option to an anchor and two columns at most, before the owner is asked. An option that breaks a hard rule says so on its page.
- [ ] **The motion**, led by Emil Kowalski's skills: whether a Part arriving in the Build, a quantity changing, a total settling and an outcome appearing move at all, and how, in the motion of paper and print DESIGN.md already holds. It covers reduced motion and the No Snap Rule. Movements are rendered live for the owner, as `browse`'s were.
- [ ] **The feel on a phone**, led by Emil's `mobile-native`: the pick control and the switch taking a tap at once, the quantity typed on the phone's number pad, and the Build page's length on a phone.
- [ ] **The worst cases**, led by Emil's `break-ui`, on the worst-case Build: 8 kits and 8 drives, the longest names, every kind of outcome at once, 20 Vendors in the second view, and an empty Build.
- [ ] **The choosing.** The owner's choice for each piece is recorded under Comments with the owner's words. A choice the owner refuses is rendered again.
- [ ] **The record.** Impeccable writes the choices into the Shopper app's DESIGN.md, the motion in its Motion section, before any page is built. The hard rules hold, and a piece that pulls against one is put to the owner. An ADR is written only if a choice replaces part of ADR-0013.
- [ ] `pnpm check` passes, and the work is committed.
