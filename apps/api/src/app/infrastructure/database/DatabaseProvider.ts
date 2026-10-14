import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { EnvironmentVariables } from '~/infrastructure/configuration/env.validation';

import { schema, Schema } from './schema';

// The API's one way to the platform's database. Its pool opens a connection
// only when a query needs one, so the API starts while the database cannot
// be reached.
@Injectable()
export class DatabaseProvider implements OnModuleDestroy {
  private readonly pool: Pool;
  private readonly client: NodePgDatabase<Schema>;

  constructor(settings: ConfigService<EnvironmentVariables, true>) {
    const url = new URL(settings.get('DATASOURCE_URL', { infer: true }));

    this.pool = new Pool({
      host: url.hostname,
      port: url.port === '' ? 5432 : Number(url.port),
      database: url.pathname.slice(1),
      user: settings.get('DATASOURCE_USERNAME', { infer: true }),
      password: settings.get('DATASOURCE_PASSWORD', { infer: true }),
    });
    this.client = drizzle({ client: this.pool, schema });
  }

  getClient(): NodePgDatabase<Schema> {
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
