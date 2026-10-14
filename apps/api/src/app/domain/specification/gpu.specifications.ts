import { Specification } from './Specification';
import { SpecificationList } from './SpecificationList';

// Every specification of a GPU that OpenDB defines, apart from retailer and
// identity data. A 0 means "not known" for a size, a clock, a memory figure,
// the TDP and the number of cores. The radiator and its fans are only those of
// a hybrid or liquid-cooled card, and a 0 there stands for none. A 0 power connector or
// video output of one kind is true: a card has none of that kind.
export const gpuSpecifications = new SpecificationList([
  Specification.text('chipset_manufacturer', 'Chipset manufacturer'),
  Specification.text('chipset', 'Chipset'),
  Specification.wholeNumber('memory', 'Memory', { unit: 'GB', zeroMeansMissing: true }),
  Specification.text('memory_type', 'Memory type'),
  Specification.wholeNumber('core_count', 'Cores', { zeroMeansMissing: true }),
  Specification.wholeNumber('core_base_clock', 'Base clock', {
    unit: 'MHz',
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('core_boost_clock', 'Boost clock', {
    unit: 'MHz',
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('effective_memory_clock', 'Effective memory clock', {
    unit: 'MHz',
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('memory_bus', 'Memory bus', {
    unit: 'bit',
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('tdp', 'TDP', {
    unit: 'W',
    needed: true,
    zeroMeansMissing: true,
  }),
  Specification.text('interface', 'Interface'),
  Specification.decimalNumber('length', 'Length', {
    unit: 'mm',
    needed: true,
    zeroMeansMissing: true,
  }),
  Specification.decimalNumber('total_slot_width', 'Slots it occupies', {
    needed: true,
    zeroMeansMissing: true,
  }),
  Specification.decimalNumber(
    'case_expansion_slot_width',
    'Case expansion slots it covers',
    {
      zeroMeansMissing: true,
    },
  ),
  Specification.wholeNumber('power_connectors.pcie_6_pin', 'PCIe 6-pin power sockets', {
    needed: true,
  }),
  Specification.wholeNumber('power_connectors.pcie_8_pin', 'PCIe 8-pin power sockets', {
    needed: true,
  }),
  Specification.wholeNumber('power_connectors.pcie_12VHPWR', '12VHPWR power sockets', {
    needed: true,
  }),
  Specification.wholeNumber('power_connectors.pcie_12V_2x6', '12V-2x6 power sockets', {
    needed: true,
  }),
  Specification.text('cooling', 'Cooling'),
  Specification.wholeNumber('radiator_size', 'External radiator size', {
    unit: 'mm',
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('fan_size', 'External radiator fan size', {
    unit: 'mm',
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('fan_quantity', 'External radiator fans', {
    zeroMeansMissing: true,
  }),
  Specification.text('frame_sync', 'Frame sync'),
  Specification.wholeNumber('video_outputs.hdmi_2_2', 'HDMI 2.2 outputs'),
  Specification.wholeNumber('video_outputs.hdmi_2_1', 'HDMI 2.1 outputs'),
  Specification.wholeNumber('video_outputs.hdmi_2_1a', 'HDMI 2.1a outputs'),
  Specification.wholeNumber('video_outputs.hdmi_2_1b', 'HDMI 2.1b outputs'),
  Specification.wholeNumber('video_outputs.hdmi_2_0', 'HDMI 2.0 outputs'),
  Specification.wholeNumber('video_outputs.hdmi_2_0a', 'HDMI 2.0a outputs'),
  Specification.wholeNumber('video_outputs.hdmi_2_0b', 'HDMI 2.0b outputs'),
  Specification.wholeNumber('video_outputs.displayport_2_1', 'DisplayPort 2.1 outputs'),
  Specification.wholeNumber('video_outputs.displayport_2_1a', 'DisplayPort 2.1a outputs'),
  Specification.wholeNumber('video_outputs.displayport_2_1_b', 'DisplayPort 2.1b outputs'),
  Specification.wholeNumber('video_outputs.displayport_1_4a', 'DisplayPort 1.4a outputs'),
  Specification.wholeNumber('video_outputs.usb_c', 'USB-C outputs'),
  Specification.wholeNumber('video_outputs.dvi_d', 'DVI-D outputs'),
  Specification.wholeNumber('video_outputs.vga', 'VGA outputs'),
  Specification.listOfText('color', 'Colours'),
  Specification.listOfText('lighting', 'Lighting'),
]);
