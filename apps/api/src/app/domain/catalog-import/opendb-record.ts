import { isDeepStrictEqual } from 'node:util';

import { gpuPowerSockets, type Socket } from '@pcp/compatibility';
import { Either, Option } from 'effect';

import { Category } from '../part/Category';
import { cleanPartNumbers } from '../part/part-numbers';
import { SpecificationProblemReason } from '../specification/Specification';
import {
  isPlainObject,
  SpecificationDocument,
  valueAt,
} from '../specification/specification-document';
import { specificationListOf } from '../specification/specification-lists';
import { isUuid } from '../uuid';
import { ImportPartParams } from './CatalogImportStore';
import { knownCopies } from './known-copies';
import { OpenDbFile } from './OpenDbSource';

// Why one of OpenDB's records was left out of the catalog. Its OpenDB ID is
// taken when another record read before it has the same one. A record with
// no manufacturer copies another when a record of the manufacturer its name
// begins with has one of its part numbers: at the pinned commit, 20 such
// records are thinner copies of a complete one. A record that makes the same
// Part as one read before it in its folder gives that Part its part numbers.
export type RecordLeftOutReason =
  | 'notARecord'
  | 'noOpenDbId'
  | 'openDbIdNotTheFileName'
  | 'openDbIdTaken'
  | 'noName'
  | 'noManufacturer'
  | 'copiesAnotherRecord'
  | 'knownCopy'
  | 'sameAsAnotherRecord';

// Why a value in one of OpenDB's records was left out of its Part: it did not
// fit its specification, or the import reads it as not known, as it reads a
// power socket of a GPU above 75 W that holds 0 for each of its four, and an
// empty list of M.2 slots on a motherboard of a socket of 2017 or later.
export type ValueLeftOutReason =
  | SpecificationProblemReason
  | 'noPowerSocketAbove75W'
  | 'noM2SlotSince2017';

// A value left out of a Part, by its path, as a specification problem names
// it, and why.
export type ValueLeftOut = {
  path: string;
  reason: ValueLeftOutReason;
};

// The Part a record makes, the values in the record that were left out of the
// Part, and whether its manufacturer was taken from its name.
export type PartOfRecord = {
  part: ImportPartParams;
  valuesLeftOut: readonly ValueLeftOut[];
  manufacturerFromName: boolean;
};

// What the records of one folder that name their manufacturer say, for a
// record that names none: the manufacturers, each by its spelling in lower
// case and kept in the spelling most of them use, and each manufacturer's
// part numbers, all in lower case.
export type FolderRecords = {
  manufacturers: ReadonlyMap<string, string>;
  partNumbers: ReadonlyMap<string, ReadonlySet<string>>;
};

// A name or a manufacturer has to hold more than spaces, as the Admin's do.
const notBlank = /\S/;

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// OpenDB's part numbers, together with every manufacturer part number among
// its identifiers, because many records list theirs only there. Its other
// identifiers are barcodes, which are left behind.
function partNumbersOf(partNumbers: unknown, identifiers: unknown): string[] {
  const listed = Array.isArray(partNumbers) ? partNumbers.filter(isString) : [];
  const identified =
    isPlainObject(identifiers) && Array.isArray(identifiers.identifiers)
      ? identifiers.identifiers
          .filter(isPlainObject)
          .filter((identifier) => identifier.type === 'mpn')
          .map((identifier) => identifier.value)
          .filter(isString)
      : [];
  return cleanPartNumbers([...listed, ...identified]);
}

// The part numbers a Part keeps. OpenDB lists the name of some Parts among
// their part numbers, such as "AMD Ryzen 7 7800X3D" between two of its codes,
// and a Part keeps none that is its own name, in any case, since the name says
// it already. At the pinned commit 81 Parts list it, among them 18 motherboards
// whose makers use the model's name as its code, which keep no part number.
function partNumbersKept(partNumbers: readonly string[], name: string): string[] {
  const ownName = name.toLowerCase();
  return partNumbers.filter((partNumber) => partNumber.toLowerCase() !== ownName);
}

