// The time the Shopper app writes a day in: Iraq's, since everyone using the
// platform is in Iraq (the owner's answer of 17 November 2026, sharing
// ticket 04). It is named here once, for every day a Shopper page writes,
// so that a page drawn on any server writes the same day. Iraq keeps one
// time all year, three hours ahead of UTC.
export const platformsTimeZone = 'Asia/Baghdad';

const dayParts = new Intl.DateTimeFormat('en-US', {
  timeZone: platformsTimeZone,
  numberingSystem: 'latn',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

// The day a moment falls on in the platform's time: its day of the month,
// its month from 1 to 12 and its year, as numbers.
export function theDayOf(moment: Date): { day: number; month: number; year: number } {
  const part = (type: 'day' | 'month' | 'year') =>
    Number(dayParts.formatToParts(moment).find((each) => each.type === type)?.value);
  return { day: part('day'), month: part('month'), year: part('year') };
}
