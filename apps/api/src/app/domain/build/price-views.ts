import { ShownPrice } from '../offer/shown-price';
import { Build } from './Build';
import { totalOf } from './totals';

// A Build's two price views in the chosen currency, computed once here from
// the Shown Prices its Parts were read with, so that no frontend adds,
// converts or compares a price.
export class PriceViews {
  private constructor(private readonly totalAcrossVendors: ShownPrice | null) {}

  static of(build: Build): PriceViews {
    return new PriceViews(
      // The first view's total (BLD-7, PRC-5): each Part's Lowest Price times
      // its quantity, added up, leaving out a Part with none.
      totalOf(build.getParts().flatMap((part) => part.getLowestPriceTimesQuantity() ?? [])),
    );
  }

  // The first price view's total, the Build's total across Vendors: none
  // when no Part has a Lowest Price.
  getTotalAcrossVendors(): ShownPrice | null {
    return this.totalAcrossVendors;
  }
}
