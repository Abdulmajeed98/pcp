import { shopperMessages } from '@pcp/i18n';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locale as languageOfTheAddress } from 'next/root-params';

import { routing } from './routing';

// next-intl's request set-up: the language and the text of the page that is
// being rendered. next-intl's plugin is given this file's path in
// `next.config.js`, and nothing imports it.
//
// The language is the first part of the address, which Next knows as the
// root parameter `locale`. An address that the proxy file does not see, such
// as one for a file, can put anything there, and it is answered "not found".
export default getRequestConfig(async ({ locale }) => {
  const language = locale ?? (await languageOfTheAddress());
  if (!hasLocale(routing.locales, language)) notFound();

  return { locale: language, messages: shopperMessages[language] };
});
