// The frontends' import bans, stated once. Both frontends follow
// Feature-Sliced Design (ADR-0004), and each takes these bans with its own
// names for the layers' folders.
//
// Oxlint reads its configuration as JSON and cannot work the bans out for
// itself, so `pnpm boundaries:write` writes them for each frontend into a
// file that the frontend's lint configuration extends. `pnpm boundaries:check`
// fails when a written file no longer matches what is stated here.

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
  layer:
    'A layer may not import from a layer above it. From the top, the layers are App, Pages, Widgets, Features, Entities and Shared. Move what is needed down to a layer both may import, or join the two on the higher layer.',
  slice:
    'A slice may not import another slice on its own layer. Join the two on a layer above. Inside one slice, use a relative import.',
  index:
    'Nothing is imported past an index file. Import a slice as `@/<layer>/<slice>` and a segment of the Shared layer as `@/shared/<segment>`, and export what is needed from that index file.',
  climb:
    'A relative import may not leave its own slice. Import another slice through the `@/` alias, where the layer rules apply.',
  depth:
    "A file at this depth may not climb with a relative import. The bans follow a climb from a slice's own folder, from a segment and from one folder inside a segment, and from nowhere else. Keep the file within that depth, or raise the depth where the bans are stated.",
  crossing:
    'A relative import may not cross into another layer. Use the `@/` alias, where the layer rules apply.',
  routing:
    "Next's routing folder only routes. A route file takes a page from the Pages layer or a layout from the App layer, through its index file, and imports nothing else from the project.",
};

// How many folders below a slice a climbing relative import is followed: the
// slice's own folder, a segment, and one folder inside a segment.
const followedDepth = 3;

// One block of an Oxlint configuration: these files get these patterns. When
// two blocks match a file, the later one replaces the earlier one's patterns,
// so every block holds all the bans for its files.
function block(files, patterns) {
  return { files, rules: { 'no-restricted-imports': ['error', { patterns }] } };
}

// Everything behind a layer's index files. A slice has an index file, and so
// has each segment of the Shared layer. The App layer has one for the whole
// layer.
function pastTheIndex({ folder, indexed }) {
  return indexed === 'layer' ? `@/${folder}/**` : `@/${folder}/*/**`;
}

// The patterns of a file in the layer at `index`, for an import written with
// the `@/` alias.
function aliasPatterns(layers, index) {
  const own = layers[index];
  const above = layers.slice(0, index);
  const below = layers.slice(index + 1);
  const patterns = [];
  if (above.length > 0) {
    patterns.push({
      group: above.flatMap(({ folder }) => [`@/${folder}`, `@/${folder}/**`]),
      message: messages.layer,
    });
  }
  // Imports inside a slice are relative, so an alias import of a file's own
  // layer is an import of another slice.
  if (own.sliced) {
    patterns.push({
      group: [`@/${own.folder}`, `@/${own.folder}/**`],
      message: messages.slice,
    });
  }
  // What is left is what the file may import: the layers below, and its own
  // layer when that has no slices. Each only through an index file.
  patterns.push({
    group: [...(own.sliced ? [] : [own]), ...below].map(pastTheIndex),
    message: messages.index,
  });
  return patterns;
}

// The bans for one frontend, as the content of the file it extends.
export function featureSlicedBans({ app, pages, routing }) {
  // From the top. The App and Shared layers have segments and no slices.
  const layers = [
    { folder: app, sliced: false, indexed: 'layer' },
    { folder: pages, sliced: true, indexed: 'slice' },
    { folder: 'widgets', sliced: true, indexed: 'slice' },
    { folder: 'features', sliced: true, indexed: 'slice' },
    { folder: 'entities', sliced: true, indexed: 'slice' },
    { folder: 'shared', sliced: false, indexed: 'segment' },
  ];
  const overrides = layers.flatMap((own, index) => {
    const alias = aliasPatterns(layers, index);
    const folder = `src/${own.folder}`;
    const others = layers.filter((each) => each !== own).map((each) => each.folder);
    const crossing = {
      regex: `^(\\.\\./)+(${others.join('|')})(/|$)`,
      message: messages.crossing,
    };
    if (!own.sliced) return [block([`${folder}/**`], [...alias, crossing])];
    // A relative import leaves its slice when it climbs as many folders as the
    // file is below the layer, and a pattern cannot count that for itself. So
    // there is a block for each depth that is followed, and the first block,
    // which the later ones replace, lets a file at any other depth climb
    // nowhere.
    const climbs = (depth, message) => ({ regex: `^(\\.\\./){${depth}}`, message });
    const blocks = [block([`${folder}/**`], [...alias, climbs(1, messages.depth)])];
    for (let depth = 1; depth <= followedDepth; depth += 1) {
      blocks.push(
        block(
          [`${folder}/${'*/'.repeat(depth)}*`],
          [...alias, climbs(depth, messages.climb)],
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
          {
            group: lower.flatMap(({ folder }) => [`@/${folder}`, `@/${folder}/**`]),
            message: messages.routing,
          },
          { group: [appLayer, pagesLayer].map(pastTheIndex), message: messages.index },
          { regex: '^(\\.\\./)+src(/|$)', message: messages.crossing },
        ],
      ),
    );
  }
  return { overrides };
}
