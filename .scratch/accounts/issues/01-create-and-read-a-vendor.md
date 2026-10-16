# 01: Create and read a Vendor and its Login through the API, proven against a real PostgreSQL and a real Keycloak

**Spec:** [the accounts spec](../spec.md)

**What to build:** The Admin creates a Vendor through the API, giving its name, its city and its login phone number, and reads it back. Creating it makes its Login in Keycloak, named by the login phone number in its stored form, holding the `vendor` role and no other, with a temporary password that the platform made and the Vendor must replace at its next login. The answer holds the temporary password, once. The login phone number may be typed in any of the forms a person types one. This is the first time the API changes anything in Keycloak.

It is the first path through every part this module needs. The realm gains a client for the API, whose service account may manage the realm's Logins, and stops asking a Login for an email address and names. The API gains its settings for Keycloak's administration interface and its first port over Keycloak. The Vendor gets its table, entity, Store, Command and Query. `pnpm integration:check` gains a real Keycloak, started from the repository's realm file, beside its PostgreSQL.

The Vendor's other details arrive in ticket 02. Nothing here touches the development services: ticket 03 resets them and runs the API against them. Only the Admin reads a Vendor here. Ticket 07 lets the Vendor's own Login read it too.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Before anything is written, these are read for the releases that will be installed, and the findings are recorded under Comments:
  - `@keycloak/keycloak-admin-client`: how it logs in with a client's secret, and its calls for finding, creating and deleting a user, giving it a realm role and setting a temporary password;
  - Keycloak 26.8's documentation on importing a realm whose file names environment settings, on the user profile, and on the realm-management roles;
  - `libphonenumber-js`: how it reads an Iraqi number, the forms it writes, and which of its metadata sets tells a mobile number from a landline;
  - Testcontainers' generic container, for a Keycloak that imports a realm file when it starts;
  - whether Keycloak's token address tells a temporary password apart from a wrong one, and how a test's own client asks it;
  - the workplace's Keycloak administration module and its tests. They are read, and nothing is copied.
- [x] CONTEXT.md gains **Login phone number**, **Temporary password**, **Contact details**, **Acting as a Vendor** and **Deactivated Vendor**, as the spec words them, before any code uses them.
- [x] A new ADR records that Vendors are kept in the platform's database and their Logins in Keycloak, changed only through the API in a safe order, and that the Admin acts as a Vendor in the API with the Admin's own Login, not through Keycloak's impersonation.
- [x] `@keycloak/keycloak-admin-client`, in the 26.8 line, and `libphonenumber-js` are added at the newest releases pnpm's minimum release age allows. A new package's install script is read before it is listed. Jest's shared preset transforms the admin client and the packages it needs, as it transforms `jose`.
- [x] The realm file gains a confidential client for the API, with a service account, no login through a browser, and the fewest realm-management roles with which the API does what this module needs. The roles chosen, and why each is needed, are recorded under Comments. The secret is not in the file: the file names an environment setting that Keycloak reads when it imports the realm.
- [x] The realm's user profile asks a Login for no email address, first name or last name. Whether the development logins still need them is found out and recorded.
- [x] The API gains settings for where Keycloak is, the realm, the API's client and that client's secret, separate from `KEYCLOAK_ISSUER`. The secret has no default, and the API refuses to start without it and names it. The test of the API's settings covers them. The API starts while Keycloak cannot be reached.
- [x] Which of the API's targets need the secret is found out and recorded, given that every setting is checked when the API starts. The values for the development services wait for ticket 03.
- [x] **Phone numbers.** Before a number is read, Arabic-Indic and Eastern Arabic-Indic digits become Western digits, and spaces, dashes, dots and brackets are dropped. It is read as Iraqi unless it says otherwise. It is stored in the international form, `+9647501234567`, and answered in that form and in Iraq's own, "0750 123 4567".
- [x] The Vendor table holds the identifier, the name, the city, the login phone number, the Login's identifier, whether the Vendor is active, and when it was created and last changed. The Login's identifier and the login phone number are each unique. The migration is generated, and its file name says what it does.
- [x] The domain holds:
  - a `Vendor` entity with getters;
  - the ports `VendorStore` and `LoginStore`, each an abstract class;
  - `CreateVendorCommand` and `ReadVendorQuery`, each with its own Input and Output.

  The infrastructure holds the schema, the database Store, the Keycloak Store that wraps the admin client, the controller with its Request and Response classes, and the module, which binds each port with its abstract class as the token. No other code imports the admin client.