// Whether two records of a folder make the same Part: the same name and
// manufacturer, in any case, and the same specifications as a Part keeps them.
// OpenDB lists some Parts more than once, such as a CPU under its boxed codes
// in one record and its tray code in another, and no Shopper could tell such
// Parts apart: at the pinned commit 476 records make 234 Parts so. Records with
// one name whose specifications differ, by a timing, a colour or a cooler in
// the box, stay apart.
export function makeTheSamePart(one: ImportPartParams, other: ImportPartParams): boolean {
  return (
    one.getName().toLowerCase() === other.getName().toLowerCase() &&
    one.getManufacturer().toLowerCase() === other.getManufacturer().toLowerCase() &&
    isDeepStrictEqual(one.getSpecifications(), other.getSpecifications())
  );
}

// A Part with the part numbers of another record that makes the same Part,
// after its own, so that a Vendor finds it by any of them.
export function withPartNumbersOf(
  part: ImportPartParams,
  other: ImportPartParams,
): ImportPartParams {
  return new ImportPartParams(
    part.getOpenDbId(),
    part.getCategory(),
    part.getName(),
    part.getManufacturer(),
    partNumbersKept(
      cleanPartNumbers([...part.getPartNumbers(), ...other.getPartNumbers()]),
      part.getName(),
    ),
    part.getSpecifications(),
  );
}

// What a folder's records say of their manufacturers and part numbers.
export function folderRecordsOf(files: readonly OpenDbFile[]): FolderRecords {
  const counts = new Map<string, Map<string, number>>();
  const partNumbers = new Map<string, Set<string>>();
  for (const file of files) {
    const record = Option.getOrUndefined(file.getRecord());
    if (!isPlainObject(record)) continue;
    const metadata = isPlainObject(record.metadata) ? record.metadata : {};
    const { manufacturer } = metadata;
    if (!isString(manufacturer) || !notBlank.test(manufacturer)) continue;
    const spellings = counts.get(manufacturer.toLowerCase()) ?? new Map<string, number>();
    spellings.set(manufacturer, (spellings.get(manufacturer) ?? 0) + 1);
    counts.set(manufacturer.toLowerCase(), spellings);
    const ofTheManufacturer = partNumbers.get(manufacturer.toLowerCase()) ?? new Set();
    for (const partNumber of partNumbersOf(metadata.part_numbers, record.identifiers)) {
      ofTheManufacturer.add(partNumber.toLowerCase());
    }
    partNumbers.set(manufacturer.toLowerCase(), ofTheManufacturer);
  }
  return {
    manufacturers: new Map(
      [...counts].map(([key, spellings]) => [
        key,
        [...spellings].reduce((most, each) => (each[1] > most[1] ? each : most))[0],
      ]),
    ),
    partNumbers,
  };
}

// The manufacturer a name begins with, followed by a space, among those of its
// folder, in any case. The longest is taken, so that "Cooler Master MWE" is
// Cooler Master's and not a manufacturer called "Cooler".
function manufacturerInName(
  name: string,
  manufacturers: FolderRecords['manufacturers'],
): string | undefined {
  const start = name.toLowerCase();
  const found = [...manufacturers.keys()]
    .filter((key) => start.startsWith(`${key} `))
    .sort((one, other) => other.length - one.length);
  return found.length === 0 ? undefined : manufacturers.get(found[0]);
}

// A cooler that lists "LGA 1151v2" beside "LGA 1151" mounts the same way on
// both, so the variant, which the set of sockets does not hold, is dropped
// and the rest of the list is kept. Without "LGA 1151" beside it, the list
// keeps it, and is left out whole, so that a rule says it could not check
// rather than that a CPU the list leaves unnamed does not fit.
function withoutRedundantSocket(
  record: Record<string, unknown>,
  category: Category,
): Record<string, unknown> {
  const sockets = record.cpu_sockets;
  if (
    category !== Category.CPU_COOLER ||
    !Array.isArray(sockets) ||
    !sockets.includes('LGA 1151') ||
    !sockets.includes('LGA 1151v2')
  ) {
    return record;
  }
  return { ...record, cpu_sockets: sockets.filter((socket) => socket !== 'LGA 1151v2') };
}

