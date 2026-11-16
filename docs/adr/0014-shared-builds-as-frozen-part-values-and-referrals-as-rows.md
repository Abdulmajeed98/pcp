# Shared Builds are stored as frozen `part` values, and Referrals one row a tap

A decision of the `sharing` module, which is costly to undo, because a Shared Build's link lives in people's chats for as long as the platform runs, and a Referral, once counted, cannot be counted again. The module's spec is [.scratch/sharing/spec.md](../../.scratch/sharing/spec.md), and the requirements are SHR-1 to SHR-7: sharing a Build creates a link to a frozen copy of its Parts and quantities, stored by the platform, which never changes; a changed Build shared again creates a new link; and each tap on "send on WhatsApp" is recorded as a Referral, with the Vendor, the Build and the time.

**A Shared Build is stored as the Build's frozen `part` values, unique by their text, behind a random UUID, and is never changed or deleted.** Its table, `shared_build`, holds one row for each Shared Build: the Build's `part` values as `GET v1/build` takes them, written as one text, the moment it was shared by the API's clock, and its identifier. The values are lower-case identifiers, in the catalog's order of Categories, then the Build's order for RAM kits and drives, each kit or drive followed by `:` and its quantity, joined by commas: `<cpu>,<board>,<kit>:2,<drive>:1`. A Part the catalog does not hold is left out before the values are written, and an empty Build is refused, so no Shared Build is empty. The text holds no name, price or specification, and no reference to a Part: a Shared Build's prices, views and rules are `GET v1/build`'s answer for its values on the day it is opened (SHR-2), and a Part that leaves the catalog stays in the text while `GET v1/build` leaves it out, as it does for an old Build in a Shopper's cookie.

**The text is unique**, by the rule `shared_build_part_values_unique`, so the same Build shared again answers the Shared Build already stored, and any change answers a new one (SHR-4). The rule alone decides, with no read before the insert, so two shares of one Build at the same moment make one Shared Build. The Shopper app keeps no record of what it has shared.

**Its identifier is a random UUID**, as every identifier on the platform is, and the Shared Build page's address is `/{language}/builds/{id}` in the Shopper app. It cannot be guessed, so one Shopper's Shared Build cannot be found from another's.

**A Referral is one row a tap**, in its own table, `referral`: the Vendor, the Shared Build and the moment, by the API's clock, each tap a row of its own (SHR-6). It references the Vendor and the Shared Build, neither of which is ever deleted. A Vendor's Referral count is how many rows name it, over all time, and a deactivated Vendor keeps its rows. **Neither table holds anything about the Shopper**: no address, no device, no cookie and no Login, since Shoppers have none.

## Considered Options

- **The Build in the link itself**, with nothing stored: the cookie's text, encoded into the address. Nothing to keep, but the link would be as long as the Build, a Referral would have no Shared Build to name, and SHR-1 asks for a copy stored by the platform.
- **One row for each Part of a Shared Build, with a reference to the Part.** The usual shape, and a Shared Build could be found by its Parts. A Part that leaves the catalog would then have to take its rows with it, changing a copy that must never change, or be kept from leaving; and the same Build shared again could not be found by one unique rule.
- **A name, price or specification copied into the Shared Build.** What the sender saw, kept. SHR-2 asks for today's prices and today's Compatibility Problems, so a copied price would only mislead, and the Parts' own pages already hold their details.
- **A short or counted identifier.** A shorter link, but one that can be guessed, so that anyone could read every Shopper's Shared Builds in turn.
- **Each share a new Shared Build, or the Shopper's browser remembering what it shared.** No unique rule to meet; but sharing an unchanged Build twice would give two links, and a browser that forgot would give a third.
- **A count kept on each Vendor, raised at each tap.** One number to read; but it would lose the Shared Build and the time SHR-6 asks to record, and a later count over a period could not be made from it.

## Consequences

- The address `/{language}/builds/{id}`, the identifier and the stored text must keep working for as long as the platform runs. A link is never broken by tidying: no row of `shared_build` is changed or deleted, and nothing expires.
- The stored text is a format. `GET v1/build` must keep reading every value it has ever taken, and the API must keep writing the values in the same order and form, or the same Build shared again would be a second Shared Build. A new form of a value is added beside the old ones, never in place of them.
- A Part that leaves the catalog leaves its Shared Builds readable, without it. The integration tests take one out through the database, as no endpoint can, to prove it.
- Both tables grow with use and are never trimmed. `referral` is read by its Vendor, through an index on it. Sharing and recording a Referral are public, so anyone could fill either table or raise a Vendor's count; the hosting work puts a rate limit in front of them before Vendors are shown their counts as evidence.
- A later count over a period, by day or with the Shared Builds behind it, reads the rows already kept, and needs no change to them.
- Changing how either is stored, once real Shoppers have shared links, is put to the owner first, as the MVP spec's boundaries ask.
