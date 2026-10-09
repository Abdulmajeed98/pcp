# Spec: Proof that the parts connect

Status: ready-for-agent

This is step 4, the last of the four infrastructure steps listed under "Order of work" in [the MVP spec](../mvp/spec.md). Steps 1 to 3, [the workspace](../workspace/spec.md), [the development services](../dev-services/spec.md) and [the boundary and layer checks](../boundary-checks/spec.md), are finished. This spec uses the vocabulary of [CONTEXT.md](../../CONTEXT.md) and follows [ADR-0003](../../docs/adr/0003-three-apps-one-api-keycloak.md) and [ADR-0004](../../docs/adr/0004-architecture-per-app.md). The owner confirmed its test seams on 9 October 2026.

Two words need care. In this project **Admin** means the platform's operator, and Keycloak's own administrator account is a different thing, as step 2 said. A **login** is one account in Keycloak's `pcp` realm, and **the caller** is the login a request to the API was made with. The word "user" is not used for either, because CONTEXT.md keeps it out of the project's language.

## Problem Statement

The platform has five parts that run and none that talk to each other. The API answers one placeholder request, and answers it for anyone, because it has no guard. The dashboard shows a placeholder to anyone who opens it. The Shopper app shows a line of text it made up itself. Keycloak has a realm with two roles, a login client and no logins, and nothing has ever asked it for a token. `@pcp/api-client`, the only way a frontend may call the API, is an empty shell.

Every module in the MVP's capability map crosses these joins. `catalog` needs an Admin-only endpoint, `offers` needs a Vendor-only one, and `browse` needs a Shopper page rendered from the API. If the joins are made inside the first module, they are made in a hurry, together with product decisions, and each has several ways to be wrong that look like success. The most serious is the one ADR-0004 names: the workplace's guard reads a token without verifying it, because a proxy has verified it already. This API has no proxy. A guard copied from the workplace would let anyone forge an Admin token, and every test written the workplace's way would still pass.

The owner wants each join made once, with nothing else in the way, and proven in a way that can be repeated.

## Solution

One thin path is built through every part, with no product feature on it:

- The owner starts the services, and a development Admin login exists.
- The Admin opens the dashboard and is sent to Keycloak's login screen. After logging in, the Admin is back on the dashboard, which calls the API and shows who the API says the caller is: the login's name and its role.
- The API verifies every login itself: the token's signature against Keycloak's keys, its expiry, its issuer and its audience. An endpoint says who may call it, and an endpoint that says nothing is refused.
- The Shopper app's page is rendered on the server from a value it fetched from the API.
- Both frontends reach the API only through `@pcp/api-client`, which is generated from the API's own OpenAPI document.

Two things prove it. `pnpm check` proves the guard's refusals, with no Docker and no browser. A new command, `pnpm platform:check`, proves the joins on the running platform by driving a real browser through the login.

The two pages are still placeholders. What this step leaves behind is the conventions the first module copies: how an endpoint states its access rule, how a controller learns who the caller is, how a refusal is worded, how the API is described, how a frontend calls it, and how a journey is tested from end to end.

## User Stories

### The development Admin login

1. As the owner, I want a development Admin login to exist once the services have started, so that I can log in to the dashboard without clicking anything in Keycloak's console.
2. As the owner, I want that login created by the command that starts the services, so that a fresh machine is ready in one step.
3. As the owner, I want its password generated on my machine and kept in `.env`, so that the rule against committing passwords holds without exception.
4. As the owner, I want a later start to leave that login and its password alone, so that what I have saved in my password manager keeps working.
5. As the owner, I want a setting that is new in this step added to the `.env` I already have, with no value that is there changed, so that my services' data keeps working.
6. As the owner, I want that login to hold the Admin role and no other, so that it is what the real Admin will be.
7. As the owner, I want Keycloak to ask that login nothing beyond its name and password, so that a scripted login is not stopped by a screen nobody expected.
8. As the owner, I want the realm file to hold no logins still, so that it stays safe to commit and fit to load on a server.
9. As the owner, I want the login's name to say that it is for development, so that it is never mistaken for the platform's real Admin.
10. As a coding agent, I want the login's name, and where its password is kept, written into the MVP spec, so that I can log in without asking.

### Logging in to the dashboard

11. As the Admin, I want the dashboard to send me to Keycloak's login screen when I open it, so that nothing in the dashboard is shown to someone who has not logged in.
12. As the Admin, I want to arrive back on the dashboard already logged in, so that logging in is one screen and not a detour.
13. As the Admin, I want a reload of the dashboard not to ask for my password while my session in Keycloak lasts, so that a reload costs me nothing.
14. As the Admin, I want a way to log out that ends my session in Keycloak, so that the next person at my computer meets the login screen.
15. As the owner, I want the dashboard to keep the login in memory only and never in the browser's storage, so that a token cannot be read later from a shared computer.
16. As the owner, I want the dashboard to use the authorisation code flow with PKCE, so that it uses the one flow its login client allows.
17. As the Admin, I want the dashboard to renew my login quietly before it calls the API, so that I am not thrown out when a short-lived token runs out.
18. As the Admin, I want to be sent to log in again when Keycloak says my session is over, so that I am never left on a screen that cannot load anything.
19. As the owner, I want the dashboard never to answer a refusal from the API by logging in again on its own, so that a misconfigured API cannot send the browser round Keycloak for ever.
20. As the Admin, I want the dashboard to say plainly when the API refuses me or cannot be reached, so that I know which part is at fault.
21. As the owner, I want the login started once, before React renders anything, so that development mode's double rendering cannot start it twice.
22. As the owner, I want the same login code to serve a Vendor later, so that the Vendor portal adds screens and not a second login.

