import { powerSupplyFormFactors } from './shared-sets';
import { Specification } from './Specification';
import { SpecificationList } from './SpecificationList';

// Every specification of a PSU that OpenDB defines, apart from retailer and
// identity data. A 0 means "not known" for the wattage, the length and the
// 24-pin, EPS, PCIe 6+2-pin and SATA connectors: OpenDB gives 0 EPS connectors
// for 477 ATX supplies of 650 W or more, which all have them. A 0 for a
// 12VHPWR, Molex or floppy connector is true, as older supplies have none.
export const psuSpecifications = new SpecificationList([
  Specification.wholeNumber('wattage', 'Wattage', {
    unit: 'W',
    needed: true,
    zeroMeansMissing: true,
  }),
  Specification.oneOf('form_factor', 'Form factor', powerSupplyFormFactors, {
    needed: true,
  }),
  Specification.wholeNumber('length', 'Length', {
    unit: 'mm',
    needed: true,
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('connectors.eps_8_pin', 'EPS 8-pin connectors', {
    needed: true,
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('connectors.pcie_6_plus_2_pin', 'PCIe 6+2-pin connectors', {
    needed: true,
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('connectors.pcie_12vhpwr', '12VHPWR connectors', {
    needed: true,
  }),
  Specification.wholeNumber('connectors.sata', 'SATA power connectors', {
    needed: true,
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('connectors.atx_24_pin', '24-pin connectors', {
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('connectors.molex_4_pin', 'Molex connectors'),
  Specification.wholeNumber('connectors.floppy_4_pin', 'Floppy connectors'),
  Specification.text('efficiency_rating', 'Efficiency rating'),
  Specification.text('cybernetics_efficiency_rating', 'Cybenetics efficiency rating'),
  Specification.text('cybernetics_noise_rating', 'Cybenetics noise rating'),
  Specification.text('modular', 'Modular'),
  Specification.yesNo('fanless', 'Fanless'),
  Specification.listOfText('color', 'Colours'),
  Specification.listOfText('lighting', 'Lighting'),
]);
