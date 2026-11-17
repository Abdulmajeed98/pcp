import { describe, expect, it } from 'vitest';

import { whenShared } from '@/_pages/shared-build';

// The digits a Shopper page never shows: the Arabic-Indic and the Eastern
// Arabic-Indic sets (LANG-5).
const notWestern = /[٠-٩۰-۹]/;

const now = new Date('2026-11-17T10:00:00Z');

// When a Build was shared (DESIGN.md's The Shared Build page, Its sheet):
// the note under the status, how many days ago and on which day, and the
// stamp under the sheet's title, the day alone, short. The days are whole
// days of 24 hours since it was shared, rounded down, as an Offer says how
// many days ago it was confirmed; the day is written in Iraq's time, where
// everyone using the platform is (the owner's answer of 17 November 2026).
// Every number is in Western digits.
describe('when a Build was shared', () => {
  it('says how many whole days ago and the day, in English', () => {
    expect(whenShared('en', '2026-11-05T09:00:00Z', now)).toEqual({
      note: 'Shared 12 days ago, on 5 November 2026.',
      stamp: 'Shared 5 Nov 2026',
    });
    expect(whenShared('en', '2026-11-16T09:00:00Z', now)).toEqual({
      note: 'Shared 1 day ago, on 16 November 2026.',
      stamp: 'Shared 16 Nov 2026',
    });
    expect(whenShared('en', '2025-10-13T09:00:00Z', now)).toEqual({
      note: 'Shared 400 days ago, on 13 October 2025.',
      stamp: 'Shared 13 Oct 2025',
    });
  });

  it('counts whole days of 24 hours, rounded down', () => {
    expect(whenShared('en', '2026-11-16T10:00:01Z', now).note).toBe(
      'Shared today, 16 November 2026.',
    );
    expect(whenShared('en', '2026-11-16T10:00:00Z', now).note).toBe(
      'Shared 1 day ago, on 16 November 2026.',
    );
    expect(whenShared('en', '2026-11-14T10:30:00Z', now).note).toBe(
      'Shared 2 days ago, on 14 November 2026.',
    );
  });

  it('says today, with the day, for a Build shared less than a day ago', () => {
    expect(whenShared('en', '2026-11-17T07:00:00Z', now).note).toBe(
      'Shared today, 17 November 2026.',
    );
  });

  it("writes the day in Iraq's time: a Build shared at 22:30 in UTC shows the next day", () => {
    const lateInTheDay = new Date('2026-11-05T10:00:00Z');
    expect(whenShared('en', '2026-11-04T22:30:00Z', lateInTheDay)).toEqual({
      note: 'Shared today, 5 November 2026.',
      stamp: 'Shared 5 Nov 2026',
    });
    expect(whenShared('en', '2026-11-04T20:59:59Z', lateInTheDay).stamp).toBe(
      'Shared 4 Nov 2026',
    );
    expect(whenShared('en', '2026-12-31T22:30:00Z', now).stamp).toBe('Shared 1 Jan 2027');
  });

  it('says it in Kurdish, the day after its month as Kurdish writes it', () => {
    expect(whenShared('ckb', '2026-11-05T09:00:00Z', now)).toEqual({
      note: '12 ڕۆژ لەمەوبەر هاوبەش کراوە، لە 5ی تشرینی دووەمی 2026.',
      stamp: 'هاوبەشکرا 2026/11/5',
    });
    expect(whenShared('ckb', '2026-11-17T07:00:00Z', now).note).toBe(
      'ئەمڕۆ هاوبەش کراوە، 17ی تشرینی دووەمی 2026.',
    );
  });

  it("says it in Arabic, in the count's own plural", () => {
    expect(whenShared('ar', '2026-11-05T09:00:00Z', now)).toEqual({
      note: 'شوركت قبل 12 يومًا، في 5 تشرين الثاني 2026.',
      stamp: 'شوركت 2026/11/5',
    });
    expect(whenShared('ar', '2026-11-14T09:00:00Z', now).note).toBe(
      'شوركت قبل 3 أيام، في 14 تشرين الثاني 2026.',
    );
    expect(whenShared('ar', '2026-11-15T09:00:00Z', now).note).toBe(
      'شوركت قبل يومين، في 15 تشرين الثاني 2026.',
    );
  });

  it('writes every number in Western digits, a year with no grouping', () => {
    for (const language of ['ckb', 'ar', 'en'] as const) {
      const { note, stamp } = whenShared(language, '2023-01-02T09:00:00Z', now);
      expect(note).not.toMatch(notWestern);
      expect(stamp).not.toMatch(notWestern);
      expect(note).toContain('2023');
      expect(note).toContain('1,415');
      expect(stamp).toContain('2023');
    }
  });
});
