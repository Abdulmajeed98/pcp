// Writes the API's description of itself, and then the frontends' client
// from that description. Run it with `pnpm api-client:write` after an
// endpoint or a Response class changes. Neither file is edited by hand.
//
// With `--check` it writes nothing in the repository. It generates the client
// again from the committed description, in a temporary folder, and exits
// non-zero when the committed client is not the same. `pnpm check` runs it
// that way. Whether the committed description is still what the API
// describes is checked by one of the API's own tests.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const description = 'apps/api/openapi.json';
const client = 'libs/api-client/src/generated';

function tool(name) {
  return join(root, 'node_modules', '.bin', name);
}

// Runs one step and stops everything when it fails, with what it printed.
function run(what, command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  if (result.status === 0) return;

  console.error(`Could not ${what}.`);
  console.error(result.error?.message ?? `${result.stdout}${result.stderr}`);
  process.exit(1);
}

// The API is TypeScript with decorators, so its own compiler settings are
// used to run it. The application is built and never started.
function writeDescription() {
  run(
    "write the API's description",
    process.execPath,
    ['--require', '@swc-node/register', 'apps/api/src/write-openapi.ts'],
    { SWC_NODE_PROJECT: 'apps/api/tsconfig.app.json' },
  );
  run("format the API's description", tool('oxfmt'), [description]);
}

function generateClientInto(folder) {
  run('generate the client', tool('openapi-ts'), [
    '--input',
    description,
    '--output',
    folder,
  ]);
}

// Every file under a folder, by its path inside the folder, with its text.
function filesIn(folder) {
  const paths = readdirSync(folder, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name).slice(folder.length + 1));

  return new Map(
    paths.sort().map((path) => [path, readFileSync(join(folder, path), 'utf8')]),
  );
}

function differences(committed, generated) {
  const paths = new Set([...committed.keys(), ...generated.keys()]);

  return [...paths].sort().filter((path) => committed.get(path) !== generated.get(path));
}

if (process.argv.includes('--check')) {
  const scratch = mkdtempSync(join(tmpdir(), 'pcp-api-client-'));
  try {
    generateClientInto(scratch);
    const behind = differences(filesIn(join(root, client)), filesIn(scratch));
    for (const path of behind) {
      console.log(`${join(client, path)} is not what ${description} generates.`);
    }
    if (behind.length > 0) {
      console.log('Write the client again with "pnpm api-client:write".');
      process.exitCode = 1;
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
} else {
  writeDescription();
  console.log(`Wrote ${description}`);
  generateClientInto(client);
  console.log(`Wrote ${client}`);
}
