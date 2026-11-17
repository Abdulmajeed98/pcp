import type { SharedBuildResponse } from '@pcp/api-client';
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

// When a Build was shared, as the Shared Build page says it (DESIGN.md's
// The Shared Build page, Its sheet), in the page's language: the note under
// its status, "Shared yesterday, 16 November 2026.", "Shared today, …" on
// the day it was shared and "Shared 12 days ago, on 5 November 2026." after,
// and the stamp under the sheet's title, the day alone, short, "Shared 5 Nov
// 2026". The day and the days are the API's (`sharedOn`, `daysSinceShared`):
// the day it was shared in Iraq's time and the calendar days there since,
// so that the count always agrees with the date (the owner's answer of 17
// November 2026 to sharing's code review); the Shopper app writes them and
// counts nothing. Every number is written in Western digits, a count by
// `formatNumber`, and a day and a year as they are, with no grouping
// (LANG-5).
export function whenShared(
  language: Language,
  { sharedOn, daysSinceShared }: Pick<SharedBuildResponse, 'sharedOn' | 'daysSinceShared'>,
): { note: string; stamp: string } {
  const t = createTranslator({
    locale: language,
    messages: shopperMessages[language],
    namespace: 'SharedBuildPage',
  });
  const [year, month, day] = sharedOn.split('-').map(Number);
  const written = {
    day: String(day),
    month: months[(month ?? 1) - 1] ?? 'january',
    year: String(year),
  };
  const date = t('longDate', written);

  return {
    note:
      daysSinceShared === 0
        ? t('when.today', { date })
        : daysSinceShared === 1
          ? t('when.yesterday', { date })
          : t('when.daysAgo', {
              days: daysSinceShared,
              daysText: formatNumber(daysSinceShared),
              date,
            }),
    stamp: t('stamp', { date: t('shortDate', written) }),
  };
}
