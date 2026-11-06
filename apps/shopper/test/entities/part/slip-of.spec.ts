import type { ShownPriceResponse, VisibleOfferResponse } from '@pcp/api-client';
import { describe, expect, it } from 'vitest';

import { slipOf } from '@/entities/part';

function shown(amount: string, converted = false): ShownPriceResponse {
  return { currency: 'IQD', amount, converted };
}

// An Offer as the API answers it for a Part, in OFF-11's order.
function anOffer(
  vendor: string,
  details: Partial<VisibleOfferResponse> = {},
): VisibleOfferResponse {
  return {
    usdPrice: null,
    iqdPrice: 500000,
    shownPrice: shown('500000'),
    inStock: true,
    warrantyMonths: null,
    confirmedAt: '2026-11-06T08:00:00.000Z',
    daysSinceConfirmation: 0,
    vendor: { id: vendor, name: vendor },
    ...details,
  };
}

// The price slip prints a Part's figures from its Visible Offers, as the API
// answers them: in stock first, then the lowest Shown Price.
describe("a Part's price slip", () => {
  const offers = [
    anOffer('Made-up Computers', { shownPrice: shown('480000'), daysSinceConfirmation: 3 }),
    anOffer('حاسبات وهمية', { shownPrice: shown('495250', true), usdPrice: '314.00' }),
    anOffer('Invented PCs', { shownPrice: shown('520000') }),
    anOffer('Pretend Parts', { shownPrice: shown('470000'), inStock: false }),
    anOffer('Imaginary Store', { shownPrice: shown('490000', true), inStock: false }),
  ];

  it('takes the Lowest Price from the first Offer in stock, with its day and its Vendor', () => {
    const { lowest } = slipOf(offers);
    expect(lowest?.shownPrice).toEqual(shown('480000'));
    expect(lowest?.daysSinceConfirmation).toBe(3);
    expect(lowest?.vendor.name).toBe('Made-up Computers');
  });

  it('takes the highest price in stock from the last Offer in stock', () => {
    expect(slipOf(offers).highestInStock).toEqual(shown('520000'));
  });

  it('counts the Vendors, those in stock, and the converted prices', () => {
    expect(slipOf(offers)).toMatchObject({ vendors: 5, inStock: 3, converted: 2 });
  });

  // With no Platform Rate, an Offer quoted only in the other currency has no
  // Shown Price; the API lists those after the priced ones of its stock.
  it('leaves an Offer with no Shown Price out of the prices, and counts it', () => {
    const slip = slipOf([
      ...offers.slice(0, 3),
      anOffer('No Rate Yet', { shownPrice: null }),
    ]);
    expect(slip.highestInStock).toEqual(shown('520000'));
    expect(slip.inStock).toBe(4);
  });

  it('has no prices when every Vendor has the Part out of stock', () => {
    const slip = slipOf(offers.slice(3));
    expect(slip.lowest).toBeUndefined();
    expect(slip.highestInStock).toBeUndefined();
    expect(slip).toMatchObject({ vendors: 2, inStock: 0, converted: 1 });
  });
});
