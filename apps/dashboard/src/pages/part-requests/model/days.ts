import { formatNumber } from '@pcp/i18n';

// A day the API gives as a date, such as a request's `sentOn`, the day in
// Iraq's time, written as the dashboard writes a day, "9 October 2026": in
// English, with Western digits, and as the date it is, whatever the
// person's own time zone.
const theDate = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'long',
  timeZone: 'UTC',
  numberingSystem: 'latn',
});

export function dateWritten(date: string): string {
  return theDate.format(new Date(`${date}T00:00:00Z`));
}

// When a request was sent, by the calendar days the API counted since its
// day: "Today, on 18 November 2026" or "40 days ago, on 9 October 2026". No
// frontend counts days (the part-requests spec).
export function sentWritten({
  sentOn,
  daysSinceSent,
}: {
  sentOn: string;
  daysSinceSent: number;
}): string {
  const ago =
    daysSinceSent === 0
      ? 'Today'
      : `${formatNumber(daysSinceSent)} ${daysSinceSent === 1 ? 'day' : 'days'} ago`;
  return `${ago}, on ${dateWritten(sentOn)}`;
}
