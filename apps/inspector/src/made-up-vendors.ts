import type { VisibleVendorResponse } from '@pcp/api-client';

// The made-up shop's Vendors: several shops of Erbil, each obviously
// fictional by its name, its address and its numbers, named in Kurdish,
// Arabic and Latin script as Vendors write their names (LANG-4). No real
// Vendor is invented (PRODUCT.md's Evidence on Hand). The first is the shop
// the dashboard's inspection shows, `made-up-shop.ts`; the Shopper app's
// inspection shows them all, through the stand-in API.
//
// Most have every contact detail. "Pretend Tech" has only its phone number,
// beside the address and city every Vendor gives, and "Imaginary Gaming
// Corner" has no Visible Offer.

// Identifiers that say they are made up: zeros, and a counter.
export function madeUpIdentifier(counter: number): string {
  return `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`;
}

// Made-up mobile numbers, on Korek's 0750 and 0751 ranges, with a counter
// for the rest.
function madeUpNumber(range: '0750' | '0751', middle: string, counter: number) {
  const last = String(counter).padStart(4, '0');
  return {
    international: `+964${range.slice(1)}${middle}${last}`,
    national: `${range} ${middle} ${last}`,
  };
}

// A place in Erbil, a little away from the citadel for each Vendor.
function nearTheCitadel(counter: number) {
  return {
    latitude: Number((36.1911 + (counter % 5) * 0.0021).toFixed(4)),
    longitude: Number((44.0092 + (counter % 7) * 0.0017).toFixed(4)),
  };
}

const latin = {
  address: (counter: number) => `${counter} Sample Street\nFictional Bazaar, Erbil`,
  openingHours: 'Saturday to Thursday, 10:00 to 21:00\nFriday closed',
};
const kurdish = {
  address: (counter: number) => `شەقامی نموونە، ژمارە ${counter}\nبازاڕی خەیاڵی، هەولێر`,
  openingHours: 'شەممە تا پێنجشەممە، 10:00 تا 21:00\nهەینی داخراوە',
};
const arabic = {
  address: (counter: number) => `شارع المثال، رقم ${counter}\nالسوق الخيالي، أربيل`,
  openingHours: 'من السبت إلى الخميس، 10:00 إلى 21:00\nالجمعة مغلق',
};

// A Vendor with every contact detail, written in the script of its name.
function withEveryDetail(
  counter: number,
  name: string,
  instagramName: string,
  script: typeof latin,
): VisibleVendorResponse {
  return {
    id: madeUpIdentifier(counter),
    name,
    city: 'erbil',
    address: script.address(counter),
    mapLocation: nearTheCitadel(counter),
    phoneNumber: madeUpNumber('0750', '100', counter),
    whatsAppNumber: madeUpNumber('0751', '100', counter),
    instagramName,
    openingHours: script.openingHours,
  };
}

// The dashboard's shop, as it always was.
export const theFirstVendor: VisibleVendorResponse = {
  id: madeUpIdentifier(1),
  name: 'Made-up PC Parts',
  city: 'erbil',
  address: '1 Made-up Street\nFictional Bazaar, Erbil',
  mapLocation: { latitude: 36.1911, longitude: 44.0092 },
  phoneNumber: { international: '+9647500000001', national: '0750 000 0001' },
  whatsAppNumber: { international: '+9647500000002', national: '0750 000 0002' },
  instagramName: 'made.up.pc.parts',
  openingHours: 'Saturday to Thursday, 10:00 to 21:00\nFriday closed',
};

export const madeUpVendors: readonly VisibleVendorResponse[] = [
  theFirstVendor,
  {
    ...withEveryDetail(2, 'کۆگای پارچەی خەیاڵی', 'fictional.parts.store', kurdish),
    openingHours: 'شەممە تا پێنجشەممە، 9:30 تا 21:00\nهەینی داخراوە',
  },
  {
    ...withEveryDetail(3, 'حاسبات المثال', 'example.computers', arabic),
    openingHours: 'من السبت إلى الخميس، 10:00 إلى 22:00\nالجمعة من 16:00 إلى 22:00',
  },
  {
    id: madeUpIdentifier(4),
    name: 'Pretend Tech',
    city: 'erbil',
    address: '4 Pretend Road, Erbil',
    mapLocation: null,
    phoneNumber: madeUpNumber('0750', '100', 4),
    whatsAppNumber: null,
    instagramName: null,
    openingHours: null,
  },
  withEveryDetail(5, 'Imaginary Gaming Corner', 'imaginary.gaming.corner', latin),
  withEveryDetail(6, 'Sample Systems', 'sample.systems', latin),
  withEveryDetail(7, 'تەکنەلۆجیای نموونە', 'sample.technology', kurdish),
  withEveryDetail(8, 'عالم الحاسوب الافتراضي', 'virtual.computer.world', arabic),
  withEveryDetail(9, 'Placeholder Computers', 'placeholder.computers', latin),
  withEveryDetail(10, 'Mock Hardware Erbil', 'mock.hardware.erbil', latin),
  withEveryDetail(11, 'ئەلیکترۆنیاتی خەیاڵ', 'imagination.electronics', kurdish),
  withEveryDetail(12, 'متجر التجربة للإلكترونيات', 'trial.electronics', arabic),
  withEveryDetail(13, 'Not-a-Real PC Shop', 'not.a.real.pc.shop', latin),
  withEveryDetail(14, 'Demo Devices', 'demo.devices', latin),
  withEveryDetail(15, 'کۆمپیوتەری وەهمی', 'illusory.computer', kurdish),
  withEveryDetail(
    16,
    'شركة التقنيات الوهمية لتجارة الحاسبات وملحقاتها',
    'imaginary.technologies.company',
    arabic,
  ),
  withEveryDetail(17, 'Fictional Circuits', 'fictional.circuits', latin),
  withEveryDetail(18, 'Example Electronics Bazaar', 'example.electronics.bazaar', latin),
  withEveryDetail(19, 'دووکانی تاقیکردنەوە', 'test.shop.erbil', kurdish),
  withEveryDetail(20, 'Dummy Digital', 'dummy.digital', latin),
  withEveryDetail(
    21,
    'Invented Components & Accessories Trading Company',
    'invented.components',
    latin,
  ),
];

// The Vendors that offer the Category's many Parts, a few each, beside the
// four named shops.
export const vendorsOfTheManyParts: readonly number[] = Array.from(
  { length: 16 },
  (_, index) => index + 6,
);
