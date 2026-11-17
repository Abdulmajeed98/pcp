import type { BuildPartResponse } from '@pcp/api-client';

// A Category, by the API's own key for it.
export type Category = BuildPartResponse['category'];

// The two Categories a Build holds any number of, each Part with how many of
// it the Build holds (BLD-1).
export type KitOrDrive = 'ram' | 'storage';

// The six Categories a Build holds one Part of at most.
export type HoldsOne = Exclude<Category, KitOrDrive>;

// One Part of a Build: its identifier under its Category, and for a RAM kit
// or a drive how many of it the Build holds, from 1 to 16.
export type BuildPart =
  | { category: HoldsOne; part: string }
  | { category: KitOrDrive; part: string; quantity: number };

// A Shopper's Build, as their browser keeps it: its Parts by their
// identifiers, in the order they were chosen. It holds no name, price or
// specification, which the API answers for each request.
export type Build = readonly BuildPart[];

// The limits that keep the cookie small, which the API holds a Build to as
// well: at most 8 different RAM kits and 8 different drives, each held 1 to
// 16 times.
export const mostKitsOrDrives = 8;
export const mostOfOne = 16;

// What each Category holds: one Part, or any number of kits or drives. The
// map holds every key the API knows, so that a Category the API adds and this
// map lacks fails the type check.
const holds = {
  cpu: 'one',
  cpuCooler: 'one',
  motherboard: 'one',
  ram: 'many',
  storage: 'many',
  gpu: 'one',
  case: 'one',
  psu: 'one',
} as const satisfies Record<Category, 'one' | 'many'>;

export function isCategory(text: string): text is Category {
  return Object.hasOwn(holds, text);
}

export function isKitOrDrive(category: Category): category is KitOrDrive {
  return holds[category] === 'many';
}

// A Part's identifier, as the API writes it: a UUID, in small letters. One
// written in capitals is the same identifier.
const identifier = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function identifierIn(text: string): string | undefined {
  const lower = text.toLowerCase();
  return identifier.test(lower) ? lower : undefined;
}

// A quantity a Build can hold: a whole number from 1 to 16, in Western digits
// with no sign, or none.
export function quantityIn(text: string): number | undefined {
  if (!/^[0-9]{1,2}$/.test(text)) return undefined;
  const quantity = Number(text);
  return quantity >= 1 && quantity <= mostOfOne ? quantity : undefined;
}

// The `build` cookie's text: one entry for each Part, in the Build's order,
// joined by commas. An entry is the Category's key and the Part's identifier
// joined by a colon, `cpu:<identifier>`, and for a RAM kit or a drive its
// quantity after another, `ram:<identifier>:2`.
export function writeTheBuild(build: Build): string {
  return build
    .map((each) =>
      'quantity' in each
        ? `${each.category}:${each.part}:${each.quantity}`
        : `${each.category}:${each.part}`,
    )
    .join(',');
}

// The Build as the API reads it, `GET v1/build`'s query and the picker's
// `part`: each Part's identifier, in the Build's order, followed for a RAM
// kit or a drive by `:` and its quantity. The Shopper app's server sends it;
// the browser never calls the API. A Build its forms wrote is never one the
// API refuses, but a cookie edited by hand can be: its entries are read by
// their Categories as the cookie names them, which the catalog may not, as
// a RAM kit filed under the CPU, and the API then refuses the Build. The
// Build page then offers to empty it (`refusesTheBuild`).
export function partValuesOf(build: Build): string[] {
  return build.map((each) =>
    'quantity' in each ? `${each.part}:${each.quantity}` : each.part,
  );
}

// The Build as the catalog holds it: its Parts whose identifiers the API
// answered when it read the Build, in their order, each with its quantity.
// A Part the catalog no longer holds is left out of the API's answer, so its
// Category shows as not chosen, and a change keeps the Build so before it
// applies itself, so that the cookie forgets the Part then and a vanished
// kit or drive counts toward no limit (the builder spec's The Build in the
// Shopper's browser).
export function heldByTheCatalog(build: Build, answered: readonly string[]): Build {
  return build.filter((each) => answered.includes(each.part));
}

// The catalog's order of the eight Categories, which a Shared Build's
// values and the API's answer of a Build keep (BLD-1, the catalog's fixed
// order).
const inTheCatalogsOrder = Object.keys(holds) as Category[];

