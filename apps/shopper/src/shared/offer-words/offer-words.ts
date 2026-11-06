import { formatNumber, type Language, shopperMessages } from '@pcp/i18n';
import { createTranslator } from 'next-intl';

// The words of an Offer's line in one language, from the Shopper app's own
// set (`Offer`), as next-intl writes them on the server. They are written
// here once, so that an Offer on a Part page, an Offer on a Vendor page and
// the price slip's foot all word a number of days the same way, and so that
// the words can be tested apart from any page.
const offerWords = new Map<Language, ReturnType<typeof translatorIn>>();

function translatorIn(language: Language) {
  return createTranslator({
    locale: language,
    messages: shopperMessages[language],
    namespace: 'Offer',
  });
}

function wordsIn(language: Language) {
  const known = offerWords.get(language);
  if (known !== undefined) return known;
  const made = translatorIn(language);
  offerWords.set(language, made);
  return made;
}

// How many days ago the Vendor last confirmed an Offer (OFF-7), as the API
// answers it, in whole days rounded down: "Confirmed today", "Confirmed 1
// day ago", "Confirmed 3 days ago", in the language's own plural, the count
// written in Western digits by `formatNumber` (LANG-5).
export function confirmationIn(language: Language, days: number): string {
  return wordsIn(language)('confirmed', { days, daysText: formatNumber(days) });
}

// An Offer's warranty, in whole months as the Vendor states it, from 1 to
// 120 (OFF-2): "12 months warranty", in the language's own plural, the
// count in Western digits. An Offer whose Vendor states none has no words
// for it, and its line leaves it out.
export function warrantyIn(language: Language, months: number | null): string | undefined {
  if (months === null) return undefined;
  return wordsIn(language)('warranty', { months, monthsText: formatNumber(months) });
}
