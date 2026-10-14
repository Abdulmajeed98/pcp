import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connectionOf } from '@pcp/core';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { EnvironmentVariables } from '~/infrastructure/configuration/env.validation';

import { schema, Schema } from './schema';

// The API's one way to the platform's database. Its pool opens a connection
// only when a query needs one, so the API starts while the database cannot
// be reached.
@Injectable()
export class DatabaseProvider implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseProvider.name);
  private readonly pool: Pool;
  private readonly client: NodePgDatabase<Schema>;

  constructor(settings: ConfigService<EnvironmentVariables, true>) {
    this.pool = new Pool({
      ...connectionOf({
        url: settings.get('DATASOURCE_URL', { infer: true }),
        username: settings.get('DATASOURCE_USERNAME', { infer: true }),
        password: settings.get('DATASOURCE_PASSWORD', { infer: true }),
      }),
      // A database that does not answer is given up on, so that a call waits
      // seconds and not for ever. `pg` waits for ever unless told otherwise.
      connectionTimeoutMillis: 5000,
    });
    // A connection that waits unused in the pool can be ended by the database,
    // when it stops. The pool then drops it and says so as an error event, and
    // an error event nobody listens to ends the whole process. The next call
    // opens a new connection, or is answered 503 while there is no database.
    this.pool.on('error', (error) => {
      this.logger.warn(`A connection waiting in the pool was ended: ${error.message}`);
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
