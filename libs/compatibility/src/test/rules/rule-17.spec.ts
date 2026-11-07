import type { Build } from '../../index';
import { outcomeOf } from '../outcome-of';

// A cooler, liquid cooled or not, of a height in millimetres.
function cooler(
  liquid: boolean | undefined,
  height: number | undefined,
): Build['cpuCooler'] {
  return { id: 'the-cooler', specifications: { water_cooled: liquid, height } };
}

function caseTakingCoolersUpTo(height: number | undefined): Build['case'] {
  return { id: 'the-case', specifications: { max_cpu_cooler_height: height } };
}

describe("rule 17: an air cooler's height and the case's tallest cooler", () => {
  it('passes an air cooler shorter than the case allows', () => {
    const build: Build = {
      cpuCooler: cooler(false, 155),
      case: caseTakingCoolersUpTo(165),
    };

    expect(outcomeOf(17, build)).toEqual({
      rule: 17,
      outcome: 'passes',
      parts: ['the-cooler', 'the-case'],
    });
  });

  it('finds a Problem in an air cooler taller than the case allows', () => {
    const build: Build = {
      cpuCooler: cooler(false, 170),
      case: caseTakingCoolersUpTo(165),
    };

    expect(outcomeOf(17, build)).toEqual({
      rule: 17,
      outcome: 'problem',
      parts: ['the-cooler', 'the-case'],
    });
  });

  it('passes an air cooler exactly as tall as the case allows', () => {
    const build: Build = {
      cpuCooler: cooler(false, 165),
      case: caseTakingCoolersUpTo(165),
    };

    expect(outcomeOf(17, build)).toEqual({
      rule: 17,
      outcome: 'passes',
      parts: ['the-cooler', 'the-case'],
    });
  });

  it('finds a Problem in an air cooler a tenth of a millimetre taller than the case allows', () => {
    const build: Build = {
      cpuCooler: cooler(false, 165.1),
      case: caseTakingCoolersUpTo(165),
    };

    expect(outcomeOf(17, build)).toEqual({
      rule: 17,
      outcome: 'problem',
      parts: ['the-cooler', 'the-case'],
    });
  });

  it('passes a liquid cooler taller than the case allows, since only an air cooler is judged', () => {
    const build: Build = { cpuCooler: cooler(true, 170), case: caseTakingCoolersUpTo(165) };

    expect(outcomeOf(17, build)).toEqual({
      rule: 17,
      outcome: 'passes',
      parts: ['the-cooler', 'the-case'],
    });
  });

  it("is unchecked when an air cooler's height is missing", () => {
    const build: Build = {
      cpuCooler: cooler(false, undefined),
      case: caseTakingCoolersUpTo(165),
    };

    expect(outcomeOf(17, build)).toEqual({
      rule: 17,
      outcome: 'unchecked',
      missing: [{ part: 'the-cooler', path: 'height' }],
    });
  });

  it("is unchecked when the case's tallest cooler is missing", () => {
    const build: Build = {
      cpuCooler: cooler(false, 155),
      case: caseTakingCoolersUpTo(undefined),
    };

    expect(outcomeOf(17, build)).toEqual({
      rule: 17,
      outcome: 'unchecked',
      missing: [{ part: 'the-case', path: 'max_cpu_cooler_height' }],
    });
  });

  describe('unchecked only when it matters', () => {
    it("passes a cooler that fits under the case's limit whether or not it says it is liquid cooled", () => {
      const build: Build = {
        cpuCooler: cooler(undefined, 155),
        case: caseTakingCoolersUpTo(165),
      };

      expect(outcomeOf(17, build)).toEqual({
        rule: 17,
        outcome: 'passes',
        parts: ['the-cooler', 'the-case'],
      });
    });

    it('is unchecked when a cooler taller than the case allows does not say whether it is liquid cooled', () => {
      const build: Build = {
        cpuCooler: cooler(undefined, 170),
        case: caseTakingCoolersUpTo(165),
      };

      expect(outcomeOf(17, build)).toEqual({
        rule: 17,
        outcome: 'unchecked',
        missing: [{ part: 'the-cooler', path: 'water_cooled' }],
      });
    });

    it("passes a liquid cooler whatever its height and the case's limit", () => {
      const build: Build = {
        cpuCooler: cooler(true, undefined),
        case: caseTakingCoolersUpTo(undefined),
      };

      expect(outcomeOf(17, build)).toEqual({
        rule: 17,
        outcome: 'passes',
        parts: ['the-cooler', 'the-case'],
      });
    });
  });
});
