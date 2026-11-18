// The day a moment falls on in Iraq's time, `2026-11-16`, and the calendar
// days between two moments' days there, as the API answers a Shared Build's
// `sharedOn` and `daysSinceShared`, and a Part Request's `sentOn` and
// `daysSinceSent`. The API's domain is the one that counts
// (`the-platforms-day.ts` in `domain`); the inspector cannot import an app,
// so it states the same rule for its made-up Shared Builds and Part
// Requests, and no test of the platform relies on it.
const dayInIraq = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Baghdad',
  numberingSystem: 'latn',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const aDay = 24 * 60 * 60 * 1000;

export function theDayOf(moment: Date): string {
  return dayInIraq.format(moment);
}

export function calendarDaysBetween(from: Date, to: Date): number {
  return Math.round((Date.parse(theDayOf(to)) - Date.parse(theDayOf(from))) / aDay);
}
