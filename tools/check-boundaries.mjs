// Proves that each import rule refuses a violation. For each case it plants a
// temporary file holding one import, at a place where the rule applies, lints
// the way `pnpm check` does, and prints one line for the case. It removes what
// it planted and exits non-zero when any line fails. Run it on its own, with
// `pnpm boundaries:check`: `pnpm check` and a development server would both
// see the planted files.
import { spawn } from 'node:child_process';
import { existsSync, globSync, mkdirSync, rmdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

import { frontends, isWritten, writtenFile } from './feature-sliced-bans.mjs';

const root = join(import.meta.dirname, '..');

// Every planted file ends in this, and Git ignores every file that does.
const plantedSuffix = '.boundary-proof.ts';

const api = { name: '@pcp/api', folder: 'apps/api' };
const core = { name: '@pcp/core', folder: 'libs/core' };
const shopper = { name: '@pcp/shopper', folder: 'apps/shopper' };
const dashboard = { name: '@pcp/dashboard', folder: 'apps/dashboard' };
const ui = { name: '@pcp/ui', folder: 'libs/ui' };
const compatibility = { name: '@pcp/compatibility', folder: 'libs/compatibility' };

// The first sentence of each ban's message. They are written out here and not
// read from the lint configuration, so that a ban which changes its meaning
// has to be changed in both places. The same goes for the names of the
// frontends' folders further down.
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
const aliasReachesOnlyLayers = 'The `@/` alias reaches the six layers and nothing else.';
const noLayerAbove = 'A layer may not import from a layer above it.';
const noOtherSlice = 'A slice may not import another slice on its own layer.';
const noPastAnIndex = 'Nothing is imported past an index file.';
const shortestFormOnly = 'A relative import is written in its shortest form';
const noLeavingTheSlice = 'A relative import may not leave its own slice.';
const noLeavingTheLayer = 'A relative import may not leave its own layer.';
const noClimbingAtThisDepth = 'A file at this depth may not climb with a relative import.';
const noLooseFiles = 'A layer that has slices holds slices and no files of its own.';
const routingFolderOnlyRoutes = "Next's routing folder only routes.";
const routesUseTheAlias = 'A route file reaches the layers through the `@/` alias';

// A case is one planted file. `file` is its path inside the project, without
// the suffix, and `specifier` is what its one import names. `form` says how
// the import is written, when it is not a plain one. A refused case must be
// reported once, with the message of the ban it is meant for. An allowed case
// must not be reported at all.
function casesFor(project, label) {
  return {
    refused: (name, file, specifier, refusal, form) => ({
      name: `${label}: ${name} is refused`,
      project,
      file,
      form,
      specifier,
      refusal,
    }),
    allowed: (name, file, specifier) => ({
      name: `${label}: ${name} is allowed`,
      project,
      file,
      specifier,
    }),
  };
}

const inTheApi = casesFor(api, 'The API');
const inCore = casesFor(core, '@pcp/core');
const inTheDashboard = casesFor(dashboard, 'The dashboard');
const inTheShopperApp = casesFor(shopper, 'The Shopper app');
const inALibrary = casesFor(ui, 'A library');
const inCompatibility = casesFor(compatibility, '@pcp/compatibility');

// Between the eight projects. The API's case is planted in its domain layer,
// where its own ban applies as well, to show that both hold on one file.
const casesBetweenProjects = [
  inTheDashboard.refused(
    'an import of @pcp/core',
    'src/shared/boundary-proof/imports-core',
    '@pcp/core',
    webMayNotLeaveItsScope,
  ),
  inTheShopperApp.refused(
    'an import of @pcp/core',
    'src/shared/boundary-proof/imports-core',
    '@pcp/core',
    webMayNotLeaveItsScope,
  ),
  inTheShopperApp.refused(
    'an import of @pcp/core in a file at its root',
    'at-the-root-imports-core',
    '@pcp/core',
    webMayNotLeaveItsScope,
  ),
  inTheApi.refused(
    'an import of a frontend library',
    'src/app/domain/boundary-proof/imports-ui',
    '@pcp/ui',
    apiMayNotLeaveItsScope,
  ),
  inALibrary.refused(
    'an import of another library',
    'src/boundary-proof/imports-i18n',
    '@pcp/i18n',
    libraryMayImportNoLibrary,
  ),
  inTheApi.refused(
    'a relative path into a library',
    'src/app/infrastructure/boundary-proof/reaches-into-core',
    '../../../../../../libs/core/src/index',
    noPathIntoAnotherProject,
  ),
  inTheApi.refused(
    'a relative path into another app',
    'src/app/infrastructure/boundary-proof/reaches-into-the-dashboard',
    '../../../../../dashboard/src/shared/config',
    noPathIntoAnotherProject,
  ),
  inCompatibility.refused(
    'an import of an npm package',
    'src/boundary-proof/imports-a-package',
    'rxjs',
    sharedMayImportNoPackage,
  ),
  inTheDashboard.allowed(
    'an import of @pcp/compatibility',
    'src/shared/boundary-proof/imports-compatibility',
    '@pcp/compatibility',
  ),
];

const infrastructure = '~/infrastructure/status/status.module';
const domain = 'src/app/domain/boundary-proof';

const casesInTheApi = [
  inTheApi.refused(
    'a domain file that imports infrastructure through the alias',
    `${domain}/through-the-alias`,
    infrastructure,
    domainMayNotImportInfrastructure,
  ),
  inTheApi.refused(
    'a domain file that imports infrastructure through a relative path',
    `${domain}/through-a-relative-path`,
    '../../infrastructure/status/status.module',
    domainMayNotImportInfrastructure,
  ),
  inTheApi.refused(
    'a domain file that imports an infrastructure type',
    `${domain}/as-a-type`,
    infrastructure,
    domainMayNotImportInfrastructure,
    'type-only',
  ),
  inTheApi.refused(
    'a domain file that re-exports from infrastructure',
    `${domain}/as-a-re-export`,
    infrastructure,
    domainMayNotImportInfrastructure,
    're-export',
  ),
  inTheApi.refused(
    'a domain file that imports infrastructure lazily',
    `${domain}/lazily`,
    infrastructure,
    domainMayNotImportInfrastructure,
    'lazy',
  ),
  inTheApi.allowed(
    'an infrastructure file that imports a domain file',
    'src/app/infrastructure/boundary-proof/imports-the-domain',
    '~/domain/boundary-proof/entity',
  ),
  inTheApi.allowed(
    'an infrastructure file that imports infrastructure',
    'src/app/infrastructure/boundary-proof/imports-infrastructure',
    infrastructure,
  ),
  inTheApi.allowed(
    'a test file that imports infrastructure',
    'src/test/domain/boundary-proof/imports-infrastructure',
    infrastructure,
  ),
];

// The cases every frontend has to pass. `app` and `pages` are the folders of
// its App and Pages layers, which the Shopper app spells differently. The
// Widgets, Features and Entities layers have no folder yet: a case planted in
// one creates the folder for a moment.
function casesInAFrontend({ refused, allowed }, { app, pages }) {
  const slice = `src/${pages}/boundary-proof`;
  const shared = 'src/shared/boundary-proof';
  const aPage = `@/${pages}/placeholder`;
  return [
    // No import from a layer above. The slice's own folder is one of the four
    // blocks a layer with slices has, and each block holds the ban again.
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
      "a file in a slice's own folder that imports the App layer",
      `${slice}/imports-the-app-layer`,
      `@/${app}`,
      noLayerAbove,
    ),
    // No import of another slice on the same layer.
    refused(
      'a page that imports another page',
      `${slice}/ui/imports-another-page`,
      aPage,
      noOtherSlice,
    ),
    refused(
      'a file in a folder inside a segment that imports another page',
      `${slice}/ui/part/imports-another-page`,
      aPage,
      noOtherSlice,
    ),
    // Nothing past an index file.
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
      'an import past an index file in a file nested deeper than the bans follow',
      `${slice}/ui/part/deeper/reaches-into-shared`,
      '@/shared/config/libraries',
      noPastAnIndex,
    ),
    refused(
      'an import of a whole layer, with no slice named',
      `${slice}/ui/imports-a-whole-layer`,
      '@/entities',
      noPastAnIndex,
    ),
    refused(
      'an alias import of a folder that is not a layer',
      `${slice}/ui/imports-outside-the-layers`,
      '@/i18n/request',
      aliasReachesOnlyLayers,
    ),
    // A relative import stays at home.
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
      'a relative import that leaves its slice by starting with ./',
      `${slice}/ui/leaves-the-slice-the-long-way`,
      './../../placeholder',
      shortestFormOnly,
    ),
    refused(
      'a relative import that leaves its slice after going down first',
      `${slice}/ui/leaves-the-slice-after-going-down`,
      '../model/../../placeholder',
      shortestFormOnly,
    ),
    refused(
      'a relative import in Shared that leaves the layer',
      `${shared}/leaves-the-layer`,
      `../../${pages}/placeholder`,
      noLeavingTheLayer,
    ),
    refused(
      'a relative import in Shared that leaves the layer and comes back through src',
      `${shared}/leaves-the-layer-and-comes-back`,
      `../../../src/${pages}/placeholder`,
      noLeavingTheLayer,
    ),
    refused(
      'a relative import in the App layer that leaves the layer',
      `src/${app}/boundary-proof/leaves-the-layer`,
      `../../${pages}/placeholder`,
      noLeavingTheLayer,
    ),
    refused(
      'a relative import in a file put straight into a layer that has slices',
      `src/${pages}/belongs-to-no-slice`,
      './placeholder/ui/placeholder-page',
      noLooseFiles,
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
      'a relative import of a file beside it',
      `${slice}/ui/imports-a-file-beside-it`,
      './beside',
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
      'a relative import in Shared of a folder that is named like a layer',
      `${shared}/imports-a-folder-named-like-a-layer`,
      '../widgets',
    ),
    allowed(
      'the App layer importing a page through its index file',
      `src/${app}/boundary-proof/imports-a-page`,
      aPage,
    ),
  ];
}

