import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { NestFactory } from '@nestjs/core';

import { AppModule } from '~/app.module';

import { createOpenApiDocument } from './openapi';

// Writes the API's description of itself into the file that is committed.
// The application is built and never started, so no port is opened and
// Keycloak is not needed. Run it with `pnpm api-client:write`.
async function writeOpenApiDocument(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  const document = createOpenApiDocument(app);
  await app.close();

  writeFileSync(
    join(__dirname, '..', 'openapi.json'),
    `${JSON.stringify(document, null, 2)}\n`,
  );
}

void writeOpenApiDocument();
