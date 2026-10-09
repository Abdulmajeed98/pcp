// The frontends' import bans, stated once. Both frontends follow
// Feature-Sliced Design (ADR-0004), and each takes these bans with its own
// names for the layers' folders.
//
// Oxlint reads its configuration as JSON and cannot work the bans out for
// itself, so `pnpm boundaries:write` writes them for each frontend into a
// file that the frontend's lint configuration extends. `pnpm check` fails
// when a written file no longer matches what is stated here.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

// The file the bans are written to, in each frontend's folder.
export const writtenFile = '.oxlintrc.feature-sliced.json';

// In the Shopper app Next.js keeps the names `app` and `pages` for itself, so
// its App and Pages layers are `_app` and `_pages`. `routing` is Next's own
// routing folder, which sits beside `src`, outside the layers.
export const frontends = [
  { folder: 'apps/dashboard', app: 'app', pages: 'pages' },
  { folder: 'apps/shopper', app: '_app', pages: '_pages', routing: 'app' },
];

const messages = {
  alias:
    'The `@/` alias reaches the six layers and nothing else. From the top they are App, Pages, Widgets, Features, Entities and Shared. Put the file in one of them.',
  layer:
    'A layer may not import from a layer above it. From the top, the layers are App, Pages, Widgets, Features, Entities and Shared. Move what is needed down to a layer both may import, or join the two on the higher layer.',
  slice:
    'A slice may not import another slice on its own layer. Join the two on a layer above. Inside one slice, use a relative import.',
  index:
    'Nothing is imported past an index file. Import a slice as `@/<layer>/<slice>` and a segment of the Shared layer as `@/shared/<segment>`, and export what is needed from that index file.',
  shortest:
    'A relative import is written in its shortest form: any climbing first, as `../`, and no `.` or `..` after it. The bans count how far an import climbs and cannot follow a longer spelling.',
  leavingSlice:
    'A relative import may not leave its own slice. Import another slice through the `@/` alias, where the layer rules apply.',
  leavingLayer:
    'A relative import may not leave its own layer. Import another layer through the `@/` alias, where the layer rules apply.',
  depth:
    'A file at this depth may not climb with a relative import. The bans follow a climb down to one folder inside a segment and no further. Keep the file within that depth, or raise the depth where the bans are stated.',
  loose:
    'A layer that has slices holds slices and no files of its own. Move this file into a slice.',
  routing:
    "Next's routing folder only routes. A route file takes a page from the Pages layer or a layout from the App layer, through its index file, and imports nothing else from the project.",
  routingPath:
    'A route file reaches the layers through the `@/` alias and never by a relative path.',
};

// How far below its home a file's climbing relative import is followed. Home
// is the slice, or the layer when the layer has no slices. The three depths
// are the home folder itself, a segment, and one folder inside a segment.
const followedDepth = 3;

// One block of an Oxlint configuration: these files get these patterns. When
// two blocks match a file, the later one replaces the earlier one's patterns,
// so every block holds all the bans for its files.
function block(files, patterns) {
  return { files, rules: { 'no-restricted-imports': ['error', { patterns }] } };
}

// A regular expression for one path segment that is none of `names`. Rust's
// regular expressions have no lookahead, so it is spelled out. A segment is
// none of the names when it leaves their spelling at some letter, or stops
// short of one.
function segmentOtherThan(names) {
  const prefixes = new Set(['']);
  for (const name of names) {
    for (let length = 1; length <= name.length; length += 1) {
      prefixes.add(name.slice(0, length));
    }
  }
  const alternatives = [];
  for (const prefix of prefixes) {
    const next = names
      .filter((name) => name.startsWith(prefix) && name.length > prefix.length)
      .map((name) => name[prefix.length]);
    alternatives.push(`${prefix}[^/${[...new Set(next)].join('')}][^/]*`);
    if (prefix !== '' && !names.includes(prefix)) alternatives.push(prefix);
  }
  return `(${alternatives.join('|')})`;
}

// A whole layer: its folder and everything in it.
function wholeLayer({ folder }) {
  return [`@/${folder}`, `@/${folder}/**`];
}

// What an import of a layer may not name. A slice has an index file, and so
// has each segment of the Shared layer: the layer with nothing after it is
// refused, and so is anything behind an index file. The App layer has one
// index file for the whole layer.
function pastTheIndex({ folder, oneIndex }) {
  return oneIndex ? [`@/${folder}/**`] : [`@/${folder}`, `@/${folder}/*/**`];
}

