import type { CatalogPart } from './made-up-offers.ts';

// The Parts that hold the part number "OC", the part number the most Parts
// of the catalog share: 81 GPUs at the commit of OpenDB the catalog import
// is pinned to (`@pcp/opendb`), since OpenDB lists fragments of some codes
// as part numbers (the sheet spec's Further Notes, measured on 18 November
// 2026). The worst of the made-up results of an upload names them all for a
// row whose part number is "OC", as the API names every Part that holds a
// row's part number (`--offer-sheet-result worstCase`). Each is read by its
// Category and exact name, as the shop's other Parts are (ADR-0001: no Part
// is invented); two of them share one name, so each name is read with every
// Part of it that holds "OC" (`partsHoldingAPartNumber`).
export const theSharedPartNumber = 'OC';

export const howManyPartsHoldIt = 81;

const names = [
  'MSI GeForce GTX 750 Ti GeForce GTX 750 Ti Black 2GB GDDR5 Black',
  'MSI N730K-2GD5LP/OC GeForce GT 730 2 GB',
  'MSI N760-2GD5/OC GeForce GTX 760 2GB GDDR5 Black',
  'MSI TWIN FROZR GeForce GTX 750 Ti 2GB GDDR5 Black / Red',
  'MSI TWIN FROZR GeForce GTX 760 2 GB',
  'MSI TWIN FROZR GeForce GTX 770 2 GB',
  'MSI TWIN FROZR GeForce GTX 770 4GB GDDR5 Black / Red',
  'MSI TWIN FROZR II GeForce GTX 560 Ti 2 GB',
  'PowerColor AMD Radeon RX 7900 GRE Fighter OC 16GB GDDR6',
  'PowerColor AXRX 3DH/OC Radeon RX 5700 8GB GDDR6 Black',
  'PowerColor Fighter OC Radeon RX 6500 XT 4GB GDDR6',
  'PowerColor Fighter OC Radeon RX 7700 XT 12GB GDDR6 Black',
  'PowerColor Fighter OC Radeon RX 7800 XT 16GB GDDR6 Black',
  'PowerColor Fighter Radeon RX 6700 10GB GDDR6 Black',
  'PowerColor Hellhound AMD Radeon RX 7900 XT 20GB OC GDDR6',
  'PowerColor Hellhound AMD Radeon RX 7900 XTX 24GB GDDR6',
  'PowerColor Hellhound OC Radeon RX 7600 XT 16GB GDDR6 Black',
  'PowerColor Hellhound OC Radeon RX 7700 XT 12GB GDDR6 Black',
  'PowerColor Hellhound OC Radeon RX 7900 GRE 16GB GDDR6 Black',
  'PowerColor Hellhound OC Radeon RX 9060 XT 16GB GDDR6 White',
  'PowerColor Hellhound OC Radeon RX 9060 XT 8GB GDDR6',
  'PowerColor Hellhound OC Radeon RX 9070 16GB GDDR6',
  'PowerColor Hellhound OC Radeon RX 9070 XT 16GB GDDR6',
  'PowerColor Hellhound Radeon RX 6600 XT 8GB GDDR6 Black',
  'PowerColor Hellhound Radeon RX 6650 XT 8GB GDDR6 Black',
  'PowerColor Hellhound Radeon RX 7600 8GB GDDR6 Black',
  'PowerColor Hellhound Sakura OC Limited Radeon RX 7800 XT 16GB GDDR6 White / Pink',
  'PowerColor Hellhound Sakura OC Radeon RX 7800 XT 16GB GDDR6 White / Pink',
  'PowerColor Hellhound Sakura Radeon RX 6650 XT 8GB GDDR6 White / Pink',
  'PowerColor Hellhound Spectral Radeon RX 6650 XT 8GB GDDR6 White',
  'PowerColor Hellhound Spectral Radeon RX 7800 XT 16GB GDDR6 White',
  'PowerColor Hellhound Spectral White AMD Radeon RX 7900 XTX 24GB GDDR6 OC',
  'PowerColor Hellhound Spectral White AMD Radeon RX 9070 XT 16GB GDDR6',
  'PowerColor Radeon RX 5600 XT AXRX 5600XT 6GBD6-3DH/OC 6GB GDDR6 Black',
  'PowerColor Radeon RX 5700 XT Red Dragon 8GB GDDR6 Black',
  'PowerColor Radeon RX 570 AXRX 570 8GBD5-3DHD/OC 8GB GDDR5 Black / Red',
  'PowerColor Radeon RX 580 AXRX 580 8GBD5-3DHDV2/OC 8GB GDDR5 Black',
  'PowerColor Radeon RX 580 Red Dragon 4GB GDDR5 Black / Red',
  'PowerColor Radeon RX 580 Red Dragon 8GB GDDR5 Black / Red',
  'PowerColor Radeon RX 6650 XT Red Devil OC 8GB GDDR6 Black',
  'PowerColor Radeon RX 6750 XT Red Devil OC 12GB GDDR6 Black',
  'PowerColor Radeon RX 6800 Fighter OC 16GB GDDR6 Black',
  'PowerColor Radeon RX 6800 XT Red Dragon OC 16GB GDDR6 Black',
  'PowerColor Radeon RX 7800 XT Hellhound OC 16GB GDDR6',
  'PowerColor Radeon RX 7900 XT Hellhound OC 20GB GDDR6 White',
  'PowerColor Radeon RX 9060 XT Hellhound OC 16GB GDDR6',
  'PowerColor Red Devil AMD Radeon RX 6700 XT OC 12GB GDDR6',
  'PowerColor Red Devil AMD Radeon RX 9070 16GB GDDR6 OC',
  'PowerColor Red Devil Golden Sample Radeon RX 580 8GB GDDR5 Black / Red',
  'PowerColor Red Devil Limited Edition OC Radeon RX 7800 XT 16GB GDDR6 Black',
  'PowerColor Red Devil Limited Edition OC Radeon RX 9070 XT 16GB GDDR6 Black',
  'PowerColor Red Devil Limited Edition Radeon RX 6800 XT 16GB GDDR6 Black / Red',
  'PowerColor Red Devil Limited Edition Radeon RX 6900 XT 16GB GDDR6 Black',
  'PowerColor Red Devil OC Radeon RX 6800 16GB GDDR6 Black',
  'PowerColor Red Devil OC Radeon RX 6800 XT 16GB GDDR6 Black',
  'PowerColor Red Devil OC Radeon RX 6900 XT 16GB GDDR6 Black',
  'PowerColor Red Devil OC Radeon RX 6950 XT 16GB GDDR6 Black',
  'PowerColor Red Devil OC Radeon RX 7700 XT 12GB GDDR6 Black',
  'PowerColor Red Devil OC Radeon RX 7800 XT 16GB GDDR6 Black',
  'PowerColor Red Devil OC Radeon RX 7900 GRE 16GB GDDR6 Black / Red',
  'PowerColor Red Devil OC Radeon RX 9070 XT 16GB GDDR6',
  'PowerColor Red Devil Radeon RX 480 8GB GDDR5 Black / Red',
  'PowerColor Red Devil Radeon RX 5600 XT 6GB GDDR6 Black / Silver',
  'PowerColor Red Devil Radeon RX 5700 8GB GDDR6 Black / Red',
  'PowerColor Red Devil Radeon RX 5700 XT 8GB GDDR6 Black / Red',
  'PowerColor Red Devil Radeon RX 570 4GB GDDR5 Black Red',
  'PowerColor Red Devil Radeon RX 590 8GB GDDR5 Black / Red',
  'PowerColor Red Devil Radeon RX 6600 XT 8GB GDDR6 Black',
  'PowerColor Red Devil Radeon RX 7900 XT 20GB GDDR6 Black',
  'PowerColor Red Devil Radeon RX 7900 XTX 24GB GDDR6 Black',
  'PowerColor Red Devil Radeon RX VEGA 56 8GB HBM2 Red / Black',
  'PowerColor Red Devil Radeon RX VEGA 64 8GB HBM2 Red / Black',
  'PowerColor Red Devil Radeon™ RX 580 8GB GDDR5',
  'PowerColor Red Devil Spectral White AMD Radeon RX 9070 XT 16GB GDDR6',
  'PowerColor Red Devil Ultimate Radeon RX 6900 XT 16GB GDDR6 Black',
  'PowerColor Red Dragon OC Radeon RX 6800 16GB GDDR6 Black',
  'PowerColor Red Dragon Radeon RX 5500 XT 8GB GDDR6 Black',
  'PowerColor Red Dragon Radeon RX 5600 XT 6GB GDDR6 Black / Silver',
  'PowerColor Red Dragon Radeon RX 5700 8GB GDDR6',
  'PowerColor Red Dragon Radeon RX VEGA 56 8GB HBM2 Black / Red',
];

export const partsHoldingOc: readonly CatalogPart[] = names.map((name) => ({
  category: 'gpu',
  name,
}));
