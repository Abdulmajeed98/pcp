import type { Language } from '@pcp/i18n';

// The address of the page the Shopper is on, in another language: `path` is
// the page's address as the browser shows it, its language first, and
// `query` its query, as the page wrote it. The language is the first part of
// every address, and only it is changed. The query is kept as it is, so that
// a search, the filters, a price range and the page survive a switch of
// language (story 29).
export function addressInLanguage(language: Language, path: string, query: string): string {
  const page = path.replace(/^\/[^/]+/, '');
  return `/${language}${page}${query === '' ? '' : `?${query}`}`;
}
