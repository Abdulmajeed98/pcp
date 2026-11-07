import type { Language } from '@pcp/i18n';

// The address a switch of the frame returns the Shopper to, once the server
// has written their choice down: the page they were on, in `language`, which
// is the language of the switch's own address and so the page's.
//
// `page` is what the switch's form sends: the part of the page's address
// after the language, with its query. The query is kept as the page wrote it,
// each parameter in its place, a filter's repeated parameter among them,
// except those `keeps` turns down, each by its name as the page reads it. A
// query left with nothing in it is dropped.
//
// Anything else can be sent in place of the page. What starts with neither a
// slash nor a question mark, the first page's query, is not one of the
// Shopper app's pages, and the Shopper is returned to the first page instead.
// The address always starts with the language's own path, so it can never
// lead to another site.
export function returnAddress(
  language: Language,
  page: unknown,
  keeps: (name: string) => boolean = () => true,
): string {
  if (typeof page !== 'string' || !/^[/?]/.test(page)) return `/${language}`;

  const start = page.indexOf('?');
  if (start === -1) return `/${language}${page}`;

  const path = page.slice(0, start);
  const kept = page
    .slice(start + 1)
    .split('&')
    .filter((parameter) => parameter !== '' && keeps(nameOf(parameter)));

  return `/${language}${path}${kept.length === 0 ? '' : `?${kept.join('&')}`}`;
}

// A parameter's name, decoded as the page decodes it.
function nameOf(parameter: string): string {
  return [...new URLSearchParams(parameter).keys()][0] ?? '';
}
