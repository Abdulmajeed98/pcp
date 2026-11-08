import type { Build } from '../../index';
import { outcomeOf } from '../outcome-of';

// A PSU of a length in millimetres.
function psuOf(length: number | undefined): Build['psu'] {
  return { id: 'the-psu', specifications: { length } };
}

function caseTakingPsusUpTo(length: number | undefined): Build['case'] {
  return { id: 'the-case', specifications: { max_psu_length: length } };
}

describe("rule 19: the PSU's length and the case's longest PSU", () => {
  it('passes a PSU shorter than the case allows', () => {
    const build: Build = { case: caseTakingPsusUpTo(160), psu: psuOf(150) };

    expect(outcomeOf(19, build)).toEqual({
      rule: 19,
      outcome: 'passes',
      parts: ['the-case', 'the-psu'],
    });
  });

  it('finds a Problem in a PSU longer than the case allows', () => {
    const build: Build = { case: caseTakingPsusUpTo(160), psu: psuOf(180) };

    expect(outcomeOf(19, build)).toEqual({
      rule: 19,
      outcome: 'problem',
      parts: ['the-case', 'the-psu'],
    });
  });

  it('passes a PSU exactly as long as the case allows', () => {
    const build: Build = { case: caseTakingPsusUpTo(160), psu: psuOf(160) };

    expect(outcomeOf(19, build)).toEqual({
      rule: 19,
      outcome: 'passes',
      parts: ['the-case', 'the-psu'],
    });
  });

  it('finds a Problem in a PSU a millimetre longer than the case allows', () => {
    const build: Build = { case: caseTakingPsusUpTo(160), psu: psuOf(161) };

    expect(outcomeOf(19, build)).toEqual({
      rule: 19,
      outcome: 'problem',
      parts: ['the-case', 'the-psu'],
    });
  });

  it("is unchecked when the PSU's length is missing", () => {
    const build: Build = { case: caseTakingPsusUpTo(160), psu: psuOf(undefined) };

    expect(outcomeOf(19, build)).toEqual({
      rule: 19,
      outcome: 'unchecked',
      missing: [{ part: 'the-psu', path: 'length' }],
    });
  });

  it("is unchecked when the case's longest PSU is missing", () => {
    const build: Build = { case: caseTakingPsusUpTo(undefined), psu: psuOf(150) };

    expect(outcomeOf(19, build)).toEqual({
      rule: 19,
      outcome: 'unchecked',
      missing: [{ part: 'the-case', path: 'max_psu_length' }],
    });
  });
});
