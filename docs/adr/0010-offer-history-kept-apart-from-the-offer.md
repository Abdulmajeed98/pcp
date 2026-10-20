# The Offer history is kept apart from the Offer, keyed by Vendor and Part

A decision of the `offers` module, which is costly to undo once real Vendors' prices are recorded, because undoing it wrongly deletes what cannot be reconstructed. The module's spec is [.scratch/offers/spec.md](../../.scratch/offers/spec.md), and the requirement is OFF-10: every change to an Offer's Quoted Prices or in-stock status is recorded with its time from the first day, and nothing in the MVP shows it.

**The history is its own table, `offer_history`, keyed by the Vendor and the Part, with no reference to the Offer.** Each row holds what changed (`created`, `changed` or `removed`), the time from the API's clock, the Vendor, the Part, the USD price, the IQD price and the in-stock status after the change, and the Caller's Login identifier, the Admin's when the Admin acts as the Vendor. It references the Vendor and the Part, neither of which is ever deleted, and not the Offer, so nothing cascades into it. A row is written in the same transaction as the change it records. Removing an Offer deletes the Offer's row and adds a `removed` row to the history; offering the same Part again adds a `created` row after it, so one Vendor's history of one Part reads in order across removals.

A Confirmation that changes neither a price nor the stock adds no row, and neither does a change to the warranty alone, so the history holds the changes OFF-10 asks for and nothing more.

## Considered Options

- **A history referencing the Offer, removed with it.** The usual shape, with a foreign key and a cascade. A removal would delete the Offer's whole history, and an Offer removed and added again would start a history unconnected to the first. OFF-10 asks for a record that cannot be reconstructed later, and a Vendor removes Offers as part of its ordinary work.
- **A history referencing the Offer, with removal as a mark on the Offer.** The Offer would stay as a row that is no longer offered. Every query of Offers, the visible-Offer rule among them, would then have to leave removed ones out, and the unique pair of Vendor and Part would refuse the Part offered again.
- **Prices and stock kept only on the Offer, each change overwriting the last.** Nothing to keep in step, and no record: what OFF-10 rules out.

## Consequences

- The history survives an Offer's removal, and a Part offered again continues the same Vendor's history of it.
- Giving `offer_history` a foreign key to `offer`, above all one that cascades, would delete history at each removal. Any change to how the history is keyed is a change to how Offers are stored once real Vendor data exists, which the MVP spec's boundaries ask the owner about first.
- Nothing reads the history back yet, and no endpoint answers it. The integration tests read its rows from the database, as the one exception to testing the platform from the outside. A later reader finds one Offer's history by Vendor, Part and time, which an index serves.
- A Store that changes an Offer's prices or stock writes the row itself, in its transaction, and decides whether anything changed by comparing the prices in whole cents and the stock, so that a save that changes nothing adds no row.
