import { type Build, judgeBuild, type PcieSlots } from '../../index';

const gpu: Build['gpu'] = { id: 'the-gpu', specifications: {} };

function boardWithSlots(pcieSlots: readonly PcieSlots[] | undefined): Build['motherboard'] {
  return { id: 'the-board', specifications: { pcie_slots: pcieSlots } };
}

describe('rule 8: a 16-lane PCIe slot for the GPU', () => {
  it('passes a motherboard with a 16-lane slot', () => {
    const build: Build = {
      motherboard: boardWithSlots([{ gen: 'PCIe 5.0', quantity: 1, lanes: 16 }]),
      gpu,
    };

    expect(judgeBuild(build)).toEqual([
      { rule: 8, outcome: 'passes', parts: ['the-board', 'the-gpu'] },
    ]);
  });

  it('finds a Problem in a motherboard whose slots have no row of 16 lanes', () => {
    const build: Build = {
      motherboard: boardWithSlots([
        { gen: 'PCIe 4.0', quantity: 1, lanes: 8 },
        { gen: 'PCIe 3.0', quantity: 2, lanes: 1 },
      ]),
      gpu,
    };

    expect(judgeBuild(build)).toEqual([
      { rule: 8, outcome: 'problem', parts: ['the-board', 'the-gpu'] },
    ]);
  });

  it('finds a Problem in a motherboard whose list of slots is empty, since it has none', () => {
    const build: Build = { motherboard: boardWithSlots([]), gpu };

    expect(judgeBuild(build)).toEqual([
      { rule: 8, outcome: 'problem', parts: ['the-board', 'the-gpu'] },
    ]);
  });

  it("is unchecked when the motherboard's PCIe slots are missing", () => {
    const build: Build = { motherboard: boardWithSlots(undefined), gpu };

    expect(judgeBuild(build)).toEqual([
      {
        rule: 8,
        outcome: 'unchecked',
        missing: [{ part: 'the-board', path: 'pcie_slots' }],
      },
    ]);
  });

  describe('unchecked only when it matters', () => {
    it('is unchecked, naming the row, when a row of unknown lanes could be the 16-lane one', () => {
      const build: Build = {
        motherboard: boardWithSlots([
          { gen: 'PCIe 4.0', quantity: 2, lanes: 1 },
          { gen: 'PCIe 4.0', quantity: 1 },
        ]),
        gpu,
      };

      expect(judgeBuild(build)).toEqual([
        {
          rule: 8,
          outcome: 'unchecked',
          missing: [{ part: 'the-board', path: 'pcie_slots.1.lanes' }],
        },
      ]);
    });

    it('passes a motherboard with a 16-lane row whatever its other rows hold', () => {
      const build: Build = {
        motherboard: boardWithSlots([
          { gen: 'PCIe 4.0', quantity: 1 },
          { gen: 'PCIe 4.0', quantity: 1, lanes: 16 },
          { quantity: 2, lanes: 1 },
        ]),
        gpu,
      };

      expect(judgeBuild(build)).toEqual([
        { rule: 8, outcome: 'passes', parts: ['the-board', 'the-gpu'] },
      ]);
    });
  });
});
