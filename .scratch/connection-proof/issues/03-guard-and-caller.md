# 03: The API verifies a login and answers who the caller is

**Spec:** [the connection proof spec](../spec.md)

**What to build:** The API gets its guard. From this ticket on, every endpoint states who may call it, with `@PreAuthorize([...roles])` or `@Public()`, and an endpoint that states nothing is refused for every caller. The guard verifies every token itself: its signature against the realm's published keys, its expiry, its issuer and its audience. `GET /v1/caller` answers who the caller is, for an Admin or a Vendor.

This is the code [ADR-0004](../../../docs/adr/0004-architecture-per-app.md) warns about. The workplace's guard decodes a token and trusts a proxy to have verified it, and this API has no proxy. The workplace's decorators, its resolver and its way of testing a guard are followed. Its verification is not, because it has none. No file is copied.

The ticket holds one unknown. `jose`, the verification library, is published as ES modules only, and the API's bundle and its Jest run are CommonJS. How each loads it is found out before the guard is written.

**Blocked by:** 01, 02

**Status:** resolved

- [x] Before the guard is written, the current documentation of `jose` is read for verifying a token against a remote set of keys, for how it keeps and refetches keys, and for the errors it raises. The current documentation of `nestjs-cls` is read, and so are the workplace's guard, decorators, resolver and guard tests. The findings are recorded under Comments.
- [x] Before the guard is written, how `jose` is loaded by the API's Jest run and by its built bundle is found out on the installed tools and recorded. The first thing tried is letting SWC transform the package for Jest. If it cannot be loaded cleanly, the spec's fallback is taken and the reason is recorded.
- [x] The guard reads the claims that ticket 01 recorded from a real token: the realm roles, the login's name, the audience and the signing algorithm.
- [x] The guard lives in `core` and is registered once, as a global guard. No controller names a guard, and the API holds no guard, decorator or filter of its own.
- [x] The API gains two settings: the realm's issuer and the audience it requires. Their defaults are the development realm's issuer and `pcp-api`. A malformed issuer stops the API at startup with a message that names the setting.
- [x] The guard checks a token's signature against the keys the issuer publishes, its expiry, that its issuer is exactly the realm's issuer, and that its audience includes `pcp-api`. It accepts asymmetric signatures only.
- [x] The keys are fetched on first need and not at startup, are kept, and are fetched again when a token names a key the API does not have. The API starts with Keycloak unreachable, and the status endpoint answers.
- [x] When the keys cannot be fetched, a request that carries a token is refused with a server error and is never let through.
- [x] The API makes no call to Keycloak to verify a request or to learn a role, apart from fetching the keys.
- [x] `@PreAuthorize([...roles])` lets a caller through when it holds any one of the roles listed. `@Public()` skips the guard's checks altogether. An endpoint that carries neither is refused for every caller.
- [x] A request with no token, or with a token that fails any check, is answered 401. A request with a good token that lacks the role, or that reaches an endpoint with no access rule, is answered 403. Each has the agreed error body. The body never says why a token was refused, and the reason is logged.
- [x] The two roles, `admin` and `vendor`, are stated once in `core`'s domain layer. Role names are compared without regard to case.
- [x] A caller is the login's identifier in Keycloak, the login's name and the platform roles it holds. The roles Keycloak gives every login are left out.
- [x] The guard fills an injectable resolver with the caller only after every check has passed. The resolver is built on `nestjs-cls`, is named for the caller, and is read in the infrastructure layer only.
- [x] `GET /v1/caller` is open to an Admin or a Vendor and answers the caller. Its controller reads the resolver and answers, with no use case behind it. Its answer is a Response class built by a static factory.
- [x] `GET /v1/status` carries `@Public()`.
- [x] `core`'s test-helper entry gains a helper that signs a token with a key pair made for the run, and one that stands in for Keycloak's key address over HTTP.
- [x] The guard is tested through the API's HTTP surface, with the API under test given the stand-in as its issuer. Nothing is mocked and the guard is never overridden. Where the real API has no endpoint of the kind a case needs, the test adds one of its own: one for the Admin only, and one with no access rule.
- [x] Refused with 401: no token; a header that is not a bearer token; a token that is not a token; a token signed with another key; a token whose claims were changed after signing; an expired token; a token from another issuer; a token for another audience; a token that names no algorithm; a token signed symmetrically with the public key as the secret.
- [x] Refused with 403: a good token with no platform role, at the caller endpoint; a Vendor's token at the Admin-only endpoint; any good token at the endpoint with no access rule.
- [x] Allowed: an Admin's token and a Vendor's token at the caller endpoint, each answered with that caller's identifier, name and platform roles; an Admin's token at the Admin-only endpoint; the status endpoint with no token, and again with a bad one.
- [x] Keys: a token signed with a key the stand-in starts to publish after the API has fetched its keys is accepted. With the stand-in stopped and no keys fetched, a request with a token is refused with a server error, and the status endpoint still answers.
- [x] `core` gains a unit test for reading a caller from a token's claims.
- [x] Shown once and then reverted, each making its own case fail: the signature check removed; the expiry check removed; the issuer left unchecked; the audience left unchecked; the rule for an endpoint with no access rule turned round.
- [x] Checked by hand, with the services running: a real token for the development Admin, obtained as in ticket 01, is accepted by the running API at the caller endpoint, which answers `development-admin` and `admin`. The same token with one character of its signature changed is refused.
- [x] `pnpm check` passes with Docker stopped, and `pnpm boundaries:check` passes on every line.
- [x] No file is copied from the workplace repository.
- [x] The results of the fault checks and the by-hand checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 9 October 2026: completed

