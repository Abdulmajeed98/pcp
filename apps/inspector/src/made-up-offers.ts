import type { PartSummaryResponse } from '@pcp/api-client';

// The made-up shop's Offers, of every Vendor in `made-up-vendors.ts`. Each
// names a real Part of the catalog by its Category and exact name (ADR-0001:
// no Part is invented); the command reads the Parts themselves from the API
// when it starts. What a Vendor says of its Offer is made up: its prices,
// its stock, its warranty and how long ago it last confirmed it.
//
// Every price a Shopper sees is written here, in both currencies, and
// nothing converts it. An Offer quoted in one currency has its Shown Price in
// the other written beside it, as the platform shows it at the made-up
// shop's Platform Rate of 1,575 dinars to the dollar: rounded to the nearest
// 250 dinars or whole dollar, and marked "≈".

// The made-up shop's Platform Rate, in whole dinars per dollar, which every
// price written beside a Quoted Price below was converted at.
export const theShopsPlatformRate = 1575;

// A Part of the catalog, as the shop names it.
export interface CatalogPart {
  category: PartSummaryResponse['category'];
  name: string;
}

// The prices of an Offer: its Quoted Prices, and for a currency it is not
// quoted in, the Converted Price a Shopper sees in it, as decimal text.
export type MadeUpPrices =
  | { usd: string; iqd: number }
  | { usd: string; iqdShown: string }
  | { iqd: number; usdShown: string };

// What a Vendor says about one of its Offers: which Vendor, which Part, its
// prices, its stock, its warranty and how long ago it was last confirmed.
export interface MadeUpOffer {
  vendor: number;
  part: CatalogPart;
  prices: MadeUpPrices;
  inStock: boolean;
  warrantyMonths: number | null;
  confirmedAgo: { days: number; hours: number };
}

function both(usd: string, iqd: number): MadeUpPrices {
  return { usd, iqd };
}
function inDollars(usd: string, iqdShown: string): MadeUpPrices {
  return { usd, iqdShown };
}
function inDinars(iqd: number, usdShown: string): MadeUpPrices {
  return { iqd, usdShown };
}
function ago(days: number, hours: number) {
  return { days, hours };
}

function offer(
  vendor: number,
  part: CatalogPart,
  prices: MadeUpPrices,
  stock: 'in stock' | 'out of stock',
  warrantyMonths: number | null,
  confirmedAgo: MadeUpOffer['confirmedAgo'],
): MadeUpOffer {
  return {
    vendor,
    part,
    prices,
    inStock: stock === 'in stock',
    warrantyMonths,
    confirmedAgo,
  };
}

const cpu = (name: string): CatalogPart => ({ category: 'cpu', name });
const cpuCooler = (name: string): CatalogPart => ({ category: 'cpuCooler', name });
const motherboard = (name: string): CatalogPart => ({ category: 'motherboard', name });
const ram = (name: string): CatalogPart => ({ category: 'ram', name });
const storage = (name: string): CatalogPart => ({ category: 'storage', name });
const gpu = (name: string): CatalogPart => ({ category: 'gpu', name });
const pcCase = (name: string): CatalogPart => ({ category: 'case', name });
const psu = (name: string): CatalogPart => ({ category: 'psu', name });