### The API verifies the login

23. As the owner, I want the API to check every token's signature against Keycloak's own keys, so that nobody can forge an Admin token, which is the danger ADR-0004 names.
24. As the owner, I want an expired token refused, so that a token copied from a browser stops working when its time is up.
25. As the owner, I want a token from any issuer but the platform's realm refused, so that another Keycloak, or another realm of this one, cannot log anyone in.
26. As the owner, I want a token that was not issued for the API refused, so that a token meant for another client of the realm does not open the API.
27. As the owner, I want a token that names no signing algorithm, or a symmetric one, refused, so that the well-known ways round a signature check are closed.
28. As the owner, I want the API to fetch Keycloak's keys once and keep them, so that verifying a request is not a call to Keycloak.
29. As the owner, I want the API to pick up a new key when Keycloak changes its keys, so that a key change needs no restart.
30. As the owner, I want a request refused, and never let through, when the API cannot get Keycloak's keys, so that a failure of the identity service closes the API and does not open it.
31. As the owner, I want the API to start and to serve its public endpoints while Keycloak is down, so that Shopper pages do not depend on the identity service.
32. As the owner, I want the caller's roles read from the token, so that the API makes no call to Keycloak to learn them.

### Access rules

33. As the owner, I want one guard in front of every endpoint, so that no endpoint is open because somebody forgot to protect it.
34. As the owner, I want every endpoint to state who may call it, either a list of roles or "anyone", so that the rule is read beside the code it governs.
35. As the owner, I want an endpoint that states nothing refused for every caller, so that the mistake is found the first time the endpoint is tried.
36. As the owner, I want a missing or bad login answered differently from a good login that lacks the role, so that the dashboard can tell "log in" from "not allowed".
37. As the owner, I want the platform's two roles stated once, so that a role's name is never typed as a bare string in an endpoint.
38. As the owner, I want the roles Keycloak gives every login left out of what the API calls a caller's roles, so that the API speaks only of Admin and Vendor.
39. As a coding agent, I want the access rules written with the workplace's names, so that what I write here reads the same there.

### Who the caller is

40. As the Admin, I want the dashboard to show the name and the role the API read from my login, so that I can see the whole path worked and not only the login screen.
41. As the owner, I want an endpoint that answers who the caller is, so that the proof has something to ask that only a verified login can answer.
42. As the owner, I want a controller to learn who the caller is from one injectable object that is filled only after every check has passed, so that no code can read a caller the guard has not accepted.
43. As the owner, I want a use case handed plain values and never the token, so that the domain layer stays free of HTTP and of Keycloak.

### Refusals and settings

44. As the owner, I want every refusal to have the same body, in the workplace's shape, so that a frontend handles errors in one place.
45. As the owner, I want a refusal to give the reason a token failed to the log and not to the response, so that someone probing the API learns nothing from it.
46. As the owner, I want the API's settings checked when it starts, and a bad one to stop it with a message that names it, so that a wrong address fails at once and not on the first login.
47. As the owner, I want every setting the three apps read to have the development value as its default, so that a fresh clone starts all three with no environment file.
48. As the owner, I want none of those settings to be a secret, so that nothing new has to be kept out of Git.
49. As the owner, I want the API to accept browser calls from the dashboard's address and from no other, so that another site cannot use an Admin's browser to call it.
50. As the owner, I want the API's tests to set the application up with the same function the real start uses, so that a test never passes against a differently configured API.

### The API's description and its client

51. As the owner, I want the API to describe its endpoints as an OpenAPI document, written with explicit annotations as at the workplace, so that the description is in the code and practises the workplace's way.
52. As the owner, I want that document committed, so that a change to what the API promises shows up in a commit.
53. As the owner, I want one command that writes the document and the client from the API's code, so that I never edit either by hand.
54. As the owner, I want `pnpm check` to fail when the document or the client is out of date, so that a frontend is never built against an API that has moved.
55. As the owner, I want both frontends to call the API only through `@pcp/api-client`, so that every call is typed from the API's own description.
56. As the owner, I want the client to know nothing about Keycloak and to be handed a way to get a token, so that the library is the same for the dashboard, which logs in, and the Shopper app, which does not.
57. As a coding agent, I want a change to an endpoint's answer to fail type-checking in the frontend that reads it, so that I find every caller without searching.
58. As a coding agent, I want the placeholder exports of `core` and `api-client` deleted when real exports replace them, so that I do not build on scaffolding.

