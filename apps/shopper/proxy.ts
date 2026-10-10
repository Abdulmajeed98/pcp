import createProxy from 'next-intl/middleware';

import { routing } from '@/shared/i18n';

// Next runs this file before it answers a request. next-intl answers an
// address with no language with a redirect to the same address in a
// language, and sends with each page its address in the other languages.
export default createProxy(routing);

// Every address is seen here, except Next's own files and an address with a
// dot in it, which is a file.
export const config = {
  matcher: '/((?!_next|.*\\..*).*)',
};
