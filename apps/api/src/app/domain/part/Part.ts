import { specificationListOf } from '../specification/specification-lists';
import { SpecificationDocument } from '../specification/SpecificationList';
import { Category } from './Category';

// A specific model of PC component, defined once by the platform.
export class Part {
  constructor(
    private readonly id: string,
    private readonly category: Category,
    private readonly name: string,
    private readonly manufacturer: string,
    private readonly partNumbers: readonly string[],
    private readonly openDbId: string | null,
    private readonly specifications: SpecificationDocument,
  ) {}

  getId(): string {
    return this.id;
  }

  getCategory(): Category {
    return this.category;
  }

  getName(): string {
    return this.name;
  }

  getManufacturer(): string {
    return this.manufacturer;
  }

  // The manufacturer's part numbers. Two Parts may share one.
  getPartNumbers(): readonly string[] {
    return this.partNumbers;
  }

  // The Part's identifier in OpenDB, or null for a Part the Admin created.
  getOpenDbId(): string | null {
    return this.openDbId;
  }

  // Its specifications, as its Category's list keeps them.
  getSpecifications(): SpecificationDocument {
    return this.specifications;
  }

  // The specifications a Compatibility Rule reads that this Part lacks, by
  // their paths, in its list's order.
  getMissingNeededSpecifications(): string[] {
    return specificationListOf(this.category).missingNeeded(this.specifications);
  }
}