### The Shopper app

59. As the owner, I want the Shopper app's page to show a value it fetched from the API while rendering on the server, so that the pattern every Shopper page will copy is set by the first one.
60. As the owner, I want that value fetched when the page is requested and never when the app is built, so that `pnpm check` still builds the Shopper app with no API running.
61. As the owner, I want the API's address known to the Shopper app's server only, so that the browser is never told where the API is unless a later feature needs it.
62. As a Shopper, I want a plain message when the API cannot be reached, so that I do not meet a crash page.
63. As the owner, I want the Shopper app to have no login of any kind, so that ACC-1 holds from the first page.
64. As the owner, I want Next's routing folder to go on doing nothing but route, so that the first real fetch does not bend the rule step 3 made checkable.

### The proof

65. As the owner, I want one command that proves the parts connect, in a real browser, so that the dashboard's own login code is proven and not only the services behind it.
66. As the owner, I want that command to log in the way the Admin does, through Keycloak's screen, so that it proves the path a person takes.
67. As the owner, I want it to start the apps that are not running, use the ones that are, and stop only what it started, so that I can run it whether or not I am in the middle of work.
68. As the owner, I want it to say plainly when the services are not running, and to name the command that starts them, so that I do not mistake that for a broken platform.
69. As the owner, I want it to say plainly when the browser it drives is not installed, so that the fix is one command.
70. As the owner, I want it to print one line for each thing it checked and to exit with an error when any fails, so that a script or an agent can rely on it.
71. As the owner, I want it never answered from a cache, so that a pass always means the platform was run.
72. As the owner, I want it kept out of `pnpm check`, so that the everyday check still needs no Docker and no browser.
73. As the owner, I want written down when it has to be run, so that leaving it out of `pnpm check` does not mean it is forgotten.
74. As the owner, I want each of its lines shown once to fail, so that I trust a pass.
75. As the owner, I want a failed run to leave a record I can open, so that I can see the screen the browser was on.
76. As the owner, I want the end-to-end tests to be a project of their own that imports no other project, so that they are linted and type-checked like everything else and can only see the platform from the outside.
77. As a coding agent, I want that project to be where the MVP's later journeys are written, so that the first journey of a module starts from a working example.

### Checks and housekeeping

78. As the owner, I want the guard's refusals proven inside `pnpm check`, so that the most dangerous code in the step is checked on every run.
79. As the owner, I want `core`'s domain layer barred from importing its infrastructure layer, as the API's is, so that the rule step 3 made follows the code into the library.
80. As the owner, I want the workplace's lint rules for test files re-expressed for Oxlint, so that the first real tests are held to them.
81. As the owner, I want `pnpm check` to pass with Docker stopped and no browser installed, so that this step adds no requirement to the everyday check.
82. As a coding agent, I want the code conventions this step sets, the new commands and the new settings written into the MVP spec, so that every later ticket starts from them.
83. As the owner, I want ADR-0004 brought in line with what was built, so that the ADR and the code agree.
84. As the owner, I want a commit after each piece of this work, each leaving `pnpm check` passing, so that the history shows how the joins were made.

## Implementation Decisions

### What this step is and is not

- It builds two endpoints, two placeholder pages, one guard, one generated client and one end-to-end test. None is a product feature, and both pages stay marked as placeholders.
- The API still has no database connection. Nothing in this step stores anything.
- No use case is written. Answering who the caller is decides nothing, so its controller reads the caller and answers. Command and Query classes, Stores and Effect's `Either` arrive with the first module that has a rule to apply, and Effect is not installed in this step.
- A library is added only where a join cannot be made without one. Each is named below with the reason, and each one's current documentation is read before it is used.

### The development Admin login

- `pnpm services:up` creates it. After both services are healthy, the start command asks Keycloak's administration interface, as Keycloak's own administrator, whether the login exists, and creates it if it does not. A login that exists is left as it is.
- Its name is `development-admin`. It holds the realm role `admin` and no other platform role. Its password is not temporary, and it has no action waiting for it at first login.
- It is created with every attribute Keycloak's default profile asks of a login, so that Keycloak shows it no screen beyond the login screen. The profile itself is not changed. It belongs to the `accounts` module, which has to fit it to a Vendor that logs in with a phone number.
- Its name and password are two new settings in `.env`. The password is generated like the others. `.env.example` lists both.
- The start command's rule for `.env` changes from "a file that exists is never changed" to "a value that is there is never changed". A setting that `.env.example` lists and `.env` lacks is added. This is what lets the owner's existing `.env` gain the two settings without a reset.
- It exists in development only. The realm file still holds no logins, and nothing in this step creates a login anywhere else.
- `pnpm services:check` gains lines for it: the login exists, and it holds the `admin` role.

### The realm

- The dashboard's login client gains an audience mapper, so that every access token it is issued names the API as an audience. The audience is `pcp-api`.
- Nothing else in the realm changes. Session and token lifetimes stay at Keycloak's defaults.
- The realm file changes, so the reset rule applies: the owner's running services need `pnpm services:reset` and a new start once.
- `pnpm services:check` gains a line that reads the mapper back, since a token cannot be had without logging in.