// Next's own routing folder, which only the Shopper app has. It sits beside
// `src`, outside the layers.
const route = 'app/boundary-proof';

const casesInTheRoutingFolder = [
  inTheShopperApp.refused(
    'a route file that imports the Shared layer',
    `${route}/imports-shared`,
    '@/shared/config',
    routingFolderOnlyRoutes,
  ),
  inTheShopperApp.refused(
    'a route file that reaches past the index file of the App layer',
    `${route}/reaches-into-the-app-layer`,
    '@/_app/layouts/root-layout',
    noPastAnIndex,
  ),
  inTheShopperApp.refused(
    'a route file that reaches past the index file of a page',
    `${route}/reaches-into-a-page`,
    '@/_pages/placeholder/ui/placeholder-page',
    noPastAnIndex,
  ),
  inTheShopperApp.refused(
    'a route file that imports a folder that is not a layer',
    `${route}/imports-outside-the-layers`,
    '@/i18n/request',
    aliasReachesOnlyLayers,
  ),
  inTheShopperApp.refused(
    'a route file that reaches a layer by a relative path',
    `${route}/climbs-into-a-layer`,
    '../../src/_pages/placeholder',
    routesUseTheAlias,
  ),
  inTheShopperApp.refused(
    'a route file that reaches a layer by a relative path that starts with ./',
    `${route}/climbs-into-a-layer-the-long-way`,
    './../../src/_pages/placeholder',
    shortestFormOnly,
  ),
  inTheShopperApp.allowed(
    'a route file that imports a page through its index file',
    `${route}/imports-a-page`,
    '@/_pages/placeholder',
  ),
  inTheShopperApp.allowed(
    'a route file that imports the App layer through its index file',
    `${route}/imports-the-app-layer`,
    '@/_app',
  ),
  inTheShopperApp.allowed(
    'a relative import between two files of the routing folder',
    `${route}/imports-a-neighbour`,
    '../layout',
  ),
];

