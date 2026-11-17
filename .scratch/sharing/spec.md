# Spec: Sharing

Status: resolved

This is `sharing`, the ninth module in the build order of [the MVP spec](../mvp/spec.md)'s capability map, after `builder` and beside `part-requests`. It covers SHR-1 to SHR-7, success criteria 7 and 8, and the shared Build's half of criterion 12. This spec uses the vocabulary of [CONTEXT.md](../../CONTEXT.md) and follows [ADR-0003](../../docs/adr/0003-three-apps-one-api-keycloak.md), [ADR-0004](../../docs/adr/0004-architecture-per-app.md), [ADR-0008](../../docs/adr/0008-language-in-the-address-and-two-message-formats.md), [ADR-0009](../../docs/adr/0009-vendors-in-the-database-logins-in-keycloak.md), [ADR-0011](../../docs/adr/0011-the-dashboards-look-is-framed-sheet.md) and [ADR-0013](../../docs/adr/0013-the-shopper-apps-look-is-the-printed-price-list.md). It builds on the conventions that every earlier module recorded in the MVP spec, and on `builder`'s above all: `GET v1/build`, the Build's cookie, its forms and the Vendors' sheet.

On 17 November 2026 the owner chose `sharing` before `part-requests` and confirmed the test seams. They are the four that already exist: `pnpm check`, the API from the outside over a real PostgreSQL and Keycloak, the running platform in a browser, and the Shopper app's own functions. There is no new seam. The dashboard's new screen and the Vendor portal's count are tested through the browser, so the dashboard still gets no unit-test tool.

Some words need care. A **Build** and a **Referral** mean what CONTEXT.md says. SHR-1's "frozen copy of its Parts and quantities, stored by the platform" needs a term of its own, because a Shopper's Build lives in their browser and can change, while this copy never changes. The first ticket adds **Shared Build** to CONTEXT.md before any code uses it: a frozen copy of a Build's Parts and quantities, stored by the platform behind a link, which never changes. Words to avoid: saved build, snapshot, public build, build link. "The Build page" stays the Shopper's own Build. **The Shared Build page** is the page a Shared Build's link opens. A Vendor's **Referral count** is how many Referrals name it.

## Problem Statement

A Shopper can now plan a whole PC, check it and see what it costs at each Vendor. But the Build lives only in their own browser. They cannot show it to a friend who knows PCs, or to a relative who is paying for it. They cannot send it to the shop they chose, so they read the Parts out over the phone or type them into a chat, one name at a time, and the Vendor has to look each one up. Nothing on the platform helps the Shopper get from "this Vendor has most of my Parts" to a conversation with that Vendor.

The Admin has no way to show a Vendor that the platform sends it customers. Listing is free, so that evidence is what keeps Vendors confirming their Offers. A Vendor cannot see it either, and nothing tells it whether keeping its prices current is worth the effort.

## Solution

**A Shopper can share their Build.** One button on the Build page stores a Shared Build and opens its page, whose address is the link to send. The same Build shared twice gives the same link. A changed Build gives a new one, and the old link keeps showing what it showed. On a phone the page offers the phone's own share sheet. Without script the link is shown so it can be copied.

**Anyone who opens the link sees the Shared Build page**, in the language the sender used. It shows the Shared Build's Parts with today's prices in both price views, and today's Compatibility Problems, Compatibility Warnings and unchecked rules. It says whether the Build is a Complete Build and gives its Estimated power draw, just as the Build page does. The page says that the Parts are as they were shared and that the prices are today's. Its reader can copy the Shared Build into their own builder and change it there. The Shared Build itself never changes. A link pasted into a chat shows a preview with no price.

**In the second price view, each Vendor with a WhatsApp number has a "send on WhatsApp" button**, on the Build page and on the Shared Build page. One tap shares the Build first if it has not been shared yet. It records a Referral and opens a WhatsApp chat with that Vendor in a new tab, with a message in the page's language that holds the Shared Build's link. The platform sends nothing itself.

**The Admin console gets a Referrals screen** with every Vendor's Referral count. **The Vendor portal shows a Vendor its own count**, and the Admin sees the same count while acting as that Vendor. No Shopper and no other Vendor ever sees a count.

The API gains public endpoints:
- one that shares a Build;
- one that reads a Shared Build;
- one that records a Referral.

It also gains two endpoints that read Referral counts, for the Admin and for a Vendor's own Login. A Shared Build is read through `GET v1/build`, as `builder` intended, so its prices and rules are worked out once.

## User Stories

### Sharing a Build

