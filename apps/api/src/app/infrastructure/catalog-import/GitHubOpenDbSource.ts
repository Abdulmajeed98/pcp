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

import { reasonOf } from './failure-reason';
import { openDbFileOf } from './opendb-file';

// The longest the fetch waits for GitHub to answer, or for the next part of
// the archive once it is coming. A slow connection still brings something
// every few seconds, and a stalled one is given up on rather than waited for.
const longestWait = 60 * 1000;

// A folder of OpenDB's and a record file in it, in GitHub's archive:
// `<repository>-<commit>/open-db/<folder>/` and `…/<folder>/<file>.json`.
const folderPath = /^[^/]+\/open-db\/([^/]+)\/$/;
const recordPath = /^[^/]+\/open-db\/([^/]+)\/([^/]+\.json)$/;

// What the archive holds of use: the commit its first entry names, if it names
// one, and the text of each record file of the folders asked for, by folder.
// A folder with no record files is there, and empty.
type ArchiveContent = {
  commit: string | undefined;
  folders: Map<string, { name: string; text: string }[]>;
};

// A failure to fetch the archive, as opposed to a failure to read what came.
class DownloadFailed extends Error {
  constructor(override readonly cause: unknown) {
    super('The download failed');
  }
}

// OpenDB at one commit, as GitHub's archive of it. The archive is fetched
// once, and read as it arrives. Only the record files of the folders asked for
// are kept, in memory, so nothing is written to disk.
//
// The commit is the one the archive itself names in its first header, where
// `git archive` writes the commit it was made from, and not the one in the
// address asked for.
export class GitHubOpenDbSource implements OpenDbSource {
  private readonly archiveUrl: string;
  private content?: Promise<Either.Either<ArchiveContent, StructuredError>>;

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
        files.map((file) => openDbFileOf(file.name, file.text)),
      ),
    );
  }

  private read(): Promise<Either.Either<ArchiveContent, StructuredError>> {
    this.content ??= this.fetchArchive();
    return this.content;
  }

  private async fetchArchive(): Promise<Either.Either<ArchiveContent, StructuredError>> {
    // Given up on when nothing has come for the longest wait, whether the
    // answer or the next part of the archive.
    const stalled = new AbortController();
    let wait = setTimeout(giveUp, longestWait);
    function giveUp() {
      stalled.abort(new Error(`nothing came for ${longestWait / 1000} s`));
    }
    function waitAgain() {
      clearTimeout(wait);
      wait = setTimeout(giveUp, longestWait);
    }

    try {
      let response: Response;
      try {
        response = await fetch(this.archiveUrl, { signal: stalled.signal });
      } catch (error) {
        return Either.left(
          ServiceUnavailableError.of(
            'GITHUB_UNAVAILABLE',
            `GitHub could not be reached to fetch ${this.archiveUrl}: ${reasonOf(error)}. Nothing was imported.`,
          ),
        );
      }
      if (!response.ok || response.body === null) {
        await response.body?.cancel();
        return Either.left(
          ServiceUnavailableError.of(
            'GITHUB_UNAVAILABLE',
            `GitHub answered ${response.status} when asked for ${this.archiveUrl}. Nothing was imported.`,
          ),
        );
      }

      const body = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      body.on('data', waitAgain);
      try {
        return Either.right(await this.contentOf(body));
      } catch (error) {
        // The rest of the archive is not wanted once reading has failed.
        body.destroy();
        return Either.left(
          error instanceof DownloadFailed
            ? ServiceUnavailableError.of(
                'GITHUB_UNAVAILABLE',
                `The download of ${this.archiveUrl} was cut off: ${reasonOf(error)}. Nothing was imported.`,
              )
            : ServerError.of(
                `The archive fetched from ${this.archiveUrl} could not be read: ${reasonOf(error)}. Nothing was imported.`,
              ),
        );
      }
    } finally {
      clearTimeout(wait);
    }
  }

  // Reads the archive as it arrives. Strict, so that an archive that is cut
  // short or damaged is an error rather than a warning.
  private contentOf(body: Readable): Promise<ArchiveContent> {
    const content: ArchiveContent = { commit: undefined, folders: new Map() };
    let first = true;
    const parser = new Parser({
      strict: true,
      onReadEntry: (entry: ReadEntry) => {
        if (first) content.commit = entry.globalExtended?.comment;
        first = false;

        const folder = folderPath.exec(entry.path);
        if (
          entry.type === 'Directory' &&
          folder !== null &&
          this.folders.includes(folder[1])
        ) {
          if (!content.folders.has(folder[1])) content.folders.set(folder[1], []);
        }
        const record = recordPath.exec(entry.path);
        if (entry.type !== 'File' || record === null || !this.folders.includes(record[1])) {
          entry.resume();
          return;
        }
        const [, folderName, name] = record;
        const chunks: Buffer[] = [];
        entry.on('data', (chunk: Buffer) => chunks.push(chunk));
        entry.on('end', () => {
          const files = content.folders.get(folderName) ?? [];
          files.push({ name, text: Buffer.concat(chunks).toString('utf8') });
          content.folders.set(folderName, files);
        });
      },
    });

    return new Promise((resolve, reject) => {
      body.on('error', (error) => reject(new DownloadFailed(error)));
      parser.on('error', reject);
      parser.on('end', () => resolve(content));
      body.pipe(parser);
    });
  }
}
