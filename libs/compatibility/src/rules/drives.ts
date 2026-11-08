import type { StorageSpecifications } from '../build';
import {
  type StorageFormFactor,
  type StorageInterface,
  storageFormFactors,
  storageInterfaces,
} from '../fixed-sets';
import { type Amount, amountWhatever, counted, nothing, total } from './amounts';
import type { Reading } from './reading';

// How the rules that count drives read a drive's kind (rules 13 to 16).

// An M.2 drive is one whose form factor is an M.2 size, such as M.2-2280.
export function isM2(formFactor: StorageFormFactor): boolean {
  return formFactor.startsWith('M.2-');
}

// The SATA drives of a Build, for rules 13 and 16: those whose interface is
// SATA 1.5, 3.0 or 6.0 Gb/s, and that are not M.2 drives. An M.2 drive of such
// an interface is an M.2 SATA drive, as one whose interface is M.2 SATA is
// (the owner's decision of 8 November 2026). An mSATA, SAS or U.2 drive is
// not a SATA drive either.
export function sataDrives(
  storage: readonly (DriveRead<'interface'> & DriveRead<'form_factor'>)[],
): Amount {
  return drivesWhose(
    storage,
    'interface',
    (iface) => sataInterfaces.includes(iface),
    (drive) => driveWhose(drive, 'form_factor', (formFactor) => !isM2(formFactor)),
  );
}

// The M.2 drives of a Build, for rule 14.
export function m2Drives(storage: readonly DriveRead<'form_factor'>[]): Amount {
  return drivesWhose(storage, 'form_factor', isM2);
}

// The M.2 drives of a Build that are not M.2 SATA drives, which only a slot
// keyed M takes (rule 14).
export function m2DrivesNotSata(
  storage: readonly (DriveRead<'form_factor'> & DriveRead<'interface'>)[],
): Amount {
  return drivesWhose(storage, 'form_factor', isM2, (drive) =>
    driveWhose(drive, 'interface', (iface) => !m2SataInterfaces.includes(iface)),
  );
}

// The drives of a Build whose value at a path is of a kind, such as those
// whose form factor is an M.2 size, as `driveWhose` counts each.
export function drivesWhose<Path extends DrivePath, Drive extends DriveRead<Path>>(
  storage: readonly Drive[],
  path: Path,
  isOfTheKind: (value: DriveValue<Path>) => boolean,
  count: (drive: Drive) => Amount = counted,
): Amount {
  return total(storage, (drive) => driveWhose(drive, path, isOfTheKind, count));
}

// A drive whose value at a path is of a kind, counted as many times as the
// Build holds it, or as `count` counts it, which may read the drive further;
// and nothing of a drive of another kind. A drive whose value is missing may
// be of the kind or not.
export function driveWhose<Path extends DrivePath, Drive extends DriveRead<Path>>(
  drive: Drive,
  path: Path,
  isOfTheKind: (value: DriveValue<Path>) => boolean,
  count: (drive: Drive) => Amount = counted,
): Amount {
  return amountWhatever(drive.read(path), valuesAt[path], (value) =>
    isOfTheKind(value) ? count(drive) : nothing,
  );
}

// What the rules that count drives read of a drive: its interface and its
// form factor.
type DrivePath = 'interface' | 'form_factor';

type DriveValue<Path extends DrivePath> = NonNullable<StorageSpecifications[Path]>;

// A drive whose value at a path a rule reads, with how many of it the Build
// holds.
type DriveRead<Path extends DrivePath> = {
  readonly id: string;
  readonly quantity: number;
  read(path: Path): Reading<DriveValue<Path>>;
};

// The values each could hold, for a missing one to be taken as any of them.
const valuesAt: { readonly [Path in DrivePath]: readonly DriveValue<Path>[] } = {
  interface: storageInterfaces,
  form_factor: storageFormFactors,
};

const sataInterfaces: readonly StorageInterface[] = [
  'SATA 1.5 Gb/s',
  'SATA 3.0 Gb/s',
  'SATA 6.0 Gb/s',
];

// The interfaces of an M.2 drive that make it an M.2 SATA drive.
const m2SataInterfaces: readonly StorageInterface[] = ['M.2 SATA', ...sataInterfaces];
