-- PostgreSQL's trigram extension, which indexes text for searches that find a
-- word anywhere in it. drizzle-kit cannot write this from the schema. The
-- extension is trusted, so the database's owner may create it.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
