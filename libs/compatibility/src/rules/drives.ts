import type { StorageInterface } from '../fixed-sets';

// How the rules that count drives read a drive's kind (rules 13 to 16).

// A SATA drive, for rules 13 and 16, is one whose interface is SATA 1.5, 3.0
// or 6.0 Gb/s. An M.2 SATA, mSATA, SAS or U.2 drive is not.
export function isSata(iface: StorageInterface): boolean {
  return sataInterfaces.includes(iface);
}

const sataInterfaces: readonly StorageInterface[] = [
  'SATA 1.5 Gb/s',
  'SATA 3.0 Gb/s',
  'SATA 6.0 Gb/s',
];
