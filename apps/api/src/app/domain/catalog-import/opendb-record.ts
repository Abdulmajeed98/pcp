import { Either, Option } from 'effect';

import { Category } from '../part/Category';
import { cleanPartNumbers } from '../part/part-numbers';
import { SpecificationProblem } from '../specification/Specification';
import { isPlainObject } from '../specification/specification-document';
import { specificationListOf } from '../specification/specification-lists';
import { isUuid } from '../uuid';
import { ImportPartParams } from './CatalogImportStore';
import { OpenDbFile } from './OpenDbSource';

// Why one of OpenDB's records was left out of the catalog. Its OpenDB ID is
// taken when another record read before it has the same one.
export type RecordLeftOutReason =
  | 'notARecord'
  | 'noOpenDbId'
  | 'openDbIdNotTheFileName'
  | 'openDbIdTaken'
  | 'noName'
  | 'noManufacturer';

// The Part a record makes, the values in the record that did not fit their
// specifications and were left out of the Part, and whether its manufacturer
// was taken from its name.
export type PartOfRecord = {
  part: ImportPartParams;
  valuesLeftOut: readonly SpecificationProblem[];
  manufacturerFromName: boolean;
};

// The manufacturers the records of one folder name, each by its spelling in
// lower case. Where they spell one in several ways, the spelling most of them
// use is kept.
export type FolderManufacturers = ReadonlyMap<string, string>;

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

// The manufacturers of a folder's records, for a record that names none.
export function manufacturersOf(files: readonly OpenDbFile[]): FolderManufacturers {
  const counts = new Map<string, Map<string, number>>();
  for (const file of files) {
    const record = Option.getOrUndefined(file.getRecord());
    const metadata =
      isPlainObject(record) && isPlainObject(record.metadata) ? record.metadata : {};
    const { manufacturer } = metadata;
    if (!isString(manufacturer) || !notBlank.test(manufacturer)) continue;
    const spellings = counts.get(manufacturer.toLowerCase()) ?? new Map<string, number>();
    spellings.set(manufacturer, (spellings.get(manufacturer) ?? 0) + 1);
    counts.set(manufacturer.toLowerCase(), spellings);
  }
  return new Map(
    [...counts].map(([key, spellings]) => [
      key,
      [...spellings].reduce((most, each) => (each[1] > most[1] ? each : most))[0],
    ]),
  );
}

// The manufacturer a name begins with, followed by a space, among those of its
// folder, in any case. The longest is taken, so that "Cooler Master MWE" is
// Cooler Master's and not a manufacturer called "Cooler".
function manufacturerInName(
  name: string,
  manufacturers: FolderManufacturers,
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
// the one its name begins with, among those of its folder's other records.
export function partOfRecord(
  file: OpenDbFile,
  category: Category,
  manufacturers: FolderManufacturers,
): Either.Either<PartOfRecord, RecordLeftOutReason> {
  const record = Option.getOrUndefined(file.getRecord());
  if (!isPlainObject(record)) return Either.left('notARecord');

  const openDbId = record.opendb_id;
  if (!isString(openDbId) || !isUuid(openDbId)) return Either.left('noOpenDbId');
  if (file.getName() !== `${openDbId}.json`) return Either.left('openDbIdNotTheFileName');

  const metadata = isPlainObject(record.metadata) ? record.metadata : {};
  const { name, manufacturer: named } = metadata;
  if (!isString(name) || !notBlank.test(name)) return Either.left('noName');
  const manufacturerFromName = !isString(named) || !notBlank.test(named);
  const manufacturer = manufacturerFromName
    ? manufacturerInName(name, manufacturers)
    : named;
  if (manufacturer === undefined) return Either.left('noManufacturer');

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
      partNumbersOf(metadata.part_numbers, record.identifiers),
      document,
    ),
    valuesLeftOut: problems.filter((problem) => problem.reason !== 'unknown'),
    manufacturerFromName,
  });
}
