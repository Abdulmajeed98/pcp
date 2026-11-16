import { ShownPrice } from '../offer/shown-price';

// The Vendor of a Visible Offer, as far as a Shopper may know it: its
// identifier and its name, and nothing else of the Vendor.
export class OfferVendor {
  constructor(
    private readonly id: string,
    private readonly name: string,
  ) {}

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }
}

// The Vendor of an in-stock Visible Offer, as a Build's second price view
// knows it: its identifier, its name, and whether it gave a WhatsApp number,
// so that a page offers to send the Build to it only where a chat can be
// opened (SHR-5). The number itself is answered only once a Referral is
// recorded.
export class StockingVendor extends OfferVendor {
  constructor(
    id: string,
    name: string,
    private readonly whatsAppNumberGiven: boolean,
  ) {
    super(id, name);
  }

  hasWhatsAppNumber(): boolean {
    return this.whatsAppNumberGiven;
  }
}

// One of a Part's in-stock Visible Offers, as a Build's price views read it:
// its Vendor, and its Shown Price in the chosen currency, which is none only
// when the Offer has no Quoted Price in that currency and there is no
// Platform Rate.
export class InStockOffer {
  constructor(
    private readonly vendor: StockingVendor,
    private readonly shownPrice: ShownPrice | null,
  ) {}

  getVendor(): StockingVendor {
    return this.vendor;
  }

  getShownPrice(): ShownPrice | null {
    return this.shownPrice;
  }
}

// A Part's Lowest Price, with the Vendor of the Offer it comes from: the
// first of its in-stock Visible Offers in the order a Part's page lists them
// (OFF-11), so that of equal prices it is the Offer listed first.
export class LowestPrice {
  constructor(
    private readonly shownPrice: ShownPrice,
    private readonly vendor: OfferVendor,
  ) {}

  getShownPrice(): ShownPrice {
    return this.shownPrice;
  }

  getVendor(): OfferVendor {
    return this.vendor;
  }
}

// A Part's in-stock Visible Offers in the chosen currency, each Vendor's, and
// its Lowest Price among them, read at one moment and one Platform Rate.
export class InStockOffers {
  constructor(
    private readonly lowestPrice: LowestPrice | null,
    private readonly offers: readonly InStockOffer[],
  ) {}

  // None when no Vendor has the Part in stock, and when the first of its
  // in-stock Visible Offers has no Shown Price, which happens only before the
  // first Platform Rate, with an Offer quoted only in the other currency.
  getLowestPrice(): LowestPrice | null {
    return this.lowestPrice;
  }

  // In no order: one for each Vendor that has the Part in stock, since a
  // Vendor has one Offer for a Part at most (OFF-1).
  getOffers(): readonly InStockOffer[] {
    return this.offers;
  }
}
