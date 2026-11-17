import { formatNumber, type Language, shopperMessages } from '@pcp/i18n';
import { createTranslator } from 'next-intl';

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
// on the day it was shared), as an Offer says how many days ago it was
// confirmed; and the stamp under the sheet's title, the day alone, short,
// "Shared 5 Nov 2026". The moment is the API's (`sharedAt`), and the days
// are counted between calendar days in Coordinated Universal Time, the
// same for every reader and on every server, so that "today" is the day the
// note names. Every number is written in Western digits, a count by
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
  const day = {
    day: String(shared.getUTCDate()),
    month: months[shared.getUTCMonth()] ?? 'january',
    year: String(shared.getUTCFullYear()),
  };
  const calendarDay = (moment: Date) =>
    Date.UTC(moment.getUTCFullYear(), moment.getUTCMonth(), moment.getUTCDate());
  const days = Math.max(0, Math.round((calendarDay(now) - calendarDay(shared)) / aDay));

  return {
    note: t('when', { days, daysText: formatNumber(days), date: t('longDate', day) }),
    stamp: t('stamp', { date: t('shortDate', day) }),
  };
}
