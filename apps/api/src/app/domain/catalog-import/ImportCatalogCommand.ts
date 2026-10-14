import { Injectable } from '@nestjs/common';
import { NotValidError, StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { Category } from '../part/Category';
import { SpecificationProblem } from '../specification/Specification';
import { CatalogImportStore } from './CatalogImportStore';
import { CategoryImport, RecordLeftOut, ValuesLeftOut } from './CategoryImport';
import { openDbFolders, pinnedCommit } from './opendb';
import { PartOfRecord, partOfRecord, RecordLeftOutReason } from './opendb-record';
import { OpenDbSource } from './OpenDbSource';

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

export { Output as ImportCatalogCommandOutput };

// One Category's folder as read: the Parts its records make, and the records
// left out.
type CategoryFolder = {
  category: Category;
  parts: PartOfRecord[];
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
//
// It has no Input: what it reads is the source it is given, a folder or, later,
// the pinned commit fetched from GitHub, and it takes nothing else.
@Injectable()
export class ImportCatalogCommand {
  constructor(
    private readonly openDbSource: OpenDbSource,
    private readonly catalogImportStore: CatalogImportStore,
  ) {}

  async execute(): Promise<Either.Either<Output, StructuredError>> {
    const commit = await this.openDbSource.readCommit();
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

    const folders: CategoryFolder[] = [];
    // Each OpenDB ID is kept by one Part only. A second record with an ID
    // already read is left out, so that it is named rather than counted as
    // imported when the database skips it.
    const openDbIds = new Set<string>();
    for (const [folderName, category] of openDbFolders) {
      const files = await this.openDbSource.readFolder(folderName);
      if (Either.isLeft(files)) return Either.left(files.left);
      if (Option.isNone(files.right)) {
        return Either.left(
          NotValidError.of(
            'OPENDB_FOLDER_MISSING',
            `The source has no ${folderName} folder, so it is not shaped like OpenDB. Nothing was imported.`,
            { folder: folderName },
          ),
        );
      }

      const folder: CategoryFolder = { category, parts: [], leftOut: [] };
      for (const file of files.right.value) {
        const leftOut = (reason: RecordLeftOutReason) =>
          folder.leftOut.push(new RecordLeftOut(`${folderName}/${file.getName()}`, reason));
        Either.match(partOfRecord(file, category), {
          onLeft: leftOut,
          onRight: (made) => {
            const openDbId = made.part.getOpenDbId();
            if (openDbIds.has(openDbId)) {
              leftOut('openDbIdTaken');
            } else {
              openDbIds.add(openDbId);
              folder.parts.push(made);
            }
          },
        });
      }
      folders.push(folder);
    }

    const created = await this.catalogImportStore.importParts(
      folders.flatMap((folder) => folder.parts.map((made) => made.part)),
    );
    if (Either.isLeft(created)) return Either.left(created.left);

    return Either.right(
      Output.of(
        commit.right,
        folders.map(({ category, parts, leftOut }) => {
          // The values left out are counted only for the Parts this run
          // created. A Part already there was not written.
          const createdNow = parts.filter((made) =>
            created.right.has(made.part.getOpenDbId()),
          );
          return new CategoryImport(
            category,
            createdNow.length,
            parts.length - createdNow.length,
            leftOut,
            valuesLeftOutOf(createdNow.flatMap((made) => made.valuesLeftOut)),
          );
        }),
      ),
    );
  }
}