// The most a PCIe slot supplies a GPU, in watts.
const slotPower = 75;

// A GPU that draws more than a PCIe slot supplies needs a power cable, yet
// OpenDB holds 0 for each of the four kinds of power socket of many such GPUs,
// where it does not know them: at the pinned commit 695 GPUs above 75 W, such
// as the Asus ROG STRIX GeForce RTX 3080 Ti at 350 W. Read as true, the zeros
// would let rule 11 pass such a GPU with any PSU. So the four are left out, as
// not known, and counted with a reason of their own, and Missing
// specifications asks for them once a Vendor offers the GPU. A GPU of 75 W or
// less with no socket keeps its zeros, since a slot powers it (299 GPUs at the
// pinned commit), and so does one whose TDP is missing (4). A GPU with any
// socket keeps all four counts as given. The reading is the import's alone:
// the Admin may give a GPU any counts.
function withoutPowerSocketsNotKnown(
  document: SpecificationDocument,
  category: Category,
): { document: SpecificationDocument; leftOut: ValueLeftOut[] } {
  const tdp = valueAt(document, 'tdp');
  if (
    category !== Category.GPU ||
    typeof tdp !== 'number' ||
    tdp <= slotPower ||
    !gpuPowerSockets.every(
      (socket) => valueAt(document, `power_connectors.${socket}`) === 0,
    )
  ) {
    return { document, leftOut: [] };
  }
  return {
    // Without its sockets, the Part holds no `power_connectors`, as one whose
    // record gives no count does: the four kinds, which the compatibility
    // library names, are all a GPU's list holds there.
    document: Object.fromEntries(
      Object.entries(document).filter(([name]) => name !== 'power_connectors'),
    ),
    leftOut: gpuPowerSockets.map((socket) => ({
      path: `power_connectors.${socket}`,
      reason: 'noPowerSocketAbove75W',
    })),
  };
}

// The sockets that came in 2017 or later, each with the year its first boards
// were sold on their own. AM4's first CPUs went only into prebuilt PCs in
// 2016, and its boards were first sold with Ryzen. LGA 3647's first boards,
// for Xeon Phi, came in 2016, so it is not among them. LGA 1954 is Intel's
// socket after LGA 1851, which only coolers name at the pinned commit.
const socketsOf2017OrLater: ReadonlyMap<string, number> = new Map<Socket, number>([
  ['AM4', 2017],
  ['AM5', 2022],
  ['LGA 1200', 2020],
  ['LGA 1700', 2021],
  ['LGA 1851', 2024],
  ['LGA 1954', 2026],
  ['LGA 2066', 2017],
  ['LGA 4677', 2023],
  ['LGA 4710', 2024],
  ['SP3', 2017],
  ['SP5', 2022],
  ['SP6', 2023],
  ['sTR4', 2017],
  ['sTR5', 2023],
  ['sTRX4', 2019],
  ['sWRX8', 2021],
  ['TR4', 2017],
]);

