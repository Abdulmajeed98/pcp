import { SpecificationDocument } from '~/domain/specification/specification-document';

import { part } from './part.schema';

// What the Admin or the import gives a Part, as each Store's params hold it.
type PartFields = {
  getName(): string;
  getManufacturer(): string;
  getPartNumbers(): readonly string[];
  getSpecifications(): SpecificationDocument;
};

type PartColumns = Pick<
  typeof part.$inferInsert,
  'name' | 'manufacturer' | 'partNumbers' | 'specifications' | 'searchText'
>;

// The columns every Store writes when it writes those fields. The search text
// is the name, the manufacturer and the part numbers, in lower case. It is
// stored beside them, because an index cannot be made on the list of part
// numbers joined in a query, and it is made here so that every Part a Store
// writes can be found the same way.
export function columnsOf(fields: PartFields): PartColumns {
  const partNumbers = [...fields.getPartNumbers()];
  return {
    name: fields.getName(),
    manufacturer: fields.getManufacturer(),
    partNumbers,
    specifications: fields.getSpecifications(),
    searchText: [fields.getName(), fields.getManufacturer(), ...partNumbers]
      .join(' ')
      .toLowerCase(),
  };
}
