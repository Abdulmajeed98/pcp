// The rules every commit message follows: Conventional Commits 1.0.0, with
// the types of commitlint's conventional set, checked by the commit-msg hook
// that husky installs. See https://www.conventionalcommits.org/en/v1.0.0/.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

// A scope names the project a commit is about, by its folder's name, such as
// `api` or `opendb`, or `tools` for the workspace's scripts. A commit about
// several projects has no scope.
const projects = ['apps', 'libs'].flatMap((folder) =>
  readdirSync(join(import.meta.dirname, folder), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name),
);

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', [...projects, 'tools']],
    // Git shows a subject of up to about 72 characters in full, and a body
    // wrapped at 72 reads well in a terminal.
    'header-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 72],
  },
};
