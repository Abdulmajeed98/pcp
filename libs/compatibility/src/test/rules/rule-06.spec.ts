import type { Build, PartAndQuantity, RamSpecifications } from '../../index';
import { outcomeOf } from '../outcome-of';

// A kit of DDR5 modules, of which the Build holds `quantity`.
function kit(
  id: string,
  modules: { quantity?: number; capacity_gb?: number },
  quantity = 1,
): PartAndQuantity<RamSpecifications> {
  return { id, quantity, specifications: { ram_type: 'DDR5', modules } };
}

function boardOfAtMost(max: number | undefined): Build['motherboard'] {
  return {
    id: 'the-board',
    specifications: { memory: { ram_type: 'DDR5', slots: 16, max } },
  };
}

describe("rule 6: the RAM's capacity and the motherboard's maximum memory", () => {
  it("passes less memory than the motherboard's maximum", () => {
    const build: Build = {
      motherboard: boardOfAtMost(64),
      ram: [kit('the-kit', { quantity: 2, capacity_gb: 16 })],
    };

    expect(outcomeOf(6, build)).toEqual({
      rule: 6,
      outcome: 'passes',
      parts: ['the-board', 'the-kit'],
    });
  });

  it("finds a Problem in more memory than the motherboard's maximum", () => {
    const build: Build = {
      motherboard: boardOfAtMost(32),
      ram: [kit('the-kit', { quantity: 2, capacity_gb: 32 })],
    };

    expect(outcomeOf(6, build)).toEqual({
      rule: 6,
      outcome: 'problem',
      parts: ['the-board', 'the-kit'],
    });
  });

  it("counts two of one kit as two kits' capacity", () => {
    const build: Build = {
      motherboard: boardOfAtMost(64),
      ram: [kit('the-kit', { quantity: 2, capacity_gb: 32 }, 2)],
    };

    expect(outcomeOf(6, build)).toEqual({
      rule: 6,
      outcome: 'problem',
      parts: ['the-board', 'the-kit'],
    });
  });

  it("passes as much memory as the motherboard's maximum, counting every kit", () => {
    const build: Build = {
      motherboard: boardOfAtMost(64),
      ram: [
        kit('a-kit-of-32-gb', { quantity: 2, capacity_gb: 16 }),
        kit('another-kit-of-32-gb', { quantity: 1, capacity_gb: 32 }),
      ],
    };

    expect(outcomeOf(6, build)).toEqual({
      rule: 6,
      outcome: 'passes',
      parts: ['the-board', 'a-kit-of-32-gb', 'another-kit-of-32-gb'],
    });
  });

  it("finds a Problem in one GB more than the motherboard's maximum, naming every kit", () => {
    const build: Build = {
      motherboard: boardOfAtMost(64),
      ram: [
        kit('a-kit-of-64-gb', { quantity: 2, capacity_gb: 16 }, 2),
        kit('a-kit-of-1-gb', { quantity: 1, capacity_gb: 1 }),
      ],
    };

    expect(outcomeOf(6, build)).toEqual({
      rule: 6,
      outcome: 'problem',
      parts: ['the-board', 'a-kit-of-64-gb', 'a-kit-of-1-gb'],
    });
  });

  it.each([
    ['the number of its modules', { capacity_gb: 16 }, 'modules.quantity'],
    ['the capacity of each module', { quantity: 2 }, 'modules.capacity_gb'],
  ])('is unchecked when a kit lacks %s', (_what, modules, path) => {
    const build: Build = { motherboard: boardOfAtMost(64), ram: [kit('the-kit', modules)] };

    expect(outcomeOf(6, build)).toEqual({
      rule: 6,
      outcome: 'unchecked',
      missing: [{ part: 'the-kit', path }],
    });
  });

  it("is unchecked when the motherboard's maximum is missing", () => {
    const build: Build = {
      motherboard: boardOfAtMost(undefined),
      ram: [kit('the-kit', { quantity: 2, capacity_gb: 16 })],
    };

    expect(outcomeOf(6, build)).toEqual({
      rule: 6,
      outcome: 'unchecked',
      missing: [{ part: 'the-board', path: 'memory.max' }],
    });
  });

  describe('unchecked only when it matters', () => {
    it('finds a Problem in the known kits beside a kit whose capacity is missing, naming the known ones', () => {
      const build: Build = {
        motherboard: boardOfAtMost(32),
        ram: [
          kit('a-kit-of-64-gb', { quantity: 2, capacity_gb: 32 }),
          kit('a-kit-of-no-capacity', { quantity: 2 }),
        ],
      };

      expect(outcomeOf(6, build)).toEqual({
        rule: 6,
        outcome: 'problem',
        parts: ['the-board', 'a-kit-of-64-gb'],
      });
    });
  });
});
