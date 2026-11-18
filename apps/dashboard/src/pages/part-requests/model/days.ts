import { formatNumber } from '@pcp/i18n';

import { dateWritten } from '@/shared/lib';

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
