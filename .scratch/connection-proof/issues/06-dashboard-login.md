# 06: The Admin logs in to the dashboard and sees who the API says the caller is

**Spec:** [the connection proof spec](../spec.md)

**What to build:** Opening the dashboard sends the Admin to Keycloak's login screen. After logging in, the Admin is back on the dashboard, which calls the API through `@pcp/api-client` and shows who the API says the caller is: the login's name and its role. A reload does not ask for the password again, and logging out ends the session in Keycloak. The login library is `keycloak-js`, Keycloak's own adapter.

`pnpm platform:check` gains the login's lines, and with them it proves all four joins of the step: the login, the dashboard's call, the API's verification of a token Keycloak really issued, and the Shopper page from ticket 05.

The page is one unstyled screen in English and is still a placeholder. The Admin console's real screens come with the modules that need them.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Before anything is written, Keycloak's guide to its JavaScript adapter is read, for the Keycloak version that is running: how the adapter is started, requiring a login, PKCE, renewing a token, logging out, and the session-status frame. Vite's current documentation is read for settings fixed at build time. The findings are recorded under Comments.
- [ ] `keycloak-js` is a dependency of the dashboard and of no other project.
- [ ] The login is started once, before React renders anything, and requires a login. Someone who is not logged in is sent to Keycloak with the authorisation code flow and a PKCE challenge. Development mode's double rendering cannot start the login twice.
- [ ] Tokens are kept in memory only. After a login, the browser's local storage and session storage hold no token.
- [ ] The adapter's session-status frame is switched off.
- [ ] Before each call to the API the adapter is asked for a token that is still valid, and it renews one that is about to run out. When Keycloak refuses to renew, the Admin is sent to log in again.
- [ ] A 401 or a 403 from the API is shown as a refusal, and the dashboard does not start a login because the API refused. When the API cannot be reached, the dashboard says so plainly.
- [ ] The dashboard's settings are Keycloak's address, the realm, the login client and the API's address. Each has the development value as its default, and none is a secret.
- [ ] The placeholder page is replaced by a page that shows who the API says the caller is, with a way to ask the API again without a reload and a way to log out. It is still marked as a placeholder. No router, data-fetching, form or state library is added.
- [ ] Logging out ends the session in Keycloak and returns to the dashboard's address, which sends the next visitor to the login screen.
- [ ] The login code and the configured client sit in the Shared layer, each in its own segment, and the App layer starts the login. Step 3's bans hold as they stand, with none changed.
- [ ] The dashboard no longer uses the placeholder export of `@pcp/api-client`, and that export is deleted.
- [ ] `pnpm platform:check` reads the development Admin's name and password from `.env` and never prints them.
- [ ] The command gains this line: the browser opens the dashboard's address and arrives at Keycloak's login screen; it types the development Admin's name and password; it arrives back on the dashboard, which shows `development-admin` and the `admin` role.
- [ ] The command gains this line: the browser's own request to the caller endpoint carried a bearer token and was answered 200, and the name on the page is the name in that answer.
- [ ] The command gains this line: the same request sent without a token is answered 401.
- [ ] The command gains this line: after a reload the page shows the caller again, and no login screen was shown.
- [ ] The command gains this line: after the login, the browser's storage holds no token.
- [ ] The command gains this line: after logging out, opening the dashboard's address arrives at the login screen.
- [ ] Shown once and then reverted, each making its own line fail: the API given another issuer; the audience mapper taken out of the realm file and the services reset; the dashboard's address taken out of the API's accepted origins; the dashboard given another login client.
- [ ] Checked by hand: the dashboard is left open for longer than a token lasts, and then asks the API again and is answered, with no login screen shown. With the API stopped, the dashboard says the API cannot be reached.
- [ ] `pnpm check` passes with Docker stopped, and `pnpm boundaries:check` passes on every line.
- [ ] The results of the fault checks and the by-hand checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
