import { randomBytes } from 'node:crypto';
import { readdirSync } from 'node:fs';

import { connectionOf, Datasource } from '@pcp/core';
import { Client } from 'pg';

import { applyMigrations, migrationLockName } from '~/infrastructure/database/migrations';

import {
  migrationsFolder,
  testDatabaseSettings,
} from '../../test-utils/database/test-database';

// How many migrations are committed, counted from the files themselves.
const committedMigrationCount = readdirSync(migrationsFolder).filter((name) =>
  name.endsWith('.sql'),
).length;

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

  // The test database's user may create databases, so each test gets an
  // empty database of its own beside the shared one.
  beforeEach(async () => {
    name = `migrations_${randomBytes(4).toString('hex')}`;
    await onTheServer(testDatabaseSettings(), (client) =>
      client.query(`CREATE DATABASE ${name}`),
    );
    const url = new URL(testDatabaseSettings().url);
    url.pathname = `/${name}`;
    emptyDatabase = { ...testDatabaseSettings(), url: url.toString() };
  });

  afterEach(async () => {
    await onTheServer(testDatabaseSettings(), (client) =>
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

    expect(outcome).toEqual({ kind: 'applied', count: committedMigrationCount });
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
      await otherRun.query(`SELECT pg_advisory_lock(hashtext($1))`, [migrationLockName]);

      const outcome = await applyMigrations(emptyDatabase, migrationsFolder);

      expect(outcome).toEqual({ kind: 'locked' });
      expect(await hasThePartTable()).toBe(false);
    } finally {
      await otherRun.end();
    }
  });
});