- [x] **Create.** Only the Admin creates a Vendor:
  - The name is required, as written, at most 100 characters.
  - The city is one of a fixed set in code, which holds Erbil.
  - The login phone number must be an Iraqi mobile number, and free.
  - Every check runs before anything is made in Keycloak.
- [x] Creating makes the Login, then the Vendor. When the Vendor cannot be stored, the Login is deleted again. When that fails too, the Login's identifier is logged.
- [x] **The temporary password** is 12 lower-case letters and digits, without 0, o, 1, l or i, from a cryptographically secure generator. It is given to Keycloak as a temporary credential, the Login is required to update its password, and the password is in the create's answer and nowhere else.
- [x] **Read.** The Admin reads a Vendor. One that does not exist is answered 404 with `VENDOR_NOT_FOUND`.
- [x] While Keycloak's administration interface cannot be reached, a create is answered 503 with `IDENTITY_SERVICE_UNAVAILABLE`, and nothing is stored.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] The API's test utilities gain a shared Keycloak: one container of the image and version the development services run, for every test file, which imports the repository's realm file with a secret the test gives. What a test made in it is removed between tests. When Docker is not running, `pnpm integration:check` says so plainly, as before. How long the container takes to start is recorded.
- [x] `pnpm integration:check` passes with these tests, which go through the API's HTTP surface with tokens from the stand-in, and read Keycloak through its administration interface as the container's own administrator:
  - The Admin creates a Vendor with its login phone number typed in local form with spaces, with +964, with 00964 and in Arabic-Indic digits, and reads it back with the number in both forms.
  - Its Login exists, named by the stored form, enabled, holding `vendor` and no other platform role, with no email address or names, and required to update its password.
  - The temporary password in the answer is the Login's: the token address, asked through a client the test adds to its own container's realm, says that the Login is not yet set up, and not that the password is wrong. A read of the Vendor does not hold the password.
  - A landline and a number that is not Iraqi are each refused as the login phone number. A blank name, a name of 101 characters and a city outside the set are each refused. Each answer names the field, and no Login is made.
  - A login phone number another Vendor holds is refused as taken, and Keycloak holds no second Login.
  - A create whose Vendor cannot be stored, by a fault planted for the test, leaves no Login in Keycloak.
  - With the Keycloak container paused, a create is answered 503 with its code, and no Vendor exists.
  - A Vendor's create and read are answered 403, and calls without a token are answered 401.
- [x] Shown once and then reverted, each failing its own test: the check that a login phone number is free removed; the `admin` role given instead of `vendor`; the password given as a lasting one; the deletion of the Login removed from a failed create; Arabic-Indic digits left unconverted.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.

## Comments

### 16 October 2026: what was read before anything was written

Read for the releases installed: `@keycloak/keycloak-admin-client` 26.8.1 and `libphonenumber-js` 1.13.15, both from their own published packages, Keycloak 26.8.0 tried in a throwaway container, and Testcontainers 12.2.1 from its installed types. Nothing was copied from the workplace's repository.

- **`@keycloak/keycloak-admin-client` 26.8.1.**
  - `new KeycloakAdminClient({ baseUrl, realmName, timeout })`, then `auth({ grantType: 'client_credentials', clientId, clientSecret })`, which sends the secret in a Basic header to the realm's token address.
  - `timeout` is in milliseconds and applies to the login and to every call, through `AbortSignal.timeout`. Without it a call to a Keycloak that does not answer waits for ever.
  - An answer that is not a success throws `NetworkError`, which carries the response and its status. A call that cannot be made throws what `fetch` throws.
  - The calls this ticket uses: `users.find({ username, exact: true })`, `users.create({ username, enabled, credentials })`, which answers `{ id }`, `users.del({ id })`, `users.listAvailableRealmRoleMappings({ id })`, `users.addRealmRoleMappings({ id, roles })` and `users.resetPassword({ id, credential })`. A credential is `{ type: 'password', value, temporary }`.
  - It is published as ES modules only, as are its six Kiota packages, `camelize-ts` and `url-template`. `@std-uritemplate/std-uritemplate` and `libphonenumber-js` also publish CommonJS, and `tinyduration` and `@opentelemetry/api` are CommonJS.