// The Parts, by name. The two cooler names are the longest the catalog holds,
// 276 and 210 characters; the GPU's is the longest of its Category.
export const ryzen7800X3D = cpu('AMD Ryzen 7 7800X3D');
const ryzen7600X = cpu('AMD Ryzen 5 7600X');
const ryzen9800X3D = cpu('AMD Ryzen 7 9800X3D');
const ryzen7950X3D = cpu('AMD Ryzen 9 7950X3D');
const ryzen5600 = cpu('AMD Ryzen 5 5600');
const core14600K = cpu('Intel Core i5 14600K');
const core14700K = cpu('Intel Core i7 14700K');
const core12100F = cpu('Intel Core i3 12100F');
const ultra265K = cpu('Intel Core Ultra 7 265K');
const nhD15 = cpuCooler('Noctua NH-D15 chromax.black Air 165mm Black');
const peerlessAssassin = cpuCooler(
  'Thermalright Peerless Assassin 120 SE Air 155mm Black/Silver',
);
export const theLongestName = cpuCooler(
  'Corsair Hydro Series H100i RGB PLATINUM Extreme Performance Liquid CPU Cooler, Mounting kit for most modern CPU sockets, Two ML PRO RGB Series PWM 140mm fans, Fan and radiator mounting screws, USB 2.0 motherboard header cable, Thermal compound (pre-applied), Quick Start Guide',
);
export const theNextLongestName = cpuCooler(
  'DeepCool LS720 SE Liquid Cooler 360mm 4th Gen Dual-Chamber Pump 3100RPM 300w TDP AIO Cooler Anti-Leak Tech with ARGB Fans CPU Water Cooler Narrow Frame Infinity Mirror Block for AMD AM4/AM5 LGA 1700/1200, Black',
);
const liquidFreezer = cpuCooler('ARCTIC Liquid Freezer III Pro 360mm Black');
const ak620 = cpuCooler('Deepcool AK620 Air 160mm Black / Silver');
const b650Tomahawk = motherboard('MSI MAG B650 TOMAHAWK WIFI AM5 DDR5 ATX');
const b650Elite = motherboard('GIGABYTE B650 AORUS ELITE AX AM5 DDR5 ATX');
const b760mDs3h = motherboard('Gigabyte B760M DS3H DDR4 Micro ATX');
const b550mPro4 = motherboard('ASRock B550M Pro4 AM4 DDR4 Micro ATX');
const z790Tomahawk = motherboard('MSI MAG Z790 TOMAHAWK WIFI DDR5 ATX');
const vengeance = ram('CORSAIR Vengeance 32GB (2x16GB) DDR5 6000 CL30 Black');
const tridentZ5 = ram('G.Skill Trident Z5 Neo RGB 32GB (2x16GB) DDR5 6400 CL30 Black');
const furyBeast16 = ram('Kingston FURY Beast 16GB (2x8GB) DDR4 3200 CL16 Black');
const furyBeast32 = ram('Kingston FURY Beast 32GB (2x16GB) DDR4 3200 CL16 Black');
const sn850x = storage('Western Digital WD_Black SN850X 1TB SSD M.2 PCIe 4.0 NVMe');
const samsung990Pro = storage('Samsung 990 Pro 2TB SSD M.2-2280 PCIe 4.0 x4 NVMe');
const p3Plus = storage('Crucial P3 Plus 1TB SSD M.2-2280 PCIe 4.0 x4 NVMe');
const samsung870Evo = storage('Samsung 870 Evo 1TB 2.5" SSD SATA');
const barraCuda = storage('Seagate BarraCuda 2TB 3.5" HDD 7200RPM SATA');
const palit4070Super = gpu('Palit Dual OC GeForce RTX 4070 SUPER 12GB GDDR6X Black');
const foundersEdition = gpu('NVIDIA GeForce RTX 4070 SUPER 12GB GDDR6X Founders Edition');
const tuf7800XT = gpu('Asus TUF GAMING OC Radeon RX 7800 XT 16GB GDDR6 Black');
const dual2060Super = gpu(
  'ASUS DUAL GeForce RTX 2060 SUPER EVO V2 OC Edition Gaming Graphics Card (PCIe 3.0, 8GB GDDR6, HDMI, DisplayPort, DVI-D, Axial-Tech Fan, 0dB Technology, DirectCU II, Auto-Extreme) (DUAL-RTX2060S-O8G-EVO-V2)',
);
// The Category's one Part.
export const theOnlyCase = pcCase(
  'Corsair 4000D AIRFLOW Tempered Glass Mid-Tower ATX Case - Black',
);
const rm850e = psu('Corsair RM850e (2022) Black 850W Fully Modular 80+ Gold Certified');
const focusGx750 = psu(
  'SeaSonic FOCUS GX-750 Black ATX 3.0 750W Fully Modular 80+ Gold Certified',
);
const purePower12M = psu('be quiet! Pure Power 12 M 750W Fully Modular 80+ Gold Certified');
const a650bn = psu('MSI MAG A650BN Black ATX 650W Non-Modular 80+ Bronze Certified');

// The Category whose Visible Parts are many: these GPUs, and the 396 others
// of `made-up-gpus.ts`, read from the catalog by Category and exact name too,
// to make 400 (`theShoppersShop`).
export const theCategoryOfManyParts = 'gpu' satisfies CatalogPart['category'];
export const visiblePartsOfThatCategory = 400;

