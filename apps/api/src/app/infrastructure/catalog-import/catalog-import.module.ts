import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CatalogImportStore } from '~/domain/catalog-import/CatalogImportStore';
import { ImportCatalogCommand } from '~/domain/catalog-import/ImportCatalogCommand';
import { validate } from '~/infrastructure/configuration/env.validation';
import { DatabaseModule } from '~/infrastructure/database/database.module';

import { DatabaseCatalogImportStore } from './store/DatabaseCatalogImportStore';

// What the import needs, and nothing of the API's endpoints: it is a second
// entry point to the API, which runs, writes the catalog and stops.
@Module({
  imports: [
    // The same settings as the API, from the environment alone.
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, validate }),
    DatabaseModule,
  ],
  providers: [
    // The abstract class is the token the domain asks for.
    { provide: CatalogImportStore, useClass: DatabaseCatalogImportStore },
    ImportCatalogCommand,
  ],
})
export class CatalogImportModule {}
