-- Creates the platform's database and Keycloak's database, each with its own
-- user. PostgreSQL's image runs this file once, on the first start, when its
-- data volume is empty. A change here takes effect only after
-- `pnpm services:reset`.

-- The passwords come from the container's environment, and so from `.env`.
\getenv pcp_password PCP_DB_PASSWORD
\getenv keycloak_password KEYCLOAK_DB_PASSWORD

CREATE USER pcp PASSWORD :'pcp_password';
CREATE USER keycloak PASSWORD :'keycloak_password';

-- The platform's database is left empty. Its tables arrive with the first
-- module that stores something.
CREATE DATABASE pcp OWNER pcp;
CREATE DATABASE keycloak OWNER keycloak;

-- PostgreSQL lets every user connect to every database unless told otherwise.
-- With that taken away, only a database's owner and the superuser can connect
-- to it, so a bug in the API can never touch Keycloak's tables.
REVOKE CONNECT ON DATABASE pcp FROM PUBLIC;
REVOKE CONNECT ON DATABASE keycloak FROM PUBLIC;

-- The same for the two databases PostgreSQL creates for itself, so that each
-- user can reach its own database and no other.
REVOKE CONNECT ON DATABASE postgres FROM PUBLIC;
REVOKE CONNECT ON DATABASE template1 FROM PUBLIC;
