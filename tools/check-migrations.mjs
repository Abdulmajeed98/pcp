// Fails when the API's schema holds a change that no committed migration
// makes, and says what that migration would be. `pnpm check` runs it. It needs
// no database: drizzle-kit compares the schema with the snapshot it keeps
// beside the migrations.
//
// drizzle-kit generates into a copy of the migrations, inside the API's folder,
// because it only writes to a folder named relative to where it runs. The copy
// is in `tmp`, which Git ignores, and it is removed again. drizzle-kit can exit
// with 0 after a failure, so the check passes only on its own word that there
// is nothing to migrate, with no file written.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const api = join(root, 'apps/api');
const committed = join(api, 'src/drizzle');
const copyFromApi = `tmp/migrations-check-${process.pid}`;
const copy = join(api, copyFromApi);

function filesIn(folder) {
  return readdirSync(folder, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name).slice(folder.length + 1))
    .sort();
}

try {
  cpSync(committed, copy, { recursive: true });
  const before = new Set(filesIn(copy));

  const generated = spawnSync(
    join(root, 'node_modules', '.bin', 'drizzle-kit'),
    [
      'generate',
      '--dialect',
      'postgresql',
      '--schema',
      './src/app/infrastructure/**/*.schema.ts',
      '--out',
      `./${copyFromApi}`,
    ],
    // It asks about renames when it cannot tell one from a removal. Nobody is
    // there to answer, so it is given no input and a time limit.
    { cwd: api, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120_000 },
  );
  const said = `${generated.stdout ?? ''}${generated.stderr ?? ''}`;
  const written = filesIn(copy).filter((file) => !before.has(file));

  if (written.length === 0 && said.includes('No schema changes')) {
    process.exitCode = 0;
  } else if (written.some((file) => file.endsWith('.sql'))) {
    console.log(
      "The API's schema holds a change that no committed migration makes. The migration it needs would say:",
    );
    for (const file of written.filter((each) => each.endsWith('.sql'))) {
      console.log(readFileSync(join(copy, file), 'utf8').trim());
    }
    console.log('Generate it with "pnpm db:generate --name <what it does>".');
    process.exitCode = 1;
  } else {
    console.log('Could not compare the schema with the committed migrations:');
    console.log(said.trim() || generated.error?.message || 'drizzle-kit said nothing');
    process.exitCode = 1;
  }
} finally {
  if (existsSync(copy)) rmSync(copy, { recursive: true, force: true });
}
