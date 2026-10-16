# 01: Create and read a Vendor and its Login through the API, proven against a real PostgreSQL and a real Keycloak

**Spec:** [the accounts spec](../spec.md)

**What to build:** The Admin creates a Vendor through the API, giving its name, its city and its login phone number, and reads it back. Creating it makes its Login in Keycloak, named by the login phone number in its stored form, holding the `vendor` role and no other, with a temporary password that the platform made and the Vendor must replace at its next login. The answer holds the temporary password, once. The login phone number may be typed in any of the forms a person types one. This is the first time the API changes anything in Keycloak.

It is the first path through every part this module needs. The realm gains a client for the API, whose service account may manage the realm's Logins, and stops asking a Login for an email address and names. The API gains its settings for Keycloak's administration interface and its first port over Keycloak. The Vendor gets its table, entity, Store, Command and Query. `pnpm integration:check` gains a real Keycloak, started from the repository's realm file, beside its PostgreSQL.

The Vendor's other details arrive in ticket 02. Nothing here touches the development services: ticket 03 resets them and runs the API against them. Only the Admin reads a Vendor here. Ticket 07 lets the Vendor's own Login read it too.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Before anything is written, these are read for the releases that will be installed, and the findings are recorded under Comments:
  - `@keycloak/keycloak-admin-client`: how it logs in with a client's secret, and its calls for finding, creating and deleting a user, giving it a realm role and setting a temporary password;
  - Keycloak 26.8's documentation on importing a realm whose file names environment settings, on the user profile, and on the realm-management roles;
  - `libphonenumber-js`: how it reads an Iraqi number, the forms it writes, and which of its metadata sets tells a mobile number from a landline;
  - Testcontainers' generic container, for a Keycloak that imports a realm file when it starts;
  - whether Keycloak's token address tells a temporary password apart from a wrong one, and how a test's own client asks it;
  - the workplace's Keycloak administration module and its tests. They are read, and nothing is copied.
- [ ] CONTEXT.md gains **Login phone number**, **Temporary password**, **Contact details**, **Acting as a Vendor** and **Deactivated Vendor**, as the spec words them, before any code uses them.
- [ ] A new ADR records that Vendors are kept in the platform's database and their Logins in Keycloak, changed only through the API in a safe order, and that the Admin acts as a Vendor in the API with the Admin's own Login, not through Keycloak's impersonation.
- [ ] `@keycloak/keycloak-admin-client`, in the 26.8 line, and `libphonenumber-js` are added at the newest releases pnpm's minimum release age allows. A new package's install script is read before it is listed. Jest's shared preset transforms the admin client and the packages it needs, as it transforms `jose`.
- [ ] The realm file gains a confidential client for the API, with a service account, no login through a browser, and the fewest realm-management roles with which the API does what this module needs. The roles chosen, and why each is needed, are recorded under Comments. The secret is not in the file: the file names an environment setting that Keycloak reads when it imports the realm.
- [ ] The realm's user profile asks a Login for no email address, first name or last name. Whether the development logins still need them is found out and recorded.
- [ ] The API gains settings for where Keycloak is, the realm, the API's client and that client's secret, separate from `KEYCLOAK_ISSUER`. The secret has no default, and the API refuses to start without it and names it. The test of the API's settings covers them. The API starts while Keycloak cannot be reached.
- [ ] Which of the API's targets need the secret is found out and recorded, given that every setting is checked when the API starts. The values for the development services wait for ticket 03.
- [ ] **Phone numbers.** Before a number is read, Arabic-Indic and Eastern Arabic-Indic digits become Western digits, and spaces, dashes, dots and brackets are dropped. It is read as Iraqi unless it says otherwise. It is stored in the international form, `+9647501234567`, and answered in that form and in Iraq's own, "0750 123 4567".
- [ ] The Vendor table holds the identifier, the name, the city, the login phone number, the Login's identifier, whether the Vendor is active, and when it was created and last changed. The Login's identifier and the login phone number are each unique. The migration is generated, and its file name says what it does.
- [ ] The domain holds:
  - a `Vendor` entity with getters;
  - the ports `VendorStore` and `LoginStore`, each an abstract class;
  - `CreateVendorCommand` and `ReadVendorQuery`, each with its own Input and Output.

  The infrastructure holds the schema, the database Store, the Keycloak Store that wraps the admin client, the controller with its Request and Response classes, and the module, which binds each port with its abstract class as the token. No other code imports the admin client.
- [ ] **Create.** Only the Admin creates a Vendor:
  - The name is required, as written, at most 100 characters.
  - The city is one of a fixed set in code, which holds Erbil.
  - The login phone number must be an Iraqi mobile number, and free.
  - Every check runs before anything is made in Keycloak.
- [ ] Creating makes the Login, then the Vendor. When the Vendor cannot be stored, the Login is deleted again. When that fails too, the Login's identifier is logged.
- [ ] **The temporary password** is 12 lower-case letters and digits, without 0, o, 1, l or i, from a cryptographically secure generator. It is given to Keycloak as a temporary credential, the Login is required to update its password, and the password is in the create's answer and nowhere else.
- [ ] **Read.** The Admin reads a Vendor. One that does not exist is answered 404 with `VENDOR_NOT_FOUND`.
- [ ] While Keycloak's administration interface cannot be reached, a create is answered 503 with `IDENTITY_SERVICE_UNAVAILABLE`, and nothing is stored.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] The API's test utilities gain a shared Keycloak: one container of the image and version the development services run, for every test file, which imports the repository's realm file with a secret the test gives. What a test made in it is removed between tests. When Docker is not running, `pnpm integration:check` says so plainly, as before. How long the container takes to start is recorded.
- [ ] `pnpm integration:check` passes with these tests, which go through the API's HTTP surface with tokens from the stand-in, and read Keycloak through its administration interface as the container's own administrator:
  - The Admin creates a Vendor with its login phone number typed in local form with spaces, with +964, with 00964 and in Arabic-Indic digits, and reads it back with the number in both forms.
  - Its Login exists, named by the stored form, enabled, holding `vendor` and no other platform role, with no email address or names, and required to update its password.
  - The temporary password in the answer is the Login's: the token address, asked through a client the test adds to its own container's realm, says that the Login is not yet set up, and not that the password is wrong. A read of the Vendor does not hold the password.
  - A landline and a number that is not Iraqi are each refused as the login phone number. A blank name, a name of 101 characters and a city outside the set are each refused. Each answer names the field, and no Login is made.
  - A login phone number another Vendor holds is refused as taken, and Keycloak holds no second Login.
  - A create whose Vendor cannot be stored, by a fault planted for the test, leaves no Login in Keycloak.
  - With the Keycloak container paused, a create is answered 503 with its code, and no Vendor exists.
  - A Vendor's create and read are answered 403, and calls without a token are answered 401.
- [ ] Shown once and then reverted, each failing its own test: the check that a login phone number is free removed; the `admin` role given instead of `vendor`; the password given as a lasting one; the deletion of the Login removed from a failed create; Arabic-Indic digits left unconverted.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm integration:check` and `pnpm check` passing.
