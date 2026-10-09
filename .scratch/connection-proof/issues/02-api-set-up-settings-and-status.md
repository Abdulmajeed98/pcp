# 02: The API is set up by one function, reads checked settings and answers its status

**Spec:** [the connection proof spec](../spec.md)

**What to build:** The API's shell becomes something a guard can be added to. The API is set up by one function, which the real start and every test both call. It reads its settings through NestJS's configuration module and refuses to start on a malformed one. Every error it answers has the workplace's body. It accepts browser calls from the dashboard's address and from no other. Its placeholder endpoint gives way to `GET /v1/status`, which answers the time this API process started.

`core` stops being a placeholder. It gains the workplace's two layers, the settings base, the exception filter with the error body, the allowed-origins rule and a second entry for test helpers. The workplace's lint rules for test files arrive with these first real tests.

This ticket is the preparation for ticket 03. No guard exists at the end of it, and every endpoint is still open.

The API follows the workplace's conventions, which [ADR-0004](../../../docs/adr/0004-architecture-per-app.md) lists. The workplace repository's own documents and code for these parts are read first. The patterns are reimplemented from scratch and no file is copied.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Before anything is written, the workplace repository's documents and code are read for how an application is set up apart from being started, how its settings are checked, its exception filter and error body, and its allowed-origins rule. The current documentation of `@nestjs/config` and `class-validator` is read as well. The findings are recorded under Comments.
- [ ] `@nestjs/config`, `class-validator` and `class-transformer` are installed, each on the workplace's line, which accepts NestJS 11.
- [ ] `core` is laid out in a domain layer and an infrastructure layer. A file in `core`'s domain layer that imports its infrastructure layer is refused by lint, with the message the API's ban carries.
- [ ] `pnpm boundaries:check` gains a forbidden case and an allowed case for `core`, and passes on every line.
- [ ] `core` gains a second entry, for test helpers, imported by a name of its own. It resolves in type-checking and in Jest, and an import that reaches past either entry still fails type-checking. Only test files import it. Its first helper asserts the shape of an error body.
- [ ] `core`'s placeholder export and its placeholder test are deleted.
- [ ] The API is set up by one function, separate from the code that starts listening. The real start and every test call that function.
- [ ] The API reads two settings in this ticket: its port, and the origins it accepts browser calls from. Their defaults are the fixed development values, port 3001 and the dashboard's address. Neither is a secret and neither goes into `.env`.
- [ ] A setting that is present and malformed stops the API at startup with a message that names it. With no environment file and no setting, the API starts on port 3001.
- [ ] One global exception filter, registered in `core`, gives every error the agreed body: a list of errors, each with a code, a title and a detail, and no trace identifier. A request to a path that does not exist and an unexpected failure inside an endpoint both get it. The body of an unexpected failure says nothing about what went wrong inside.
- [ ] The API accepts browser calls from the origins in its setting. A preflight request from the dashboard's address is allowed, and one from another address is not. A request that names no origin is not affected.
- [ ] `GET /v1/status` answers the time this API process started, and answers the same time until the API is restarted. Its controller declares no path and its method carries the full path. Its answer is a Response class built by a static factory.
- [ ] The status endpoint is marked as a placeholder, to be deleted when the first real Shopper endpoint arrives.
- [ ] The placeholder endpoint from step 1 and its test are deleted. The API no longer imports `@pcp/compatibility`. Its manifest still lists the library, and Nx's project graph still shows the dependency.
- [ ] The API's tests build the application from its real root module, set it up with the set-up function, listen on a free port and send requests with `fetch`. They cover: the status endpoint; the error body of a path that does not exist and of an unexpected failure; a preflight request from the dashboard's address and from another; and the refusal to start on a malformed setting, with the setting named.
- [ ] `core` keeps its test target, with unit tests for the allowed-origins rule and the settings check.
- [ ] The workplace's eight lint rules for Jest test files are re-expressed for Oxlint and applied to the test files of the API and of `core`. Each rule's presence in the pinned Oxlint is checked first, and a rule Oxlint does not have is recorded and left out. The rule that every test asserts something counts the error-body helper as an assertion.
- [ ] Shown once and then reverted: each lint rule fails on a deliberate fault. With the filter removed, the error-body tests fail. With the origins rule opened to every origin, the refused preflight's test fails. With the settings check removed, the startup test fails.
- [ ] Checked by hand: `pnpm exec nx serve @pcp/api` starts with no environment file and `GET /v1/status` answers. Started with a malformed setting, it stops and names the setting.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] No file is copied from the workplace repository.
- [ ] The results of the fault checks and the by-hand checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
