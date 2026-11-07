import { type Category, neededSpecificationsOf } from '../index';

// Written out from the spec's table of the Compatibility Rules, rules 1 to
// 14, 16 to 19 and 21, and not read from the library: each Category's paths
// in the order the rules first read them, rule 12 reading a GPU's TDP when
// the Build holds a GPU.
describe('the needed specifications', () => {
  it.each<[Category, string[]]>([
    ['cpu', ['socket', 'specifications.memory.types', 'specifications.tdp']],
    ['cpuCooler', ['cpu_sockets', 'water_cooled', 'height']],
    [
      'motherboard',
      [
        'socket',
        'memory.ram_type',
        'memory.slots',
        'memory.max',
        'form_factor',
        'pcie_slots',
        'storage_devices.sata_6_gb_s',
        'storage_devices.sata_3_gb_s',
        'm2_slots',
        'back_connect_connectors',
      ],
    ],
    ['ram', ['ram_type', 'modules.quantity', 'modules.capacity_gb']],
    ['storage', ['interface', 'form_factor']],
    [
      'gpu',
      [
        'length',
        'total_slot_width',
        'power_connectors.pcie_6_pin',
        'power_connectors.pcie_8_pin',
        'power_connectors.pcie_12VHPWR',
        'power_connectors.pcie_12V_2x6',
        'tdp',
      ],
    ],
    [
      'case',
      [
        'supported_motherboard_form_factors',
        'max_video_card_length',
        'expansion_slots',
        'internal_3_5_bays',
        'internal_2_5_bays',
        'max_cpu_cooler_height',
        'supported_power_supply_form_factors',
        'max_psu_length',
        'supports_rear_connecting_motherboard',
      ],
    ],
    [
      'psu',
      [
        'connectors.pcie_6_plus_2_pin',
        'connectors.pcie_12vhpwr',
        'wattage',
        'connectors.sata',
        'form_factor',
        'length',
      ],
    ],
  ])('of a Category, %s, are the paths the rules read in it', (category, paths) => {
    expect(neededSpecificationsOf(category)).toEqual(paths);
  });
});
