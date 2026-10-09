# 04: The API describes itself, and `@pcp/api-client` is generated from the description

**Spec:** [the connection proof spec](../spec.md)

**What to build:** The API describes its two endpoints as an OpenAPI document, written with explicit annotations as at the workplace. The document is committed. `@pcp/api-client` is generated from it and committed as well. One command, `pnpm api-client:write`, writes both, and `pnpm check` fails when either is out of date. `@pcp/api-client` exports one way to make a client, which takes the API's address and, optionally, a function that supplies a token.

No frontend calls the API yet. Tickets 05 and 06 are the first callers, so the client is proven here by type-checking and by hand.

The ticket holds two unknowns: how the document is produced from the API's code without listening on a port, and whether `@hey-api/openapi-ts` meets what the spec asks of the client. Both are settled first.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Before anything is written, the documentation of `@nestjs/swagger` is read, for the line that accepts NestJS 11: how a document is built, the explicit annotations and how bearer authentication is declared. The current documentation of `@hey-api/openapi-ts` is read for what it writes, for its fetch client, for how a token is supplied, for use on a server, and for the TypeScript and Node versions it needs. The workplace's Swagger set-up is read as well. The findings are recorded under Comments.
- [ ] `@nestjs/swagger` is installed on the workplace's line, which accepts NestJS 11. No compiler plugin is used.
- [ ] Each endpoint and each Response class carries explicit annotations. The document states the error body as the answer for a refusal. Bearer authentication is declared once for the whole document, as at the workplace.
- [ ] The document is produced from the API's code without the API listening on a port and without Keycloak. How is recorded.
- [ ] The document is committed, and so are the files generated from it in `@pcp/api-client`. Neither is edited by hand.
- [ ] `pnpm api-client:write` writes the document from the API's code and then writes the client from the document.
- [ ] `pnpm check` fails when the committed document differs from what the API describes, and when the committed client differs from what the document generates. It needs no Docker for either.
- [ ] Each committed file is an input of the check that compares it, so that a cached pass never hides a stale one.
- [ ] `pnpm check`'s format check and lint pass with the generated files in place. How the formatter and the linter treat them is recorded, for ticket 07 to write into the MVP spec.
- [ ] `@hey-api/openapi-ts` is pinned to an exact version. If it cannot meet what this ticket asks of the client, `openapi-typescript` with `openapi-fetch` is tried against TypeScript 6 on the installed tools before anything else, and the outcome is recorded.
- [ ] A new package's install script is read before it is added to the list pnpm allows.
- [ ] `@pcp/api-client` exports one way to make a client. It takes the API's address and, optionally, a function that supplies a token, which is asked before each request.
- [ ] `@pcp/api-client` imports nothing from Keycloak, no data-fetching library and no other project. It works in the browser and on Next's server.
- [ ] A call's result is typed from the document: the answer on success, and the error body on a refusal. After a Response class is changed and the client written again, a use of the old field fails type-checking.
- [ ] The placeholder export of `@pcp/api-client` stays until both frontends use the real client. Ticket 06 deletes it.
- [ ] The running API serves neither the document nor Swagger's own screen.
- [ ] Shown once and then reverted: a Response class changed without writing the document again makes `pnpm check` fail on the document. The committed client edited by hand makes it fail on the client. The committed document edited by hand, with nothing else changed, makes it fail and not pass from the cache.
- [ ] Checked by hand, with the API and the services running: a script kept outside the projects makes a client and reads the status. With no token it is refused at the caller endpoint and receives the typed error body. With a real token for the development Admin, obtained as in ticket 01, it reads the caller. The script is not committed.
- [ ] `pnpm check` passes with Docker stopped, and `pnpm boundaries:check` passes on every line.
- [ ] The results of the fault checks and the by-hand checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
