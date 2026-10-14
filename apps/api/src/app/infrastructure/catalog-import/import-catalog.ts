import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Either } from 'effect';

import { ImportCatalogCommand } from '~/domain/catalog-import/ImportCatalogCommand';

import { CatalogImportModule } from './catalog-import.module';
import { reportOf } from './catalog-import-report';

// Where the import says what it did, and what went wrong.
export type Printer = {
  log(line: string): void;
  error(line: string): void;
};

// Fills the catalog from the folder shaped like OpenDB that the arguments
// name, or, when they name none, from the pinned commit fetched from GitHub.
// It prints the report, and gives the code the command ends with: 0 when it
// imported, 1 when it imported nothing. Run it with `pnpm catalog:import`, or
// `pnpm catalog:import <folder>`.
export async function importCatalog(
  args: readonly string[],
  printer: Printer,
): Promise<number> {
  const [folder] = args;

  let context: INestApplicationContext;
  try {
    // What went wrong is printed plainly below, so Nest prints nothing.
    context = await NestFactory.createApplicationContext(
      CatalogImportModule.readingFrom(folder),
      { logger: false },
    );
  } catch (error) {
    // The settings were refused, such as when the database password is not
    // given.
    printer.error((error as Error).message);
    return 1;
  }

  try {
    const outcome = await context.get(ImportCatalogCommand).execute();
    if (Either.isLeft(outcome)) {
      printer.error(outcome.left.getMessage());
      return 1;
    }

    for (const line of reportOf(outcome.right)) printer.log(line);
    return 0;
  } catch (error) {
    // Domain and Store code return their failures, so this is a fault in the
    // import itself. It is still said plainly. The Store writes in one
    // transaction, so the catalog holds all of the Parts or none of them.
    printer.error(`The import stopped on an unexpected error: ${(error as Error).message}`);
    return 1;
  } finally {
    await context.close();
  }
}