// The first Vendor's Offers, which the dashboard's shop shows too, as its
// screens always showed them.
const theFirstVendorsOffers: readonly MadeUpOffer[] = [
  offer(1, ryzen7800X3D, both('365.00', 575000), 'in stock', 12, ago(0, 2)),
  offer(1, palit4070Super, inDinars(950000, '603.00'), 'in stock', null, ago(0, 5)),
  offer(1, sn850x, inDollars('79.00', '124500'), 'out of stock', 60, ago(1, 4)),
  offer(1, ryzen7600X, both('189.00', 298000), 'in stock', 12, ago(2, 6)),
  offer(1, foundersEdition, inDollars('599.00', '943500'), 'out of stock', null, ago(3, 1)),
  offer(1, b650Tomahawk, inDollars('215.00', '338750'), 'in stock', 24, ago(5, 3)),
  offer(1, theOnlyCase, inDinars(135000, '86.00'), 'in stock', 12, ago(6, 8)),
  offer(1, tuf7800XT, inDinars(820000, '521.00'), 'in stock', null, ago(8, 2)),
  offer(1, rm850e, both('124.00', 195000), 'in stock', 84, ago(11, 1)),
  offer(1, vengeance, both('109.00', 172000), 'in stock', 24, ago(12, 3)),
  offer(1, nhD15, inDollars('119.00', '187500'), 'in stock', 72, ago(13, 20)),
];

// The first Vendor's two Expired Offers, which only its own screens show: a
// Shopper never sees an Expired Offer (CAT-7).
export const expiredOffersOfTheFirstVendor: readonly MadeUpOffer[] = [
  offer(1, peerlessAssassin, inDinars(52000, '33.00'), 'in stock', 6, ago(20, 0)),
  offer(1, samsung990Pro, both('169.00', 266000), 'out of stock', 60, ago(45, 0)),
];

// The Part offered by twenty Vendors: the four named shops, and sixteen
// others, at prices a little apart, three of them out of stock.
const theTwentyOffersOfOnePart: readonly MadeUpOffer[] = [
  offer(2, ryzen7800X3D, inDinars(569000, '361.00'), 'in stock', 12, ago(0, 1)),
  offer(3, ryzen7800X3D, both('359.00', 566000), 'in stock', 24, ago(1, 0)),
  offer(4, ryzen7800X3D, inDinars(559000, '355.00'), 'in stock', null, ago(13, 10)),
  offer(6, ryzen7800X3D, both('372.00', 586000), 'in stock', 12, ago(0, 3)),
  offer(7, ryzen7800X3D, inDinars(579000, '368.00'), 'in stock', 24, ago(0, 7)),
  offer(8, ryzen7800X3D, inDollars('369.00', '581250'), 'in stock', 12, ago(1, 1)),
  offer(9, ryzen7800X3D, inDinars(590000, '375.00'), 'out of stock', 12, ago(1, 9)),
  offer(10, ryzen7800X3D, both('380.00', 598000), 'in stock', 36, ago(2, 4)),
  offer(11, ryzen7800X3D, inDinars(571000, '363.00'), 'in stock', null, ago(3, 0)),
  offer(12, ryzen7800X3D, inDollars('362.00', '570250'), 'in stock', 12, ago(3, 8)),
  offer(13, ryzen7800X3D, inDinars(600000, '381.00'), 'in stock', 24, ago(4, 2)),
  offer(14, ryzen7800X3D, both('375.00', 590000), 'out of stock', 12, ago(5, 6)),
  offer(15, ryzen7800X3D, inDinars(565000, '359.00'), 'in stock', 12, ago(6, 1)),
  offer(16, ryzen7800X3D, inDollars('389.00', '612750'), 'in stock', 36, ago(7, 3)),
  offer(17, ryzen7800X3D, inDinars(612000, '389.00'), 'in stock', null, ago(8, 5)),
  offer(18, ryzen7800X3D, both('357.00', 562000), 'in stock', 12, ago(9, 2)),
  offer(19, ryzen7800X3D, inDinars(577000, '366.00'), 'out of stock', 24, ago(10, 4)),
  offer(20, ryzen7800X3D, inDollars('399.00', '628500'), 'in stock', 12, ago(11, 7)),
  offer(21, ryzen7800X3D, inDinars(583000, '370.00'), 'in stock', 12, ago(12, 9)),
];

