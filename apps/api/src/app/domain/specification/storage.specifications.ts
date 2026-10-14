import { Specification } from './Specification';
import { SpecificationList } from './SpecificationList';

// The values OpenDB's drives use at the commit the catalog is imported from.
// Compatibility Rules count drives by these: SATA drives against SATA ports,
// M.2 drives against M.2 slots, 3.5-inch and 2.5-inch drives against bays.
const storageFormFactors = [
  '2.5"',
  '3.5"',
  'M.2-2230',
  'M.2-2242',
  'M.2-2260',
  'M.2-2280',
  'M.2-22110',
  'mSATA',
  'PCIe',
] as const;

const storageInterfaces = [
  'M.2 PCIe 2.0 x4',
  'M.2 PCIe 3.0 x2',
  'M.2 PCIe 3.0 x4',
  'M.2 PCIe 3.0 x8',
  'M.2 PCIe 3.0 x16',
  'M.2 PCIe 4.0 x4',
  'M.2 PCIe 4.0 x8',
  'M.2 PCIe 5.0 x2',
  'M.2 PCIe 5.0 x4',
  'M.2 PCIe x1',
  'M.2 PCIe x2',
  'M.2 SATA',
  'mSATA',
  'PATA 100',
  'SAS 3.0 Gb/s',
  'SAS 6.0 Gb/s',
  'SAS 12.0 Gb/s',
  'SATA 1.5 Gb/s',
  'SATA 3.0 Gb/s',
  'SATA 6.0 Gb/s',
  'U.2',
] as const;

// Every specification of a drive that OpenDB defines, apart from retailer and
// identity data. A 0 means "not known" for a capacity. A 0 cache is true: an
// SSD without DRAM has none.
export const storageSpecifications = new SpecificationList([
  Specification.oneOf('interface', 'Interface', storageInterfaces, { needed: true }),
  Specification.oneOf('form_factor', 'Form factor', storageFormFactors, { needed: true }),
  Specification.text('storage_type', 'Drive type'),
  Specification.wholeNumber('capacity', 'Capacity', { unit: 'GB', zeroMeansMissing: true }),
  Specification.wholeNumber('cache', 'Cache', { unit: 'MB' }),
  Specification.yesNo('nvme', 'NVMe'),
  Specification.listOfText('lighting', 'Lighting'),
]);