1. As a Shopper, I want a button on my Build page that shares my Build, so that I can send it to someone (SHR-1).
2. As a Shopper, I want sharing to take me to the page my link opens, so that I see what the person I send it to will see.
3. As a Shopper, I want to send the link from my phone's own share sheet, so that I can pick WhatsApp, Telegram or any other app I use.
4. As a Shopper on a browser without a share sheet, I want to copy the link with one tap, so that I can paste it anywhere.
5. As a Shopper without script, I want the link shown as text, so that I can still copy it.
6. As a Shopper, I want to share a Build at any stage, even with one Part, so that I can ask for advice before it is finished (BLD-5).
7. As a Shopper with an empty Build, I want no share button, so that I never send a link to nothing.
8. As a Shopper, I want sharing my unchanged Build again to give the same link, so that I do not end up with several links to one Build.
9. As a Shopper who changed their Build after sharing it, I want sharing again to give a new link, so that the people who have the old link still see what I sent them (SHR-4).
10. As a Shopper, I want the page I reach after sharing to tell me that later changes to my Build will not change this link, so that I know to share again.
11. As a Shopper, I want a Part that has left the catalog dropped from my Build before it is shared, so that a link never holds a Part nobody can see.

### Opening a shared link

12. As anyone who opens a link to a Shared Build, I want to see its Parts, each with its quantity, so that I see the PC the sender planned (SHR-1).
13. As someone who opens a link, I want the prices shown as they are today, in my chosen currency, so that I never act on a price that has since changed (SHR-2).
14. As someone who opens a link, I want both price views, the Lowest Price for each Part with its total and each Vendor's total with the Parts it lacks, so that I can compare as the sender did (SHR-2).
15. As someone who opens a link, I want today's Compatibility Problems, Compatibility Warnings and unchecked rules listed in words that name the Parts, so that I can see whether the Build works (SHR-2, BLD-4).
16. As someone who opens a link, I want to be told whether the Build is a Complete Build and what it still needs, and its Estimated power draw, so that I read it as the sender's Build page reads it.
17. As someone who opens a link, I want a Part that no Vendor has in stock today shown as such and left out of every total, as on a Build page (BLD-9).
18. As someone who opens a link, I want the page to say when it was shared, so that I know how old the list of Parts is.
19. As someone who opens a link, I want the page to say plainly that the Parts are fixed and the prices are today's, so that I do not mistake it for the sender's live Build.
20. As someone who opens a link, I want the page in the language the sender used, so that the sender and I see the same words (ADR-0008).
21. As someone who opens a link, I want to switch the language, currency and scheme as on any page, so that I can read it my way.
22. As someone who opens a link, I want each Visible Part to lead to its Part page and each Vendor to its Vendor page, so that I can look closer.
23. As someone who opens a link whose Parts have since left the catalog, I want the page to say so, rather than fail.
24. As someone who opens a link that does not exist, I want the not-found page in that language, so that a mistyped link is not a blank screen.
25. As someone who opens a link on a slow phone, I want the page to work before any script has loaded, as every Shopper page does.
26. As someone who opens a link, I want the frame to lead to my own Build and show how many Parts it holds, so that a shared Build never replaces mine without my doing.

### Copying a Shared Build

27. As someone who opens a link, I want to copy the Shared Build into my own builder, so that I can change it (SHR-3).
28. As someone with a Build of their own, I want to confirm once before a copy replaces it, so that I never lose a Build by one tap.
29. As someone with an empty Build, I want the copy made without a question, since nothing is lost.
30. As the Shopper who shared the Build, I want the page to tell me when it is the Build I hold now, without a copy button, so that I do not copy my own Build over itself.
31. As someone who copied a Shared Build, I want to land on my Build page holding its Parts, so that I can start changing it at once.
32. As the sender, I want my Shared Build to stay as I shared it whatever anyone does with a copy, so that the link always shows what I sent (SHR-3, success criterion 7).
33. As someone who copies a Shared Build, I want a Part that has left the catalog left out of my copy, so that my Build holds only Parts that exist.
34. As someone without script, I want copying and its confirmation to work, as emptying a Build does.

### Sending to a Vendor

