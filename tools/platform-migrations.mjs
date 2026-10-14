// The API's committed migrations, and how many of them the platform's
// development database lacks. `pnpm services:check` and `pnpm platform:check`
// both ask. The database is asked with the client inside the PostgreSQL
// container, so no database driver is needed here.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');

// Drizzle lists the migrations it generated in a journal, each with the time
// it was made. It records each one it applies with that time.
export function committedMigrations() {
  const journal = JSON.parse(
    readFileSync(join(root, 'apps/api/src/drizzle/meta/_journal.json'), 'utf8'),
  );
  return journal.entries.map((entry) => ({ name: entry.tag, madeAt: entry.when }));
}

// The committed migrations the database does not have, as Drizzle decides it:
// every one made after the last one the database records. `password` is the
// `pcp` user's, from `.env`.
export function missingMigrations(password) {
  const statement =
    "SELECT CASE WHEN to_regclass('drizzle.__drizzle_migrations') IS NULL THEN '' ELSE (SELECT coalesce(max(created_at), 0)::text FROM drizzle.__drizzle_migrations) END";
  const inContainer = ['compose', 'exec', '--no-TTY', '--env', 'PGPASSWORD', 'postgres'];
  const connection = ['--host', 'postgres', '--username', 'pcp', '--dbname', 'pcp'];
  const format = ['--no-psqlrc', '--tuples-only', '--no-align'];
  const result = spawnSync(
    'docker',
    [...inContainer, 'psql', ...connection, ...format, '--command', statement],
    { cwd: root, encoding: 'utf8', env: { ...process.env, PGPASSWORD: password } },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr.trim().split('\n').at(-1) ?? 'psql failed');
  }

  const output = result.stdout.trim();
  const lastAppliedAt = output === '' ? undefined : Number(output);
  return committedMigrations().filter(
    (migration) => lastAppliedAt === undefined || migration.madeAt > lastAppliedAt,
  );
}
