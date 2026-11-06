import { type Language, languages } from '@pcp/i18n';
import type { Metadata } from 'next';

// How Open Graph names each language's locale: by its language and the
// country its text is written for. The platform's Kurdish is Sorani and its
// Arabic Iraq's.
const openGraphLocales: Record<Language, string> = {
  ckb: 'ckb_IQ',
  ar: 'ar_IQ',
  en: 'en_US',
};

// A page's preview (BRW-5): what a search engine lists and a chat app, such
// as WhatsApp, shows of the page, in its language. It is written from the
// page's words, already in that language, and from its path, the part of its
// address after the language: its title and description; its canonical
// address, on the Shopper app's public address, in its own language; its
// addresses in all three languages, and the address with no language, which
// picks one for the visitor; and Open Graph's title, description, type,
// locale and site name. Next writes the tags into the page's head.
//
// No description holds a price, which a chat app's copy would keep showing
// after it changed (story 60): the words a page gives are its own.
export function previewOf({
  language,
  path,
  title,
  description,
  siteName,
  publicAddress,
}: {
  language: Language;
  // Nothing for the home page, or a path that starts with a slash.
  path: string;
  title: string;
  description: string;
  siteName: string;
  publicAddress: string;
}): Metadata {
  const addressIn = (each: Language) => `${publicAddress}/${each}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: addressIn(language),
      languages: {
        ...Object.fromEntries(languages.map((each) => [each, addressIn(each)])),
        'x-default': `${publicAddress}${path === '' ? '/' : path}`,
      },
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: addressIn(language),
      siteName,
      locale: openGraphLocales[language],
      alternateLocale: languages
        .filter((each) => each !== language)
        .map((each) => openGraphLocales[each]),
    },
  };
}
