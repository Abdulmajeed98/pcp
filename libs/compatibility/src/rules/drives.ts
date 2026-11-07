import {
  type StorageFormFactor,
  type StorageInterface,
  storageInterfaces,
} from '../fixed-sets';
import { type Amount, amountWhatever, counted, nothing, total } from './amounts';
import type { Reading } from './reading';

// How the rules that count drives read a drive's kind (rules 13 to 16).

// An M.2 drive, for rule 14, is one whose form factor is an M.2 size, such as
// M.2-2280.
export function isM2(formFactor: StorageFormFactor): boolean {
  return formFactor.startsWith('M.2-');
}

// The SATA drives of a Build, for rules 13 and 16, each counted as many times
// as the Build holds it. A SATA drive is one whose interface is SATA 1.5, 3.0
// or 6.0 Gb/s: an M.2 SATA, mSATA, SAS or U.2 drive is not. A drive whose
// interface is missing may be one or not.
export function sataDrives(storage: readonly DriveRead[]): Amount {
  return total(storage, (drive) =>
    amountWhatever(drive.read('interface'), storageInterfaces, (iface) =>
      sataInterfaces.includes(iface) ? counted(drive) : nothing,
    ),
  );
}

// A drive whose interface a rule reads, with how many of it the Build holds.
type DriveRead = {
  readonly id: string;
  readonly quantity: number;
  read(path: 'interface'): Reading<StorageInterface>;
};

const sataInterfaces: readonly StorageInterface[] = [
  'SATA 1.5 Gb/s',
  'SATA 3.0 Gb/s',
  'SATA 6.0 Gb/s',
];
