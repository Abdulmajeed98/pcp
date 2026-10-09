# 03: The dashboard's login client reaches the login screen, with sign-up and "forgot password" off

**Spec:** [the development services spec](../spec.md)

**What to build:** The realm gains the dashboard's login client, so that step 4 can send the Admin to Keycloak to log in. A login request that comes from the dashboard's own address, with the one flow the dashboard uses, reaches Keycloak's login screen. Every other request is refused: one that returns to another address, one without a PKCE challenge, and one that asks for a weaker flow. The login screen offers no way to sign up, because only the Admin creates a Vendor's login (ACC-2), and no "forgot password" link, because the platform sends no email.

Nobody logs in yet. The realm still holds no logins, and the dashboard itself does not change.

**Blocked by:** 02

**Status:** resolved

- [x] The realm file gains one client, `dashboard`. It is a public client, with no secret.
- [x] The client allows the authorisation code flow only, and requires PKCE with the S256 method.
- [x] The client's redirect addresses, its web origin and its address after logout are limited to the dashboard's development address, `http://localhost:3002`.
- [x] In the realm, self sign-up is off, the "forgot password" screen is off, and login with an email address is off.
- [x] The scripted check gains an assertion that a login request from the dashboard's client, returning to the dashboard's address and carrying a PKCE challenge, reaches the login screen.
- [x] The scripted check gains three assertions that the same request is refused: when it returns to any other address, when it carries no PKCE challenge, and when it asks for a flow other than the authorisation code flow.
- [x] The scripted check gains assertions that the login screen offers no sign-up link and no "forgot password" link, and that the sign-up address itself refuses.
- [x] These assertions observe what a client of Keycloak would see, over HTTP on port 8080. None of them reads the settings back through Keycloak's administration interface.
- [x] Shown once and then reverted, each after a reset and each making the scripted check fail on its own line: the redirect addresses widened to accept another site, the PKCE requirement removed, a second flow allowed, self sign-up switched on, and "forgot password" switched on.
- [x] The realm file still holds no logins and no secrets.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 9 October 2026: completed

**What differs from the first plan, or is not obvious.**

- **Two of the three realm settings were already Keycloak's defaults.** Self sign-up and "forgot password" are off in a new realm. Login with an email address is on. The realm file states all three, so that none of them depends on a default.
- **The check has one line the spec does not list: "The password flow is refused".** The spec's refusals are all made through the login address, and the password flow does not use it: the client sends the password straight to the token address. It is the other weak flow that "the authorisation code flow only" closes, so it has its own line.
- **Keycloak refuses in two ways, and the check tells them apart.** A request that returns to an unknown address gets an error page with status 400, and is never sent on to that address. A request from the known address is sent back to the dashboard with a reason: `invalid_request` when the PKCE challenge is missing, and `unauthorized_client` for the implicit flow.
- **A refusal is checked only after the good request has reached the login screen.** With no client at all, Keycloak answers every one of these requests with an error, and each refusal line would pass for the wrong reason.
- The redirect addresses and the address after logout are `http://localhost:3002/*`: any path at the dashboard's address, because step 4 has not yet chosen the path the login returns to. The web origin is `http://localhost:3002`.
- The device flow and the other grants Keycloak offers are off unless a client asks for them, and the realm file does not ask.

**Fault checks,** each after `pnpm services:reset` and a new start, and each reverted. Every fault failed its own line and no other:

| Fault | Line that failed |
|---|---|
| The redirect addresses widened to any site | "The same request returning to another address is refused": the request reached the login screen. |
| The PKCE requirement removed | "The same request without a PKCE challenge is refused": the request reached the login screen. |
| The implicit flow allowed | "The same request asking for the implicit flow is refused": the request reached the login screen. |
| The password flow allowed | "The password flow is refused": Keycloak looked at the password. |
| Self sign-up switched on | "The login screen offers no sign-up link" and "The sign-up address refuses", which served the sign-up form. |
| "Forgot password" switched on | "The login screen offers no "forgot password" link". |
| After reverting | All nineteen lines pass and it exits 0. |

Before the real client was written, the eight new lines were run against no client and then against a deliberately loose one. The first line failed with no client, and the other seven failed against the loose one.

**By-hand results,** for what the scripted check does not cover:

| Check | Result |
|---|---|
| The client as Keycloak stored it | Public, with no secret. Only the authorisation code flow is on. PKCE method S256. |
| A request to the token address from the dashboard's origin, and from another origin | The dashboard's origin is allowed by the cross-origin header. The other origin gets no such header. |
| The logout address, returning to the dashboard's address and to another | The dashboard's address is accepted. The other is refused with status 400. |
| Login with an email address | Off. The name field on the login screen is labelled "Username", where the default realm says "Username or email". The spec names no scripted check for this setting. |
| Logins in the realm | None. The realm file holds no logins and no secrets. |
| `pnpm check` with no daemon reachable | Passes. |
