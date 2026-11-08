import type { Build } from '../../index';
import { cpuOf, gpuOf } from '../made-up-parts';
import { outcomeOf } from '../outcome-of';

function psuOf(wattage: number | undefined): Build['psu'] {
  return { id: 'the-psu', specifications: { wattage } };
}

describe("rule 12: the PSU's wattage and 1.3 times the estimated power draw", () => {
  it('passes a PSU of more than 1.3 times the estimated power draw', () => {
    const build: Build = { cpu: cpuOf(65), psu: psuOf(550) };

    expect(outcomeOf(12, build)).toEqual({
      rule: 12,
      outcome: 'passes',
      parts: ['the-cpu', 'the-psu'],
    });
  });

  // A CPU of 120 W and a GPU of 280 W draw an estimated 500 W, and 1.3 times
  // that is 650 W.
  it('passes a PSU of exactly 1.3 times the estimated power draw', () => {
    const build: Build = { cpu: cpuOf(120), gpu: gpuOf(280), psu: psuOf(650) };

    expect(outcomeOf(12, build)).toEqual({
      rule: 12,
      outcome: 'passes',
      parts: ['the-cpu', 'the-gpu', 'the-psu'],
    });
  });

  it('finds a Problem in a PSU of a watt less than 1.3 times the estimated power draw', () => {
    const build: Build = { cpu: cpuOf(120), gpu: gpuOf(280), psu: psuOf(649) };

    expect(outcomeOf(12, build)).toEqual({
      rule: 12,
      outcome: 'problem',
      parts: ['the-cpu', 'the-gpu', 'the-psu'],
    });
  });

  // A CPU of 65 W and no GPU draw an estimated 165 W, and 1.3 times that is
  // 214.5 W.
  describe('a Build without a GPU, counting 0 W for it', () => {
    it('passes a PSU of the next watt above 1.3 times the estimated power draw', () => {
      const build: Build = { cpu: cpuOf(65), psu: psuOf(215) };

      expect(outcomeOf(12, build)).toEqual({
        rule: 12,
        outcome: 'passes',
        parts: ['the-cpu', 'the-psu'],
      });
    });

    it('finds a Problem in a PSU of the watt below', () => {
      const build: Build = { cpu: cpuOf(65), psu: psuOf(214) };

      expect(outcomeOf(12, build)).toEqual({
        rule: 12,
        outcome: 'problem',
        parts: ['the-cpu', 'the-psu'],
      });
    });
  });

  it.each([
    [
      "the CPU's TDP",
      { cpu: cpuOf(undefined), gpu: gpuOf(280) },
      'the-cpu',
      'specifications.tdp',
    ],
    ["the GPU's TDP", { cpu: cpuOf(120), gpu: gpuOf(undefined) }, 'the-gpu', 'tdp'],
  ])('is unchecked when %s is missing', (_what, parts, part, path) => {
    const build: Build = { ...parts, psu: psuOf(1000) };

    expect(outcomeOf(12, build)).toEqual({
      rule: 12,
      outcome: 'unchecked',
      missing: [{ part, path }],
    });
  });

  it("is unchecked when the PSU's wattage is missing", () => {
    const build: Build = { cpu: cpuOf(120), gpu: gpuOf(280), psu: psuOf(undefined) };

    expect(outcomeOf(12, build)).toEqual({
      rule: 12,
      outcome: 'unchecked',
      missing: [{ part: 'the-psu', path: 'wattage' }],
    });
  });

  it('does not apply to a Build without a CPU', () => {
    const build: Build = { gpu: gpuOf(280), psu: psuOf(650) };

    expect(outcomeOf(12, build)).toBeUndefined();
  });

  describe('unchecked only when it matters', () => {
    // A CPU of 125 W draws an estimated 225 W at the least, whatever its GPU
    // draws, and 1.3 times that is 292.5 W.
    it("finds a Problem in a PSU too weak for the CPU alone, though the GPU's TDP is missing, naming the CPU and the PSU", () => {
      const build: Build = { cpu: cpuOf(125), gpu: gpuOf(undefined), psu: psuOf(250) };

      expect(outcomeOf(12, build)).toEqual({
        rule: 12,
        outcome: 'problem',
        parts: ['the-cpu', 'the-psu'],
      });
    });
  });
});