35. As a Shopper, I want a "send on WhatsApp" button beside each Vendor in the second price view, so that I can ask the Vendor that has most of my Parts about them (SHR-5).
36. As a Shopper, I want the chat to open with a message in my page's language that holds my Build's link, so that the Vendor sees exactly which Parts I mean (SHR-5).
37. As a Shopper who has not shared yet, I want the button to share my Build for me, so that I need no second step (SHR-5).
38. As a Shopper, I want the chat to open in a new tab, as the Vendor page's WhatsApp link does, so that my Build page stays where I left it.
39. As a Shopper, I want the button on the Shared Build page too, so that a friend who received my link can send it to a Vendor.
40. As a Shopper, I want no button beside a Vendor that gave no WhatsApp number, with its Vendor page still linked, so that I never tap a button that cannot work.
41. As a Shopper, I want the message to name no price, so that a chat a Vendor keeps never shows a price that has since changed.
42. As a Shopper whose Vendor was deactivated since the page was drawn, I want to be told it cannot be reached through the platform, rather than sent to an empty chat.
43. As a Shopper, I want the platform to send nothing on my behalf, so that only I decide what reaches the Vendor (ACC-4's rule, the MVP's scope).

### Referrals

44. As the owner, I want each tap on "send on WhatsApp" recorded as a Referral with the Vendor, the Shared Build and the time, so that I can show a Vendor what the platform brings it (SHR-6).
45. As the owner, I want a Referral to hold nothing about the Shopper, so that the platform keeps no personal data for it.
46. As the Admin, I want a Referrals screen listing every Vendor with its Referral count, most first, so that I can see which Vendors the platform sends Shoppers to (SHR-7).
47. As the Admin, I want Vendors with no Referral listed with zero, and deactivated Vendors marked as such, so that the list is the whole picture.
48. As the Admin, I want each Vendor on the list to lead to its page, so that I can act on it.
49. As the Admin, I want the Referrals screen usable on my phone, as every Admin screen is.
50. As a Vendor, I want to see my own Referral count in my portal, in my language, so that I know Shoppers are sending me their Builds (SHR-7).
51. As the Admin acting as a Vendor, I want to see the count that Vendor sees, so that I can show it to the Vendor in its shop.
52. As a Vendor, I want no other Vendor and no Shopper to see my count, so that it stays between me and the platform (SHR-7, the Boundaries).

### Previews

