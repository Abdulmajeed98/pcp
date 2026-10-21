# Spec: Redesign

Status: needs-triage

A short hand-over, written on 21 October 2026 when the design skills were set up. The redesign session triages it, settles its open questions with the owner and writes the full spec and tickets. It follows [docs/agents/design-skills.md](../../docs/agents/design-skills.md) for which skill leads which area.

## Problem Statement

The owner finds the dashboard cold, linear, rigid and without taste: it reads as made by an AI, though Impeccable designed it. Part of the cause is written into [apps/dashboard/DESIGN.md](../../apps/dashboard/DESIGN.md) itself: screens "in the manner of Linear", "nothing that moves without reason", flat surfaces, stock Geist, and no motion section. Taste's chapter on app screens names stock Geist among the marks of "a well-applied kit, not a product with its own identity". The Shopper app has not been built far yet, and the owner wants it designed the same new way so that it does not end up the same.

## Order agreed with the owner

1. **Capture the current dashboard and critique it.** The Catalog, a Part, the Vendors, the portal's Offers and the Offer form, at phone and desktop widths, in English and Kurdish. Beside each screen, Taste's findings (its redesign audit and `inspect.mjs --app`), Emil's review and Impeccable's critique, rendered in the built-in browser for the owner.
2. **Review the hard rules against the skills.** Go through the root [DESIGN.md](../../DESIGN.md)'s floor and PRODUCT.md's Accessibility & Inclusion with the owner, and keep, adjust or drop each rule where it makes screens rigid. WCAG 2.2 AA is the owner's standard and is not part of this review unless the owner reopens it.
3. **Decide whether "the Rate Board" stays.** The idea of figures on graphite plates, taken from Erbil's money changers, is the kind of subject-born concept Taste asks for; the critique shows whether the execution or the idea is at fault.
4. **Deal directions and choose.** Taste's `draw.mjs --app` for the dashboard, with pictures of Erbil from `assets.mjs`, each option rendered with realistic, obviously fictional data, and chosen by the owner by eye.
5. **Rewrite the dashboard's DESIGN.md** with Impeccable, and an ADR that replaces the parts of [ADR-0007](../../docs/adr/0007-a-look-and-components-for-each-app.md) it changes. Motion gets its own section, led by Emil's skills.
6. **Build it**, screen by screen, in tickets.
7. **The Shopper app the same way**, through Taste's page run for its public pages.

## Open questions

- **Logged-in screens for Taste's inspector.** `inspect.mjs` opens a URL in its own headless Chrome, and every dashboard screen sits behind the Keycloak login. Earlier sessions captured logged-in screens with a throwaway end-to-end test (see the accounts tickets); whether the inspector can judge those captures, or needs another way in, is untested.
- **Fictional data.** Where the realistic, made-up Vendor and Offers live: the development database's seed, the capture test, or both.
- **Fonts.** Any new typeface must be self-hosted and draw all of Sorani (ADR-0006), which narrows what Taste's type library can deal.
