import { Specification } from '../specification/Specification';
import { Category } from './Category';

// A Part that has at least one Offer and lacks at least one needed
// specification, as the Admin's list of them shows it (CAT-8): what names the
// Part, the needed specifications it lacks, in its list's order, and how many
// Offers it has, from any Vendor, Expired Offers among them.
export class PartMissingSpecifications {
  constructor(
    private readonly partId: string,
    private readonly category: Category,
    private readonly name: string,
    private readonly manufacturer: string,
    private readonly missing: readonly Specification[],
    private readonly offerCount: number,
  ) {}

  getPartId(): string {
    return this.partId;
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

  getMissing(): readonly Specification[] {
    return this.missing;
  }

  getOfferCount(): number {
    return this.offerCount;
  }
}
