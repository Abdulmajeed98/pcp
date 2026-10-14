import { sockets } from './shared-sets';
import { Specification } from './Specification';
import { SpecificationList } from './SpecificationList';

// Every specification of a CPU cooler that OpenDB defines, apart from retailer
// and identity data. A 0 means "not known" for a size, a speed or a level of
// noise; a cooler with no fan says so as fanless.
export const cpuCoolerSpecifications = new SpecificationList([
  Specification.severalOf('cpu_sockets', 'Sockets', sockets, { needed: true }),
  Specification.yesNo('water_cooled', 'Liquid cooled'),
  Specification.decimalNumber('height', 'Height', {
    unit: 'mm',
    needed: true,
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('radiator_size', 'Radiator size', {
    unit: 'mm',
    zeroMeansMissing: true,
  }),
  Specification.yesNo('fanless', 'Fanless'),
  Specification.wholeNumber('fan_size', 'Fan size', { unit: 'mm', zeroMeansMissing: true }),
  Specification.wholeNumber('fan_quantity', 'Fans', { zeroMeansMissing: true }),
  Specification.wholeNumber('min_fan_rpm', 'Lowest fan speed', {
    unit: 'RPM',
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('max_fan_rpm', 'Highest fan speed', {
    unit: 'RPM',
    zeroMeansMissing: true,
  }),
  Specification.decimalNumber('min_noise_level', 'Lowest noise level', {
    unit: 'dBA',
    zeroMeansMissing: true,
  }),
  Specification.decimalNumber('max_noise_level', 'Highest noise level', {
    unit: 'dBA',
    zeroMeansMissing: true,
  }),
  Specification.listOfText('color', 'Colours'),
  Specification.listOfText('lighting', 'Lighting'),
]);