// `core` has the API's two layers and the API's ban. It has no alias of its
// own, so a relative path is the only way from one layer to the other.
const casesInCore = [
  inCore.refused(
    'a domain file that imports infrastructure',
    'src/domain/boundary-proof/imports-infrastructure',
    '../../infrastructure/errors/error.module',
    domainMayNotImportInfrastructure,
  ),
  inCore.refused(
    'a domain file that imports an infrastructure type',
    'src/domain/boundary-proof/as-a-type',
    '../../infrastructure/errors/error.module',
    domainMayNotImportInfrastructure,
    'type-only',
  ),
  inCore.allowed(
    'an infrastructure file that imports a domain file',
    'src/infrastructure/boundary-proof/imports-the-domain',
    '../../domain/boundary-proof/entity',
  ),
];

const cases = [
  ...casesBetweenProjects,
  ...casesInTheApi,
  ...casesInCore,
  ...casesInAFrontend(inTheDashboard, { app: 'app', pages: 'pages' }),
  ...casesInAFrontend(inTheShopperApp, { app: '_app', pages: '_pages' }),
  ...casesInTheRoutingFolder,
];

// A planted file's name, as the project's lint target is given it and as the
// report names it.
function plantedName({ file }) {
  return `${file}${plantedSuffix}`;
}

