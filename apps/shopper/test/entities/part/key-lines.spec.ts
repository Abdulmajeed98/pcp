import type { LabelledSpecificationResponse } from '@pcp/api-client';
import { describe, expect, it } from 'vitest';

import { keyLinesOf } from '@/entities/part';

// A specification as the API answers it, by its path, with a value.
function held(path: string, value: LabelledSpecificationResponse['value'] = 1) {
  return {
    path,
    label: `Label of ${path}`,
    kind: 'wholeNumber' as const,
    unit: null,
    value,
  };
}

// A CPU's specifications as the API answers them, in its Category's order.
const aCpusSpecifications = [
  held('socket', 'AM5'),
  held('series', 'Ryzen 7 7000'),
  held('microarchitecture', 'Zen 4'),
  held('cores.total', 8),
  held('cores.threads', 16),
  held('clocks.performance.base', 4.2),
  held('clocks.performance.boost', 5),
  held('cache.l3', 96),
  held('specifications.tdp', 120),
  held('specifications.memory.types', ['DDR5']),
];

// The six lines of a Part's box label (DESIGN.md's The specifications): its
// Category's key specifications, the ones BRW-2 names for its filters first,
// then those a buyer weighs next, each as the Part holds it.
describe("a Part's box label", () => {
  it("takes its Category's key specifications in the label's order, six at the most", () => {
    expect(
      keyLinesOf({ category: 'cpu', specifications: aCpusSpecifications }).map(
        ({ path }) => path,
      ),
    ).toEqual([
      'socket',
      'cores.total',
      'cores.threads',
      'clocks.performance.boost',
      'cache.l3',
      'specifications.tdp',
    ]);
  });

  it('leaves out a key specification the Part does not hold', () => {
    const withoutThreads = aCpusSpecifications.filter(
      ({ path }) => path !== 'cores.threads',
    );
    expect(
      keyLinesOf({ category: 'cpu', specifications: withoutThreads }).map(
        ({ path }) => path,
      ),
    ).toEqual([
      'socket',
      'cores.total',
      'clocks.performance.boost',
      'cache.l3',
      'specifications.tdp',
    ]);
  });

  it('keeps each line as the API answers it, its label and value with them', () => {
    const [socket] = keyLinesOf({ category: 'cpu', specifications: aCpusSpecifications });
    expect(socket).toEqual(held('socket', 'AM5'));
  });

  it("starts each Category's label with the specifications BRW-2 filters it by", () => {
    const firstOf = (
      category: Parameters<typeof keyLinesOf>[0]['category'],
      paths: string[],
    ) =>
      keyLinesOf({ category, specifications: paths.map((path) => held(path)) })
        .slice(0, paths.length)
        .map(({ path }) => path);
    expect(firstOf('cpu', ['socket', 'cores.total'])).toEqual(['socket', 'cores.total']);
    expect(firstOf('cpuCooler', ['water_cooled', 'radiator_size'])).toEqual([
      'water_cooled',
      'radiator_size',
    ]);
    expect(firstOf('motherboard', ['socket', 'form_factor', 'memory.ram_type'])).toEqual([
      'socket',
      'form_factor',
      'memory.ram_type',
    ]);
    expect(firstOf('ram', ['ram_type', 'capacity', 'speed'])).toEqual([
      'ram_type',
      'capacity',
      'speed',
    ]);
    expect(firstOf('storage', ['storage_type', 'capacity', 'interface'])).toEqual([
      'storage_type',
      'capacity',
      'interface',
    ]);
    expect(firstOf('gpu', ['chipset', 'memory'])).toEqual(['chipset', 'memory']);
    expect(firstOf('case', ['form_factor'])).toEqual(['form_factor']);
    expect(firstOf('psu', ['wattage', 'efficiency_rating'])).toEqual([
      'wattage',
      'efficiency_rating',
    ]);
  });
});
