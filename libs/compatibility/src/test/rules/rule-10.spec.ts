import type { Build } from '../../index';
import { outcomeOf } from '../outcome-of';

function gpuOccupying(slots: number | undefined): Build['gpu'] {
  return { id: 'the-gpu', specifications: { length: 285, total_slot_width: slots } };
}

function caseWithSlots(slots: number | undefined): Build['case'] {
  return {
    id: 'the-case',
    specifications: { max_video_card_length: 400, expansion_slots: slots },
  };
}

describe("rule 10: the slots the GPU occupies and the case's expansion slots", () => {
  it('passes a 2.5-slot GPU in a case with three expansion slots', () => {
    const build: Build = { gpu: gpuOccupying(2.5), case: caseWithSlots(3) };

    expect(outcomeOf(10, build)).toEqual({
      rule: 10,
      outcome: 'passes',
      parts: ['the-gpu', 'the-case'],
    });
  });

  it('finds a Problem in a 2.5-slot GPU in a case with two expansion slots', () => {
    const build: Build = { gpu: gpuOccupying(2.5), case: caseWithSlots(2) };

    expect(outcomeOf(10, build)).toEqual({
      rule: 10,
      outcome: 'problem',
      parts: ['the-gpu', 'the-case'],
    });
  });

  it('passes a GPU that occupies as many slots as the case has', () => {
    const build: Build = { gpu: gpuOccupying(3), case: caseWithSlots(3) };

    expect(outcomeOf(10, build)).toEqual({
      rule: 10,
      outcome: 'passes',
      parts: ['the-gpu', 'the-case'],
    });
  });

  it('is unchecked when the slots the GPU occupies are missing', () => {
    const build: Build = { gpu: gpuOccupying(undefined), case: caseWithSlots(7) };

    expect(outcomeOf(10, build)).toEqual({
      rule: 10,
      outcome: 'unchecked',
      missing: [{ part: 'the-gpu', path: 'total_slot_width' }],
    });
  });

  it("is unchecked when the case's expansion slots are missing", () => {
    const build: Build = { gpu: gpuOccupying(2), case: caseWithSlots(undefined) };

    expect(outcomeOf(10, build)).toEqual({
      rule: 10,
      outcome: 'unchecked',
      missing: [{ part: 'the-case', path: 'expansion_slots' }],
    });
  });
});
