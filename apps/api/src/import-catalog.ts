import { resolve } from 'node:path';

import { importCatalog } from '~/infrastructure/catalog-import/import-catalog';

// Fills the catalog from OpenDB at the pinned commit, fetched from GitHub. Run
// it with `pnpm catalog:import`, or with `pnpm catalog:import <folder>` for a
// folder shaped like OpenDB. pnpm and Nx each run it from a folder of their
// own, so a folder given as a relative path is taken from where the command
// was typed, which pnpm keeps in `INIT_CWD`.
const args = process.argv
  .slice(2)
  .map((arg) => resolve(process.env.INIT_CWD ?? process.cwd(), arg));

void importCatalog(args, console).then((code) => {
  process.exitCode = code;
});
