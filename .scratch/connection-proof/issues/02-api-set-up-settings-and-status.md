# 02: The API is set up by one function, reads checked settings and answers its status

**Spec:** [the connection proof spec](../spec.md)

**What to build:** The API's shell becomes something a guard can be added to. The API is set up by one function, which the real start and every test both call. It reads its settings through NestJS's configuration module and refuses to start on a malformed one. Every error it answers has the workplace's body. It accepts browser calls from the dashboard's address and from no other. Its placeholder endpoint gives way to `GET /v1/status`, which answers the time this API process started.

`core` stops being a placeholder. It gains the workplace's two layers, the settings base, the exception filter with the error body, the allowed-origins rule and a second entry for test helpers. The workplace's lint rules for test files arrive with these first real tests.

This ticket is the preparation for ticket 03. No guard exists at the end of it, and every endpoint is still open.

The API follows the workplace's conventions, which [ADR-0004](../../../docs/adr/0004-architecture-per-app.md) lists. The workplace repository's own documents and code for these parts are read first. The patterns are reimplemented from scratch and no file is copied.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Before anything is written, the workplace repository's documents and code are read for how an application is set up apart from being started, how its settings are checked, its exception filter and error body, and its allowed-origins rule. The current documentation of `@nestjs/config` and `class-validator` is read as well. The findings are recorded under Comments.
- [x] `@nestjs/config`, `class-validator` and `class-transformer` are installed, each on the workplace's line, which accepts NestJS 11.
- [x] `core` is laid out in a domain layer and an infrastructure layer. A file in `core`'s domain layer that imports its infrastructure layer is refused by lint, with the message the API's ban carries.
- [x] `pnpm boundaries:check` gains a forbidden case and an allowed case for `core`, and passes on every line.
- [x] `core` gains a second entry, for test helpers, imported by a name of its own. It resolves in type-checking and in Jest, and an import that reaches past either entry still fails type-checking. Only test files import it. Its first helper asserts the shape of an error body.
- [x] `core`'s placeholder export and its placeholder test are deleted.
- [x] The API is set up by one function, separate from the code that starts listening. The real start and every test call that function.
- [x] The API reads two settings in this ticket: its port, and the origins it accepts browser calls from. Their defaults are the fixed development values, port 3001 and the dashboard's address. Neither is a secret and neither goes into `.env`.
- [x] A setting that is present and malformed stops the API at startup with a message that names it. With no environment file and no setting, the API starts on port 3001.
- [x] One global exception filter, registered in `core`, gives every error the agreed body: a list of errors, each with a code, a title and a detail, and no trace identifier. A request to a path that does not exist and an unexpected failure inside an endpoint both get it. The body of an unexpected failure says nothing about what went wrong inside.
- [x] The API accepts browser calls from the origins in its setting. A preflight request from the dashboard's address is allowed, and one from another address is not. A request that names no origin is not affected.
- [x] `GET /v1/status` answers the time this API process started, and answers the same time until the API is restarted. Its controller declares no path and its method carries the full path. Its answer is a Response class built by a static factory.
- [x] The status endpoint is marked as a placeholder, to be deleted when the first real Shopper endpoint arrives.
- [x] The placeholder endpoint from step 1 and its test are deleted. The API no longer imports `@pcp/compatibility`. Its manifest still lists the library, and Nx's project graph still shows the dependency.
- [x] The API's tests build the application from its real root module, set it up with the set-up function, listen on a free port and send requests with `fetch`. They cover: the status endpoint; the error body of a path that does not exist and of an unexpected failure; a preflight request from the dashboard's address and from another; and the refusal to start on a malformed setting, with the setting named.
- [x] `core` keeps its test target, with unit tests for the allowed-origins rule and the settings check.
- [x] The workplace's eight lint rules for Jest test files are re-expressed for Oxlint and applied to the test files of the API and of `core`. Each rule's presence in the pinned Oxlint is checked first, and a rule Oxlint does not have is recorded and left out. The rule that every test asserts something counts the error-body helper as an assertion.
- [x] Shown once and then reverted: each lint rule fails on a deliberate fault. With the filter removed, the error-body tests fail. With the origins rule opened to every origin, the refused preflight's test fails. With the settings check removed, the startup test fails.
- [x] Checked by hand: `pnpm exec nx serve @pcp/api` starts with no environment file and `GET /v1/status` answers. Started with a malformed setting, it stops and names the setting.
- [x] `pnpm check` passes with Docker stopped.
- [x] No file is copied from the workplace repository.
- [x] The results of the fault checks and the by-hand checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 9 October 2026: completed

**What was read first.**

- In the workplace repository: an app's `bootstrap` file, which sets the application up in `configureApplication` and starts it in `bootstrap`; the settings classes of its core library and of one app, each checked with `class-validator` in a `validate` function; its exception filter, its error module and its error body; and its allowed-origins helper. Its tests call the same `configureApplication` as the real start.
- `@nestjs/config`, from the descriptions the installed package carries for its own options, because the page on NestJS's documentation site could not be fetched. `ignoreEnvFile` leaves `.env` files unread. An exception thrown in `validate` "would prevent the application from bootstrapping". The values `validate` returns are what the configuration service answers with, before it looks at the environment.
- `class-validator`'s README: custom decorators are made with `registerDecorator`, `each: true` checks every entry of a list or a set, and `validateSync` takes the same options as `validate`.

