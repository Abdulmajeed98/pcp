# 01: The Admin sets and reads the Platform Rate through the API

**Spec:** [the pricing spec](../spec.md)

**What to build:** Through the API, the Admin sets the Platform Rate, a whole number of IQD per USD, and reads the current one back with when it was set (PRC-1). Every setting is kept, with its time from the API's clock and the Admin's Login, and the newest is the current Platform Rate. Until the first setting there is no Platform Rate, and the read says so. Nothing fetches the rate from a service, and nothing sets it but the Admin (ADR-0002). No screen shows it yet. The integration tests are the proof.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] **The table.** One row for each setting: the rate as whole dinars per dollar, the time it was set, and `set_by`, the Caller's Login identifier. Rows are only ever added, never changed or deleted. The newest row is the current Platform Rate. The table is made by a migration generated with `pnpm db:generate`, and the migration is committed. No migration and no development service writes a row.
- [x] **The check.** The rate is checked once, in the domain: a whole number from 500 to 5,000. A refusal is `NOT_VALID` with `field: 'iqdPerUsd'` and one of the reasons `missing`, `notANumber`, `notWhole` and `outOfRange`.
- [x] **The API as the source of time.** The time of a setting comes from the API's clock, never from the database's `now()`, and the column has no default.
- [x] **The use cases.** `SetPlatformRateCommand` and `ReadPlatformRateQuery`, with their own Input and Output classes, the `PlatformRate` entity and the abstract `PlatformRateStore` with its database implementation, in a `platform-rate` domain folder and a matching infrastructure module.
- [x] **The endpoints.** `GET v1/platform-rate` answers `{ current: { iqdPerUsd, setAt } }`, or `{ current: null }` when no rate has been set. `PUT v1/platform-rate` takes `iqdPerUsd` as a JSON whole number, adds a row, and answers 200 in the same shape as the read. Setting a rate equal to the current one adds a row too. Both carry `@PreAuthorize([Role.ADMIN])`.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] `pnpm integration:check` gains these tests and passes:
  - With no rate set, the read answers `{ current: null }`.
  - The Admin sets 1,575 and reads it back, with the time of the moved clock.
  - Setting 1,600 makes it the current rate. Setting 1,600 again, later, moves its time.
  - Each setting adds one row with its rate, its time and the Admin's Login identifier, read from the database by a helper like `offerHistoryRows()`.
  - 499, 5,001, 1575.5, a text and a missing rate are each refused, naming `iqdPerUsd` and the reason. 500 and 5,000 are accepted.
  - A Vendor's token is answered 403 with `ACCESS_DENIED` at both endpoints, and a call without a token is answered 401.
- [x] Shown once and then reverted, each failing its own test: the Admin-only rule removed from the setting; the upper limit removed; the database's clock used for the time of a setting; an equal rate skipped instead of added.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

## Comments

### 2 November 2026: completed

**Commits.** `cbb9c2c` the table and its migration, the `PlatformRate` entity, the `PlatformRateStore` port and its database Store, `ReadPlatformRateQuery`, `GET v1/platform-rate`, its tests and the client written again; `1a7b0ca` the check, `SetPlatformRateCommand`, `PUT v1/platform-rate`, their tests and the client written again. Both commits span `api` and `api-client` and take no scope.

**Decisions this ticket left open.**

- **The table.** `platform_rate` holds `id`, `iqd_per_usd` (`integer`), `set_at` (`timestamptz`, no default) and `set_by` (`text`, the Caller's Login identifier, as `offer_history.changed_by` is). Its `id` is an identity column, not a random UUID as other tables have, so that the order rows were added tells apart two settings made at the same moment. The current Platform Rate is the newest `set_at`, then the highest `id`, read with an index on `(set_at, id)`. The limits are not a database check: they are checked once, in the domain. Nothing stops an `UPDATE` or a `DELETE` but the Store, which has only `add` and `readCurrent`; no trigger was added, since the tests empty every table between tests.
- **The check.** `checkIqdPerUsd` in `domain/platform-rate/PlatformRate.ts`, with `lowestIqdPerUsd` (500) and `highestIqdPerUsd` (5000), takes the value as it was sent: none or null is `missing`, anything but a JSON number is `notANumber` (the text `"1575"` too), a fraction is `notWhole`, and outside the limits is `outOfRange`, in that order. The refusal is `NOT_VALID` with `field: 'iqdPerUsd'` and the reason, and names no limit. To let a text reach the domain, `SetPlatformRateRequest` declares `iqdPerUsd` with `@Allow()` and no type check, unlike the Offer's details, whose wrong JSON kinds the request refuses with no reason. The description names it a number, from the same two constants.
- **The answer.** `PlatformRateResponse` is `{ current: CurrentPlatformRateResponse | null }`, and `CurrentPlatformRateResponse` is `{ iqdPerUsd, setAt }`, `setAt` an ISO time. The PUT answers 200 with the setting it added as `current`.
- **The read's Input** is an empty class, so that the Query keeps its own Input and Output as every use case does.
- **For ticket 03.** The table is exported as `platformRate` from `infrastructure/platform-rate/platform-rate.schema.ts` and is in the database client's schema. The Offer Store can read the newest row in its own query; `DatabasePlatformRateStore.readCurrent` orders by `set_at DESC, id DESC`.

**How it was built.** With `mattpocock-skills:tdd`, at seam 2 alone, one slice at a time: the read with no rate (red on 404), the first setting read back at the moved clock (red on 404), then the refusals (red on 200 and 500). The tests of a new rate, an equal rate and the rows passed when first run, since the setting already added a row each time; the faults below show they can fail. `platformRateRows()` in `test-utils/database/test-database.ts` reads the rows, in the order they were added. 15 tests in `test/infrastructure/platform-rate/endpoints/platform-rate.controller.integration-spec.ts`.

**The faults, each planted once by a script on the committed tree (`1a7b0ca`), run against the Platform Rate's tests, and reverted by the inverse edit; `git status` was clean after each.**

| Fault | Tests that failed | Why |
|---|---|---|
| The Admin-only rule removed from the setting (`@PreAuthorize([Role.ADMIN, Role.VENDOR])` on the PUT) | A Vendor's token refused with 403 at both endpoints | The Vendor's PUT was answered 200 |
| The upper limit removed | A rate above the highest refused | 5001 was answered 200 |
| The database's `now()` for the time of a setting | Read back with the time of the API's clock; a new rate made current; an equal rate moves its time; every setting kept | `setAt` was the container's time, 2026-11-01T23:17:01.606Z, not the moved 2027-03-14T09:26:53.589Z |
| An equal rate skipped instead of added (the Command reads the current rate and answers it when equal) | An equal rate moves its time; every setting kept | The time stayed 2027-03-14T09:26:53.589Z, and the third row was missing |

**Checks.** `pnpm integration:check` passes with 389 tests in 14 files on `1a7b0ca`, and with 377 on `cbb9c2c`; each commit was gated on it and on `pnpm check`. `pnpm check --skip-nx-cache` passes on both commits in a fresh clone, with `DOCKER_HOST` pointed at a socket that does not exist and an empty `PLAYWRIGHT_BROWSERS_PATH`. Docker itself was left running for the owner's services.
