# 03: The API verifies a login and answers who the caller is

**Spec:** [the connection proof spec](../spec.md)

**What to build:** The API gets its guard. From this ticket on, every endpoint states who may call it, with `@PreAuthorize([...roles])` or `@Public()`, and an endpoint that states nothing is refused for every caller. The guard verifies every token itself: its signature against the realm's published keys, its expiry, its issuer and its audience. `GET /v1/caller` answers who the caller is, for an Admin or a Vendor.

This is the code [ADR-0004](../../../docs/adr/0004-architecture-per-app.md) warns about. The workplace's guard decodes a token and trusts a proxy to have verified it, and this API has no proxy. The workplace's decorators, its resolver and its way of testing a guard are followed. Its verification is not, because it has none. No file is copied.

The ticket holds one unknown. `jose`, the verification library, is published as ES modules only, and the API's bundle and its Jest run are CommonJS. How each loads it is found out before the guard is written.

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [ ] Before the guard is written, the current documentation of `jose` is read for verifying a token against a remote set of keys, for how it keeps and refetches keys, and for the errors it raises. The current documentation of `nestjs-cls` is read, and so are the workplace's guard, decorators, resolver and guard tests. The findings are recorded under Comments.
- [ ] Before the guard is written, how `jose` is loaded by the API's Jest run and by its built bundle is found out on the installed tools and recorded. The first thing tried is letting SWC transform the package for Jest. If it cannot be loaded cleanly, the spec's fallback is taken and the reason is recorded.
- [ ] The guard reads the claims that ticket 01 recorded from a real token: the realm roles, the login's name, the audience and the signing algorithm.
- [ ] The guard lives in `core` and is registered once, as a global guard. No controller names a guard, and the API holds no guard, decorator or filter of its own.
- [ ] The API gains two settings: the realm's issuer and the audience it requires. Their defaults are the development realm's issuer and `pcp-api`. A malformed issuer stops the API at startup with a message that names the setting.
- [ ] The guard checks a token's signature against the keys the issuer publishes, its expiry, that its issuer is exactly the realm's issuer, and that its audience includes `pcp-api`. It accepts asymmetric signatures only.
- [ ] The keys are fetched on first need and not at startup, are kept, and are fetched again when a token names a key the API does not have. The API starts with Keycloak unreachable, and the status endpoint answers.
- [ ] When the keys cannot be fetched, a request that carries a token is refused with a server error and is never let through.
- [ ] The API makes no call to Keycloak to verify a request or to learn a role, apart from fetching the keys.
- [ ] `@PreAuthorize([...roles])` lets a caller through when it holds any one of the roles listed. `@Public()` skips the guard's checks altogether. An endpoint that carries neither is refused for every caller.
- [ ] A request with no token, or with a token that fails any check, is answered 401. A request with a good token that lacks the role, or that reaches an endpoint with no access rule, is answered 403. Each has the agreed error body. The body never says why a token was refused, and the reason is logged.
- [ ] The two roles, `admin` and `vendor`, are stated once in `core`'s domain layer. Role names are compared without regard to case.
- [ ] A caller is the login's identifier in Keycloak, the login's name and the platform roles it holds. The roles Keycloak gives every login are left out.
- [ ] The guard fills an injectable resolver with the caller only after every check has passed. The resolver is built on `nestjs-cls`, is named for the caller, and is read in the infrastructure layer only.
- [ ] `GET /v1/caller` is open to an Admin or a Vendor and answers the caller. Its controller reads the resolver and answers, with no use case behind it. Its answer is a Response class built by a static factory.
- [ ] `GET /v1/status` carries `@Public()`.
- [ ] `core`'s test-helper entry gains a helper that signs a token with a key pair made for the run, and one that stands in for Keycloak's key address over HTTP.
- [ ] The guard is tested through the API's HTTP surface, with the API under test given the stand-in as its issuer. Nothing is mocked and the guard is never overridden. Where the real API has no endpoint of the kind a case needs, the test adds one of its own: one for the Admin only, and one with no access rule.
- [ ] Refused with 401: no token; a header that is not a bearer token; a token that is not a token; a token signed with another key; a token whose claims were changed after signing; an expired token; a token from another issuer; a token for another audience; a token that names no algorithm; a token signed symmetrically with the public key as the secret.
- [ ] Refused with 403: a good token with no platform role, at the caller endpoint; a Vendor's token at the Admin-only endpoint; any good token at the endpoint with no access rule.
- [ ] Allowed: an Admin's token and a Vendor's token at the caller endpoint, each answered with that caller's identifier, name and platform roles; an Admin's token at the Admin-only endpoint; the status endpoint with no token, and again with a bad one.
- [ ] Keys: a token signed with a key the stand-in starts to publish after the API has fetched its keys is accepted. With the stand-in stopped and no keys fetched, a request with a token is refused with a server error, and the status endpoint still answers.
- [ ] `core` gains a unit test for reading a caller from a token's claims.
- [ ] Shown once and then reverted, each making its own case fail: the signature check removed; the expiry check removed; the issuer left unchecked; the audience left unchecked; the rule for an endpoint with no access rule turned round.
- [ ] Checked by hand, with the services running: a real token for the development Admin, obtained as in ticket 01, is accepted by the running API at the caller endpoint, which answers `development-admin` and `admin`. The same token with one character of its signature changed is refused.
- [ ] `pnpm check` passes with Docker stopped, and `pnpm boundaries:check` passes on every line.
- [ ] No file is copied from the workplace repository.
- [ ] The results of the fault checks and the by-hand checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
