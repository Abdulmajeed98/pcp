import { connectionOf, Datasource } from '@pcp/core';
import { drizzle } from 'drizzle-orm/node-postgres';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';

// What a run did: applied this many migrations, none when the database was
// up to date, or nothing because another run held the lock.
export type MigrationOutcome = { kind: 'applied'; count: number } | { kind: 'locked' };

// The name of the lock every run takes, so that two runs never change the
// database at the same time. PostgreSQL holds the lock for the connection
// that took it, and lets it go when that connection ends.
export const migrationLockName = 'pcp-api-migrations';
const migrationLock = `hashtext('${migrationLockName}')`;

// The time of the last migration the database has, in the record Drizzle
// keeps of them, or none when Drizzle has never run there. Drizzle applies
// every committed migration made after that time, and so counts this. The
// workspace's check of the development database, in `tools`, reads the same
// record the same way.
async function lastAppliedAt(client: Client): Promise<number | undefined> {
  const { rows: table } = await client.query<{ found: string | null }>(
    `SELECT to_regclass('drizzle.__drizzle_migrations') AS found`,
  );
  if (table[0].found === null) return undefined;

  const { rows } = await client.query<{ created_at: string | null }>(
    'SELECT max(created_at) AS created_at FROM drizzle.__drizzle_migrations',
  );
  return rows[0].created_at === null ? undefined : Number(rows[0].created_at);
}

// Applies the migrations in the folder that the database does not have yet,
// and says how many there were. Drizzle applies them in one transaction. The
// lock, the count and the migrations all use one connection, which is what
// holds the lock.
export async function applyMigrations(
  datasource: Datasource,
  migrationsFolder: string,
): Promise<MigrationOutcome> {
  // A database that does not answer is given up on, as the API gives up on it.
  const client = new Client({ ...connectionOf(datasource), connectionTimeoutMillis: 5000 });
  await client.connect();
  try {
    const { rows } = await client.query<{ acquired: boolean }>(
      `SELECT pg_try_advisory_lock(${migrationLock}) AS acquired`,
    );
    if (!rows[0].acquired) return { kind: 'locked' };

    const appliedAt = await lastAppliedAt(client);
    const pending = readMigrationFiles({ migrationsFolder }).filter(
      (migration) => appliedAt === undefined || migration.folderMillis > appliedAt,
    );

    await migrate(drizzle({ client }), { migrationsFolder });

    return { kind: 'applied', count: pending.length };
  } finally {
    // Ending the connection lets the lock go, also when a migration failed,
    // and a failure to end it would only hide why.
    await client.end().catch(() => undefined);
  }
}
