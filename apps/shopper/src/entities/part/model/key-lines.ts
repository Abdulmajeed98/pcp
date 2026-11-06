import type {
  LabelledSpecificationResponse,
  VisiblePartWithSpecificationsResponse,
} from '@pcp/api-client';

// The six key lines of a Part's box label, by their paths in the Part's
// specifications, as the Category's specification list names them
// (DESIGN.md's The specifications): first the key specifications BRW-2
// filters the Category by, then those a buyer weighs next, in that order.
// A path the Category's list does not hold would only leave its line out,
// so each is one the API answers today. The map holds every Category the
// API knows, so that one the API adds fails the type check.
const keyPaths = {
  cpu: [
    'socket',
    'cores.total',
    'cores.threads',
    'clocks.performance.boost',
    'cache.l3',
    'specifications.tdp',
  ],
  cpuCooler: [
    'water_cooled',
    'radiator_size',
    'cpu_sockets',
    'height',
    'fan_size',
    'fan_quantity',
  ],
  motherboard: [
    'socket',
    'form_factor',
    'memory.ram_type',
    'chipset',
    'memory.slots',
    'memory.max',
  ],
  ram: ['ram_type', 'capacity', 'speed', 'modules.quantity', 'cas_latency', 'form_factor'],
  storage: ['storage_type', 'capacity', 'interface', 'form_factor', 'nvme', 'cache'],
  gpu: ['chipset', 'memory', 'memory_type', 'core_boost_clock', 'tdp', 'length'],
  case: [
    'form_factor',
    'supported_motherboard_form_factors',
    'max_video_card_length',
    'max_cpu_cooler_height',
    'supported_power_supply_form_factors',
    'expansion_slots',
  ],
  psu: [
    'wattage',
    'efficiency_rating',
    'form_factor',
    'modular',
    'length',
    'connectors.pcie_6_plus_2_pin',
  ],
} as const satisfies Record<
  VisiblePartWithSpecificationsResponse['category'],
  readonly string[]
>;

// The lines of a Part's box label: its Category's key specifications that
// the Part holds, each as the API answers it, in the label's order. A key
// specification the Part does not hold is left out, as the API leaves it
// out, so a Part the catalog knows little of has fewer lines.
export function keyLinesOf({
  category,
  specifications,
}: Pick<
  VisiblePartWithSpecificationsResponse,
  'category' | 'specifications'
>): LabelledSpecificationResponse[] {
  return keyPaths[category].flatMap((path) => {
    const held = specifications.find((specification) => specification.path === path);
    return held === undefined ? [] : [held];
  });
}
