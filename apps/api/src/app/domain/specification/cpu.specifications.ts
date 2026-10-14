import { Specification } from './Specification';
import { SpecificationList } from './SpecificationList';

// The sockets OpenDB's CPUs use at the commit the catalog is imported from.
// A CPU of a newer socket is added here, in code. A Compatibility Rule compares
// a CPU's socket with a motherboard's and a cooler's, so this is a fixed set:
// two spellings of one socket would make a false Compatibility Problem.
const cpuSockets = [
  'AM3+',
  'AM4',
  'AM5',
  'FM2',
  'FM2+',
  'G34',
  'LGA 1150',
  'LGA 1151',
  'LGA 1155',
  'LGA 1200',
  'LGA 1356',
  'LGA 1700',
  'LGA 1851',
  'LGA 2011',
  'LGA 2011-3',
  'LGA 2066',
  'sTR4',
  'sTR5',
  'sTRX4',
  'TR4',
] as const;

const ramTypes = ['DDR3', 'DDR4', 'DDR5'] as const;

// Every specification of a CPU that OpenDB defines, apart from retailer and
// identity data. A 0 means "not known" in OpenDB wherever 0 cannot be true:
// a clock speed, a core count other than efficiency cores, a cache size other
// than L3, which some older AMD processors do not have, and a power figure.
export const cpuSpecifications = new SpecificationList([
  Specification.oneOf('socket', 'Socket', cpuSockets, { needed: true }),
  Specification.text('series', 'Series'),
  Specification.text('microarchitecture', 'Microarchitecture'),
  Specification.text('coreFamily', 'Core family'),
  Specification.wholeNumber('cores.total', 'Cores', { zeroMeansMissing: true }),
  Specification.wholeNumber('cores.performance', 'Performance cores', {
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('cores.efficiency', 'Efficiency cores'),
  Specification.wholeNumber('cores.threads', 'Threads', { zeroMeansMissing: true }),
  Specification.decimalNumber('clocks.performance.base', 'Performance core base clock', {
    unit: 'GHz',
    zeroMeansMissing: true,
  }),
  Specification.decimalNumber('clocks.performance.boost', 'Performance core boost clock', {
    unit: 'GHz',
    zeroMeansMissing: true,
  }),
  Specification.decimalNumber('clocks.efficiency.base', 'Efficiency core base clock', {
    unit: 'GHz',
    zeroMeansMissing: true,
  }),
  Specification.decimalNumber('clocks.efficiency.boost', 'Efficiency core boost clock', {
    unit: 'GHz',
    zeroMeansMissing: true,
  }),
  Specification.text('cache.l1', 'L1 cache'),
  Specification.decimalNumber('cache.l2', 'L2 cache', {
    unit: 'MB',
    zeroMeansMissing: true,
  }),
  Specification.decimalNumber('cache.l3', 'L3 cache', { unit: 'MB' }),
  Specification.wholeNumber('specifications.tdp', 'TDP', {
    unit: 'W',
    needed: true,
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('specifications.ppt', 'Package power tracking (PPT)', {
    unit: 'W',
    zeroMeansMissing: true,
  }),
  // "None" for a CPU without integrated graphics, as OpenDB writes it.
  Specification.text('specifications.integratedGraphics.model', 'Integrated graphics'),
  Specification.wholeNumber(
    'specifications.integratedGraphics.baseClock',
    'Integrated graphics base clock',
    { unit: 'MHz', zeroMeansMissing: true },
  ),
  Specification.wholeNumber(
    'specifications.integratedGraphics.boostClock',
    'Integrated graphics boost clock',
    { unit: 'MHz', zeroMeansMissing: true },
  ),
  Specification.wholeNumber(
    'specifications.integratedGraphics.shaderCount',
    'Integrated graphics shaders',
    { zeroMeansMissing: true },
  ),
  Specification.yesNo('specifications.eccSupport', 'ECC memory support'),
  Specification.yesNo('specifications.includesCooler', 'Cooler included'),
  Specification.text('specifications.packaging', 'Packaging'),
  Specification.text('specifications.lithography', 'Lithography'),
  Specification.yesNo(
    'specifications.simultaneousMultithreading',
    'Simultaneous multithreading',
  ),
  Specification.wholeNumber('specifications.memory.maxSupport', 'Maximum memory', {
    unit: 'GB',
    zeroMeansMissing: true,
  }),
  Specification.severalOf('specifications.memory.types', 'Memory types', ramTypes, {
    needed: true,
  }),
  Specification.wholeNumber('specifications.memory.channels', 'Memory channels', {
    zeroMeansMissing: true,
  }),
]);
