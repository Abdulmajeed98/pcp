import { type Build, judgeBuild } from '../../index';

describe("rule 3: each RAM kit's type among the CPU's memory types", () => {
  it('passes a kit of a type the CPU supports', () => {
    const build: Build = {
      cpu: {
        id: 'the-cpu',
        specifications: { specifications: { memory: { types: ['DDR4', 'DDR5'] } } },
      },
      ram: [{ id: 'the-kit', quantity: 1, specifications: { ram_type: 'DDR5' } }],
    };

    expect(judgeBuild(build)).toEqual([
      { rule: 3, outcome: 'passes', parts: ['the-cpu', 'the-kit'] },
    ]);
  });

  it('finds a Problem in a kit of a type the CPU does not support', () => {
    const build: Build = {
      cpu: {
        id: 'the-cpu',
        specifications: { specifications: { memory: { types: ['DDR4'] } } },
      },
      ram: [{ id: 'the-kit', quantity: 1, specifications: { ram_type: 'DDR5' } }],
    };

    expect(judgeBuild(build)).toEqual([
      { rule: 3, outcome: 'problem', parts: ['the-cpu', 'the-kit'] },
    ]);
  });

  it('judges each kit, naming only those the CPU does not support', () => {
    const build: Build = {
      cpu: {
        id: 'the-cpu',
        specifications: { specifications: { memory: { types: ['DDR5'] } } },
      },
      ram: [
        { id: 'a-ddr5-kit', quantity: 1, specifications: { ram_type: 'DDR5' } },
        { id: 'a-ddr4-kit', quantity: 1, specifications: { ram_type: 'DDR4' } },
      ],
    };

    expect(judgeBuild(build)).toEqual([
      { rule: 3, outcome: 'problem', parts: ['the-cpu', 'a-ddr4-kit'] },
    ]);
  });

  it("is unchecked when the CPU's memory types are missing", () => {
    const build: Build = {
      cpu: { id: 'the-cpu', specifications: {} },
      ram: [{ id: 'the-kit', quantity: 1, specifications: { ram_type: 'DDR5' } }],
    };

    expect(judgeBuild(build)).toEqual([
      {
        rule: 3,
        outcome: 'unchecked',
        missing: [{ part: 'the-cpu', path: 'specifications.memory.types' }],
      },
    ]);
  });

  it("is unchecked when a kit's type is missing", () => {
    const build: Build = {
      cpu: {
        id: 'the-cpu',
        specifications: { specifications: { memory: { types: ['DDR4'] } } },
      },
      ram: [{ id: 'the-kit', quantity: 1, specifications: {} }],
    };

    expect(judgeBuild(build)).toEqual([
      { rule: 3, outcome: 'unchecked', missing: [{ part: 'the-kit', path: 'ram_type' }] },
    ]);
  });
});
