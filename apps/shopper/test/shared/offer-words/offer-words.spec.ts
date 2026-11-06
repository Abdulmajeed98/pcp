import { describe, expect, it } from 'vitest';

import { confirmationIn, warrantyIn } from '@/shared/offer-words';

// How many days ago a Vendor confirmed an Offer, as an Offer's line and the
// price slip word it (OFF-7): today, one day ago, or so many days ago, in
// each language's own plural, with the count in Western digits (LANG-5).
// The words are the Kurdish and Arabic drafts under LANG-7.
describe('the days since a Confirmation', () => {
  it.each([
    [0, 'Confirmed today'],
    [1, 'Confirmed 1 day ago'],
    [2, 'Confirmed 2 days ago'],
    [13, 'Confirmed 13 days ago'],
    [1000, 'Confirmed 1,000 days ago'],
  ])('in English, %i days are "%s"', (days, words) => {
    expect(confirmationIn('en', days)).toBe(words);
  });

  // Sorani counts with the noun in the singular, so one day and many days
  // differ only in the count.
  it.each([
    [0, 'ئەمڕۆ پشتڕاستکرایەوە'],
    [1, '1 ڕۆژ لەمەوبەر پشتڕاستکرایەوە'],
    [2, '2 ڕۆژ لەمەوبەر پشتڕاستکرایەوە'],
    [13, '13 ڕۆژ لەمەوبەر پشتڕاستکرایەوە'],
  ])('in Kurdish, %i days are "%s"', (days, words) => {
    expect(confirmationIn('ckb', days)).toBe(words);
  });

  // Arabic says one day and two days in a word, and has a form of its own
  // for three to ten, for eleven to ninety-nine, and for a hundred.
  it.each([
    [0, 'أُكِّد اليوم'],
    [1, 'أُكِّد قبل يوم'],
    [2, 'أُكِّد قبل يومين'],
    [3, 'أُكِّد قبل 3 أيام'],
    [11, 'أُكِّد قبل 11 يومًا'],
    [100, 'أُكِّد قبل 100 يوم'],
  ])('in Arabic, %i days are "%s"', (days, words) => {
    expect(confirmationIn('ar', days)).toBe(words);
  });
});

// An Offer's warranty in whole months, as the Vendor states it, from 1 to
// 120, in each language's own plural, with the count in Western digits; an
// Offer whose Vendor states none says nothing of it.
describe("an Offer's warranty", () => {
  it.each([
    [1, '1 month warranty'],
    [2, '2 months warranty'],
    [12, '12 months warranty'],
    [120, '120 months warranty'],
  ])('in English, %i months are "%s"', (months, words) => {
    expect(warrantyIn('en', months)).toBe(words);
  });

  it.each([
    [1, 'گەرەنتیی 1 مانگ'],
    [12, 'گەرەنتیی 12 مانگ'],
  ])('in Kurdish, %i months are "%s"', (months, words) => {
    expect(warrantyIn('ckb', months)).toBe(words);
  });

  it.each([
    [1, 'ضمان شهر'],
    [2, 'ضمان شهرين'],
    [6, 'ضمان 6 أشهر'],
    [12, 'ضمان 12 شهرًا'],
    [100, 'ضمان 100 شهر'],
    [120, 'ضمان 120 شهرًا'],
  ])('in Arabic, %i months are "%s"', (months, words) => {
    expect(warrantyIn('ar', months)).toBe(words);
  });

  it.each(['ckb', 'ar', 'en'] as const)('in %s, no warranty is no words', (language) => {
    expect(warrantyIn(language, null)).toBeUndefined();
  });
});
