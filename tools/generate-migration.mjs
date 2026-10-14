// Writes the migration that the API's schema needs, named for what it does.
// Run it with `pnpm db:generate <what-it-does>`, for example
// `pnpm db:generate add-part-photo`. drizzle-kit gives a migration a made-up
// name when it is given none, and every migration's file name has to say what
// it does, so a name is required here.
//
// `pnpm db:generate <what-it-does> --custom` writes an empty migration
// instead, for SQL that drizzle-kit cannot write from the schema, such as
// creating an extension. drizzle-kit still records it in its journal.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const [name, ...flags] = process.argv.slice(2);
const custom = flags.includes('--custom');

if (!name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
  console.log(
    'Name the migration for what it does, in lower case with hyphens: "pnpm db:generate add-part-photo".',
  );
  process.exit(1);
}

const generated = spawnSync(
  join(root, 'node_modules', '.bin', 'drizzle-kit'),
  ['generate', '--name', name, ...(custom ? ['--custom'] : [])],
  { cwd: join(root, 'apps/api'), stdio: 'inherit' },
);
process.exitCode = generated.status ?? 1;
