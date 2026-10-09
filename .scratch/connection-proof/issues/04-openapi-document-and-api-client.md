# 04: The API describes itself, and `@pcp/api-client` is generated from the description

**Spec:** [the connection proof spec](../spec.md)

**What to build:** The API describes its two endpoints as an OpenAPI document, written with explicit annotations as at the workplace. The document is committed. `@pcp/api-client` is generated from it and committed as well. One command, `pnpm api-client:write`, writes both, and `pnpm check` fails when either is out of date. `@pcp/api-client` exports one way to make a client, which takes the API's address and, optionally, a function that supplies a token.

No frontend calls the API yet. Tickets 05 and 06 are the first callers, so the client is proven here by type-checking and by hand.

The ticket holds two unknowns: how the document is produced from the API's code without listening on a port, and whether `@hey-api/openapi-ts` meets what the spec asks of the client. Both are settled first.

**Blocked by:** 03

**Status:** resolved

- [x] Before anything is written, the documentation of `@nestjs/swagger` is read, for the line that accepts NestJS 11: how a document is built, the explicit annotations and how bearer authentication is declared. The current documentation of `@hey-api/openapi-ts` is read for what it writes, for its fetch client, for how a token is supplied, for use on a server, and for the TypeScript and Node versions it needs. The workplace's Swagger set-up is read as well. The findings are recorded under Comments.
- [x] `@nestjs/swagger` is installed on the workplace's line, which accepts NestJS 11. No compiler plugin is used.
- [x] Each endpoint and each Response class carries explicit annotations. The document states the error body as the answer for a refusal. Bearer authentication is declared once for the whole document, as at the workplace.
- [x] The document is produced from the API's code without the API listening on a port and without Keycloak. How is recorded.
- [x] The document is committed, and so are the files generated from it in `@pcp/api-client`. Neither is edited by hand.
- [x] `pnpm api-client:write` writes the document from the API's code and then writes the client from the document.
- [x] `pnpm check` fails when the committed document differs from what the API describes, and when the committed client differs from what the document generates. It needs no Docker for either.
- [x] Each committed file is an input of the check that compares it, so that a cached pass never hides a stale one.
- [x] `pnpm check`'s format check and lint pass with the generated files in place. How the formatter and the linter treat them is recorded, for ticket 07 to write into the MVP spec.
- [x] `@hey-api/openapi-ts` is pinned to an exact version. If it cannot meet what this ticket asks of the client, `openapi-typescript` with `openapi-fetch` is tried against TypeScript 6 on the installed tools before anything else, and the outcome is recorded.
- [x] A new package's install script is read before it is added to the list pnpm allows.
- [x] `@pcp/api-client` exports one way to make a client. It takes the API's address and, optionally, a function that supplies a token, which is asked before each request.
- [x] `@pcp/api-client` imports nothing from Keycloak, no data-fetching library and no other project. It works in the browser and on Next's server.
- [x] A call's result is typed from the document: the answer on success, and the error body on a refusal. After a Response class is changed and the client written again, a use of the old field fails type-checking.
- [x] The placeholder export of `@pcp/api-client` stays until both frontends use the real client. Ticket 06 deletes it.
- [x] The running API serves neither the document nor Swagger's own screen.
- [x] Shown once and then reverted: a Response class changed without writing the document again makes `pnpm check` fail on the document. The committed client edited by hand makes it fail on the client. The committed document edited by hand, with nothing else changed, makes it fail and not pass from the cache.
- [x] Checked by hand, with the API and the services running: a script kept outside the projects makes a client and reads the status. With no token it is refused at the caller endpoint and receives the typed error body. With a real token for the development Admin, obtained as in ticket 01, it reads the caller. The script is not committed.
- [x] `pnpm check` passes with Docker stopped, and `pnpm boundaries:check` passes on every line.
- [x] The results of the fault checks and the by-hand checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 9 October 2026: completed

**What was read first.**

