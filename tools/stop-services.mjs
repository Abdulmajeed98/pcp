// Stops the development services and keeps their data. With `--delete-data`
// it deletes the data as well, so that the next start is a first start.
// Run it with `pnpm services:down` or `pnpm services:reset`.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

const root = join(import.meta.dirname, '..');

// Stopping needs none of the settings' values, but Docker Compose refuses to
// read the Compose file while one of them is missing. Each setting is given a
// stand-in here, so that the services can still be stopped and reset when
// .env is missing, or was written before a setting was added.
const names = Object.keys(parseEnv(readFileSync(join(root, '.env.example'), 'utf8')));
const standIns = Object.fromEntries(names.map((name) => [name, 'not-needed-to-stop']));

const deleteData = process.argv.includes('--delete-data');
const compose = spawnSync(
  'docker',
  ['compose', 'down', ...(deleteData ? ['--volumes'] : [])],
  {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...standIns },
  },
);
process.exitCode = compose.status ?? 1;
