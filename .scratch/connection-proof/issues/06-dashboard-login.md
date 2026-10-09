# 06: The Admin logs in to the dashboard and sees who the API says the caller is

**Spec:** [the connection proof spec](../spec.md)

**What to build:** Opening the dashboard sends the Admin to Keycloak's login screen. After logging in, the Admin is back on the dashboard, which calls the API through `@pcp/api-client` and shows who the API says the caller is: the login's name and its role. A reload does not ask for the password again, and logging out ends the session in Keycloak. The login library is `keycloak-js`, Keycloak's own adapter.

`pnpm platform:check` gains the login's lines, and with them it proves all four joins of the step: the login, the dashboard's call, the API's verification of a token Keycloak really issued, and the Shopper page from ticket 05.

The page is one unstyled screen in English and is still a placeholder. The Admin console's real screens come with the modules that need them.

**Blocked by:** 05

**Status:** resolved

- [x] Before anything is written, Keycloak's guide to its JavaScript adapter is read, for the Keycloak version that is running: how the adapter is started, requiring a login, PKCE, renewing a token, logging out, and the session-status frame. Vite's current documentation is read for settings fixed at build time. The findings are recorded under Comments.
- [x] `keycloak-js` is a dependency of the dashboard and of no other project.
- [x] The login is started once, before React renders anything, and requires a login. Someone who is not logged in is sent to Keycloak with the authorisation code flow and a PKCE challenge. Development mode's double rendering cannot start the login twice.
- [x] Tokens are kept in memory only. After a login, the browser's local storage and session storage hold no token.
- [x] The adapter's session-status frame is switched off.
- [x] Before each call to the API the adapter is asked for a token that is still valid, and it renews one that is about to run out. When Keycloak refuses to renew, the Admin is sent to log in again.
- [x] A 401 or a 403 from the API is shown as a refusal, and the dashboard does not start a login because the API refused. When the API cannot be reached, the dashboard says so plainly.
- [x] The dashboard's settings are Keycloak's address, the realm, the login client and the API's address. Each has the development value as its default, and none is a secret.
- [x] The placeholder page is replaced by a page that shows who the API says the caller is, with a way to ask the API again without a reload and a way to log out. It is still marked as a placeholder. No router, data-fetching, form or state library is added.
- [x] Logging out ends the session in Keycloak and returns to the dashboard's address, which sends the next visitor to the login screen.
- [x] The login code and the configured client sit in the Shared layer, each in its own segment, and the App layer starts the login. Step 3's bans hold as they stand, with none changed.
- [x] The dashboard no longer uses the placeholder export of `@pcp/api-client`, and that export is deleted.
- [x] `pnpm platform:check` reads the development Admin's name and password from `.env` and never prints them.
- [x] The command gains this line: the browser opens the dashboard's address and arrives at Keycloak's login screen; it types the development Admin's name and password; it arrives back on the dashboard, which shows `development-admin` and the `admin` role.
- [x] The command gains this line: the browser's own request to the caller endpoint carried a bearer token and was answered 200, and the name on the page is the name in that answer.
- [x] The command gains this line: the same request sent without a token is answered 401.
- [x] The command gains this line: after a reload the page shows the caller again, and no login screen was shown.
- [x] The command gains this line: after the login, the browser's storage holds no token.
- [x] The command gains this line: after logging out, opening the dashboard's address arrives at the login screen.
- [x] Shown once and then reverted, each making its own line fail: the API given another issuer; the audience mapper taken out of the realm file and the services reset; the dashboard's address taken out of the API's accepted origins; the dashboard given another login client.
- [x] Checked by hand: the dashboard is left open for longer than a token lasts, and then asks the API again and is answered, with no login screen shown. With the API stopped, the dashboard says the API cannot be reached.
- [x] `pnpm check` passes with Docker stopped, and `pnpm boundaries:check` passes on every line.
- [x] The results of the fault checks and the by-hand checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 9 October 2026: completed

**What was read first.**

- Keycloak's guide to its JavaScript adapter, for 26.8.0, read when the spec was written, and the descriptions the installed adapter, `keycloak-js` 26.2.4, carries for its own options. PKCE "will default to 'S256'". The session-status frame, `checkLoginIframe`, is on by default. The answer to a login comes back in the address's fragment by default. `updateToken` renews a token that has less than a given number of seconds left. The guide says to start the adapter before a framework's router.
- Vite's documentation of its settings, for 8.3.4. A variable whose name starts with `VITE_` is exposed to the app, and its value is "statically replaced at build time". A variable already in the environment when Vite runs has the highest priority. Such a variable "should not contain sensitive information", because it ends up in the code sent to the browser. Vite's own types cover it. This page was read after the dashboard was written and not before, as this ticket asked. Nothing had to change.

**What was built.**

- The login sits in the Shared layer's `auth` segment and the configured client in its `api` segment, which asks `auth` for a token. The App layer's entry file starts the login and renders only when it has finished. No import ban was changed.
- A token is renewed when it has less than thirty seconds left.
- The four settings are `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_REALM`, `VITE_KEYCLOAK_CLIENT_ID` and `VITE_API_URL`.
- The page asks the API on its first render and again when "Ask the API again" is pressed. In development React renders twice, so the first render makes two calls.
- When the request itself fails, the generated client answers without a response, although its types say there always is one. The page reads that as "The API cannot be reached."
- `keycloak-js` is in the dashboard's manifest and, like every app's packages, in the root manifest. No other project lists it.
- The tests tell Keycloak's login screen by its address and its form, and not by its text, which is in three languages.

**The lines.** All seven pass, each test in a fresh browser:

```
✓ the Admin logs in: the dashboard sends them to Keycloak, and then shows who the API says the caller is
✓ the API was asked: the dashboard's call carried a token, and the name on the page is the name in the answer
✓ the endpoint is not simply open: the same request without a token is answered 401
✓ a reload keeps the login: the caller is shown again and no login screen is
✓ the login is kept in memory: after it, the browser's storage holds no token
✓ logging out ends it: the next visit to the dashboard arrives at the login screen
✓ the Shopper app's page comes from the API: it shows the time the API says it started
```

Before the dashboard was changed, the five lines that need the login failed.

**The fault checks.** Each was reverted. The line about the 401 and the Shopper app's line passed throughout.

| Fault | Lines that failed |
|---|---|
| The API is given another issuer | The login, the API was asked, the reload, logging out |
| The audience mapper is taken out of the realm file, and the services are reset | The same four |
| The dashboard's address is not among the origins the API accepts | Those four and the storage line |
| The dashboard is given another login client | Those five |

In the first two the browser still sends its call with a token, which is all the storage line needs, and the API refuses it. After the realm file was restored the services were reset again. `pnpm services:check` passed on all 33 lines and `pnpm platform:check` on all seven.

**The by-hand checks.** Both were made with a scratch script that drives the same browser and is not in the repository.

- The dashboard was left open for 315 seconds, and a token lasts 300. "Ask the API again" was then answered with the caller. A different token was used, Keycloak was asked to renew once, no login screen was shown and the browser never left the dashboard.
- With the API stopped, "Ask the API again" showed "The API cannot be reached."
- A mistake in the script is worth knowing about. Stopping "whatever uses port 3001" also stops the browser's own connection to the API, and the page then loses its buttons. Only the process that listens on the port is to be stopped.

**The password.** No output of any run made in this ticket holds the development Admin's password. A trace of a failed run does hold what was typed, and it is written under the project's `test-output` folder, which Git ignores.

**The checks.** `pnpm check --skip-nx-cache` passed with Docker made unreachable for the command. `pnpm boundaries:check` passed on all 108 lines.
