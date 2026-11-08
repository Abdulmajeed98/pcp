import type { Build } from '../../index';
import { outcomeOf } from '../outcome-of';

function gpuOfLength(length: number | undefined): Build['gpu'] {
  return { id: 'the-gpu', specifications: { length, total_slot_width: 2 } };
}

function caseTakingUpTo(longest: number | undefined): Build['case'] {
  return {
    id: 'the-case',
    specifications: { max_video_card_length: longest, expansion_slots: 7 },
  };
}

describe("rule 9: the GPU's length and the case's longest GPU", () => {
  it('passes a GPU shorter than the case allows', () => {
    const build: Build = { gpu: gpuOfLength(285), case: caseTakingUpTo(400) };

    expect(outcomeOf(9, build)).toEqual({
      rule: 9,
      outcome: 'passes',
      parts: ['the-gpu', 'the-case'],
    });
  });

  it('passes a GPU exactly as long as the case allows', () => {
    const build: Build = { gpu: gpuOfLength(336.5), case: caseTakingUpTo(336.5) };

    expect(outcomeOf(9, build)).toEqual({
      rule: 9,
      outcome: 'passes',
      parts: ['the-gpu', 'the-case'],
    });
  });

  it('finds a Problem in a GPU a tenth of a millimetre longer than the case allows', () => {
    const build: Build = { gpu: gpuOfLength(336.6), case: caseTakingUpTo(336.5) };

    expect(outcomeOf(9, build)).toEqual({
      rule: 9,
      outcome: 'problem',
      parts: ['the-gpu', 'the-case'],
    });
  });

  it("is unchecked when the GPU's length is missing", () => {
    const build: Build = { gpu: gpuOfLength(undefined), case: caseTakingUpTo(400) };

    expect(outcomeOf(9, build)).toEqual({
      rule: 9,
      outcome: 'unchecked',
      missing: [{ part: 'the-gpu', path: 'length' }],
    });
  });

  it("is unchecked when the case's longest GPU is missing", () => {
    const build: Build = { gpu: gpuOfLength(285), case: caseTakingUpTo(undefined) };

    expect(outcomeOf(9, build)).toEqual({
      rule: 9,
      outcome: 'unchecked',
      missing: [{ part: 'the-case', path: 'max_video_card_length' }],
    });
  });
});
