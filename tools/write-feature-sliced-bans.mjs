// Writes the frontends' import bans, as they are stated in
// `feature-sliced-bans.mjs`, into the file each frontend's lint configuration
// extends. Run it with `pnpm boundaries:write` after the bans are changed.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { featureSlicedBans, frontends, writtenFile } from './feature-sliced-bans.mjs';

const root = join(import.meta.dirname, '..');

for (const frontend of frontends) {
  const path = join(frontend.folder, writtenFile);
  writeFileSync(
    join(root, path),
    `${JSON.stringify(featureSlicedBans(frontend), null, 2)}\n`,
  );
  console.log(`Wrote ${path}`);
}
