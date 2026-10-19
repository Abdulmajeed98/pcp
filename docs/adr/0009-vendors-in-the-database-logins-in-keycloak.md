# A Vendor is kept in the platform's database and its Login in Keycloak, and the Admin acts as a Vendor with the Admin's own Login

Two decisions of the `accounts` module, which are costly to undo once Vendors, their Logins and every Vendor portal endpoint depend on them. The module's spec is [.scratch/accounts/spec.md](../../.scratch/accounts/spec.md), and it follows [ADR-0003](0003-three-apps-one-api-keycloak.md), which gave Logins to Keycloak.

**A Vendor is kept in the platform's database, and its Login in Keycloak.** Keycloak keeps the Login: its name, its password and whether it may log in. The database keeps the Vendor: its name, its city, its contact details, whether it is active, and the identifier of its own Login, which is the token's subject and the Caller's identifier. Only two things are in both: the link between them, and the login phone number, which is a detail of the Vendor and the Login's name. Only the API changes a Vendor's Login, through its own client of Keycloak's administration interface, and only in a Command about that Vendor. Most such Commands change the Vendor as well; the reset of a password changes the Login alone, and nothing in the Vendor. Each makes its two changes in the order that is safe if the second fails, and puts the first back where it can:

- creating makes the Login, then the Vendor, and deletes the Login again when the Vendor cannot be stored;
- changing the login phone number renames the Login, then the Vendor, and puts the Login's name back when the Vendor cannot be stored;
- deactivating marks the Vendor first, so that the API refuses it at once, and then disables the Login and ends its sessions;
- reactivating enables the Login first and marks the Vendor last, so that the API goes on refusing it until both are done;
- resetting a password ends the Login's sessions first and then gives it a temporary password, so that a reset that fails at the password leaves the old one working.

A deactivation or a reactivation that fails halfway is finished by doing it again.

**The Admin acts as a Vendor in the API, with the Admin's own Login.** Every Vendor portal endpoint names its Vendor in its address. One rule in the API's domain decides which Vendor a request may act for: a Caller holding the `admin` role may act for any Vendor, and a Caller holding only the `vendor` role only for the Vendor whose Login it is, while that Vendor is active. Keycloak's own impersonation is not used.

## Considered Options

For where a Vendor is kept:

- **Everything in Keycloak, as attributes of the Login.** One copy, and nothing to keep in step. But the platform's database could not join a Vendor to its Offers, Referrals and Part Requests, a list of Vendors would be a call to Keycloak, and the API, which checks tokens itself, would have to ask Keycloak on every request whether a Vendor is deactivated.
- **Everything in the database, with the platform's own passwords.** One copy, and no Keycloak. ADR-0003 chose Keycloak so that the platform keeps no password and gets a forced change of a temporary password, a lockout and the login screens in three languages without writing them.

For acting as a Vendor:

- **Keycloak's impersonation.** The Admin's browser would hold a session as the Vendor. It ends the Admin's own session, every request would carry the Vendor as its Caller so that the API could not tell who made a change, and it needs a realm-management role that lets the API's client log in as anyone.
- **The Admin logging in with the Vendor's password.** It needs a password that only the Vendor should know, and it has the same fault as impersonation.

## Consequences

- A Vendor and its Login can disagree after two failures in a row, in two services, within one request: the Vendor is not stored, and putting the Login back fails too. The API then logs the Login's identifier and answers that the identity service is unavailable. They can also disagree when the API gives up waiting for Keycloak while Keycloak goes on to make the Login: the API answers that the identity service is unavailable and logs the Login's name, since it never learnt its identifier. Either way, a Login left with no Vendor holds its phone number, so a create with that number is refused as taken until the Login is deleted in Keycloak's own console.
- The API's client of Keycloak's administration interface holds `manage-users` and no other role of `realm-management`. Its secret is not in the realm file, which names an environment setting that Keycloak fills in when it imports the realm.
- The API starts while Keycloak cannot be reached, and answers a call that needs Keycloak's administration interface with 503 and `IDENTITY_SERVICE_UNAVAILABLE`, having changed nothing.
- Whether a Vendor is deactivated is the database's, and the API reads it on every Vendor portal request, so a deactivated Vendor is refused at once, whatever its token says. Disabling the Login only stops the next login.
- The Caller is always the Login a request was made with, so a later module that records who changed something can tell the Admin from the Vendor.
- The Admin may act as a deactivated Vendor.
