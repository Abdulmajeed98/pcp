import { sockets } from '@pcp/compatibility';

// Placeholder: it proves that the Shopper app resolves the libraries it does
// not use yet. Delete each entry when the first real code imports its library.
// `@pcp/compatibility` is proved through one of its sets, the sockets, until
// `builder` imports the library for real.
export const libraries = [sockets];
