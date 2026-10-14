import { randomBytes } from 'node:crypto';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { connectionOf, Datasource } from '@pcp/core';
import { Client } from 'pg';

import { applyMigrations } from '~/infrastructure/database/migrations';

// The migrations as they are committed.
const migrationsFolder = join(__dirname, '..', '..', '..', 'drizzle');
const committedMigrations = readdirSync(migrationsFolder).filter((name) =>
  name.endsWith('.sql'),
).length;

// The test database's server, as the global set-up gave it. Its user may
// create databases, so each test gets an empty database of its own.
function testServer(): Datasource {
  const { DATASOURCE_URL, DATASOURCE_USERNAME, DATASOURCE_PASSWORD } = process.env;
  return {
    url: DATASOURCE_URL ?? '',
    username: DATASOURCE_USERNAME ?? '',
    password: DATASOURCE_PASSWORD ?? '',
  };
}

async function onTheServer<T>(
  database: Datasource,
  use: (client: Client) => Promise<T>,
): Promise<T> {
  const client = new Client(connectionOf(database));
  await client.connect();
  try {
    return await use(client);
  } finally {
    await client.end();
  }
}

describe('applying the migrations', () => {
  let emptyDatabase: Datasource;
  let name: string;

  beforeEach(async () => {
    name = `migrations_${randomBytes(4).toString('hex')}`;
    await onTheServer(testServer(), (client) => client.query(`CREATE DATABASE ${name}`));
    const url = new URL(testServer().url);
    url.pathname = `/${name}`;
    emptyDatabase = { ...testServer(), url: url.toString() };
  });

  afterEach(async () => {
    await onTheServer(testServer(), (client) =>
      client.query(`DROP DATABASE ${name} WITH (FORCE)`),
    );
  });

  async function hasThePartTable(): Promise<boolean> {
    const { rows } = await onTheServer(emptyDatabase, (client) =>
      client.query<{ found: string | null }>(`SELECT to_regclass('public.part') AS found`),
    );
    return rows[0].found !== null;
  }

  it('applies every committed migration to an empty database', async () => {
    const outcome = await applyMigrations(emptyDatabase, migrationsFolder);

    expect(outcome).toEqual({ kind: 'applied', count: committedMigrations });
    expect(await hasThePartTable()).toBe(true);
  });

  it('applies none the second time', async () => {
    await applyMigrations(emptyDatabase, migrationsFolder);

    const outcome = await applyMigrations(emptyDatabase, migrationsFolder);

    expect(outcome).toEqual({ kind: 'applied', count: 0 });
  });

  it('applies none, and says so, while another run holds the lock', async () => {
    const otherRun = new Client(connectionOf(emptyDatabase));
    await otherRun.connect();
    try {
      await otherRun.query(`SELECT pg_advisory_lock(hashtext('pcp-api-migrations'))`);

      const outcome = await applyMigrations(emptyDatabase, migrationsFolder);

      expect(outcome).toEqual({ kind: 'locked' });
      expect(await hasThePartTable()).toBe(false);
    } finally {
      await otherRun.end();
    }
  });
});