53. As a Shopper, I want a Shared Build's link, pasted into WhatsApp, to show a preview naming the Build, so that the person I send it to knows what it is (success criterion 12).
54. As a Shopper, I want the preview to hold no price, so that a chat never keeps an old price (BRW-5's rule).
55. As the owner, I want Shared Build pages kept out of search engines, so that Shoppers' Builds are not indexed.

### Phones and languages

56. As a Shopper on a phone 360 pixels wide, I want the share button, the Shared Build page, the copy and the "send on WhatsApp" button usable with a thumb in each language (LANG-8, success criterion 13).
57. As a Shopper reading Kurdish or Arabic, I want the Shared Build page right to left with every number in Western digits, and the WhatsApp message in my language (LANG-2, LANG-5).
58. As a Vendor reading Kurdish or Arabic, I want my Referral count in my language, in Western digits (LANG-5).

### The owner

59. As the owner, I want the new pieces designed in each app's chosen look, with the options rendered and chosen by eye, so that each app stays one object.
60. As the owner, I want the Kurdish and Arabic texts of this module drafted and kept for my review before launch (LANG-7).
61. As the owner, I want this module's phone checks recorded as waiting for hosting, so that they do not hold the module back.
62. As the owner, I want the decisions about stored Shared Builds and their addresses recorded in an ADR, since links in people's chats must keep working.

## Implementation Decisions

### What this module is and is not

- It covers SHR-1 to SHR-7 and makes success criteria 7 and 8 true in a browser. It makes criterion 12 true for a Shared Build up to the page's head. The preview inside the WhatsApp app itself needs a public address, so that part waits for hosting.
- It changes no price rule, no Compatibility Rule and no part of a Build's reading. A Shared Build's prices, views, outcomes, status and power draw are `GET v1/build`'s answer for its frozen Parts.
- It sends no message. Every chat is opened by the Shopper from their own WhatsApp, as `accounts`' hand-over is opened by the Admin.

### The design comes first

- The new Shopper pieces are:
  - the share button on the Build page;
  - the Shared Build page, a sheet of the same stationery with no forms that change it, showing when it was shared, with Copy into my Build and Share the link;
  - the "send on WhatsApp" control on each Vendor's line.
- The new dashboard pieces are the Referrals screen and the Vendor's count in the portal.
- No new direction is dealt. The Shopper app stays the printed price list (ADR-0013), and the dashboard stays Framed sheet (ADR-0011). Impeccable adds what each DESIGN.md lacks before anything is built.
- Each skill leads its own area, as [the design skills guide](../../docs/agents/design-skills.md) records:
  - Taste leads the composition.
  - Impeccable leads the copy, right to left and accessibility. The copy covers the share confirmation, the frozen-versus-today note and the WhatsApp message.
  - Emil Kowalski's skills lead the motion and the feel on a phone, the share sheet and the hand-off to WhatsApp among them.
  - `break-ui` runs on the Shared Build page and the Referrals screen with the worst cases below.
- The options for each piece are rendered in the built-in browser with the made-up shop's data, in Kurdish and English, at a phone's width and a desk's, one option to an anchor and two columns at most. The owner chooses by eye.
- The Referrals screen is the Catalog's kind of list, like Expiring Offers. Where the Vendor's count stands in the portal is the design ticket's to propose and the owner's to choose.
- The hard rules hold. A piece that pulls against one is put to the owner. An ADR on the look is written only if a choice replaces part of ADR-0011 or ADR-0013.
- The API's endpoints and the Shopper app's functions with no look can be built while the design is chosen. No page or screen is built before its design is recorded.

### A Shared Build

- **What is stored.**
  - A Shared Build is the Build's Parts and quantities, written as `GET v1/build`'s `part` values in the Build's order: lower-case identifiers, the catalog's order of Categories, then the Build's order for kits and drives. It is stored with the moment it was shared, by the API's clock.
  - It holds no name, no price and no specification, and it is never changed or deleted.
  - It holds nothing about the Shopper.
- **One Build, one Shared Build.** The stored text is unique. Sharing a Build whose text is already stored answers the Shared Build that holds it, so sharing an unchanged Build again gives the same link. Any change gives a new one (SHR-4), and two shares of one Build at the same moment make one Shared Build. The Shopper app therefore keeps no record of what it has shared.
- **Only Parts the catalog holds are frozen.** The Build is read through `BuildReading`, with the same refusals as `GET v1/build`, and a Part the catalog does not hold is left out before the copy is stored. A Build left empty is refused, so no Shared Build is empty.
- **Its identifier** is a random UUID, like every other identifier on the platform. It cannot be guessed, so one Shopper's Shared Build cannot be found from another's.
- **A Part that later leaves the catalog** stays in the stored copy. `GET v1/build` leaves it out of its answer, as it does for an old cookie, so the link keeps opening. The stored copy refers to Parts by text, not by a foreign key, so nothing about a Part can break it.
- **Storage.** One table for Shared Builds and one for Referrals, with forward-only migrations generated by drizzle-kit. These are the first tables that hold what Shoppers do. Links to them will sit in people's chats, so the storage, the identity rule and the address are recorded in a new ADR, ADR-0014.

### Referrals

- **A Referral** is one row: the Vendor, the Shared Build and the moment, by the API's clock. Each tap is one row. Two taps are two Referrals, as SHR-6 says. With script, the button cannot be pressed again while its first tap is being handled.
- **A Referral is recorded only for an active Vendor that gave a WhatsApp number.** Nothing else is checked. A Vendor is not refused because it lacks one of the Shared Build's Parts today, since its stock may have changed between the page being drawn and the tap.
- **A Referral count** is how many Referrals name the Vendor, over all time. A deactivated Vendor keeps its Referrals and its count.

### The API

| Endpoint | Who may call it | What it does |
|---|---|---|
| `POST v1/shared-builds` | Public | Takes `{ part: [...] }` as `GET v1/build` takes `part`. Answers 201 with `{ id, sharedAt }` when it stores a new Shared Build, and 200 with the stored one when this Build was shared before |
| `GET v1/shared-builds/{sharedBuildId}` | Public | `{ id, sharedAt, part: [...] }`, the frozen `part` values, which the Shopper app hands to `GET v1/build` |
| `POST v1/shared-builds/{sharedBuildId}/referrals` | Public | Takes `{ vendorId }`, records a Referral and answers 201 with `{ vendor: { id, name, whatsAppNumber }, referredAt }`, so that the Shopper app can open the chat |
| `GET v1/referral-counts` | Admin | One page of every Vendor, active and deactivated, each with its identifier, name, whether it is active and its Referral count, zeros included. Most Referrals first, then name, then identifier. Paged with `PagingRequest` |
| `GET v1/vendors/{vendorId}/referral-count` | Admin, the Vendor's own Login | `{ count }`, through `VendorAccessRule` |

- Each public endpoint is `@Public()`, carries `security: []`, and answers the same with a good token, a bad one or none. No public endpoint answers any Referral count.
- **Refusals:**
  - `POST v1/shared-builds` refuses, naming `part`, as `GET v1/build` refuses. It also refuses a Build that is empty once unknown Parts are left out, with the reason `empty`.
  - `GET` and `POST` under `v1/shared-builds/{sharedBuildId}` answer 404 `SHARED_BUILD_NOT_FOUND` for an unknown identifier, and for text that is not an identifier, as a Part's read does.
  - A Referral for an unknown or deactivated Vendor is answered 404 `VENDOR_NOT_FOUND`. A Vendor with no WhatsApp number is answered 400 `NOT_VALID` naming `vendorId`, with the reason `noWhatsAppNumber`.
  - The counts follow `VendorAccessRule`: another Vendor's count is answered 403 `VENDOR_ACCESS_DENIED`, a deactivated Vendor's own count 403 `VENDOR_DEACTIVATED`, and no token 401.
- **`GET v1/build`'s Vendors** each also answer whether the Vendor gave a WhatsApp number, so that the page draws the button only where it can work. Nothing else in its answer changes.
- The use cases follow the catalog's conventions: a Command to share a Build, a Command to record a Referral, and Queries to read a Shared Build, to list the Referral counts and to read one Vendor's. Each has its own Store port in the domain.

### The Shopper app

| Address | What it is |
|---|---|
| `/{language}/builds/{sharedBuildId}` | The Shared Build page |
| `POST /{language}/build/share` | Shares the browser's Build, answered 303 with its Shared Build page |
| `POST /{language}/build/send` with `vendor` | Shares the Build if needed, records a Referral, answered 303 with the WhatsApp chat |
| `POST /{language}/builds/{sharedBuildId}/send` with `vendor` | Records a Referral for this Shared Build, answered 303 with the WhatsApp chat |
| `POST /{language}/builds/{sharedBuildId}/copy` | Puts the Shared Build into the browser's `build` cookie, answered 303 with the Build page |

- **Every action is a plain form sent with POST** and answered by `answerAForm`, as `builder`'s forms are, so all of them work before any script has loaded. A refusal comes back to the page it was sent from, with its reason in the address, as a pick refused past the limits does: an empty Build, a Build the API refuses, a Vendor no longer reachable, or an API that does not answer.
- **The WhatsApp forms open in a new tab** (`target="_blank"`), as the Vendor page's WhatsApp cell does. The chat's address is written by `whatsAppChatWith` from `@pcp/links` with the number the Referral answered, never a second copy.
- **The message** is one sentence in the page's language, then the Shared Build's link. Its words are drafted in the Shopper set for LANG-7. It names the Vendor as it wrote its name, and names no price and no city. The link is the Shopper app's public address (`SHOPPER_PUBLIC_URL`) followed by the Shared Build page's address in the page's language.
- **The Shared Build page** reads `GET v1/shared-builds/{id}`, then `GET v1/build` with its `part` values in the chosen currency, in its own slice's `api` segment, on the server, after `connection()`, with `cache: 'no-store'`.
  - It draws what the Build page draws, from the same pieces, without the forms that change a Build: the status, the outcomes and their words (`findingsOf`), the power draw and both price views with their buttons.
  - It adds when the Build was shared, the note that the Parts are fixed and the prices are today's, Copy into my Build, and Share the link.
  - The pieces both pages share move down a layer where Feature-Sliced Design asks it.
- **"This is your Build"**: the page compares the browser's Build, read from its cookie, with the Shared Build's `part` values. When they are the same, it says so and offers no copy. Otherwise it offers Copy into my Build. When the browser's Build is not empty, the copy asks to confirm once first, in the way emptying a Build confirms.
- **Copying** writes the cookie with `rememberTheBuild`. Before writing, it keeps only the Parts that `GET v1/build` still answers (`heldByTheCatalog`). The copy is within the cookie's limits, since a Shared Build was read within them.
- **Share the link** uses the browser's share sheet (`navigator.share`) where there is one, and copies to the clipboard where there is not. Without script, the link is shown as text to select.
- **An unknown Shared Build** answers the not-found page with 404 in the page's language, from the page and from its preview. **One whose Parts have all left the catalog** says so, and offers nothing to copy.
- **The language rule stays ADR-0008's.** A Shared Build's link carries its sender's language, and opening it is remembered as any Shopper address is. ADR-0008 left this to `sharing`, and its amendment records the choice.
- **The preview.** The title names the Build by how many Parts it holds, in the page's language. The description names its CPU and GPU when it has them, and no price and no city. The image is the photo of its first Part with one, in the catalog's order of Categories. The page is marked for search engines not to index. It is written by a plain function, as `partPreview` is, and read by a crawler with no cookie.
- **An API that does not answer**: the page shows the frame and the sheet saying it cannot be read just now, with Try again, as every Shopper page does.
- **Words.** Every new text is in the `i18n` library's Shopper set in all three languages, using `words.md`'s terms, which gain Shared Build and Referral. The Kurdish and Arabic drafts wait for LANG-7. Part names stay in English (LANG-3).

### The dashboard

- **The Referrals screen**, at `/referrals` in the Admin console and in its navigation, is the Catalog's kind of list, drawn by `PagedList` with its page in the address. Each row names the Vendor `AsWritten`, marks a deactivated Vendor as such, gives its count, and leads to the Vendor's page. The Admin console is in English, as all of it is.
- **The Vendor's count** stands where the design ticket places it in the portal, read from `GET v1/vendors/{vendorId}/referral-count` under a query key of its own beside the Vendor's other keys, in the portal's three languages. The Admin sees it while acting as the Vendor.
- Both screens pass `pnpm dashboard:inspect`, whose made-up shop gains Referral counts: zeros, a deactivated Vendor and a count in the thousands.

### The stand-in API and the inspectors

- The Shopper's stand-in API answers `GET v1/shared-builds/{id}` for three made-up Shared Builds. Two are made from the made-up Builds `complete` and `worstCase`. The third holds only Parts no catalog holds. Its Vendors answer whether they gave a WhatsApp number, some without one. It answers no POST, as before.
- `pnpm shopper:inspect` opens a Shared Build page by its path. With `--build complete` and the `complete` Shared Build, it shows the page in its "This is your Build" state.
- No test of the platform relies on a stand-in.

### Recording

- The first ticket adds **Shared Build** to CONTEXT.md.
- The API's ticket writes ADR-0014: Shared Builds stored as frozen `part` values, unique by their text, identified by a random UUID, never changed or deleted, behind `/{language}/builds/{id}`; and Referrals stored one row a tap, holding nothing about the Shopper.
- The last ticket:
  - verifies the module from a fresh clone;
  - amends ADR-0008's consequence about shared links;
  - records **The sharing module's conventions** in the MVP spec;
  - adds the module's phone checks to **Checks on a phone wait for hosting**;
  - adds the stand-in's Shared Builds to the design skills guide.

## Testing Decisions

A good test sees the platform from the outside, as a Shopper, a Vendor, the Admin or a later module would: through the API's HTTP surface, through a browser, or through a Shopper function's own inputs and outputs. It never reads a query's SQL, a table's columns, or a helper behind a module's public face. A test that would still pass if a Referral were counted twice somewhere else proves nothing about what the Admin sees.

The owner confirmed the four seams on 17 November 2026. Tests are written before the code for these, where a mistake would mislead a Shopper, a Vendor or the Admin:
- the Shared Build's identity: the same Build gives the same Shared Build, and any change a new one;
- the frozen copy never changing;
- counting Referrals, and who may read a count.

### Seam 1: the repository root, through `pnpm check`

- **The description.** The committed OpenAPI document and the generated client match the API, with the five new endpoints and the Vendors' WhatsApp field.
- **The migrations.** The two new tables' migrations match their schema.
- **The language files.** Every new Shopper and Vendor portal text is in all three languages.
- **The stand-ins.** The Shopper's stand-in and the dashboard inspector's made-up shop type-check against `api-client`.
- **The import bans.** The new slices, and any piece moved down a layer, keep Feature-Sliced Design's rules in both frontends.
- **The Shopper's unit tests**, seam 4, run here.

Each new line is seen to fail once, through a deliberate fault that is then reverted:
- a field added to a response without `pnpm api-client:write`;
- a column added to the schema without a migration;
- the Arabic text of the WhatsApp message removed.

### Seam 2: the API from the outside, over a real PostgreSQL and a real Keycloak

`pnpm integration:check`. Vendors, Parts and Offers are made through the API, and the Platform Rate is set through it as the Admin. Nothing is mocked but the API's clock.

**Sharing a Build**

- A Build is shared and answered 201 with an identifier and the moment, by the API's clock.
- Sharing the same Build again answers 200 with the same identifier. This includes the same single-Category Parts given in another order, and identifiers in capitals.
- A changed quantity, a Part replaced, a Part added and a kit's place among the kits each give a new identifier.
- Two shares of one Build sent at the same moment give one identifier.
- A Part the catalog does not hold is left out of the frozen copy. A Build of nothing else is refused as `empty`, and so is an empty Build. Each of `GET v1/build`'s refusals is refused here too, naming `part`.

**Reading a Shared Build**

- It answers its frozen `part` values and the moment it was shared.
- Changing an Offer's price, putting it out of stock, deactivating a Vendor and editing a Part each leave the frozen values as they were, while `GET v1/build` with them answers the change (SHR-2, SHR-3).
- An unknown identifier, and text that is not one, are answered 404 `SHARED_BUILD_NOT_FOUND`.

**Recording a Referral**

- A Referral answers the Vendor's identifier, name and WhatsApp number, and the moment by the API's clock. Two Referrals for one Vendor and one Shared Build are two, and each raises its count by one.
- An unknown or deactivated Vendor is refused 404 `VENDOR_NOT_FOUND`. A Vendor with no WhatsApp number is refused 400 naming `vendorId`, and an unknown Shared Build 404. No refused Referral is counted.

**Reading the counts**

- The Admin's list holds every Vendor, active and deactivated, with its count and zeros included. It is ordered by count, then name, then identifier, and the order is proved on Vendors that tie on each key in turn. It pages through the catalog's paging.
- A Vendor's own Login reads its own count. Another Vendor's count is 403 `VENDOR_ACCESS_DENIED`. A deactivated Vendor's own Login gets 403 `VENDOR_DEACTIVATED`, and no token gets 401. The Admin reads any Vendor's.
- A Vendor's count is unchanged by Referrals to any other Vendor.

**The second view's WhatsApp field**

- Each Vendor of `GET v1/build` answers whether it gave a WhatsApp number, and `builder`'s tests of the views pass unchanged.

**Tokens**

- The public endpoints answer the same with an Admin's token, a Vendor's, a bad one or none.

Prior art: `builder`'s `build.controller.integration-spec.ts` for a Build's values and refusals, `accounts`' tests of `VendorAccessRule` for the counts' access, `offers`' tests with `moveTheClockTo` for the moment recorded, and `browse`'s list tests for the order and the paging.

### Seam 3: the running platform, from the outside

`pnpm platform:check`, in Chromium. Each test makes its own made-up Vendors, some with a WhatsApp number and one without, and its own made-up Parts and Offers, through the API. It arranges its Build with the pick form from its own browser. It compares what a page shows with what the API answers, and never quotes a translation. The WhatsApp chat is never opened: the test reads the address the new tab is sent to, and answers it with `page.route` so that nothing leaves the machine.

**In a window 360 pixels wide, in Kurdish, Arabic and English**

- **Sharing and opening the link.**
  - A Shopper shares their Build and lands on its Shared Build page, whose address is the link.
  - In a fresh browser, the link opens the same Parts, with prices that match `GET v1/build` (success criterion 7).
  - After the Admin changes one of its Offers' prices, the page shows the new price.
- **Copying the link.**
  - The fresh browser copies the Shared Build and changes the copy. Opening the link again shows it unchanged (success criterion 7).
  - With a Build of its own, the copy asks once first.
  - The sender's own browser is told it holds this Build.
- **Sharing again.** Sharing an unchanged Build again gives the same address, and sharing after a change gives a new one.
- **Sending on WhatsApp.**
  - Tapping "send on WhatsApp" for a Vendor on the Build page opens a new tab to WhatsApp's chat with that Vendor's number. Its message holds the Shared Build's link in the page's language.
  - That Vendor's count rises by one on the Admin console's Referrals screen and in its own portal, and another made-up Vendor's portal shows its count unchanged (success criterion 8).
  - The same holds from the Shared Build page.
  - A Vendor with no WhatsApp number has no button.
- **Without script.** With script switched off, sharing, copying with its confirmation, and sending all work.
- **Previews.** A Shared Build page's head, read with no cookie, holds its title, a description with no price, and its image, and asks not to be indexed (criterion 12, up to the page's head).
- **Language and layout.** Kurdish and Arabic are right to left, every number is in Western digits, Part names are in English, and `expectNoSidewaysScroll` passes.

