import type { Build } from '../../index';
import { outcomeOf } from '../outcome-of';

// A motherboard with its connectors on its back, or an ordinary one.
function boardWithConnectorsOnItsBack(back: boolean | undefined): Build['motherboard'] {
  return { id: 'the-board', specifications: { back_connect_connectors: back } };
}

function caseTakingBackConnectBoards(takes: boolean | undefined): Build['case'] {
  return {
    id: 'the-case',
    specifications: { supports_rear_connecting_motherboard: takes },
  };
}

describe('rule 21: a back-connect motherboard and the case', () => {
  it('passes a back-connect motherboard in a case that takes such boards', () => {
    const build: Build = {
      motherboard: boardWithConnectorsOnItsBack(true),
      case: caseTakingBackConnectBoards(true),
    };

    expect(outcomeOf(21, build)).toEqual({
      rule: 21,
      outcome: 'passes',
      parts: ['the-board', 'the-case'],
    });
  });

  it('finds a Problem in a back-connect motherboard in a case that does not take such boards', () => {
    const build: Build = {
      motherboard: boardWithConnectorsOnItsBack(true),
      case: caseTakingBackConnectBoards(false),
    };

    expect(outcomeOf(21, build)).toEqual({
      rule: 21,
      outcome: 'problem',
      parts: ['the-board', 'the-case'],
    });
  });

  it('is unchecked when a motherboard in a case that does not take back-connect boards does not say whether it is one', () => {
    const build: Build = {
      motherboard: boardWithConnectorsOnItsBack(undefined),
      case: caseTakingBackConnectBoards(false),
    };

    expect(outcomeOf(21, build)).toEqual({
      rule: 21,
      outcome: 'unchecked',
      missing: [{ part: 'the-board', path: 'back_connect_connectors' }],
    });
  });

  it('is unchecked, naming both, when neither says', () => {
    const build: Build = {
      motherboard: boardWithConnectorsOnItsBack(undefined),
      case: caseTakingBackConnectBoards(undefined),
    };

    expect(outcomeOf(21, build)).toEqual({
      rule: 21,
      outcome: 'unchecked',
      missing: [
        { part: 'the-board', path: 'back_connect_connectors' },
        { part: 'the-case', path: 'supports_rear_connecting_motherboard' },
      ],
    });
  });

  it('is unchecked when the case of a back-connect motherboard does not say whether it takes one', () => {
    const build: Build = {
      motherboard: boardWithConnectorsOnItsBack(true),
      case: caseTakingBackConnectBoards(undefined),
    };

    expect(outcomeOf(21, build)).toEqual({
      rule: 21,
      outcome: 'unchecked',
      missing: [{ part: 'the-case', path: 'supports_rear_connecting_motherboard' }],
    });
  });

  describe('unchecked only when it matters', () => {
    it.each<[string, boolean | undefined]>([
      ['does not take back-connect boards', false],
      ['does not say', undefined],
    ])('passes an ordinary motherboard in a case that %s', (_what, takes) => {
      const build: Build = {
        motherboard: boardWithConnectorsOnItsBack(false),
        case: caseTakingBackConnectBoards(takes),
      };

      expect(outcomeOf(21, build)).toEqual({
        rule: 21,
        outcome: 'passes',
        parts: ['the-board', 'the-case'],
      });
    });

    it('passes a case that takes back-connect boards whatever the motherboard says', () => {
      const build: Build = {
        motherboard: boardWithConnectorsOnItsBack(undefined),
        case: caseTakingBackConnectBoards(true),
      };

      expect(outcomeOf(21, build)).toEqual({
        rule: 21,
        outcome: 'passes',
        parts: ['the-board', 'the-case'],
      });
    });
  });
});
