// Proves that each import rule refuses a violation. For each case it plants a
// temporary file holding one import, at a place where the rule applies, lints
// the way `pnpm check` does, and prints one line for the case. It removes what
// it planted and exits non-zero when any line fails. Run it on its own, with
// `pnpm boundaries:check`: `pnpm check` and a development server would both
// see the planted files.
import { spawn } from 'node:child_process';
import {
  existsSync,
  globSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import { featureSlicedBans, frontends, writtenFile } from './feature-sliced-bans.mjs';

const root = join(import.meta.dirname, '..');

// Every planted file ends in this, and Git ignores every file that does.
const plantedSuffix = '.boundary-proof.ts';

const api = { name: '@pcp/api', folder: 'apps/api' };
const shopper = { name: '@pcp/shopper', folder: 'apps/shopper' };
const dashboard = { name: '@pcp/dashboard', folder: 'apps/dashboard' };
const ui = { name: '@pcp/ui', folder: 'libs/ui' };
const compatibility = { name: '@pcp/compatibility', folder: 'libs/compatibility' };

// The first sentence of each ban's message. They are written out here and not
// read from the lint configuration, so that a ban which changes its meaning
// has to be changed in both places.
const domainMayNotImportInfrastructure =
  'The domain layer may not import the infrastructure layer.';

// What Nx's boundary rule says for each of its constraints. The wording is
// Nx's own and cannot be changed.
const webMayNotLeaveItsScope =
  'A project tagged with "scope:web" can only depend on libs tagged with "scope:web", "scope:shared"';
const apiMayNotLeaveItsScope =
  'A project tagged with "scope:api" can only depend on libs tagged with "scope:api", "scope:shared"';
const libraryMayImportNoLibrary =
  'A project tagged with "type:lib" cannot depend on any libs with tags';
const noPathIntoAnotherProject =
  'Projects cannot be imported by a relative or absolute path';
const sharedMayImportNoPackage =
  'A project tagged with "scope:shared" is not allowed to import "rxjs"';

// The first sentence of each of the frontends' bans.
const noLayerAbove = 'A layer may not import from a layer above it.';
const noOtherSlice = 'A slice may not import another slice on its own layer.';
const noPastAnIndex = 'Nothing is imported past an index file.';
const noLeavingTheSlice = 'A relative import may not leave its own slice.';
const noClimbingAtThisDepth = 'A file at this depth may not climb with a relative import.';
const noCrossingLayers = 'A relative import may not cross into another layer.';
const routingFolderOnlyRoutes = "Next's routing folder only routes.";

// The cases every frontend has to pass. `app` and `pages` are the folders of
// its App and Pages layers, which the Shopper app spells differently. The
// Widgets, Features and Entities layers have no folder yet: a case planted in
// one creates the folder for a moment.
function frontendCases({ project, label, app, pages }) {
  const slice = `src/${pages}/boundary-proof`;
  const aPage = `@/${pages}/placeholder`;
  const refused = (name, file, specifier, refusal, form) => ({
    name: `${label}: ${name} is refused`,
    project,
    file,
    form,
    specifier,
    refusal,
  });
  const allowed = (name, file, specifier) => ({
    name: `${label}: ${name} is allowed`,
    project,
    file,
    specifier,
  });
  const shared = 'src/shared/boundary-proof';
  return [
    refused(
      'a Shared file that imports a page',
      `${shared}/imports-a-page`,
      aPage,
      noLayerAbove,
    ),
    refused(
      'a Shared file that imports a page lazily',
      `${shared}/imports-a-page-lazily`,
      aPage,
      noLayerAbove,
      'lazy',
    ),
    refused(
      'a Features file that imports the Widgets layer',
      'src/features/boundary-proof/ui/imports-a-widget',
      '@/widgets/header',
      noLayerAbove,
    ),
    refused(
      'a page that imports another page',
      `${slice}/ui/imports-another-page`,
      aPage,
      noOtherSlice,
    ),
    refused(
      'an import past the index file of a slice',
      `${slice}/ui/reaches-into-an-entity`,
      '@/entities/part/model/part',
      noPastAnIndex,
    ),
    refused(
      'an import from the App layer past the index file of a page',
      `src/${app}/boundary-proof/reaches-into-a-page`,
      `${aPage}/ui/placeholder-page`,
      noPastAnIndex,
    ),
    refused(
      'an import past the index file of a Shared segment',
      `${slice}/ui/reaches-into-shared`,
      '@/shared/config/libraries',
      noPastAnIndex,
    ),
    refused(
      "a relative import that leaves its slice from the slice's own folder",
      `${slice}/leaves-the-slice`,
      '../placeholder',
      noLeavingTheSlice,
    ),
    refused(
      'a relative import that leaves its slice from a segment',
      `${slice}/ui/leaves-the-slice`,
      '../../placeholder',
      noLeavingTheSlice,
    ),
    refused(
      'a relative import that leaves its slice from a folder inside a segment',
      `${slice}/ui/part/leaves-the-slice`,
      '../../../placeholder',
      noLeavingTheSlice,
    ),
    refused(
      'a climbing relative import in a file nested deeper than that',
      `${slice}/ui/part/deeper/climbs`,
      '../sibling',
      noClimbingAtThisDepth,
    ),
    refused(
      'a relative import in Shared that climbs into another layer',
      `${shared}/climbs-into-pages`,
      `../../${pages}/placeholder`,
      noCrossingLayers,
    ),
    refused(
      'a relative import in the App layer that climbs into another layer',
      `src/${app}/boundary-proof/climbs-into-pages`,
      `../../${pages}/placeholder`,
      noCrossingLayers,
    ),
    allowed(
      'a page that imports Shared through the index file of a segment',
      `${slice}/ui/imports-shared`,
      '@/shared/config',
    ),
    allowed(
      'a page that imports an entity through its index file',
      `${slice}/ui/imports-an-entity`,
      '@/entities/part',
    ),
    allowed(
      'a relative import between two segments of one slice',
      `${slice}/ui/imports-its-own-model`,
      '../model/thing',
    ),
    allowed(
      'a relative import to another segment from a folder inside a segment',
      `${slice}/ui/part/imports-its-own-model`,
      '../../model/thing',
    ),
    allowed(
      'a Shared segment that imports another through its index file',
      `${shared}/imports-another-segment`,
      '@/shared/config',
    ),
    allowed(
      'a relative import between two Shared segments',
      `${shared}/imports-a-neighbour`,
      '../config',
    ),
    allowed(
      'the App layer importing a page through its index file',
      `src/${app}/boundary-proof/imports-a-page`,
      aPage,
    ),
  ];
}

// A case is one planted file. `file` is its path inside the project, without
// the suffix, and `specifier` is what its one import names. `form` says how
// the import is written, when it is not a plain one. A case with a `refusal`
// must be reported with that message, and a case without one must not be
// reported at all.
const cases = [
  {
    name: 'The dashboard cannot import @pcp/core',
    project: dashboard,
    file: 'src/shared/boundary-proof/imports-core',
    specifier: '@pcp/core',
    refusal: webMayNotLeaveItsScope,
  },
  {
    name: 'The Shopper app cannot import @pcp/core',
    project: shopper,
    file: 'src/shared/boundary-proof/imports-core',
    specifier: '@pcp/core',
    refusal: webMayNotLeaveItsScope,
  },
  {
    name: 'The API cannot import a frontend library',
    project: api,
    file: 'src/app/domain/boundary-proof/imports-ui',
    specifier: '@pcp/ui',
    refusal: apiMayNotLeaveItsScope,
  },
  {
    name: 'A library cannot import another library',
    project: ui,
    file: 'src/boundary-proof/imports-i18n',
    specifier: '@pcp/i18n',
    refusal: libraryMayImportNoLibrary,
  },
  {
    name: 'A relative path cannot reach into a library',
    project: dashboard,
    file: 'src/shared/boundary-proof/reaches-into-ui',
    specifier: '../../../../../libs/ui/src/index',
    refusal: noPathIntoAnotherProject,
  },
  {
    name: 'A relative path cannot reach into an app',
    project: dashboard,
    file: 'src/shared/boundary-proof/reaches-into-the-shopper-app',
    specifier: '../../../../shopper/src/shared/config',
    refusal: noPathIntoAnotherProject,
  },
  {
    name: '@pcp/compatibility cannot import an npm package',
    project: compatibility,
    file: 'src/boundary-proof/imports-a-package',
    specifier: 'rxjs',
    refusal: sharedMayImportNoPackage,
  },
  {
    name: 'The dashboard may import @pcp/compatibility',
    project: dashboard,
    file: 'src/shared/boundary-proof/imports-compatibility',
    specifier: '@pcp/compatibility',
  },
  {
    name: 'The API: a domain file that imports infrastructure through the alias is refused',
    project: api,
    file: 'src/app/domain/boundary-proof/through-the-alias',
    specifier: '~/infrastructure/placeholder/placeholder.module',
    refusal: domainMayNotImportInfrastructure,
  },
  {
    name: 'The API: a domain file that imports infrastructure through a relative path is refused',
    project: api,
    file: 'src/app/domain/boundary-proof/through-a-relative-path',
    specifier: '../../infrastructure/placeholder/placeholder.module',
    refusal: domainMayNotImportInfrastructure,
  },
  {
    name: 'The API: a domain file that imports an infrastructure type is refused',
    project: api,
    file: 'src/app/domain/boundary-proof/as-a-type',
    form: 'type-only',
    specifier: '~/infrastructure/placeholder/placeholder.module',
    refusal: domainMayNotImportInfrastructure,
  },
  {
    name: 'The API: a domain file that re-exports from infrastructure is refused',
    project: api,
    file: 'src/app/domain/boundary-proof/as-a-re-export',
    form: 're-export',
    specifier: '~/infrastructure/placeholder/placeholder.module',
    refusal: domainMayNotImportInfrastructure,
  },
  {
    name: 'The API: a domain file that imports infrastructure lazily is refused',
    project: api,
    file: 'src/app/domain/boundary-proof/lazily',
    form: 'lazy',
    specifier: '~/infrastructure/placeholder/placeholder.module',
    refusal: domainMayNotImportInfrastructure,
  },
  {
    name: 'The API: an infrastructure file that imports a domain file is allowed',
    project: api,
    file: 'src/app/infrastructure/boundary-proof/imports-the-domain',
    specifier: '~/domain/boundary-proof/entity',
  },
  {
    name: 'The API: an infrastructure file that imports infrastructure is allowed',
    project: api,
    file: 'src/app/infrastructure/boundary-proof/imports-infrastructure',
    specifier: '~/infrastructure/placeholder/placeholder.module',
  },
  {
    name: 'The API: a test file that imports infrastructure is allowed',
    project: api,
    file: 'src/test/domain/boundary-proof/imports-infrastructure',
    specifier: '~/infrastructure/placeholder/placeholder.module',
  },
  ...frontendCases({
    project: dashboard,
    label: 'The dashboard',
    app: 'app',
    pages: 'pages',
  }),
  ...frontendCases({
    project: shopper,
    label: 'The Shopper app',
    app: '_app',
    pages: '_pages',
  }),
  // Next's own routing folder, which only the Shopper app has. It sits beside
  // `src`, outside the layers.
  {
    name: 'The Shopper app: a route file that imports the Shared layer is refused',
    project: shopper,
    file: 'app/boundary-proof/imports-shared',
    specifier: '@/shared/config',
    refusal: routingFolderOnlyRoutes,
  },
  {
    name: 'The Shopper app: a route file that reaches past the index file of the App layer is refused',
    project: shopper,
    file: 'app/boundary-proof/reaches-into-the-app-layer',
    specifier: '@/_app/layouts/root-layout',
    refusal: noPastAnIndex,
  },
  {
    name: 'The Shopper app: a route file that reaches past the index file of a page is refused',
    project: shopper,
    file: 'app/boundary-proof/reaches-into-a-page',
    specifier: '@/_pages/placeholder/ui/placeholder-page',
    refusal: noPastAnIndex,
  },
  {
    name: 'The Shopper app: a route file that reaches a layer by a relative path is refused',
    project: shopper,
    file: 'app/boundary-proof/climbs-into-a-layer',
    specifier: '../../src/_pages/placeholder',
    refusal: noCrossingLayers,
  },
  {
    name: 'The Shopper app: a route file that imports a page through its index file is allowed',
    project: shopper,
    file: 'app/boundary-proof/imports-a-page',
    specifier: '@/_pages/placeholder',
  },
  {
    name: 'The Shopper app: a route file that imports the App layer through its index file is allowed',
    project: shopper,
    file: 'app/boundary-proof/imports-the-app-layer',
    specifier: '@/_app',
  },
  {
    name: 'The Shopper app: a relative import between two files of the routing folder is allowed',
    project: shopper,
    file: 'app/boundary-proof/imports-a-neighbour',
    specifier: '../layout',
  },
];

function plantedPath({ project, file }) {
  return join(project.folder, `${file}${plantedSuffix}`);
}

const forms = {
  plain: (specifier) =>
    `import { planted } from '${specifier}';\n\nexport const used = planted;\n`,
  'type-only': (specifier) =>
    `import type { Planted } from '${specifier}';\n\nexport type Used = Planted;\n`,
  're-export': (specifier) => `export { planted } from '${specifier}';\n`,
  lazy: (specifier) => `export const planted = () => import('${specifier}');\n`,
};

function plantedSource({ form = 'plain', specifier }) {
  return forms[form](specifier);
}

// Build output and dependencies are never searched: nothing is planted there.
const notSearched = ['node_modules', 'dist', 'out-tsc', '.next'];

function findPlanted() {
  return globSync(`{apps,libs}/**/*${plantedSuffix}`, {
    cwd: root,
    exclude: (path) => notSearched.includes(basename(path)),
  });
}

const leftOver = findPlanted();
if (leftOver.length > 0) {
  console.log('An earlier run left planted files behind. Delete them and run this again:');
  for (const path of leftOver) console.log(`      ${path}`);
  process.exit(1);
}

// Folders that did not exist before a file was planted in them. Removing
// these removes the files inside them too.
const createdFolders = [];

function plant(each) {
  const path = join(root, plantedPath(each));
  const created = mkdirSync(dirname(path), { recursive: true });
  if (created !== undefined) createdFolders.push(created);
  writeFileSync(path, plantedSource(each));
}

function removePlanted() {
  for (const folder of createdFolders) rmSync(folder, { recursive: true, force: true });
  for (const path of findPlanted()) rmSync(join(root, path), { force: true });
}

// The lint that is running at the moment, so that an interruption stops it.
let running;

// The planted files are removed however this ends: when it finishes, when it
// throws, and when it is interrupted.
process.on('exit', removePlanted);
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    running?.kill(signal);
    process.exit(1);
  });
}