- **Keycloak 26.8.0, tried in a container.**
  - **The secret in the realm file.** Keycloak's import guide says a placeholder such as `${MY_REALM_NAME}` is filled from an environment setting when a realm is imported, and says nothing of a setting that is not given. Tried: with `PCP_API_CLIENT_SECRET` set, the client's secret is its value. **Without it, the placeholder is left as it is, and the client's secret is the text `${PCP_API_CLIENT_SECRET}`, which logs in.** Ticket 03's Compose line must therefore refuse to start without it, with `${PCP_API_CLIENT_SECRET:?…}` as the file's other secrets do.
  - **The fewest roles.** A service account holding `manage-users` alone, and no other role of `realm-management`, created a Login, found it by its exact name, read the realm roles it may give, gave it `vendor`, set a temporary and then a lasting password, ended its sessions, disabled it and deleted it. Reading the `vendor` role by its name was refused with 403: that needs `view-realm`. So the API finds the role among the roles the Login may still be given, and `manage-users` is the only role it holds.
  - **Renaming.** Changing a Login's name was refused with `error-user-attribute-read-only` while the realm does not allow names to be edited. Ticket 10 needs `editUsernameAllowed` on the realm.
  - **The user profile.** Keycloak's default profile has `username`, `email`, `firstName` and `lastName`, the last three required for users. A Login without them that holds a lasting password is refused at the token address as "not fully set up", exactly like one with a temporary password. Keycloak's guide says `username` and `email` cannot be removed. With `firstName` and `lastName` removed and `email` no longer required, the same Login logs in. The realm file states the profile as Keycloak's own export does: a `declarative-user-profile` component whose `kc.user.profile.config` holds the profile as text.
  - **The development logins.** With that profile, the payload `pnpm services:up` sends for a development login is still taken, and the login logs in. Keycloak keeps its email address and drops the two names, which the profile no longer has. So the development Admin needs neither any more; ticket 03 or 04 may stop sending them.
  - **The token address.** Asked with the password flow through a public client with direct access grants, a temporary password is answered 400 `invalid_grant` "Account is not fully set up", and a wrong one 400 `invalid_grant` "Invalid user credentials". A temporary credential given when a Login is created puts `UPDATE_PASSWORD` among its required actions by itself, so the API does not add the action again: added by hand, it would hide a password given as a lasting one.
  - A name such as `+9647501234567` is a valid Login name, and a second Login of the same name is refused with 409 "User exists with same username".
  - The container was ready, by its health address, 9 to 11 seconds after it was started.
- **`libphonenumber-js` 1.13.15.**
  - Three metadata sets: `min` validates a number but cannot tell its type, `mobile` holds mobile numbers only and refuses every landline, and `max` gives the type. The API uses `libphonenumber-js/max`: `0750 123 4567` is `MOBILE` and `066 223 4567`, an Erbil landline, is `FIXED_LINE`.
  - `parsePhoneNumberFromString(text, 'IQ')` reads a number as Iraqi unless it starts with `+` or `00`. `00964 750 123 4567` and `9647501234567` are read as the same Iraqi number, and `+1 202 555 0123` as American.
  - It writes `number`, the international form with no spaces, `+9647501234567`, and `formatNational()`, Iraq's own form, `0750 123 4567`.
  - **It already reads Arabic-Indic and Eastern Arabic-Indic digits, and ignores spaces, dashes, dots and brackets, by itself.** It also finds a number inside other text. The API therefore does its own clean-up first, as the spec says, and then takes only digits with an optional leading `+`. That keeps what it accepts to the forms the spec lists, and it is what lets the fault of leaving Arabic-Indic digits unconverted fail a test.
- **Testcontainers 12.2.1.** `GenericContainer` takes a command, environment settings, exposed ports, folders to copy in and `Wait.forHttp(path, port)`. It has no pause of its own. `getContainerRuntimeClient()` gives a client whose `container.getById(id)` is a Docker container with `pause()` and `unpause()`.
- **The workplace's Keycloak administration module and its tests**, read and not copied.
  - It logs in with the password flow as a realm administrator plus a client secret, and builds a new client for every call. This API logs in as its own client's service account instead, so no person's password is a setting. It also builds a client for each call, so it connects only when a call needs Keycloak.
  - Its tests mock the admin client. These go to a real Keycloak, as the owner chose.
  - Its Jest configuration transforms `@keycloak/keycloak-admin-client`, `@microsoft/kiota-`, `camelize-ts` and `url-template`, the same packages found above.
  - It reads phone numbers with `libphonenumber-js/max` and stores them in the international form.

