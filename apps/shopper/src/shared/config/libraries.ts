import { sockets } from '@pcp/compatibility';

// Placeholder: it proves that the Shopper app resolves the libraries it may
// import but does not use. Delete an entry when real code imports its
// library. `@pcp/compatibility` is proved through one of its sets, the
// sockets. The Shopper app has no use for the library, since the API judges
// every Build and every Part the picker lists (`builder`), and the entry
// stays, as the import rules still allow the library here.
export const libraries = [sockets];
