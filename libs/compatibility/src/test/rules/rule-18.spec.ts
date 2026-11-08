import type { Build, PowerSupplyFormFactor } from '../../index';
import { outcomeOf } from '../outcome-of';

function psuOf(formFactor: PowerSupplyFormFactor | undefined): Build['psu'] {
  return { id: 'the-psu', specifications: { form_factor: formFactor } };
}

function caseTaking(
  formFactors: readonly PowerSupplyFormFactor[] | undefined,
): Build['case'] {
  return {
    id: 'the-case',
    specifications: { supported_power_supply_form_factors: formFactors },
  };
}

describe("rule 18: the PSU's form factor among the case's", () => {
  it('passes a PSU of a form factor the case takes', () => {
    const build: Build = { case: caseTaking(['ATX', 'SFX']), psu: psuOf('ATX') };

    expect(outcomeOf(18, build)).toEqual({
      rule: 18,
      outcome: 'passes',
      parts: ['the-case', 'the-psu'],
    });
  });

  it('finds a Problem in an SFX supply in a case that lists only ATX', () => {
    const build: Build = { case: caseTaking(['ATX']), psu: psuOf('SFX') };

    expect(outcomeOf(18, build)).toEqual({
      rule: 18,
      outcome: 'problem',
      parts: ['the-case', 'the-psu'],
    });
  });

  it.each<[PowerSupplyFormFactor, PowerSupplyFormFactor[]]>([
    ['ATX/EPS', ['ATX']],
    ['SFX-L', ['SFX']],
    ['ATX', ['SFX', 'SFX-L']],
    ['Flex ATX', ['ATX']],
  ])(
    'lets no form factor stand in for another: a %s supply in a case that takes %j',
    (formFactor, taken) => {
      const build: Build = { case: caseTaking(taken), psu: psuOf(formFactor) };

      expect(outcomeOf(18, build)).toEqual({
        rule: 18,
        outcome: 'problem',
        parts: ['the-case', 'the-psu'],
      });
    },
  );

  it("is unchecked when the case's PSU form factors are missing", () => {
    const build: Build = { case: caseTaking(undefined), psu: psuOf('ATX') };

    expect(outcomeOf(18, build)).toEqual({
      rule: 18,
      outcome: 'unchecked',
      missing: [{ part: 'the-case', path: 'supported_power_supply_form_factors' }],
    });
  });

  it("is unchecked when the PSU's form factor is missing", () => {
    const build: Build = { case: caseTaking(['ATX']), psu: psuOf(undefined) };

    expect(outcomeOf(18, build)).toEqual({
      rule: 18,
      outcome: 'unchecked',
      missing: [{ part: 'the-psu', path: 'form_factor' }],
    });
  });

  it('passes a PSU whose form factor is missing in a case that takes every one, since it cannot matter', () => {
    const build: Build = {
      case: caseTaking(['ATX', 'ATX/EPS', 'Flex ATX', 'Mini-ITX', 'SFX', 'SFX-L', 'TFX']),
      psu: psuOf(undefined),
    };

    expect(outcomeOf(18, build)).toEqual({
      rule: 18,
      outcome: 'passes',
      parts: ['the-case', 'the-psu'],
    });
  });
});
