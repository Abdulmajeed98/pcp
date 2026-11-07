import { Part } from '../part/Part';
import { ShownPrice } from './shown-price';

// A Visible Part (CAT-7), as a Category's list shows it to Shoppers: the Part,
// which has at least one Visible Offer, with what its Visible Offers say of it
// in the chosen currency. It holds nothing of their Vendors but how many there
// are.
export class VisiblePart {
  constructor(
    private readonly part: Part,
    private readonly lowestPrice: ShownPrice | null,
    private readonly vendorCount: number,
    private readonly inStock: boolean,
  ) {}

  getPart(): Part {
    return this.part;
  }

  // The lowest Shown Price among its in-stock Visible Offers, as the first of
  // them a Part's page lists shows it (OFF-11), so that it is marked converted
  // exactly when that Offer's Shown Price is. None when no Visible Offer is in
  // stock, or when none in stock has a Shown Price, which happens only with no
  // Platform Rate.
  getLowestPrice(): ShownPrice | null {
    return this.lowestPrice;
  }

  // How many Vendors have a Visible Offer for it, in stock or not: a Vendor has
  // at most one Offer for a Part.
  getVendorCount(): number {
    return this.vendorCount;
  }

  // Whether any of its Visible Offers is in stock.
  isInStock(): boolean {
    return this.inStock;
  }
}