function plantedPath(theCase) {
  return join(theCase.project.folder, plantedName(theCase));
}

const paths = cases.map(plantedPath);
const plantedTwice = paths.find((path, index) => paths.indexOf(path) !== index);
if (plantedTwice !== undefined) {
  throw new Error(`Two cases plant the same file: ${plantedTwice}`);
}

// Every planted file ends with a statement that lint always reports. It shows
// that lint looked at the file, so that an allowed case cannot pass because
// its file was never linted.
const canary = 'debugger;\n';
const canaryCode = 'eslint(no-debugger)';

const forms = {
  plain: (specifier) =>
    `import { planted } from '${specifier}';\n\nexport const used = planted;\n`,
  'type-only': (specifier) =>
    `import type { Planted } from '${specifier}';\n\nexport type Used = Planted;\n`,
  're-export': (specifier) => `export { planted } from '${specifier}';\n`,
  lazy: (specifier) => `export const planted = () => import('${specifier}');\n`,
};

function plantedSource({ form = 'plain', specifier }) {
  return `${forms[form](specifier)}${canary}`;
}

// Build output and dependencies are never searched: nothing is planted there.
const notSearched = ['node_modules', 'dist', 'out-tsc', '.next'];

const leftOver = globSync(`{apps,libs}/**/*${plantedSuffix}`, {
  cwd: root,
  exclude: (path) => notSearched.includes(basename(path)),
});
if (leftOver.length > 0) {
  console.log('An earlier run left planted files behind, which Git does not show.');
  console.log('Delete them, and any empty folder left around them, and run this again:');
  for (const path of leftOver) console.log(`      ${path}`);
  process.exit(1);
}

// What was planted, and the folders that had to be made for it. Only these
// are removed afterwards, and a folder only if it is empty again, so nothing
// that appears beside a planted file while this runs is lost.
const plantedFiles = [];
const createdFolders = [];

function plant(theCase) {
  const path = join(root, plantedPath(theCase));
  for (let folder = dirname(path); !existsSync(folder); folder = dirname(folder)) {
    createdFolders.push(folder);
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, plantedSource(theCase));
  plantedFiles.push(path);
}

