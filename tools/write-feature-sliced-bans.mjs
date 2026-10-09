// Writes the frontends' import bans, as they are stated in
// `feature-sliced-bans.mjs`, into the file each frontend's lint configuration
// extends. Run it with `pnpm boundaries:write` after the bans are changed.
//
// With `--check` it writes nothing. It says which written files no longer
// match the statement and exits non-zero if any does not. `pnpm check` runs
// it that way, so that lint never reads bans that have fallen behind.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  featureSlicedBans,
  frontends,
  isWritten,
  writtenFile,
} from './feature-sliced-bans.mjs';

const root = join(import.meta.dirname, '..');

if (process.argv.includes('--check')) {
  const behind = frontends.filter((frontend) => !isWritten(root, frontend));
  for (const frontend of behind) {
    console.log(
      `${join(frontend.folder, writtenFile)} does not hold the bans as they are stated.`,
    );
  }
  if (behind.length > 0) {
    console.log('Write them again with "pnpm boundaries:write".');
    process.exitCode = 1;
  }
} else {
  for (const frontend of frontends) {
    const path = join(frontend.folder, writtenFile);
    writeFileSync(
      join(root, path),
      `${JSON.stringify(featureSlicedBans(frontend), null, 2)}\n`,
    );
    console.log(`Wrote ${path}`);
  }
}
