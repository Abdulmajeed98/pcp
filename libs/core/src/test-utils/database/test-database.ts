import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client, Pool } from 'pg';

import { connectionOf, Datasource } from '../../infrastructure/database/datasource';

// Where the test database is, the way an application's settings give it.
export type TestDatabaseSettings = Datasource;

// The image the development services run, so that tests meet the same
// PostgreSQL.
const image = 'postgres:18.6';

// A database in a container of its own, with the migrations applied, and
// the way to stop it.
export type StartedTestDatabase = {
  settings: TestDatabaseSettings;
  stop(): Promise<void>;
};

// Starts a PostgreSQL in a container and applies the migrations in the folder
// to it. A test that has to stop its database, to see what happens then,
// starts one of its own with this and leaves the shared one alone.
export async function startSeparateTestDatabase(
  migrationsFolder: string,
): Promise<StartedTestDatabase> {
  const container = await new PostgreSqlContainer(image)
    .withDatabase('pcp')
    .withUsername('pcp')
    .withPassword('test-database-password')
    .start();

  const settings = {
    url: `postgresql://${container.getHost()}:${container.getPort()}/${container.getDatabase()}`,
    username: container.getUsername(),
    password: container.getPassword(),
  };

  const pool = new Pool(connectionOf(settings));
  try {
    await migrate(drizzle({ client: pool }), { migrationsFolder });
  } finally {
    await pool.end();
  }

  let stopped = false;
  return {
    settings,
    stop: async () => {
      if (stopped) return;
      stopped = true;
      await container.stop();
    },
  };
}

// Jest's global set-up and its global teardown share `globalThis`, and
// nothing else, so the database is kept there between the two.
const databaseKey = Symbol.for('@pcp/core/test-database');
type WithDatabase = { [databaseKey]?: StartedTestDatabase };

// Starts the database that every test file of a run shares. It is meant for
// Jest's global set-up.
export async function startTestDatabase(
  migrationsFolder: string,
): Promise<TestDatabaseSettings> {
  const database = await startSeparateTestDatabase(migrationsFolder);
  (globalThis as WithDatabase)[databaseKey] = database;
  return database.settings;
}

// Stops the database the global set-up started. It is meant for Jest's
// global teardown.
export async function stopTestDatabase(): Promise<void> {
  const holder = globalThis as WithDatabase;
  await holder[databaseKey]?.stop();
  delete holder[databaseKey];
}

// Empties every table the migrations made, so that each test starts from an
// empty database. The record of which migrations ran is kept.
export async function emptyTables(settings: TestDatabaseSettings): Promise<void> {
  const client = new Client(connectionOf(settings));
  await client.connect();
  try {
    const { rows } = await client.query<{ name: string }>(
      `SELECT quote_ident(tablename) AS name FROM pg_tables WHERE schemaname = 'public'`,
    );
    if (rows.length > 0) {
      await client.query(`TRUNCATE ${rows.map((row) => row.name).join(', ')} CASCADE`);
    }
  } finally {
    await client.end();
  }
}
