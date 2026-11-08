import { storageFormFactors, storageInterfaces } from '@pcp/compatibility';

import { Specification } from './Specification';
import { SpecificationList } from './SpecificationList';

// Every specification of a drive that OpenDB defines, apart from retailer and
// identity data. A 0 means "not known" for a capacity. A 0 cache is true: an
// SSD without DRAM has none.
export const storageSpecifications = new SpecificationList('storage', [
  Specification.oneOf('interface', 'Interface', storageInterfaces),
  Specification.oneOf('form_factor', 'Form factor', storageFormFactors),
  Specification.text('storage_type', 'Drive type'),
  Specification.wholeNumber('capacity', 'Capacity', { unit: 'GB', zeroMeansMissing: true }),
  Specification.wholeNumber('cache', 'Cache', { unit: 'MB' }),
  Specification.yesNo('nvme', 'NVMe'),
  Specification.listOfText('lighting', 'Lighting'),
]);
