import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

// One of OpenDB's record files: its name, `<opendb_id>.json`, and the record
// it holds, or none when what it holds is not JSON.
export class OpenDbFile {
  constructor(
    private readonly name: string,
    private readonly record: Option.Option<unknown>,
  ) {}

  getName(): string {
    return this.name;
  }

  getRecord(): Option.Option<unknown> {
    return this.record;
  }
}

// Where the import reads OpenDB from, such as a folder on disk. It is the
// port: the domain says what it needs, and infrastructure provides it.
export abstract class OpenDbSource {
  // The commit the source says it holds. A source that cannot say gives an
  // error that says why.
  abstract readCommit(): Promise<Either.Either<string, StructuredError>>;

  // The record files of one of OpenDB's folders, such as `CPU`, in any order,
  // or none when the source has no such folder.
  abstract readFolder(
    name: string,
  ): Promise<Either.Either<Option.Option<readonly OpenDbFile[]>, StructuredError>>;
}
