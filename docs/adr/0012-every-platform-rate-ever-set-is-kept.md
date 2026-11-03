# Every Platform Rate ever set is kept, one row to a setting

A decision of the `pricing` module, which is costly to undo once real Platform Rates are set, because undoing it wrongly deletes what cannot be reconstructed. The module's spec is [.scratch/pricing/spec.md](../../.scratch/pricing/spec.md), and the requirement is PRC-1: the Admin types in the Platform Rate, which is never fetched from an exchange-rate service ([ADR-0002](0002-platform-rate-set-by-hand.md)), and a change of it takes effect on every Converted Price at once. The owner asked for this record on 3 November 2026.

**Every setting of the Platform Rate adds a row to its own table, `platform_rate`, and no row is ever updated or deleted.** Each row holds the rate in whole dinars per dollar, the time from the API's clock, and the Caller's Login identifier, the Admin's. The current Platform Rate is the newest row, by its time and then by the order the rows were added. Setting a rate equal to the current one adds a row too, so that the day shown says when the Admin last checked it. The Store can only add a row and read the current one.

A Converted Price is never stored: every read derives it from the Quoted Price and the current rate, which is how a new rate reaches every Converted Price at once. A Converted Price a Shopper saw on a past day therefore exists only as a pair, the Quoted Price then, which the Offer history keeps (OFF-10, [ADR-0010](0010-offer-history-kept-apart-from-the-offer.md)), and the rate then, which only this table keeps: the rate is typed in by hand to follow the Erbil market rate, and no service holds its past values to fetch later. OFF-10 keeps the Quoted Prices' history because it cannot be reconstructed later, and the same is true of the rate.

## Considered Options

- **One row holding the current rate, changed in place.** The usual shape for a single setting, with nothing to order. Each setting would overwrite the last, and the rates behind every past Converted Price would be lost: the Offer history would keep the Quoted Prices with nothing to convert them by.
- **The current rate in one row and its history in a second table**, as an Offer and its history are kept. Two copies of the same rate, to keep in step in one transaction. An Offer needs a row of its own, one for each Vendor and Part, which its Vendor changes and removes; the rate is one value, never removed, so its newest row is the current one.

## Consequences

- The table grows by one row each time the Admin sets the rate. Every query that shows prices reads the current rate as a subquery, through the index on its time and order, `platform_rate_set_at_index`, so that one answer reads one rate.
- Changing a row in place, deleting old rows to tidy the table, or keeping only the current rate would each lose the rates behind past Converted Prices. A change to how the rate is stored, once a real rate is set, is put to the owner first.
- Nothing reads the history back yet, and no endpoint answers it. The integration tests read its rows from the database, as they read the Offer history's. The end-to-end tests set rates of their own in the development database, which keeps them until `pnpm services:reset`.
- A later module that needs a Converted Price as it was at a past time takes the newest rate set at or before that time and the Quoted Price the Offer history holds for it, and converts by the one rule; no module stores a Converted Price for this. Showing the history to the Admin would add a reader of this table and change nothing in it.
- Where the conversion is computed, in the query that reads the Offers today, is not part of this decision: it can move without losing anything.