**The packages.** `@nestjs/config` 4.0.4, `class-validator` 0.14.4 and `class-transformer` 0.5.1, each on the workplace's line. None has an install script. `@jest/globals` 30.3.0 was added for the test helpers, which sit in `core`'s source and are type-checked without Jest's global types.

**Two copies of NestJS, and why the root now lists `supports-color`.** The first test that used `core`'s filter failed with "Nest can't resolve dependencies of the ErrorResponseExceptionFilter". `core` and the API were linked to two different copies of `@nestjs/common` and `@nestjs/core`, and NestJS cannot inject a class from one copy into the other.

- pnpm keeps a copy of a package for each set of peers it resolves. `debug`, deep inside `@nestjs/common`, takes `supports-color` as an optional peer. The workspace holds versions 7.2.0 and 8.1.1 of it, and pnpm chose one for the API and the other for `core`.
- `pnpm dedupe` did not merge the two copies. Listing the same peers in `core`'s manifest did not either.
- pnpm resolves a peer from the root manifest's dependencies first. With `supports-color` 7.2.0 listed there, both projects link to one copy. This was tried both ways: with it, one copy, also after another package was added to `core`; without it, two.
- Nothing imports `supports-color`. `pnpm-workspace.yaml` says why it is listed.
- The built API never had two copies, because its bundle resolves everything from one place. Only Jest and type-checking read `core`'s source from where it lies.

**What was built.**

- `core` has a domain layer, which is empty until ticket 03 puts the roles in it, and an infrastructure layer with three folders: `configuration`, `errors` and `security`.
- The settings are read from the environment alone. The `.env` file at the repository root belongs to the development services, and the API is told not to read it.
- A setting's name is the workplace's kind of name: `PORT` and `CORS_ALLOWED_ORIGINS`, the second a list separated by commas. An origin must be written as a browser writes it, so a trailing slash is refused.
- The error body's `title` and `detail` are keys for the frontends to turn into text, as at the workplace, and never what an exception said. A path that does not exist answers `NOT_FOUND`. An unexpected failure answers `INTERNAL_SERVER_ERROR` and is logged. Any other status an endpoint answers with gets a code made from the status, such as `HTTP_418`. The codes and keys are this project's own.
- The filter answers through NestJS's own adapter and imports nothing from Express.
- The status endpoint's start time is the time NestJS made its controller, once for the life of the application.

**Something worth knowing about the settings check.** In `@nestjs/config` 4, `ConfigModule.forRoot` is asynchronous. A malformed setting does not throw when the root module is loaded. It leaves a rejected promise in the module's imports, which NestJS meets when it builds the application. A test that only loads the root module therefore crashes the whole Jest run. The settings test starts the application as every other test does, and expects that to fail.

**The lint rules for test files.** The pinned Oxlint, 1.87.0, has all eight. Four are in its `correctness` group, which was already switched on as errors: `no-focused-tests`, `no-disabled-tests`, `expect-expect` and `valid-expect`. Four are in its `style` group and were off: `no-identical-title`, `consistent-test-it`, `require-top-level-describe` and `no-test-return-statement`. They are stated once, in a file at the repository root that the API's and `core`'s lint configurations extend, with the workplace's severities. That Oxlint has no rules for Playwright, which ticket 05 needs to know.

**The fault checks.** Each was reverted.

| Fault | Result |
|---|---|
| One planted test file with a fault for each rule | Six errors: `valid-expect`, `require-top-level-describe`, `no-identical-title`, `consistent-test-it`, `no-focused-tests`, `expect-expect`. Two warnings, which are reported and do not fail lint: `no-disabled-tests`, `no-test-return-statement`. A test that asserts with the error-body helper alone was not reported. |
| The filter is not registered | The three error-body tests fail |
| The origins rule lets every origin in | "a browser call is not accepted from another address" fails |
| The settings check never refuses | The two tests of a malformed setting fail |

**The by-hand checks.**

- `pnpm exec nx serve @pcp/api`, with no environment file and neither setting set, started on port 3001. `GET /v1/status` answered the same start time twice. A path that does not exist answered 404 with the agreed body. A preflight request from `http://localhost:3002` was allowed, and one from `http://localhost:4000` got no permission.
- With `PORT=seventy`, the built API printed "The settings are not valid: PORT must not be greater than 65535; PORT must not be less than 1; PORT must be an integer number." and exited with code 1. With a trailing slash on an origin it named `CORS_ALLOWED_ORIGINS` in the same way.
- Through the serve target the API prints the same message and exits, and Nx stays up, "waiting for changes to restart", with nothing listening on port 3001.
- An import that reaches past `core`'s two entries fails type-checking with "Cannot find module".
- A serve that is killed from outside can leave Nx's own processes behind, and the next serve then waits for them. Their command lines contain `nx.js serve` and `run-executor.js`.

**The checks.** `pnpm check --skip-nx-cache` passed with Docker made unreachable for the command. `pnpm boundaries:check` passed on all 105 lines, three of them `core`'s new cases. Nx's project graph still shows the API depending on `@pcp/core` and `@pcp/compatibility`, although the API no longer imports the second.

**Nothing was copied** from the workplace repository.