**The dashboard**

- The Referrals screen lists the test's Vendors with their counts, a deactivated one marked, and leads to each Vendor's page.
- The Vendor portal shows the count in the three languages, and the Admin acting as the Vendor sees the same.

**Accessibility, motion and the inspectors**

- `expectAccessible` passes on the Shared Build page, the Build page with its new buttons, the Referrals screen and the portal's count, in the light and the dark scheme.
- The motion the design adds is filmed with `film` and judged by `snapsOf`, with reduced motion and without it.
- Taste's inspector, at 1440, 768 and 390 pixels, in both schemes, and at 1024 and 1280 for desk layouts:
  - `pnpm shopper:inspect` on the Shared Build page with each made-up Shared Build, in Kurdish and English, and in dollars;
  - `pnpm dashboard:inspect` on the Referrals screen, and on the portal's count in Kurdish and English.
- Every FAIL is fixed, and every WARN is fixed or defended in the ticket's Comments.

Prior art:
- `shopper-build-languages.spec.ts` for a Build arranged from the browser, the forms with script and without, and the cookie;
- `shopper-build-rules-and-prices-languages.spec.ts` for comparing a page with `GET v1/build`;
- `shopper-part-languages.spec.ts` for reading a page's head as a crawler;
- `admin-expiring-offers.spec.ts` for an Admin list found among earlier runs' rows;
- the `vendors.ts` and `offers.ts` helpers, `aMadeUpVendorThatHasLoggedIn` and `createAMadeUpPart`.

