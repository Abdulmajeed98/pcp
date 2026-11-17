import { describe, expect, it } from 'vitest';

import { whenShared } from '@/_pages/shared-build';

// The digits a Shopper page never shows: the Arabic-Indic and the Eastern
// Arabic-Indic sets (LANG-5).
const notWestern = /[٠-٩۰-۹]/;

const now = new Date('2026-11-17T10:00:00Z');

// When a Build was shared (DESIGN.md's The Shared Build page, Its sheet):
// the note under the status, how many days ago and on which day, as an
// Offer says how many days ago it was confirmed, and the stamp under the
// sheet's title, the day alone, short. Every number is in Western digits,
// the day counted in the calendar of the moment the API recorded.
describe('when a Build was shared', () => {
  it('says how many days ago and the day, in English', () => {
    expect(whenShared('en', '2026-11-05T09:00:00Z', now)).toEqual({
      note: 'Shared 12 days ago, on 5 November 2026.',
      stamp: 'Shared 5 Nov 2026',
    });
    expect(whenShared('en', '2026-11-16T23:30:00Z', now)).toEqual({
      note: 'Shared 1 day ago, on 16 November 2026.',
      stamp: 'Shared 16 Nov 2026',
    });
    expect(whenShared('en', '2025-10-13T12:00:00Z', now)).toEqual({
      note: 'Shared 400 days ago, on 13 October 2025.',
      stamp: 'Shared 13 Oct 2025',
    });
  });

  it('says today, with the day, for a Build shared on the same day', () => {
    expect(whenShared('en', '2026-11-17T07:00:00Z', now).note).toBe(
      'Shared today, 17 November 2026.',
    );
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
