import { type Category, neededSpecificationsOf } from '../index';

// Written out from the spec's table of the Compatibility Rules, rules 1 to 7,
// and not read from the library: each Category's paths in the order the
// rules first read them.
describe('the needed specifications', () => {
  it.each<[Category, string[]]>([
    ['cpu', ['socket', 'specifications.memory.types']],
    ['cpuCooler', ['cpu_sockets']],
    [
      'motherboard',
      ['socket', 'memory.ram_type', 'memory.slots', 'memory.max', 'form_factor'],
    ],
    ['ram', ['ram_type', 'modules.quantity', 'modules.capacity_gb']],
    ['storage', []],
    ['gpu', []],
    ['case', ['supported_motherboard_form_factors']],
    ['psu', []],
  ])('of a Category, %s, are the paths the rules read in it', (category, paths) => {
    expect(neededSpecificationsOf(category)).toEqual(paths);
  });
});
