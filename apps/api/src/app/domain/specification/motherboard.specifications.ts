import { motherboardFormFactors, ramTypes, sockets } from './shared-sets';
import { Specification } from './Specification';
import { SpecificationList } from './SpecificationList';

// Every specification of a motherboard that OpenDB defines, apart from
// retailer and identity data. A 0 means "not known" for a memory size, a
// number of memory slots, a CPU fan header and a slot's lanes or quantity.
//
// It also means "not known" for SATA 6 Gb/s ports: OpenDB gives 0 for 1,051
// motherboards, current ones among them that certainly have them, and a rule
// that counts SATA drives would otherwise call those a Compatibility Problem.
// A 0 for the older SATA 3 Gb/s ports, which current boards do not have, is
// true.
export const motherboardSpecifications = new SpecificationList([
  Specification.oneOf('socket', 'Socket', sockets, { needed: true }),
  Specification.oneOf('form_factor', 'Form factor', motherboardFormFactors, {
    needed: true,
  }),
  Specification.text('chipset', 'Chipset'),
  Specification.oneOf('memory.ram_type', 'Memory type', ramTypes, { needed: true }),
  Specification.wholeNumber('memory.slots', 'Memory slots', {
    needed: true,
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('memory.max', 'Maximum memory', {
    unit: 'GB',
    needed: true,
    zeroMeansMissing: true,
  }),
  Specification.listOfRows(
    'pcie_slots',
    'PCIe slots',
    [
      Specification.text('gen', 'Generation'),
      Specification.wholeNumber('quantity', 'Slots', { zeroMeansMissing: true }),
      Specification.wholeNumber('lanes', 'Lanes', { zeroMeansMissing: true }),
    ],
    { needed: true },
  ),
  Specification.listOfRows(
    'm2_slots',
    'M.2 slots',
    [
      Specification.text('size', 'Sizes'),
      // A drive goes only in a slot keyed M. Slots keyed E are for wireless
      // cards.
      Specification.oneOf('key', 'Key', ['B', 'E', 'M']),
      Specification.text('interface', 'Interface'),
    ],
    { needed: true },
  ),
  Specification.wholeNumber('storage_devices.sata_6_gb_s', 'SATA 6 Gb/s ports', {
    needed: true,
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('storage_devices.sata_3_gb_s', 'SATA 3 Gb/s ports', {
    needed: true,
  }),
  Specification.wholeNumber('storage_devices.u2', 'U.2 ports'),
  Specification.listOfText('power_connectors.cpu_power', 'CPU power connectors', {
    needed: true,
  }),
  Specification.text('power_connectors.main_power', 'Main power connector'),
  Specification.yesNo('back_connect_connectors', 'Connectors on the back of the board', {
    needed: true,
  }),
  Specification.listOfRows('onboard_ethernet', 'Ethernet', [
    Specification.text('speed', 'Speed'),
    Specification.text('controller', 'Controller'),
  ]),
  Specification.text('wireless_networking', 'Wireless networking'),
  Specification.wholeNumber('usb_headers.usb_2_0', 'USB 2.0 headers'),
  Specification.wholeNumber('usb_headers.usb_3_2_gen_1', 'USB 3.2 Gen 1 headers'),
  Specification.wholeNumber('usb_headers.usb_3_2_gen_2', 'USB 3.2 Gen 2 headers'),
  Specification.wholeNumber('usb_headers.usb_3_2_gen_2x2', 'USB 3.2 Gen 2x2 headers'),
  Specification.wholeNumber('usb_headers.usb_4', 'USB4 headers'),
  Specification.wholeNumber('usb_headers.usb_4_80g', 'USB4 80 Gb/s headers'),
  Specification.wholeNumber('fan_headers.cpu_fan', 'CPU fan headers', {
    zeroMeansMissing: true,
  }),
  Specification.wholeNumber('fan_headers.cpu_opt', 'CPU optional fan headers'),
  Specification.wholeNumber('fan_headers.case_fan', 'Case fan headers'),
  Specification.wholeNumber('fan_headers.pump', 'Pump headers'),
  Specification.wholeNumber('rgb_headers.argb_5v', '5 V addressable RGB headers'),
  Specification.wholeNumber('rgb_headers.rgb_12v', '12 V RGB headers'),
  Specification.yesNo('front_panel_headers.power_button', 'Power button header'),
  Specification.yesNo('front_panel_headers.reset_button', 'Reset button header'),
  Specification.yesNo('front_panel_headers.power_led', 'Power light header'),
  Specification.yesNo('front_panel_headers.hdd_led', 'Drive light header'),
  Specification.wholeNumber(
    'other_headers.temperature_sensor',
    'Temperature sensor headers',
  ),
  Specification.wholeNumber('other_headers.thunderbolt', 'Thunderbolt headers'),
  Specification.wholeNumber('other_headers.com_port', 'COM port headers'),
  Specification.yesNo('ecc_support', 'ECC memory support'),
  Specification.yesNo('raid_support', 'RAID support'),
  Specification.yesNo('bios_features.flashback', 'BIOS flashback'),
  Specification.yesNo('bios_features.clear_cmos', 'Clear CMOS button'),
  Specification.text('audio.chipset', 'Audio chipset'),
  Specification.text('audio.channels', 'Audio channels'),
  Specification.listOfText('back_panel_ports', 'Back panel ports'),
  Specification.listOfText('color', 'Colours'),
  Specification.listOfText('lighting', 'Lighting'),
]);
