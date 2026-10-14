import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { pinnedOpenDbCommit } from '@pcp/opendb';

import { CatalogImportStore } from '~/domain/catalog-import/CatalogImportStore';
import { ImportCatalogCommand } from '~/domain/catalog-import/ImportCatalogCommand';
import { openDbFolders } from '~/domain/catalog-import/opendb';
import { OpenDbSource } from '~/domain/catalog-import/OpenDbSource';
import {
  EnvironmentVariables,
  validate,
} from '~/infrastructure/configuration/env.validation';
import { DatabaseModule } from '~/infrastructure/database/database.module';

import { FolderOpenDbSource } from './FolderOpenDbSource';
import { GitHubOpenDbSource } from './GitHubOpenDbSource';
import { DatabaseCatalogImportStore } from './store/DatabaseCatalogImportStore';

// What the import needs, and nothing of the API's endpoints: it is a second
// entry point to the API, which runs, writes the catalog and stops.
@Module({})
export class CatalogImportModule {
  // The import, reading OpenDB from the folder the command names, or, when it
  // names none, fetching the pinned commit from OpenDB's repository.
  static readingFrom(folder: string | undefined): DynamicModule {
    return {
      module: CatalogImportModule,
      imports: [
        // The same settings as the API, from the environment alone.
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, validate }),
        DatabaseModule,
      ],
      providers: [
        // The abstract classes are the tokens the domain asks for.
        {
          provide: OpenDbSource,
          inject: [ConfigService],
          useFactory: (settings: ConfigService<EnvironmentVariables, true>) =>
            folder === undefined
              ? new GitHubOpenDbSource(
                  settings.get('OPENDB_REPOSITORY_URL', { infer: true }),
                  pinnedOpenDbCommit,
                  openDbFolders.map(([name]) => name),
                )
              : new FolderOpenDbSource(folder),
        },
        { provide: CatalogImportStore, useClass: DatabaseCatalogImportStore },
        ImportCatalogCommand,
      ],
    };
  }
}