// Whether the Build is a Shared Build, whose frozen `part` values the API
// stores as `GET v1/build` takes them: the same Parts, each with the same
// quantity, in the catalog's order of Categories and then the Build's order
// for kits and drives. A browser's Build keeps its Parts in the order they
// were picked, so it is set in the catalog's order of Categories first,
// keeping its own order of kits and of drives, which the API counts: kits in
// another order are another Shared Build. An identifier is read in small
// letters, as the API reads it. An empty Build is never one, since no Shared
// Build is empty.
export function holdsTheSharedBuild(build: Build, shared: readonly string[]): boolean {
  const placeOf = (category: Category) => inTheCatalogsOrder.indexOf(category);
  const values = partValuesOf(
    build.toSorted((one, other) => placeOf(one.category) - placeOf(other.category)),
  );
  return (
    values.length > 0 &&
    values.length === shared.length &&
    values.every((value, place) => value === shared[place]?.toLowerCase())
  );
}

// A copy of a Shared Build, as the browser keeps a Build: its frozen `part`
// values, in their order, each Part under the Category the API answers it
// in when it reads them (`GET v1/build`), and a kit or a drive with its
// quantity. A Part the catalog no longer holds is left out of the API's
// answer, so it is left out of the copy, as a change keeps only the Parts
// the API answers (`heldByTheCatalog`), and the copy is within the cookie's
// limits, since the Shared Build was read within them.
export function copyOfTheSharedBuild(
  shared: readonly string[],
  answered: readonly Pick<BuildPartResponse, 'id' | 'category'>[],
): Build {
  const categories = new Map(answered.map(({ id, category }) => [id, category]));
  return shared.flatMap((value): BuildPart[] => {
    const [partText = '', quantityText = ''] = value.split(':');
    const part = identifierIn(partText);
    const category = part === undefined ? undefined : categories.get(part);
    if (part === undefined || category === undefined) return [];
    if (!isKitOrDrive(category)) return [{ category, part }];
    const quantity = quantityIn(quantityText);
    return quantity === undefined ? [] : [{ category, part, quantity }];
  });
}

// How many Parts the Build holds, as the frame's way to the Build page, the
// Build's slip and its one confirmation say it: each Part once, whatever its
// quantity, as the Build's sheet lists each once (DESIGN.md's The way to the
// Build). It counts the Build as its cookie holds it, or its Parts as the API
// answers them, each a kit's or a drive's with its quantity.
export function partsCountedIn(
  parts: Build | readonly Pick<BuildPartResponse, 'quantity'>[],
): number {
  return parts.length;
}

// Reads the Build from its cookie's text, and never refuses it: a cookie the
// platform did not write, or one an older version did, is read as what can
// be read of it. Each entry that cannot be read is dropped: an identifier
// that is not one, a quantity outside 1 to 16 or on a Part of a Category
// that holds one, a kit or a drive with none, a Category that is not one of
// the eight, a second Part for a Category that holds one, a Part repeated,
// and a kit or a drive past the 8th of its Category.
export function readTheBuild(text: string | undefined): Build {
  const build: BuildPart[] = [];
  for (const entry of (text ?? '').split(',')) {
    const part = entryIn(entry);
    if (part !== undefined && hasRoomFor(build, part)) build.push(part);
  }
  return build;
}

function entryIn(entry: string): BuildPart | undefined {
  const [category, partText, quantityText, ...more] = entry.split(':');
  if (category === undefined || !isCategory(category) || more.length > 0) {
    return undefined;
  }
  const part = identifierIn(partText ?? '');
  if (part === undefined) return undefined;
  if (!isKitOrDrive(category)) {
    return quantityText === undefined ? { category, part } : undefined;
  }
  const quantity = quantityIn(quantityText ?? '');
  return quantity === undefined ? undefined : { category, part, quantity };
}

// Whether a Part read can join the Build read so far: it is not there yet,
// under any Category, and its Category has room for it.
function hasRoomFor(build: Build, part: BuildPart): boolean {
  if (build.some((each) => each.part === part.part)) return false;
  const ofItsCategory = build.filter((each) => each.category === part.category);
  return isKitOrDrive(part.category)
    ? ofItsCategory.length < mostKitsOrDrives
    : ofItsCategory.length === 0;
}
