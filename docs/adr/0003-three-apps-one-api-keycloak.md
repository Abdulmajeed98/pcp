# Three applications behind one API, with Keycloak for identity

The platform is built as three applications instead of one: a Next.js Shopper app rendered on the server, a client-rendered React dashboard holding both the Vendor portal and the Admin console, and a NestJS API that is the only part touching the database. Logins are handled by Keycloak, not by code in the application. A single Next.js app with built-in login would have been less to build and run; the owner chose the split because they specialise in React and NestJS, the private screens gain nothing from server rendering, and an API that stands on its own can later serve a mobile app unchanged.

## Considered Options

- **One Next.js app with built-in login.** Two things to run instead of five. Rejected for the reasons above.
- **Logto instead of Keycloak.** Much lighter (about 100 MB of memory), but it has no built-in way to force a Vendor to replace a temporary password at first login, which ACC-3 requires.
- **Zitadel instead of Keycloak.** Its login screens have no Arabic or right-to-left support.

## Consequences

- Five things run in production: two frontends, the API, Keycloak and PostgreSQL.
- Keycloak's own sizing guide gives about 1.25 GB as its base memory use, so the server needs 4 GB rather than the smallest size on offer.
- Keycloak ships English and Arabic login screens but not Kurdish (Sorani). The Sorani text is written and maintained in this repository as a custom theme.
- The Admin never uses Keycloak's own console in daily work. The Admin console creates Vendors and resets passwords through the API, which calls Keycloak.
