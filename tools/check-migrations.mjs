// Fails when the API's schema holds a change that no committed migration
// makes, and shows what that migration would say. `pnpm check` runs it. It
// needs no database: drizzle-kit compares the schema with the snapshot it
// keeps beside the migrations.
//
// drizzle-kit generates into a copy of the migrations, with a configuration
// that is the API's own except for where it writes, so that this check and
// `pnpm db:generate` always read the schema alike. drizzle-kit writes only to
// a folder named from where it runs, so the copy is in the API's `tmp`, which
// Git ignores, and it is removed again. drizzle-kit can exit with 0 after a
// failure, so the check passes only on its own word that there is nothing to
// migrate, with no file written.
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const api = join(root, 'apps/api');
const scratch = `tmp/migrations-check-${process.pid}`;

function filesIn(folder) {
  return readdirSync(folder, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name).slice(folder.length + 1))
    .sort();
}

try {
  const copy = join(api, scratch, 'migrations');
  cpSync(join(api, 'src/drizzle'), copy, { recursive: true });
  const before = new Set(filesIn(copy));

  mkdirSync(join(api, scratch), { recursive: true });
  writeFileSync(
    join(api, scratch, 'drizzle.config.ts'),
    `import config from '../../drizzle.config';\n\nexport default { ...config, out: './${scratch}/migrations' };\n`,
  );

  const generated = spawnSync(
    join(root, 'node_modules', '.bin', 'drizzle-kit'),
    ['generate', '--config', `${scratch}/drizzle.config.ts`],
    // It asks about renames when it cannot tell one from a removal. Nobody is
    // there to answer, so it is given no input and a time limit.
    { cwd: api, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120_000 },
  );
  const said = `${generated.stdout ?? ''}${generated.stderr ?? ''}`;
  const written = filesIn(copy).filter((file) => !before.has(file));

  if (written.some((file) => file.endsWith('.sql'))) {
    console.log(
      "The API's schema holds a change that no committed migration makes. The migration it needs would say:",
    );
    for (const file of written.filter((each) => each.endsWith('.sql'))) {
      console.log(readFileSync(join(copy, file), 'utf8').trim());
    }
    console.log('Generate it with "pnpm db:generate <what-it-does>".');
    process.exitCode = 1;
  } else if (written.length > 0 || !said.includes('No schema changes')) {
    console.log('Could not compare the schema with the committed migrations:');
    console.log(said.trim() || generated.error?.message || 'drizzle-kit said nothing');
    process.exitCode = 1;
  }
} finally {
  rmSync(join(api, scratch), { recursive: true, force: true });
}
