import type { CategoryResponse, PartSummaryResponse } from '@pcp/api-client';

import { namedParts, theCategoryOfManyParts, theLongestName } from '../made-up-offers.ts';
import type { MadeUpPhotos, ReadPart, TheShoppersCatalog } from '../the-shoppers-shop.ts';

// The moment the tests take for now: noon in Erbil on 21 October 2026.
export const now = new Date('2026-10-21T09:00:00.000Z');

// A stand-in for what the catalog answers the Shopper's command: each named
// Part with an identifier the catalog would not give, its manufacturer as
// the first word of its name, and a few specifications; 450 more Parts of
// the Category of many Parts; and the specification lists the tests read.
// Every value here is made up for the tests.

const categories: CategoryResponse[] = [
  {
    key: 'cpu',
    specifications: [
      {
        path: 'socket',
        label: 'Socket',
        kind: 'oneOf',
        values: ['AM4', 'AM5', 'LGA1700', 'LGA1851'],
        needed: true,
        zeroMeansMissing: false,
      },
      {
        path: 'cores.total',
        label: 'Cores',
        kind: 'wholeNumber',
        needed: false,
        zeroMeansMissing: true,
      },
      {
        path: 'cores.efficiency',
        label: 'Efficiency cores',
        kind: 'wholeNumber',
        needed: false,
        zeroMeansMissing: false,
      },
      {
        path: 'specifications.tdp',
        label: 'TDP',
        kind: 'wholeNumber',
        unit: 'W',
        needed: false,
        zeroMeansMissing: true,
      },
      {
        path: 'specifications.memory.types',
        label: 'Memory types',
        kind: 'severalOf',
        values: ['DDR4', 'DDR5'],
        needed: true,
        zeroMeansMissing: false,
      },
    ],
  },
  {
    key: 'cpuCooler',
    specifications: [
      {
        path: 'water_cooled',
        label: 'Liquid cooled',
        kind: 'yesNo',
        needed: false,
        zeroMeansMissing: false,
      },
      {
        path: 'radiator_size',
        label: 'Radiator size',
        kind: 'wholeNumber',
        unit: 'mm',
        needed: false,
        zeroMeansMissing: true,
      },
      {
        path: 'cpu_sockets',
        label: 'CPU sockets',
        kind: 'severalOf',
        values: ['AM4', 'AM5'],
        needed: true,
        zeroMeansMissing: false,
      },
    ],
  },
  {
    key: 'motherboard',
    specifications: [
      {
        path: 'socket',
        label: 'Socket',
        kind: 'oneOf',
        values: ['AM4', 'AM5', 'LGA1700'],
        needed: true,
        zeroMeansMissing: false,
      },
      {
        path: 'form_factor',
        label: 'Form factor',
        kind: 'text',
        needed: true,
        zeroMeansMissing: false,
      },
      {
        path: 'memory.ram_type',
        label: 'Memory type',
        kind: 'oneOf',
        values: ['DDR4', 'DDR5'],
        needed: true,
        zeroMeansMissing: false,
      },
      {
        path: 'm2_slots',
        label: 'M.2 slots',
        kind: 'listOfRows',
        fields: [
          {
            path: 'size',
            label: 'Size',
            kind: 'text',
            needed: false,
            zeroMeansMissing: false,
          },
          {
            path: 'key',
            label: 'Key',
            kind: 'text',
            needed: false,
            zeroMeansMissing: false,
          },
        ],
        needed: false,
        zeroMeansMissing: false,
      },
      {
        path: 'pcie_slots',
        label: 'PCIe slots',
        kind: 'listOfRows',
        fields: [
          {
            path: 'gen',
            label: 'Generation',
            kind: 'text',
            needed: false,
            zeroMeansMissing: false,
          },
          {
            path: 'quantity',
            label: 'Quantity',
            kind: 'wholeNumber',
            needed: false,
            zeroMeansMissing: true,
          },
          {
            path: 'lanes',
            label: 'Lanes',
            kind: 'wholeNumber',
            needed: false,
            zeroMeansMissing: true,
          },
        ],
        needed: true,
        zeroMeansMissing: false,
      },
    ],
  },
  { key: 'ram', specifications: [] },
  { key: 'storage', specifications: [] },
  {
    key: 'gpu',
    specifications: [
      {
        path: 'chipset',
        label: 'Chipset',
        kind: 'text',
        needed: false,
        zeroMeansMissing: false,
      },
      {
        path: 'memory',
        label: 'Memory',
        kind: 'wholeNumber',
        unit: 'GB',
        needed: false,
        zeroMeansMissing: true,
      },
    ],
  },
  { key: 'case', specifications: [] },
  { key: 'psu', specifications: [] },
];