### Verifying a login in the API

- The guard verifies every token itself. It checks the signature against the realm's published keys, the expiry, that the issuer is exactly the realm's issuer, and that the audience includes `pcp-api`. It accepts asymmetric signatures only.
- The library is `jose`. It fetches the realm's keys from the address the issuer publishes, keeps them, and fetches again when a token names a key it does not have. `nest-keycloak-connect`, the community's Keycloak adapter for NestJS, does not accept NestJS 11, and the workplace has no verification code to follow.
- The keys are fetched on first need and not at startup, so the API starts without Keycloak and its public endpoints answer without it.
- When the keys cannot be fetched, a request that carries a token is refused with a server error, and is never let through.
- The roles are read from the token's realm roles. The API makes no call to Keycloak to verify a request or to learn a role.
- `jose` is published as ES modules only, and the API's bundle and its Jest run are CommonJS. How each loads it is found out on the installed tools before the guard is written. See Further Notes.

### Access rules

- One global guard, registered once, as at the workplace. No controller names a guard.
- Every endpoint carries `@PreAuthorize([...roles])` or `@Public()`. `@PreAuthorize` lets a caller through when it holds any one of the roles listed. `@Public()` skips the guard's checks altogether, so a public endpoint answers the same with a good token, a bad token or none.
- An endpoint that carries neither is refused for every caller.
- A request with no token, or with a token that fails any check, is answered 401. A request with a good token that lacks the role, or that reaches an endpoint with no access rule, is answered 403.
- The two roles, `admin` and `vendor`, are stated once in `core`'s domain layer. Role names are compared without regard to case, as at the workplace.
- The workplace's other access rules are not built: its internal endpoints with basic authentication, its dynamic roles, its check for disabled accounts and its minimum app version.

### The caller

- A caller is three things: the login's identifier in Keycloak, the login's name, and the platform roles it holds. The roles Keycloak gives every login are left out.
- The guard fills an injectable resolver with the caller only after every check has passed. It is the workplace's `CurrentUserResolver`, built the same way, on request-scoped storage from `nestjs-cls`, and named for the caller.
- The resolver is read in the infrastructure layer only. A controller passes plain values into a use case's Input, as the workplace's code does, although the workplace's own document shows otherwise.

### The API's two endpoints

| Endpoint | Access | What it answers |
|---|---|---|
| `GET /v1/caller` | Admin or Vendor | The caller: identifier, login name and platform roles |
| `GET /v1/status` | Public | The time this API process started |

- The status endpoint exists so that the Shopper app has something to fetch that it could not have known by itself. It is marked as a placeholder and is deleted when the first real Shopper endpoint arrives.
- The placeholder endpoint from step 1 is deleted, as its own comment says.
- Paths follow the workplace's shape: the controller declares no path, and each method carries its full path. A version segment comes first. The workplace's `protected` and `public` segments are not used, because they are instructions to a proxy this project does not have.
- Each endpoint has a Response class, built by a static factory, as at the workplace. Neither takes input, so no Request class is written and the validation pipe arrives with the first endpoint that has one.

### Refusals

- One global exception filter gives every error the workplace's body: a list of errors, each with a code, a title and a detail.
- The trace identifier the workplace adds to that body is left out until the API has tracing.
- The body never says why a token was refused. The reason is logged.
- The `StructuredError` classes that use cases return are not written in this step, because there is no use case to return one.

### Settings

- The API reads its settings through NestJS's configuration module, validated at startup with `class-validator`, as at the workplace. A setting that is present and malformed stops the API with a message that names it.
- The API's settings in this step: its port, the realm's issuer, the audience it requires, and the origins it accepts browser calls from.
- The dashboard's settings: Keycloak's address, the realm, the login client and the API's address. The Shopper app's one setting is the API's address, read on its server only.
- Every setting has a default that is the fixed development value. None is a secret, and none goes into `.env`. Values for a server are supplied when the platform is packaged, which is later work.
- The API accepts browser calls from the origins in its setting, which by default is the dashboard's address alone. A request that names no origin is not a browser call and is not affected, which is how the Shopper app's server calls it.
- The application is set up by one function, separate from the code that starts listening, as at the workplace. The real start and every test call the same function.

### `core`

- `core` gains what the MVP spec says it is for: the guard, the access decorators, the caller resolver, the roles, the exception filter and the error body, the settings base and the allowed-origins rule. The API holds none of them.
- `core` is laid out in the workplace's two layers. The ban on a domain file importing infrastructure is extended to it, and `pnpm boundaries:check` gains its cases.
- `core` gains a second entry, for test helpers, as at the workplace. It holds the helpers the API's tests need: one that signs a token, one that stands in for Keycloak's key address, and one that asserts the shape of an error body. Only test files import it.
- `core`'s placeholder export and its placeholder test are deleted. `core` keeps its test target, with unit tests for its pure pieces: reading a caller from a token's claims, the allowed-origins rule and the settings check.