// Oxlint's report is one JSON value in the middle of what Nx prints. This
// finds where it starts and reads to the brace that closes it.
function readReport(output) {
  const start = output.indexOf('{ "diagnostics"');
  if (start === -1) return undefined;
  let depth = 0;
  let inString = false;
  for (let index = start; index < output.length; index += 1) {
    const character = output[index];
    if (inString) {
      if (character === '\\') index += 1;
      else if (character === '"') inString = false;
    } else if (character === '"') inString = true;
    else if (character === '{') depth += 1;
    else if (character === '}') {
      depth -= 1;
      if (depth === 0) return JSON.parse(output.slice(start, index + 1));
    }
  }
  return undefined;
}

// Lints one project through its Nx target, as `pnpm check` does, with the
// cache skipped. Oxlint leaves out files that Git ignores unless they are
// named, so the planted files are named.
function lint(project, files) {
  const target = ['exec', 'nx', 'run', `${project.name}:lint`, '--skip-nx-cache'];
  return new Promise((resolve, reject) => {
    const nx = spawn('pnpm', [...target, '--format=json', ...files], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    running = nx;
    let output = '';
    nx.stdout.on('data', (chunk) => (output += chunk));
    nx.stderr.on('data', (chunk) => (output += chunk));
    nx.once('error', reject);
    nx.once('close', () => {
      running = undefined;
      resolve({ output, report: readReport(output) });
    });
  });
}

let failures = 0;

function pass(name) {
  console.log(`pass  ${name}`);
}

function fail(name, reason) {
  failures += 1;
  console.log(`FAIL  ${name}: ${reason}`);
}

function said({ message, help }) {
  return help ? `${message} ${help}` : message;
}

function judge(each, reported) {
  if (each.refusal === undefined) {
    if (reported.length === 0) pass(each.name);
    else fail(each.name, `lint refused it: ${said(reported[0])}`);
    return;
  }
  if (reported.length === 0) fail(each.name, 'lint did not report it');
  else if (reported.length > 1) {
    fail(
      each.name,
      `lint reported it ${reported.length} times: ${reported.map(said).join(' | ')}`,
    );
  } else if (!said(reported[0]).includes(each.refusal)) {
    fail(each.name, `another rule caught it: ${said(reported[0])}`);
  } else pass(each.name);
}

// The frontends' bans are stated once and written out for Oxlint to read. A
// written file that has fallen behind would be linted and proven in place of
// what is stated.
for (const frontend of frontends) {
  const path = join(frontend.folder, writtenFile);
  const name = `${path} holds the bans as they are stated`;
  const written = existsSync(join(root, path))
    ? JSON.parse(readFileSync(join(root, path), 'utf8'))
    : undefined;
  if (isDeepStrictEqual(written, featureSlicedBans(frontend))) pass(name);
  else fail(name, 'it does not. Write it again with "pnpm boundaries:write"');
}

for (const each of cases) plant(each);

const projects = [...new Set(cases.map((each) => each.project))];
const results = new Map();
try {
  for (const project of projects) {
    const files = cases
      .filter((each) => each.project === project)
      .map((each) => `${each.file}${plantedSuffix}`);
    results.set(project, await lint(project, files));
  }
} finally {
  removePlanted();
}

for (const project of projects) {
  const { output, report } = results.get(project);
  const own = cases.filter((each) => each.project === project);
  if (report === undefined) {
    for (const each of own) fail(each.name, `lint gave no report for ${project.name}`);
    console.log(output);
    continue;
  }
  for (const each of own) {
    const file = `${each.file}${plantedSuffix}`;
    judge(
      each,
      report.diagnostics.filter((diagnostic) => diagnostic.filename === file),
    );
  }
  // With no cached project graph, Nx's boundary rule says so, checks nothing
  // and lets lint pass. That must never count as the rule holding.
  const notSkipped = `${project.name}: lint skipped no rule`;
  if (output.includes('The rule will be skipped')) {
    fail(
      notSkipped,
      "Nx's boundary rule found no cached project graph and checked nothing",
    );
  } else pass(notSkipped);
  const others = report.diagnostics.filter(
    (diagnostic) => !diagnostic.filename.endsWith(plantedSuffix),
  );
  const nothingElse = `${project.name}: lint reports nothing that was not planted`;
  if (others.length === 0) pass(nothingElse);
  else
    fail(
      nothingElse,
      others.map((other) => `${other.filename}: ${said(other)}`).join(' | '),
    );
}

if (failures > 0) process.exitCode = 1;