// An alias import of a folder in `src` that is not one of the layers.
function outsideTheLayers(layers) {
  return {
    regex: `^@/${segmentOtherThan(layers.map(({ folder }) => folder))}(/|$)`,
    message: messages.alias,
  };
}

// The patterns of a file in the layer at `index`, for an import written with
// the `@/` alias.
function aliasPatterns(layers, index) {
  const own = layers[index];
  const above = layers.slice(0, index);
  const below = layers.slice(index + 1);
  const patterns = [outsideTheLayers(layers)];
  if (above.length > 0) {
    patterns.push({ group: above.flatMap(wholeLayer), message: messages.layer });
  }
  // Imports inside a slice are relative, so an alias import of a file's own
  // layer is an import of another slice.
  if (own.sliced) patterns.push({ group: wholeLayer(own), message: messages.slice });
  // What is left is what the file may import: the layers below, and its own
  // layer when that has no slices. Each only through an index file.
  patterns.push({
    group: [...(own.sliced ? [] : [own]), ...below].flatMap(pastTheIndex),
    message: messages.index,
  });
  return patterns;
}

// A relative import that is not in its shortest form: one that starts with
// `./` and then climbs, one with a `.` in the middle, and one that climbs
// after it has gone down. The bans below count the `../` an import starts
// with, and each of these would get past that count.
const notInShortestForm = {
  regex: '^\\./\\.\\.?(/|$)|/\\.(/|$)|^(\\.\\.?/)*[^/]*[^./][^/]*/(.*/)?\\.\\.(/|$)',
  message: messages.shortest,
};

// A relative import that climbs at least `folders` folders.
function climbing(folders, message) {
  return { regex: `^${'\\.\\./'.repeat(folders - 1)}\\.\\.(/|$)`, message };
}

// The bans for one frontend, as the content of the file it extends.
export function featureSlicedBans({ app, pages, routing }) {
  // From the top. The App and Shared layers have segments and no slices.
  const layers = [
    { folder: app, sliced: false, oneIndex: true },
    { folder: pages, sliced: true },
    { folder: 'widgets', sliced: true },
    { folder: 'features', sliced: true },
    { folder: 'entities', sliced: true },
    { folder: 'shared', sliced: false },
  ];
  const overrides = layers.flatMap((own, index) => {
    const alias = aliasPatterns(layers, index);
    const layer = `src/${own.folder}`;
    const home = own.sliced ? `${layer}/*` : layer;
    const leaving = own.sliced ? messages.leavingSlice : messages.leavingLayer;
    // A relative import leaves its home when it climbs as many folders as the
    // file is below it, and a pattern cannot count that for itself. So there
    // is a block for each depth that is followed. The first block, which the
    // later ones replace, lets a file at any other depth climb nowhere.
    const blocks = [
      block([`${layer}/**`], [...alias, notInShortestForm, climbing(1, messages.depth)]),
    ];
    // A file put straight into a layer that has slices belongs to no slice.
    if (own.sliced) {
      blocks.push(
        block([`${layer}/*`], [...alias, { regex: '^\\.', message: messages.loose }]),
      );
    }
    for (let depth = 1; depth <= followedDepth; depth += 1) {
      blocks.push(
        block(
          [`${home}/${'*/'.repeat(depth - 1)}*`],
          [...alias, notInShortestForm, climbing(depth, leaving)],
        ),
      );
    }
    return blocks;
  });
  if (routing !== undefined) {
    const [appLayer, pagesLayer, ...lower] = layers;
    overrides.push(
      block(
        [`${routing}/**`],
        [
          outsideTheLayers(layers),
          { group: lower.flatMap(wholeLayer), message: messages.routing },
          { group: [appLayer, pagesLayer].flatMap(pastTheIndex), message: messages.index },
          notInShortestForm,
          { regex: '^(\\.\\./)+(.*/)?src(/|$)', message: messages.routingPath },
        ],
      ),
    );
  }
  return { overrides };
}

// Whether a frontend's written file holds the bans as they are stated here.
export function isWritten(root, frontend) {
  const path = join(root, frontend.folder, writtenFile);
  if (!existsSync(path)) return false;
  return isDeepStrictEqual(
    JSON.parse(readFileSync(path, 'utf8')),
    featureSlicedBans(frontend),
  );
}
