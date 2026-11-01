# 01: The Admin sets and reads the Platform Rate through the API

**Spec:** [the pricing spec](../spec.md)

**What to build:** Through the API, the Admin sets the Platform Rate, a whole number of IQD per USD, and reads the current one back with when it was set (PRC-1). Every setting is kept, with its time from the API's clock and the Admin's Login, and the newest is the current Platform Rate. Until the first setting there is no Platform Rate, and the read says so. Nothing fetches the rate from a service, and nothing sets it but the Admin (ADR-0002). No screen shows it yet. The integration tests are the proof.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] **The table.** One row for each setting: the rate as whole dinars per dollar, the time it was set, and `set_by`, the Caller's Login identifier. Rows are only ever added, never changed or deleted. The newest row is the current Platform Rate. The table is made by a migration generated with `pnpm db:generate`, and the migration is committed. No migration and no development service writes a row.
- [ ] **The check.** The rate is checked once, in the domain: a whole number from 500 to 5,000. A refusal is `NOT_VALID` with `field: 'iqdPerUsd'` and one of the reasons `missing`, `notANumber`, `notWhole` and `outOfRange`.
- [ ] **The API as the source of time.** The time of a setting comes from the API's clock, never from the database's `now()`, and the column has no default.
- [ ] **The use cases.** `SetPlatformRateCommand` and `ReadPlatformRateQuery`, with their own Input and Output classes, the `PlatformRate` entity and the abstract `PlatformRateStore` with its database implementation, in a `platform-rate` domain folder and a matching infrastructure module.
- [ ] **The endpoints.** `GET v1/platform-rate` answers `{ current: { iqdPerUsd, setAt } }`, or `{ current: null }` when no rate has been set. `PUT v1/platform-rate` takes `iqdPerUsd` as a JSON whole number, adds a row, and answers 200 in the same shape as the read. Setting a rate equal to the current one adds a row too. Both carry `@PreAuthorize([Role.ADMIN])`.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] `pnpm integration:check` gains these tests and passes:
  - With no rate set, the read answers `{ current: null }`.
  - The Admin sets 1,575 and reads it back, with the time of the moved clock.
  - Setting 1,600 makes it the current rate. Setting 1,600 again, later, moves its time.
  - Each setting adds one row with its rate, its time and the Admin's Login identifier, read from the database by a helper like `offerHistoryRows()`.
  - 499, 5,001, 1575.5, a text and a missing rate are each refused, naming `iqdPerUsd` and the reason. 500 and 5,000 are accepted.
  - A Vendor's token is answered 403 with `ACCESS_DENIED` at both endpoints, and a call without a token is answered 401.
- [ ] Shown once and then reverted, each failing its own test: the Admin-only rule removed from the setting; the upper limit removed; the database's clock used for the time of a setting; an equal rate skipped instead of added.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.