// The other named shops' Offers, across every Category.
const theOtherShopsOffers: readonly MadeUpOffer[] = [
  // The Kurdish-named shop.
  offer(2, core14600K, both('249.00', 392000), 'in stock', 36, ago(0, 6)),
  offer(2, peerlessAssassin, inDinars(52000, '33.00'), 'in stock', 6, ago(1, 2)),
  offer(2, samsung990Pro, both('165.00', 262000), 'in stock', 60, ago(2, 0)),
  offer(2, furyBeast16, inDinars(48000, '30.00'), 'in stock', null, ago(3, 5)),
  offer(2, b760mDs3h, inDinars(168000, '107.00'), 'in stock', 12, ago(4, 1)),
  offer(2, theOnlyCase, inDinars(132000, '84.00'), 'out of stock', 12, ago(6, 0)),
  offer(2, dual2060Super, inDinars(285000, '181.00'), 'out of stock', 6, ago(7, 0)),
  offer(2, focusGx750, inDollars('109.00', '171750'), 'in stock', 120, ago(9, 3)),
  offer(2, theLongestName, inDinars(210000, '133.00'), 'in stock', 60, ago(10, 2)),
  // The Arabic-named shop.
  offer(3, core14700K, inDollars('365.00', '575000'), 'in stock', 36, ago(0, 3)),
  offer(3, p3Plus, inDinars(98000, '62.00'), 'in stock', 36, ago(1, 5)),
  offer(3, theNextLongestName, inDinars(158000, '100.00'), 'in stock', 24, ago(2, 4)),
  offer(3, liquidFreezer, both('89.00', 140000), 'in stock', 72, ago(3, 0)),
  offer(3, b650Elite, inDollars('199.00', '313500'), 'in stock', 36, ago(4, 2)),
  offer(3, ryzen7950X3D, inDollars('589.00', '927750'), 'out of stock', 36, ago(5, 2)),
  offer(3, palit4070Super, both('589.00', 925000), 'in stock', 24, ago(6, 4)),
  offer(3, tridentZ5, both('119.00', 187000), 'out of stock', null, ago(8, 1)),
  offer(3, barraCuda, inDinars(92000, '58.00'), 'in stock', 24, ago(11, 0)),
  offer(3, purePower12M, inDollars('99.00', '156000'), 'in stock', 60, ago(12, 6)),
  // The shop that gives only its phone number.
  offer(4, ryzen5600, both('89.00', 140000), 'in stock', 12, ago(0, 8)),
  offer(4, a650bn, inDinars(72000, '46.00'), 'in stock', 24, ago(1, 1)),
  offer(4, core12100F, inDinars(115000, '73.00'), 'in stock', null, ago(2, 2)),
  offer(4, ak620, both('58.00', 92000), 'in stock', 12, ago(5, 5)),
  offer(4, b550mPro4, inDollars('95.00', '149750'), 'in stock', 12, ago(6, 6)),
  offer(4, samsung870Evo, inDinars(118000, '75.00'), 'out of stock', 60, ago(9, 9)),
  // A few of the other shops.
  offer(6, ryzen9800X3D, both('479.00', 755000), 'in stock', 36, ago(0, 4)),
  offer(7, ultra265K, inDinars(520000, '330.00'), 'in stock', 36, ago(3, 3)),
  offer(8, furyBeast32, inDinars(89000, '57.00'), 'in stock', 24, ago(4, 0)),
  offer(9, z790Tomahawk, inDollars('239.00', '376500'), 'out of stock', 36, ago(7, 7)),
  offer(10, theOnlyCase, both('89.00', 140000), 'in stock', 24, ago(2, 9)),
];

// Every Offer a Shopper sees, the first Vendor's first, of the Parts named
// above.
export const namedOffers: readonly MadeUpOffer[] = [
  ...theFirstVendorsOffers,
  ...theTwentyOffersOfOnePart,
  ...theOtherShopsOffers,
];

// The first Vendor's Offers as the dashboard's shop holds them: its Visible
// Offers and then its Expired ones, in the order whose places give their
// identifiers, `00000000-0000-4000-8000-000000000101` to `…113`.
export const offersOfTheFirstVendor: readonly MadeUpOffer[] = [
  ...theFirstVendorsOffers,
  ...expiredOffersOfTheFirstVendor,
];

// The named Parts the shop shows with a made-up photo; the others are shown
// with their Category's icon. The longest name has one, the next longest has
// none.
export const partsWithAPhoto: readonly CatalogPart[] = [
  ryzen7800X3D,
  core14700K,
  theLongestName,
  nhD15,
  liquidFreezer,
  b650Tomahawk,
  vengeance,
  sn850x,
  palit4070Super,
  theOnlyCase,
  rm850e,
];

// Every Part the named Offers name, once each, for the catalog's reading.
export const namedParts: readonly CatalogPart[] = [
  ...new Map(
    [...namedOffers, ...expiredOffersOfTheFirstVendor].map((offer) => [
      `${offer.part.category} ${offer.part.name}`,
      offer.part,
    ]),
  ).values(),
];
