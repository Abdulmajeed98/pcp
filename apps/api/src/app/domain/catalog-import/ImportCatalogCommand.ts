import { Injectable } from '@nestjs/common';
import { NotValidError, StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { Category } from '../part/Category';
import { SpecificationProblem } from '../specification/Specification';
import { CatalogImportStore } from './CatalogImportStore';
import { CategoryImport, RecordLeftOut, ValuesLeftOut } from './CategoryImport';
import { openDbFolders, pinnedCommit } from './opendb';
import { ImportedRecord, importedRecordOf } from './opendb-record';
import { OpenDbSource } from './OpenDbSource';

class Input {
  constructor(private readonly source: OpenDbSource) {}

  getSource(): OpenDbSource {
    return this.source;
  }
}

// What the import did: the commit it read, and what it did with each
// Category's records, in the order of OpenDB's folders.
class Output {
  private constructor(
    private readonly commit: string,
    private readonly categories: readonly CategoryImport[],
  ) {}

  static of(commit: string, categories: readonly CategoryImport[]): Output {
    return new Output(commit, categories);
  }

  getCommit(): string {
    return this.commit;
  }

  getCategories(): readonly CategoryImport[] {
    return this.categories;
  }
}

export { Input as ImportCatalogCommandInput };
export { Output as ImportCatalogCommandOutput };

// One Category's folder as read: the records that make Parts, and those left
// out.
type CategoryRecords = {
  category: Category;
  imported: ImportedRecord[];
  leftOut: RecordLeftOut[];
};

// The values left out, counted for each specification and reason. The rows
// of a list are counted together.
function valuesLeftOutOf(problems: readonly SpecificationProblem[]): ValuesLeftOut[] {
  const counts = new Map<string, ValuesLeftOut>();
  for (const problem of problems) {
    const specification = problem.path.replace(/\.\d+(?=\.|$)/g, '.*');
    const key = `${specification} ${problem.reason}`;
    const count = (counts.get(key)?.getCount() ?? 0) + 1;
    counts.set(key, new ValuesLeftOut(specification, problem.reason, count));
  }
  return [...counts.entries()]
    .sort(([one], [other]) => one.localeCompare(other))
    .map(([, values]) => values);
}

// The owner fills the catalog from OpenDB at the pinned commit. Each record of
// the eight Categories' folders becomes a Part, unless the catalog already
// holds a Part with its OpenDB ID, which is left as it is. Everything is
// written at once, or nothing is.
@Injectable()
export class ImportCatalogCommand {
  constructor(private readonly catalogImportStore: CatalogImportStore) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const source = input.getSource();

    const commit = await source.readCommit();
    if (Either.isLeft(commit)) return Either.left(commit.left);
    if (commit.right !== pinnedCommit) {
      return Either.left(
        NotValidError.of(
          'OPENDB_COMMIT_NOT_PINNED',
          `The source holds OpenDB at commit ${commit.right}, and the import reads only commit ${pinnedCommit}, the last released under ODC-By 1.0. Nothing was imported.`,
          { commit: commit.right },
        ),
      );
    }

    const read: CategoryRecords[] = [];
    for (const [folder, category] of openDbFolders) {
      const files = await source.readFolder(folder);
      if (Either.isLeft(files)) return Either.left(files.left);
      if (Option.isNone(files.right)) {
        return Either.left(
          NotValidError.of(
            'OPENDB_FOLDER_MISSING',
            `The source has no ${folder} folder, so it is not shaped like OpenDB. Nothing was imported.`,
            { folder },
          ),
        );
      }

      const records: CategoryRecords = { category, imported: [], leftOut: [] };
      for (const file of files.right.value) {
        Either.match(importedRecordOf(file, category), {
          onLeft: (reason) =>
            records.leftOut.push(new RecordLeftOut(`${folder}/${file.getName()}`, reason)),
          onRight: (imported) => records.imported.push(imported),
        });
      }
      read.push(records);
    }

    const created = await this.catalogImportStore.importParts(
      read.flatMap((records) => records.imported.map((imported) => imported.part)),
    );
    if (Either.isLeft(created)) return Either.left(created.left);

    return Either.right(
      Output.of(
        commit.right,
        read.map(({ category, imported, leftOut }) => {
          // The values left out are counted only for the Parts this run
          // created. A Part already there was not written.
          const createdNow = imported.filter((each) =>
            created.right.has(each.part.getOpenDbId()),
          );
          return new CategoryImport(
            category,
            createdNow.length,
            imported.length - createdNow.length,
            leftOut,
            valuesLeftOutOf(createdNow.flatMap((each) => each.valuesLeftOut)),
          );
        }),
      ),
    );
  }
}
