import { formatNumber, type Language, shopperMessages } from '@pcp/i18n';
import { createTranslator } from 'next-intl';

import { theDayOf } from '@/shared/lib';

// The months, by the keys the Shopper set words each by, in the calendar's
// order.
const months = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const;

const aDay = 24 * 60 * 60 * 1000;

// When a Build was shared, as the Shared Build page says it (DESIGN.md's
// The Shared Build page, Its sheet), in the page's language: the note under
// its status, "Shared 12 days ago, on 5 November 2026." ("Shared today, …"
// less than a day after), and the stamp under the sheet's title, the day
// alone, short, "Shared 5 Nov 2026". The moment is the API's (`sharedAt`).
// The days are whole days of 24 hours since that moment, rounded down, as an
// Offer says how many days ago it was confirmed, so they need no time zone;
// the day is written in the platform's time, Iraq's (`theDayOf`), so that a
// Build shared at 22:30 in UTC shows the next day (the owner's answer of 17
// November 2026). Every number is written in Western digits, a count by
// `formatNumber`, and a day and a year as they are, with no grouping
// (LANG-5).
export function whenShared(
  language: Language,
  sharedAt: string,
  now: Date,
): { note: string; stamp: string } {
  const t = createTranslator({
    locale: language,
    messages: shopperMessages[language],
    namespace: 'SharedBuildPage',
  });
  const shared = new Date(sharedAt);
  const { day, month, year } = theDayOf(shared);
  const written = {
    day: String(day),
    month: months[month - 1] ?? 'january',
    year: String(year),
  };
  const days = Math.max(0, Math.floor((now.getTime() - shared.getTime()) / aDay));

  return {
    note: t('when', { days, daysText: formatNumber(days), date: t('longDate', written) }),
    stamp: t('stamp', { date: t('shortDate', written) }),
  };
}
