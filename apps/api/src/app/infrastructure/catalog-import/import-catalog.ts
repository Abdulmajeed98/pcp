import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Either } from 'effect';

import {
  ImportCatalogCommand,
  ImportCatalogCommandInput,
} from '~/domain/catalog-import/ImportCatalogCommand';

import { CatalogImportModule } from './catalog-import.module';
import { reportOf } from './catalog-import-report';
import { FolderOpenDbSource } from './FolderOpenDbSource';

// Where the import says what it did, and what went wrong.
export type Printer = {
  log(line: string): void;
  error(line: string): void;
};

// Fills the catalog from the folder shaped like OpenDB that the arguments
// name, prints the report, and gives the code the command ends with: 0 when
// it imported, 1 when it imported nothing. Run it with
// `pnpm catalog:import <folder>`.
export async function importCatalog(
  args: readonly string[],
  printer: Printer,
): Promise<number> {
  const [folder] = args;
  if (folder === undefined) {
    printer.error('Name the folder to import: pnpm catalog:import <folder>');
    return 1;
  }

  let context: INestApplicationContext;
  try {
    // What went wrong is printed plainly below, so Nest prints nothing.
    context = await NestFactory.createApplicationContext(CatalogImportModule, {
      logger: false,
    });
  } catch (error) {
    // The settings were refused, such as when the database password is not
    // given.
    printer.error((error as Error).message);
    return 1;
  }

  try {
    const outcome = await context
      .get(ImportCatalogCommand)
      .execute(new ImportCatalogCommandInput(new FolderOpenDbSource(folder)));
    if (Either.isLeft(outcome)) {
      printer.error(outcome.left.getMessage());
      return 1;
    }

    for (const line of reportOf(outcome.right)) printer.log(line);
    return 0;
  } finally {
    await context.close();
  }
}
