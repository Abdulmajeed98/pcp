import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { NotValidError, ServerError, StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { OpenDbFile, OpenDbSource } from '~/domain/catalog-import/OpenDbSource';

// The file in which a folder names the commit of OpenDB it holds, as its
// full 40-character identifier and nothing else.
export const commitFileName = 'COMMIT';

function codeOf(error: unknown): unknown {
  return (error as { code?: unknown }).code;
}

// OpenDB as a folder on disk: OpenDB's own `open-db` folder, which holds one
// folder for each of its categories, with a file `COMMIT` beside them that
// names the commit they are from. A copy of OpenDB says nothing of its commit
// by itself, so whoever makes the folder writes that file.
export class FolderOpenDbSource implements OpenDbSource {
  constructor(private readonly folder: string) {}

  async readCommit(): Promise<Either.Either<string, StructuredError>> {
    try {
      return Either.right(
        (await readFile(join(this.folder, commitFileName), 'utf8')).trim(),
      );
    } catch (error) {
      if (codeOf(error) === 'ENOENT') {
        return Either.left(
          NotValidError.of(
            'OPENDB_COMMIT_NOT_NAMED',
            `There is no file ${join(this.folder, commitFileName)} that names the commit of OpenDB the folder holds. Nothing was imported.`,
          ),
        );
      }
      return Either.left(
        ServerError.of(
          `The folder ${this.folder} could not be read: ${(error as Error).message}`,
        ),
      );
    }
  }

  // Each JSON file of the folder, in the order of their names. A file that
  // does not hold JSON is given with no record, for the import to name.
  async readFolder(
    name: string,
  ): Promise<Either.Either<Option.Option<readonly OpenDbFile[]>, StructuredError>> {
    const folder = join(this.folder, name);
    try {
      const fileNames = (await readdir(folder, { withFileTypes: true }))
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => entry.name)
        .sort();

      const files: OpenDbFile[] = [];
      for (const fileName of fileNames) {
        files.push(
          new OpenDbFile(
            fileName,
            recordIn(await readFile(join(folder, fileName), 'utf8')),
          ),
        );
      }
      return Either.right(Option.some(files));
    } catch (error) {
      if (codeOf(error) === 'ENOENT' || codeOf(error) === 'ENOTDIR') {
        return Either.right(Option.none());
      }
      return Either.left(
        ServerError.of(
          `The folder ${folder} could not be read: ${(error as Error).message}`,
        ),
      );
    }
  }
}

function recordIn(text: string): Option.Option<unknown> {
  try {
    return Option.some(JSON.parse(text) as unknown);
  } catch {
    return Option.none();
  }
}
