// Asks the platform's development PostgreSQL with the client inside its
// container, so that the workspace's scripts need no database driver. Run from
// the repository root, where the Compose file is.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');

// Runs one statement with the client inside the PostgreSQL container, so that
// no database driver is needed here. It connects to the container's network
// address, not its loopback address, because PostgreSQL asks for a password
// only there. That is what a client outside the container meets.
export function psql({ user, password, database }, statement) {
  const inContainer = ['compose', 'exec', '--no-TTY', '--env', 'PGPASSWORD', 'postgres'];
  const connection = ['--host', 'postgres', '--username', user, '--dbname', database];
  const format = ['--no-psqlrc', '--tuples-only', '--no-align'];
  const result = spawnSync(
    'docker',
    [...inContainer, 'psql', ...connection, ...format, '--command', statement],
    { cwd: root, encoding: 'utf8', env: { ...process.env, PGPASSWORD: password } },
  );
  if (result.error) throw result.error;
  return {
    connected: result.status === 0,
    output: result.stdout.trim(),
    error: whatPostgresSaid(result.stderr),
  };
}

// What PostgreSQL said went wrong, without the address it was said from. It
// is on the line marked FATAL or ERROR, and a line of detail may follow.
function whatPostgresSaid(stderr) {
  const lines = stderr.trim().split('\n');
  const line = lines.find((each) => /(FATAL|ERROR):/.test(each)) ?? lines.at(-1);
  return line.replace(/^.*(FATAL|ERROR):\s+/, '');
}
