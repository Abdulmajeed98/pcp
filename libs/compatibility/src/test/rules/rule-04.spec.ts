import type { Build } from '../../index';
import { outcomeOf } from '../outcome-of';

describe("rule 4: each RAM kit's type and the motherboard's", () => {
  it("passes a kit of the motherboard's type", () => {
    const build: Build = {
      motherboard: { id: 'the-board', specifications: { memory: { ram_type: 'DDR5' } } },
      ram: [{ id: 'the-kit', quantity: 1, specifications: { ram_type: 'DDR5' } }],
    };

    expect(outcomeOf(4, build)).toEqual({
      rule: 4,
      outcome: 'passes',
      parts: ['the-board', 'the-kit'],
    });
  });

  it("finds a Problem in a kit of another type than the motherboard's", () => {
    const build: Build = {
      motherboard: { id: 'the-board', specifications: { memory: { ram_type: 'DDR5' } } },
      ram: [{ id: 'the-kit', quantity: 1, specifications: { ram_type: 'DDR4' } }],
    };

    expect(outcomeOf(4, build)).toEqual({
      rule: 4,
      outcome: 'problem',
      parts: ['the-board', 'the-kit'],
    });
  });

  it('judges each kit, naming only those the motherboard does not take', () => {
    const build: Build = {
      motherboard: { id: 'the-board', specifications: { memory: { ram_type: 'DDR5' } } },
      ram: [
        { id: 'a-ddr4-kit', quantity: 1, specifications: { ram_type: 'DDR4' } },
        { id: 'a-ddr5-kit', quantity: 1, specifications: { ram_type: 'DDR5' } },
      ],
    };

    expect(outcomeOf(4, build)).toEqual({
      rule: 4,
      outcome: 'problem',
      parts: ['the-board', 'a-ddr4-kit'],
    });
  });

  it("is unchecked when the motherboard's type is missing", () => {
    const build: Build = {
      motherboard: { id: 'the-board', specifications: {} },
      ram: [{ id: 'the-kit', quantity: 1, specifications: { ram_type: 'DDR5' } }],
    };

    expect(outcomeOf(4, build)).toEqual({
      rule: 4,
      outcome: 'unchecked',
      missing: [{ part: 'the-board', path: 'memory.ram_type' }],
    });
  });

  it("is unchecked when a kit's type is missing", () => {
    const build: Build = {
      motherboard: { id: 'the-board', specifications: { memory: { ram_type: 'DDR5' } } },
      ram: [{ id: 'the-kit', quantity: 1, specifications: {} }],
    };

    expect(outcomeOf(4, build)).toEqual({
      rule: 4,
      outcome: 'unchecked',
      missing: [{ part: 'the-kit', path: 'ram_type' }],
    });
  });

  describe('unchecked only when it matters', () => {
    it('finds a Problem in a known kit the motherboard does not take, beside a kit whose type is missing', () => {
      const build: Build = {
        motherboard: { id: 'the-board', specifications: { memory: { ram_type: 'DDR5' } } },
        ram: [
          { id: 'a-kit-of-no-type', quantity: 1, specifications: {} },
          { id: 'a-ddr4-kit', quantity: 1, specifications: { ram_type: 'DDR4' } },
        ],
      };

      expect(outcomeOf(4, build)).toEqual({
        rule: 4,
        outcome: 'problem',
        parts: ['the-board', 'a-ddr4-kit'],
      });
    });

    it('is unchecked, naming the other kit and its type, when the known kit fits', () => {
      const build: Build = {
        motherboard: { id: 'the-board', specifications: { memory: { ram_type: 'DDR5' } } },
        ram: [
          { id: 'a-ddr5-kit', quantity: 1, specifications: { ram_type: 'DDR5' } },
          { id: 'a-kit-of-no-type', quantity: 1, specifications: {} },
        ],
      };

      expect(outcomeOf(4, build)).toEqual({
        rule: 4,
        outcome: 'unchecked',
        missing: [{ part: 'a-kit-of-no-type', path: 'ram_type' }],
      });
    });

    it("finds a Problem in two kits of different types, whatever the motherboard's missing type", () => {
      const build: Build = {
        motherboard: { id: 'the-board', specifications: {} },
        ram: [
          { id: 'a-ddr4-kit', quantity: 1, specifications: { ram_type: 'DDR4' } },
          { id: 'a-ddr5-kit', quantity: 1, specifications: { ram_type: 'DDR5' } },
        ],
      };

      expect(outcomeOf(4, build)).toEqual({
        rule: 4,
        outcome: 'problem',
        parts: ['the-board', 'a-ddr4-kit', 'a-ddr5-kit'],
      });
    });
  });
});