// OpenDB gives an empty list of M.2 slots for many motherboards, some of them
// boards that have slots it does not know: at the pinned commit 723 boards,
// 36 of them of a socket of 2017 or later, such as the ASRock X570 Taichi and
// two ASRock B860 Challenger WiFi boards. Read as a board with no slot, the
// list would make rule 14 find a Problem in any M.2 drive on such a board. So
// on a board of a socket of 2017 or later, where 2,273 of the 2,309 boards at
// the pinned commit list their slots, an empty list is left out, as not
// known, and counted with a reason of its own, and Missing specifications
// asks for it once a Vendor offers the board (the owner's decision of 8
// November 2026). A board of an older socket keeps its empty list as one with
// no slot, as does a board with its CPU built in and one whose socket is
// missing: 687 boards at the pinned commit, 9 of them with a CPU built in. A
// list with slots is kept as given. The reading is the import's alone: the
// Admin may give any board an empty list.
function withoutM2SlotsNotKnown(
  document: SpecificationDocument,
  category: Category,
): { document: SpecificationDocument; leftOut: ValueLeftOut[] } {
  const socket = valueAt(document, 'socket');
  const slots = valueAt(document, 'm2_slots');
  if (
    category !== Category.MOTHERBOARD ||
    typeof socket !== 'string' ||
    !socketsOf2017OrLater.has(socket) ||
    !Array.isArray(slots) ||
    slots.length > 0
  ) {
    return { document, leftOut: [] };
  }
  return {
    document: Object.fromEntries(
      Object.entries(document).filter(([name]) => name !== 'm2_slots'),
    ),
    leftOut: [{ path: 'm2_slots', reason: 'noM2SlotSince2017' }],
  };
}

// The Part of a Category that one of OpenDB's records makes, or why it is
// left out. A record makes a Part when it has an OpenDB ID that is its file's
// name, a name and a manufacturer. A record that names no manufacturer takes
// the one its name begins with, among those of its folder's other records,
// unless it copies one of them.
export function partOfRecord(
  file: OpenDbFile,
  category: Category,
  folder: FolderRecords,
): Either.Either<PartOfRecord, RecordLeftOutReason> {
  const record = Option.getOrUndefined(file.getRecord());
  if (!isPlainObject(record)) return Either.left('notARecord');

  const openDbId = record.opendb_id;
  if (!isString(openDbId) || !isUuid(openDbId)) return Either.left('noOpenDbId');
  if (file.getName() !== `${openDbId}.json`) return Either.left('openDbIdNotTheFileName');
  if (knownCopies.has(openDbId.toLowerCase())) return Either.left('knownCopy');

  const metadata = isPlainObject(record.metadata) ? record.metadata : {};
  const { name, manufacturer: named } = metadata;
  if (!isString(name) || !notBlank.test(name)) return Either.left('noName');
  const partNumbers = partNumbersOf(metadata.part_numbers, record.identifiers);
  const manufacturerFromName = !isString(named) || !notBlank.test(named);
  const manufacturer = manufacturerFromName
    ? manufacturerInName(name, folder.manufacturers)
    : named;
  if (manufacturer === undefined) return Either.left('noManufacturer');
  // A record of another manufacturer with one of its part numbers makes it
  // no copy, because OpenDB gives some records another make's part number by
  // mistake.
  const ofTheManufacturer = folder.partNumbers.get(manufacturer.toLowerCase());
  if (
    manufacturerFromName &&
    partNumbers.some((partNumber) => ofTheManufacturer?.has(partNumber.toLowerCase()))
  ) {
    return Either.left('copiesAnotherRecord');
  }

  // The whole record is checked against the Category's list, which keeps what
  // it names. The metadata, the identifiers and the retailer data are not on
  // it, and neither is anything else the list does not name. Those are
  // ignored, and only a value that is on the list and does not fit is counted,
  // beside a GPU's power sockets and a motherboard's M.2 slots that are read
  // as not known.
  const { document: checked, problems } = specificationListOf(category).check(
    withoutRedundantSocket(record, category),
  );
  const powerSockets = withoutPowerSocketsNotKnown(checked, category);
  const m2Slots = withoutM2SlotsNotKnown(powerSockets.document, category);

  return Either.right({
    part: new ImportPartParams(
      // The database writes a UUID in lower case, and gives it back so.
      openDbId.toLowerCase(),
      category,
      name,
      manufacturer,
      // The copy check above reads the whole list, the name among it, because
      // a record with no manufacturer may share only a complete record's name
      // with it: at the pinned commit, one does.
      partNumbersKept(partNumbers, name),
      m2Slots.document,
    ),
    valuesLeftOut: [
      ...problems.filter((problem) => problem.reason !== 'unknown'),
      ...powerSockets.leftOut,
      ...m2Slots.leftOut,
    ],
    manufacturerFromName,
  });
}
