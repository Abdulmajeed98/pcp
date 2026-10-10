import { createNavigation } from 'next-intl/navigation';

import { routing } from '@/shared/i18n';

// next-intl's links between the Shopper app's pages, made from its statement
// of the languages.
//
// `Link` is a link to a page. It puts a language in front of the address: the
// language of the page it is on, or the one it is given as `locale`.
// `usePathname` is the address of the page that is shown, without its
// language. It is a hook, so only a component that also runs in the browser
// can ask it.
//
// They are a segment of their own and not part of `i18n`, because Next's
// proxy file imports that segment, and would carry these with it into every
// request.
export const { Link, usePathname } = createNavigation(routing);