function removePlanted() {
  for (const path of plantedFiles) rmSync(path, { force: true });
  // The longest path first, so that a folder goes before the one it is in.
  for (const folder of createdFolders.toSorted((one, other) => other.length - one.length)) {
    try {
      rmdirSync(folder);
    } catch {
      // It holds something that was not planted, or it is gone already.
    }
  }
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
// finds where it starts and reads to the brace that closes it. It answers
// with nothing when there is no report or the report cannot be read.
function readReport(printed) {
  const start = printed.indexOf('{ "diagnostics"');
  if (start === -1) return undefined;
  let depth = 0;
  let inString = false;
  for (let index = start; index < printed.length; index += 1) {
    const character = printed[index];
    if (inString) {
      if (character === '\\') index += 1;
      else if (character === '"') inString = false;
    } else if (character === '"') inString = true;
    else if (character === '{') depth += 1;
    else if (character === '}') {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(printed.slice(start, index + 1));
        } catch {
          return undefined;
        }
      }
    }
  }
  return undefined;
}

// A lint that has not finished after this long is stopped, and its cases fail.
const lintTimeout = 120_000;

// Lints one project through its Nx target, as `pnpm check` does, with the
// cache skipped. Oxlint leaves out files that Git ignores unless they are
// named, so the planted files are named.
function lint(project, files) {
  const target = ['exec', 'nx', 'run', `${project.name}:lint`, '--skip-nx-cache'];
  return new Promise((resolve, reject) => {
    const nx = spawn('pnpm', [...target, '--format=json', ...files], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: lintTimeout,
    });
    running = nx;
    let printed = '';
    let complaints = '';
    nx.stdout.on('data', (chunk) => (printed += chunk));
    nx.stderr.on('data', (chunk) => (complaints += chunk));
    nx.once('error', reject);
    nx.once('close', () => {
      running = undefined;
      resolve({ output: `${printed}${complaints}`, report: readReport(printed) });
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

// `reported` is everything lint said about the case's file.
function judge(theCase, reported) {
  const { name, refusal } = theCase;
  const looked = reported.filter((diagnostic) => diagnostic.code === canaryCode);
  const refusals = reported.filter((diagnostic) => diagnostic.code !== canaryCode);
  if (looked.length !== 1) {
    fail(name, 'lint did not look at the planted file');
  } else if (refusal === undefined) {
    if (refusals.length === 0) pass(name);
    else fail(name, `lint refused it: ${said(refusals[0])}`);
  } else if (refusals.length === 0) {
    fail(name, 'lint did not report it');
  } else if (refusals.length > 1) {
    fail(
      name,
      `lint reported it ${refusals.length} times: ${refusals.map(said).join(' | ')}`,
    );
  } else if (!said(refusals[0]).includes(refusal)) {
    fail(name, `another rule caught it: ${said(refusals[0])}`);
  } else pass(name);
}

// The frontends' bans are stated once and written out for Oxlint to read. A
// written file that has fallen behind would be linted and proven in place of
// what is stated. `pnpm check` makes the same comparison.
for (const frontend of frontends) {
  const name = `${join(frontend.folder, writtenFile)} holds the bans as they are stated`;
  if (isWritten(root, frontend)) pass(name);
  else fail(name, 'it does not. Write it again with "pnpm boundaries:write"');
}

const projects = [...new Set(cases.map((theCase) => theCase.project))];
const casesOf = (project) => cases.filter((theCase) => theCase.project === project);

for (const theCase of cases) plant(theCase);

const results = new Map();
try {
  for (const project of projects) {
    results.set(project, await lint(project, casesOf(project).map(plantedName)));
  }
} finally {
  removePlanted();
}

for (const project of projects) {
  const { output, report } = results.get(project);
  if (report === undefined) {
    for (const { name } of casesOf(project)) {
      fail(name, `lint gave no report for ${project.name}`);
    }
    console.log(output);
    continue;
  }
  for (const theCase of casesOf(project)) {
    const file = plantedName(theCase);
    judge(
      theCase,
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
  else {
    fail(
      nothingElse,
      others.map((other) => `${other.filename}: ${said(other)}`).join(' | '),
    );
  }
}

if (failures > 0) process.exitCode = 1;
