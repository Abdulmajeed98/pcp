import { type Category, neededSpecificationsOf } from '../index';

// Written out from the spec's table of the Compatibility Rules, rules 1 to 7
// and 13 to 21, and not read from the library: each Category's paths in the
// order the rules first read them.
describe('the needed specifications', () => {
  it.each<[Category, string[]]>([
    ['cpu', ['socket', 'specifications.memory.types']],
    ['cpuCooler', ['cpu_sockets', 'water_cooled', 'height']],
    [
      'motherboard',
      [
        'socket',
        'memory.ram_type',
        'memory.slots',
        'memory.max',
        'form_factor',
        'storage_devices.sata_6_gb_s',
        'storage_devices.sata_3_gb_s',
        'm2_slots',
      ],
    ],
    ['ram', ['ram_type', 'modules.quantity', 'modules.capacity_gb']],
    ['storage', ['interface', 'form_factor']],
    ['gpu', []],
    [
      'case',
      [
        'supported_motherboard_form_factors',
        'max_cpu_cooler_height',
        'supported_power_supply_form_factors',
        'max_psu_length',
      ],
    ],
    ['psu', ['connectors.sata', 'form_factor', 'length']],
  ])('of a Category, %s, are the paths the rules read in it', (category, paths) => {
    expect(neededSpecificationsOf(category)).toEqual(paths);
  });
});