### The API's description and `api-client`

- The API describes itself with `@nestjs/swagger`, with explicit annotations on each endpoint and each Response class. No compiler plugin is used, as at the workplace. Bearer authentication is declared once for the whole document.
- The document is committed. So are the files generated from it in `@pcp/api-client`.
- `pnpm api-client:write` writes the document from the API's code and then writes the client from the document. Neither is ever edited by hand.
- `pnpm check` fails when the committed document differs from what the API describes, and when the committed client differs from what the document generates. Each committed file is an input of the check that compares it, so that a cached pass never hides a stale one. This is the pattern step 3 set for the frontends' import bans.
- The document is produced without the API listening on a port and without Keycloak. How is settled during implementation.
- The generator is `@hey-api/openapi-ts`. It is the one of the three considered that declares support for TypeScript 6, which this repository uses. See Further Notes for the other two.
- `@pcp/api-client` exports one way to make a client. It takes the API's address and, optionally, a function that supplies a token. It imports nothing from Keycloak and no data-fetching library. It works in the browser and on Next's server.
- A call's result is typed from the document: the answer on success, and the error body on a refusal.
- The API does not serve the document or Swagger's own screen. The committed document is the reference.

### The dashboard

- The login library is `keycloak-js`, Keycloak's own adapter for a single-page application.
- The login is started once, before React renders, and requires a login: the dashboard has no screen for someone who has not logged in. Someone who is not logged in is sent to Keycloak, with the authorisation code flow and a PKCE challenge.
- Tokens are kept in memory only, which is the adapter's behaviour. A reload goes back through Keycloak, which answers from its own session without asking for the password.
- The adapter's session-status frame is switched off. Keycloak's guide says browsers that block third-party cookies disable it anyway.
- Before each call to the API the adapter is asked for a token that is still valid, and it renews one that is about to run out. When Keycloak refuses to renew, the Admin is sent to log in again.
- A 401 or 403 from the API is shown as a refusal. The dashboard does not start a login because the API refused.
- The placeholder page is replaced by a page that shows who the API says the caller is, with a way to log out. Logging out ends the session in Keycloak and returns to the dashboard's address, which sends the next visitor to the login screen.
- The page is one unstyled screen in English and is still marked as a placeholder. No router, data-fetching, form or state library is added.
- The login code and the configured client sit in the Shared layer, each in its own segment, and the App layer starts the login. The bans from step 3 apply as they stand.

### The Shopper app

- The placeholder page becomes a server component that fetches the API's status through `@pcp/api-client` and shows it. It is still marked as a placeholder, in English, with no styling.
- The page is rendered when it is requested and never when the app is built. Next's `connection()` is the means, called where the fetch is made, so that the route file stays a re-export.
- When the API cannot be reached, the page shows one plain line saying so.
- The Shopper app has no login code and does not depend on `keycloak-js`.

### The end-to-end project and `pnpm platform:check`

- The end-to-end tests are a ninth project, `@pcp/e2e`, in `apps/` beside the three apps, which is where Nx's convention puts one. It is written with Playwright's test runner and driven through Nx's Playwright plugin, pinned with the other Nx plugins.
- It carries the tags `scope:e2e` and `type:e2e`, and may import no other project. It reads the platform through a browser and over HTTP, and never through its code.
- `pnpm check` lints and type-checks it like any project. It has no `test` target and no `build` target, so `pnpm check` never runs it.
- `pnpm platform:check` runs it, in Chromium only, with one worker.
- The command starts each of the three apps whose port is not answering, with the same development servers the owner uses, uses an app that is already answering, and stops only what it started.
- It does not start the services. Before any test it checks that Keycloak answers and that `.env` holds the development Admin's settings, and when either is missing it says so and names `pnpm services:up`.
- It is never answered from Nx's cache.
- It reads the development Admin's name and password from `.env` and never prints them.
- A failed run leaves Playwright's report and trace in a folder Git ignores. A trace holds what was typed into the login screen, which is one more reason it is never committed.
- The browser is installed once with Playwright's own command. `pnpm install` does not download it. The MVP spec gains that command.
- It is run after a change to the realm file, to the guard or the access rules, to the dashboard's login code, to either frontend's call to the API or to an app's settings, and after an upgrade of Keycloak, `keycloak-js`, `jose`, Next or Playwright. The MVP spec says so beside the command.

### Lint rules for test files

- The workplace lints its Jest tests with eight rules: no focused test, a warning for a disabled test, every test asserts something, no two tests with one title, well-formed `expect` calls, `it` and not `test`, a `describe` around every test, and a warning for a test that returns a value.
- They are re-expressed for Oxlint and applied to the API's and `core`'s test files. Each rule's presence in the pinned Oxlint is checked first, and a rule Oxlint does not have is recorded and left out.
- The rule that every test asserts something counts the new error-body helper as an assertion.
- The end-to-end project is not Jest. It gets Oxlint's Playwright rules if the pinned Oxlint has them, and otherwise the shared rules only.

### Versions