**What was read first.**

- `jose` 6.2.12, from the descriptions the installed package carries. A remote key set fetches the keys when it has none or they are stale, and keeps them for ten minutes. A key it does not have triggers another fetch only when thirty seconds have passed since the last successful one. It picks a key by the token's algorithm and key name and respects the key's stated use, so the realm's encryption key is never chosen. An unsecured token, `alg: "none"`, is "never accepted". Each failure has a class and a code of its own.
- `nestjs-cls` 7.0.1, from its own option descriptions: the module is made global, and its middleware is mounted on every route, which is what puts the request's storage in place before a guard runs.
- The workplace's guard, its two decorators, its resolver, its auth module and its guard's integration test. The decorators are made with `Reflector.createDecorator`, and the guard reads the handler's before the class's. The caller is kept with `nestjs-cls` and set only after the role check. The test adds a controller of its own and stands a local HTTP server in for Keycloak.

**The unknown: how `jose` is loaded.** It is published as ES modules only.

- The built API loads it as it is. The bundle keeps packages outside itself, and Node 24 loads an ES module from CommonJS.
- Jest does not. Its own loader stopped at "Cannot use import statement outside a module".
- The first thing tried worked: the shared Jest preset names `jose` as a package for SWC to transform. pnpm keeps a package under two folders named `node_modules`, and the pattern lets both through. No fallback was needed.

**What was built, and where it differs from the workplace.**

- The claims read are the ones ticket 01 recorded: `sub`, `preferred_username` and `realm_access.roles`. A token that names no login is refused.
- The realm's keys are found through its discovery document, which must name the configured issuer. The address of the keys is not built from Keycloak's paths.
- A token is accepted only with one of ten asymmetric algorithms, the RSA, RSA-PSS, elliptic-curve and EdDSA families.
- `@Public()` stores `true`. At the workplace it stores an empty object, which its own comment calls "truthy by accident".
- An endpoint whose `@PreAuthorize` lists no role is refused like one with no rule.
- The resolver is a plain injectable that holds the request's storage. The workplace marks its resolver as a proxy provider and then uses it the same way.
- While the keys cannot be had, a request with a token is answered 503, with the code `SERVICE_UNAVAILABLE`. The spec says "a server error" and names no status. 503 was chosen because the fault is a service the API depends on, and the request can be tried again.
- The two new settings are `KEYCLOAK_ISSUER` and `KEYCLOAK_AUDIENCE`, in a settings class in `core` that the API's class extends.
- The API imports `ClsModule` itself, as each workplace app does. `core`'s auth module says so in a comment.

**One helper more than the ticket lists.** The lint rule that every test asserts something knows an assertion by its name. A helper written inside a test file was not known to it. `core`'s test entry therefore gained `expectErrorResponse`, which asserts a status together with the agreed body, and the rule lists it.

**The key that changes.** The API does not ask the realm again within thirty seconds of its last fetch, which stops tokens with made-up key names from making it ask without end. The test publishes a new key, lets thirty-one seconds pass by moving the clock, and the token signed with the new key is accepted. Within those thirty seconds such a token is answered 401.

**The tests.** The API has 39, all through its HTTP surface, and `core` has 33 unit tests.

**The fault checks.** Each was reverted.

| Fault | Tests that failed |
|---|---|
| The signature is not checked | Signed with another key; claims changed after signing; no algorithm; signed symmetrically. Also "the keys are fetched once", because no key was fetched at all. |
| The expiry is not checked | "when its token has expired" |
| The issuer is not checked | "when its token comes from another issuer" |
| The audience is not checked | "when its token was issued for another audience" |
| An endpoint with no access rule lets a good login through | "when the endpoint has no access rule, whoever calls it" |

**By hand, with the services running.** The built API was started with no setting set. A real token for the development Admin, obtained as in ticket 01, was answered 200 with `development-admin` and `admin`. The same token with one character of its signature changed was answered 401 with the agreed body, and the API logged "A token was refused: signature verification failed". A request with no token was answered 401, and the status endpoint 200. This also showed that the built bundle loads `jose`.

**The checks.** `pnpm check --skip-nx-cache` passed with Docker made unreachable for the command. `pnpm boundaries:check` passed on all 105 lines. `core` and the API still link to one copy of each NestJS package, `nestjs-cls` and `@nestjs/config` among them.

**Nothing was copied** from the workplace repository.