### Seam 4: the Shopper app's own functions

Vitest, as `browse` started it. Plain functions are called with their inputs and judged by their outputs, through their module's public face:

- the WhatsApp message in each language, holding the link and the Vendor's name as written, and no price;
- the Shared Build page's address and its link on the public address, in each language;
- whether the browser's Build is the Shared Build, for the same Parts, another quantity, another order of kits and an empty Build;
- the cookie written from a Shared Build's values, leaving out Parts the catalog no longer answers;
- each form's refusal read back from the address, saying nothing for what it does not know;
- the Shared Build page's preview in each language: its title, a description naming the CPU and GPU with no price, its image, and the mark not to be indexed;
- the note of when a Build was shared, in each language, in Western digits.

It never tests a server component, a page, the API or what the browser draws. Seams 2 and 3 cover them.

## Out of Scope

- **Changes to a Shared Build.** Changing, deleting or expiring one, or naming or describing it.
- **Shopper accounts.** A list of a Shopper's Shared Builds, and a Build kept across devices.
- **Short links and QR codes.** Also any address for a Shared Build other than the Shared Build page.
- **More ways to send.** A send button in the first price view, on a Part page or on a Vendor page (whose WhatsApp cell records no Referral), and sending to several Vendors at once.
- **Messages from the platform.** Any message it sends, telling a Vendor of a Referral among them (the MVP's scope).
- **More about Referrals.** Counts over a period, by day, or with the Builds behind them, a Referral's Shared Build shown to the Admin or the Vendor, and any export.
- **Protecting the public endpoints.** Rate limits and bot protection on sharing and on recording a Referral are left to the hosting work (see Further Notes).
- **Caching.** Caching a Shared Build page or its answers is left to hosting.
- **The other modules.** `part-requests` and `sheet`.

## Further Notes

- **Decisions this spec takes that the owner may want to revisit.** Each follows the MVP spec's words where they leave room:
  - **The same Build shared twice is one Shared Build**, decided by the API from the stored text, rather than remembered in the Shopper's browser.
  - **A Shared Build's identifier is a UUID**, so its link is long but cannot be guessed.
  - **The "send on WhatsApp" button also stands on the Shared Build page**, so a Referral can come from someone other than the Build's planner.
  - **A Referral is recorded for any active Vendor with a WhatsApp number**, without checking that it stocks a Part of the Build at the tap.
  - **A Vendor without a WhatsApp number has no button.**
  - **The count is over all time.**
  - **Copying asks to confirm** only when the browser holds a Build of its own.
  - **The preview's image** is the first Part's photo in the catalog's order.
  - **A shared link opens in its sender's language**, and opening it is remembered.
  - **Shared Build pages are not indexed.**
- **Costly to undo.** Unlike `builder`, this module stores data and hands out links that live in people's chats. The address `/{language}/builds/{id}` and the stored frozen copy must keep working for as long as the platform runs, which is why ADR-0014 records them.
- **Inflated counts.** The endpoint that records a Referral is public, like the Shopper's every read, so anyone could inflate a Vendor's count by calling it. The MVP accepts this, because a count only informs. The hosting work should put a rate limit in front of the public POST endpoints before Vendors are shown counts as evidence.
- **Success criteria.** This module makes criteria 7 and 8 true. It makes criterion 12 true for a Shared Build up to the page's head. It adds the Shared Build page, the Referrals screen and the portal's count to criterion 13.
- **Open checks.** This module's checks on a phone wait for hosting, as every module's do:
  - the share button and the phone's share sheet used with a thumb, in Kurdish and in English;
  - "send on WhatsApp" opening the WhatsApp app in a chat with the Vendor, with the message written in each language;
  - a Shared Build's link pasted into WhatsApp showing its preview in each language, which needs a public address;
  - Copy into my Build and its confirmation with a thumb;
  - the Vendor's count read in the portal on a phone;
  - the motion felt on a real phone, with reduced motion on and off.
- **LANG-7.** The Kurdish and Arabic texts this module adds, the WhatsApp message among them, join the review that stays open until launch.
- **Next steps.** `part-requests` can start beside this module, or after it. `sheet` follows both.
