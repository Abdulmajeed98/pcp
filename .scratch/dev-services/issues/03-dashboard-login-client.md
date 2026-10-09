# 03: The dashboard's login client reaches the login screen, with sign-up and "forgot password" off

**Spec:** [the development services spec](../spec.md)

**What to build:** The realm gains the dashboard's login client, so that step 4 can send the Admin to Keycloak to log in. A login request that comes from the dashboard's own address, with the one flow the dashboard uses, reaches Keycloak's login screen. Every other request is refused: one that returns to another address, one without a PKCE challenge, and one that asks for a weaker flow. The login screen offers no way to sign up, because only the Admin creates a Vendor's login (ACC-2), and no "forgot password" link, because the platform sends no email.

Nobody logs in yet. The realm still holds no logins, and the dashboard itself does not change.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] The realm file gains one client, `dashboard`. It is a public client, with no secret.
- [ ] The client allows the authorisation code flow only, and requires PKCE with the S256 method.
- [ ] The client's redirect addresses, its web origin and its address after logout are limited to the dashboard's development address, `http://localhost:3002`.
- [ ] In the realm, self sign-up is off, the "forgot password" screen is off, and login with an email address is off.
- [ ] The scripted check gains an assertion that a login request from the dashboard's client, returning to the dashboard's address and carrying a PKCE challenge, reaches the login screen.
- [ ] The scripted check gains three assertions that the same request is refused: when it returns to any other address, when it carries no PKCE challenge, and when it asks for a flow other than the authorisation code flow.
- [ ] The scripted check gains assertions that the login screen offers no sign-up link and no "forgot password" link, and that the sign-up address itself refuses.
- [ ] These assertions observe what a client of Keycloak would see, over HTTP on port 8080. None of them reads the settings back through Keycloak's administration interface.
- [ ] Shown once and then reverted, each after a reset and each making the scripted check fail on its own line: the redirect addresses widened to accept another site, the PKCE requirement removed, a second flow allowed, self sign-up switched on, and "forgot password" switched on.
- [ ] The realm file still holds no logins and no secrets.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