- The workplace's line is followed where the workplace has one, because the API is practice for that codebase: `@nestjs/swagger` 11, `@nestjs/config` 4 and `class-validator` with `class-transformer`. The newest `@nestjs/swagger` needs NestJS 12, which Nx's NestJS plugin still refuses.
- `@hey-api/openapi-ts` is still before version 1.0, so its version is pinned exactly, as Oxfmt's is.
- Every other new package is the current stable release when the work is done.
- pnpm refuses an install script that the workspace file does not list. A new package's script is read before it is listed.

### Recording

- The MVP spec's Technology section gains: the code conventions this step set for the API and for a frontend's calls to it; the two new commands, with when to run each; the browser's one-time install; the development Admin's name and where its password is; the settings of the three apps with their defaults; the ninth project in the tables of projects, tags and targets; the new wording of the rule for `.env`; and the libraries chosen. It says that step 4 is finished and that the infrastructure is complete.
- The table of development services no longer says the realm holds no logins.
- ADR-0004 is brought up to date: the public decorator is written `@Public()`, as the workplace's code has it and not as its document does, and the guard's verification is described as built.
- The work is committed in pieces, each leaving `pnpm check` passing.

## Testing Decisions

A good test of this step asks a running part a question from the outside and reads the answer. It sends the API a request and reads the status and the body. It opens a page in a browser and reads what is on it. It does not call the guard's methods, inspect a decorator's metadata, or assert what a library was called with, all of which may change freely while the same requests are refused and allowed.

There are two seams. The owner confirmed them on 9 October 2026, and chose a real browser for the second.

### Seam 1: the repository root, through `pnpm check`

The guard is tested through the API's HTTP surface, in the API's Jest tests. Each test builds the application from its real root module, sets it up with the function the real start uses, listens on a free port and sends requests with `fetch`. This is the seam the placeholder test already uses.

Tokens are signed in the test with a key pair made for that run. A small HTTP server in the test stands in for Keycloak's key address, and the API under test is given that server as its issuer. The verification code therefore runs whole: it fetches keys over HTTP, picks one and checks a signature. Nothing is mocked and the guard is never overridden.

Where the real API has no endpoint of the kind a case needs, the test adds one of its own to the application: one for the Admin only, and one with no access rule.

- **Refused with 401:** no token; a header that is not a bearer token; a token that is not a token; a token signed with another key; a token whose claims were changed after signing; an expired token; a token from another issuer; a token for another audience; a token that names no algorithm; a token signed symmetrically with the public key as the secret.
- **Refused with 403:** a good token with no platform role, at the caller endpoint; a Vendor's token at the Admin-only endpoint; any good token at the endpoint with no access rule.
- **Allowed:** an Admin's token and a Vendor's token at the caller endpoint, each answered with that caller's identifier, name and platform roles, without the roles Keycloak gives every login; an Admin's token at the Admin-only endpoint; the status endpoint with no token, and again with a bad one.
- **Keys:** a token signed with a key the stand-in starts to publish after the API has fetched its keys is accepted. With the stand-in stopped and no keys fetched, a request with a token is refused with a server error, and the status endpoint still answers.
- **Refusal bodies:** each 401 and 403 above has the agreed body, and none carries the reason the token failed.
- **Browser calls:** a preflight request from the dashboard's address is allowed, and one from another address is not.
- **Settings:** the application refuses to start with a malformed issuer, and the message names the setting.
- **The description:** the committed OpenAPI document equals what the API describes, and the committed client equals what the document generates.

Each group is seen to fail once, by a deliberate fault that is then reverted: the signature check removed, the expiry check removed, the issuer left unchecked, the audience left unchecked, the access rule for a missing decorator turned round, a Response class changed without writing the document again.

### Seam 2: the running platform, from the outside

PostgreSQL, Keycloak, the API, the dashboard and the Shopper app all run, and `pnpm platform:check` observes them at their ports through a real browser. This is the only place where a token Keycloak really issued meets the API's real verification.

- **The Admin logs in.** The browser opens the dashboard's address and arrives at Keycloak's login screen. It types the development Admin's name and password. It arrives back on the dashboard, which shows the development Admin's name and the `admin` role.
- **The API was asked.** The browser's own request to the caller endpoint carried a bearer token and was answered 200, and the name on the page is the name in that answer.
- **The endpoint is not simply open.** The same request sent without a token is answered 401.
- **A reload keeps the login.** After a reload the page shows the caller again and no login screen was shown.
- **Logging out ends it.** After logging out, opening the dashboard's address arrives at the login screen.
- **The Shopper page comes from the API.** The page's HTML, fetched with no browser and so with no script run, holds the start time that the API's status endpoint answers when asked directly.

What the Shopper page shows when the API is absent is checked by hand, below, because the command would have to stop an app it may not have started.

Each line is seen to fail once, by a deliberate fault that is then reverted: the API given another issuer; the audience mapper removed from the realm and the services reset; the dashboard's address removed from the API's accepted origins; the dashboard given another login client; the Shopper app given a wrong address for the API.

### The rest