### 16 October 2026: completed

**For the owner to decide.**

- **The API now refuses to start without its client's secret, and nothing gives it one yet in development.** The API checks all of its settings when any of its targets starts, so every target needs the secret: `serve`, and also `migrate` and `catalog-import`, which never reach Keycloak. Until ticket 03 gives it from `.env` through each target's env file, `pnpm db:migrate`, `pnpm services:up` (which runs it), `pnpm catalog:import`, `pnpm exec nx serve @pcp/api` and `pnpm platform:check` stop at the API's start and name `KEYCLOAK_CLIENT_SECRET`. `pnpm check` and `pnpm integration:check` are not affected. The description that `pnpm api-client:write` builds is given a value that is never used, as it is given the database password. **My recommendation:** keep one settings class, and have ticket 03 add the line to all three env files. Narrowing what the migration and the import check would split the settings in two for one secret. Ticket 02 comes first and needs only the tests.
- **A Keycloak started without the secret gives the client a secret anyone can guess.** Keycloak leaves a placeholder it cannot fill as it is, so the client's secret becomes the text `${PCP_API_CLIENT_SECRET}`. Ticket 03's Compose line must refuse to start without it, with `${PCP_API_CLIENT_SECRET:?…}` as the file's other secrets do.
- **A second way to leave a Login with no Vendor.** Besides the spec's two failures in a row, the code review found that Keycloak can make a Login after the API stopped waiting for it, 5 seconds after the call. The API then answers 503 and logs the Login's name, since it never learnt the Login's identifier. ADR-0009 now names both cases. Either way the number stays taken until the Login is deleted in Keycloak's own console.

**Decisions this ticket left open.**

- **Paths.** `POST /v1/vendors` and `GET /v1/vendors/{vendorId}`, both for the Admin only.
- **Answers.** A create answers `{ vendor, temporaryPassword }`. A Vendor is answered with `id`, `name`, `city`, `loginPhoneNumber`, `active`, `createdAt` and `updatedAt`, and a phone number as `{ international: '+9647501234567', national: '0750 123 4567' }`. The Login's identifier is not answered.
- **Settings.** `KEYCLOAK_URL` (`http://localhost:8080`), `KEYCLOAK_REALM` (`pcp`), `KEYCLOAK_CLIENT_ID` (`pcp-api`) and `KEYCLOAK_CLIENT_SECRET`, with no default. The realm file names `PCP_API_CLIENT_SECRET`, the name ticket 03 can give the secret in `.env`.
- **The realm's client.** `pcp-api`, the audience's own name, as the spec allows. Its service account and its role are given by a `users` entry for `service-account-pcp-api`, which is Keycloak's own way to state a service account in a realm file. It is not a Login, and the tests never remove it.
- **The roles chosen.** `manage-users` alone, which lets the client find, create, change, disable and delete a Login, set its password, give it a realm role it may give and end its sessions. `view-realm`, which reading a role by its name needs, is left out: the role is found among the roles the Login may still be given. Ticket 10 needs `editUsernameAllowed` on the realm before a Login can be renamed.
- **Refusals.** A name over 100 characters is `NOT_VALID` with `reason: 'tooLong'`. A login phone number that is not a valid Iraqi number is `notIraqi`, a landline is `notMobile`, and one a Vendor or a Login holds is `taken`. A missing, empty or blank name and a city outside the set are refused by the request's own check, as a Part's are: `NOT_VALID` naming the field, with no reason. Ticket 02 decides whether those gain reasons of their own, which it asks for "each other kind".
- **The name's length** counts Unicode code points, as JSON Schema's `maxLength` does, and the description states `maxLength: 100`.
- **The city** is a PostgreSQL enum made from the domain's set, as the Categories are. A second city is a change to the set and a generated migration.
- **Keycloak calls** are given up on after 5 seconds, as a database connection is. The Store logs in as the client for each use and keeps no token, so the API connects only when a call needs Keycloak.
- **A Login made without its role** is deleted again by the Store before it answers, so that no Login without a role holds a number.
- **The tests' Keycloak** reads its image from `compose.yaml`, so that it is always the development services' own. The global set-up and teardown moved from `test-utils/database` to `test-utils`, since they start both containers.