// A few specifications of the named Parts, by name; the others hold none.
const specificationsByName: Record<string, Record<string, unknown>> = {
  'AMD Ryzen 7 7800X3D': {
    socket: 'AM5',
    cores: { total: 8, efficiency: 0 },
    specifications: { tdp: 120, memory: { types: ['DDR5'] } },
  },
  'AMD Ryzen 5 7600X': { socket: 'AM5', cores: { total: 6 } },
  'AMD Ryzen 7 9800X3D': { socket: 'AM5', cores: { total: 8 } },
  'AMD Ryzen 5 5600': { socket: 'AM4', cores: { total: 6 }, specifications: { tdp: 0 } },
  'Intel Core i5 14600K': { socket: 'LGA1700', cores: { total: 14, efficiency: 8 } },
  'Intel Core i7 14700K': { socket: 'LGA1700', cores: { total: 20 } },
  'Intel Core Ultra 7 265K': { socket: 'LGA1851', cores: { total: 0 } },
  'ARCTIC Liquid Freezer III Pro 360mm Black': { water_cooled: true, radiator_size: 360 },
  'Noctua NH-D15 chromax.black Air 165mm Black': { water_cooled: false, radiator_size: 0 },
  'MSI MAG B650 TOMAHAWK WIFI AM5 DDR5 ATX': {
    socket: 'AM5',
    form_factor: 'ATX',
    memory: { ram_type: 'DDR5' },
    m2_slots: [
      { size: '2280', key: 'M' },
      { size: '', key: 'E' },
    ],
  },
  'ASRock B550M Pro4 AM4 DDR4 Micro ATX': { socket: 'AM4', m2_slots: [] },
};

// The needed specifications of a few named Parts, by name, as the reading of
// the catalog leaves them for the Compatibility Rules; the others hold none.
// A CPU of each of two sockets, the first with its TDP; a board of the first
// socket with no 16-lane PCIe slot known, the lanes of its second row not
// held; the longest-named cooler, with no CPU socket held; and a GPU with
// its TDP.
const neededByName: Record<string, Record<string, unknown>> = {
  'AMD Ryzen 7 7800X3D': {
    socket: 'AM5',
    specifications: { tdp: 120, memory: { types: ['DDR5'] } },
  },
  'AMD Ryzen 5 7600X': { socket: 'AM5', specifications: { tdp: 105 } },
  'AMD Ryzen 5 5600': { socket: 'AM4', specifications: { memory: { types: ['DDR4'] } } },
  'MSI MAG B650 TOMAHAWK WIFI AM5 DDR5 ATX': {
    socket: 'AM5',
    memory: { ram_type: 'DDR5', slots: 4 },
    pcie_slots: [
      { gen: '4.0', lanes: 4, quantity: 1 },
      { gen: '3.0', quantity: 1 },
    ],
  },
  [theLongestName.name]: { water_cooled: true, height: 150 },
  'Palit Dual OC GeForce RTX 4070 SUPER 12GB GDDR6X Black': { tdp: 220 },
};

// The values the rule for a Complete Build reads of each named CPU, by name:
// one CPU with integrated graphics and no cooler, one with neither graphics
// nor a cooler, one with a cooler, one that holds neither value and one that
// holds only its graphics.
const cpuValuesByName: Record<string, ReadPart['cpuValues']> = {
  'AMD Ryzen 7 7800X3D': {
    integratedGraphics: 'AMD Radeon Graphics',
    includesCooler: false,
  },
  'AMD Ryzen 5 7600X': { integratedGraphics: 'AMD Radeon Graphics', includesCooler: false },
  'AMD Ryzen 5 5600': { integratedGraphics: 'None', includesCooler: true },
  'Intel Core i3 12100F': {},
  'Intel Core i5 14600K': { integratedGraphics: 'Intel UHD Graphics 770' },
};

function part(
  id: string,
  category: PartSummaryResponse['category'],
  name: string,
): PartSummaryResponse {
  return {
    id,
    category,
    name,
    manufacturer: name.split(' ')[0],
    partNumbers: [`PN-${id}`],
    photoPath: null,
  };
}

export function theShoppersCatalogStandIn({ otherParts = 450 } = {}): TheShoppersCatalog {
  return {
    named: new Map(
      namedParts.map((wanted, index) => [
        wanted.name,
        {
          summary: part(`named-${index}`, wanted.category, wanted.name),
          specifications: specificationsByName[wanted.name] ?? {},
          neededSpecifications: neededByName[wanted.name] ?? {},
          ...(wanted.category === 'cpu'
            ? { cpuValues: cpuValuesByName[wanted.name] ?? {} }
            : {}),
        },
      ]),
    ),
    others: Array.from({ length: otherParts }, (_, index) => ({
      summary: part(
        `other-${index}`,
        theCategoryOfManyParts,
        `Catalog GPU ${String(index).padStart(3, '0')}`,
      ),
      specifications: {
        chipset: `Chipset ${index % 7}`,
        memory: [4, 8, 12, 16, 24][index % 5],
      },
      neededSpecifications: {},
    })),
    categories,
  };
}

// A photo for each Category: a few bytes that say which.
export const photosStandIn: MadeUpPhotos = new Map(
  categories.map((category) => [category.key, Buffer.from(`photo of a ${category.key}`)]),
);
