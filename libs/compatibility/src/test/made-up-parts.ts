import type {
  Build,
  PartAndQuantity,
  StorageFormFactor,
  StorageInterface,
  StorageSpecifications,
} from '../index';

// Made-up Parts that the tests of several rules build their Builds of. Each
// value a test does not give is missing.

// A CPU of a TDP.
export function cpuOf(tdp: number | undefined): Build['cpu'] {
  return { id: 'the-cpu', specifications: { socket: 'AM5', specifications: { tdp } } };
}

// A GPU of a TDP.
export function gpuOf(tdp: number | undefined): Build['gpu'] {
  return { id: 'the-gpu', specifications: { tdp } };
}

// A drive of a form factor and an interface, of which the Build holds
// `quantity`.
export function drive(
  id: string,
  formFactor: StorageFormFactor | undefined,
  iface: StorageInterface | undefined,
  quantity = 1,
): PartAndQuantity<StorageSpecifications> {
  return { id, quantity, specifications: { form_factor: formFactor, interface: iface } };
}
