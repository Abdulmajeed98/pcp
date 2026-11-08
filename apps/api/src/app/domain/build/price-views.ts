import { ShownPrice } from '../offer/shown-price';
import { Build, BuildPart } from './Build';
import { OfferVendor } from './in-stock-offers';
import { timesQuantity, totalOf } from './totals';

// A Part that a Vendor of the second price view has in stock among its
// Visible Offers, with its Shown Price there.
export class PartInStock {
  constructor(
    private readonly part: BuildPart,
    private readonly shownPrice: ShownPrice | null,
  ) {}

  getPart(): BuildPart {
    return this.part;
  }

  // None only when the Offer has no Quoted Price in the chosen currency and
  // there is no Platform Rate.
  getShownPrice(): ShownPrice | null {
    return this.shownPrice;
  }

  // Its Shown Price times the Part's quantity, as the Vendor's total adds it
  // up, or none.
  getTimesQuantity(): ShownPrice | null {
    return this.shownPrice === null
      ? null
      : timesQuantity(this.shownPrice, this.part.getQuantity());
  }
}

// A Vendor of the second price view (BLD-8): an active Vendor with at least
// one of the Build's Parts in stock among its Visible Offers, the Parts it has
// so, in the Build's order, and the Parts it lacks: the Build's Parts that
// other Vendors have in stock and it does not. An Unstocked Part is in no
// Vendor's list, since no Vendor has it.
export class BuildVendor {
  private constructor(
    private readonly vendor: OfferVendor,
    private readonly partsInStock: readonly PartInStock[],
    private readonly partsLacked: readonly BuildPart[],
    private readonly total: ShownPrice | null,
  ) {}

  // The Vendor among the Parts some Vendor has in stock, in the Build's
  // order.
  static among(vendor: OfferVendor, stocked: readonly BuildPart[]): BuildVendor {
    const partsInStock = stocked.flatMap((part) => {
      const offer = part
        .getInStockOffers()
        .find((each) => each.getVendor().getId() === vendor.getId());
      return offer === undefined ? [] : [new PartInStock(part, offer.getShownPrice())];
    });
    return new BuildVendor(
      vendor,
      partsInStock,
      stocked.filter((part) => !partsInStock.some((has) => has.getPart() === part)),
      totalOf(partsInStock.flatMap((has) => has.getTimesQuantity() ?? [])),
    );
  }

  getVendor(): OfferVendor {
    return this.vendor;
  }

  getPartsInStock(): readonly PartInStock[] {
    return this.partsInStock;
  }

  getPartsLacked(): readonly BuildPart[] {
    return this.partsLacked;
  }

  // Its Shown Prices times their quantities, added up, marked converted when
  // any is a Converted Price, leaving out a Part with no Shown Price: none
  // when no Part it has has one, which happens only before the first
  // Platform Rate.
  getTotal(): ShownPrice | null {
    return this.total;
  }
}

// Names compared in English collation, as near as JavaScript comes to the
// database's own `en_US.utf8`, by which a Part page orders its Vendors'
// names, and the same however the API's host is set.
const byName = new Intl.Collator('en').compare;

// Two totals compared as answered, after rounding (PRC-4), the lowest first,
// and none after any.
function byTotal(one: ShownPrice | null, other: ShownPrice | null): number {
  if (one === null || other === null) {
    return Number(one === null) - Number(other === null);
  }
  return one.getAmount() - other.getAmount();
}

// The second price view's order (BLD-8): the Vendors that lack the fewest
// Parts first, then the lowest total, then by name, then by identifier, so
// that the order is the same at every read. Nothing else moves a Vendor
// (OFF-11).
function inTheSecondViewsOrder(one: BuildVendor, other: BuildVendor): number {
  const oneId = one.getVendor().getId();
  const otherId = other.getVendor().getId();
  return (
    one.getPartsLacked().length - other.getPartsLacked().length ||
    byTotal(one.getTotal(), other.getTotal()) ||
    byName(one.getVendor().getName(), other.getVendor().getName()) ||
    Number(oneId > otherId) - Number(oneId < otherId)
  );
}

// A Build's two price views in the chosen currency, computed once here from
// the Shown Prices its Parts were read with, so that no frontend adds,
// converts or compares a price.
export class PriceViews {
  private constructor(
    private readonly totalAcrossVendors: ShownPrice | null,
    private readonly vendors: readonly BuildVendor[],
  ) {}

  static of(build: Build): PriceViews {
    const stocked = build.getParts().filter((part) => !part.isUnstocked());
    // Each Vendor once, whichever of its Parts it is met by.
    const vendors = new Map(
      stocked.flatMap((part) =>
        part
          .getInStockOffers()
          .map((offer): [string, OfferVendor] => [
            offer.getVendor().getId(),
            offer.getVendor(),
          ]),
      ),
    );
    return new PriceViews(
      // The first view's total (BLD-7, PRC-5): each Part's Lowest Price times
      // its quantity, added up, leaving out a Part with none.
      totalOf(build.getParts().flatMap((part) => part.getLowestPriceTimesQuantity() ?? [])),
      [...vendors.values()]
        .map((vendor) => BuildVendor.among(vendor, stocked))
        .sort(inTheSecondViewsOrder),
    );
  }

  // The first price view's total, the Build's total across Vendors: none
  // when no Part has a Lowest Price.
  getTotalAcrossVendors(): ShownPrice | null {
    return this.totalAcrossVendors;
  }

  // The second price view's Vendors, in its order.
  getVendors(): readonly BuildVendor[] {
    return this.vendors;
  }
}
