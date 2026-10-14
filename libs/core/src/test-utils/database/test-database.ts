import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client, Pool } from 'pg';

import { connectionOf, Datasource } from '../../infrastructure/database/datasource';

// Where the test database is, the way an application's settings give it.
export type TestDatabaseSettings = Datasource;

// The image the development services run, so that tests meet the same
// PostgreSQL.
const image = 'postgres:18.6';

// Jest's global set-up and its global teardown share `globalThis`, and
// nothing else, so the container is kept there between the two.
const containerKey = Symbol.for('@pcp/core/test-database');
type WithContainer = { [containerKey]?: StartedPostgreSqlContainer };

// Starts a PostgreSQL of the tests' own in a container and applies the
// migrations in the folder to it. It is meant for Jest's global set-up, so
// that one database serves every test file of a run.
export async function startTestDatabase(
  migrationsFolder: string,
): Promise<TestDatabaseSettings> {
  const container = await new PostgreSqlContainer(image)
    .withDatabase('pcp')
    .withUsername('pcp')
    .withPassword('test-database-password')
    .start();
  (globalThis as WithContainer)[containerKey] = container;

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

  return settings;
}

// Stops the container the global set-up started. It is meant for Jest's
// global teardown.
export async function stopTestDatabase(): Promise<void> {
  const holder = globalThis as WithContainer;
  await holder[containerKey]?.stop();
  delete holder[containerKey];
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
