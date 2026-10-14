import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';

import {
  NotValidError,
  ServerError,
  ServiceUnavailableError,
  StructuredError,
} from '@pcp/core';
import { Either, Option } from 'effect';
import { Parser, ReadEntry } from 'tar';

import { OpenDbFile, OpenDbSource } from '~/domain/catalog-import/OpenDbSource';

import { openDbFileOf, reasonOf } from './opendb-file';

// The longest a fetch of the archive may take. It is about 16 MB, which a slow
// connection takes some minutes to bring.
const longestFetch = 10 * 60 * 1000;

// A record file in GitHub's archive of OpenDB: `<repository>-<commit>/open-db/
// <folder>/<file>.json`.
const recordFile = /^[^/]+\/open-db\/([^/]+)\/([^/]+\.json)$/;

// What was read of the archive: the commit it says it holds, if it says one,
// and the text of each record file of the folders asked for, by folder.
type ReadArchive = {
  commit: string | undefined;
  folders: Map<string, { name: string; text: string }[]>;
};

// OpenDB at one commit, as GitHub's archive of it. The archive is fetched
// once, and read as it arrives. Only the record files of the folders asked for
// are kept, in memory, so nothing is written to disk.
//
// The commit is the one the archive itself names in its first header, where
// `git archive` writes the commit it was made from, and not the one in the
// address asked for.
export class GitHubOpenDbSource implements OpenDbSource {
  private readonly archiveUrl: string;
  private archive?: Promise<Either.Either<ReadArchive, StructuredError>>;

  constructor(
    repository: string,
    commit: string,
    private readonly folders: readonly string[],
  ) {
    this.archiveUrl = `${repository}/archive/${commit}.tar.gz`;
  }

  async readCommit(): Promise<Either.Either<string, StructuredError>> {
    return Either.flatMap(await this.read(), ({ commit }) =>
      commit === undefined
        ? Either.left(
            NotValidError.of(
              'OPENDB_COMMIT_NOT_NAMED',
              `The archive fetched from ${this.archiveUrl} does not say which commit of OpenDB it holds. Nothing was imported.`,
            ),
          )
        : Either.right(commit),
    );
  }

  async readFolder(
    name: string,
  ): Promise<Either.Either<Option.Option<readonly OpenDbFile[]>, StructuredError>> {
    return Either.map(await this.read(), ({ folders }) =>
      Option.map(Option.fromNullable(folders.get(name)), (files) =>
        files
          .sort((one, other) => one.name.localeCompare(other.name))
          .map((file) => openDbFileOf(file.name, file.text)),
      ),
    );
  }

  private read(): Promise<Either.Either<ReadArchive, StructuredError>> {
    this.archive ??= this.fetchArchive();
    return this.archive;
  }

  private async fetchArchive(): Promise<Either.Either<ReadArchive, StructuredError>> {
    let response: Response;
    try {
      response = await fetch(this.archiveUrl, {
        signal: AbortSignal.timeout(longestFetch),
      });
    } catch (error) {
      return Either.left(
        ServiceUnavailableError.of(
          'GITHUB_UNAVAILABLE',
          `GitHub could not be reached to fetch ${this.archiveUrl}: ${reasonOf(error)}. Nothing was imported.`,
        ),
      );
    }
    if (!response.ok || response.body === null) {
      return Either.left(
        ServiceUnavailableError.of(
          'GITHUB_UNAVAILABLE',
          `GitHub answered ${response.status} when asked for ${this.archiveUrl}. Nothing was imported.`,
        ),
      );
    }

    const archive: ReadArchive = { commit: undefined, folders: new Map() };
    // Strict, so that an archive that is cut short or damaged is an error
    // rather than a warning.
    const parser = new Parser({
      strict: true,
      onReadEntry: (entry: ReadEntry) => {
        archive.commit ??= entry.globalExtended?.comment;
        const place = recordFile.exec(entry.path);
        if (entry.type !== 'File' || place === null || !this.folders.includes(place[1])) {
          entry.resume();
          return;
        }
        const [, folder, name] = place;
        const chunks: Buffer[] = [];
        entry.on('data', (chunk: Buffer) => chunks.push(chunk));
        entry.on('end', () => {
          const files = archive.folders.get(folder) ?? [];
          files.push({ name, text: Buffer.concat(chunks).toString('utf8') });
          archive.folders.set(folder, files);
        });
      },
    });

    try {
      await new Promise<void>((resolve, reject) => {
        const body = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
        body.on('error', reject);
        parser.on('error', reject);
        parser.on('end', resolve);
        body.pipe(parser);
      });
    } catch (error) {
      return Either.left(
        ServerError.of(
          `The archive fetched from ${this.archiveUrl} could not be read: ${reasonOf(error)}. Nothing was imported.`,
        ),
      );
    }
    return Either.right(archive);
  }
}
