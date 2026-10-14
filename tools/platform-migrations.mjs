// The API's committed migrations, and which of them the platform's
// development database lacks. `pnpm services:check` and `pnpm platform:check`
// both ask.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { psql } from './postgres-container.mjs';

const root = join(import.meta.dirname, '..');

// Drizzle lists the migrations it generated in a journal, each with the time
// it was made. It records each one it applies with that time.
function committedMigrations() {
  const journal = JSON.parse(
    readFileSync(join(root, 'apps/api/src/drizzle/meta/_journal.json'), 'utf8'),
  );
  return journal.entries.map((entry) => ({ name: entry.tag, madeAt: entry.when }));
}

// The committed migrations the database does not have, as Drizzle decides it:
// every one made after the last one the database records. The API's own
// migration command counts them the same way. `password` is the `pcp` user's,
// from `.env`.
export function missingMigrations(password) {
  const asked = psql(
    { user: 'pcp', password, database: 'pcp' },
    "SELECT CASE WHEN to_regclass('drizzle.__drizzle_migrations') IS NULL THEN '' ELSE (SELECT coalesce(max(created_at), 0)::text FROM drizzle.__drizzle_migrations) END",
  );
  if (!asked.connected) throw new Error(asked.error);

  const lastAppliedAt = asked.output === '' ? undefined : Number(asked.output);
  return committedMigrations().filter(
    (migration) => lastAppliedAt === undefined || migration.madeAt > lastAppliedAt,
  );
}

// The migrations' names, for a message.
export function migrationNames(migrations) {
  return migrations.map((migration) => migration.name).join(', ');
}
