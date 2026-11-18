# 02: Design the dashboard's Part Request pieces

**Spec:** [the part-requests spec](../spec.md)

**What to build:** Part Requests bring pieces to both halves of the dashboard that [the dashboard's DESIGN.md](../../../apps/dashboard/DESIGN.md) does not describe yet. They are designed inside Framed sheet (ADR-0011), with no new direction dealt.

- **In the Vendor portal:**
  - the Part Requests section in the top bar;
  - the Part Request form;
  - the Vendor's list with its three states;
  - the empty catalog search's action that opens the form.
- **In the Admin console:**
  - the Part Requests section;
  - the queue;
  - one request, with Match it to a Part, Create the Part and Reject;
  - the match search;
  - the new-Part form opened from a request;
  - the rejection's dialog.

The inspector's made-up shop first learns to answer Part Requests, so that every option is shown with realistic, obviously fictional data. The owner then sees the options rendered and chooses by eye, and Impeccable records the choices. No screen is built here: tickets 03 and 04 build them to this ticket's record.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] **The made-up Part Requests.** The dashboard's made-up shop answers the queue, one request and a Vendor's list. It answers a page at a time in the API's order, typed against `api-client`, and refuses every write as before. Its requests come in every state:
  - open ones, one of them sent 40 days ago, whose Offer would be expired;
  - a fulfilled one whose Offer exists, and one whose Offer was removed;
  - a rejected one with a long reason.

  They belong to the shop's Vendor, for its portal, and to other Vendors, a Deactivated one among them, for the queue.
- [ ] **The worst cases.** `pnpm dashboard:inspect --part-requests worstCase|one|none` answers the lists at their worst, with one request, or with none, as `--referrals` does. At their worst they hold:
  - the longest name and part number the API takes, and a name with no space;
  - names in Kurdish and Arabic script, and a name that starts with a digit;
  - prices at their limits in both currencies;
  - a 300-character reason in Kurdish;
  - a request waiting hundreds of days;
  - a queue of thousands.
- [ ] **The screens as they are.** The catalog search's empty result, the portal's top bar and the Admin console's sections are captured and critiqued before anything is proposed, by Taste's audit with Impeccable's `critique`.
- [ ] **What DESIGN.md lacks.** Impeccable adds to the dashboard's DESIGN.md whatever these pieces need and it does not yet say, before options are drawn.
- [ ] **The options, rendered.** Each piece is shown in two or three options in the built-in browser, from a page served from the scratchpad, never `file://`. One option goes to an anchor, at most two columns, with the made-up data. The portal's pieces are shown in Kurdish and English, all of them at a phone's width and a desk's. Each skill leads its own area, as the design skills guide records:
  - Taste leads the composition, above all how the three ways stand on one request's screen;
  - Impeccable leads the copy, right to left and accessibility. The copy covers the three states, the warning that an Offer would be expired, a `created`, `replaced` or `kept` Offer, and the case of a Part created whose request stays open;
  - Emil Kowalski's skills lead the motion and the feel on a phone, a row leaving the queue among them;
  - `break-ui` runs on both lists and one request's screen with the worst cases above.
- [ ] **The open choices are put to the owner:**
  - whether the count of open requests shows in the sidebar;
  - how the three ways stand on one request's screen;
  - lucide's icon for the section;
  - where the empty search's action stands.

  Any piece that pulls against a hard rule is put to the owner too.
- [ ] **The record.** The owner's choices go under Comments, and Impeccable writes them, with their motion, into the dashboard's DESIGN.md. An ADR is written only if a choice replaces part of ADR-0011.
- [ ] **Gates.** `pnpm check --skip-nx-cache` passes. The made-up shop is typed against the client, and its tests pass.

## Comments
