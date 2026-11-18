// The time the platform writes a day in: Iraq's, since everyone using the
// platform is in Iraq (the owner's answer of 17 November 2026, sharing
// ticket 04). It is named here once, in the API's domain, so that the day a
// Shared Build was shared or a Part Request sent, and the calendar days
// since, are worked out in one place and every frontend writes the same day
// and the same count, counting nothing itself (the MVP spec's offers
// conventions; the owner's answer of 17 November 2026 to sharing's code
// review). Iraq keeps one time all year, three hours ahead of UTC.
export const platformsTimeZone = 'Asia/Baghdad';

const dayParts = new Intl.DateTimeFormat('en-US', {
  timeZone: platformsTimeZone,
  numberingSystem: 'latn',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const aDay = 24 * 60 * 60 * 1000;

// The calendar day a moment falls on in the platform's time, written as a
// date is in ISO 8601, `2026-11-16`.
export function theDayOf(moment: Date): string {
  const parts = dayParts.formatToParts(moment);
  const part = (type: 'year' | 'month' | 'day') =>
    parts.find((each) => each.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

// The calendar days in the platform's time from the day one moment falls on
// to the day a later one falls on: 0 on the same day and 1 on the next,
// whatever the hours between them, so that a count always agrees with the
// day written beside it. A moment after the later one counts 0, never below.
export function calendarDaysBetween(from: Date, to: Date): number {
  const days = (Date.parse(theDayOf(to)) - Date.parse(theDayOf(from))) / aDay;
  return Math.max(0, Math.round(days));
}
