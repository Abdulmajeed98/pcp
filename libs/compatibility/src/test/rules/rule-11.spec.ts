import {
  type Build,
  type GpuSpecifications,
  judgeBuild,
  type PsuSpecifications,
} from '../../index';

function gpuWith(sockets: GpuSpecifications['power_connectors']): Build['gpu'] {
  return { id: 'the-gpu', specifications: { power_connectors: sockets } };
}

function psuWith(connectors: PsuSpecifications['connectors']): Build['psu'] {
  return { id: 'the-psu', specifications: { connectors } };
}

describe("rule 11: the GPU's power sockets and the PSU's connectors", () => {
  it('passes a 6-pin and an 8-pin socket with two 6+2-pin connectors', () => {
    const build: Build = {
      gpu: gpuWith({ pcie_6_pin: 1, pcie_8_pin: 1, pcie_12VHPWR: 0, pcie_12V_2x6: 0 }),
      psu: psuWith({ pcie_6_plus_2_pin: 2, pcie_12vhpwr: 0 }),
    };

    expect(judgeBuild(build)).toEqual([
      { rule: 11, outcome: 'passes', parts: ['the-gpu', 'the-psu'] },
    ]);
  });

  it('finds a Problem in a 6-pin and an 8-pin socket with one 6+2-pin connector', () => {
    const build: Build = {
      gpu: gpuWith({ pcie_6_pin: 1, pcie_8_pin: 1, pcie_12VHPWR: 0, pcie_12V_2x6: 0 }),
      psu: psuWith({ pcie_6_plus_2_pin: 1, pcie_12vhpwr: 0 }),
    };

    expect(judgeBuild(build)).toEqual([
      { rule: 11, outcome: 'problem', parts: ['the-gpu', 'the-psu'] },
    ]);
  });

  describe('a 12VHPWR socket', () => {
    it("passes with the PSU's 12VHPWR cable", () => {
      const build: Build = {
        gpu: gpuWith({ pcie_6_pin: 0, pcie_8_pin: 0, pcie_12VHPWR: 1, pcie_12V_2x6: 0 }),
        psu: psuWith({ pcie_6_plus_2_pin: 0, pcie_12vhpwr: 1 }),
      };

      expect(judgeBuild(build)).toEqual([
        { rule: 11, outcome: 'passes', parts: ['the-gpu', 'the-psu'] },
      ]);
    });

    it('finds a Warning without the cable but with a 6+2-pin connector, for the adapter', () => {
      const build: Build = {
        gpu: gpuWith({ pcie_6_pin: 0, pcie_8_pin: 0, pcie_12VHPWR: 1, pcie_12V_2x6: 0 }),
        psu: psuWith({ pcie_6_plus_2_pin: 3, pcie_12vhpwr: 0 }),
      };

      expect(judgeBuild(build)).toEqual([
        { rule: 11, outcome: 'warning', parts: ['the-gpu', 'the-psu'] },
      ]);
    });

    // The catalog stores no 0 for a PSU's 6+2-pin connectors, which it reads
    // as not known, so this 0 is given to the library directly.
    it('finds a Problem with neither the cable nor a 6+2-pin connector', () => {
      const build: Build = {
        gpu: gpuWith({ pcie_6_pin: 0, pcie_8_pin: 0, pcie_12VHPWR: 1, pcie_12V_2x6: 0 }),
        psu: psuWith({ pcie_6_plus_2_pin: 0, pcie_12vhpwr: 0 }),
      };

      expect(judgeBuild(build)).toEqual([
        { rule: 11, outcome: 'problem', parts: ['the-gpu', 'the-psu'] },
      ]);
    });

    it("finds a Problem, not a Warning, when the 6+2-pin connectors are too few for the GPU's 8-pin sockets", () => {
      const build: Build = {
        gpu: gpuWith({ pcie_6_pin: 0, pcie_8_pin: 2, pcie_12VHPWR: 1, pcie_12V_2x6: 0 }),
        psu: psuWith({ pcie_6_plus_2_pin: 1, pcie_12vhpwr: 0 }),
      };

      expect(judgeBuild(build)).toEqual([
        { rule: 11, outcome: 'problem', parts: ['the-gpu', 'the-psu'] },
      ]);
    });
  });

  describe('a 12V-2x6 socket, read as a 12VHPWR one', () => {
    it.each([
      [
        "passes with the PSU's 12VHPWR cable",
        { pcie_6_plus_2_pin: 0, pcie_12vhpwr: 1 },
        'passes',
      ],
      [
        'finds a Warning without the cable but with a 6+2-pin connector',
        { pcie_6_plus_2_pin: 3, pcie_12vhpwr: 0 },
        'warning',
      ],
      [
        'finds a Problem with neither the cable nor a 6+2-pin connector',
        { pcie_6_plus_2_pin: 0, pcie_12vhpwr: 0 },
        'problem',
      ],
    ] as const)('%s', (_what, connectors, outcome) => {
      const build: Build = {
        gpu: gpuWith({ pcie_6_pin: 0, pcie_8_pin: 0, pcie_12VHPWR: 0, pcie_12V_2x6: 1 }),
        psu: psuWith(connectors),
      };

      expect(judgeBuild(build)).toEqual([
        { rule: 11, outcome, parts: ['the-gpu', 'the-psu'] },
      ]);
    });
  });

  it("is unchecked when the PSU's 6+2-pin connectors are missing", () => {
    const build: Build = {
      gpu: gpuWith({ pcie_6_pin: 0, pcie_8_pin: 2, pcie_12VHPWR: 0, pcie_12V_2x6: 0 }),
      psu: psuWith({ pcie_12vhpwr: 0 }),
    };

    expect(judgeBuild(build)).toEqual([
      {
        rule: 11,
        outcome: 'unchecked',
        missing: [{ part: 'the-psu', path: 'connectors.pcie_6_plus_2_pin' }],
      },
    ]);
  });

  it("is unchecked, naming the four, when the GPU's power sockets are missing", () => {
    const build: Build = {
      gpu: gpuWith(undefined),
      psu: psuWith({ pcie_6_plus_2_pin: 4, pcie_12vhpwr: 0 }),
    };

    expect(judgeBuild(build)).toEqual([
      {
        rule: 11,
        outcome: 'unchecked',
        missing: [
          { part: 'the-gpu', path: 'power_connectors.pcie_6_pin' },
          { part: 'the-gpu', path: 'power_connectors.pcie_8_pin' },
          { part: 'the-gpu', path: 'power_connectors.pcie_12VHPWR' },
          { part: 'the-gpu', path: 'power_connectors.pcie_12V_2x6' },
        ],
      },
    ]);
  });

  describe('unchecked only when it matters', () => {
    it("is unchecked for a 12VHPWR socket without the cable when the PSU's 6+2-pin connectors are missing, since they could make a Problem or a Warning", () => {
      const build: Build = {
        gpu: gpuWith({ pcie_6_pin: 0, pcie_8_pin: 0, pcie_12VHPWR: 1, pcie_12V_2x6: 0 }),
        psu: psuWith({ pcie_12vhpwr: 0 }),
      };

      expect(judgeBuild(build)).toEqual([
        {
          rule: 11,
          outcome: 'unchecked',
          missing: [{ part: 'the-psu', path: 'connectors.pcie_6_plus_2_pin' }],
        },
      ]);
    });

    it("is unchecked for a 12VHPWR socket when the PSU's 12VHPWR cables are missing, since they could make a Warning", () => {
      const build: Build = {
        gpu: gpuWith({ pcie_6_pin: 0, pcie_8_pin: 0, pcie_12VHPWR: 1, pcie_12V_2x6: 0 }),
        psu: psuWith({ pcie_6_plus_2_pin: 2 }),
      };

      expect(judgeBuild(build)).toEqual([
        {
          rule: 11,
          outcome: 'unchecked',
          missing: [{ part: 'the-psu', path: 'connectors.pcie_12vhpwr' }],
        },
      ]);
    });

    it("passes a GPU with no 12VHPWR or 12V-2x6 socket whatever the PSU's 12VHPWR cables", () => {
      const build: Build = {
        gpu: gpuWith({ pcie_6_pin: 0, pcie_8_pin: 2, pcie_12VHPWR: 0, pcie_12V_2x6: 0 }),
        psu: psuWith({ pcie_6_plus_2_pin: 2 }),
      };

      expect(judgeBuild(build)).toEqual([
        { rule: 11, outcome: 'passes', parts: ['the-gpu', 'the-psu'] },
      ]);
    });

    it("passes a 12VHPWR socket with the cable whatever the PSU's 6+2-pin connectors", () => {
      const build: Build = {
        gpu: gpuWith({ pcie_6_pin: 0, pcie_8_pin: 0, pcie_12VHPWR: 1, pcie_12V_2x6: 0 }),
        psu: psuWith({ pcie_12vhpwr: 1 }),
      };

      expect(judgeBuild(build)).toEqual([
        { rule: 11, outcome: 'passes', parts: ['the-gpu', 'the-psu'] },
      ]);
    });

    it('passes a 12V-2x6 socket with the cable though its count of 12VHPWR sockets is missing', () => {
      const build: Build = {
        gpu: gpuWith({ pcie_6_pin: 0, pcie_8_pin: 0, pcie_12V_2x6: 1 }),
        psu: psuWith({ pcie_6_plus_2_pin: 2, pcie_12vhpwr: 1 }),
      };

      expect(judgeBuild(build)).toEqual([
        { rule: 11, outcome: 'passes', parts: ['the-gpu', 'the-psu'] },
      ]);
    });

    it('finds a Problem in more 8-pin sockets than 6+2-pin connectors though the count of 6-pin sockets is missing', () => {
      const build: Build = {
        gpu: gpuWith({ pcie_8_pin: 3, pcie_12VHPWR: 0, pcie_12V_2x6: 0 }),
        psu: psuWith({ pcie_6_plus_2_pin: 2, pcie_12vhpwr: 0 }),
      };

      expect(judgeBuild(build)).toEqual([
        { rule: 11, outcome: 'problem', parts: ['the-gpu', 'the-psu'] },
      ]);
    });
  });
});
