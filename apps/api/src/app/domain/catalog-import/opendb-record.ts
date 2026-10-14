import { Either, Option } from 'effect';

import { Category } from '../part/Category';
import { cleanPartNumbers } from '../part/part-numbers';
import { SpecificationProblem } from '../specification/Specification';
import { isPlainObject } from '../specification/specification-document';
import { specificationListOf } from '../specification/specification-lists';
import { isUuid } from '../uuid';
import { ImportPartParams } from './CatalogImportStore';
import { knownCopies } from './known-copies';
import { OpenDbFile } from './OpenDbSource';

// Why one of OpenDB's records was left out of the catalog. Its OpenDB ID is
// taken when another record read before it has the same one. A record with
// no manufacturer copies another when a record of the manufacturer its name
// begins with has one of its part numbers: at the pinned commit, 20 such
// records are thinner copies of a complete one.
export type RecordLeftOutReason =
  | 'notARecord'
  | 'noOpenDbId'
  | 'openDbIdNotTheFileName'
  | 'openDbIdTaken'
  | 'noName'
  | 'noManufacturer'
  | 'copiesAnotherRecord'
  | 'knownCopy';

// The Part a record makes, the values in the record that did not fit their
// specifications and were left out of the Part, and whether its manufacturer
// was taken from its name.
export type PartOfRecord = {
  part: ImportPartParams;
  valuesLeftOut: readonly SpecificationProblem[];
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
  // ignored, and only a value that is on the list and does not fit is counted.
  const { document, problems } = specificationListOf(category).check(
    withoutRedundantSocket(record, category),
  );

  return Either.right({
    part: new ImportPartParams(
      // The database writes a UUID in lower case, and gives it back so.
      openDbId.toLowerCase(),
      category,
      name,
      manufacturer,
      partNumbers,
      document,
    ),
    valuesLeftOut: problems.filter((problem) => problem.reason !== 'unknown'),
    manufacturerFromName,
  });
}
