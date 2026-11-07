import type { VisibleOfferOfVendorResponse } from '@pcp/api-client';
import { describe, expect, it } from 'vitest';

import { offersByCategory } from '@/_pages/vendor';

// An Offer of a made-up Vendor, as the API answers it, of a Part of the
// Category and name given.
function anOffer(
  category: VisibleOfferOfVendorResponse['part']['category'],
  name: string,
): VisibleOfferOfVendorResponse {
  return {
    usdPrice: null,
    iqdPrice: 100_000,
    shownPrice: { currency: 'IQD', amount: '100000', converted: false },
    inStock: true,
    warrantyMonths: null,
    confirmedAt: '2026-11-06T08:00:00.000Z',
    daysSinceConfirmation: 0,
    part: {
      id: `00000000-0000-4000-8000-${name.length.toString().padStart(12, '0')}`,
      category,
      name,
      manufacturer: 'Made-up Test Parts',
      partNumbers: [],
      photoPath: null,
    },
  };
}

// A page of a Vendor's Offers, grouped by Category under each Category's
// name (DESIGN.md's An Offer, on a Vendor page): the API answers them
// grouped in the catalog's order of the eight, and in OFF-11's order within
// each, so the groups and the Offers in them keep the API's order.
describe("a Vendor's Offers, grouped by Category", () => {
  it('gives each Category its Offers, in the order the API answers them', () => {
    const cpu1 = anOffer('cpu', 'Made-up CPU one');
    const cpu2 = anOffer('cpu', 'Made-up CPU two');
    const ram = anOffer('ram', 'Made-up RAM');
    const gpu1 = anOffer('gpu', 'Made-up GPU one');
    const gpu2 = anOffer('gpu', 'Made-up GPU two');
    const psu = anOffer('psu', 'Made-up PSU');

    expect(offersByCategory([cpu1, cpu2, ram, gpu1, gpu2, psu])).toEqual([
      { category: 'cpu', offers: [cpu1, cpu2] },
      { category: 'ram', offers: [ram] },
      { category: 'gpu', offers: [gpu1, gpu2] },
      { category: 'psu', offers: [psu] },
    ]);
  });

  it('gives one group to a page of one Category, and none to a page with no Offer', () => {
    const cooler = anOffer('cpuCooler', 'Made-up cooler');
    expect(offersByCategory([cooler])).toEqual([
      { category: 'cpuCooler', offers: [cooler] },
    ]);
    expect(offersByCategory([])).toEqual([]);
  });
});