**How it was built.** Test first at seam 2, the API over HTTP with a real PostgreSQL and a real Keycloak, with the settings test of seam 1 in `pnpm check`. Several tests passed when they were first run, because the phone number was written whole and every check already ran before Keycloak was asked. The faults below show that each of them can fail.

**The code review.** Two sub-agents read the change, one against the repository's standards and one against this ticket and the spec. Corrected:

- A realm without the `vendor` role was answered 503, as if Keycloak could not be reached. The Store threw a plain error for it, and every error that was not Keycloak's own answer counted as unreachable. Both reviews found it. The Store no longer throws. A call counts as unreachable only when it got no answer, known by the error's name as `core`'s database errors are, or when Keycloak answered 502, 503 or 504.
- The taken name was a class of its own checked with `instanceof`. It is now `core`'s `NotValidError` with the code `LOGIN_NAME_TAKEN`.
- A refusal's field and reason were plain strings. They are typed.
- The name's limit was written twice. It is written once, and the description states it.
- A comment said the name's length counts characters "as a person counts them", which code points do not do. It now says what is counted.
- The test that a read holds no password checked for the key only. It now checks that the password itself is nowhere in the answer. An empty and a missing name are now tested too.
- The timed-out create above, and which targets need the secret.

Left as they are:

- The two failures that need two services to fail within one request have no test: a Login that cannot be deleted after a failed create, and a Login that cannot be given its role. The agreed seam cannot make both fail at once, and a test with mocked Stores would sit at no seam the owner agreed.
- Keeping the shared container on `globalThis` between the set-up and the teardown repeats the shape of `core`'s test database, about ten lines. A shared helper would make `core`'s test helpers know the API's Keycloak, or take callbacks, for little gain.
- `CreateLoginParams` takes the role, though only `vendor` is given yet. The domain decides which role a Vendor's Login holds, not the Keycloak Store, and that is where the fault of giving `admin` was planted.
- `createdAt` and `updatedAt` are answered, as a Part's are. The spec has a Vendor record both.

**Fault checks.** Each was planted by a script that refused a dirty tree, made one exact edit, ran the Vendor tests and put the file back. `git status` was clean after every one. They were run before and after the code review, with the same results.

| Fault | Failed |
|---|---|
| The check that a login phone number is free removed | "still refuses a login phone number another Vendor holds, without asking Keycloak", and nothing else: the number went to the paused Keycloak and was answered 503. "Refuses a login phone number another Vendor holds … as taken" still passed, because Keycloak refuses a second Login of the same name and the API answers that as taken too. |
| The `admin` role given instead of `vendor` | "makes its Login … holding the vendor role and no other platform role", and nothing else |
| The password given as a lasting one | The same test, which found no `UPDATE_PASSWORD`, and "answers the Login's temporary password …", whose token address then gave a token |
| The deletion of the Login removed from a failed create | "deletes the Login it made when the Vendor cannot be stored", and nothing else |
| Arabic-Indic digits left unconverted | "reads a login phone number typed in Arabic-Indic digits", and nothing else: it was refused as `notIraqi`. The Eastern Arabic-Indic case still passed. |

**Results.**

- `pnpm integration:check` passes 132 tests, 30 of them the Vendor's, in about 27 seconds once both images are on the machine. Keycloak starts beside PostgreSQL and was ready in 9 to 11 seconds in the trials. The test with Keycloak paused waits its 5 seconds.
- One run in six stopped after five of its seven test files, with no error and no summary, and Nx reported a non-zero exit. The same tree then passed four runs in a row, and no other session was using Docker. It is not explained, and is worth watching.
- `pnpm check` passes.
- With Docker unreachable, `pnpm integration:check` says so plainly, naming the database and Keycloak, and exits 1.
- The built API loads the admin client, an ES module, through Node 24's `require`.
- Only `KeycloakLoginStore` imports the admin client.
- Each of the seven commits passes from a fresh clone, by script: an offline install, `pnpm check --skip-nx-cache` with `DOCKER_HOST` pointed at a socket that does not exist and no browser installed, and `pnpm integration:check` with Docker. The integration tests number 102 before the Vendor's, 130 with them, and 132 after the code review.
