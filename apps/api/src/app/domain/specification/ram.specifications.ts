import { ramTypes } from './shared-sets';
import { Specification } from './Specification';
import { SpecificationList } from './SpecificationList';

// Every specification of a RAM kit that OpenDB defines, apart from retailer
// and identity data. A 0 means "not known" for every number here.
export const ramSpecifications = new SpecificationList([
  Specification.oneOf('ram_type', 'Memory type', ramTypes, { needed: true }),
  Specification.wholeNumber('modules.quantity', 'Modules', {
    needed: true,
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('modules.capacity_gb', 'Capacity of each module', {
    unit: 'GB',
    needed: true,
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('capacity', 'Total capacity', {
    unit: 'GB',
    zeroMeansMissing: true,
  }),
  // In MHz as OpenDB and the shops give it: DDR5-6000 is 6000.
  Specification.wholeNumber('speed', 'Speed', { unit: 'MHz', zeroMeansMissing: true }),
  Specification.text('form_factor', 'Form factor'),
  Specification.wholeNumber('cas_latency', 'CAS latency', { zeroMeansMissing: true }),
  Specification.text('timings', 'Timings'),
  Specification.decimalNumber('voltage', 'Voltage', { unit: 'V', zeroMeansMissing: true }),
  Specification.text('ecc', 'ECC'),
  Specification.text('registered', 'Registered'),
  Specification.listOfText('profile_support', 'Overclocking profiles'),
  Specification.yesNo('heat_spreader', 'Heat spreader'),
  Specification.yesNo('rgb', 'RGB lighting'),
  Specification.decimalNumber('height', 'Height', { unit: 'mm', zeroMeansMissing: true }),
  Specification.listOfText('color', 'Colours'),
  Specification.listOfText('lighting', 'Lighting'),
]);
