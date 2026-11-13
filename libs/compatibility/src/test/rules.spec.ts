import { ruleNumbers, rulesThatCanWarn } from '../index';

// The library's own list of the Compatibility Rules, which the API describes
// to its callers, so that a caller that words each rule's outcomes, as the
// Shopper app does, is told of a rule added to the list. Written out from
// the MVP spec's Compatibility Rules, CMP-1 and CMP-3.
describe('the Compatibility Rules', () => {
  it('are the 21 of the MVP spec, numbered 1 to 21, in rule order', () => {
    expect(ruleNumbers).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    ]);
  });

  it('can give a Compatibility Warning for rules 11, 15 and 20 alone', () => {
    expect(rulesThatCanWarn).toEqual([11, 15, 20]);
  });
});
