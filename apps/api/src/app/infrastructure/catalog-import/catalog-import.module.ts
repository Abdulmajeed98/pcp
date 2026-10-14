import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CatalogImportStore } from '~/domain/catalog-import/CatalogImportStore';
import { ImportCatalogCommand } from '~/domain/catalog-import/ImportCatalogCommand';
import { OpenDbSource } from '~/domain/catalog-import/OpenDbSource';
import { validate } from '~/infrastructure/configuration/env.validation';
import { DatabaseModule } from '~/infrastructure/database/database.module';

import { DatabaseCatalogImportStore } from './store/DatabaseCatalogImportStore';

// What the import needs, and nothing of the API's endpoints: it is a second
// entry point to the API, which runs, writes the catalog and stops.
@Module({})
export class CatalogImportModule {
  // The import, reading OpenDB from the source each run is given, such as
  // the folder the command names.
  static readingFrom(source: OpenDbSource): DynamicModule {
    return {
      module: CatalogImportModule,
      imports: [
        // The same settings as the API, from the environment alone.
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, validate }),
        DatabaseModule,
      ],
      providers: [
        // The abstract classes are the tokens the domain asks for.
        { provide: OpenDbSource, useValue: source },
        { provide: CatalogImportStore, useClass: DatabaseCatalogImportStore },
        ImportCatalogCommand,
      ],
    };
  }
}
