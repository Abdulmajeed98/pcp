# 02: Design the Shopper's sharing pieces

**Spec:** [the sharing spec](../spec.md)

**What to build:** The share button, the Shared Build page, Copy into my Build and the "send on WhatsApp" button are pieces that [the Shopper app's DESIGN.md](../../../apps/shopper/DESIGN.md) does not describe yet. They are designed inside the printed price list's look (ADR-0013), with no new direction dealt. The stand-in API that `pnpm shopper:inspect` starts first learns to answer Shared Builds, so that each piece's options are rendered with made-up data, and ticket 04 and 05's pages can be inspected without the development database. The owner chooses each piece by eye, and Impeccable writes the choices into DESIGN.md before any page is built.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] **The stand-in answers Shared Builds.**
  - It answers `GET v1/shared-builds/{id}` for three made-up Shared Builds:
    - one made from the made-up Build `complete`;
    - one made from `worstCase`;
    - one whose Parts no catalog holds.
  - `GET v1/build`'s Vendors answer whether they gave a WhatsApp number, and some of the made-up shop's Vendors have none.
  - It is typed by `@pcp/api-client`'s own types, so a change to the description that it does not follow fails `pnpm check`.
  - Writes are still refused with 405, and every other path with 404. No test of the platform relies on it.
- [ ] **`pnpm shopper:inspect` opens a Shared Build page by its path.** With `--build complete` and the `complete` Shared Build, the page is in its "This is your Build" state. The commands table and the design skills guide say how.
- [ ] **The guide is read first**, and so are DESIGN.md, ADR-0013 and `builder`'s design ticket 06.
- [ ] **The pieces to design**, Taste leading their composition inside the chosen direction:
  - the share button on the Build page, shown only when the Build holds a Part;
  - the Shared Build page as a sheet of the same stationery: its Parts with their quantities and no forms that change them, its status, its outcomes, its power draw and both price views, as the Build page draws them;
  - when the Build was shared, and the note that its Parts are fixed and its prices are today's;
  - "This is your Build", for a browser that holds the same Build;
  - Copy into my Build, with its one confirmation when the browser holds a Build of its own;
  - Share the link: the phone's share sheet, a copy where there is none, and the link as text to select without script;
  - the "send on WhatsApp" button on each Vendor's line in the second price view, a Vendor's line with no button where it gave no WhatsApp number, and what the page says when a send is refused;
  - a Shared Build whose Parts have all left the catalog.
- [ ] **The words.** Impeccable leads their copy. They are drafted in English and shown with the options:
  - the WhatsApp message: one sentence naming the Vendor, then the link, with no price and no city;
  - the note of what is fixed and what is today's;
  - the copy's confirmation;
  - the refusals.

  `words.md` gains Shared Build and Referral in the three languages, the Kurdish and Arabic drafts for LANG-7.
- [ ] **The rendering.** Each piece's options are drawn with the made-up shop and its Shared Builds, in Kurdish and in English, at 390 pixels and at 1440, at 1024 and 1280 where a desk layout differs, and in both schemes. They are served from the scratchpad, never opened as a file, and shown in the built-in browser, one option to an anchor and two columns at most, before the owner is asked. An option that breaks a hard rule says so on its page.
- [ ] **The motion**, led by Emil Kowalski's skills: whether the share, the hand-off to WhatsApp, a copy landing on the Build page and a button busy with its first tap move at all, and how, in the motion of paper and print DESIGN.md already holds. It covers reduced motion and the No Snap Rule. Movements are rendered live for the owner.
- [ ] **The feel on a phone**, led by Emil's `mobile-native`: the share sheet, a new tab opening WhatsApp, and each button taking a tap at once.
- [ ] **The worst cases**, led by Emil's `break-ui`:
  - the `worstCase` Shared Build;
  - the Shared Build whose Parts are all gone;
  - 20 Vendors, some without a WhatsApp number;
  - the longest names;
  - a Vendor name in Kurdish inside the English message.
- [ ] **The choosing.** The owner's choice for each piece is recorded under Comments with the owner's words. A choice the owner refuses is rendered again.
- [ ] **The record.** Impeccable writes the choices into the Shopper app's DESIGN.md, the motion in its Motion section, before any page is built. The hard rules hold, and a piece that pulls against one is put to the owner. An ADR is written only if a choice replaces part of ADR-0013.
- [ ] `pnpm check` passes, and the work is committed.
