// Runs each project's tests against a real PostgreSQL, and prints what they
// print. It exits non-zero when any test fails. Run it with
// `pnpm integration:check`.
//
// The tests start a database of their own in a container, so they need
// Docker, but not the development services, and they never touch the
// development database. `pnpm check` does not run them, so that it keeps
// passing with Docker stopped.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');

const docker = spawnSync('docker', ['info', '--format', '{{.ServerVersion}}'], {
  encoding: 'utf8',
});
if (docker.status !== 0) {
  console.log(
    'Docker is not running, and these tests start their database in it. Start Docker, then run "pnpm integration:check" again.',
  );
  process.exit(1);
}

// Never answered from Nx's cache: a pass has to mean that the tests ran.
const tests = spawnSync(
  'pnpm',
  [
    'exec',
    'nx',
    'run-many',
    '--targets=integration',
    '--skip-nx-cache',
    '--output-style=static',
  ],
  { cwd: root, stdio: 'inherit' },
);
process.exitCode = tests.status ?? 1;