- **From scratch.** In a fresh clone in a new directory, with no `.env` and no Docker volumes: one install, the browser's install, `pnpm check --skip-nx-cache`, `pnpm boundaries:check`, `pnpm services:up`, `pnpm services:check` and `pnpm platform:check` all pass, with none of the three apps started by hand. Steps 1 to 3 showed that results left over from earlier runs can hide a fault, so this run is the one that counts.
- **By hand, once:**
  - The owner logs in to the dashboard in their own browser as the development Admin, and sees their name and role.
  - The dashboard is left open for longer than a token lasts, and then calls the API again without a login screen.
  - With the API stopped, the Shopper app's page shows its plain message, and the dashboard says the API cannot be reached.
  - With Keycloak stopped, the status endpoint still answers and the Shopper page still renders.
  - `pnpm services:up` on the owner's existing `.env` adds the two new settings and changes no value that was there.
  - `pnpm services:up` run a second time leaves the development Admin and its password as they were.
  - `pnpm platform:check` with the services stopped says so and names the start command. With one app already running it uses that app and leaves it running.
  - `pnpm check` passes with Docker stopped and with no browser installed.
- **The lint rules for test files.** Each is shown once to fail on a deliberate fault.
- **`core`'s layer ban.** `pnpm boundaries:check` gains a forbidden case for it and an allowed one, and a case in which the end-to-end project imports another project and is refused.
- **Prior art.** The placeholder test is the model for a test at the API's HTTP surface. The workplace's tests of its guard are the model for the rest: they run the real guard, never override it, add a controller of their own to the application, and stand a local HTTP server in for Keycloak. Their tokens are unsigned, which works only because the workplace's guard verifies nothing, so that part is not followed. `pnpm services:check` is the model for a command that checks a running thing and says plainly when it is not running. Nothing is copied from the workplace.
- **Recording.** The results of the fault checks and the by-hand checks are written under the Comments heading of the ticket that carries them out.

## Out of Scope

- Connecting the API to PostgreSQL, Drizzle, schemas, migrations and test containers. They arrive with the first module that stores something.
- Command and Query classes, Stores, the `StructuredError` classes and Effect.
- Request classes and the validation pipe, which arrive with the first endpoint that takes input.
- Everything in `accounts`: creating a Vendor, the API's own access to Keycloak's administration interface and the secret it needs, temporary passwords and the forced change at first login, logging in with a phone number, Keycloak's profile for a login, the password policy, session lengths, deactivating a Vendor and acting as a Vendor.
- A development Vendor login. It is created when the first Vendor screen needs one.
- The real Admin's login, and any login outside development.
- Any real screen in the dashboard or the Shopper app, the three languages, right-to-left layout, Tailwind CSS, shadcn/ui and next-intl.
- A router, a data-fetching library, a form library and a state library in either frontend. Each is chosen when work on that app begins.
- The Shopper app calling the API from the browser, and the API accepting browser calls from the Shopper app's address. Both arrive with the builder.
- The frontends' unit-test tools.
- The MVP's end-to-end journeys. This step builds where they will live and one test.
- Browsers other than Chromium, and a phone-sized screen, in the end-to-end tests.
- Serving the OpenAPI document or Swagger's own screen from the running API.
- The workplace's health, information and metrics endpoints, its tracing and its logging interceptor.
- A lint ban on importing `core`'s test helpers from code that is not a test.
- Running `pnpm platform:check` as part of `pnpm check`.
- Anything for production: Dockerfiles, a production Compose file, HTTPS, server values for the settings, and the choice of host.
- Automated checks on GitHub.
- Every module in the MVP's capability map.

## Further Notes

- **Choices made here that no ADR records.** The owner may overrule any of them before work starts:
  - The guard checks the audience as well as the three things ADR-0004 lists, and the realm file gains a mapper for it. Without it, a token the realm issued to any other client would open the API.
  - The development Admin is created by `pnpm services:up` and not kept in the realm file, and the rule for `.env` is reworded so that a new setting can be added to a file that exists.
  - The names: `development-admin`, the audience `pcp-api`, the endpoints `/v1/caller` and `/v1/status`, the commands `pnpm platform:check` and `pnpm api-client:write`, and the project `@pcp/e2e`.
  - A version segment begins every path.
  - The caller resolver is named for the caller and not for the "current user".
  - `core` gains a second entry for test helpers. Step 3 recorded that a library has a single entry file.
  - The end-to-end tests are a ninth project, and it lives in `apps/`.
  - Every setting of the three apps has its development value as a default.
  - The OpenAPI document and the generated client are committed.
  - The trace identifier is left out of the error body.
  - The dashboard keeps tokens in memory only and switches the session-status frame off.
  - The API serves no Swagger screen, although the workplace's services do.
  - The four libraries: `jose`, `keycloak-js`, `@hey-api/openapi-ts` and Playwright.
