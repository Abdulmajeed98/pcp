import type { Build, PartAndQuantity, RamSpecifications } from '../../index';
import { outcomeOf } from '../outcome-of';

// A kit of DDR5 modules of 16 GB, of which the Build holds `quantity`.
function kit(
  id: string,
  modules: number | undefined,
  quantity = 1,
): PartAndQuantity<RamSpecifications> {
  return {
    id,
    quantity,
    specifications: { ram_type: 'DDR5', modules: { quantity: modules, capacity_gb: 16 } },
  };
}

function boardWithSlots(slots: number | undefined): Build['motherboard'] {
  return {
    id: 'the-board',
    specifications: { memory: { ram_type: 'DDR5', slots, max: 1024 } },
  };
}

describe("rule 5: the RAM's modules and the motherboard's memory slots", () => {
  it('passes fewer modules than the motherboard has slots', () => {
    const build: Build = { motherboard: boardWithSlots(4), ram: [kit('the-kit', 2)] };

    expect(outcomeOf(5, build)).toEqual({
      rule: 5,
      outcome: 'passes',
      parts: ['the-board', 'the-kit'],
    });
  });

  it('finds a Problem in more modules than the motherboard has slots', () => {
    const build: Build = { motherboard: boardWithSlots(2), ram: [kit('the-kit', 4)] };

    expect(outcomeOf(5, build)).toEqual({
      rule: 5,
      outcome: 'problem',
      parts: ['the-board', 'the-kit'],
    });
  });

  it("counts two of one kit as two kits' modules", () => {
    const build: Build = { motherboard: boardWithSlots(2), ram: [kit('the-kit', 2, 2)] };

    expect(outcomeOf(5, build)).toEqual({
      rule: 5,
      outcome: 'problem',
      parts: ['the-board', 'the-kit'],
    });
  });

  it("passes as many modules as the motherboard's slots, counting every kit", () => {
    const build: Build = {
      motherboard: boardWithSlots(4),
      ram: [kit('a-kit-of-two', 2), kit('another-kit-of-two', 2)],
    };

    expect(outcomeOf(5, build)).toEqual({
      rule: 5,
      outcome: 'passes',
      parts: ['the-board', 'a-kit-of-two', 'another-kit-of-two'],
    });
  });

  it("finds a Problem in one module more than the motherboard's slots, naming every kit", () => {
    const build: Build = {
      motherboard: boardWithSlots(4),
      ram: [kit('a-kit-of-two', 2, 2), kit('a-kit-of-one', 1)],
    };

    expect(outcomeOf(5, build)).toEqual({
      rule: 5,
      outcome: 'problem',
      parts: ['the-board', 'a-kit-of-two', 'a-kit-of-one'],
    });
  });

  it("is unchecked when a kit's modules are missing", () => {
    const build: Build = {
      motherboard: boardWithSlots(4),
      ram: [kit('the-kit', undefined)],
    };

    expect(outcomeOf(5, build)).toEqual({
      rule: 5,
      outcome: 'unchecked',
      missing: [{ part: 'the-kit', path: 'modules.quantity' }],
    });
  });

  describe('unchecked only when it matters', () => {
    it.each([
      ['one module', [kit('a-kit-of-one', 1)]],
      ['32 modules', [kit('a-kit-of-eight', 8, 2), kit('another-kit-of-eight', 8, 2)]],
    ])(
      'is unchecked whatever the kits hold, %s among them, when the slots are missing',
      (_what, ram) => {
        const build: Build = { motherboard: boardWithSlots(undefined), ram };

        expect(outcomeOf(5, build)).toEqual({
          rule: 5,
          outcome: 'unchecked',
          missing: [{ part: 'the-board', path: 'memory.slots' }],
        });
      },
    );

    it('finds a Problem in the known kits beside a kit whose modules are missing, naming the known ones', () => {
      const build: Build = {
        motherboard: boardWithSlots(2),
        ram: [kit('a-kit-of-four', 4), kit('a-kit-of-no-modules', undefined)],
      };

      expect(outcomeOf(5, build)).toEqual({
        rule: 5,
        outcome: 'problem',
        parts: ['the-board', 'a-kit-of-four'],
      });
    });
  });
});
