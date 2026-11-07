import type { Build } from '../../index';
import { outcomeOf } from '../outcome-of';

// A motherboard with CPU power connectors, each a socket, such as "8-pin".
function boardWithCpuPower(
  connectors: readonly string[] | undefined,
): Build['motherboard'] {
  return {
    id: 'the-board',
    specifications: { power_connectors: { cpu_power: connectors } },
  };
}

function psuWithEpsConnectors(eps: number | undefined): Build['psu'] {
  return { id: 'the-psu', specifications: { connectors: { eps_8_pin: eps } } };
}

describe("rule 20: the motherboard's CPU power sockets and the PSU's EPS connectors", () => {
  it('passes a PSU with as many EPS connectors as the motherboard has CPU power sockets', () => {
    const build: Build = {
      motherboard: boardWithCpuPower(['8-pin', '4-pin']),
      psu: psuWithEpsConnectors(2),
    };

    expect(outcomeOf(20, build)).toEqual({
      rule: 20,
      outcome: 'passes',
      parts: ['the-board', 'the-psu'],
    });
  });

  it('finds a Warning in fewer EPS connectors than CPU power sockets, since the extra socket is often optional', () => {
    const build: Build = {
      motherboard: boardWithCpuPower(['8-pin', '4-pin']),
      psu: psuWithEpsConnectors(1),
    };

    expect(outcomeOf(20, build)).toEqual({
      rule: 20,
      outcome: 'warning',
      parts: ['the-board', 'the-psu'],
    });
  });

  it('finds a Problem in a PSU with no EPS connector at all, a 0 given to the library directly', () => {
    const build: Build = {
      motherboard: boardWithCpuPower(['8-pin', '4-pin']),
      psu: psuWithEpsConnectors(0),
    };

    expect(outcomeOf(20, build)).toEqual({
      rule: 20,
      outcome: 'problem',
      parts: ['the-psu'],
    });
  });

  it('passes a motherboard with one CPU power socket and a PSU with one EPS connector', () => {
    const build: Build = {
      motherboard: boardWithCpuPower(['8-pin']),
      psu: psuWithEpsConnectors(1),
    };

    expect(outcomeOf(20, build)).toEqual({
      rule: 20,
      outcome: 'passes',
      parts: ['the-board', 'the-psu'],
    });
  });

  it('finds a Warning in two EPS connectors for three CPU power sockets', () => {
    const build: Build = {
      motherboard: boardWithCpuPower(['8-pin', '8-pin', '4-pin']),
      psu: psuWithEpsConnectors(2),
    };

    expect(outcomeOf(20, build)).toEqual({
      rule: 20,
      outcome: 'warning',
      parts: ['the-board', 'the-psu'],
    });
  });

  it("is unchecked when the PSU's EPS connectors are missing", () => {
    const build: Build = {
      motherboard: boardWithCpuPower(['8-pin']),
      psu: psuWithEpsConnectors(undefined),
    };

    expect(outcomeOf(20, build)).toEqual({
      rule: 20,
      outcome: 'unchecked',
      missing: [{ part: 'the-psu', path: 'connectors.eps_8_pin' }],
    });
  });

  describe('unchecked only when it matters', () => {
    it("finds a Problem in a PSU with no EPS connector whatever the motherboard's missing sockets", () => {
      const build: Build = {
        motherboard: boardWithCpuPower(undefined),
        psu: psuWithEpsConnectors(0),
      };

      expect(outcomeOf(20, build)).toEqual({
        rule: 20,
        outcome: 'problem',
        parts: ['the-psu'],
      });
    });

    it("is unchecked when the motherboard's CPU power connectors are missing, which could make a Warning", () => {
      const build: Build = {
        motherboard: boardWithCpuPower(undefined),
        psu: psuWithEpsConnectors(2),
      };

      expect(outcomeOf(20, build)).toEqual({
        rule: 20,
        outcome: 'unchecked',
        missing: [{ part: 'the-board', path: 'power_connectors.cpu_power' }],
      });
    });

    it('is unchecked, naming both, when both are missing', () => {
      const build: Build = {
        motherboard: boardWithCpuPower(undefined),
        psu: psuWithEpsConnectors(undefined),
      };

      expect(outcomeOf(20, build)).toEqual({
        rule: 20,
        outcome: 'unchecked',
        missing: [
          { part: 'the-board', path: 'power_connectors.cpu_power' },
          { part: 'the-psu', path: 'connectors.eps_8_pin' },
        ],
      });
    });
  });
});
