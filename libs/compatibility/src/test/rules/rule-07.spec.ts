import type { Build, MotherboardFormFactor } from '../../index';
import { outcomeOf } from '../outcome-of';

function boardOf(formFactor: MotherboardFormFactor | undefined): Build['motherboard'] {
  return { id: 'the-board', specifications: { form_factor: formFactor } };
}

function caseTaking(
  formFactors: readonly MotherboardFormFactor[] | undefined,
): Build['case'] {
  return {
    id: 'the-case',
    specifications: { supported_motherboard_form_factors: formFactors },
  };
}

describe("rule 7: the motherboard's form factor among the case's", () => {
  it('passes a motherboard of a form factor the case takes', () => {
    const build: Build = {
      motherboard: boardOf('ATX'),
      case: caseTaking(['ATX', 'Micro ATX', 'Mini-ITX']),
    };

    expect(outcomeOf(7, build)).toEqual({
      rule: 7,
      outcome: 'passes',
      parts: ['the-board', 'the-case'],
    });
  });

  it('finds a Problem in a motherboard of a form factor the case does not take', () => {
    const build: Build = {
      motherboard: boardOf('ATX'),
      case: caseTaking(['Micro ATX', 'Mini-ITX']),
    };

    expect(outcomeOf(7, build)).toEqual({
      rule: 7,
      outcome: 'problem',
      parts: ['the-board', 'the-case'],
    });
  });

  it.each<[MotherboardFormFactor, MotherboardFormFactor]>([
    ['Thin Mini-ITX', 'Mini-ITX'],
    ['Flex ATX', 'Micro ATX'],
  ])(
    'passes a %s motherboard in a case that takes %s, since they share the mounting',
    (board, taken) => {
      const build: Build = { motherboard: boardOf(board), case: caseTaking([taken]) };

      expect(outcomeOf(7, build)).toEqual({
        rule: 7,
        outcome: 'passes',
        parts: ['the-board', 'the-case'],
      });
    },
  );

  it.each<[MotherboardFormFactor, MotherboardFormFactor]>([
    ['Thin Mini-ITX', 'Micro ATX'],
    ['Flex ATX', 'Mini-ITX'],
  ])('finds a Problem in a %s motherboard in a case that takes only %s', (board, taken) => {
    const build: Build = { motherboard: boardOf(board), case: caseTaking([taken]) };

    expect(outcomeOf(7, build)).toEqual({
      rule: 7,
      outcome: 'problem',
      parts: ['the-board', 'the-case'],
    });
  });

  it("is unchecked when the case's form factors are missing", () => {
    const build: Build = { motherboard: boardOf('ATX'), case: caseTaking(undefined) };

    expect(outcomeOf(7, build)).toEqual({
      rule: 7,
      outcome: 'unchecked',
      missing: [{ part: 'the-case', path: 'supported_motherboard_form_factors' }],
    });
  });

  it("is unchecked when the motherboard's form factor is missing", () => {
    const build: Build = {
      motherboard: boardOf(undefined),
      case: caseTaking(['ATX', 'Micro ATX', 'Mini-ITX']),
    };

    expect(outcomeOf(7, build)).toEqual({
      rule: 7,
      outcome: 'unchecked',
      missing: [{ part: 'the-board', path: 'form_factor' }],
    });
  });
});
