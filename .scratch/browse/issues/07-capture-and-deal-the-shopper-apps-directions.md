# 07: Capture the Shopper app, deal its directions and choose one

**Spec:** [the browse spec](../spec.md)

**What to build:** The Shopper app's design is planned fresh, unique to it, as the owner decided on 1 November 2026. Ticket 07 holds the whole first half of that plan:

- the Shopper app as it is today is captured and critiqued;
- Taste's script deals directions for it, never an agent picking one;
- each direction is rendered as the four kinds of page, filled with ticket 06's made-up shop, in the built-in browser;
- the owner chooses one by eye, and it is kept in the repository so that every later ticket, and a fresh clone, can build and inspect to it.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] **The capture.** The Shopper app as it is (its frame, both switches, the footer's credit, the placeholder page, the not-found page) is captured with `pnpm shopper:inspect` in both schemes, in Kurdish and in English, at 1440, 768 and 360 pixels.
- [ ] **The critique.** Taste's redesign audit leads, and Impeccable's `critique` adds UX and copy. Together they cover the captured pages and the existing [apps/shopper/DESIGN.md](../../../apps/shopper/DESIGN.md), Fit Diagram, which `catalog` ticket 10 drew before any Shopper page existed. The findings are recorded under Comments. Nothing the redesign's closed tickets 14 and 15 recorded binds this plan.
- [ ] **The hard rules** of the root DESIGN.md and PRODUCT.md's Accessibility & Inclusion, as the redesign's ticket 03 left them, are restated in the brief:
  - WCAG 2.2 AA in both schemes, with a switch between them;
  - 44-pixel controls on a touchscreen;
  - 14-pixel text;
  - 360 pixels wide;
  - right to left;
  - self-hosted fonts that draw all of Sorani (ADR-0006).

  A direction that brings a new font keeps that rule, or keeps the current fonts.
- [ ] **The deal.** Taste's script deals the directions with the run its SKILL.md gives for public pages, from the repository root. Its one-line brief says three things: the Shopper compares local shops' prices in Erbil, on a phone first, in Kurdish, Arabic and English; prices and the "≈" mark are the page's centre; and the hard rules hold.
- [ ] **The world of the subject.** Pictures of Erbil's bazaar, its computer shops, signs and lettering are found with Taste's `assets.mjs`, each with its credit recorded.
- [ ] **The rendering.** Each direction is drawn as four pages: the home page, a Category page with its filters, a Part page with several Offers, one converted, and a Vendor page. Each is drawn in Kurdish and in English, at 360 and 1440 pixels, filled with ticket 06's made-up shop, so that no page is empty or a placeholder. Every option keeps the hard rules, and an option that breaks one says so on its page.
- [ ] **The choosing.** The options are shown in the built-in browser on one page, one option per anchor, two columns at most, before the owner is asked. If the owner takes none, the script deals again. The owner's choice is recorded under Comments with the owner's word.
- [ ] **Kept.** The chosen direction's sheet (its tokens and the inspector's allowances) is committed under the Shopper app's design folder, as the dashboard's is, since Git ignores `.taste-skill/`. A note under Comments says how to restore it there for the inspector.
- [ ] `pnpm check` passes, and the work is committed.
