import { connectionOf, Datasource } from '@pcp/core';
import { drizzle } from 'drizzle-orm/node-postgres';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';

// What a run did: applied this many migrations, none when the database was
// up to date, or nothing because another run held the lock.
export type MigrationOutcome = { kind: 'applied'; count: number } | { kind: 'locked' };

// The lock every run takes, so that two runs never change the database at
// the same time. PostgreSQL holds it for the connection that took it.
const lock = `hashtext('pcp-api-migrations')`;

// The time of the last migration the database has, in the record Drizzle
// keeps of them, or none when Drizzle has never run there.
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
  const client = new Client(connectionOf(datasource));
  await client.connect();
  try {
    const { rows } = await client.query<{ acquired: boolean }>(
      `SELECT pg_try_advisory_lock(${lock}) AS acquired`,
    );
    if (!rows[0].acquired) return { kind: 'locked' };

    try {
      const appliedAt = await lastAppliedAt(client);
      const pending = readMigrationFiles({ migrationsFolder }).filter(
        (migration) => appliedAt === undefined || migration.folderMillis > appliedAt,
      );

      await migrate(drizzle({ client }), { migrationsFolder });

      return { kind: 'applied', count: pending.length };
    } finally {
      await client.query(`SELECT pg_advisory_unlock(${lock})`);
    }
  } finally {
    await client.end();
  }
}
