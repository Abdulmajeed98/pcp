import { Category } from '../part/Category';
import { SpecificationProblemReason } from '../specification/Specification';
import { RecordLeftOutReason } from './opendb-record';

// A record the import left out: its file, as `CPU/<opendb_id>.json`, and why.
export class RecordLeftOut {
  constructor(
    private readonly file: string,
    private readonly reason: RecordLeftOutReason,
  ) {}

  getFile(): string {
    return this.file;
  }

  getReason(): RecordLeftOutReason {
    return this.reason;
  }
}

// How many values of one specification were left out for one reason. A field
// of a row is named with `*` for the row: `pcie_slots.*.lanes`.
export class ValuesLeftOut {
  constructor(
    private readonly specification: string,
    private readonly reason: SpecificationProblemReason,
    private readonly count: number,
  ) {}

  getSpecification(): string {
    return this.specification;
  }

  getReason(): SpecificationProblemReason {
    return this.reason;
  }

  getCount(): number {
    return this.count;
  }
}

// A record whose manufacturer was taken from its name: its file, as
// `CPU/<opendb_id>.json`, and the manufacturer.
export class ManufacturerFromName {
  constructor(
    private readonly file: string,
    private readonly manufacturer: string,
  ) {}

  getFile(): string {
    return this.file;
  }

  getManufacturer(): string {
    return this.manufacturer;
  }
}

// What the import did with one Category's records: the Parts it created, the
// records whose Part the catalog already held, the records it left out, the
// values it left out of the Parts it created, and which of those Parts took
// their manufacturer from their name.
export class CategoryImport {
  constructor(
    private readonly category: Category,
    private readonly imported: number,
    private readonly alreadyThere: number,
    private readonly recordsLeftOut: readonly RecordLeftOut[],
    private readonly valuesLeftOut: readonly ValuesLeftOut[],
    private readonly manufacturersFromNames: readonly ManufacturerFromName[],
  ) {}

  getCategory(): Category {
    return this.category;
  }

  getImported(): number {
    return this.imported;
  }

  getAlreadyThere(): number {
    return this.alreadyThere;
  }

  getRecordsLeftOut(): readonly RecordLeftOut[] {
    return this.recordsLeftOut;
  }

  getValuesLeftOut(): readonly ValuesLeftOut[] {
    return this.valuesLeftOut;
  }

  getManufacturersFromNames(): readonly ManufacturerFromName[] {
    return this.manufacturersFromNames;
  }

  getValuesLeftOutCount(): number {
    return this.valuesLeftOut.reduce((sum, values) => sum + values.getCount(), 0);
  }
}
