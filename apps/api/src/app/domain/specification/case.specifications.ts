import { motherboardFormFactors, powerSupplyFormFactors } from './shared-sets';
import { Specification } from './Specification';
import { SpecificationList } from './SpecificationList';

// Every specification of a case that OpenDB defines, apart from retailer and
// identity data. A 0 means "not known" for a largest size the case takes, for
// expansion slots and for the case's own size and weight. A 0 drive bay of
// one kind is true.
export const caseSpecifications = new SpecificationList([
  Specification.text('form_factor', 'Type'),
  Specification.severalOf(
    'supported_motherboard_form_factors',
    'Motherboard form factors it takes',
    motherboardFormFactors,
    { needed: true },
  ),
  Specification.decimalNumber('max_video_card_length', 'Longest GPU it takes', {
    unit: 'mm',
    needed: true,
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('expansion_slots', 'Expansion slots', {
    needed: true,
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('riser_expansion_slots', 'Riser expansion slots'),
  Specification.decimalNumber('max_cpu_cooler_height', 'Tallest CPU cooler it takes', {
    unit: 'mm',
    needed: true,
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('internal_3_5_bays', 'Internal 3.5-inch bays', {
    needed: true,
  }),
  Specification.wholeNumber('internal_2_5_bays', 'Internal 2.5-inch bays', {
    needed: true,
  }),
  Specification.wholeNumber('external_3_5_bays', 'External 3.5-inch bays'),
  Specification.wholeNumber('external_5_25_bays', 'External 5.25-inch bays'),
  Specification.severalOf(
    'supported_power_supply_form_factors',
    'PSU form factors it takes',
    powerSupplyFormFactors,
    { needed: true },
  ),
  Specification.wholeNumber('max_psu_length', 'Longest PSU it takes', {
    unit: 'mm',
    needed: true,
    zeroMeansMissing: true,
  }),
  Specification.yesNo(
    'supports_rear_connecting_motherboard',
    'Takes back-connect motherboards',
    {
      needed: true,
    },
  ),
  Specification.text('power_supply', 'PSU included'),
  Specification.yesNo('power_supply_included', 'Comes with a PSU'),
  Specification.yesNo('power_supply_shroud', 'PSU shroud'),
  Specification.text('side_panel', 'Side panel'),
  Specification.yesNo('has_transparent_side_panel', 'Transparent side panel'),
  Specification.text('front_panel_usb', 'Front USB'),
  Specification.listOfText('front_usb_ports', 'Front USB ports'),
  Specification.text('dimensions', 'Dimensions'),
  Specification.decimalNumber('dimensions_mm.width', 'Width', {
    unit: 'mm',
    zeroMeansMissing: true,
  }),
  Specification.decimalNumber('dimensions_mm.height', 'Height', {
    unit: 'mm',
    zeroMeansMissing: true,
  }),
  Specification.decimalNumber('dimensions_mm.depth', 'Depth', {
    unit: 'mm',
    zeroMeansMissing: true,
  }),
  Specification.decimalNumber('volume', 'Volume', { unit: 'L', zeroMeansMissing: true }),
  Specification.decimalNumber('weight', 'Weight', { unit: 'kg', zeroMeansMissing: true }),
  Specification.listOfText('color', 'Colours'),
  Specification.listOfText('lighting', 'Lighting'),
]);
