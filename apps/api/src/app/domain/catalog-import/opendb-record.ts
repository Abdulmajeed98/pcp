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

// The Part a record makes, and the values in the record that did not fit
// their specifications and were left out of the Part.
export type PartOfRecord = {
  part: ImportPartParams;
  valuesLeftOut: readonly SpecificationProblem[];
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

// The Part of a Category that one of OpenDB's records makes, or why it is
// left out. A record makes a Part when it has an OpenDB ID that is its file's
// name, a name and a manufacturer.
export function partOfRecord(
  file: OpenDbFile,
  category: Category,
): Either.Either<PartOfRecord, RecordLeftOutReason> {
  const record = Option.getOrUndefined(file.getRecord());
  if (!isPlainObject(record)) return Either.left('notARecord');

  const openDbId = record.opendb_id;
  if (!isString(openDbId) || !isUuid(openDbId)) return Either.left('noOpenDbId');
  if (file.getName() !== `${openDbId}.json`) return Either.left('openDbIdNotTheFileName');

  const metadata = isPlainObject(record.metadata) ? record.metadata : {};
  const { name, manufacturer } = metadata;
  if (!isString(name) || !notBlank.test(name)) return Either.left('noName');
  if (!isString(manufacturer) || !notBlank.test(manufacturer)) {
    return Either.left('noManufacturer');
  }

  // The whole record is checked against the Category's list, which keeps what
  // it names. The metadata, the identifiers and the retailer data are not on
  // it, and neither is anything else the list does not name. Those are
  // ignored, and only a value that is on the list and does not fit is counted.
  const { document, problems } = specificationListOf(category).check(record);

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
  });
}