- `@nestjs/swagger` 11.4.7, from the descriptions the installed package carries: the document builder's `addBearerAuth`, `addSecurityRequirements` and `addGlobalResponse`, the document options, and that the options of `@ApiOperation` are a part of an OpenAPI operation, its `security` among them.
- The workplace's set-up: bearer authentication declared once and required by the whole document, explicit annotations with no compiler plugin, and the document served at runtime behind a setting and written to no file.
- `@hey-api/openapi-ts`'s documentation. It is "in initial development" and asks for an exact version. It runs on Node 22 or later. Its fetch client takes an `auth` function, whose token is "attached only to requests that require auth", and a client made for one address can be handed to any call. The documentation does not say what is generated or what a call returns, so the generator was run on the real description in a scratch folder and its output read.

**The two unknowns.**

- *Producing the description without a port.* A small script in the API builds the application with NestJS's factory and never tells it to listen. It is run by Node through `@swc-node/register`, which Nx already installs, with the API's own compiler settings, so decorators and the `~/` alias work. It needs no Keycloak, because the guard fetches the realm's keys only on first need.
- *Whether the generator fits.* It does, and `openapi-typescript` was not tried. Version 0.99.0 ran against TypeScript 6.0.3 without complaint. It generates the types, one function for each operation, and a fetch client of its own, so `@pcp/api-client` gains no runtime dependency. A call answers with `data`, `error`, `request` and `response`.

**What was built.**

- The description is OpenAPI 3.0 and sits beside the API, where it is an input of the API's test target. Its title is "Platform API", which avoids the working title.
- Every endpoint states the error body under OpenAPI's `default` answer, set once on the document builder. The client therefore types `error` as the error body for every refusal.
- An operation is named after the controller method that serves it, `getStatus` and `getCaller`, and those become the client's function names. Method names therefore have to be unique across the API's controllers.
- The status endpoint says in the description that it needs no login, with an empty list of requirements. The workplace does not do this. Here it matters, because the client sends a token only where the description asks for one. This was seen by hand: across one call that needs a login and one that does not, the token was asked for once.
- `createApiClient` binds every generated function to a client for one address. No function is written by hand for an endpoint, so a new endpoint appears in the client when it is written again.
- `pnpm check` generates the client again in a temporary folder and compares every file. That step is not an Nx task, so it is never answered from a cache.

**How the formatter and the linter treat the generated files.** For ticket 07 to record:

- The formatter leaves the generated client alone. Its folder is on the formatter's list of exceptions, beside the two files of import bans.
- The description itself is formatted, by the write command, like any other JSON file. The API's test compares it as data, so its layout cannot make the test fail.
- The linter passes the generated client as it is, with no exception.
- The client library is now type-checked with the browser's types, which the generated fetch client needs.

**An install script that is not run.** `@nestjs/swagger` depends on Swagger's own screen, which depends on `@scarf/scarf`. Its install script reports each install to scarf.sh. pnpm stopped the install until the script was listed, and it is listed as not to be run, with the reason.

**The tests.** The API has 46. Seven are about the description: it is what is committed, it describes the two endpoints and no other, how it names operations, bearer authentication, the public endpoint, what each endpoint answers, and the error body.

**The fault checks.** Each was reverted, and `pnpm check` had filled the cache beforehand.

| Fault | Result |
|---|---|
| A Response class changed, the description not written again | `pnpm check` fails: "the API's description of itself is what is committed" |
| The committed client edited by hand | `pnpm check` fails: "types.gen.ts is not what apps/api/openapi.json generates. Write the client again with "pnpm api-client:write"." |
| The committed description edited by hand, nothing else | `pnpm check` fails at the client's step. The API's test, run alone with the cache allowed, fails as well and is not answered from the cache. |

**By hand.**

- A field of a Response class was renamed and the client written again. A use of the old name failed type-checking: "Property 'startedAt' does not exist on type 'StatusResponse'. Did you mean 'started'?"
- With the API and the services running, a script kept outside the projects made a client and read the status. With no token, the caller endpoint answered 401, `data` was empty and the typed error body carried `UNAUTHORIZED`. With a real token for the development Admin it read `development-admin` and `admin`. The script was not committed.
- The running API answers 404 at the addresses where the workplace serves its description and Swagger's screen.

**The checks.** `pnpm check --skip-nx-cache` passed with Docker made unreachable for the command. `pnpm boundaries:check` passed on all 105 lines.