- **The libraries considered and not chosen.**
  - For the client: `openapi-typescript` with `openapi-fetch` generates types alone and has the smallest runtime, and was the first choice, but it declares TypeScript 5 only. `orval` generates hooks for a data-fetching library that has not been chosen. If `@hey-api/openapi-ts` cannot meet what this spec asks of the client, `openapi-typescript` is tried against TypeScript 6 on the installed tools before anything else.
  - For the login: `oidc-client-ts` with `react-oidc-context` works with any identity service and keeps tokens in the browser's session storage by default. The platform's identity service is settled by ADR-0003, so Keycloak's own adapter is the smaller choice.
  - For verification: `passport-jwt` with `jwks-rsa` does the same work in two packages and brings Passport with it. It is the fallback if `jose` cannot be loaded cleanly, and how it is published is checked before it is relied on.
- **Checked in the npm registry on 9 October 2026:**
  - `@nestjs/swagger` 12.0.2 needs NestJS 12. 11.4.7 is the newest release that accepts NestJS 11. `@nestjs/config` 4.0.4 accepts NestJS 10 and 11.
  - `@nx/nest` 23.3.0 still declares NestJS below 12.
  - `nest-keycloak-connect` 1.10.1 declares NestJS below 11.
  - `nestjs-cls` 7.0.1 accepts NestJS 10 to 12.
  - `jose` 6.2.12 and `keycloak-js` 26.2.4 are published as ES modules only. `keycloak-js` is versioned apart from the Keycloak server.
  - `openapi-typescript` 7.13.0 declares TypeScript 5. `@hey-api/openapi-ts` 0.99.0 declares TypeScript 6 and Node 22.18 or later. This repository has TypeScript 6.0.3.
  - `@playwright/test` is at 1.64.0, and `@nx/playwright` exists at 23.2.1, the version Nx is pinned to.
  - `effect` is at 4.0.2, and the workplace is on version 3. This step installs neither. The first module that needs Effect chooses between them, and checks what version 4 did to `Either`, which ADR-0004 names.
- **Checked in the documentation on 9 October 2026:**
  - Keycloak's guide to its JavaScript adapter, for 26.8.0: PKCE with the S256 method is the default; tokens are "stored in memory and are not persisted in any kind of storage"; the adapter is initialised before a framework's router; the session-status frame is on by default and is disabled where third-party cookies are blocked.
  - Next's documentation, for 16.4.0: `connection()` makes rendering wait for a request, and has been stable since version 15. The installed Next is 16.1, so its own documentation is checked again.
  - Playwright's documentation: the test runner can start several servers, and can use one that is already answering.
- **Checked in the workplace repository on 9 October 2026:**
  - Its guard decodes a token and verifies nothing. Its documents say a proxy in front has done so. It has no JWT library, no key address and no issuer or audience setting.
  - One global guard is registered in its core library. Its decorators are `@PreAuthorize`, `@Public`, `@Internal` and `@AnyDynamicRole`. An endpoint with none is answered 403. Roles are the realm roles in the token, compared in lower case.
  - Its document writes `@Public(true)` and every use in its code is `@Public()`.
  - The caller reaches a controller through `CurrentUserResolver`, on `nestjs-cls`. Its document shows it injected into a Command, and in the code only the infrastructure layer uses it.
  - Its error body is a trace identifier and a list of errors, each with a code, a title and a detail.
  - It serves its OpenAPI document at runtime only, behind a setting, and writes it to no file. It has no generated client, so the committed document and the client are this project's own.
  - Its settings are read through `@nestjs/config` and validated with `class-validator`.
  - Its tests run the real guard with unsigned tokens, and it has no test for an expired or forged token.
- **Not yet known, and found out first.** The services were not running when this spec was written and the realm has no login, so no real token could be read. Each of these is settled on the running tools before the code that depends on it is written, and the finding is recorded in the ticket:
  - What Keycloak puts in an access token for the dashboard's client: the issuer, the audience before and after the mapper, the signing algorithm, the claim that holds the realm roles, and the claim that holds the login's name. Guides by third parties say the audience is `account` unless a mapper adds another.
  - Whether Keycloak sends a login that lacks a first name, a last name or an email address to a screen that asks for them. Keycloak's issue tracker says it has done so by default since version 24. The development Admin is created so that this cannot happen, whichever is true.
  - How Jest, which runs CommonJS through SWC, loads `jose`. Node 24 can load an ES module from CommonJS, and Jest's own loader may not. The first thing to try is letting SWC transform the package for Jest.
  - How the OpenAPI document is produced from the API's code without listening on a port.
  - Whether Nx's Playwright plugin caches its target by default, and how that is switched off.
  - Which of the workplace's eight Jest rules, and which Playwright rules, the pinned Oxlint has.
- **One reset.** The audience mapper changes the realm file, so the owner's services need `pnpm services:reset` and a new start. The development Admin is created again by that start.
- **The lesson from steps 1 to 3.** Results left over from earlier runs hid faults in all three. Every claim in this step is checked on a fresh clone, with Nx's cache skipped and the services reset.
- **Next steps.** This step closes the infrastructure. The capability map's build order begins with `languages`, `catalog` and `accounts`, and each gets its own spec in its own directory under `.scratch/`.
