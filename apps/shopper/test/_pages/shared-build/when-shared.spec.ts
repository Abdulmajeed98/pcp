import { describe, expect, it } from 'vitest';

import { whenShared } from '@/_pages/shared-build';

// The digits a Shopper page never shows: the Arabic-Indic and the Eastern
// Arabic-Indic sets (LANG-5).
const notWestern = /[٠-٩۰-۹]/;

// When a Build was shared (DESIGN.md's The Shared Build page, Its sheet):
// the note under the status, which day and how many days ago, and the stamp
// under the sheet's title, the day alone, short. The day and the days are
// the API's, the day it was shared in Iraq's time and the calendar days
// there since (the owner's answer of 17 November 2026 to sharing's code
// review): the page writes them and counts nothing. "Shared today" and
// "Shared yesterday" are messages of their own. Every number is in Western
// digits.
describe('when a Build was shared', () => {
  it('says today, yesterday, or how many days ago, each with its day, in English', () => {
    expect(whenShared('en', { sharedOn: '2026-11-17', daysSinceShared: 0 })).toEqual({
      note: 'Shared today, 17 November 2026.',
      stamp: 'Shared 17 Nov 2026',
    });
    expect(whenShared('en', { sharedOn: '2026-11-16', daysSinceShared: 1 })).toEqual({
      note: 'Shared yesterday, 16 November 2026.',
      stamp: 'Shared 16 Nov 2026',
    });
    expect(whenShared('en', { sharedOn: '2026-11-15', daysSinceShared: 2 }).note).toBe(
      'Shared 2 days ago, on 15 November 2026.',
    );
    expect(whenShared('en', { sharedOn: '2026-11-05', daysSinceShared: 12 })).toEqual({
      note: 'Shared 12 days ago, on 5 November 2026.',
      stamp: 'Shared 5 Nov 2026',
    });
  });

  it('writes the day and the count as the API answers them, counting nothing itself', () => {
    expect(whenShared('en', { sharedOn: '2027-01-01', daysSinceShared: 400 })).toEqual({
      note: 'Shared 400 days ago, on 1 January 2027.',
      stamp: 'Shared 1 Jan 2027',
    });
    expect(whenShared('en', { sharedOn: '2025-12-31', daysSinceShared: 0 }).note).toBe(
      'Shared today, 31 December 2025.',
    );
  });

  it('says it in Kurdish, the day after its month as Kurdish writes it', () => {
    expect(whenShared('ckb', { sharedOn: '2026-11-05', daysSinceShared: 12 })).toEqual({
      note: '12 ڕۆژ لەمەوبەر هاوبەش کراوە، لە 5ی تشرینی دووەمی 2026.',
      stamp: 'هاوبەشکرا 2026/11/5',
    });
    expect(whenShared('ckb', { sharedOn: '2026-11-17', daysSinceShared: 0 }).note).toBe(
      'ئەمڕۆ هاوبەش کراوە، 17ی تشرینی دووەمی 2026.',
    );
    expect(whenShared('ckb', { sharedOn: '2026-11-16', daysSinceShared: 1 }).note).toBe(
      'دوێنێ هاوبەش کراوە، 16ی تشرینی دووەمی 2026.',
    );
  });

  it("says it in Arabic, in the count's own plural", () => {
    expect(whenShared('ar', { sharedOn: '2026-11-05', daysSinceShared: 12 })).toEqual({
      note: 'شوركت قبل 12 يومًا، في 5 تشرين الثاني 2026.',
      stamp: 'شوركت 2026/11/5',
    });
    expect(whenShared('ar', { sharedOn: '2026-11-17', daysSinceShared: 0 }).note).toBe(
      'شوركت اليوم، 17 تشرين الثاني 2026.',
    );
    expect(whenShared('ar', { sharedOn: '2026-11-16', daysSinceShared: 1 }).note).toBe(
      'شوركت أمس، 16 تشرين الثاني 2026.',
    );
    expect(whenShared('ar', { sharedOn: '2026-11-15', daysSinceShared: 2 }).note).toBe(
      'شوركت قبل يومين، في 15 تشرين الثاني 2026.',
    );
    expect(whenShared('ar', { sharedOn: '2026-11-14', daysSinceShared: 3 }).note).toBe(
      'شوركت قبل 3 أيام، في 14 تشرين الثاني 2026.',
    );
  });

  it('writes every number in Western digits, a year with no grouping', () => {
    for (const language of ['ckb', 'ar', 'en'] as const) {
      const { note, stamp } = whenShared(language, {
        sharedOn: '2023-01-02',
        daysSinceShared: 1415,
      });
      expect(note).not.toMatch(notWestern);
      expect(stamp).not.toMatch(notWestern);
      expect(note).toContain('2023');
      expect(note).toContain('1,415');
      expect(stamp).toContain('2023');
    }
  });
});
